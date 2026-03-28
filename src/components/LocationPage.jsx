import React, { useState } from 'react';
import { FaMapMarkerAlt, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { getAuth } from 'firebase/auth'; // ✅ Imported to check login status
import SEO from './SEO';

const LocationPage = () => {
  const { setLocation } = useSettings();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const auth = getAuth();

  const handleSelect = (loc) => {
    if (navigator.vibrate) navigator.vibrate(50);

    // ✅ Saves instantly to Context AND LocalStorage
    setLocation(loc);

    // ✅ FIX 2: Smart Routing!
    // If the user is already logged in, send them back to the Home Dashboard. 
    // If they aren't logged in, send them to the Login screen.
    if (auth.currentUser) {
      navigate('/hello');
    } else {
      navigate('/login');
    }
  };

  const cities = [
    'Arcot', 'Bagayam', 'Kadappanthangal', 'Katpadi', 'Konavattam',
    'Latheri', 'Melvisharam', 'Ranipet', 'SIPCOT', 'Vellore', 'VIT', 'Walajapet'
  ];

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEO title="Select Location – Trade2Cart" description="Choose your city." />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 font-sans">
        <div className="w-full max-w-md text-center">

          <div className="mb-8 mt-4 animate-fade-in-down">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <FaMapMarkerAlt size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Where are you?</h1>
            <p className="text-gray-500 font-medium">Choose your area for scrap pickup</p>
          </div>

          <div className="bg-white rounded-[32px] shadow-xl p-6 border border-gray-100 flex flex-col h-[55vh] animate-fade-in-up">

            <div className="relative mb-5">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your area..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-700 transition-all shadow-inner"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-2 hide-scrollbar">
              {filteredCities.length > 0 ? filteredCities.map((city) => (
                <div
                  key={city}
                  onClick={() => handleSelect(city)}
                  className="flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <FaMapMarkerAlt />
                  </div>
                  <span className="text-gray-800 text-lg font-bold group-hover:text-blue-900 transition-colors">{city}</span>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center h-full opacity-50">
                  <FaMapMarkerAlt className="text-4xl text-gray-300 mb-2" />
                  <p className="text-gray-500 font-bold">No areas found.</p>
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