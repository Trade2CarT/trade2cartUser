import React from 'react';
import logo from '../assets/images/logo.PNG';

const Splash = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-200 text-gray-800">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <img
            src={logo}
            alt="Trade2Cart Logo"
            className="relative w-28 h-28 md:w-36 md:h-36 rounded-full shadow-2xl transition-transform duration-1000 ease-out animate-bounce"
            style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-green-800 tracking-tight mt-4 drop-shadow-sm">Trade2Cart</h1>
        <p className="text-sm md:text-md uppercase tracking-[0.3em] font-semibold text-green-700">The Smartest Choice</p>
      </div>
    </div>
  );
};

export default Splash;