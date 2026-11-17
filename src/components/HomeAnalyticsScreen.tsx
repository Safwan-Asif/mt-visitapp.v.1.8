import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  Camera,
  ShieldCheck,
  Calendar,
  RefreshCw
} from 'lucide-react';
import {
  Outlet,
  CategoryAuditRecord,
  CategoryType,
  PlanogramRecord,
  UserProfile
} from '../types';
import { CATEGORIES, MasterOutletOption } from '../constants';
import { PjpVisitRow } from '../data/pjpMasterData';
import { useTheme } from '../ThemeContext';
import {
  buildCustomerMasterAnalytics,
  CategoryFilter,
  normalizeAccountLabel
} from '../utils/homeAnalyticsData';

interface HomeAnalyticsScreenProps {
  executive: UserProfile | null;
  outlets: Outlet[];
  masterOutlets: MasterOutletOption[];
  pjpVisits: PjpVisitRow[];
  audits: Record<string, CategoryAuditRecord>;
  planograms: PlanogramRecord[];
  isSyncingPjp?: boolean;
  onSyncPjp?: () => void;
  onNavigateToPendingPjp: () => void;
}

type ViewTabId =
  | 'sales'
  | 'account'
  | 'shelf'
  | 'execution'
  | 'productivity'
  | 'workhours';

const VIEW_TABS: Array<{ id: ViewTabId; label: string }> = [
  { id: 'sales', label: 'Sales' },
  { id: 'account', label: 'Account' },
  { id: 'shelf', label: 'Shelf' },
  { id: 'execution', label: 'Execution' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'workhours', label: 'Workhours' }
];

const DAILY_BASE_SALES = [
  11, 14, 9, 16, 13, 12, 15, 10, 17, 14, 13, 16, 12, 15, 13, 14, 15, 13, 16, 14,
  12, 15, 16, 13, 14, 15, 12, 14, 15, 16, 14
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CAT_SOS_BASE: Record<CategoryType, number> = {
  Flour: 38,
  'Edible Oil': 31,
  Pasta: 29
};

const ACH_BASE: Record<CategoryType, number> = {
  Flour: 62,
  'Edible Oil': 54,
  Pasta: 66
};

function getInitials(name?: string): string {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function getTimeGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrentHeaderDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function formatHourClock(t: number): string {
  const h = Math.floor(t);
  const m = Math.round((t - h) * 60);
  return `${h}:${m < 10 ? '0' + m : m}`;
}

function generateVisitPunches(day: number, count: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let t = 7.7 + ((day * 3) % 5) * 0.12;
  for (let i = 0; i < count; i++) {
    const dur = 0.55 + ((day + i) % 3) * 0.1;
    out.push([t, t + dur]);
    t += dur + 0.45 + ((day * 2 + i) % 3) * 0.12;
    if (i === 2) t += 0.4;
  }
  return out;
}

function getWeekdayShort(year: number, month: number, day: number): string {
  return DAY_NAMES[new Date(year, month - 1, day).getDay()] || 'Mon';
}

export const HomeAnalyticsScreen: React.FC<HomeAnalyticsScreenProps> = ({
  executive,
  outlets,
  masterOutlets,
  pjpVisits,
  audits,
  planograms,
  isSyncingPjp = false,
  onSyncPjp,
  onNavigateToPendingPjp
}) => {
  const { isDark } = useTheme();

  // Global Filters (0B)
  const [fromDay, setFromDay] = useState<number>(1);
  const [toDay, setToDay] = useState<number>(17);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState<boolean>(false);
  const [pickingStep, setPickingStep] = useState<'from' | 'to'>('from');
  const [hoverDay, setHoverDay] = useState<number | null>(null);
  const datePickerRef = useRef<HTMLDivElement | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [outletFilter, setOutletFilter] = useState<string>('All');

  // Exclusive Section View Tab (0C)
  const [activeTab, setActiveTab] = useState<ViewTabId>('sales');

  // Interactive Drilldown States
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [expandedOosAccounts, setExpandedOosAccounts] = useState<Record<string, boolean>>({});
  const [selectedOosCell, setSelectedOosCell] = useState<{
    outletId: string;
    category: CategoryType;
  } | null>(null);
  const [selectedPosmKey, setSelectedPosmKey] = useState<
    'shelfStrips' | 'wobblers' | 'gondola' | 'priceTag' | null
  >(null);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(17);

  // Build Customer Master + PJP Schedule scoped to signed-in Executive
  const baseMasterData = useMemo(
    () =>
      buildCustomerMasterAnalytics(
        executive?.name || '',
        masterOutlets,
        outlets,
        pjpVisits,
        audits,
        1
      ),
    [executive?.name, masterOutlets, outlets, pjpVisits, audits]
  );

  const scheduleMeta = baseMasterData.scheduleMeta;

  // Keep selected date bounds & active calendar day aligned when executive or PJP month updates
  useEffect(() => {
    setFromDay(1);
    setToDay(scheduleMeta.cutoffDay);
    setSelectedDay(scheduleMeta.cutoffDay);
    setAccountFilter('All');
    setOutletFilter('All');
  }, [executive?.name, scheduleMeta.month, scheduleMeta.year, scheduleMeta.cutoffDay]);

  // Smooth outside-click & Escape close for Frosted Date Range Popover
  useEffect(() => {
    if (!isDatePickerOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setIsDatePickerOpen(false);
        setHoverDay(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDatePickerOpen(false);
        setHoverDay(null);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDatePickerOpen]);

  // Palette adapted to Light & Dark Glass
  const tealColor = isDark ? '#10B981' : '#0B6B63';
  const tealDarkText = isDark ? '#34D399' : '#0B4F4A';
  const tealSoftBg = isDark ? 'rgba(16, 185, 129, 0.14)' : '#E3EFEC';
  const amberColor = isDark ? '#F59E0B' : '#E0A21B';
  const crimsonColor = isDark ? '#EF4444' : '#B3452B';
  const neutralBarTrack = isDark ? 'rgba(255, 255, 255, 0.08)' : '#E9E7E0';
  const competitorColor = isDark ? '#475569' : '#C9CCD2';
  const primaryInk = isDark ? '#ECFDF5' : '#16181D';
  const mutedInk = isDark ? '#9CAEA8' : '#5B616B';
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.08)' : '#EFEDE6';
  const axisLineColor = isDark ? 'rgba(255, 255, 255, 0.16)' : '#D8D5CB';

  const accountColorPalette = [
    isDark ? '#10B981' : '#0B4F4A',
    isDark ? '#2DD4BF' : '#2A9D8F',
    isDark ? '#F59E0B' : '#E0A21B',
    isDark ? '#94A3B8' : '#8B93A0',
    isDark ? '#38BDF8' : '#2563EB'
  ];

  // Derived period bounds from user's explicit From / To selection
  const startDay = Math.max(1, Math.min(fromDay, scheduleMeta.daysInMonth));
  const endDay = Math.max(startDay, Math.min(toDay, scheduleMeta.daysInMonth));
  const observedStartDay = Math.min(scheduleMeta.cutoffDay, startDay);
  const observedEndDay = Math.max(
    observedStartDay,
    Math.min(scheduleMeta.cutoffDay, endDay)
  );
  const sliceDaysCount = Math.max(1, observedEndDay - observedStartDay + 1);
  const totalSelectedDaysCount = Math.max(1, endDay - startDay + 1);
  const periodScale = sliceDaysCount / Math.max(1, scheduleMeta.cutoffDay);

  const masterData = baseMasterData;

  const handleOpenDatePicker = (step: 'from' | 'to') => {
    if (isDatePickerOpen && pickingStep === step) {
      setIsDatePickerOpen(false);
      setHoverDay(null);
    } else {
      setPickingStep(step);
      setIsDatePickerOpen(true);
    }
  };

  const handleCalendarDayClick = (d: number) => {
    if (pickingStep === 'from') {
      setFromDay(d);
      if (d > endDay) {
        setToDay(d);
      }
      setPickingStep('to');
      setHoverDay(null);
    } else {
      if (d < startDay) {
        setFromDay(d);
        setPickingStep('to');
      } else {
        setToDay(d);
        setIsDatePickerOpen(false);
        setHoverDay(null);
      }
    }
  };

  // Cascading Outlets list dependent on selected Account (0B.4)
  const availableOutletsForDropdown = useMemo(() => {
    if (accountFilter === 'All') {
      return masterData.allOutlets;
    }
    const foundGroup = masterData.accounts.find((g) => g.account === accountFilter);
    return foundGroup ? foundGroup.outlets : [];
  }, [masterData, accountFilter]);

  const handleAccountDropdownChange = (nextAccount: string) => {
    setAccountFilter(nextAccount);
    setSelectedOosCell(null);
    if (nextAccount === 'All') {
      return;
    }
    const stillValid = masterData.accounts
      .find((g) => g.account === nextAccount)
      ?.outlets.some((o) => o.id === outletFilter);
    if (!stillValid) {
      setOutletFilter('All');
    }
  };

  // Filtered Outlets according to Account + Outlet cascading filters
  const scopedOutlets = useMemo(() => {
    let list = masterData.allOutlets;
    if (accountFilter !== 'All') {
      list = list.filter((o) => o.account === accountFilter);
    }
    if (outletFilter !== 'All') {
      list = list.filter((o) => o.id === outletFilter);
    }
    return list;
  }, [masterData, accountFilter, outletFilter]);

  // --- Global Computed Analytics ---
  const activeCategories = categoryFilter === 'All' ? CATEGORIES : [categoryFilter];

  const metrics = useMemo(() => {
    const activeSet = scopedOutlets.length > 0 ? scopedOutlets : masterData.allOutlets;

    // 1. Account aggregation (preserving Customer Master hierarchy, filtered when outlet selected)
    const displayAccountGroups = masterData.accounts
      .filter((g) => accountFilter === 'All' || g.account === accountFilter)
      .map((g) => {
        const childList = g.outlets
          .filter((o) => outletFilter === 'All' || o.id === outletFilter)
          .map((o) => {
            const mton = activeCategories.reduce(
              (sum, cat) => sum + Number((o.mtonByCategory[cat] * periodScale).toFixed(1)),
              0
            );
            const sosAvg = Math.round(
              activeCategories.reduce((sum, cat) => sum + o.sosByCategory[cat], 0) /
                activeCategories.length
            );
            const totalOosSkus = activeCategories.reduce(
              (sum, cat) => sum + o.oosByCategory[cat],
              0
            );
            return {
              ...o,
              filteredMton: Number(mton.toFixed(1)),
              filteredSos: sosAvg,
              totalOosSkus
            };
          })
          .sort((a, b) => b.filteredMton - a.filteredMton); // Sort descending by MTON

        const accountMton = childList.reduce((sum, o) => sum + o.filteredMton, 0);
        const accountSos =
          childList.length > 0
            ? Math.round(
                childList.reduce((sum, o) => sum + o.filteredSos, 0) / childList.length
              )
            : 0;
        const oosTotals: Record<CategoryType, number> = {
          Flour: childList.reduce((s, o) => s + o.oosByCategory.Flour, 0),
          'Edible Oil': childList.reduce((s, o) => s + o.oosByCategory['Edible Oil'], 0),
          Pasta: childList.reduce((s, o) => s + o.oosByCategory.Pasta, 0)
        };

        return {
          account: g.account,
          outlets: childList,
          mton: Number(accountMton.toFixed(1)),
          sosPct: accountSos,
          oosTotals
        };
      })
      .filter((g) => g.outlets.length > 0)
      .sort((a, b) => b.mton - a.mton);

    const totalMton = Number(
      displayAccountGroups.reduce((sum, g) => sum + g.mton, 0).toFixed(1)
    );

    // 2. Headline SOS & OOS % across scoped outlets
    const avgSos =
      activeSet.length > 0
        ? Math.round(
            activeSet.reduce(
              (sum, o) =>
                sum +
                activeCategories.reduce((cs, c) => cs + o.sosByCategory[c], 0) /
                  activeCategories.length,
              0
            ) / activeSet.length
          )
        : 33;

    // Total SKU slots tracked = outlets * activeCategories.length * 6 core SKUs
    const totalSkuSlots = Math.max(1, activeSet.length * activeCategories.length * 6);
    const totalOosSkus = activeSet.reduce(
      (sum, o) =>
        sum + activeCategories.reduce((cs, c) => cs + o.oosByCategory[c], 0),
      0
    );
    const oosPct = Math.min(100, Math.round((totalOosSkus / totalSkuSlots) * 100));

    // PJP % synced directly to signed-in executive's PJP schedule & route progress
    const targetOutletObj =
      outletFilter !== 'All'
        ? masterData.allOutlets.find((o) => o.id === outletFilter)
        : null;
    let pjpPlannedTotal = 0;
    let pjpCompletedTotal = 0;
    for (let d = observedStartDay; d <= observedEndDay; d++) {
      const sched = scheduleMeta.scheduleByDay[d];
      if (!sched || sched.plannedCount === 0) continue;
      if (accountFilter === 'All' && outletFilter === 'All') {
        pjpPlannedTotal += sched.plannedCount;
        pjpCompletedTotal += sched.completedCount;
      } else {
        const matchingStores = sched.outlets.filter((s) => {
          if (accountFilter !== 'All' && s.account !== accountFilter) return false;
          if (targetOutletObj) {
            const codeMatch = Boolean(targetOutletObj.code && s.code === targetOutletObj.code);
            const branchMatch = s.name
              .toLowerCase()
              .includes(targetOutletObj.branch.toLowerCase());
            return codeMatch || branchMatch;
          }
          return true;
        });
        if (matchingStores.length > 0) {
          const dayAdhRatio = sched.completedCount / Math.max(1, sched.plannedCount);
          pjpPlannedTotal += matchingStores.length;
          pjpCompletedTotal += Math.round(matchingStores.length * dayAdhRatio);
        }
      }
    }
    const liveAuditedRouteCount = activeSet.filter(
      (o) => o.isRouteOutlet && o.hasLiveAudit
    ).length;
    const pjpBase =
      pjpPlannedTotal > 0
        ? Math.min(
            100,
            Math.round(
              ((pjpCompletedTotal + liveAuditedRouteCount * 0.5) / pjpPlannedTotal) * 100
            )
          )
        : 92;

    // 3. Sales Gauge & Cumulative Curve scaled to active slice
    const scopeRatio = Math.max(
      0.08,
      Math.min(1, totalMton / Math.max(1, masterData.allOutlets.length * 10.5 * periodScale))
    );
    const monthDaysTotal = Math.max(sliceDaysCount, endDay - startDay + 1);
    const targetScale =
      startDay === 1 && endDay >= scheduleMeta.cutoffDay - 1
        ? 1
        : Math.max(0.1, monthDaysTotal / scheduleMeta.daysInMonth);

    const baseTarget =
      300 *
      (categoryFilter === 'All'
        ? 1
        : categoryFilter === 'Flour'
        ? 0.5
        : categoryFilter === 'Edible Oil'
        ? 0.3
        : 0.2);
    const scaledTarget = Math.max(
      10,
      Math.round(
        baseTarget *
          (accountFilter === 'All' && outletFilter === 'All' ? 1 : scopeRatio * 1.45) *
          targetScale
      )
    );

    const dailySlice = DAILY_BASE_SALES.slice(observedStartDay - 1, observedEndDay);
    let runningSales = 0;
    const catFactor =
      categoryFilter === 'All'
        ? 1
        : categoryFilter === 'Flour'
        ? 0.52
        : categoryFilter === 'Edible Oil'
        ? 0.28
        : 0.22;
    const accScopeMult =
      accountFilter === 'All' && outletFilter === 'All'
        ? 1
        : Math.max(0.12, scopeRatio * 1.45);

    const cumulative = dailySlice.map((val) => {
      runningSales += val * 0.82 * catFactor * accScopeMult;
      return runningSales;
    });

    const mtdMton = Math.round(cumulative[cumulative.length - 1] || 0);
    const achievementPct = Math.min(140, Math.round((mtdMton / scaledTarget) * 100));
    const pacePct = Math.min(
      100,
      Math.round((sliceDaysCount / scheduleMeta.daysInMonth) * 100)
    );
    const arcLen = Math.PI * 95;
    const phi = Math.PI * (pacePct / 100);
    const remainingMton = Math.max(0, scaledTarget - mtdMton);
    const remainingDays = Math.max(1, scheduleMeta.daysInMonth - observedEndDay);

    const W = 326;
    const H = 122;
    const ymax = Math.max(scaledTarget * 1.05, (cumulative[cumulative.length - 1] || 1) * 1.15);
    const totalXSpan = Math.max(
      sliceDaysCount,
      endDay <= scheduleMeta.cutoffDay && startDay === 1
        ? scheduleMeta.daysInMonth
        : sliceDaysCount
    );
    const xAt = (idx: number) =>
      ((sliceDaysCount === 1 ? 1 : idx / Math.max(1, totalXSpan - 1)) * W).toFixed(1);
    const yAt = (v: number) => (H - (v / ymax) * H).toFixed(1);

    const actualPath =
      sliceDaysCount === 1
        ? `M0 ${yAt(0)} L${W} ${yAt(cumulative[0] || 0)}`
        : `M${cumulative.map((v, i) => `${xAt(i)} ${yAt(v)}`).join(' L')}`;
    const lastDotX = sliceDaysCount === 1 ? String(W) : xAt(cumulative.length - 1);

    // Sub-category breakdown
    const subCategories = CATEGORIES.map((cat) => {
      const val = Math.round(
        ACH_BASE[cat] * (0.7 + 0.3 * periodScale) * (accountFilter === 'All' ? 1 : 0.96)
      );
      return {
        label: cat,
        pct: val,
        dimmed: categoryFilter !== 'All' && categoryFilter !== cat,
        onPace: val >= pacePct * 0.85,
        widthPct: Math.min(100, (val / 120) * 100)
      };
    });

    // Accounts Donut Segments (top 4 groups + "Other accounts" if >4)
    const donutBuckets: Array<{ label: string; mton: number; color: string }> = [];
    const top4 = displayAccountGroups.slice(0, 4);
    top4.forEach((g, idx) => {
      donutBuckets.push({
        label: g.account,
        mton: g.mton,
        color: accountColorPalette[idx % accountColorPalette.length]
      });
    });
    if (displayAccountGroups.length > 4) {
      const restMton = displayAccountGroups
        .slice(4)
        .reduce((sum, g) => sum + g.mton, 0);
      donutBuckets.push({
        label: 'Other accounts',
        mton: Number(restMton.toFixed(1)),
        color: accountColorPalette[4]
      });
    }
    const C = 251.327;
    let cumLen = 0;
    const donutTotal = Math.max(0.1, donutBuckets.reduce((s, b) => s + b.mton, 0));
    const accountDonutSegments = donutBuckets.map((b) => {
      const len = (b.mton / donutTotal) * C;
      const seg = {
        ...b,
        dash: `${len.toFixed(1)} ${(C - len).toFixed(1)}`,
        off: (-cumLen).toFixed(1)
      };
      cumLen += len;
      return seg;
    });

    // Shelf SOS rows & Category-Specific Historical Trendline
    const sosCategoryRows = CATEGORIES.map((cat) => {
      const avgCatSos =
        activeSet.length > 0
          ? Math.round(
              activeSet.reduce((s, o) => s + o.sosByCategory[cat], 0) / activeSet.length
            )
          : CAT_SOS_BASE[cat];
      return {
        category: cat,
        ownPct: avgCatSos,
        selected: categoryFilter === cat,
        dimmed: categoryFilter !== 'All' && categoryFilter !== cat
      };
    });

    const trendTargetBase =
      categoryFilter === 'All'
        ? avgSos
        : sosCategoryRows.find((r) => r.category === categoryFilter)?.ownPct || avgSos;
    const ymin = trendTargetBase - 12;
    const ymx = trendTargetBase + 6;
    const TH = 80;
    const trendPtsCount = Math.max(4, sliceDaysCount);
    const catSeedShift =
      categoryFilter === 'Flour' ? 2 : categoryFilter === 'Edible Oil' ? -1 : categoryFilter === 'Pasta' ? 4 : 0;
    const sosTrendPts: Array<[string, string]> = [];
    for (let i = 0; i < trendPtsCount; i++) {
      const dayOffset = observedStartDay - 1 + i;
      const v =
        trendTargetBase -
        4.5 +
        dayOffset * 0.32 +
        ((((dayOffset + catSeedShift) * 7) % 5) - 2) * 0.6;
      sosTrendPts.push([
        ((i * W) / Math.max(1, trendPtsCount - 1)).toFixed(1),
        (TH - ((v - ymin) / (ymx - ymin)) * TH).toFixed(1)
      ]);
    }
    const sosTrend = {
      path: `M${sosTrendPts.map((p) => `${p[0]} ${p[1]}`).join(' L')}`,
      dotX: sosTrendPts[sosTrendPts.length - 1][0],
      dotY: sosTrendPts[sosTrendPts.length - 1][1],
      currentPct: trendTargetBase
    };

    // Execution: Outlet-Linked POSM Compliance
    const posmDefinitions: Array<{
      key: 'shelfStrips' | 'wobblers' | 'gondola' | 'priceTag';
      label: string;
    }> = [
      { key: 'shelfStrips', label: 'Shelf strips' },
      { key: 'wobblers', label: 'Wobblers' },
      { key: 'gondola', label: 'Gondola' },
      { key: 'priceTag', label: 'Price tag' }
    ];

    const posmMetrics = posmDefinitions.map((def) => {
      const compliantOutlets = activeSet.filter((o) => o.posmStatus[def.key]);
      const missingOutlets = activeSet.filter((o) => !o.posmStatus[def.key]);
      const pct =
        activeSet.length > 0
          ? Math.round((compliantOutlets.length / activeSet.length) * 100)
          : 0;
      return {
        ...def,
        pct,
        compliantCount: compliantOutlets.length,
        totalCount: activeSet.length,
        outletPreview: activeSet.slice(0, 12).map((o) => ({
          id: o.id,
          name: o.name,
          present: o.posmStatus[def.key],
          isLive: o.hasLiveAudit
        })),
        missingCount: missingOutlets.length
      };
    });

    // Execution: Synced Flyer Promo Status Donut + Account/Outlet Flyer Items
    const catPromoAdj =
      categoryFilter === 'Flour' ? 4 : categoryFilter === 'Pasta' ? -3 : 0;
    const rawActive =
      activeSet.length > 0
        ? Math.round(
            activeSet.reduce((s, o) => s + o.flyerStatus.activePct, 0) / activeSet.length
          )
        : 62;
    const flyerActivePct = Math.max(15, Math.min(90, rawActive + catPromoAdj));
    const flyerMissingPct = Math.max(5, 90 - flyerActivePct);
    const flyerNaPct = 10;
    const pLenA = (flyerActivePct / 100) * C;
    const pLenM = (flyerMissingPct / 100) * C;
    const pLenN = (flyerNaPct / 100) * C;

    const flyerDonut = {
      activePct: flyerActivePct,
      missingPct: flyerMissingPct,
      naPct: flyerNaPct,
      segments: [
        { dash: `${pLenA.toFixed(1)} ${(C - pLenA).toFixed(1)}`, off: '0', color: tealColor },
        {
          dash: `${pLenM.toFixed(1)} ${(C - pLenM).toFixed(1)}`,
          off: (-pLenA).toFixed(1),
          color: crimsonColor
        },
        {
          dash: `${pLenN.toFixed(1)} ${(C - pLenN).toFixed(1)}`,
          off: (-(pLenA + pLenM)).toFixed(1),
          color: competitorColor
        }
      ]
    };

    const flyerBreakdownRows =
      outletFilter !== 'All'
        ? activeSet.map((o) => ({
            id: o.id,
            label: o.branch,
            present: o.flyerStatus.presentItemsPct,
            missing: o.flyerStatus.missingItemsPct,
            wrongPrice: o.flyerStatus.wrongPricePct
          }))
        : displayAccountGroups.slice(0, 6).map((g) => {
            const len = Math.max(1, g.outlets.length);
            const present = Math.round(
              g.outlets.reduce((s, o) => s + o.flyerStatus.presentItemsPct, 0) / len
            );
            const missing = Math.round(
              g.outlets.reduce((s, o) => s + o.flyerStatus.missingItemsPct, 0) / len
            );
            return {
              id: g.account,
              label: g.account,
              present,
              missing,
              wrongPrice: Math.max(2, 100 - present - missing)
            };
          });

    // Execution: Competitor Promos Filtered by Category, Account & Outlet
    const filteredCompetitorPromos = masterData.competitorPromos.filter((cp) => {
      if (categoryFilter !== 'All' && cp.category !== categoryFilter) return false;
      if (accountFilter !== 'All' && cp.account !== accountFilter) return false;
      if (outletFilter !== 'All') {
        const selectedOutletObj = masterData.allOutlets.find((o) => o.id === outletFilter);
        if (selectedOutletObj) {
          return (
            cp.outletName.toLowerCase().includes(selectedOutletObj.branch.toLowerCase()) ||
            cp.account === selectedOutletObj.account
          );
        }
      }
      return true;
    });

    // Freshness / Expiry Check across scoped route/prioritized outlets
    const freshnessRows = activeSet
      .filter((o) => o.isRouteOutlet || o.freshness.evaluated)
      .slice(0, 8);
    const freshnessPassCount = freshnessRows.filter((o) => o.freshness.passed).length;

    return {
      totalMton,
      avgSos,
      oosPct,
      pjpBase,
      gauge: {
        pct: achievementPct,
        mtd: mtdMton,
        target: scaledTarget,
        pace: pacePct,
        remaining: remainingMton,
        perDay: (remainingMton / remainingDays).toFixed(1),
        dash: `${(Math.min(achievementPct / 100, 1) * arcLen).toFixed(1)} 400`,
        tx1: (163 - 83 * Math.cos(phi)).toFixed(1),
        ty1: (118 - 83 * Math.sin(phi)).toFixed(1),
        tx2: (163 - 107 * Math.cos(phi)).toFixed(1),
        ty2: (118 - 107 * Math.sin(phi)).toFixed(1)
      },
      salesChart: {
        actualPath,
        areaPath: `${actualPath} L${lastDotX} ${H} L0 ${H} Z`,
        targetPath: `M0 ${H} L${W} ${yAt(scaledTarget)}`,
        dotX: lastDotX,
        dotY: yAt(mtdMton),
        startLabel: `${startDay} ${scheduleMeta.monthShort}`,
        midLabel:
          startDay === 1 && endDay >= scheduleMeta.cutoffDay
            ? `${scheduleMeta.cutoffDay} ${scheduleMeta.monthShort}`
            : undefined,
        endLabel: `${endDay} ${scheduleMeta.monthShort}`
      },
      subCategories,
      displayAccountGroups,
      accountDonutSegments,
      sosCategoryRows,
      sosTrend,
      posmMetrics,
      flyerDonut,
      flyerBreakdownRows,
      filteredCompetitorPromos,
      freshnessRows,
      freshnessPassCount
    };
  }, [
    scopedOutlets,
    masterData,
    scheduleMeta,
    accountFilter,
    outletFilter,
    categoryFilter,
    startDay,
    endDay,
    observedStartDay,
    observedEndDay,
    sliceDaysCount,
    periodScale,
    isDark
  ]);

  // --- LIVE Planogram Compliance Score ---
  const livePlanogram = useMemo(() => {
    const filteredRouteOutlets = outlets.filter((o) => {
      const acct = normalizeAccountLabel(o.account, o.name);
      if (accountFilter !== 'All' && acct !== accountFilter) return false;
      if (outletFilter !== 'All') {
        const targetOutlet = masterData.allOutlets.find((m) => m.id === outletFilter);
        if (targetOutlet) {
          const matchesId = o.id === targetOutlet.id;
          const matchesCode = Boolean(o.code && targetOutlet.code && o.code === targetOutlet.code);
          const matchesBranch = o.branch.toLowerCase() === targetOutlet.branch.toLowerCase();
          if (!matchesId && !matchesCode && !matchesBranch) return false;
        }
      }
      return true;
    });

    const matchingAudits: Array<{ outlet: Outlet; audit: CategoryAuditRecord }> = [];
    filteredRouteOutlets.forEach((outlet) => {
      activeCategories.forEach((cat) => {
        const record = audits[`${outlet.id}_${cat}`];
        if (record?.planogramCompliance?.hasPlanogram) {
          matchingAudits.push({ outlet, audit: record });
        }
      });
    });

    if (matchingAudits.length === 0) {
      return {
        hasData: false,
        overallScore: 0,
        compliantCount: 0,
        partialCount: 0,
        nonCompliantCount: 0,
        evaluatedAudits: 0,
        evaluatedStores: 0,
        totalPlannedStores: filteredRouteOutlets.length,
        avgBrandPct: 0,
        avgCompanyPct: 0,
        activePlanogramTemplates: planograms.length
      };
    }

    const totalScore = matchingAudits.reduce(
      (s, x) => s + (x.audit.planogramCompliance?.overallScore || 0),
      0
    );
    const totalBrandPct = matchingAudits.reduce(
      (s, x) => s + (x.audit.planogramCompliance?.brandWisePct || 0),
      0
    );
    const totalCompanyPct = matchingAudits.reduce(
      (s, x) => s + (x.audit.planogramCompliance?.companyWisePct || 0),
      0
    );

    return {
      hasData: true,
      overallScore: Math.round(totalScore / matchingAudits.length),
      compliantCount: matchingAudits.filter(
        (x) => x.audit.planogramCompliance?.overallStatus === 'COMPLIANT'
      ).length,
      partialCount: matchingAudits.filter(
        (x) => x.audit.planogramCompliance?.overallStatus === 'PARTIAL'
      ).length,
      nonCompliantCount: matchingAudits.filter(
        (x) => x.audit.planogramCompliance?.overallStatus === 'NON-COMPLIANT'
      ).length,
      evaluatedAudits: matchingAudits.length,
      evaluatedStores: new Set(matchingAudits.map((x) => x.outlet.id)).size,
      totalPlannedStores: filteredRouteOutlets.length,
      avgBrandPct: Math.round(totalBrandPct / matchingAudits.length),
      avgCompanyPct: Math.round(totalCompanyPct / matchingAudits.length),
      activePlanogramTemplates: planograms.length
    };
  }, [outlets, audits, planograms, accountFilter, outletFilter, masterData.allOutlets, activeCategories]);

  // --- Productivity & Workhours Schedule Sync from Executive PJP ---
  const scheduleMetrics = useMemo(() => {
    const workingDaysAll = Object.keys(scheduleMeta.scheduleByDay)
      .map(Number)
      .sort((a, b) => a - b);

    const executedDays = workingDaysAll.filter((d) => d <= scheduleMeta.cutoffDay);
    const activeCalDay = scheduleMeta.scheduleByDay[selectedDay]
      ? selectedDay
      : executedDays[executedDays.length - 1] || workingDaysAll[0] || scheduleMeta.cutoffDay;

    const activeDayEntry = scheduleMeta.scheduleByDay[activeCalDay];
    const activeCount = activeDayEntry ? activeDayEntry.plannedCount : 0;
    const activeCompleted = activeDayEntry ? activeDayEntry.completedCount : 0;
    const isFutureDay = activeCalDay > scheduleMeta.cutoffDay;
    const wdLabel = getWeekdayShort(scheduleMeta.year, scheduleMeta.month, activeCalDay);

    const punches =
      activeCompleted > 0 ? generateVisitPunches(activeCalDay, activeCompleted) : [];
    const daySummaryText = activeDayEntry
      ? isFutureDay
        ? `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · Planned route: ${activeCount} scheduled outlets`
        : `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · ${activeCompleted} of ${activeCount} scheduled outlets · ${
            punches.length > 0
              ? `${formatHourClock(punches[0][0])} to ${formatHourClock(
                  punches[punches.length - 1][1]
                )}`
              : 'No punches'
          }`
      : `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · Day off / no PJP visits scheduled`;

    const ganttAnchorIdx = Math.max(
      0,
      executedDays.indexOf(
        activeCalDay <= scheduleMeta.cutoffDay
          ? activeCalDay
          : executedDays[executedDays.length - 1] || 1
      )
    );
    const ganttStartIdx = Math.max(0, ganttAnchorIdx - 4);
    const ganttDays = executedDays.slice(ganttStartIdx, ganttStartIdx + 5).map((d) => {
      const entry = scheduleMeta.scheduleByDay[d];
      const visits = generateVisitPunches(d, Math.max(1, entry?.completedCount || 4));
      const first = visits[0][0];
      const last = visits[visits.length - 1][1];
      return {
        day: d,
        label: `${getWeekdayShort(scheduleMeta.year, scheduleMeta.month, d)} ${d}`,
        isSelected: d === activeCalDay,
        spanLeftPct: ((first - 7) / 11) * 100,
        spanWidthPct: ((last - first) / 11) * 100,
        blocks: visits.map((b) => ({
          leftPct: ((b[0] - 7) / 11) * 100,
          widthPct: ((b[1] - b[0]) / 11) * 100,
          title: `${formatHourClock(b[0])}–${formatHourClock(b[1])}`
        }))
      };
    });

    const startTimeDots = executedDays.map((d, i) => {
      const entry = scheduleMeta.scheduleByDay[d];
      const firstStart = generateVisitPunches(d, Math.max(1, entry?.completedCount || 4))[0][0];
      return {
        day: d,
        leftPct: ((firstStart - 7) / 3) * 100,
        topPx: 5 + (i % 3) * 12,
        isLate: firstStart > 8.2,
        isSelected: d === activeCalDay,
        timeStr: formatHourClock(firstStart)
      };
    });

    const maxPlanned = Math.max(
      6,
      ...workingDaysAll.map((d) => scheduleMeta.scheduleByDay[d]?.plannedCount || 0)
    );
    const avgPlanned =
      workingDaysAll.length > 0
        ? Math.round(
            workingDaysAll.reduce(
              (s, d) => s + (scheduleMeta.scheduleByDay[d]?.plannedCount || 0),
              0
            ) / workingDaysAll.length
          )
        : 6;

    return {
      workingDaysAll,
      executedDays,
      activeCalDay,
      activeDayEntry,
      daySummaryText,
      ganttDays,
      startTimeDots,
      maxPlanned,
      targetLow: Math.max(3, avgPlanned - 1)
    };
  }, [scheduleMeta, selectedDay]);

  const selectedOosOutletDetail = useMemo(() => {
    if (!selectedOosCell) return null;
    const found = masterData.allOutlets.find((o) => o.id === selectedOosCell.outletId);
    if (!found) return null;
    return {
      outletName: found.name,
      category: selectedOosCell.category,
      skuCount: found.oosByCategory[selectedOosCell.category],
      lastVisit: found.lastVisit,
      photoUrl: found.shelfPhotoUrl || null
    };
  }, [selectedOosCell, masterData.allOutlets]);

  const hasFilters =
    startDay !== 1 ||
    endDay !== scheduleMeta.cutoffDay ||
    categoryFilter !== 'All' ||
    accountFilter !== 'All' ||
    outletFilter !== 'All';

  const handleResetFilters = () => {
    setFromDay(1);
    setToDay(scheduleMeta.cutoffDay);
    setIsDatePickerOpen(false);
    setHoverDay(null);
    setCategoryFilter('All');
    setAccountFilter('All');
    setOutletFilter('All');
    setExpandedAccounts({});
    setExpandedOosAccounts({});
    setSelectedOosCell(null);
    setSelectedPosmKey(null);
    setSelectedPromoId(null);
    setSelectedDay(scheduleMeta.cutoffDay);
  };

  const selectedPosmObj =
    selectedPosmKey
      ? metrics.posmMetrics.find((p) => p.key === selectedPosmKey) || null
      : null;
  const selectedPromoObj =
    selectedPromoId
      ? metrics.filteredCompetitorPromos.find((p) => p.id === selectedPromoId) || null
      : null;

  return (
    <div className="flex-1 w-full h-full overflow-y-auto overflow-x-hidden pb-28 md:pb-10 px-4 md:px-6 lg:px-8 pt-4 md:pt-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* 0A. HEADER: Greeting + Role + Current Date + Territory + Sync PJP + Avatar */}
        <header className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[var(--text-primary)] leading-tight truncate">
              {getTimeGreeting()}, {executive?.name || 'Safwan Asif'}
            </h2>
            <p className="text-xs font-medium text-[var(--text-secondary)] mt-0.5 truncate tabular-nums">
              {executive?.role || 'Sales Executive'} · {formatCurrentHeaderDate()} ·{' '}
              {executive?.territory || 'Qatar Modern Trade'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onSyncPjp && (
              <button
                type="button"
                onClick={onSyncPjp}
                disabled={isSyncingPjp}
                title="Sync assigned PJP accounts & outlets"
                className="min-h-[40px] px-3 rounded-xl glass-subtle text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-60 transition-colors"
              >
                <RefreshCw size={13} className={isSyncingPjp ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">
                  {isSyncingPjp ? 'Syncing PJP' : 'Sync PJP'}
                </span>
              </button>
            )}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm shrink-0 ${
                isDark ? 'bg-[#10B981] text-[#05231C]' : 'bg-[#084C41] text-white'
              }`}
              aria-label={executive?.name || 'Executive Avatar'}
            >
              {getInitials(executive?.name)}
            </div>
          </div>
        </header>

        {/* 0B. GLOBAL FILTERS CARD: Smooth Frosted From/To Date Picker + 3-Col Cascading Filters */}
        <section className="glass-panel rounded-2xl p-3.5 md:p-4 space-y-3 relative z-20">
          {/* Row 1: Smooth Interactive Frosted Date Range Trigger & Popover */}
          <div className="relative" ref={datePickerRef}>
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-[260px] glass-subtle rounded-xl p-1 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleOpenDatePicker('from')}
                  aria-expanded={isDatePickerOpen && pickingStep === 'from'}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg flex items-center gap-2 text-left transition-all cursor-pointer ${
                    isDatePickerOpen && pickingStep === 'from'
                      ? isDark
                        ? 'bg-[#10B981]/18 text-[#ECFDF5] ring-1 ring-[#10B981]/60'
                        : 'bg-white/85 text-[#084C41] shadow-sm ring-1 ring-[#084C41]/25'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <Calendar size={14} className="text-[var(--accent-primary)] shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] leading-none">
                      From
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] tabular-nums truncate mt-0.5">
                      {startDay} {scheduleMeta.monthLabel}
                    </div>
                  </div>
                </button>

                <div className="px-1.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] tabular-nums shrink-0">
                  <ArrowRight size={13} />
                  <span className="hidden xs:inline">{totalSelectedDaysCount}d</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenDatePicker('to')}
                  aria-expanded={isDatePickerOpen && pickingStep === 'to'}
                  className={`flex-1 min-h-[40px] px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
                    isDatePickerOpen && pickingStep === 'to'
                      ? isDark
                        ? 'bg-[#10B981]/18 text-[#ECFDF5] ring-1 ring-[#10B981]/60'
                        : 'bg-white/85 text-[#084C41] shadow-sm ring-1 ring-[#084C41]/25'
                      : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-[var(--text-muted)] leading-none">
                      To
                    </div>
                    <div className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] tabular-nums truncate mt-0.5">
                      {endDay} {scheduleMeta.monthLabel}
                    </div>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                      isDatePickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {hasFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="min-h-[48px] px-3.5 rounded-xl glass-subtle text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Smooth Frosted Calendar Range Popover */}
            {isDatePickerOpen && (
              <div
                role="dialog"
                aria-label="Select From and To dates"
                className={`absolute left-0 top-full mt-2 w-full sm:w-[356px] rounded-2xl p-4 shadow-2xl border border-[var(--border-glass)] backdrop-blur-2xl z-40 animate-fade-in ${
                  isDark ? 'bg-[#0F1B17]/95' : 'bg-[#FAF9F5]/95'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div>
                    <div className="text-sm font-extrabold text-[var(--text-primary)]">
                      {scheduleMeta.monthLabel}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {pickingStep === 'from'
                        ? 'Tap a start date (From)'
                        : 'Tap an end date (To)'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg glass-subtle text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setPickingStep('from')}
                      className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                        pickingStep === 'from'
                          ? isDark
                            ? 'bg-[#10B981] text-[#05231C]'
                            : 'bg-[#084C41] text-white'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      From
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickingStep('to')}
                      className={`px-2.5 py-1 rounded-md cursor-pointer transition-colors ${
                        pickingStep === 'to'
                          ? isDark
                            ? 'bg-[#10B981] text-[#05231C]'
                            : 'bg-[#084C41] text-white'
                          : 'text-[var(--text-secondary)]'
                      }`}
                    >
                      To
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_NAMES.map((dn) => (
                    <span
                      key={dn}
                      className="text-center text-[10px] font-semibold text-[var(--text-muted)] py-1"
                    >
                      {dn}
                    </span>
                  ))}
                </div>

                <div
                  className="grid grid-cols-7 gap-y-1"
                  onMouseLeave={() => setHoverDay(null)}
                >
                  {Array.from({ length: scheduleMeta.firstWeekdayOffset }, (_, i) => (
                    <span key={`blank-${i}`} className="h-9" />
                  ))}

                  {Array.from({ length: scheduleMeta.daysInMonth }, (_, idx) => {
                    const d = idx + 1;
                    let previewStart = startDay;
                    let previewEnd = endDay;
                    if (hoverDay !== null) {
                      if (pickingStep === 'from') {
                        previewStart = hoverDay;
                        previewEnd = hoverDay > endDay ? hoverDay : endDay;
                      } else {
                        previewStart = hoverDay < startDay ? hoverDay : startDay;
                        previewEnd = hoverDay < startDay ? startDay : hoverDay;
                      }
                    }

                    const isStart = d === previewStart;
                    const isEnd = d === previewEnd;
                    const isEndpoint = isStart || isEnd;
                    const isInSpan = d > previewStart && d < previewEnd;
                    const hasScheduledPjp = Boolean(scheduleMeta.scheduleByDay[d]);

                    return (
                      <button
                        key={d}
                        type="button"
                        onMouseEnter={() => setHoverDay(d)}
                        onClick={() => handleCalendarDayClick(d)}
                        className={`relative h-9 text-xs font-bold tabular-nums flex flex-col items-center justify-center transition-all cursor-pointer ${
                          isEndpoint
                            ? isDark
                              ? 'bg-[#10B981] text-[#05231C] rounded-lg shadow-sm z-10'
                              : 'bg-[#084C41] text-white rounded-lg shadow-sm z-10'
                            : isInSpan
                            ? isDark
                              ? 'bg-[#10B981]/20 text-[#ECFDF5]'
                              : 'bg-[#084C41]/12 text-[#084C41]'
                            : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 rounded-lg'
                        }`}
                      >
                        <span>{d}</span>
                        {hasScheduledPjp && !isEndpoint && (
                          <span
                            className="w-1 h-1 rounded-full mt-0.5"
                            style={{ backgroundColor: tealColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[var(--border-glass)]">
                  <span className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                    {startDay} – {endDay} {scheduleMeta.monthShort} · {totalSelectedDaysCount}{' '}
                    day{totalSelectedDaysCount > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFromDay(1);
                        setToDay(scheduleMeta.cutoffDay);
                        setHoverDay(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsDatePickerOpen(false);
                        setHoverDay(null);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                        isDark
                          ? 'bg-[#10B981] text-[#05231C]'
                          : 'bg-[#084C41] text-white'
                      }`}
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: 3-Column Cascading Filters on Desktop (Category, Account Name, Outlet Name) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                className="min-h-[44px] px-3 rounded-xl glass-subtle text-xs sm:text-[13px] font-semibold text-[var(--text-primary)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                <option value="All" className="text-slate-900">
                  All categories
                </option>
                <option value="Flour" className="text-slate-900">
                  Flour
                </option>
                <option value="Edible Oil" className="text-slate-900">
                  Edible Oil
                </option>
                <option value="Pasta" className="text-slate-900">
                  Pasta
                </option>
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              Account Name
              <select
                value={accountFilter}
                onChange={(e) => handleAccountDropdownChange(e.target.value)}
                className="min-h-[44px] px-3 rounded-xl glass-subtle text-xs sm:text-[13px] font-semibold text-[var(--text-primary)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                <option value="All" className="text-slate-900">
                  All accounts ({masterData.accounts.length})
                </option>
                {masterData.accounts.map((grp) => (
                  <option
                    key={grp.account}
                    value={grp.account}
                    className="text-slate-900"
                  >
                    {grp.account} ({grp.outlets.length})
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-[11px] font-semibold text-[var(--text-secondary)]">
              Outlet Name
              <select
                value={outletFilter}
                onChange={(e) => {
                  setOutletFilter(e.target.value);
                  setSelectedOosCell(null);
                }}
                className="min-h-[44px] px-3 rounded-xl glass-subtle text-xs sm:text-[13px] font-semibold text-[var(--text-primary)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] cursor-pointer"
              >
                <option value="All" className="text-slate-900">
                  All outlets ({availableOutletsForDropdown.length})
                </option>
                {availableOutletsForDropdown.map((o) => (
                  <option key={o.id} value={o.id} className="text-slate-900">
                    {accountFilter === 'All' ? `${o.account} — ${o.branch}` : o.branch}
                    {o.code ? ` · ${o.code}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {/* 0C. EXCLUSIVE VIEW TABS (Single Active Card View) */}
        <nav
          aria-label="Analytics section view tabs"
          className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5"
        >
          {VIEW_TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={active}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer active:scale-[0.98] ${
                  active
                    ? isDark
                      ? 'bg-[#10B981] text-[#05231C] shadow-sm'
                      : 'bg-[#084C41] text-white shadow-sm'
                    : 'glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* 0D. EXPANDED 5-TILE KPI STRIP (5 cols desktop, 2-col wrap mobile) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 md:gap-3">
          <div className="glass-panel rounded-2xl p-3 md:p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              Achievement
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] mt-0.5">
              {metrics.gauge.pct}%
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-3 md:p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              SOS
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] mt-0.5">
              {metrics.avgSos}%
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-3 md:p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              PJP
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] mt-0.5">
              {metrics.pjpBase}%
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-3 md:p-3.5">
            <div className="text-[11px] font-semibold text-[var(--text-secondary)]">
              OOS
            </div>
            <div
              className="text-2xl font-extrabold tracking-tight tabular-nums mt-0.5"
              style={{ color: metrics.oosPct >= 15 ? crimsonColor : 'var(--text-primary)' }}
            >
              {metrics.oosPct}%
            </div>
          </div>

          <div className="col-span-2 md:col-span-1 glass-panel rounded-2xl p-3 md:p-3.5">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] truncate">
                Planogram Compliance
              </span>
              <span className="text-[10px] font-bold text-[var(--accent-primary)]">
                Live
              </span>
            </div>
            <div className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)] mt-0.5">
              {livePlanogram.hasData ? `${livePlanogram.overallScore}%` : '—'}
            </div>
          </div>
        </div>

        {/* ============================================================
            TAB 1: SALES
           ============================================================ */}
        {activeTab === 'sales' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Sales
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                Target vs achievement · MTON ({startDay} {scheduleMeta.monthShort} – {endDay}{' '}
                {scheduleMeta.monthShort})
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* 1.1 Achievement Gauge */}
              <div className="flex flex-col items-center">
                <svg
                  viewBox="0 0 326 130"
                  className="w-full max-w-[340px] h-auto"
                  role="img"
                  aria-label="Achievement gauge"
                >
                  <path
                    d="M 68 118 A 95 95 0 0 1 258 118"
                    fill="none"
                    stroke={neutralBarTrack}
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 68 118 A 95 95 0 0 1 258 118"
                    fill="none"
                    stroke={tealColor}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={metrics.gauge.dash}
                  />
                  <line
                    x1={metrics.gauge.tx1}
                    y1={metrics.gauge.ty1}
                    x2={metrics.gauge.tx2}
                    y2={metrics.gauge.ty2}
                    stroke={primaryInk}
                    strokeWidth="2.2"
                  />
                  <text
                    x="163"
                    y="98"
                    textAnchor="middle"
                    fontSize="30"
                    fontWeight="800"
                    fill={primaryInk}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {metrics.gauge.pct}%
                  </text>
                  <text
                    x="163"
                    y="116"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="600"
                    fill={mutedInk}
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {metrics.gauge.mtd} of {metrics.gauge.target} MTON
                  </text>
                </svg>

                <div className="w-full max-w-[340px] flex items-center justify-between text-xs text-[var(--text-secondary)] mt-2 tabular-nums">
                  <span>Tick = pace ({metrics.gauge.pace}%)</span>
                  <span>
                    <strong className="text-[var(--text-primary)] font-bold">
                      {metrics.gauge.remaining}
                    </strong>{' '}
                    left ·{' '}
                    <strong className="text-[var(--text-primary)] font-bold">
                      {metrics.gauge.perDay}
                    </strong>
                    /day needed
                  </span>
                </div>
              </div>

              {/* 1.2 Daily Sales vs Target Pace */}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2">
                  Daily sales vs target pace
                </div>
                <svg
                  viewBox="0 0 326 126"
                  className="w-full h-auto block"
                  role="img"
                  aria-label="Cumulative sales against target pace"
                >
                  <line x1="0" y1="125" x2="326" y2="125" stroke={axisLineColor} />
                  <line x1="0" y1="63" x2="326" y2="63" stroke={gridLineColor} />
                  <path d={metrics.salesChart.areaPath} fill={tealColor} opacity="0.14" />
                  <path
                    d={metrics.salesChart.targetPath}
                    fill="none"
                    stroke={mutedInk}
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />
                  <path
                    d={metrics.salesChart.actualPath}
                    fill="none"
                    stroke={tealColor}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={metrics.salesChart.dotX}
                    cy={metrics.salesChart.dotY}
                    r="4.5"
                    fill={tealColor}
                    stroke={isDark ? '#0B110F' : '#FFFFFF'}
                    strokeWidth="2"
                  />
                </svg>
                <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] mt-1 tabular-nums">
                  <span>{metrics.salesChart.startLabel}</span>
                  {metrics.salesChart.midLabel && <span>{metrics.salesChart.midLabel}</span>}
                  <span>{metrics.salesChart.endLabel}</span>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] mt-1.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-0.5 rounded-full inline-block"
                      style={{ backgroundColor: tealColor }}
                    />
                    Actual
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3.5 h-0 border-t-2 border-dashed inline-block"
                      style={{ borderColor: mutedInk }}
                    />
                    Target pace
                  </span>
                </div>
              </div>
            </div>

            {/* 1.3 Achievement by Sub-Category */}
            <div className="pt-4 border-t border-[var(--border-glass)]">
              <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5">
                Achievement by sub-category
              </div>
              <div className="space-y-2.5">
                {metrics.subCategories.map((row) => (
                  <div
                    key={row.label}
                    className={`flex items-center gap-2.5 transition-opacity ${
                      row.dimmed ? 'opacity-35' : 'opacity-100'
                    }`}
                  >
                    <span className="w-20 text-xs font-medium text-[var(--text-primary)] shrink-0">
                      {row.label}
                    </span>
                    <div
                      className="flex-1 h-3 rounded-md relative overflow-visible"
                      style={{ backgroundColor: neutralBarTrack }}
                    >
                      <div
                        className="h-full rounded-md transition-all duration-300"
                        style={{
                          width: `${row.widthPct}%`,
                          backgroundColor: row.onPace ? tealColor : amberColor
                        }}
                      />
                      <div
                        className="absolute top-[-3px] w-0.5 h-[18px]"
                        style={{ left: '83.3%', backgroundColor: primaryInk }}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-bold tabular-nums text-[var(--text-primary)]">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-2">
                Vertical marker = 100% of monthly target
              </p>
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 2: ACCOUNT (MTON Donut + Account-to-Outlet Drilldown)
           ============================================================ */}
        {activeTab === 'account' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Accounts
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Tap an account row to drill down into child outlets ranked by MTON contribution
              </p>
            </div>

            {/* 2.1 Overall MTON Donut Chart */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 border-b border-[var(--border-glass)]">
              <svg
                viewBox="0 0 120 120"
                className="w-[124px] h-[124px] shrink-0 mx-auto sm:mx-0"
                role="img"
                aria-label="MTON sales share by account"
              >
                {metrics.accountDonutSegments.map((seg) => (
                  <circle
                    key={seg.label}
                    cx="60"
                    cy="60"
                    r="40"
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="18"
                    strokeDasharray={seg.dash}
                    strokeDashoffset={seg.off}
                    transform="rotate(-90 60 60)"
                  />
                ))}
                <text
                  x="60"
                  y="58"
                  textAnchor="middle"
                  fontSize="17"
                  fontWeight="800"
                  fill={primaryInk}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {Math.round(metrics.totalMton)}
                </text>
                <text
                  x="60"
                  y="73"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={mutedInk}
                >
                  MTON
                </text>
              </svg>

              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {metrics.accountDonutSegments.map((seg) => (
                  <div key={seg.label} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color }}
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--text-primary)] truncate">
                        {seg.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] tabular-nums">
                        {seg.mton} MTON
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 2.2 Interactive Account-to-Outlet Accordion Drilldown Rows */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
                <span>
                  Account vs account ({metrics.displayAccountGroups.length})
                </span>
                <span className="text-[11px] font-medium text-[var(--text-muted)]">
                  Category: {categoryFilter}
                </span>
              </div>

              {metrics.displayAccountGroups.map((grp, idx) => {
                const isExpanded = Boolean(expandedAccounts[grp.account]);
                const maxAccMton = Math.max(
                  1,
                  metrics.displayAccountGroups[0]?.mton || 1
                );
                const accColor =
                  accountColorPalette[idx % accountColorPalette.length];

                return (
                  <div
                    key={grp.account}
                    className="glass-subtle rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedAccounts((prev) => ({
                          ...prev,
                          [grp.account]: !prev[grp.account]
                        }))
                      }
                      aria-expanded={isExpanded}
                      className="w-full min-h-[54px] p-3 sm:p-3.5 text-left cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: accColor }}
                        />
                        <span className="flex-1 text-sm font-bold text-[var(--text-primary)] truncate">
                          {grp.account}
                        </span>
                        <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)] shrink-0">
                          {grp.mton} MTON · {grp.sosPct}% SOS · {grp.outlets.length} outlets
                        </span>
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-[var(--text-muted)] shrink-0" />
                        ) : (
                          <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
                        )}
                      </div>

                      <div
                        className="h-2 rounded mb-1 overflow-hidden"
                        style={{ backgroundColor: neutralBarTrack }}
                      >
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${((grp.mton / maxAccMton) * 100).toFixed(1)}%`,
                            backgroundColor: tealColor
                          }}
                        />
                      </div>
                      <div
                        className="h-2 rounded overflow-hidden"
                        style={{ backgroundColor: neutralBarTrack }}
                      >
                        <div
                          className="h-full rounded transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (grp.sosPct / 65) * 100).toFixed(1)}%`,
                            backgroundColor: primaryInk
                          }}
                        />
                      </div>
                    </button>

                    {/* Expanded Inline Child Outlets Sorted Descending by MTON */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-glass)] px-3.5 py-2.5 space-y-1.5 animate-fade-in">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] pb-1">
                          <span>Child outlets (sorted by highest MTON)</span>
                          <span>MTON · SOS %</span>
                        </div>

                        {grp.outlets.map((child, cIdx) => (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => {
                              setAccountFilter(grp.account);
                              setOutletFilter(child.id);
                            }}
                            className="w-full min-h-[42px] px-2.5 py-1.5 rounded-xl flex items-center justify-between gap-2 text-left hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] w-5">
                                {cIdx + 1}.
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                                  {child.branch}
                                </div>
                                <div className="text-[10px] text-[var(--text-muted)] tabular-nums truncate">
                                  {child.code ? `SAP ${child.code}` : child.account}
                                  {child.hasLiveAudit ? ' · Live audit recorded' : ''}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-bold tabular-nums text-[var(--text-primary)] shrink-0">
                              {child.filteredMton} MTON · {child.filteredSos}% SOS
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] pt-1">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: tealColor }}
                  />
                  MTON Sold
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-3.5 h-1.5 rounded-full inline-block"
                    style={{ backgroundColor: primaryInk }}
                  />
                  SOS %
                </span>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 3: SHELF (Interactive Category SOS + Trendline + Account->Outlet OOS Heatmap)
           ============================================================ */}
        {activeTab === 'shelf' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Shelf
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Tap a category bar to isolate its SOS trend · expand an account to inspect outlet OOS counts
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* 3.1 Interactive Category SOS Tiles synced with Global Filter */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    SOS by category: own vs competitors
                  </span>
                  {categoryFilter !== 'All' && (
                    <button
                      type="button"
                      onClick={() => setCategoryFilter('All')}
                      className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                    >
                      Show all categories
                    </button>
                  )}
                </div>

                <div className="space-y-2">
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
                      className={`w-full min-h-[46px] px-3 py-2 rounded-xl glass-subtle flex items-center gap-3 text-left cursor-pointer transition-all ${
                        row.dimmed ? 'opacity-45' : 'opacity-100'
                      } ${
                        row.selected
                          ? isDark
                            ? 'ring-2 ring-[#10B981]'
                            : 'ring-2 ring-[#084C41]'
                          : 'hover:brightness-95'
                      }`}
                    >
                      <span className="w-[74px] text-xs font-bold text-[var(--text-primary)] shrink-0">
                        {row.category}
                      </span>
                      <div className="flex-1 h-5 rounded-md overflow-hidden flex">
                        <div
                          className="h-full flex items-center pl-2 transition-all duration-300"
                          style={{
                            width: `${row.ownPct}%`,
                            backgroundColor: tealColor
                          }}
                        >
                          <span className="text-[11px] font-bold text-white tabular-nums">
                            {row.ownPct}%
                          </span>
                        </div>
                        <div
                          className="h-full transition-all duration-300"
                          style={{
                            width: `${100 - row.ownPct}%`,
                            backgroundColor: competitorColor
                          }}
                        />
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-[var(--text-secondary)] mt-2.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: tealColor }}
                    />
                    Own brands
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: competitorColor }}
                    />
                    Competitors / other
                  </span>
                </div>
              </div>

              {/* 3.2 Dynamic Category-Isolated SOS Trendline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    SOS historical trend ({categoryFilter === 'All' ? 'All categories' : categoryFilter})
                  </span>
                  <span className="text-xs font-extrabold tabular-nums text-[var(--accent-primary)]">
                    {metrics.sosTrend.currentPct}% current
                  </span>
                </div>
                <svg
                  viewBox="0 0 326 84"
                  className="w-full h-auto block"
                  role="img"
                  aria-label="SOS trendline"
                >
                  <line x1="0" y1="83" x2="326" y2="83" stroke={axisLineColor} />
                  <line x1="0" y1="42" x2="326" y2="42" stroke={gridLineColor} />
                  <path
                    d={metrics.sosTrend.path}
                    fill="none"
                    stroke={tealColor}
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={metrics.sosTrend.dotX}
                    cy={metrics.sosTrend.dotY}
                    r="4.5"
                    fill={tealColor}
                    stroke={isDark ? '#0B110F' : '#FFFFFF'}
                    strokeWidth="2"
                  />
                </svg>
                <div className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] mt-1 tabular-nums">
                  <span>
                    {startDay} {scheduleMeta.monthShort}
                  </span>
                  <span>
                    {endDay} {scheduleMeta.monthShort}
                  </span>
                </div>
              </div>
            </div>

            {/* 3.3 Account-to-Outlet OOS Heatmap */}
            <div className="pt-4 border-t border-[var(--border-glass)]">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Account-to-outlet OOS heatmap · SKUs out of stock
                </span>
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: tealSoftBg }}
                    />
                    0
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: '#F3D27A' }}
                    />
                    1-2
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-sm inline-block"
                      style={{ backgroundColor: crimsonColor }}
                    />
                    3+
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[1fr_56px_56px_56px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 mb-1.5 items-center px-2">
                <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                  Account / Outlet
                </span>
                <span className="text-[11px] font-semibold text-center text-[var(--text-secondary)]">
                  Flour
                </span>
                <span className="text-[11px] font-semibold text-center text-[var(--text-secondary)]">
                  Oil
                </span>
                <span className="text-[11px] font-semibold text-center text-[var(--text-secondary)]">
                  Pasta
                </span>
              </div>

              <div className="space-y-2">
                {metrics.displayAccountGroups.slice(0, 10).map((grp) => {
                  const isExpanded =
                    Boolean(expandedOosAccounts[grp.account]) ||
                    accountFilter === grp.account ||
                    outletFilter !== 'All';

                  return (
                    <div key={grp.account} className="glass-subtle rounded-2xl overflow-hidden">
                      {/* Account Summary Row */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOosAccounts((prev) => ({
                            ...prev,
                            [grp.account]: !prev[grp.account]
                          }))
                        }
                        className="w-full min-h-[48px] grid grid-cols-[1fr_56px_56px_56px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 items-center px-2.5 py-2 text-left cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {isExpanded ? (
                            <ChevronDown size={15} className="text-[var(--text-muted)] shrink-0" />
                          ) : (
                            <ChevronRight size={15} className="text-[var(--text-muted)] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {grp.account}
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              {grp.outlets.length} outlets
                            </div>
                          </div>
                        </div>

                        {(['Flour', 'Edible Oil', 'Pasta'] as CategoryType[]).map((cat) => {
                          const totalCatOos = grp.oosTotals[cat];
                          const isDimmed =
                            categoryFilter !== 'All' && categoryFilter !== cat;
                          return (
                            <div
                              key={cat}
                              className={`h-9 rounded-lg flex items-center justify-center text-xs font-extrabold tabular-nums transition-opacity ${
                                isDimmed ? 'opacity-35' : 'opacity-100'
                              }`}
                              style={{
                                backgroundColor: neutralBarTrack,
                                color: 'var(--text-primary)'
                              }}
                            >
                              {totalCatOos}
                            </div>
                          );
                        })}
                      </button>

                      {/* Expanded Individual Child Outlet Matrix Cells */}
                      {isExpanded && (
                        <div className="border-t border-[var(--border-glass)] px-2.5 py-2 space-y-1.5 animate-fade-in">
                          {grp.outlets.slice(0, 8).map((o) => (
                            <div
                              key={o.id}
                              className="grid grid-cols-[1fr_56px_56px_56px] sm:grid-cols-[1fr_76px_76px_76px] gap-1.5 items-center"
                            >
                              <span className="text-xs font-medium text-[var(--text-primary)] truncate pl-5 pr-1">
                                {o.branch}
                              </span>

                              {(['Flour', 'Edible Oil', 'Pasta'] as CategoryType[]).map((cat) => {
                                const n = o.oosByCategory[cat];
                                const isDimmed =
                                  categoryFilter !== 'All' && categoryFilter !== cat;
                                const isCellSelected =
                                  selectedOosCell?.outletId === o.id &&
                                  selectedOosCell?.category === cat;

                                let bg = tealSoftBg;
                                let fg = tealDarkText;
                                if (n >= 3) {
                                  bg = crimsonColor;
                                  fg = '#FFFFFF';
                                } else if (n >= 1) {
                                  bg = isDark ? 'rgba(245, 158, 11, 0.85)' : '#F3D27A';
                                  fg = '#16181D';
                                }

                                return (
                                  <button
                                    key={cat}
                                    type="button"
                                    onClick={() =>
                                      setSelectedOosCell((prev) =>
                                        prev?.outletId === o.id && prev?.category === cat
                                          ? null
                                          : { outletId: o.id, category: cat }
                                      )
                                    }
                                    style={{ backgroundColor: bg, color: fg }}
                                    className={`h-11 rounded-[10px] text-sm font-bold tabular-nums cursor-pointer transition-all ${
                                      isDimmed ? 'opacity-35' : 'opacity-100'
                                    } ${
                                      isCellSelected
                                        ? isDark
                                          ? 'ring-2 ring-[#ECFDF5]'
                                          : 'ring-2 ring-[#16181D]'
                                        : 'hover:brightness-95'
                                    }`}
                                  >
                                    {n}
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

              {/* Outlet OOS Cell Detail + Shelf Photo Box */}
              {selectedOosOutletDetail && (
                <div className="mt-3 glass-subtle rounded-2xl p-3.5 animate-fade-in">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold text-[var(--text-primary)]">
                        {selectedOosOutletDetail.outletName} · {selectedOosOutletDetail.category}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                        {selectedOosOutletDetail.skuCount} SKUs out of stock · last visit{' '}
                        {selectedOosOutletDetail.lastVisit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedOosCell(null)}
                      className="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {selectedOosOutletDetail.photoUrl ? (
                    <div className="mt-2.5 rounded-xl overflow-hidden h-32 border border-[var(--border-glass)]">
                      <img
                        src={selectedOosOutletDetail.photoUrl}
                        alt={`${selectedOosOutletDetail.outletName} shelf`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div
                      className="mt-2.5 h-24 rounded-xl flex items-center justify-center gap-2 text-xs font-medium text-[var(--text-secondary)] border border-[var(--border-glass)]"
                      style={{
                        background: isDark
                          ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 8px, rgba(255,255,255,0.06) 8px, rgba(255,255,255,0.06) 16px)'
                          : 'repeating-linear-gradient(135deg, #ECEAE3, #ECEAE3 8px, #E3E0D7 8px, #E3E0D7 16px)'
                      }}
                    >
                      <Camera size={15} className="opacity-70" />
                      <span>Latest shelf photo (view only)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 4: EXECUTION (Live Planogram + Expiry/Freshness + POSM + Flyers + Comp Promos)
           ============================================================ */}
        {activeTab === 'execution' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Execution
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Live planogram, freshness verification, outlet-linked POSM, flyers and competitor intelligence
              </p>
            </div>

            {/* 4.1 Planogram Compliance & Freshness / Expiry Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Live Planogram Compliance */}
              <div className="glass-subtle rounded-2xl p-4 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Gondola & Planogram compliance · Live
                  </span>
                  {livePlanogram.hasData && (
                    <span className="text-xs font-semibold tabular-nums text-[var(--text-secondary)]">
                      {livePlanogram.evaluatedStores}/{livePlanogram.totalPlannedStores} stores
                    </span>
                  )}
                </div>

                {livePlanogram.hasData ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <div>
                        <div className="text-2xl font-extrabold tabular-nums text-[var(--text-primary)] leading-none">
                          {livePlanogram.overallScore}%
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-1 tabular-nums">
                          Mean score across {livePlanogram.evaluatedAudits} live shelf audits
                        </div>
                      </div>
                      <div className="text-right text-xs tabular-nums">
                        <div className="font-bold text-[var(--text-primary)]">
                          Brand {livePlanogram.avgBrandPct}%
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)]">
                          Company {livePlanogram.avgCompanyPct}%
                        </div>
                      </div>
                    </div>

                    <div
                      className="h-2.5 rounded-md overflow-hidden"
                      style={{ backgroundColor: neutralBarTrack }}
                    >
                      <div
                        className="h-full rounded-md transition-all duration-300"
                        style={{
                          width: `${Math.min(100, livePlanogram.overallScore)}%`,
                          backgroundColor:
                            livePlanogram.overallScore >= 80
                              ? tealColor
                              : livePlanogram.overallScore >= 60
                              ? amberColor
                              : crimsonColor
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs tabular-nums pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 size={14} style={{ color: tealColor }} />
                        <span className="font-bold">{livePlanogram.compliantCount}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">Compliant</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={14} style={{ color: amberColor }} />
                        <span className="font-bold">{livePlanogram.partialCount}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">Partial</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert size={14} style={{ color: crimsonColor }} />
                        <span className="font-bold">{livePlanogram.nonCompliantCount}</span>
                        <span className="text-[11px] text-[var(--text-secondary)]">Below</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-1">
                    <div>
                      <div className="text-xs font-bold text-[var(--text-primary)]">
                        No live Planogram audits yet
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                        Complete an outlet audit to stream live Planogram scores (
                        {livePlanogram.activePlanogramTemplates} templates active).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={onNavigateToPendingPjp}
                      className={`min-h-[38px] px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                        isDark ? 'bg-[#10B981] text-[#05231C]' : 'bg-[#084C41] text-white'
                      }`}
                    >
                      <span>Start audit</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              {/* 4.1B Freshness / Expiry Verification Indicator */}
              <div className="glass-subtle rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={15} style={{ color: tealColor }} />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      Freshness & expiry verification
                    </span>
                  </div>
                  <span className="text-xs font-bold tabular-nums text-[var(--accent-primary)]">
                    {metrics.freshnessPassCount}/{metrics.freshnessRows.length} · 0 Expired Stock
                  </span>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {metrics.freshnessRows.map((o) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between gap-2 py-1 border-b border-[var(--border-glass)] last:border-b-0 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[var(--text-primary)] truncate">
                          {o.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">
                          {o.freshness.note}
                        </div>
                      </div>
                      <span
                        className="text-[11px] font-bold shrink-0"
                        style={{ color: o.freshness.passed ? tealDarkText : crimsonColor }}
                      >
                        {o.freshness.passed ? '0 Expired · PASS' : 'Expired Flag · FAIL'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 4.2 Outlet-Linked POSM Compliance */}
            <div className="pt-4 border-t border-[var(--border-glass)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  POSM compliance · tap bar to inspect outlets
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Scoped to {scopedOutlets.length} outlets
                </span>
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
                      className={`w-full min-h-[42px] px-3 py-2 rounded-xl glass-subtle flex items-center gap-3 text-left cursor-pointer transition-all ${
                        isSelected
                          ? isDark
                            ? 'ring-2 ring-[#10B981]'
                            : 'ring-2 ring-[#084C41]'
                          : 'hover:brightness-95'
                      }`}
                    >
                      <span className="w-20 text-xs font-semibold text-[var(--text-primary)] shrink-0">
                        {row.label}
                      </span>
                      <div
                        className="flex-1 h-3 rounded-md overflow-hidden"
                        style={{ backgroundColor: neutralBarTrack }}
                      >
                        <div
                          className="h-full rounded-md transition-all duration-300"
                          style={{
                            width: `${row.pct}%`,
                            backgroundColor: row.pct >= 80 ? tealColor : amberColor
                          }}
                        />
                      </div>
                      <span className="w-24 text-right text-xs font-bold tabular-nums text-[var(--text-primary)] shrink-0">
                        {row.pct}% ({row.compliantCount}/{row.totalCount})
                      </span>
                    </button>
                  );
                })}
              </div>

              {selectedPosmObj && (
                <div className="glass-subtle rounded-2xl p-3.5 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">
                      {selectedPosmObj.label} breakdown · {selectedPosmObj.compliantCount} present,{' '}
                      {selectedPosmObj.missingCount} missing
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPosmKey(null)}
                      className="font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 text-xs">
                    {selectedPosmObj.outletPreview.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-black/[0.03] dark:bg-white/[0.04]"
                      >
                        <span className="truncate text-[var(--text-primary)] font-medium">
                          {item.name}
                        </span>
                        <span
                          className="font-bold shrink-0 text-[11px]"
                          style={{ color: item.present ? tealDarkText : crimsonColor }}
                        >
                          {item.present ? 'Present' : 'Missing'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 4.3 & 4.4 Synced Internal Flyer Promo Charts */}
            <div className="pt-4 border-t border-[var(--border-glass)] grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 4.3 Flyer Promo Status Donut */}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5">
                  Flyer promo status ({categoryFilter} · {accountFilter})
                </div>
                <div className="flex items-center gap-4">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-[104px] h-[104px] shrink-0"
                    role="img"
                    aria-label="Flyer promo status"
                  >
                    {metrics.flyerDonut.segments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx="60"
                        cy="60"
                        r="40"
                        fill="none"
                        stroke={seg.color}
                        strokeWidth="18"
                        strokeDasharray={seg.dash}
                        strokeDashoffset={seg.off}
                        transform="rotate(-90 60 60)"
                      />
                    ))}
                  </svg>
                  <div className="flex-1 space-y-2 text-xs text-[var(--text-primary)] tabular-nums">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: tealColor }}
                      />
                      <span>Promo active · {metrics.flyerDonut.activePct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: crimsonColor }}
                      />
                      <span>Promo missing · {metrics.flyerDonut.missingPct}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: competitorColor }}
                      />
                      <span>Not applicable · {metrics.flyerDonut.naPct}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4.4 Flyer Items by Account / Outlet */}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5">
                  Flyer items by {outletFilter !== 'All' ? 'outlet' : 'account'}
                </div>
                <div className="space-y-2.5">
                  {metrics.flyerBreakdownRows.map((row) => (
                    <div key={row.id} className="flex items-center gap-2.5">
                      <span className="w-24 text-xs font-medium text-[var(--text-primary)] truncate shrink-0">
                        {row.label}
                      </span>
                      <div
                        className="flex-1 h-3.5 rounded-md overflow-hidden flex"
                        style={{ backgroundColor: neutralBarTrack }}
                      >
                        <div
                          className="h-full"
                          style={{ width: `${row.present}%`, backgroundColor: tealColor }}
                        />
                        <div
                          className="h-full"
                          style={{ width: `${row.missing}%`, backgroundColor: crimsonColor }}
                        />
                        <div
                          className="h-full"
                          style={{ width: `${row.wrongPrice}%`, backgroundColor: amberColor }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)] mt-2">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: tealColor }}
                    />
                    Present
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: crimsonColor }}
                    />
                    Missing
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: amberColor }}
                    />
                    Wrong price
                  </span>
                </div>
              </div>
            </div>

            {/* 4.5 Interactive Competitor Promos Spotted (Account | Category | Brand) */}
            <div className="pt-4 border-t border-[var(--border-glass)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Competitor promos spotted (Account | Category | Brand)
                </span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Tap bar for outlet & offer details
                </span>
              </div>

              {metrics.filteredCompetitorPromos.length === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] py-2">
                  No competitor promotions recorded for the current filter selection.
                </p>
              ) : (
                <div className="space-y-2">
                  {metrics.filteredCompetitorPromos.map((cp) => {
                    const isSelected = selectedPromoId === cp.id;
                    return (
                      <div key={cp.id} className="space-y-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPromoId((prev) => (prev === cp.id ? null : cp.id))
                          }
                          aria-expanded={isSelected}
                          className={`w-full min-h-[44px] px-3 py-2 rounded-xl glass-subtle flex items-center gap-3 text-left cursor-pointer transition-all ${
                            isSelected
                              ? isDark
                                ? 'ring-2 ring-[#10B981]'
                                : 'ring-2 ring-[#084C41]'
                              : 'hover:brightness-95'
                          }`}
                        >
                          <span className="w-44 sm:w-56 text-xs font-semibold text-[var(--text-primary)] truncate shrink-0">
                            {cp.account} | {cp.category} | {cp.brand}
                          </span>
                          <div
                            className="flex-1 h-3 rounded-md overflow-hidden"
                            style={{ backgroundColor: neutralBarTrack }}
                          >
                            <div
                              className="h-full rounded-md"
                              style={{
                                width: `${Math.min(100, (cp.count / 8) * 100).toFixed(1)}%`,
                                backgroundColor: cp.isLive ? tealColor : primaryInk
                              }}
                            />
                          </div>
                          <span className="w-7 text-right text-xs font-bold tabular-nums text-[var(--text-primary)] shrink-0">
                            {cp.count}
                          </span>
                        </button>

                        {isSelected && selectedPromoObj && (
                          <div className="glass-subtle rounded-2xl p-3.5 text-xs space-y-1.5 animate-fade-in">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-[var(--text-primary)]">
                                  {selectedPromoObj.outletName}
                                </div>
                                <div className="text-[11px] text-[var(--text-secondary)]">
                                  {selectedPromoObj.account} · {selectedPromoObj.category} · Brand:{' '}
                                  {selectedPromoObj.brand}
                                </div>
                              </div>
                              <span className="text-[11px] font-medium text-[var(--text-muted)] tabular-nums shrink-0">
                                {selectedPromoObj.spottedDate}
                              </span>
                            </div>
                            <div className="text-[var(--text-primary)] font-medium pt-0.5">
                              {selectedPromoObj.offerDetails}
                            </div>
                            {selectedPromoObj.photoUrl && (
                              <div className="mt-2 h-28 rounded-xl overflow-hidden border border-[var(--border-glass)]">
                                <img
                                  src={selectedPromoObj.photoUrl}
                                  alt={`${selectedPromoObj.brand} competitor promo`}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 5: PRODUCTIVITY (Synced Executive PJP Calendar + Route Roster)
           ============================================================ */}
        {activeTab === 'productivity' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Productivity · {scheduleMeta.monthLabel} PJP
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                Assigned PJP schedule for {executive?.name || 'Safwan Asif'} ·{' '}
                {scheduleMetrics.workingDaysAll.length} working days · tap any scheduled day
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* 5.1 Synced Executive Monthly Calendar + 5.2 Banner + Scheduled Outlets */}
              <div>
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
                      const inRange = d >= startDay && d <= endDay;
                      const isSelected = scheduleMetrics.activeCalDay === d;

                      let bg = isDark ? 'rgba(255,255,255,0.06)' : '#ECEAE3';
                      let fg = mutedInk;
                      let border = '1px solid transparent';

                      if (sched && !isFuture) {
                        const ratio =
                          sched.completedCount / Math.max(1, sched.plannedCount);
                        if (ratio >= 1) {
                          bg = tealColor;
                          fg = isDark ? '#05231C' : '#FFFFFF';
                        } else if (ratio >= 0.75) {
                          bg = isDark ? 'rgba(16, 185, 129, 0.45)' : '#9CCFC7';
                          fg = isDark ? '#ECFDF5' : '#16181D';
                        } else {
                          bg = amberColor;
                          fg = '#16181D';
                        }
                      } else if (sched && isFuture) {
                        bg = isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(8, 76, 65, 0.05)';
                        fg = tealDarkText;
                        border = `1px dashed ${tealColor}`;
                      } else if (isFuture) {
                        bg = 'transparent';
                        border = `1px dashed ${axisLineColor}`;
                      }

                      return (
                        <button
                          key={d}
                          type="button"
                          disabled={!sched}
                          onClick={() => setSelectedDay(d)}
                          style={{ backgroundColor: bg, color: fg, border }}
                          className={`h-12 rounded-[10px] flex flex-col items-center justify-center leading-tight tabular-nums transition-all ${
                            sched ? 'cursor-pointer hover:brightness-95' : 'cursor-default'
                          } ${!inRange && sched ? 'opacity-45' : 'opacity-100'} ${
                            isSelected
                              ? isDark
                                ? 'ring-2 ring-[#ECFDF5]'
                                : 'ring-2 ring-[#16181D]'
                              : ''
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

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-secondary)] mt-2.5">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: tealColor }}
                    />
                    All visited
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{
                        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.45)' : '#9CCFC7'
                      }}
                    />
                    Most
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block"
                      style={{ backgroundColor: amberColor }}
                    />
                    Few
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-sm inline-block border border-dashed"
                      style={{ borderColor: tealColor }}
                    />
                    Upcoming PJP
                  </span>
                </div>

                {/* 5.2 Selected-Day Banner + Assigned Route Outlet List */}
                <div
                  className="mt-3 px-3 py-2.5 rounded-xl text-[13px] font-bold tabular-nums"
                  style={{ backgroundColor: tealSoftBg, color: tealDarkText }}
                >
                  {scheduleMetrics.daySummaryText}
                </div>

                {scheduleMetrics.activeDayEntry &&
                  scheduleMetrics.activeDayEntry.outlets.length > 0 && (
                    <div className="mt-2.5 glass-subtle rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                        <span>
                          Assigned outlets for {scheduleMetrics.activeDayEntry.dateStr}
                        </span>
                        <span className="tabular-nums">
                          {scheduleMetrics.activeDayEntry.outlets.length} stops
                        </span>
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                        {scheduleMetrics.activeDayEntry.outlets.map((st, idx) => (
                          <div
                            key={`${st.name}-${idx}`}
                            className="flex items-center justify-between gap-2 py-1 border-b border-[var(--border-glass)] last:border-b-0 text-xs"
                          >
                            <div className="min-w-0">
                              <div className="font-semibold text-[var(--text-primary)] truncate">
                                {st.name}
                              </div>
                              <div className="text-[10px] text-[var(--text-muted)] truncate">
                                {st.account} · {st.area}
                              </div>
                            </div>
                            {st.code && (
                              <span className="text-[10px] font-mono tabular-nums text-[var(--text-muted)] shrink-0">
                                {st.code}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>

              {/* 5.3 Visits per Day vs Planned Target Band */}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2.5">
                  Visits per day vs {scheduleMetrics.targetLow}-{scheduleMetrics.targetLow + 1} target
                </div>
                <div className="relative h-28 flex items-end gap-1">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 rounded"
                    style={{
                      bottom: `${(
                        (scheduleMetrics.targetLow / scheduleMetrics.maxPlanned) *
                        112
                      ).toFixed(1)}px`,
                      height: `${(112 / scheduleMetrics.maxPlanned).toFixed(1)}px`,
                      backgroundColor: tealSoftBg
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
                        className="flex-1 h-28 relative flex items-end cursor-pointer group"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            isActive
                              ? isDark
                                ? 'ring-2 ring-[#ECFDF5]'
                                : 'ring-2 ring-[#16181D]'
                              : 'group-hover:brightness-95'
                          }`}
                          style={{
                            height: `${((v / scheduleMetrics.maxPlanned) * 112).toFixed(
                              1
                            )}px`,
                            backgroundColor:
                              v >= scheduleMetrics.targetLow ? tealColor : amberColor
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-1 mt-1">
                  {scheduleMetrics.executedDays.map((d) => (
                    <span
                      key={d}
                      className={`flex-1 text-center text-[10px] tabular-nums ${
                        d === scheduleMetrics.activeCalDay
                          ? 'font-bold text-[var(--text-primary)]'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Shaded band = {scheduleMetrics.targetLow}-{scheduleMetrics.targetLow + 1}{' '}
                  visits target across {scheduleMetrics.executedDays.length} completed working days
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ============================================================
            TAB 6: WORKHOURS
           ============================================================ */}
        {activeTab === 'workhours' && (
          <section className="glass-panel rounded-[20px] p-4 md:p-6 space-y-6 animate-fade-in">
            <div>
              <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                Work hours and discipline
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums">
                Each block is one outlet visit, by photo punch time · {scheduleMetrics.daySummaryText}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* 6.1 5-Day Punch Gantt Timeline */}
              <div>
                <div className="relative h-4 ml-12 mb-1">
                  {[8, 10, 12, 14, 16, 18].map((h) => (
                    <span
                      key={h}
                      className="absolute top-0 text-[10px] tabular-nums text-[var(--text-muted)] -translate-x-1/2"
                      style={{ left: `${((h - 7) / 11) * 100}%` }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {scheduleMetrics.ganttDays.map((row) => (
                    <div key={row.day} className="flex items-center gap-2">
                      <span
                        className={`w-10 text-[11px] tabular-nums shrink-0 ${
                          row.isSelected
                            ? 'font-extrabold text-[var(--text-primary)]'
                            : 'font-medium text-[var(--text-secondary)]'
                        }`}
                      >
                        {row.label}
                      </span>
                      <div
                        className="flex-1 relative h-6 rounded-md glass-subtle cursor-pointer"
                        onClick={() => setSelectedDay(row.day)}
                      >
                        <div
                          className="absolute top-[11px] h-0.5 rounded-full"
                          style={{
                            left: `${row.spanLeftPct.toFixed(2)}%`,
                            width: `${row.spanWidthPct.toFixed(2)}%`,
                            backgroundColor: competitorColor
                          }}
                        />
                        {row.blocks.map((block, bIdx) => (
                          <div
                            key={bIdx}
                            title={block.title}
                            className="absolute top-1 h-4 rounded"
                            style={{
                              left: `${block.leftPct.toFixed(2)}%`,
                              width: `${block.widthPct.toFixed(2)}%`,
                              backgroundColor: tealColor
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-[var(--text-muted)] mt-2.5 leading-relaxed">
                  Empty gaps between blocks = travel or idle time. Tap any day row above or inside
                  Productivity to move this 5-day window.
                </p>
              </div>

              {/* 6.2 Start-Time Consistency Scatter Strip */}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] mb-2">
                  Start-time consistency
                </div>
                <div className="relative h-12 rounded-xl glass-subtle overflow-hidden">
                  <div
                    aria-hidden="true"
                    className="absolute top-0 bottom-0 rounded-xl"
                    style={{
                      left: '16.7%',
                      width: '33.3%',
                      backgroundColor: tealSoftBg
                    }}
                  />
                  {scheduleMetrics.startTimeDots.map((dot) => (
                    <button
                      key={dot.day}
                      type="button"
                      onClick={() => setSelectedDay(dot.day)}
                      title={`${dot.day} ${scheduleMeta.monthShort} · First punch ${dot.timeStr}`}
                      className="absolute w-2.5 h-2.5 rounded-full cursor-pointer transition-transform hover:scale-125"
                      style={{
                        left: `calc(${dot.leftPct.toFixed(2)}% - 6px)`,
                        top: `${dot.topPx}px`,
                        backgroundColor: dot.isLate ? amberColor : tealColor,
                        border: dot.isSelected
                          ? `2px solid ${primaryInk}`
                          : `2px solid ${isDark ? '#0B110F' : '#FFFFFF'}`,
                        boxSizing: 'content-box'
                      }}
                    />
                  ))}
                </div>
                <div className="relative h-4 mt-1 text-[10px] tabular-nums text-[var(--text-muted)]">
                  <span className="absolute left-0">7:00</span>
                  <span className="absolute left-[33.3%] -translate-x-1/2">8:00</span>
                  <span className="absolute left-[66.6%] -translate-x-1/2">9:00</span>
                  <span className="absolute right-0">10:00</span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-2">
                  Each dot is one working day&apos;s first punch. Shaded = 7:30 to 8:30 usual window.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
