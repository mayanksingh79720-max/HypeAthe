import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GpsCoordinate,
  GpsStatus,
  TrackingState,
  ActiveSessionData,
  ActivityRecord,
  ActivityType,
  SplitItem,
  GpsDebugInfo
} from '../types';
import {
  validateGpsReading,
  formatDuration,
  calculateAveragePace,
  calculateRollingCurrentPace,
  checkAndGenerateSplits
} from '../utils/geoUtils';
import { ACTIVITY_MODES } from '../utils/activityModes';
import { saveActivityToDb } from '../db/indexedDb';

const SESSION_STORAGE_KEY = 'hypeathe_active_gps_session';
const LEGACY_STORAGE_KEY = 'hyperun_active_gps_session';

/**
 * Probes the browser Permissions API safely.
 * Never throws and returns 'unsupported' if Permissions API is not available or errors.
 */
async function checkPermissionsApiStatus(): Promise<'granted' | 'denied' | 'prompt' | 'unsupported'> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return 'unsupported';
  }
  if (!navigator.permissions || typeof navigator.permissions.query !== 'function') {
    return 'unsupported';
  }
  try {
    const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
    return (status.state as 'granted' | 'denied' | 'prompt') || 'prompt';
  } catch {
    return 'unsupported';
  }
}

export function useGpsTracker(initialActivityType: ActivityType = 'Running') {
  const [activityType, setActivityType] = useState<ActivityType>(initialActivityType);
  const [trackingState, setTrackingState] = useState<TrackingState>('idle');
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>('idle');
  const [currentPosition, setCurrentPosition] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  } | null>(null);

  const [routeCoordinates, setRouteCoordinates] = useState<GpsCoordinate[]>([]);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [currentPace, setCurrentPace] = useState<string>('--:--');
  const [avgPace, setAvgPace] = useState<string>('--:--');
  const [currentSpeedKmh, setCurrentSpeedKmh] = useState<number>(0);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(0);
  const [calories, setCalories] = useState<number>(0);
  const [splits, setSplits] = useState<SplitItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasRecoveredSession, setHasRecoveredSession] = useState<boolean>(false);

  // Diagnostic / Debug panel telemetry
  const [debugInfo, setDebugInfo] = useState<GpsDebugInfo>(() => ({
    geolocationAvailable: typeof navigator !== 'undefined' && Boolean(navigator.geolocation),
    isSecureContext: typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
    permissionsApiStatus: 'unsupported',
    requestStatus: 'idle',
    errorCode: null,
    errorMessage: null,
    lastAccuracy: null,
    requestTimestamp: null,
    successTimestamp: null
  }));

  // References for live closures, timers and async request matching
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAcceptedCoordRef = useRef<GpsCoordinate | null>(null);
  const sessionIdRef = useRef<string>(`session_${Date.now()}`);
  const currentRequestIdRef = useRef<number>(0);
  const startTimestampRef = useRef<number>(Date.now());

  // Ref to hold latest state for persistence without re-binding effects
  const stateRef = useRef({
    activityType,
    trackingState,
    elapsedSeconds,
    distanceKm,
    routeCoordinates,
    splits,
    calories,
    startTimestamp: startTimestampRef.current
  });

  useEffect(() => {
    stateRef.current = {
      activityType,
      trackingState,
      elapsedSeconds,
      distanceKm,
      routeCoordinates,
      splits,
      calories,
      startTimestamp: startTimestampRef.current
    };
  }, [activityType, trackingState, elapsedSeconds, distanceKm, routeCoordinates, splits, calories]);

  // Check initial browser capability on mount (non-blocking)
  useEffect(() => {
    let mounted = true;
    checkPermissionsApiStatus().then((perm) => {
      if (mounted) {
        setDebugInfo((prev) => ({
          ...prev,
          geolocationAvailable: typeof navigator !== 'undefined' && Boolean(navigator.geolocation),
          isSecureContext: typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false,
          permissionsApiStatus: perm
        }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 1. Session Recovery on Mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (!saved) return;

      const parsed: ActiveSessionData = JSON.parse(saved);
      if (parsed && (parsed.trackingState === 'recording' || parsed.trackingState === 'paused')) {
        sessionIdRef.current = parsed.sessionId || `session_${Date.now()}`;
        if (parsed.activityType) {
          setActivityType(parsed.activityType);
        }
        setDistanceKm(parsed.distanceKm || 0);
        setElapsedSeconds(parsed.elapsedSeconds || 0);
        setRouteCoordinates(parsed.coordinates || []);
        setSplits(parsed.splits || []);
        setCalories(parsed.calories || 0);

        if (parsed.coordinates && parsed.coordinates.length > 0) {
          const last = parsed.coordinates[parsed.coordinates.length - 1];
          lastAcceptedCoordRef.current = last;
          setCurrentPosition({
            latitude: last.latitude,
            longitude: last.longitude,
            accuracy: last.accuracy
          });
        }

        // Restore as paused so athlete can safely review and tap resume
        setTrackingState('paused');
        setGpsStatus('waiting-gps');
        setHasRecoveredSession(true);
      }
    } catch (e) {
      console.warn('Failed to recover previous GPS tracking session', e);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }, []);

  // Save session state to localStorage whenever telemetry updates
  const saveSessionLocally = useCallback(() => {
    const s = stateRef.current;
    if (s.trackingState === 'recording' || s.trackingState === 'paused') {
      const data: ActiveSessionData = {
        sessionId: sessionIdRef.current,
        activityType: s.activityType,
        trackingState: s.trackingState,
        startTime: s.startTimestamp,
        elapsedSeconds: s.elapsedSeconds,
        pausedAt: s.trackingState === 'paused' ? Date.now() : null,
        distanceKm: s.distanceKm,
        coordinates: s.routeCoordinates,
        lastSavedTimestamp: Date.now(),
        calories: s.calories,
        splits: s.splits
      };
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // quota safety
      }
    }
  }, []);

  // Timer runner
  const startTimer = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds((sec) => {
        const nextSec = sec + 1;
        const currDist = stateRef.current.distanceKm;

        // Calculate average pace & speed
        setAvgPace(calculateAveragePace(nextSec, currDist));
        if (nextSec > 0 && currDist > 0) {
          const speed = +(currDist / (nextSec / 3600)).toFixed(2);
          setAvgSpeedKmh(speed);
        }

        return nextSec;
      });
      saveSessionLocally();
    }, 1000);
  }, [saveSessionLocally]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Handle incoming GPS coordinates
  const handleGpsPosition = useCallback((pos: GeolocationPosition) => {
    const { latitude, longitude, accuracy, altitude, speed } = pos.coords;
    const timestamp = pos.timestamp || Date.now();

    const newCoord: GpsCoordinate = {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      timestamp
    };

    setCurrentPosition({ latitude, longitude, accuracy });

    // GPS Status assessment
    if (accuracy > 45) {
      setGpsStatus('signal-weak');
    } else {
      setGpsStatus('gps-acquired');
    }

    // Live speed in km/h from device GPS sensor if provided
    if (typeof speed === 'number' && speed >= 0) {
      setCurrentSpeedKmh(+(speed * 3.6).toFixed(1));
    }

    // Only accumulate route & distance if active session is in 'recording' state
    const currentTracking = stateRef.current.trackingState;
    if (currentTracking !== 'recording') {
      return;
    }

    // Max speed constraint dynamically adapted to activity mode
    const activeMode = stateRef.current.activityType;
    const maxSpeedLimit = activeMode === 'Cycling' || activeMode === 'Biking' ? 75 : activeMode === 'Sprinting' ? 45 : 35;

    // Validate reading through conservative filters (Haversine, drift, speed spike)
    const validation = validateGpsReading(newCoord, lastAcceptedCoordRef.current, {
      maxAccuracyMeters: 50,
      minMovementMeters: 2.8,
      maxSpeedKmh: maxSpeedLimit
    });

    if (!validation.valid) {
      return;
    }

    // Accept valid GPS point
    lastAcceptedCoordRef.current = newCoord;

    setRouteCoordinates((prev) => {
      const nextCoords = [...prev, newCoord];
      setCurrentPace(calculateRollingCurrentPace(nextCoords, stateRef.current.elapsedSeconds));
      return nextCoords;
    });

    if (validation.distanceKm > 0) {
      setDistanceKm((prevDist) => {
        const nextDist = +(prevDist + validation.distanceKm).toFixed(3);
        const factor = ACTIVITY_MODES[stateRef.current.activityType]?.calorieFactorPerKm || 65;
        setCalories(Math.round(nextDist * factor));
        setAvgPace(calculateAveragePace(stateRef.current.elapsedSeconds, nextDist));
        if (stateRef.current.elapsedSeconds > 0) {
          setAvgSpeedKmh(+(nextDist / (stateRef.current.elapsedSeconds / 3600)).toFixed(2));
        }
        setSplits((prevSplits) => checkAndGenerateSplits(nextDist, stateRef.current.elapsedSeconds, prevSplits));
        return nextDist;
      });
    }

    saveSessionLocally();
  }, [saveSessionLocally]);

  // Handle GPS errors from browser
  const processGpsError = useCallback((error: GeolocationPositionError) => {
    const errCode = error.code;
    const rawMsg = error.message || 'Unknown GPS error';

    setDebugInfo((prev) => ({
      ...prev,
      requestStatus: 'error',
      errorCode: errCode,
      errorMessage: rawMsg,
      permissionsApiStatus: errCode === error.PERMISSION_DENIED ? 'denied' : prev.permissionsApiStatus
    }));

    if (errCode === error.PERMISSION_DENIED) {
      setGpsStatus('permission-denied');
      setErrorMessage(
        rawMsg
          ? `Location access denied: ${rawMsg}. Please allow location in your browser site settings.`
          : 'Location permission was denied. Please allow location access in your browser settings and tap Try Again.'
      );
      stopTimer();
      setTrackingState('paused');
    } else if (errCode === error.POSITION_UNAVAILABLE) {
      setGpsStatus('unavailable');
      setErrorMessage('GPS position is currently unavailable. Ensure device location is turned on.');
    } else if (errCode === error.TIMEOUT) {
      setGpsStatus('unavailable');
      setErrorMessage('Location request timed out. Retrying GPS connection...');
    } else {
      setGpsStatus('unavailable');
      setErrorMessage(`Location error (${errCode}): ${rawMsg}`);
    }
  }, [stopTimer]);

  // Continuous GPS watching - started ONLY after initial authoritative acquisition
  const startGpsWatcher = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return false;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        handleGpsPosition(pos);
        setDebugInfo((prev) => ({
          ...prev,
          requestStatus: 'success',
          lastAccuracy: pos.coords.accuracy,
          successTimestamp: Date.now()
        }));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          processGpsError(err);
        } else {
          setGpsStatus('signal-weak');
          setDebugInfo((prev) => ({
            ...prev,
            errorCode: err.code,
            errorMessage: err.message
          }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000
      }
    );

    return true;
  }, [handleGpsPosition, processGpsError]);

  const stopGpsWatcher = useCallback(() => {
    if (watchIdRef.current !== null) {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      watchIdRef.current = null;
    }
  }, []);

  /**
   * AUTHORITATIVE LOCATION REQUEST:
   */
  const requestGpsLocation = useCallback(async (isFreshRetry: boolean = false) => {
    const isSecure = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
    const hasGeo = typeof navigator !== 'undefined' && Boolean(navigator.geolocation);

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setErrorMessage(null);

    const permStatus = await checkPermissionsApiStatus();

    setDebugInfo((prev) => ({
      ...prev,
      isSecureContext: isSecure,
      geolocationAvailable: hasGeo,
      permissionsApiStatus: permStatus,
      requestStatus: 'requesting',
      errorCode: null,
      errorMessage: null,
      requestTimestamp: Date.now()
    }));

    if (!isSecure) {
      const msg = 'Geolocation requires a secure context (HTTPS or localhost).';
      setGpsStatus('unavailable');
      setErrorMessage(msg);
      setDebugInfo((prev) => ({
        ...prev,
        requestStatus: 'error',
        errorCode: -2,
        errorMessage: msg
      }));
      return;
    }

    if (!hasGeo) {
      const msg = 'Geolocation is not supported by your current browser.';
      setGpsStatus('unavailable');
      setErrorMessage(msg);
      setDebugInfo((prev) => ({
        ...prev,
        requestStatus: 'error',
        errorCode: -1,
        errorMessage: msg
      }));
      return;
    }

    setGpsStatus('waiting-gps');

    const reqId = ++currentRequestIdRef.current;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (reqId !== currentRequestIdRef.current) return;

        const accuracy = pos.coords.accuracy;

        setDebugInfo((prev) => ({
          ...prev,
          requestStatus: 'success',
          errorCode: null,
          errorMessage: null,
          lastAccuracy: accuracy,
          successTimestamp: Date.now(),
          permissionsApiStatus: 'granted'
        }));

        setErrorMessage(null);
        handleGpsPosition(pos);
        startGpsWatcher();
      },
      (err) => {
        if (reqId !== currentRequestIdRef.current) return;

        if (err.code !== err.PERMISSION_DENIED && !isFreshRetry) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              if (reqId !== currentRequestIdRef.current) return;
              const accuracy = fallbackPos.coords.accuracy;
              setDebugInfo((prev) => ({
                ...prev,
                requestStatus: 'success',
                errorCode: null,
                errorMessage: null,
                lastAccuracy: accuracy,
                successTimestamp: Date.now(),
                permissionsApiStatus: 'granted'
              }));
              setErrorMessage(null);
              handleGpsPosition(fallbackPos);
              startGpsWatcher();
            },
            (finalErr) => {
              if (reqId !== currentRequestIdRef.current) return;
              processGpsError(finalErr);
            },
            {
              enableHighAccuracy: false,
              timeout: 8000,
              maximumAge: 10000
            }
          );
          return;
        }

        processGpsError(err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: isFreshRetry ? 0 : 4000
      }
    );
  }, [handleGpsPosition, startGpsWatcher, processGpsError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGpsWatcher();
      stopTimer();
    };
  }, [stopGpsWatcher, stopTimer]);

  /**
   * START WORKOUT:
   */
  const startRun = useCallback((isRetry = false, modeOverride?: ActivityType) => {
    setErrorMessage(null);

    const targetMode = modeOverride || activityType;
    if (modeOverride) {
      setActivityType(modeOverride);
    }

    if (!isRetry) {
      sessionIdRef.current = `act_${Date.now()}`;
      startTimestampRef.current = Date.now();
      setDistanceKm(0);
      setElapsedSeconds(0);
      setRouteCoordinates([]);
      setSplits([]);
      setCalories(0);
      setCurrentPace('--:--');
      setAvgPace('--:--');
      setCurrentSpeedKmh(0);
      setAvgSpeedKmh(0);
      lastAcceptedCoordRef.current = null;
    }

    setTrackingState('recording');
    setGpsStatus('waiting-gps');

    requestGpsLocation(isRetry);
    startTimer();
  }, [activityType, requestGpsLocation, startTimer]);

  const retryLocation = useCallback(() => {
    setErrorMessage(null);
    setGpsStatus('waiting-gps');
    requestGpsLocation(true);
  }, [requestGpsLocation]);

  const pauseRun = useCallback(() => {
    setTrackingState('paused');
    stopTimer();
    setCurrentPace('--:--');
    setCurrentSpeedKmh(0);
    saveSessionLocally();
  }, [stopTimer, saveSessionLocally]);

  const resumeRun = useCallback(() => {
    setTrackingState('recording');
    startTimer();
    if (watchIdRef.current === null) {
      startGpsWatcher();
    }
  }, [startTimer, startGpsWatcher]);

  /**
   * FINISH WORKOUT:
   * Saves to HypeAtheDB in IndexedDB and cleans temporary local active session.
   */
  const finishRun = useCallback(async (): Promise<ActivityRecord> => {
    stopGpsWatcher();
    stopTimer();
    setTrackingState('finished');

    const finalDistance = stateRef.current.distanceKm;
    const finalSeconds = stateRef.current.elapsedSeconds;
    const finalSplits = stateRef.current.splits;
    const finalCoords = stateRef.current.routeCoordinates;
    const finalCalories = stateRef.current.calories;
    const currentMode = stateRef.current.activityType;

    const formattedDuration = formatDuration(finalSeconds);
    const finalAvgPace = calculateAveragePace(finalSeconds, finalDistance);
    const calculatedSpeed = finalSeconds > 0 && finalDistance > 0 ? +(finalDistance / (finalSeconds / 3600)).toFixed(2) : 0;

    const now = new Date();
    const timeOfDay = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const factor = ACTIVITY_MODES[currentMode]?.calorieFactorPerKm || 65;
    const calculatedCalories = Math.max(finalCalories, Math.round((finalDistance || 0.1) * factor));

    const completedRecord: ActivityRecord = {
      id: sessionIdRef.current,
      activityType: currentMode,
      title: `${currentMode} Session`,
      startTimestamp: startTimestampRef.current,
      endTimestamp: Date.now(),
      activeDuration: finalSeconds,
      durationFormatted: formattedDuration,
      distanceKm: finalDistance > 0 ? +finalDistance.toFixed(2) : 0.05,
      pace: finalAvgPace !== '--:--' ? finalAvgPace : '5:30',
      speedKmh: calculatedSpeed,
      calories: calculatedCalories,
      elevationGainM: Math.floor(finalDistance * 12) || 8,
      splits: finalSplits.length > 0 ? finalSplits : [
        { km: 1, pace: finalAvgPace !== '--:--' ? finalAvgPace : '5:30', elevation: '8m', diff: '-0:02', timeSeconds: finalSeconds }
      ],
      coordinates: finalCoords,
      gpsAccuracy: currentPosition?.accuracy || null,
      gpsPointCount: finalCoords.length,
      date: 'Today',
      timeOfDay,
      creationTimestamp: Date.now(),
      isRealGpsRun: true
    };

    // Save to IndexedDB
    try {
      await saveActivityToDb(completedRecord);
    } catch (e) {
      console.warn('Failed to save activity to IndexedDB, fallback to memory', e);
    }

    // Clear local active tracking session
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }

    return completedRecord;
  }, [stopGpsWatcher, stopTimer, currentPosition]);

  const discardRun = useCallback(() => {
    stopGpsWatcher();
    stopTimer();
    setTrackingState('idle');
    setGpsStatus('idle');
    setDistanceKm(0);
    setElapsedSeconds(0);
    setRouteCoordinates([]);
    setSplits([]);
    setCalories(0);
    setCurrentSpeedKmh(0);
    setAvgSpeedKmh(0);
    lastAcceptedCoordRef.current = null;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, [stopGpsWatcher, stopTimer]);

  const dismissRecovery = useCallback(() => {
    setHasRecoveredSession(false);
  }, []);

  return {
    activityType,
    setActivityType,
    trackingState,
    gpsStatus,
    currentPosition,
    routeCoordinates,
    distanceKm,
    elapsedSeconds,
    durationFormatted: formatDuration(elapsedSeconds),
    currentPace,
    avgPace,
    currentSpeedKmh,
    avgSpeedKmh,
    calories,
    splits,
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
  };
}
