import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaTasks, FaUserAlt, FaMapMarkerAlt, FaCamera, FaCrosshairs, FaCheckCircle, FaInfoCircle, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import { db } from '../firebase';
import { ref, update, push, onValue, get } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import AppLayout from './layout/AppLayout';

// Approximate service-city centers for the soft out-of-area warning. Cities
// not listed here are simply not distance-checked.
const CITY_COORDS = {
  arakkonam: { lat: 13.0778, lng: 79.6714 },
  tiruttani: { lat: 13.1746, lng: 79.6117 },
  sholinghur: { lat: 13.1176, lng: 79.42 },
};
const SERVICE_RADIUS_KM = 25;

const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const STR = {
  English: {
    cartEmpty: "Your cart is empty.",
    activePickup: "You already have an active pickup.",
    gpsNotSupported: "GPS not supported by your browser.",
    findingLocation: "Finding exact location...",
    addressMapped: "Exact address mapped!",
    gpsCapturedToast: "GPS Captured! Add door number below.",
    gpsDenied: "GPS Denied. Please type your address manually.",
    weakSignal: "Weak signal. Retrying GPS (Attempt {attempts}/3)...",
    gpsFailed: "Could not auto-detect after 3 attempts. Please type your address manually.",
    imageError: "Could not process that image. Please try another photo.",
    fillDetails: "Please fill in your name, email, and address.",
    clickDetect: "Please click 'Detect Exact Location' or choose manual entry.",
    detailedAddressError: "Please provide a detailed address including Door No, Street, and Landmark.",
    scheduledSuccess: "✅ Pickup Scheduled Successfully!",
    scheduleFailed: "Scheduling failed. Please check connection.",
    secureCheckout: "Secure Checkout",
    stepInfo: "Step 2 of 2 · Confirm pickup details",
    contactDetails: "Contact Details",
    fullName: "Full Name",
    emailPlaceholder: "Email Address (For Bill)",
    noNumber: "No number linked",
    pickupLocation: "Pickup Location",
    tryGpsAgain: "Try GPS Again",
    gpsCaptured: "GPS Captured",
    agentNavigate: "Agent will navigate here",
    detectLocation: "Detect Exact Location",
    enterManually: "Or enter address manually",
    manualMode: "Manual Mode",
    provideDetailed: "Please provide a detailed address",
    manualAddressPh: "Enter full House No, Street, Landmark, and Pincode...",
    addDoorPh: "Add Door No, Floor, or Landmark...",
    addPhoto: "Add Photo",
    optional: "Optional",
    tapToCapture: "Tap to Capture",
    noImage: "No Image",
    scrapSummary: "Scrap Summary",
    estValue: "Est. Value",
    finalValue: "Final value calculated upon weighing.",
    scheduling: "Scheduling Pickup...",
    confirmBook: "Confirm & Book Pickup"
  },
  Tamil: {
    cartEmpty: "உங்கள் கார்ட் காலியாக உள்ளது.",
    activePickup: "உங்களுக்கு ஏற்கனவே ஒரு பிக்-அப் திட்டமிடப்பட்டுள்ளது.",
    gpsNotSupported: "உங்கள் உலாவியில் GPS ஆதரவு இல்லை.",
    findingLocation: "துல்லியமான இருப்பிடத்தைக் கண்டறிகிறது...",
    addressMapped: "துல்லியமான முகவரி கண்டறியப்பட்டது!",
    gpsCapturedToast: "GPS பதிவானது! கீழே கதவு எண்ணைச் சேர்க்கவும்.",
    gpsDenied: "GPS அனுமதி மறுக்கப்பட்டது. உங்கள் முகவரியை நேரடியாக உள்ளிடவும்.",
    weakSignal: "சிக்னல் பலவீனமாக உள்ளது. GPS மீண்டும் முயற்சிக்கிறது (முயற்சி {attempts}/3)...",
    gpsFailed: "3 முயற்சிகளுக்குப் பிறகும் கண்டறிய முடியவில்லை. உங்கள் முகவரியை நேரடியாக உள்ளிடவும்.",
    imageError: "அந்தப் படத்தைச் செயலாக்க முடியவில்லை. வேறு புகைப்படத்தை முயற்சிக்கவும்.",
    fillDetails: "உங்கள் பெயர், மின்னஞ்சல் மற்றும் முகவரியை நிரப்பவும்.",
    clickDetect: "'துல்லியமான இருப்பிடத்தைக் கண்டறி' என்பதை அழுத்தவும் அல்லது முகவரியை நேரடியாக உள்ளிடவும்.",
    detailedAddressError: "கதவு எண், தெரு மற்றும் அடையாள இடம் உட்பட விரிவான முகவரியை வழங்கவும்.",
    scheduledSuccess: "✅ பிக்-அப் வெற்றிகரமாக பதிவு செய்யப்பட்டது!",
    scheduleFailed: "பதிவு செய்ய முடியவில்லை. இணைய இணைப்பைச் சரிபார்க்கவும்.",
    secureCheckout: "பாதுகாப்பான செக்அவுட்",
    stepInfo: "படி 2 / 2 · பிக்-அப் விவரங்களை உறுதிப்படுத்தவும்",
    contactDetails: "தொடர்பு விவரங்கள்",
    fullName: "முழு பெயர்",
    emailPlaceholder: "மின்னஞ்சல் முகவரி (பில்லுக்காக)",
    noNumber: "எண் இணைக்கப்படவில்லை",
    pickupLocation: "பிக்-அப் இடம்",
    tryGpsAgain: "GPS மீண்டும் முயற்சிக்கவும்",
    gpsCaptured: "GPS பதிவானது",
    agentNavigate: "எங்கள் நபர் இங்கு வருவார்",
    detectLocation: "துல்லியமான இருப்பிடத்தைக் கண்டறி",
    enterManually: "அல்லது முகவரியை நேரடியாக உள்ளிடவும்",
    manualMode: "நேரடி முகவரி முறை",
    provideDetailed: "விரிவான முகவரியை வழங்கவும்",
    manualAddressPh: "வீட்டு எண், தெரு, அடையாள இடம் மற்றும் பின்கோடு முழுவதையும் உள்ளிடவும்...",
    addDoorPh: "கதவு எண், மாடி அல்லது அடையாள இடத்தைச் சேர்க்கவும்...",
    addPhoto: "புகைப்படம் சேர்க்கவும்",
    optional: "விருப்பத்தேர்வு",
    tapToCapture: "படமெடுக்க தட்டவும்",
    noImage: "படம் இல்லை",
    scrapSummary: "ஸ்கிராப் சுருக்கம்",
    estValue: "மதிப்பிடப்பட்ட மதிப்பு",
    finalValue: "எடை போட்ட பிறகு இறுதி மதிப்பு கணக்கிடப்படும்.",
    scheduling: "பிக்-அப் பதிவாகிறது...",
    confirmBook: "உறுதிசெய்து பிக்-அப் பதிவு செய்யவும்"
  }
};

const CheckoutSkeleton = () => (
  <div className="space-y-4 animate-pulse mt-2">
    <div className="h-32 bg-white rounded-3xl w-full border border-slate-100"></div>
    <div className="h-48 bg-white rounded-3xl w-full border border-slate-100"></div>
    <div className="h-32 bg-white rounded-3xl w-full border border-slate-100"></div>
  </div>
);

const TradePage = () => {
  const [entries, setEntries] = useState([]);
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [exactCoords, setExactCoords] = useState(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const [manualMode, setManualMode] = useState(false);

  const [userId, setUserId] = useState(null);
  const [tradeImage, setTradeImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);

  const navigate = useNavigate();
  const { userMobile, language, location: selectedCity } = useSettings();
  const [outOfArea, setOutOfArea] = useState(null); // { km, city } — hard stop, booking not allowed
  const [areaName, setAreaName] = useState('');
  const [areaRequestState, setAreaRequestState] = useState('idle'); // idle | sending | sent

  // A fresh GPS fix or switching to manual entry clears the out-of-area stop.
  useEffect(() => {
    setOutOfArea(null);
    setAreaRequestState('idle');
  }, [exactCoords, manualMode]);

  // Out-of-area: capture the locality as an expansion request instead of booking.
  const handleAreaRequest = async () => {
    const area = areaName.trim();
    if (!area) return toast.error('Please enter your area name.');
    setAreaRequestState('sending');
    try {
      await push(ref(db, 'cityRequests'), {
        city: area,
        phone: userMobile || '',
        name: userName || '',
        address: address || '',
        distanceKm: outOfArea?.km || null,
        source: 'booking',
        requestedAt: new Date().toISOString(),
      });
      setAreaRequestState('sent');
    } catch {
      setAreaRequestState('idle');
      toast.error('Could not send. Please try again.');
    }
  };
  const auth = getAuth();
  const initialCheckRef = useRef(true);

  const t = STR.English; // UI pinned to English — only item names follow the language toggle
  const displayName = (entry) => (language === 'Tamil' && entry.nameTamil) ? entry.nameTamil : (entry.name || entry.text);

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
    const localEntries = localStorage.getItem('wasteEntries');
    if (localEntries) {
      try {
        const parsedEntries = JSON.parse(localEntries);
        if (parsedEntries.length === 0) {
          toast.error(t.cartEmpty);
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
            // Recovery: a leftover lowercase `status === 'active'` means a past
            // order was completed even if capital Status was left on On-Schedule.
            const effectiveStatus = userData.status === 'active' ? 'Active' : (userData.Status || 'Active');
            setUserStatus(effectiveStatus);

            if (initialCheckRef.current) {
              if (effectiveStatus === 'Pending' || effectiveStatus === 'On-Schedule') {
                toast.error(t.activePickup);
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
    if (!navigator.geolocation) {
      toast.error(t.gpsNotSupported);
      return setManualMode(true);
    }

    setIsDetectingLocation(true);
    toast.loading(t.findingLocation, { id: 'gps' });

    let attempts = 0;

    const handleSuccess = async (position) => {
      const { latitude, longitude } = position.coords;
      setExactCoords({ lat: latitude, lng: longitude });
      setManualMode(false);

      const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
      if (GOOGLE_API_KEY) {
        try {
          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_API_KEY}`);
          const data = await res.json();
          if (data.status === "OK" && data.results[0]) {
            setAddress(data.results[0].formatted_address);
            toast.success(t.addressMapped, { id: 'gps' });
          }
        } catch { /* reverse-geocode is best-effort; coords already captured */ }
      } else {
        toast.success(t.gpsCapturedToast, { id: 'gps' });
      }
      setIsDetectingLocation(false);
    };

    const handleError = (error) => {
      console.warn("GPS Error:", error);

      if (error.code === 1) {
        toast.error(t.gpsDenied, { id: 'gps', duration: 4000 });
        setManualMode(true);
        setIsDetectingLocation(false);
        return;
      }

      if (attempts < 3) {
        attempts++;
        toast.loading(t.weakSignal.replace('{attempts}', attempts), { id: 'gps' });
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          handleError,
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      } else {
        toast.error(t.gpsFailed, { id: 'gps', duration: 5000 });
        setManualMode(true);
        setIsDetectingLocation(false);
      }
    };

    attempts++;
    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Resize + compress the photo BEFORE storing it. A raw phone photo as base64
  // is several MB; written onto every entry and loaded whole by the vendor it
  // caused low-memory crashes. This shrinks it to ~1024px JPEG (~50-150 KB).
  const compressImage = (file, maxDim = 1024, quality = 0.7) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxDim) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else if (height >= width && height > maxDim) { width = Math.round((width * maxDim) / height); height = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file); // already a base64 JPEG string
      setTradeImage(compressed);
      setImagePreview(compressed);
    } catch {
      toast.error(t.imageError);
    }
  };

  const handleConfirmTrade = async () => {
    if (!userName.trim() || !email.trim() || !address.trim()) {
      return toast.error(t.fillDetails);
    }

    if (!exactCoords && !manualMode) {
      return toast.error(t.clickDetect);
    }
    if (manualMode && address.trim().length < 15) {
      return toast.error(t.detailedAddressError);
    }

    // Hard out-of-area stop: when GPS is outside the service radius we never
    // book — no order, no user-status change. The customer instead leaves an
    // area request that shows up grouped on the admin dashboard.
    const cityCenter = exactCoords && CITY_COORDS[(selectedCity || '').trim().toLowerCase()];
    if (cityCenter) {
      const km = haversineKm(exactCoords, cityCenter);
      if (km > SERVICE_RADIUS_KM) {
        setOutOfArea({ km: Math.round(km), city: selectedCity });
        return;
      }
      if (outOfArea) setOutOfArea(null);
    }

    if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

    setIsSubmitting(true);

    try {
      // tradeImage is already a compressed base64 JPEG from handleImageChange.
      const imageBase64 = tradeImage || null;

      const mapLink = exactCoords
        ? `https://maps.google.com/maps?q=${exactCoords.lat},${exactCoords.lng}`
        : `https://maps.google.com/maps?q=${encodeURIComponent(address)}`;

      const userRef = ref(db, `users/${userId}`);
      const userSnapshot = await get(userRef);
      const userData = userSnapshot.exists() ? userSnapshot.val() : {};

      const validPhone = userData.phone || userData.phoneNumber || userMobile || "";

      // 1. Update User Node FIRST
      await update(userRef, {
        phone: validPhone,
        name: userName,
        email: email,
        address: address,
        lastLat: exactCoords?.lat || null,
        lastLng: exactCoords?.lng || null,
        Status: "Pending"
      });

      // 2. Push waste entries securely one by one
      const promises = entries.map(entry => {
        return push(ref(db, 'wasteEntries'), {
          name: entry.name || entry.text,
          address: address,
          exactLat: exactCoords?.lat || null,
          exactLng: exactCoords?.lng || null,
          mapUrl: mapLink,
          mobile: validPhone,
          total: (entry.quantity * parseFloat(entry.rate || entry.minRate || 0)).toFixed(2),
          quantity: entry.quantity,
          unit: entry.unit,
          rate: entry.rate || entry.minRate || 0,
          category: entry.category || 'others',
          isAssigned: false,
          userID: userId,
          image: imageBase64,
          timestamp: new Date().toISOString(),
        });
      });

      await Promise.all(promises);

      // 🚨 Email the admin that a pickup was scheduled (fire-and-forget).
      fetch('https://trade2cart.trade.admin.trade2cart.in/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scheduled',
          customerName: userName,
          customerPhone: validPhone,
          address,
          items: entries.map(e => `${e.name || e.text} (${e.quantity} ${e.unit})`).join(', '),
        }),
      })
        .then(res => { if (!res.ok) throw new Error('Server not ready'); return res.json(); })
        .then(data => console.log('Schedule email triggered!', data))
        .catch(() => console.log('Schedule email triggered in background.'));

      toast.success(t.scheduledSuccess);
      localStorage.removeItem('wasteEntries');
      navigate('/task');

    } catch (error) {
      console.error("Firebase Submission Error:", error);
      toast.error(t.scheduleFailed);
    } finally {
      setIsSubmitting(false);
    }
  };

  const estLabel = minTotal === maxTotal ? `₹${minTotal.toFixed(2)}` : `₹${minTotal.toFixed(0)} - ₹${maxTotal.toFixed(0)}`;

  return (
    <AppLayout active="orders" maxWidth="max-w-5xl" contentClassName="nice-scrollbar">
      <SEO title="Confirm Trade" description="Review items and confirm your address." />

      <div className="px-4 sm:px-6 lg:px-10 pt-5 lg:pt-8">

        {/* PAGE HEAD */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/hello')} className="w-11 h-11 rounded-2xl bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 active:scale-95 transition">
            <FaArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight leading-none">{t.secureCheckout}</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">{t.stepInfo}</p>
          </div>
        </div>

        {isLoading ? <CheckoutSkeleton /> : (
          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-7 lg:items-start">

            {/* LEFT: FORM */}
            <div className="space-y-4">

              {/* CONTACT DETAILS */}
              <div className="t2c-card p-5 lg:p-6">
                <h2 className="text-[13px] font-black uppercase tracking-widest mb-4 text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><FaUserAlt size={12} /></div>
                  {t.contactDetails}
                </h2>
                <div className="space-y-3">
                  <div className="relative">
                    <FaUserAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder={t.fullName} value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="relative">
                    <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-bold text-slate-700 transition-all" />
                  </div>
                  <div className="w-full pl-10 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-500 flex items-center relative cursor-not-allowed">
                    <span className="absolute left-4 text-slate-400">📱</span> {userMobile || t.noNumber}
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div className="t2c-card p-5 lg:p-6 overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center"><FaMapMarkerAlt size={12} /></div>
                    {t.pickupLocation}
                  </h2>
                  {manualMode && !exactCoords && (
                    <button onClick={() => { setManualMode(false); handleDetectLocation(); }} className="text-[10px] font-black text-slate-600 uppercase tracking-widest hover:underline">
                      {t.tryGpsAgain}
                    </button>
                  )}
                </div>

                {exactCoords ? (
                  <div className="mb-4 animate-fade-in-up">
                    <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 mb-3">
                      <iframe
                        title="pickup-map"
                        width="100%" height="100%" style={{ border: 0 }} loading="lazy" allowFullScreen
                        src={`https://maps.google.com/maps?q=${exactCoords.lat},${exactCoords.lng}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                      ></iframe>
                    </div>
                    <div className="bg-brand-50 border border-brand-100 p-3 rounded-xl flex items-center gap-3">
                      <FaCheckCircle className="text-brand-600 text-xl flex-shrink-0" />
                      <div>
                        <p className="font-black text-brand-900 text-sm leading-tight">{t.gpsCaptured}</p>
                        <p className="text-[10px] uppercase tracking-wider font-black text-brand-600 mt-0.5">{t.agentNavigate}</p>
                      </div>
                    </div>
                  </div>
                ) : !manualMode ? (
                  <div className="mb-4">
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[15px] flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md"
                    >
                      {isDetectingLocation ? <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div> : <><FaCrosshairs /> {t.detectLocation}</>}
                    </button>
                    <p className="text-center mt-3">
                      <button onClick={() => setManualMode(true)} className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-slate-800 transition-colors underline decoration-slate-300 underline-offset-4">
                        {t.enterManually}
                      </button>
                    </p>
                  </div>
                ) : (
                  <div className="mb-4 bg-accent-50 border border-accent-100 p-3 rounded-xl flex items-center gap-3 animate-fade-in-down">
                    <FaInfoCircle className="text-accent-500 text-xl flex-shrink-0" />
                    <div>
                      <p className="font-black text-accent-700 text-sm leading-tight">{t.manualMode}</p>
                      <p className="text-[10px] uppercase tracking-wider font-black text-accent-600 mt-0.5">{t.provideDetailed}</p>
                    </div>
                  </div>
                )}

                <textarea
                  placeholder={manualMode ? t.manualAddressPh : t.addDoorPh}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={manualMode ? 3 : 2}
                  className={`w-full p-4 bg-slate-50 border rounded-2xl focus:ring-2 focus:ring-brand-500 outline-none font-bold text-slate-700 transition-all resize-none ${manualMode ? 'border-accent-300 bg-accent-50/40' : 'border-slate-200'}`}
                ></textarea>
              </div>

              {/* PHOTO */}
              <div className="t2c-card p-5 lg:p-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-[13px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-accent-50 text-accent-600 flex items-center justify-center"><FaCamera size={12} /></div>
                    {t.addPhoto}
                  </h2>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{t.optional}</span>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex-1 cursor-pointer bg-accent-50/50 border-2 border-dashed border-accent-200 text-accent-700 font-black text-sm text-center py-5 rounded-2xl hover:bg-accent-50 transition-colors">
                    <FaCamera className="mx-auto text-2xl mb-1 opacity-70" />
                    <span>{t.tapToCapture}</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
                  </label>
                  {imagePreview && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0">
                      <img src={imagePreview} alt="Scrap preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT: SUMMARY (sticky on desktop) */}
            <div className="mt-4 lg:mt-0 lg:sticky lg:top-6">
              <div className="t2c-card overflow-hidden">
                <h2 className="text-[13px] font-black uppercase tracking-widest px-5 lg:px-6 pt-5 pb-3 text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center"><FaTasks size={12} /></div>
                  {t.scrapSummary}
                </h2>
                <div className="px-4 lg:px-5 space-y-2.5 max-h-72 overflow-y-auto nice-scrollbar">
                  {entries.map((entry, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {entry.imageUrl || entry.image || entry.icon || entry.imgUrl ? (
                          <img src={entry.imageUrl || entry.image || entry.icon || entry.imgUrl} alt={displayName(entry)} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400">{t.noImage}</span>
                        )}
                      </div>
                      <div className="flex flex-col justify-center min-w-0">
                        <p className="font-black text-slate-900 text-sm capitalize leading-tight truncate">{displayName(entry)}</p>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{entry.quantity} {entry.unit}</p>
                        <p className="text-sm font-black text-brand-600 mt-0.5">
                          {entry.minRate ? `₹${entry.minRate}-₹${entry.maxRate}` : `₹${entry.rate}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 bg-brand-50/60 border-t border-slate-100 p-5 lg:p-6">
                  <div className="flex justify-between items-center font-black text-xl mb-1">
                    <p className="text-slate-800">{t.estValue}</p>
                    <p className="text-brand-600">{estLabel}</p>
                  </div>
                  <p className="text-[10px] font-black text-slate-500 flex items-center gap-1 uppercase tracking-widest"><FaInfoCircle /> {t.finalValue}</p>
                </div>
              </div>

              {/* CONFIRM */}
              {outOfArea && (
                <div className="mt-4 p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl text-center">
                  {areaRequestState === 'sent' ? (
                    <>
                      <span className="text-3xl">🎉</span>
                      <p className="text-sm font-black text-amber-900 mt-2">Request received!</p>
                      <p className="text-xs font-bold text-amber-700 mt-1">We'll notify you as soon as Trade2Cart launches in your area.</p>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl">😔</span>
                      <p className="text-sm font-black text-amber-900 mt-2">We haven't reached your locality yet</p>
                      <p className="text-xs font-bold text-amber-700 mt-1 mb-3">You're ~{outOfArea.km} km from {outOfArea.city}, so we can't schedule this pickup. Tell us your area and we'll notify you when we launch there.</p>
                      <input
                        type="text"
                        value={areaName}
                        onChange={(e) => setAreaName(e.target.value)}
                        placeholder="Your area name (e.g. Vellore)"
                        className="w-full mb-3 px-4 py-3 bg-white border-2 border-amber-200 rounded-xl focus:border-brand-500 focus:ring-0 outline-none font-bold text-slate-800 text-sm"
                      />
                      <button
                        onClick={handleAreaRequest}
                        disabled={areaRequestState === 'sending'}
                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-sm hover:bg-brand-700 active:scale-[0.98] transition-all disabled:bg-slate-300"
                      >
                        {areaRequestState === 'sending' ? 'Sending…' : 'Request My Area'}
                      </button>
                    </>
                  )}
                </div>
              )}
              <button onClick={handleConfirmTrade} disabled={isLoading || isSubmitting || isSchedulingDisabled || !!outOfArea} className="mt-4 w-full py-4 bg-brand-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-brand-600/25 hover:bg-brand-700 active:scale-[0.98] transition-all disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none">
                {isSubmitting ? t.scheduling : t.confirmBook}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TradePage;
