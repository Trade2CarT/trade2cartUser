import React from 'react';
import logo from '../assets/images/logo.png';

const Splash = () => {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-300 text-gray-800">
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        <img src={logo} alt="Trade2Cart Logo" className="w-24 h-24 md:w-32 md:h-32 rounded-full shadow-lg" />
        <h1 className="text-4xl md:text-5xl font-bold text-green-800 tracking-wide">Trade2Cart</h1>
        <p className="text-sm md:text-lg uppercase tracking-widest text-green-900">The Smartest Choice</p>
      </div>
      <div className="mt-8 text-center px-4">
        <p className="text-lg italic text-gray-700">"Transform trash into treasure"</p>
      </div>
    </div>
  );
};

export default Splash;
