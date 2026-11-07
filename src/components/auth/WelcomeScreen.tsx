import React from 'react';
import { BarChart3, Trophy, Users, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const WelcomeScreen: React.FC = () => {
  const { signInWithGoogle, actionLoading, authError } = useAuth();

  const handleGoogleClick = async () => {
    await signInWithGoogle();
  };

  // Official 4-color Google "G" Icon
  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] flex flex-col justify-between p-6 sm:p-8 max-w-md mx-auto select-none">
      {/* Top Branding Section */}
      <div className="pt-10 sm:pt-14 flex flex-col items-center text-center">
        {/* Official HypeAthe Shoe App Icon matching Reference */}
        <div className="w-24 h-24 rounded-3xl overflow-hidden shadow-lg mb-6 border border-[var(--text-secondary)]/15">
          <img
            src="/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png"
            alt="HypeAthe Logo"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">
          <span>Hype</span>
          <span className="text-[var(--accent-orange)]">Athe</span>
        </h1>

        {/* Tagline */}
        <p className="text-xs sm:text-sm font-black tracking-widest text-[var(--text-secondary)] mt-2 uppercase">
          RUN YOUR PACE. TRACK YOUR PROGRESS.
        </p>

        {/* Short product description from Reference Image */}
        <p className="text-xs text-[var(--text-secondary)] max-w-xs mt-3 leading-relaxed">
          Track your runs, improve your fitness and achieve more.
        </p>
      </div>

      {/* 3-Column Features Section matching Reference Image */}
      <div className="my-8 grid grid-cols-3 gap-3 text-center">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-2">
            <BarChart3 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">Track</span>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">Progress</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-2">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">Set</span>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">Goals</span>
        </div>

        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-2">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xs font-black text-[var(--text-primary)]">Join</span>
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">Community</span>
        </div>
      </div>

      {/* Error Notice if any */}
      {authError && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold text-center">
          {authError}
        </div>
      )}

      {/* Bottom Actions Section */}
      <div className="flex flex-col gap-3 pb-6">
        <button
          onClick={handleGoogleClick}
          disabled={actionLoading}
          className="w-full h-14 rounded-2xl bg-white text-stone-900 hover:bg-stone-50 font-black text-sm flex items-center justify-center gap-3 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 border border-stone-200 shadow-sm"
        >
          {actionLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-orange)]" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continue with Google</span>
        </button>

        {/* Existing account link matching Reference */}
        <div className="text-center pt-2">
          <span className="text-xs text-[var(--text-secondary)] font-medium">
            Already have an account?{' '}
          </span>
          <button
            onClick={handleGoogleClick}
            disabled={actionLoading}
            className="text-xs font-black text-[var(--accent-orange)] hover:underline cursor-pointer"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};
