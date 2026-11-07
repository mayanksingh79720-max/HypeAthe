import React, { useState, useMemo } from 'react';
import {
  Settings,
  ChevronRight,
  Trophy,
  Award,
  Flame,
  Zap,
  Crown,
  Star,
  Edit3,
  Users,
  Camera,
  X,
  Check,
  MapPin,
  Plus,
  LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { getActivityIcon } from '../../utils/activityModes';

const AVATAR_PRESETS = [
  '/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80'
];

export const ProfileScreen: React.FC = () => {
  const {
    navigateTo,
    activities,
    setSelectedActivity,
    formatDistance,
    formatPace,
    userProfile,
    updateUserProfile,
    openStatsStudioWithActivity
  } = useApp();
  const { signOutUser } = useAuth();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState<'followers' | 'following' | null>(null);

  // Edit profile form state
  const [editForm, setEditForm] = useState({
    name: userProfile.name,
    username: userProfile.username,
    bio: userProfile.bio,
    location: userProfile.location,
    avatar: userProfile.avatar
  });

  // Calculate dynamic lifetime metrics strictly from HypeAtheDB workouts
  const careerStats = useMemo(() => {
    const totalKm = +(activities.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(1);
    const totalSec = activities.reduce((acc, a) => acc + (a.activeDuration || 0), 0);
    const totalHours = +(totalSec / 3600).toFixed(1);

    // Compute best pace across all running workouts
    const runningActs = activities.filter(a => a.activityType === 'Running' || a.activityType === 'Sprinting');
    let bestPace = '--:--';
    if (runningActs.length > 0) {
      const paces = runningActs.map(a => {
        const parts = (a.pace || '99:99').split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
      }).filter(s => s > 0 && !isNaN(s));
      if (paces.length > 0) {
        const minSec = Math.min(...paces);
        const m = Math.floor(minSec / 60);
        const s = minSec % 60;
        bestPace = `${m}:${s < 10 ? '0' : ''}${s} /km`;
      }
    }

    // Longest single workout
    const longest = activities.reduce((max, a) => a.distanceKm > (max?.distanceKm || 0) ? a : max, activities[0]);

    return {
      totalKm,
      totalRuns: activities.length,
      totalHours,
      bestPace,
      longestKm: longest ? longest.distanceKm : 0
    };
  }, [activities]);

  const handleOpenActivity = (act: typeof activities[0]) => {
    setSelectedActivity(act);
    navigateTo('activity-details');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile(editForm);
    setShowEditModal(false);
  };

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditForm(prev => ({ ...prev, avatar: url }));
    }
  };

  const formattedLifetimeDistance = formatDistance(careerStats.totalKm);
  const formattedLongest = formatDistance(careerStats.longestKm);

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-2 mb-4">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Athlete Profile
        </h1>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditForm({
                name: userProfile.name,
                username: userProfile.username,
                bio: userProfile.bio,
                location: userProfile.location,
                avatar: userProfile.avatar
              });
              setShowEditModal(true);
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 hover:text-[var(--accent-orange)] transition-colors cursor-pointer"
            aria-label="Edit Profile"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigateTo('settings')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 hover:text-[var(--accent-orange)] transition-colors cursor-pointer"
            aria-label="Open settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* User Profile Avatar & Header */}
      <section className="flex flex-col items-center mb-6">
        <div className="relative mb-3">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full p-1 bg-gradient-to-tr from-[var(--accent-orange)] via-amber-400 to-[#FA4C00] shadow-xl">
            <div className="w-full h-full rounded-full bg-[var(--bg-secondary)] overflow-hidden flex items-center justify-center relative">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          {/* Level badge */}
          <div className="absolute -bottom-1 -right-1 px-2.5 py-0.5 rounded-full bg-[var(--accent-orange)] text-white text-[10px] md:text-xs font-black shadow-md border-2 border-[var(--bg-main)]">
            PRO
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-black text-[var(--text-primary)] leading-tight">
          {userProfile.name}
        </h2>
        <div className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] mt-0.5">
          @{userProfile.username} • {userProfile.location}
        </div>

        <p className="text-xs text-[var(--text-secondary)] max-w-sm text-center mt-2 leading-relaxed">
          {userProfile.bio}
        </p>

        {/* Social Followers / Following Bar */}
        <div className="flex items-center gap-6 mt-3 text-xs font-bold text-[var(--text-secondary)]">
          <button
            onClick={() => setShowFollowModal('following')}
            className="hover:text-[var(--accent-orange)] transition-colors cursor-pointer"
          >
            <span className="text-[var(--text-primary)] font-black mr-1 font-tabular">
              {userProfile.followingCount}
            </span>
            <span>Following</span>
          </button>
          <span className="opacity-30">•</span>
          <button
            onClick={() => setShowFollowModal('followers')}
            className="hover:text-[var(--accent-orange)] transition-colors cursor-pointer"
          >
            <span className="text-[var(--text-primary)] font-black mr-1 font-tabular">
              {userProfile.followersCount}
            </span>
            <span>Followers</span>
          </button>
        </div>
      </section>

      {/* Global Firebase Google Auth Status & Card */}
      <GoogleAuthButton variant="card" className="mb-6" />

      {/* Primary Lifetime Stats Row (Calculated strictly from real HypeAtheDB workouts) */}
      <section className="rounded-3xl p-5 md:p-6 mb-6 bg-[var(--bg-secondary)] shadow-sm border border-[var(--text-secondary)]/10">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-2xl md:text-3xl font-black text-[var(--text-primary)] font-tabular leading-tight">
              {formattedLifetimeDistance.value}
              <span className="text-xs md:text-sm font-semibold text-[var(--text-secondary)] ml-0.5">
                {formattedLifetimeDistance.unit}
              </span>
            </div>
            <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-1">
              Lifetime Distance
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-black text-[var(--text-primary)] font-tabular leading-tight">
              {careerStats.totalRuns}
            </div>
            <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-1">
              Workouts
            </div>
          </div>

          <div>
            <div className="text-2xl md:text-3xl font-black text-[var(--text-primary)] font-tabular leading-tight">
              {careerStats.totalHours} h
            </div>
            <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-1">
              Total Time
            </div>
          </div>
        </div>
      </section>

      {/* 2-Column Responsive Layout for PRs and Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-6">
        {/* Personal Records Cards */}
        <section className="rounded-3xl p-5 md:p-6 bg-[var(--bg-secondary)] shadow-sm border border-[var(--text-secondary)]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)]">
                Personal Records
              </h3>
            </div>
            <button
              onClick={() => navigateTo('analytics')}
              className="text-xs font-semibold text-[var(--accent-orange)] flex items-center gap-0.5 hover:underline cursor-pointer"
            >
              <span>Analytics</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 md:p-4 rounded-2xl bg-[var(--bg-surface)] flex flex-col items-center">
              <Zap className="w-4 h-4 text-[var(--accent-orange)] mb-1" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">Best Pace</span>
              <span className="text-xs md:text-sm font-extrabold text-[var(--text-primary)] font-tabular mt-0.5">
                {careerStats.bestPace}
              </span>
            </div>

            <div className="p-3 md:p-4 rounded-2xl bg-[var(--bg-surface)] flex flex-col items-center">
              <Flame className="w-4 h-4 text-[var(--accent-orange)] mb-1" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">Longest</span>
              <span className="text-xs md:text-sm font-extrabold text-[var(--text-primary)] font-tabular mt-0.5">
                {formattedLongest.value} {formattedLongest.unit}
              </span>
            </div>

            <div className="p-3 md:p-4 rounded-2xl bg-[var(--bg-surface)] flex flex-col items-center">
              <Trophy className="w-4 h-4 text-amber-400 mb-1" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">Sessions</span>
              <span className="text-xs md:text-sm font-extrabold text-[var(--text-primary)] font-tabular mt-0.5">
                {activities.length}
              </span>
            </div>
          </div>
        </section>

        {/* Achievements Section */}
        <section className="rounded-3xl p-5 md:p-6 bg-[var(--bg-secondary)] shadow-sm border border-[var(--text-secondary)]/10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[var(--accent-orange)]" />
              <div>
                <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] leading-none">
                  Badges & Milestones
                </h3>
                <span className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)]">
                  {activities.length > 0 ? 'Unlocked through real activities' : 'Start workouts to unlock'}
                </span>
              </div>
            </div>
          </div>

          {/* Badge Medals Row */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-sm ${
                activities.length > 0 ? 'bg-[var(--accent-orange)]' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-50'
              }`}>
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate w-full">First Run</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md ${
                careerStats.totalKm >= 5 ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-stone-900' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-50'
              }`}>
                <Star className="w-6 h-6 fill-current" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate w-full">5K Club</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                careerStats.totalKm >= 50 ? 'bg-gradient-to-tr from-orange-600 to-amber-500' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-50'
              }`}>
                <Flame className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate w-full">50 KM</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                careerStats.totalRuns >= 10 ? 'bg-gradient-to-tr from-purple-600 to-pink-500' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-50'
              }`}>
                <Crown className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-semibold text-[var(--text-secondary)] truncate w-full">Consistent</span>
            </div>
          </div>
        </section>
      </div>

      {/* Recent Activities Section */}
      <section className="mb-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-sm font-bold tracking-tight text-[var(--text-primary)] uppercase tracking-wider">
            Logged Workouts ({activities.length})
          </span>
          <button
            onClick={() => navigateTo('history')}
            className="text-xs font-bold text-[var(--accent-orange)] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[var(--bg-secondary)] border border-dashed border-[var(--text-secondary)]/20 text-center">
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
              No workouts yet
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              No workouts yet. Start your first activity to see your history here.
            </p>
            <div className="flex justify-center">
              <button
                onClick={() => navigateTo('live-run')}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              >
                Start First Session
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activities.slice(0, 4).map((act) => {
              const Icon = getActivityIcon(act.activityType);
              const dist = formatDistance(act.distanceKm);
              return (
                <div
                  key={act.id}
                  onClick={() => handleOpenActivity(act)}
                  className="rounded-2xl p-3.5 bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 flex items-center justify-between shadow-sm cursor-pointer hover:bg-[var(--bg-surface)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center">
                      <Icon className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--text-primary)]">
                        {act.title}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                        {dist.value} {dist.unit} · {act.durationFormatted} · {act.date}
                      </div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sign Out Action Button */}
      <div className="pt-2 pb-6">
        <button
          onClick={signOutUser}
          className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of HypeAthe</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* EDIT PROFILE MODAL                                       */}
      {/* ======================================================== */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[var(--text-secondary)]/10 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-4">
              <h3 className="text-base font-black text-[var(--text-primary)]">
                Edit Athlete Profile
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Avatar Picker */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-2">
                  Profile Photo
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-black shrink-0 border-2 border-[var(--accent-orange)]">
                    <img src={editForm.avatar} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                  <label className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 hover:text-[var(--accent-orange)] transition-colors cursor-pointer flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Upload Custom</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                  </label>
                </div>
                {/* Presets */}
                <div className="flex gap-2 pt-1">
                  {AVATAR_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditForm(prev => ({ ...prev, avatar: p }))}
                      className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform cursor-pointer ${
                        editForm.avatar === p ? 'border-[var(--accent-orange)] scale-110' : 'border-transparent opacity-60'
                      }`}
                    >
                      <img src={p} alt="Preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--text-secondary)]/15 focus:ring-2 focus:ring-[var(--accent-orange)] focus:outline-none"
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--text-secondary)]/15 focus:ring-2 focus:ring-[var(--accent-orange)] focus:outline-none"
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--text-secondary)]/15 focus:ring-2 focus:ring-[var(--accent-orange)] focus:outline-none"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="text-xs font-bold text-[var(--text-secondary)] block mb-1">
                  Athletic Bio / Tagline
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] border border-[var(--text-secondary)]/15 focus:ring-2 focus:ring-[var(--accent-orange)] focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold shadow-md hover:opacity-90 cursor-pointer"
                >
                  Save Profile
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/80 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* FOLLOWERS / FOLLOWING MODAL                              */}
      {/* ======================================================== */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--bg-secondary)] w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[var(--text-secondary)]/10 animate-in zoom-in-95 duration-200 text-center">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10 mb-4">
              <h3 className="text-sm font-black text-[var(--text-primary)] capitalize">
                {showFollowModal}
              </h3>
              <button
                onClick={() => setShowFollowModal(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-6 px-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] text-[var(--accent-orange)] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <h4 className="text-sm font-black text-[var(--text-primary)] mb-1">
                No {showFollowModal} yet
              </h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                You are currently running in private local-first mode. Global athlete connections and social sync arrive in Phase 6 with Supabase authentication.
              </p>
              <button
                onClick={() => setShowFollowModal(null)}
                className="w-full py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
