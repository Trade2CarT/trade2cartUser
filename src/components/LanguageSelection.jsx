import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import SEO from './SEO';
import logo from '../assets/images/logo.PNG';

const LanguageSelection = () => {
  const { setLanguage } = useSettings();
  const navigate = useNavigate();

  const handleSelect = (lang) => {
    if (navigator.vibrate) navigator.vibrate(50); // Haptic feedback
    setLanguage(lang);
    navigate('/location');
  };

  return (
    <>
      <SEO title="Choose Language – Trade2Cart" description="Select your preferred language." />

      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 p-6 font-sans">
        <div className="w-full max-w-sm text-center flex flex-col items-center">

          {/* Logo Animation */}
          <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center p-2 mb-8 animate-fade-in-down border border-gray-100">
            <img src={logo} alt="Trade2Cart" className="w-full h-full object-contain rounded-full" />
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
            Welcome to Trade2Cart
          </h1>
          <p className="text-gray-500 font-medium mb-10 text-sm">Choose your preferred language to start</p>

          <div className="space-y-4 w-full">
            {[
              { label: 'English', sub: '🇬🇧', value: 'English' },
              { label: 'ಕನ್ನಡ', sub: '🇮🇳', value: 'Kannada' }, // ✅ Added Kannada for Bengaluru launch
              { label: 'தமிழ்', sub: '🇮🇳', value: 'Tamil' },
              { label: 'हिन्दी', sub: '🇮🇳', value: 'Hindi' },
            ].map(({ label, sub, value }) => {

              // 💡 Note for you: To make a language clickable, just remove it from this list!
              // For example, when Kannada is ready, change it to: value === 'Tamil' || value === 'Hindi'
              const isDisabled = value === 'Kannada' || value === 'Tamil' || value === 'Hindi';

              return (
                <button
                  key={value}
                  onClick={() => !isDisabled && handleSelect(value)}
                  disabled={isDisabled}
                  className={`w-full flex items-center justify-between px-6 py-5 rounded-2xl shadow-md border font-bold text-lg transition-all duration-300
                    ${isDisabled
                      ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60'
                      : 'bg-white text-gray-800 border-gray-200 hover:border-green-500 hover:shadow-lg hover:text-green-600 active:scale-95 cursor-pointer'
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{sub}</span>
                    {label}
                  </span>
                  {!isDisabled && <span className="text-green-500 text-xl">→</span>}
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-12">The Smartest Way to Recycle</p>
        </div>
      </main>
    </>
  );
};

export default LanguageSelection;