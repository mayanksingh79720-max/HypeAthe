import React from 'react';

export interface HypeAtheLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const HypeAtheLogo: React.FC<HypeAtheLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-7 h-7 rounded-lg',
    md: 'w-8 h-8 rounded-xl',
    lg: 'w-10 h-10 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Official HypeAthe Athletic Shoe App Icon */}
      <div
        className={`${iconSizes[size]} overflow-hidden shrink-0 shadow-sm flex items-center justify-center transition-transform hover:scale-105 active:scale-95`}
      >
        <img
          src="/assets/aistudio/file_00000000183c82119f91889e69b58708_94ecc156.png"
          alt="HypeAthe App Icon"
          className="w-full h-full object-cover"
          loading="eager"
        />
      </div>

      {showText && (
        <span
          className={`font-black tracking-tight ${textSizes[size]} text-[var(--text-primary)] leading-none inline-flex items-center`}
        >
          Hype<span className="text-[var(--accent-orange)]">Athe</span>
        </span>
      )}
    </div>
  );
};

// Backward-compatible alias for existing imports
export const HypeRunLogo = HypeAtheLogo;
