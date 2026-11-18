import React from 'react';
import { Flag, Car } from 'lucide-react';
import { HealthBreakdown, MapOutlet, NextStopEstimate } from '../../data/data';

interface DesktopBottomBarProps {
  nextStop: NextStopEstimate | null;
  healthBreakdown: HealthBreakdown;
  onSelectOutlet: (outlet: MapOutlet) => void;
}

export const DesktopBottomBar: React.FC<DesktopBottomBarProps> = ({
  nextStop,
  healthBreakdown,
  onSelectOutlet
}) => {
  const healthyPct =
    healthBreakdown.total > 0 ? (healthBreakdown.healthy / healthBreakdown.total) * 100 : 0;
  const attentionPct =
    healthBreakdown.total > 0 ? (healthBreakdown.attention / healthBreakdown.total) * 100 : 0;
  const criticalPct =
    healthBreakdown.total > 0 ? (healthBreakdown.critical / healthBreakdown.total) * 100 : 0;

  return (
    <div className="hidden md:flex items-end gap-3 pointer-events-none">
      {/* Next Stop & Demo Estimate ETA */}
      {nextStop && (
        <button
          type="button"
          onClick={() => onSelectOutlet(nextStop.outlet)}
          title="Demo travel estimate — tap to focus next scheduled stop"
          className="marviz-glass-strong rounded-2xl px-3.5 py-2 flex items-center gap-3 text-white pointer-events-auto cursor-pointer hover:border-sky-400/55 transition-colors text-left"
        >
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/70">
            <Flag size={16} className="text-slate-200 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 leading-none">Next Stop</div>
              <div className="text-[12px] font-bold text-white leading-tight mt-0.5 max-w-[165px] truncate">
                {nextStop.outlet.name}
              </div>
            </div>
            <span className="font-heading text-[15px] font-bold text-sky-400 tabular-nums ml-1">
              {nextStop.distanceKm} km
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Car size={16} className="text-slate-200 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400 leading-none">
                ETA <span className="text-[9px] text-sky-300/80">(Demo Est.)</span>
              </div>
              <div className="font-heading text-[15px] font-bold text-white tabular-nums leading-tight mt-0.5">
                {nextStop.etaMinutes} min
              </div>
            </div>
          </div>
        </button>
      )}

      {/* Outlet Priority Overview Segmented Progress Bar */}
      <div className="marviz-glass-strong rounded-2xl px-3.5 py-2 w-[290px] lg:w-[320px] text-white pointer-events-auto">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-1.5">
          <span className="text-slate-200">OUTLET PRIORITY OVERVIEW</span>
          <span className="text-slate-400 tabular-nums">{healthBreakdown.total} OUTLETS</span>
        </div>
        <div className="h-2.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-slate-800 border border-slate-700/60">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${healthyPct}%` }}
            title={`${healthBreakdown.healthy} Healthy`}
          />
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${attentionPct}%` }}
            title={`${healthBreakdown.attention} Needs Attention`}
          />
          <div
            className="h-full bg-red-500 transition-all duration-300"
            style={{ width: `${criticalPct}%` }}
            title={`${healthBreakdown.critical} Critical`}
          />
        </div>
      </div>
    </div>
  );
};
