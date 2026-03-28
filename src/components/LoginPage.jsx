import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { db } from '../firebase';
import { get, ref, set } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';

import SEO from './SEO';
import Modal from './Modal';
import logo from '../assets/images/logo.PNG';

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
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  }, [auth]);

  const handleGetOtp = async () => {
    if (!termsAccepted || !privacyAccepted) return toast.error("Please accept the Terms & Privacy Policy.");
    if (!/^[6-9]\d{9}$/.test(phone)) return toast.error('Enter a valid 10-digit mobile number.');
    if (navigator.vibrate) navigator.vibrate(50);

    setLoading(true);
    try {
      const verifier = recaptchaVerifierRef.current;
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success('OTP Sent!');
    } catch (error) {
      let errorMessage = 'Failed to send OTP.';
      if (error.code === 'auth/too-many-requests') errorMessage = 'Too many requests. Try again later.';
      toast.error(errorMessage);
      recaptchaVerifierRef.current.render().then(widgetId => window.grecaptcha.reset(widgetId));
    } finally {
      setLoading(false);
    }
  };

  const ensureUserExistsInFirebase = async (userId, userPhone) => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        phoneNumber: userPhone,
        location: location || 'Unknown',
        language: language || 'en',
        createdAt: new Date().toISOString(),
        status: 'Active'
      });
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) return toast.error('Enter the 6-digit OTP.');
    if (navigator.vibrate) navigator.vibrate(50);

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const user = auth.currentUser;
      if (user) {
        await ensureUserExistsInFirebase(user.uid, user.phoneNumber);
        setUserMobile(user.phoneNumber);
        toast.success('Login Successful!');
        navigate('/hello', { replace: true });
      }
    } catch (error) {
      toast.error('Incorrect OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeNumber = () => {
    setOtpSent(false); setOtp(''); setPhone(''); setConfirmationResult(null);
  };

  const openModal = (content) => { setModalContent(content); setIsModalOpen(true); };

  return (
    <>
      <SEO title="Login to Trade2Cart" description="Login to schedule scrap pickups." />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div id="recaptcha-container"></div>
        {isModalOpen && <Modal content={modalContent} onClose={() => setIsModalOpen(false)} />}

        <div className="w-full max-w-md">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 font-bold uppercase tracking-widest text-sm animate-pulse">Processing...</p>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[32px] shadow-2xl border border-gray-100 transition-all duration-300 transform scale-100">

              <div className="flex flex-col items-center mb-8">
                <img src={logo} alt="Trade2Cart Logo" className="w-16 h-16 rounded-full mb-4 shadow-sm" />
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {otpSent ? 'Enter OTP Code' : 'Welcome Back'}
                </h1>
                <p className="text-gray-500 text-sm font-medium text-center mt-1">
                  {otpSent ? `Sent securely to +91 ${phone}` : 'Enter your mobile number to continue'}
                </p>
              </div>

              {!otpSent ? (
                <>
                  <div className="relative mb-6">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500 font-bold bg-gray-100 rounded-l-xl border-r border-gray-200 px-3">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      maxLength={10}
                      className="w-full pl-20 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none font-bold text-lg text-gray-800 transition-all"
                    />
                  </div>

                  {/* ✅ FIX: Separate Checkbox Area & Link Area */}
                  <div className="space-y-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100">
                    <CheckboxLink
                      label="Terms & Conditions"
                      checked={termsAccepted}
                      onChange={setTermsAccepted}
                      onLinkClick={() => openModal('<h2>Terms</h2><p>Standard Trade2Cart Terms...</p>')}
                    />
                    <CheckboxLink
                      label="Privacy Policy"
                      checked={privacyAccepted}
                      onChange={setPrivacyAccepted}
                      onLinkClick={() => openModal('<h2>Privacy Policy</h2><p>Standard Trade2Cart Privacy...</p>')}
                    />
                  </div>

                  <button
                    onClick={handleGetOtp}
                    disabled={!termsAccepted || !privacyAccepted || phone.length !== 10}
                    className="w-full py-4 bg-gray-900 text-white font-bold text-lg rounded-xl hover:bg-gray-800 transition-all active:scale-95 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-xl"
                  >
                    GET OTP
                  </button>
                </>
              ) : (
                <>
                  <div className="relative mb-8 mt-4">
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      className="w-full py-4 text-center tracking-[1em] border-2 border-green-400 bg-green-50 rounded-2xl focus:ring-4 focus:ring-green-500/30 text-3xl font-black text-green-900 outline-none transition-all shadow-inner"
                    />
                  </div>

                  <button
                    onClick={handleVerify}
                    className="w-full py-4 bg-green-600 text-white font-bold text-lg rounded-xl shadow-xl hover:bg-green-700 transition-colors active:scale-95 mb-4"
                  >
                    Verify & Continue
                  </button>

                  <div className="text-center mt-6">
                    <button onClick={handleChangeNumber} className="text-gray-400 hover:text-gray-800 font-bold text-sm transition-colors uppercase tracking-wider">
                      ← Change Number
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
};

// ✅ FIX: Rebuilt Checkbox to prevent overlap clicking
const CheckboxLink = ({ label, checked, onChange, onLinkClick }) => (
  <div className="flex items-center space-x-3">

    {/* 1. Clickable Box Area */}
    <div
      onClick={() => onChange(!checked)}
      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0 ${checked ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white hover:border-green-400'}`}
    >
      {checked && <span className="text-white font-bold text-xs">✓</span>}
    </div>

    {/* 2. Text & Link Area */}
    <span className="text-sm font-medium text-gray-600 flex-1">
      <span onClick={() => onChange(!checked)} className="cursor-pointer">I agree to the </span>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLinkClick();
        }}
        className="text-blue-600 font-bold hover:underline ml-1"
      >
        {label}
      </button>
    </span>
  </div>
);

export default LoginPage;