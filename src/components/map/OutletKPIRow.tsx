import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { MapOutlet } from '../../data/data';

interface OutletKPIRowProps {
  outlet: MapOutlet;
}

export const OutletKPIRow: React.FC<OutletKPIRowProps> = ({ outlet }) => {
  const sosDelta = Number((outlet.sosScore - outlet.previousSosScore).toFixed(1));
  const sosTone =
    outlet.sosScore < 3.4
      ? 'border-red-500/40 bg-red-950/35 text-red-300'
      : outlet.sosScore < 3.8
      ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
      : 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300';

  const planDelta = outlet.planogramPercentage - outlet.previousPlanogramPercentage;
  const planTone =
    outlet.planogramPercentage < 70
      ? 'border-red-500/40 bg-red-950/35 text-red-300'
      : outlet.planogramPercentage < 82
      ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
      : 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300';

  const oosTone =
    outlet.oosSkuCount >= 4
      ? 'border-red-500/40 bg-red-950/35 text-red-300'
      : outlet.oosSkuCount >= 1
      ? 'border-amber-500/40 bg-amber-950/30 text-amber-300'
      : 'border-emerald-500/35 bg-emerald-950/25 text-emerald-300';

  return (
    <div className="grid grid-cols-3 gap-2">
      {/* Tile 1: SOS */}
      <div className={`rounded-xl border px-2.5 py-2 ${sosTone}`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            SOS
          </span>
          {sosDelta > 0 ? (
            <TrendingUp size={12} className="text-emerald-400 shrink-0" />
          ) : sosDelta < 0 ? (
            <TrendingDown size={12} className="text-red-400 shrink-0" />
          ) : (
            <Minus size={12} className="text-slate-400 shrink-0" />
          )}
        </div>
        <div className="font-heading text-[20px] font-bold leading-tight text-white tabular-nums mt-0.5">
          {outlet.sosScore.toFixed(1)}
          <span className="text-[12px] font-semibold text-slate-400"> / 5</span>
        </div>
      </div>

      {/* Tile 2: PLANOGRAM */}
      <div className={`rounded-xl border px-2.5 py-2 ${planTone}`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 truncate">
            PLANOGRAM
          </span>
          {planDelta > 0 ? (
            <TrendingUp size={12} className="text-emerald-400 shrink-0" />
          ) : planDelta < 0 ? (
            <TrendingDown size={12} className="text-red-400 shrink-0" />
          ) : (
            <Minus size={12} className="text-slate-400 shrink-0" />
          )}
        </div>
        <div className="font-heading text-[20px] font-bold leading-tight text-white tabular-nums mt-0.5">
          {outlet.planogramPercentage}%
        </div>
      </div>

      {/* Tile 3: OOS */}
      <div className={`rounded-xl border px-2.5 py-2 ${oosTone}`}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
            OOS
          </span>
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${
              outlet.oosSkuCount >= 4
                ? 'bg-red-400'
                : outlet.oosSkuCount >= 1
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
        </div>
        <div className="font-heading text-[20px] font-bold leading-tight text-white tabular-nums mt-0.5">
          {outlet.oosSkuCount}{' '}
          <span className="text-[12px] font-semibold text-slate-300">
            {outlet.oosSkuCount === 1 ? 'SKU' : 'SKUs'}
          </span>
        </div>
      </div>
    </div>
  );
};
