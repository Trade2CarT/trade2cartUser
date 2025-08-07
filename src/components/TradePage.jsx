import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt } from 'react-icons/fa';
import { db, firebaseObjectToArray } from '../firebase';
import { ref, query, orderByChild, equalTo, get, update, push } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [existingUserId, setExistingUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          }
        } catch (err) {
          toast.error("Failed to load your user data.");
        }
      }
    };
    fetchUserData();
  }, [userMobile]);

  const handleConfirmTrade = async () => {
    if (!userName.trim() || !address.trim()) {
      toast.error("Please enter your name and address.");
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
      name: userName, address: address, timestamp: new Date().toISOString(), Status: "Pending"
    };

    try {
      const userRef = ref(db, `users/${existingUserId}`);
      await update(userRef, userUpdatePayload);

      const wasteEntriesRef = ref(db, 'wasteEntries');
      for (let entry of entries) {
        const { text, ...restOfEntry } = entry;
        await push(wasteEntriesRef, {
          ...restOfEntry, name: text || entry.name, image: imageBase64,
          mobile: userMobile, timestamp: new Date().toISOString(), isAssigned: false
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
    <div className="min-h-screen flex flex-col justify-between p-4 bg-[#f2f7f8]">
      <div>
        <h2 className="text-xl font-semibold mb-4">Confirm Your Trade</h2>
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          <p className="text-sm font-medium mb-2">Enter your pickup details:</p>
          <input type="text" placeholder="Enter your full name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-2 mb-2 border rounded-md" />
          <textarea placeholder="Enter your full address for pickup" value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-2 border rounded-md"></textarea>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload a photo of your items (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setTradeImage(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="font-semibold">Items in your trade:</h3>
          {entries.map((entry, idx) => (
            <div key={idx} className="border p-3 rounded-lg bg-white shadow flex justify-between items-center">
              <div><p className="font-bold">{entry.text || entry.name}</p><p className="text-sm text-gray-600">{entry.quantity} {entry.unit} x ₹{entry.rate}</p></div>
              <p className="font-semibold">₹{entry.total}</p>
            </div>
          ))}
        </div>
        <button onClick={handleConfirmTrade} disabled={isSubmitting} className="w-full mt-6 py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg hover:bg-green-700 disabled:bg-gray-400">
          {isSubmitting ? 'Submitting...' : '✅ Confirm Trade'}
        </button>
      </div>
      <footer className="flex justify-around items-center mt-10 p-3 bg-white rounded-t-3xl shadow-inner">
        <Link to="/hello" className="flex flex-col items-center text-green-600 no-underline"><FaHome /><span className="text-xs">Home</span></Link>
        <Link to="/task" className="flex flex-col items-center text-gray-500 no-underline"><FaTasks /><span className="text-xs">Tasks</span></Link>
        <Link to="/account" className="flex flex-col items-center text-gray-500 no-underline"><FaUserAlt /><span className="text-xs">Account</span></Link>
      </footer>
    </div>
  );
};

export default TradePage;