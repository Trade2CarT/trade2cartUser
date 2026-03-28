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
        (position) => {
          toast.success("Location found!", { id: 'gps' });
          // In a production app, use Google Maps Reverse Geocoding here to get the exact city name.
          handleSelect("Detected Location");
        },
        (error) => {
          toast.error("Could not get location. Please select manually.", { id: 'gps' });
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  const cities = [
    'Arcot',
    'Bagayam',
    'Kadappanthangal',
    'Katpadi',
    'Konavattam',
    'Latheri',
    'Melvisharam',
    'Ranipet',
    'SIPCOT',
    'Vellore',
    'VIT',
    'Walajapet'
  ];

  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEO
        title="Select Your Location – Trade2Cart"
        description="Choose your city to find local scrap buyers and schedule a doorstep pickup with Trade2Cart."
      />

      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 p-6">
        <div className="w-full max-w-md text-center">

          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Where are you?
          </h1>
          <p className="text-gray-600 mb-6">
            Choose your nearest area for pickup
          </p>

          <button
            onClick={handleCurrentLocation}
            className="w-full mb-6 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95"
          >
            <FaLocationArrow /> Use My Current Location
          </button>

          <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 flex flex-col h-[50vh]">

            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search your city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-2">
              {filteredCities.length > 0 ? filteredCities.map((city) => (
                <div
                  key={city}
                  onClick={() => handleSelect(city)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(city)}
                  className="flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-xl hover:bg-blue-50 hover:border-blue-400 border border-transparent hover:shadow-md transition-all cursor-pointer"
                >
                  <FaMapMarkerAlt className="text-blue-600 text-xl" />
                  <span className="text-gray-800 text-lg font-semibold">{city}</span>
                </div>
              )) : (
                <p className="text-gray-500 mt-4">No cities found.</p>
              )}
            </div>

          </div>
        </div>
      </main>
    </>
  );
};

export default LocationPage;