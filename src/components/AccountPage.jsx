import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaBell, FaShoppingCart, FaEdit, FaSave, FaSignOutAlt, FaExclamationTriangle, FaDownload, FaSpinner } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BillTemplate from './BillTemplate';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import SEO from './SEO';

const AccountPage = () => {
  const { location, setLocation, setUserMobile, userMobile } = useSettings();
  const navigate = useNavigate();
  const auth = getAuth();

  const [expandedSection, setExpandedSection] = useState('profile');
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [originalUserData, setOriginalUserData] = useState(null);
  const [editableUserData, setEditableUserData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [billData, setBillData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(null);
  const billTemplateRef = useRef(null);

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
          } else {
            toast.error("Could not find user profile.");
          }
        }).catch(() => toast.error("Failed to fetch user profile."))
          .finally(() => setUserLoading(false));
      } else {
        setUserLoading(false);
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

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

  const processedUserHistory = useMemo(() => {
    const now = new Date();
    const SEVEN_DAYS_IN_MS = 7 * 24 * 60 * 60 * 1000;
    return userHistory
      .map(entry => {
        if (!entry.assignedAt) return null;
        const assignedDate = new Date(entry.assignedAt);
        if (isNaN(assignedDate.getTime())) return null;
        const expiryDate = new Date(assignedDate.getTime() + SEVEN_DAYS_IN_MS);
        const remainingTime = expiryDate.getTime() - now.getTime();
        if (remainingTime < 0) return null;
        const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
        return { ...entry, remainingDays };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.assignedAt) - new Date(a.assignedAt));
  }, [userHistory]);

  const handleDownloadBill = async (tradeEntry) => {
    const assignmentId = tradeEntry.id;
    setIsDownloading(assignmentId);
    try {
      const billsRef = ref(db, 'bills');
      const billQuery = query(billsRef, orderByChild('assignmentID'), equalTo(assignmentId));
      const snapshot = await get(billQuery);

      if (!snapshot.exists()) {
        toast.error("Bill details not found for this trade.");
        setIsDownloading(null);
        return;
      }

      const billDetails = firebaseObjectToArray(snapshot)[0];
      const completeBillData = {
        id: assignmentId,
        assignedAt: tradeEntry.assignedAt,
        vendorName: tradeEntry.vendorName,
        userName: originalUserData?.name,
        address: originalUserData?.address,
        totalAmount: billDetails.totalBill,
        products: billDetails.billItems.map(item => ({
          name: item.name,
          quantity: item.weight,
          unit: 'kg',
          rate: item.rate,
          total: item.total
        }))
      };

      setBillData(completeBillData);

      setTimeout(() => {
        const input = billTemplateRef.current;
        if (input) {
          html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`invoice-${assignmentId.slice(-6)}.pdf`);
            setBillData(null);
            setIsDownloading(null);
          });
        } else {
          setIsDownloading(null);
        }
      }, 500);
    } catch (error) {
      toast.error("Could not download bill. Please try again.");
      setIsDownloading(null);
    }
  };

  const toggleSection = (section) => setExpandedSection(prev => (prev === section ? null : section));
  const handleInputChange = (e) => setEditableUserData(prev => ({ ...prev, [e.target.name]: e.target.value }));

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
    } catch (error) {
      // Error is handled by the toast
    }
  };

  const handleLogout = () => {
    signOut(auth).then(() => {
      setUserMobile(null);
      localStorage.clear();
      toast.success('Logged out successfully!');
      navigate('/language', { replace: true });
    }).catch((error) => {
      toast.error('Logout failed. Please try again.');
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableUserData(originalUserData);
  };

  const termsContent = `
    <div class="prose max-w-none">
        <h3>📜 Trade2Cart – Terms & Conditions</h3>
        <p><strong>Effective Date:</strong> August 10, 2025</p>
        <p>Welcome to Trade2Cart. These Terms and Conditions (“Terms”) govern your use of our platform. By using Trade2Cart, you agree to these Terms.</p>
        <h4>1. Platform Role</h4>
        <ul>
            <li>Trade2Cart acts as a mediator between users and scrap vendors.</li>
            <li>We are not responsible for vendor behavior or payments.</li>
        </ul>
        <h4>2. User Obligations</h4>
        <ul>
            <li>Provide accurate pickup information.</li>
            <li>Be available at the scheduled time.</li>
            <li>Cancellation is not available once a pickup is scheduled.</li>
        </ul>
        <h4>3. Payments</h4>
        <ul>
            <li>Users may be charged a non-refundable platform booking fee.</li>
            <li>Vendors pay you directly for scrap.</li>
        </ul>
        <h4>4. Limitation of Liability</h4>
        <p>Trade2Cart is not liable for missed pickups, disputes, or issues arising between users and vendors.</p>
    </div>
  `;

  const privacyContent = `
    <div class="prose max-w-none">
        <h3>🔒 Trade2Cart – Privacy Policy</h3>
        <p><strong>Effective Date:</strong> August 10, 2025</p>
        <p>Your privacy is important to us. This policy explains how we collect, use, and protect your data.</p>
        <h4>1. Data We Collect</h4>
        <ul>
            <li>Name, phone number, address</li>
            <li>Pickup requests and history</li>
            <li>Location and device data</li>
        </ul>
        <h4>2. How We Use Your Data</h4>
        <ul>
            <li>To schedule and manage pickups.</li>
            <li>To communicate with vendors.</li>
            <li>To improve our platform and user experience.</li>
        </ul>
        <h4>3. Data Sharing</h4>
        <p>We only share your data with assigned vendors for pickup coordination or as legally required. We do not sell your personal data.</p>
        <h4>4. Your Rights</h4>
        <p>You have the right to access, update, or request deletion of your data by contacting us at trade@trade2cart.in.</p>
    </div>
  `;

  const Section = ({ title, sectionKey, children }) => (
    <div className="border-b">
      <button onClick={() => toggleSection(sectionKey)} className="flex justify-between items-center w-full py-4 font-medium text-left text-gray-800">
        <span>{title}</span>
        {expandedSection === sectionKey ? <FaChevronUp /> : <FaChevronDown />}
      </button>
      {expandedSection === sectionKey && <div className="pb-4 text-sm text-gray-600">{children}</div>}
    </div>
  );

  return (
    <>
      <SEO title="My Account - Trade2Cart" description="Manage your profile, view history, and download bills." />
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <BillTemplate trade={billData} billRef={billTemplateRef} />
      </div>

      <div className="h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <FaMapMarkerAlt className="text-green-500" />
              <span className="text-sm font-medium">{location}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xl">
            <FaBell className="cursor-pointer text-gray-600" />
            <FaShoppingCart className="cursor-pointer text-gray-600" />
          </div>
        </header>

        <main className="flex-grow p-4 overflow-y-auto">
          <h1 className="text-2xl font-bold mb-4">My Account</h1>
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
            <Section title="My Profile" sectionKey="profile">
              {userLoading ? <p>Loading profile...</p> : editableUserData ? (
                <div className="space-y-4">
                  <div><label className="block font-medium mb-1">Name</label><input type="text" name="name" value={editableUserData.name || ''} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} /></div>
                  <div><label className="block font-medium mb-1">Phone Number</label><input type="text" value={editableUserData.phone || ''} disabled className="w-full p-2 bg-gray-100 border rounded-md cursor-not-allowed" /></div>
                  <div><label className="block font-medium mb-1">Address</label><textarea name="address" value={editableUserData.address || ''} onChange={handleInputChange} disabled={!isEditing} rows="3" className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`} /></div>
                  <div><label className="block font-medium mb-1">Location</label><select name="location" value={editableUserData.location || ''} onChange={handleInputChange} disabled={!isEditing} className={`w-full p-2 border rounded-md ${!isEditing ? 'bg-gray-100 cursor-not-allowed appearance-none' : 'bg-white'}`}><option value="Vellore">Vellore</option><option value="Chennai">Chennai</option><option value="Bangalore">Bengaluru</option></select></div>
                  <div className="flex justify-end gap-3 pt-2">
                    {isEditing ? (
                      <>
                        <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 rounded-lg font-semibold hover:bg-gray-400">Cancel</button>
                        <button onClick={handleProfileUpdate} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2 font-semibold hover:bg-green-600"><FaSave /> Save</button>
                      </>
                    ) : (
                      <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2 font-semibold hover:bg-blue-600"><FaEdit /> Edit</button>
                    )}
                  </div>
                </div>
              ) : <p>Could not load profile.</p>}
            </Section>
            <Section title="Privacy Policy" sectionKey="privacy"><div dangerouslySetInnerHTML={{ __html: privacyContent }} /></Section>
            <Section title="Terms & Conditions" sectionKey="terms"><div dangerouslySetInnerHTML={{ __html: termsContent }} /></Section>

            <Section title="Trade History" sectionKey="history">
              <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-3 rounded-md mb-4 text-sm" role="alert">
                <div className="flex items-center gap-2"><FaExclamationTriangle /> <p>To protect your privacy, trade history is deleted after 7 days.</p></div>
              </div>

              {historyLoading ? <p>Loading history...</p> : processedUserHistory.length > 0 ? (
                processedUserHistory.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 p-3 mb-3 rounded-lg border shadow-sm">
                    <div className="border-b pb-2 mb-2">
                      <p><strong>Products:</strong> {entry.products}</p>
                      <p><strong>Status:</strong> <span className="font-semibold">{entry.status}</span></p>
                      <p><strong>Amount:</strong> ₹{entry.totalAmount}</p>
                      <p><strong>Vendor:</strong> {entry.vendorName}</p>
                      <p><strong>Date:</strong> {new Date(entry.assignedAt).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <p className="text-xs text-red-600 font-semibold">Deletes in {entry.remainingDays} {entry.remainingDays > 1 ? 'days' : 'day'}</p>
                      {entry.status === 'Completed' && (
                        <button onClick={() => handleDownloadBill(entry)} disabled={isDownloading === entry.id} className="flex items-center gap-2 bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait">
                          {isDownloading === entry.id ? <FaSpinner className="animate-spin" /> : <FaDownload />}
                          {isDownloading === entry.id ? 'Preparing...' : 'Download Bill'}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">No trade history found.</div>
              )}
            </Section>
          </div>

          <div className="mt-6">
            <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600">
              <FaSignOutAlt /> Logout
            </button>
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