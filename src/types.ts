export type ThemeMode = 'dark' | 'light' | 'system';
export type UnitMode = 'km' | 'mi';

export type ActivityType = 
  | 'Running'
  | 'Walking'
  | 'Cycling'
  | 'Biking'
  | 'Sprinting'
  | 'Hiking';

export interface SplitItem {
  km: number;
  pace: string;
  elevation: string;
  diff: string; // e.g., "-0:04"
  timeSeconds?: number;
}

export interface GpsCoordinate {
  latitude: number;
  longitude: number;
  timestamp: number;
  altitude?: number | null;
  accuracy?: number | null;
  speed?: number | null;
}

export type GpsStatus = 
  | 'idle'
  | 'requesting-permission'
  | 'waiting-gps'
  | 'gps-acquired'
  | 'signal-weak'
  | 'unavailable'
  | 'permission-denied';

export type TrackingState = 'idle' | 'recording' | 'paused' | 'finished';

export interface GpsDebugInfo {
  geolocationAvailable: boolean;
  isSecureContext: boolean;
  permissionsApiStatus: 'granted' | 'denied' | 'prompt' | 'unsupported';
  requestStatus: 'idle' | 'requesting' | 'success' | 'error';
  errorCode: number | null;
  errorMessage: string | null;
  lastAccuracy: number | null;
  requestTimestamp: number | null;
  successTimestamp: number | null;
}

export interface ActiveSessionData {
  sessionId: string;
  activityType: ActivityType;
  trackingState: TrackingState;
  startTime: number | null;
  elapsedSeconds: number;
  pausedAt: number | null;
  distanceKm: number;
  coordinates: GpsCoordinate[];
  lastSavedTimestamp: number;
  calories: number;
  splits: SplitItem[];
}

/**
 * Standard IndexedDB Activity Record stored in HypeAtheDB
 */
export interface ActivityRecord {
  id: string;
  activityType: ActivityType;
  title: string;
  startTimestamp?: number;
  endTimestamp?: number;
  activeDuration?: number; // in seconds
  durationFormatted: string;
  distanceKm: number;
  pace: string; // e.g. "5:29" (min/km)
  speedKmh?: number; // e.g. 10.95
  calories: number;
  coordinates?: GpsCoordinate[];
  gpsAccuracy?: number | null;
  gpsPointCount?: number;
  splits: SplitItem[];
  elevationGainM: number;
  date: string;
  timeOfDay: string;
  creationTimestamp?: number;
  isRealGpsRun?: boolean;
  avgPace?: string;
  bestPace?: string;
  durationMinutes?: number;
  type?: string;
  heartRateAvg?: number;
}

// Backward-compatible alias for legacy Activity
export type Activity = ActivityRecord;

export interface ActivityModeInfo {
  type: ActivityType;
  label: string;
  iconName: string;
  primaryMetric: 'pace' | 'speed';
  paceUnit: string;
  speedUnit: string;
  calorieFactorPerKm: number;
  description: string;
  accentColor: string;
}

export interface RouteItem {
  id: string;
  name: string;
  location: string;
  distanceKm: number;
  elevationGainM: number;
  difficulty: 'Easy' | 'Moderate' | 'Challenging';
  rating: number;
  reviewsCount: number;
  category: 'Popular' | 'Hill Runs' | '5K' | 'Trail' | 'Tempo';
  bookmarked?: boolean;
  coordinates?: [number, number][];
}

export interface RunningLocation {
  id: string;
  name: string;
  routesCount: number;
  city: string;
  popularType: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timeAgo: string;
  title: string;
  caption: string;
  distanceKm?: number;
  durationFormatted?: string;
  avgPace?: string;
  elevationM?: number;
  kudosCount: number;
  hasKudos: boolean;
  commentsCount: number;
  comments: Array<{
    id: string;
    author: string;
    text: string;
    timeAgo: string;
  }>;
  type: 'run' | 'photo' | 'milestone';
  photoType?: 'sunrise' | 'trail' | 'mountain';
}

export interface PersonalRecord {
  id: string;
  label: string;
  time: string;
  date: string;
  pace: string;
  distanceKm?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

// Phase 3 Advanced Maps & Filters
export type MapType = 'standard' | 'satellite' | 'terrain';

export type NearbyPlaceCategory = 
  | 'Parks'
  | 'Running Tracks'
  | 'Stadiums'
  | 'Gyms'
  | 'Sports Grounds'
  | 'Cycling Routes'
  | 'Hiking Trails';

export type MapLayerKey = 'roads' | 'buildings' | 'labels' | 'traffic' | 'transit';

export interface NearbyPlace {
  id: string;
  name: string;
  category: NearbyPlaceCategory;
  lat: number;
  lng: number;
  distanceMeters?: number;
  address?: string;
  tags?: Record<string, string>;
}

export interface HistoryFilterState {
  activity: ActivityType | 'All';
  dateRange: 'All' | 'Today' | 'This Week' | 'This Month' | 'Custom';
  customStartDate?: string;
  customEndDate?: string;
  distanceRange: 'All' | 'Under 2 km' | '2–5 km' | '5–10 km' | '10–20 km' | 'Above 20 km';
}

// ==========================================
// Phase 5: Social & Community + Stats Studio Types
// ==========================================

export interface AthleteProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  isPro?: boolean;
  followingCount: number;
  followersCount: number;
  totalDistanceKm: number;
  workoutsCount: number;
  isFollowing?: boolean;
  location?: string;
  primarySport?: ActivityType;
}

export interface CommentItem {
  id: string;
  author: string;
  authorHandle?: string;
  authorAvatar?: string;
  text: string;
  timeAgo: string;
  isOwn?: boolean;
}

export interface SocialPost {
  id: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorAvatar: string;
  timeAgo: string;
  title: string;
  caption?: string;
  activityType?: ActivityType;
  distanceKm?: number;
  durationFormatted?: string;
  avgPace?: string;
  speedKmh?: number;
  elevationM?: number;
  coordinates?: GpsCoordinate[];
  posterImageUrl?: string;
  kudosCount: number;
  hasKudos: boolean;
  comments: CommentItem[];
  category: 'Following' | 'Discover';
  sportType: ActivityType | 'General';
  isUserGenerated?: boolean;
  isDemo?: boolean;
}

export interface ChallengeItem {
  id: string;
  title: string;
  description: string;
  targetKm: number;
  targetActivity?: ActivityType | 'All';
  deadline: string;
  daysRemaining: number;
  rewardBadge: string;
  joined: boolean;
  category: 'Monthly' | 'Weekly' | 'Special';
  coverGradient?: string;
}

export interface LeaderboardItem {
  id: string;
  rank: number;
  name: string;
  username: string;
  avatar: string;
  distanceKm: number;
  workoutsCount: number;
  isCurrentUser?: boolean;
  change?: 'up' | 'down' | 'same';
  badge?: string;
}

export interface NotificationItem {
  id: string;
  type: 'kudos' | 'comment' | 'follow' | 'challenge' | 'system';
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  avatar?: string;
  actionText?: string;
}

export type StatsPosterTemplate = 
  | 'one-day'        // One Day / Day One (Bold athletic typography)
  | 'minimal-stats'  // Minimal Stats (Ultra-clean, modern telemetry)
  | 'photo-overlay'  // Photo Overlay (Translucent frosted glass HUD bar)
  | 'route-focus'    // Route Focus (Glowing GPS route polyline front & center)
  | 'athlete-summary';// Athlete Summary (Comprehensive performance badge)

export type StatsAspectRatio = '9:16' | '1:1';

export interface StatsStudioConfig {
  template: StatsPosterTemplate;
  aspectRatio: StatsAspectRatio;
  photoUrl: string | null;
  photoScale: number;
  photoOffsetX: number;
  photoOffsetY: number;
  scrimOpacity: number; // 0 to 0.8
  textColor: 'white' | 'orange' | 'black';
  overlayPosition: 'top' | 'center' | 'bottom' | 'split';
  showDistance: boolean;
  showPace: boolean;
  showDuration: boolean;
  showCalories: boolean;
  showElevation: boolean;
  showDate: boolean;
  showHeartRate: boolean;
  showRouteLine: boolean;
  showWatermark: boolean;
  customQuote?: string;
}

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  preferredUnits: UnitMode;
  privacySettings: {
    profilePublic: boolean;
    shareActivities: boolean;
  };
}

