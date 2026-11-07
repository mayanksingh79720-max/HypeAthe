import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between items-center bg-[#101110] text-white select-none overflow-hidden">
      {/* Full-screen athletic collage background with responsive mobile cropping */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <img
          src="/images/hypeathe-loading-bg.png"
          onError={(e) => {
            // Fallback to direct asset path if needed
            (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/hypeathe-loading-bg_f66a0d2e.png';
          }}
          alt="HypeAthe Athletes Loading Background"
          className="w-full h-full object-cover object-center scale-[1.01]"
        />
        {/* Cinematic gradient scrims for optimal typography and spinner contrast */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(16, 17, 16, 0.45) 0%, rgba(16, 17, 16, 0.25) 35%, rgba(16, 17, 16, 0.6) 75%, rgba(16, 17, 16, 0.92) 100%)'
          }}
        />
        {/* Subtle radial golden sunset accent matching HypeAthe palette */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 107, 36, 0.12) 0%, transparent 70%)'
          }}
        />
      </div>

      {/* Top Space */}
      <div className="pt-16 sm:pt-20" />

      {/* Center Brand Identity with Glassmorphic Backdrop */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 -mt-8">
        {/* Official HypeAthe Shoe App Icon with border & drop shadow */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden shadow-[0_12px_36px_rgba(0,0,0,0.65)] mb-5 border border-white/20 bg-black/40 backdrop-blur-md">
          <img
            src="/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png"
            alt="HypeAthe Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Name with Drop Shadow */}
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-center justify-center drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
          <span>Hype</span>
          <span className="text-[#FF6B24]">Athe</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-extrabold tracking-widest text-stone-200 mt-3 uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          RUN YOUR PACE. TRACK YOUR PROGRESS.
        </p>
      </div>

      {/* Bottom Loading Arc Section */}
      <div className="relative z-10 w-full flex flex-col items-center pb-12 pt-4">
        {/* Preserved Minimal Orange Loading Arc Spinner */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-[2.5px] border-white/25 border-t-[#FF6B24] border-r-[#FF6B24] animate-spin shadow-lg" />
          <span className="text-[11px] font-bold tracking-wider text-white/80 uppercase drop-shadow-md">
            Initializing Telemetry
          </span>
        </div>
      </div>
    </div>
  );
};
