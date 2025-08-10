import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaBell, FaShoppingCart, FaSignOutAlt } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, update } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';

// Import the new components
import ProfileSection from './account/ProfileSection';
import PolicySection from './account/PolicySection';
import TradeHistorySection from './account/TradeHistorySection';

const AccountPage = () => {
  const { location, setLocation, setUserMobile, userMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [expandedSection, setExpandedSection] = useState('profile');
  const [originalUserData, setOriginalUserData] = useState(null);
  const [editableUserData, setEditableUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userRef = ref(db, `users/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = { id: snapshot.key, ...snapshot.val() };
            setOriginalUserData(data);
            setEditableUserData(data);
          }
        }).finally(() => setUserLoading(false));
      } else {
        setUserLoading(false);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleProfileUpdate = async () => {
    if (!currentUserId || !editableUserData) return;
    const updatePayload = {
      name: editableUserData.name || '',
      address: editableUserData.address || '',
      location: editableUserData.location || '',
      language: editableUserData.language || '',
    };
    const promise = update(ref(db, `users/${currentUserId}`), updatePayload);
    toast.promise(promise, {
      loading: 'Updating profile...',
      success: 'Profile updated successfully!',
      error: 'Failed to update profile.'
    });
    try {
      await promise;
      setLocation(editableUserData.location);
      setOriginalUserData(editableUserData);
      setIsEditing(false);
    } catch (error) { /* Handled by toast */ }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserMobile(null);
      localStorage.clear();
      toast.success('Logged out successfully!');
      navigate('/language', { replace: true });
    }).catch(() => toast.error('Logout failed.'));
  };

  const Section = ({ title, sectionKey, children }) => (
    <div className="border-b">
      <button onClick={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)} className="flex justify-between items-center w-full py-4 font-medium text-left text-gray-800">
        <span>{title}</span>
        {expandedSection === sectionKey ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {expandedSection === sectionKey && <div className="pb-4 text-sm text-gray-600">{children}</div>}
    </div>
  );

  const termsContent = `...`; // Your full T&C HTML
  const privacyContent = `...`; // Your full Privacy Policy HTML

  return (
    <>
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />
      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          <div className="flex items-center gap-3"><img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" /><div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"><FaMapMarkerAlt className="text-green-500" /><span className="text-sm font-medium">{location}</span></div></div>
          <div className="flex items-center gap-4 text-xl"><FaBell className="cursor-pointer text-gray-600" /><FaShoppingCart className="cursor-pointer text-gray-600" /></div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">My Account</h1>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md space-y-2">
            <Section title="My Profile" sectionKey="profile">
              <ProfileSection
                userData={editableUserData}
                isEditing={isEditing}
                onInputChange={(e) => setEditableUserData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
                onEditClick={() => setIsEditing(true)}
                onSaveClick={handleProfileUpdate}
                onCancelClick={() => { setIsEditing(false); setEditableUserData(originalUserData); }}
              />
            </Section>

            <Section title="Privacy Policy" sectionKey="privacy">
              <PolicySection content={privacyContent} />
            </Section>

            <Section title="Terms & Conditions" sectionKey="terms">
              <PolicySection content={termsContent} />
            </Section>

            <Section title="Trade History" sectionKey="history">
              <TradeHistorySection userMobile={userMobile} originalUserData={originalUserData} />
            </Section>
          </div>

          <div className="mt-6">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600"><FaSignOutAlt /> Logout</button>
          </div>
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-green-600 p-2 no-underline"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>
      </div>
    </>
  );
};

export default AccountPage;