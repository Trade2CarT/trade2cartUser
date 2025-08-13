import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt, FaEnvelope, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update, push, set } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import Loader from './Loader';

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [existingUserId, setExistingUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);
  const navigate = useNavigate();
  const { userMobile } = useSettings();

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
    const localEntries = localStorage.getItem('wasteEntries');
    if (localEntries) {
      try {
        const parsedEntries = JSON.parse(localEntries);
        setEntries(parsedEntries);
        if (parsedEntries.length === 0) {
          toast.error("Your cart is empty. Add items first.");
          navigate('/hello');
        }
      } catch {
        setEntries([]);
        toast.error("Your cart is empty. Add items first.");
        navigate('/hello');
      }
    }

    const fetchUserData = async () => {
      if (!userMobile) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const usersRef = ref(db, 'users');
        const userQuery = query(usersRef, orderByChild('phone'), equalTo(userMobile));
        const userSnapshot = await get(userQuery);

        if (userSnapshot.exists()) {
          const userData = firebaseObjectToArray(userSnapshot)[0];
          setExistingUserId(userData.id);
          if (userData.name) setUserName(userData.name);
          if (userData.address) setAddress(userData.address);
          if (userData.email) setEmail(userData.email);
          setUserStatus(userData.Status || 'Active');
        } else {
          setUserStatus('Active');
        }
      } catch (err) {
        toast.error("Failed to load your user data.");
        setUserStatus('Active');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userMobile, navigate]);

  useEffect(() => {
    if (!isLoading && isSchedulingDisabled) {
      toast.error("You already have an active pickup.");
      navigate('/task');
    }
  }, [isLoading, isSchedulingDisabled, navigate]);

  const grandTotal = entries.reduce((acc, entry) => acc + (parseFloat(entry.total) || 0), 0);

  const handleConfirmTrade = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userName.trim() || !address.trim() || !email.trim()) {
      return toast.error("Please fill in your name, email, and address.");
    }
    if (!emailRegex.test(email)) {
      return toast.error("Please enter a valid email address.");
    }
    if (!existingUserId) {
      return toast.error("Could not find your user record. Please try again.");
    }

    setIsSubmitting(true);

    const imageBase64 = await new Promise((resolve) => {
      if (!tradeImage) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(tradeImage);
    });

    // This object will hold all the database updates we want to perform at once.
    const updates = {};
    const wasteEntryIds = [];
    const wasteEntriesRef = ref(db, 'wasteEntries');

    // Loop through each item in the cart and prepare a new waste entry for it.
    entries.forEach(entry => {
      const newWasteEntryKey = push(wasteEntriesRef).key; // Generate a unique key for each item
      wasteEntryIds.push(newWasteEntryKey);

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
        isAssigned: false, // It will be assigned in the admin panel
        userID: existingUserId,
        image: imageBase64, // Optional image for all items in the order
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      updates[`/wasteEntries/${newWasteEntryKey}`] = newWastePayload;
    });

    // Prepare the user data update
    const userUpdatePayload = {
      name: userName,
      address: address,
      email: email,
      Status: "Pending" // Set user status to Pending
    };
    updates[`/users/${existingUserId}`] = userUpdatePayload;

    try {
      // Perform all database writes in a single atomic operation
      await update(ref(db), updates);

      toast.success('✅ Trade Confirmed! Your pickup is scheduled.');
      localStorage.removeItem('wasteEntries');
      navigate('/task');
    } catch (error) {
      console.error("Error creating waste entries:", error);
      toast.error("Scheduling failed. Please check your connection or security rules.");
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
          {isLoading ? <Loader /> : (
            <div className="max-w-lg mx-auto space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center">Confirm Your Pickup</h1>

              {/* User Information Section */}
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

              {/* Item Summary Section */}
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

              {/* Image Upload Section */}
              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><FaCamera className="mr-3 text-purple-500" />Upload Photo (Optional)</h2>
                <p className="text-sm text-gray-500 mb-3">A photo helps the vendor estimate the load.</p>
                <input type="file" accept="image/*" onChange={(e) => setTradeImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200" />
              </div>

              <button onClick={handleConfirmTrade} disabled={isSubmitting || isSchedulingDisabled} className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                {isSubmitting ? 'Scheduling...' : 'Confirm & Schedule Pickup'}
              </button>
            </div>
          )}
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-green-600 p-2 no-underline"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>
      </div>
    </>
  );
};

export default TradePage;
