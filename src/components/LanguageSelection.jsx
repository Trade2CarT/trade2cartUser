import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const LanguageSelection = () => {
  const { setLanguage } = useSettings();
  const navigate = useNavigate();

  const handleSelect = (lang) => {
    setLanguage(lang);
    navigate('/location');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800">Choose your Language</h2>
      <div className="space-y-4 w-full max-w-sm">
        {[
          { label: '🇬🇧 English', value: 'English' },
          { label: '🇮🇳 தமிழ்', value: 'Tamil' },
          { label: '🇮🇳 हिन्दी', value: 'Hindi' },
        ].map(({ label, value }) => (
          <div
            key={value}
            onClick={() => handleSelect(value)}
            className="w-full bg-white text-center px-4 py-3 rounded-xl shadow hover:bg-gray-50 cursor-pointer text-lg text-gray-700 transition duration-200"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelection;