import React, { useState, useEffect } from 'react';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update, push } from 'firebase/database';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { getAuth } from 'firebase/auth'; // ✅ Imported to check login status
import { db } from '../firebase';
import SEO from './SEO';

// UI strings (English / Tamil) — follows the LoginPage pattern.
// City names come from the database and are shown as stored.
const STR = {
  English: {
    title: "Where are you?",
    subtitle: "Choose your area for scrap pickup",
    searchPlaceholder: "Search your area...",
    noAreas: "No areas found.",
  },
  Tamil: {
    title: "நீங்கள் எங்கே இருக்கிறீர்கள்?",
    subtitle: "பழைய பொருள் பிக்கப்புக்கு உங்கள் பகுதியைத் தேர்வு செய்யவும்",
    searchPlaceholder: "உங்கள் பகுதியைத் தேடுங்கள்...",
    noAreas: "பகுதிகள் எதுவும் கிடைக்கவில்லை.",
  },
};

const LocationPage = () => {
  const { setLocation, language, userMobile } = useSettings();
  const t = STR.English; // UI pinned to English — only item names follow the language toggle
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [cities, setCities] = useState([]);
  const [requestPhone, setRequestPhone] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const auth = getAuth();

  // Capture expansion demand: a visitor searched a city we don't serve yet.
  const handleNotifyMe = async () => {
    const city = searchTerm.trim();
    if (!city) return;
    setRequestSubmitting(true);
    try {
      await push(ref(db, 'cityRequests'), {
        city,
        phone: (requestPhone || userMobile || '').trim(),
        requestedAt: new Date().toISOString(),
      });
      setRequestSent(true);
    } catch {
      toast.error('Could not send. Please try again.');
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Cities are derived from the `location` field on each item in the `items`
  // node (same source HelloUser reads), so the list always matches the areas
  // that actually have items available.
  useEffect(() => {
    const itemsRef = ref(db, 'items');
    const unsubscribe = onValue(itemsRef, (snapshot) => {
      const data = snapshot.val();
      const uniqueCities = data
        ? [
            ...new Set(
              Object.values(data)
                .map((item) => item?.location)
                .filter((loc) => typeof loc === 'string' && loc.trim())
                .map((loc) => loc.trim())
            ),
          ].sort((a, b) => a.localeCompare(b))
        : [];
      setCities(uniqueCities);
    });
    return () => unsubscribe();
  }, []);

  const handleSelect = (loc) => {
    if (navigator.vibrate) navigator.vibrate(50);

    // ✅ Saves instantly to Context AND LocalStorage
    setLocation(loc);

    // ✅ FIX 2: Smart Routing!
    // If the user is already logged in, persist the city to their account (so it
    // is restored on the next login and can't drift out of sync) and send them
    // to the Home Dashboard. If they aren't logged in, send them to Login.
    if (auth.currentUser) {
      update(ref(db, `users/${auth.currentUser.uid}`), { location: loc })
        .catch(() => { /* non-blocking: local state already updated */ });
      navigate('/hello');
    } else {
      navigate('/login');
    }
  };

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEO title="Select Location – Trade2Cart" description="Choose your city." />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="w-full max-w-md text-center">

          <div className="mb-8 mt-4 animate-fade-in-down">
            <div className="w-16 h-16 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaMapMarkerAlt size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">{t.title}</h1>
            <p className="text-gray-500 font-medium">{t.subtitle}</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm p-5 sm:p-6 border border-gray-100 flex flex-col h-[55vh] animate-fade-in-up">

            <div className="relative mb-5">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setRequestSent(false); }}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-0 outline-none font-bold text-gray-700 transition-colors"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-2 hide-scrollbar">
              {filteredCities.length > 0 ? filteredCities.map((city) => (
                <div
                  key={city}
                  onClick={() => handleSelect(city)}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-brand-50 border border-transparent hover:border-brand-100 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-brand-600 group-hover:text-white transition-colors shadow-sm">
                    <FaMapMarkerAlt />
                  </div>
                  <span className="text-gray-800 text-lg font-bold group-hover:text-brand-900 transition-colors">{city}</span>
                </div>
              )) : searchTerm.trim() ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-2">
                  {requestSent ? (
                    <>
                      <span className="text-4xl mb-3">🎉</span>
                      <p className="text-gray-800 font-extrabold text-lg">Thanks! We'll let you know.</p>
                      <p className="text-gray-500 font-medium text-sm mt-1">We'll notify you when Trade2Cart launches in {searchTerm.trim()}.</p>
                    </>
                  ) : (
                    <>
                      <span className="text-4xl mb-3">📍</span>
                      <p className="text-gray-800 font-extrabold text-lg">We're not in your area yet!</p>
                      <p className="text-gray-500 font-medium text-sm mt-1 mb-4">Trade2Cart is coming to more cities soon. We'll notify you when we launch in <span className="font-bold text-gray-700">{searchTerm.trim()}</span>.</p>
                      {!userMobile && (
                        <input
                          type="tel"
                          value={requestPhone}
                          onChange={(e) => setRequestPhone(e.target.value)}
                          placeholder="Mobile number (optional)"
                          className="w-full mb-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-brand-500 focus:ring-0 outline-none font-bold text-gray-700"
                        />
                      )}
                      <button
                        onClick={handleNotifyMe}
                        disabled={requestSubmitting}
                        className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-extrabold hover:bg-brand-700 active:scale-[0.98] transition-all shadow-md disabled:bg-gray-300"
                      >
                        {requestSubmitting ? 'Sending…' : 'Notify Me'}
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <FaMapMarkerAlt className="text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500 font-bold">{t.noAreas}</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>
      <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </>
  );
};

export default LocationPage;