// src/components/LoginPage.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { db } from '../firebase';
import { get, ref, set } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';

// Reusable components for better structure
import SEO from './SEO';
import Loader from './Loader';
import Modal from './Modal'; // Assuming Modal is moved to its own file

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

  // ✅ BEST PRACTICE: Use useRef to hold the verifier instance, not the window object.
  const recaptchaVerifierRef = useRef(null);

  useEffect(() => {
    // Initialize reCAPTCHA only once
    if (!recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved.
          console.log("reCAPTCHA verified");
        }
      });
    }
  }, [auth]);

  const handleGetOtp = async () => {
    if (!termsAccepted || !privacyAccepted) {
      return toast.error("Please accept the Terms & Conditions and Privacy Policy.");
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return toast.error('Enter a valid 10-digit Indian mobile number.');
    }

    setLoading(true);
    try {
      const verifier = recaptchaVerifierRef.current;
      const phoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error("Error sending OTP:", error);
      // ✅ UX IMPROVEMENT: More specific error messages
      let errorMessage = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      toast.error(errorMessage);
      // In case of error, render a new verifier to reset the flow
      recaptchaVerifierRef.current.render().then(widgetId => {
        window.grecaptcha.reset(widgetId);
      });
    } finally {
      setLoading(false);
    }
  };

  const ensureUserExistsInFirebase = async (userId, userPhone) => {
    const userRef = ref(db, `users/${userId}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      await set(userRef, {
        // ✅ DATA INTEGRITY: Use a single, clear key for the phone number
        phoneNumber: userPhone,
        location: location || 'Unknown',
        language: language || 'en',
        createdAt: new Date().toISOString(),
        status: 'Active' // Use camelCase for consistency
      });
    }
  };

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      return toast.error('Please enter the 6-digit OTP.');
    }

    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const user = auth.currentUser;

      if (user) {
        await ensureUserExistsInFirebase(user.uid, user.phoneNumber);
        setUserMobile(user.phoneNumber);
        toast.success('Login Successful!');
        navigate('/hello', { replace: true });
      } else {
        throw new Error("User not found after OTP verification.");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      toast.error('The OTP is incorrect or has expired. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ UX IMPROVEMENT: Allow user to change the number
  const handleChangeNumber = () => {
    setOtpSent(false);
    setOtp('');
    setPhone('');
    setConfirmationResult(null);
  }

  const termsContent = `
<h2>Terms & Conditions</h2>
<p><strong>Effective Date:</strong> [Add Date]<br><strong>Contact:</strong> [Add official email]</p>

<h3>1. Introduction</h3>
<p>Trade2Cart provides an online platform that connects users with independent scrap vendors for doorstep scrap pickup. By using Trade2Cart, you agree to these Terms and Conditions.</p>

<h3>2. Nature of Service</h3>
<p>Trade2Cart acts only as a <strong>mediator</strong> between users and vendors. Trade2Cart does not collect scrap directly, does not pay users, and is not responsible for vendor behaviour or pricing. All payments occur directly between the vendor and the user.</p>

<h3>3. User Responsibilities</h3>
<ul>
  <li>Provide accurate location and contact details.</li>
  <li>Ensure the scrap is ready for pickup.</li>
  <li>Verify vendor identity before handing over scrap.</li>
  <li>Decide whether to accept the vendor’s pricing.</li>
</ul>

<h3>4. Vendor Responsibilities</h3>
<ul>
  <li>Offer fair pricing.</li>
  <li>Behave respectfully.</li>
  <li>Arrive at the scheduled time.</li>
  <li>Settle payments directly with users.</li>
</ul>

<h3>5. Platform Fees</h3>
<p>Trade2Cart may charge booking fees to users. Vendors may be charged service/commission fees after an initial free period of 3–6 months.</p>

<h3>6. Cancellations</h3>
<p>Both users and vendors may cancel a booking. Trade2Cart is not responsible for any inconvenience caused by cancellations.</p>

<h3>7. Disputes</h3>
<p>Disputes regarding scrap weight, pricing, or payment must be resolved directly between the user and vendor.</p>

<h3>8. Limitation of Liability</h3>
<p>Trade2Cart is not liable for vendor misconduct, payment issues, delays, cancellations, or any damages caused by vendors.</p>

<h3>9. Data Usage</h3>
<p>Your data is handled according to our Privacy Policy.</p>

<h3>10. Modifications</h3>
<p>Trade2Cart may update these Terms without notice. Continued use means acceptance of updated Terms.</p>
`;

  const privacyContent = `
<h2>Privacy Policy</h2>
<p><strong>Effective Date:</strong> [Add Date]<br><strong>Contact:</strong> [Add official email]</p>

<h3>1. Introduction</h3>
<p>This Privacy Policy explains how Trade2Cart collects, uses, and protects your personal data.</p>

<h3>2. Information We Collect</h3>
<ul>
  <li>Name</li>
  <li>Phone number</li>
  <li>Location / City</li>
  <li>Pickup address</li>
  <li>Device information</li>
  <li>Usage analytics</li>
</ul>
<p>We <strong>do not</strong> collect payment card details, bank details, or sensitive personal data.</p>

<h3>3. How We Use Your Information</h3>
<ul>
  <li>Booking confirmation</li>
  <li>Assigning vendors</li>
  <li>Sending notifications</li>
  <li>Improving app performance</li>
</ul>
<p>We do <strong>not sell</strong> your data to any third party.</p>

<h3>4. Sharing of Information</h3>
<p>We share only the required user information with vendors to complete the pickup (name, location, phone number). Vendors are independent third parties.</p>

<h3>5. Data Security</h3>
<p>We use security measures to protect your data, but no system is 100% secure. You share data at your own risk.</p>

<h3>6. Cookies & Tracking</h3>
<p>We may use analytics tools to improve the platform experience.</p>

<h3>7. User Rights</h3>
<ul>
  <li>Request data correction</li>
  <li>Request data deletion</li>
  <li>Stop receiving notifications</li>
</ul>

<h3>8. Children’s Privacy</h3>
<p>Trade2Cart is not intended for users under 13 years of age.</p>

<h3>9. Updates</h3>
<p>We may update this Privacy Policy from time to time. Continued use means acceptance of changes.</p>
`;


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
        {/* Pass the improved props to your Modal component */}
        {isModalOpen && <Modal content={modalContent} onClose={() => setIsModalOpen(false)} />}

        <div className="w-full max-w-md">
          {loading ? <Loader /> : (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg transition-all duration-300">
              <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-6">
                {otpSent ? 'Enter OTP' : 'Login to Start'}
              </h1>

              {!otpSent ? (
                <>
                  <div className="relative mb-4">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">+91</span>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // Only allow digits
                      maxLength={10}
                      className="w-full pl-12 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-3 my-4">
                    <CheckboxLink label="Terms & Conditions" content={termsContent} checked={termsAccepted} onChange={setTermsAccepted} onLinkClick={openModal} />
                    <CheckboxLink label="Privacy Policy" content={privacyContent} checked={privacyAccepted} onChange={setPrivacyAccepted} onLinkClick={openModal} />
                  </div>
                  <button onClick={handleGetOtp} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled={!termsAccepted || !privacyAccepted || phone.length !== 10}>
                    GET OTP
                  </button>
                </>
              ) : (
                <>
                  <p className="text-center text-gray-600 mb-4 text-sm">
                    An OTP has been sent to +91 {phone}.
                    {/* ✅ UX FEATURE: Change number button */}
                    <button onClick={handleChangeNumber} className="text-blue-600 hover:underline font-semibold ml-2">
                      Change Number?
                    </button>
                  </p>
                  <input
                    type="text"
                    inputMode="numeric" // Better for mobile keyboards
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} // Only allow digits
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
        </div>
      </main>
    </>
  );
};

// ✅ CODE STRUCTURE: Abstract the checkbox logic into its own small component for cleanliness
const CheckboxLink = ({ label, content, checked, onChange, onLinkClick }) => (
  <label className="flex items-center space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={() => onChange(!checked)}
      className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    />
    <span className="text-sm text-gray-600">
      I agree to the
      <button
        onClick={(e) => { e.preventDefault(); onLinkClick(content); }}
        className="text-blue-600 hover:underline font-medium ml-1"
      >
        {label}
      </button>
    </span>
  </label>
);

export default LoginPage;