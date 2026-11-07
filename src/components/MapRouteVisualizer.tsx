import React, { useState, useEffect } from 'react';
import { Play, Pause, Layers, Compass, ZoomIn, ZoomOut } from 'lucide-react';

interface MapRouteVisualizerProps {
  height?: string;
  interactive?: boolean;
  showControls?: boolean;
  animated?: boolean;
  className?: string;
  variant?: 'satellite' | 'dark-terrain' | 'minimal';
}

export const MapRouteVisualizer: React.FC<MapRouteVisualizerProps> = ({
  height = 'h-72',
  interactive = true,
  showControls = true,
  animated = false,
  className = '',
  variant: initialVariant = 'satellite'
}) => {
  const [mapType, setMapType] = useState<'satellite' | 'dark-terrain'>(initialVariant === 'dark-terrain' ? 'dark-terrain' : 'satellite');
  const [isPlaying, setIsPlaying] = useState(animated);
  const [progress, setProgress] = useState(animated ? 0.3 : 1);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress(p => (p >= 1 ? 0 : p + 0.015));
    }, 80);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Route path coordinates modeled after the loop in the user's uploaded mockup:
  // Starts around (130, 240), loops around suburban streets, climbs north, swings east, loops south-east and returns.
  const routeSvgPath = "M 130 250 C 120 220, 150 180, 190 170 C 230 160, 280 140, 310 100 C 330 70, 370 65, 385 100 C 395 130, 380 180, 360 210 C 340 240, 310 270, 260 290 C 210 310, 160 290, 130 250 Z";

  return (
    <div
      className={`relative w-full ${height} overflow-hidden rounded-3xl select-none group ${className}`}
      style={{
        backgroundColor: mapType === 'satellite' ? '#1c2e22' : '#141614'
      }}
    >
      {/* Background Satellite Terrain Simulation */}
      <svg
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300"
        style={{ transform: `scale(${zoom})` }}
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Satellite terrain patterns */}
          <radialGradient id="satForest" cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor={mapType === 'satellite' ? '#2d4734' : '#1f2420'} />
            <stop offset="50%" stopColor={mapType === 'satellite' ? '#1f3325' : '#171917'} />
            <stop offset="100%" stopColor={mapType === 'satellite' ? '#132117' : '#101110'} />
          </radialGradient>

          <pattern id="streetGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke={mapType === 'satellite' ? '#3d4f40' : '#282c28'}
              strokeWidth="0.8"
              opacity="0.35"
            />
            {/* Neighborhood road branches */}
            <path
              d="M 15 15 Q 35 20, 45 45"
              fill="none"
              stroke={mapType === 'satellite' ? '#4a5d4e' : '#333833'}
              strokeWidth="1.2"
              opacity="0.4"
            />
            <path
              d="M 0 30 Q 25 35, 60 25"
              fill="none"
              stroke={mapType === 'satellite' ? '#5a6d5c' : '#3c423c'}
              strokeWidth="1.6"
              opacity="0.45"
            />
          </pattern>

          {/* Glowing Route Gradient */}
          <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF8544" />
            <stop offset="50%" stopColor="#FF6B24" />
            <stop offset="100%" stopColor="#FA5205" />
          </linearGradient>

          {/* Filter for route neon bloom */}
          <filter id="routeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#FF6B24" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* Base terrain */}
        <rect width="100%" height="100%" fill="url(#satForest)" />
        <rect width="100%" height="100%" fill="url(#streetGrid)" />

        {/* Topographic elevation lines */}
        <path
          d="M -20 180 Q 150 120, 280 200 T 520 160"
          fill="none"
          stroke={mapType === 'satellite' ? '#37523f' : '#232924'}
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M -10 260 Q 180 230, 320 310 T 520 280"
          fill="none"
          stroke={mapType === 'satellite' ? '#37523f' : '#232924'}
          strokeWidth="1.5"
          opacity="0.6"
        />

        {/* Major Parkway / River curve */}
        <path
          d="M 80 -20 Q 70 140, 120 230 T 110 420"
          fill="none"
          stroke={mapType === 'satellite' ? '#21382b' : '#1c221e'}
          strokeWidth="14"
          opacity="0.5"
        />

        {/* GPS Active Running Route Polyline */}
        {/* Underlayer shadow */}
        <path
          d={routeSvgPath}
          fill="none"
          stroke="#000000"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.35"
        />
        {/* Main vibrant orange route line */}
        <path
          d={routeSvgPath}
          fill="none"
          stroke="url(#routeGlow)"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#routeShadow)"
        />

        {/* Kilometer milestone marks along the route */}
        {/* 1 KM */}
        <circle cx="180" cy="172" r="3.5" fill="#FFFFFF" stroke="#FF6B24" strokeWidth="1.8" />
        {/* 2 KM */}
        <circle cx="280" cy="140" r="3.5" fill="#FFFFFF" stroke="#FF6B24" strokeWidth="1.8" />
        {/* 3 KM */}
        <circle cx="380" cy="115" r="3.5" fill="#FFFFFF" stroke="#FF6B24" strokeWidth="1.8" />
        {/* 4 KM */}
        <circle cx="340" cy="240" r="3.5" fill="#FFFFFF" stroke="#FF6B24" strokeWidth="1.8" />
        {/* 5 KM */}
        <circle cx="210" cy="305" r="3.5" fill="#FFFFFF" stroke="#FF6B24" strokeWidth="1.8" />

        {/* Start Point: Green glowing dot */}
        <circle cx="130" cy="250" r="8" fill="#42C77A" fillOpacity="0.3" />
        <circle cx="130" cy="250" r="5" fill="#FFFFFF" stroke="#42C77A" strokeWidth="2.5" />

        {/* End / Current runner position: Checkered Flag or Runner Dot */}
        <g transform="translate(385, 96)">
          {/* Target / Crosshair icon matching the reference screenshot */}
          <rect x="-10" y="-10" width="20" height="20" rx="5" fill="#000000" fillOpacity="0.75" />
          <path d="M -7 -4 L -7 -7 L -4 -7" stroke="white" strokeWidth="1.6" fill="none" />
          <path d="M 7 -4 L 7 -7 L 4 -7" stroke="white" strokeWidth="1.6" fill="none" />
          <path d="M -7 4 L -7 7 L -4 7" stroke="white" strokeWidth="1.6" fill="none" />
          <path d="M 7 4 L 7 7 L 4 7" stroke="white" strokeWidth="1.6" fill="none" />
          <circle cx="0" cy="0" r="3" fill="#FF6B24" />
        </g>
      </svg>

      {/* Floating Map Controls */}
      {showControls && (
        <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
          {/* Map Layer Toggle (Satellite vs Dark) */}
          <button
            onClick={() => setMapType(m => (m === 'satellite' ? 'dark-terrain' : 'satellite'))}
            className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/80 transition-colors shadow-md"
            title="Toggle map layer"
            aria-label="Toggle map layer"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Interactive Zoom Controls */}
          {interactive && (
            <div className="flex flex-col rounded-full bg-black/60 backdrop-blur-md overflow-hidden shadow-md">
              <button
                onClick={() => setZoom(z => Math.min(z + 0.2, 1.8))}
                className="w-9 h-9 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <div className="w-full h-[1px] bg-white/10" />
              <button
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.9))}
                className="w-9 h-9 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Replay / Animated Route Button */}
      {interactive && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/70 backdrop-blur-md text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 hover:bg-black/90 group-hover:opacity-100 opacity-80"
          title={isPlaying ? "Pause route replay" : "Replay route"}
          aria-label={isPlaying ? "Pause route replay" : "Replay route"}
        >
          {isPlaying ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white ml-0.5" />}
        </button>
      )}

      {/* Bottom map watermark badge */}
      <div className="absolute bottom-2 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-[10px] text-white/80 font-medium">
        <Compass className="w-3 h-3 text-[var(--accent-orange)]" />
        <span>GPS 5.21 km Loop</span>
      </div>
    </div>
  );
};
