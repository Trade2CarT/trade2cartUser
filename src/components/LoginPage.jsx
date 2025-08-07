import React, { useState, useEffect } from 'react';
import '../assets/style/LoginPage.css';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../firebase';
import { ref, get, query, orderByChild, equalTo, set, push } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';

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
  const [phoneError, setPhoneError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [resendStatus, setResendStatus] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState('');

  const { setUserMobile, location, language } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    let interval;
    if (otpSent && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const generateAndSendOtp = async () => {
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(otpCode);
    toast.success(`Your OTP is: ${otpCode}`);
    setOtpSent(true);
    setTimer(60);
    setResendStatus('');
  };

  const handleGetOtp = () => {
    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setPhoneError('Enter a valid 10-digit Indian number');
      return;
    }
    setPhoneError('');
    generateAndSendOtp();
  };

  const ensureUserExistsInFirebase = async () => {
    const usersRef = ref(db, 'users');
    const userQuery = query(usersRef, orderByChild('phone'), equalTo(phone));
    const snapshot = await get(userQuery);

    if (!snapshot.exists()) {
      const newUserRef = push(usersRef);
      await set(newUserRef, {
        phone: phone, location: location || 'Unknown', language: language || 'en',
        createdAt: new Date().toISOString(), Status: 'Active'
      });
    }
  };

  const handleVerify = async () => {
    if (timer === 0) {
      toast.error("OTP has expired!");
      return;
    }
    if (otp !== generatedOtp) {
      toast.error("The OTP entered is incorrect.");
      return;
    }
    setOtpError('');

    const promise = ensureUserExistsInFirebase();
    toast.promise(promise, {
      loading: 'Verifying user...',
      success: 'Login Successful!',
      error: 'Could not verify user on the server.',
    });

    try {
      await promise;
      setUserMobile(phone); // Set the global state
      navigate('/hello', { replace: true }); // **THIS IS THE CRUCIAL ADDITION**
    } catch (error) {
      // toast.promise handles the error message
    }
  };

  const handleResendOtp = () => {
    generateAndSendOtp();
    setOtp('');
    setOtpError('');
    setTimer(60);
    setResendStatus('OTP resent successfully!');
  };

  const termsContent = `<h2>Terms & Conditions...</h2>`; // Keep your HTML content here
  const privacyContent = `<h2>Privacy Policy...</h2>`; // Keep your HTML content here

  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };

  return (
    <div className="login-container">
      {isModalOpen && <Modal content={modalContent} onClose={() => setIsModalOpen(false)} />}
      <h2>Login to Start</h2>
      <div className={`input-wrapper ${phoneError ? 'error' : ''}`}>
        <span className="country-code">+91 -</span>
        <input type="tel" placeholder="Enter mobile number" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }} maxLength={10} />
      </div>
      {phoneError && <p className="error-text">{phoneError}</p>}
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
      <button onClick={handleGetOtp} className="get-otp-btn" disabled={!termsAccepted || !privacyAccepted}>GET OTP</button>
      {otpSent && (
        <>
          <div className={`input-wrapper otp-field ${otpError ? 'error' : ''}`}>
            <input type="text" placeholder="- - - -" value={otp} onChange={(e) => { setOtp(e.target.value); setOtpError(''); }} maxLength={4} />
          </div>
          {otpError && <p className="error-text">{otpError}</p>}
          <button className="verify-btn" onClick={handleVerify}>Verify & Continue</button>
          <p className="timer-text">OTP valid for: {timer}s</p>
          <button className="resend-btn" onClick={handleResendOtp} disabled={timer > 0}>{timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}</button>
          {resendStatus && <p className="success-text">{resendStatus}</p>}
        </>
      )}
    </div>
  );
};

export default LoginPage;