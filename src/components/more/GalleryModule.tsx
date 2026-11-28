import React, { useEffect, useMemo, useState } from 'react';
import {
  Filter,
  Images,
  Minus,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  X
} from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { CategoryAuditRecord, CategoryType, Outlet, UserProfile } from '../../types';
import { fetchServerAuditLogs } from '../../services/googleSheetsService';
import {
  MoreSubViewHeader,
  ResilientDriveImage,
  formatDateOnly,
  formatShortDateTime
} from './MoreSharedUI';

export interface GalleryPhotoRecord {
  id: string;
  visitId: string;
  outletId: string;
  outletName: string;
  branch: string;
  account: string;
  category: CategoryType | string;
  auditType: 'Shelf AI Audit' | 'Visit Evidence';
  capturedBy: string;
  capturedAt: string;
  dateGroupKey: string;
  originalUrl: string;
  analyzedUrl?: string;
  sosPct?: number;
  planogramPct?: number;
  oosCount?: number;
}

interface GalleryModuleProps {
  executive: UserProfile;
  assignedOutlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  initialOutletFilter?: string;
  onBack: () => void;
}

const PAGE_SIZE = 24;

export function buildHistoricalGalleryItems(params: {
  audits: Record<string, CategoryAuditRecord>;
  serverLogs: any[];
  assignedOutlets: Outlet[];
  defaultRepName: string;
}): GalleryPhotoRecord[] {
  const { audits, serverLogs, assignedOutlets, defaultRepName } = params;
  const outletById = new Map<string, Outlet>();
  const outletBySap = new Map<string, Outlet>();
  assignedOutlets.forEach((o) => {
    outletById.set(o.id, o);
    if (o.code) outletBySap.set(o.code.trim().toLowerCase(), o);
  });

  const items: GalleryPhotoRecord[] = [];
  const seen = new Set<string>();

  const toDateKey = (ts: string): string => {
    if (/^\d{4}-\d{2}-\d{2}/.test(ts)) return ts.slice(0, 10);
    const parsed = Date.parse(ts);
    if (!Number.isNaN(parsed)) return new Date(parsed).toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
  };

  // 1. Live & session audits (preserve Original & Analysed pairs when available)
  Object.entries(audits).forEach(([key, rec]) => {
    const originalUrl = rec.photoDataUrl || rec.photoUrl || '';
    const analyzedUrl =
      rec.annotatedImage ||
      rec.annotatedPhotoUrl ||
      rec.n8nStatus?.annotatedImageUrl ||
      undefined;

    if (!originalUrl && !analyzedUrl) return;

    const outlet = outletById.get(rec.outletId);
    const ts = rec.timestamp || new Date().toISOString();
    const dateKey = toDateKey(ts);
    const id = `local-${key}`;
    if (seen.has(id)) return;
    seen.add(id);

    items.push({
      id,
      visitId: rec.visitId || outlet?.visitId || `visit_${rec.outletId}_${dateKey}`,
      outletId: rec.outletId,
      outletName: outlet?.name || rec.outletId,
      branch: outlet?.branch || 'Doha',
      account: outlet?.account || outlet?.name?.split(' - ')[0] || 'Modern Trade',
      category: rec.category,
      auditType: 'Shelf AI Audit',
      capturedBy: defaultRepName,
      capturedAt: ts,
      dateGroupKey: dateKey,
      originalUrl: originalUrl || analyzedUrl || '',
      analyzedUrl: analyzedUrl && analyzedUrl !== originalUrl ? analyzedUrl : undefined,
      sosPct: rec.shareOfShelfPct ?? rec.primarySharePct,
      planogramPct: rec.planogramCompliance?.hasPlanogram
        ? rec.planogramCompliance.overallScore
        : undefined,
      oosCount: rec.planogramCompliance?.missingOwnBrands?.length
    });
  });

  // 2. Server-logged audit records (/api/sheets/logs)
  serverLogs.forEach((log, idx) => {
    const imgUrl = log.photoUrl || log.photoDataUrl || '';
    if (!imgUrl) return;
    const dedupKey = `${log.outletId || log.outletName}_${log.category}_${log.timestamp || idx}`;
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);

    const matchedOutlet =
      outletById.get(log.outletId) ||
      (log.outletCode ? outletBySap.get(String(log.outletCode).trim().toLowerCase()) : undefined);

    const ts = String(log.created_at || log.timestamp || '');
    const dateKey = toDateKey(ts);

    items.push({
      id: String(log.id || `srv-${idx}`),
      visitId: String(log.visitId || `log_${log.outletCode || idx}_${dateKey}`),
      outletId: String(log.outletId || matchedOutlet?.id || ''),
      outletName: String(log.outletName || matchedOutlet?.name || 'Recorded Store'),
      branch: matchedOutlet?.branch || 'Doha',
      account: String(log.accountName || matchedOutlet?.account || 'Modern Trade'),
      category: String(log.category || 'Edible Oil'),
      auditType: 'Visit Evidence',
      capturedBy: String(log.repName || defaultRepName),
      capturedAt: ts,
      dateGroupKey: dateKey,
      originalUrl: imgUrl,
      sosPct: Number.isFinite(Number(log.shareOfShelfPct)) ? Number(log.shareOfShelfPct) : undefined
    });
  });

  return items.sort(
    (a, b) => (Date.parse(b.capturedAt) || 0) - (Date.parse(a.capturedAt) || 0)
  );
}

export const GalleryModule: React.FC<GalleryModuleProps> = ({
  executive,
  assignedOutlets,
  audits,
  initialOutletFilter = 'All',
  onBack
}) => {
  const [serverLogs, setServerLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [outletFilter, setOutletFilter] = useState<string>(initialOutletFilter);
  const [accountFilter, setAccountFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [auditTypeFilter, setAuditTypeFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Full-screen viewer state
  const [activePhoto, setActivePhoto] = useState<GalleryPhotoRecord | null>(null);
  const [viewMode, setViewMode] = useState<'analyzed' | 'original'>('analyzed');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [pinchStartDist, setPinchStartDist] = useState<number | null>(null);

  useEffect(() => {
    setOutletFilter(initialOutletFilter || 'All');
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

  const allPhotos = useMemo(
    () =>
      buildHistoricalGalleryItems({
        audits,
        serverLogs,
        assignedOutlets,
        defaultRepName: executive.name
      }),
    [audits, serverLogs, assignedOutlets, executive.name]
  );

  const uniqueAccounts = useMemo(
    () => Array.from(new Set(allPhotos.map((p) => p.account).filter(Boolean))).sort(),
    [allPhotos]
  );
  const uniqueOutlets = useMemo(
    () => Array.from(new Set(allPhotos.map((p) => p.outletName).filter(Boolean))).sort(),
    [allPhotos]
  );

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allPhotos.filter((p) => {
      if (outletFilter !== 'All' && p.outletName !== outletFilter) return false;
      if (accountFilter !== 'All' && p.account !== accountFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (auditTypeFilter !== 'All' && p.auditType !== auditTypeFilter) return false;
      if (dateFrom && p.dateGroupKey < dateFrom) return false;
      if (dateTo && p.dateGroupKey > dateTo) return false;
      if (!q) return true;
      return (
        p.outletName.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q) ||
        p.account.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.visitId.toLowerCase().includes(q)
      );
    });
  }, [
    allPhotos,
    outletFilter,
    accountFilter,
    categoryFilter,
    auditTypeFilter,
    dateFrom,
    dateTo,
    searchQuery
  ]);

  const pagedPhotos = useMemo(
    () => filteredPhotos.slice(0, visibleCount),
    [filteredPhotos, visibleCount]
  );

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, GalleryPhotoRecord[]>();
    pagedPhotos.forEach((p) => {
      const arr = groups.get(p.dateGroupKey) || [];
      arr.push(p);
      groups.set(p.dateGroupKey, arr);
    });
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [pagedPhotos]);

  const openViewer = (photo: GalleryPhotoRecord) => {
    setActivePhoto(photo);
    setViewMode(photo.analyzedUrl ? 'analyzed' : 'original');
    setZoomScale(1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setPinchStartDist(Math.hypot(dx, dy));
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const ratio = dist / pinchStartDist;
      setZoomScale((prev) => Math.min(3.5, Math.max(1, Number((prev * ratio).toFixed(2)))));
      setPinchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setPinchStartDist(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="FIELD OPERATIONS / ARCHIVE"
        title="GALLERY"
        subtitle={`${filteredPhotos.length} historical shelf & visit photo${filteredPhotos.length === 1 ? '' : 's'}`}
        onBack={onBack}
        rightSlot={
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`min-h-[44px] px-3.5 rounded-[14px] text-xs font-bold uppercase tracking-wider font-heading flex items-center gap-1.5 cursor-pointer transition-colors ${
              showFilters
                ? 'bg-[#0066FF] text-white'
                : 'cockpit-surface-elevated text-[var(--text-primary)]'
            }`}
          >
            <Filter size={15} />
            <span>Filter</span>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search outlet, branch, account, category, or visit ID..."
              className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
            />
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="cockpit-panel rounded-[16px] p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Outlet
                </label>
                <select
                  value={outletFilter}
                  onChange={(e) => setOutletFilter(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Outlets</option>
                  {uniqueOutlets.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Account
                </label>
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Accounts</option>
                  {uniqueAccounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Product Category
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Audit Type
                </label>
                <select
                  value={auditTypeFilter}
                  onChange={(e) => setAuditTypeFilter(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                >
                  <option value="All">All Audit Types</option>
                  <option value="Shelf AI Audit">Shelf AI Audit</option>
                  <option value="Visit Evidence">Visit Evidence</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  From Date
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  To Date
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="mt-1 w-full min-h-[40px] rounded-[10px] cockpit-surface-elevated px-2.5 text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}

          {/* Grid */}
          {isLoading && allPhotos.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="cockpit-panel rounded-[14px] h-44 animate-pulse"
                />
              ))}
            </div>
          ) : groupedByDate.length === 0 ? (
            <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-2">
              <div className="w-12 h-12 rounded-[14px] cockpit-surface-elevated mx-auto flex items-center justify-center text-[#38BDF8]">
                <Images size={22} />
              </div>
              <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                No Historical Shelf Photos Found
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Completed shelf audits from PJP visits and synced Google Drive evidence will appear here grouped by capture date.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedByDate.map(([dateKey, photos]) => (
                <section key={dateKey} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-sm font-bold uppercase tracking-[0.14em] text-[#0066FF] dark:text-[#00C8FF]">
                      {formatDateOnly(dateKey)}
                    </h2>
                    <span className="text-[11px] text-[var(--text-muted)] ov-tabular">
                      {photos.length} photo{photos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => openViewer(photo)}
                        className="group cockpit-panel rounded-[14px] overflow-hidden text-left hover:border-[#008DFF] transition-all cursor-pointer active:scale-[0.98]"
                      >
                        <div className="relative aspect-[4/3] bg-[#04152B] overflow-hidden">
                          <ResilientDriveImage
                            src={photo.analyzedUrl || photo.originalUrl}
                            alt={`${photo.outletName} ${photo.category}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          {photo.analyzedUrl && (
                            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-[6px] bg-[#020D1F]/80 border border-[#00C8FF]/45 text-[9px] font-bold uppercase text-[#00C8FF] flex items-center gap-1">
                              <Sparkles size={9} />
                              AI
                            </span>
                          )}
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-[6px] bg-[#020D1F]/80 text-[10px] font-semibold text-[#F1F5FF]">
                            {photo.category}
                          </span>
                        </div>
                        <div className="p-2.5 space-y-0.5">
                          <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {photo.outletName}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] truncate ov-tabular">
                            {photo.branch}
                            {photo.sosPct !== undefined ? ` · SOS ${Math.round(photo.sosPct)}%` : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {visibleCount < filteredPhotos.length && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="min-h-[44px] px-5 rounded-[14px] cockpit-surface-elevated text-xs font-bold uppercase tracking-wider font-heading text-[#0066FF] dark:text-[#00C8FF] hover:border-[#008DFF] cursor-pointer"
                  >
                    Load More ({filteredPhotos.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN IMAGE VIEWER */}
      {activePhoto && (
        <div className="fixed inset-0 z-50 bg-[#020D1F]/95 backdrop-blur-xl flex flex-col">
          <div className="px-4 py-3 border-b border-[#104878] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#00C8FF] truncate">
                {activePhoto.category} · {activePhoto.auditType}
              </p>
              <h3 className="font-heading text-lg font-bold uppercase text-[#F1F5FF] truncate">
                {activePhoto.outletName}
              </h3>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {activePhoto.analyzedUrl && (
                <div className="flex items-center rounded-[10px] bg-[#061C35] border border-[#104878] p-0.5">
                  <button
                    type="button"
                    onClick={() => setViewMode('analyzed')}
                    className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer ${
                      viewMode === 'analyzed'
                        ? 'bg-[#0066FF] text-white'
                        : 'text-[#A5B8D5]'
                    }`}
                  >
                    Analysed
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('original')}
                    className={`px-2.5 py-1.5 rounded-[8px] text-[11px] font-semibold cursor-pointer ${
                      viewMode === 'original'
                        ? 'bg-[#0066FF] text-white'
                        : 'text-[#A5B8D5]'
                    }`}
                  >
                    Original
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setActivePhoto(null)}
                aria-label="Close Viewer"
                className="min-h-[44px] min-w-[44px] rounded-[12px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto flex items-center justify-center p-4 touch-pan-x touch-pan-y"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
              className="transition-transform duration-150 max-w-full max-h-full"
            >
              <ResilientDriveImage
                src={
                  viewMode === 'analyzed' && activePhoto.analyzedUrl
                    ? activePhoto.analyzedUrl
                    : activePhoto.originalUrl
                }
                alt={activePhoto.outletName}
                loading="eager"
                className="max-h-[62dvh] w-auto object-contain rounded-[12px] border border-[#104878]"
              />
            </div>
          </div>

          {/* Zoom Controls + Metadata */}
          <div className="bg-[#04152B] border-t border-[#104878] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.max(1, Number((z - 0.5).toFixed(2))))}
                  className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
                >
                  <Minus size={15} />
                </button>
                <span className="text-xs font-mono text-[#A5B8D5] px-2 ov-tabular">
                  {Math.round(zoomScale * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomScale((z) => Math.min(3.5, Number((z + 0.5).toFixed(2))))}
                  className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
                >
                  <Plus size={15} />
                </button>
                {zoomScale !== 1 && (
                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    className="min-h-[38px] px-2.5 rounded-[10px] bg-[#0B2542] border border-[#104878] text-[11px] text-[#00C8FF] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} />
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs ov-tabular">
                {activePhoto.sosPct !== undefined && (
                  <span className="text-[#00C8FF] font-bold">
                    SOS {Math.round(activePhoto.sosPct)}%
                  </span>
                )}
                {activePhoto.planogramPct !== undefined && (
                  <span className="text-[#22C55E] font-bold">
                    Planogram {Math.round(activePhoto.planogramPct)}%
                  </span>
                )}
                {activePhoto.oosCount !== undefined && (
                  <span className="text-[#FFB800] font-bold">
                    OOS {activePhoto.oosCount}
                  </span>
                )}
              </div>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-[#A5B8D5]">
              <div>
                <span className="text-[#647D9E] block text-[10px] uppercase">Branch</span>
                <span className="text-[#F1F5FF] font-semibold">{activePhoto.branch}</span>
              </div>
              <div>
                <span className="text-[#647D9E] block text-[10px] uppercase">Captured By</span>
                <span className="text-[#F1F5FF] font-semibold">{activePhoto.capturedBy}</span>
              </div>
              <div>
                <span className="text-[#647D9E] block text-[10px] uppercase">Capture Time</span>
                <span className="text-[#F1F5FF] font-semibold ov-tabular">
                  {formatShortDateTime(activePhoto.capturedAt)}
                </span>
              </div>
              <div>
                <span className="text-[#647D9E] block text-[10px] uppercase">Visit Ref</span>
                <span className="text-[#F1F5FF] font-mono truncate block">{activePhoto.visitId}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
