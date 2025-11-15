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

  return (
    <>
      <SEO
        title="Select Your Location – Trade2Cart"
        description="Choose your city to find local scrap buyers and schedule a doorstep pickup with Trade2Cart."
      />

      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-200 p-6">
        <div className="w-full max-w-md text-center">

          {/* Header */}
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Select Your Location
          </h1>
          <p className="text-gray-600 mb-6">
            Choose your nearest area to continue
          </p>

          {/* Card Container */}
          <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3 border border-gray-100">

            {cities.map((city) => (
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
            ))}

          </div>
        </div>
      </main>
    </>
  );
};

export default LocationPage;
