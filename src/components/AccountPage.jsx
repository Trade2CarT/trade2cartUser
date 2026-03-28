import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaSignOutAlt, FaUserCog, FaShieldAlt, FaChevronRight, FaTimes, FaHistory } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';

import TradeHistorySection from './account/TradeHistorySection';
import BillModal from './account/BillModal';
import ProfileSection from './account/ProfileSection';
import PoliciesAndTerms from './account/PoliciesAndTerms';

const AccountSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-center gap-4 bg-white p-6 rounded-[32px] border border-gray-100">
      <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
      <div className="space-y-2 flex-1">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
    <div className="h-32 bg-gray-200 rounded-[32px] w-full"></div>
    <div className="h-64 bg-gray-200 rounded-[32px] w-full"></div>
  </div>
);

// ✅ FIX: Z-Index increased to 100, Added Click-Outside to close, improved layout
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center transition-all duration-300">
    {/* Dark Overlay Background - Click to close */}
    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>

    {/* Modal Content Box */}
    <div className="bg-white rounded-t-3xl sm:rounded-[32px] shadow-2xl w-full max-w-lg h-[85vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-fade-in relative z-10">
      <header className="flex justify-between items-center p-6 border-b border-gray-100 bg-white rounded-t-3xl sm:rounded-t-[32px]">
        <h3 className="text-xl font-extrabold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 bg-gray-50 p-2 rounded-full hover:bg-gray-200 transition">
          <FaTimes />
        </button>
      </header>
      <main className="overflow-y-auto p-6 flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  </div>
);

const AccountPage = () => {
  const { location, setUserMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [billToView, setBillToView] = useState(null);
  const [isProfileModalOpen, setProfileModalOpen] = useState(false);
  const [isPoliciesModalOpen, setPoliciesModalOpen] = useState(false);

  useEffect(() => {
    let unsubscribeFromAuth;
    let unsubscribeFromUser;

    unsubscribeFromAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        unsubscribeFromUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserData({ id: snapshot.key, ...snapshot.val() });
          }
          setUserLoading(false);
        });
      } else {
        setUserLoading(false);
        navigate('/login');
      }
    });

    return () => {
      unsubscribeFromAuth();
      if (unsubscribeFromUser) unsubscribeFromUser();
    };
  }, [auth, navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserMobile(null);
      localStorage.clear();
      toast.success('Logged out successfully!');
      navigate('/language', { replace: true });
    });
  };

  return (
    <>
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />
      <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden">

        <header className="flex-none sticky top-0 p-4 bg-white shadow-sm z-30 flex justify-between items-center rounded-b-3xl">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-10 w-10 rounded-full" />
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
              <FaMapMarkerAlt className="text-blue-500" />
              <span className="text-sm font-bold text-gray-600">{location || '...'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-5 pb-24">
          {userLoading ? <AccountSkeleton /> : (
            <div className="max-w-2xl mx-auto space-y-6 mt-2">

              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100 flex items-center space-x-5 relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] z-0"></div>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner z-10 text-2xl font-black">
                  {userData?.name ? userData.name.charAt(0).toUpperCase() : <FaUserAlt />}
                </div>
                <div className="z-10">
                  <h1 className="text-2xl font-extrabold text-gray-900">{userData?.name || 'My Account'}</h1>
                  <p className="text-sm text-gray-500 font-medium">{userData?.phoneNumber || auth.currentUser?.phoneNumber || 'No phone linked'}</p>
                </div>
              </div>

              <div className="bg-white rounded-[32px] shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
                <button onClick={() => setProfileModalOpen(true)} className="flex justify-between items-center w-full p-5 text-left hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors"><FaUserCog /></div>
                    <span className="font-extrabold text-gray-800">Account Details</span>
                  </div>
                  <FaChevronRight className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                </button>

                <button onClick={() => setPoliciesModalOpen(true)} className="flex justify-between items-center w-full p-5 text-left hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center group-hover:bg-green-500 group-hover:text-white transition-colors"><FaShieldAlt /></div>
                    <span className="font-extrabold text-gray-800">Policies & Terms</span>
                  </div>
                  <FaChevronRight className="text-gray-300 group-hover:text-green-500 transition-colors" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center"><FaHistory size={12} /></div>
                  <h2 className="text-xl font-extrabold text-gray-900">Trade History</h2>
                </div>
                <div className="bg-gray-50 rounded-2xl p-2 border border-gray-100">
                  <TradeHistorySection userId={userData?.id} originalUserData={userData} onViewBill={setBillToView} />
                </div>
              </div>

              <div className="pt-4 pb-8">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-bold border border-red-100 hover:bg-red-500 hover:text-white transition-colors shadow-sm">
                  <FaSignOutAlt /> Secure Logout
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="flex-none w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <Link to="/hello" className="flex flex-col items-center text-gray-400 p-2 hover:text-blue-600 transition-colors"><FaHome className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-400 p-2 hover:text-blue-600 transition-colors"><FaTasks className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Orders</span></Link>
          <Link to="/account" className="flex flex-col items-center text-blue-600 p-2"><FaUserAlt className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Profile</span></Link>
        </footer>

        {billToView && <BillModal bill={billToView} onClose={() => setBillToView(null)} />}

        {isProfileModalOpen && (
          <Modal title="Account Details" onClose={() => setProfileModalOpen(false)}>
            <ProfileSection user={userData} />
          </Modal>
        )}

        {isPoliciesModalOpen && (
          <Modal title="Policies & Terms" onClose={() => setPoliciesModalOpen(false)}>
            <PoliciesAndTerms />
          </Modal>
        )}
      </div>
      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default AccountPage;