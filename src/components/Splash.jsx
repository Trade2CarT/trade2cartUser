import React, { useEffect, useState } from 'react';
import logo from '../assets/images/logo.PNG';

const Splash = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay ensures the CSS transition fires smoothly after render
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white overflow-hidden relative">

      {/* 1. Subtle Eco-Green Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(34,197,94,0.08)_0%,rgba(255,255,255,0)_60%)] pointer-events-none"></div>

      {/* 2. Main Logo & Typography Centerpiece */}
      <div className={`z-10 flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-8'}`}>

        {/* Sleek Logo Container */}
        <div className="w-28 h-28 md:w-36 md:h-36 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center p-3 mb-6 border border-gray-50">
          <img
            src={logo}
            alt="Trade2Cart Logo"
            className="w-full h-full object-contain rounded-[20px]"
          />
        </div>

        {/* Crisp Brand Typography */}
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-2">
          Trade<span className="text-green-500">2</span>Cart
        </h1>

        {/* Elegant Tagline */}
        <p className="text-xs md:text-sm font-bold text-gray-400 tracking-[0.3em] uppercase">
          The Smartest Choice
        </p>
      </div>

      {/* 3. High-End Minimalist Progress Bar (Bottom) */}
      <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 transition-opacity duration-1000 delay-300 w-48 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 rounded-full animate-premium-load"></div>
        </div>
      </div>

      {/* Custom CSS for the loading bar */}
      <style>{`
        .animate-premium-load {
          width: 0%;
          animation: loadBar 2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes loadBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Splash;