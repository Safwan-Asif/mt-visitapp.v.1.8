import React, { useState, useMemo } from 'react';
import {
  MapPin,
  CheckCircle2,
  ChevronRight,
  Plus,
  Clock,
  Check,
  RefreshCw,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Outlet, UserProfile, PlanogramRecord } from '../types';
import { useTheme } from '../ThemeContext';
import { PJP_GOOGLE_SHEET_URL } from '../constants';
import { getPlanogramsForOutlet } from '../services/planogramService';
import { summarizeSapPlanogramMatches } from '../services/pjpService';

interface PJPScreenProps {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
  onOpenAddModal: () => void;
  executive?: UserProfile | null;
  planograms?: PlanogramRecord[];
  isSyncingMatch?: boolean;
  onRefreshMatch?: () => void;
}

export const PJPScreen: React.FC<PJPScreenProps> = ({
  outlets,
  onSelectOutlet,
  onOpenAddModal,
  executive,
  planograms = [],
  isSyncingMatch = false,
  onRefreshMatch
}) => {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PLANOGRAM' | 'DONE'>('ALL');

  const completedCount = outlets.filter((o) =>
    Object.values(o.progress).every((status) => status === 'Completed')
  ).length;

  const totalCount = outlets.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const outletPlanogramsMap = useMemo(() => {
    const map = new Map<string, PlanogramRecord[]>();
    outlets.forEach((o) => {
      map.set(o.id, getPlanogramsForOutlet(o, planograms));
    });
    return map;
  }, [outlets, planograms]);

  const sapMatchSummary = useMemo(
    () => summarizeSapPlanogramMatches(outlets, planograms),
    [outlets, planograms]
  );

  const planogramMatchedCount = outlets.filter(
    (o) => (outletPlanogramsMap.get(o.id) || []).length > 0
  ).length;

  const filteredOutlets = outlets.filter((o) => {
    const isDone = Object.values(o.progress).every((s) => s === 'Completed');
    const hasPlanogram = (outletPlanogramsMap.get(o.id) || []).length > 0;
    if (filter === 'PENDING') return !isDone;
    if (filter === 'DONE') return isDone;
    if (filter === 'PLANOGRAM') return hasPlanogram;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full h-full overflow-hidden px-3.5 pt-3.5 md:px-8 md:pt-6 select-none animate-fade-in">
      {/* Top Header & Progress Summary */}
      <div className="space-y-3 shrink-0">
        <div className="glass-panel rounded-3xl p-4 md:p-5 flex items-center justify-between gap-4 relative overflow-hidden">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold text-[var(--accent-primary)]">
              <span className="uppercase tracking-wider font-bold">Today&apos;s PJP Route</span>
              <span className="opacity-40">&middot;</span>
              <span className="font-mono tabular-nums">{executive?.repId || '#9'}</span>
              <span className="opacity-40">&middot;</span>
              <a
                href={PJP_GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline text-[var(--accent-primary)] font-semibold"
                title="View Master PJP Spreadsheet"
              >
                <FileSpreadsheet size={12} />
                <span>PJP Sheet</span>
              </a>
            </div>

            <h2 className="text-lg md:text-xl font-extrabold tracking-tight truncate text-[var(--text-primary)]">
              {executive?.name || 'Qatar Modern Trade'}
            </h2>

            <p className="text-xs text-[var(--text-secondary)]">
              {executive?.territory || 'Modern Trade Sector'} &middot;{' '}
              <span className="font-bold tabular-nums text-[var(--accent-primary)]">
                {completedCount}
              </span>{' '}
              of <span className="font-bold tabular-nums text-[var(--text-primary)]">{totalCount}</span>{' '}
              Stores
            </p>
          </div>

          {/* Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4.5"
                className={isDark ? 'text-white/10' : 'text-[#084C41]/12'}
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4.5"
                className="text-[var(--accent-primary)] transition-all duration-700 ease-out"
                fill="transparent"
                strokeDasharray={138.2}
                strokeDashoffset={138.2 - (138.2 * percent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs font-extrabold tabular-nums text-[var(--text-primary)]">
              {percent}%
            </span>
          </div>
        </div>

        {/* Filters & Add Store Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            role="tablist"
            aria-label="Filter route outlets"
            className="flex items-center p-1 glass-subtle rounded-2xl overflow-x-auto no-scrollbar max-w-full"
          >
            {(
              [
                { id: 'ALL', label: `All (${totalCount})` },
                { id: 'PENDING', label: `Pending (${totalCount - completedCount})` },
                { id: 'PLANOGRAM', label: `Planogram (${planogramMatchedCount})` },
                { id: 'DONE', label: `Done (${completedCount})` }
              ] as const
            ).map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[36px] px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                    isSelected
                      ? isDark
                        ? 'bg-[#10B981] text-[#05231C] font-bold shadow-sm'
                        : 'bg-[#084C41] text-white font-bold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl glass-panel text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer whitespace-nowrap ${
              isDark
                ? 'text-[#34D399] hover:bg-white/10'
                : 'text-[#084C41] hover:bg-white/95'
            }`}
          >
            <Plus size={15} />
            <span>Add Store</span>
          </button>
        </div>

        {/* SAP Code Match Status Bar */}
        <div className="glass-subtle rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0 text-[var(--text-secondary)]">
            <Layers size={14} className="text-[var(--accent-primary)] shrink-0" />
            <span className="truncate tabular-nums">
              SAP Match: <strong className="text-[var(--text-primary)]">{sapMatchSummary.matchedOutletsCount}</strong>/{totalCount} linked &middot; {planograms.length} plans
            </span>
          </div>
          {onRefreshMatch && (
            <button
              type="button"
              onClick={onRefreshMatch}
              disabled={isSyncingMatch}
              className="min-h-[32px] px-2.5 py-1 rounded-xl glass-panel text-[11px] font-bold text-[var(--accent-primary)] flex items-center gap-1.5 shrink-0 cursor-pointer hover:brightness-105 active:scale-95"
              title="Sync PJP MT & Planograms by SAP Code"
            >
              <RefreshCw size={12} className={isSyncingMatch ? 'animate-spin' : ''} />
              <span>{isSyncingMatch ? 'Syncing' : 'Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Responsive Outlet Grid (1-col mobile, 2-col tablet, 3-col desktop) */}
      <div className="flex-1 overflow-y-auto pt-3 pb-24 md:pb-6 pr-0.5">
        {filteredOutlets.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
            <CheckCircle2 size={32} className="text-[var(--accent-primary)] opacity-50 mb-2" />
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              No stores in this view
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Switch filter to inspect all assigned stores
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredOutlets.map((outlet, index) => {
              const isDone = Object.values(outlet.progress).every((s) => s === 'Completed');
              const doneCategoryCount = Object.values(outlet.progress).filter(
                (s) => s === 'Completed'
              ).length;
              const inProgress = doneCategoryCount > 0 && !isDone;
              const matchedPlans = outletPlanogramsMap.get(outlet.id) || [];

              return (
                <button
                  key={outlet.id}
                  type="button"
                  onClick={() => onSelectOutlet(outlet)}
                  className="glass-panel rounded-2xl p-4 text-left transition-all cursor-pointer group flex flex-col justify-between gap-2.5 hover:border-[var(--border-glass-strong)] active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-2 w-full">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums flex-wrap">
                        <span className="font-mono font-bold text-[var(--accent-primary)]">
                          #{index + 1}
                        </span>
                        {matchedPlans.length > 0 && (
                          <>
                            <span className="opacity-40">&middot;</span>
                            <span className="text-[var(--accent-primary)] font-bold">
                              Planogram ({matchedPlans.map((p) => (p.category === 'Edible Oil' ? 'Oil' : p.category)).join(', ')})
                            </span>
                          </>
                        )}
                        {outlet.isUnmapped && (
                          <>
                            <span className="opacity-40">&middot;</span>
                            <span className="text-amber-600 dark:text-amber-400 font-bold">
                              Unmapped
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                        {outlet.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          <Check size={13} /> 3/3
                        </span>
                      ) : inProgress ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                          <Clock size={12} /> {doneCategoryCount}/3
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          Audit
                        </span>
                      )}
                      <ChevronRight
                        size={15}
                        className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all"
                      />
                    </div>
                  </div>

                  {/* Clean Metadata Row */}
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border-glass)] w-full">
                    <span className="flex items-center gap-1.5 truncate min-w-0">
                      <MapPin size={12} className="text-[var(--accent-primary)] shrink-0" />
                      <span className="truncate tabular-nums">
                        {outlet.code ? `SAP ${outlet.code} · ` : ''}
                        {outlet.branch}
                      </span>
                    </span>

                    <div className="flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
                      <span
                        className={
                          outlet.progress['Edible Oil'] === 'Completed'
                            ? 'text-[var(--accent-primary)] font-bold'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        Oil
                      </span>
                      <span className="opacity-30">&middot;</span>
                      <span
                        className={
                          outlet.progress['Flour'] === 'Completed'
                            ? 'text-[var(--accent-primary)] font-bold'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        Flour
                      </span>
                      <span className="opacity-30">&middot;</span>
                      <span
                        className={
                          outlet.progress['Pasta'] === 'Completed'
                            ? 'text-[var(--accent-primary)] font-bold'
                            : 'text-[var(--text-muted)]'
                        }
                      >
                        Pasta
                      </span>
                    </div>
                  </div>

                  {outlet.unmappedRemark && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 truncate w-full">
                      Note: {outlet.unmappedRemark}
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
