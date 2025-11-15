import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';

const LocationPage = () => {
  const { setLocation } = useSettings();
  const navigate = useNavigate();

  const handleSelect = (loc) => {
    setLocation(loc);
    navigate('/login');
  };

  return (
    <>
      <SEO
        title="Select Your Location – Trade2Cart"
        description="Choose your city to find local scrap buyers and schedule a doorstep pickup with Trade2Cart."
      />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Select Your Location</h1>
          <div className="space-y-4">
            {[
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
].map((city) => (
              <div
                key={city}
                onClick={() => handleSelect(city)}
                role="button"
                tabIndex={0}
                className="flex items-center justify-center gap-3 bg-white px-4 py-3 rounded-xl shadow-md hover:bg-gray-100 hover:scale-105 transform transition-all duration-200 cursor-pointer"
                onKeyDown={(e) => e.key === 'Enter' && handleSelect(city)}
              >
                <FaMapMarkerAlt className="text-blue-600 text-xl" />
                <span className="text-gray-800 text-lg font-medium">{city}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default LocationPage;
