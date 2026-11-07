import React, { useState } from 'react';
import { Home, Compass, History, UserRound, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ActivitySelectorModal } from './ActivitySelectorModal';

export const BottomNav: React.FC = () => {
  const { currentScreen, navigateTo, activeMode, setActiveMode } = useApp();
  const [showModeSelector, setShowModeSelector] = useState(false);

  // Hide bottom nav during full-screen live workout
  if (currentScreen === 'live-run') {
    return null;
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 max-w-md md:max-w-lg mx-auto pointer-events-none px-4 pb-4 pt-2"
        aria-label="Bottom Navigation"
      >
        <div className="relative pointer-events-auto px-4 py-2.5 rounded-3xl bg-[var(--bg-secondary)]/90 dark:bg-[#181A18]/90 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-[var(--text-secondary)]/10">
          <div className="grid grid-cols-5 items-center justify-items-center h-14">
            {/* 1. Home */}
            <button
              onClick={() => navigateTo('home')}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer ${
                currentScreen === 'home'
                  ? 'text-[var(--accent-orange)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
              aria-label="Home"
            >
              <Home className="w-5 h-5 transition-transform active:scale-90 stroke-[2.2]" />
              <span className="text-[10px] tracking-tight mt-1">Home</span>
              {currentScreen === 'home' && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent-orange)]" />
              )}
            </button>

            {/* 2. Explore */}
            <button
              onClick={() => navigateTo('explore')}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer ${
                currentScreen === 'explore'
                  ? 'text-[var(--accent-orange)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
              aria-label="Explore"
            >
              <Compass className="w-5 h-5 transition-transform active:scale-90 stroke-[2.2]" />
              <span className="text-[10px] tracking-tight mt-1">Explore</span>
              {currentScreen === 'explore' && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent-orange)]" />
              )}
            </button>

            {/* 3. Central Prominent Start/Record Action with PLUS Icon */}
            <div className="relative -top-3.5">
              <button
                onClick={() => setShowModeSelector(true)}
                className="w-13 h-13 rounded-full flex items-center justify-center text-white transition-all duration-200 transform active:scale-90 hover:scale-105 shadow-md cursor-pointer group bg-[var(--accent-orange)]"
                aria-label="Start recording workout"
                title={`Start ${activeMode} (or pick mode)`}
              >
                <Plus className="w-7 h-7 stroke-[3] text-white transition-transform duration-200 group-hover:rotate-90 drop-shadow-sm" />
              </button>
            </div>

            {/* 4. History */}
            <button
              onClick={() => navigateTo('history')}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer ${
                currentScreen === 'history' || currentScreen === 'activity-details'
                  ? 'text-[var(--accent-orange)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
              aria-label="Workout History"
            >
              <History className="w-5 h-5 transition-transform active:scale-90 stroke-[2.2]" />
              <span className="text-[10px] tracking-tight mt-1">History</span>
              {(currentScreen === 'history' || currentScreen === 'activity-details') && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent-orange)]" />
              )}
            </button>

            {/* 5. Profile */}
            <button
              onClick={() => navigateTo('profile')}
              className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center transition-all duration-200 relative cursor-pointer ${
                currentScreen === 'profile' || currentScreen === 'settings' || currentScreen === 'analytics'
                  ? 'text-[var(--accent-orange)] font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium'
              }`}
              aria-label="Profile"
            >
              <UserRound className="w-5 h-5 transition-transform active:scale-90 stroke-[2.2]" />
              <span className="text-[10px] tracking-tight mt-1">Profile</span>
              {(currentScreen === 'profile' || currentScreen === 'settings' || currentScreen === 'analytics') && (
                <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[var(--accent-orange)]" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mode Selector Modal Triggered by Plus Button */}
      <ActivitySelectorModal
        isOpen={showModeSelector}
        onClose={() => setShowModeSelector(false)}
        currentMode={activeMode}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          setShowModeSelector(false);
          navigateTo('live-run');
        }}
      />
    </>
  );
};
