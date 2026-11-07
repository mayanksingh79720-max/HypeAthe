import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  X,
  Trash2,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  MapPin,
  Plus,
  RotateCcw,
  AlertTriangle,
  LineChart
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityRecord, ActivityType, HistoryFilterState } from '../../types';
import { getActivityIcon, ACTIVITY_MODES } from '../../utils/activityModes';
import { GoogleMapView } from '../GoogleMapView';

export const WorkoutHistoryScreen: React.FC = () => {
  const {
    activities,
    deleteActivity,
    setSelectedActivity,
    navigateTo,
    formatDistance,
    formatPace,
    formatSpeed,
    openStatsStudioWithActivity
  } = useApp();

  const [filters, setFilters] = useState<HistoryFilterState>({
    activity: 'All',
    dateRange: 'All',
    distanceRange: 'All'
  });

  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<ActivityRecord | null>(null);

  const activityTypes: (ActivityType | 'All')[] = [
    'All',
    'Running',
    'Walking',
    'Cycling',
    'Biking',
    'Sprinting',
    'Hiking'
  ];

  const dateOptions: HistoryFilterState['dateRange'][] = [
    'All',
    'Today',
    'This Week',
    'This Month',
    'Custom'
  ];

  const distanceOptions: HistoryFilterState['distanceRange'][] = [
    'All',
    'Under 2 km',
    '2–5 km',
    '5–10 km',
    '10–20 km',
    'Above 20 km'
  ];

  const hasActiveFilters = filters.activity !== 'All' ||
    filters.dateRange !== 'All' ||
    filters.distanceRange !== 'All' ||
    Boolean(filters.customStartDate) ||
    Boolean(filters.customEndDate);

  const resetFilters = () => {
    setFilters({
      activity: 'All',
      dateRange: 'All',
      distanceRange: 'All',
      customStartDate: undefined,
      customEndDate: undefined
    });
  };

  // Filtered Activities
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // 1. Activity Type Filter
      if (filters.activity !== 'All' && act.activityType !== filters.activity) {
        return false;
      }

      // 2. Distance Filter
      const d = act.distanceKm;
      if (filters.distanceRange === 'Under 2 km' && d >= 2) return false;
      if (filters.distanceRange === '2–5 km' && (d < 2 || d > 5)) return false;
      if (filters.distanceRange === '5–10 km' && (d < 5 || d > 10)) return false;
      if (filters.distanceRange === '10–20 km' && (d < 10 || d > 20)) return false;
      if (filters.distanceRange === 'Above 20 km' && d <= 20) return false;

      // 3. Date Filter
      const ts = act.startTimestamp || act.creationTimestamp || 0;
      const now = Date.now();
      const oneDay = 86400000;

      if (filters.dateRange === 'Today') {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        if (ts < startOfToday.getTime()) return false;
      } else if (filters.dateRange === 'This Week') {
        if (now - ts > oneDay * 7) return false;
      } else if (filters.dateRange === 'This Month') {
        if (now - ts > oneDay * 30) return false;
      } else if (filters.dateRange === 'Custom') {
        if (filters.customStartDate) {
          const start = new Date(filters.customStartDate).getTime();
          if (ts < start) return false;
        }
        if (filters.customEndDate) {
          const end = new Date(filters.customEndDate).getTime() + oneDay;
          if (ts > end) return false;
        }
      }

      return true;
    });
  }, [activities, filters]);

  const handleDeleteConfirm = async () => {
    if (!activityToDelete) return;
    await deleteActivity(activityToDelete.id);
    setActivityToDelete(null);
  };

  const handleCardClick = (act: ActivityRecord) => {
    setSelectedActivity(act);
    navigateTo('activity-details');
  };

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
      {/* Top Header */}
      <header className="py-2 mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Workout History
          </h1>
          <p className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
            {filteredActivities.length} of {activities.length} sessions recorded
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openStatsStudioWithActivity()}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-sm flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
            title="Create Stats Poster"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Stats Studio</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1.5 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Clear Filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

          <button
            onClick={() => setShowFilterDrawer(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              hasActiveFilters || showFilterDrawer
                ? 'bg-[var(--accent-orange)] text-white shadow-md'
                : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Horizontal Activity Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 mb-4">
        {activityTypes.map((mode) => {
          const isSelected = filters.activity === mode;
          const Icon = mode === 'All' ? RotateCcw : getActivityIcon(mode);

          return (
            <button
              key={mode}
              onClick={() => setFilters(prev => ({ ...prev, activity: mode }))}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-[var(--accent-orange)] text-white shadow-md'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mode !== 'All' && <Icon className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{mode}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bottom Sheet / Modal Drawer */}
      {showFilterDrawer && (
        <div className="mb-6 p-4 rounded-3xl bg-[var(--bg-secondary)] dark:bg-[#181A18] border border-[var(--text-secondary)]/10 shadow-lg space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--text-secondary)]/10">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-primary)]">
              Refine Workout History
            </span>
            <button
              onClick={() => setShowFilterDrawer(false)}
              className="text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Close
            </button>
          </div>

          {/* Date Filter */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
              <span>Timeframe</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dateOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilters(prev => ({ ...prev, dateRange: opt }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.dateRange === opt
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {filters.dateRange === 'Custom' && (
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--text-secondary)]/10">
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.customStartDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, customStartDate: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold border-none focus:ring-1 focus:ring-[var(--accent-orange)]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-[var(--text-secondary)] block mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.customEndDate || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, customEndDate: e.target.value }))}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] text-xs text-[var(--text-primary)] font-semibold border-none focus:ring-1 focus:ring-[var(--accent-orange)]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Distance Filter */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
              <span>Distance Range</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {distanceOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setFilters(prev => ({ ...prev, distanceRange: opt }))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filters.distanceRange === opt
                      ? 'bg-[var(--accent-orange)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Workout History List */}
      {activities.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--bg-secondary)]/60 rounded-3xl border border-dashed border-[var(--text-secondary)]/20">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] text-[var(--accent-orange)] flex items-center justify-center mx-auto mb-3">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h3 className="text-base font-black text-[var(--text-primary)] mb-1">
            No workouts yet
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-5 leading-relaxed">
            No workouts yet. Start your first activity to see your history here.
          </p>
          <div className="flex justify-center">
            <button
              onClick={() => navigateTo('live-run')}
              className="px-5 py-2.5 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start Activity</span>
            </button>
          </div>
        </div>
      ) : filteredActivities.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[var(--bg-secondary)]/60 rounded-3xl border border-dashed border-[var(--text-secondary)]/20">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6 stroke-[1.8]" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
            No workouts match your filters
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto mb-5 leading-relaxed">
            Try adjusting your activity type, date range, or distance filters to view recorded workouts.
          </p>
          <div className="flex justify-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-surface)]/80 cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
            <button
              onClick={() => navigateTo('live-run')}
              className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Start Activity</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredActivities.map((act) => {
            const Icon = getActivityIcon(act.activityType);
            const dist = formatDistance(act.distanceKm);
            const isSpeedActivity = act.activityType === 'Cycling' || act.activityType === 'Biking';
            const speedFormatted = formatSpeed(act.speedKmh || 0);
            const paceFormatted = formatPace(act.pace);

            return (
              <div
                key={act.id}
                onClick={() => handleCardClick(act)}
                className="p-4 rounded-3xl bg-[var(--bg-secondary)] dark:bg-[#181A18] hover:bg-[var(--bg-surface)] transition-all shadow-sm group cursor-pointer border border-transparent hover:border-[var(--text-secondary)]/15"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{
                        background: 'linear-gradient(135deg, #FF7B39 0%, #FA4C00 100%)',
                        color: '#FFFFFF'
                      }}
                    >
                      <Icon className="w-5 h-5 stroke-[2.5]" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[var(--text-primary)]">
                          {act.title || `${act.activityType} Session`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)]">
                          {act.activityType}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                        {act.date} • {act.timeOfDay}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Create Poster Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openStatsStudioWithActivity(act);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Create Stats Poster"
                    >
                      <LineChart className="w-3 h-3" />
                      <span className="hidden sm:inline">Poster</span>
                    </button>

                    {/* Delete Action Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivityToDelete(act);
                      }}
                      className="w-8 h-8 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-rose-500 hover:bg-rose-500/10 flex items-center justify-center transition-colors cursor-pointer"
                      title="Delete Workout"
                      aria-label="Delete Workout"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Key Metrics Row */}
                <div className="grid grid-cols-4 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--bg-surface)] mb-3 text-center">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Distance</div>
                    <div className="text-sm md:text-base font-black text-[var(--text-primary)] font-tabular">
                      {dist.value} <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{dist.unit}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Duration</div>
                    <div className="text-sm md:text-base font-black text-[var(--text-primary)] font-tabular">
                      {act.durationFormatted}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">
                      {isSpeedActivity ? 'Avg Speed' : 'Avg Pace'}
                    </div>
                    <div className="text-sm md:text-base font-black text-[var(--text-primary)] font-tabular">
                      {isSpeedActivity ? `${speedFormatted.value} ${speedFormatted.unit}` : paceFormatted}
                    </div>
                  </div>

                  <div>
                    <div className="text-[9px] uppercase font-bold text-[var(--text-secondary)]">Calories</div>
                    <div className="text-sm md:text-base font-black text-[var(--text-primary)] font-tabular">
                      {act.calories} <span className="text-[10px] font-semibold text-[var(--text-secondary)]">kcal</span>
                    </div>
                  </div>
                </div>

                {/* Route Preview Map / Summary Strip */}
                {act.coordinates && act.coordinates.length > 1 ? (
                  <div className="h-28 w-full rounded-2xl overflow-hidden relative border border-[var(--text-secondary)]/10 pointer-events-none">
                    <GoogleMapView
                      currentPosition={act.coordinates[act.coordinates.length - 1]}
                      routeCoordinates={act.coordinates}
                      isTracking={false}
                      height="h-full"
                      showControls={false}
                      interactive={false}
                      autoCenterDefault={true}
                    />
                    <div className="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[var(--accent-orange)]" />
                      <span>{act.gpsPointCount || act.coordinates.length} pts</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--accent-orange)] pt-1 px-1">
                    <span>View full workout details</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {activityToDelete && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="bg-[var(--bg-secondary)] dark:bg-[#181A18] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[var(--text-secondary)]/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-base font-black text-[var(--text-primary)] mb-1">
              Delete Workout?
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-5 leading-relaxed">
              This will permanently delete this {activityToDelete.activityType} session ({formatDistance(activityToDelete.distanceKm).value} {formatDistance(activityToDelete.distanceKm).unit}) from HypeAtheDB.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setActivityToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
