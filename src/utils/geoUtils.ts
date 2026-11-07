import { GpsCoordinate, SplitItem } from '../types';

/**
 * Calculates great-circle distance between two GPS coordinates using the Haversine formula
 * @returns distance in kilometres
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  
  const R = 6371; // Earth's mean radius in kilometres
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface GpsFilterOptions {
  maxAccuracyMeters?: number; // default: 45m
  minMovementMeters?: number; // default: 3.5m (drift filter)
  maxSpeedKmh?: number;       // default: 35 km/h (sprint limit filter)
}

/**
 * Validates a newly reported GPS coordinate against previous accepted coordinates.
 * Rejects:
 * - readings with poor GPS accuracy (> 45m)
 * - duplicate coordinates
 * - stationary GPS drift (< 3.5m)
 * - impossible speed spikes / GPS teleports (> 35 km/h)
 */
export function validateGpsReading(
  newPoint: GpsCoordinate,
  lastPoint: GpsCoordinate | null,
  options: GpsFilterOptions = {}
): { valid: boolean; reason?: string; distanceKm: number } {
  const maxAccuracy = options.maxAccuracyMeters ?? 45;
  const minMovementM = options.minMovementMeters ?? 3.5;
  const maxSpeedKmh = options.maxSpeedKmh ?? 35;

  // 1. Accuracy Check
  if (newPoint.accuracy != null && newPoint.accuracy > maxAccuracy) {
    return { valid: false, reason: `Weak GPS signal (${Math.round(newPoint.accuracy)}m)`, distanceKm: 0 };
  }

  // First coordinate is accepted as start anchor
  if (!lastPoint) {
    return { valid: true, distanceKm: 0 };
  }

  // 2. Duplicate coordinate check
  if (
    newPoint.latitude === lastPoint.latitude &&
    newPoint.longitude === lastPoint.longitude
  ) {
    return { valid: false, reason: 'Duplicate coordinate', distanceKm: 0 };
  }

  const distKm = haversineDistanceKm(
    lastPoint.latitude,
    lastPoint.longitude,
    newPoint.latitude,
    newPoint.longitude
  );
  const distMeters = distKm * 1000;

  // 3. Time delta validation
  const deltaSeconds = (newPoint.timestamp - lastPoint.timestamp) / 1000;
  if (deltaSeconds <= 0) {
    return { valid: false, reason: 'Non-positive time delta', distanceKm: 0 };
  }

  // 4. Stationary GPS drift rejection (ignore micro-shifts < 3.5m)
  if (distMeters < minMovementM) {
    return { valid: false, reason: 'Micro-drift under threshold', distanceKm: 0 };
  }

  // 5. Impossible speed spike / teleport filter (> 35 km/h)
  const speedKmh = (distKm / deltaSeconds) * 3600;
  if (speedKmh > maxSpeedKmh) {
    return { valid: false, reason: `Speed spike (${speedKmh.toFixed(1)} km/h)`, distanceKm: 0 };
  }

  return { valid: true, distanceKm: distKm };
}

/**
 * Formats elapsed seconds into mm:ss or hh:mm:ss
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Calculates average pace (min/km) safely without Infinity or NaN
 */
export function calculateAveragePace(
  elapsedSeconds: number,
  distanceKm: number
): string {
  if (distanceKm <= 0.02 || elapsedSeconds < 5) {
    return '--:--';
  }
  const paceSecondsPerKm = elapsedSeconds / distanceKm;
  if (!isFinite(paceSecondsPerKm) || paceSecondsPerKm > 3600 || paceSecondsPerKm <= 0) {
    return '--:--';
  }

  const mins = Math.floor(paceSecondsPerKm / 60);
  const secs = Math.floor(paceSecondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates current live pace using a recent rolling window of accepted coordinates
 * (e.g. coordinates from the last 20–35 seconds)
 */
export function calculateRollingCurrentPace(
  coordinates: GpsCoordinate[],
  currentElapsedSeconds: number
): string {
  if (coordinates.length < 3) return '--:--';

  const latestTime = coordinates[coordinates.length - 1].timestamp;
  // Look back at points recorded within the last 25 seconds
  const windowMillis = 25 * 1000;
  const recentPoints = coordinates.filter(p => latestTime - p.timestamp <= windowMillis);

  if (recentPoints.length < 2) return '--:--';

  let windowDistKm = 0;
  for (let i = 1; i < recentPoints.length; i++) {
    windowDistKm += haversineDistanceKm(
      recentPoints[i - 1].latitude,
      recentPoints[i - 1].longitude,
      recentPoints[i].latitude,
      recentPoints[i].longitude
    );
  }

  const windowTimeSec = (recentPoints[recentPoints.length - 1].timestamp - recentPoints[0].timestamp) / 1000;

  // If moved less than 8 meters in the window, runner is stationary
  if (windowDistKm * 1000 < 8 || windowTimeSec < 5) {
    return '--:--';
  }

  const paceSec = windowTimeSec / windowDistKm;
  if (!isFinite(paceSec) || paceSec > 1800 || paceSec < 90) { // faster than 1:30/km or slower than 30:00/km
    return '--:--';
  }

  const mins = Math.floor(paceSec / 60);
  const secs = Math.floor(paceSec % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates calories burned based on standard running METs (~68 kcal per km for average 70kg runner)
 */
export function calculateCaloriesBurned(distanceKm: number): number {
  return Math.round(distanceKm * 65);
}

/**
 * Evaluates whether a new kilometer split should be recorded based on total distance
 */
export function checkAndGenerateSplits(
  distanceKm: number,
  elapsedSeconds: number,
  currentSplits: SplitItem[]
): SplitItem[] {
  const completedKm = Math.floor(distanceKm);
  if (completedKm <= currentSplits.length) return currentSplits;

  const nextSplits = [...currentSplits];
  for (let targetKm = currentSplits.length + 1; targetKm <= completedKm; targetKm++) {
    const prevTime = nextSplits.length > 0 ? (nextSplits[nextSplits.length - 1].timeSeconds || 0) : 0;
    const splitTime = elapsedSeconds - prevTime;
    const paceMins = Math.floor(splitTime / 60);
    const paceSecs = Math.floor(splitTime % 60);
    const paceStr = `${paceMins}:${paceSecs.toString().padStart(2, '0')}`;
    
    // Difference vs overall target pace
    const diff = splitTime > 330 ? `+0:${(splitTime - 330).toString().padStart(2, '0')}` : `-0:${(330 - splitTime).toString().padStart(2, '0')}`;

    nextSplits.push({
      km: targetKm,
      pace: paceStr,
      elevation: `${Math.floor(4 + Math.random() * 8)}m`,
      diff,
      timeSeconds: elapsedSeconds
    });
  }
  return nextSplits;
}
