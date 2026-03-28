import React, { useState } from 'react';
import { FaMapMarkerAlt, FaSearch, FaLocationArrow } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';

const LocationPage = () => {
  const { setLocation } = useSettings();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelect = (loc) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setLocation(loc);
    navigate('/login');
  };

  const handleCurrentLocation = () => {
    if (navigator.vibrate) navigator.vibrate(50);
    if (navigator.geolocation) {
      toast.loading("Finding your location...", { id: 'gps' });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Free reverse geocode just to get a readable City name for the UI context
            const { latitude, longitude } = position.coords;
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.county || "Detected Area";
            toast.success("Location found!", { id: 'gps' });
            handleSelect(city);
          } catch (e) {
            toast.success("Location mapped!", { id: 'gps' });
            handleSelect("Detected Location");
          }
        },
        (error) => {
          toast.error("Could not get location. Please select manually.", { id: 'gps' });
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const cities = ['Arcot', 'Bagayam', 'Kadappanthangal', 'Katpadi', 'Konavattam', 'Latheri', 'Melvisharam', 'Ranipet', 'SIPCOT', 'Vellore', 'VIT', 'Walajapet'];
  const filteredCities = cities.filter(city => city.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <SEO title="Select Location – Trade2Cart" description="Choose your city." />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-md text-center">

          <div className="mb-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMapMarkerAlt size={28} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Where are you?</h1>
            <p className="text-gray-500 font-medium">Choose your area for scrap pickup</p>
          </div>

          <button
            onClick={handleCurrentLocation}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-gray-800 transition-all active:scale-95"
          >
            <FaLocationArrow /> Detect My Current Location
          </button>

          <div className="bg-white rounded-[32px] shadow-xl p-6 border border-gray-100 flex flex-col h-[45vh]">
            <div className="relative mb-5">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-700 transition-all"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-2 hide-scrollbar">
              {filteredCities.length > 0 ? filteredCities.map((city) => (
                <div
                  key={city}
                  onClick={() => handleSelect(city)}
                  className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-colors cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    <FaMapMarkerAlt />
                  </div>
                  <span className="text-gray-800 text-lg font-bold">{city}</span>
                </div>
              )) : (
                <p className="text-gray-500 mt-4 font-medium">No cities found.</p>
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