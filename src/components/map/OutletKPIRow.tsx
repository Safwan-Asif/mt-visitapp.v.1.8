import React from 'react';
import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { MapOutlet, SOS_TARGET_PCT } from '../../data/data';

interface OutletKPIRowProps {
  outlet: MapOutlet;
  compact?: boolean;
}

function getSosTone(pct: number): {
  boxClass: string;
  valueClass: string;
  badgeText: string;
} {
  if (pct > SOS_TARGET_PCT) {
    return {
      boxClass: 'border-emerald-500/40 bg-emerald-950/30',
      valueClass: 'text-emerald-300',
      badgeText: '>50%'
    };
  }
  if (pct >= 43) {
    return {
      boxClass: 'border-amber-500/45 bg-amber-950/30',
      valueClass: 'text-amber-300',
      badgeText: 'Target 50%'
    };
  }
  return {
    boxClass: 'border-red-500/45 bg-red-950/35',
    valueClass: 'text-red-300',
    badgeText: '<50%'
  };
}

export const OutletKPIRow: React.FC<OutletKPIRowProps> = ({ outlet, compact = false }) => {
  const planDelta = outlet.planogramPercentage - outlet.previousPlanogramPercentage;
  const planTone =
    outlet.planogramPercentage < 70
      ? 'border-red-500/45 bg-red-950/35'
      : outlet.planogramPercentage < 82
      ? 'border-amber-500/45 bg-amber-950/30'
      : 'border-emerald-500/40 bg-emerald-950/30';

  const oosTone =
    outlet.oosSkuCount >= 4
      ? 'border-red-500/45 bg-red-950/35'
      : outlet.oosSkuCount >= 1
      ? 'border-amber-500/45 bg-amber-950/30'
      : 'border-emerald-500/40 bg-emerald-950/30';

  const categories = [
    { label: 'Flour SOS', value: outlet.flourSosPct },
    { label: 'Edible Oil SOS', value: outlet.edibleOilSosPct },
    { label: 'Pasta SOS', value: outlet.pastaSosPct }
  ];

  const row1Pad = compact ? 'px-3 py-2' : 'px-3 py-2';
  const row2Pad = compact ? 'px-2 py-1.5' : 'px-2 py-2';

  return (
    <div className="space-y-2">
      {/* Row 1: 2 Cards — Planogram & OOS SKUs */}
      <div className="grid grid-cols-2 gap-2">
        <div className={`rounded-xl border ${row1Pad} ${planTone}`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              Planogram
            </span>
            {planDelta > 0 ? (
              <TrendingUp size={13} className="text-emerald-400 shrink-0" />
            ) : planDelta < 0 ? (
              <TrendingDown size={13} className="text-red-400 shrink-0" />
            ) : (
              <Minus size={13} className="text-slate-400 shrink-0" />
            )}
          </div>
          <div className="font-heading text-[21px] font-bold leading-tight text-white tabular-nums mt-0.5">
            {outlet.planogramPercentage}%
          </div>
        </div>

        <div className={`rounded-xl border ${row1Pad} ${oosTone}`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              OOS SKUs
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
          <div className="font-heading text-[21px] font-bold leading-tight text-white tabular-nums mt-0.5">
            {outlet.oosSkuCount}{' '}
            <span className="text-[12px] font-semibold text-slate-300">
              {outlet.oosSkuCount === 1 ? 'SKU' : 'SKUs'}
            </span>
          </div>
        </div>
      </div>

      {/* Row 2: 3 SOS Category Cards (Target > 50%) */}
      <div>
        <div className="flex items-center justify-between px-0.5 mb-1">
          <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400">
            Share of Shelf (SOS)
          </span>
          <span className="text-[9.5px] font-semibold text-sky-300/90 tabular-nums">
            Target &gt; {SOS_TARGET_PCT}%
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {categories.map((cat) => {
            const tone = getSosTone(cat.value);
            return (
              <div key={cat.label} className={`rounded-xl border ${row2Pad} ${tone.boxClass}`}>
                <div className="text-[9.5px] font-semibold text-slate-300 leading-tight truncate">
                  {cat.label}
                </div>
                <div className="flex items-baseline justify-between gap-1 mt-0.5">
                  <span
                    className={`font-heading text-[18px] font-bold leading-none tabular-nums ${tone.valueClass}`}
                  >
                    {cat.value}%
                  </span>
                  <span className="text-[8.5px] font-semibold text-slate-400 shrink-0">
                    {cat.value > SOS_TARGET_PCT ? 'OK' : 'LOW'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
