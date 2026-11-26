import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, ShieldCheck, ArrowRight } from 'lucide-react';
import { Outlet } from '../types';
import { CATEGORIES } from '../constants';
import { CONFIDENCE_OPTIONS } from '../config/masters';
import { AnimatedCompletionCircle } from './pjp/PjpPrimitives';

interface FinishOutletScreenProps {
  outlet: Outlet;
  visitId: string;
  isLastPendingOutlet?: boolean;
  onFinishOutlet: (confidence: string) => void;
}

export const FinishOutletScreen: React.FC<FinishOutletScreenProps> = ({
  outlet,
  visitId,
  isLastPendingOutlet = false,
  onFinishOutlet
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedConfidence, setSelectedConfidence] = useState<string>('High');

  const handleSubmit = () => {
    try {
      localStorage.setItem(`mta_confidence_${visitId}_${outlet.id}`, selectedConfidence);
    } catch {}
    onFinishOutlet(selectedConfidence);
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full overflow-y-auto select-none pjp-atmospheric-canvas relative">
      {/* Subtle Emerald Top Ambient Radiance */}
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#22C55E]/15 blur-3xl pointer-events-none" />

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.26 }}
        className="flex-1 flex flex-col justify-between p-5 md:p-8 max-w-md mx-auto w-full relative z-10"
      >
        <div className="my-auto py-4 space-y-6 text-center">
          {/* Glowing Emerald Checkmark Circle */}
          <AnimatedCompletionCircle size={112} />

          <div className="space-y-1.5">
            <h1 className="font-heading font-extrabold text-[34px] leading-none tracking-tight text-[var(--text-primary)]">
              Outlet Completed
            </h1>
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              {outlet.name}
              {outlet.branch ? ` · ${outlet.branch}` : ''}
            </p>
            <p className="text-xs font-extrabold text-[#22C55E] tabular-nums pt-0.5">
              3 / 3 Categories Audited
            </p>
          </div>

          {/* 3-Category Completed Summary Card */}
          <div className="glass-panel rounded-3xl divide-y divide-[var(--border-glass)] overflow-hidden text-left">
            {CATEGORIES.map((cat) => (
              <div
                key={cat}
                className="px-4 py-3 flex items-center justify-between gap-3 text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Check size={16} className="text-[#22C55E] shrink-0" strokeWidth={2.6} />
                  <span className="font-bold text-[var(--text-primary)]">{cat}</span>
                </div>
                <span className="w-6 h-6 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/45 text-[#22C55E] flex items-center justify-center">
                  <Check size={12} strokeWidth={2.8} />
                </span>
              </div>
            ))}
          </div>

          {/* Data Confidence Segmented Pill Selector (Preserved fo_confidence field) */}
          <div className="glass-panel rounded-2xl p-3.5 space-y-2.5 text-left">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#008DFF] dark:text-[#00C8FF]" />
                <span>Data Confidence</span>
              </span>
              <span className="text-[11px] font-bold text-[#008DFF] dark:text-[#00C8FF]">
                {selectedConfidence}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {CONFIDENCE_OPTIONS.map((option) => {
                const isSelected = selectedConfidence === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSelectedConfidence(option)}
                    className={`min-h-[42px] rounded-xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? 'btn-electric-blue text-white'
                        : 'glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Primary Pill CTA */}
        <div className="pt-2 pb-3 shrink-0">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full min-h-[54px] rounded-full btn-electric-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97]"
          >
            <span>{isLastPendingOutlet ? 'Finish Route' : 'Next Outlet'}</span>
            <ArrowRight size={17} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
