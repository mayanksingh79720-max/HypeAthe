import React, { useState } from 'react';
import { ArrowLeft, Moon, Footprints, Bell, MapPin, Shield, Trash2, Info, ChevronRight, Check, X, LogOut, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { HypeAtheLogo } from '../HypeAtheLogo';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { ThemeMode, UnitMode } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const {
    goBack,
    units,
    setUnits,
    notificationsEnabled,
    setNotificationsEnabled,
    locationHighAccuracy,
    setLocationHighAccuracy,
    clearAllLocalData,
    showToast
  } = useApp();
  const { signOutUser } = useAuth();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const themeLabels: Record<ThemeMode, string> = {
    dark: 'Dark',
    light: 'Light',
    system: 'System Default'
  };

  const handleClearData = () => {
    clearAllLocalData();
    setShowClearConfirm(false);
  };

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-2xl mx-auto flex flex-col justify-between">
      <div>
        {/* Header */}
        <header className="flex items-center gap-3 py-2 mb-4">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center">
              <Settings className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Settings
            </h1>
          </div>
        </header>

        {/* Segmented Theme Switch matching Reference Image */}
        <div className="flex items-center justify-center p-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 mb-4 shadow-xs">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-white text-stone-900 shadow-sm border border-stone-200'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="text-sm">☀️</span>
            <span>Light Theme</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-2.5 rounded-full text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-[#181A18] text-white shadow-sm border border-white/10'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Moon className="w-4 h-4 text-[var(--accent-orange)]" />
            <span>Dark Theme</span>
          </button>
        </div>

        {/* Global Google Authentication Card */}
        <GoogleAuthButton variant="card" className="mb-4" />

        {/* Settings List */}
        <div className="flex flex-col gap-2.5 mb-8">
          {/* 1. Theme Selection */}
          <div
            onClick={() => setShowThemeModal(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)]/70 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Theme</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <span>{themeLabels[theme]}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 2. Units Selection */}
          <div
            onClick={() => setShowUnitsModal(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)]/70 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <Footprints className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Units</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
              <span>{units === 'km' ? 'Kilometres (km)' : 'Miles (mi)'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          {/* 3. Notifications Toggle */}
          <div className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Notifications</span>
            </div>

            {/* Custom iOS/Apple style toggle switch */}
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                notificationsEnabled ? 'bg-[var(--accent-orange)]' : 'bg-[var(--bg-surface)]'
              }`}
              aria-label="Toggle notifications"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                  notificationsEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {/* 4. Location Settings */}
          <div
            onClick={() => setShowLocationModal(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)]/70 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Location Settings</span>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>

          {/* 5. Privacy & Security */}
          <div
            onClick={() => setShowPrivacyModal(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)]/70 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-[var(--text-primary)]">Privacy & Security</span>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>


          {/* 7. Clear Local Data */}
          <div
            onClick={() => setShowClearConfirm(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-red-500/10 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/15 text-red-500 flex items-center justify-center">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-500">Reset Local Database</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Wipe workouts back to clean 0</div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>

          {/* 8. About HypeAthe */}
          <div
            onClick={() => setShowAboutModal(true)}
            className="rounded-2xl p-4 bg-[var(--bg-secondary)] flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface)]/70 transition-colors shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] flex items-center justify-center">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">About HypeAthe</div>
                <div className="text-[11px] text-[var(--text-secondary)]">Version 5.0.0 (Phase 5 Master Upgrade)</div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="mt-2 mb-4">
          <button
            onClick={signOutUser}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of HypeAthe</span>
          </button>
        </div>
      </div>

      {/* Footer Branding Signature */}
      <footer className="pt-6 pb-2 text-center flex flex-col items-center">
        <HypeAtheLogo size="sm" className="mb-2" />
        <p className="text-[10px] font-extrabold tracking-widest text-[var(--text-secondary)] uppercase">
          RUN YOUR PACE. TRACK YOUR PROGRESS.
        </p>
        <p className="text-[9px] font-bold tracking-widest text-[var(--accent-orange)] mt-1 uppercase">
          RUN • TRACK • CONNECT
        </p>
      </footer>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Select Theme</h3>
              <button onClick={() => setShowThemeModal(false)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {(['dark', 'light', 'system'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    setShowThemeModal(false);
                    showToast(`Theme switched to ${themeLabels[t]}`);
                  }}
                  className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                    theme === t
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--text-secondary)]/15'
                  }`}
                >
                  <span>{themeLabels[t]}</span>
                  {theme === t && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Units Modal */}
      {showUnitsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Distance Units</h3>
              <button onClick={() => setShowUnitsModal(false)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'km', label: 'Kilometres (km)' },
                { id: 'mi', label: 'Miles (mi)' }
              ].map(u => (
                <button
                  key={u.id}
                  onClick={() => {
                    setUnits(u.id as UnitMode);
                    setShowUnitsModal(false);
                  }}
                  className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
                    units === u.id
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--text-secondary)]/15'
                  }`}
                >
                  <span>{u.label}</span>
                  {units === u.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Location Settings Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Location Preferences</h3>
              <button onClick={() => setShowLocationModal(false)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              Configure GPS precision and workout detection preferences for future outdoor activities.
            </p>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--bg-surface)] mb-4">
              <span className="text-xs font-bold text-[var(--text-primary)]">High-Accuracy GPS</span>
              <button
                onClick={() => setLocationHighAccuracy(!locationHighAccuracy)}
                className={`w-11 h-6 rounded-full transition-colors relative ${
                  locationHighAccuracy ? 'bg-[var(--accent-orange)]' : 'bg-stone-500'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5 transition-transform ${
                    locationHighAccuracy ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={() => setShowLocationModal(false)}
              className="w-full py-3 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 max-w-sm w-full shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Privacy & Security</h3>
              <button onClick={() => setShowPrivacyModal(false)} className="text-[var(--text-secondary)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              In HypeAthe, you have full ownership of your route privacy and fitness telemetry. No telemetry or tracking is shared with third parties.
            </p>
            <div className="p-3 rounded-2xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] mb-4">
              🛡️ Privacy zones around Home & Work are automatically masked by 200m radius on community feed posts.
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 max-w-xs w-full shadow-2xl">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] mb-2">
              Clear all saved data?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
              This will restore all default preferences, activities, and bookmarks. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* About HypeAthe Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-6 max-w-xs w-full shadow-2xl text-center">
            <div className="flex justify-center mb-3">
              <HypeAtheLogo size="lg" />
            </div>
            <div className="text-xs font-bold text-[var(--accent-orange)] mb-2">
              Version 5.0.0 (Phase 5 Master Upgrade)
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
              A premium multi-activity athletic performance platform inspired by Strava and Apple Fitness with an original borderless design philosophy.
            </p>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-3 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
