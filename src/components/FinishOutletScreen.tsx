import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, ArrowRight, Sparkles, Star } from 'lucide-react';
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
    <div className={`flex-1 flex flex-col justify-between p-4 max-w-md mx-auto w-full h-full overflow-hidden select-none relative ${
      isDark ? 'bg-[#0B120E] text-[#F0FDF4]' : 'bg-[#F8FAF9] text-[#061A12]'
    }`}>
      {/* Top Header Card */}
      <div className="space-y-3 shrink-0 pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
          <Sparkles size={13} />
          <span>All 3 Categories Completed</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
          Finish {outlet.name}
        </h1>
        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {outlet.branch} &bull; Route Sequence {outlet.sequence}
        </p>
      </div>

      {/* Center Question: Confidence Rating */}
      <div className="flex-1 flex flex-col justify-center items-center py-6 px-2 space-y-6 animate-fade-in text-center">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#047857] to-[#10B981] flex items-center justify-center text-white shadow-xl shadow-emerald-950/40 border border-emerald-400/30 mx-auto">
          <CheckCircle2 size={34} className="stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black tracking-tight">
            How confident are you in today's data?
          </h2>
          <p className={`text-xs max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit accuracy indicator attached to this market visit report
          </p>
        </div>

        {/* 3 Confidence Options (High / Medium / Low) */}
        <div className="w-full space-y-2.5 pt-1">
          {CONFIDENCE_OPTIONS.map((option) => {
            const isSelected = selectedConfidence === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedConfidence(option)}
                className={`w-full min-h-[56px] py-4 px-5 rounded-2xl text-sm font-black transition-all cursor-pointer flex items-center justify-between border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] text-white border-emerald-400 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-400/50'
                    : isDark
                    ? 'bg-[#132219]/80 border-emerald-900/50 text-[#F0FDF4] hover:border-emerald-500/60 active:scale-[0.99]'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-300 shadow-xs active:scale-[0.99]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star size={16} className={isSelected ? 'text-amber-300 fill-amber-300' : 'text-slate-400'} />
                  <span>{option} Confidence</span>
                </div>
                {isSelected && <ShieldCheck size={20} className="stroke-[2.5]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action: Market Done! Next market */}
      <div className="pt-2 shrink-0 space-y-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full min-h-[56px] py-4 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] hover:brightness-105 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-emerald-950/30 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Market done! Next market</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
