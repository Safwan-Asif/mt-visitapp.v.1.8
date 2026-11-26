import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Navigation, Sparkles, RotateCcw } from 'lucide-react';
import { Outlet } from '../../types';
import { PjpGoogleMap, PjpMapOutletItem } from '../PjpGoogleMap';
import { OptimizedRouteLeg } from '../../services/pjpService';
import { SegmentedPillSwitch } from './PjpPrimitives';

interface PjpMapViewProps {
  outlets: Outlet[];
  mapItems: PjpMapOutletItem[];
  selectedOutletId: string | null;
  onSelectOutletId: (id: string) => void;
  onSelectOutletDetails: (outlet: Outlet) => void;
  viewMode: 'list' | 'map';
  onChangeViewMode: (mode: 'list' | 'map') => void;
  onBackToLanding: () => void;
  origin: { lat: number; lng: number; source: 'gps' | 'old_doha_port' };
  encodedPolyline?: string;
  isDark: boolean;
  isOptimizing: boolean;
  isCustomRoute: boolean;
  onAutoOptimise: () => void;
  onResetRoute: () => void;
  legByOutletId: Record<string, OptimizedRouteLeg>;
  estimatedLegsById: Record<string, OptimizedRouteLeg>;
}

function formatKm(meters?: number): string {
  if (!meters || meters <= 0) return '—';
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatMins(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export const PjpMapView: React.FC<PjpMapViewProps> = ({
  outlets,
  mapItems,
  selectedOutletId,
  onSelectOutletId,
  onSelectOutletDetails,
  viewMode,
  onChangeViewMode,
  onBackToLanding,
  origin,
  encodedPolyline,
  isDark,
  isOptimizing,
  isCustomRoute,
  onAutoOptimise,
  onResetRoute,
  legByOutletId,
  estimatedLegsById
}) => {
  const shouldReduceMotion = useReducedMotion();

  const focusOutlet =
    outlets.find((o) => o.id === selectedOutletId) ||
    outlets.find((o) => !Object.values(o.progress).every((s) => s === 'Completed')) ||
    outlets[0] ||
    null;

  const stopIndex = focusOutlet ? outlets.findIndex((o) => o.id === focusOutlet.id) + 1 : 0;
  const roadLeg = focusOutlet ? legByOutletId[focusOutlet.id] : undefined;
  const estLeg = focusOutlet ? estimatedLegsById[focusOutlet.id] : undefined;
  const displayLeg = roadLeg || estLeg;
  const isEstimated = !roadLeg && Boolean(estLeg);

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className="flex-1 flex flex-col min-h-0 w-full overflow-hidden px-3.5 pt-2.5 pb-[calc(80px+env(safe-area-inset-bottom,0px))] md:p-0"
    >
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onBackToLanding}
            aria-label="Back to PJP Landing"
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <ChevronLeft size={19} />
          </button>
          <h2 className="font-heading font-extrabold text-[26px] leading-none tracking-tight text-[var(--text-primary)] truncate">
            PJP Route
          </h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isCustomRoute && (
            <button
              type="button"
              onClick={onResetRoute}
              className="h-9 px-2.5 rounded-full glass-subtle text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          )}
          <button
            type="button"
            onClick={onAutoOptimise}
            disabled={isOptimizing || outlets.length === 0}
            className="h-9 px-3 rounded-full btn-electric-blue text-[11px] font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <Sparkles size={13} className={isOptimizing ? 'animate-spin' : ''} />
            <span>{isOptimizing ? 'Optimising…' : 'Optimise'}</span>
          </button>
        </div>
      </div>

      {/* Animated List | Map Segmented Switcher */}
      <div className="pb-2.5 shrink-0">
        <SegmentedPillSwitch
          value={viewMode}
          onChange={onChangeViewMode}
          layoutId="pjp-list-map-switch"
          options={[
            { value: 'list', label: 'List' },
            { value: 'map', label: 'Map' }
          ]}
        />
      </div>

      {/* Map Viewport + Floating Bottom Next Stop Glass Card */}
      <div className="relative flex-1 min-h-[300px] rounded-3xl overflow-hidden border border-[var(--border-glass-strong)] shadow-xl">
        <PjpGoogleMap
          items={mapItems}
          selectedOutletId={focusOutlet?.id || null}
          onSelectOutletId={onSelectOutletId}
          onStartAudit={onSelectOutletDetails}
          autoOptimize={true}
          origin={origin}
          encodedPolyline={encodedPolyline}
          isDark={isDark}
          className="rounded-3xl border-0"
        />

        {/* Floating Next Stop Card */}
        {focusOutlet && (
          <div className="absolute inset-x-3 bottom-3 z-20 pointer-events-none">
            <button
              type="button"
              onClick={() => onSelectOutletDetails(focusOutlet)}
              className="pointer-events-auto w-full glass-panel-strong rounded-2xl px-3.5 py-3 flex items-center justify-between gap-3 text-left transition-all cursor-pointer active:scale-[0.985]"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-[#22C55E]/20 border border-[#22C55E]/50 text-[#22C55E] flex items-center justify-center font-extrabold text-xs shrink-0">
                  {String(stopIndex).padStart(2, '0')}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008DFF] dark:text-[#00C8FF]">
                      Next Stop
                    </span>
                    {focusOutlet.code && (
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        · SAP {focusOutlet.code}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-extrabold text-[var(--text-primary)] truncate">
                    {focusOutlet.name}
                  </p>
                  <p className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1.5 tabular-nums truncate mt-0.5">
                    <Navigation size={10} className="text-[#00C8FF] shrink-0" />
                    <span>
                      {displayLeg
                        ? `${formatKm(displayLeg.distanceMeters)} · ${formatMins(
                            displayLeg.durationSeconds
                          )}${isEstimated ? ' (est.)' : ''}`
                        : focusOutlet.branch}
                    </span>
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full btn-electric-blue flex items-center justify-center shrink-0">
                <ChevronRight size={16} />
              </div>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
