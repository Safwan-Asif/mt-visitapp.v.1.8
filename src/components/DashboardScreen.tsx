import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Clock,
  CheckCircle2,
  RotateCcw,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  Folder,
  ShieldCheck,
  Copy,
  Check,
  Code,
  Zap,
  AlertTriangle,
  PackageX,
  LayoutGrid,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Lightbulb
} from 'lucide-react';
import { Outlet, CategoryAuditRecord, CategoryType, UserProfile } from '../types';
import { CATEGORIES } from '../constants';
import { useTheme } from '../ThemeContext';
import {
  autoSaveAuditToGoogleSheet,
  getAppsScriptTemplateCode,
  TARGET_SPREADSHEET_URL,
  TARGET_DRIVE_FOLDER_URL,
  PJP_SPREADSHEET_URL
} from '../services/googleSheetsService';

interface DashboardScreenProps {
  outlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  executive?: UserProfile | null;
  onBack: () => void;
  onNavigateToPendingPjp?: () => void;
  onResetData: () => void;
}

type SosFilterCategory = 'ALL' | CategoryType;

interface AttentionItem {
  id: string;
  outletName: string;
  outletBranch: string;
  title: string;
  subtitle: string;
  actionLabel: string;
  tone: 'crimson' | 'amber' | 'indigo' | 'neutral';
  kind: 'missed' | 'sos' | 'planogram' | 'oos';
}

interface ActivityEntry {
  id: string;
  outletName: string;
  outletBranch: string;
  state: 'processing' | 'done';
  timeLabel: string;
  categoryCountLabel: string;
  metricsSummary: string;
  sortWeight: number;
}

function getOutletCompletionState(outlet: Outlet): 'completed' | 'in_progress' | 'untouched' {
  const statuses = Object.values(outlet.progress);
  if (statuses.every((s) => s === 'Completed')) return 'completed';
  if (statuses.some((s) => s === 'Completed' || s === 'In Progress')) return 'in_progress';
  return 'untouched';
}

function getShortOutletLabel(outlet: Outlet, index: number): string {
  const firstWord = (outlet.account || outlet.name).split(/[\s–-]+/)[0];
  return `${index + 1}. ${firstWord.slice(0, 7)}`;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  outlets,
  audits,
  executive,
  onBack,
  onNavigateToPendingPjp,
  onResetData
}) => {
  const { isDark } = useTheme();
  const goPendingPjp = onNavigateToPendingPjp || onBack;

  const [selectedSosCategory, setSelectedSosCategory] = useState<SosFilterCategory>('ALL');
  const [selectedChartOutletId, setSelectedChartOutletId] = useState<string | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [sheetUrl] = useState<string>(TARGET_SPREADSHEET_URL);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getAppsScriptTemplateCode());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleExportAllToGoogleSheets = async () => {
    setIsExportingAll(true);
    setExportStatus('Auto-syncing all audit logs to Google Sheet & Drive...');

    try {
      const auditList = Object.values(audits);
      if (auditList.length === 0) {
        setExportStatus('No completed audits in session yet. Complete an audit to sync.');
        setIsExportingAll(false);
        return;
      }

      let count = 0;
      for (const audit of auditList) {
        const outlet = outlets.find((o) => o.id === audit.outletId);
        setExportStatus(
          `Exporting audit ${count + 1}/${auditList.length}: ${outlet?.name || 'Outlet'} (${audit.category})...`
        );

        const photoToUpload = audit.annotatedPhotoUrl || audit.photoUrl;

        await autoSaveAuditToGoogleSheet({
          timestamp: audit.timestamp || new Date().toLocaleString(),
          outletId: audit.outletId,
          outletName: outlet?.name || 'Outlet',
          category: audit.category,
          repId: executive?.repId || '#9',
          repName: executive?.name || 'Safwan Asif',
          totalFacings: audit.totalFacings,
          shareOfShelfPct: audit.primarySharePct,
          shareOfShelfLabel: audit.category === 'Edible Oil' ? 'QFI SOS' : 'QFM SOS',
          counts: audit.counts || audit.aiCounts,
          originalAiCounts: audit.originalAiCounts,
          discrepancyLog: audit.discrepancyLog || 'No manual overrides (AI counts accepted)',
          unmappedRemark: audit.unmappedRemark || outlet?.unmappedRemark || '',
          priceTagOk: audit.priceTagOk,
          posmShelfSticker: audit.posmShelfSticker,
          posmWobblers: audit.posmWobblers,
          needsReview: false,
          photoDataUrl: photoToUpload,
          replyText: audit.n8nStatus?.message || 'QFI Visit Audit Record'
        });

        count++;
      }

      setExportStatus(`Exported all ${count} audit logs & photos to Google Sheet & Drive.`);
    } catch (err: any) {
      console.error('Batch export error:', err);
      setExportStatus(`Export note: ${err?.message || 'Queued to Google Sheet'}`);
    } finally {
      setIsExportingAll(false);
    }
  };

  // --- Derived Today Metrics (100% live from outlets & audits) ---
  const plannedOutlets = useMemo(() => outlets.filter((o) => !o.isUnmapped), [outlets]);
  const unplannedOutlets = useMemo(() => outlets.filter((o) => Boolean(o.isUnmapped)), [outlets]);

  // Planned bars first, appended by any added unplanned outlets
  const orderedSegments = useMemo(
    () => [
      ...plannedOutlets.map((o) => ({ outlet: o, state: getOutletCompletionState(o), isUnplanned: false })),
      ...unplannedOutlets.map((o) => ({ outlet: o, state: getOutletCompletionState(o), isUnplanned: true }))
    ],
    [plannedOutlets, unplannedOutlets]
  );

  const visitedPlannedCount = useMemo(
    () => plannedOutlets.filter((o) => getOutletCompletionState(o) === 'completed').length,
    [plannedOutlets]
  );

  const visitedUnplannedCount = useMemo(
    () => unplannedOutlets.filter((o) => getOutletCompletionState(o) === 'completed').length,
    [unplannedOutlets]
  );

  const inProgressCount = useMemo(
    () => orderedSegments.filter((s) => s.state === 'in_progress').length,
    [orderedSegments]
  );

  const untouchedCount = useMemo(
    () => orderedSegments.filter((s) => s.state === 'untouched').length,
    [orderedSegments]
  );

  const pendingOutlets = useMemo(
    () => outlets.filter((o) => getOutletCompletionState(o) !== 'completed'),
    [outlets]
  );

  // Next pending outlet: prioritize in-progress before untouched
  const nextPendingOutlet = useMemo(() => {
    const inProg = pendingOutlets.find((o) => getOutletCompletionState(o) === 'in_progress');
    return inProg || pendingOutlets[0] || null;
  }, [pendingOutlets]);

  // Monthly PJP placeholder per user answer unless synced value exists
  const monthlyPjpValue = useMemo(() => {
    if (executive?.pjpPercent !== undefined && executive?.pjpPercent !== '') {
      const raw = String(executive.pjpPercent).replace('%', '').trim();
      return raw;
    }
    return '84';
  }, [executive?.pjpPercent]);

  const auditList = useMemo(() => Object.values(audits), [audits]);
  const totalAuditsCount = auditList.length;

  // KPI 1: Planogram Compliance (X/Y stores compliant & %)
  const planogramMetrics = useMemo(() => {
    let evaluatedStores = 0;
    let compliantStores = 0;
    let totalScore = 0;

    outlets.forEach((outlet) => {
      const storeAudits = CATEGORIES.map((cat) => audits[`${outlet.id}_${cat}`]).filter(
        (a): a is CategoryAuditRecord => Boolean(a?.planogramCompliance?.hasPlanogram)
      );
      if (storeAudits.length > 0) {
        evaluatedStores += 1;
        const avgStoreScore =
          storeAudits.reduce((sum, a) => sum + (a.planogramCompliance?.overallScore || 0), 0) /
          storeAudits.length;
        totalScore += avgStoreScore;
        if (storeAudits.every((a) => a.planogramCompliance?.overallStatus === 'COMPLIANT')) {
          compliantStores += 1;
        }
      }
    });

    if (evaluatedStores === 0) {
      return { pct: 0, compliant: 0, evaluated: 0, hasData: false };
    }
    return {
      pct: Math.round(totalScore / evaluatedStores),
      compliant: compliantStores,
      evaluated: evaluatedStores,
      hasData: true
    };
  }, [outlets, audits]);

  // KPI 2: OOS (Number of outlets with OOS)
  const oosMetrics = useMemo(() => {
    const affectedOutletIds = new Set<string>();
    const detailsByOutlet = new Map<string, string>();

    auditList.forEach((audit) => {
      const oosReason = audit.questionnaireAnswers?.bs_oos_reason;
      const missingBrands = audit.planogramCompliance?.missingOwnBrands || [];
      const hasOosReason = Boolean(oosReason && oosReason !== 'No OOS');
      const hasMissingBrand = missingBrands.length > 0;

      if (hasOosReason || hasMissingBrand) {
        affectedOutletIds.add(audit.outletId);
        if (!detailsByOutlet.has(audit.outletId)) {
          detailsByOutlet.set(
            audit.outletId,
            hasMissingBrand
              ? `${audit.category}: ${missingBrands.slice(0, 2).join(', ')} missing`
              : `${audit.category}: ${oosReason}`
          );
        }
      }
    });

    return {
      outletCount: affectedOutletIds.size,
      affectedOutletIds,
      detailsByOutlet
    };
  }, [auditList]);

  // KPI 3: POSM Compliance (Pie chart %)
  const posmPct = useMemo(() => {
    if (totalAuditsCount === 0) return 0;
    const scoreSum = auditList.reduce((acc, a) => {
      const checks = [a.priceTagOk, a.posmShelfSticker, a.posmWobblers];
      const passed = checks.filter(Boolean).length;
      return acc + (passed / 3) * 100;
    }, 0);
    return Math.round(scoreSum / totalAuditsCount);
  }, [auditList, totalAuditsCount]);

  // KPI 4: Avg Audit Time
  const avgAuditTimeLabel = useMemo(() => {
    if (totalAuditsCount === 0) return '0m 0s';
    const avgSec = Math.round(
      auditList.reduce((acc, a) => acc + (a.auditDurationSeconds || 0), 0) / totalAuditsCount
    );
    const mins = Math.floor(avgSec / 60);
    const secs = avgSec % 60;
    return `${mins}m ${secs}s`;
  }, [auditList, totalAuditsCount]);

  // --- Needs Attention Items (clicking jumps to Pending PJP) ---
  const attentionItems = useMemo<AttentionItem[]>(() => {
    const items: AttentionItem[] = [];

    outlets.forEach((outlet) => {
      const storeAudits = CATEGORIES.map((cat) => audits[`${outlet.id}_${cat}`]).filter(Boolean);

      // 1. OOS flagged in outlet
      if (oosMetrics.affectedOutletIds.has(outlet.id)) {
        items.push({
          id: `att-oos-${outlet.id}`,
          outletName: outlet.name,
          outletBranch: outlet.branch,
          title: `${outlet.name} – ${outlet.branch}`,
          subtitle: oosMetrics.detailsByOutlet.get(outlet.id) || 'Out-of-stock detected on shelf',
          actionLabel: 'OOS Flag',
          tone: 'crimson',
          kind: 'oos'
        });
      }

      // 2. Planogram non-compliant / partial
      const nonCompliantAudit = storeAudits.find(
        (a) =>
          a.planogramCompliance?.hasPlanogram &&
          a.planogramCompliance.overallStatus !== 'COMPLIANT'
      );
      if (nonCompliantAudit) {
        items.push({
          id: `att-plan-${outlet.id}`,
          outletName: outlet.name,
          outletBranch: outlet.branch,
          title: `${outlet.name} – ${outlet.branch}`,
          subtitle: `${nonCompliantAudit.category} not per planogram (${Math.round(
            nonCompliantAudit.planogramCompliance?.overallScore || 0
          )}%)`,
          actionLabel: 'Off plan',
          tone: 'indigo',
          kind: 'planogram'
        });
      }

      // 3. Low SOS (< 35%)
      const lowSosAudit = storeAudits.find((a) => (a.primarySharePct ?? 0) < 35);
      if (lowSosAudit) {
        items.push({
          id: `att-sos-${outlet.id}`,
          outletName: outlet.name,
          outletBranch: outlet.branch,
          title: `${outlet.name} – ${outlet.branch}`,
          subtitle: `${lowSosAudit.category} SOS low · shelf share check`,
          actionLabel: `${Math.round(lowSosAudit.primarySharePct)}%`,
          tone: 'amber',
          kind: 'sos'
        });
      }
    });

    // 4. Add untouched/pending outlets if attention queue is light so executive has immediate action items
    if (items.length < 3) {
      pendingOutlets.forEach((outlet) => {
        if (items.length >= 4) return;
        const alreadyListed = items.some((i) => i.outletName === outlet.name && i.outletBranch === outlet.branch);
        if (!alreadyListed) {
          const st = getOutletCompletionState(outlet);
          items.push({
            id: `att-pend-${outlet.id}`,
            outletName: outlet.name,
            outletBranch: outlet.branch,
            title: `${outlet.name} – ${outlet.branch}`,
            subtitle:
              st === 'in_progress'
                ? 'Audit partially complete · pending remaining categories'
                : 'Planned today · audit not started yet',
            actionLabel: st === 'in_progress' ? 'Resume' : 'Visit now',
            tone: st === 'in_progress' ? 'amber' : 'crimson',
            kind: 'missed'
          });
        }
      });
    }

    return items.slice(0, 5);
  }, [outlets, audits, oosMetrics, pendingOutlets]);

  // --- SOS Category Filter Averages & Trendline Data (Y-axis: 0% to 50%) ---
  const categorySosStats = useMemo(() => {
    const computeAvg = (cat: SosFilterCategory): { avg: number | null; count: number } => {
      const relevant =
        cat === 'ALL' ? auditList : auditList.filter((a) => a.category === cat);
      if (relevant.length === 0) return { avg: null, count: 0 };
      const avg = Math.round(
        relevant.reduce((acc, a) => acc + (a.primarySharePct ?? a.shareOfShelfPct ?? 0), 0) /
          relevant.length
      );
      return { avg, count: relevant.length };
    };

    return {
      ALL: computeAvg('ALL'),
      'Edible Oil': computeAvg('Edible Oil'),
      Flour: computeAvg('Flour'),
      Pasta: computeAvg('Pasta')
    };
  }, [auditList]);

  const trendPoints = useMemo(() => {
    return outlets.map((outlet, idx) => {
      let value: number | null = null;
      if (selectedSosCategory === 'ALL') {
        const catAudits = CATEGORIES.map((c) => audits[`${outlet.id}_${c}`]).filter(Boolean);
        if (catAudits.length > 0) {
          value = Math.round(
            catAudits.reduce((sum, a) => sum + (a.primarySharePct ?? a.shareOfShelfPct ?? 0), 0) /
              catAudits.length
          );
        }
      } else {
        const rec = audits[`${outlet.id}_${selectedSosCategory}`];
        if (rec) {
          value = Math.round(rec.primarySharePct ?? rec.shareOfShelfPct ?? 0);
        }
      }

      return {
        outletId: outlet.id,
        outletName: `${outlet.name} – ${outlet.branch}`,
        shortLabel: getShortOutletLabel(outlet, idx),
        value
      };
    });
  }, [outlets, audits, selectedSosCategory]);

  const populatedTrendPoints = useMemo(
    () => trendPoints.filter((p) => p.value !== null),
    [trendPoints]
  );

  // --- Today's Activity Logs ---
  const activityEntries = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];

    outlets.forEach((outlet, idx) => {
      const state = getOutletCompletionState(outlet);
      if (state === 'untouched') return;

      const storeAudits = CATEGORIES.map((c) => audits[`${outlet.id}_${c}`]).filter(Boolean);
      const completedCatCount = Object.values(outlet.progress).filter(
        (s) => s === 'Completed'
      ).length;

      const latestTime =
        storeAudits[storeAudits.length - 1]?.timestamp?.split(',')[1]?.trim() ||
        storeAudits[storeAudits.length - 1]?.timestamp ||
        'Today';

      if (state === 'in_progress') {
        entries.push({
          id: `act-${outlet.id}`,
          outletName: outlet.name,
          outletBranch: outlet.branch,
          state: 'processing',
          timeLabel: latestTime,
          categoryCountLabel: `${completedCatCount} of 3 categories`,
          metricsSummary: 'Audit in progress · complete remaining categories',
          sortWeight: 1000 + idx
        });
      } else {
        const avgSos =
          storeAudits.length > 0
            ? Math.round(
                storeAudits.reduce((s, a) => s + (a.primarySharePct ?? 0), 0) / storeAudits.length
              )
            : 0;
        const posmStorePct =
          storeAudits.length > 0
            ? Math.round(
                storeAudits.reduce((acc, a) => {
                  const passed = [a.priceTagOk, a.posmShelfSticker, a.posmWobblers].filter(
                    Boolean
                  ).length;
                  return acc + (passed / 3) * 100;
                }, 0) / storeAudits.length
              )
            : 0;
        const hasOos = oosMetrics.affectedOutletIds.has(outlet.id);
        const planAudits = storeAudits.filter((a) => a.planogramCompliance?.hasPlanogram);
        const planText =
          planAudits.length === 0
            ? 'No planogram'
            : planAudits.every((a) => a.planogramCompliance?.overallStatus === 'COMPLIANT')
            ? 'On plan'
            : 'Off plan';

        entries.push({
          id: `act-${outlet.id}`,
          outletName: outlet.name,
          outletBranch: outlet.branch,
          state: 'done',
          timeLabel: latestTime,
          categoryCountLabel: `${completedCatCount} of 3 categories`,
          metricsSummary: `SOS ${avgSos}% · ${hasOos ? 'OOS flagged' : 'OOS 0'} · POSM ${posmStorePct}% · ${planText}`,
          sortWeight: 500 + idx
        });
      }
    });

    return entries.sort((a, b) => b.sortWeight - a.sortWeight);
  }, [outlets, audits, oosMetrics]);

  const remainingPlannedList = useMemo(
    () => plannedOutlets.filter((o) => getOutletCompletionState(o) === 'untouched'),
    [plannedOutlets]
  );

  // SVG Pie Chart geometry for POSM Compliance tile (r=16, circumference = 100.53)
  const pieRadius = 15;
  const pieCircumference = 2 * Math.PI * pieRadius;
  const pieDashOffset = pieCircumference - (pieCircumference * posmPct) / 100;

  // SVG Trendline geometry (viewBox 600 x 180)
  const chartW = 600;
  const chartH = 180;
  const padL = 36;
  const padR = 16;
  const padT = 16;
  const padB = 34;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  const plottedNodes = useMemo(() => {
    const n = Math.max(trendPoints.length, 1);
    return trendPoints.map((pt, idx) => {
      const x = n === 1 ? padL + plotW / 2 : padL + (idx / (n - 1)) * plotW;
      const clampedYVal = pt.value === null ? null : Math.min(Math.max(pt.value, 0), 50);
      const y =
        clampedYVal === null ? null : padT + plotH - (clampedYVal / 50) * plotH;
      return { ...pt, x, y };
    });
  }, [trendPoints, plotW, plotH]);

  const lineCoords = useMemo(
    () => plottedNodes.filter((n): n is typeof n & { y: number } => n.y !== null),
    [plottedNodes]
  );

  const linePath = useMemo(() => {
    if (lineCoords.length === 0) return '';
    return lineCoords.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  }, [lineCoords]);

  const areaPath = useMemo(() => {
    if (lineCoords.length < 2) return '';
    const baseLineY = padT + plotH;
    return `${linePath} L ${lineCoords[lineCoords.length - 1].x.toFixed(1)} ${baseLineY} L ${lineCoords[0].x.toFixed(1)} ${baseLineY} Z`;
  }, [linePath, lineCoords, plotH]);

  const activeNode =
    plottedNodes.find((n) => n.outletId === selectedChartOutletId && n.value !== null) ||
    lineCoords[lineCoords.length - 1] ||
    null;

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full h-full overflow-hidden px-3.5 pt-3.5 md:px-8 md:pt-6 select-none animate-fade-in">
      <div className="flex-1 overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom,0px))] md:pb-8 space-y-4 pr-0.5">
        {/* TOP ROW: Today's Visits Hero + AI Insights Summary (Side-by-side on Desktop, Stacked on Mobile) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          {/* 2. TODAY'S VISITS HERO CARD */}
          <section className="lg:col-span-7 glass-panel rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4">
            {/* Row 1: TODAY · Performance Review  |  PJP + XX% */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                <span className="font-extrabold tracking-wide text-[var(--accent-primary)]">TODAY</span>
                <span aria-hidden="true" className="opacity-40">&middot;</span>
                <span>Performance Review</span>
              </div>
              <span
                className="text-xs font-bold tabular-nums text-[var(--accent-primary)] whitespace-nowrap shrink-0"
                title="Current Month PJP Adherence"
              >
                PJP + {monthlyPjpValue}%
              </span>
            </div>

            {/* Primary Counter */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-2.5 flex-wrap">
                <span className="text-5xl leading-none font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {visitedPlannedCount}
                </span>
                <span className="text-base sm:text-lg font-medium text-[var(--text-secondary)] tabular-nums">
                  of {plannedOutlets.length} planned outlets visited
                </span>
              </div>
              {unplannedOutlets.length > 0 && (
                <p className="text-xs font-semibold text-[var(--accent-primary)] tabular-nums">
                  (unplanned outlet visit: {visitedUnplannedCount > 0 ? visitedUnplannedCount : unplannedOutlets.length})
                </p>
              )}
            </div>

            {/* Segmented Progress Bar (1 bar per planned outlet + appended bar per unplanned outlet) */}
            <div className="space-y-1.5">
              <div
                className="grid gap-1.5"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(orderedSegments.length, 1)}, minmax(0, 1fr))`
                }}
                role="img"
                aria-label={`${visitedPlannedCount} completed, ${inProgressCount} in progress, ${untouchedCount} untouched`}
              >
                {orderedSegments.map((seg) => {
                  const barColor =
                    seg.state === 'completed'
                      ? isDark
                        ? 'bg-[#00C8FF]'
                        : 'bg-[#0066FF]'
                      : seg.state === 'in_progress'
                      ? 'bg-[#FFB800]'
                      : isDark
                      ? 'bg-[#104878]/50'
                      : 'bg-[#0066FF]/14';

                  return (
                    <div
                      key={seg.outlet.id}
                      title={`${seg.outlet.name}${seg.isUnplanned ? ' (Unplanned)' : ''}: ${
                        seg.state === 'completed'
                          ? 'Completed'
                          : seg.state === 'in_progress'
                          ? 'In Progress'
                          : 'Untouched'
                      }`}
                      className={`h-2 rounded-full transition-all duration-300 ${barColor} ${
                        seg.isUnplanned ? 'ring-1 ring-offset-1 ring-[#FFB800]/60 dark:ring-offset-[#020D1F]' : ''
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--text-secondary)] tabular-nums flex-wrap">
                <span>
                  <strong className="text-[var(--accent-primary)]">{visitedPlannedCount + visitedUnplannedCount}</strong> Completed
                </span>
                <span aria-hidden="true" className="opacity-35">&middot;</span>
                <span>
                  <strong className="text-amber-600 dark:text-amber-400">{inProgressCount}</strong> In-process
                </span>
                <span aria-hidden="true" className="opacity-35">&middot;</span>
                <span>
                  <strong className="text-[var(--text-primary)]">{untouchedCount}</strong> Untouched
                </span>
              </div>
            </div>

            {/* CTA: "Next outlet?" -> Opens PJP Route filtered to Pending */}
            <button
              type="button"
              onClick={goPendingPjp}
              className="w-full min-h-[54px] px-4 py-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99] btn-electric-blue text-white"
            >
              <span className="flex flex-col items-start text-left min-w-0">
                <span className="text-sm font-bold leading-tight">Next outlet?</span>
                <span className="text-xs truncate max-w-full text-white/85 font-medium">
                  {nextPendingOutlet
                    ? `${nextPendingOutlet.name} – ${nextPendingOutlet.branch}`
                    : 'All planned outlets visited · Review PJP'}
                </span>
              </span>
              <ArrowRight size={18} className="shrink-0" />
            </button>
          </section>

          {/* 3. AI INSIGHTS SUMMARY CARD (Static / Un-connected Preview) */}
          <section
            className={`lg:col-span-5 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3.5 transition-colors ${
              isDark
                ? 'glass-panel border border-[#008DFF]/35 bg-[#061C35]/95 text-[#F1F5FF]'
                : 'bg-[#04152B] text-[#F1F5FF] border border-[#104878] shadow-[0_14px_34px_-14px_rgba(0,102,255,0.28)]'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold tracking-wide text-[#00C8FF]">
                  <Lightbulb size={14} className="shrink-0" />
                  <span>AI Insights</span>
                </div>
                <span className="text-[11px] font-medium text-[#A5B8D5] whitespace-nowrap">
                  Preview Summary
                </span>
              </div>

              <div className="space-y-2.5 text-[13px] leading-relaxed text-[#F1F5FF]/90">
                <p>
                  <strong className="font-semibold text-[#FFB800]">Area of concern:</strong>{' '}
                  Flour and Edible Oil facings across D-Ring and Wakra hypermarkets are trending below target shelf share, with repeat stockouts in core 1.5L and 5kg packs.
                </p>
                <p>
                  <strong className="font-semibold text-[#00C8FF]">Next best step:</strong>{' '}
                  Prioritize eye-level planogram reset and price-tag verification at your next pending stops before afternoon replenishment cutoffs.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-white/12 flex items-center justify-between text-[11px] text-white/60 tabular-nums">
              <span>2 key takeaways · Static preview</span>
              <span>Live AI sync paused</span>
            </div>
          </section>
        </div>

        {/* 4. KPI CARD (4 tiles, 2-col grid on mobile, 4-col on desktop) */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2 px-0.5">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Today&apos;s Shelf KPIs</h2>
            <span className="text-xs text-[var(--text-secondary)] tabular-nums">
              {totalAuditsCount} category audits logged
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* a. Planogram */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Planogram</span>
                <LayoutGrid size={14} className="text-[var(--accent-primary)] shrink-0" />
              </div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {planogramMetrics.hasData ? `${planogramMetrics.pct}%` : '0%'}
                </span>
                <span className="text-xs font-semibold tabular-nums text-[var(--accent-primary)]">
                  {planogramMetrics.compliant}/{planogramMetrics.evaluated}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                {planogramMetrics.hasData ? 'Stores compliant' : 'No planograms audited'}
              </span>
            </div>

            {/* b. OOS (Number of outlets with OOS) */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">OOS</span>
                <PackageX
                  size={14}
                  className={
                    oosMetrics.outletCount > 0
                      ? 'text-rose-600 dark:text-rose-400 shrink-0'
                      : 'text-[var(--accent-primary)] shrink-0'
                  }
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {oosMetrics.outletCount}
                </span>
                <span className="text-xs font-semibold text-[var(--text-secondary)]">
                  {oosMetrics.outletCount === 1 ? 'outlet' : 'outlets'}
                </span>
              </div>
              <span
                className={`text-[11px] font-semibold ${
                  oosMetrics.outletCount > 0
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-[var(--accent-primary)]'
                }`}
              >
                {oosMetrics.outletCount > 0 ? 'Outlets with OOS' : 'No OOS reported'}
              </span>
            </div>

            {/* c. POSM Compliance Pie Chart + % */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">POSM Compliance</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {posmPct}%
                </span>
                <svg
                  width="38"
                  height="38"
                  viewBox="0 0 38 38"
                  className="-rotate-90 shrink-0"
                  aria-hidden="true"
                >
                  <circle
                    cx="19"
                    cy="19"
                    r={pieRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="5"
                    className={isDark ? 'text-[#104878]/60' : 'text-[#0066FF]/15'}
                  />
                  <circle
                    cx="19"
                    cy="19"
                    r={pieRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeDasharray={pieCircumference}
                    strokeDashoffset={pieDashOffset}
                    strokeLinecap="round"
                    className="text-[var(--accent-primary)] transition-all duration-500"
                  />
                </svg>
              </div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                Price tags &amp; shelf POSM
              </span>
            </div>

            {/* d. Avg. Audit Time */}
            <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Avg. Audit Time</span>
                <Clock size={14} className="text-[var(--accent-primary)] shrink-0" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight tabular-nums text-[var(--text-primary)]">
                  {avgAuditTimeLabel}
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] tabular-nums">
                {totalAuditsCount > 0 ? `Across ${totalAuditsCount} audits` : 'Sub-2 min goal'}
              </span>
            </div>
          </div>
        </section>

        {/* 5. NEEDS ATTENTION */}
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-baseline gap-2">
              <h2 className="text-sm font-bold text-[var(--text-primary)]">Needs attention</h2>
              <span className="text-xs font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {attentionItems.length}
              </span>
            </div>
            <button
              type="button"
              onClick={goPendingPjp}
              className="text-xs font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
            >
              View pending PJP
            </button>
          </div>

          {attentionItems.length === 0 ? (
            <div className="glass-panel rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 text-[#22C55E] flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">All route stores on track</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  No shelf gaps or missed audits flagged today.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {attentionItems.map((item) => {
                const iconBoxClass =
                  item.tone === 'crimson'
                    ? 'bg-rose-500/12 text-rose-600 dark:text-rose-400'
                    : item.tone === 'amber'
                    ? 'bg-amber-500/12 text-amber-700 dark:text-amber-400'
                    : item.tone === 'indigo'
                    ? 'bg-indigo-500/12 text-indigo-700 dark:text-indigo-400'
                    : 'bg-black/5 text-[var(--text-secondary)] dark:bg-white/10';

                const actionTextClass =
                  item.tone === 'crimson'
                    ? 'text-rose-600 dark:text-rose-400'
                    : item.tone === 'amber'
                    ? 'text-amber-700 dark:text-amber-400'
                    : item.tone === 'indigo'
                    ? 'text-indigo-700 dark:text-indigo-400'
                    : 'text-[var(--text-secondary)]';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={goPendingPjp}
                    className="glass-panel rounded-2xl px-3.5 py-3 min-h-[64px] w-full flex items-center gap-3 text-left transition-all cursor-pointer hover:border-[var(--border-glass-strong)] active:scale-[0.99]"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBoxClass}`}>
                      {item.kind === 'sos' ? (
                        <TrendingDown size={18} />
                      ) : item.kind === 'planogram' ? (
                        <LayoutGrid size={18} />
                      ) : item.kind === 'oos' ? (
                        <PackageX size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {item.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${actionTextClass}`}>
                        {item.actionLabel}
                      </span>
                      <ChevronRight size={15} className="text-[var(--text-muted)]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 6. SOS — CATEGORY CARDS + TRENDLINE (X: Outlets, Y: 0% to 50%) */}
        <section className="glass-panel rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                SOS Performance by Category
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Select a category card to filter outlet shelf share (0%–50%)
              </p>
            </div>
            {activeNode && activeNode.value !== null && (
              <span className="text-xs font-semibold tabular-nums text-[var(--accent-primary)]">
                {activeNode.outletName}: {activeNode.value}% SOS
              </span>
            )}
          </div>

          {/* Category Filter Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                { id: 'ALL', label: 'All Categories' },
                { id: 'Edible Oil', label: 'Edible Oil' },
                { id: 'Flour', label: 'Flour' },
                { id: 'Pasta', label: 'Pasta' }
              ] as const
            ).map((cat) => {
              const stat = categorySosStats[cat.id];
              const isSelected = selectedSosCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedSosCategory(cat.id);
                    setSelectedChartOutletId(null);
                  }}
                  className={`rounded-2xl p-3 text-left transition-all cursor-pointer flex flex-col justify-between gap-1 min-h-[68px] ${
                    isSelected
                      ? isDark
                        ? 'bg-[#0066FF]/22 border border-[#008DFF] text-[#F1F5FF] shadow-[0_0_18px_rgba(0,102,255,0.22)]'
                        : 'bg-[#0066FF] border border-[#0066FF] text-white shadow-sm'
                      : 'glass-subtle text-[var(--text-primary)] hover:border-[var(--border-glass-strong)]'
                  }`}
                >
                  <span
                    className={`text-[11px] font-semibold truncate ${
                      isSelected
                        ? isDark
                          ? 'text-[#00C8FF]'
                          : 'text-white/85'
                        : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    {cat.label}
                  </span>
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="text-lg font-extrabold tabular-nums">
                      {stat.avg !== null ? `${stat.avg}%` : '—'}
                    </span>
                    <span
                      className={`text-[10px] tabular-nums ${
                        isSelected
                          ? isDark
                            ? 'text-[#A5B8D5]'
                            : 'text-white/80'
                          : 'text-[var(--text-muted)]'
                      }`}
                    >
                      {stat.count} {stat.count === 1 ? 'log' : 'logs'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Trendline SVG Chart (Y-axis 0% to 50%, no benchmark line) */}
          <div className="w-full relative">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-44 sm:h-48 overflow-visible"
              role="img"
              aria-label={`SOS trendline for ${selectedSosCategory}`}
            >
              <defs>
                <linearGradient id="sosAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isDark ? '#00C8FF' : '#0066FF'}
                    stopOpacity="0.26"
                  />
                  <stop
                    offset="100%"
                    stopColor={isDark ? '#00C8FF' : '#0066FF'}
                    stopOpacity="0.01"
                  />
                </linearGradient>
              </defs>

              {/* Y-Axis Gridlines (0%, 25%, 50%) */}
              {[0, 25, 50].map((tick) => {
                const y = padT + plotH - (tick / 50) * plotH;
                return (
                  <g key={tick}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="currentColor"
                      strokeOpacity={tick === 0 ? 0.16 : 0.08}
                      strokeDasharray={tick === 0 ? undefined : '4 4'}
                      className="text-[var(--text-primary)]"
                    />
                    <text
                      x={padL - 8}
                      y={y + 3.5}
                      textAnchor="end"
                      fontSize="10"
                      className="fill-[var(--text-muted)] font-mono tabular-nums"
                    >
                      {tick}%
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Outlet Labels */}
              {plottedNodes.map((node) => (
                <text
                  key={`xlabel-${node.outletId}`}
                  x={node.x}
                  y={chartH - 10}
                  textAnchor="middle"
                  fontSize="10"
                  className="fill-[var(--text-secondary)] font-medium"
                >
                  {node.shortLabel}
                </text>
              ))}

              {/* Area Fill */}
              {areaPath && <path d={areaPath} fill="url(#sosAreaGrad)" />}

              {/* Line Stroke */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke={isDark ? '#00C8FF' : '#0066FF'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Nodes */}
              {plottedNodes.map((node) => {
                if (node.y === null || node.value === null) {
                  return (
                    <circle
                      key={`empty-${node.outletId}`}
                      cx={node.x}
                      cy={padT + plotH}
                      r="3"
                      fill="currentColor"
                      className="text-[var(--text-muted)] opacity-35"
                    />
                  );
                }

                const isFocused = activeNode?.outletId === node.outletId;
                return (
                  <g
                    key={`node-${node.outletId}`}
                    className="cursor-pointer"
                    onClick={() => setSelectedChartOutletId(node.outletId)}
                  >
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={isFocused ? 6 : 4.5}
                      fill={isDark ? '#00C8FF' : '#0066FF'}
                      stroke={isDark ? '#020D1F' : '#FFFFFF'}
                      strokeWidth="2"
                    />
                    <text
                      x={node.x}
                      y={Math.max(node.y - 10, 12)}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      className="fill-[var(--text-primary)] tabular-nums"
                    >
                      {node.value}%
                    </text>
                  </g>
                );
              })}
            </svg>

            {populatedTrendPoints.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 pointer-events-none">
                <p className="text-xs font-semibold text-[var(--text-primary)]">
                  No {selectedSosCategory === 'ALL' ? '' : `${selectedSosCategory} `}SOS audits logged yet
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Completed category shelf audits plot automatically across today&apos;s outlets
                </p>
              </div>
            )}
          </div>
        </section>

        {/* 7. TODAY'S ACTIVITY — LOGS */}
        <section className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-2 px-0.5">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Today&apos;s activity</h2>
            <span className="text-xs text-[var(--text-secondary)]">Newest first</span>
          </div>

          <div className="space-y-2">
            {activityEntries.map((entry) => {
              const isProcessing = entry.state === 'processing';
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={goPendingPjp}
                  className="glass-panel rounded-2xl px-3.5 py-3 min-h-[70px] w-full flex items-center gap-3 text-left transition-all cursor-pointer hover:border-[var(--border-glass-strong)] active:scale-[0.99]"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isProcessing
                        ? 'bg-[#FFB800]/16 text-[#FFB800]'
                        : isDark
                        ? 'bg-[#22C55E]/18 text-[#22C55E]'
                        : 'bg-[#22C55E]/12 text-[#16A34A]'
                    }`}
                  >
                    {isProcessing ? <Clock size={18} /> : <CheckCircle2 size={18} />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                      {entry.outletName} – {entry.outletBranch}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] tabular-nums truncate">
                      {entry.timeLabel} &middot; {entry.categoryCountLabel}
                    </p>
                    <p
                      className={`text-xs tabular-nums truncate ${
                        isProcessing
                          ? 'font-semibold text-amber-700 dark:text-amber-400'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {entry.metricsSummary}
                    </p>
                  </div>

                  <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
                </button>
              );
            })}

            {/* Dashed Remaining Planned Today Row */}
            {remainingPlannedList.length > 0 && (
              <button
                type="button"
                onClick={goPendingPjp}
                className="w-full min-h-[58px] px-3.5 py-2.5 rounded-2xl border border-dashed border-[var(--border-glass-strong)] glass-subtle flex items-center gap-3 text-left transition-all cursor-pointer hover:bg-white/65 dark:hover:bg-white/10"
              >
                <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/10 text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] tabular-nums">
                    {remainingPlannedList.length} still planned today
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {remainingPlannedList[0].name} – {remainingPlannedList[0].branch}
                    {remainingPlannedList.length > 1
                      ? ` · +${remainingPlannedList.length - 1} more`
                      : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-[var(--text-muted)] shrink-0" />
              </button>
            )}
          </div>
        </section>

        {/* COLLAPSIBLE CLOUD SYNC & TOOLS DRAWER (Preserved functionality without clutter) */}
        <section className="glass-panel rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setIsToolsOpen((prev) => !prev)}
            className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
              <Zap size={14} className="text-[var(--accent-primary)] shrink-0" />
              <span>Cloud Sync &amp; Workspace Tools</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span className="hidden sm:inline text-[11px]">Sheets · Drive · Reset</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          {isToolsOpen && (
            <div className="px-4 pb-4 pt-2 border-t border-[var(--border-glass)] space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
                <span>Silent Google Workspace auto-sync active</span>
                <span className="font-semibold text-[var(--accent-primary)] inline-flex items-center gap-1">
                  <ShieldCheck size={13} /> Connected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                <a
                  href={sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between gap-2 text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-2 truncate font-semibold">
                    <FileSpreadsheet size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">Audit Log Sheet</span>
                  </span>
                  <ExternalLink size={12} className="text-[var(--text-muted)] shrink-0" />
                </a>

                <a
                  href={TARGET_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between gap-2 text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-2 truncate font-semibold">
                    <Folder size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">Drive Photos Folder</span>
                  </span>
                  <ExternalLink size={12} className="text-[var(--text-muted)] shrink-0" />
                </a>

                <a
                  href={PJP_SPREADSHEET_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between gap-2 text-[var(--text-primary)]"
                >
                  <span className="flex items-center gap-2 truncate font-semibold">
                    <FileSpreadsheet size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="truncate">Master PJP Schedule</span>
                  </span>
                  <ExternalLink size={12} className="text-[var(--text-muted)] shrink-0" />
                </a>
              </div>

              {exportStatus && (
                <div className="glass-subtle rounded-xl p-2.5 text-xs font-medium text-[var(--text-primary)]">
                  {exportStatus}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleExportAllToGoogleSheets}
                  disabled={isExportingAll}
                  className="min-h-[44px] py-2 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50 btn-electric-blue text-white"
                >
                  {isExportingAll ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Exporting…</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet size={14} />
                      <span>Export All Audits</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="min-h-[44px] py-2 px-3 rounded-xl glass-subtle text-xs font-semibold text-[var(--accent-primary)] hover:border-[var(--border-glass-strong)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Code size={14} />
                  <span>Apps Script Setup</span>
                </button>

                <button
                  type="button"
                  onClick={onResetData}
                  className="min-h-[44px] py-2 px-3 rounded-xl glass-subtle hover:border-rose-500/40 text-xs font-semibold text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Apps Script Template Code Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-strong rounded-3xl p-5 space-y-3 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                <Code size={14} /> Google Apps Script Setup
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-8 h-8 rounded-xl glass-subtle flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed shrink-0">
              Paste this snippet into your Google Sheet under <strong>Extensions &gt; Apps Script</strong>, then deploy as Web App (Execute as: <em>Me</em>, Access: <em>Anyone</em>).
            </p>

            <div className="flex-1 overflow-y-auto bg-[#020D1F] rounded-2xl p-3 border border-[#104878] font-mono text-[10px] text-[#00C8FF] select-all">
              <pre className="whitespace-pre-wrap leading-tight">
                {getAppsScriptTemplateCode()}
              </pre>
            </div>

            <div className="flex gap-2 shrink-0 pt-1">
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex-1 min-h-[44px] py-2 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer btn-electric-blue text-white"
              >
                {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="min-h-[44px] px-4 py-2 glass-subtle text-[var(--text-primary)] font-bold text-xs rounded-2xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
