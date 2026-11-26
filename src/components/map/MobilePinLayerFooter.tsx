import React from 'react';
import { Palette } from 'lucide-react';
import { PerformanceLayerId } from '../../data/data';

interface MobilePinLayerFooterProps {
  activeLayer: PerformanceLayerId;
  onSelectLayer: (layer: PerformanceLayerId) => void;
}

const PIN_LAYER_ITEMS: Array<{
  id: PerformanceLayerId;
  label: string;
  legend: Array<{ color: string; text: string }>;
}> = [
  {
    id: 'visit_status',
    label: 'Visit Status',
    legend: [
      { color: '#1D8EFF', text: 'Planned' },
      { color: '#22C55E', text: 'Done' },
      { color: '#64748B', text: 'Unplanned' }
    ]
  },
  {
    id: 'sos_performance',
    label: 'SOS Performance',
    legend: [
      { color: '#22C55E', text: '≥3.8' },
      { color: '#F59E0B', text: '3.4–3.7' },
      { color: '#EF4444', text: '<3.4' }
    ]
  },
  {
    id: 'planogram_compliance',
    label: 'Planogram Compliance',
    legend: [
      { color: '#22C55E', text: '≥82%' },
      { color: '#F59E0B', text: '70–81%' },
      { color: '#EF4444', text: '<70%' }
    ]
  },
  {
    id: 'out_of_stock',
    label: 'Out of Stock',
    legend: [
      { color: '#22C55E', text: '0 OOS' },
      { color: '#F59E0B', text: '1–3' },
      { color: '#EF4444', text: '≥4' }
    ]
  },
  {
    id: 'priority_outlets',
    label: 'Priority Outlets',
    legend: [
      { color: '#1D8EFF', text: 'Today' },
      { color: '#F59E0B', text: 'Attention' },
      { color: '#EF4444', text: 'Critical' }
    ]
  },
  {
    id: 'last_visit',
    label: 'Last Visit',
    legend: [
      { color: '#22C55E', text: '0–3d' },
      { color: '#F59E0B', text: '4–7d' },
      { color: '#EF4444', text: '≥8d' }
    ]
  }
];

export const MobilePinLayerFooter: React.FC<MobilePinLayerFooterProps> = ({
  activeLayer,
  onSelectLayer
}) => {
  const activeMeta =
    PIN_LAYER_ITEMS.find((item) => item.id === activeLayer) || PIN_LAYER_ITEMS[0];

  return (
    <div className="md:hidden fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-[445] px-2.5 pointer-events-none">
      <div
        role="region"
        aria-label="Pin Colour Layer Selector"
        className="pointer-events-auto max-w-lg mx-auto rounded-2xl marviz-glass-strong border border-[#00C8FF]/22 shadow-[0_12px_32px_-8px_rgba(2,13,31,0.9)] overflow-hidden"
      >
        {/* Top micro-header: label + live 3-dot pin colour key */}
        <div className="px-3 pt-1.5 pb-1 flex items-center justify-between gap-2 border-b border-[#104878]/60">
          <div className="flex items-center gap-1.5 shrink-0">
            <Palette size={11} className="text-[#00C8FF]" />
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#A5B8D5]">
              Pin Colour Layer
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-hidden">
            {activeMeta.legend.map((entry) => (
              <span
                key={entry.text}
                className="flex items-center gap-1 text-[9.5px] font-medium text-[#E2ECFA] whitespace-nowrap shrink-0"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                <span>{entry.text}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Horizontally scrollable single-select layer strip */}
        <div
          role="radiogroup"
          aria-label="Pin Colour Layer (Single)"
          className="px-2 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        >
          {PIN_LAYER_ITEMS.map((layer) => {
            const selected = activeLayer === layer.id;
            return (
              <button
                key={layer.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelectLayer(layer.id)}
                className={`min-h-[32px] px-2.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                  selected
                    ? 'btn-electric-blue border-[#00C8FF]/70 text-white shadow-[0_4px_14px_rgba(0,122,255,0.45)]'
                    : 'bg-[#04152B]/75 border-[#104878] text-[#A5B8D5] hover:text-[#F1F5FF] hover:border-[#008DFF]/60'
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: selected ? '#FFFFFF' : layer.legend[0].color
                  }}
                  aria-hidden="true"
                />
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
