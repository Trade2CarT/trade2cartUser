import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { db } from '../firebase';
import { get, query, orderByChild, equalTo, ref, set } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import '../assets/style/LoginPage.css';

const Modal = ({ content, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
      <div className="prose">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      <button onClick={onClose} className="mt-4 w-full py-2 bg-gray-300 text-black rounded-lg">Close</button>
    </div>
  </div>
);

const LoginPage = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const { setUserMobile, location, language } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  // The useEffect for reCAPTCHA has been removed from here.

  const setupRecaptcha = () => {
    // We create the verifier instance here, right when we need it.
    // It is stored on the window object to be accessible.
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => console.log("reCAPTCHA verified"),
    });
  };

  const handleGetOtp = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit Indian number');
      return;
    }

    setLoading(true);
    // --- THIS IS THE FIX ---
    // Set up the reCAPTCHA verifier on demand.
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    const phoneNumber = `+91${phone}`;

    try {
      const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error('Failed to send OTP. Refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  const ensureUserExistsInFirebase = async (userId, userPhone) => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        phone: userPhone,
        location: location || 'Unknown',
        language: language || 'en',
        createdAt: new Date().toISOString(),
        Status: 'Active'
      });
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      const credential = await confirmationResult.confirm(otp);
      const user = credential.user;
      const userPhone = user.phoneNumber.slice(3);
      const userId = user.uid;

      await ensureUserExistsInFirebase(userId, userPhone);

      setUserMobile(userPhone);
      toast.success('Login Successful!');
      navigate('/hello', { replace: true });

    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error('The OTP is incorrect or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const termsContent = `<h2>Terms & Conditions</h2><p>Your full terms and conditions content goes here.</p>`;
  const privacyContent = `<h2>Privacy Policy</h2><p>Your full privacy policy content goes here.</p>`;

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  return (
    <div className="login-container">
      <div id="recaptcha-container"></div>

      {isModalOpen && <Modal content={modalContent} onClose={() => setIsModalOpen(false)} />}

      <h2>Login to Start</h2>

      <div className="input-wrapper">
        <span className="country-code">+91 -</span>
        <input type="tel" placeholder="Enter mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} disabled={otpSent} />
      </div>

      {!otpSent && (
        <div className="terms-container mt-4 space-y-2">
          <div className="flex items-center">
            <input type="checkbox" id="terms" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="h-4 w-4 rounded" />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-600">I agree to the <span onClick={() => openModal(termsContent)} className="text-blue-600 cursor-pointer underline">Terms & Conditions</span></label>
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="privacy" checked={privacyAccepted} onChange={() => setPrivacyAccepted(!privacyAccepted)} className="h-4 w-4 rounded" />
            <label htmlFor="privacy" className="ml-2 text-sm text-gray-600">I agree to the <span onClick={() => openModal(privacyContent)} className="text-blue-600 cursor-pointer underline">Privacy Policy</span></label>
          </div>
        </div>
      )}

      {!otpSent ? (
        <button onClick={handleGetOtp} className="get-otp-btn" disabled={loading || !termsAccepted || !privacyAccepted}>
          {loading ? 'Sending...' : 'GET OTP'}
        </button>
      ) : (
        <>
          <div className="input-wrapper otp-field">
            <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} />
          </div>
          <button className="verify-btn" onClick={handleVerify} disabled={loading}>
            {loading ? 'Verifying...' : 'Verify & Continue'}
          </button>
        </>
      )}
    </div>
  );
};

export default LoginPage;