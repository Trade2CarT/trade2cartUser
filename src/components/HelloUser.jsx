import React, { useEffect, useState, useMemo } from "react";
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaNewspaper, FaBox, FaQuestionCircle, FaRecycle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { db, firebaseObjectToArray } from '../firebase';
import { ref, get } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';

const HelloUser = () => {
  const { location, userMobile } = useSettings();
  const [showCart, setShowCart] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("wasteEntries");
    if (stored) {
      try {
        setSavedData(JSON.parse(stored));
      } catch {
        setSavedData([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wasteEntries", JSON.stringify(savedData));
  }, [savedData]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const itemsRef = ref(db, 'items');
        const snapshot = await get(itemsRef);
        const dataArray = firebaseObjectToArray(snapshot);
        setAvailableProducts(dataArray);
      } catch (err) {
        toast.error("Could not fetch product list.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(() => {
    if (loading) return [];
    const productsInLocation = availableProducts.filter(p => p.location?.toLowerCase() === location.toLowerCase());
    const allCategories = productsInLocation.map(p => p.category);
    return ['All', ...new Set(allCategories)];
  }, [availableProducts, location, loading]);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter(p => {
      const inLocation = p.location?.toLowerCase() === location.toLowerCase();
      if (selectedCategory === 'All') return inLocation;
      return inLocation && p.category === selectedCategory;
    });
  }, [availableProducts, location, selectedCategory]);

  const getProductIcon = (category) => {
    const catLower = category.toLowerCase();
    if (catLower.includes('paper')) return <FaNewspaper className="text-blue-500" />;
    if (catLower.includes('plastic')) return <FaRecycle className="text-green-500" />;
    if (catLower.includes('cardboard')) return <FaBox className="text-yellow-600" />;
    return <FaQuestionCircle className="text-gray-400" />;
  };

  const ProductCard = React.memo(({ product }) => {
    const [quantity, setQuantity] = useState(1);
    const totalPrice = (parseFloat(product.rate || 0) * quantity).toFixed(2);

    const handleAdd = () => {
      const newEntry = {
        text: product.name, rate: product.rate, unit: product.unit, category: product.category,
        location: product.location, quantity, total: totalPrice, mobile: userMobile || "unknown",
      };
      setSavedData((prev) => [...prev, newEntry]);
      toast.success(`${product.name} added to cart!`);
    };

    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden flex items-center p-3 gap-3">
        <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
          <div className="w-10 h-10 flex items-center justify-center text-3xl">{getProductIcon(product.category)}</div>
        </div>
        <div className="flex-grow">
          <h3 className="text-md font-bold text-gray-800">{product.name}</h3>
          <p className="text-sm font-semibold text-green-600">₹{product.rate} <span className="text-xs font-normal text-gray-500">per {product.unit}</span></p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-gray-200 rounded">
              <button onClick={() => setQuantity(q => Math.max(0.1, parseFloat((q - 0.1).toFixed(2))))} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-l focus:outline-none">-</button>
              <input type="number" step="0.1" min="0.1" value={quantity} onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value || 1)))} className="w-12 border-l border-r text-center text-sm focus:outline-none" />
              <button onClick={() => setQuantity(q => parseFloat((q + 0.1).toFixed(2)))} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-r focus:outline-none">+</button>
            </div>
            <button className="bg-blue-600 text-white font-bold py-1 px-3 rounded-md text-sm hover:bg-blue-700 transition-colors" onClick={handleAdd}>Add</button>
          </div>
        </div>
      </div>
    );
  });

  const handleCheckout = () => {
    const enriched = savedData.map((entry) => ({ ...entry }));
    localStorage.setItem("checkoutData", JSON.stringify(enriched));
    localStorage.setItem("wasteEntries", JSON.stringify(enriched));
    setSavedData(enriched);
    navigate("/trade");
  };

  return (
    <div className="h-screen bg-[#f2f7f8] text-gray-800 flex flex-col">
      <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
        <div className="flex items-center gap-3"><img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full"><FaMapMarkerAlt className="text-green-500" /><span className="text-sm font-medium">{location}</span></div>
        </div>
        <div className="flex items-center gap-4"><FaBell className="cursor-pointer text-gray-600" />
          <div className="relative cursor-pointer" onClick={() => setShowCart(true)}><FaShoppingCart className="text-gray-600" />
            {savedData.length > 0 && (<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{savedData.length}</span>)}
          </div>
        </div>
      </header>
      <div className="sticky top-[70px] bg-white z-20 py-2 shadow-sm">
        <div className="flex flex-wrap gap-2 px-4">
          {categories.map(category => (<button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors duration-200 ${selectedCategory === category ? 'bg-blue-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{category}</button>))}
        </div>
      </div>
      <main className="flex-grow p-4 overflow-y-auto z-10">
        {loading && <p className="text-center mt-8">Loading products...</p>}
        {!loading && !showCart && (
          <>
            <h2 className="text-xl font-bold mb-6 text-center text-gray-700">Available Products in {location}</h2>
            <div className="grid grid-cols-1 gap-4">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (<ProductCard key={product.id} product={product} />)) : <p className="text-center text-gray-500">No products available for this location.</p>}
            </div>
          </>
        )}
        {!loading && showCart && (
          <div className="bg-white p-4 rounded-lg shadow mt-4">
            <h2 className="text-lg font-semibold mb-4">Your Cart</h2>
            {savedData.length === 0 ? (<p className="text-gray-500 text-center py-4">Your cart is empty.</p>) : (savedData.map((entry, idx) => (
              <div key={idx} className="mb-2 p-3 border rounded-md flex justify-between items-center">
                <div><p className="font-semibold">{entry.text || entry.name}</p><p className="text-sm text-gray-600">{entry.quantity} {entry.unit} x ₹{entry.rate}</p></div>
                <p className="font-bold">₹{entry.total}</p>
              </div>
            )))}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCart(false)} className="flex-1 py-2 bg-gray-300 text-black rounded-lg">⬅️ Back</button>
              <button onClick={handleCheckout} className="flex-1 py-2 bg-green-600 text-white rounded-lg" disabled={savedData.length === 0}>🛒 Checkout</button>
            </div>
          </div>
        )}
      </main>
      <footer className="sticky bottom-0 flex justify-around items-center p-3 bg-white rounded-t-3xl shadow-inner flex-shrink-0 z-30">
        <button onClick={() => { setShowCart(false); setSelectedCategory('All'); }} className="flex flex-col items-center text-green-600"><FaHome /><span className="text-xs">Home</span></button>
        <Link to="/task" className="flex flex-col items-center text-gray-500 no-underline"><FaTasks /><span className="text-xs">Tasks</span></Link>
        <Link to="/account" className="flex flex-col items-center text-gray-500 no-underline"><FaUserAlt /><span className="text-xs">Account</span></Link>
      </footer>
    </div>
  );
};

export default HelloUser;