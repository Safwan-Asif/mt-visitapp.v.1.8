import React, { useRef, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  MapPin,
  AlertCircle,
  Navigation,
  Calendar
} from 'lucide-react';
import {
  MapOutlet,
  formatLastVisitRecency,
  getDeterministicOutletInsight
} from '../../data/data';
import { OutletKPIRow } from './OutletKPIRow';

export type BottomSheetState = 'closed' | 'peek' | 'expanded';

interface OutletBottomSheetProps {
  outlet: MapOutlet | null;
  sheetState: BottomSheetState;
  onChangeState: (nextState: BottomSheetState) => void;
  onStartOutletVisit: (outlet: MapOutlet) => void;
  onMoreDetails: (outlet: MapOutlet) => void;
}

function getVisitStatusBadge(outlet: MapOutlet): {
  label: string;
  classes: string;
} {
  if (outlet.visitStatus === 'completed') {
    return {
      label: 'COMPLETED VISIT',
      classes: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
    };
  }
  if (outlet.visitStatus === 'planned') {
    return {
      label: 'PLANNED VISIT',
      classes: 'bg-[#1D8EFF]/25 text-sky-300 border-sky-400/45'
    };
  }
  return {
    label: 'ASSIGNED · UNSCHEDULED',
    classes: 'bg-slate-700/60 text-slate-300 border-slate-500/45'
  };
}

function getHealthBadge(outlet: MapOutlet): {
  label: string;
  classes: string;
} | null {
  if (outlet.hasAuditHistory === false) {
    return null;
  }
  if (outlet.healthStatus === 'critical') {
    return {
      label: 'CRITICAL',
      classes: 'bg-red-500/20 text-red-300 border-red-400/40'
    };
  }
  if (outlet.healthStatus === 'attention') {
    return {
      label: 'ATTENTION',
      classes: 'bg-amber-500/20 text-amber-300 border-amber-400/40'
    };
  }
  return null;
}

export const OutletBottomSheet: React.FC<OutletBottomSheetProps> = ({
  outlet,
  sheetState,
  onChangeState,
  onStartOutletVisit,
  onMoreDetails
}) => {
  const dragStartY = useRef<number | null>(null);
  const [dragDeltaY, setDragDeltaY] = useState<number>(0);

  if (!outlet || sheetState === 'closed') {
    return null;
  }

  const isExpanded = sheetState === 'expanded';
  const visitBadge = getVisitStatusBadge(outlet);
  const healthBadge = getHealthBadge(outlet);
  const insightLine = getDeterministicOutletInsight(outlet);
  const lastVisitRecency = formatLastVisitRecency(outlet.lastVisitDate);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartY.current = e.clientY;
    setDragDeltaY(0);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const rawDelta = e.clientY - dragStartY.current;
    // Clamp subtle live drag feedback
    setDragDeltaY(Math.max(-70, Math.min(90, rawDelta)));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    const delta = e.clientY - dragStartY.current;
    dragStartY.current = null;
    setDragDeltaY(0);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (delta < -28) {
      onChangeState('expanded');
    } else if (delta > 32) {
      onChangeState(isExpanded ? 'peek' : 'closed');
    }
  };

  const handleTogglePeekExpand = () => {
    onChangeState(isExpanded ? 'peek' : 'expanded');
  };

  return (
    <div
      role="region"
      aria-label={`Selected outlet: ${outlet.name}`}
      style={{
        transform: dragDeltaY !== 0 ? `translateY(${dragDeltaY}px)` : undefined
      }}
      className="md:hidden fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom,0px))] z-[460] px-2.5 sm:px-4 pointer-events-none transition-transform duration-200 ease-out"
    >
      <div className="max-w-md mx-auto marviz-glass-strong rounded-t-3xl rounded-b-2xl pointer-events-auto overflow-hidden text-white">
        {/* Touch-Draggable Header & Handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="px-4 pt-2 pb-2.5 touch-none cursor-grab active:cursor-grabbing select-none"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pb-2">
            <span className="w-10 h-1 rounded-full bg-slate-500/70" />
          </div>

          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-1.5">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border leading-tight ${visitBadge.classes}`}
                >
                  {visitBadge.label}
                </span>
                {healthBadge && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border leading-tight ${healthBadge.classes}`}
                  >
                    {healthBadge.label}
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                  {outlet.id}
                </span>
              </div>

              <h3 className="font-heading text-[20px] font-bold tracking-wide text-white leading-tight mt-1 truncate">
                {outlet.name}
              </h3>

              <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5 truncate">
                <MapPin size={12} className="text-sky-400 shrink-0" />
                <span className="truncate">{outlet.area}</span>
              </div>
            </div>

            {/* Minimum 44x44 Expand / Collapse Toggle */}
            <button
              type="button"
              onClick={handleTogglePeekExpand}
              aria-label={isExpanded ? 'Collapse outlet sheet to peek' : 'Expand outlet details'}
              className="w-11 h-11 -mr-1.5 -mt-0.5 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            >
              {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          </div>
        </div>

        {/* Expanded State Body: Last Visit Banner + 2+3 KPI Grid + Deterministic Summary + Conditional CTAs */}
        {isExpanded && (
          <div className="px-4 pb-3.5 pt-0.5 space-y-2.5 animate-fade-in">
            {/* Dedicated Last Visit Recency & Baseline Banner Card */}
            {lastVisitRecency ? (
              <div className="rounded-xl bg-slate-900/80 border border-slate-700/65 px-3 py-2 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-950/70 border border-slate-700/70 flex items-center justify-center shrink-0">
                    <Calendar size={14} className="text-sky-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Last Visit
                      </span>
                      <span
                        className={`text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none ${lastVisitRecency.badgeClass}`}
                      >
                        {lastVisitRecency.relativeText}
                      </span>
                    </div>
                    <div className="text-[11px] font-medium text-slate-200 mt-0.5 tabular-nums truncate">
                      {lastVisitRecency.formattedDate}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2 border-l border-slate-700/60">
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                    Baseline
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-300 tabular-nums">
                    SOS {outlet.previousSosScore.toFixed(1)} · PG {outlet.previousPlanogramPercentage}%
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-900/70 border border-slate-700/65 px-3 py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Calendar size={14} className="text-slate-400 shrink-0" />
                  <span className="text-[11px] font-medium text-slate-300 truncate">
                    No prior Sheet 2 audit synced yet
                  </span>
                </div>
                {outlet.sapCode && (
                  <span className="text-[10px] font-mono text-sky-300 tabular-nums shrink-0">
                    SAP {outlet.sapCode}
                  </span>
                )}
              </div>
            )}

            <OutletKPIRow outlet={outlet} compact />

            {/* Deterministic One-Line Intelligence Summary */}
            <div className="flex items-center gap-2 rounded-xl bg-slate-900/70 border border-slate-700/65 px-3 py-2">
              <AlertCircle
                size={14}
                className={
                  outlet.hasAuditHistory === false
                    ? 'text-sky-400 shrink-0'
                    : outlet.healthStatus === 'critical'
                    ? 'text-red-400 shrink-0'
                    : outlet.healthStatus === 'attention'
                    ? 'text-amber-400 shrink-0'
                    : 'text-sky-400 shrink-0'
                }
              />
              <p className="text-[11.5px] font-medium text-slate-200 leading-snug truncate">
                {insightLine}
              </p>
            </div>

            {/* Completed outlets show ONLY Analytics CTA; uncompleted show Start Visit + Analytics */}
            {outlet.visitStatus === 'completed' ? (
              <button
                type="button"
                onClick={() => onMoreDetails(outlet)}
                className="w-full min-h-[46px] rounded-xl btn-electric-blue font-heading text-[15px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
              >
                <BarChart3 size={16} />
                <span>ANALYTICS</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onStartOutletVisit(outlet)}
                  className="flex-1 min-h-[46px] rounded-xl btn-electric-blue font-heading text-[15px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <Navigation size={15} className="fill-white" />
                  <span>START OUTLET VISIT</span>
                </button>
                <button
                  type="button"
                  onClick={() => onMoreDetails(outlet)}
                  aria-label={`View analytics for ${outlet.name}`}
                  className="min-h-[46px] px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-sky-400/35 text-xs font-bold text-sky-300 hover:text-white flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  <BarChart3 size={15} />
                  <span>Analytics</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
