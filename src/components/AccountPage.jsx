import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaSignOutAlt, FaUserCog, FaShieldAlt, FaChevronRight, FaTimes } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG'; // cite: 0
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';
import Loader from './Loader';

// Import the modular components
import TradeHistorySection from './account/TradeHistorySection';
import BillModal from './account/BillModal';
import ProfileSection from './account/ProfileSection';
import PoliciesAndTerms from './account/PoliciesAndTerms';

// A generic modal component to wrap content
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity duration-300">
    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-10">
      <header className="flex justify-between items-center p-4 border-b">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100">
          <FaTimes className="text-xl" />
        </button>
      </header>
      <main className="overflow-y-auto p-6">
        {children}
      </main>
    </div>
  </div>
);


const AccountPage = () => {
  const { location, setUserMobile, userMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [originalUserData, setOriginalUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [billToView, setBillToView] = useState(null);

  // State to control the visibility of the modals
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isPoliciesModalOpen, setPoliciesModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        get(userRef).then((snapshot) => {
          if (snapshot.exists()) {
            const data = { id: snapshot.key, ...snapshot.val() };
            setOriginalUserData(data);
          }
        }).finally(() => setUserLoading(false));
      } else {
        setUserLoading(false);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserMobile(null);
      localStorage.clear();
      toast.success('Logged out successfully!');
      navigate('/language', { replace: true });
    }).catch(() => toast.error('Logout failed.'));
  };

  const handleOpenBillModal = (billData) => {
    setBillToView(billData);
  };

  const handleCloseBillModal = () => {
    setBillToView(null);
  };

  // Callback to refresh user data after profile update
  const handleProfileUpdate = (updatedData) => {
    setOriginalUserData(prevData => ({ ...prevData, ...updatedData }));
    setProfileModalOpen(false);
  }

  return (
    <>
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          {/* Content from previous file */}
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          {userLoading ? <Loader fullscreen /> : (
            <>
              {/* --- Profile Header --- */}
              <div className="flex items-center space-x-4 mb-6">
                {/* Content from previous file */}
              </div>

              {/* --- Navigation Buttons --- */}
              <div className="bg-white p-2 sm:p-4 rounded-xl shadow-md space-y-2">
                {/* THIS IS THE KEY CHANGE: onClick now opens the modal */}
                <button onClick={() => setProfileModalOpen(true)} className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <FaUserCog className="text-xl text-blue-500" />
                    <span>My Profile</span>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
                <button onClick={() => setPoliciesModalOpen(true)} className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="text-xl text-green-500" />
                    <span>Policies & Terms</span>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
              </div>

              {/* Trade History */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mt-6">
                {/* Content from previous file */}
              </div>

              {/* Logout Button */}
              <div className="mt-6">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600"><FaSignOutAlt /> Logout</button>
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          {/* Content from previous file */}
        </footer>

        {billToView && <BillModal bill={billToView} onClose={handleCloseBillModal} />}

        {/* Profile Modal */}
        {isProfileModalOpen && originalUserData && (
          <Modal title="My Profile" onClose={() => setProfileModalOpen(false)}>
            {/* THIS IS THE KEY CHANGE: Pass user data as a prop */}
            <ProfileSection
              user={originalUserData}
              onUpdate={handleProfileUpdate}
            />
          </Modal>
        )}

        {/* Policies Modal */}
        {isPoliciesModalOpen && (
          <Modal title="Policies & Terms" onClose={() => setPoliciesModalOpen(false)}>
            <PoliciesAndTerms />
          </Modal>
        )}

      </div>
    </>
  );
};

export default AccountPage;