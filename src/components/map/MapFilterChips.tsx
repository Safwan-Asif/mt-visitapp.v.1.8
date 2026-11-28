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
  { id: 'planned', label: 'Today Plan', dotColor: '#1D8EFF' },
  { id: 'completed', label: 'Completed', dotColor: '#22C55E' },
  { id: 'issues', label: 'Issues', dotColor: '#EF4444' },
  { id: 'all', label: 'All' }
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
      className="grid grid-cols-4 gap-1.5 py-0.5"
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
            className={`min-h-[34px] px-1 rounded-xl text-[10px] sm:text-[10.5px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 border whitespace-nowrap ${
              isActive
                ? 'btn-electric-blue border-[#008DFF]/80 shadow-[0_4px_16px_rgba(0,102,255,0.48)]'
                : 'ov-panel text-[#A5B8D5] hover:text-[#F1F5FF] hover:border-[#00C8FF]/45'
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
            <span className="truncate">{opt.label}</span>
            {opt.id === 'all' && (
              <span
                className={`text-[9.5px] ov-tabular px-1 rounded shrink-0 ${
                  isActive ? 'bg-white/20 text-white' : 'ov-glass-recessed text-[#A5B8D5]'
                }`}
              >
                {counts[opt.id]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
