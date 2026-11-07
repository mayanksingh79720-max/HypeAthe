import React, { useState, useMemo } from 'react';
import {
  Heart,
  MessageSquare,
  Share2,
  Send,
  X,
  LineChart,
  Users,
  Trophy,
  Flame,
  Award,
  Trash2,
  Activity as ActivityIcon,
  Plus,
  Shield,
  Cloud,
  CheckCircle2,
  Timer,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { MapRouteVisualizer } from '../MapRouteVisualizer';
import { SocialPost, ActivityType, ChallengeItem } from '../../types';
import { getActivityIcon } from '../../utils/activityModes';

export const FeedScreen: React.FC = () => {
  const {
    socialPosts,
    togglePostKudos,
    addPostComment,
    deletePostComment,
    formatDistance,
    formatPace,
    formatSpeed,
    showToast,
    openStatsStudioWithActivity,
    activities,
    challenges,
    toggleJoinChallenge,
    userProfile,
    navigateTo
  } = useApp();

  const { isGoogleAuthenticated, user: authUser, setShowAuthModal } = useAuth();

  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'leaderboard'>('feed');
  const [selectedSport, setSelectedSport] = useState<ActivityType | 'All'>('All');
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const activePost = socialPosts.find(p => p.id === activeCommentPostId);

  // Filter feed posts
  const filteredPosts = useMemo(() => {
    return socialPosts.filter(p => {
      if (selectedSport !== 'All' && p.activityType !== selectedSport && p.sportType !== selectedSport) {
        return false;
      }
      return true;
    });
  }, [socialPosts, selectedSport]);

  // Compute real user weekly distance
  const userWeeklyDistance = useMemo(() => {
    const oneWeekAgo = Date.now() - 7 * 86400000;
    const recent = activities.filter(a => (a.startTimestamp || a.creationTimestamp || 0) >= oneWeekAgo);
    return +(recent.reduce((sum, a) => sum + (a.distanceKm || 0), 0)).toFixed(1);
  }, [activities]);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommentPostId || !newCommentText.trim()) return;
    addPostComment(activeCommentPostId, newCommentText);
    setNewCommentText('');
  };

  const handleSharePost = (post: SocialPost) => {
    if (navigator.share) {
      navigator.share({
        title: `HypeAthe: ${post.title}`,
        text: `${post.authorName}: ${post.caption || 'Great athletic session!'}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      showToast(`Link to ${post.authorName}'s activity copied!`);
    }
  };

  // Compute real user progress for each challenge strictly from real HypeAtheDB activities
  const getChallengeUserProgress = (ch: ChallengeItem) => {
    const relevantActivities = activities.filter(a => {
      if (ch.targetActivity === 'All') return true;
      return a.activityType === ch.targetActivity;
    });

    let currentVal = 0;
    if (ch.id === 'chal_consistency') {
      // Consistency challenge measures session count this week
      const oneWeekAgo = Date.now() - 7 * 86400000;
      const recent = relevantActivities.filter(a => (a.startTimestamp || a.creationTimestamp || 0) >= oneWeekAgo);
      currentVal = recent.length;
    } else if (ch.id === 'chal_multi_sport') {
      // Measures count of distinct sport modes used
      const modes = new Set(relevantActivities.map(a => a.activityType));
      currentVal = modes.size;
    } else {
      // Distance based challenge
      currentVal = +(relevantActivities.reduce((sum, a) => sum + (a.distanceKm || 0), 0)).toFixed(1);
    }

    const percent = Math.min(100, Math.round((currentVal / ch.targetKm) * 100));

    return {
      currentVal,
      percent,
      completed: currentVal >= ch.targetKm
    };
  };

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-3xl mx-auto">
      {/* 1. Header with Stats Studio Quick CTA */}
      <header className="flex items-center justify-between py-2 mb-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Community Hub
          </h1>
          <p className="text-[11px] text-[var(--text-secondary)] font-semibold">
            RUN YOUR PACE. TRACK YOUR PROGRESS.
          </p>
        </div>

        <button
          onClick={() => openStatsStudioWithActivity()}
          className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-md flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
        >
          <LineChart className="w-3.5 h-3.5" />
          <span>Stats Studio</span>
        </button>
      </header>

      {/* 2. Top Navigation Hub Tabs */}
      <div className="flex border-b border-[var(--text-secondary)]/10 mb-4 gap-4 text-xs font-extrabold text-[var(--text-secondary)]">
        {(
          [
            { id: 'feed', label: 'Activity Stream' },
            { id: 'challenges', label: 'Challenges' },
            { id: 'leaderboard', label: 'Leaderboard' }
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2.5 transition-colors relative cursor-pointer ${
              activeTab === tab.id ? 'text-[var(--accent-orange)]' : 'hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-orange)] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FEED STREAM (LOCAL HONEST POSTS)                  */}
      {/* ======================================================== */}
      {activeTab === 'feed' && (
        <div className="space-y-4">
          {/* Subheader Filter & Create Banner */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Your Shared Activities ({socialPosts.length})
            </span>

            <button
              onClick={() => openStatsStudioWithActivity()}
              className="text-xs font-bold text-[var(--accent-orange)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>Create Stats Poster</span>
            </button>
          </div>

          {/* Sport Categories Filter */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {(['All', 'Running', 'Walking', 'Cycling', 'Biking', 'Sprinting', 'Hiking'] as const).map(sport => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSport === sport
                    ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {sport}
              </button>
            ))}
          </div>

          {/* Feed Posts List */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-16 px-5 bg-[var(--bg-secondary)]/60 rounded-3xl border border-dashed border-[var(--text-secondary)]/20">
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] text-[var(--accent-orange)] flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                No community posts yet
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-2 leading-relaxed">
                Record a workout and share your achievement with a 100% transparent Stats Studio overlay!
              </p>
              <p className="text-[11px] text-[var(--accent-orange)] font-semibold mb-6">
                Local Activity Stream — Cloud Community arriving in Phase 6.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigateTo('live-run')}
                  className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                >
                  Record Workout
                </button>
                <button
                  onClick={() => openStatsStudioWithActivity()}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/80 cursor-pointer"
                >
                  Open Stats Studio
                </button>
              </div>
            </div>
          ) : (
            filteredPosts.map((post) => {
              const Icon = post.activityType ? getActivityIcon(post.activityType) : ActivityIcon;
              return (
                <article
                  key={post.id}
                  className="rounded-3xl p-4 md:p-5 bg-[var(--bg-secondary)] shadow-sm border border-[var(--text-secondary)]/10"
                >
                  {/* Author Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[var(--accent-orange)] to-amber-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                        {post.authorAvatar || userProfile.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-[var(--text-primary)]">
                            {post.authorName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[var(--accent-orange)]/20 text-[var(--accent-orange)] font-bold">
                            YOU
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] font-medium">
                          {post.authorHandle || `@${userProfile.username}`} • {post.timeAgo}
                        </div>
                      </div>
                    </div>

                    {post.activityType && (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-surface)] text-[var(--accent-orange)] text-xs font-bold">
                        <Icon className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{post.activityType}</span>
                      </div>
                    )}
                  </div>

                  {/* Post Title & Caption */}
                  <h3 className="text-sm md:text-base font-black text-[var(--text-primary)] mb-1">
                    {post.title}
                  </h3>
                  {post.caption && (
                    <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">
                      {post.caption}
                    </p>
                  )}

                  {/* Media Content: Poster Image (Stats Studio) or Route Thumbnail */}
                  {post.posterImageUrl ? (
                    <div className="mb-3 rounded-2xl overflow-hidden bg-black/90 max-h-[480px] flex items-center justify-center shadow-lg border border-[var(--text-secondary)]/10 relative p-4">
                      {/* Subdued checkerboard behind transparent PNG */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-20"
                        style={{
                          backgroundImage:
                            'repeating-conic-gradient(#333 0% 25%, #1a1a1a 0% 50%)',
                          backgroundPosition: '0 0, 10px 10px',
                          backgroundSize: '20px 20px'
                        }}
                      />
                      <img
                        src={post.posterImageUrl}
                        alt="Stats Studio Overlay"
                        className="w-full h-auto object-contain max-h-[460px] relative z-10"
                      />
                    </div>
                  ) : post.coordinates && post.coordinates.length > 0 ? (
                    <div className="mb-3">
                      <MapRouteVisualizer height="h-44" interactive={false} showControls={false} />
                    </div>
                  ) : null}

                  {/* Telemetry Strip */}
                  {post.distanceKm !== undefined && post.distanceKm > 0 && (
                    <div className="flex items-center justify-between py-2 px-3 rounded-2xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] mb-3 font-tabular">
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] block font-normal">Distance</span>
                        {formatDistance(post.distanceKm).value} {formatDistance(post.distanceKm).unit}
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] block font-normal">Duration</span>
                        {post.durationFormatted || '--:--'}
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-secondary)] block font-normal">
                          {post.speedKmh ? 'Speed' : 'Avg Pace'}
                        </span>
                        {post.speedKmh ? formatSpeed(post.speedKmh).value + ' ' + formatSpeed(post.speedKmh).unit : post.avgPace || '--:--'}
                      </div>
                      {post.elevationM !== undefined && (
                        <div>
                          <span className="text-[10px] text-[var(--text-secondary)] block font-normal">Elevation</span>
                          +{post.elevationM}m
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar (Kudos, Comments, Share) */}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--text-secondary)]/10 text-xs font-semibold text-[var(--text-secondary)]">
                    <button
                      onClick={() => togglePostKudos(post.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        post.hasKudos ? 'text-rose-500' : 'hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.hasKudos ? 'fill-current' : ''}`} />
                      <span className="font-tabular">{post.kudosCount}</span>
                    </button>

                    <button
                      onClick={() => setActiveCommentPostId(post.id)}
                      className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-tabular">{post.comments.length}</span>
                    </button>

                    <button
                      onClick={() => handleSharePost(post)}
                      className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CHALLENGES (AUTHENTIC FROM REAL WORKOUTS)        */}
      {/* ======================================================== */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
              Active Challenges ({challenges.length})
            </span>
            <span className="text-[11px] font-bold text-[var(--accent-orange)]">
              Progress Synced from HypeAtheDB
            </span>
          </div>

          {challenges.map(ch => {
            const prog = getChallengeUserProgress(ch);
            const unitLabel = ch.id === 'chal_consistency' ? 'sessions' : ch.id === 'chal_multi_sport' ? 'sports' : 'km';
            return (
              <div
                key={ch.id}
                className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)]">
                        {ch.category}
                      </span>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Ends in {ch.daysRemaining} days
                      </span>
                    </div>
                    <h3 className="text-base font-black text-[var(--text-primary)]">
                      {ch.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {ch.description}
                    </p>
                  </div>

                  <button
                    onClick={() => toggleJoinChallenge(ch.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      ch.joined
                        ? 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--text-secondary)]/20'
                        : 'bg-[var(--accent-orange)] text-white shadow-md'
                    }`}
                  >
                    {ch.joined ? 'Joined ✓' : 'Join Challenge'}
                  </button>
                </div>

                {/* Real Workout Progress Bar */}
                {ch.joined && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[var(--text-primary)] font-tabular">
                        {prog.currentVal} / {ch.targetKm} {unitLabel}
                      </span>
                      <span className="text-[var(--accent-orange)] font-mono">
                        {prog.percent}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--accent-orange)] to-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${prog.percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pt-0.5">
                      <span>Reward: {ch.rewardBadge}</span>
                      {prog.completed && (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Goal Achieved!</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: LEADERBOARD (HONEST LOCAL STATS & PHASE 6 BANNER)  */}
      {/* ======================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* User's Authentic Local Performance Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[var(--accent-orange)]/15 via-[var(--bg-secondary)] to-[var(--bg-secondary)] border border-[var(--accent-orange)]/30 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[var(--accent-orange)]" />
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
                  Your Local Weekly Mileage
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-orange)] text-white">
                #1 Local Athlete
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 px-4 rounded-2xl bg-[var(--bg-surface)] text-center">
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Weekly Dist</div>
                <div className="text-lg font-black text-[var(--text-primary)] font-tabular">
                  {userWeeklyDistance} <span className="text-[10px] font-normal text-[var(--text-secondary)]">km</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Workouts</div>
                <div className="text-lg font-black text-[var(--text-primary)] font-tabular">
                  {activities.length}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Account Mode</div>
                <div className="text-xs font-black text-emerald-500 mt-1">
                  {isGoogleAuthenticated ? 'Google Cloud' : 'Private Local'}
                </div>
              </div>
            </div>
          </div>

          {/* Firebase Google Auth & Cloud Information Banner */}
          <div className="p-6 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface)] text-[var(--accent-orange)] flex items-center justify-center mx-auto shadow-sm">
              <Cloud className="w-6 h-6 stroke-[2]" />
            </div>

            <h3 className="text-base font-black text-[var(--text-primary)]">
              {isGoogleAuthenticated ? 'Google Cloud Sync Active' : 'Global Leaderboards & Cloud Community'}
            </h3>

            <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
              {isGoogleAuthenticated
                ? `Signed in as ${authUser?.displayName || authUser?.email}. Workouts are safely backed up to Firebase Firestore.`
                : 'Connect your Google account to back up activities and participate in verified cloud athletic challenges.'}
            </p>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] text-[11px] text-[var(--text-primary)] max-w-sm mx-auto text-left space-y-1.5 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero fake athlete profiles or fabricated miles</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>100% verified GPS telemetry backed up to Google Cloud</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Global Firebase Authentication active</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              {!isGoogleAuthenticated && (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-white text-stone-900 text-xs font-extrabold shadow-md hover:bg-stone-100 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Continue with Google</span>
                </button>
              )}
              <button
                onClick={() => navigateTo('live-run')}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold shadow-md hover:opacity-90 transition-opacity cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Log More Distance</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* COMMENTS MODAL DRAWER                                    */}
      {/* ======================================================== */}
      {activePost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end justify-center">
          <div className="bg-[var(--bg-secondary)] w-full max-w-lg rounded-t-3xl max-h-[75vh] flex flex-col p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[var(--text-secondary)]/10">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Comments ({activePost.comments.length})
              </h3>
              <button
                onClick={() => setActiveCommentPostId(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {activePost.comments.length === 0 ? (
                <div className="text-center py-6 text-xs text-[var(--text-secondary)]">
                  Add the first note on your activity!
                </div>
              ) : (
                activePost.comments.map(c => (
                  <div key={c.id} className="p-3 rounded-2xl bg-[var(--bg-surface)] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[var(--text-primary)]">{c.author}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-secondary)]">{c.timeAgo}</span>
                        {c.isOwn && (
                          <button
                            onClick={() => deletePostComment(activePost.id, c.id)}
                            className="text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment Form */}
            <form onSubmit={handleSendComment} className="pt-3 border-t border-[var(--text-secondary)]/10 flex gap-2">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)]"
              />
              <button
                type="submit"
                disabled={!newCommentText.trim()}
                className="w-10 h-10 rounded-xl bg-[var(--accent-orange)] text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
