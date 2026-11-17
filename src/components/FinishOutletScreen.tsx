import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Star } from 'lucide-react';
import { Outlet } from '../types';
import { CONFIDENCE_OPTIONS } from '../config/masters';
import { useTheme } from '../ThemeContext';

interface FinishOutletScreenProps {
  outlet: Outlet;
  visitId: string;
  onFinishOutlet: (confidence: string) => void;
}

export const FinishOutletScreen: React.FC<FinishOutletScreenProps> = ({
  outlet,
  visitId,
  onFinishOutlet
}) => {
  const { isDark } = useTheme();
  const [selectedConfidence, setSelectedConfidence] = useState<string>('High');

  const handleSubmit = () => {
    try {
      localStorage.setItem(`mta_confidence_${visitId}_${outlet.id}`, selectedConfidence);
    } catch {}
    onFinishOutlet(selectedConfidence);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 md:p-8 max-w-lg mx-auto w-full h-full overflow-y-auto select-none animate-fade-in">
      {/* Top Header */}
      <div className="space-y-1.5 pt-2 text-center shrink-0">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)]">
          All 3 Categories Completed
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-[var(--text-primary)]">
          Finish {outlet.name}
        </h1>
        <p className="text-xs text-[var(--text-secondary)] tabular-nums">
          {outlet.branch} &middot; Route Sequence {outlet.sequence}
        </p>
      </div>

      {/* Center Confidence Card */}
      <div className="my-auto py-6">
        <div className="glass-panel-strong rounded-3xl p-6 space-y-5 text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg mx-auto ${
              isDark
                ? 'bg-[#10B981] text-[#05231C]'
                : 'bg-[#084C41] text-white'
            }`}
          >
            <CheckCircle2 size={28} strokeWidth={2.2} />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
              How confident are you in today&apos;s data?
            </h2>
            <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
              Audit accuracy indicator attached to this market visit report
            </p>
          </div>

          <div className="space-y-2.5 pt-1">
            {CONFIDENCE_OPTIONS.map((option) => {
              const isSelected = selectedConfidence === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setSelectedConfidence(option)}
                  className={`w-full min-h-[54px] py-3.5 px-5 rounded-2xl text-sm font-bold transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${
                    isSelected
                      ? isDark
                        ? 'bg-[#10B981] text-[#05231C] shadow-lg'
                        : 'bg-[#084C41] text-white shadow-lg shadow-[#084C41]/25'
                      : 'glass-subtle text-[var(--text-primary)] hover:bg-white/80 dark:hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Star
                      size={16}
                      className={
                        isSelected
                          ? 'text-amber-300 fill-amber-300'
                          : 'text-[var(--text-muted)]'
                      }
                    />
                    <span>{option} Confidence</span>
                  </div>
                  {isSelected && <ShieldCheck size={18} strokeWidth={2.2} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Sticky Action */}
      <div className="pt-2 pb-2 shrink-0">
        <button
          type="button"
          onClick={handleSubmit}
          className={`w-full min-h-[54px] py-3.5 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] ${
            isDark
              ? 'bg-[#10B981] text-[#05231C]'
              : 'bg-[#084C41] text-white shadow-[#084C41]/25'
          }`}
        >
          <span>Market done! Next market</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
