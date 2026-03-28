import React, { useEffect, useState } from 'react';
import logo from '../assets/images/logo.PNG';

const Splash = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Slight delay to trigger the smooth CSS transitions after component mounts
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#0a0f16] overflow-hidden relative">

      {/* 1. Subtle Premium Background Glow (Not overpowering) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-green-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      {/* 2. Main Logo & Typography Centerpiece */}
      <div className={`z-10 flex flex-col items-center transition-all duration-1000 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

        {/* Sleek Logo Container */}
        <div className="relative p-[2px] rounded-3xl bg-gradient-to-br from-gray-700 via-gray-800 to-black shadow-2xl mb-8">
          <div className="bg-white p-2 rounded-[22px]">
            <img
              src={logo}
              alt="Trade2Cart Logo"
              className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-[16px]"
            />
          </div>
        </div>

        {/* Crisp Brand Typography */}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
          Trade<span className="text-green-500">2</span>Cart
        </h1>

        {/* Elegant Tagline */}
        <p className="text-xs md:text-sm font-bold text-gray-400 tracking-[0.3em] uppercase">
          Recycle Smart
        </p>
      </div>

      {/* 3. High-End Shimmer Loading Line (Bottom) */}
      <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 transition-opacity duration-1000 delay-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-1/2 bg-gradient-to-r from-transparent via-green-500 to-transparent rounded-full animate-shimmer-sweep"></div>
        </div>
      </div>

      {/* Custom CSS for the premium shimmer effect */}
      <style>{`
        .animate-shimmer-sweep {
          animation: sweep 1.5s ease-in-out infinite;
        }
        @keyframes sweep {
          0% { transform: translateX(-150%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default Splash;