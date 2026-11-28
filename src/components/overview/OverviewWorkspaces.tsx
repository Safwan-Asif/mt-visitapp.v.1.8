import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { CategoryType } from '../../types';
import { formatShortCalendarDate } from '../WheelDateRangePicker';
import { OverviewDrilldown } from './overviewTypes';
import { PromotionIntelligencePanels } from './OverviewDrilldowns';
import {
  EmptyScopeState,
  getPlanogramRingSegments,
  InteractiveSosTrendChart,
  InteractiveTrajectoryChart,
  ProvenanceInline,
  SignatureSalesGauge
} from './OverviewPrimitives';
import { getWeekdayShort, useOverviewAnalytics } from './useOverviewAnalytics';

type AnalyticsController = ReturnType<typeof useOverviewAnalytics>;

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* =========================================================================
   1. SALES INTELLIGENCE WORKSPACE
   ========================================================================= */
export const SalesWorkspace: React.FC<{
  analytics: AnalyticsController;
  isDark: boolean;
}> = ({ analytics, isDark }) => {
  const { metrics, palette, fromDate, toDate, isEmptyScope, handleResetFilters } =
    analytics;

  if (isEmptyScope) return <EmptyScopeState onResetFilters={handleResetFilters} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5">
          <SignatureSalesGauge
            {...metrics.gauge}
            isDark={isDark}
            periodLabel={`${formatShortCalendarDate(fromDate)} – ${formatShortCalendarDate(
              toDate
            )}`}
            compact
          />
        </div>

        <div className="lg:col-span-7 ov-glass rounded-[24px] p-5 flex flex-col justify-between space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Cumulative Sales vs Target Trajectory
                </h3>
                <ProvenanceInline label="· Simulated" tone="simulated" />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Drag or tap across points to inspect daily cumulative MTON and schedule variance
              </p>
            </div>
          </div>

          <InteractiveTrajectoryChart
            points={metrics.trajectoryPoints}
            targetTotal={metrics.gauge.target}
            startLabel={metrics.salesRangeLabels.startLabel}
            midLabel={metrics.salesRangeLabels.midLabel}
            endLabel={metrics.salesRangeLabels.endLabel}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Category Achievement Breakdown */}
      <div className="ov-glass rounded-[24px] p-5 space-y-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Achievement by Sub-Category
            </h3>
            <ProvenanceInline label="· Simulated" tone="simulated" />
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">
            Vertical tick = 100% target
          </span>
        </div>

        <div className="space-y-3">
          {metrics.subCategories.map((row) => (
            <div
              key={row.label}
              className={`flex items-center gap-3 transition-opacity ${
                row.dimmed ? 'opacity-35' : 'opacity-100'
              }`}
            >
              <span className="w-20 text-xs font-semibold text-[var(--text-primary)] shrink-0">
                {row.label}
              </span>
              <div
                className="flex-1 h-3.5 rounded-lg relative overflow-visible"
                style={{ backgroundColor: palette.neutralTrack }}
              >
                <div
                  className="h-full rounded-lg transition-all duration-300"
                  style={{
                    width: `${row.widthPct}%`,
                    backgroundColor: row.onPace ? palette.cyan : palette.amber
                  }}
                />
                <div
                  className="absolute top-[-3px] w-0.5 h-5"
                  style={{ left: '83.3%', backgroundColor: palette.primaryInk }}
                  aria-hidden="true"
                />
              </div>
              <span className="w-11 text-right text-xs font-extrabold ov-tabular text-[var(--text-primary)]">
                {row.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   2. ACCOUNT INTELLIGENCE WORKSPACE
   ========================================================================= */
export const AccountsWorkspace: React.FC<{
  analytics: AnalyticsController;
  onDrilldown: (d: OverviewDrilldown) => void;
  isDark: boolean;
}> = ({ analytics, onDrilldown, isDark }) => {
  const { metrics, palette, categoryFilter, isEmptyScope, handleResetFilters } =
    analytics;
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  if (isEmptyScope) return <EmptyScopeState onResetFilters={handleResetFilters} />;

  const focusedLabel = hoveredSegment || selectedSegment;
  const activeSeg = focusedLabel
    ? metrics.accountDonutSegments.find((s) => s.label === focusedLabel)
    : null;
  const maxAccMton = Math.max(1, metrics.displayAccountGroups[0]?.mton || 1);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Interactive Segmented Donut Card */}
      <div className="ov-glass rounded-[24px] p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                MTON Contribution Share
              </h3>
              <ProvenanceInline label="· Simulated allocation" tone="simulated" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Hover or tap any chain segment to isolate territory volume share
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeSeg && activeSeg.label !== 'Other accounts' && (
              <button
                type="button"
                onClick={() => onDrilldown({ type: 'account', account: activeSeg.label })}
                className="min-h-[30px] px-2.5 rounded-xl ov-glass-recessed text-[11px] font-bold text-[#0066FF] dark:text-[#00C8FF] hover:brightness-105 cursor-pointer flex items-center gap-1"
              >
                <span>Inspect {activeSeg.label}</span>
                <ChevronRight size={12} />
              </button>
            )}
            {selectedSegment && (
              <button
                type="button"
                onClick={() => setSelectedSegment(null)}
                className="min-h-[30px] px-2.5 rounded-xl ov-glass-recessed text-[11px] font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                Show all
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-8">
          <div className="relative mx-auto lg:mx-0 shrink-0 flex items-center justify-center">
            <div
              aria-hidden="true"
              className="absolute inset-4 rounded-full blur-2xl pointer-events-none transition-all duration-300"
              style={{
                background: activeSeg
                  ? `radial-gradient(circle, ${activeSeg.color}38 0%, transparent 72%)`
                  : isDark
                  ? 'radial-gradient(circle, rgba(0,200,255,0.18) 0%, transparent 72%)'
                  : 'radial-gradient(circle, rgba(0,102,255,0.14) 0%, transparent 72%)'
              }}
            />

            <svg
              viewBox="-10 -10 140 140"
              className="relative w-[224px] h-[224px] sm:w-[252px] sm:h-[252px] shrink-0 overflow-visible"
              role="img"
              aria-label="MTON sales share by account"
            >
              {/* Subtle recessed background track */}
              <circle
                cx="60"
                cy="60"
                r="40"
                fill="none"
                stroke={palette.neutralTrack}
                strokeWidth="15"
              />
              {/* Subtle inner glass disc */}
              <circle
                cx="60"
                cy="60"
                r="28.5"
                fill={isDark ? 'rgba(6, 28, 53, 0.72)' : 'rgba(255, 255, 255, 0.85)'}
                stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(11,29,54,0.07)'}
                strokeWidth="1"
              />

              {metrics.accountDonutSegments.map((seg) => {
                const isFocused = focusedLabel === seg.label;
                const isDimmed = Boolean(focusedLabel) && !isFocused;
                return (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={isFocused ? '19' : '15'}
                    strokeDasharray={seg.dash}
                    strokeDashoffset={seg.off}
                    transform="rotate(-90 60 60)"
                    opacity={isDimmed ? 0.28 : 1}
                    style={{
                      filter: isFocused ? `drop-shadow(0 0 6px ${seg.color}99)` : undefined
                    }}
                    className="cursor-pointer transition-all duration-200"
                    onMouseEnter={() => setHoveredSegment(seg.label)}
                    onMouseLeave={() => setHoveredSegment(null)}
                    onClick={() =>
                      setSelectedSegment((prev) =>
                        prev === seg.label ? null : seg.label
                      )
                    }
                  />
                );
              })}

              <text
                x="60"
                y="45"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="700"
                letterSpacing="0.06em"
                fill={isDark ? '#7EA3CC' : '#647D9E'}
              >
                {(activeSeg ? activeSeg.label : 'TERRITORY MIX').slice(0, 14).toUpperCase()}
              </text>
              <text
                x="60"
                y="64"
                textAnchor="middle"
                className="font-heading"
                fontSize="21"
                fontWeight="800"
                fill={isDark ? '#F5F7FA' : '#0B1D36'}
              >
                {Math.round(activeSeg ? activeSeg.mton : metrics.totalMton)}
              </text>
              <text
                x="60"
                y="76"
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="600"
                fill={activeSeg ? activeSeg.color : isDark ? '#A4B8D4' : '#647D9E'}
              >
                {activeSeg
                  ? `${activeSeg.sharePct}% share`
                  : `${metrics.displayAccountGroups.length} chains · MTON`}
              </text>
            </svg>
          </div>

          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {metrics.accountDonutSegments.map((seg) => {
              const isSelected = selectedSegment === seg.label;
              const isHovered = hoveredSegment === seg.label;
              const isDimmed = Boolean(focusedLabel) && focusedLabel !== seg.label;
              return (
                <button
                  key={seg.label}
                  type="button"
                  onMouseEnter={() => setHoveredSegment(seg.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() =>
                    setSelectedSegment((prev) =>
                      prev === seg.label ? null : seg.label
                    )
                  }
                  className={`p-3 rounded-2xl text-left transition-all cursor-pointer border space-y-2 ${
                    isSelected || isHovered
                      ? 'ov-glass-strong border-[#0066FF]/50 dark:border-[#00C8FF]/50 shadow-sm'
                      : 'ov-glass-recessed border-transparent'
                  } ${isDimmed ? 'opacity-50' : 'opacity-100'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {seg.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-extrabold ov-tabular shrink-0"
                      style={{ color: seg.color }}
                    >
                      {seg.sharePct}%
                    </span>
                  </div>

                  <div className="text-[11px] font-medium text-[var(--text-secondary)] ov-tabular">
                    {seg.mton} MTON sold
                  </div>

                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: palette.neutralTrack }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min(100, Math.max(4, seg.sharePct))}%`,
                        backgroundColor: seg.color
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Ranked Expandable Account -> Outlet Hierarchy */}
      <div className="ov-glass rounded-[24px] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--text-primary)]">
              Account Ranking ({metrics.displayAccountGroups.length})
            </span>
            <span className="hidden sm:inline-flex items-center gap-3 text-[11px] text-[var(--text-muted)]">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#008DFF]" />
                Metric Ton Sold
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                SOS %
              </span>
            </span>
          </div>
          <span className="text-[var(--text-muted)]">Category: {categoryFilter}</span>
        </div>

        <div className="space-y-2.5">
          {metrics.displayAccountGroups.map((grp, idx) => {
            const isExpanded = Boolean(expandedAccounts[grp.account]);
            const accColor = palette.accountPalette[idx % palette.accountPalette.length];
            const mtonPct = Math.min(100, Math.max(4, (grp.mton / maxAccMton) * 100));
            const sosWidthPct = Math.min(100, Math.max(0, grp.sosPct));
            const maxChildMton = Math.max(
              1,
              ...grp.outlets.map((child) => child.filteredMton)
            );

            return (
              <div key={grp.account} className="ov-glass-recessed rounded-2xl overflow-hidden">
                <div className="p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAccounts((prev) => ({
                          ...prev,
                          [grp.account]: !prev[grp.account]
                        }))
                      }
                      aria-expanded={isExpanded}
                      className="flex-1 min-w-0 flex items-center gap-2.5 text-left cursor-pointer"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: accColor }}
                      />
                      <span className="text-sm font-bold text-[var(--text-primary)] truncate">
                        {grp.account}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] ov-tabular shrink-0">
                        {grp.outlets.length} stores
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={15} className="text-[var(--text-muted)] shrink-0" />
                      ) : (
                        <ChevronRight size={15} className="text-[var(--text-muted)] shrink-0" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDrilldown({ type: 'account', account: grp.account })}
                      className="min-h-[32px] px-2.5 rounded-xl ov-glass text-[11px] font-bold text-[#0066FF] dark:text-[#00C8FF] shrink-0 cursor-pointer"
                    >
                      Detail
                    </button>
                  </div>

                  {/* Dual Metric Bars: Metric Ton Sold & SOS % */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] ov-tabular">
                        <span className="text-[var(--text-secondary)] font-medium">
                          Metric Ton Sold
                        </span>
                        <span className="font-bold text-[var(--text-primary)]">
                          {grp.mton} MTON
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: palette.neutralTrack }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${mtonPct.toFixed(1)}%`,
                            background: 'linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)'
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] ov-tabular">
                        <span className="text-[var(--text-secondary)] font-medium">
                          SOS %
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {grp.sosPct}%
                        </span>
                      </div>
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: palette.neutralTrack }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${sosWidthPct.toFixed(1)}%`,
                            background: 'linear-gradient(90deg, #0D9488 0%, #34D399 100%)'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-3.5 py-2.5 space-y-2 animate-fade-in">
                    {grp.outlets.map((child, cIdx) => {
                      const childMtonPct = Math.min(
                        100,
                        Math.max(4, (child.filteredMton / maxChildMton) * 100)
                      );
                      const childSosPct = Math.min(100, Math.max(0, child.filteredSos));
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() =>
                            onDrilldown({ type: 'outlet', outletId: child.id })
                          }
                          className="w-full p-2.5 rounded-xl ov-glass space-y-2 text-left cursor-pointer hover:border-[#0066FF]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="text-[11px] font-mono text-[var(--text-muted)] w-5 ov-tabular">
                                {cIdx + 1}.
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                                  {child.branch}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] ov-tabular">
                                  {child.code ? `SAP ${child.code}` : child.account}
                                  {child.hasLiveAudit
                                    ? ' · Live audit'
                                    : child.hasSheet2Audit
                                    ? ' · Sheet 2'
                                    : ''}
                                </div>
                              </div>
                            </div>
                            <ChevronRight size={13} className="text-[var(--text-muted)] shrink-0" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-7">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] ov-tabular">
                                <span className="text-[var(--text-muted)]">Metric Ton Sold</span>
                                <span className="font-bold text-[var(--text-primary)]">
                                  {child.filteredMton} MTON
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: palette.neutralTrack }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${childMtonPct.toFixed(1)}%`,
                                    background: 'linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] ov-tabular">
                                <span className="text-[var(--text-muted)]">SOS %</span>
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {child.filteredSos}%
                                </span>
                              </div>
                              <div
                                className="h-1.5 rounded-full overflow-hidden"
                                style={{ backgroundColor: palette.neutralTrack }}
                              >
                                <div
                                  className="h-full rounded-full"
                                  style={{
                                    width: `${childSosPct.toFixed(1)}%`,
                                    background: 'linear-gradient(90deg, #0D9488 0%, #34D399 100%)'
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   3. SHELF & AVAILABILITY INTELLIGENCE WORKSPACE
   ========================================================================= */
export const ShelfWorkspace: React.FC<{
  analytics: AnalyticsController;
  onDrilldown: (d: OverviewDrilldown) => void;
  isDark: boolean;
}> = ({ analytics, onDrilldown, isDark }) => {
  const {
    metrics,
    palette,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    outletFilter,
    isEmptyScope,
    handleResetFilters
  } = analytics;
  const [expandedOosAccounts, setExpandedOosAccounts] = useState<Record<string, boolean>>({});

  if (isEmptyScope) return <EmptyScopeState onResetFilters={handleResetFilters} />;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Category Own vs Competitor + Interactive SOS Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ov-glass rounded-[24px] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                SOS by Category: Own vs Competitors
              </h3>
              <p className="text-[11px] text-[var(--text-muted)]">
                Tap a category bar to isolate its trend & heatmap focus
              </p>
            </div>
            {categoryFilter !== 'All' && (
              <button
                type="button"
                onClick={() => setCategoryFilter('All')}
                className="text-[11px] font-bold text-[#0066FF] dark:text-[#00C8FF] cursor-pointer"
              >
                Show all
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {metrics.sosCategoryRows.map((row) => (
              <button
                key={row.category}
                type="button"
                onClick={() =>
                  setCategoryFilter((prev) =>
                    prev === row.category ? 'All' : row.category
                  )
                }
                aria-pressed={row.selected}
                className={`w-full min-h-[48px] px-3 py-2 rounded-2xl ov-glass-recessed flex items-center gap-3 text-left cursor-pointer transition-all ${
                  row.dimmed ? 'opacity-45' : 'opacity-100'
                } ${row.selected ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''}`}
              >
                <div className="w-[76px] shrink-0">
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    {row.category}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] ov-tabular">
                    {row.verifiedOutletsInCat > 0
                      ? `${row.verifiedOutletsInCat} audited`
                      : 'Est. base'}
                  </div>
                </div>
                <div className="flex-1 h-5 rounded-md overflow-hidden flex">
                  <div
                    className="h-full flex items-center pl-2 transition-all duration-300"
                    style={{
                      width: `${Math.max(8, row.ownPct)}%`,
                      backgroundColor: palette.cyan
                    }}
                  >
                    <span className="text-[11px] font-bold text-white ov-tabular">
                      {row.ownPct}%
                    </span>
                  </div>
                  <div
                    className="h-full flex-1 transition-all duration-300"
                    style={{ backgroundColor: palette.competitorBar }}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="ov-glass rounded-[24px] p-5 space-y-3 flex flex-col justify-between">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                SOS Trend ({categoryFilter === 'All' ? 'All Categories' : categoryFilter})
              </h3>
              <ProvenanceInline
                label={
                  metrics.sosTrendProvenance === 'historical_verified'
                    ? 'Sheet 2 Historical Observations'
                    : 'Simulated baseline trend'
                }
                tone={
                  metrics.sosTrendProvenance === 'historical_verified'
                    ? 'historical'
                    : 'simulated'
                }
              />
            </div>
          </div>
          <InteractiveSosTrendChart points={metrics.sosTrendPoints} isDark={isDark} />
        </div>
      </div>

      {/* Brand-Level Facing Breakdown from Live Audits */}
      <div className="ov-glass rounded-[24px] p-5 space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Brand-Level Facings Breakdown
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Live session audits · Unknown / unmapped detections tracked separately
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {metrics.brandBreakdownByCategory
            .filter((b) => categoryFilter === 'All' || b.category === categoryFilter)
            .map((catBlock) => (
              <div key={catBlock.category} className="ov-glass-recessed rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)]">
                    {catBlock.category}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] ov-tabular">
                    {catBlock.auditedOutletCount > 0
                      ? `${catBlock.auditedOutletCount} live · ${catBlock.totalFaces} faces`
                      : 'No live facings'}
                  </span>
                </div>

                {catBlock.auditedOutletCount === 0 ? (
                  <p className="text-[11px] text-[var(--text-muted)] py-1">
                    Audit {catBlock.category} on a route outlet to verify brand facings.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {catBlock.rows.map((r) => (
                      <div
                        key={r.brand}
                        className="flex items-center justify-between text-[11px] ov-tabular"
                      >
                        <span
                          className={
                            r.isOwn
                              ? 'font-semibold text-[var(--text-primary)]'
                              : 'text-[var(--text-secondary)]'
                          }
                        >
                          {r.brand}{' '}
                          <span className="text-[9px] text-[var(--text-muted)]">
                            {r.isOwn ? '· Own' : '· Comp'}
                          </span>
                        </span>
                        <span
                          className={`font-bold ${
                            r.faces === 0 ? 'text-rose-500' : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {r.faces}
                        </span>
                      </div>
                    ))}
                    {catBlock.unmappedRows.length > 0 && (
                      <div className="pt-1.5 border-t border-black/[0.06] dark:border-white/[0.08]">
                        <div className="text-[10px] font-bold text-amber-500">
                          Unknown / Unmapped ({catBlock.unmappedRows.length})
                        </div>
                        {catBlock.unmappedRows.map((u) => (
                          <div
                            key={u.brand}
                            className="flex items-center justify-between text-[11px] text-amber-400 ov-tabular"
                          >
                            <span>{u.brand}</span>
                            <span>{u.faces}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Account-to-Outlet Availability Heatmap */}
      <div className="ov-glass rounded-[24px] p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Availability Heatmap · Zero-Facing Proxy
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Expand an account and tap any outlet category cell to inspect shelf evidence
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-1">
              <span
                className="w-2.5 h-2.5 rounded-sm inline-block"
                style={{ backgroundColor: palette.cyanSoftBg }}
              />
              0 (Verified)
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
              <span className="w-2.5 h-2.5 rounded-sm inline-block bg-slate-500/30" />
              No data
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_54px_54px_54px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 px-2 text-[11px] font-semibold text-[var(--text-muted)]">
          <span>Account / Outlet</span>
          <span className="text-center">Flour</span>
          <span className="text-center">Oil</span>
          <span className="text-center">Pasta</span>
        </div>

        <div className="space-y-2">
          {metrics.displayAccountGroups.slice(0, 10).map((grp) => {
            const isExpanded =
              Boolean(expandedOosAccounts[grp.account]) ||
              accountFilter === grp.account ||
              outletFilter !== 'All';

            return (
              <div key={grp.account} className="ov-glass-recessed rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedOosAccounts((prev) => ({
                      ...prev,
                      [grp.account]: !prev[grp.account]
                    }))
                  }
                  className="w-full min-h-[48px] grid grid-cols-[1fr_54px_54px_54px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 items-center px-2.5 py-2 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0 pr-1">
                    {isExpanded ? (
                      <ChevronDown size={14} className="text-[var(--text-muted)] shrink-0" />
                    ) : (
                      <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {grp.account}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">
                        {grp.outlets.length} stores
                      </div>
                    </div>
                  </div>

                  {CATEGORIES.map((cat) => {
                    const totalCatOos = grp.oosTotals[cat];
                    const hasVerified = grp.oosVerifiedTotals[cat];
                    const isDimmed = categoryFilter !== 'All' && categoryFilter !== cat;

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
                        bg = palette.cyanSoftBg;
                        fg = palette.cyanText;
                      }
                    }

                    return (
                      <div
                        key={cat}
                        className={`h-9 rounded-lg flex items-center justify-center text-xs font-extrabold ov-tabular ${
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
                  <div className="border-t border-black/[0.06] dark:border-white/[0.08] px-2.5 py-2 space-y-1.5 animate-fade-in">
                    {grp.outlets.slice(0, 10).map((o) => (
                      <div
                        key={o.id}
                        className="grid grid-cols-[1fr_54px_54px_54px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 items-center"
                      >
                        <button
                          type="button"
                          onClick={() => onDrilldown({ type: 'outlet', outletId: o.id })}
                          className="text-left text-xs font-medium text-[var(--text-primary)] hover:text-[#0066FF] dark:hover:text-[#00C8FF] truncate pl-5 pr-1 cursor-pointer"
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
                              bg = palette.cyanSoftBg;
                              fg = palette.cyanText;
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
                              className={`h-11 rounded-[10px] text-sm font-bold ov-tabular cursor-pointer hover:brightness-95 transition-all ${
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
      </div>
    </div>
  );
};

/* =========================================================================
   4. EXECUTION & PROMOTION INTELLIGENCE WORKSPACE (Canonical 85% / 70%)
   ========================================================================= */
export const ExecutionWorkspace: React.FC<{
  analytics: AnalyticsController;
  onDrilldown: (d: OverviewDrilldown) => void;
  onNavigateToPendingPjp: () => void;
  isDark: boolean;
}> = ({ analytics, onDrilldown, onNavigateToPendingPjp, isDark }) => {
  const { canonicalPlanogram, metrics, palette, scopedOutlets, isEmptyScope, handleResetFilters } =
    analytics;
  const [bucketFilter, setBucketFilter] = useState<'ALL' | 'COMPLIANT' | 'PARTIAL' | 'NON-COMPLIANT'>('ALL');
  const [selectedPosmKey, setSelectedPosmKey] = useState<
    'shelfStrips' | 'wobblers' | 'gondola' | 'priceTag' | null
  >(null);

  if (isEmptyScope) return <EmptyScopeState onResetFilters={handleResetFilters} />;

  const ringSegments = getPlanogramRingSegments(canonicalPlanogram, isDark);
  const filteredStores = canonicalPlanogram.stores.filter(
    (s) => bucketFilter === 'ALL' || s.status === bucketFilter
  );
  const selectedPosmObj = selectedPosmKey
    ? metrics.posmMetrics.find((p) => p.key === selectedPosmKey) || null
    : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Canonical 85/70 Planogram Compliance Card */}
      <div className="ov-glass-strong rounded-[24px] p-5 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Planogram Compliance
              </h3>
              <ProvenanceInline
                label={
                  canonicalPlanogram.hasData
                    ? `${canonicalPlanogram.liveAuditCount} Live · ${canonicalPlanogram.historicalAuditCount} Sheet 2`
                    : 'No audit data'
                }
                tone={canonicalPlanogram.hasData ? 'live' : 'unavailable'}
              />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Canonical thresholds: Compliant ≥85% · Partial 70–84% · Below &lt;70%
            </p>
          </div>
          {canonicalPlanogram.hasData && (
            <span className="text-xs font-bold ov-tabular text-[var(--text-secondary)]">
              {canonicalPlanogram.evaluatedStores}/{canonicalPlanogram.totalPlannedStores} stores
            </span>
          )}
        </div>

        {canonicalPlanogram.hasData ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <svg viewBox="0 0 120 120" className="w-[126px] h-[126px] shrink-0 mx-auto sm:mx-0">
                {ringSegments.map((seg) => (
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
                  y="59"
                  textAnchor="middle"
                  className="font-heading"
                  fontSize="26"
                  fontWeight="800"
                  fill={isDark ? '#F5F7FA' : '#0B1D36'}
                >
                  {canonicalPlanogram.overallScore}%
                </text>
                <text
                  x="60"
                  y="73"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="600"
                  fill={isDark ? '#A4B8D4' : '#647D9E'}
                >
                  {canonicalPlanogram.evaluatedAudits} audits
                </text>
              </svg>

              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-2 gap-2.5 text-xs ov-tabular">
                  <div className="ov-glass-recessed rounded-2xl p-3">
                    <div className="text-[10px] text-[var(--text-muted)]">Brand Alignment</div>
                    <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
                      {canonicalPlanogram.avgBrandPct > 0
                        ? `${canonicalPlanogram.avgBrandPct}%`
                        : '—'}
                    </div>
                  </div>
                  <div className="ov-glass-recessed rounded-2xl p-3">
                    <div className="text-[10px] text-[var(--text-muted)]">Company Space</div>
                    <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
                      {canonicalPlanogram.avgCompanyPct > 0
                        ? `${canonicalPlanogram.avgCompanyPct}%`
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* Clickable Compliance Buckets */}
                <div className="grid grid-cols-3 gap-2 text-xs ov-tabular">
                  <button
                    type="button"
                    onClick={() =>
                      setBucketFilter((b) => (b === 'COMPLIANT' ? 'ALL' : 'COMPLIANT'))
                    }
                    className={`p-2 rounded-xl ov-glass-recessed text-left cursor-pointer ${
                      bucketFilter === 'COMPLIANT' ? 'ring-2 ring-emerald-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 text-emerald-500 font-bold">
                      <CheckCircle2 size={13} />
                      <span>{canonicalPlanogram.compliantCount}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Compliant ≥85%</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBucketFilter((b) => (b === 'PARTIAL' ? 'ALL' : 'PARTIAL'))
                    }
                    className={`p-2 rounded-xl ov-glass-recessed text-left cursor-pointer ${
                      bucketFilter === 'PARTIAL' ? 'ring-2 ring-amber-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <AlertTriangle size={13} />
                      <span>{canonicalPlanogram.partialCount}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Partial 70–84%</div>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBucketFilter((b) => (b === 'NON-COMPLIANT' ? 'ALL' : 'NON-COMPLIANT'))
                    }
                    className={`p-2 rounded-xl ov-glass-recessed text-left cursor-pointer ${
                      bucketFilter === 'NON-COMPLIANT' ? 'ring-2 ring-rose-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-1 text-rose-500 font-bold">
                      <ShieldAlert size={13} />
                      <span>{canonicalPlanogram.nonCompliantCount}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Below &lt;70%</div>
                  </button>
                </div>
              </div>
            </div>

            {filteredStores.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                {filteredStores.slice(0, 6).map((s) => (
                  <button
                    key={`${s.outletId}-${s.category}`}
                    type="button"
                    onClick={() =>
                      onDrilldown({
                        type: 'outlet',
                        outletId: s.outletId,
                        initialCategory: s.category
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl ov-glass-recessed flex items-center justify-between gap-2 text-xs text-left cursor-pointer hover:border-[#0066FF]/40"
                  >
                    <span className="font-bold text-[var(--text-primary)] truncate">
                      {s.branch} · {s.category}
                    </span>
                    <span
                      className={`font-extrabold ov-tabular shrink-0 ${
                        s.status === 'COMPLIANT'
                          ? 'text-emerald-500'
                          : s.status === 'PARTIAL'
                          ? 'text-amber-500'
                          : 'text-rose-500'
                      }`}
                    >
                      {s.score}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
            <div>
              <div className="text-xs font-bold text-[var(--text-primary)]">
                No Planogram Audits Recorded Yet
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Complete an outlet audit to stream canonical 85/70 Planogram scores (
                {canonicalPlanogram.activePlanogramTemplates} templates active).
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToPendingPjp}
              className="min-h-[40px] px-4 rounded-xl btn-electric-blue text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Start audit</span>
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* POSM 4-State Compliance */}
      <div className="ov-glass rounded-[24px] p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              POSM Compliance
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tracks Present, Missing, N/A, and Not Evaluated across {scopedOutlets.length} outlets
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {metrics.posmMetrics.map((row) => {
            const isSelected = selectedPosmKey === row.key;
            return (
              <button
                key={row.key}
                type="button"
                onClick={() =>
                  setSelectedPosmKey((prev) => (prev === row.key ? null : row.key))
                }
                aria-expanded={isSelected}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl ov-glass-recessed flex items-center gap-3 text-left cursor-pointer ${
                  isSelected ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''
                }`}
              >
                <span className="w-22 text-xs font-semibold text-[var(--text-primary)] shrink-0">
                  {row.label}
                </span>
                <div
                  className="flex-1 h-3 rounded-md overflow-hidden"
                  style={{ backgroundColor: palette.neutralTrack }}
                >
                  <div
                    className="h-full rounded-md transition-all duration-300"
                    style={{
                      width: `${row.pct}%`,
                      backgroundColor: row.pct >= 80 ? palette.cyan : palette.amber
                    }}
                  />
                </div>
                <span className="w-24 text-right text-xs font-bold ov-tabular text-[var(--text-primary)] shrink-0">
                  {row.verifiedCount > 0
                    ? `${row.pct}% (${row.presentCount}/${row.verifiedCount})`
                    : `${row.pct}% est`}
                </span>
              </button>
            );
          })}
        </div>

        {selectedPosmObj && (
          <div className="ov-glass-recessed rounded-2xl p-3.5 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-primary)]">
                {selectedPosmObj.label}: {selectedPosmObj.presentCount} Present ·{' '}
                {selectedPosmObj.missingCount} Missing · {selectedPosmObj.notEvaluatedCount}{' '}
                Not Evaluated
              </span>
              <button
                type="button"
                onClick={() => setSelectedPosmKey(null)}
                className="text-[11px] font-bold text-[var(--text-muted)] cursor-pointer"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
              {selectedPosmObj.outletPreview.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg ov-glass"
                >
                  <span className="truncate text-[var(--text-primary)] font-medium">
                    {item.name}
                  </span>
                  <span
                    className={`font-bold shrink-0 text-[11px] ${
                      item.state === 'Present'
                        ? 'text-emerald-500'
                        : item.state === 'Missing'
                        ? 'text-rose-500'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Promotion & Flyer Intelligence (Shown Directly Inline) */}
      <PromotionIntelligencePanels
        analytics={analytics}
        isDark={isDark}
        showSectionHeader
      />
    </div>
  );
};

/* =========================================================================
   5. PRODUCTIVITY & PJP INTELLIGENCE WORKSPACE
   ========================================================================= */
export const ProductivityWorkspace: React.FC<{
  analytics: AnalyticsController;
  onDrilldown: (d: OverviewDrilldown) => void;
  isDark: boolean;
}> = ({ analytics, onDrilldown, isDark }) => {
  const {
    executive,
    scheduleMeta,
    scheduleMetrics,
    metrics,
    palette,
    fromDate,
    toDate,
    setSelectedDay
  } = analytics;

  const dayRangeCompare = (d: number) => {
    const val = scheduleMeta.year * 10000 + scheduleMeta.month * 100 + d;
    const f = fromDate.year * 10000 + fromDate.month * 100 + fromDate.day;
    const t = toDate.year * 10000 + toDate.month * 100 + toDate.day;
    return val >= f && val <= t;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* PJP Header Summary */}
      <div className="ov-glass-strong rounded-[24px] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              {scheduleMeta.monthLabel} PJP Adherence
            </h3>
            <ProvenanceInline
              label={
                scheduleMeta.hasVerifiedSheet2Visits ? 'Sheet 2 Verified' : 'Simulated History'
              }
              tone={scheduleMeta.hasVerifiedSheet2Visits ? 'historical' : 'simulated'}
            />
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 ov-tabular">
            {executive?.name || 'Safwan Asif'} · {scheduleMetrics.workingDaysAll.length} working
            days · {metrics.pjpCompletedTotal}/{metrics.pjpPlannedTotal || 0} stops in period
          </p>
        </div>
        <div className="font-heading text-4xl font-extrabold ov-tabular text-[#0066FF] dark:text-[#00C8FF]">
          {metrics.pjpBase}%
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Calendar */}
        <div className="ov-glass rounded-[24px] p-5 space-y-3">
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((dn) => (
              <span
                key={dn}
                className="text-center text-[11px] font-semibold text-[var(--text-muted)]"
              >
                {dn}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: scheduleMeta.firstWeekdayOffset }, (_, i) => (
              <span key={`cal-blank-${i}`} className="h-12" />
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
                    bg = palette.cyan;
                    fg = isDark ? '#020D1F' : '#FFFFFF';
                  } else if (ratio >= 0.75) {
                    bg = isDark ? 'rgba(0, 102, 255, 0.45)' : '#93C5FD';
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
                    className={`h-12 rounded-[10px] flex flex-col items-center justify-center leading-tight ov-tabular transition-all ${
                      sched ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
                    } ${!inRange && sched ? 'opacity-45' : 'opacity-100'} ${
                      isSelected ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''
                    }`}
                  >
                    <span className="text-xs font-bold">{d}</span>
                    {sched && (
                      <span className="text-[9px] font-semibold opacity-90">
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

          {/* Selected Day Summary + Journey Detail CTA */}
          <div className="ov-glass-recessed rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-xs font-bold text-[var(--text-primary)] ov-tabular truncate">
                {scheduleMetrics.daySummaryText}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                Tap Inspect Journey to view planned &amp; visited stops
              </div>
            </div>
            {scheduleMetrics.activeDayEntry && (
              <button
                type="button"
                onClick={() =>
                  onDrilldown({ type: 'journey', day: scheduleMetrics.activeCalDay })
                }
                className="min-h-[36px] px-3 rounded-xl btn-electric-blue text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <CalendarDays size={12} />
                <span>Inspect</span>
              </button>
            )}
          </div>
        </div>

        {/* Visits per Day Bar Chart */}
        <div className="ov-glass rounded-[24px] p-5 flex flex-col justify-between space-y-3">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Visits per Day vs {scheduleMetrics.targetLow}–{scheduleMetrics.targetLow + 1} Target
            </h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              Tap any day bar to switch active route journey
            </p>
          </div>

          <div>
            <div className="relative h-32 flex items-end gap-1">
              <div
                aria-hidden="true"
                className="absolute inset-x-0 rounded"
                style={{
                  bottom: `${(
                    (scheduleMetrics.targetLow / scheduleMetrics.maxPlanned) *
                    128
                  ).toFixed(1)}px`,
                  height: `${(128 / scheduleMetrics.maxPlanned).toFixed(1)}px`,
                  backgroundColor: palette.cyanSoftBg
                }}
              />
              {scheduleMetrics.executedDays.map((d) => {
                const entry = scheduleMeta.scheduleByDay[d];
                const v = entry ? entry.completedCount : 0;
                const planned = entry ? entry.plannedCount : 1;
                const isActive = d === scheduleMetrics.activeCalDay;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedDay(d)}
                    title={`${d} ${scheduleMeta.monthShort}: ${v}/${planned} visits`}
                    className="flex-1 h-32 relative flex items-end cursor-pointer group"
                  >
                    <div
                      className={`w-full rounded-t transition-all ${
                        isActive ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''
                      }`}
                      style={{
                        height: `${((v / scheduleMetrics.maxPlanned) * 128).toFixed(1)}px`,
                        backgroundColor:
                          v >= scheduleMetrics.targetLow ? palette.cyan : palette.amber
                      }}
                    />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 mt-1.5">
              {scheduleMetrics.executedDays.map((d) => (
                <span
                  key={d}
                  className={`flex-1 text-center text-[10px] ov-tabular ${
                    d === scheduleMetrics.activeCalDay
                      ? 'font-extrabold text-[var(--text-primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   6. WORKHOURS & FIELD ACTIVITY INTELLIGENCE WORKSPACE
   ========================================================================= */
export const WorkhoursWorkspace: React.FC<{
  analytics: AnalyticsController;
  isDark: boolean;
}> = ({ analytics, isDark }) => {
  const { scheduleMeta, scheduleMetrics, palette, setSelectedDay } = analytics;
  const [selectedBlock, setSelectedBlock] = useState<{
    dayLabel: string;
    outletHint: string;
    startLabel: string;
    endLabel: string;
    durationMins: number;
  } | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Activity Hero Strip */}
      <div className="ov-glass-strong rounded-[24px] p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Field Activity Timeline
            </h3>
            <ProvenanceInline label="· Simulated punch intervals" tone="simulated" />
          </div>
          <Clock size={16} className="text-[#0066FF] dark:text-[#00C8FF]" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 ov-tabular">
          <div className="ov-glass-recessed rounded-2xl p-3">
            <div className="text-[10px] text-[var(--text-muted)]">First Activity</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {scheduleMetrics.firstActivityLabel}
            </div>
          </div>
          <div className="ov-glass-recessed rounded-2xl p-3">
            <div className="text-[10px] text-[var(--text-muted)]">Last Activity</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {scheduleMetrics.lastActivityLabel}
            </div>
          </div>
          <div className="ov-glass-recessed rounded-2xl p-3">
            <div className="text-[10px] text-[var(--text-muted)]">Recorded Span</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {scheduleMetrics.recordedSpanLabel}
            </div>
          </div>
          <div className="ov-glass-recessed rounded-2xl p-3">
            <div className="text-[10px] text-[var(--text-muted)]">Audit Duration</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {scheduleMetrics.auditDurationLabel}
            </div>
          </div>
        </div>
      </div>

      {/* 5-Day Field Activity Gantt + Start-Time Consistency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ov-glass rounded-[24px] p-5 space-y-3">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              5-Day Store Activity Windows
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Intervals between store blocks represent unobserved time (no continuous GPS tracking)
            </p>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="min-w-[320px]">
              <div className="relative h-4 ml-12 mb-1">
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
                      className="flex-1 relative h-7 rounded-lg ov-glass-recessed cursor-pointer"
                      onClick={() => setSelectedDay(row.day)}
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
                        <button
                          key={bIdx}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(row.day);
                            setSelectedBlock({
                              dayLabel: row.label,
                              outletHint: block.outletHint,
                              startLabel: block.startLabel,
                              endLabel: block.endLabel,
                              durationMins: block.durationMins
                            });
                          }}
                          title={block.title}
                          className="absolute top-1.5 h-4 rounded cursor-pointer hover:brightness-110"
                          style={{
                            left: `${block.leftPct.toFixed(2)}%`,
                            width: `${block.widthPct.toFixed(2)}%`,
                            backgroundColor: palette.cyan
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedBlock && (
            <div className="ov-glass-recessed rounded-2xl p-3 flex items-center justify-between text-xs ov-tabular animate-fade-in">
              <div className="min-w-0">
                <div className="font-bold text-[var(--text-primary)] truncate">
                  {selectedBlock.dayLabel} · {selectedBlock.outletHint}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  {selectedBlock.startLabel} – {selectedBlock.endLabel} ({selectedBlock.durationMins} mins · Simulated)
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="text-[11px] font-bold text-[var(--text-muted)] cursor-pointer shrink-0"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Start-time consistency */}
        <div className="ov-glass rounded-[24px] p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-baseline gap-2">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                First-Activity Consistency
              </h4>
              <ProvenanceInline label="· Simulated" tone="simulated" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)]">
              Shaded zone indicates usual 7:30 – 8:30 AM first store audit window
            </p>
          </div>

          <div>
            <div className="relative h-14 rounded-2xl ov-glass-recessed overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute top-0 bottom-0 rounded-xl"
                style={{
                  left: '16.7%',
                  width: '33.3%',
                  backgroundColor: palette.cyanSoftBg
                }}
              />
              {scheduleMetrics.startTimeDots.map((dot) => (
                <button
                  key={dot.day}
                  type="button"
                  onClick={() => setSelectedDay(dot.day)}
                  title={`${dot.day} ${scheduleMeta.monthShort} · ${dot.timeStr}`}
                  className="absolute w-3 h-3 rounded-full cursor-pointer transition-transform hover:scale-125"
                  style={{
                    left: `calc(${dot.leftPct.toFixed(2)}% - 6px)`,
                    top: `${dot.topPx}px`,
                    backgroundColor: dot.isLate ? palette.amber : palette.cyan,
                    border: dot.isSelected
                      ? `2px solid ${palette.primaryInk}`
                      : `2px solid ${isDark ? '#020D1F' : '#FFFFFF'}`
                  }}
                />
              ))}
            </div>
            <div className="relative h-4 mt-1.5 text-[10px] ov-tabular text-[var(--text-muted)]">
              <span className="absolute left-0">7:00</span>
              <span className="absolute left-[33.3%] -translate-x-1/2">8:00</span>
              <span className="absolute left-[66.6%] -translate-x-1/2">9:00</span>
              <span className="absolute right-0">10:00</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)]">
            Selected day: <strong className="text-[var(--text-primary)]">{getWeekdayShort(scheduleMeta.year, scheduleMeta.month, scheduleMetrics.activeCalDay)} {scheduleMetrics.activeCalDay} {scheduleMeta.monthShort}</strong> · {scheduleMetrics.daySummaryText}
          </p>
        </div>
      </div>
    </div>
  );
};
