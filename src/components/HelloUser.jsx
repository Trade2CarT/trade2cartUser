import React, { useEffect, useState, useMemo } from "react";
import { FaHome, FaTasks, FaUserAlt, FaMapMarkerAlt, FaBell, FaShoppingCart, FaNewspaper, FaBox, FaQuestionCircle, FaRecycle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { db, firebaseObjectToArray } from '../firebase';
import { ref, get } from 'firebase/database';
import { useSettings } from '../context/SettingsContext';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import SEO from './SEO';
import Loader from './Loader'; // Import Loader

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
    // --- EDITED SECTION ---
    const [quantity, setQuantity] = useState(1); // Initial quantity is 1
    const totalPrice = (parseFloat(product.rate || 0) * quantity).toFixed(2);

    const handleAdd = () => {
      const newEntry = {
        id: `${product.id}-${Date.now()}`,
        text: product.name, rate: product.rate, unit: product.unit, category: product.category,
        location: product.location, quantity, total: totalPrice, mobile: userMobile || "unknown",
      };
      setSavedData((prev) => [...prev, newEntry]);
      toast.success(`${product.name} added to cart!`);
    };

    return (
      <article className="bg-white rounded-xl shadow-md overflow-hidden flex items-center p-3 gap-4 hover:shadow-lg transition-shadow">
        <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
          <div className="w-12 h-12 flex items-center justify-center text-3xl">{getProductIcon(product.category)}</div>
        </div>
        <div className="flex-grow">
          <h3 className="text-md font-bold text-gray-800">{product.name}</h3>
          <p className="text-sm font-semibold text-green-600">₹{product.rate} <span className="text-xs font-normal text-gray-500">per {product.unit}</span></p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-gray-200 rounded-md">
              {/* Decrement by 1, minimum is 1 */}
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 rounded-l focus:outline-none">-</button>
              {/* Input handles integers */}
              <input type="number" step="1" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || 1, 10)))} className="w-12 border-l border-r text-center text-sm focus:outline-none" />
              {/* Increment by 1 */}
              <button onClick={() => setQuantity(q => q + 1)} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 rounded-r focus:outline-none">+</button>
            </div>
            <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700 transition-colors" onClick={handleAdd}>Add</button>
          </div>
        </div>
      </article>
    );
  });

  const handleCheckout = () => {
    localStorage.setItem("checkoutData", JSON.stringify(savedData));
    navigate("/trade");
  };

  return (
    <>
      <SEO
        title={`Sell Scrap in ${location} - Trade2Cart`}
        description={`Find the best rates for paper, plastic, and metal scrap in ${location}. Schedule a pickup and get paid instantly with Trade2Cart.`}
        keywords={`sell scrap ${location}, scrap rates ${location}, scrap buyers ${location}, online scrap selling`}
      />
      <div className="h-screen bg-gray-50 text-gray-800 flex flex-col">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-30 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
            <div className="hidden sm:flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
              <FaMapMarkerAlt className="text-green-500" />
              <span className="text-sm font-medium">{location}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
        
            <div className="relative cursor-pointer" onClick={() => setShowCart(true)}>
              <FaShoppingCart className="text-gray-600 text-xl" />
              {savedData.length > 0 && (<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{savedData.length}</span>)}
            </div>
          </div>
        </header>

        <nav className="sticky top-[72px] bg-white z-20 py-2 shadow-sm overflow-x-auto">
          <div className="flex space-x-3 px-4">
            {categories.map(category => (
              <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${selectedCategory === category ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                {category}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-grow p-4 overflow-y-auto z-10">
          {loading ? <Loader fullscreen /> : (
            <>
              {!showCart && (
                <section>
                  <h1 className="text-xl font-bold mb-4 text-center text-gray-700 sr-only">Available Products in {location}</h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.length > 0 ? filteredProducts.map((product) => (<ProductCard key={product.id} product={product} />)) : <p className="col-span-full text-center text-gray-500 mt-8">No products available for this category in {location}.</p>}
                  </div>
                </section>
              )}

              {showCart && (
                <section className="bg-white p-4 rounded-lg shadow-lg mt-4 max-w-2xl mx-auto">
                  <h2 className="text-xl font-semibold mb-4 border-b pb-2">Your Cart</h2>
                  {savedData.length === 0 ? (<p className="text-gray-500 text-center py-8">Your cart is empty.</p>) : (savedData.map((entry, idx) => (
                    <div key={entry.id || idx} className="mb-2 p-3 border rounded-md flex justify-between items-center bg-gray-50">
                      <div>
                        <p className="font-semibold">{entry.text || entry.name}</p>
                        <p className="text-sm text-gray-600">{entry.quantity} {entry.unit} x ₹{entry.rate}</p>
                      </div>
                      <p className="font-bold text-lg">₹{entry.total}</p>
                    </div>
                  )))}
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setShowCart(false)} className="flex-1 py-3 bg-gray-300 text-black font-semibold rounded-lg hover:bg-gray-400 transition-colors">⬅️ Back to Products</button>
                    <button onClick={handleCheckout} className="flex-1 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400" disabled={savedData.length === 0}>🛒 Checkout</button>
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        <footer className="sticky bottom-0 flex-shrink-0 z-30">
          <nav className="flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <button onClick={() => { setShowCart(false); setSelectedCategory('All'); }} className="flex flex-col items-center text-green-600 p-2">
              <FaHome className="text-2xl" />
              <span className="text-xs font-medium">Home</span>
            </button>
            <Link to="/task" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600">
              <FaTasks className="text-2xl" />
              <span className="text-xs font-medium">Tasks</span>
            </Link>
            <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600">
              <FaUserAlt className="text-2xl" />
              <span className="text-xs font-medium">Account</span>
            </Link>
          </nav>
        </footer>
      </div>
    </>
  );
};

export default HelloUser;
