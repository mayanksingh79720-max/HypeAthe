import React from 'react';
import { LucideProps } from 'lucide-react';
import { ActivityType, ActivityModeInfo } from '../types';

/**
 * HypeAthe Athletic Icon System
 * Recreated matching the visual reference design:
 * - Solid athletic style with orange (#FF6B24), white, and theme-adaptive dark (#171917 / dark:fill-white)
 * - Proportional 64x64 vector geometry scaling with LucideProps
 */

// 1. Running: Performance athletic sneaker with 3 speed lines, white midsole stripe & laces, dark outsole & collar
export const RunningIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const primaryFill = isWhite ? '#FFFFFF' : 'var(--text-primary)';
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';
  const whiteAccent = isWhite ? 'rgba(255, 255, 255, 0.75)' : '#FFFFFF';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 3 Horizontal Speed Lines (Top, Middle, Bottom) */}
      <path
        d="M7 26.5L24 26.5C24.8 26.5 25.2 27.5 24.5 28L21 30.5L9 30.5C7.8 30.5 7 29.5 7 28.5L7 26.5Z"
        fill={orangeFill}
      />
      <path
        d="M3 35L26 35C26.8 35 27.3 36 26.5 36.5L23 39.5L5.5 39.5C4.2 39.5 3 38.3 3 37L3 35Z"
        fill={orangeFill}
      />
      <path
        d="M10 44L28.5 44C29.2 44 29.7 44.8 29.2 45.4L27 48L12.5 48C11.2 48 10 46.8 10 45.5L10 44Z"
        fill={orangeFill}
      />

      {/* Outsole (Dark) */}
      <path
        d="M20 44.5C20.5 44 21.2 43.8 22 43.8L37.5 42C44.5 41.2 51.5 36.8 55.5 33.2C56.8 32 58.2 33.2 57.5 34.6C54.2 40.5 46.5 45.8 38 47.2L24.5 49.2C22.2 49.5 20.2 47.8 20 45.5L20 44.5Z"
        fill={primaryFill}
      />

      {/* Aerodynamic Midsole Cushion Stripe */}
      <path
        d="M22.5 42.5L37.8 40.7C44.5 39.9 50.8 36 55 32.2L55.8 33.2C51.5 37 44.8 41 38 41.8L23.2 43.7C22.2 43.8 21.5 43.2 21.5 42.2C21.5 42.1 21.8 42.6 22.5 42.5Z"
        fill={whiteAccent}
      />

      {/* Dark Collar / Sockliner Opening */}
      <path
        d="M32.5 21C31.2 21 30.2 22 29.5 23.2L28 26C27.5 27 28.2 28.2 29.5 28.2C31.5 28.2 34 26.5 35.5 24.5L34.5 22C34 21.3 33.2 21 32.5 21Z"
        fill={primaryFill}
      />

      {/* Vibrant Orange Sneaker Upper */}
      <path
        d="M30 26.8C28.5 28.2 26.5 31.5 25 35.5C23.8 38.8 22.5 40.8 22.5 41.8L37.8 40C44.8 39.2 51 35.2 55.2 31.5C56.2 30.6 55.8 29 54.5 28.5C49.5 26.5 44 21.5 40.5 17.5C39.5 16.3 37.8 16 36.5 16.8L33.5 19C32.8 19.5 32.5 20.2 32.5 21L34 24.5C32.8 25.8 31.2 26.8 30 26.8Z"
        fill={orangeFill}
      />

      {/* 3 Crisp Instep Laces */}
      <line x1="37" y1="20.5" x2="41.5" y2="24" stroke={whiteAccent} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="41" y1="24" x2="45.5" y2="27.5" stroke={whiteAccent} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="45" y1="27.5" x2="49.5" y2="31" stroke={whiteAccent} strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
};

// 2. Walking: Staggered athletic footprints with dynamic orange arch slashes
export const WalkingIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const primaryFill = isWhite ? '#FFFFFF' : 'var(--text-primary)';
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Left Footprint (Forward) */}
      {/* Forefoot pad */}
      <path
        d="M23 10C17.5 10 14 13.5 14 18.5C14 23 16.5 25.5 18 26.5C21 26 25 25.5 28.5 23.5C29.8 21.5 30.5 18.5 30 15C29 12 26.5 10 23 10Z"
        fill={primaryFill}
      />
      {/* Orange dynamic arch slash */}
      <path
        d="M17.2 28.8C18.5 32 21 33.2 24 33C27 31 28.5 28 28.8 25.5C25.5 27 21 27.8 17.2 28.8Z"
        fill={orangeFill}
      />
      {/* Heel pad */}
      <path
        d="M20.5 35.5C18 36.5 17 38.5 17 41.5C17 45 19 47 22.5 47C26 47 28 45 28 41.5C28 38.5 26.5 36.5 23.8 35.5C22.8 35.2 21.5 35.2 20.5 35.5Z"
        fill={primaryFill}
      />

      {/* Right Footprint (Trailing) */}
      {/* Forefoot pad */}
      <path
        d="M41 21C35.5 21 32 24.5 32 29.5C32 34 34.5 36.5 36 37.5C39 37 43 36.5 46.5 34.5C47.8 32.5 48.5 29.5 48 26C47 23 44.5 21 41 21Z"
        fill={primaryFill}
      />
      {/* Orange dynamic arch slash */}
      <path
        d="M35.2 39.8C36.5 43 39 44.2 42 44C45 42 46.5 39 46.8 36.5C43.5 38 39 38.8 35.2 39.8Z"
        fill={orangeFill}
      />
      {/* Heel pad */}
      <path
        d="M38.5 46.5C36 47.5 35 49.5 35 52.5C35 56 37 58 40.5 58C44 58 46 56 46 52.5C46 49.5 44.5 47.5 41.8 46.5C40.8 46.2 39.5 46.2 38.5 46.5Z"
        fill={primaryFill}
      />
    </svg>
  );
};

// 3. Cycling: Road racing bike with orange top-tube accent and orange inner wheel rings
export const CyclingIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const primaryFill = isWhite ? '#FFFFFF' : 'var(--text-primary)';
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Rear Road Wheel */}
      <circle cx="17.5" cy="41" r="12" stroke={primaryFill} strokeWidth="3" fill="none" />
      <circle cx="17.5" cy="41" r="8.5" stroke={orangeFill} strokeWidth="2.2" fill="none" />
      <circle cx="17.5" cy="41" r="2.2" fill={primaryFill} />

      {/* Front Road Wheel */}
      <circle cx="46.5" cy="41" r="12" stroke={primaryFill} strokeWidth="3" fill="none" />
      <circle cx="46.5" cy="41" r="8.5" stroke={orangeFill} strokeWidth="2.2" fill="none" />
      <circle cx="46.5" cy="41" r="2.2" fill={primaryFill} />

      {/* Frame Geometry */}
      <line x1="17.5" y1="41" x2="31" y2="41" stroke={primaryFill} strokeWidth="2.6" strokeLinecap="round" />
      <line x1="17.5" y1="41" x2="26.5" y2="24" stroke={primaryFill} strokeWidth="2.6" strokeLinecap="round" />
      <line x1="31" y1="41" x2="25.5" y2="20.5" stroke={primaryFill} strokeWidth="2.6" strokeLinecap="round" />

      {/* Road Saddle */}
      <path
        d="M22 19.5C22 19.5 24 18.5 27 18.5C30 18.5 31.5 19.2 31.5 20C31.5 20.8 29.5 20.5 26.5 20.5C23.5 20.5 22 20.2 22 19.5Z"
        fill={primaryFill}
      />

      {/* Down tube */}
      <line x1="31" y1="41" x2="42.5" y2="23.5" stroke={primaryFill} strokeWidth="2.6" strokeLinecap="round" />

      {/* Front Fork */}
      <line x1="42.5" y1="23.5" x2="46.5" y2="41" stroke={primaryFill} strokeWidth="2.6" strokeLinecap="round" />

      {/* Head tube & Drop Handlebars */}
      <path
        d="M42.5 23.5L41.5 17.5L45.5 17.5C47 17.5 48 18.5 48 20L47.2 22.5"
        stroke={primaryFill}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Signature Orange Top Tube */}
      <line
        x1="26.5"
        y1="24"
        x2="42.5"
        y2="23.5"
        stroke={orangeFill}
        strokeWidth="3.2"
        strokeLinecap="round"
      />
    </svg>
  );
};

// 4. Biking: Mountain/commuter bike with thick knobby tread tires and orange inner rings
export const BikingIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const primaryFill = isWhite ? '#FFFFFF' : 'var(--text-primary)';
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Rear Fat-Tire Wheel with Knobby Treads */}
      <circle
        cx="17.5"
        cy="42"
        r="13"
        stroke={primaryFill}
        strokeWidth="3"
        strokeDasharray="3.2 2.6"
        fill="none"
      />
      <circle cx="17.5" cy="42" r="11" stroke={primaryFill} strokeWidth="2.8" fill="none" />
      <circle cx="17.5" cy="42" r="7.5" stroke={orangeFill} strokeWidth="2.2" fill="none" />
      <circle cx="17.5" cy="42" r="2.5" fill={primaryFill} />

      {/* Front Fat-Tire Wheel with Knobby Treads */}
      <circle
        cx="46.5"
        cy="42"
        r="13"
        stroke={primaryFill}
        strokeWidth="3"
        strokeDasharray="3.2 2.6"
        fill="none"
      />
      <circle cx="46.5" cy="42" r="11" stroke={primaryFill} strokeWidth="2.8" fill="none" />
      <circle cx="46.5" cy="42" r="7.5" stroke={orangeFill} strokeWidth="2.2" fill="none" />
      <circle cx="46.5" cy="42" r="2.5" fill={primaryFill} />

      {/* Mountain Bike Frame Geometry */}
      <line x1="17.5" y1="42" x2="31" y2="42" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="17.5" y1="42" x2="26.5" y2="26" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="31" y1="42" x2="25.5" y2="21.5" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />

      {/* MTB Saddle */}
      <path
        d="M21.5 21C21.5 20.2 23.5 19.5 27 19.5C30.5 19.5 32 20.5 32 21.5C32 22.2 30 22 27 22C23.5 22 21.5 21.8 21.5 21Z"
        fill={primaryFill}
      />

      {/* Sloping MTB Top Tube */}
      <line x1="26.5" y1="26" x2="41.5" y2="23.5" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />

      {/* Down Tube */}
      <line x1="31" y1="42" x2="41.5" y2="23.5" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />

      {/* Front Suspension Fork */}
      <line x1="41.5" y1="23.5" x2="46.5" y2="42" stroke={primaryFill} strokeWidth="3" strokeLinecap="round" />

      {/* Stem & Riser Handlebars */}
      <line x1="41.5" y1="23.5" x2="41" y2="17" stroke={primaryFill} strokeWidth="2.8" strokeLinecap="round" />
      <line x1="38" y1="17" x2="45" y2="17" stroke={primaryFill} strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  );
};

// 5. Sprinting: Sharp solid orange lightning bolt with horizontal speed lines
export const SprintingIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* 3 Horizontal Tapered Speed Lines */}
      <path
        d="M13 24.5L34 24.5C34.8 24.5 35.2 25.5 34.5 26L31 28.5L15 28.5C13.8 28.5 13 27.5 13 26.5L13 24.5Z"
        fill={orangeFill}
      />
      <path
        d="M5 33L31 33C31.8 33 32.3 34 31.5 34.5L27.5 37.5L7.5 37.5C6.2 37.5 5 36.3 5 35L5 33Z"
        fill={orangeFill}
      />
      <path
        d="M11 41.5L29 41.5C29.8 41.5 30.2 42.5 29.5 43L26.5 45.5L13 45.5C11.8 45.5 11 44.5 11 43.5L11 41.5Z"
        fill={orangeFill}
      />

      {/* Dynamic Sharp Solid Lightning Bolt */}
      <path
        d="M48 7.5L31 31.5H45L29 56.5L37.5 36H24.5L48 7.5Z"
        fill={orangeFill}
      />
    </svg>
  );
};

// 6. Hiking: Majestic mountain peaks with winding orange trail and summit sun
export const HikingIcon: React.FC<LucideProps> = ({ size = 24, className = '', ...props }) => {
  const isWhite = className?.includes('text-white');
  const primaryFill = isWhite ? '#FFFFFF' : 'var(--text-primary)';
  const orangeFill = isWhite ? '#FFFFFF' : 'var(--accent-orange)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Orange Alpine Sun in Upper Right Sky */}
      <circle cx="47" cy="17" r="7.5" fill={orangeFill} />

      {/* Left Peak */}
      <path
        d="M7 50L24 30L34 42L28 47L7 50Z"
        fill={primaryFill}
      />

      {/* Main Right High Peak */}
      <path
        d="M24 30L41 19L57 49L46 45L34 42L24 30Z"
        fill={primaryFill}
      />

      {/* Chiseled Facet Shadows for 3D Mountain Realism */}
      <path
        d="M41 19L34 42L44 44L57 49L41 19Z"
        fill={primaryFill}
        opacity={isWhite ? 1 : 0.82}
      />

      {/* Winding Alpine Trail leading down toward viewer */}
      <path
        d="M34.5 41C34 41 25 44 26.5 46.5C28 49 39 48 38 52.5C37.5 54 34 54.5 31 54.5L31 56C36 56 43 54.5 42 50C41 45.5 30 46.5 30 44.5C30 43 36 42 37 41L34.5 41Z"
        fill={orangeFill}
      />
    </svg>
  );
};

// Export backward-compatibility aliases
export const RunnerIcon = RunningIcon;
export const WalkerIcon = WalkingIcon;
export const Cycling = CyclingIcon;
export const Bike = CyclingIcon;
export const Biking = BikingIcon;
export const CommuterBikeIcon = BikingIcon;
export const SprintIcon = SprintingIcon;
export const Mountain = HikingIcon;

export const ACTIVITY_MODES: Record<ActivityType, ActivityModeInfo> = {
  Running: {
    type: 'Running',
    label: 'Running',
    iconName: 'RunningIcon',
    primaryMetric: 'pace',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 65,
    description: 'Outdoor street, path, or road running',
    accentColor: '#FF6B24'
  },
  Walking: {
    type: 'Walking',
    label: 'Walking',
    iconName: 'WalkingIcon',
    primaryMetric: 'pace',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 45,
    description: 'Brisk walk or daily steps',
    accentColor: '#FF6B24'
  },
  Cycling: {
    type: 'Cycling',
    label: 'Cycling',
    iconName: 'CyclingIcon',
    primaryMetric: 'speed',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 35,
    description: 'Road or gravel cycling',
    accentColor: '#FF6B24'
  },
  Biking: {
    type: 'Biking',
    label: 'Biking',
    iconName: 'BikingIcon',
    primaryMetric: 'speed',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 35,
    description: 'Urban or commuter biking',
    accentColor: '#FF6B24'
  },
  Sprinting: {
    type: 'Sprinting',
    label: 'Sprinting',
    iconName: 'SprintingIcon',
    primaryMetric: 'pace',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 85,
    description: 'High intensity bursts',
    accentColor: '#FF6B24'
  },
  Hiking: {
    type: 'Hiking',
    label: 'Hiking',
    iconName: 'HikingIcon',
    primaryMetric: 'pace',
    paceUnit: '/km',
    speedUnit: 'km/h',
    calorieFactorPerKm: 60,
    description: 'Nature trails and mountain paths',
    accentColor: '#FF6B24'
  }
};

export const getActivityIcon = (type: ActivityType | string): React.ComponentType<LucideProps> => {
  switch (type) {
    case 'Running':
      return RunningIcon;
    case 'Walking':
      return WalkingIcon;
    case 'Cycling':
      return CyclingIcon;
    case 'Biking':
      return BikingIcon;
    case 'Sprinting':
      return SprintingIcon;
    case 'Hiking':
      return HikingIcon;
    default:
      return RunningIcon;
  }
};
