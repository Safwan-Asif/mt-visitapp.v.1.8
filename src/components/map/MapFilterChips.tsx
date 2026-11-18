import React from 'react';
import { MapFilterChipId } from '../../data/data';

interface MapFilterChipsProps {
  activeFilter: MapFilterChipId;
  onChangeFilter: (filter: MapFilterChipId) => void;
  counts: Record<MapFilterChipId, number>;
}

const FILTER_OPTIONS: Array<{
  id: MapFilterChipId;
  label: string;
  dotColor?: string;
}> = [
  { id: 'all', label: 'All' },
  { id: 'planned', label: 'Planned', dotColor: '#1D8EFF' },
  { id: 'completed', label: 'Completed', dotColor: '#22C55E' },
  { id: 'issues', label: 'Issues', dotColor: '#EF4444' }
];

export const MapFilterChips: React.FC<MapFilterChipsProps> = ({
  activeFilter,
  onChangeFilter,
  counts
}) => {
  return (
    <div
      role="tablist"
      aria-label="Filter map outlets"
      className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5"
    >
      {FILTER_OPTIONS.map((opt) => {
        const isActive = activeFilter === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChangeFilter(opt.id)}
            className={`min-h-[38px] px-3 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer active:scale-95 border backdrop-blur-md ${
              isActive
                ? 'bg-[#1685FF] text-white border-sky-300/60 shadow-[0_4px_14px_rgba(22,133,255,0.45)]'
                : 'bg-[rgba(10,20,36,0.78)] text-slate-300 border-slate-700/70 hover:text-white hover:border-sky-400/40'
            }`}
          >
            {opt.dotColor && (
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive ? '#FFFFFF' : opt.dotColor
                }}
              />
            )}
            <span>{opt.label}</span>
            <span
              className={`text-[10px] tabular-nums px-1 rounded ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-800/80 text-slate-400'
              }`}
            >
              {counts[opt.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
