import React, { useState, useEffect, useRef } from 'react';
import {
  Pause,
  Play,
  Square,
  Settings,
  X,
  Flame,
  Gauge,
  Clock,
  AlertCircle,
  RefreshCw,
  Info,
  MapPin,
  Terminal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleMapView } from '../GoogleMapView';
import { useGpsTracker } from '../../hooks/useGpsTracker';
import { GpsStatus, ActivityType } from '../../types';
import { getActivityIcon, ACTIVITY_MODES } from '../../utils/activityModes';
import { ActivitySelectorModal } from '../ActivitySelectorModal';

export const LiveRunScreen: React.FC = () => {
  const { navigateTo, formatDistance, formatSpeed, formatPace, addActivity, activeMode, setActiveMode } = useApp();
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const [showModeModal, setShowModeModal] = useState(false);
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);
  const [showSpeedPrimary, setShowSpeedPrimary] = useState(
    activeMode === 'Cycling' || activeMode === 'Biking'
  );

  const {
    activityType,
    setActivityType,
    trackingState,
    gpsStatus,
    currentPosition,
    routeCoordinates,
    distanceKm,
    durationFormatted,
    currentPace,
    avgPace,
    currentSpeedKmh,
    avgSpeedKmh,
    calories,
    errorMessage,
    debugInfo,
    hasRecoveredSession,
    startRun,
    retryLocation,
    pauseRun,
    resumeRun,
    finishRun,
    discardRun,
    dismissRecovery
  } = useGpsTracker(activeMode);

  // Sync mode with tracker hook
  useEffect(() => {
    setActivityType(activeMode);
    setShowSpeedPrimary(activeMode === 'Cycling' || activeMode === 'Biking');
  }, [activeMode, setActivityType]);

  // Guard to ensure auto-start fires only ONCE on initial mount
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartedRef.current && trackingState === 'idle' && !hasRecoveredSession) {
      autoStartedRef.current = true;
      startRun(false, activeMode);
    }
  }, [trackingState, hasRecoveredSession, startRun, activeMode]);

  const handleFinish = async () => {
    const completedActivity = await finishRun();
    await addActivity(completedActivity);
    navigateTo('activity-details');
  };

  const handleDiscard = () => {
    discardRun();
    setShowExitConfirm(false);
    navigateTo('home');
  };

  const formattedDist = formatDistance(distanceKm);
  const CurrentModeIcon = getActivityIcon(activityType);

  const getGpsStatusBadge = (status: GpsStatus, accuracy?: number | null) => {
    switch (status) {
      case 'gps-acquired':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-semibold shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-[#42C77A] animate-pulse" />
            <span>GPS Active {accuracy ? `(±${Math.round(accuracy)}m)` : ''}</span>
          </div>
        );
      case 'signal-weak':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-amber-400 text-xs font-semibold shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span>Weak GPS {accuracy ? `(±${Math.round(accuracy)}m)` : ''}</span>
          </div>
        );
      case 'requesting-permission':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-sky-400 text-xs font-semibold shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-ping" />
            <span>Requesting Permission...</span>
          </div>
        );
      case 'waiting-gps':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-amber-300 text-xs font-semibold shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Locking GPS Signal...</span>
          </div>
        );
      case 'permission-denied':
        return (
          <button
            onClick={() => setShowPermissionHelp(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-600/90 text-white text-xs font-semibold shadow-md cursor-pointer hover:bg-rose-700"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span>Permission Denied (Fix)</span>
          </button>
        );
      case 'unavailable':
      default:
        return (
          <button
            onClick={retryLocation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-rose-400 text-xs font-semibold shadow-md hover:bg-black/90 cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>GPS Unavailable (Retry)</span>
          </button>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
      case 'granted':
      case 'Available':
      case 'Yes':
        return 'text-emerald-400 font-bold';
      case 'requesting':
      case 'prompt':
        return 'text-amber-400 font-bold';
      case 'error':
      case 'denied':
      case 'Unavailable':
      case 'No':
        return 'text-rose-400 font-bold';
      default:
        return 'text-stone-300';
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--bg-main)] w-full max-w-4xl mx-auto flex flex-col justify-between overflow-hidden">
      {/* Top Floating App Bar */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Activity Mode Selector Badge */}
          <button
            onClick={() => setShowModeModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-white text-xs font-bold shadow-md hover:bg-black/90 transition-colors cursor-pointer border border-white/10"
            title="Change activity mode"
          >
            <CurrentModeIcon className="w-3.5 h-3.5 text-[var(--accent-orange)] stroke-[2.5]" />
            <span>{activityType}</span>
            <ChevronDown className="w-3 h-3 text-stone-400" />
          </button>

          {/* Dynamic GPS Status Indicator */}
          {getGpsStatusBadge(gpsStatus, currentPosition?.accuracy)}
        </div>

        {/* Action icons (Settings, Debug Toggle & Close) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDebugExpanded(prev => !prev)}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors shadow-md cursor-pointer ${
              isDebugExpanded ? 'bg-[var(--accent-orange)] text-white' : 'bg-black/60 text-white/80 hover:bg-black/80'
            }`}
            title="Toggle GPS Diagnostic Panel"
            aria-label="Toggle GPS Diagnostic Panel"
          >
            <Terminal className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigateTo('settings')}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md cursor-pointer"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowExitConfirm(true)}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md cursor-pointer"
            aria-label="Exit workout"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recovered Session Notice Banner */}
      {hasRecoveredSession && (
        <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[var(--bg-secondary)]/95 dark:bg-[#181A18]/95 backdrop-blur-xl text-xs shadow-lg border border-[var(--accent-orange)]/40">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--accent-orange)]" />
            <span className="font-bold text-[var(--text-primary)]">
              {activityType} session restored from storage ({formattedDist.value} {formattedDist.unit})
            </span>
          </div>
          <button
            onClick={dismissRecovery}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* DIAGNOSTIC DEBUG PANEL */}
      {isDebugExpanded && (
        <div className="absolute top-16 left-4 right-4 z-30 pointer-events-auto">
          <div className="bg-stone-950/92 dark:bg-[#121412]/95 text-white backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden text-xs">
            <div
              onClick={() => setIsDebugExpanded(false)}
              className="px-3.5 py-2.5 flex items-center justify-between cursor-pointer select-none border-b border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center gap-2 font-mono font-bold text-[11px] tracking-wide text-stone-200">
                <Terminal className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                <span>GPS DIAGNOSTIC PANEL</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                  debugInfo.requestStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                  debugInfo.requestStatus === 'requesting' ? 'bg-amber-500/20 text-amber-300' :
                  debugInfo.requestStatus === 'error' ? 'bg-rose-500/20 text-rose-300' : 'bg-stone-800 text-stone-400'
                }`}>
                  {debugInfo.requestStatus}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    retryLocation();
                  }}
                  className="px-2 py-0.5 rounded bg-[var(--accent-orange)] text-white text-[10px] font-bold hover:opacity-90 flex items-center gap-1"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Probe GPS</span>
                </button>
                <ChevronUp className="w-3.5 h-3.5 text-stone-400" />
              </div>
            </div>

            <div className="p-3 font-mono space-y-1.5 text-[11px] leading-relaxed">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-stone-400">Geolocation API:</span>
                  <span className={getStatusColor(debugInfo.geolocationAvailable ? 'Available' : 'Unavailable')}>
                    {debugInfo.geolocationAvailable ? 'Available' : 'Unavailable'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-stone-400">Secure Context:</span>
                  <span className={getStatusColor(debugInfo.isSecureContext ? 'Yes' : 'No')}>
                    {debugInfo.isSecureContext ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-stone-400">Permission API:</span>
                  <span className={`capitalize ${getStatusColor(debugInfo.permissionsApiStatus)}`}>
                    {debugInfo.permissionsApiStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-stone-400">Request Status:</span>
                  <span className={`capitalize ${getStatusColor(debugInfo.requestStatus)}`}>
                    {debugInfo.requestStatus}
                  </span>
                </div>

                <div className="col-span-2 flex justify-between items-center py-0.5 border-b border-white/5">
                  <span className="text-stone-400">Last GPS Accuracy:</span>
                  <span className="text-stone-100 font-bold">
                    {debugInfo.lastAccuracy !== null ? `±${Math.round(debugInfo.lastAccuracy * 10) / 10} m` : 'None yet'}
                  </span>
                </div>
              </div>

              {/* Error Code & Message */}
              <div className="pt-1">
                <div className="text-stone-400 text-[10px]">Error Code & Message:</div>
                <div className={`mt-0.5 p-1.5 rounded text-[10px] break-words ${
                  debugInfo.errorCode !== null || debugInfo.errorMessage
                    ? 'bg-rose-950/60 text-rose-300 border border-rose-800/40'
                    : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/20'
                }`}>
                  {debugInfo.errorCode !== null ? (
                    <span>
                      <strong className="text-rose-200">Error Code {debugInfo.errorCode}:</strong>{' '}
                      {debugInfo.errorMessage || 'No error message provided by browser'}
                    </span>
                  ) : debugInfo.errorMessage ? (
                    <span>{debugInfo.errorMessage}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3 inline" /> No error — GPS pipeline healthy
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real Interactive Google Map Area */}
      <div className="relative w-full h-[52vh] md:h-[58vh]">
        <GoogleMapView
          currentPosition={currentPosition}
          routeCoordinates={routeCoordinates}
          isTracking={trackingState === 'recording'}
          height="h-full"
          showControls={true}
          interactive={true}
          autoCenterDefault={true}
          className="rounded-b-3xl rounded-t-none"
        />

        {/* GPS Permission Warning Overlay if Denied */}
        {gpsStatus === 'permission-denied' && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center text-white">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-black mb-1">Location Access Required</h3>
            <p className="text-xs text-white/80 max-w-sm mb-3 leading-relaxed">
              HypeAthe requires real GPS to track your route, pace, and athletic performance. Please enable location permissions in your browser.
            </p>
            {errorMessage && (
              <p className="text-[11px] font-mono text-rose-300 bg-rose-950/60 border border-rose-800/40 px-3 py-1.5 rounded-lg mb-4 max-w-xs break-words">
                {errorMessage}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowPermissionHelp(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-stone-900 text-xs font-bold hover:bg-stone-100 cursor-pointer"
              >
                How to Enable
              </button>
              <button
                onClick={retryLocation}
                className="px-4 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold hover:opacity-90 cursor-pointer shadow-md"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Drawer / Control Panel */}
      <div className="flex-1 -mt-6 z-20 rounded-t-3xl bg-[var(--bg-secondary)] dark:bg-[#181A18] px-6 pt-5 pb-8 shadow-[0_-8px_30px_rgba(0,0,0,0.18)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.45)] flex flex-col justify-between">
        {/* Distance Display */}
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-5xl md:text-6xl font-black tracking-tight text-[var(--text-primary)] font-tabular leading-none">
              {formattedDist.value}
            </span>
            <span className="text-xl md:text-2xl font-bold text-[var(--text-secondary)]">
              {formattedDist.unit}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSpeedPrimary(prev => !prev)}
              className="text-[10px] font-bold text-[var(--accent-orange)] px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/10 cursor-pointer hover:bg-[var(--accent-orange)]/20 transition-colors"
            >
              {showSpeedPrimary ? 'View Pace' : 'View Speed'}
            </button>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
              <span className="font-tabular">{routeCoordinates.length} pts</span>
            </div>
          </div>
        </div>

        {/* Primary Metrics Row (Live Timer & Current Pace/Speed) */}
        <div className="grid grid-cols-2 gap-4 py-3 border-y border-[var(--text-secondary)]/10">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                Duration
              </div>
              <div className="text-2xl font-black text-[var(--text-primary)] font-tabular">
                {durationFormatted}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                {showSpeedPrimary ? 'Current Speed' : 'Current Pace'}
              </div>
              <div className="text-2xl font-black text-[var(--text-primary)] font-tabular">
                {showSpeedPrimary
                  ? `${currentSpeedKmh.toFixed(1)} km/h`
                  : currentPace !== '--:--' ? `${currentPace} /km` : '--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics Row (Calories & Avg Pace/Speed) */}
        <div className="grid grid-cols-2 gap-4 py-2.5">
          <div className="flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                Est. Calories
              </div>
              <div className="text-base font-extrabold text-[var(--text-primary)] font-tabular">
                {calories} kcal
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Gauge className="w-4 h-4 text-[var(--accent-orange)] shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">
                {showSpeedPrimary ? 'Avg Speed' : 'Avg Pace'}
              </div>
              <div className="text-base font-extrabold text-[var(--text-primary)] font-tabular">
                {showSpeedPrimary
                  ? `${avgSpeedKmh.toFixed(1)} km/h`
                  : avgPace !== '--:--' ? `${avgPace} /km` : '--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Actions: Start, Pause, Resume, and Finish */}
        <div className="flex items-center gap-3 mt-2">
          {trackingState === 'idle' ? (
            <button
              onClick={() => startRun(false, activityType)}
              className="w-full h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-white text-base bg-[var(--accent-orange)] hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start {activityType}</span>
            </button>
          ) : (
            <>
              {/* Circular Pause/Resume Button */}
              <button
                onClick={trackingState === 'recording' ? pauseRun : resumeRun}
                className="w-14 h-14 rounded-full bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--text-secondary)]/15 flex items-center justify-center hover:bg-[var(--text-secondary)]/15 active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
                aria-label={trackingState === 'recording' ? 'Pause workout' : 'Resume workout'}
                title={trackingState === 'recording' ? 'Pause workout' : 'Resume workout'}
              >
                {trackingState === 'paused' ? (
                  <Play className="w-5 h-5 fill-current ml-0.5 text-[var(--accent-orange)]" />
                ) : (
                  <Pause className="w-5 h-5 fill-current" />
                )}
              </button>

              {/* Prominent Finish Button */}
              <button
                onClick={handleFinish}
                className="flex-1 h-14 rounded-2xl flex items-center justify-center gap-2.5 font-black text-white text-base bg-[var(--accent-orange)] hover:opacity-95 shadow-md active:scale-[0.98] transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white" />
                <span>Finish</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mode Selector Modal */}
      <ActivitySelectorModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        currentMode={activityType}
        onSelectMode={(mode) => {
          setActiveMode(mode);
          setActivityType(mode);
          setShowSpeedPrimary(mode === 'Cycling' || mode === 'Biking');
          if (trackingState === 'idle') {
            startRun(false, mode);
          }
        }}
      />

      {/* Exit Confirmation Dialog */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-black text-[var(--text-primary)] mb-2">
              Discard this {activityType} session?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
              Your recorded GPS path ({formattedDist.value} {formattedDist.unit}) and elapsed workout time will be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold cursor-pointer"
              >
                Keep Going
              </button>
              <button
                onClick={handleDiscard}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permission Help Dialog */}
      {showPermissionHelp && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-3xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-2 text-[var(--accent-orange)] mb-3">
              <Info className="w-5 h-5" />
              <h3 className="text-base font-black text-[var(--text-primary)]">
                How to Enable Location
              </h3>
            </div>
            <div className="text-xs text-[var(--text-secondary)] flex flex-col gap-2.5 mb-5 leading-relaxed">
              <p>
                <strong>Chrome / Android:</strong> Tap the lock or tune icon in the browser address bar → <em>Permissions</em> → set <em>Location</em> to <strong>Allow</strong>.
              </p>
              <p>
                <strong>iOS Safari:</strong> Open iOS Settings → <em>Safari</em> → <em>Location</em> → select <strong>Allow</strong> or <strong>Ask</strong>.
              </p>
              <p>
                <strong>Device GPS:</strong> Ensure Location/GPS toggle is turned ON in your phone's quick settings.
              </p>
            </div>
            <button
              onClick={() => {
                setShowPermissionHelp(false);
                retryLocation();
              }}
              className="w-full py-3 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold cursor-pointer"
            >
              Retry GPS Connection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
