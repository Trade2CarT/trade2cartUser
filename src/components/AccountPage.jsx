import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaSignOutAlt, FaUserCog, FaShieldAlt, FaChevronRight } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, get } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';
import Loader from './Loader';

// Import the modular components
import TradeHistorySection from './account/TradeHistorySection';
import BillModal from './account/BillModal';

const AccountPage = () => {
  const { location, setUserMobile, userMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [originalUserData, setOriginalUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [billToView, setBillToView] = useState(null);

  useEffect(() => {
    setUserLoading(true);
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

  return (
    <>
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />
      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          <div className="flex items-center gap-3"><img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" /><div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"><FaMapMarkerAlt className="text-green-500" /><span className="text-sm font-medium">{location}</span></div></div>
          <div className="flex items-center gap-4 text-xl"><FaBell className="cursor-pointer text-gray-600" /><FaShoppingCart className="cursor-pointer text-gray-600" /></div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          {userLoading ? <Loader fullscreen /> : (
            <>
              {/* --- Profile Header --- */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm">
                  <FaUserAlt className="text-3xl text-gray-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">{originalUserData?.name || 'My Account'}</h1>
                  <p className="text-sm text-gray-500">Manage your profile and view trades.</p>
                </div>
              </div>

              {/* --- NEW: Navigation Buttons --- */}
              <div className="bg-white p-2 sm:p-4 rounded-xl shadow-md space-y-2">
                <button onClick={() => navigate('/account/profile')} className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <FaUserCog className="text-xl text-blue-500" />
                    <span>My Profile</span>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
                <button onClick={() => navigate('/account/policies')} className="flex justify-between items-center w-full p-4 font-medium text-left text-gray-800 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-4">
                    <FaShieldAlt className="text-xl text-green-500" />
                    <span>Policies & Terms</span>
                  </div>
                  <FaChevronRight className="text-gray-400" />
                </button>
              </div>

              {/* Container for Trade History */}
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md mt-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">Trade History</h2>
                <TradeHistorySection
                  userMobile={userMobile}
                  originalUserData={originalUserData}
                  onViewBill={handleOpenBillModal}
                />
              </div>

              <div className="mt-6">
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600"><FaSignOutAlt /> Logout</button>
              </div>
            </>
          )}
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-green-600 p-2 no-underline"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>

        {billToView && <BillModal bill={billToView} onClose={handleCloseBillModal} />}
      </div>
    </>
  );
};

export default AccountPage;
