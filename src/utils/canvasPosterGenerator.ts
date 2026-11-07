import { ActivityRecord, UnitMode, GpsCoordinate } from '../types';

export interface OverlayFormatOptions {
  aspectRatio: '9:16' | '1:1';
}

let cachedLogoImg: HTMLImageElement | null = null;

function getLogoImage(): Promise<HTMLImageElement | null> {
  if (cachedLogoImg && cachedLogoImg.complete && cachedLogoImg.naturalWidth > 0) {
    return Promise.resolve(cachedLogoImg);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png';
    img.onload = () => {
      cachedLogoImg = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
  });
}

/**
 * Renders a 100% transparent PNG overlay containing the selected workout's actual statistics.
 * 
 * Strict Layout Order (Top to Bottom):
 * 1. DISTANCE
 *    [Actual workout distance value]
 * 2. PACE or SPEED
 *    [Actual workout pace value]
 * 3. TIME
 *    [Actual workout duration value]
 * 4. [Actual Orange GPS Route Drawing]
 *    [Orange polyline normalized from real coordinates, start & finish markers]
 * 5. [Official HypeAthe Shoe Logo]
 *    [Original bright orange running-shoe logo with 3 white speed lines + HypeAthe wordmark]
 * 
 * Alpha transparency:
 * - 100% transparent background (alpha = 0, ctx.clearRect with zero background fills).
 * - Only text, route lines, markers, and logo are drawn.
 */
export async function renderTransparentOverlayToCanvas(
  canvas: HTMLCanvasElement,
  activity: ActivityRecord,
  units: UnitMode,
  options: OverlayFormatOptions = { aspectRatio: '9:16' }
): Promise<void> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  const width = 1080;
  const height = options.aspectRatio === '9:16' ? 1920 : 1080;

  canvas.width = width;
  canvas.height = height;

  // 1. Ensure 100% Transparent Background - wipe all pixels completely
  ctx.clearRect(0, 0, width, height);

  // Preload official brand logo
  const logoImg = await getLogoImage();

  // 2. Compute Actual Workout Metrics
  const isSpeedActivity = activity.activityType === 'Cycling' || activity.activityType === 'Biking';

  // Distance computation
  const distanceKm = typeof activity.distanceKm === 'number' && !isNaN(activity.distanceKm) ? activity.distanceKm : 0;
  let distFormatted = '';
  let distUnit = '';
  if (units === 'mi') {
    const mi = distanceKm * 0.621371;
    distFormatted = mi.toFixed(2);
    distUnit = 'mi';
  } else {
    distFormatted = distanceKm.toFixed(2);
    distUnit = 'km';
  }
  const distanceValueStr = `${distFormatted} ${distUnit}`;

  // Pace / Speed computation
  let paceOrSpeedLabel = isSpeedActivity ? 'Speed' : 'Pace';
  let paceOrSpeedValueStr = '';

  if (isSpeedActivity) {
    const speedKmh = activity.speedKmh && !isNaN(activity.speedKmh)
      ? activity.speedKmh
      : activity.activeDuration && activity.activeDuration > 0
      ? +((distanceKm / (activity.activeDuration / 3600)).toFixed(1))
      : 0;
    if (units === 'mi') {
      const mph = (speedKmh * 0.621371).toFixed(1);
      paceOrSpeedValueStr = `${mph} mph`;
    } else {
      paceOrSpeedValueStr = `${speedKmh.toFixed(1)} km/h`;
    }
  } else {
    let rawPace = activity.pace || activity.avgPace || '';
    if (rawPace && rawPace !== '--:--' && rawPace.includes(':')) {
      if (units === 'mi') {
        const parts = rawPace.split(':');
        const sec = parseInt(parts[0], 10) * 60 + parseInt(parts[1] || '0', 10);
        if (sec > 0) {
          const secPerMi = Math.round(sec * 1.60934);
          const m = Math.floor(secPerMi / 60);
          const s = secPerMi % 60;
          paceOrSpeedValueStr = `${m}:${s < 10 ? '0' : ''}${s} /mi`;
        }
      } else {
        paceOrSpeedValueStr = `${rawPace} /km`;
      }
    } else if (activity.activeDuration && activity.activeDuration > 0 && distanceKm > 0) {
      const paceSec = Math.round(activity.activeDuration / distanceKm);
      const m = Math.floor(paceSec / 60);
      const s = paceSec % 60;
      if (units === 'mi') {
        const secPerMi = Math.round(paceSec * 1.60934);
        const mm = Math.floor(secPerMi / 60);
        const ss = secPerMi % 60;
        paceOrSpeedValueStr = `${mm}:${ss < 10 ? '0' : ''}${ss} /mi`;
      } else {
        paceOrSpeedValueStr = `${m}:${s < 10 ? '0' : ''}${s} /km`;
      }
    } else {
      paceOrSpeedValueStr = `--:-- /km`;
    }
  }

  // Duration computation
  let timeValueStr = activity.durationFormatted || '';
  if (!timeValueStr && activity.activeDuration && activity.activeDuration > 0) {
    const totalSec = activity.activeDuration;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      timeValueStr = `${h}h ${m}m`;
    } else {
      timeValueStr = `${m}m ${s < 10 ? '0' : ''}${s}s`;
    }
  }
  if (!timeValueStr) {
    timeValueStr = '00:00';
  }

  // 3. Render exact layout
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // High-legibility shadow for contrast on any background photo
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 16;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const centerX = width / 2;
  const isVertical = options.aspectRatio === '9:16';
  
  // Section Y positions matching reference
  const distanceY = isVertical ? 320 : 160;
  const paceY = isVertical ? 560 : 330;
  const timeY = isVertical ? 800 : 500;
  const routeCenterY = isVertical ? 1180 : 720;
  const logoY = isVertical ? 1720 : 960;

  // 1. TOP SECTION: DISTANCE
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '700 36px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('Distance', centerX, distanceY - 65);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 124px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(distanceValueStr, centerX, distanceY);

  // 2. MIDDLE-TOP SECTION: PACE or SPEED
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText(paceOrSpeedLabel, centerX, paceY - 55);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 100px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(paceOrSpeedValueStr, centerX, paceY);

  // 3. MIDDLE SECTION: TIME
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '700 34px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '4px';
  ctx.fillText('Time', centerX, timeY - 55);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 100px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.fillText(timeValueStr, centerX, timeY);

  // 4. LOWER-MIDDLE SECTION: ACTUAL ORANGE GPS ROUTE DRAWING
  drawGpsRoute(ctx, activity.coordinates, centerX, routeCenterY, isVertical ? 620 : 500, isVertical ? 420 : 280);

  // 5. BOTTOM SECTION: OFFICIAL HYPEATHE RUNNING-SHOE LOGO
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const logoBadgeSize = 64;
  const logoTotalWidth = 280;
  const logoStartX = centerX - logoTotalWidth / 2;

  // Draw official running shoe badge
  if (logoImg) {
    ctx.save();
    // Clip with rounded corners
    const radius = 16;
    ctx.beginPath();
    ctx.moveTo(logoStartX + radius, logoY - logoBadgeSize / 2);
    ctx.arcTo(logoStartX + logoBadgeSize, logoY - logoBadgeSize / 2, logoStartX + logoBadgeSize, logoY + logoBadgeSize / 2, radius);
    ctx.arcTo(logoStartX + logoBadgeSize, logoY + logoBadgeSize / 2, logoStartX, logoY + logoBadgeSize / 2, radius);
    ctx.arcTo(logoStartX, logoY + logoBadgeSize / 2, logoStartX, logoY - logoBadgeSize / 2, radius);
    ctx.arcTo(logoStartX, logoY - logoBadgeSize / 2, logoStartX + logoBadgeSize, logoY - logoBadgeSize / 2, radius);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, logoStartX, logoY - logoBadgeSize / 2, logoBadgeSize, logoBadgeSize);
    ctx.restore();
  } else {
    // Fallback: draw orange rounded rectangle with 3 speed lines and shoe
    ctx.fillStyle = '#FF6B24';
    ctx.beginPath();
    ctx.roundRect(logoStartX, logoY - logoBadgeSize / 2, logoBadgeSize, logoBadgeSize, 16);
    ctx.fill();

    // 3 white speed lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(logoStartX + 12, logoY - 10);
    ctx.lineTo(logoStartX + 22, logoY - 10);
    ctx.moveTo(logoStartX + 10, logoY);
    ctx.lineTo(logoStartX + 24, logoY);
    ctx.moveTo(logoStartX + 14, logoY + 10);
    ctx.lineTo(logoStartX + 26, logoY + 10);
    ctx.stroke();
  }

  // Wordmark: "Hype" in white, "Athe" in brand orange #FF6B24
  ctx.font = '900 56px "Plus Jakarta Sans", sans-serif';
  ctx.letterSpacing = '1px';
  const textX = logoStartX + logoBadgeSize + 16;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Hype', textX, logoY);
  const hypeWidth = ctx.measureText('Hype').width;

  ctx.fillStyle = '#FF6B24';
  ctx.fillText('Athe', textX + hypeWidth, logoY);

  ctx.restore();
  ctx.restore();
}

/**
 * Draws the actual workout GPS route polyline scaled and centered.
 */
function drawGpsRoute(
  ctx: CanvasRenderingContext2D,
  coordinates: GpsCoordinate[] | undefined,
  centerX: number,
  centerY: number,
  boxWidth: number,
  boxHeight: number
) {
  ctx.save();

  // If we have actual coordinates (at least 2 points)
  if (coordinates && coordinates.length >= 2) {
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const c of coordinates) {
      if (c.latitude < minLat) minLat = c.latitude;
      if (c.latitude > maxLat) maxLat = c.latitude;
      if (c.longitude < minLng) minLng = c.longitude;
      if (c.longitude > maxLng) maxLng = c.longitude;
    }

    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;

    // Maintain aspect ratio of real route
    const scale = Math.min((boxWidth - 40) / lngSpan, (boxHeight - 40) / latSpan);
    const routePixelWidth = lngSpan * scale;
    const routePixelHeight = latSpan * scale;

    const startX = centerX - routePixelWidth / 2;
    const startY = centerY - routePixelHeight / 2;

    const project = (c: GpsCoordinate) => {
      const x = startX + (c.longitude - minLng) * scale;
      // Invert latitude so North is up
      const y = startY + (maxLat - c.latitude) * scale;
      return { x, y };
    };

    // Draw orange polyline
    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#FF6B24';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const firstPoint = project(coordinates[0]);
    ctx.moveTo(firstPoint.x, firstPoint.y);

    for (let i = 1; i < coordinates.length; i++) {
      const pt = project(coordinates[i]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Start Marker (Green Dot)
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#42C77A';
    ctx.beginPath();
    ctx.arc(firstPoint.x, firstPoint.y, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(firstPoint.x, firstPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Finish Marker (Orange Arrow / Dot)
    const lastPoint = project(coordinates[coordinates.length - 1]);
    ctx.fillStyle = '#FF6B24';
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Smooth energetic GPS curve for indoors/treadmill
    const p1 = { x: centerX - boxWidth * 0.38, y: centerY + 60 };
    const cp1 = { x: centerX - boxWidth * 0.1, y: centerY - 90 };
    const cp2 = { x: centerX + boxWidth * 0.15, y: centerY + 80 };
    const p2 = { x: centerX + boxWidth * 0.38, y: centerY - 70 };

    ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = '#FF6B24';
    ctx.lineWidth = 12;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y);
    ctx.stroke();

    // Start dot (Green)
    ctx.fillStyle = '#42C77A';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p1.x, p1.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Finish dot (Orange)
    ctx.fillStyle = '#FF6B24';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(p2.x, p2.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
