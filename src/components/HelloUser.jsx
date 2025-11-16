import React, { useEffect, useState, useMemo } from "react";
import { FaHome, FaTasks, FaUserAlt, FaShoppingCart, FaTimes, FaInfoCircle } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { db } from '../firebase';
import { ref, get, onValue, set } from 'firebase/database';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useSettings } from '../context/SettingsContext';
import assetlogo from '../assets/images/logo.PNG';
import { toast } from 'react-hot-toast';
import SEO from './SEO';
import Loader from './Loader';

// --- Cart Modal (No changes here) ---
const CartModal = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout, isSchedulingDisabled, onUpdateQuantity }) => {
  if (!isOpen) return null;
  const grandTotal = cartItems.reduce((acc, entry) => acc + (entry.total || 0), 0);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-end z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <header className="p-5 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><FaTimes className="w-6 h-6" /></button>
        </header>
        <main className="p-5 max-h-[50vh] overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cartItems.map((entry) => (
                <div key={entry.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold capitalize text-gray-800">{entry.text || entry.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <button onClick={() => onUpdateQuantity(entry.id, entry.quantity - 1)} className="w-6 h-6 border rounded-full flex items-center justify-center text-lg text-red-500 hover:bg-gray-100">-</button>
                      <span className="text-sm font-medium">{entry.quantity} {entry.unit}</span>
                      <button onClick={() => onUpdateQuantity(entry.id, entry.quantity + 1)} className="w-6 h-6 border rounded-full flex items-center justify-center text-lg text-green-600 hover:bg-gray-100">+</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-lg">₹{entry.total.toFixed(2)}</p>
                    <button onClick={() => onRemoveItem(entry.id)} className="text-gray-400 hover:text-red-600"><FaTimes /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        {cartItems.length > 0 && (
          <footer className="p-5 bg-gray-50 border-t">
            <div className="flex justify-between items-center font-bold text-xl mb-4">
              <p>Grand Total</p>
              <p className="text-green-600">₹{grandTotal.toFixed(2)}</p>
            </div>
            <button onClick={onCheckout} disabled={isSchedulingDisabled} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSchedulingDisabled ? 'Pickup Already Scheduled' : 'Proceed to Checkout'}
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};


// --- Main HelloUser Component ---
const HelloUser = () => {
  const { location, setLocation } = useSettings();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userStatus, setUserStatus] = useState(null);
  
  const navigate = useNavigate();
  const auth = getAuth();

  const isSchedulingDisabled = userStatus === 'Pending' || userStatus === 'On-Schedule';

  useEffect(() => {
    const stored = localStorage.getItem("wasteEntries");
    if (stored) {
      try {
        setSavedData(JSON.parse(stored));
      } catch { setSavedData([]); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("wasteEntries", JSON.stringify(savedData));
  }, [savedData]);

  useEffect(() => {
    setLoading(true);
    const itemsRef = ref(db, 'items');
    get(itemsRef).then(snapshot => {
      if (snapshot.exists()) {
        const productsArray = Object.keys(snapshot.val()).map(key => ({ id: key, ...snapshot.val()[key] }));
        setAvailableProducts(productsArray);
      }
    }).catch(err => {
      toast.error("Could not fetch products.");
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = ref(db, `users/${user.uid}`);
        const dbListener = onValue(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUserStatus(userData.Status || 'Active');
            if (userData.location) {
              setLocation(userData.location);
            }
          } else {
            await set(userRef, {
              phone: user.phoneNumber,
              mobile: user.phoneNumber,
              location: location || 'Unknown',
              Status: 'Active',
              createdAt: new Date().toISOString()
            });
            setUserStatus('Active');
          }
          setLoading(false);
        });
        return dbListener;
      } else {
        setUserStatus('Active');
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, [auth, location, setLocation]);

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

  const handleRemoveItem = (itemId) => {
    setSavedData(prev => prev.filter(item => item.id !== itemId));
    toast.error("Item removed from cart.");
  };
  const handleInstallClick = async () => {
    if (!installPrompt) {
      // If the prompt isn't available, do nothing
      return;
    }

    const handleUpdateQuantity = (itemId, newQuantity) => {
      if (newQuantity < 1) {
        handleRemoveItem(itemId);
        return;
      }
      setSavedData(prev =>
        prev.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              quantity: newQuantity,
              total: parseFloat(item.rate || 0) * newQuantity,
            };
          }
          return item;
        })
      );
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
      const { userMobile } = useSettings();

      const handleAdd = () => {
        if (isDisabled) {
          toast.error("You can't add items while a pickup is already scheduled.");
          return;
        }

        setSavedData((prev) => {
          // Check if same product already exists
          const existingItem = prev.find((item) => item.productId === product.id);

          if (existingItem) {
            // Merge quantities instead of creating new row
            return prev.map((item) =>
              item.productId === product.id
                ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  total: (item.quantity + quantity) * parseFloat(product.rate),
                }
                : item
            );
          }

          // If product not in cart → add fresh
          const newEntry = {
            id: product.id,            // stable id for cart item
            productId: product.id,     // used for matching
            name: product.name,
            rate: product.rate,
            unit: product.unit,
            category: product.category,
            location: product.location,
            quantity,
            total: parseFloat(product.rate) * quantity,
            mobile: userMobile || "unknown",
          };

          return [...prev, newEntry];
        });

        toast.success(`${product.name} added to cart!`);
      };

      return (
        <article className={`bg-white rounded-xl shadow-md overflow-hidden flex flex-col ${isDisabled ? 'opacity-60' : ''}`}>
          <img src={product.imageUrl || 'https://placehold.co/200x150'} alt={product.name} className="w-full h-28 object-cover" />

          <div className="p-3 flex-grow flex flex-col">
            <div className="flex-grow">
              <h3 className="text-sm font-bold text-gray-800 capitalize">{product.name}</h3>
              <p className="text-xs text-gray-600 mt-1">₹{product.rate} per {product.unit}</p>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-2 text-lg text-gray-600" disabled={isDisabled}>-</button>
                <span className="px-2 text-sm">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="px-2 text-lg text-gray-600" disabled={isDisabled}>+</button>
              </div>

              <button
                className="bg-orange-500 text-white font-semibold py-1.5 px-4 rounded-lg text-sm hover:bg-orange-600 disabled:bg-gray-400"
                onClick={handleAdd}
                disabled={isDisabled}
              >
                Add
              </button>
            </div>
          </div>
        </article>
      );
    });


    return (
      <>
        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg font-semibold hover:bg-green-700"
            title="Install Trade2Cart App"
          >
            <FaDownload />
            <span className="hidden sm:block">Install</span>
          </button>
        )}
        <SEO title={`Sell Scrap in ${location} - Trade2Cart`} description={`Find the best rates for scrap in ${location}. Schedule a pickup with Trade2Cart.`} />
        <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
          <header className="sticky top-0 p-4 bg-white shadow-sm z-40 flex justify-between items-center">
            <img src={assetlogo} alt="Trade2Cart Logo" className="h-10 w-auto" />
            <div className="relative cursor-pointer" onClick={() => setIsCartOpen(true)}>
              <FaShoppingCart className="text-gray-700 text-2xl" />
              {savedData.length > 0 && (<span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{savedData.length}</span>)}
            </div>
          </header>

          <nav className="sticky top-[72px] bg-white z-20 py-3 shadow-sm">
            <div className="flex space-x-3 px-4 overflow-x-auto">
              {categories.map(category => (
                <button key={category} onClick={() => setSelectedCategory(category)} className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-full transition-colors ${selectedCategory === category ? 'bg-green-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                  {category}
                </button>
              ))}
            </div>
          </nav>

          {/* --- MAIN CONTENT (Now with responsive container) --- */}
          <main className="flex-grow w-full max-w-7xl mx-auto p-4">
            {loading ? <Loader fullscreen /> : (
              <>
                {isSchedulingDisabled && (
                  <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mb-4 flex items-center shadow-md">
                    <FaInfoCircle className="text-2xl mr-4" />
                    <div>
                      <p className="font-bold">You have an active pickup scheduled!</p>
                      <p className="text-sm">You can schedule a new pickup after this one is completed. <Link to="/task" className="font-semibold underline hover:text-yellow-800">View Status</Link></p>
                    </div>
                  </div>
                )}
                {/* --- PRODUCT GRID (Now with responsive columns) --- */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredProducts.length > 0 ? filteredProducts.map((product) => (<ProductCard key={product.id} product={product} isDisabled={isSchedulingDisabled} />)) : <p className="col-span-full text-center text-gray-500 mt-8">No products available in {location}.</p>}
                </div>
              </>
            )}
          </main>

          <footer className="sticky bottom-0 flex-shrink-0 z-30">
            <nav className="flex justify-around items-center p-2 bg-white rounded-t-2xl shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
              <Link to="/hello" className="flex flex-col items-center text-green-600 p-2"><FaHome className="text-2xl" /><span className="text-xs font-medium">Home</span></Link>
              <Link to="/task" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaTasks className="text-2xl" /><span className="text-xs font-medium">Tasks</span></Link>
              <Link to="/account" className="flex flex-col items-center text-gray-500 p-2 no-underline hover:text-green-600"><FaUserAlt className="text-2xl" /><span className="text-xs font-medium">Account</span></Link>
            </nav>
          </footer>

          <CartModal
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            cartItems={savedData}
            onRemoveItem={handleRemoveItem}
            onCheckout={handleCheckout}
            isSchedulingDisabled={isSchedulingDisabled}
            onUpdateQuantity={handleUpdateQuantity}
          />
        </div>
      </>
    );
  };
}

export default HelloUser;