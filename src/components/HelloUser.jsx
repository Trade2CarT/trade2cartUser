import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaMinus, FaShoppingCart, FaDownload, FaImage, FaMapMarkerAlt, FaLeaf, FaArrowRight } from 'react-icons/fa';
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

  const navigate = useNavigate();

  // Now relies on the persistent LocalStorage from SettingsContext
  const { location } = useSettings();
  const auth = getAuth();

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
                <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">Pickup City</span>
                <span className="block text-sm font-black text-slate-900 mt-0.5">{location || 'Select'}</span>
              </span>
            </button>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex justify-center items-center text-white font-black shadow-md">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* GREETING HERO */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-600 p-5 lg:p-8 shadow-lg shadow-brand-600/20">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="absolute right-16 bottom-[-30px] w-28 h-28 bg-white/10 rounded-full pointer-events-none"></div>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <p className="text-brand-50/80 text-xs lg:text-sm font-bold uppercase tracking-widest mb-1">Welcome back</p>
              <h1 className="text-2xl lg:text-4xl font-black text-white tracking-tight">Hello, {userName || 'there'}! 👋</h1>
              <p className="text-brand-50/90 text-sm lg:text-base font-medium mt-2 max-w-md">Pick the scrap you want to sell — we'll send a verified agent to your door.</p>
            </div>
            <div className="hidden lg:flex flex-col items-center justify-center bg-white/15 rounded-2xl px-6 py-4 backdrop-blur-sm">
              <FaLeaf className="text-white text-2xl mb-1" />
              <p className="text-white text-[11px] font-black uppercase tracking-widest text-center leading-tight">Eco<br />Rewards</p>
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
                  <p className="font-extrabold text-sm text-white">Install the Trade2Cart App</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Faster · Works offline</p>
                </div>
              </div>
              <button onClick={handleInstallClick} className="flex items-center gap-1.5 bg-brand-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md hover:bg-brand-400 active:scale-95 transition-all">
                <FaDownload /> Get
              </button>
            </div>
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
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
                      <h3 className="text-sm sm:text-[15px] font-black text-slate-800 leading-tight line-clamp-2">{item.name}</h3>
                      <p className="text-brand-600 font-extrabold mt-1 text-sm sm:text-base">
                        {showRange ? `₹${item.minRate}-₹${item.maxRate}` : `₹${item.rate || item.minRate || 0}`}
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest"> / {item.unit || 'kg'}</span>
                      </p>
                    </div>

                    <div className="mt-3 h-10 sm:h-11 w-full">
                      {qty === 0 ? (
                        <button onClick={() => updateCart(item.id, 1)} className="w-full h-full bg-white border-2 border-brand-500 text-brand-600 font-black text-sm rounded-xl hover:bg-brand-50 transition-colors flex items-center justify-center gap-1.5 active:scale-95">
                          <FaPlus size={10} /> ADD
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full h-full bg-brand-600 text-white rounded-xl shadow-md overflow-hidden">
                          <button onClick={() => updateCart(item.id, -1)} className="w-1/3 h-full flex items-center justify-center hover:bg-brand-700 active:bg-brand-800 transition"><FaMinus size={12} /></button>
                          <span className="w-1/3 text-center font-black text-lg">{qty}</span>
                          <button onClick={() => updateCart(item.id, 1)} className="w-1/3 h-full flex items-center justify-center hover:bg-brand-700 active:bg-brand-800 transition"><FaPlus size={12} /></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 sm:col-span-3 xl:col-span-4 text-center mt-6 p-10 t2c-card">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <FaImage className="text-2xl text-slate-300" />
                </div>
                <p className="text-slate-700 font-black text-lg">No items available yet</p>
                <p className="text-slate-400 text-sm mt-2">We're updating prices for {location}. Please check back soon!</p>
              </div>
            )}
          </div>

          {/* DESKTOP STICKY CART */}
          <aside className="hidden lg:block sticky top-6">
            <div className="t2c-card overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
                <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center"><FaShoppingCart size={14} /></span>
                <div>
                  <p className="font-black text-slate-900 leading-none">Your Cart</p>
                  <p className="text-[11px] font-bold text-slate-400 mt-1">{totalCartItems} item{totalCartItems !== 1 ? 's' : ''} selected</p>
                </div>
              </div>

              {totalCartItems === 0 ? (
                <div className="px-5 py-10 text-center">
                  <FaShoppingCart className="mx-auto text-3xl text-slate-200 mb-3" />
                  <p className="text-sm font-bold text-slate-400">Add scrap items to start your pickup.</p>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto nice-scrollbar divide-y divide-slate-50">
                    {cartLines.map(({ item, qty }) => {
                      const rate = item.minRate || item.rate || 0;
                      return (
                        <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate capitalize">{item.name}</p>
                            <p className="text-[11px] font-bold text-slate-400">₹{rate} / {item.unit || 'kg'}</p>
                          </div>
                          <div className="flex items-center gap-2 bg-brand-600 text-white rounded-lg overflow-hidden">
                            <button onClick={() => updateCart(item.id, -1)} className="px-2 py-1.5 hover:bg-brand-700"><FaMinus size={9} /></button>
                            <span className="text-sm font-black w-5 text-center">{qty}</span>
                            <button onClick={() => updateCart(item.id, 1)} className="px-2 py-1.5 hover:bg-brand-700"><FaPlus size={9} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-5 py-4 bg-brand-50/60 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-bold text-slate-600">Estimated value</span>
                      <span className="text-lg font-black text-brand-700">{estLabel}</span>
                    </div>
                    <button onClick={handleCheckout} className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-black flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md shadow-brand-600/25">
                      Proceed to Checkout <FaArrowRight size={13} />
                    </button>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-2 uppercase tracking-wide">Final value confirmed on weighing</p>
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
              <span className="text-[11px] text-brand-200 font-black uppercase tracking-wider">{totalCartItems} item{totalCartItems !== 1 ? 's' : ''} in cart</span>
              <span className="text-lg font-black tracking-tight">Est. {estLabel}</span>
            </div>
            <div className="flex items-center gap-2 bg-white text-brand-700 px-4 py-2.5 rounded-xl font-black shadow-sm">
              Checkout <FaArrowRight size={13} />
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default HelloUser;
