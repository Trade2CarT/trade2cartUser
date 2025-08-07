import React from 'react';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const LocationPage = () => {
  const { setLocation } = useSettings();
  const navigate = useNavigate();

  const handleSelect = (loc) => {
    setLocation(loc);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Select Your Location</h2>
      <div className="space-y-4 w-full max-w-sm">
        {['Vellore', 'Chennai', 'Bangalore'].map((city) => (
          <div
            key={city}
            onClick={() => handleSelect(city)}
            className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow hover:bg-gray-50 cursor-pointer transition duration-200"
          >
            <FaMapMarkerAlt className="text-blue-600" />
            <span className="text-gray-700 text-lg">{city}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationPage;