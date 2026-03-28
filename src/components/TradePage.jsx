import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaCamera, FaCrosshairs, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, update, push, onValue, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';

// ✅ NEW: Ghost Loader for Checkout
const CheckoutSkeleton = () => (
  <div className="space-y-5 animate-pulse">
    <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
    <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
    <div className="h-32 bg-gray-200 rounded-2xl w-full"></div>
  </div>
);

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [address, setAddress] = useState('');
  const [exactCoords, setExactCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // ✅ Controls Ghost Loaders
  const [userStatus, setUserStatus] = useState(null);

  const navigate = useNavigate();
  const { userMobile } = useSettings();
  const auth = getAuth();
  const initialCheckRef = useRef(true);

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
    // 1. Load Cart (Preserved Logic)
    const localEntries = localStorage.getItem('wasteEntries');
    if (localEntries) {
      try {
        const parsedEntries = JSON.parse(localEntries);
        if (parsedEntries.length === 0) {
          toast.error("Your cart is empty.");
          navigate('/hello');
          return;
        }
        setEntries(parsedEntries);
      } catch {
        navigate('/hello');
      }
    } else {
      navigate('/hello');
    }

    // 2. Auth & User Status (Preserved Logic)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = ref(db, `users/${user.uid}`);
        return onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.name) setUserName(userData.name);
            if (userData.address) setAddress(userData.address);
            setUserStatus(userData.Status || 'Active');

            if (initialCheckRef.current) {
              if (userData.Status === 'Pending' || userData.Status === 'On-Schedule') {
                toast.error("You already have an active pickup.");
                navigate('/task');
              }
              initialCheckRef.current = false;
            }
          }
          setIsLoading(false); // ✅ Turn off ghost loaders
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

  // ✅ NEW: Calculate Min/Max Totals for the Summary
  const minTotal = entries.reduce((acc, entry) => acc + (parseFloat(entry.minRate || entry.rate || 0) * entry.quantity), 0);
  const maxTotal = entries.reduce((acc, entry) => acc + (parseFloat(entry.maxRate || entry.rate || 0) * entry.quantity), 0);

  const handleDetectLocation = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (!navigator.geolocation) return toast.error("GPS not supported.");

    setIsDetectingLocation(true);
    toast.loading("Finding exact location...", { id: 'gps' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setExactCoords({ lat: latitude, lng: longitude });

        const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
        if (GOOGLE_API_KEY) {
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`);
            const data = await res.json();
            if (data.status === "OK" && data.results[0]) {
              setAddress(data.results[0].formatted_address);
              toast.success("Exact address mapped!", { id: 'gps' });
            }
          } catch (err) { }
        } else {
          toast.success("GPS Captured! Add door number below.", { id: 'gps' });
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        toast.error("Please allow GPS access.", { id: 'gps' });
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setTradeImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmTrade = async () => {
    if (!userName.trim() || !address.trim()) {
      return toast.error("Please fill in your name and address.");
    }
    if (!exactCoords) {
      return toast.error("Please click 'Detect Exact Location' so our driver can find you.");
    }
    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

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
    const mapLink = `https://www.google.com/maps/search/?api=1&query=${exactCoords.lat},${exactCoords.lng}`;

    // Preserved exact DB schema insertion
    entries.forEach(entry => {
      const newWasteEntryKey = push(wasteEntriesRef).key;
      updates[`/wasteEntries/${newWasteEntryKey}`] = {
        name: entry.name || entry.text,
        address: address,
        exactLat: exactCoords.lat,
        exactLng: exactCoords.lng,
        mapUrl: mapLink,
        mobile: userMobile,
        total: (entry.quantity * parseFloat(entry.rate || entry.minRate || 0)).toFixed(2),
        quantity: entry.quantity,
        unit: entry.unit,
        rate: entry.rate || entry.minRate || 0,
        category: entry.category || 'others',
        isAssigned: false,
        userID: userId,
        image: imageBase64,
        timestamp: new Date().toISOString(),
      };
    });

    const userRef = ref(db, `users/${userId}`);
    const userSnapshot = await get(userRef);
    updates[`/users/${userId}`] = {
      ...userSnapshot.val(),
      name: userName,
      address: address,
      lastLat: exactCoords.lat,
      lastLng: exactCoords.lng,
      Status: "Pending"
    };

    try {
      await update(ref(db), updates);
      toast.success('✅ Pickup Scheduled Successfully!');
      localStorage.removeItem('wasteEntries');
      navigate('/task');
    } catch (error) {
      toast.error("Scheduling failed. Please check connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO title="Confirm Trade" description="Review items and confirm your address." />
      <div className="min-h-screen bg-gray-50 font-sans pb-24">

        <div className="bg-gray-900 text-white pt-8 pb-12 px-6 rounded-b-[40px] shadow-md">
          <h1 className="text-3xl font-extrabold text-center">Checkout</h1>
          <p className="text-gray-400 text-center mt-2 text-sm">Review details to schedule an agent</p>
        </div>

        <main className="p-4 -mt-8">
          {isLoading ? <CheckoutSkeleton /> : (
            <div className="max-w-lg mx-auto space-y-5">

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FaUserAlt size={14} /></span>
                  Your Info
                </h2>
                <input type="text" placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700" />
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <h2 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><FaMapMarkerAlt size={14} /></span>
                  Pickup Location
                </h2>

                {exactCoords ? (
                  <div className="mb-4">
                    <div className="w-full h-36 rounded-xl overflow-hidden shadow-inner border border-gray-200 mb-3">
                      <iframe
                        width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                        src={`https://maps.google.com/maps?q=${exactCoords.lat},${exactCoords.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-3">
                      <FaCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-800 text-sm">GPS Captured Successfully</p>
                        <p className="text-xs text-green-600">Agent will navigate to this pin.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full mb-4 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg"
                  >
                    {isDetectingLocation ? <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaCrosshairs /> Detect Exact Location</>}
                  </button>
                )}

                <textarea placeholder="Please add Door No, Floor, or Landmark..." value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700"></textarea>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-800">Scrap Summary</h2>
                <div className="space-y-3">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-800 capitalize">{entry.name || entry.text}</p>
                        <p className="text-sm text-gray-500">{entry.quantity} {entry.unit} × {entry.minRate ? `₹${entry.minRate}-₹${entry.maxRate}` : `₹${entry.rate}`}</p>
                      </div>
                    </div>
                  ))}

                  {/* Estimated Final Value with Disclaimer */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center font-extrabold text-xl mb-1">
                      <p>Estimated Value</p>
                      <p className="text-green-600">{minTotal === maxTotal ? `₹${minTotal.toFixed(2)}` : `₹${minTotal.toFixed(0)} - ₹${maxTotal.toFixed(0)}`}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1"><FaInfoCircle /> Final value is calculated by agent after exact weighing.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100">
                <h2 className="text-lg font-bold mb-2 text-gray-800">Add Photo (Optional)</h2>
                <p className="text-sm text-gray-500 mb-4">Helps agent bring the right vehicle size.</p>
                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer bg-blue-50 border-2 border-dashed border-blue-300 text-blue-700 font-semibold text-center py-6 rounded-xl hover:bg-blue-100 transition-colors">
                    <FaCamera className="mx-auto text-3xl mb-2 opacity-80" />
                    <span>Open Camera</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="w-28 h-28 rounded-xl overflow-hidden shadow-md">
                      <img src={imagePreview} alt="Scrap preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <button onClick={handleConfirmTrade} disabled={isLoading || isSubmitting || isSchedulingDisabled} className="w-full py-4 mt-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-xl hover:bg-green-700 active:scale-95 transition-transform disabled:bg-gray-400">
                {isSubmitting ? 'Scheduling Pickup...' : 'Confirm & Book Pickup'}
              </button>
            </div>
          )}
        </main>

        <footer className="fixed bottom-0 w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <Link to="/hello" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaHome className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaTasks className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Orders</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaUserAlt className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Profile</span></Link>
        </footer>
      </div>
    </>
  );
};

export default TradePage;