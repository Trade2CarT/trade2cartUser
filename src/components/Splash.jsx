import React, { useEffect, useState } from 'react';
import logo from '../assets/images/logo.PNG';

const Splash = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-gray-900 overflow-hidden relative">

      {/* Subtle Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div className={`flex flex-col items-center space-y-6 z-10 transition-all duration-1000 ease-out ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-90 translate-y-10'}`}>

        {/* Premium Logo Container */}
        <div className="relative group">
          <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-40 animate-pulse mix-blend-screen"></div>
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-[40px] shadow-2xl flex items-center justify-center p-2 relative transform transition-transform duration-700 hover:scale-105 rotate-3 hover:rotate-0">
            <img
              src={logo}
              alt="Trade2Cart Logo"
              className="w-full h-full object-contain rounded-[32px]"
            />
          </div>
        </div>

        {/* Typography */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
            Trade<span className="text-green-400">2</span>Cart
          </h1>
          <div className="flex items-center justify-center gap-2 opacity-80">
            <div className="w-8 h-[1px] bg-green-400/50"></div>
            <p className="text-xs md:text-sm uppercase tracking-[0.4em] font-bold text-green-300">
              The Smartest Choice
            </p>
            <div className="w-8 h-[1px] bg-green-400/50"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Splash;