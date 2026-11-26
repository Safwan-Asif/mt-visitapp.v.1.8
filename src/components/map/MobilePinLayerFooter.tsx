import React from 'react';
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
  return (
    <div
      role="region"
      aria-label="Pin Colour Layer Selector"
      className="marviz-glass rounded-xl px-1.5 py-1 border border-[#104878] bg-[#061C35]/85 backdrop-blur-md"
    >
      <div
        role="radiogroup"
        aria-label="Pin Colour Layer (Single)"
        className="flex items-center gap-1 overflow-x-auto no-scrollbar"
      >
        {PIN_LAYER_ITEMS.map((layer) => {
          const selected = activeLayer === layer.id;
          const legendHint = layer.legend.map((e) => e.text).join(' · ');
          return (
            <button
              key={layer.id}
              type="button"
              role="radio"
              aria-checked={selected}
              title={`${layer.label}: ${legendHint}`}
              onClick={() => onSelectLayer(layer.id)}
              className={`min-h-[26px] px-2.5 rounded-full text-[10px] sm:text-[10.5px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 border ${
                selected
                  ? 'btn-electric-blue border-[#00C8FF]/75 text-white shadow-[0_2px_10px_rgba(0,122,255,0.45)]'
                  : 'bg-[#04152B]/80 border-[#104878] text-[#A5B8D5] hover:text-[#F1F5FF] hover:border-[#008DFF]/60'
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
  );
};
