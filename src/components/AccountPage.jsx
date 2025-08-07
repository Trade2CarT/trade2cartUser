import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaBell, FaShoppingCart, FaEdit, FaSave, FaSignOutAlt } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update, onValue } from 'firebase/database';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";

const AccountPage = () => {
  const { location, setLocation, setUserMobile, userMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [expandedSection, setExpandedSection] = useState('profile');
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [editableUserData, setEditableUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // This hook now correctly gets the current user's UID and fetches their data directly.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        const userRef = ref(db, `users/${user.uid}`);

        // Listen for real-time updates to the user's profile
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setEditableUserData({ id: snapshot.key, ...snapshot.val() });
          } else {
            toast.error("Could not find user profile.");
          }
          setUserLoading(false);
        });

      } else {
        // Handle user being logged out
        setUserLoading(false);
      }
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!userMobile) return;
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const assignmentsRef = ref(db, 'assignments');
        const historyQuery = query(assignmentsRef, orderByChild('mobile'), equalTo(userMobile));
        const snapshot = await get(historyQuery);
        setUserHistory(firebaseObjectToArray(snapshot));
      } catch (error) {
        toast.error("Could not load trade history.");
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [userMobile]);

  const sortedUserHistory = useMemo(() => {
    return userHistory.sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  }, [userHistory]);

  const toggleSection = (section) => {
    setExpandedSection(prev => (prev === section ? null : section));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditableUserData(prev => ({ ...prev, [name]: value }));
  };

  // This function now correctly uses the user's UID to update the profile.
  const handleProfileUpdate = async () => {
    if (!currentUserId || !editableUserData) return;

    const promise = update(ref(db, `users/${currentUserId}`), {
      name: editableUserData.name,
      address: editableUserData.address,
      location: editableUserData.location,
      language: editableUserData.language,
    });

    toast.promise(promise, {
      loading: 'Updating profile...',
      success: 'Profile updated successfully!',
      error: 'Failed to update profile.'
    });

    try {
      await promise;
      setLocation(editableUserData.location);
      setIsEditing(false);
    } catch (error) {
      // Error handled by toast
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserMobile(null);
      localStorage.removeItem('wasteEntries');
      localStorage.removeItem('checkoutData');
      toast.success('Logged out successfully!');
      navigate('/language', { replace: true });
    }).catch((error) => {
      toast.error('Logout failed. Please try again.');
    });
  };

  const termsContent = `...`;
  const privacyContent = `...`;

  return (
    <div className="h-screen bg-[#f8f8f8] flex flex-col">
      {/* Header is unchanged */}
      <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
            <FaMapMarkerAlt className="text-green-500" />
            <span className="text-sm font-medium">{location}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <FaBell className="cursor-pointer text-gray-600" />
          <div className="relative cursor-pointer">
            <FaShoppingCart className="text-gray-600" />
          </div>
        </div>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        {/* Main content with profile editing is largely the same, but now uses the new state */}
        <h2 className="text-xl font-bold mb-6">Account</h2>
        <div className="space-y-4 bg-white p-4 rounded-xl shadow-md">
          {/* My Profile Section */}
          <div className="cursor-pointer">
            <div onClick={() => toggleSection('profile')} className="flex justify-between items-center border-b pb-3 text-gray-800 font-medium">
              <span>My Profile</span>
              {expandedSection === 'profile' ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            {expandedSection === 'profile' && (
              <div className="mt-3 text-sm text-gray-600 space-y-3">
                {userLoading ? <p>Loading profile...</p> : editableUserData ? (
                  <div className="space-y-4">
                    <div><label className="block font-medium">Name</label><input type="text" name="name" value={editableUserData.name || ''} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-2 border rounded-md ${!isEditing && 'bg-gray-100'}`} /></div>
                    <div><label className="block font-medium">Phone Number</label><input type="text" value={editableUserData.phone || ''} disabled className="w-full p-2 bg-gray-100 border rounded-md" /></div>
                    <div><label className="block font-medium">Address</label><textarea name="address" value={editableUserData.address || ''} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-2 border rounded-md ${!isEditing && 'bg-gray-100'}`} /></div>
                    <div><label className="block font-medium">Location</label><select name="location" value={editableUserData.location || ''} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100' : 'bg-white'}`}><option value="Vellore">Vellore</option><option value="Chennai">Chennai</option><option value="Bangalore">Bengaluru</option></select></div>
                    <div className="flex justify-end gap-3">{isEditing ? (<><button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button><button onClick={handleProfileUpdate} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"><FaSave /> Save</button></>) : (<button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"><FaEdit /> Edit</button>)}</div>
                  </div>
                ) : <p>Could not load profile.</p>}
              </div>
            )}
          </div>
          {/* Other sections (privacy, terms, history) are unchanged */}
        </div>
        <div className="mt-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600 transition-colors">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </main>

      {/* Footer is unchanged */}
      <footer className="sticky bottom-0 flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-inner flex-shrink-0 z-30">
        <Link to="/hello" className="flex flex-col items-center text-gray-500 no-underline"><FaHome /><span className="text-xs">Home</span></Link>
        <Link to="/task" className="flex flex-col items-center text-gray-500 no-underline"><FaTasks /><span className="text-xs">Tasks</span></Link>
        <Link to="/account" className="flex flex-col items-center text-green-600 no-underline"><FaUserAlt /><span className="text-xs">Account</span></Link>
      </footer>
    </div>
  );
};

export default AccountPage;