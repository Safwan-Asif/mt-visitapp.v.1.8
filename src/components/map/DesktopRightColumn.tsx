import React, { useState } from 'react';
import {
  Flag,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Navigation,
  BarChart3,
  X,
  Store
} from 'lucide-react';
import {
  HealthBreakdown,
  JourneyMetrics,
  MapOutlet,
  formatLastVisitRecency,
  getDeterministicOutletIssues,
  getDeterministicRecommendedActions
} from '../../data/data';
import { OutletKPIRow } from './OutletKPIRow';
import storefrontImg from '../../assets/images/storefront_doha_hypermarket_1795012164873.jpg';

interface DesktopRightColumnProps {
  metrics: JourneyMetrics;
  healthBreakdown: HealthBreakdown;
  selectedOutlet: MapOutlet | null;
  onCloseOutlet: () => void;
  onStartOutletVisit: (outlet: MapOutlet) => void;
  onMoreDetails: (outlet: MapOutlet) => void;
}

function formatVisitDateShort(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  });
}

export const DesktopRightColumn: React.FC<DesktopRightColumnProps> = ({
  metrics,
  healthBreakdown,
  selectedOutlet,
  onCloseOutlet,
  onStartOutletVisit,
  onMoreDetails
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const healthyPct =
    healthBreakdown.total > 0 ? (healthBreakdown.healthy / healthBreakdown.total) * 100 : 0;
  const attentionPct =
    healthBreakdown.total > 0 ? (healthBreakdown.attention / healthBreakdown.total) * 100 : 0;
  const criticalPct =
    healthBreakdown.total > 0 ? (healthBreakdown.critical / healthBreakdown.total) * 100 : 0;

  const formattedProgress = Number.isInteger(metrics.progressPercent)
    ? `${metrics.progressPercent}%`
    : `${metrics.progressPercent.toFixed(1)}%`;

  const issues = selectedOutlet ? getDeterministicOutletIssues(selectedOutlet) : [];
  const actions = selectedOutlet ? getDeterministicRecommendedActions(selectedOutlet) : [];
  const lastVisitRecency = selectedOutlet
    ? formatLastVisitRecency(selectedOutlet.lastVisitDate)
    : null;

  const statusLabel =
    selectedOutlet?.visitStatus === 'completed'
      ? 'COMPLETED VISIT'
      : selectedOutlet?.visitStatus === 'planned'
      ? 'PLANNED VISIT'
      : 'UNSCHEDULED OUTLET';

  const statusChipClasses =
    selectedOutlet?.visitStatus === 'completed'
      ? 'bg-emerald-500/85 text-white border-emerald-300/60'
      : selectedOutlet?.visitStatus === 'planned'
      ? 'bg-[#1D8EFF]/90 text-white border-sky-300/70'
      : 'bg-slate-700/90 text-slate-100 border-slate-400/50';

  const sosDelta = selectedOutlet
    ? Number((selectedOutlet.sosScore - selectedOutlet.previousSosScore).toFixed(1))
    : 0;
  const planDelta = selectedOutlet
    ? selectedOutlet.planogramPercentage - selectedOutlet.previousPlanogramPercentage
    : 0;

  return (
    <div className="hidden md:flex flex-col items-end gap-2.5 w-[328px] lg:w-[348px] max-h-[calc(100%-64px)] pointer-events-none">
      {/* Top-Right Row: Compass Rose + Today's Journey + Outlet Health */}
      <div className="flex items-start gap-2.5 w-full justify-end pointer-events-auto shrink-0">
        {/* Tactical Compass Rose */}
        <div
          aria-hidden="true"
          className="hidden lg:flex w-14 h-14 rounded-full marviz-glass items-center justify-center shrink-0 mt-1"
        >
          <svg width="42" height="42" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="rgba(148,163,184,0.35)" strokeWidth="1" />
            <text x="24" y="10" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontWeight="700">
              N
            </text>
            <polygon points="24,13 28,25 24,22 20,25" fill="#E2E8F0" />
            <polygon points="24,37 27,27 24,29 21,27" fill="#64748B" />
          </svg>
        </div>

        {/* Journey + Outlet Health Stacked Glass Cards */}
        <div className="flex-1 space-y-2 min-w-0">
          {/* Today's Journey */}
          <div className="marviz-glass-strong rounded-2xl px-3 py-2 text-white">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Flag size={14} className="text-slate-200 shrink-0" />
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-white leading-tight">
                    Today&apos;s Journey
                  </div>
                  <div className="text-[10.5px] text-slate-300 tabular-nums leading-tight">
                    {metrics.completedToday} of {metrics.plannedToday} Outlets
                  </div>
                </div>
              </div>
              <div className="font-heading text-[20px] font-bold text-emerald-400 tabular-nums leading-none">
                {formattedProgress}
              </div>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#34D399]"
                style={{ width: `${Math.min(100, metrics.progressPercent)}%` }}
              />
            </div>
          </div>

          {/* Outlet Health */}
          <div className="marviz-glass-strong rounded-2xl px-3 py-2 text-white">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-100">
              <span>Outlet Health</span>
              <span className="text-[10px] font-medium text-slate-400 tabular-nums">
                {healthBreakdown.total} Total
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden flex gap-0.5 bg-slate-800">
              <div className="h-full bg-emerald-500" style={{ width: `${healthyPct}%` }} />
              <div className="h-full bg-amber-500" style={{ width: `${attentionPct}%` }} />
              <div className="h-full bg-red-500" style={{ width: `${criticalPct}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-1 mt-1.5 text-[10.5px]">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-bold text-emerald-300 tabular-nums">
                  {healthBreakdown.healthy}
                </span>
                <span className="text-slate-300 truncate">Healthy</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 tabular-nums">
                  {healthBreakdown.attention}
                </span>
                <span className="text-slate-300 truncate">Attention</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                <span className="font-bold text-red-300 tabular-nums">
                  {healthBreakdown.critical}
                </span>
                <span className="text-slate-300 truncate">Critical</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Outlet Floating Card */}
      {selectedOutlet && (
        <section
          aria-label={`Selected outlet details for ${selectedOutlet.name}`}
          className="w-full marviz-glass-strong rounded-2xl overflow-hidden text-white pointer-events-auto flex flex-col max-h-[calc(100vh-270px)] animate-fade-in"
        >
          {/* Storefront Header Image with Scrim & Top Overlays */}
          <div className="relative h-28 shrink-0 bg-gradient-to-br from-slate-800 to-slate-950 overflow-hidden">
            {!imgFailed ? (
              <img
                src={storefrontImg}
                alt={`${selectedOutlet.name} storefront`}
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sky-400/50">
                <Store size={36} />
              </div>
            )}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#091221] via-[#091221]/30 to-black/40"
            />

            {/* Top Overlay Controls */}
            <div className="absolute inset-x-2.5 top-2.5 flex items-center justify-between gap-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-sm ${statusChipClasses}`}
              >
                {statusLabel}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-semibold text-slate-200 bg-black/50 px-2 py-0.5 rounded-md tabular-nums">
                  #{selectedOutlet.id}
                </span>
                <button
                  type="button"
                  onClick={onCloseOutlet}
                  aria-label="Close outlet card"
                  className="w-7 h-7 rounded-lg bg-black/55 hover:bg-black/80 flex items-center justify-center text-slate-200 hover:text-white cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Scrollable Card Body */}
          <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 overflow-y-auto no-scrollbar">
            {/* Outlet Name & Area + Analytics Link */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-heading text-[20px] font-bold text-white leading-tight truncate">
                  {selectedOutlet.name}
                </h3>
                <p className="text-[11px] text-slate-300 truncate">
                  Modern Trade · {selectedOutlet.area}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onMoreDetails(selectedOutlet)}
                className="min-h-[32px] px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-sky-400/35 text-[11px] font-semibold text-sky-300 hover:text-white flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              >
                <BarChart3 size={12} />
                <span>Analytics</span>
              </button>
            </div>

            {/* Dedicated Last Visit Recency & Baseline Banner Card */}
            {lastVisitRecency && (
              <div className="rounded-xl bg-slate-900/85 border border-slate-700/70 p-2.5 flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-950/70 border border-slate-700/70 flex items-center justify-center shrink-0">
                    <Calendar size={15} className="text-sky-400" />
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
                    <div className="text-[11.5px] font-medium text-slate-200 mt-0.5 tabular-nums truncate">
                      {lastVisitRecency.formattedDate}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2 border-l border-slate-700/60">
                  <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-tight">
                    Baseline
                  </div>
                  <div className="text-[10.5px] font-mono text-slate-200 tabular-nums">
                    SOS {selectedOutlet.previousSosScore.toFixed(1)} · PG {selectedOutlet.previousPlanogramPercentage}%
                  </div>
                </div>
              </div>
            )}

            {/* 2+3 Category KPI Grid: Planogram + OOS & Flour/Oil/Pasta SOS% (>50% Target) */}
            <OutletKPIRow outlet={selectedOutlet} compact />

            {/* Issues Requiring Attention Box */}
            {issues.length > 0 && (
              <div className="rounded-xl bg-red-950/50 border border-red-500/40 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-300">
                  <AlertCircle size={13} className="text-red-400 shrink-0" />
                  <span>Issues Requiring Attention</span>
                </div>
                <ul className="mt-1 space-y-0.5 text-[11px] text-slate-200 list-disc list-inside">
                  {issues.map((item) => (
                    <li key={item} className="leading-snug truncate">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions Checklist */}
            <div>
              <div className="text-[11px] font-bold text-slate-100 mb-1">
                Recommended Actions
              </div>
              <ul className="space-y-1">
                {actions.map((act) => (
                  <li key={act} className="flex items-center gap-2 text-[11px] text-slate-200">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Conditional CTA: Completed outlets show ONLY Analytics CTA */}
            {selectedOutlet.visitStatus === 'completed' ? (
              <button
                type="button"
                onClick={() => onMoreDetails(selectedOutlet)}
                className="w-full min-h-[44px] rounded-xl bg-[#1685FF] hover:bg-[#0B70E6] text-white font-heading text-[15px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(22,133,255,0.5)] cursor-pointer transition-all active:scale-[0.99]"
              >
                <BarChart3 size={16} />
                <span>ANALYTICS</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onStartOutletVisit(selectedOutlet)}
                className="w-full min-h-[44px] rounded-xl bg-[#1685FF] hover:bg-[#0B70E6] text-white font-heading text-[15px] font-bold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_6px_22px_rgba(22,133,255,0.5)] cursor-pointer transition-all active:scale-[0.99]"
              >
                <Navigation size={15} className="fill-white" />
                <span>START OUTLET VISIT</span>
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
