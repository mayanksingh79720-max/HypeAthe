import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  UnitMode,
  ActivityRecord,
  ActivityType,
  RouteItem,
  SocialPost,
  ChallengeItem,
  NotificationItem,
  CommentItem
} from '../types';
import { initialRoutes } from '../data/mockData';
import {
  authenticChallenges,
  initialSocialPosts,
  initialNotifications
} from '../data/mockCommunityData';
import {
  getAllActivitiesFromDb,
  saveActivityToDb,
  deleteActivityFromDb,
  clearAllActivitiesInDb
} from '../db/indexedDb';
import { doc, setDoc, deleteDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './AuthContext';

export type NavScreen = 
  | 'home'
  | 'explore'
  | 'record'
  | 'feed'
  | 'profile'
  | 'live-run'
  | 'history'
  | 'activity-details'
  | 'analytics'
  | 'settings'
  | 'stats-studio'
  | 'notifications';

export interface UserProfileState {
  name: string;
  username: string;
  email?: string;
  bio: string;
  avatar: string;
  isPro: boolean;
  followingCount: number;
  followersCount: number;
  location: string;
}

interface AppContextType {
  currentScreen: NavScreen;
  previousScreen: NavScreen;
  navigateTo: (screen: NavScreen) => void;
  goBack: () => void;
  units: UnitMode;
  setUnits: (u: UnitMode) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  locationHighAccuracy: boolean;
  setLocationHighAccuracy: (enabled: boolean) => void;
  
  // Real Workout Activities (HypeAtheDB in IndexedDB - Single Source of Truth)
  activities: ActivityRecord[];
  addActivity: (activity: ActivityRecord) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  refreshActivities: () => Promise<void>;
  selectedActivity: ActivityRecord | null;
  setSelectedActivity: (activity: ActivityRecord) => void;
  clearAllActivitiesAction: () => Promise<void>;
  
  activeMode: ActivityType;
  setActiveMode: (mode: ActivityType) => void;
  routes: RouteItem[];
  toggleBookmarkRoute: (routeId: string) => void;
  
  // Stats Studio Integration
  statsStudioActivity: ActivityRecord | null;
  setStatsStudioActivity: (act: ActivityRecord | null) => void;
  openStatsStudioWithActivity: (act?: ActivityRecord | null) => void;
  
  // User Profile
  userProfile: UserProfileState;
  updateUserProfile: (profile: Partial<UserProfileState>) => void;
  
  // Social & Community (Local activity sharing & authentic challenges)
  socialPosts: SocialPost[];
  togglePostKudos: (postId: string) => void;
  addPostComment: (postId: string, text: string) => void;
  deletePostComment: (postId: string, commentId: string) => void;
  publishWorkoutToFeed: (postData: Partial<SocialPost>) => void;
  
  challenges: ChallengeItem[];
  toggleJoinChallenge: (challengeId: string) => void;
  
  notifications: NotificationItem[];
  addNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationsCount: number;
  
  toastMessage: string | null;
  showToast: (msg: string) => void;
  formatDistance: (km: number) => { value: string; unit: string };
  formatPace: (pacePerKm: string) => string;
  formatSpeed: (kmh: number) => { value: string; unit: string };
  clearAllLocalData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USER_PROFILE: UserProfileState = {
  name: 'Athlete',
  username: 'athlete',
  bio: 'RUN YOUR PACE. TRACK YOUR PROGRESS.',
  avatar: '/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png',
  isPro: true,
  followingCount: 0,
  followersCount: 0,
  location: 'Local Athlete'
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentScreen, setCurrentScreen] = useState<NavScreen>('home');
  const [previousScreen, setPreviousScreen] = useState<NavScreen>('home');
  const [screenHistory, setScreenHistory] = useState<NavScreen[]>(['home']);
  const [activeMode, setActiveMode] = useState<ActivityType>('Running');

  const [units, setUnitsState] = useState<UnitMode>(() => {
    const saved = localStorage.getItem('hypeathe_units');
    return (saved as UnitMode) || 'km';
  });

  const [notificationsEnabled, setNotificationsState] = useState<boolean>(() => {
    const val = localStorage.getItem('hypeathe_notifications');
    return val !== 'false';
  });

  const [locationHighAccuracy, setLocationHighAccuracyState] = useState<boolean>(() => {
    const val = localStorage.getItem('hypeathe_high_accuracy');
    return val !== 'false';
  });

  const { user: authUser } = useAuth();

  // User Profile
  const [userProfile, setUserProfileState] = useState<UserProfileState>(() => {
    const saved = localStorage.getItem('hypeathe_user_profile');
    if (saved) {
      try {
        return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
      } catch (e) {
        return DEFAULT_USER_PROFILE;
      }
    }
    return DEFAULT_USER_PROFILE;
  });

  // Sync authenticated user with userProfile
  useEffect(() => {
    if (authUser) {
      setUserProfileState(prev => ({
        ...prev,
        name: authUser.displayName || prev.name,
        username: authUser.email ? authUser.email.split('@')[0] : prev.username,
        avatar: authUser.photoURL || prev.avatar,
        email: authUser.email || undefined
      }));
    } else {
      setUserProfileState(DEFAULT_USER_PROFILE);
    }
  }, [authUser]);

  const updateUserProfile = (updated: Partial<UserProfileState>) => {
    setUserProfileState(prev => {
      const next = { ...prev, ...updated };
      localStorage.setItem('hypeathe_user_profile', JSON.stringify(next));
      return next;
    });
    showToast('Athlete profile updated');
  };

  // Real IndexedDB Activities (Single Source of Truth)
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [selectedActivity, setSelectedActivityState] = useState<ActivityRecord | null>(null);
  const [statsStudioActivity, setStatsStudioActivity] = useState<ActivityRecord | null>(null);

  const [routes, setRoutes] = useState<RouteItem[]>(initialRoutes);
  
  // Real user-shared social posts stored in localStorage
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(() => {
    const saved = localStorage.getItem('hypeathe_user_posts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialSocialPosts;
      }
    }
    return initialSocialPosts;
  });

  // Authentic challenges
  const [challenges, setChallenges] = useState<ChallengeItem[]>(authenticChallenges);

  // Real local notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('hypeathe_user_notifications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return initialNotifications;
      }
    }
    return initialNotifications;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize strictly from HypeAtheDB in IndexedDB (sanitizes demo records & preserves genuine user data)
  const refreshActivities = useCallback(async () => {
    try {
      const records = await getAllActivitiesFromDb();
      setActivities(records);
      if (records.length > 0) {
        setSelectedActivityState(records[0]);
      } else {
        setSelectedActivityState(null);
      }
    } catch (e) {
      console.warn('Failed to load activities from IndexedDB', e);
    }
  }, []);

  useEffect(() => {
    refreshActivities();
  }, [refreshActivities]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const addNotification = useCallback((title: string, message: string, type: NotificationItem['type'] = 'system') => {
    const newNotif: NotificationItem = {
      id: `notif_${Date.now()}`,
      type,
      title,
      message,
      timeAgo: 'Just now',
      read: false
    };
    setNotifications(prev => {
      const next = [newNotif, ...prev];
      localStorage.setItem('hypeathe_user_notifications', JSON.stringify(next));
      return next;
    });
  }, []);

  const addActivity = async (newAct: ActivityRecord) => {
    try {
      await saveActivityToDb(newAct);
      setActivities(prev => [newAct, ...prev.filter(a => a.id !== newAct.id)]);
      setSelectedActivityState(newAct);
      const dist = formatDistance(newAct.distanceKm);
      showToast(`${newAct.activityType} saved: ${dist.value} ${dist.unit}`);
      addNotification(
        'Workout Saved',
        `Successfully logged ${dist.value} ${dist.unit} ${newAct.activityType} in ${newAct.durationFormatted}.`,
        'system'
      );

      // Cloud Firestore Backup if user is authenticated with Google
      if (authUser) {
        try {
          const actDocRef = doc(db, 'users', authUser.uid, 'activities', newAct.id);
          await setDoc(actDocRef, {
            id: newAct.id,
            userId: authUser.uid,
            activityType: newAct.activityType,
            title: newAct.title || `${newAct.activityType} Session`,
            distanceKm: newAct.distanceKm,
            activeDuration: newAct.activeDuration,
            durationFormatted: newAct.durationFormatted,
            pace: newAct.pace,
            calories: newAct.calories,
            date: newAct.date,
            createdAt: new Date().toISOString()
          }, { merge: true });
        } catch (cloudErr) {
          console.warn('Could not sync workout to Firebase Cloud:', cloudErr);
        }
      }
    } catch (e) {
      console.error('Failed to save workout to IndexedDB', e);
      showToast('Workout recorded');
    }
  };

  const deleteActivity = async (id: string) => {
    try {
      await deleteActivityFromDb(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      if (selectedActivity?.id === id) {
        const remaining = activities.filter(a => a.id !== id);
        setSelectedActivityState(remaining[0] || null);
      }
      showToast('Workout removed from history');

      // Remove from Firebase Firestore
      if (authUser) {
        try {
          const actDocRef = doc(db, 'users', authUser.uid, 'activities', id);
          await deleteDoc(actDocRef);
        } catch (cloudErr) {
          console.warn('Could not remove workout from Firebase Cloud:', cloudErr);
        }
      }
    } catch (e) {
      console.error('Failed to delete activity from IndexedDB', e);
      showToast('Could not delete workout');
    }
  };

  const clearAllActivitiesAction = async () => {
    try {
      await clearAllActivitiesInDb();
      setActivities([]);
      setSelectedActivityState(null);
      setStatsStudioActivity(null);
      showToast('Workout history cleared. Real data reset to 0.');
    } catch (e) {
      console.error('Failed to clear IndexedDB activities', e);
    }
  };

  const setSelectedActivity = (act: ActivityRecord) => {
    setSelectedActivityState(act);
  };

  const openStatsStudioWithActivity = (act?: ActivityRecord | null) => {
    const target = act || selectedActivity || (activities.length > 0 ? activities[0] : null);
    setStatsStudioActivity(target);
    navigateTo('stats-studio');
  };

  const navigateTo = (screen: NavScreen) => {
    if (screen === currentScreen) return;
    setPreviousScreen(currentScreen);
    setScreenHistory(prev => [...prev, screen]);
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (screenHistory.length > 1) {
      const nextHistory = [...screenHistory];
      nextHistory.pop();
      const prev = nextHistory[nextHistory.length - 1] || 'home';
      setScreenHistory(nextHistory);
      setPreviousScreen(currentScreen);
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('home');
    }
  };

  const setUnits = (u: UnitMode) => {
    setUnitsState(u);
    localStorage.setItem('hypeathe_units', u);
    showToast(`Distance units set to ${u === 'km' ? 'Kilometres' : 'Miles'}`);
  };

  const setNotificationsEnabled = (enabled: boolean) => {
    setNotificationsState(enabled);
    localStorage.setItem('hypeathe_notifications', String(enabled));
    showToast(enabled ? 'Notifications enabled' : 'Notifications paused');
  };

  const setLocationHighAccuracy = (enabled: boolean) => {
    setLocationHighAccuracyState(enabled);
    localStorage.setItem('hypeathe_high_accuracy', String(enabled));
  };

  const toggleBookmarkRoute = (routeId: string) => {
    setRoutes(prev => prev.map(r => {
      if (r.id === routeId) {
        const next = !r.bookmarked;
        showToast(next ? `Saved "${r.name}"` : `Removed "${r.name}" from saved`);
        return { ...r, bookmarked: next };
      }
      return r;
    }));
  };

  // Social interactions (Local persistence for user's own workouts)
  const togglePostKudos = (postId: string) => {
    setSocialPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          const nextHas = !p.hasKudos;
          return {
            ...p,
            hasKudos: nextHas,
            kudosCount: nextHas ? p.kudosCount + 1 : Math.max(0, p.kudosCount - 1)
          };
        }
        return p;
      });
      localStorage.setItem('hypeathe_user_posts', JSON.stringify(next));
      return next;
    });
  };

  const addPostComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    const newComment: CommentItem = {
      id: `comm_${Date.now()}`,
      author: userProfile.name,
      authorHandle: `@${userProfile.username}`,
      authorAvatar: userProfile.name.slice(0, 2).toUpperCase(),
      text: text.trim(),
      timeAgo: 'Just now',
      isOwn: true
    };

    setSocialPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...p.comments, newComment]
          };
        }
        return p;
      });
      localStorage.setItem('hypeathe_user_posts', JSON.stringify(next));
      return next;
    });
    showToast('Comment added locally');
  };

  const deletePostComment = (postId: string, commentId: string) => {
    setSocialPosts(prev => {
      const next = prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            comments: p.comments.filter(c => c.id !== commentId)
          };
        }
        return p;
      });
      localStorage.setItem('hypeathe_user_posts', JSON.stringify(next));
      return next;
    });
    showToast('Comment deleted');
  };

  const publishWorkoutToFeed = (postData: Partial<SocialPost>) => {
    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorId: 'user_local',
      authorName: userProfile.name,
      authorHandle: `@${userProfile.username}`,
      authorAvatar: userProfile.name.slice(0, 2).toUpperCase(),
      timeAgo: 'Just now',
      title: postData.title || `${postData.activityType || 'Workout'} Completed!`,
      caption: postData.caption || 'Tracked with HypeAthe.',
      activityType: postData.activityType || 'Running',
      distanceKm: postData.distanceKm || 0,
      durationFormatted: postData.durationFormatted || '00:00',
      avgPace: postData.avgPace,
      speedKmh: postData.speedKmh,
      elevationM: postData.elevationM || 0,
      posterImageUrl: postData.posterImageUrl,
      kudosCount: 0,
      hasKudos: false,
      comments: [],
      category: 'Following',
      sportType: postData.activityType || 'General',
      isUserGenerated: true,
      isDemo: false
    };

    setSocialPosts(prev => {
      const next = [newPost, ...prev];
      localStorage.setItem('hypeathe_user_posts', JSON.stringify(next));
      return next;
    });

    addNotification(
      'Activity Shared',
      `Shared your ${newPost.activityType} workout to the local community feed.`,
      'system'
    );

    showToast('Workout shared to community stream');
    navigateTo('feed');
  };

  const toggleJoinChallenge = (challengeId: string) => {
    setChallenges(prev => prev.map(ch => {
      if (ch.id === challengeId) {
        const nextJoined = !ch.joined;
        showToast(nextJoined ? `Joined "${ch.title}"!` : `Left "${ch.title}"`);
        return { ...ch, joined: nextJoined };
      }
      return ch;
    }));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const next = prev.map(n => n.id === id ? { ...n, read: true } : n);
      localStorage.setItem('hypeathe_user_notifications', JSON.stringify(next));
      return next;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      localStorage.setItem('hypeathe_user_notifications', JSON.stringify(next));
      return next;
    });
    showToast('All notifications marked as read');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const formatDistance = (km: number) => {
    const val = typeof km === 'number' && !isNaN(km) ? km : 0;
    if (units === 'mi') {
      const mi = val * 0.621371;
      return { value: mi.toFixed(2), unit: 'mi' };
    }
    return { value: val.toFixed(2), unit: 'km' };
  };

  const formatPace = (pacePerKm: string) => {
    if (!pacePerKm || pacePerKm === '--:--') return '--:--';
    if (units === 'km') return `${pacePerKm} /km`;
    const parts = pacePerKm.split(':');
    if (parts.length === 2) {
      const totalSec = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
      if (!isNaN(totalSec) && totalSec > 0) {
        const secPerMi = Math.round(totalSec * 1.60934);
        const m = Math.floor(secPerMi / 60);
        const s = secPerMi % 60;
        return `${m}:${s < 10 ? '0' : ''}${s} /mi`;
      }
    }
    return `${pacePerKm} /mi`;
  };

  const formatSpeed = (kmh: number) => {
    const val = typeof kmh === 'number' && !isNaN(kmh) ? kmh : 0;
    if (units === 'mi') {
      const mph = +(val * 0.621371).toFixed(1);
      return { value: String(mph), unit: 'mph' };
    }
    return { value: String(val.toFixed(1)), unit: 'km/h' };
  };

  const clearAllLocalData = async () => {
    localStorage.removeItem('hypeathe_units');
    localStorage.removeItem('hypeathe_notifications');
    localStorage.removeItem('hypeathe_high_accuracy');
    localStorage.removeItem('hypeathe_theme');
    localStorage.removeItem('hypeathe_user_profile');
    localStorage.removeItem('hypeathe_user_posts');
    localStorage.removeItem('hypeathe_user_notifications');
    
    // Clear IndexedDB completely
    try {
      await clearAllActivitiesInDb();
      setActivities([]);
      setSelectedActivityState(null);
      setStatsStudioActivity(null);
    } catch (e) {
      console.warn('Error clearing IndexedDB', e);
    }

    setRoutes(initialRoutes);
    setSocialPosts([]);
    setChallenges(authenticChallenges);
    setNotifications(initialNotifications);
    setUserProfileState(DEFAULT_USER_PROFILE);
    setUnitsState('km');
    setNotificationsState(true);
    setLocationHighAccuracyState(true);
    showToast('All local data cleared. Zero-state established.');
  };

  return (
    <AppContext.Provider value={{
      currentScreen,
      previousScreen,
      navigateTo,
      goBack,
      units,
      setUnits,
      notificationsEnabled,
      setNotificationsEnabled,
      locationHighAccuracy,
      setLocationHighAccuracy,
      activities,
      addActivity,
      deleteActivity,
      refreshActivities,
      selectedActivity,
      setSelectedActivity,
      clearAllActivitiesAction,
      activeMode,
      setActiveMode,
      routes,
      toggleBookmarkRoute,
      statsStudioActivity,
      setStatsStudioActivity,
      openStatsStudioWithActivity,
      userProfile,
      updateUserProfile,
      socialPosts,
      togglePostKudos,
      addPostComment,
      deletePostComment,
      publishWorkoutToFeed,
      challenges,
      toggleJoinChallenge,
      notifications,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      unreadNotificationsCount,
      toastMessage,
      showToast,
      formatDistance,
      formatPace,
      formatSpeed,
      clearAllLocalData
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
