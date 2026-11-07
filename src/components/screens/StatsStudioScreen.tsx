import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  LineChart,
  CheckCircle2,
  AlertCircle,
  Play,
  Layers,
  Send,
  Eye
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ActivityRecord } from '../../types';
import { renderTransparentOverlayToCanvas } from '../../utils/canvasPosterGenerator';
import { getActivityIcon } from '../../utils/activityModes';

export const StatsStudioScreen: React.FC = () => {
  const {
    goBack,
    activities,
    statsStudioActivity,
    setStatsStudioActivity,
    units,
    formatDistance,
    formatPace,
    formatSpeed,
    showToast,
    navigateTo,
    publishWorkoutToFeed
  } = useApp();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Selected workout from genuine activities only
  const [selectedWorkout, setSelectedWorkout] = useState<ActivityRecord | null>(() => {
    if (statsStudioActivity) return statsStudioActivity;
    return activities.length > 0 ? activities[0] : null;
  });

  const [aspectRatio, setAspectRatio] = useState<'9:16' | '1:1'>('9:16');
  const [previewBackdrop, setPreviewBackdrop] = useState<'checkerboard' | 'dark' | 'photo'>('checkerboard');
  const [isRendering, setIsRendering] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Draw the 100% transparent stats overlay whenever selected workout or aspect ratio changes
  const redrawOverlay = useCallback(async () => {
    if (!canvasRef.current || !selectedWorkout) return;
    setIsRendering(true);
    try {
      await renderTransparentOverlayToCanvas(
        canvasRef.current,
        selectedWorkout,
        units,
        { aspectRatio }
      );
    } catch (err) {
      console.error('Failed to render transparent overlay:', err);
      showToast('Error rendering statistics overlay');
    } finally {
      setIsRendering(false);
    }
  }, [selectedWorkout, units, aspectRatio, showToast]);

  useEffect(() => {
    redrawOverlay();
  }, [redrawOverlay]);

  // Download Transparent PNG (Preserves alpha channel with zero background pixels)
  const handleDownload = () => {
    if (!canvasRef.current || !selectedWorkout) return;
    setIsExporting(true);

    try {
      canvasRef.current.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to export image blob');
          setIsExporting(false);
          return;
        }

        const dateStr = selectedWorkout.date.replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `HypeAthe_Transparent_Overlay_${selectedWorkout.activityType}_${dateStr}.png`;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportSuccess(true);
        showToast('Transparent PNG downloaded successfully!');
        setIsExporting(false);
        setTimeout(() => setExportSuccess(false), 3000);
      }, 'image/png');
    } catch (e) {
      console.error('Export download error:', e);
      showToast('Download failed. Please try again.');
      setIsExporting(false);
    }
  };

  // Web Share API with download fallback
  const handleShare = async () => {
    if (!canvasRef.current || !selectedWorkout) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) {
          handleDownload();
          return;
        }

        const filename = `HypeAthe_Overlay_${selectedWorkout.activityType}.png`;
        const file = new File([blob], filename, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `HypeAthe Workout Overlay: ${selectedWorkout.title}`,
              text: `Check out my ${selectedWorkout.activityType} stats on HypeAthe!`
            });
            showToast('Stats overlay shared!');
          } catch (shareErr: any) {
            if (shareErr.name !== 'AbortError') {
              handleDownload();
            }
          }
        } else {
          handleDownload();
        }
      }, 'image/png');
    } catch (e) {
      handleDownload();
    }
  };

  // Share to Local Community Feed
  const handleShareToFeed = () => {
    if (!canvasRef.current || !selectedWorkout) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    publishWorkoutToFeed({
      title: `${selectedWorkout.title || selectedWorkout.activityType} Overlay ⚡`,
      caption: `Tracked with HypeAthe. Transparent stats overlay generated in Stats Studio.`,
      activityType: selectedWorkout.activityType,
      distanceKm: selectedWorkout.distanceKm,
      durationFormatted: selectedWorkout.durationFormatted,
      avgPace: selectedWorkout.pace,
      speedKmh: selectedWorkout.speedKmh,
      elevationM: selectedWorkout.elevationGainM,
      posterImageUrl: dataUrl
    });
  };

  // Empty state if user has 0 workouts recorded
  if (activities.length === 0) {
    return (
      <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-2xl mx-auto flex flex-col justify-between">
        <header className="flex items-center gap-3 py-2 mb-6">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Stats Studio
            </h1>
            <p className="text-xs text-[var(--text-secondary)]">Transparent Statistics Overlay</p>
          </div>
        </header>

        <div className="my-auto py-16 px-6 rounded-3xl bg-[var(--bg-secondary)] border border-dashed border-[var(--text-secondary)]/20 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] flex items-center justify-center mx-auto mb-4">
            <LineChart className="w-8 h-8 stroke-[2.2]" />
          </div>
          <h2 className="text-lg font-black text-[var(--text-primary)] mb-2">
            No Completed Workouts Yet
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mb-6 leading-relaxed">
            Stats Studio generates genuine transparent PNG overlays from your actual recorded workouts.
            Start an activity with live GPS tracking to create your first overlay.
          </p>
          <button
            onClick={() => navigateTo('live-run')}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-lg hover:opacity-95 transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start Activity (Live GPS)</span>
          </button>
        </div>

        <div />
      </div>
    );
  }

  const isSpeedActivity = selectedWorkout?.activityType === 'Cycling' || selectedWorkout?.activityType === 'Biking';
  const Icon = selectedWorkout ? getActivityIcon(selectedWorkout.activityType) : Play;

  return (
    <div className="min-h-screen pb-32 pt-3 px-4 sm:px-6 md:px-8 w-full max-w-4xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between py-2 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={goBack}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 transition-colors cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-black text-[var(--text-primary)] leading-tight">
              Stats Studio
            </h1>
            <p className="text-[11px] text-[var(--text-secondary)] font-semibold">
              100% Transparent PNG Overlay
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 hover:text-[var(--accent-orange)] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="Download PNG"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Download</span>
          </button>

          <button
            onClick={handleShare}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-md flex items-center gap-1.5 hover:opacity-95 transition-all cursor-pointer"
            title="Share Overlay"
          >
            <Share2 className="w-4 h-4" />
            <span>Share</span>
          </button>
        </div>
      </header>

      {/* Grid: Left Preview with Transparency Indicator, Right Workout Details & Step Controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Column: Transparent Canvas Preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <div className="w-full rounded-3xl p-3.5 bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-xl flex flex-col items-center">
            {/* Aspect Ratio & Transparency Indicator */}
            <div className="flex items-center justify-between w-full px-2 py-1 mb-2.5 text-[11px] font-bold text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-orange)] animate-pulse" />
                <span>TRANSPARENT PNG</span>
              </span>
              <span className="font-mono text-[var(--accent-orange)]">{aspectRatio}</span>
            </div>

            {/* Preview Viewport */}
            <div
              className={`w-full overflow-hidden rounded-2xl relative flex items-center justify-center shadow-inner transition-all ${
                aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[500px]' : 'aspect-square max-h-[380px]'
              }`}
              style={{
                background:
                  previewBackdrop === 'checkerboard'
                    ? 'repeating-conic-gradient(#272A27 0% 25%, #181A18 0% 50%) 50% / 24px 24px'
                    : previewBackdrop === 'dark'
                    ? '#101110'
                    : 'url(https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80) center/cover no-repeat'
              }}
            >
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain pointer-events-none"
              />

              {isRendering && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center text-xs font-bold text-white">
                  Updating Overlay...
                </div>
              )}
            </div>

            {/* Preview Backdrop Selector (Visual test only; does NOT affect transparent PNG export) */}
            <div className="w-full mt-3 pt-2 border-t border-[var(--text-secondary)]/10 flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Test Backdrop:</span>
              </span>
              <div className="flex gap-1">
                {[
                  { id: 'checkerboard', label: 'Checkerboard' },
                  { id: 'dark', label: 'Dark' },
                  { id: 'photo', label: 'Photo' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setPreviewBackdrop(opt.id as any)}
                    className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                      previewBackdrop === opt.id
                        ? 'bg-[var(--accent-orange)] text-white'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Share to Local Community Feed */}
            <button
              onClick={handleShareToFeed}
              className="mt-3.5 w-full py-2.5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--accent-orange)]/15 text-[var(--text-primary)] hover:text-[var(--accent-orange)] text-xs font-black flex items-center justify-center gap-2 border border-[var(--text-secondary)]/15 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share to Local Community Feed</span>
            </button>
          </div>
        </div>

        {/* Right Column: Step Controls & Review */}
        <div className="md:col-span-7 space-y-4">
          {/* Step 1: Select Workout */}
          <section className="p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                Step 1: Select Completed Workout
              </span>
              <span className="text-[11px] font-bold text-[var(--accent-orange)]">
                {activities.length} Available
              </span>
            </div>

            <select
              value={selectedWorkout?.id || ''}
              onChange={(e) => {
                const found = activities.find(a => a.id === e.target.value);
                if (found) {
                  setSelectedWorkout(found);
                  setStatsStudioActivity(found);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] border border-[var(--text-secondary)]/15 focus:outline-none focus:ring-2 focus:ring-[var(--accent-orange)] cursor-pointer"
            >
              {activities.map(act => (
                <option key={act.id} value={act.id}>
                  {act.activityType} • {formatDistance(act.distanceKm).value} {formatDistance(act.distanceKm).unit} · {act.durationFormatted} ({act.date})
                </option>
              ))}
            </select>
          </section>

          {/* Step 2: Review Workout Statistics */}
          {selectedWorkout && (
            <section className="p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  Step 2: Review Actual Statistics
                </span>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  From {selectedWorkout.date}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                    Distance
                  </span>
                  <span className="text-base font-black text-[var(--text-primary)] font-tabular mt-0.5 block">
                    {formatDistance(selectedWorkout.distanceKm).value} {formatDistance(selectedWorkout.distanceKm).unit}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                    {isSpeedActivity ? 'Speed' : 'Pace'}
                  </span>
                  <span className="text-base font-black text-[var(--text-primary)] font-tabular mt-0.5 block">
                    {isSpeedActivity ? formatSpeed(selectedWorkout.speedKmh || 0).value + ' ' + formatSpeed(selectedWorkout.speedKmh || 0).unit : formatPace(selectedWorkout.pace)}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[var(--bg-surface)]">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                    Time
                  </span>
                  <span className="text-base font-black text-[var(--text-primary)] font-tabular mt-0.5 block">
                    {selectedWorkout.durationFormatted}
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Step 3 & 4: Aspect Ratio & Layout Rules */}
          <section className="p-4 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] block">
              Step 3: Overlay Frame & Layout Order
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAspectRatio('9:16')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === '9:16'
                    ? 'bg-[var(--accent-orange)] text-white shadow-md'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Story / Reel (9:16)
              </button>
              <button
                onClick={() => setAspectRatio('1:1')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === '1:1'
                    ? 'bg-[var(--accent-orange)] text-white shadow-md'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Feed / Square (1:1)
              </button>
            </div>

            {/* Layout Order Specifications */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-surface)] text-xs text-[var(--text-secondary)] space-y-1.5 font-medium">
              <div className="font-bold text-[var(--text-primary)] mb-1">
                Strict Vertical Layout Sequence:
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold text-[10px] flex items-center justify-center">1</span>
                <span>DISTANCE (e.g. {formatDistance(selectedWorkout?.distanceKm || 0).value} {formatDistance(selectedWorkout?.distanceKm || 0).unit})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold text-[10px] flex items-center justify-center">2</span>
                <span>{isSpeedActivity ? 'SPEED' : 'PACE'} (e.g. {isSpeedActivity ? formatSpeed(selectedWorkout?.speedKmh || 0).value + ' ' + formatSpeed(selectedWorkout?.speedKmh || 0).unit : formatPace(selectedWorkout?.pace || '0:00')})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold text-[10px] flex items-center justify-center">3</span>
                <span>TIME (e.g. {selectedWorkout?.durationFormatted || '00:00'})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold text-[10px] flex items-center justify-center">4</span>
                <span>ACTUAL ORANGE GPS ROUTE DRAWING</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[var(--accent-orange)]/15 text-[var(--accent-orange)] font-bold text-[10px] flex items-center justify-center">5</span>
                <span>HYPEATHE OFFICIAL BRAND LOGO & TAGLINE</span>
              </div>
            </div>
          </section>

          {/* Step 5: Export Action Card */}
          <section className="p-5 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/10 shadow-sm space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-[var(--text-secondary)] block">
              Step 5: Export Transparent Overlay
            </span>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              The downloaded PNG is 100% transparent. Place it over any photo in your camera roll, Instagram Story, or editing app.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleDownload}
                disabled={isExporting}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-[var(--accent-orange)] to-[#FA4C00] text-white text-xs font-black shadow-lg flex items-center justify-center gap-2 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>{isExporting ? 'Generating PNG...' : 'Download Transparent PNG'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-3 px-5 rounded-2xl bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--accent-orange)]/15 hover:text-[var(--accent-orange)] text-xs font-black flex items-center justify-center gap-2 border border-[var(--text-secondary)]/15 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4 stroke-[2.5]" />
                <span>Share</span>
              </button>
            </div>

            {exportSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Transparent overlay exported! Ready to layer over your workout photos.</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
