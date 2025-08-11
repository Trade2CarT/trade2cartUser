import React from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { db } from '../firebase';
import { get, ref, set } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import Loader from './Loader';
// import Loader from './Loader'; // Import Loader

const Modal = ({ content, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity">
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg mx-auto max-h-[90vh] overflow-y-auto">
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      <button onClick={onClose} className="mt-6 w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 font-semibold transition-colors">Close</button>
    </div>
  </div>
);

const LoginPage = () => {
  const [phone, setPhone] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [confirmationResult, setConfirmationResult] = React.useState(null);
  const [otpSent, setOtpSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalContent, setModalContent] = React.useState('');

  const { setUserMobile, location, language } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  React.useEffect(() => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
      });
    }
  }, [auth]);

  const handleGetOtp = async () => {
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const verifier = window.recaptchaVerifier;
      const phoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error("Error sending OTP:", error);
      toast.error('Failed to send OTP. Please refresh and try again.');
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
      const userPhone = user.phoneNumber.slice(3); // Remove +91
      await ensureUserExistsInFirebase(user.uid, userPhone);
      setUserMobile(userPhone);
      toast.success('Login Successful!');
      navigate('/hello', { replace: true });
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error('The OTP is incorrect or has expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const termsContent = `<h2>Terms & Conditions</h2><p>Your full terms and conditions content goes here.</p>`; // Replace with your actual content
  const privacyContent = `<h2>Privacy Policy</h2><p>Your full privacy policy content goes here.</p>`; // Replace with your actual content

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  return (
    <>
      <SEO
        title="Login to Trade2Cart"
        description="Login to your Trade2Cart account to schedule scrap pickups, view history, and manage your profile."
      />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div id="recaptcha-container"></div>
        {isModalOpen && <Modal content={modalContent} onClose={() => setIsModalOpen(false)} />}

        {loading ? <Loader /> : (
          <div className="w-full max-w-md bg-white p-6 md:p-8 rounded-2xl shadow-lg">
            <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">Login to Start</h1>

            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+91</span>
              <input
                type="tel"
                placeholder="Enter mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
                disabled={otpSent}
                className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-gray-100"
              />
            </div>

            {!otpSent ? (
              <>
                <div className="space-y-3 my-4">
                  <label htmlFor="terms" className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="terms" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600">I agree to the <button onClick={() => openModal(termsContent)} className="text-blue-600 hover:underline font-medium">Terms & Conditions</button></span>
                  </label>
                  <label htmlFor="privacy" className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" id="privacy" checked={privacyAccepted} onChange={() => setPrivacyAccepted(!privacyAccepted)} className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-600">I agree to the <button onClick={() => openModal(privacyContent)} className="text-blue-600 hover:underline font-medium">Privacy Policy</button></span>
                  </label>
                </div>
                <button onClick={handleGetOtp} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400" disabled={!termsAccepted || !privacyAccepted}>
                  GET OTP
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  className="w-full p-3 mb-4 text-center tracking-[0.5em] border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <button onClick={handleVerify} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                  Verify & Continue
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </>
  );
};

export default LoginPage;