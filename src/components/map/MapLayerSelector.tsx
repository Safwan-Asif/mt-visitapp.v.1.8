import React from 'react';
import { Layers, Route, X, Check } from 'lucide-react';
import {
  MAP_BASE_STYLES,
  MapBaseStyle,
  PerformanceLayerId
} from '../../data/data';

interface MapLayerSelectorProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  mapBaseStyle: MapBaseStyle;
  onSelectBaseStyle: (style: MapBaseStyle) => void;
  showJourneyPlan: boolean;
  onToggleJourneyPlan: () => void;
  activeLayer: PerformanceLayerId;
  onSelectLayer: (layer: PerformanceLayerId) => void;
  bottomOffsetClass?: string;
  hidePinLayers?: boolean;
  hideTrigger?: boolean;
  containerClassName?: string;
}

const PERFORMANCE_LAYERS: Array<{
  id: PerformanceLayerId;
  label: string;
  hint: string;
}> = [
  { id: 'visit_status', label: 'Visit Status', hint: 'Planned · Done · Unscheduled' },
  { id: 'sos_performance', label: 'SOS Performance', hint: 'Share of Shelf (0–5)' },
  { id: 'planogram_compliance', label: 'Planogram Compliance', hint: 'Compliance %' },
  { id: 'out_of_stock', label: 'Out of Stock', hint: 'OOS SKU count' },
  { id: 'priority_outlets', label: 'Priority Outlets', hint: 'Health severity focus' },
  { id: 'last_visit', label: 'Last Visit', hint: 'Days since last audit' }
];

export const MapLayerSelector: React.FC<MapLayerSelectorProps> = ({
  isOpen,
  onToggleOpen,
  mapBaseStyle,
  onSelectBaseStyle,
  showJourneyPlan,
  onToggleJourneyPlan,
  activeLayer,
  onSelectLayer,
  bottomOffsetClass = 'bottom-[calc(76px+env(safe-area-inset-bottom,0px))] md:bottom-5',
  hidePinLayers = false,
  hideTrigger = false,
  containerClassName
}) => {
  const activeMeta = PERFORMANCE_LAYERS.find((l) => l.id === activeLayer);
  const activeStyleMeta = MAP_BASE_STYLES.find((s) => s.id === mapBaseStyle);

  if (hideTrigger && !isOpen) {
    return null;
  }

  return (
    <div
      className={
        containerClassName ||
        `absolute left-3 z-[450] flex flex-col items-start gap-2 transition-all duration-200 ${bottomOffsetClass}`
      }
    >
      {/* Collapsible Layer Control Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Map Layers"
          className="ov-panel-elevated rounded-2xl w-[248px] max-w-[calc(100vw-24px)] p-2.5 text-white animate-fade-in"
        >
          <div className="flex items-center justify-between px-1 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <Layers size={14} className="text-sky-400" />
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-slate-100">
                Map Layers
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleOpen}
              aria-label="Close layer selector"
              className="w-8 h-8 -mr-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Map Base Style Switcher */}
          <div className="pt-2 pb-2 border-b border-white/[0.08]">
            <div className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Map Layout
            </div>
            <div
              role="radiogroup"
              aria-label="Map base style"
              className="grid grid-cols-3 gap-1 ov-chart-well p-1 rounded-xl"
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
                    className={`min-h-[34px] px-1.5 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
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

          {/* Independent Journey Plan Route Overlay Toggle */}
          <div className="pt-2 pb-2 border-b border-white/[0.08]">
            <button
              type="button"
              role="switch"
              aria-checked={showJourneyPlan}
              onClick={onToggleJourneyPlan}
              className="w-full min-h-[44px] px-2.5 py-1.5 rounded-xl ov-glass-recessed hover:border-[#00C8FF]/45 flex items-center justify-between gap-2 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0 text-left">
                <Route
                  size={15}
                  className={showJourneyPlan ? 'text-sky-400 shrink-0' : 'text-slate-500 shrink-0'}
                />
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold text-white leading-tight">
                    Journey Plan
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight truncate">
                    Illustrative sequence line
                  </div>
                </div>
              </div>
              <span
                className={`w-9 h-5 rounded-full p-0.5 transition-colors flex items-center shrink-0 ${
                  showJourneyPlan ? 'bg-[#0066FF]' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    showJourneyPlan ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Single-Active Performance Colouring Layer */}
          {!hidePinLayers && (
            <div className="pt-2 space-y-0.5" role="radiogroup" aria-label="Pin Color Layer">
              <div className="px-1 pb-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pin Colour Layer (Single)
              </div>
              {PERFORMANCE_LAYERS.map((layer) => {
                const selected = activeLayer === layer.id;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onSelectLayer(layer.id)}
                    className={`w-full min-h-[38px] px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#0066FF]/22 border border-sky-400/50 text-white'
                        : 'border border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold leading-tight truncate">
                        {layer.label}
                      </div>
                      <div className="text-[9px] text-slate-400 leading-tight truncate">
                        {layer.hint}
                      </div>
                    </div>
                    {selected && (
                      <span className="w-4 h-4 rounded-full bg-[#0066FF] flex items-center justify-center shrink-0">
                        <Check size={10} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Floating Layers Trigger Button */}
      {!hideTrigger && (
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          aria-label="Toggle map layers"
          className={`min-h-[44px] px-3.5 rounded-2xl ov-panel flex items-center gap-2 text-white transition-all cursor-pointer active:scale-95 ${
            isOpen
              ? 'border-[#00C8FF]/70 bg-[#0066FF]/25'
              : 'hover:border-[#00C8FF]/50'
          }`}
        >
          <Layers size={16} className="text-sky-400 shrink-0" />
          <div className="text-left">
            <div className="text-[11px] font-bold leading-none">Layers</div>
            <div className="text-[9px] text-sky-300/90 leading-tight mt-0.5 max-w-[92px] truncate">
              {hidePinLayers
                ? activeStyleMeta?.shortLabel || 'Satellite'
                : activeMeta?.label || 'Visit Status'}
            </div>
          </div>
        </button>
      )}
    </div>
  );
};
