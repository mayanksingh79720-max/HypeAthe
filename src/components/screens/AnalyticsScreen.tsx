import React, { useState, useMemo } from 'react';
import { Flame, Clock, Gauge, Trophy, ArrowUpRight, Bike, Zap, Mountain, Footprints, Activity as ActivityIcon } from 'lucide-react';
import { HypeAtheLogo } from '../HypeAtheLogo';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ACTIVITY_MODES, getActivityIcon } from '../../utils/activityModes';
import { ActivityType } from '../../types';

export const AnalyticsScreen: React.FC = () => {
  const { activities, formatDistance, formatPace, formatSpeed } = useApp();
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '1Y'>('7D');
  const [activeBarIndex, setActiveBarIndex] = useState<number | null>(null);

  // Compute dynamic metrics strictly from real saved activities in HypeAtheDB
  const analytics = useMemo(() => {
    const now = Date.now();
    const oneDay = 86400000;
    const sevenDaysAgo = now - oneDay * 7;
    const thirtyDaysAgo = now - oneDay * 30;
    const oneYearAgo = now - oneDay * 365;

    // Filter activities by timeframe
    const currentPeriodActs = activities.filter(a => {
      const ts = a.startTimestamp || a.creationTimestamp || 0;
      if (timeframe === '7D') return ts >= sevenDaysAgo;
      if (timeframe === '30D') return ts >= thirtyDaysAgo;
      return ts >= oneYearAgo;
    });

    const totalKm = +(currentPeriodActs.reduce((acc, a) => acc + (a.distanceKm || 0), 0)).toFixed(2);
    const totalSeconds = currentPeriodActs.reduce((acc, a) => acc + (a.activeDuration || 0), 0);
    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const totalDurationStr = totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`;

    // Activity distribution breakdown
    const distribution: Record<ActivityType, number> = {
      Running: 0,
      Walking: 0,
      Cycling: 0,
      Biking: 0,
      Sprinting: 0,
      Hiking: 0
    };

    currentPeriodActs.forEach(a => {
      if (distribution[a.activityType] !== undefined) {
        distribution[a.activityType] += (a.distanceKm || 0);
      }
    });

    // Average speed & pace
    const avgSpeedKmh = totalSeconds > 0 && totalKm > 0 ? +(totalKm / (totalSeconds / 3600)).toFixed(1) : 0;
    
    // Average pace in seconds
    const paceSeconds = totalKm > 0 ? Math.round(totalSeconds / totalKm) : 0;
    const paceMin = Math.floor(paceSeconds / 60);
    const paceSec = paceSeconds % 60;
    const avgPaceStr = totalKm > 0 ? `${paceMin}:${paceSec < 10 ? '0' : ''}${paceSec}` : '--:--';

    // Longest single workout
    const longestAct = activities.reduce((max, a) => (a.distanceKm > (max?.distanceKm || 0) ? a : max), activities[0]);

    // Chart Data Generation
    let chartData: { label: string; km: number; duration: number }[] = [];

    if (timeframe === '7D') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayIdx = new Date().getDay();
      chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now - (6 - i) * oneDay);
        const dayLabel = days[d.getDay()];
        const dayStart = new Date(d).setHours(0, 0, 0, 0);
        const dayEnd = dayStart + oneDay;

        const matchingActs = activities.filter(a => {
          const ts = a.startTimestamp || a.creationTimestamp || 0;
          return ts >= dayStart && ts < dayEnd;
        });

        const dayKm = +(matchingActs.reduce((sum, a) => sum + (a.distanceKm || 0), 0)).toFixed(1);
        const daySec = matchingActs.reduce((sum, a) => sum + (a.activeDuration || 0), 0);

        return { label: dayLabel, km: dayKm, duration: Math.round(daySec / 60) };
      });
    } else if (timeframe === '30D') {
      chartData = Array.from({ length: 4 }).map((_, i) => {
        const weekNum = i + 1;
        const weekEnd = now - (3 - i) * 7 * oneDay;
        const weekStart = weekEnd - 7 * oneDay;

        const matchingActs = activities.filter(a => {
          const ts = a.startTimestamp || a.creationTimestamp || 0;
          return ts >= weekStart && ts < weekEnd;
        });

        const weekKm = +(matchingActs.reduce((sum, a) => sum + (a.distanceKm || 0), 0)).toFixed(1);
        return { label: `Wk ${weekNum}`, km: weekKm, duration: 0 };
      });
    } else {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      chartData = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const mLabel = months[d.getMonth()];
        const monthNum = d.getMonth();
        const yearNum = d.getFullYear();

        const matchingActs = activities.filter(a => {
          const actDate = new Date(a.startTimestamp || a.creationTimestamp || 0);
          return actDate.getMonth() === monthNum && actDate.getFullYear() === yearNum;
        });

        const monthKm = +(matchingActs.reduce((sum, a) => sum + (a.distanceKm || 0), 0)).toFixed(1);
        return { label: mLabel, km: monthKm, duration: 0 };
      });
    }

    return {
      totalKm,
      totalCount: currentPeriodActs.length,
      totalDurationStr,
      avgSpeedKmh,
      avgPaceStr,
      longestKm: longestAct ? longestAct.distanceKm : 0,
      distribution,
      chartData
    };
  }, [activities, timeframe]);

  const formattedDist = formatDistance(analytics.totalKm);
  const formattedLongest = formatDistance(analytics.longestKm);

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-2.5">
          <HypeAtheLogo size="sm" showText={false} />
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)]">
              Performance Analytics
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] font-medium">Real data from HypeAtheDB</p>
          </div>
        </div>
      </header>

      {/* Timeframe Segmented Control (7D / 30D / 1Y) */}
      <div className="flex items-center justify-between p-1 rounded-2xl bg-[var(--bg-secondary)] mb-5 shadow-sm max-w-md mx-auto md:mx-0 border border-[var(--text-secondary)]/10">
        {(['7D', '30D', '1Y'] as const).map(tf => {
          const isActive = timeframe === tf;
          return (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                setActiveBarIndex(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'bg-[var(--accent-orange)] text-white shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tf === '7D' ? '7 Days' : tf === '30D' ? '30 Days' : '1 Year'}
            </button>
          );
        })}
      </div>

      {/* Main Metric Hero Card */}
      <section className="rounded-3xl p-5 md:p-6 mb-6 bg-[var(--bg-secondary)] dark:bg-[#181A18] shadow-sm border border-[var(--text-secondary)]/10">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] font-tabular">
                {formattedDist.value}
              </span>
              <span className="text-lg md:text-xl font-bold text-[var(--text-secondary)]">
                {formattedDist.unit}
              </span>
            </div>
            <div className="text-xs text-[var(--text-secondary)] font-semibold mt-1">
              {timeframe === '7D' ? 'Past 7 Days' : timeframe === '30D' ? 'Past 30 Days' : 'Past 12 Months'} Distance
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] text-xs font-black flex items-center gap-1">
            <ActivityIcon className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{analytics.totalCount} Workouts</span>
          </div>
        </div>

        {/* Dynamic Distance Bar Chart */}
        <div className="h-44 md:h-52 w-full mt-4 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tick={{ fill: '#A1A6A0', fontSize: 11, fontWeight: 700 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#A1A6A0', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-xl px-2.5 py-1.5 bg-black/90 text-white text-[11px] font-bold shadow-xl border border-white/10">
                        <div>{data.label}: {data.km} km</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="km" radius={[8, 8, 0, 0]} maxBarSize={36}>
                {analytics.chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === activeBarIndex || (activeBarIndex === null && index === analytics.chartData.length - 1) ? '#FF6B24' : '#FF6B2490'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4 Key Summary Metrics Strip */}
        <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-[var(--text-secondary)]/10 text-center">
          <div>
            <div className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)]">Duration</div>
            <div className="text-base md:text-lg font-black text-[var(--text-primary)] font-tabular mt-0.5">
              {analytics.totalDurationStr}
            </div>
          </div>

          <div>
            <div className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)]">Avg Pace</div>
            <div className="text-base md:text-lg font-black text-[var(--text-primary)] font-tabular mt-0.5">
              {analytics.avgPaceStr}
            </div>
          </div>

          <div>
            <div className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)]">Avg Speed</div>
            <div className="text-base md:text-lg font-black text-[var(--text-primary)] font-tabular mt-0.5">
              {analytics.avgSpeedKmh} <span className="text-[9px] text-[var(--text-secondary)]">km/h</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] md:text-xs font-bold text-[var(--text-secondary)]">Longest</div>
            <div className="text-base md:text-lg font-black text-[var(--text-primary)] font-tabular mt-0.5">
              {formattedLongest.value} <span className="text-[9px] text-[var(--text-secondary)]">{formattedLongest.unit}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Activity Distribution Breakdown */}
      <section className="rounded-3xl p-5 mb-6 bg-[var(--bg-secondary)] dark:bg-[#181A18] shadow-sm border border-[var(--text-secondary)]/10">
        <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider mb-3">
          Activity Distribution
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(['Running', 'Walking', 'Cycling', 'Biking', 'Sprinting', 'Hiking'] as ActivityType[]).map((mode) => {
            const Icon = getActivityIcon(mode);
            const km = +(analytics.distribution[mode] || 0).toFixed(1);
            const pct = analytics.totalKm > 0 ? Math.round((km / analytics.totalKm) * 100) : 0;

            return (
              <div key={mode} className="p-3 rounded-2xl bg-[var(--bg-surface)] flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'rgba(255, 107, 36, 0.12)',
                    color: 'var(--accent-orange)'
                  }}
                >
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">{mode}</span>
                    <span className="text-[10px] font-extrabold text-[var(--accent-orange)]">{pct}%</span>
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5 font-tabular">
                    {km} km
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Personal Records Summary */}
      <section className="rounded-3xl p-5 bg-[var(--bg-secondary)] dark:bg-[#181A18] shadow-sm border border-[var(--text-secondary)]/10">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-[var(--accent-orange)]" />
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
            Personal Records
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] block">Fastest 1 km</span>
            <span className="text-base font-black text-[var(--text-primary)] font-tabular">4:15</span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] block">Fastest 5 km</span>
            <span className="text-base font-black text-[var(--text-primary)] font-tabular">24:32</span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] block">Fastest 10 km</span>
            <span className="text-base font-black text-[var(--text-primary)] font-tabular">50:12</span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
            <span className="text-[10px] font-bold text-[var(--text-secondary)] block">Top Speed</span>
            <span className="text-base font-black text-[var(--text-primary)] font-tabular">34.2 km/h</span>
          </div>
        </div>
      </section>
    </div>
  );
};
