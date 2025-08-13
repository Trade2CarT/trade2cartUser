import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt, FaEnvelope, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { db } from '../firebase'; // Removed firebaseObjectToArray as it's not needed for direct lookup
import { ref, update, push, onValue, get } from 'firebase/database'; // Added onValue and get
import { getAuth, onAuthStateChanged } from 'firebase/auth'; // Added auth imports
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import Loader from './Loader';

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState(null); // Changed from existingUserId
  const [tradeImage, setTradeImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const navigate = useNavigate();
  const { userMobile } = useSettings(); // Still needed for creating waste entries
  const auth = getAuth(); // Get the auth instance

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
    // This effect runs first to load cart items from local storage.
    const localEntries = localStorage.getItem('wasteEntries');
    if (localEntries) {
      try {
        const parsedEntries = JSON.parse(localEntries);
        if (parsedEntries.length === 0) {
          toast.error("Your cart is empty. Add items first.");
          navigate('/hello');
          return;
        }
        setEntries(parsedEntries);
      } catch {
        toast.error("Your cart is empty. Add items first.");
        navigate('/hello');
      }
    } else {
      toast.error("Your cart is empty. Add items first.");
      navigate('/hello');
    }

    // This listener waits for the auth state to be confirmed.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is logged in, their UID is the reliable ID.
        setUserId(user.uid);
        const userRef = ref(db, `users/${user.uid}`);

        // Set up a real-time listener for the user's data.
        const dbUnsubscribe = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.name) setUserName(userData.name);
            if (userData.address) setAddress(userData.address);
            if (userData.email) setEmail(userData.email);
            setUserStatus(userData.Status || 'Active');

            // Check if user already has a pending schedule
            if (userData.Status === 'Pending' || userData.Status === 'On-Schedule') {
              toast.error("You already have an active pickup.");
              navigate('/task');
            }
          } else {
            // This case handles if a user is logged in but their DB entry is missing.
            toast.error("Could not find your user profile. Please log in again.");
            navigate('/login');
          }
          setIsLoading(false); // Mark loading as complete
        });

        // Return the inner unsubscribe function for cleanup.
        return dbUnsubscribe;
      } else {
        // User is not logged in.
        toast.error("Login required to schedule a pickup.");
        navigate('/login');
      }
    });

    // Cleanup function to remove the auth listener when the component unmounts.
    return () => unsubscribe();
  }, [auth, navigate]);


  const grandTotal = entries.reduce((acc, entry) => acc + (parseFloat(entry.total) || 0), 0);

  const handleConfirmTrade = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userName.trim() || !address.trim() || !email.trim()) {
      return toast.error("Please fill in your name, email, and address.");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    // This check is now reliable because the button is disabled until userId is set.
    if (!userId) {
      return toast.error("User ID not found. Please wait a moment and try again.");
    }

    setIsSubmitting(true);

    const imageBase64 = await new Promise((resolve) => {
      if (!tradeImage) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(tradeImage);
    });

    const updates = {};
    const wasteEntriesRef = ref(db, 'wasteEntries');

    entries.forEach(entry => {
      const newWasteEntryKey = push(wasteEntriesRef).key;
      const newWastePayload = {
        name: entry.text || entry.name,
        address: address,
        mobile: userMobile,
        total: entry.total.toFixed(2),
        quantity: entry.quantity,
        unit: entry.unit,
        rate: entry.rate,
        category: entry.category,
        location: entry.location,
        isAssigned: false,
        userID: userId, // Use the reliable UID here
        image: imageBase64,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      updates[`/wasteEntries/${newWasteEntryKey}`] = newWastePayload;
    });

    // We need to get the current user data before updating it to avoid overwriting fields.
    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    const existingUserData = userSnapshot.val();

    const userUpdatePayload = {
      ...existingUserData, // Preserve existing user data
      name: userName,
      address: address,
      email: email,
      Status: "Pending"
    };
    updates[`/users/${userId}`] = userUpdatePayload;

    try {
      await update(ref(db), updates);
      toast.success('✅ Trade Confirmed! Your pickup is scheduled.');
      localStorage.removeItem('wasteEntries');
      navigate('/task');
    } catch (error) {
      console.error("Error creating waste entries:", error);
      toast.error("Scheduling failed. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Confirm Trade - Trade2Cart"
        description="Review your items and confirm your address to schedule a scrap pickup."
      />
      <div className="min-h-screen bg-gray-100 font-sans">
        <main className="p-4 pb-24">
          {isLoading ? <Loader fullscreen /> : (
            <div className="max-w-lg mx-auto space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center">Confirm Your Pickup</h1>

              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><FaUserAlt className="mr-3 text-blue-500" />Your Information</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <FaUserAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div className="relative">
                    <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input type="email" placeholder="Email for Bill" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute top-4 left-3 text-gray-400" />
                    <textarea placeholder="Full Address for Pickup" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Item Summary</h2>
                <div className="space-y-3">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-bold text-gray-800 capitalize">{entry.text || entry.name}</p>
                        <p className="text-sm text-gray-500">{entry.quantity} {entry.unit} &times; ₹{entry.rate}</p>
                      </div>
                      <p className="font-semibold text-gray-800 text-lg">₹{parseFloat(entry.total).toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 font-bold text-xl">
                    <p>Grand Total</p>
                    <p className="text-green-600">₹{grandTotal.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><FaCamera className="mr-3 text-purple-500" />Upload Photo (Optional)</h2>
                <p className="text-sm text-gray-500 mb-3">A photo helps the vendor estimate the load.</p>
                <input type="file" accept="image/*" onChange={(e) => setTradeImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
              </div>

              <button onClick={handleConfirmTrade} disabled={isLoading || isSubmitting || isSchedulingDisabled} className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule Pickup'}
              </button>
            </div>
          )}
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>
      </div>
    </>
  );
};

export default TradePage;