import React from 'react';
import { X, ChevronRight, Activity as ActivityIcon } from 'lucide-react';
import { ActivityType } from '../types';
import { ACTIVITY_MODES, getActivityIcon } from '../utils/activityModes';

interface ActivitySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: ActivityType) => void;
  currentMode: ActivityType;
}

export const ActivitySelectorModal: React.FC<ActivitySelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  currentMode
}) => {
  if (!isOpen) return null;

  const modes: ActivityType[] = ['Running', 'Walking', 'Cycling', 'Biking', 'Sprinting', 'Hiking'];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[var(--bg-secondary)] rounded-t-3xl sm:rounded-3xl p-6 border border-[var(--text-secondary)]/15 max-h-[88vh] overflow-y-auto shadow-2xl select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header matching Reference Image */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--text-secondary)]/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--accent-orange)]/15 flex items-center justify-center text-[var(--accent-orange)] shrink-0">
              <ActivityIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] leading-tight">
                Select Activity Mode
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)] font-medium">
                Choose your activity to continue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center cursor-pointer transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 6 Modes List matching Reference Image */}
        <div className="space-y-2.5 mb-5">
          {modes.map((mode) => {
            const info = ACTIVITY_MODES[mode];
            const Icon = getActivityIcon(mode);
            const isSelected = currentMode === mode;

            return (
              <button
                key={mode}
                onClick={() => {
                  onSelectMode(mode);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--accent-orange)]/5 border-[var(--accent-orange)] shadow-xs'
                    : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface)]/80 border-[var(--text-secondary)]/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'text-[var(--accent-orange)]'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-[var(--text-primary)] block leading-tight">
                      {info.label}
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)] font-medium mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--accent-orange)]' : 'text-[var(--text-secondary)]'}`} />
              </button>
            );
          })}
        </div>

        {/* Cancel Button matching Reference Image */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--text-secondary)]/20 text-[var(--text-primary)] font-bold text-xs hover:bg-[var(--bg-surface)] cursor-pointer transition-colors shadow-xs"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
