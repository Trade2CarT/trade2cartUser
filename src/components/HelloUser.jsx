import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaHome, FaTasks, FaUserAlt, FaPlus, FaMinus, FaTrash, FaShoppingCart } from 'react-icons/fa';
import { useSettings } from '../context/SettingsContext';
import { getAuth } from 'firebase/auth';
import SEO from './SEO';

// Category color mapping for premium UI
const categoryColors = {
  'paper': 'bg-blue-50 border-blue-200 text-blue-700',
  'plastic': 'bg-orange-50 border-orange-200 text-orange-700',
  'metal': 'bg-gray-100 border-gray-300 text-gray-800',
  'e-waste': 'bg-purple-50 border-purple-200 text-purple-700',
  'others': 'bg-green-50 border-green-200 text-green-700'
};

const HelloUser = () => {
  const [userName, setUserName] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [items, setItems] = useState([
    { id: 1, name: 'Newspaper', rate: 14, category: 'paper', unit: 'kg' },
    { id: 2, name: 'Cardboard', rate: 8, category: 'paper', unit: 'kg' },
    { id: 3, name: 'Iron', rate: 26, category: 'metal', unit: 'kg' },
    { id: 4, name: 'Plastic Bottles', rate: 10, category: 'plastic', unit: 'kg' },
    { id: 5, name: 'Aluminium', rate: 105, category: 'metal', unit: 'kg' },
    { id: 6, name: 'Copper', rate: 450, category: 'metal', unit: 'kg' },
    { id: 7, name: 'E-Waste', rate: 20, category: 'e-waste', unit: 'kg' },
    { id: 8, name: 'Mixed Scrap', rate: 12, category: 'others', unit: 'kg' }
  ]);
  const [cart, setCart] = useState({});
  const navigate = useNavigate();
  const { location } = useSettings();

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser?.displayName) {
      setUserName(auth.currentUser.displayName.split(' ')[0]);
    } else {
      setUserName('User');
    }

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
      const item = items.find(i => i.id === parseInt(id));
      return {
        name: item.name,
        quantity: cart[id],
        unit: item.unit,
        rate: item.rate,
        category: item.category,
        total: cart[id] * item.rate,
        location: location || 'Unknown',
      };
    });
    localStorage.setItem('wasteEntries', JSON.stringify(entriesToSave));
    navigate('/trade');
  };

  const totalCartItems = Object.keys(cart).length;
  const grandTotal = Object.keys(cart).reduce((total, id) => {
    const item = items.find(i => i.id === parseInt(id));
    return total + (cart[id] * item.rate);
  }, 0);

  const categories = ['All', 'paper', 'metal', 'plastic', 'e-waste', 'others'];
  const filteredItems = activeCategory === 'All' ? items : items.filter(i => i.category === activeCategory);

  return (
    <>
      <SEO title="Home - Trade2Cart" description="Sell scrap online instantly." />
      <div className="min-h-screen bg-gray-50 pb-32 font-sans">

        {/* Modern App Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40 px-5 pt-6 pb-4 rounded-b-3xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Location</p>
              <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-1">
                {location || 'Set Location'} <span className="text-green-500 text-2xl mb-1">▾</span>
              </h2>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex justify-center items-center text-green-700 font-bold text-xl shadow-inner">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Hello, {userName}! 👋</h1>
              <p className="text-gray-500 text-sm mt-1">What are we recycling today?</p>
            </div>
          </div>
        </header>

        {/* Categories Pill Menu */}
        <div className="flex overflow-x-auto hide-scrollbar gap-3 px-5 py-4 mt-2">
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

        {/* Item Grid */}
        <main className="px-5 mt-2 grid grid-cols-2 gap-4">
          {filteredItems.map(item => {
            const qty = cart[item.id] || 0;
            const colorClass = categoryColors[item.category] || categoryColors['others'];

            return (
              <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden">
                {/* Category Badge */}
                <span className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider border-b border-l ${colorClass}`}>
                  {item.category}
                </span>

                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-800 leading-tight">{item.name}</h3>
                  <p className="text-green-600 font-extrabold mt-1">₹{item.rate} <span className="text-gray-400 font-medium text-xs">/ {item.unit}</span></p>
                </div>

                <div className="mt-5 h-10">
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
          })}
        </main>

        {/* Floating Cart Footer */}
        {totalCartItems > 0 && (
          <div className="fixed bottom-20 left-0 right-0 px-5 z-40 animate-fade-in-up">
            <div onClick={handleCheckout} className="bg-green-600 text-white p-4 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer hover:bg-green-700 transition-colors active:scale-95">
              <div className="flex flex-col">
                <span className="text-xs text-green-200 font-bold uppercase tracking-wider">{totalCartItems} Items Added</span>
                <span className="text-xl font-extrabold">₹{grandTotal.toFixed(2)} Est. Total</span>
              </div>
              <div className="flex items-center gap-2 bg-white text-green-700 px-4 py-2 rounded-xl font-bold shadow-sm">
                View Cart <FaShoppingCart />
              </div>
            </div>
          </div>
        )}

        {/* Bottom Nav */}
        <footer className="fixed bottom-0 w-full flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50">
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