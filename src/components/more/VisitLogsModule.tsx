import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Images,
  Search
} from 'lucide-react';
import { CategoryAuditRecord, Outlet, UserProfile } from '../../types';
import { fetchServerAuditLogs } from '../../services/googleSheetsService';
import { LivePjpDataset, matchesExecutiveIdentity } from '../../services/pjpService';
import { normalizeSapCode } from '../../services/planogramService';
import { MoreSubViewHeader, ResilientDriveImage, formatDateOnly } from './MoreSharedUI';

export interface VisitLogRecord {
  visitId: string;
  date: string;
  outletId: string;
  sapCode: string;
  outletName: string;
  checkInTime: string;
  checkOutTime: string;
  durationLabel: string;
  completionStatus: 'Completed' | 'In Progress';
  auditTypes: string[];
  sosPct: number | null;
  planogramPct: number | null;
  oosCount: number;
  focusSkuCompliancePct: number | null;
  notes: string[];
  photos: string[];
}

interface VisitLogsModuleProps {
  executive: UserProfile;
  assignedOutlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  livePjpDataset: LivePjpDataset;
  initialOutletFilter?: string;
  onOpenGalleryForOutlet: (outletName: string) => void;
  onBack: () => void;
}

export const VisitLogsModule: React.FC<VisitLogsModuleProps> = ({
  executive,
  assignedOutlets,
  audits,
  livePjpDataset,
  initialOutletFilter = '',
  onOpenGalleryForOutlet,
  onBack
}) => {
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialOutletFilter);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'In Progress'>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<VisitLogRecord | null>(null);

  useEffect(() => {
    if (initialOutletFilter) setSearchQuery(initialOutletFilter);
  }, [initialOutletFilter]);

  useEffect(() => {
    let active = true;
    fetchServerAuditLogs()
      .then((logs) => {
        if (active) setServerLogs(logs);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const visitLogs = useMemo<VisitLogRecord[]>(() => {
    const outletById = new Map<string, Outlet>();
    const outletBySap = new Map<string, Outlet>();
    assignedOutlets.forEach((o) => {
      outletById.set(o.id, o);
      const sap = normalizeSapCode(o.code);
      if (sap) outletBySap.set(sap, o);
    });

    const grouped = new Map<string, VisitLogRecord>();

    const normalizeDate = (raw?: string): string => {
      if (!raw) return new Date().toISOString().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
      const parsed = Date.parse(raw);
      return Number.isNaN(parsed)
        ? new Date().toISOString().slice(0, 10)
        : new Date(parsed).toISOString().slice(0, 10);
    };

    const formatClock = (raw?: string): string => {
      if (!raw) return '—';
      const parsed = Date.parse(raw);
      if (Number.isNaN(parsed)) return '—';
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(parsed));
    };

    // 1. Live session audits grouped by visitId or outlet+date
    const localBuckets = new Map<string, CategoryAuditRecord[]>();
    Object.values(audits).forEach((rec) => {
      const d = normalizeDate(rec.timestamp);
      const key = rec.visitId || `${rec.outletId}|${d}`;
      const arr = localBuckets.get(key) || [];
      arr.push(rec);
      localBuckets.set(key, arr);
    });

    localBuckets.forEach((recs, bucketKey) => {
      const first = recs[0];
      const outlet = outletById.get(first.outletId);
      const d = normalizeDate(first.timestamp);
      const times = recs
        .map((r) => Date.parse(r.timestamp || ''))
        .filter((t) => !Number.isNaN(t))
        .sort((a, b) => a - b);

      const totalDurSec = recs.reduce((s, r) => s + (Number(r.auditDurationSeconds) || 0), 0);
      const sosVals = recs
        .map((r) => r.shareOfShelfPct ?? r.primarySharePct)
        .filter((v): v is number => Number.isFinite(v));
      const pgVals = recs
        .map((r) =>
          r.planogramCompliance?.hasPlanogram ? r.planogramCompliance.overallScore : null
        )
        .filter((v): v is number => v !== null && Number.isFinite(v));
      const oosCount = recs.reduce(
        (s, r) => s + (r.planogramCompliance?.missingOwnBrands?.length || 0),
        0
      );
      const photos = recs
        .map((r) => r.annotatedImage || r.annotatedPhotoUrl || r.photoDataUrl || r.photoUrl)
        .filter((u): u is string => Boolean(u));
      const notes = recs
        .map((r) => r.discrepancyLog || r.replyText || '')
        .filter((n) => Boolean(n && n !== 'Visit Audit Record'));

      const completedCats = new Set(recs.map((r) => r.category));
      const isDone = outlet?.status === 'Completed' || completedCats.size >= 3;

      grouped.set(bucketKey, {
        visitId: first.visitId || bucketKey,
        date: d,
        outletId: first.outletId,
        sapCode: outlet?.code || '',
        outletName: outlet?.name || first.outletId,
        checkInTime: times.length > 0 ? formatClock(new Date(times[0]).toISOString()) : '—',
        checkOutTime:
          times.length > 1 ? formatClock(new Date(times[times.length - 1]).toISOString()) : '—',
        durationLabel:
          totalDurSec > 0
            ? `${Math.max(1, Math.round(totalDurSec / 60))} min`
            : '—',
        completionStatus: isDone ? 'Completed' : 'In Progress',
        auditTypes: Array.from(completedCats),
        sosPct:
          sosVals.length > 0
            ? Math.round(sosVals.reduce((a, b) => a + b, 0) / sosVals.length)
            : null,
        planogramPct:
          pgVals.length > 0
            ? Math.round(pgVals.reduce((a, b) => a + b, 0) / pgVals.length)
            : null,
        oosCount,
        focusSkuCompliancePct:
          pgVals.length > 0
            ? Math.round(pgVals.reduce((a, b) => a + b, 0) / pgVals.length)
            : null,
        notes,
        photos
      });
    });

    // 2. Server-logged audit entries (/api/sheets/logs)
    serverLogs.forEach((log, idx) => {
      const d = normalizeDate(log.created_at || log.timestamp);
      const sap = normalizeSapCode(log.outletCode);
      const outlet =
        outletById.get(log.outletId) || (sap ? outletBySap.get(sap) : undefined);
      const key = `${log.outletId || sap || log.outletName}|${d}`;
      if (grouped.has(key)) return;

      grouped.set(key, {
        visitId: String(log.id || `srv-visit-${idx}`),
        date: d,
        outletId: String(log.outletId || outlet?.id || ''),
        sapCode: String(log.outletCode || outlet?.code || ''),
        outletName: String(log.outletName || outlet?.name || 'Recorded Outlet'),
        checkInTime: formatClock(log.created_at || log.timestamp),
        checkOutTime: '—',
        durationLabel: '—',
        completionStatus: 'Completed',
        auditTypes: log.category ? [String(log.category)] : ['Shelf Audit'],
        sosPct: Number.isFinite(Number(log.shareOfShelfPct))
          ? Math.round(Number(log.shareOfShelfPct))
          : null,
        planogramPct: null,
        oosCount: 0,
        focusSkuCompliancePct: null,
        notes: log.discrepancyLog ? [String(log.discrepancyLog)] : [],
        photos: log.photoUrl || log.photoDataUrl ? [String(log.photoUrl || log.photoDataUrl)] : []
      });
    });

    // 3. Sheet 2 Historical Visits + Audits (only real recorded visits matching assigned/rep outlets)
    const s2AuditsByDateSap = new Map<string, typeof livePjpDataset.sheet2Audits>();
    (livePjpDataset.sheet2Audits || []).forEach((a) => {
      const key = `${normalizeSapCode(a.sapCode)}|${a.date}`;
      const list = s2AuditsByDateSap.get(key) || [];
      list.push(a);
      s2AuditsByDateSap.set(key, list);
    });

    (livePjpDataset.sheet2Visits || [])
      .filter((v) => {
        const sap = normalizeSapCode(v.sapCode);
        const matchesRep =
          !v.repId ||
          matchesExecutiveIdentity(undefined, v.repId, executive.name, executive.repId);
        return matchesRep || (sap && outletBySap.has(sap));
      })
      .forEach((v, idx) => {
        const sap = normalizeSapCode(v.sapCode);
        const outlet = outletBySap.get(sap);
        const key = `${outlet?.id || `out-sap-${sap}`}|${v.date}`;
        if (grouped.has(key)) return;

        const matchingAudits = s2AuditsByDateSap.get(`${sap}|${v.date}`) || [];
        const sosVals = matchingAudits
          .map((a) => a.shareOfShelfPct)
          .filter((n) => Number.isFinite(n) && n > 0);
        const pgVals = matchingAudits
          .map((a) => a.planogramCompliancePct)
          .filter((n) => Number.isFinite(n) && n > 0);
        const oosCount = matchingAudits.reduce((s, a) => s + (a.oosSkuCount || 0), 0);
        const notes = matchingAudits
          .map((a) => a.issuesSummary)
          .filter((txt) => Boolean(txt && txt.trim()));

        grouped.set(key, {
          visitId: `s2_${v.sapCode}_${v.date}_${idx}`,
          date: v.date,
          outletId: outlet?.id || `out-sap-${sap}`,
          sapCode: v.sapCode,
          outletName: outlet?.name || `Outlet ${v.sapCode}`,
          checkInTime: '—',
          checkOutTime: '—',
          durationLabel: '—',
          completionStatus:
            v.visitStatus.toLowerCase() === 'completed' ? 'Completed' : 'In Progress',
          auditTypes:
            matchingAudits.length > 0
              ? Array.from(new Set(matchingAudits.map((a) => a.category)))
              : ['PJP Visit'],
          sosPct:
            sosVals.length > 0
              ? Math.round(sosVals.reduce((a, b) => a + b, 0) / sosVals.length)
              : null,
          planogramPct:
            pgVals.length > 0
              ? Math.round(pgVals.reduce((a, b) => a + b, 0) / pgVals.length)
              : null,
          oosCount,
          focusSkuCompliancePct:
            pgVals.length > 0
              ? Math.round(pgVals.reduce((a, b) => a + b, 0) / pgVals.length)
              : null,
          notes,
          photos: []
        });
      });

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [audits, serverLogs, livePjpDataset, assignedOutlets, executive.name, executive.repId]);

  const filteredVisits = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visitLogs.filter((v) => {
      if (statusFilter !== 'All' && v.completionStatus !== statusFilter) return false;
      if (dateFrom && v.date < dateFrom) return false;
      if (dateTo && v.date > dateTo) return false;
      if (!q) return true;
      return (
        v.outletName.toLowerCase().includes(q) ||
        v.sapCode.toLowerCase().includes(q) ||
        v.visitId.toLowerCase().includes(q) ||
        v.auditTypes.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [visitLogs, statusFilter, dateFrom, dateTo, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="FIELD OPERATIONS / HISTORY"
        title="VISIT LOGS"
        subtitle={`${filteredVisits.length} recorded store visit${filteredVisits.length === 1 ? '' : 's'}`}
        onBack={() => (selectedVisit ? setSelectedVisit(null) : onBack())}
      />

      {selectedVisit ? (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-mono text-xs font-bold text-[#0066FF] dark:text-[#00C8FF] ov-tabular">
                    {formatDateOnly(selectedVisit.date)} · {selectedVisit.visitId}
                  </p>
                  <h2 className="font-heading text-2xl font-extrabold uppercase text-[var(--text-primary)]">
                    {selectedVisit.outletName}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] ov-tabular">
                    Check-In: {selectedVisit.checkInTime} · Check-Out: {selectedVisit.checkOutTime} ·
                    Duration: {selectedVisit.durationLabel}
                  </p>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                    selectedVisit.completionStatus === 'Completed'
                      ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-emerald-700 dark:text-[#22C55E]'
                      : 'bg-[#FFB800]/15 border-[#FFB800]/40 text-amber-700 dark:text-[#FFB800]'
                  }`}
                >
                  {selectedVisit.completionStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    label: 'Share of Shelf',
                    value: selectedVisit.sosPct !== null ? `${selectedVisit.sosPct}%` : '—',
                    tone: 'text-[#0066FF] dark:text-[#00C8FF]'
                  },
                  {
                    label: 'Planogram',
                    value:
                      selectedVisit.planogramPct !== null
                        ? `${selectedVisit.planogramPct}%`
                        : '—',
                    tone: 'text-[#22C55E]'
                  },
                  {
                    label: 'OOS SKUs',
                    value: String(selectedVisit.oosCount),
                    tone:
                      selectedVisit.oosCount > 0
                        ? 'text-[#EF4444]'
                        : 'text-[var(--text-primary)]'
                  },
                  {
                    label: 'Focus SKU Comp.',
                    value:
                      selectedVisit.focusSkuCompliancePct !== null
                        ? `${selectedVisit.focusSkuCompliancePct}%`
                        : '—',
                    tone: 'text-[var(--text-primary)]'
                  }
                ].map((m) => (
                  <div key={m.label} className="cockpit-surface-elevated rounded-[12px] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {m.label}
                    </p>
                    <p className={`font-heading text-2xl font-extrabold mt-0.5 ov-tabular ${m.tone}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Audit Types Recorded
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedVisit.auditTypes.map((type) => (
                    <span
                      key={type}
                      className="px-2.5 py-1 rounded-[10px] cockpit-surface-elevated text-xs font-semibold text-[var(--text-primary)]"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {selectedVisit.notes.length > 0 && (
                <div className="cockpit-surface-elevated rounded-[12px] p-3.5 space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Visit Notes & Observations
                  </p>
                  {selectedVisit.notes.map((n, idx) => (
                    <p key={idx} className="text-xs text-[var(--text-secondary)]">
                      • {n}
                    </p>
                  ))}
                </div>
              )}

              {selectedVisit.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Associated Photos ({selectedVisit.photos.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => onOpenGalleryForOutlet(selectedVisit.outletName)}
                      className="text-xs font-semibold text-[#0066FF] dark:text-[#00C8FF] flex items-center gap-1 cursor-pointer"
                    >
                      <Images size={13} />
                      View in Gallery
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedVisit.photos.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-[4/3] rounded-[10px] overflow-hidden border border-[#104878]"
                      >
                        <ResilientDriveImage
                          src={url}
                          alt={`Visit photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
              <div className="relative md:col-span-2">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search outlet name, SAP code, or category..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="From date"
                className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs text-[var(--text-primary)]"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="To date"
                className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['All', 'Completed', 'In Progress'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`min-h-[38px] px-3.5 rounded-[12px] text-xs font-semibold cursor-pointer ${
                    statusFilter === tab
                      ? 'bg-[#0066FF] text-white'
                      : 'cockpit-surface-elevated text-[var(--text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {isLoading && visitLogs.length === 0 ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="cockpit-panel rounded-[15px] h-24 animate-pulse" />
                ))}
              </div>
            ) : filteredVisits.length === 0 ? (
              <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-2">
                <ClipboardCheck size={24} className="mx-auto text-indigo-400" />
                <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                  No Recorded Visits Found
                </p>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Real store visits synced from Sheet 2 and live category shelf audits will appear chronologically here.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredVisits.map((v) => (
                  <button
                    key={v.visitId}
                    type="button"
                    onClick={() => setSelectedVisit(v)}
                    className="w-full cockpit-panel rounded-[15px] p-3.5 text-left hover:border-[#008DFF] transition-all cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)] ov-tabular">
                        <span className="inline-flex items-center gap-1 font-semibold text-[#0066FF] dark:text-[#00C8FF]">
                          <Calendar size={12} />
                          {formatDateOnly(v.date)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {v.checkInTime} – {v.checkOutTime} ({v.durationLabel})
                        </span>
                      </div>
                      <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)] truncate">
                        {v.outletName}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-secondary)] ov-tabular">
                        <span>{v.auditTypes.join(', ')}</span>
                        {v.sosPct !== null && (
                          <span className="text-[#0066FF] dark:text-[#00C8FF] font-semibold">
                            · SOS {v.sosPct}%
                          </span>
                        )}
                        {v.planogramPct !== null && (
                          <span className="text-[#22C55E] font-semibold">
                            · Planogram {v.planogramPct}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                          v.completionStatus === 'Completed'
                            ? 'bg-[#22C55E]/15 border-[#22C55E]/40 text-emerald-700 dark:text-[#22C55E]'
                            : 'bg-[#FFB800]/15 border-[#FFB800]/40 text-amber-700 dark:text-[#FFB800]'
                        }`}
                      >
                        {v.completionStatus}
                      </span>
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
