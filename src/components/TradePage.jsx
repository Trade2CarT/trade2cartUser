import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt, FaEnvelope, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update, push } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import Loader from './Loader';

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState(''); // State for email
  const [existingUserId, setExistingUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { userMobile } = useSettings();

  useEffect(() => {
    const localEntries = localStorage.getItem('wasteEntries');
    if (localEntries) {
      try {
        setEntries(JSON.parse(localEntries));
      } catch {
        setEntries([]);
      }
    }

    const fetchUserData = async () => {
      if (userMobile) {
        try {
          const usersRef = ref(db, 'users');
          const userQuery = query(usersRef, orderByChild('phone'), equalTo(userMobile));
          const snapshot = await get(userQuery);

          if (snapshot.exists()) {
            const userData = firebaseObjectToArray(snapshot)[0];
            setExistingUserId(userData.id);
            if (userData.name) setUserName(userData.name);
            if (userData.address) setAddress(userData.address);
            if (userData.email) setEmail(userData.email); // Fetch and pre-fill existing email
          }
        } catch (err) {
          toast.error("Failed to load your user data.");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchUserData();
  }, [userMobile]);

  const grandTotal = entries.reduce((acc, entry) => acc + (parseFloat(entry.total) || 0), 0);

  const handleConfirmTrade = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userName.trim() || !address.trim() || !email.trim()) {
      toast.error("Please fill in your name, email, and address.");
      return;
    }
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (!existingUserId) {
      toast.error("Could not find your user record. Please log in again.");
      return;
    }
    setIsSubmitting(true);

    const imageBase64 = await new Promise((resolve) => {
      if (!tradeImage) return resolve(null);
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(tradeImage);
    });

    const userUpdatePayload = {
      name: userName,
      address: address,
      email: email, // Save email to user profile
      timestamp: new Date().toISOString(),
      Status: "Pending"
    };

    try {
      const userRef = ref(db, `users/${existingUserId}`);
      await update(userRef, userUpdatePayload);

      const wasteEntriesRef = ref(db, 'wasteEntries');
      for (let entry of entries) {
        const { text, ...restOfEntry } = entry;
        await push(wasteEntriesRef, {
          ...restOfEntry,
          name: text || entry.name,
          image: imageBase64,
          mobile: userMobile,
          timestamp: new Date().toISOString(),
          isAssigned: false
        });
      }

      toast.success('✅ Trade Confirmed! Your pickup is scheduled.');
      localStorage.removeItem('wasteEntries');
      navigate('/task');
    } catch (error) {
      toast.error("Something went wrong while saving your trade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Confirm Trade - Trade2Cart"
        description="Review your items and confirm your address to schedule a scrap pickup with Trade2Cart."
      />
      <div className="min-h-screen bg-gray-100 font-sans">
        <main className="p-4 pb-24">
          {isLoading ? <Loader /> : (
            <div className="max-w-lg mx-auto space-y-6">
              <h1 className="text-3xl font-bold text-gray-900 text-center">Confirm Your Pickup</h1>

              {/* Section 1: User Information */}
              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><FaUserAlt className="mr-3 text-blue-500" />Your Information</h2>
                <div className="space-y-4">
                  <div className="relative">
                    <FaUserAlt className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow" />
                  </div>
                  <div className="relative">
                    <FaEnvelope className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                    <input type="email" placeholder="Email for Bill" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow" required />
                  </div>
                  <div className="relative">
                    <FaMapMarkerAlt className="absolute top-4 left-3 text-gray-400" />
                    <textarea placeholder="Full Address for Pickup" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"></textarea>
                  </div>
                </div>
              </div>

              {/* Section 2: Item Summary */}
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

              {/* Section 3: Image Upload */}
              <div className="bg-white p-5 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center"><FaCamera className="mr-3 text-purple-500" />Upload Photo (Optional)</h2>
                <p className="text-sm text-gray-500 mb-3">A photo helps the vendor estimate the load.</p>
                <input type="file" accept="image/*" onChange={(e) => setTradeImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer" />
              </div>

              <button onClick={handleConfirmTrade} disabled={isSubmitting} className="w-full mt-6 py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all transform hover:scale-105">
                {isSubmitting ? 'Submitting...' : 'Confirm & Schedule Pickup'}
              </button>
            </div>
          )}
        </main>

        <footer className="sticky bottom-0 flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)] flex-shrink-0 z-30">
          <Link to="/hello" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-green-600 p-2 no-underline"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
        </footer>
      </div>
    </>
  );
};

export default TradePage;