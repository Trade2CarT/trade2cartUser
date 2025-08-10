import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';

const LanguageSelection = () => {
  const { setLanguage } = useSettings();
  const navigate = useNavigate();

  const handleSelect = (lang) => {
    setLanguage(lang);
    navigate('/location');
  };

  return (
    <>
      <SEO
        title="Choose Language – Trade2Cart"
        description="Select your preferred language to start using Trade2Cart for scrap pickup services in India."
      />
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6">Choose your Language</h1>
          <div className="space-y-4">
            {[
              { label: '🇬🇧 English', value: 'English' },
              { label: '🇮🇳 தமிழ்', value: 'Tamil' },
              { label: '🇮🇳 हिन्दी', value: 'Hindi' },
            ].map(({ label, value }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className="w-full bg-white text-center px-4 py-3 rounded-xl shadow-md hover:bg-gray-100 hover:scale-105 transform transition-all duration-200 cursor-pointer text-lg text-gray-700 font-medium"
                aria-label={`Select ${value}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
};

export default LanguageSelection;