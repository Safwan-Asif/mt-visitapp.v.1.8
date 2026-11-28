import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES, CATEGORY_BRANDS } from '../../constants';
import { getComplianceStatusFromPct, normalizeBrandAlias } from '../../config/planogramConfig';
import { CategoryAuditRecord, CategoryType, Outlet } from '../../types';
import {
  buildExecutivePjpAnalytics,
  CategoryFilter,
  DataProvenance,
  normalizeAccountLabel,
  parseFlexiblePjpDate
} from '../../utils/homeAnalyticsData';
import {
  CalendarDateValue,
  compareCalendarDates,
  diffCalendarDaysInclusive,
  formatCompactCalendarDate,
  formatShortCalendarDate
} from '../WheelDateRangePicker';
import {
  AccountDonutSegment,
  AccountGroupSummary,
  CanonicalPlanogramSummary,
  HomeAnalyticsScreenProps,
  IntelligenceInsight,
  OverviewDrilldown,
  PeriodPreset,
  PlanogramStoreEntry,
  PosmMetricRow,
  ScheduleMetricsBundle,
  SosTrendPoint,
  TrajectoryPoint
} from './overviewTypes';

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

export function formatHourClock(t: number): string {
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

export function getWeekdayShort(year: number, month: number, day: number): string {
  return DAY_NAMES[new Date(year, month - 1, day).getDay()] || 'Mon';
}

export function getDohaGreetingAndDate(): { greeting: string; dateLabel: string } {
  try {
    const now = new Date();
    const hourStr = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Qatar',
      hour: '2-digit',
      hour12: false
    }).format(now);
    const hr = Number(hourStr);
    const greeting =
      hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
    const dateLabel = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Qatar',
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    }).format(now);
    return { greeting, dateLabel };
  } catch {
    const now = new Date();
    const hr = now.getHours();
    return {
      greeting: hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening',
      dateLabel: now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      })
    };
  }
}

export function useOverviewAnalytics(
  props: HomeAnalyticsScreenProps & { isDark: boolean }
) {
  const {
    executive,
    outlets,
    pjpVisits,
    masterOutlets = [],
    sheet2Visits = [],
    sheet2Audits = [],
    audits,
    planograms,
    selectedMapOutlet = null,
    isDark
  } = props;

  // Global Filter State
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('mtd');
  const [fromDate, setFromDate] = useState<CalendarDateValue>({
    year: 2026,
    month: 10,
    day: 1
  });
  const [toDate, setToDate] = useState<CalendarDateValue>({
    year: 2026,
    month: 10,
    day: 17
  });
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('All');
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [outletFilter, setOutletFilter] = useState<string>('All');
  const [selectedDay, setSelectedDay] = useState<number>(17);

  // Base Analytics Engine
  const basePjpData = useMemo(
    () =>
      buildExecutivePjpAnalytics(
        executive?.name || '',
        outlets,
        pjpVisits,
        audits,
        1,
        executive?.repId,
        masterOutlets,
        sheet2Visits,
        sheet2Audits,
        planograms
      ),
    [
      executive?.name,
      executive?.repId,
      outlets,
      pjpVisits,
      audits,
      masterOutlets,
      sheet2Visits,
      sheet2Audits,
      planograms
    ]
  );

  const scheduleMeta = basePjpData.scheduleMeta;

  const defaultFromDate = useMemo<CalendarDateValue>(
    () => ({ year: scheduleMeta.year, month: scheduleMeta.month, day: 1 }),
    [scheduleMeta.year, scheduleMeta.month]
  );
  const defaultToDate = useMemo<CalendarDateValue>(
    () => ({
      year: scheduleMeta.year,
      month: scheduleMeta.month,
      day: scheduleMeta.cutoffDay
    }),
    [scheduleMeta.year, scheduleMeta.month, scheduleMeta.cutoffDay]
  );

  // Preset Range Builder anchored cleanly to scheduleMeta.cutoffDay
  const getDatesForPreset = (preset: PeriodPreset): {
    from: CalendarDateValue;
    to: CalendarDateValue;
  } => {
    const y = scheduleMeta.year;
    const m = scheduleMeta.month;
    const cutoff = scheduleMeta.cutoffDay;
    if (preset === 'today') {
      return {
        from: { year: y, month: m, day: cutoff },
        to: { year: y, month: m, day: cutoff }
      };
    }
    if (preset === 'wtd') {
      const dow = new Date(y, m - 1, cutoff).getDay(); // 0=Sun..6=Sat (Gulf workweek starts Sun)
      const startDay = Math.max(1, cutoff - dow);
      return {
        from: { year: y, month: m, day: startDay },
        to: { year: y, month: m, day: cutoff }
      };
    }
    return {
      from: { year: y, month: m, day: 1 },
      to: { year: y, month: m, day: cutoff }
    };
  };

  const applyPeriodPreset = (preset: PeriodPreset) => {
    setPeriodPreset(preset);
    if (preset !== 'custom') {
      const next = getDatesForPreset(preset);
      setFromDate(next.from);
      setToDate(next.to);
    }
  };

  // Sync default dates when executive or PJP cycle changes
  useEffect(() => {
    setPeriodPreset('mtd');
    setFromDate({ year: scheduleMeta.year, month: scheduleMeta.month, day: 1 });
    setToDate({
      year: scheduleMeta.year,
      month: scheduleMeta.month,
      day: scheduleMeta.cutoffDay
    });
    setSelectedDay(scheduleMeta.cutoffDay);
    setAccountFilter('All');
    setOutletFilter('All');
  }, [executive?.name, scheduleMeta.month, scheduleMeta.year, scheduleMeta.cutoffDay]);

  // Apply GeoIntel "More Details" scope automatically (once per selection nonce)
  const lastAppliedMapNonceRef = useRef<number | null>(null);
  useEffect(() => {
    if (!selectedMapOutlet) {
      lastAppliedMapNonceRef.current = null;
      return;
    }
    if (lastAppliedMapNonceRef.current === selectedMapOutlet.nonce) return;

    const targetName = selectedMapOutlet.name.toLowerCase();
    const matchedOutlet =
      basePjpData.allOutlets.find((o) => o.id === selectedMapOutlet.id) ||
      basePjpData.allOutlets.find(
        (o) =>
          o.name.toLowerCase().includes(targetName) ||
          targetName.includes(o.branch.toLowerCase())
      );

    if (matchedOutlet) {
      setAccountFilter(matchedOutlet.account);
      setOutletFilter(matchedOutlet.id);
      lastAppliedMapNonceRef.current = selectedMapOutlet.nonce;
    } else {
      const matchedAcct = basePjpData.accounts.find((g) =>
        targetName.includes(g.account.toLowerCase().split(' ')[0])
      );
      if (matchedAcct) {
        setAccountFilter(matchedAcct.account);
        setOutletFilter('All');
        lastAppliedMapNonceRef.current = selectedMapOutlet.nonce;
      }
    }
  }, [selectedMapOutlet, basePjpData.allOutlets, basePjpData.accounts]);

  // Expanded Visual Intelligence multi-color palette synced with MARVIZ AI
  const palette = useMemo(
    () => ({
      electricBlue: '#0066FF',
      activeBlue: '#008DFF',
      cyan: isDark ? '#00C8FF' : '#0066FF',
      cyanBright: '#00E5E5',
      cyanText: isDark ? '#00C8FF' : '#0052CC',
      cyanSoftBg: isDark ? 'rgba(0, 200, 255, 0.15)' : 'rgba(0, 102, 255, 0.10)',
      violet: isDark ? '#8B5CF6' : '#7C3AED',
      lavender: isDark ? '#A78BFA' : '#8B5CF6',
      indigo: isDark ? '#6366F1' : '#4F46E5',
      emerald: isDark ? '#10B981' : '#059669',
      mint: isDark ? '#34D399' : '#10B981',
      teal: isDark ? '#14B8A6' : '#0D9488',
      tealSoftBg: isDark ? 'rgba(20, 184, 166, 0.16)' : 'rgba(13, 148, 136, 0.11)',
      amber: isDark ? '#FFB800' : '#D97706',
      orange: isDark ? '#F97316' : '#EA580C',
      coral: isDark ? '#FB7185' : '#E11D48',
      crimson: isDark ? '#EF4444' : '#DC2626',
      neutralTrack: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
      competitorBar: isDark ? '#334E73' : '#CBD5E1',
      primaryInk: isDark ? '#F5F7FA' : '#0B1D36',
      mutedInk: isDark ? '#A4B9D1' : '#647D9E',
      gridLine: isDark ? 'rgba(148, 185, 232, 0.10)' : '#E2E8F0',
      axisLine: isDark ? 'rgba(148, 185, 232, 0.18)' : '#CBD5E1',
      categoryColors: {
        Flour: {
          primary: isDark ? '#00C8FF' : '#0066FF',
          secondary: '#0066FF',
          gradient: 'linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)',
          soft: isDark ? 'rgba(0, 200, 255, 0.16)' : 'rgba(0, 102, 255, 0.10)'
        },
        'Edible Oil': {
          primary: isDark ? '#F97316' : '#EA580C',
          secondary: '#FFB800',
          gradient: 'linear-gradient(90deg, #F97316 0%, #FBBF24 100%)',
          soft: isDark ? 'rgba(249, 115, 22, 0.16)' : 'rgba(234, 88, 12, 0.10)'
        },
        Pasta: {
          primary: isDark ? '#8B5CF6' : '#7C3AED',
          secondary: '#A78BFA',
          gradient: 'linear-gradient(90deg, #6366F1 0%, #A78BFA 100%)',
          soft: isDark ? 'rgba(139, 92, 246, 0.16)' : 'rgba(124, 58, 237, 0.10)'
        }
      } as Record<CategoryType, { primary: string; secondary: string; gradient: string; soft: string }>,
      accountPalette: [
        isDark ? '#008DFF' : '#0066FF',
        isDark ? '#8B5CF6' : '#7C3AED',
        isDark ? '#14B8A6' : '#0D9488',
        isDark ? '#F97316' : '#EA580C',
        isDark ? '#647D9E' : '#94A3B8'
      ]
    }),
    [isDark]
  );

  // Derived Period Bounds
  const totalSelectedDaysCount = diffCalendarDaysInclusive(fromDate, toDate);
  const isInsidePjpMonth =
    fromDate.year === scheduleMeta.year &&
    fromDate.month === scheduleMeta.month &&
    toDate.year === scheduleMeta.year &&
    toDate.month === scheduleMeta.month;

  const pjpCycleStart: CalendarDateValue = {
    year: scheduleMeta.year,
    month: scheduleMeta.month,
    day: 1
  };
  const pjpCycleEnd: CalendarDateValue = {
    year: scheduleMeta.year,
    month: scheduleMeta.month,
    day: scheduleMeta.cutoffDay
  };
  const overlapStart =
    compareCalendarDates(fromDate, pjpCycleStart) > 0 ? fromDate : pjpCycleStart;
  const overlapEnd =
    compareCalendarDates(toDate, pjpCycleEnd) < 0 ? toDate : pjpCycleEnd;
  const hasPjpOverlap = compareCalendarDates(overlapStart, overlapEnd) <= 0;

  const observedStartDay = hasPjpOverlap ? overlapStart.day : 1;
  const observedEndDay = hasPjpOverlap ? overlapEnd.day : scheduleMeta.cutoffDay;
  const sliceDaysCount = isInsidePjpMonth
    ? Math.max(1, observedEndDay - observedStartDay + 1)
    : totalSelectedDaysCount;
  const periodScale = sliceDaysCount / Math.max(1, scheduleMeta.cutoffDay);

  const availableOutletsForDropdown = useMemo(() => {
    if (accountFilter === 'All') return basePjpData.allOutlets;
    const foundGroup = basePjpData.accounts.find((g) => g.account === accountFilter);
    return foundGroup ? foundGroup.outlets : [];
  }, [basePjpData, accountFilter]);

  const handleAccountDropdownChange = (nextAccount: string) => {
    setAccountFilter(nextAccount);
    if (nextAccount === 'All') return;
    const stillValid = basePjpData.accounts
      .find((g) => g.account === nextAccount)
      ?.outlets.some((o) => o.id === outletFilter);
    if (!stillValid) {
      setOutletFilter('All');
    }
  };

  // Filtered Outlets — strictly honest, never falls back silently to allOutlets when empty!
  const scopedOutlets = useMemo(() => {
    let list = basePjpData.allOutlets;
    if (accountFilter !== 'All') {
      list = list.filter((o) => o.account === accountFilter);
    }
    if (outletFilter !== 'All') {
      list = list.filter((o) => o.id === outletFilter);
    }
    return list;
  }, [basePjpData, accountFilter, outletFilter]);

  const isEmptyScope = scopedOutlets.length === 0;
  const activeCategories = categoryFilter === 'All' ? CATEGORIES : [categoryFilter];

  // Canonical 85% / 70% Planogram Compliance (Live Session + Historical Sheet 2 Audits)
  const canonicalPlanogram = useMemo<CanonicalPlanogramSummary>(() => {
    const filteredRouteOutlets = outlets.filter((o) => {
      const acct = normalizeAccountLabel(o.account, o.name);
      if (accountFilter !== 'All' && acct !== accountFilter) return false;
      if (outletFilter !== 'All') {
        const targetOutlet = basePjpData.allOutlets.find((m) => m.id === outletFilter);
        if (targetOutlet) {
          const matchesId = o.id === targetOutlet.id;
          const matchesCode = Boolean(o.code && targetOutlet.code && o.code === targetOutlet.code);
          const matchesBranch = o.branch.toLowerCase() === targetOutlet.branch.toLowerCase();
          if (!matchesId && !matchesCode && !matchesBranch) return false;
        }
      }
      return true;
    });

    const entries: PlanogramStoreEntry[] = [];
    const seenStoreCat = new Set<string>();

    // 1. Live in-session audits with canonical 85/70 status normalization
    filteredRouteOutlets.forEach((outlet) => {
      activeCategories.forEach((cat) => {
        const record = audits[`${outlet.id}_${cat}`];
        if (record?.planogramCompliance?.hasPlanogram) {
          const score = Math.round(record.planogramCompliance.overallScore);
          const status = getComplianceStatusFromPct(score);
          seenStoreCat.add(`${outlet.id}::${cat}`);
          entries.push({
            outletId: outlet.id,
            outletName: outlet.name,
            branch: outlet.branch,
            account: normalizeAccountLabel(outlet.account, outlet.name),
            category: cat,
            score,
            brandPct: Math.round(record.planogramCompliance.brandWisePct),
            companyPct: Math.round(record.planogramCompliance.companyWisePct),
            status,
            provenance: 'live_verified'
          });
        }
      });
    });

    // 2. Historical Sheet 2 audits (from scopedOutlets not already audited live)
    scopedOutlets.forEach((mOutlet) => {
      activeCategories.forEach((cat) => {
        const score = mOutlet.planogramScoreByCategory[cat];
        const prov = mOutlet.planogramProvenanceByCategory[cat];
        if (score !== null && prov === 'historical_verified') {
          const alreadyLive = entries.some(
            (e) =>
              e.provenance === 'live_verified' &&
              e.category === cat &&
              (e.outletId === mOutlet.id || e.branch.toLowerCase() === mOutlet.branch.toLowerCase())
          );
          if (!alreadyLive) {
            entries.push({
              outletId: mOutlet.id,
              outletName: mOutlet.name,
              branch: mOutlet.branch,
              account: mOutlet.account,
              category: cat,
              score: Math.round(score),
              brandPct: null,
              companyPct: null,
              status: getComplianceStatusFromPct(score),
              provenance: 'historical_verified'
            });
          }
        }
      });
    });

    const liveAuditCount = entries.filter((e) => e.provenance === 'live_verified').length;
    const historicalAuditCount = entries.filter(
      (e) => e.provenance === 'historical_verified'
    ).length;

    if (entries.length === 0) {
      return {
        hasData: false,
        overallScore: 0,
        compliantCount: 0,
        partialCount: 0,
        nonCompliantCount: 0,
        evaluatedAudits: 0,
        liveAuditCount: 0,
        historicalAuditCount: 0,
        evaluatedStores: 0,
        totalPlannedStores: Math.max(filteredRouteOutlets.length, scopedOutlets.length),
        avgBrandPct: 0,
        avgCompanyPct: 0,
        activePlanogramTemplates: planograms.length,
        stores: [],
        provenance: 'unavailable'
      };
    }

    const totalScore = entries.reduce((s, e) => s + e.score, 0);
    const brandEntries = entries.filter((e) => e.brandPct !== null);
    const compEntries = entries.filter((e) => e.companyPct !== null);

    return {
      hasData: true,
      overallScore: Math.round(totalScore / entries.length),
      compliantCount: entries.filter((e) => e.status === 'COMPLIANT').length,
      partialCount: entries.filter((e) => e.status === 'PARTIAL').length,
      nonCompliantCount: entries.filter((e) => e.status === 'NON-COMPLIANT').length,
      evaluatedAudits: entries.length,
      liveAuditCount,
      historicalAuditCount,
      evaluatedStores: new Set(entries.map((e) => e.outletId)).size,
      totalPlannedStores: Math.max(filteredRouteOutlets.length, scopedOutlets.length),
      avgBrandPct:
        brandEntries.length > 0
          ? Math.round(
              brandEntries.reduce((s, e) => s + (e.brandPct || 0), 0) / brandEntries.length
            )
          : 0,
      avgCompanyPct:
        compEntries.length > 0
          ? Math.round(
              compEntries.reduce((s, e) => s + (e.companyPct || 0), 0) / compEntries.length
            )
          : 0,
      activePlanogramTemplates: planograms.length,
      stores: entries.sort((a, b) => a.score - b.score),
      provenance: liveAuditCount > 0 ? 'live_verified' : 'historical_verified'
    };
  }, [
    outlets,
    audits,
    planograms,
    accountFilter,
    outletFilter,
    basePjpData.allOutlets,
    scopedOutlets,
    activeCategories
  ]);

  // Core Metrics & Interactive Chart Series
  const metrics = useMemo(() => {
    const activeSet = scopedOutlets;

    // 1. Account aggregation
    const displayAccountGroups: AccountGroupSummary[] = basePjpData.accounts
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
          .sort((a, b) => b.filteredMton - a.filteredMton);

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
        const oosVerifiedTotals: Record<CategoryType, boolean> = {
          Flour: childList.some((o) => o.oosProvenanceByCategory.Flour !== 'unavailable'),
          'Edible Oil': childList.some(
            (o) => o.oosProvenanceByCategory['Edible Oil'] !== 'unavailable'
          ),
          Pasta: childList.some((o) => o.oosProvenanceByCategory.Pasta !== 'unavailable')
        };

        return {
          account: g.account,
          outlets: childList,
          mton: Number(accountMton.toFixed(1)),
          sharePct: 0,
          sosPct: accountSos,
          oosTotals,
          oosVerifiedTotals
        };
      })
      .filter((g) => g.outlets.length > 0)
      .sort((a, b) => b.mton - a.mton);

    const totalMton = Number(
      displayAccountGroups.reduce((sum, g) => sum + g.mton, 0).toFixed(1)
    );
    displayAccountGroups.forEach((g) => {
      g.sharePct = totalMton > 0 ? Math.round((g.mton / totalMton) * 100) : 0;
    });

    // 2. SOS & OOS Proxy across activeSet
    const verifiedSosCount = activeSet.filter((o) =>
      activeCategories.some((c) => o.sosProvenanceByCategory[c] !== 'simulated')
    ).length;

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
        : 0;

    // Availability Zero-Facing Proxy
    const verifiedOosCells = activeSet.reduce(
      (count, o) =>
        count +
        activeCategories.filter((c) => o.oosProvenanceByCategory[c] !== 'unavailable').length,
      0
    );
    const totalSkuSlots = Math.max(1, activeSet.length * activeCategories.length * 6);
    const totalOosSkus = activeSet.reduce(
      (sum, o) => sum + activeCategories.reduce((cs, c) => cs + o.oosByCategory[c], 0),
      0
    );
    const oosPct =
      activeSet.length > 0 ? Math.min(100, Math.round((totalOosSkus / totalSkuSlots) * 100)) : 0;

    // 3. PJP Adherence
    const targetOutletObj =
      outletFilter !== 'All'
        ? basePjpData.allOutlets.find((o) => o.id === outletFilter)
        : null;
    let pjpPlannedTotal = 0;
    let pjpCompletedTotal = 0;
    let pjpVerifiedTotal = 0;
    for (let d = observedStartDay; d <= observedEndDay; d++) {
      const sched = scheduleMeta.scheduleByDay[d];
      if (!sched || sched.plannedCount === 0) continue;
      if (accountFilter === 'All' && outletFilter === 'All') {
        pjpPlannedTotal += sched.plannedCount;
        pjpCompletedTotal += sched.completedCount;
        pjpVerifiedTotal += sched.verifiedCompletedCount;
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
          const dayVerifiedRatio =
            sched.verifiedCompletedCount / Math.max(1, sched.plannedCount);
          pjpPlannedTotal += matchingStores.length;
          pjpCompletedTotal += Math.round(matchingStores.length * dayAdhRatio);
          pjpVerifiedTotal += Math.round(matchingStores.length * dayVerifiedRatio);
        }
      }
    }
    const liveAuditedRouteCount = activeSet.filter(
      (o) => o.isRouteOutlet && o.hasLiveAudit
    ).length;
    const pjpBase =
      activeSet.length === 0
        ? 0
        : pjpPlannedTotal > 0
        ? Math.min(
            100,
            Math.round(
              ((pjpCompletedTotal + liveAuditedRouteCount * 0.5) / pjpPlannedTotal) * 100
            )
          )
        : 0;
    const pjpProvenance: DataProvenance =
      scheduleMeta.hasVerifiedSheet2Visits || liveAuditedRouteCount > 0
        ? pjpVerifiedTotal > 0
          ? 'historical_verified'
          : 'live_verified'
        : 'simulated';

    // 4. Sales Gauge & Cumulative Interactive Trajectory (Simulated MTON)
    const scopeRatio =
      activeSet.length === 0
        ? 0
        : Math.max(
            0.08,
            Math.min(
              1,
              totalMton / Math.max(1, basePjpData.allOutlets.length * 10.5 * periodScale)
            )
          );
    const targetScale = isInsidePjpMonth
      ? fromDate.day === 1 && toDate.day >= scheduleMeta.cutoffDay - 1
        ? 1
        : Math.max(0.1, totalSelectedDaysCount / scheduleMeta.daysInMonth)
      : Math.max(0.1, totalSelectedDaysCount / 30);

    const baseTarget =
      300 *
      (categoryFilter === 'All'
        ? 1
        : categoryFilter === 'Flour'
        ? 0.5
        : categoryFilter === 'Edible Oil'
        ? 0.3
        : 0.2);
    const scaledTarget =
      activeSet.length === 0
        ? 0
        : Math.max(
            10,
            Math.round(
              baseTarget *
                (accountFilter === 'All' && outletFilter === 'All' ? 1 : scopeRatio * 1.45) *
                targetScale
            )
          );

    const dailySlice = isInsidePjpMonth
      ? DAILY_BASE_SALES.slice(observedStartDay - 1, observedEndDay)
      : DAILY_BASE_SALES.slice(0, Math.min(31, totalSelectedDaysCount));
    const multiMonthScale = isInsidePjpMonth
      ? 1
      : totalSelectedDaysCount / Math.max(1, dailySlice.length);

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
      activeSet.length === 0
        ? 0
        : accountFilter === 'All' && outletFilter === 'All'
        ? 1
        : Math.max(0.12, scopeRatio * 1.45);

    const cumulative = dailySlice.map((val) => {
      runningSales += val * 0.82 * catFactor * accScopeMult * multiMonthScale;
      return runningSales;
    });

    const mtdMton = Math.round(cumulative[cumulative.length - 1] || 0);
    const achievementPct =
      scaledTarget > 0 ? Math.min(140, Math.round((mtdMton / scaledTarget) * 100)) : 0;
    const paceDenom = isInsidePjpMonth
      ? scheduleMeta.daysInMonth
      : Math.max(30, totalSelectedDaysCount);
    const pacePct = Math.min(100, Math.round((sliceDaysCount / paceDenom) * 100));
    const arcLen = Math.PI * 95;
    const phi = Math.PI * (pacePct / 100);
    const remainingMton = Math.max(0, scaledTarget - mtdMton);
    const remainingDays = isInsidePjpMonth
      ? Math.max(1, scheduleMeta.daysInMonth - observedEndDay)
      : Math.max(1, Math.round(totalSelectedDaysCount * 0.25));

    const trajectoryPoints: TrajectoryPoint[] = cumulative.map((actualVal, idx) => {
      const dayNumber = isInsidePjpMonth ? observedStartDay + idx : idx + 1;
      const denom = Math.max(1, cumulative.length);
      const targetAtStep =
        isInsidePjpMonth && toDate.day <= scheduleMeta.cutoffDay && fromDate.day === 1
          ? (scaledTarget * dayNumber) / Math.max(1, scheduleMeta.daysInMonth)
          : (scaledTarget * (idx + 1)) / denom;
      const actualRounded = Number(actualVal.toFixed(1));
      const targetRounded = Number(targetAtStep.toFixed(1));
      const varianceMton = Number((actualRounded - targetRounded).toFixed(1));
      const variancePct =
        targetRounded > 0 ? Math.round((varianceMton / targetRounded) * 100) : 0;
      return {
        index: idx,
        dayNumber,
        label: isInsidePjpMonth
          ? `${dayNumber} ${scheduleMeta.monthShort}`
          : `Day ${dayNumber}`,
        actualMton: actualRounded,
        targetMton: targetRounded,
        varianceMton,
        variancePct
      };
    });

    // Sub-category breakdown
    const subCategories = CATEGORIES.map((cat) => {
      const val =
        activeSet.length === 0
          ? 0
          : Math.round(
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

    // Account Donut Segments (Top 4 + Other accounts)
    const donutBuckets: Array<{ label: string; mton: number; color: string }> = [];
    const top4 = displayAccountGroups.slice(0, 4);
    top4.forEach((g, idx) => {
      donutBuckets.push({
        label: g.account,
        mton: g.mton,
        color: palette.accountPalette[idx % palette.accountPalette.length]
      });
    });
    if (displayAccountGroups.length > 4) {
      const restMton = displayAccountGroups
        .slice(4)
        .reduce((sum, g) => sum + g.mton, 0);
      donutBuckets.push({
        label: 'Other accounts',
        mton: Number(restMton.toFixed(1)),
        color: palette.accountPalette[4]
      });
    }
    const C = 251.327;
    let cumLen = 0;
    const donutTotal = Math.max(0.1, donutBuckets.reduce((s, b) => s + b.mton, 0));
    const hasMultipleSegs = donutBuckets.length > 1;
    const accountDonutSegments: AccountDonutSegment[] = donutBuckets.map((b) => {
      const rawLen = totalMton > 0 ? (b.mton / donutTotal) * C : 0;
      const drawnLen = hasMultipleSegs && rawLen > 4 ? rawLen - 2.2 : rawLen;
      const seg: AccountDonutSegment = {
        ...b,
        sharePct: totalMton > 0 ? Math.round((b.mton / donutTotal) * 100) : 0,
        dash: `${drawnLen.toFixed(1)} ${(C - drawnLen).toFixed(1)}`,
        off: (-cumLen).toFixed(1)
      };
      cumLen += rawLen;
      return seg;
    });

    // Shelf SOS rows
    const sosCategoryRows = CATEGORIES.map((cat) => {
      const avgCatSos =
        activeSet.length > 0
          ? Math.round(
              activeSet.reduce((s, o) => s + o.sosByCategory[cat], 0) / activeSet.length
            )
          : 0;
      const verifiedOutletsInCat = activeSet.filter(
        (o) => o.sosProvenanceByCategory[cat] !== 'simulated'
      ).length;
      return {
        category: cat,
        ownPct: avgCatSos,
        verifiedOutletsInCat,
        selected: categoryFilter === cat,
        dimmed: categoryFilter !== 'All' && categoryFilter !== cat
      };
    });

    // SOS Trend Points: prefer real Sheet 2 historical observations when present for active category
    const realSosObs = basePjpData.sheet2SosSeries.filter(
      (obs) => categoryFilter === 'All' || obs.category === categoryFilter
    );
    const sosTrendPoints: SosTrendPoint[] = [];
    if (realSosObs.length >= 2 && accountFilter === 'All' && outletFilter === 'All') {
      const byDate = new Map<string, { sum: number; count: number }>();
      realSosObs.forEach((obs) => {
        const cur = byDate.get(obs.dateIso) || { sum: 0, count: 0 };
        cur.sum += obs.avgSosPct * obs.sampleCount;
        cur.count += obs.sampleCount;
        byDate.set(obs.dateIso, cur);
      });
      Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([dateIso, val], idx) => {
          const parsed = parseFlexiblePjpDate(dateIso);
          sosTrendPoints.push({
            index: idx,
            label: parsed ? `${parsed.day} ${scheduleMeta.monthShort}` : dateIso,
            sosPct: Math.round(val.sum / Math.max(1, val.count)),
            sampleCount: val.count,
            provenance: 'historical_verified'
          });
        });
    } else {
      const trendTargetBase =
        categoryFilter === 'All'
          ? avgSos || CAT_SOS_BASE.Flour
          : sosCategoryRows.find((r) => r.category === categoryFilter)?.ownPct || avgSos;
      const trendPtsCount = Math.max(5, Math.min(18, sliceDaysCount));
      const catSeedShift =
        categoryFilter === 'Flour'
          ? 2
          : categoryFilter === 'Edible Oil'
          ? -1
          : categoryFilter === 'Pasta'
          ? 4
          : 0;
      for (let i = 0; i < trendPtsCount; i++) {
        const dayOffset = observedStartDay - 1 + i;
        const val = Math.max(
          8,
          Math.min(
            85,
            Math.round(
              trendTargetBase -
                4.5 +
                dayOffset * 0.32 +
                ((((dayOffset + catSeedShift) * 7) % 5) - 2) * 0.8
            )
          )
        );
        sosTrendPoints.push({
          index: i,
          label: isInsidePjpMonth
            ? `${Math.min(scheduleMeta.daysInMonth, observedStartDay + i)} ${scheduleMeta.monthShort}`
            : `Pt ${i + 1}`,
          sosPct: val,
          sampleCount: activeSet.length,
          provenance: 'simulated'
        });
      }
    }

    // Brand-Level Facings Breakdown from live audits in scopedOutlets
    const brandBreakdownByCategory = CATEGORIES.map((cat) => {
      const agg: Record<string, number> = {};
      const unmappedAgg: Record<string, number> = {};
      let auditedOutletCount = 0;

      activeSet.forEach((o) => {
        const ev = o.shelfEvidenceByCategory[cat];
        if (ev.provenance === 'live_verified' && Object.keys(ev.brandCounts).length > 0) {
          auditedOutletCount++;
          Object.entries(ev.brandCounts).forEach(([brandKey, count]) => {
            if (brandKey.startsWith('UNMAPPED:')) {
              const rawName = brandKey.replace(/^UNMAPPED:/, '');
              unmappedAgg[rawName] = (unmappedAgg[rawName] || 0) + count;
            } else {
              const norm = normalizeBrandAlias(brandKey, cat);
              const targetKey = norm.isUnmapped ? rawBrandSafe(brandKey) : norm.uiBrand;
              agg[targetKey] = (agg[targetKey] || 0) + count;
            }
          });
        }
      });

      const knownBrands = CATEGORY_BRANDS[cat];
      const rows = knownBrands.map((b) => {
        const norm = normalizeBrandAlias(b, cat);
        const faces = agg[b] || 0;
        return {
          brand: b,
          faces,
          isOwn: norm.isOwn,
          isCompetitor: norm.isCompetitor
        };
      });
      const unmappedRows = Object.entries(unmappedAgg).map(([brand, faces]) => ({
        brand,
        faces
      }));
      const totalFaces =
        rows.reduce((s, r) => s + r.faces, 0) +
        unmappedRows.reduce((s, r) => s + r.faces, 0);

      return {
        category: cat,
        auditedOutletCount,
        totalFaces,
        rows,
        unmappedRows
      };
    });

    // POSM Metrics (4 states cleanly tracked)
    const posmDefinitions: Array<{
      key: 'shelfStrips' | 'wobblers' | 'gondola' | 'priceTag';
      label: string;
    }> = [
      { key: 'shelfStrips', label: 'Shelf strips' },
      { key: 'wobblers', label: 'Wobblers' },
      { key: 'gondola', label: 'Gondola' },
      { key: 'priceTag', label: 'Price tag' }
    ];

    const posmMetrics: PosmMetricRow[] = posmDefinitions.map((def) => {
      const presentCount = activeSet.filter((o) => o.posmStates[def.key] === 'Present').length;
      const missingCount = activeSet.filter((o) => o.posmStates[def.key] === 'Missing').length;
      const naCount = activeSet.filter((o) => o.posmStates[def.key] === 'N/A').length;
      const notEvaluatedCount = activeSet.filter(
        (o) => o.posmStates[def.key] === 'Not Evaluated'
      ).length;
      const verifiedCount = presentCount + missingCount;
      const fallbackCompliant = activeSet.filter((o) => o.posmStatus[def.key]).length;
      const pct =
        verifiedCount > 0
          ? Math.round((presentCount / verifiedCount) * 100)
          : activeSet.length > 0
          ? Math.round((fallbackCompliant / activeSet.length) * 100)
          : 0;

      return {
        ...def,
        pct,
        presentCount,
        missingCount,
        naCount,
        notEvaluatedCount,
        totalCount: activeSet.length,
        verifiedCount,
        outletPreview: activeSet.slice(0, 14).map((o) => ({
          id: o.id,
          name: o.name,
          state: o.posmStates[def.key],
          isLive: o.hasLiveAudit
        }))
      };
    });

    // Flyer Promo Status (Simulated)
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
        { dash: `${pLenA.toFixed(1)} ${(C - pLenA).toFixed(1)}`, off: '0', color: palette.emerald },
        {
          dash: `${pLenM.toFixed(1)} ${(C - pLenM).toFixed(1)}`,
          off: (-pLenA).toFixed(1),
          color: palette.coral
        },
        {
          dash: `${pLenN.toFixed(1)} ${(C - pLenN).toFixed(1)}`,
          off: (-(pLenA + pLenM)).toFixed(1),
          color: palette.competitorBar
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

    // Competitor Promos Filtered
    const filteredCompetitorPromos = basePjpData.competitorPromos.filter((cp) => {
      if (categoryFilter !== 'All' && cp.category !== categoryFilter) return false;
      if (accountFilter !== 'All' && cp.account !== accountFilter) return false;
      if (outletFilter !== 'All') {
        const selectedOutletObj = basePjpData.allOutlets.find((o) => o.id === outletFilter);
        if (selectedOutletObj) {
          return (
            cp.outletName.toLowerCase().includes(selectedOutletObj.branch.toLowerCase()) ||
            cp.account === selectedOutletObj.account
          );
        }
      }
      return true;
    });

    const livePromos = filteredCompetitorPromos.filter((p) => p.provenance === 'live_verified');
    const demoPromos = filteredCompetitorPromos.filter((p) => p.provenance !== 'live_verified');

    const auditedLiveOutletsCount = activeSet.filter((o) => o.hasLiveAudit).length;
    const auditedS2OutletsCount = activeSet.filter((o) => o.hasSheet2Audit).length;

    return {
      totalMton,
      avgSos,
      verifiedSosCount,
      oosPct,
      totalOosSkus,
      verifiedOosCells,
      pjpBase,
      pjpPlannedTotal,
      pjpCompletedTotal,
      pjpProvenance,
      auditedLiveOutletsCount,
      auditedS2OutletsCount,
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
      trajectoryPoints,
      salesRangeLabels: {
        startLabel:
          fromDate.year === toDate.year
            ? formatCompactCalendarDate(fromDate)
            : formatShortCalendarDate(fromDate),
        midLabel:
          isInsidePjpMonth &&
          fromDate.day === 1 &&
          toDate.day >= scheduleMeta.cutoffDay
            ? `${scheduleMeta.cutoffDay} ${scheduleMeta.monthShort}`
            : undefined,
        endLabel:
          fromDate.year === toDate.year
            ? formatCompactCalendarDate(toDate)
            : formatShortCalendarDate(toDate)
      },
      subCategories,
      displayAccountGroups,
      accountDonutSegments,
      sosCategoryRows,
      sosTrendPoints,
      sosTrendProvenance:
        sosTrendPoints.some((p) => p.provenance === 'historical_verified')
          ? ('historical_verified' as const)
          : ('simulated' as const),
      brandBreakdownByCategory,
      posmMetrics,
      flyerDonut,
      flyerBreakdownRows,
      filteredCompetitorPromos,
      livePromos,
      demoPromos
    };
  }, [
    scopedOutlets,
    basePjpData,
    scheduleMeta,
    accountFilter,
    outletFilter,
    categoryFilter,
    fromDate,
    toDate,
    isInsidePjpMonth,
    totalSelectedDaysCount,
    observedStartDay,
    observedEndDay,
    sliceDaysCount,
    periodScale,
    activeCategories,
    palette
  ]);

  // Schedule & Workhours Bundle
  const scheduleMetrics = useMemo<ScheduleMetricsBundle>(() => {
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
    const isSimulatedDay = Boolean(activeDayEntry?.isSimulatedCompletion);
    const wdLabel = getWeekdayShort(scheduleMeta.year, scheduleMeta.month, activeCalDay);

    const punches =
      activeCompleted > 0 ? generateVisitPunches(activeCalDay, activeCompleted) : [];
    const firstActivityLabel =
      punches.length > 0 ? formatHourClock(punches[0][0]) : '—';
    const lastActivityLabel =
      punches.length > 0 ? formatHourClock(punches[punches.length - 1][1]) : '—';
    const totalSpanMins =
      punches.length > 0
        ? Math.round((punches[punches.length - 1][1] - punches[0][0]) * 60)
        : 0;
    const auditDurationMins = punches.reduce(
      (s, [start, end]) => s + Math.round((end - start) * 60),
      0
    );
    const recordedSpanLabel =
      totalSpanMins > 0
        ? `${Math.floor(totalSpanMins / 60)}h ${totalSpanMins % 60}m`
        : '—';
    const auditDurationLabel =
      auditDurationMins > 0
        ? `${Math.floor(auditDurationMins / 60)}h ${auditDurationMins % 60}m`
        : '—';

    const daySummaryText = activeDayEntry
      ? isFutureDay
        ? `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · Planned route: ${activeCount} stops`
        : `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · ${activeCompleted} of ${activeCount} stops · ${
            punches.length > 0
              ? `${firstActivityLabel} – ${lastActivityLabel}`
              : 'No recorded activity'
          }`
      : `${wdLabel} ${activeCalDay} ${scheduleMeta.monthShort} · Day off / no PJP stops`;

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
      const count = Math.max(1, entry?.completedCount || 4);
      const visits = generateVisitPunches(d, count);
      const first = visits[0][0];
      const last = visits[visits.length - 1][1];
      return {
        day: d,
        label: `${getWeekdayShort(scheduleMeta.year, scheduleMeta.month, d)} ${d}`,
        isSelected: d === activeCalDay,
        isSimulated: Boolean(entry?.isSimulatedCompletion ?? true),
        spanLeftPct: ((first - 7) / 11) * 100,
        spanWidthPct: ((last - first) / 11) * 100,
        blocks: visits.map((b, bIdx) => {
          const outletHint =
            entry?.outlets?.[bIdx]?.name || `Stop ${bIdx + 1}`;
          return {
            leftPct: ((b[0] - 7) / 11) * 100,
            widthPct: ((b[1] - b[0]) / 11) * 100,
            startLabel: formatHourClock(b[0]),
            endLabel: formatHourClock(b[1]),
            durationMins: Math.round((b[1] - b[0]) * 60),
            outletHint,
            title: `${outletHint} · ${formatHourClock(b[0])}–${formatHourClock(b[1])}`
          };
        })
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
      isSimulatedDay,
      firstActivityLabel,
      lastActivityLabel,
      recordedSpanLabel,
      auditDurationLabel,
      ganttDays,
      startTimeDots,
      maxPlanned,
      targetLow: Math.max(3, avgPlanned - 1)
    };
  }, [scheduleMeta, selectedDay]);

  // Deterministic Intelligence Brief (Max 3 Grounded Insights + Honest Demo Flag)
  const intelligenceBrief = useMemo<IntelligenceInsight[]>(() => {
    if (isEmptyScope) return [];
    const insights: IntelligenceInsight[] = [];

    // 1. Canonical Non-Compliant / Partial Planogram Alert (Live or Sheet 2 Verified)
    const criticalPlanogram = canonicalPlanogram.stores.find(
      (s) => s.status === 'NON-COMPLIANT'
    );
    if (criticalPlanogram) {
      insights.push({
        id: 'ins-planogram-critical',
        severity: 'critical',
        headline: `${criticalPlanogram.branch} scored ${criticalPlanogram.score}% in ${criticalPlanogram.category} Planogram`,
        context: `Below canonical 70% threshold · verified ${
          criticalPlanogram.provenance === 'live_verified' ? 'Live' : 'Sheet 2'
        } audit`,
        isDemo: false,
        provenanceLabel:
          criticalPlanogram.provenance === 'live_verified' ? 'Live audit' : 'Sheet 2',
        targetWorkspace: 'execution',
        targetDrilldown: {
          type: 'outlet',
          outletId:
            scopedOutlets.find((o) => o.branch === criticalPlanogram.branch)?.id ||
            criticalPlanogram.outletId,
          initialCategory: criticalPlanogram.category
        }
      });
    }

    // 2. Worst Verified Zero-Facing / OOS Outlet Category
    let worstOos: {
      outletId: string;
      branch: string;
      account: string;
      category: CategoryType;
      count: number;
      verified: boolean;
    } | null = null;
    scopedOutlets.forEach((o) => {
      activeCategories.forEach((cat) => {
        const verified = o.oosProvenanceByCategory[cat] !== 'unavailable';
        const c = o.oosByCategory[cat];
        if (
          c >= 2 &&
          (!worstOos || (verified && !worstOos.verified) || (verified === worstOos.verified && c > worstOos.count))
        ) {
          worstOos = {
            outletId: o.id,
            branch: o.branch,
            account: o.account,
            category: cat,
            count: c,
            verified
          };
        }
      });
    });

    if (worstOos) {
      const w = worstOos as {
        outletId: string;
        branch: string;
        account: string;
        category: CategoryType;
        count: number;
        verified: boolean;
      };
      insights.push({
        id: 'ins-oos-risk',
        severity: w.count >= 3 ? 'critical' : 'attention',
        headline: `${w.account} ${w.branch} flags ${w.count} zero-facing ${w.category} brand classes`,
        context: w.verified
          ? 'Tap to inspect category availability & shelf photo'
          : 'Simulated proxy from route catalog · audit outlet to verify',
        isDemo: !w.verified,
        provenanceLabel: w.verified ? 'Audited proxy' : 'Demo proxy',
        targetWorkspace: 'shelf',
        targetDrilldown: {
          type: 'availability',
          outletId: w.outletId,
          category: w.category
        }
      });
    }

    // 3. Lowest SOS Category vs Target OR Top Sales Pace Variance
    const lowestSos = [...metrics.sosCategoryRows].sort((a, b) => a.ownPct - b.ownPct)[0];
    if (lowestSos && insights.length < 3) {
      const hasVerifiedSos = lowestSos.verifiedOutletsInCat > 0;
      insights.push({
        id: 'ins-sos-cat',
        severity: lowestSos.ownPct < 30 ? 'attention' : 'positive',
        headline: `${lowestSos.category} leads category risk at ${lowestSos.ownPct}% Share of Shelf`,
        context: hasVerifiedSos
          ? `Includes ${lowestSos.verifiedOutletsInCat} verified store audits · isolate category trend`
          : 'Estimated baseline SOS · complete live audit to replace demo curve',
        isDemo: !hasVerifiedSos,
        provenanceLabel: hasVerifiedSos ? 'Audited' : 'Demo',
        targetWorkspace: 'shelf',
        targetCategory: lowestSos.category
      });
    }

    // 4. Sales Pace Variance (Simulated) if room remains
    if (insights.length < 3 && metrics.gauge.target > 0) {
      const deltaPct = metrics.gauge.pct - metrics.gauge.pace;
      insights.push({
        id: 'ins-sales-pace',
        severity: deltaPct >= 0 ? 'positive' : 'attention',
        headline:
          deltaPct >= 0
            ? `Territory pace tracking +${deltaPct} pts ahead of cycle schedule`
            : `Run-rate requires ${metrics.gauge.perDay} MTON/day to close ${metrics.gauge.remaining} MTON gap`,
        context: `${metrics.gauge.mtd} of ${metrics.gauge.target} MTON · simulated commercial allocation`,
        isDemo: true,
        provenanceLabel: 'Simulated',
        targetWorkspace: 'sales'
      });
    }

    return insights.slice(0, 3);
  }, [
    isEmptyScope,
    canonicalPlanogram.stores,
    scopedOutlets,
    activeCategories,
    metrics.sosCategoryRows,
    metrics.gauge
  ]);

  const hasFilters =
    periodPreset !== 'mtd' ||
    compareCalendarDates(fromDate, defaultFromDate) !== 0 ||
    compareCalendarDates(toDate, defaultToDate) !== 0 ||
    categoryFilter !== 'All' ||
    accountFilter !== 'All' ||
    outletFilter !== 'All';

  const handleResetFilters = () => {
    setPeriodPreset('mtd');
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setCategoryFilter('All');
    setAccountFilter('All');
    setOutletFilter('All');
    setSelectedDay(scheduleMeta.cutoffDay);
  };

  return {
    executive,
    basePjpData,
    scheduleMeta,
    palette,
    periodPreset,
    applyPeriodPreset,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    defaultFromDate,
    defaultToDate,
    categoryFilter,
    setCategoryFilter,
    accountFilter,
    setAccountFilter,
    handleAccountDropdownChange,
    outletFilter,
    setOutletFilter,
    selectedDay,
    setSelectedDay,
    availableOutletsForDropdown,
    scopedOutlets,
    isEmptyScope,
    activeCategories,
    totalSelectedDaysCount,
    isInsidePjpMonth,
    metrics,
    canonicalPlanogram,
    scheduleMetrics,
    intelligenceBrief,
    hasFilters,
    handleResetFilters
  };
}

function rawBrandSafe(b: string): string {
  return String(b || 'UNMAPPED').trim() || 'UNMAPPED';
}
