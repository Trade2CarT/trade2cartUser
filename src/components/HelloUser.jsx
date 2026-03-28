import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaPlus, FaMinus, FaShoppingCart, FaDownload } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../firebase';
import { ref, onValue } from 'firebase/database';
import SEO from './SEO';
import logo from '../assets/images/logo.PNG';

const categoryColors = {
  'paper': 'bg-blue-50 border-blue-200 text-blue-700',
  'plastic': 'bg-orange-50 border-orange-200 text-orange-700',
  'metal': 'bg-gray-100 border-gray-300 text-gray-800',
  'e-waste': 'bg-purple-50 border-purple-200 text-purple-700',
  'others': 'bg-green-50 border-green-200 text-green-700'
};

const SkeletonCard = () => (
  <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between h-36 animate-pulse">
    <div className="w-16 h-4 bg-gray-200 rounded-full mb-3 self-end"></div>
    <div className="space-y-2">
      <div className="w-3/4 h-5 bg-gray-200 rounded-md"></div>
      <div className="w-1/2 h-4 bg-gray-200 rounded-md"></div>
    </div>
    <div className="w-full h-10 bg-gray-200 rounded-xl mt-4"></div>
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

  const navigate = useNavigate();
  const { location } = useSettings();
  const auth = getAuth();

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
    const itemsRef = ref(db, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const fetchedItems = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        const locationItems = fetchedItems.filter(item =>
          item.location && item.location.toLowerCase() === (location?.toLowerCase() || '')
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

  const updateCart = (id, delta) => {
    if (navigator.vibrate) navigator.vibrate(20);
    setCart(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) delete updated[id];
      else updated[id] = next;
      return updated;
    });
  };

  const handleCheckout = () => {
    // ✅ FIX 2: Added imageUrl to the data saved in the cart so TradePage can use it
    const entriesToSave = Object.keys(cart).map(id => {
      const item = items.find(i => i.id === id);
      return {
        id: item.id,
        name: item.name,
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

  const categories = ['All', ...new Set(items.map(i => i.category || 'others'))];
  const filteredItems = activeCategory === 'All' ? items : items.filter(i => (i.category || 'others') === activeCategory);

  return (
    <>
      <SEO title="Home - Trade2Cart" description="Sell scrap online instantly." />

      <div className="h-[100dvh] bg-gray-50 flex flex-col font-sans overflow-hidden relative">

        <header className="flex-none bg-white shadow-sm z-30 px-5 pt-4 pb-4 rounded-b-3xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Trade2Cart Logo" className="w-10 h-10 rounded-full shadow-sm border border-gray-100" />
              <div onClick={() => navigate('/location')} className="cursor-pointer">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-tight">Location</p>
                <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-1 leading-tight hover:text-green-600 transition-colors">
                  {location || 'Select'} <span className="text-green-500 text-lg">▾</span>
                </h2>
              </div>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex justify-center items-center text-green-700 font-bold shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 shadow-inner border border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 truncate">Hello, {userName}! 👋</h1>
            <p className="text-gray-500 text-sm mt-1">Select scrap items to add to your cart.</p>
          </div>
        </header>

        {isInstallable && (
          <div className="flex-none px-5 pt-4 animate-fade-in-down">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-4 flex justify-between items-center shadow-lg border border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white">
                  <img src={logo} alt="App" className="w-full h-full rounded-full object-contain p-1" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-white">Install Trade2Cart App</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Faster & Smoother</p>
                </div>
              </div>
              <button onClick={handleInstallClick} className="flex items-center gap-1.5 bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-green-400 active:scale-95 transition-all">
                <FaDownload /> Get
              </button>
            </div>
          </div>
        )}

        {/* CATEGORY PILLS */}
        <div className="flex-none flex overflow-x-auto hide-scrollbar gap-3 px-5 py-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full whitespace-nowrap font-bold text-sm transition-all shadow-sm ${activeCategory === cat ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* MIDDLE CONTENT GRID */}
        <main className="flex-1 overflow-y-auto px-5 pb-24">
          <div className="grid grid-cols-2 gap-4">
            {isLoading ? (
              <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
            ) : filteredItems.length > 0 ? (
              filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                const catName = item.category ? item.category.toLowerCase() : 'others';
                const colorClass = categoryColors[catName] || categoryColors['others'];
                const showRange = item.minRate && item.maxRate && item.minRate !== item.maxRate;

                // Derive the best image link securely
                const itemImage = item.imageUrl || item.image || item.icon || item.imgUrl;

                return (
                  <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                    <span className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider border-b border-l ${colorClass}`}>
                      {catName}
                    </span>

                    {/* ✅ FIX 1: Display the Scrap Image directly on the Card */}
                    <div className="mt-5 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 shadow-inner flex items-center justify-center overflow-hidden mb-3">
                        {itemImage ? (
                          <img src={itemImage} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-300">N/A</span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-800 leading-tight">{item.name}</h3>
                      <p className="text-green-600 font-extrabold mt-1 text-sm md:text-base">
                        {showRange ? `₹${item.minRate}-₹${item.maxRate}` : `₹${item.rate || item.minRate || 0}`}
                        <span className="text-gray-400 font-medium text-xs"> / {item.unit || 'kg'}</span>
                      </p>
                    </div>

                    <div className="mt-4 h-10 w-full">
                      {qty === 0 ? (
                        <button onClick={() => updateCart(item.id, 1)} className="w-full h-full bg-white border-2 border-green-500 text-green-600 font-bold rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-1 shadow-sm">
                          <FaPlus size={12} /> ADD
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full h-full bg-green-500 text-white rounded-xl shadow-md overflow-hidden">
                          <button onClick={() => updateCart(item.id, -1)} className="w-1/3 h-full flex items-center justify-center hover:bg-green-600 active:bg-green-700 transition"><FaMinus size={12} /></button>
                          <span className="w-1/3 text-center font-bold text-lg">{qty}</span>
                          <button onClick={() => updateCart(item.id, 1)} className="w-1/3 h-full flex items-center justify-center hover:bg-green-600 active:bg-green-700 transition"><FaPlus size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center mt-10 p-8 bg-white rounded-3xl shadow-sm border border-gray-100">
                <p className="text-gray-500 font-bold text-lg">No items available yet.</p>
                <p className="text-gray-400 text-sm mt-2">We are currently updating prices for {location}. Check back soon!</p>
              </div>
            )}
          </div>
          <div className="col-span-2 h-40"></div>
        </main>

        {/* FLOATING CART */}
        {totalCartItems > 0 && (
          <div className="absolute bottom-[88px] left-0 right-0 px-5 z-40 animate-fade-in-up">
            <div onClick={handleCheckout} className="bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer hover:bg-green-700 transition-colors active:scale-95 border border-green-500">
              <div className="flex flex-col">
                <span className="text-xs text-green-200 font-bold uppercase tracking-wider">{totalCartItems} Items in Bin</span>
                <span className="text-lg font-extrabold tracking-tight">
                  {minTotal === maxTotal ? `Est. ₹${minTotal.toFixed(2)}` : `Est. ₹${minTotal.toFixed(0)} - ₹${maxTotal.toFixed(0)}`}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-xl font-bold shadow-sm">
                Next <FaShoppingCart />
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION */}
        <footer className="flex-none w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
          <Link to="/hello" className="flex flex-col items-center text-green-600 p-2"><FaHome className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Home</span></Link>
          <Link to="/task" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaTasks className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Orders</span></Link>
          <Link to="/account" className="flex flex-col items-center text-gray-400 p-2 hover:text-green-600 transition-colors"><FaUserAlt className="text-2xl mb-1" /><span className="text-[10px] font-bold uppercase tracking-wider">Profile</span></Link>
        </footer>

      </div>

      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </>
  );
};

export default HelloUser;