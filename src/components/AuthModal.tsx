import React from 'react';
import { X, ShieldCheck, Zap, Cloud, Trophy, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { GoogleAuthButton } from './GoogleAuthButton';
import { HypeAtheLogo } from './HypeAtheLogo';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, isGoogleAuthenticated, user, authError } = useAuth();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={() => setShowAuthModal(false)}
          className="w-8 h-8 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center absolute top-5 right-5 cursor-pointer transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Branding & Header */}
        <div className="text-center mb-6 pt-2">
          <div className="flex justify-center mb-3">
            <HypeAtheLogo size="lg" />
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight">
            {isGoogleAuthenticated ? 'Google Athlete Account' : 'Global Athlete Sign In'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs mx-auto">
            {isGoogleAuthenticated
              ? 'Your workouts are securely synced with Firebase Cloud.'
              : 'Sign in to access your workouts across every device with your Google account.'}
          </p>
        </div>

        {/* Auth Error Banner if any */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-semibold text-center">
            {authError}
          </div>
        )}

        {/* Value Proposition Highlights */}
        {!isGoogleAuthenticated && (
          <div className="space-y-2.5 mb-6 py-1">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-bold">Cloud Activity Backup</div>
                <div className="text-[11px] text-[var(--text-secondary)] font-normal">Real-time sync to Firebase Cloud Firestore</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold">
              <div className="w-8 h-8 rounded-xl bg-[var(--accent-green)]/15 text-[var(--accent-green)] flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <div className="font-bold">Instant One-Tap Access</div>
                <div className="text-[11px] text-[var(--text-secondary)] font-normal">No passwords required; protected by Google OAuth</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div>
                <div className="font-bold">Zero-Trust Security</div>
                <div className="text-[11px] text-[var(--text-secondary)] font-normal">Your GPS telemetry remains 100% private to you</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="space-y-3">
          <GoogleAuthButton
            variant={isGoogleAuthenticated ? 'card' : 'primary'}
            onSuccess={() => setShowAuthModal(false)}
          />

          {!isGoogleAuthenticated && (
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full py-2.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer text-center"
            >
              Continue in Guest / Offline Mode
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
