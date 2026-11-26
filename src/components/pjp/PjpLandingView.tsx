import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Play,
  ArrowRight,
  RefreshCw,
  CheckCircle2,
  MapPin,
  BarChart3,
  Sparkles
} from 'lucide-react';
import { Outlet, UserProfile } from '../../types';
import { HeroProgressRing, DohaDatePill } from './PjpPrimitives';
import { useTheme } from '../../ThemeContext';

interface PjpLandingViewProps {
  outlets: Outlet[];
  executive?: UserProfile | null;
  isSyncingMatch: boolean;
  onRefreshSync?: () => void;
  onStartRoute: () => void;
  onSelectOutletDetails: (outlet: Outlet) => void;
  onViewDailySummary?: () => void;
}

export const PjpLandingView: React.FC<PjpLandingViewProps> = ({
  outlets,
  executive,
  isSyncingMatch,
  onRefreshSync,
  onStartRoute,
  onSelectOutletDetails,
  onViewDailySummary
}) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const totalCount = outlets.length;
  const doneCount = outlets.filter((o) => {
    const cats = Object.values(o.progress);
    return cats.length === 3 && cats.every((c) => c === 'Completed');
  }).length;
  const pendingCount = Math.max(0, totalCount - doneCount);
  const allCompleted = totalCount > 0 && doneCount === totalCount;
  const inProgress = doneCount > 0 && doneCount < totalCount;

  const nextOutlet = outlets.find((o) => {
    const cats = Object.values(o.progress);
    return !cats.every((c) => c === 'Completed');
  });

  const isEmpty = totalCount === 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24 }}
      className="flex-1 flex flex-col justify-between w-full max-w-md mx-auto md:max-w-none px-4 pt-3 pb-[calc(88px+env(safe-area-inset-bottom,0px))] md:px-2 md:py-2 overflow-y-auto no-scrollbar"
    >
      {/* Top Brand Header Bar (Mobile + Compact) */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl btn-electric-blue flex items-center justify-center text-[11px] font-extrabold tracking-wider shrink-0">
            QFI
          </div>
          <div className="min-w-0">
            <span className="text-sm font-extrabold tracking-tight text-[var(--text-primary)] block leading-none">
              MARVIZ AI
            </span>
            {executive?.territory && (
              <span className="text-[10px] font-medium text-[var(--text-secondary)] truncate block mt-0.5">
                {executive.territory}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onRefreshSync}
          disabled={isSyncingMatch}
          aria-label="Sync Live Schedule"
          title="Sync Live Schedule"
          className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer active:scale-95 shrink-0 relative"
        >
          <RefreshCw
            size={16}
            className={isSyncingMatch ? 'animate-spin text-[#00C8FF]' : ''}
          />
          {!isSyncingMatch && pendingCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#008DFF]" />
          )}
        </button>
      </div>

      {/* Main Centered Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-5">
        <div className="space-y-1.5">
          <h1 className="font-heading font-extrabold text-[40px] sm:text-[44px] leading-none tracking-tight text-[var(--text-primary)]">
            PJP Route
          </h1>
          <p className="text-xs sm:text-sm font-medium text-[var(--text-secondary)]">
            {allCompleted
              ? 'All assigned outlets completed today'
              : 'Your planned visits for today'}
          </p>
          <div className="pt-1">
            <DohaDatePill />
          </div>
        </div>

        {/* Hero Animated Progress Ring */}
        {isEmpty && isSyncingMatch ? (
          <div className="w-48 h-48 rounded-full glass-panel flex flex-col items-center justify-center gap-2">
            <RefreshCw size={24} className="animate-spin text-[#00C8FF]" />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Syncing today&apos;s route…
            </span>
          </div>
        ) : (
          <HeroProgressRing
            completed={doneCount}
            total={totalCount}
            size={196}
            strokeWidth={14}
            label="Outlets Completed"
          />
        )}

        {/* 3 Summary Stat Tiles: Total | Done | Pending */}
        <div className="grid grid-cols-3 gap-2.5 w-full">
          <div className="glass-panel rounded-2xl py-3 px-2 text-center">
            <div className="font-heading font-extrabold text-[26px] leading-none text-[var(--text-primary)] tabular-nums">
              {totalCount}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
              Total
            </div>
          </div>

          <div className="glass-panel rounded-2xl py-3 px-2 text-center">
            <div
              className={`font-heading font-extrabold text-[26px] leading-none tabular-nums ${
                doneCount > 0 ? 'text-[#22C55E]' : 'text-[var(--text-primary)]'
              }`}
            >
              {doneCount}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
              Done
            </div>
          </div>

          <div className="glass-panel rounded-2xl py-3 px-2 text-center">
            <div className="font-heading font-extrabold text-[26px] leading-none text-[var(--text-primary)] tabular-nums">
              {pendingCount}
            </div>
            <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-1">
              Pending
            </div>
          </div>
        </div>

        {/* Dynamic State 17: Next Stop Preview Card */}
        {inProgress && nextOutlet && (
          <button
            type="button"
            onClick={() => onSelectOutletDetails(nextOutlet)}
            className="w-full glass-panel-strong rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-left transition-all cursor-pointer hover:border-[#00C8FF]/60 active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl btn-electric-blue flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#008DFF] dark:text-[#00C8FF] block">
                  Up Next
                </span>
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {nextOutlet.name}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] truncate tabular-nums">
                  {nextOutlet.code ? `SAP ${nextOutlet.code} · ` : ''}
                  {nextOutlet.branch}
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="text-[#00C8FF] shrink-0" />
          </button>
        )}

        {/* Dynamic State 18: 100% Route Completion Banner */}
        {allCompleted && (
          <div className="w-full rounded-2xl px-4 py-3 border border-[#22C55E]/45 bg-[#22C55E]/12 flex items-center gap-3 text-left">
            <CheckCircle2 size={20} className="text-[#22C55E] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[#15803D] dark:text-[#4ADE80]">
                Daily Route Target Reached
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                All {totalCount} outlets audited and synced cleanly.
              </p>
            </div>
          </div>
        )}

        {/* Empty State Fallback */}
        {isEmpty && !isSyncingMatch && (
          <div className="w-full glass-panel rounded-2xl p-4 text-center space-y-2">
            <p className="text-xs font-bold text-[var(--text-primary)]">
              No outlets scheduled for today
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Refresh live schedule or open the route view to add an unmapped store.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Primary Pill CTA */}
      <div className="space-y-2.5 shrink-0 pt-2">
        {allCompleted ? (
          <>
            <button
              type="button"
              onClick={onViewDailySummary || onStartRoute}
              className={`w-full min-h-[54px] rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97] ${
                isDark ? 'btn-emerald-glow' : 'btn-emerald-glow'
              }`}
            >
              <BarChart3 size={17} />
              <span>View Daily Summary</span>
              <ArrowRight size={17} />
            </button>
            <button
              type="button"
              onClick={onStartRoute}
              className="w-full min-h-[40px] rounded-full glass-subtle text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Inspect Completed Route</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onStartRoute}
            className="w-full min-h-[54px] rounded-full btn-electric-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-[0.97]"
          >
            {doneCount === 0 ? (
              <>
                <Play size={15} className="fill-current" />
                <span>Start Route</span>
                <ArrowRight size={17} />
              </>
            ) : (
              <>
                <Sparkles size={15} />
                <span>Resume Route ({pendingCount} Left)</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};
