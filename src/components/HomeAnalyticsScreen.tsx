import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CalendarDays,
  ChevronDown,
  Clock,
  ClipboardCheck,
  Layers,
  LayoutGrid,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  X
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import {
  CategoryFilter,
  normalizeAccountLabel
} from '../utils/homeAnalyticsData';
import {
  compareCalendarDates,
  formatCompactCalendarDate,
  WheelDateRangePicker
} from './WheelDateRangePicker';
import {
  AccountGroupSummary,
  EvidenceViewerPayload,
  HomeAnalyticsScreenProps,
  OverviewDrilldown,
  OverviewWorkspaceId,
  PeriodPreset
} from './overview/overviewTypes';
import {
  getDohaGreetingAndDate,
  useOverviewAnalytics
} from './overview/useOverviewAnalytics';
import { GlassScopeOption, GlassScopePopover } from './overview/OverviewPrimitives';
import { OverviewSummaryView } from './overview/OverviewSummaryView';
import {
  AccountsWorkspace,
  ExecutionWorkspace,
  ProductivityWorkspace,
  SalesWorkspace,
  ShelfWorkspace,
  WorkhoursWorkspace
} from './overview/OverviewWorkspaces';
import {
  AccountDetailView,
  AvailabilityDetailView,
  DailyJourneyDetailView,
  GlobalFilterSheet,
  OutletDetailView,
  PromotionIntelligenceView,
  ShelfEvidenceViewerModal
} from './overview/OverviewDrilldowns';

const WORKSPACE_TABS: Array<{
  id: OverviewWorkspaceId;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}> = [
  { id: 'summary', label: 'All', icon: LayoutGrid },
  { id: 'sales', label: 'Sales', icon: TrendingUp },
  { id: 'accounts', label: 'Account', icon: Building2 },
  { id: 'shelf', label: 'Shelf', icon: Layers },
  { id: 'execution', label: 'Execution', icon: ClipboardCheck },
  { id: 'productivity', label: 'Productivity', icon: CalendarDays },
  { id: 'workhours', label: 'Workhours', icon: Clock }
];

const PERIOD_PRESETS: Array<{ id: PeriodPreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'wtd', label: 'WTD' },
  { id: 'mtd', label: 'MTD' },
  { id: 'custom', label: 'Custom' }
];

export const HomeAnalyticsScreen: React.FC<HomeAnalyticsScreenProps> = (props) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const analytics = useOverviewAnalytics({ ...props, isDark });

  const [activeWorkspace, setActiveWorkspace] =
    useState<OverviewWorkspaceId>('summary');
  const [drilldown, setDrilldown] = useState<OverviewDrilldown>(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState<boolean>(false);
  const [isPeriodPopoverOpen, setIsPeriodPopoverOpen] = useState<boolean>(false);
  const [evidencePayload, setEvidencePayload] =
    useState<EvidenceViewerPayload | null>(null);
  const [isDesktopViewport, setIsDesktopViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const savedSummaryScrollRef = useRef<number>(0);
  const periodPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsDesktopViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!isPeriodPopoverOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        periodPopoverRef.current &&
        !periodPopoverRef.current.contains(e.target as Node)
      ) {
        setIsPeriodPopoverOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsPeriodPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isPeriodPopoverOpen]);

  const handleSelectWorkspace = (ws: OverviewWorkspaceId) => {
    if (ws !== 'summary' && activeWorkspace === 'summary' && scrollContainerRef.current) {
      savedSummaryScrollRef.current = scrollContainerRef.current.scrollTop;
    }
    setDrilldown(null);
    setActiveWorkspace(ws);
    if (scrollContainerRef.current) {
      if (ws === 'summary') {
        requestAnimationFrame(() => {
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = savedSummaryScrollRef.current;
          }
        });
      } else {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  };

  const handleOpenDrilldown = (next: OverviewDrilldown) => {
    if (!isDesktopViewport && scrollContainerRef.current && !drilldown) {
      savedSummaryScrollRef.current = scrollContainerRef.current.scrollTop;
    }
    setDrilldown(next);
    if (!isDesktopViewport && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const handleCloseDrilldown = () => {
    setDrilldown(null);
    if (!isDesktopViewport && scrollContainerRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = savedSummaryScrollRef.current;
        }
      });
    }
  };

  const { greeting, dateLabel } = getDohaGreetingAndDate();
  const execName = props.executive?.name || 'Safwan Asif';
  const execTerritory = props.executive?.territory || 'Qatar Modern Trade';

  const activeFilterCount =
    (analytics.categoryFilter !== 'All' ? 1 : 0) +
    (analytics.accountFilter !== 'All' ? 1 : 0) +
    (analytics.outletFilter !== 'All' ? 1 : 0) +
    (analytics.periodPreset !== 'mtd' ? 1 : 0);

  const periodPresetLabel =
    PERIOD_PRESETS.find((p) => p.id === analytics.periodPreset)?.label || 'MTD';

  const compactRangeLabel =
    compareCalendarDates(analytics.fromDate, analytics.toDate) === 0
      ? formatCompactCalendarDate(analytics.fromDate)
      : `${formatCompactCalendarDate(analytics.fromDate)}–${formatCompactCalendarDate(
          analytics.toDate
        )}`;

  const isNonMtdRange =
    analytics.periodPreset !== 'mtd' ||
    compareCalendarDates(analytics.fromDate, analytics.defaultFromDate) !== 0 ||
    compareCalendarDates(analytics.toDate, analytics.defaultToDate) !== 0;

  const activeOutletLabel =
    analytics.outletFilter === 'All'
      ? 'All outlets'
      : analytics.scopedOutlets[0]?.branch || '1 outlet';

  const mobileScopeLine = `${periodPresetLabel} · ${compactRangeLabel} · ${
    analytics.categoryFilter === 'All' ? 'All categories' : analytics.categoryFilter
  } · ${
    analytics.accountFilter === 'All'
      ? activeOutletLabel
      : `${analytics.accountFilter}${
          analytics.outletFilter !== 'All' ? ` (${activeOutletLabel})` : ''
        }`
  }`;

  const activeWorkspaceLabel =
    WORKSPACE_TABS.find((t) => t.id === activeWorkspace)?.label || 'Overview';

  const categoryOptions: GlassScopeOption[] = [
    { value: 'All', label: 'All categories' },
    { value: 'Flour', label: 'Flour' },
    { value: 'Edible Oil', label: 'Edible Oil' },
    { value: 'Pasta', label: 'Pasta' }
  ];

  const accountOptions: GlassScopeOption[] = [
    {
      value: 'All',
      label: 'All accounts',
      meta: `${analytics.basePjpData.accounts.length} chains`
    },
    ...analytics.basePjpData.accounts.map((grp) => ({
      value: grp.account,
      label: grp.account,
      meta: `${grp.outlets.length} outlets`
    }))
  ];

  const outletOptions: GlassScopeOption[] = [
    {
      value: 'All',
      label: 'All outlets',
      meta: `${analytics.availableOutletsForDropdown.length} in scope`
    },
    ...analytics.availableOutletsForDropdown.map((o) => ({
      value: o.id,
      label:
        analytics.accountFilter === 'All' ? `${o.account} — ${o.branch}` : o.branch,
      meta: o.code ? `SAP ${o.code}` : o.account
    }))
  ];

  const renderDrilldownBody = () => {
    if (!drilldown) return null;
    if (drilldown.type === 'account') {
      const grp = analytics.metrics.displayAccountGroups.find(
        (g) => g.account === drilldown.account
      );
      let resolvedGroup: AccountGroupSummary | undefined = grp;
      if (!resolvedGroup) {
        const rawGrp = analytics.basePjpData.accounts.find(
          (g) => g.account === drilldown.account
        );
        if (rawGrp) {
          const fallbackOutlets = rawGrp.outlets.map((o) => {
            const filteredMton = Number(
              (
                o.mtonByCategory.Flour +
                o.mtonByCategory['Edible Oil'] +
                o.mtonByCategory.Pasta
              ).toFixed(1)
            );
            const filteredSos = Math.round(
              (o.sosByCategory.Flour +
                o.sosByCategory['Edible Oil'] +
                o.sosByCategory.Pasta) /
                3
            );
            const totalOosSkus =
              o.oosByCategory.Flour +
              o.oosByCategory['Edible Oil'] +
              o.oosByCategory.Pasta;
            return {
              ...o,
              filteredMton,
              filteredSos,
              totalOosSkus
            };
          });
          const grpMton = Number(
            fallbackOutlets.reduce((s, o) => s + o.filteredMton, 0).toFixed(1)
          );
          const grpSos =
            fallbackOutlets.length > 0
              ? Math.round(
                  fallbackOutlets.reduce((s, o) => s + o.filteredSos, 0) /
                    fallbackOutlets.length
                )
              : 0;
          resolvedGroup = {
            account: rawGrp.account,
            outlets: fallbackOutlets,
            mton: grpMton,
            sharePct: 0,
            sosPct: grpSos,
            oosTotals: {
              Flour: rawGrp.outlets.reduce((s, o) => s + o.oosByCategory.Flour, 0),
              'Edible Oil': rawGrp.outlets.reduce(
                (s, o) => s + o.oosByCategory['Edible Oil'],
                0
              ),
              Pasta: rawGrp.outlets.reduce((s, o) => s + o.oosByCategory.Pasta, 0)
            },
            oosVerifiedTotals: {
              Flour: rawGrp.outlets.some((o) => o.oosProvenanceByCategory.Flour !== 'unavailable'),
              'Edible Oil': rawGrp.outlets.some(
                (o) => o.oosProvenanceByCategory['Edible Oil'] !== 'unavailable'
              ),
              Pasta: rawGrp.outlets.some((o) => o.oosProvenanceByCategory.Pasta !== 'unavailable')
            }
          };
        }
      }
      if (!resolvedGroup) return null;
      return (
        <AccountDetailView
          accountGroup={resolvedGroup}
          onBack={handleCloseDrilldown}
          onSelectOutlet={(outletId) =>
            setDrilldown({ type: 'outlet', outletId })
          }
          onScopeToAccount={(account) => {
            analytics.handleAccountDropdownChange(account);
            handleCloseDrilldown();
          }}
        />
      );
    }
    if (drilldown.type === 'outlet') {
      const outlet = analytics.basePjpData.allOutlets.find(
        (o) => o.id === drilldown.outletId
      );
      if (!outlet) return null;
      return (
        <OutletDetailView
          outlet={outlet}
          initialCategory={
            drilldown.initialCategory ||
            (analytics.categoryFilter !== 'All' ? analytics.categoryFilter : 'Flour')
          }
          onBack={handleCloseDrilldown}
          onScopeToOutlet={(target) => {
            analytics.setAccountFilter(target.account);
            analytics.setOutletFilter(target.id);
            handleCloseDrilldown();
          }}
          onOpenEvidence={(payload) => setEvidencePayload(payload)}
        />
      );
    }
    if (drilldown.type === 'availability') {
      const outlet = analytics.basePjpData.allOutlets.find(
        (o) => o.id === drilldown.outletId
      );
      if (!outlet) return null;
      return (
        <AvailabilityDetailView
          outlet={outlet}
          category={drilldown.category}
          onBack={handleCloseDrilldown}
          onOpenOutlet={() =>
            setDrilldown({
              type: 'outlet',
              outletId: outlet.id,
              initialCategory: drilldown.category
            })
          }
          onOpenEvidence={(payload) => setEvidencePayload(payload)}
        />
      );
    }
    if (drilldown.type === 'promotions') {
      return (
        <PromotionIntelligenceView
          analytics={analytics}
          onBack={handleCloseDrilldown}
          isDark={isDark}
        />
      );
    }
    if (drilldown.type === 'journey') {
      return (
        <DailyJourneyDetailView
          analytics={analytics}
          day={drilldown.day}
          onBack={handleCloseDrilldown}
          onSelectOutlet={(outletId) =>
            setDrilldown({ type: 'outlet', outletId })
          }
        />
      );
    }
    return null;
  };

  const renderWorkspaceContent = () => {
    switch (activeWorkspace) {
      case 'sales':
        return <SalesWorkspace analytics={analytics} isDark={isDark} />;
      case 'accounts':
        return (
          <AccountsWorkspace
            analytics={analytics}
            onDrilldown={handleOpenDrilldown}
            isDark={isDark}
          />
        );
      case 'shelf':
        return (
          <ShelfWorkspace
            analytics={analytics}
            onDrilldown={handleOpenDrilldown}
            isDark={isDark}
          />
        );
      case 'execution':
        return (
          <ExecutionWorkspace
            analytics={analytics}
            onDrilldown={handleOpenDrilldown}
            onNavigateToPendingPjp={props.onNavigateToPendingPjp}
            isDark={isDark}
          />
        );
      case 'productivity':
        return (
          <ProductivityWorkspace
            analytics={analytics}
            onDrilldown={handleOpenDrilldown}
            isDark={isDark}
          />
        );
      case 'workhours':
        return <WorkhoursWorkspace analytics={analytics} isDark={isDark} />;
      default:
        return (
          <OverviewSummaryView
            analytics={analytics}
            onSelectWorkspace={handleSelectWorkspace}
            onDrilldown={handleOpenDrilldown}
            isDark={isDark}
          />
        );
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      className="ov-scope flex-1 w-full h-full overflow-y-auto overflow-x-hidden ov-atmospheric-canvas pb-[calc(92px+env(safe-area-inset-bottom,0px))] md:pb-8 px-4 md:px-6 lg:px-8 pt-3 md:pt-5"
    >
      <div className="max-w-[1620px] mx-auto space-y-3.5 md:space-y-4">
        {/* ================================================================
            A. SINGLE HEADER (Personalized Doha Greeting + Cycle & Sync)
           ================================================================ */}
        <header className="flex items-center justify-between gap-3 min-h-[52px]">
          <div className="min-w-0">
            {!isDesktopViewport && drilldown ? (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseDrilldown}
                  aria-label="Back to Overview"
                  className="w-10 h-10 rounded-full ov-panel flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[var(--text-muted)]">
                    Overview · {activeWorkspaceLabel}
                  </div>
                  <h2 className="font-heading text-2xl font-extrabold text-[var(--text-primary)] leading-none truncate">
                    Intelligence Detail
                  </h2>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-secondary)]">
                  <span className="truncate font-semibold text-[#0066FF] dark:text-[#00C8FF]">
                    {greeting}, {execName}
                  </span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--text-muted)] truncate">
                    {dateLabel}
                    <span className="hidden md:inline"> · {execTerritory}</span>
                  </span>
                </div>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <h2 className="font-heading text-[30px] md:text-[34px] font-extrabold tracking-tight text-[var(--text-primary)] leading-[0.98]">
                    Overview
                  </h2>
                  <span className="hidden sm:inline text-[11px] font-medium text-[var(--text-muted)] ov-tabular">
                    {analytics.scheduleMeta.monthLabel} PJP Cycle
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop Inline Scope Popovers aligned cleanly in header */}
            {isDesktopViewport && (
              <div className="hidden lg:flex items-center gap-1.5 mr-1">
                {/* Period + Date Wheel Popover */}
                <div ref={periodPopoverRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsPeriodPopoverOpen((prev) => !prev)}
                    aria-haspopup="dialog"
                    aria-expanded={isPeriodPopoverOpen}
                    className={`min-h-[36px] px-3 rounded-[12px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border ${
                      isPeriodPopoverOpen || isNonMtdRange
                        ? 'ov-panel border-[#0066FF]/40 dark:border-[#00C8FF]/45 text-[var(--text-primary)]'
                        : 'ov-glass-recessed text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Calendar size={13} className="text-[#0066FF] dark:text-[#00C8FF] shrink-0" />
                    <span className="font-semibold text-[var(--text-primary)] ov-tabular">
                      {periodPresetLabel} · {compactRangeLabel}
                    </span>
                    <ChevronDown
                      size={13}
                      className={`text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${
                        isPeriodPopoverOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isPeriodPopoverOpen && (
                    <div
                      role="dialog"
                      aria-label="Reporting period and custom date range"
                      className="absolute right-0 top-[calc(100%+8px)] z-50 w-[410px] max-w-[92vw] rounded-[20px] ov-glass-strong p-4 space-y-3 animate-fade-in"
                    >
                      <div className="grid grid-cols-4 gap-1 p-1 rounded-[12px] ov-glass-recessed">
                        {PERIOD_PRESETS.map((p) => {
                          const active = analytics.periodPreset === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => analytics.applyPeriodPreset(p.id)}
                              className={`min-h-[34px] rounded-[12px] text-xs font-semibold cursor-pointer transition-all ${
                                active
                                  ? 'btn-electric-blue text-white'
                                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                              }`}
                            >
                              {p.label}
                            </button>
                          );
                        })}
                      </div>

                      <WheelDateRangePicker
                        fromDate={analytics.fromDate}
                        toDate={analytics.toDate}
                        defaultFromDate={analytics.defaultFromDate}
                        defaultToDate={analytics.defaultToDate}
                        hasAnyFilters={false}
                        onChangeRange={(f, t) => {
                          analytics.applyPeriodPreset('custom');
                          analytics.setFromDate(f);
                          analytics.setToDate(t);
                        }}
                        onResetAllFilters={analytics.handleResetFilters}
                      />
                    </div>
                  )}
                </div>

                <GlassScopePopover
                  label="Category"
                  displayValue={
                    analytics.categoryFilter === 'All' ? 'All' : analytics.categoryFilter
                  }
                  value={analytics.categoryFilter}
                  options={categoryOptions}
                  onChange={(val) => analytics.setCategoryFilter(val as CategoryFilter)}
                />

                <GlassScopePopover
                  label="Account"
                  displayValue={
                    analytics.accountFilter === 'All' ? 'All' : analytics.accountFilter
                  }
                  value={analytics.accountFilter}
                  options={accountOptions}
                  onChange={(val) => analytics.handleAccountDropdownChange(val)}
                  searchable
                  searchPlaceholder="Search chain…"
                />

                <GlassScopePopover
                  label="Outlet"
                  displayValue={activeOutletLabel}
                  value={analytics.outletFilter}
                  options={outletOptions}
                  onChange={(val) => analytics.setOutletFilter(val)}
                  searchable
                  searchPlaceholder="Search outlet or SAP…"
                  align="right"
                />
              </div>
            )}

            {isDesktopViewport && analytics.hasFilters && (
              <button
                type="button"
                onClick={analytics.handleResetFilters}
                className="min-h-[36px] px-3 rounded-[12px] ov-glass-recessed text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              aria-label="Open reporting scope and filters"
              className="lg:hidden relative w-10 h-10 rounded-[12px] ov-panel flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <SlidersHorizontal size={16} />
              {activeFilterCount > 0 && (
                <span
                  aria-label={`${activeFilterCount} active filters`}
                  className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#0066FF] text-white text-[10px] font-bold flex items-center justify-center ov-tabular"
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {props.onSyncPjp && (
              <button
                type="button"
                onClick={props.onSyncPjp}
                disabled={props.isSyncingPjp}
                aria-label="Sync live PJP and Sheet 2 data"
                title="Sync live PJP & Sheet 2 data"
                className="w-10 h-10 md:w-auto md:h-auto md:min-h-[36px] md:px-3.5 rounded-[12px] ov-panel text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  size={15}
                  className={props.isSyncingPjp ? 'animate-spin text-[#00C8FF]' : 'text-[#0066FF] dark:text-[#00C8FF]'}
                />
                <span className="hidden md:inline">
                  {props.isSyncingPjp ? 'Syncing…' : 'Sync PJP'}
                </span>
              </button>
            )}
          </div>
        </header>

        {/* ================================================================
            GEOINTEL CONTEXT BANNER (Only when routed from Map selection)
           ================================================================ */}
        {props.selectedMapOutlet && (
          <div className="ov-panel-elevated rounded-[14px] px-3.5 py-2 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF]">
                GeoIntel Context · {props.selectedMapOutlet.id}
              </span>
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {props.selectedMapOutlet.name} · {props.selectedMapOutlet.area}
              </p>
            </div>
            {props.onClearMapOutlet && (
              <button
                type="button"
                onClick={() => {
                  props.onClearMapOutlet?.();
                  analytics.handleResetFilters();
                }}
                className="min-h-[32px] px-2.5 rounded-[12px] ov-glass-recessed text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {/* ================================================================
            B. MOBILE COMPACT FILTER STRIP + 7-TAB SCROLLABLE RAIL (< 768px)
           ================================================================ */}
        {!isDesktopViewport && !drilldown && (
          <div className="space-y-2.5">
            {/* Compact Period Presets + Scope Trigger */}
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1 p-1 rounded-[12px] ov-glass-recessed shrink-0">
                {PERIOD_PRESETS.filter((p) => p.id !== 'custom').map((p) => {
                  const active = analytics.periodPreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => analytics.applyPeriodPreset(p.id)}
                      className={`min-h-[28px] px-2.5 rounded-[9px] text-[11px] font-semibold cursor-pointer transition-colors ${
                        active
                          ? 'btn-electric-blue text-white'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsFilterSheetOpen(true)}
                className="flex-1 min-w-0 min-h-[34px] px-2.5 rounded-[12px] ov-panel inline-flex items-center justify-between gap-1.5 text-[11px] font-medium text-[var(--text-secondary)] cursor-pointer"
              >
                <span className="truncate ov-tabular">{mobileScopeLine}</span>
                <ChevronDown size={13} className="text-[var(--text-muted)] shrink-0" />
              </button>

              {analytics.hasFilters && (
                <button
                  type="button"
                  onClick={analytics.handleResetFilters}
                  aria-label="Reset filters"
                  className="min-h-[34px] px-2.5 rounded-[12px] ov-glass-recessed text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] shrink-0 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {isNonMtdRange && (
              <p className="text-[11px] text-[var(--text-muted)] leading-snug px-0.5">
                Sales &amp; PJP follow selected dates · SOS, Planogram &amp; Availability reflect latest audits
              </p>
            )}

            {/* Mobile Horizontally Scrollable 7-Tab Analytical Rail */}
            <LayoutGroup id="ov-mobile-workspaces">
              <div
                className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5"
                role="tablist"
                aria-label="Overview analytical domains"
              >
                {WORKSPACE_TABS.map((tab) => {
                  const active = activeWorkspace === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSelectWorkspace(tab.id)}
                      className={`relative min-h-[36px] px-3 rounded-[12px] text-xs font-semibold flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors ${
                        active
                          ? 'text-white'
                          : 'ov-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="ov-mobile-tab-pill"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 460, damping: 34 }
                          }
                          className="absolute inset-0 rounded-[12px] btn-electric-blue"
                        />
                      )}
                      <Icon size={13} className="relative z-10 shrink-0" />
                      <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>
        )}

        {/* ================================================================
            DESKTOP / TABLET BALANCED 7-TAB SEGMENTED BAR (md+)
           ================================================================ */}
        <div className="hidden md:block space-y-1.5 relative z-20">
          <div className="ov-panel rounded-[16px] p-1.5">
            <LayoutGroup id="ov-desktop-workspaces">
              <div
                className="grid grid-cols-7 gap-1"
                role="tablist"
                aria-label="Overview analytical domains"
              >
                {WORKSPACE_TABS.map((tab) => {
                  const active = activeWorkspace === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => handleSelectWorkspace(tab.id)}
                      className={`relative min-h-[36px] px-2 rounded-[11px] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                        active
                          ? 'text-white'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="ov-desktop-tab-pill"
                          transition={
                            shouldReduceMotion
                              ? { duration: 0 }
                              : { type: 'spring', stiffness: 460, damping: 34 }
                          }
                          className="absolute inset-0 rounded-[11px] btn-electric-blue"
                        />
                      )}
                      <Icon size={13} className="relative z-10 shrink-0" />
                      <span className="relative z-10 truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
          </div>

          {isNonMtdRange && (
            <p className="text-[11px] text-[var(--text-muted)] px-1">
              Sales pace &amp; PJP follow selected dates · SOS, Planogram &amp; Availability reflect latest outlet audits
            </p>
          )}
        </div>

        {/* ================================================================
            VIEWPORT: Mobile Drilldown vs Active Workspace
           ================================================================ */}
        <AnimatePresence mode="wait">
          {!isDesktopViewport && drilldown ? (
            <motion.div
              key={`mobile-drilldown-${drilldown.type}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderDrilldownBody()}
            </motion.div>
          ) : (
            <motion.div
              key={`workspace-${activeWorkspace}`}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {renderWorkspaceContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ================================================================
          DESKTOP CONTEXTUAL RIGHT SIDE DRAWER (md+)
         ================================================================ */}
      {isDesktopViewport &&
        drilldown &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="ov-scope fixed inset-0 z-[65] flex justify-end"
            role="dialog"
            aria-modal="true"
            aria-label="Intelligence Detail Drawer"
          >
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-xs"
              onClick={handleCloseDrilldown}
              aria-hidden="true"
            />
            <aside
              className={`relative z-10 w-full max-w-xl h-full overflow-y-auto p-5 border-l shadow-2xl backdrop-blur-2xl animate-fade-in ${
                isDark
                  ? 'bg-[#04152B]/96 border-[#00C8FF]/22'
                  : 'bg-[#F4F7FB]/98 border-[#0066FF]/18'
              }`}
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF]">
                  Contextual Drilldown
                </span>
                <button
                  type="button"
                  onClick={handleCloseDrilldown}
                  aria-label="Close side drawer"
                  className="w-9 h-9 rounded-full ov-glass-recessed flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              {renderDrilldownBody()}
            </aside>
          </div>,
          document.body
        )}

      {/* ================================================================
          MOBILE LIQUID GLASS FILTER SHEET & EVIDENCE VIEWER MODAL
         ================================================================ */}
      <GlobalFilterSheet
        isOpen={isFilterSheetOpen}
        onClose={() => setIsFilterSheetOpen(false)}
        analytics={analytics}
        isDark={isDark}
      />

      <ShelfEvidenceViewerModal
        payload={evidencePayload}
        onClose={() => setEvidencePayload(null)}
        isDark={isDark}
      />
    </div>
  );
};

export type _KeepHelper = typeof normalizeAccountLabel;
