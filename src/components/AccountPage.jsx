import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUserAlt, FaSignOutAlt, FaUserCog, FaShieldAlt, FaChevronRight, FaTimes, FaHistory, FaLeaf } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';
import AppLayout from './layout/AppLayout';

import TradeHistorySection from './account/TradeHistorySection';
import BillModal from './account/BillModal';
import ProfileSection from './account/ProfileSection';
import PoliciesAndTerms from './account/PoliciesAndTerms';

const AccountSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="flex items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100">
      <div className="w-16 h-16 bg-slate-200 rounded-full"></div>
      <div className="space-y-2 flex-1">
        <div className="h-6 bg-slate-200 rounded w-1/2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      </div>
    </div>
    <div className="h-32 bg-slate-200 rounded-3xl w-full"></div>
    <div className="h-64 bg-slate-200 rounded-3xl w-full"></div>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-[100] flex justify-center items-end sm:items-center">
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
    <div className="bg-white rounded-t-3xl sm:rounded-[28px] shadow-2xl w-full max-w-lg h-[85vh] sm:max-h-[85vh] flex flex-col animate-slide-up sm:animate-pop-in relative z-10">
      <header className="flex justify-between items-center p-6 border-b border-slate-100 bg-white rounded-t-3xl sm:rounded-t-[28px]">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-900 bg-slate-50 p-2 rounded-full hover:bg-slate-200 transition">
          <FaTimes />
        </button>
      </header>
      <main className="overflow-y-auto nice-scrollbar p-6 flex-1 bg-slate-50">
        {children}
      </main>
    </div>
  </div>
);

const AccountPage = () => {
  const { setUserMobile } = useSettings();
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
    <AppLayout active="account" maxWidth="max-w-2xl" contentClassName="nice-scrollbar">
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />

      <div className="px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8">
        {userLoading ? <AccountSkeleton /> : (
          <div className="space-y-6">

            {/* PROFILE HERO */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 lg:p-7 rounded-3xl shadow-xl flex items-center gap-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-40 h-40 bg-brand-500/20 rounded-full blur-2xl -mr-10 -mt-10 z-0 pointer-events-none"></div>
              <div className="w-16 h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-brand-400 to-brand-500 rounded-full flex items-center justify-center text-white shadow-lg z-10 text-2xl lg:text-3xl font-black flex-shrink-0">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : <FaUserAlt />}
              </div>
              <div className="z-10 min-w-0">
                <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight truncate">{userData?.name || 'My Account'}</h1>
                <p className="text-sm text-slate-300 font-medium truncate mt-0.5">{userData?.phoneNumber || auth.currentUser?.phoneNumber || 'No phone linked'}</p>
              </div>
            </div>

            {/* MENU */}
            <div className="t2c-card overflow-hidden divide-y divide-slate-50">
              <button onClick={() => setProfileModalOpen(true)} className="flex justify-between items-center w-full p-5 text-left hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-accent-50 text-accent-600 rounded-xl flex items-center justify-center group-hover:bg-accent-500 group-hover:text-white transition-colors"><FaUserCog /></div>
                  <span className="font-black text-slate-800">Account Details</span>
                </div>
                <FaChevronRight className="text-slate-300 group-hover:text-accent-500 transition-colors" />
              </button>

              <button onClick={() => setPoliciesModalOpen(true)} className="flex justify-between items-center w-full p-5 text-left hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors"><FaShieldAlt /></div>
                  <span className="font-black text-slate-800">Policies & Terms</span>
                </div>
                <FaChevronRight className="text-slate-300 group-hover:text-brand-500 transition-colors" />
              </button>
            </div>

            {/* HISTORY */}
            <div className="t2c-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center"><FaHistory size={12} /></div>
                <h2 className="text-xl font-black text-slate-900">Trade History</h2>
              </div>
              <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                <TradeHistorySection userId={userData?.id} originalUserData={userData} onViewBill={setBillToView} />
              </div>
            </div>

            {/* IMPACT STRIP */}
            <div className="flex items-center gap-3 bg-brand-50 border border-brand-100 rounded-2xl px-5 py-4">
              <FaLeaf className="text-brand-600 text-lg flex-shrink-0" />
              <p className="text-sm font-bold text-brand-800">Thanks for recycling with Trade2Cart — you're helping build a cleaner city.</p>
            </div>

            {/* LOGOUT */}
            <div className="pt-1 pb-4">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-black border border-red-100 hover:bg-red-500 hover:text-white transition-colors">
                <FaSignOutAlt /> Secure Logout
              </button>
            </div>
          </div>
        )}
      </div>

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
    </AppLayout>
  );
};

export default AccountPage;
