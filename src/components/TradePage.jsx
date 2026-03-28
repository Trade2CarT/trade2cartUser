import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaCamera, FaCrosshairs, FaCheckCircle, FaInfoCircle, FaEnvelope } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, update, push, onValue, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';

const CheckoutSkeleton = () => (
  <div className="space-y-4 animate-pulse px-2 mt-4">
    <div className="h-32 bg-white rounded-3xl w-full shadow-sm border border-gray-100"></div>
    <div className="h-48 bg-white rounded-3xl w-full shadow-sm border border-gray-100"></div>
    <div className="h-32 bg-white rounded-3xl w-full shadow-sm border border-gray-100"></div>
  </div>
);

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [exactCoords, setExactCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);

  const navigate = useNavigate();
  const { userMobile } = useSettings();
  const auth = getAuth();
  const initialCheckRef = useRef(true);

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        const userRef = ref(db, `users/${user.uid}`);
        return onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            if (userData.name) setUserName(userData.name);
            if (userData.email) setEmail(userData.email);
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
          setIsLoading(false);
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [auth, navigate]);

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
    if (!userName.trim() || !email.trim() || !address.trim()) {
      return toast.error("Please fill in your name, email, and address.");
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
      email: email,
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

      <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden">

        <header className="flex-none bg-gradient-to-r from-emerald-600 to-green-500 text-white pt-6 pb-12 px-6 rounded-b-[40px] shadow-lg relative z-20">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-b-[40px] pointer-events-none opacity-20">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[100%] bg-white blur-[80px] rounded-full"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-center">Secure Checkout</h1>
            <p className="text-green-50 font-medium mt-1 text-xs uppercase tracking-widest opacity-90">Step 2 of 2</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pb-8 z-10">
          {isLoading ? <CheckoutSkeleton /> : (
            <div className="max-w-lg mx-auto space-y-4 -mt-6">

              {/* CONTACT DETAILS CARD */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 relative">
                <h2 className="text-[14px] font-black uppercase tracking-widest mb-4 text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center"><FaUserAlt size={12} /></div>
                  Contact Details
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="text" placeholder="Full Name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-700 transition-all" />
                  </div>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input type="email" placeholder="Email Address (For Bill)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-gray-700 transition-all" />
                  </div>
                  <div className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-500 flex items-center relative cursor-not-allowed shadow-inner">
                    <span className="absolute left-4 text-gray-400">📱</span> {userMobile || 'No number linked'}
                  </div>
                </div>
              </div>

              {/* LOCATION CARD */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <h2 className="text-[14px] font-black uppercase tracking-widest mb-4 text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FaMapMarkerAlt size={12} /></div>
                  Pickup Location
                </h2>

                {exactCoords ? (
                  <div className="mb-4 animate-fade-in-up">
                    <div className="w-full h-40 rounded-2xl overflow-hidden shadow-inner border border-gray-200 mb-3 relative">
                      <iframe
                        width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                        src={`https://maps.google.com/maps?q=${exactCoords.lat},${exactCoords.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    <div className="bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-3">
                      <FaCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                      <div>
                        <p className="font-bold text-green-900 text-sm leading-tight">GPS Captured</p>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-green-600 mt-0.5">Agent will navigate here</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDetectLocation}
                    disabled={isDetectingLocation}
                    className="w-full mb-4 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-md"
                  >
                    {isDetectingLocation ? <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaCrosshairs /> Detect Exact Location</>}
                  </button>
                )}

                <textarea placeholder="Add Door No, Floor, or Landmark..." value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 transition-all resize-none"></textarea>
              </div>

              {/* SUMMARY CARD */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-[14px] font-black uppercase tracking-widest mb-4 text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><FaTasks size={12} /></div>
                  Scrap Summary
                </h2>
                <div className="space-y-2 mb-4">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-xl border border-gray-100">

                      {/* ✅ FIX 3: Display the scrap image or a neat placeholder! */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                          {entry.image || entry.icon || entry.imgUrl ? (
                            <img src={entry.image || entry.icon || entry.imgUrl} alt={entry.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">N/A</span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-gray-800 text-sm capitalize">{entry.name || entry.text}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{entry.quantity} {entry.unit} × {entry.minRate ? `₹${entry.minRate}-₹${entry.maxRate}` : `₹${entry.rate}`}</p>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100 bg-green-50/50 -mx-5 md:-mx-6 -mb-5 md:-mb-6 p-5 md:p-6 rounded-b-3xl">
                  <div className="flex justify-between items-center font-black text-xl mb-1">
                    <p className="text-gray-800">Est. Value</p>
                    <p className="text-green-600">{minTotal === maxTotal ? `₹${minTotal.toFixed(2)}` : `₹${minTotal.toFixed(0)} - ₹${maxTotal.toFixed(0)}`}</p>
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 flex items-center gap-1 uppercase tracking-widest mt-1"><FaInfoCircle /> Final value calculated upon weighing.</p>
                </div>
              </div>

              {/* CAMERA CARD */}
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[14px] font-black uppercase tracking-widest text-gray-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center"><FaCamera size={12} /></div>
                    Add Photo
                  </h2>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-md">Optional</span>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer bg-orange-50/50 border-2 border-dashed border-orange-200 text-orange-700 font-bold text-sm text-center py-5 rounded-2xl hover:bg-orange-50 transition-colors">
                    <FaCamera className="mx-auto text-2xl mb-1 opacity-70" />
                    <span>Tap to Capture</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-sm border border-gray-200 flex-shrink-0">
                      <img src={imagePreview} alt="Scrap preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* CONFIRM BUTTON */}
              <div className="pt-2 pb-6">
                <button onClick={handleConfirmTrade} disabled={isLoading || isSubmitting || isSchedulingDisabled} className="w-full py-4 bg-green-600 text-white rounded-2xl font-black text-lg shadow-lg hover:bg-green-700 active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none">
                  {isSubmitting ? 'Scheduling Pickup...' : 'Confirm & Book Pickup'}
                </button>
              </div>

            </div>
          )}
        </main>

        <footer className="flex-none w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <Link to="/hello" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaHome className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaTasks className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Orders</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaUserAlt className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Profile</span></Link>
        </footer>

      </div>
    </>
  );
};

export default TradePage;