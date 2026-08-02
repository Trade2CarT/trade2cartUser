import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { FaShoppingCart, FaDownload, FaImage, FaMapMarkerAlt, FaLeaf, FaArrowRight, FaCamera } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import SEO from './SEO';
import AppLayout from './layout/AppLayout';
import logo from '../assets/images/logo.PNG';

const categoryColors = {
  'paper': 'bg-blue-50 border-blue-200 text-blue-700',
  'plastic': 'bg-amber-50 border-amber-200 text-amber-700',
  'metal': 'bg-slate-100 border-slate-300 text-slate-700',
  'e-waste': 'bg-purple-50 border-purple-200 text-purple-700',
  'others': 'bg-brand-50 border-brand-200 text-brand-700'
};

// Maps a generic object the on-device model can detect to a material keyword.
const DETECTION_TO_KEYWORD = {
  bottle: 'plastic', 'wine glass': 'plastic', cup: 'plastic',
  book: 'paper',
  knife: 'metal', fork: 'metal', spoon: 'metal', scissors: 'metal', sink: 'metal',
  'cell phone': 'electronic', laptop: 'electronic', keyboard: 'electronic',
  mouse: 'electronic', tv: 'electronic', remote: 'electronic',
  microwave: 'electronic', toaster: 'electronic', oven: 'electronic',
  refrigerator: 'electronic', clock: 'electronic', 'hair drier': 'electronic',
  bowl: 'glass', vase: 'glass',
};

// Each material keyword expands to the many free-text names a catalog category
// (or item name) might actually use. Matching on any of these — not just the bare
// keyword — is what lets "metal" find an "Iron"/"Aluminium" category, etc.
const KEYWORD_SYNONYMS = {
  plastic: ['plastic', 'pet', 'bottle', 'polythene'],
  paper: ['paper', 'cardboard', 'carton', 'newspaper', 'book', 'magazine'],
  metal: ['metal', 'iron', 'steel', 'aluminium', 'aluminum', 'tin', 'copper', 'brass'],
  electronic: ['electronic', 'e-waste', 'ewaste', 'e waste', 'gadget', 'appliance', 'battery'],
  glass: ['glass'],
};

// UI strings (English / Tamil) — follows the LoginPage pattern.
// Dynamic DB values (category names, item names, city names) are NOT translated
// here; items may carry their own optional `nameTamil` field.
const STR = {
  English: {
    pickupCity: "Pickup City",
    select: "Select",
    welcomeBack: "Welcome back",
    hello: "Hello",
    there: "there",
    heroSub: "Pick the scrap you want to sell — a rough amount is fine, we weigh it at pickup.",
    eco: "Eco",
    rewards: "Rewards",
    installTitle: "Install the Trade2Cart App",
    installSub: "Faster · Works offline",
    get: "Get",
    scanning: "Scanning your scrap…",
    snapScrap: "📷 Snap your scrap",
    scanningSub: "Reading the photo on your phone",
    scanSub: "We'll fill the cart — then just adjust the amount",
    all: "All",
    little: "Little",
    medium: "Medium",
    aLot: "A lot",
    scanSpotted: "Spotted {names} — added a starting guess, adjust below.",
    scanNoMatch: "Saw {names} but no catalog match — add manually.",
    scanNothing: "Couldn't spot catalog items — add them manually.",
    scanFailed: "Scan failed. Please add items manually.",
    noItemsTitle: "No items available yet",
    updatingPrices: "We're updating prices for {city}. Please check back soon!",
    yourCart: "Your Cart",
    itemSelectedOne: "1 item selected",
    itemsSelected: "{n} items selected",
    emptyCart: "Add scrap items to start your pickup.",
    estimatedValue: "Estimated value",
    proceedCheckout: "Proceed to Checkout",
    finalValueNote: "Final value confirmed on weighing",
    inCartOne: "1 item in cart",
    inCartMany: "{n} items in cart",
    est: "Est.",
    checkout: "Checkout",
  },
  Tamil: {
    pickupCity: "பிக்கப் நகரம்",
    select: "தேர்வு செய்க",
    welcomeBack: "மீண்டும் வருக",
    hello: "வணக்கம்",
    there: "நண்பரே",
    heroSub: "விற்க வேண்டிய பழைய பொருட்களைத் தேர்வு செய்யுங்கள் — தோராயமான அளவு போதும், பிக்கப்பின் போது நாங்கள் எடை போடுவோம்.",
    eco: "பசுமை",
    rewards: "பரிசுகள்",
    installTitle: "Trade2Cart ஆப்பை நிறுவுங்கள்",
    installSub: "வேகமானது · இணையம் இல்லாமலும் வேலை செய்யும்",
    get: "பெறுக",
    scanning: "உங்கள் பொருட்களை ஸ்கேன் செய்கிறது…",
    snapScrap: "📷 பொருட்களை போட்டோ எடுங்கள்",
    scanningSub: "உங்கள் போனிலேயே போட்டோவைப் படிக்கிறது",
    scanSub: "கார்ட்டை நாங்கள் நிரப்புவோம் — பிறகு அளவை மட்டும் மாற்றுங்கள்",
    all: "அனைத்தும்",
    little: "கொஞ்சம்",
    medium: "நடுத்தரம்",
    aLot: "நிறைய",
    scanSpotted: "{names} கண்டறிந்தோம் — தோராயமாகச் சேர்த்துள்ளோம், கீழே சரி செய்யவும்.",
    scanNoMatch: "{names} தெரிந்தது, ஆனால் பட்டியலில் பொருத்தம் இல்லை — நீங்களே சேர்க்கவும்.",
    scanNothing: "பட்டியல் பொருட்களைக் கண்டறிய முடியவில்லை — நீங்களே சேர்க்கவும்.",
    scanFailed: "ஸ்கேன் நடக்கவில்லை. பொருட்களை நீங்களே சேர்க்கவும்.",
    noItemsTitle: "இன்னும் பொருட்கள் எதுவும் இல்லை",
    updatingPrices: "{city} பகுதிக்கான விலைகளைப் புதுப்பித்துக் கொண்டிருக்கிறோம். சிறிது நேரம் கழித்து மீண்டும் பாருங்கள்!",
    yourCart: "உங்கள் கார்ட்",
    itemSelectedOne: "1 பொருள் தேர்வு செய்யப்பட்டுள்ளது",
    itemsSelected: "{n} பொருட்கள் தேர்வு செய்யப்பட்டுள்ளன",
    emptyCart: "பிக்கப் தொடங்க பழைய பொருட்களைச் சேர்க்கவும்.",
    estimatedValue: "தோராயமான மதிப்பு",
    proceedCheckout: "செக்அவுட் செய்யத் தொடரவும்",
    finalValueNote: "எடை போட்ட பின் இறுதி விலை உறுதியாகும்",
    inCartOne: "கார்ட்டில் 1 பொருள்",
    inCartMany: "கார்ட்டில் {n} பொருட்கள்",
    est: "தோராயம்",
    checkout: "செக்அவுட்",
  },
};

const SkeletonCard = () => (
  <div className="t2c-card p-3 flex flex-col justify-between h-56 animate-pulse">
    <div className="w-full h-28 bg-slate-100 rounded-2xl mb-3"></div>
    <div className="space-y-2">
      <div className="w-3/4 h-4 bg-slate-200 rounded-md"></div>
      <div className="w-1/2 h-3 bg-slate-200 rounded-md"></div>
    </div>
    <div className="w-full h-10 bg-slate-100 rounded-xl mt-3"></div>
  </div>
);

const HelloUser = () => {
  const [userName, setUserName] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState({});

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  const [scanning, setScanning] = useState(false);
  const modelRef = useRef(null);      // cached tf detector (loaded once)
  const scanInputRef = useRef(null);  // hidden file input for the camera

  const navigate = useNavigate();

  // Now relies on the persistent LocalStorage from SettingsContext
  const { location, language, setLanguage } = useSettings();

  // Compact EN | த pill — switches ONLY item-name display, not the UI language.
  const LangToggle = () => (
    <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
      {[{ code: 'English', label: 'EN' }, { code: 'Tamil', label: 'த' }].map(({ code, label }) => (
        <button
          key={code}
          onClick={() => setLanguage(code)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all ${language === code ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
  const auth = getAuth();

  const t = STR.English; // UI pinned to English — only item names follow the language toggle
  // Rough-amount bucket labels, translated for display only (kg values unchanged).
  // Show the Tamil item name when available and the app is in Tamil.
  const displayName = (item) => (language === 'Tamil' && item.nameTamil) ? item.nameTamil : item.name;

  useEffect(() => {
    // Safety check: if no location is set at all, send them to pick one
    if (!location) {
      navigate('/location');
    }
  }, [location, navigate]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserName(userData.name ? userData.name.split(' ')[0] : 'User');
          }
        });
      } else {
        setUserName('User');
      }
    });
    return () => unsubscribeAuth();
  }, [auth]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    if (!location) return; // Don't fetch if location isn't set yet

    const itemsRef = ref(db, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        const locationItems = fetchedItems.filter(item =>
          item.location && item.location.toLowerCase() === location.toLowerCase()
        );

        setItems(locationItems);
      } else {
        setItems([]);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [location]);

  useEffect(() => {
    if (items.length > 0) {
      const savedCart = localStorage.getItem('wasteEntries');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        const initialCart = {};
        parsedCart.forEach(item => {
          const originalItem = items.find(i => i.name === (item.text || item.name));
          if (originalItem) {
            initialCart[originalItem.id] = parseFloat(item.quantity);
          }
        });
        setCart(initialCart);
      }
    }
  }, [items]);

  // Adjust quantity by ±1 in the item's own unit; 0 removes it from the cart.
  const stepQty = (id, delta) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCart(prev => {
      const updated = { ...prev };
      const next = Math.max(0, Math.min(99, (prev[id] || 0) + delta));
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  // [−] qty unit [+] control shared by the item cards and the desktop cart.
  const QtyStepper = ({ item, qty, compact = false }) => (
    qty > 0 ? (
      <div className={`flex items-center justify-between bg-white border-2 border-brand-500 rounded-xl overflow-hidden ${compact ? 'h-8' : 'h-10 sm:h-11'}`}>
        <button onClick={() => stepQty(item.id, -1)} className={`${compact ? 'w-8' : 'w-10 sm:w-11'} h-full flex items-center justify-center font-black text-brand-600 hover:bg-brand-50 active:scale-90 transition`}>−</button>
        <span className={`font-black text-slate-800 ${compact ? 'text-[11px]' : 'text-sm'}`}>{qty} <span className="text-slate-400 text-[9px] font-bold uppercase">{item.unit || 'kg'}</span></span>
        <button onClick={() => stepQty(item.id, 1)} className={`${compact ? 'w-8' : 'w-10 sm:w-11'} h-full flex items-center justify-center font-black text-brand-600 hover:bg-brand-50 active:scale-90 transition`}>+</button>
      </div>
    ) : (
      <button
        onClick={() => stepQty(item.id, 1)}
        className={`w-full ${compact ? 'h-8 text-[10px]' : 'h-10 sm:h-11 text-sm'} rounded-xl font-black bg-white border-2 border-slate-200 text-brand-600 hover:border-brand-400 active:scale-95 transition flex items-center justify-center gap-1`}
      >
        {t.add || 'Add'} +
      </button>
    )
  );

  // On-device scrap scan: run a pre-trained object detector in the browser,
  // map detected objects to catalog categories, and seed the cart. No API key,
  // no server — the model weights download once from Google's CDN and cache.
  const handleScan = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file(s)
    if (files.length === 0) return;

    setScanning(true);
    try {
      // Lazy-load the model libraries only when the user actually scans.
      const [cocoSsd] = await Promise.all([
        import('@tensorflow-models/coco-ssd'),
        import('@tensorflow/tfjs'),
      ]);
      if (!modelRef.current) {
        modelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
      }

      // Run detection on every selected image and pool the results, so one tap
      // can cover plastic, metal, etc. across several photos.
      const predictions = [];
      for (const file of files) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        try {
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
          });
          const perImage = await modelRef.current.detect(img);
          predictions.push(...perImage);
        } catch {
          // Skip an unreadable image but keep processing the rest.
        } finally {
          URL.revokeObjectURL(url);
        }
      }
      // Diagnostic: what the detector actually saw (open DevTools console to read).
      console.log('Scan detections:', predictions.map(p => `${p.class} ${(p.score * 100).toFixed(0)}%`));

      // Which material keywords did we spot? (lowered threshold — scrap photos are noisy)
      const keywords = new Set(
        predictions
          .filter(p => p.score >= 0.33)
          .map(p => DETECTION_TO_KEYWORD[p.class])
          .filter(Boolean)
      );

      const additions = {};
      const namesAdded = [];
      keywords.forEach(keyword => {
        const synonyms = KEYWORD_SYNONYMS[keyword] || [keyword];
        // Search the WHOLE catalog (not the active tab), matching either the
        // item's category or its name against any synonym of the keyword.
        const match = items.find(it => {
          const hay = `${it.category || ''} ${it.name || ''}`.toLowerCase();
          return synonyms.some(s => hay.includes(s));
        });
        if (match && !cart[match.id] && !additions[match.id]) {
          additions[match.id] = 5; // seed at "Medium"; user adjusts below
          namesAdded.push(displayName(match));
        }
      });

      if (namesAdded.length > 0) {
        setCart(prev => ({ ...prev, ...additions }));
        toast.success(t.scanSpotted.replace('{names}', namesAdded.join(', ')));
      } else {
        // Surface what was detected so a mismatch is diagnosable, not silent.
        const seen = predictions.filter(p => p.score >= 0.33).map(p => p.class);
        toast(
          seen.length
            ? t.scanNoMatch.replace('{names}', [...new Set(seen)].join(', '))
            : t.scanNothing,
          { icon: '🔍' }
        );
      }
    } catch (err) {
      console.error('Scan failed:', err);
      toast.error(t.scanFailed);
    } finally {
      setScanning(false);
    }
  };

  const handleCheckout = () => {
    const entriesToSave = Object.keys(cart).map(id => {
      const item = items.find(i => i.id === id);
      return {
        id: item.id,
        name: item.name, // English name keeps flowing to the backend — do not change
        nameTamil: item.nameTamil || null, // lets the next page show the Tamil name
        imageUrl: item.imageUrl || item.image || item.icon || item.imgUrl || null,
        quantity: cart[id],
        unit: item.unit,
        rate: item.rate || item.minRate,
        minRate: item.minRate || null,
        maxRate: item.maxRate || null,
        total: cart[id] * (item.rate || item.minRate || 0),
        category: item.category || 'others',
        location: location || 'Unknown',
      };
    });
    localStorage.setItem('wasteEntries', JSON.stringify(entriesToSave));
    navigate('/trade');
  };

  const totalCartItems = Object.keys(cart).length;
  const minTotal = Object.keys(cart).reduce((total, id) => {
    const item = items.find(i => i.id === id);
    const rate = parseFloat(item?.minRate) || parseFloat(item?.rate) || 0;
    return total + (cart[id] * rate);
  }, 0);

  const maxTotal = Object.keys(cart).reduce((total, id) => {
    const item = items.find(i => i.id === id);
    const rate = parseFloat(item?.maxRate) || parseFloat(item?.rate) || 0;
    return total + (cart[id] * rate);
  }, 0);

  const estLabel = minTotal === maxTotal ? `₹${minTotal.toFixed(0)}` : `₹${minTotal.toFixed(0)} - ₹${maxTotal.toFixed(0)}`;

  const categories = ['All', ...new Set(items.map(i => i.category || 'others'))];
  const filteredItems = activeCategory === 'All' ? items : items.filter(i => (i.category || 'others') === activeCategory);

  const cartLines = Object.keys(cart).map(id => ({ item: items.find(i => i.id === id), qty: cart[id] })).filter(l => l.item);

  return (
    <AppLayout active="home" maxWidth="max-w-6xl" contentClassName="nice-scrollbar">
      <SEO title="Home - Trade2Cart" description="Sell scrap online instantly." />

      <div className="px-4 sm:px-6 lg:px-10 pt-4 lg:pt-8">

        {/* MOBILE TOP BAR (desktop uses the sidebar instead) */}
        <div className="lg:hidden flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="Trade2Cart" className="w-10 h-10 rounded-xl border border-slate-100 shadow-sm" />
            <button onClick={() => navigate('/location')} className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 active:scale-95 transition">
              <FaMapMarkerAlt className="text-brand-600" size={12} />
              <span className="text-left leading-none">
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{t.pickupCity}</span>
                <span className="block text-sm font-black text-slate-900 mt-0.5">{location || t.select}</span>
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2.5">
            <LangToggle />
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex justify-center items-center text-white font-black shadow-md">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* DESKTOP LANGUAGE TOGGLE (mobile bar is hidden on lg) */}
        <div className="hidden lg:flex justify-end mb-3">
          <LangToggle />
        </div>

        {/* GREETING HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-600 p-5 lg:p-8 shadow-lg shadow-brand-600/20">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute right-16 bottom-[-30px] w-28 h-28 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-brand-50/80 text-xs lg:text-sm font-bold uppercase tracking-widest mb-1">{t.welcomeBack}</p>
              <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tight">{`${t.hello}, ${userName || t.there}! 👋`}</h1>
              <p className="text-brand-50/90 text-sm lg:text-base font-medium mt-2 max-w-md">{t.heroSub}</p>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/15 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <FaLeaf className="text-white text-2xl mb-1" />
              <p className="text-white text-[11px] font-black uppercase tracking-widest text-center leading-tight">{t.eco}<br />{t.rewards}</p>
            </div>
          </div>
        </div>

        {/* INSTALL BANNER */}
        {isInstallable && (
          <div className="mt-4 animate-fade-in-down">
            <div className="bg-slate-900 rounded-2xl p-4 flex justify-between items-center shadow-lg">
              <div className="flex items-center gap-3">
                <img src={logo} alt="App" className="w-10 h-10 rounded-xl object-contain bg-white/10 p-1" />
                <div>
                  <p className="font-extrabold text-sm text-white">{t.installTitle}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t.installSub}</p>
                </div>
              </div>
              <button onClick={handleInstallClick} className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-brand-400 active:scale-95 transition-all">
                <FaDownload /> {t.get}
              </button>
            </div>
          </div>
        )}

        {/* AI SCRAP SCAN — runs entirely on-device (no key, no server, free) */}
        {!isLoading && items.length > 0 && (
          <div className="mt-4">
            <input
              ref={scanInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleScan}
            />
            <button
              onClick={() => scanInputRef.current?.click()}
              disabled={scanning}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md active:scale-[0.99] transition disabled:opacity-70"
            >
              <span className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                {scanning
                  ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <FaCamera size={16} />}
              </span>
              <span className="text-left leading-tight">
                <span className="block font-black text-sm">{scanning ? t.scanning : t.snapScrap}</span>
                <span className="block text-[11px] text-slate-300 font-bold">{scanning ? t.scanningSub : t.scanSub}</span>
              </span>
            </button>
          </div>
        )}

        {/* CATEGORY PILLS */}
        <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:mx-0 mt-5 bg-slate-100/90 backdrop-blur lg:bg-transparent lg:backdrop-blur-0 px-4 sm:px-6 lg:px-0 py-3">
          <div className="flex overflow-x-auto hide-scrollbar gap-2.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full whitespace-nowrap font-bold text-sm transition-all ${activeCategory === cat
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                  }`}
              >
                {cat === 'All' ? t.all : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* TWO-COLUMN: items grid + desktop sticky cart */}
        <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 lg:items-start mt-3">

          {/* ITEMS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 stagger">
            {isLoading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                const catName = item.category ? item.category.toLowerCase() : 'others';
                const colorClass = categoryColors[catName] || categoryColors['others'];
                const showRange = item.minRate && item.maxRate && item.minRate !== item.maxRate;
                const itemImage = item.imageUrl || item.image || item.icon || item.imgUrl;

                return (
                  <div key={item.id} className={`t2c-card p-3 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5 ${qty > 0 ? 'ring-2 ring-brand-500/60' : ''}`}>
                    <span className={`absolute top-0 right-0 px-2.5 py-1 rounded-bl-2xl z-10 text-[8px] font-black uppercase tracking-wider border-b border-l ${colorClass}`}>
                      {catName}
                    </span>

                    <div className="w-full h-28 sm:h-32 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden mb-3">
                      {itemImage ? (
                        <img src={itemImage} alt={item.name} className="w-full h-full object-cover mix-blend-multiply hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <FaImage size={28} className="text-slate-200" />
                      )}
                    </div>

                    <div className="flex flex-col flex-1 px-1">
                      <h3 className="text-sm sm:text-[15px] font-black text-slate-800 leading-tight line-clamp-2">{displayName(item)}</h3>
                      <p className="text-brand-600 font-extrabold mt-1 text-sm sm:text-base">
                        {showRange ? `₹${item.minRate}-₹${item.maxRate}` : `₹${item.rate || item.minRate || 0}`}
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"> / {item.unit || 'kg'}</span>
                      </p>
                    </div>

                    <div className="mt-3 w-full">
                      <QtyStepper item={item} qty={qty} />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 sm:col-span-3 xl:col-span-4 text-center mt-6 p-10 t2c-card">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FaImage className="text-2xl text-slate-300" />
                </div>
                <p className="text-slate-700 font-black text-lg">{t.noItemsTitle}</p>
                <p className="text-slate-400 text-sm mt-2">{t.updatingPrices.replace('{city}', location)}</p>
              </div>
            )}
          </div>

          {/* DESKTOP STICKY CART */}
          <aside className="hidden lg:block sticky top-6">
            <div className="t2c-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><FaShoppingCart size={14} /></span>
                <div>
                  <p className="font-black text-slate-900 leading-none">{t.yourCart}</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">{totalCartItems === 1 ? t.itemSelectedOne : t.itemsSelected.replace('{n}', totalCartItems)}</p>
                </div>
              </div>

              {totalCartItems === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FaShoppingCart className="mx-auto text-3xl text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">{t.emptyCart}</p>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto nice-scrollbar divide-y divide-slate-50">
                    {cartLines.map(({ item, qty }) => {
                      const rate = item.minRate || item.rate || 0;
                      return (
                        <div key={item.id} className="px-5 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-black text-slate-800 truncate capitalize">{displayName(item)}</p>
                              <p className="text-[11px] font-bold text-slate-400">₹{rate} / {item.unit || 'kg'} · {qty} {item.unit || 'kg'}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <QtyStepper item={item} qty={qty} compact />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-4 bg-brand-50/60 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-600">{t.estimatedValue}</span>
                      <span className="text-lg font-black text-brand-700">{estLabel}</span>
                    </div>
                    <button onClick={handleCheckout} className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-600/25">
                      {t.proceedCheckout} <FaArrowRight size={13} />
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-2 uppercase tracking-wide">{t.finalValueNote}</p>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* MOBILE FLOATING CART */}
      {totalCartItems > 0 && (
        <div className="lg:hidden fixed bottom-[calc(76px+env(safe-area-inset-bottom))] left-0 right-0 px-4 z-40 animate-fade-in-up">
          <div onClick={handleCheckout} className="bg-brand-600 text-white p-4 rounded-2xl shadow-2xl shadow-brand-900/30 flex justify-between items-center cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex flex-col">
              <span className="text-[11px] text-brand-200 font-black uppercase tracking-wider">{totalCartItems === 1 ? t.inCartOne : t.inCartMany.replace('{n}', totalCartItems)}</span>
              <span className="text-lg font-black tracking-tight">{`${t.est} ${estLabel}`}</span>
            </div>
            <div className="flex items-center gap-2 bg-white text-brand-700 px-4 py-2.5 rounded-xl font-black shadow-sm">
              {t.checkout} <FaArrowRight size={13} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default HelloUser;
