import React, { useState } from 'react';
import { ArrowLeft, Share2, Flame, Mountain, Gauge, Clock, ChevronDown, ChevronUp, MapPin, LineChart, Activity as ActivityIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleMapView } from '../GoogleMapView';
import { getActivityIcon } from '../../utils/activityModes';

export const ActivityDetailsScreen: React.FC = () => {
  const { goBack, selectedActivity, formatDistance, formatPace, formatSpeed, showToast, navigateTo, openStatsStudioWithActivity } = useApp();
  const [expandedSplit, setExpandedSplit] = useState<number | null>(null);

  if (!selectedActivity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-[var(--text-secondary)] mb-4">No workout selected</p>
        <button
          onClick={() => navigateTo('history')}
          className="px-4 py-2 rounded-xl bg-[var(--accent-orange)] text-white text-xs font-bold"
        >
          View Workout History
        </button>
      </div>
    );
  }

  const formattedDist = formatDistance(selectedActivity.distanceKm);
  const isSpeedActivity = selectedActivity.activityType === 'Cycling' || selectedActivity.activityType === 'Biking';
  const speedFormatted = formatSpeed(selectedActivity.speedKmh || 0);
  const paceFormatted = formatPace(selectedActivity.pace);
  const Icon = getActivityIcon(selectedActivity.activityType);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `HypeAthe: ${selectedActivity.title}`,
        text: `I just finished ${formattedDist.value} ${formattedDist.unit} in ${selectedActivity.durationFormatted} with HypeAthe!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      showToast('Activity link copied to clipboard!');
    }
  };

  const startTimeStr = selectedActivity.startTimestamp
    ? new Date(selectedActivity.startTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : selectedActivity.timeOfDay;

  const endTimeStr = selectedActivity.endTimestamp
    ? new Date(selectedActivity.endTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-4">
        <button
          onClick={goBack}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center">
          <h1 className="text-base md:text-lg font-black text-[var(--text-primary)]">
            Workout Summary
          </h1>
          <span className="text-[10px] font-bold uppercase text-[var(--accent-orange)] tracking-wider">
            {selectedActivity.activityType}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openStatsStudioWithActivity(selectedActivity)}
            className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-md flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
            title="Create Stats Poster"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Stats Studio</span>
          </button>

          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
            aria-label="Share workout"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start mb-6">
        {/* Left Column: Map & Activity Title */}
        <div className="md:col-span-5 flex flex-col gap-4">
          <div className="rounded-3xl overflow-hidden shadow-sm relative border border-[var(--text-secondary)]/10">
            {selectedActivity.coordinates && selectedActivity.coordinates.length > 0 ? (
              <GoogleMapView
                currentPosition={selectedActivity.coordinates[selectedActivity.coordinates.length - 1]}
                routeCoordinates={selectedActivity.coordinates}
                isTracking={false}
                height="h-72 md:h-80"
                showControls={true}
                interactive={true}
                autoCenterDefault={true}
              />
            ) : (
              <div className="h-72 md:h-80 bg-[var(--bg-secondary)] flex flex-col items-center justify-center text-xs text-[var(--text-secondary)]">
                <MapPin className="w-8 h-8 text-[var(--accent-orange)] mb-2" />
                <span>No GPS route coordinates recorded</span>
              </div>
            )}

            <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-md">
              <MapPin className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
              <span>{selectedActivity.gpsPointCount || selectedActivity.coordinates?.length || 0} GPS points</span>
            </div>
          </div>

          {/* Stats Studio Action Banner */}
          <button
            onClick={() => openStatsStudioWithActivity(selectedActivity)}
            className="w-full py-2.5 px-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--accent-orange)]/40 hover:border-[var(--accent-orange)] text-[var(--accent-orange)] hover:bg-[var(--accent-orange)]/10 text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <LineChart className="w-4 h-4" />
            <span>Generate Stats Poster for Instagram & Stories</span>
          </button>

          <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[var(--bg-secondary)] shadow-sm border border-[var(--text-secondary)]/10">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md text-white"
              style={{ background: 'linear-gradient(135deg, #FF7B39 0%, #FA4C00 100%)' }}
            >
              <Icon className="w-6 h-6 stroke-[2.5]" />
            </div>

            <div className="flex-1">
              <h2 className="text-lg md:text-xl font-black text-[var(--text-primary)] leading-tight">
                {selectedActivity.title}
              </h2>
              <div className="text-xs text-[var(--text-secondary)] font-medium mt-0.5">
                {selectedActivity.date} • {startTimeStr} {endTimeStr ? `– ${endTimeStr}` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Key Metrics */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <div className="rounded-3xl p-5 bg-[var(--bg-secondary)] dark:bg-[#181A18] shadow-xs border border-[var(--text-secondary)]/15">
            {/* Row 1: Primary Metrics matching Reference Card (Distance, Pace, Time) */}
            <div className="grid grid-cols-3 gap-2 pb-4 border-b border-[var(--text-secondary)]/10 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center mb-1">
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {formattedDist.value} <span className="text-xs font-bold text-[var(--text-secondary)]">{formattedDist.unit}</span>
                </div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-0.5">
                  Distance
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center mb-1">
                  <Gauge className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {isSpeedActivity ? `${speedFormatted.value}` : paceFormatted.replace(' /km', '').replace(' /mi', '')}
                </div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-0.5">
                  {isSpeedActivity ? 'Speed' : 'Pace'}
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center mb-1">
                  <Clock className="w-4 h-4 stroke-[2.5]" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {selectedActivity.durationFormatted}
                </div>
                <div className="text-[11px] font-bold text-[var(--text-secondary)] mt-0.5">
                  Time
                </div>
              </div>
            </div>

            {/* Row 2: Secondary Metrics (Calories, Elevation, Secondary Metric) */}
            <div className="grid grid-cols-3 gap-2 pt-4 text-center">
              <div>
                <div className="text-xl md:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {selectedActivity.calories}
                </div>
                <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                  <span>Calories</span>
                </div>
              </div>

              <div>
                <div className="text-xl md:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {selectedActivity.elevationGainM}
                  <span className="text-xs font-semibold text-[var(--text-secondary)] ml-0.5">m</span>
                </div>
                <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                  <span>Elev Gain</span>
                </div>
              </div>

              <div>
                <div className="text-xl md:text-2xl font-black text-[var(--text-primary)] font-tabular leading-tight">
                  {isSpeedActivity ? paceFormatted.replace(' /km', '').replace(' /mi', '') : `${speedFormatted.value}`}
                </div>
                <div className="text-[11px] md:text-xs font-medium text-[var(--text-secondary)] mt-0.5 flex items-center justify-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-[var(--accent-orange)]" />
                  <span>{isSpeedActivity ? 'Avg Pace' : 'Avg Speed'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Session Timing & GPS Quality */}
          <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] dark:bg-[#181A18] text-xs space-y-2 border border-[var(--text-secondary)]/10">
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Start Time:</span>
              <span className="font-bold text-[var(--text-primary)] font-tabular">{startTimeStr}</span>
            </div>
            {endTimeStr && (
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>Finish Time:</span>
                <span className="font-bold text-[var(--text-primary)] font-tabular">{endTimeStr}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Recorded Route Points:</span>
              <span className="font-bold text-[var(--text-primary)] font-tabular">
                {selectedActivity.gpsPointCount || selectedActivity.coordinates?.length || 0} GPS points
              </span>
            </div>
            {selectedActivity.gpsAccuracy && (
              <div className="flex justify-between items-center text-[var(--text-secondary)]">
                <span>GPS Precision:</span>
                <span className="font-bold text-emerald-400 font-tabular">
                  ±{Math.round(selectedActivity.gpsAccuracy * 10) / 10} m
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kilometer / Mile Splits Section */}
      {selectedActivity.splits && selectedActivity.splits.length > 0 && (
        <section className="rounded-3xl p-5 md:p-6 mb-6 bg-[var(--bg-secondary)] dark:bg-[#181A18] shadow-sm border border-[var(--text-secondary)]/10">
          <h3 className="text-sm md:text-base font-bold text-[var(--text-primary)] mb-4">
            Kilometer Splits
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {selectedActivity.splits.map((split, i) => {
              const isExpanded = expandedSplit === i;
              return (
                <div
                  key={i}
                  onClick={() => setExpandedSplit(isExpanded ? null : i)}
                  className="rounded-2xl p-3.5 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--accent-orange)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                      <span className="text-xs md:text-sm font-bold text-[var(--text-primary)]">
                        {split.km} km
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs md:text-sm font-semibold font-tabular">
                      <span className="text-[var(--text-primary)]">{split.pace} /km</span>
                      <span className="text-[var(--color-success)]">{split.diff}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2.5 pt-2 border-t border-[var(--text-secondary)]/10 text-xs text-[var(--text-secondary)] flex justify-between">
                      <span>Elevation Gain: {split.elevation}</span>
                      <span>Recorded Time: {Math.floor((split.timeSeconds || 0) / 60)}m {(split.timeSeconds || 0) % 60}s</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
