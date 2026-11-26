import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Route,
  BarChart2,
  LayoutGrid,
  PackageX,
  CheckSquare,
  Star,
  History
} from 'lucide-react';
import {
  MAP_BASE_STYLES,
  MapBaseStyle,
  PerformanceLayerId,
  QuickFilterId
} from '../../data/data';

interface DesktopLeftRailProps {
  mapBaseStyle: MapBaseStyle;
  onSelectBaseStyle: (style: MapBaseStyle) => void;
  showJourneyPlan: boolean;
  onToggleJourneyPlan: () => void;
  activeLayer: PerformanceLayerId;
  onSelectLayer: (layer: PerformanceLayerId) => void;
  activeQuickFilters: QuickFilterId[];
  onToggleQuickFilter: (filter: QuickFilterId) => void;
}

const LAYER_ITEMS: Array<{
  id: PerformanceLayerId;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}> = [
  { id: 'sos_performance', label: 'SOS Performance', icon: BarChart2 },
  { id: 'planogram_compliance', label: 'Planogram Compliance', icon: LayoutGrid },
  { id: 'out_of_stock', label: 'Out of Stock', icon: PackageX },
  { id: 'visit_status', label: 'Visit Status', icon: CheckSquare },
  { id: 'priority_outlets', label: 'Priority Outlets', icon: Star },
  { id: 'last_visit', label: 'Last Visit', icon: History }
];

const QUICK_FILTER_BUTTONS: Array<{
  id: QuickFilterId;
  label: string;
  activeClass: string;
  idleClass: string;
}> = [
  {
    id: 'planned',
    label: 'Planned',
    activeClass: 'bg-[#1D8EFF] text-white border-sky-300/70 shadow-[0_4px_12px_rgba(29,142,255,0.45)]',
    idleClass: 'bg-[#1D8EFF]/20 text-sky-200 border-sky-400/35 hover:bg-[#1D8EFF]/35'
  },
  {
    id: 'completed',
    label: 'Completed',
    activeClass: 'bg-[#16A34A] text-white border-emerald-300/70 shadow-[0_4px_12px_rgba(34,197,94,0.4)]',
    idleClass: 'bg-[#16A34A]/20 text-emerald-200 border-emerald-400/35 hover:bg-[#16A34A]/35'
  },
  {
    id: 'attention',
    label: 'Attention',
    activeClass: 'bg-[#D97706] text-white border-amber-300/70 shadow-[0_4px_12px_rgba(245,158,11,0.4)]',
    idleClass: 'bg-[#D97706]/20 text-amber-200 border-amber-400/35 hover:bg-[#D97706]/35'
  },
  {
    id: 'critical',
    label: 'Critical',
    activeClass: 'bg-[#DC2626] text-white border-red-300/70 shadow-[0_4px_12px_rgba(239,68,68,0.4)]',
    idleClass: 'bg-[#DC2626]/20 text-red-200 border-red-400/35 hover:bg-[#DC2626]/35'
  }
];

const LEGEND_ITEMS: Array<{
  color: string;
  label: string;
  symbol: 'store' | 'check' | 'alert';
}> = [
  { color: '#1D8EFF', label: 'Planned Visit', symbol: 'store' },
  { color: '#64748B', label: 'Unplanned', symbol: 'store' },
  { color: '#22C55E', label: 'Completed', symbol: 'check' },
  { color: '#F59E0B', label: 'Needs Attention', symbol: 'alert' },
  { color: '#EF4444', label: 'Critical', symbol: 'alert' }
];

export const DesktopLeftRail: React.FC<DesktopLeftRailProps> = ({
  mapBaseStyle,
  onSelectBaseStyle,
  showJourneyPlan,
  onToggleJourneyPlan,
  activeLayer,
  onSelectLayer,
  activeQuickFilters,
  onToggleQuickFilter
}) => {
  const [layersExpanded, setLayersExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);
  const [legendExpanded, setLegendExpanded] = useState(false);

  return (
    <aside
      aria-label="Map Layers, Quick Filters and Legend"
      className="hidden md:flex flex-col gap-2 w-[208px] lg:w-[228px] max-h-[calc(100%-70px)] overflow-y-auto no-scrollbar pointer-events-auto"
    >
      {/* 1. MAP LAYERS */}
      <section className="marviz-glass-strong rounded-2xl overflow-hidden text-white shrink-0">
        <button
          type="button"
          onClick={() => setLayersExpanded((v) => !v)}
          aria-expanded={layersExpanded}
          className="w-full px-3 py-2 flex items-center justify-between border-b border-slate-700/60 hover:bg-white/5 cursor-pointer"
        >
          <span className="font-heading text-[12px] font-bold uppercase tracking-wider text-slate-100">
            MAP LAYERS
          </span>
          {layersExpanded ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>

        {layersExpanded && (
          <div className="p-2 space-y-1">
            {/* Base Map Layout Selector: Satellite / Tactical Terrain / Dark Grid */}
            <div className="px-1 pb-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Map Mode
              </div>
              <div
                role="radiogroup"
                aria-label="Map base style"
                className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-700/60"
              >
                {MAP_BASE_STYLES.map((style) => {
                  const selected = mapBaseStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onSelectBaseStyle(style.id)}
                      title={style.description}
                      className={`min-h-[28px] px-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                        selected
                          ? 'bg-[#0066FF] text-white shadow-sm'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {style.shortLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Independent Journey Plan Route Overlay */}
            <button
              type="button"
              role="switch"
              aria-checked={showJourneyPlan}
              onClick={onToggleJourneyPlan}
              className="w-full px-2 py-1.5 rounded-xl hover:bg-white/5 flex items-center justify-between gap-2 cursor-pointer transition-colors"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Route
                  size={13}
                  className={showJourneyPlan ? 'text-sky-400 shrink-0' : 'text-slate-400 shrink-0'}
                />
                <span className="text-[11px] font-medium text-slate-200 truncate">
                  Journey Plan
                </span>
              </span>
              <span
                className={`w-8 h-[18px] rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                  showJourneyPlan ? 'bg-[#0066FF]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                    showJourneyPlan ? 'translate-x-3.5' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>

            <div className="h-px bg-slate-700/50 mx-1 my-1" />

            {/* Single-Active Performance Layer Switches */}
            {LAYER_ITEMS.map((item) => {
              const Icon = item.icon;
              const isOn = activeLayer === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={isOn}
                  onClick={() => onSelectLayer(item.id)}
                  className="w-full px-2 py-1.5 rounded-xl hover:bg-white/5 flex items-center justify-between gap-2 cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Icon
                      size={13}
                      className={isOn ? 'text-sky-400 shrink-0' : 'text-slate-400 shrink-0'}
                    />
                    <span
                      className={`text-[11px] truncate ${
                        isOn ? 'font-semibold text-white' : 'font-medium text-slate-300'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                  <span
                    className={`w-8 h-[18px] rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                      isOn ? 'bg-[#0066FF]' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${
                        isOn ? 'translate-x-3.5' : 'translate-x-0'
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 2. QUICK FILTERS */}
      <section className="marviz-glass-strong rounded-2xl overflow-hidden text-white shrink-0">
        <button
          type="button"
          onClick={() => setFiltersExpanded((v) => !v)}
          aria-expanded={filtersExpanded}
          className="w-full px-3 py-2 flex items-center justify-between border-b border-slate-700/60 hover:bg-white/5 cursor-pointer"
        >
          <span className="font-heading text-[12px] font-bold uppercase tracking-wider text-slate-100">
            QUICK FILTERS
          </span>
          {filtersExpanded ? (
            <ChevronUp size={14} className="text-slate-400" />
          ) : (
            <ChevronDown size={14} className="text-slate-400" />
          )}
        </button>

        {filtersExpanded && (
          <div className="p-2.5 grid grid-cols-2 gap-1.5">
            {QUICK_FILTER_BUTTONS.map((btn) => {
              const isSelected = activeQuickFilters.includes(btn.id);
              const anyFilterActive = activeQuickFilters.length > 0;
              return (
                <button
                  key={btn.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onToggleQuickFilter(btn.id)}
                  className={`min-h-[30px] px-2 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer active:scale-95 ${
                    isSelected || !anyFilterActive ? btn.activeClass : btn.idleClass
                  } ${anyFilterActive && !isSelected ? 'opacity-55' : 'opacity-100'}`}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. OUTLET LEGEND (Collapsible, closed by default) */}
      <section className="marviz-glass-strong rounded-2xl overflow-hidden text-white shrink-0">
        <button
          type="button"
          onClick={() => setLegendExpanded((v) => !v)}
          aria-expanded={legendExpanded}
          className={`w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/5 cursor-pointer ${
            legendExpanded ? 'border-b border-slate-700/60' : ''
          }`}
        >
          <span className="font-heading text-[11px] font-bold uppercase tracking-wider text-slate-200">
            OUTLET LEGEND
          </span>
          {legendExpanded ? (
            <ChevronUp size={13} className="text-slate-400" />
          ) : (
            <ChevronDown size={13} className="text-slate-400" />
          )}
        </button>

        {legendExpanded && (
          <div className="px-2.5 py-2 space-y-1">
            {LEGEND_ITEMS.map((entry) => (
              <div key={entry.label} className="flex items-center gap-1.5">
                <span
                  className="w-3.5 h-4 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <svg width="11" height="14" viewBox="0 0 30 36" fill="none">
                    <path
                      d="M15 1C7.82 1 2 6.82 2 14C2 23.25 15 35 15 35C15 35 28 23.25 28 14C28 6.82 22.18 1 15 1Z"
                      fill={entry.color}
                    />
                    {entry.symbol === 'alert' ? (
                      <text
                        x="15"
                        y="19"
                        textAnchor="middle"
                        fill="#FFFFFF"
                        fontSize="16"
                        fontWeight="900"
                      >
                        !
                      </text>
                    ) : entry.symbol === 'check' ? (
                      <polyline
                        points="9,14 13,18 21,10"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="3.2"
                        strokeLinecap="round"
                      />
                    ) : (
                      <circle cx="15" cy="13" r="4.5" fill="#FFFFFF" opacity="0.9" />
                    )}
                  </svg>
                </span>
                <span className="text-[10.5px] text-slate-200 font-medium leading-none">
                  {entry.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
};
