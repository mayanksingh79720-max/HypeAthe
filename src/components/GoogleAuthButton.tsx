import React from 'react';
import { LogOut, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface GoogleAuthButtonProps {
  variant?: 'primary' | 'header' | 'compact' | 'card';
  className?: string;
  onSuccess?: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  variant = 'primary',
  className = '',
  onSuccess
}) => {
  const { user, profile, isGoogleAuthenticated, signInWithGoogle, signOutUser, actionLoading } = useAuth();

  const handleAction = async () => {
    if (isGoogleAuthenticated) {
      await signOutUser();
    } else {
      const ok = await signInWithGoogle();
      if (ok && onSuccess) onSuccess();
    }
  };

  // Google 4-Color SVG Icon
  const GoogleGIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
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

  if (variant === 'header') {
    if (user) {
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-[var(--accent-orange)] shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'Athlete'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[var(--accent-orange)] text-white text-[10px] font-black flex items-center justify-center">
                  {(user.displayName || user.email || 'A')[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-[11px] font-black text-[var(--text-primary)] leading-none truncate max-w-[100px]">
                {user.displayName?.split(' ')[0] || 'Athlete'}
              </div>
              <div className="text-[9px] text-emerald-500 font-bold leading-none mt-0.5 flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Google</span>
              </div>
            </div>
            <button
              onClick={signOutUser}
              disabled={actionLoading}
              className="p-1 rounded-full hover:bg-rose-500/10 hover:text-rose-500 text-[var(--text-secondary)] transition-colors cursor-pointer"
              title="Sign Out"
              aria-label="Sign out"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleAction}
        disabled={actionLoading}
        className={`px-3 py-1.5 rounded-full bg-white text-stone-900 hover:bg-stone-100 font-extrabold text-xs shadow-md border border-stone-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer ${className}`}
        title="Continue with Google"
      >
        {actionLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--accent-orange)]" />
        ) : (
          <GoogleGIcon />
        )}
        <span className="font-bold tracking-tight text-[11px]">Continue with Google</span>
      </button>
    );
  }

  if (variant === 'card') {
    if (user) {
      return (
        <div className={`p-4 sm:p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 shadow-sm ${className}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-[var(--accent-orange)]/40 p-0.5 bg-[var(--bg-surface)] shrink-0">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Athlete'} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-full bg-[var(--accent-orange)] text-white text-base font-black flex items-center justify-center rounded-xl">
                    {(user.displayName || user.email || 'A')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-black text-[var(--text-primary)]">
                    {user.displayName || profile?.displayName || 'HypeAthe Athlete'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)]">
                    Google Auth
                  </span>
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5 truncate max-w-[200px] sm:max-w-none">
                  {user.email}
                </div>
              </div>
            </div>

            <button
              onClick={signOutUser}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className={`p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 shadow-sm ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shrink-0 border border-stone-200">
            <GoogleGIcon />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)]">
              Google Athlete Account
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Sign in to back up workouts to Firestore and sync across all devices.
            </p>
          </div>
        </div>

        <button
          onClick={handleAction}
          disabled={actionLoading}
          className="w-full py-3 px-4 rounded-2xl bg-white text-stone-900 hover:bg-stone-100 font-extrabold text-xs shadow-md border border-stone-200 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] cursor-pointer"
        >
          {actionLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-orange)]" />
          ) : (
            <GoogleGIcon />
          )}
          <span className="text-sm tracking-tight font-black">Continue with Google</span>
        </button>
      </div>
    );
  }

  // Default Primary Button
  return (
    <button
      onClick={handleAction}
      disabled={actionLoading}
      className={`w-full py-3.5 px-4 rounded-2xl bg-white text-stone-900 hover:bg-stone-50 font-black text-sm shadow-md border border-stone-200 flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer ${className}`}
    >
      {actionLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-orange)]" />
      ) : user ? (
        <>
          <LogOut className="w-4 h-4 text-rose-500" />
          <span>Sign Out ({user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Athlete'})</span>
        </>
      ) : (
        <>
          <GoogleGIcon />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
};
