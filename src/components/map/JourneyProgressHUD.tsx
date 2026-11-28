import React from 'react';
import { JourneyMetrics } from '../../data/data';

interface JourneyProgressHUDProps {
  metrics: JourneyMetrics;
}

export const JourneyProgressHUD: React.FC<JourneyProgressHUDProps> = ({ metrics }) => {
  const formattedProgress = Number.isInteger(metrics.progressPercent)
    ? `${metrics.progressPercent}%`
    : `${metrics.progressPercent.toFixed(1)}%`;

  return (
    <section
      aria-label="Daily Journey Progress"
      className="ov-panel rounded-2xl px-3 py-2 text-white"
    >
      <div className="grid grid-cols-4 divide-x divide-white/10 items-center text-center">
        <div className="px-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
            Planned
          </div>
          <div className="font-heading text-[18px] font-bold text-sky-400 ov-tabular leading-tight mt-0.5">
            {metrics.plannedToday}
          </div>
        </div>

        <div className="px-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
            Completed
          </div>
          <div className="font-heading text-[18px] font-bold text-emerald-400 ov-tabular leading-tight mt-0.5">
            {metrics.completedToday}
          </div>
        </div>

        <div className="px-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
            Pending
          </div>
          <div className="font-heading text-[18px] font-bold text-amber-400 ov-tabular leading-tight mt-0.5">
            {metrics.pendingToday}
          </div>
        </div>

        <div className="px-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold leading-none">
            Progress
          </div>
          <div className="font-heading text-[18px] font-bold text-white ov-tabular leading-tight mt-0.5">
            {formattedProgress}
          </div>
        </div>
      </div>

      {/* Slim Tactical Progress Track */}
      <div className="mt-1.5 h-1.5 w-full rounded-full ov-chart-well overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#0066FF] via-[#00C8FF] to-[#22C55E] transition-all duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, metrics.progressPercent))}%` }}
        />
      </div>
    </section>
  );
};
