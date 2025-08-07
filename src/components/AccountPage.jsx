import React, { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaBell, FaShoppingCart, FaEdit, FaSave, FaSignOutAlt } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update } from 'firebase/database';
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
          } else {
            toast.error("Could not find user profile.");
          }
          setUserLoading(false);
        }).catch(() => {
          toast.error("Failed to fetch user profile.");
          setUserLoading(false);
        });

      } else {
        setUserLoading(false);
      }
    });
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
    <div class="prose">
        <h3>📜 Trade2Cart – Terms & Conditions</h3>
        <p><strong>Effective Date:</strong> 23-06-2025</p>
        <p><strong>Last Updated:</strong> 23-08-2025</p>
        <p>Welcome to Trade2Cart, your trusted scrap pickup scheduling platform. These Terms and Conditions (“Terms”) govern your access and use of our website, mobile app, and services (“Platform”). By accessing or using Trade2Cart, you agree to be bound by these Terms.</p>
        <h4>1. Platform Role</h4>
        <p>Trade2Cart acts as a mediator between users (those who schedule pickups) and vendors (who collect scrap). Trade2Cart:</p>
        <ul>
            <li>Does not own or manage vendors.</li>
            <li>Is not responsible for vendor behavior, payments, or quality of service.</li>
            <li>Does not guarantee vendor availability, pricing, or punctuality.</li>
        </ul>
        <h4>2. User Obligations</h4>
        <p>By using our platform, you agree to:</p>
        <ul>
            <li>Provide accurate and up-to-date information.</li>
            <li>Be available at the scheduled time for pickup.</li>
            <li>Pay the applicable platform service fee, if any.</li>
            <li>Understand that vendors pay you directly for scrap collected.</li>
        </ul>
        <h4>3. Vendor Responsibilities</h4>
        <p>Vendors:</p>
        <ul>
            <li>Are independent third parties.</li>
            <li>Must settle payments to users at the time of pickup.</li>
            <li>Will be temporarily blocked from receiving future orders if previous payments are not cleared.</li>
        </ul>
        <h4>4. Fees & Payments</h4>
        <ul>
            <li>Users may be charged a platform booking fee (non-refundable).</li>
            <li>Vendors are not charged initially but will be subject to a service fee after the first 3–6 months.</li>
        </ul>
        <h4>5. Cancellations</h4>
        <p><strong>Cancellation is not available once a pickup is scheduled.</strong></p>
        <ul>
            <li>Users are expected to be present at the chosen time and location.</li>
            <li>If unavailable, the pickup will be marked as missed, and no refund will be issued.</li>
        </ul>
        <h4>6. Limitations of Liability</h4>
        <p>Trade2Cart is not liable for:</p>
        <ul>
            <li>Missed pickups or delayed services.</li>
            <li>Disputes between vendors and users.</li>
            <li>Theft, misconduct, or fraud by any party.</li>
        </ul>
        <h4>7. Dispute Resolution</h4>
        <p>If any issues arise:</p>
        <ul>
            <li>Trade2Cart may help mediate, but final decisions lie with the involved parties.</li>
            <li>You may email trade@trade2cart.in for formal complaints.</li>
        </ul>
        <h4>8. Changes to Terms</h4>
        <p>We reserve the right to modify these Terms at any time. Updates will be posted here with a new effective date.</p>
    </div>
  `;

  const privacyContent = `
    <div class="prose">
        <h3>🔒 Trade2Cart – Privacy Policy</h3>
        <p><strong>Effective Date:</strong> 23-06-2025</p>
        <p><strong>Last Updated:</strong> 23-08-2025</p>
        <p>Your privacy is important to us. This Privacy Policy describes how Trade2Cart (“we,” “our,” or “us”) collects, uses, and protects your data.</p>
        <h4>1. Data We Collect</h4>
        <p>When you use our services, we may collect:</p>
        <ul>
            <li>Name, phone number, and address</li>
            <li>Scrap pickup requests and history</li>
            <li>Location data (with permission)</li>
            <li>Device and usage information (IP, browser, etc.)</li>
        </ul>
        <h4>2. How We Use Your Data</h4>
        <p>We use your information to:</p>
        <ul>
            <li>Schedule and manage pickups</li>
            <li>Communicate with vendors</li>
            <li>Send order updates and reminders</li>
            <li>Improve user experience and analytics</li>
        </ul>
        <h4>3. Data Sharing</h4>
        <p>We only share your data with:</p>
        <ul>
            <li>Assigned vendors (for pickup coordination)</li>
            <li>Third-party services for communication (e.g., OTP, notifications)</li>
            <li>Government or law enforcement, if legally required</li>
        </ul>
        <h4>4. Data Security</h4>
        <p>We use modern security measures to protect your data, including:</p>
        <ul>
            <li>Encrypted transmission</li>
            <li>Secured database access</li>
            <li>Restricted internal access</li>
        </ul>
        <h4>5. Data Retention</h4>
        <p>We retain your data only as long as necessary to:</p>
        <ul>
            <li>Provide services</li>
            <li>Comply with legal obligations</li>
            <li>Improve our platform</li>
        </ul>
        <h4>6. Your Rights</h4>
        <p>You have the right to:</p>
        <ul>
            <li>Access or update your data</li>
            <li>Request deletion of your account</li>
            <li>Opt-out of notifications</li>
        </ul>
        <p>To exercise your rights, contact us at trade@trade2cart.in</p>
        <h4>7. Children’s Privacy</h4>
        <p>Trade2Cart is not intended for children under 13. We do not knowingly collect personal data from minors.</p>
        <h4>8. Changes to This Policy</h4>
        <p>We may update this Privacy Policy periodically. All changes will be reflected here with a revised effective date.</p>
    </div>
  `;

  return (
    <div className="h-screen bg-[#f8f8f8] flex flex-col">
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
        <h2 className="text-xl font-bold mb-6">Account</h2>
        <div className="space-y-4 bg-white p-4 rounded-xl shadow-md">
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
                    <div className="flex justify-end gap-3">
                      {isEditing ? (
                        <>
                          <button onClick={handleCancelEdit} className="px-4 py-2 bg-gray-300 rounded-lg">Cancel</button>
                          <button onClick={handleProfileUpdate} className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center gap-2"><FaSave /> Save</button>
                        </>
                      ) : (
                        <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center gap-2"><FaEdit /> Edit</button>
                      )}
                    </div>
                  </div>
                ) : <p>Could not load profile.</p>}
              </div>
            )}
          </div>
          <div onClick={() => toggleSection('privacy')} className="flex justify-between items-center border-b pb-3 text-gray-800 font-medium cursor-pointer">
            <span>Privacy Policy</span>
            {expandedSection === 'privacy' ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSection === 'privacy' && (<div className="mt-3 text-sm text-gray-600 prose" dangerouslySetInnerHTML={{ __html: privacyContent }} />)}

          <div onClick={() => toggleSection('terms')} className="flex justify-between items-center border-b pb-3 text-gray-800 font-medium cursor-pointer">
            <span>Terms & Conditions</span>
            {expandedSection === 'terms' ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSection === 'terms' && (<div className="mt-3 text-sm text-gray-600 prose" dangerouslySetInnerHTML={{ __html: termsContent }} />)}

          <div onClick={() => toggleSection('history')} className="flex justify-between items-center text-gray-800 font-medium cursor-pointer">
            <span>Trade History</span>
            {expandedSection === 'history' ? <FaChevronUp /> : <FaChevronDown />}
          </div>
          {expandedSection === 'history' && (
            <div className="mt-3 text-sm text-gray-600 space-y-3">
              {historyLoading ? <p>Loading history...</p> : sortedUserHistory.length > 0 ? (sortedUserHistory.map((entry) => (
                <div key={entry.id} className="bg-gray-100 p-3 rounded-lg border-l-4 border-green-500 shadow-sm">
                  <div><strong>Products:</strong> {entry.products}</div>
                  <div><strong>Status:</strong> <span className="font-semibold">{entry.status}</span></div>
                  <div><strong>Amount:</strong> ₹{entry.totalAmount}</div>
                  <div><strong>Vendor:</strong> {entry.vendorName}</div>
                  <div><strong>Date:</strong> {new Date(entry.assignedAt).toLocaleString()}</div>
                </div>))) : (<div className="text-center py-4">No trade history found for your number.</div>)}
            </div>
          )}
        </div>
        <div className="mt-6">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-lg font-bold shadow-lg hover:bg-red-600 transition-colors">
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </main>

      <footer className="sticky bottom-0 flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-inner flex-shrink-0 z-30">
        <Link to="/hello" className="flex flex-col items-center text-gray-500 no-underline"><FaHome /><span className="text-xs">Home</span></Link>
        <Link to="/task" className="flex flex-col items-center text-gray-500 no-underline"><FaTasks /><span className="text-xs">Tasks</span></Link>
        <Link to="/account" className="flex flex-col items-center text-green-600 no-underline"><FaUserAlt /><span className="text-xs">Account</span></Link>
      </footer>
    </div>
  );
};

export default AccountPage;