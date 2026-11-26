import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
  RotateCcw,
  Plus,
  Route as RouteIcon,
  SlidersHorizontal
} from 'lucide-react';
import { Outlet } from '../../types';
import { OptimizedRouteLeg } from '../../services/pjpService';
import { SegmentedPillSwitch } from './PjpPrimitives';

interface PjpListViewProps {
  outlets: Outlet[];
  selectedOutletId: string | null;
  viewMode: 'list' | 'map';
  onChangeViewMode: (mode: 'list' | 'map') => void;
  onBackToLanding: () => void;
  onSelectOutletDetails: (outlet: Outlet) => void;
  isOptimizing: boolean;
  isCustomRoute: boolean;
  routeNotice: string | null;
  onAutoOptimise: () => void;
  onResetRoute: () => void;
  onOpenAddModal: () => void;
  legByOutletId: Record<string, OptimizedRouteLeg>;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  savedToast: string | null;
}

function formatKm(meters: number): string {
  if (!meters || meters <= 0) return '0.0 km';
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatMins(seconds: number): string {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export const PjpListView: React.FC<PjpListViewProps> = ({
  outlets,
  selectedOutletId,
  viewMode,
  onChangeViewMode,
  onBackToLanding,
  onSelectOutletDetails,
  isOptimizing,
  isCustomRoute,
  routeNotice,
  onAutoOptimise,
  onResetRoute,
  onOpenAddModal,
  legByOutletId,
  totalDistanceMeters,
  totalDurationSeconds,
  savedToast
}) => {
  const shouldReduceMotion = useReducedMotion();

  const firstPendingId = outlets.find((o) => {
    const vals = Object.values(o.progress);
    return !vals.every((s) => s === 'Completed');
  })?.id;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className="flex-1 flex flex-col min-h-0 w-full overflow-hidden px-3.5 pt-2.5 md:px-0 md:pt-0"
    >
      {/* Top Bar: Back + PJP Route + Compact Optimise / Add */}
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
              title="Reset to scheduled PJP order"
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

          <button
            type="button"
            onClick={onOpenAddModal}
            aria-label="Add Unmapped Store"
            title="Add Unmapped Store"
            className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[#008DFF] dark:text-[#00C8FF] hover:border-[#008DFF] cursor-pointer active:scale-95"
          >
            <Plus size={16} />
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

      {/* Route Summary Banner (Matched to Screen 02) */}
      <div className="glass-panel rounded-2xl px-3.5 py-2.5 mb-2.5 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl glass-subtle border border-[#008DFF]/35 flex items-center justify-center text-[#008DFF] dark:text-[#00C8FF] shrink-0">
            <RouteIcon size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">
              Today&apos;s Route
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] truncate tabular-nums">
              {outlets.length} Outlets · {formatKm(totalDistanceMeters)} ·{' '}
              {formatMins(totalDurationSeconds)}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-subtle text-[10px] font-bold text-[#0066FF] dark:text-[#00C8FF] shrink-0">
          <SlidersHorizontal size={11} />
          <span>{routeNotice ? 'Optimised' : isCustomRoute ? 'Custom' : 'Schedule'}</span>
        </span>
      </div>

      {/* Optimise Toast */}
      {savedToast && (
        <div className="mb-2 px-3.5 py-2 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/40 text-xs font-bold text-[#15803D] dark:text-[#4ADE80] shrink-0">
          {savedToast}
        </div>
      )}

      {/* Connected Stop Timeline List */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:pb-4 space-y-2.5 no-scrollbar">
        {outlets.length === 0 ? (
          <div className="glass-panel rounded-3xl p-6 text-center space-y-2">
            <p className="text-sm font-bold text-[var(--text-primary)]">
              No outlets scheduled for today
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              Tap the + icon above to log an unmapped store visit.
            </p>
          </div>
        ) : (
          outlets.map((outlet, idx) => {
            const doneCount = Object.values(outlet.progress).filter(
              (s) => s === 'Completed'
            ).length;
            const isDone = doneCount === 3;
            const isPartial = doneCount > 0 && doneCount < 3;
            const isNext = outlet.id === firstPendingId;
            const isSelected = outlet.id === selectedOutletId;
            const leg = legByOutletId[outlet.id];
            const stopLabel = String(idx + 1).padStart(2, '0');
            const hasConnectorBelow = idx < outlets.length - 1;

            return (
              <div key={outlet.id} className="relative flex items-stretch gap-2.5">
                {/* Timeline Rail Column */}
                <div className="flex flex-col items-center shrink-0 pt-3.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold tabular-nums transition-all z-10 ${
                      isDone
                        ? 'bg-[#22C55E] text-white shadow-[0_0_14px_rgba(34,197,94,0.45)]'
                        : isNext || isSelected
                        ? 'btn-electric-blue text-white ring-2 ring-[#00C8FF]/40'
                        : isPartial
                        ? 'bg-amber-500/20 border border-amber-400 text-amber-400'
                        : 'glass-panel text-[var(--text-secondary)]'
                    }`}
                  >
                    {isDone ? <Check size={14} strokeWidth={2.8} /> : stopLabel}
                  </div>
                  {hasConnectorBelow && (
                    <div
                      className={`w-[2px] flex-1 mt-1 -mb-3 rounded-full ${
                        isDone
                          ? 'bg-[#22C55E]/45'
                          : isNext
                          ? 'bg-[#008DFF]/45'
                          : 'bg-[var(--border-glass)]'
                      }`}
                    />
                  )}
                </div>

                {/* Stop Card */}
                <button
                  type="button"
                  onClick={() => onSelectOutletDetails(outlet)}
                  className={`flex-1 min-w-0 rounded-2xl px-3.5 py-3 text-left flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-[0.985] ${
                    isNext || isSelected
                      ? 'glass-panel-strong border-[#008DFF]/70 shadow-[0_0_24px_-8px_rgba(0,141,255,0.45)]'
                      : 'glass-panel hover:border-[#008DFF]/45'
                  }`}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-[13.5px] font-bold text-[var(--text-primary)] truncate">
                        {outlet.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)] tabular-nums truncate">
                      <span>{outlet.code ? `SAP ${outlet.code}` : outlet.branch}</span>
                      <span>·</span>
                      <span className="truncate">{outlet.account || outlet.branch || 'MT'}</span>
                      {leg && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-[#008DFF] dark:text-[#00C8FF]">
                            {formatKm(leg.distanceMeters)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Mini Category Pills (ED · FL · PA) */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {(['Edible Oil', 'Flour', 'Pasta'] as const).map((cat) => {
                        const short = cat === 'Edible Oil' ? 'ED' : cat === 'Flour' ? 'FL' : 'PA';
                        const catDone = outlet.progress[cat] === 'Completed';
                        return (
                          <span
                            key={cat}
                            className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-extrabold tracking-wider ${
                              catDone
                                ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/40'
                                : 'glass-subtle text-[var(--text-muted)]'
                            }`}
                          >
                            {short}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDone ? (
                      <span className="w-7 h-7 rounded-full bg-[#22C55E]/20 text-[#22C55E] flex items-center justify-center">
                        <Check size={14} strokeWidth={2.5} />
                      </span>
                    ) : (
                      <ChevronRight
                        size={17}
                        className={
                          isNext || isSelected
                            ? 'text-[#00C8FF]'
                            : 'text-[var(--text-muted)]'
                        }
                      />
                    )}
                  </div>
                </button>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
