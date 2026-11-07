import { ChallengeItem, NotificationItem, SocialPost } from '../types';

/**
 * Authentic Challenge definitions.
 * User progress is computed 100% strictly from genuine workouts recorded in HypeAtheDB.
 */
export const authenticChallenges: ChallengeItem[] = [
  {
    id: 'chal_weekly_run',
    title: 'Weekly Running Distance',
    description: 'Log 15 km of running or sprinting sessions this calendar week.',
    targetKm: 15.0,
    targetActivity: 'Running',
    deadline: 'Sunday 11:59 PM',
    daysRemaining: 4,
    rewardBadge: '🏅 15K Finisher',
    joined: true,
    category: 'Weekly',
    coverGradient: 'from-orange-600 to-amber-500'
  },
  {
    id: 'chal_monthly_run',
    title: 'Monthly Running Distance',
    description: 'Accumulate 50 km across all running workouts this month.',
    targetKm: 50.0,
    targetActivity: 'Running',
    deadline: 'End of Month',
    daysRemaining: 18,
    rewardBadge: '⚡ 50K Endurance',
    joined: true,
    category: 'Monthly',
    coverGradient: 'from-amber-600 to-orange-500'
  },
  {
    id: 'chal_consistency',
    title: 'Workout Consistency',
    description: 'Complete at least 4 active workout sessions across any sport this week.',
    targetKm: 4.0, // Used as target session count
    targetActivity: 'All',
    deadline: 'Sunday 11:59 PM',
    daysRemaining: 4,
    rewardBadge: '🔥 Consistency Master',
    joined: false,
    category: 'Weekly',
    coverGradient: 'from-emerald-600 to-teal-500'
  },
  {
    id: 'chal_cycling',
    title: 'Cycling Distance',
    description: 'Record 60 km of cumulative cycling or biking mileage this month.',
    targetKm: 60.0,
    targetActivity: 'Cycling',
    deadline: 'End of Month',
    daysRemaining: 18,
    rewardBadge: '🚴 Century Spinner',
    joined: false,
    category: 'Monthly',
    coverGradient: 'from-blue-600 to-cyan-500'
  },
  {
    id: 'chal_walking',
    title: 'Walking Distance',
    description: 'Log 20 km of brisk walking sessions for active recovery and cardio health.',
    targetKm: 20.0,
    targetActivity: 'Walking',
    deadline: 'End of Month',
    daysRemaining: 18,
    rewardBadge: '👟 Active Stride',
    joined: false,
    category: 'Monthly',
    coverGradient: 'from-indigo-600 to-violet-500'
  },
  {
    id: 'chal_multi_sport',
    title: 'Multi-Activity Challenge',
    description: 'Log sessions across at least 3 distinct activity disciplines.',
    targetKm: 3.0, // Used as target distinct activity count
    targetActivity: 'All',
    deadline: 'In 14 Days',
    daysRemaining: 14,
    rewardBadge: '🌟 Tri-Athlete',
    joined: false,
    category: 'Special',
    coverGradient: 'from-purple-600 to-pink-500'
  }
];

// Pure initial arrays: NO fake athletes, NO fake social posts, NO fake notifications
export const initialSocialPosts: SocialPost[] = [];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif_welcome',
    type: 'system',
    title: 'Welcome to HypeAthe',
    message: 'Your athlete account is ready. Record your first GPS workout by tapping the center plus button.',
    timeAgo: 'Just now',
    read: false
  }
];
