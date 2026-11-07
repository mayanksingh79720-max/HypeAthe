import React, { useState, useMemo } from 'react';
import {
  Bell,
  ChevronRight,
  Play,
  LineChart,
  BarChart2,
  Trophy,
  Users,
  Flame,
  Clock,
  Gauge
} from 'lucide-react';
import { HypeAtheLogo } from '../HypeAtheLogo';
import { useApp } from '../../context/AppContext';
import { ActivitySelectorModal } from '../ActivitySelectorModal';
import { ActivityType } from '../../types';
import { getActivityIcon } from '../../utils/activityModes';

export const HomeScreen: React.FC = () => {
  const {
    navigateTo,
    activities,
    setSelectedActivity,
    formatDistance,
    activeMode,
    setActiveMode,
    openStatsStudioWithActivity,
    unreadNotificationsCount,
    userProfile
  } = useApp();

  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6);

  // Dynamic weekly statistics strictly from genuine HypeAtheDB workouts
  const weeklyStats = useMemo(() => {
    const now = Date.now();
    const oneDay = 86400000;
    const sevenDaysAgo = now - oneDay * 7;
    const fourteenDaysAgo = now - oneDay * 14;

    const currentWeekActs = activities.filter(a => {
      const ts = a.startTimestamp || a.creationTimestamp || 0;
      return ts >= sevenDaysAgo;
    });

    const previousWeekActs = activities.filter(a => {
      const ts = a.startTimestamp || a.creationTimestamp || 0;
      return ts >= fourteenDaysAgo && ts < sevenDaysAgo;
    });

    const totalKm = +(currentWeekActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(1);
    const prevKm = +(previousWeekActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(1);

    let comparisonPct: number | null = null;
    if (prevKm > 0 && totalKm > 0) {
      comparisonPct = Math.round(((totalKm - prevKm) / prevKm) * 100);
    } else if (prevKm === 0 && totalKm > 0) {
      comparisonPct = 100;
    }

    const totalSec = currentWeekActs.reduce((acc, a) => acc + (a.activeDuration || 0), 0);
    const totalHours = Math.floor(totalSec / 3600);
    const totalMins = Math.floor((totalSec % 3600) / 60);
    const formattedDuration = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

    const totalDistanceAll = +(activities.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(1);

    // 7-day daily breakdown
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dailyVolume = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now - (6 - i) * oneDay);
      const dayStart = new Date(d).setHours(0, 0, 0, 0);
      const dayEnd = dayStart + oneDay;

      const dayActs = activities.filter(a => {
        const ts = a.startTimestamp || a.creationTimestamp || 0;
        return ts >= dayStart && ts < dayEnd;
      });

      const dayKm = +(dayActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(1);
      return {
        day: days[d.getDay() === 0 ? 6 : d.getDay() - 1] || 'Day',
        km: dayKm
      };
    });

    return {
      weeklyKm: totalKm,
      runsCount: currentWeekActs.length,
      durationStr: totalSec > 0 ? formattedDuration : '0m',
      totalDistanceAll,
      comparisonPct,
      dailyVolume
    };
  }, [activities]);

  const handleOpenActivity = (act: typeof activities[0]) => {
    setSelectedActivity(act);
    navigateTo('activity-details');
  };

  const formattedWeeklyDistance = formatDistance(weeklyStats.weeklyKm);
  const formattedLifetimeDistance = formatDistance(weeklyStats.totalDistanceAll);

  const modes: ActivityType[] = ['Running', 'Walking', 'Cycling', 'Biking', 'Sprinting', 'Hiking'];

  return (
    <div className="min-h-screen pb-28 sm:pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-xl mx-auto select-none">
      {/* 1. HypeAthe Header matching Reference Image */}
      <header className="flex items-center justify-between py-2 mb-4">
        <HypeAtheLogo size="md" />

        <div className="flex items-center gap-3">
          {/* Notifications Link with unread indicator */}
          <button
            onClick={() => navigateTo('notifications')}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:text-[var(--accent-orange)] border border-[var(--text-secondary)]/15 relative active:scale-95 cursor-pointer shadow-xs transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 stroke-[2]" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--accent-orange)]" />
            )}
          </button>

          {/* User Profile Avatar matching Reference Image */}
          <button
            onClick={() => navigateTo('profile')}
            className="w-10 h-10 rounded-full overflow-hidden border border-[var(--text-secondary)]/25 active:scale-95 transition-transform cursor-pointer shadow-xs"
            aria-label="Open profile"
          >
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* 2. Athletic Greeting matching Reference Image */}
      <section className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
          Good day,<br />
          <span className="text-[var(--text-primary)]">{userProfile.name}!</span>
        </h1>
        <p className="text-xs font-black tracking-widest text-[var(--text-secondary)] mt-1.5 uppercase">
          RUN • TRACK • CONNECT
        </p>
      </section>

      {/* 3. 4-Column Quick Access Hub Cards matching Reference Image */}
      <div className="grid grid-cols-4 gap-2.5 mb-5">
        {/* Stats Studio */}
        <button
          onClick={() => openStatsStudioWithActivity()}
          className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 hover:border-[var(--accent-orange)]/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-1.5">
            <LineChart className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-black text-[var(--text-primary)] leading-tight">Stats</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">Studio</span>
        </button>

        {/* Community */}
        <button
          onClick={() => navigateTo('feed')}
          className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 hover:border-[var(--accent-orange)]/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-1.5">
            <Users className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-black text-[var(--text-primary)] leading-tight">Community</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">Clubs</span>
        </button>

        {/* Challenges */}
        <button
          onClick={() => navigateTo('feed')}
          className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 hover:border-[var(--accent-orange)]/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-1.5">
            <Trophy className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-black text-[var(--text-primary)] leading-tight">Challenges</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">Goals</span>
        </button>

        {/* Analytics */}
        <button
          onClick={() => navigateTo('analytics')}
          className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 hover:border-[var(--accent-orange)]/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer shadow-xs"
        >
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center mb-1.5">
            <BarChart2 className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-black text-[var(--text-primary)] leading-tight">Analytics</span>
          <span className="text-[10px] text-[var(--text-secondary)] font-medium">Trends</span>
        </button>
      </div>

      {/* 4. This Week's Distance Card matching Reference Image */}
      <section className="relative rounded-3xl p-5 mb-5 bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 shadow-xs overflow-hidden">
        {/* Subtle Runner Silhouette Watermark in right background matching Reference Image */}
        <div className="absolute right-2 top-2 bottom-2 w-36 pointer-events-none opacity-8 dark:opacity-5 flex items-center justify-end">
          <svg viewBox="0 0 100 100" className="w-full h-full text-[var(--text-primary)] fill-current">
            <circle cx="68" cy="22" r="8" />
            <path d="M60,32 L54,58 L40,78 L44,82 L58,64 L72,80 L76,76 L64,56 L66,38 L78,44 L81,40 L65,32 Z" />
            <path d="M54,58 L38,72 L26,68 L25,72 L40,78 L56,60 Z" />
          </svg>
        </div>

        <div className="relative z-10">
          <span className="text-xs font-black text-[var(--text-secondary)] uppercase tracking-wider block">
            This Week's Distance
          </span>

          <div className="flex items-center gap-3 mt-1.5 mb-4">
            <span className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)] font-tabular leading-none">
              {formattedWeeklyDistance.value} {formattedWeeklyDistance.unit}
            </span>

            {/* Percentage badge if previous week comparison exists */}
            {weeklyStats.comparisonPct !== null && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                weeklyStats.comparisonPct >= 0 
                  ? 'bg-[var(--accent-green)]/15 text-[var(--accent-green)]' 
                  : 'bg-rose-500/15 text-rose-500'
              }`}>
                {weeklyStats.comparisonPct >= 0 ? `↑ +${weeklyStats.comparisonPct}%` : `↓ ${weeklyStats.comparisonPct}%`}
              </span>
            )}
          </div>

          {/* 7 Daily Orange Activity Bars matching Reference Image */}
          <div className="grid grid-cols-7 gap-2 items-end pt-2">
            {weeklyStats.dailyVolume.map((d, index) => {
              const maxKm = Math.max(...weeklyStats.dailyVolume.map(v => v.km), 5);
              const barHeightPct = Math.max(Math.round((d.km / maxKm) * 100), 14);
              const isSelected = selectedDayIndex === index;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDayIndex(index)}
                  className="flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer group"
                >
                  <div className="w-full h-14 bg-[var(--bg-surface)] rounded-xl flex items-end p-0.5 overflow-hidden">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 ${
                        isSelected
                          ? 'bg-[var(--accent-orange)]'
                          : d.km > 0
                          ? 'bg-[var(--accent-orange)]/80 group-hover:bg-[var(--accent-orange)]'
                          : 'bg-transparent'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-bold ${
                    isSelected ? 'text-[var(--accent-orange)]' : 'text-[var(--text-secondary)]'
                  }`}>
                    {d.day}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Start Workout Button matching Reference Image */}
      <div className="mb-6">
        <button
          onClick={() => navigateTo('live-run')}
          className="w-full h-14 rounded-2xl bg-[var(--accent-orange)] hover:opacity-95 text-white font-black text-base flex items-center justify-center gap-2.5 shadow-md active:scale-[0.99] transition-all cursor-pointer"
        >
          <span>Start Workout</span>
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        </button>
      </div>

      {/* 6. Recent Activity Section matching Reference Image */}
      <section className="mb-6">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h2 className="text-sm font-black tracking-tight text-[var(--text-primary)]">
            Recent Activity
          </h2>
          <button
            onClick={() => navigateTo('history')}
            className="text-xs font-black text-[var(--accent-orange)] hover:underline flex items-center gap-0.5 cursor-pointer"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activities.length === 0 ? (
          <div className="p-6 rounded-2xl bg-[var(--bg-secondary)] border border-dashed border-[var(--text-secondary)]/20 text-center">
            <span className="text-xs font-bold text-[var(--text-secondary)]">
              No workouts recorded yet. Hit Start Workout above to begin.
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 3).map((act) => {
              const Icon = getActivityIcon(act.activityType);
              const dist = formatDistance(act.distanceKm);

              return (
                <div
                  key={act.id}
                  onClick={() => handleOpenActivity(act)}
                  className="p-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/15 hover:border-[var(--accent-orange)]/40 transition-colors flex items-center justify-between cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[var(--accent-orange)]/10 text-[var(--accent-orange)] flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-[var(--text-primary)] leading-tight">
                        {act.title || act.activityType}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                        {dist.value} {dist.unit} • {act.durationFormatted}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-[var(--text-secondary)]">
                    {act.date === new Date().toISOString().slice(0, 10) ? 'Today' : act.date}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activity Selector Modal */}
      <ActivitySelectorModal
        isOpen={showModeModal}
        onClose={() => setShowModeModal(false)}
        currentMode={activeMode}
        onSelectMode={(mode) => setActiveMode(mode)}
      />
    </div>
  );
};
