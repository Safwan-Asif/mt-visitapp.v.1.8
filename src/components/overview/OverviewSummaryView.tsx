import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { formatShortCalendarDate } from '../WheelDateRangePicker';
import { OverviewDrilldown, OverviewWorkspaceId } from './overviewTypes';
import {
  EmptyScopeState,
  getPlanogramRingSegments,
  HeadlineKpiCard,
  InteractiveSosTrendChart,
  InteractiveTrajectoryChart,
  ProvenanceInline,
  SignatureSalesGauge
} from './OverviewPrimitives';
import { getWeekdayShort, useOverviewAnalytics } from './useOverviewAnalytics';

type AnalyticsController = ReturnType<typeof useOverviewAnalytics>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const ModuleHeader: React.FC<{
  title: string;
  provenanceLabel?: string;
  provenanceTone?: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
  actionLabel: string;
  onAction: () => void;
}> = ({ title, provenanceLabel, provenanceTone = 'neutral', actionLabel, onAction }) => (
  <div className="flex items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
    <div className="flex items-baseline gap-2 min-w-0">
      <h3 className="text-[14px] font-bold tracking-tight text-[var(--text-primary)] truncate">
        {title}
      </h3>
      {provenanceLabel && (
        <ProvenanceInline
          label={provenanceLabel}
          tone={provenanceTone}
          className="shrink-0"
        />
      )}
    </div>
    <button
      type="button"
      onClick={onAction}
      className="px-2.5 py-1 rounded-[9px] ov-glass-recessed text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] hover:brightness-105 flex items-center gap-0.5 cursor-pointer shrink-0 transition-all"
    >
      <span>{actionLabel}</span>
      <ChevronRight size={12} />
    </button>
  </div>
);

export const OverviewSummaryView: React.FC<{
  analytics: AnalyticsController;
  onSelectWorkspace: (ws: OverviewWorkspaceId) => void;
  onDrilldown: (d: OverviewDrilldown) => void;
  isDark: boolean;
}> = ({ analytics, onSelectWorkspace, onDrilldown, isDark }) => {
  const {
    metrics,
    canonicalPlanogram,
    scheduleMeta,
    scheduleMetrics,
    intelligenceBrief,
    palette,
    fromDate,
    toDate,
    categoryFilter,
    accountFilter,
    outletFilter,
    isEmptyScope,
    handleResetFilters,
    setCategoryFilter,
    setSelectedDay
  } = analytics;

  const [hoveredAccount, setHoveredAccount] = useState<string | null>(null);
  const [expandedHeatmapAccounts, setExpandedHeatmapAccounts] = useState<
    Record<string, boolean>
  >({});

  if (isEmptyScope) {
    return <EmptyScopeState onResetFilters={handleResetFilters} />;
  }

  const periodRangeLabel = `${formatShortCalendarDate(fromDate)} – ${formatShortCalendarDate(
    toDate
  )}`;

  const planogramColorClass = !canonicalPlanogram.hasData
    ? 'text-[var(--text-muted)]'
    : canonicalPlanogram.overallScore >= 85
    ? 'text-emerald-600 dark:text-emerald-400'
    : canonicalPlanogram.overallScore >= 70
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-500';

  const oosSeverityColorClass =
    metrics.verifiedOosCells === 0
      ? 'text-[var(--text-muted)]'
      : metrics.oosPct >= 15
      ? 'text-rose-500'
      : metrics.oosPct >= 6
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-[var(--text-primary)]';

  const planogramRingSegments = getPlanogramRingSegments(canonicalPlanogram, isDark);

  const salesArcPct = Math.max(0, Math.min(100, metrics.gauge.pct));
  const salesMiniDash = `${((salesArcPct / 100) * 56.5).toFixed(1)} 60`;
  const pjpRingDash = `${((metrics.pjpBase / 100) * 88).toFixed(1)} 90`;
  const oosBarHeightPct = Math.min(100, Math.max(14, metrics.oosPct * 3));

  const sosTrendAccent =
    categoryFilter !== 'All'
      ? palette.categoryColors[categoryFilter].primary
      : palette.cyan;

  const dayRangeCompare = (d: number) => {
    const val = scheduleMeta.year * 10000 + scheduleMeta.month * 100 + d;
    const f = fromDate.year * 10000 + fromDate.month * 100 + fromDate.day;
    const t = toDate.year * 10000 + toDate.month * 100 + toDate.day;
    return val >= f && val <= t;
  };

  const handleOpenInsight = (item: (typeof intelligenceBrief)[number]) => {
    if (item.targetCategory) setCategoryFilter(item.targetCategory);
    if (item.targetDrilldown) {
      onDrilldown(item.targetDrilldown);
    } else {
      onSelectWorkspace(item.targetWorkspace);
    }
  };

  const maxAccountMton = Math.max(
    1,
    ...metrics.displayAccountGroups.slice(0, 5).map((g) => g.mton)
  );

  const briefGridClass =
    intelligenceBrief.length === 1
      ? 'grid-cols-1'
      : intelligenceBrief.length === 2
      ? 'grid-cols-1 lg:grid-cols-2'
      : 'grid-cols-1 lg:grid-cols-3';

  return (
    <div className="space-y-4 animate-fade-in">
      {/* ====================================================================
          1. EXECUTIVE KPI SCORECARD (5 Symmetrical Uniform Cards)
         ==================================================================== */}
      <section
        aria-label="Key Commercial Indicators"
        className="grid grid-cols-2 md:grid-cols-6 lg:grid-cols-5 gap-3.5"
      >
        <HeadlineKpiCard
          title="Sales Achievement"
          valueLabel={`${metrics.gauge.pct}%`}
          subtitle={`${metrics.gauge.mtd} / ${metrics.gauge.target} MTON`}
          provenance="Simulated"
          provenanceTone="simulated"
          accentColor="#008DFF"
          accentGlow="linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)"
          onClick={() => onSelectWorkspace('sales')}
          className="col-span-2 md:col-span-3 lg:col-span-1"
          visual={
            <svg viewBox="0 0 46 28" className="w-12 h-7" aria-hidden="true">
              <path
                d="M 5 24 A 18 18 0 0 1 41 24"
                fill="none"
                stroke={palette.neutralTrack}
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 5 24 A 18 18 0 0 1 41 24"
                fill="none"
                stroke={palette.cyan}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={salesMiniDash}
              />
            </svg>
          }
        />

        <HeadlineKpiCard
          title="Share of Shelf"
          valueLabel={`${metrics.avgSos}%`}
          subtitle={
            metrics.verifiedSosCount > 0
              ? `${metrics.verifiedSosCount} audited stores`
              : 'Baseline catalog'
          }
          provenance={metrics.verifiedSosCount > 0 ? 'Audited' : 'Simulated'}
          provenanceTone={metrics.verifiedSosCount > 0 ? 'live' : 'simulated'}
          accentColor={palette.violet}
          accentGlow="linear-gradient(90deg, #6366F1 0%, #A78BFA 100%)"
          onClick={() => onSelectWorkspace('shelf')}
          className="md:col-span-3 lg:col-span-1"
          visual={
            <div className="flex items-end gap-1 h-8" aria-hidden="true">
              {metrics.sosCategoryRows.map((r) => (
                <div
                  key={r.category}
                  className="w-2.5 rounded-t-sm transition-all"
                  style={{
                    height: `${Math.max(22, Math.min(100, r.ownPct * 1.4))}%`,
                    backgroundColor: palette.categoryColors[r.category].primary
                  }}
                />
              ))}
            </div>
          }
        />

        <HeadlineKpiCard
          title="PJP Adherence"
          valueLabel={`${metrics.pjpBase}%`}
          subtitle={`${metrics.pjpCompletedTotal}/${metrics.pjpPlannedTotal || 0} stops`}
          provenance={scheduleMeta.hasVerifiedSheet2Visits ? 'Sheet 2' : 'Simulated'}
          provenanceTone={scheduleMeta.hasVerifiedSheet2Visits ? 'historical' : 'simulated'}
          accentColor={palette.teal}
          accentGlow="linear-gradient(90deg, #0D9488 0%, #2DD4BF 100%)"
          onClick={() => onSelectWorkspace('productivity')}
          className="md:col-span-2 lg:col-span-1"
          visual={
            <svg viewBox="0 0 36 36" className="w-9 h-9" aria-hidden="true">
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={palette.neutralTrack}
                strokeWidth="4"
              />
              <circle
                cx="18"
                cy="18"
                r="14"
                fill="none"
                stroke={palette.teal}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={pjpRingDash}
                transform="rotate(-90 18 18)"
              />
            </svg>
          }
        />

        <HeadlineKpiCard
          title="Availability Proxy"
          valueLabel={metrics.verifiedOosCells > 0 ? `${metrics.oosPct}%` : '—'}
          valueColorClass={oosSeverityColorClass}
          subtitle={
            metrics.verifiedOosCells > 0
              ? `${metrics.totalOosSkus} zero-facing`
              : 'No audit data'
          }
          provenance={metrics.verifiedOosCells > 0 ? 'Zero-facing' : 'Unavailable'}
          provenanceTone={metrics.verifiedOosCells > 0 ? 'historical' : 'unavailable'}
          accentColor={
            metrics.oosPct >= 15
              ? palette.crimson
              : metrics.oosPct >= 6
              ? palette.amber
              : palette.teal
          }
          onClick={() => onSelectWorkspace('shelf')}
          className="md:col-span-2 lg:col-span-1"
          visual={
            <div className="flex items-end gap-1 h-8" aria-hidden="true">
              <div
                className="w-2 rounded-t-sm"
                style={{ height: '38%', backgroundColor: palette.teal }}
              />
              <div
                className="w-2 rounded-t-sm"
                style={{ height: '65%', backgroundColor: palette.amber }}
              />
              <div
                className="w-2 rounded-t-sm"
                style={{
                  height: `${oosBarHeightPct}%`,
                  backgroundColor:
                    metrics.verifiedOosCells > 0 ? palette.crimson : palette.neutralTrack
                }}
              />
            </div>
          }
        />

        <HeadlineKpiCard
          title="Planogram (85/70)"
          valueLabel={canonicalPlanogram.hasData ? `${canonicalPlanogram.overallScore}%` : '—'}
          valueColorClass={planogramColorClass}
          subtitle={
            canonicalPlanogram.hasData
              ? `${canonicalPlanogram.evaluatedStores}/${canonicalPlanogram.totalPlannedStores} stores`
              : `${canonicalPlanogram.activePlanogramTemplates} templates ready`
          }
          provenance={
            canonicalPlanogram.liveAuditCount > 0
              ? 'Live'
              : canonicalPlanogram.historicalAuditCount > 0
              ? 'Sheet 2'
              : 'Pending'
          }
          provenanceTone={
            canonicalPlanogram.liveAuditCount > 0
              ? 'live'
              : canonicalPlanogram.historicalAuditCount > 0
              ? 'historical'
              : 'unavailable'
          }
          accentColor={palette.emerald}
          accentGlow="linear-gradient(90deg, #10B981 0%, #FFB800 55%, #EF4444 100%)"
          onClick={() => onSelectWorkspace('execution')}
          className="md:col-span-2 lg:col-span-1"
          visual={
            <svg viewBox="0 0 120 120" className="w-9 h-9" aria-hidden="true">
              {canonicalPlanogram.hasData ? (
                planogramRingSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="16"
                    strokeDasharray={seg.dash}
                    strokeDashoffset={seg.off}
                    transform="rotate(-90 60 60)"
                  />
                ))
              ) : (
                <circle
                  cx="60"
                  cy="60"
                  r="40"
                  fill="none"
                  stroke={palette.neutralTrack}
                  strokeWidth="16"
                />
              )}
            </svg>
          }
        />
      </section>

      {/* ====================================================================
          2. PRIORITY EXECUTIVE SIGNALS (Zero Orphan Columns)
         ==================================================================== */}
      {intelligenceBrief.length > 0 && (
        <section
          aria-label="Priority Commercial Signals"
          className={`ov-panel rounded-[18px] px-4 py-3 grid ${briefGridClass} gap-3 lg:divide-x lg:divide-black/[0.06] lg:dark:divide-white/[0.08]`}
        >
          {intelligenceBrief.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenInsight(item)}
              className={`flex items-start justify-between gap-2.5 text-left group cursor-pointer ${
                idx > 0
                  ? 'lg:pl-3.5 pt-2.5 lg:pt-0 border-t lg:border-t-0 border-black/[0.06] dark:border-white/[0.07]'
                  : ''
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {item.severity === 'critical' ? (
                  <ShieldAlert size={14} className="text-rose-500" />
                ) : item.severity === 'attention' ? (
                  <AlertTriangle size={14} className="text-amber-500" />
                ) : (
                  <Sparkles size={14} className="text-[#0066FF] dark:text-[#00C8FF]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-[#0066FF] dark:group-hover:text-[#00C8FF] transition-colors leading-snug line-clamp-1">
                  {item.headline}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 truncate">
                  <span className="truncate">{item.context}</span>
                  <span>·</span>
                  <ProvenanceInline
                    label={item.provenanceLabel}
                    tone={item.isDemo ? 'simulated' : 'live'}
                    className="shrink-0"
                  />
                </div>
              </div>
              <ChevronRight
                size={14}
                className="text-[var(--text-muted)] shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          ))}
        </section>
      )}

      {/* ====================================================================
          3. ROW 1 (BALANCED 50 / 50): SALES PERFORMANCE vs ACCOUNT MIX
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left: Sales Achievement Gauge + Category Pace + Trajectory */}
        <section className="ov-panel-elevated rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Sales Performance & Cumulative Trajectory"
            provenanceLabel="Simulated"
            provenanceTone="simulated"
            actionLabel="Sales Detail"
            onAction={() => onSelectWorkspace('sales')}
          />

          {/* Stage 1: Gauge + Category Pace */}
          <div className="ov-chart-well rounded-[18px] p-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center min-h-[215px]">
            <div className="sm:col-span-7">
              <SignatureSalesGauge
                {...metrics.gauge}
                isDark={isDark}
                periodLabel={periodRangeLabel}
                onInspectSales={() => onSelectWorkspace('sales')}
                compact
              />
            </div>

            <div className="sm:col-span-5 space-y-3 sm:border-l sm:border-black/[0.06] sm:dark:border-white/[0.08] sm:pl-4">
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span className="font-semibold text-[var(--text-secondary)]">
                  Category Pace
                </span>
                <span>Target tick</span>
              </div>
              <div className="space-y-2.5">
                {metrics.subCategories.map((row) => {
                  const catStyle = palette.categoryColors[row.label];
                  return (
                    <button
                      key={row.label}
                      type="button"
                      onClick={() =>
                        setCategoryFilter(
                          categoryFilter === row.label ? 'All' : row.label
                        )
                      }
                      className={`w-full text-left space-y-1 cursor-pointer transition-opacity ${
                        row.dimmed ? 'opacity-40' : 'opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs ov-tabular">
                        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: catStyle.primary }}
                          />
                          {row.label}
                        </span>
                        <span className="font-bold" style={{ color: catStyle.primary }}>
                          {row.pct}%
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full relative overflow-visible"
                        style={{ backgroundColor: palette.neutralTrack }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${row.widthPct}%`,
                            background: catStyle.gradient
                          }}
                        />
                        <div
                          aria-hidden="true"
                          className="absolute -top-0.5 w-0.5 h-3 rounded-full"
                          style={{
                            left: '83.3%',
                            backgroundColor: isDark
                              ? 'rgba(245,247,250,0.65)'
                              : 'rgba(11,29,54,0.45)'
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Stage 2: Cumulative Trajectory */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-center">
            <InteractiveTrajectoryChart
              points={metrics.trajectoryPoints}
              targetTotal={metrics.gauge.target}
              startLabel={metrics.salesRangeLabels.startLabel}
              midLabel={metrics.salesRangeLabels.midLabel}
              endLabel={metrics.salesRangeLabels.endLabel}
              isDark={isDark}
            />
          </div>
        </section>

        {/* Right: Account Contribution Mix (Mirrored 2-stage symmetry) */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title={`Account Contribution Mix (${metrics.displayAccountGroups.length} chains)`}
            provenanceLabel="Simulated"
            provenanceTone="simulated"
            actionLabel="Account Detail"
            onAction={() => onSelectWorkspace('accounts')}
          />

          {/* Stage 1: Multi-Color Segmented Donut + Share Legend */}
          <div className="ov-chart-well rounded-[18px] p-4 flex flex-col sm:flex-row items-center gap-5 min-h-[215px]">
            <svg
              viewBox="0 0 120 120"
              className="w-[136px] h-[136px] shrink-0"
              aria-hidden="true"
            >
              {metrics.accountDonutSegments.map((seg) => {
                const isActive = hoveredAccount === null || hoveredAccount === seg.label;
                return (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={hoveredAccount === seg.label ? '18' : '15'}
                    strokeDasharray={seg.dash}
                    strokeDashoffset={seg.off}
                    transform="rotate(-90 60 60)"
                    opacity={isActive ? 1 : 0.3}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredAccount(seg.label)}
                    onMouseLeave={() => setHoveredAccount(null)}
                  />
                );
              })}
              <text
                x="60"
                y="57"
                textAnchor="middle"
                className="font-heading"
                fontSize="24"
                fontWeight="800"
                fill={isDark ? '#F5F7FA' : '#0B1D36'}
              >
                {Math.round(metrics.totalMton)}
              </text>
              <text
                x="60"
                y="72"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={isDark ? '#A4B9D1' : '#647D9E'}
              >
                TOTAL MTON
              </text>
            </svg>

            <div className="flex-1 w-full space-y-2 min-w-0">
              <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
                Chain Share Distribution
              </div>
              {metrics.accountDonutSegments.map((seg) => (
                <div
                  key={seg.label}
                  onMouseEnter={() => setHoveredAccount(seg.label)}
                  onMouseLeave={() => setHoveredAccount(null)}
                  className={`flex items-center justify-between gap-2 text-xs transition-opacity ${
                    hoveredAccount && hoveredAccount !== seg.label
                      ? 'opacity-40'
                      : 'opacity-100'
                  }`}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <span className="truncate font-medium text-[var(--text-primary)]">
                      {seg.label}
                    </span>
                  </span>
                  <span className="ov-tabular font-semibold text-[var(--text-secondary)] shrink-0">
                    {seg.mton}t · {seg.sharePct}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 2: Top 5 Ranked Accounts */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">
                Top Accounts by Volume
              </span>
              <span>Tap row for outlet breakdown</span>
            </div>
            <div className="space-y-2 flex-1 flex flex-col justify-center">
              {metrics.displayAccountGroups.slice(0, 5).map((grp, idx) => {
                const segColor =
                  palette.accountPalette[idx % palette.accountPalette.length];
                const barPct = Math.max(8, (grp.mton / maxAccountMton) * 100);
                return (
                  <button
                    key={grp.account}
                    type="button"
                    onMouseEnter={() => setHoveredAccount(grp.account)}
                    onMouseLeave={() => setHoveredAccount(null)}
                    onClick={() => onDrilldown({ type: 'account', account: grp.account })}
                    className="w-full px-3 py-1.5 rounded-[12px] ov-panel hover:border-[#008DFF]/45 transition-colors text-left space-y-1 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs ov-tabular">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {idx + 1}. {grp.account}
                      </span>
                      <span className="text-[var(--text-secondary)] shrink-0">
                        <strong className="text-[var(--text-primary)]">{grp.mton}</strong> MTON ·{' '}
                        {grp.sharePct}%
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: palette.neutralTrack }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${barPct.toFixed(1)}%`,
                          backgroundColor: segColor
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================================
          4. ROW 2 (BALANCED 50 / 50): SHARE OF SHELF vs AVAILABILITY RISK
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left: Share of Shelf Distribution & Trend */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Share of Shelf & Category Trend"
            provenanceLabel={
              metrics.sosTrendProvenance === 'historical_verified'
                ? 'Sheet 2'
                : 'Simulated curve'
            }
            provenanceTone={
              metrics.sosTrendProvenance === 'historical_verified'
                ? 'historical'
                : 'simulated'
            }
            actionLabel="Shelf Detail"
            onAction={() => onSelectWorkspace('shelf')}
          />

          {/* Stage 1: Category Own vs Competitor Bars */}
          <div className="ov-chart-well rounded-[18px] p-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">
                Own vs Competitor Facings
              </span>
              <span>Click category to isolate trend</span>
            </div>
            <div className="space-y-2.5">
              {metrics.sosCategoryRows.map((row) => {
                const catStyle = palette.categoryColors[row.category];
                return (
                  <button
                    key={row.category}
                    type="button"
                    onClick={() =>
                      setCategoryFilter(
                        categoryFilter === row.category ? 'All' : row.category
                      )
                    }
                    className={`w-full text-left space-y-1 cursor-pointer transition-opacity ${
                      row.dimmed ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs ov-tabular">
                      <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: catStyle.primary }}
                        />
                        {row.category}
                        {row.selected && (
                          <span className="text-[10px] font-medium text-[#0066FF] dark:text-[#00C8FF]">
                            (isolated)
                          </span>
                        )}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        <strong style={{ color: catStyle.primary }}>{row.ownPct}%</strong> own ·{' '}
                        {100 - row.ownPct}% comp
                      </span>
                    </div>
                    <div
                      className="h-2.5 rounded-full overflow-hidden flex"
                      style={{ backgroundColor: palette.competitorBar }}
                    >
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${row.ownPct}%`,
                          background: catStyle.gradient
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stage 2: Interactive SOS Trend */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-center">
            <InteractiveSosTrendChart
              points={metrics.sosTrendPoints}
              isDark={isDark}
              accentColor={sosTrendAccent}
            />
          </div>
        </section>

        {/* Right: Availability Risk Matrix (Bounded scroll preserves 50/50 row symmetry) */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Availability Risk · Zero-Facing Proxy"
            provenanceLabel={metrics.verifiedOosCells > 0 ? 'Audited' : 'Pending'}
            provenanceTone={metrics.verifiedOosCells > 0 ? 'historical' : 'unavailable'}
            actionLabel="Shelf Detail"
            onAction={() => onSelectWorkspace('shelf')}
          />

          {/* Stage 1: Compact Legend + Column Headers */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--text-secondary)]">
              <span className="text-[var(--text-muted)]">
                Account sum · expand for outlet cells
              </span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: palette.teal }}
                  />
                  0
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: palette.amber }}
                  />
                  1–2
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: palette.crimson }}
                  />
                  3+
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-500/35" />
                  N/A
                </span>
              </div>
            </div>

            <div className="grid grid-cols-[1fr_52px_52px_52px] sm:grid-cols-[1fr_64px_64px_64px] gap-1.5 px-2.5 text-[11px] font-semibold text-[var(--text-muted)]">
              <span>Account / Outlet</span>
              <span className="text-center">Flour</span>
              <span className="text-center">Oil</span>
              <span className="text-center">Pasta</span>
            </div>
          </div>

          {/* Stage 2: Bounded Matrix Container */}
          <div className="ov-chart-well rounded-[18px] p-2.5 flex-1 max-h-[296px] overflow-y-auto space-y-1.5">
            {metrics.displayAccountGroups.slice(0, 6).map((grp) => {
              const isExpanded =
                Boolean(expandedHeatmapAccounts[grp.account]) ||
                accountFilter === grp.account ||
                outletFilter !== 'All';

              return (
                <div
                  key={grp.account}
                  className="ov-panel rounded-[12px] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedHeatmapAccounts((prev) => ({
                        ...prev,
                        [grp.account]: !prev[grp.account]
                      }))
                    }
                    className="w-full min-h-[42px] grid grid-cols-[1fr_52px_52px_52px] sm:grid-cols-[1fr_64px_64px_64px] gap-1.5 items-center px-2.5 py-1.5 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isExpanded ? (
                        <ChevronDown
                          size={14}
                          className="text-[var(--text-muted)] shrink-0"
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          className="text-[var(--text-muted)] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {grp.account}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] ov-tabular">
                          {grp.outlets.length} stores
                        </div>
                      </div>
                    </div>

                    {CATEGORIES.map((cat) => {
                      const totalCatOos = grp.oosTotals[cat];
                      const hasVerified = grp.oosVerifiedTotals[cat];
                      const isDimmed =
                        categoryFilter !== 'All' && categoryFilter !== cat;

                      let bg = isDark ? 'rgba(148, 163, 184, 0.16)' : '#E2E8F0';
                      let fg = isDark ? '#94A3B8' : '#64748B';
                      if (hasVerified) {
                        if (totalCatOos >= 3) {
                          bg = palette.crimson;
                          fg = '#FFFFFF';
                        } else if (totalCatOos >= 1) {
                          bg = palette.amber;
                          fg = '#0B1D36';
                        } else {
                          bg = palette.tealSoftBg;
                          fg = palette.teal;
                        }
                      }

                      return (
                        <div
                          key={cat}
                          className={`h-8 rounded-lg flex items-center justify-center text-xs font-extrabold ov-tabular ${
                            isDimmed ? 'opacity-35' : 'opacity-100'
                          }`}
                          style={{ backgroundColor: bg, color: fg }}
                        >
                          {hasVerified ? totalCatOos : '—'}
                        </div>
                      );
                    })}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-2.5 py-2 space-y-1 animate-fade-in">
                      {grp.outlets.slice(0, 6).map((o) => (
                        <div
                          key={o.id}
                          className="grid grid-cols-[1fr_52px_52px_52px] sm:grid-cols-[1fr_64px_64px_64px] gap-1.5 items-center"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              onDrilldown({ type: 'outlet', outletId: o.id })
                            }
                            className="text-left text-xs font-medium text-[var(--text-secondary)] hover:text-[#0066FF] dark:hover:text-[#00C8FF] truncate pl-5 pr-1 cursor-pointer"
                          >
                            {o.branch}
                          </button>
                          {CATEGORIES.map((cat) => {
                            const prov = o.oosProvenanceByCategory[cat];
                            const n = o.oosByCategory[cat];
                            const isDimmed =
                              categoryFilter !== 'All' && categoryFilter !== cat;

                            let bg = isDark ? 'rgba(148, 163, 184, 0.14)' : '#E2E8F0';
                            let fg = isDark ? '#94A3B8' : '#64748B';
                            if (prov !== 'unavailable') {
                              if (n >= 3) {
                                bg = palette.crimson;
                                fg = '#FFFFFF';
                              } else if (n >= 1) {
                                bg = palette.amber;
                                fg = '#0B1D36';
                              } else {
                                bg = palette.tealSoftBg;
                                fg = palette.teal;
                              }
                            }

                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() =>
                                  onDrilldown({
                                    type: 'availability',
                                    outletId: o.id,
                                    category: cat
                                  })
                                }
                                style={{ backgroundColor: bg, color: fg }}
                                className={`h-8 rounded-lg text-xs font-bold ov-tabular cursor-pointer hover:brightness-95 transition-all ${
                                  isDimmed ? 'opacity-35' : 'opacity-100'
                                }`}
                              >
                                {prov === 'unavailable' ? '—' : n}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* ====================================================================
          5. ROW 3 (BALANCED 50 / 50): EXECUTION COMPLIANCE vs PROMOTIONS
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left: Planogram 85/70 + POSM */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Planogram (85/70) & POSM Execution"
            provenanceLabel={
              canonicalPlanogram.hasData
                ? `${canonicalPlanogram.liveAuditCount} Live · ${canonicalPlanogram.historicalAuditCount} Sheet 2`
                : 'Pending audits'
            }
            provenanceTone={canonicalPlanogram.hasData ? 'live' : 'unavailable'}
            actionLabel="Execution Detail"
            onAction={() => onSelectWorkspace('execution')}
          />

          {/* Stage 1: Planogram Donut + Threshold Breakdown */}
          <div className="ov-chart-well rounded-[18px] p-4 flex items-center gap-5 min-h-[146px]">
            {canonicalPlanogram.hasData ? (
              <svg
                viewBox="0 0 120 120"
                className="w-[108px] h-[108px] shrink-0"
                aria-hidden="true"
              >
                {planogramRingSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="15"
                    strokeDasharray={seg.dash}
                    strokeDashoffset={seg.off}
                    transform="rotate(-90 60 60)"
                  />
                ))}
                <text
                  x="60"
                  y="58"
                  textAnchor="middle"
                  className="font-heading"
                  fontSize="24"
                  fontWeight="800"
                  fill={isDark ? '#F5F7FA' : '#0B1D36'}
                >
                  {canonicalPlanogram.overallScore}%
                </text>
                <text
                  x="60"
                  y="72"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={isDark ? '#A4B9D1' : '#647D9E'}
                >
                  {canonicalPlanogram.evaluatedAudits} audits
                </text>
              </svg>
            ) : (
              <div className="w-[108px] h-[108px] shrink-0 rounded-full border-8 border-black/[0.06] dark:border-white/[0.08] flex flex-col items-center justify-center text-center">
                <span className="font-heading text-2xl font-extrabold text-[var(--text-muted)]">
                  —
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2 text-xs ov-tabular">
              <div className="flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Compliant ≥85%
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {canonicalPlanogram.compliantCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  Partial 70–84%
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {canonicalPlanogram.partialCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-rose-500 font-semibold">Below &lt;70%</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {canonicalPlanogram.nonCompliantCount}
                </span>
              </div>
              <div className="pt-1.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                <span>Brand {canonicalPlanogram.avgBrandPct || '—'}%</span>
                <span>Company Space {canonicalPlanogram.avgCompanyPct || '—'}%</span>
              </div>
            </div>
          </div>

          {/* Stage 2: 2x2 POSM Grid */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">
                POSM Presence Rate
              </span>
              <span>Present vs Evaluated</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
              {metrics.posmMetrics.map((row) => (
                <div key={row.key} className="ov-panel rounded-[12px] p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs ov-tabular">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {row.label}
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      <strong className="text-[var(--text-primary)]">{row.pct}%</strong>{' '}
                      {row.verifiedCount > 0
                        ? `(${row.presentCount}/${row.verifiedCount})`
                        : 'est'}
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: palette.neutralTrack }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${row.pct}%`,
                        background:
                          row.pct >= 80
                            ? 'linear-gradient(90deg, #0D9488 0%, #34D399 100%)'
                            : 'linear-gradient(90deg, #F97316 0%, #FFB800 100%)'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right: Flyer Execution & Competitor Promotions (Mirrored 2-stage symmetry) */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Flyer Execution & Competitor Promos"
            provenanceLabel="Simulated"
            provenanceTone="simulated"
            actionLabel="Inspect Promos"
            onAction={() => onDrilldown({ type: 'promotions' })}
          />

          {/* Stage 1: Flyer Donut + Breakdown */}
          <div className="ov-chart-well rounded-[18px] p-4 flex items-center gap-5 min-h-[146px]">
            <svg
              viewBox="0 0 120 120"
              className="w-[108px] h-[108px] shrink-0"
              aria-hidden="true"
            >
              {metrics.flyerDonut.segments.map((seg, idx) => (
                <circle
                  key={idx}
                  cx="60"
                  cy="60"
                  r="40"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="15"
                  strokeDasharray={seg.dash}
                  strokeDashoffset={seg.off}
                  transform="rotate(-90 60 60)"
                />
              ))}
              <text
                x="60"
                y="58"
                textAnchor="middle"
                className="font-heading"
                fontSize="24"
                fontWeight="800"
                fill={isDark ? '#F5F7FA' : '#0B1D36'}
              >
                {metrics.flyerDonut.activePct}%
              </text>
              <text
                x="60"
                y="72"
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill={isDark ? '#A4B9D1' : '#647D9E'}
              >
                ACTIVE FLYER
              </text>
            </svg>

            <div className="flex-1 min-w-0 space-y-2 text-xs ov-tabular">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: palette.emerald }}
                  />
                  Active flyer
                </span>
                <span className="font-bold">{metrics.flyerDonut.activePct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-primary)] font-semibold">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: palette.coral }}
                  />
                  Missing items
                </span>
                <span className="font-bold">{metrics.flyerDonut.missingPct}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-[var(--text-muted)]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: palette.competitorBar }}
                  />
                  Not applicable
                </span>
                <span>{metrics.flyerDonut.naPct}%</span>
              </div>
            </div>
          </div>

          {/* Stage 2: Competitor Promo Highlights */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-between gap-2.5">
            <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
              <span className="font-semibold text-[var(--text-secondary)]">
                Competitor Promo Spots
              </span>
              <span className="ov-tabular">
                {metrics.livePromos.length} Live · {metrics.demoPromos.length} Demo
              </span>
            </div>
            <div className="space-y-2 my-auto">
              {metrics.filteredCompetitorPromos.slice(0, 3).map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => onDrilldown({ type: 'promotions' })}
                  className="w-full px-3 py-2 rounded-[12px] ov-panel flex items-center justify-between gap-2.5 text-left cursor-pointer hover:border-[#008DFF]/45 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {cp.brand} · {cp.category}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      {cp.outletName} · {cp.offerDetails}
                    </div>
                  </div>
                  <ProvenanceInline
                    label={cp.provenance === 'live_verified' ? 'Live' : 'Demo'}
                    tone={cp.provenance === 'live_verified' ? 'live' : 'simulated'}
                    className="shrink-0"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ====================================================================
          6. ROW 4 (BALANCED 50 / 50): PJP PRODUCTIVITY vs FIELD WORKHOURS
         ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        {/* Left: Monthly PJP Adherence Calendar */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title={`${scheduleMeta.monthLabel} PJP Productivity`}
            provenanceLabel={
              scheduleMeta.hasVerifiedSheet2Visits ? 'Sheet 2' : 'Simulated'
            }
            provenanceTone={
              scheduleMeta.hasVerifiedSheet2Visits ? 'historical' : 'simulated'
            }
            actionLabel="Productivity"
            onAction={() => onSelectWorkspace('productivity')}
          />

          {/* Stage 1: Calendar Heatmap */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-between gap-3">
            <div>
              <div className="grid grid-cols-7 gap-1 mb-1.5">
                {DAY_NAMES.map((dn) => (
                  <span
                    key={dn}
                    className="text-center text-[10px] font-semibold text-[var(--text-muted)]"
                  >
                    {dn}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: scheduleMeta.firstWeekdayOffset }, (_, i) => (
                  <span key={`sum-cal-blank-${i}`} className="h-9" />
                ))}
                {Array.from({ length: scheduleMeta.daysInMonth }, (_, idx) => idx + 1).map(
                  (d) => {
                    const sched = scheduleMeta.scheduleByDay[d];
                    const isFuture = d > scheduleMeta.cutoffDay;
                    const inRange = dayRangeCompare(d);
                    const isSelected = scheduleMetrics.activeCalDay === d;

                    let bg = isDark ? 'rgba(255, 255, 255, 0.04)' : '#E2E8F0';
                    let fg = palette.mutedInk;
                    let border = '1px solid transparent';

                    if (sched && !isFuture) {
                      const ratio = sched.completedCount / Math.max(1, sched.plannedCount);
                      if (ratio >= 1) {
                        bg = palette.teal;
                        fg = '#FFFFFF';
                      } else if (ratio >= 0.75) {
                        bg = isDark ? 'rgba(0, 141, 255, 0.45)' : '#93C5FD';
                        fg = isDark ? '#F5F7FA' : '#0B1D36';
                      } else {
                        bg = palette.amber;
                        fg = '#0B1D36';
                      }
                    } else if (sched && isFuture) {
                      bg = isDark ? 'rgba(0, 102, 255, 0.14)' : 'rgba(0, 102, 255, 0.08)';
                      fg = palette.cyanText;
                      border = `1px dashed ${palette.cyan}`;
                    } else if (isFuture) {
                      bg = 'transparent';
                      border = `1px dashed ${palette.axisLine}`;
                    }

                    return (
                      <button
                        key={d}
                        type="button"
                        disabled={!sched}
                        onClick={() => setSelectedDay(d)}
                        style={{ backgroundColor: bg, color: fg, border }}
                        className={`h-9 rounded-lg flex flex-col items-center justify-center leading-none ov-tabular transition-all ${
                          sched ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
                        } ${!inRange && sched ? 'opacity-45' : 'opacity-100'} ${
                          isSelected ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''
                        }`}
                      >
                        <span className="text-[11px] font-bold">{d}</span>
                        {sched && (
                          <span className="text-[8.5px] font-semibold opacity-90 mt-0.5">
                            {isFuture
                              ? `${sched.plannedCount}p`
                              : `${sched.completedCount}/${sched.plannedCount}`}
                          </span>
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-[10px] text-[var(--text-muted)]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: palette.teal }}
                  />
                  100%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{
                      backgroundColor: isDark ? 'rgba(0, 141, 255, 0.45)' : '#93C5FD'
                    }}
                  />
                  ≥75%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block"
                    style={{ backgroundColor: palette.amber }}
                  />
                  &lt;75%
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="w-2.5 h-2.5 rounded-sm inline-block border border-dashed"
                    style={{ borderColor: palette.cyan }}
                  />
                  Planned
                </span>
              </div>
              <span>Tap day to sync</span>
            </div>
          </div>

          {/* Stage 2: Footer Strip */}
          <div className="ov-glass-recessed rounded-[14px] px-3.5 py-2.5 flex items-center justify-between gap-3 min-h-[54px]">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] ov-tabular truncate">
                {scheduleMetrics.daySummaryText}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Syncs directly with Field Workhours
              </div>
            </div>
            {scheduleMetrics.activeDayEntry && (
              <button
                type="button"
                onClick={() =>
                  onDrilldown({ type: 'journey', day: scheduleMetrics.activeCalDay })
                }
                className="min-h-[32px] px-3 rounded-[10px] btn-electric-blue text-[11px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <CalendarDays size={12} />
                <span>Inspect</span>
              </button>
            )}
          </div>
        </section>

        {/* Right: Field Workhours & 5-Day Activity Gantt (Mirrored 50/50 symmetry) */}
        <section className="ov-panel rounded-[22px] p-5 flex flex-col gap-4">
          <ModuleHeader
            title="Field Workhours & Activity Windows"
            provenanceLabel="Simulated"
            provenanceTone="simulated"
            actionLabel="Workhours"
            onAction={() => onSelectWorkspace('workhours')}
          />

          {/* Stage 1: 4 Telemetry Readouts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 ov-tabular">
            <div className="ov-chart-well rounded-[14px] p-3">
              <div className="text-[10px] text-[var(--text-muted)]">First Activity</div>
              <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
                {scheduleMetrics.firstActivityLabel}
              </div>
            </div>
            <div className="ov-chart-well rounded-[14px] p-3">
              <div className="text-[10px] text-[var(--text-muted)]">Last Activity</div>
              <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
                {scheduleMetrics.lastActivityLabel}
              </div>
            </div>
            <div className="ov-chart-well rounded-[14px] p-3">
              <div className="text-[10px] text-[var(--text-muted)]">Recorded Span</div>
              <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
                {scheduleMetrics.recordedSpanLabel}
              </div>
            </div>
            <div className="ov-chart-well rounded-[14px] p-3">
              <div className="text-[10px] text-[var(--text-muted)]">Audit Time</div>
              <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
                {scheduleMetrics.auditDurationLabel}
              </div>
            </div>
          </div>

          {/* Stage 2: 5-Day Segmented Gantt Timeline */}
          <div className="ov-chart-well rounded-[18px] p-4 flex-1 flex flex-col justify-center space-y-3">
            <div className="relative h-4 ml-12">
              {[8, 10, 12, 14, 16, 18].map((h) => (
                <span
                  key={h}
                  className="absolute top-0 text-[10px] ov-tabular text-[var(--text-muted)] -translate-x-1/2"
                  style={{ left: `${((h - 7) / 11) * 100}%` }}
                >
                  {h}:00
                </span>
              ))}
            </div>

            <div className="space-y-2.5">
              {scheduleMetrics.ganttDays.map((row) => (
                <div key={row.day} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDay(row.day)}
                    className={`w-10 text-left text-[11px] ov-tabular shrink-0 cursor-pointer ${
                      row.isSelected
                        ? 'font-extrabold text-[#0066FF] dark:text-[#00C8FF]'
                        : 'font-medium text-[var(--text-secondary)]'
                    }`}
                  >
                    {row.label}
                  </button>
                  <div
                    onClick={() => setSelectedDay(row.day)}
                    className={`flex-1 relative h-7 rounded-lg ov-panel cursor-pointer ${
                      row.isSelected ? 'ring-1 ring-[#008DFF]/55' : ''
                    }`}
                  >
                    <div
                      className="absolute top-[13px] h-0.5 rounded-full"
                      style={{
                        left: `${row.spanLeftPct.toFixed(2)}%`,
                        width: `${row.spanWidthPct.toFixed(2)}%`,
                        backgroundColor: palette.competitorBar
                      }}
                    />
                    {row.blocks.map((block, bIdx) => (
                      <div
                        key={bIdx}
                        title={block.title}
                        className="absolute top-1.5 h-4 rounded-sm"
                        style={{
                          left: `${block.leftPct.toFixed(2)}%`,
                          width: `${block.widthPct.toFixed(2)}%`,
                          background: row.isSelected
                            ? 'linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)'
                            : palette.teal
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stage 3: Footer Strip (Aligned with Calendar Footer) */}
          <div className="ov-glass-recessed rounded-[14px] px-3.5 py-2.5 flex items-center justify-between gap-3 min-h-[54px] text-[11px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1.5 truncate">
              <Clock size={13} className="text-[#0066FF] dark:text-[#00C8FF] shrink-0" />
              <span className="truncate">
                Selected:{' '}
                <strong className="text-[var(--text-primary)]">
                  {getWeekdayShort(
                    scheduleMeta.year,
                    scheduleMeta.month,
                    scheduleMetrics.activeCalDay
                  )}{' '}
                  {scheduleMetrics.activeCalDay} {scheduleMeta.monthShort}
                </strong>
              </span>
            </span>
            <span className="shrink-0">Gaps = unobserved transit time</span>
          </div>
        </section>
      </div>
    </div>
  );
};
