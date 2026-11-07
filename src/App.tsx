import React, { useState, useEffect } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from './config/maps';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/auth/SplashScreen';
import { AuthContainer } from './components/auth/AuthContainer';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/screens/HomeScreen';
import { ExploreScreen } from './components/screens/ExploreScreen';
import { LiveRunScreen } from './components/screens/LiveRunScreen';
import { WorkoutHistoryScreen } from './components/screens/WorkoutHistoryScreen';
import { FeedScreen } from './components/screens/FeedScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { ActivityDetailsScreen } from './components/screens/ActivityDetailsScreen';
import { AnalyticsScreen } from './components/screens/AnalyticsScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { StatsStudioScreen } from './components/screens/StatsStudioScreen';
import { NotificationsScreen } from './components/screens/NotificationsScreen';
import { CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentScreen, toastMessage } = useApp();
  const { user, loading: authLoading } = useAuth();
  const [deviceWidth, setDeviceWidth] = useState<'360' | '390' | '412' | 'tablet' | 'full'>('full');
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // 1. Show Splash Screen while checking initial Firebase session
  if (authLoading) {
    return <SplashScreen />;
  }

  const getFrameWidthClass = () => {
    switch (deviceWidth) {
      case '360':
        return 'max-w-[360px]';
      case '390':
        return 'max-w-[390px]';
      case '412':
        return 'max-w-[412px]';
      case 'tablet':
        return 'max-w-[768px]';
      case 'full':
        return 'w-full';
    }
  };

  // 2. Protected Screen Router: If unauthenticated, redirect to Welcome/Auth container
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
        {/* Desktop Responsive Toolbar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-[var(--bg-secondary)] border-b border-[var(--text-secondary)]/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[var(--text-primary)]">HypeAthe Authentication:</span>
            <span className="text-[var(--text-secondary)]">Sign in required to access private athletic telemetry</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[var(--text-secondary)] mr-1">Preview:</span>
            {(
              [
                { id: 'full', label: 'Responsive (Auto)' },
                { id: 'tablet', label: 'Tablet (768px)' },
                { id: '412', label: 'Large Mobile (412px)' },
                { id: '390', label: 'Mobile (390px)' },
                { id: '360', label: 'Compact (360px)' }
              ] as const
            ).map(opt => (
              <button
                key={opt.id}
                onClick={() => setDeviceWidth(opt.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  deviceWidth === opt.id
                    ? 'bg-[var(--accent-orange)] text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Auth Container */}
        <div className={`mx-auto w-full ${getFrameWidthClass()} relative min-h-screen shadow-2xl`}>
          <AuthContainer />
        </div>

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-xl text-white text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
            <CheckCircle2 className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Authenticated Screen Router
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'live-run':
        return <LiveRunScreen />;
      case 'history':
        return <WorkoutHistoryScreen />;
      case 'feed':
        return <FeedScreen />;
      case 'profile':
        return <ProfileScreen />;
      case 'activity-details':
        return <ActivityDetailsScreen />;
      case 'analytics':
        return <AnalyticsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'stats-studio':
        return <StatsStudioScreen />;
      case 'notifications':
        return <NotificationsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Sticky Google Maps Quota Warning Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Desktop Responsive Toolbar (Visible only on lg+ viewports for product testing) */}
      <div className="hidden lg:flex items-center justify-between px-6 py-2 bg-[var(--bg-secondary)] border-b border-[var(--text-secondary)]/10 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--text-primary)]">HypeAthe Device Mode:</span>
          <span className="text-[var(--text-secondary)]">Optimized for Mobile, Tablet & Desktop</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[var(--text-secondary)] mr-1">Preview:</span>
          {(
            [
              { id: 'full', label: 'Responsive (Auto)' },
              { id: 'tablet', label: 'Tablet (768px)' },
              { id: '412', label: 'Large Mobile (412px)' },
              { id: '390', label: 'Mobile (390px)' },
              { id: '360', label: 'Compact (360px)' }
            ] as const
          ).map(opt => (
            <button
              key={opt.id}
              onClick={() => setDeviceWidth(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                deviceWidth === opt.id
                  ? 'bg-[var(--accent-orange)] text-white shadow-sm'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Authenticated App Container */}
      <div className={`mx-auto w-full ${getFrameWidthClass()} relative min-h-screen shadow-2xl`}>
        {renderScreen()}
        <BottomNav />
      </div>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-auto px-4 py-2.5 rounded-2xl bg-black/85 backdrop-blur-xl text-white text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppProvider>
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places', 'geometry', 'marker']}>
            <MainContent />
          </APIProvider>
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
