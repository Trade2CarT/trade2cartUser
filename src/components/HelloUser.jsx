import React, { useEffect, useState, useMemo } from "react";
import { FaHome, FaTasks, FaUserAlt, FaShoppingCart, FaNewspaper, FaBox, FaQuestionCircle, FaRecycle, FaTimes, FaInfoCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { db, firebaseObjectToArray } from '../firebase';
import { ref, get, query, orderByChild, equalTo, onValue } from 'firebase/database'; // Import onValue
import { useSettings } from '../context/SettingsContext';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import SEO from './SEO';
import Loader from './Loader';

// --- Reusable Cart Modal Component ---
const CartModal = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout, isSchedulingDisabled }) => {
  if (!isOpen) return null;

  const grandTotal = cartItems.reduce((acc, entry) => acc + (entry.total || 0), 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes className="w-6 h-6" /></button>
        </div>
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold capitalize">{entry.text || entry.name}</p>
                    <p className="text-sm text-gray-500">{entry.quantity} {entry.unit} &times; ₹{entry.rate}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">₹{entry.total.toFixed(2)}</p>
                    <button onClick={() => onRemoveItem(entry.id)} className="text-red-500 hover:text-red-700"><FaTimes /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cartItems.length > 0 && (
          <div className="p-5 bg-gray-50 border-t">
            <div className="flex justify-between items-center pt-3 font-bold text-xl mb-4">
              <p>Grand Total</p>
              <p className="text-green-600">₹{grandTotal.toFixed(2)}</p>
            </div>
            <button onClick={onCheckout} disabled={isSchedulingDisabled} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSchedulingDisabled ? 'Pickup Already Scheduled' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};


// --- Main HelloUser Component ---
const HelloUser = () => {
  const { location, userMobile } = useSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userStatus, setUserStatus] = useState(null);
  const navigate = useNavigate();

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

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
    const fetchItems = async () => {
      setLoading(true);
      try {
        const itemsRef = ref(db, 'items');
        const itemsSnapshot = await get(itemsRef);
        setAvailableProducts(firebaseObjectToArray(itemsSnapshot));
      } catch (err) {
        toast.error("Could not fetch products.");
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // *** REPLACED with real-time listener for user status ***
  useEffect(() => {
    if (!userMobile) {
      setUserStatus('Active'); // Default for users not logged in
      return;
    }

    let userListener;
    const findUserAndListen = async () => {
      const usersRef = ref(db, 'users');
      const userQuery = query(usersRef, orderByChild('phone'), equalTo(userMobile));
      const userSnapshot = await get(userQuery);

      if (userSnapshot.exists()) {
        const userId = Object.keys(userSnapshot.val())[0];
        const userRef = ref(db, `users/${userId}`);

        // Set up the real-time listener
        userListener = onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            setUserStatus(userData.Status || 'Active');
          } else {
            setUserStatus('Active');
          }
        });
      } else {
        setUserStatus('Active'); // User doesn't exist yet
      }
    };

    findUserAndListen();

    // Cleanup function to remove the listener when the component unmounts
    return () => {
      if (userListener) {
        userListener(); // This is how you unsubscribe in Firebase v9+
      }
    };
  }, [userMobile]);

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

  const handleRemoveItem = (itemId) => {
    setSavedData(prev => prev.filter(item => item.id !== itemId));
    toast.error("Item removed from cart.");
  };

  const handleCheckout = () => {
    if (isSchedulingDisabled) {
      toast.error("You already have an active pickup scheduled.");
      return;
    }
    if (savedData.length === 0) {
      toast.error("Your cart is empty. Please add items first.");
      return;
    }
    navigate("/trade");
  };

  const ProductCard = React.memo(({ product, isDisabled }) => {
    const [quantity, setQuantity] = useState(1);

    const handleAdd = () => {
      if (isDisabled) {
        toast.error("You can't add items while a pickup is already scheduled.");
        return;
      }
      const numericTotal = parseFloat(product.rate || 0) * quantity;
      const newEntry = {
        id: `${product.id}-${Date.now()}`,
        text: product.name,
        rate: product.rate,
        unit: product.unit,
        category: product.category,
        location: product.location,
        quantity,
        total: numericTotal,
        mobile: userMobile || "unknown",
      };
      setSavedData((prev) => [...prev, newEntry]);
      toast.success(`${product.name} added to cart!`);
    };

    return (
      <article className={`bg-white rounded-xl shadow-md overflow-hidden flex items-center p-3 gap-4 transition-all ${isDisabled ? 'opacity-60' : 'hover:shadow-lg'}`}>
        <div className="flex-shrink-0 bg-gray-100 p-3 rounded-lg">
          <div className="w-12 h-12 flex items-center justify-center text-3xl">{getProductIcon(product.category)}</div>
        </div>
        <div className="flex-grow">
          <h3 className="text-md font-bold text-gray-800 capitalize">{product.name}</h3>
          <p className="text-sm font-semibold text-green-600">₹{product.rate} <span className="text-xs font-normal text-gray-500">per {product.unit}</span></p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-gray-200 rounded-md">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 rounded-l-md focus:outline-none" disabled={isDisabled}>-</button>
              <input type="number" step="1" min="1" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value || 1, 10)))} className="w-12 border-l border-r text-center text-sm focus:outline-none" disabled={isDisabled} />
              <button onClick={() => setQuantity(q => q + 1)} className="px-2 py-1 text-lg text-gray-600 hover:bg-gray-100 rounded-r-md focus:outline-none" disabled={isDisabled}>+</button>
            </div>
            <button className="bg-blue-600 text-white font-bold py-2 px-4 rounded-md text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed" onClick={handleAdd} disabled={isDisabled}>Add</button>
          </div>
        </div>
      </article>
    );
  });

  return (
    <>
      <SEO
        title={`Sell Scrap in ${location} - Trade2Cart`}
        description={`Find the best rates for paper, plastic, and metal scrap in ${location}. Schedule a pickup and get paid instantly with Trade2Cart.`}
        keywords={`sell scrap ${location}, scrap rates ${location}, scrap buyers ${location}, online scrap selling`}
      />
      <div className="h-screen bg-gray-100 text-gray-800 flex flex-col font-sans">
        <header className="sticky top-0 flex-shrink-0 p-4 bg-white shadow-md z-40 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <FaShoppingCart className="text-gray-600 text-2xl" />
              {savedData.length > 0 && (<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{savedData.length}</span>)}
            </div>
          </div>
        </header>

        <nav className="sticky top-[68px] bg-white z-20 py-2 shadow-sm overflow-x-auto">
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
              {isSchedulingDisabled && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-4 flex items-center shadow-md">
                  <FaInfoCircle className="text-2xl mr-4" />
                  <div>
                    <p className="font-bold">You have an active pickup scheduled!</p>
                    <p className="text-sm">You can schedule a new pickup after your current one is completed. <Link to="/task" className="font-semibold underline hover:text-yellow-800">View Status</Link></p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (<ProductCard key={product.id} product={product} isDisabled={isSchedulingDisabled} />)) : <p className="col-span-full text-center text-gray-500 mt-8">No products available for this category in {location}.</p>}
              </div>
            </>
          )}
        </main>

        <footer className="sticky bottom-0 flex-shrink-0 z-30">
          <nav className="flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
            <button onClick={() => { setIsCartOpen(false); setSelectedCategory('All'); }} className="flex flex-col items-center text-green-600 p-2">
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

        <CartModal
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={savedData}
          onRemoveItem={handleRemoveItem}
          onCheckout={handleCheckout}
          isSchedulingDisabled={isSchedulingDisabled}
        />
      </div>
    </>
  );
};

export default HelloUser;
