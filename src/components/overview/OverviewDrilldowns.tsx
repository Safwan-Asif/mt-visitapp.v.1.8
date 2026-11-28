import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  Eye,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Store,
  X
} from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { CategoryType } from '../../types';
import {
  CategoryFilter,
  MasterOutletMetrics,
  PosmEvalState
} from '../../utils/homeAnalyticsData';
import {
  CalendarDateValue,
  formatShortCalendarDate,
  WheelDateRangePicker
} from '../WheelDateRangePicker';
import {
  AccountGroupSummary,
  CanonicalPlanogramSummary,
  EvidenceViewerPayload,
  PeriodPreset,
  PromoListItem
} from './overviewTypes';
import {
  ProvenanceInline,
  provenanceMetaLabel
} from './OverviewPrimitives';
import { useOverviewAnalytics } from './useOverviewAnalytics';

type AnalyticsController = ReturnType<typeof useOverviewAnalytics>;

const PERIOD_OPTIONS: Array<{ id: PeriodPreset; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'wtd', label: 'WTD' },
  { id: 'mtd', label: 'MTD' },
  { id: 'custom', label: 'Custom' }
];

/* =========================================================================
   1. MOBILE LIQUID GLASS FILTER SHEET (Draft-until-Apply)
   ========================================================================= */
export const GlobalFilterSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  analytics: AnalyticsController;
  isDark: boolean;
}> = ({ isOpen, onClose, analytics, isDark }) => {
  const [draftPeriod, setDraftPeriod] = useState<PeriodPreset>(analytics.periodPreset);
  const [draftFrom, setDraftFrom] = useState<CalendarDateValue>(analytics.fromDate);
  const [draftTo, setDraftTo] = useState<CalendarDateValue>(analytics.toDate);
  const [draftCat, setDraftCat] = useState<CategoryFilter>(analytics.categoryFilter);
  const [draftAccount, setDraftAccount] = useState<string>(analytics.accountFilter);
  const [draftOutlet, setDraftOutlet] = useState<string>(analytics.outletFilter);
  const [accountQuery, setAccountQuery] = useState('');
  const [outletQuery, setOutletQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDraftPeriod(analytics.periodPreset);
    setDraftFrom(analytics.fromDate);
    setDraftTo(analytics.toDate);
    setDraftCat(analytics.categoryFilter);
    setDraftAccount(analytics.accountFilter);
    setDraftOutlet(analytics.outletFilter);
    setAccountQuery('');
    setOutletQuery('');
  }, [isOpen]);

  const handleDraftPeriodSelect = (p: PeriodPreset) => {
    setDraftPeriod(p);
    if (p === 'today') {
      const d = {
        year: analytics.scheduleMeta.year,
        month: analytics.scheduleMeta.month,
        day: analytics.scheduleMeta.cutoffDay
      };
      setDraftFrom(d);
      setDraftTo(d);
    } else if (p === 'wtd') {
      const y = analytics.scheduleMeta.year;
      const m = analytics.scheduleMeta.month;
      const cutoff = analytics.scheduleMeta.cutoffDay;
      const dow = new Date(y, m - 1, cutoff).getDay();
      setDraftFrom({ year: y, month: m, day: Math.max(1, cutoff - dow) });
      setDraftTo({ year: y, month: m, day: cutoff });
    } else if (p === 'mtd') {
      setDraftFrom(analytics.defaultFromDate);
      setDraftTo(analytics.defaultToDate);
    }
  };

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    return analytics.basePjpData.accounts.filter(
      (g) => !q || g.account.toLowerCase().includes(q)
    );
  }, [analytics.basePjpData.accounts, accountQuery]);

  const cascadingOutlets = useMemo(() => {
    const base =
      draftAccount === 'All'
        ? analytics.basePjpData.allOutlets
        : analytics.basePjpData.accounts.find((g) => g.account === draftAccount)?.outlets || [];
    const q = outletQuery.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (o) =>
        o.branch.toLowerCase().includes(q) ||
        o.account.toLowerCase().includes(q) ||
        (o.code || '').toLowerCase().includes(q)
    );
  }, [analytics.basePjpData, draftAccount, outletQuery]);

  const handleApply = () => {
    analytics.applyPeriodPreset(draftPeriod);
    analytics.setFromDate(draftFrom);
    analytics.setToDate(draftTo);
    analytics.setCategoryFilter(draftCat);
    analytics.setAccountFilter(draftAccount);
    analytics.setOutletFilter(draftOutlet);
    onClose();
  };

  const handleResetDraft = () => {
    setDraftPeriod('mtd');
    setDraftFrom(analytics.defaultFromDate);
    setDraftTo(analytics.defaultToDate);
    setDraftCat('All');
    setDraftAccount('All');
    setDraftOutlet('All');
    setAccountQuery('');
    setOutletQuery('');
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="ov-scope fixed inset-0 z-[45] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Global Overview Filters"
    >
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative z-10 w-full max-w-lg max-h-[88dvh] flex flex-col rounded-t-[28px] sm:rounded-[28px] border shadow-2xl backdrop-blur-2xl overflow-hidden animate-fade-in ${
          isDark
            ? 'bg-[#04152B]/96 border-[#00C8FF]/25'
            : 'bg-[#F4F7FB]/98 border-[#0066FF]/20'
        }`}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-1 bg-black/15 dark:bg-white/20 sm:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
          <div>
            <h3 className="font-heading text-xl font-bold text-[var(--text-primary)] tracking-wide">
              Scope & Period Filters
            </h3>
            <p className="text-[11px] text-[var(--text-muted)] ov-tabular">
              {formatShortCalendarDate(draftFrom)} – {formatShortCalendarDate(draftTo)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="w-10 h-10 rounded-full ov-glass-recessed flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Period Presets */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[var(--text-secondary)]">Reporting Period</div>
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl ov-glass-recessed">
              {PERIOD_OPTIONS.map((opt) => {
                const active = draftPeriod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleDraftPeriodSelect(opt.id)}
                    className={`min-h-[40px] rounded-xl text-xs font-bold cursor-pointer transition-all ${
                      active
                        ? 'btn-electric-blue text-white'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="pt-1">
              <WheelDateRangePicker
                fromDate={draftFrom}
                toDate={draftTo}
                defaultFromDate={analytics.defaultFromDate}
                defaultToDate={analytics.defaultToDate}
                hasAnyFilters={false}
                onChangeRange={(f, t) => {
                  setDraftPeriod('custom');
                  setDraftFrom(f);
                  setDraftTo(t);
                }}
                onResetAllFilters={handleResetDraft}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[var(--text-secondary)]">Category</div>
            <div className="grid grid-cols-4 gap-1.5">
              {(['All', ...CATEGORIES] as CategoryFilter[]).map((cat) => {
                const active = draftCat === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setDraftCat(cat)}
                    className={`min-h-[42px] px-2 rounded-xl text-xs font-bold cursor-pointer transition-all border ${
                      active
                        ? 'btn-electric-blue text-white border-transparent'
                        : 'ov-glass-recessed text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {cat === 'Edible Oil' ? 'Oil' : cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Searchable Account Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                Account ({analytics.basePjpData.accounts.length})
              </span>
              {draftAccount !== 'All' && (
                <button
                  type="button"
                  onClick={() => {
                    setDraftAccount('All');
                    setDraftOutlet('All');
                  }}
                  className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] cursor-pointer"
                >
                  Clear account
                </button>
              )}
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={accountQuery}
                onChange={(e) => setAccountQuery(e.target.value)}
                placeholder="Search accounts (e.g. Lulu, Carrefour, Al Meera)"
                className="w-full min-h-[42px] pl-9 pr-3 rounded-xl ov-glass-recessed text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
              />
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-0.5">
              <button
                type="button"
                onClick={() => {
                  setDraftAccount('All');
                  setDraftOutlet('All');
                }}
                className={`w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  draftAccount === 'All'
                    ? 'bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF] font-bold'
                    : 'text-[var(--text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>All accounts</span>
                <span className="text-[11px] text-[var(--text-muted)] ov-tabular">
                  {analytics.basePjpData.allOutlets.length} outlets
                </span>
              </button>
              {filteredAccounts.map((grp) => (
                <button
                  key={grp.account}
                  type="button"
                  onClick={() => {
                    setDraftAccount(grp.account);
                    if (!grp.outlets.some((o) => o.id === draftOutlet)) {
                      setDraftOutlet('All');
                    }
                  }}
                  className={`w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                    draftAccount === grp.account
                      ? 'bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF] font-bold'
                      : 'text-[var(--text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <span className="truncate">{grp.account}</span>
                  <span className="text-[11px] text-[var(--text-muted)] ov-tabular">
                    {grp.outlets.length} outlets
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Searchable Cascading Outlet Filter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text-secondary)]">
                Outlet ({cascadingOutlets.length})
              </span>
              {draftOutlet !== 'All' && (
                <button
                  type="button"
                  onClick={() => setDraftOutlet('All')}
                  className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] cursor-pointer"
                >
                  Clear outlet
                </button>
              )}
            </div>
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={outletQuery}
                onChange={(e) => setOutletQuery(e.target.value)}
                placeholder="Search branch name or SAP code"
                className="w-full min-h-[42px] pl-9 pr-3 rounded-xl ov-glass-recessed text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
              />
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1 pr-0.5">
              <button
                type="button"
                onClick={() => setDraftOutlet('All')}
                className={`w-full min-h-[40px] px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between cursor-pointer ${
                  draftOutlet === 'All'
                    ? 'bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF] font-bold'
                    : 'text-[var(--text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>All outlets in {draftAccount === 'All' ? 'territory' : draftAccount}</span>
              </button>
              {cascadingOutlets.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setDraftOutlet(o.id);
                    setDraftAccount(o.account);
                  }}
                  className={`w-full min-h-[42px] px-3 py-1.5 rounded-xl text-left flex items-center justify-between gap-2 cursor-pointer ${
                    draftOutlet === o.id
                      ? 'bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C8FF]'
                      : 'text-[var(--text-primary)] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">
                      {draftAccount === 'All' ? `${o.account} — ${o.branch}` : o.branch}
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)] ov-tabular">
                      {o.code ? `SAP ${o.code}` : o.account}
                      {o.hasLiveAudit ? ' · Live audit' : o.hasSheet2Audit ? ' · Sheet 2' : ''}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleResetDraft}
            className="min-h-[44px] px-4 rounded-xl ov-glass-recessed text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 min-h-[44px] px-5 rounded-xl btn-electric-blue text-xs font-extrabold cursor-pointer active:scale-[0.98] transition-transform"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* =========================================================================
   2. FULL-SCREEN SHELF EVIDENCE VIEWER MODAL (Category-Matched Only!)
   ========================================================================= */
export const ShelfEvidenceViewerModal: React.FC<{
  payload: EvidenceViewerPayload | null;
  onClose: () => void;
  isDark: boolean;
}> = ({ payload, onClose, isDark }) => {
  const [layer, setLayer] = useState<'annotated' | 'original' | 'planogram'>('annotated');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(
    null
  );

  const availableTabs = useMemo(() => {
    if (!payload) return [];
    const list: Array<{ id: 'original' | 'annotated' | 'planogram'; label: string; url: string }> =
      [];
    if (payload.annotatedUrl) {
      list.push({ id: 'annotated', label: 'AI Annotated', url: payload.annotatedUrl });
    }
    if (payload.originalUrl) {
      list.push({ id: 'original', label: 'Original', url: payload.originalUrl });
    }
    if (payload.planogramUrl) {
      list.push({ id: 'planogram', label: 'Planogram', url: payload.planogramUrl });
    }
    return list;
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (payload.annotatedUrl) setLayer('annotated');
    else if (payload.originalUrl) setLayer('original');
    else if (payload.planogramUrl) setLayer('planogram');
  }, [payload]);

  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [payload, onClose]);

  if (!payload || typeof document === 'undefined') return null;

  const activeTab =
    availableTabs.find((t) => t.id === layer) || availableTabs[0] || null;
  const prov = provenanceMetaLabel(payload.provenance);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-[#020D1F]/96 text-[#F5F7FA] backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`Shelf Evidence Viewer for ${payload.outletName} ${payload.category}`}
    >
      {/* Top Bar */}
      <div className="px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-lg sm:text-xl font-bold truncate">
              {payload.outletName} · {payload.category}
            </h3>
            <ProvenanceInline label={prov.text} tone={prov.tone} />
          </div>
          <p className="text-[11px] text-[#A4B8D4] ov-tabular truncate">
            {payload.sapCode ? `SAP ${payload.sapCode} · ` : ''}
            Audited {payload.lastAuditLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close evidence viewer"
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      {/* Mode Switcher Tabs (Only tabs with verified images) */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3 border-b border-white/[0.07] shrink-0">
        {availableTabs.length > 0 ? (
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.06]">
            {availableTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setLayer(t.id);
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className={`min-h-[36px] px-3 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  activeTab?.id === t.id
                    ? 'btn-electric-blue text-white'
                    : 'text-[#A4B8D4] hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-[#A4B8D4]">
            No shelf photo captured for {payload.category}
          </span>
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))));
              if (zoom <= 1.5) setPan({ x: 0, y: 0 });
            }}
            aria-label="Zoom out"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <span className="text-xs font-mono ov-tabular w-11 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.5).toFixed(1))))}
            aria-label="Zoom in"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/15 flex items-center justify-center cursor-pointer"
          >
            <Plus size={14} />
          </button>
          {zoom > 1 && (
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="min-h-[36px] px-2.5 rounded-xl bg-white/10 text-[11px] font-bold cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Zoomable Canvas */}
      <div
        className="flex-1 relative overflow-hidden flex items-center justify-center p-4 select-none"
        onDoubleClick={() => {
          if (zoom > 1) {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          } else {
            setZoom(2);
          }
        }}
        onPointerDown={(e) => {
          if (zoom <= 1) return;
          dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            origX: pan.x,
            origY: pan.y
          };
        }}
        onPointerMove={(e) => {
          if (!dragRef.current || zoom <= 1) return;
          setPan({
            x: dragRef.current.origX + (e.clientX - dragRef.current.startX),
            y: dragRef.current.origY + (e.clientY - dragRef.current.startY)
          });
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
      >
        {activeTab ? (
          <img
            src={activeTab.url}
            alt={`${payload.outletName} ${payload.category} ${activeTab.label}`}
            draggable={false}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transition: dragRef.current ? 'none' : 'transform 160ms ease-out'
            }}
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="max-w-sm rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-center space-y-2">
            <Camera size={24} className="mx-auto text-[#00C8FF] opacity-80" />
            <div className="text-sm font-bold">
              No {payload.category} photo captured
            </div>
            <p className="text-xs text-[#A4B8D4]">
              Complete a live {payload.category} audit at {payload.branch} to inspect Original and AI Annotated shelf imagery here.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Glass Telemetry Strip */}
      <div className="px-4 py-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-white/10 bg-[#04152B]/90 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs ov-tabular shrink-0">
        <div>
          <div className="text-[10px] text-[#A4B8D4]">Category SOS</div>
          <div className="font-bold text-sm mt-0.5">
            {payload.sosPct !== null ? `${payload.sosPct}%` : 'No data'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#A4B8D4]">Planogram Score</div>
          <div className="font-bold text-sm mt-0.5">
            {payload.complianceScore !== null ? `${payload.complianceScore}%` : 'Not scored'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#A4B8D4]">Missing Planned Brands</div>
          <div className="font-bold text-sm mt-0.5 truncate text-amber-400">
            {payload.missingBrands.length > 0 ? payload.missingBrands.join(', ') : 'None flagged'}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-[#A4B8D4]">Unmapped Detections</div>
          <div className="font-bold text-sm mt-0.5 truncate">
            {payload.unmappedBrands.length > 0 ? payload.unmappedBrands.join(', ') : 'None'}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

/* =========================================================================
   3. ACCOUNT DETAIL VIEW
   ========================================================================= */
export const AccountDetailView: React.FC<{
  accountGroup: AccountGroupSummary;
  onBack: () => void;
  onSelectOutlet: (outletId: string) => void;
  onScopeToAccount: (account: string) => void;
}> = ({ accountGroup, onBack, onSelectOutlet, onScopeToAccount }) => {
  const maxMton = Math.max(1, ...accountGroup.outlets.map((o) => o.filteredMton));
  const totalOos =
    accountGroup.oosTotals.Flour +
    accountGroup.oosTotals['Edible Oil'] +
    accountGroup.oosTotals.Pasta;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 rounded-xl ov-glass text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => onScopeToAccount(accountGroup.account)}
          className="min-h-[40px] px-3.5 rounded-xl btn-electric-blue text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair size={13} />
          <span>Scope Overview to Account</span>
        </button>
      </div>

      <div className="ov-glass-strong rounded-[24px] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] uppercase tracking-wider">
              Account Intelligence
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {accountGroup.account}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 ov-tabular">
              {accountGroup.outlets.length} assigned stores · {accountGroup.sharePct}% territory volume share
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl ov-glass-recessed flex items-center justify-center text-[#0066FF] dark:text-[#00C8FF]">
            <Building2 size={18} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] ov-tabular">
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">
              Est. Volume <ProvenanceInline label="· Sim" tone="simulated" />
            </div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
              {accountGroup.mton} <span className="text-xs font-sans font-semibold">MTON</span>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Avg SOS</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
              {accountGroup.sosPct}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Zero-Facing Proxy</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)]">
              {totalOos}
            </div>
          </div>
        </div>
      </div>

      <div className="ov-glass rounded-[22px] p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[var(--text-primary)]">
          <span>Stores Ranked by Contribution</span>
          <div className="flex items-center gap-3 text-[11px] font-medium text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#008DFF]" />
              Metric Ton Sold
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              SOS %
            </span>
          </div>
        </div>

        <div className="space-y-2">
          {accountGroup.outlets.map((o, idx) => {
            const mtonBarPct = Math.min(100, Math.max(4, (o.filteredMton / maxMton) * 100));
            const sosBarPct = Math.min(100, Math.max(0, o.filteredSos));
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelectOutlet(o.id)}
                className="w-full p-3 rounded-2xl ov-glass-recessed hover:border-[#0066FF]/40 text-left cursor-pointer space-y-2.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex items-center gap-2.5">
                    <span className="text-xs font-mono text-[var(--text-muted)] w-5 ov-tabular">
                      {idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {o.branch}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] ov-tabular">
                        {o.code ? `SAP ${o.code}` : o.account}
                        {o.hasLiveAudit
                          ? ' · Live audit'
                          : o.hasSheet2Audit
                          ? ' · Sheet 2 audit'
                          : ''}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-[var(--text-muted)] shrink-0" />
                </div>

                {/* Dual Bars: Metric Ton Sold & SOS % */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-7">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] ov-tabular">
                      <span className="text-[var(--text-secondary)] font-medium">
                        Metric Ton Sold
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {o.filteredMton} MTON
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${mtonBarPct.toFixed(1)}%`,
                          background: 'linear-gradient(90deg, #0066FF 0%, #00C8FF 100%)'
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10.5px] ov-tabular">
                      <span className="text-[var(--text-secondary)] font-medium">
                        SOS %
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {o.filteredSos}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${sosBarPct.toFixed(1)}%`,
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
      </div>
    </div>
  );
};

/* =========================================================================
   4. OUTLET DETAIL VIEW (Strict Category-Matched Shelf Photos!)
   ========================================================================= */
export const OutletDetailView: React.FC<{
  outlet: MasterOutletMetrics;
  initialCategory?: CategoryType;
  onBack: () => void;
  onScopeToOutlet: (outlet: MasterOutletMetrics) => void;
  onOpenEvidence: (payload: EvidenceViewerPayload) => void;
}> = ({
  outlet,
  initialCategory = 'Flour',
  onBack,
  onScopeToOutlet,
  onOpenEvidence
}) => {
  const [cat, setCat] = useState<CategoryType>(initialCategory);

  useEffect(() => {
    setCat(initialCategory);
  }, [initialCategory, outlet.id]);

  const evidence = outlet.shelfEvidenceByCategory[cat];
  const sosProv = provenanceMetaLabel(outlet.sosProvenanceByCategory[cat]);
  const oosProv = provenanceMetaLabel(outlet.oosProvenanceByCategory[cat]);
  const pgScore = outlet.planogramScoreByCategory[cat];
  const primaryPhoto = evidence.annotatedUrl || evidence.originalUrl || evidence.planogramUrl;

  const posmRows: Array<{ label: string; state: PosmEvalState }> = [
    { label: 'Shelf strips', state: outlet.posmStates.shelfStrips },
    { label: 'Wobblers', state: outlet.posmStates.wobblers },
    { label: 'Gondola', state: outlet.posmStates.gondola },
    { label: 'Price tag', state: outlet.posmStates.priceTag }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 rounded-xl ov-glass text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={() => onScopeToOutlet(outlet)}
          className="min-h-[40px] px-3.5 rounded-xl btn-electric-blue text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Crosshair size={13} />
          <span>Scope Overview to Outlet</span>
        </button>
      </div>

      {/* Store Identity Hero */}
      <div className="ov-glass-strong rounded-[24px] p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] uppercase tracking-wider">
              Outlet Intelligence · {outlet.account}
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-[var(--text-primary)] truncate mt-0.5">
              {outlet.branch}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 ov-tabular">
              {outlet.code ? `SAP ${outlet.code} · ` : ''}
              {outlet.isRouteOutlet ? 'Active PJP Route' : 'Assigned Territory'} · Last visit:{' '}
              {outlet.lastVisit}
            </p>
          </div>
          <div className="w-10 h-10 rounded-2xl ov-glass-recessed flex items-center justify-center text-[#0066FF] dark:text-[#00C8FF] shrink-0">
            <Store size={18} />
          </div>
        </div>

        {/* Category Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl ov-glass-recessed">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`min-h-[38px] rounded-xl text-xs font-bold cursor-pointer transition-all ${
                cat === c
                  ? 'btn-electric-blue text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {c === 'Edible Oil' ? 'Edible Oil' : c}
            </button>
          ))}
        </div>

        {/* Category Metrics */}
        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08] ov-tabular">
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">
              SOS · <ProvenanceInline label={sosProv.text} tone={sosProv.tone} />
            </div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {outlet.sosByCategory[cat]}%
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Planogram (85/70)</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {pgScore !== null ? `${pgScore}%` : 'No data'}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-muted)]">Zero-Facing Proxy</div>
            <div className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {oosProv.tone === 'unavailable' ? '—' : outlet.oosByCategory[cat]}
            </div>
          </div>
        </div>
      </div>

      {/* Category-Matched Shelf Photo Card */}
      <div className="ov-glass rounded-[22px] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-[var(--text-primary)]">
              {cat} Shelf Evidence
            </div>
            <ProvenanceInline
              label={
                primaryPhoto
                  ? `Category-matched · ${provenanceMetaLabel(evidence.provenance).text}`
                  : `No ${cat} photo captured yet`
              }
              tone={primaryPhoto ? provenanceMetaLabel(evidence.provenance).tone : 'unavailable'}
            />
          </div>
          {primaryPhoto && (
            <button
              type="button"
              onClick={() =>
                onOpenEvidence({
                  outletId: outlet.id,
                  outletName: outlet.name,
                  branch: outlet.branch,
                  sapCode: outlet.code,
                  category: cat,
                  originalUrl: evidence.originalUrl,
                  annotatedUrl: evidence.annotatedUrl,
                  planogramUrl: evidence.planogramUrl,
                  sosPct: evidence.sosPct,
                  complianceScore: evidence.complianceScore,
                  missingBrands: evidence.missingBrands,
                  unmappedBrands: evidence.unmappedBrands,
                  lastAuditLabel: evidence.auditTimestamp || outlet.lastVisit,
                  provenance: evidence.provenance
                })
              }
              className="min-h-[36px] px-3 rounded-xl ov-glass-recessed text-xs font-bold text-[#0066FF] dark:text-[#00C8FF] flex items-center gap-1.5 cursor-pointer"
            >
              <Maximize2 size={13} />
              <span>Inspect Full Screen</span>
            </button>
          )}
        </div>

        {primaryPhoto ? (
          <button
            type="button"
            onClick={() =>
              onOpenEvidence({
                outletId: outlet.id,
                outletName: outlet.name,
                branch: outlet.branch,
                sapCode: outlet.code,
                category: cat,
                originalUrl: evidence.originalUrl,
                annotatedUrl: evidence.annotatedUrl,
                planogramUrl: evidence.planogramUrl,
                sosPct: evidence.sosPct,
                complianceScore: evidence.complianceScore,
                missingBrands: evidence.missingBrands,
                unmappedBrands: evidence.unmappedBrands,
                lastAuditLabel: evidence.auditTimestamp || outlet.lastVisit,
                provenance: evidence.provenance
              })
            }
            className="w-full h-44 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 relative group cursor-pointer block"
          >
            <img
              src={primaryPhoto}
              alt={`${outlet.branch} ${cat} shelf evidence`}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-[#020D1F]/80 text-white text-[11px] font-bold flex items-center gap-1 backdrop-blur-md">
              <Eye size={12} />
              <span>Zoom & Layers</span>
            </span>
          </button>
        ) : (
          <div className="h-28 rounded-2xl ov-glass-recessed flex flex-col items-center justify-center gap-1.5 text-xs text-[var(--text-muted)]">
            <Camera size={18} className="opacity-70" />
            <span>No {cat} photo recorded at {outlet.branch}</span>
          </div>
        )}
      </div>

      {/* POSM & Freshness */}
      <div className="ov-glass rounded-[22px] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--text-primary)]">
            POSM & Freshness Verification
          </span>
          <ProvenanceInline
            label={outlet.hasLiveAudit ? 'Live audit' : 'Not evaluated'}
            tone={outlet.hasLiveAudit ? 'live' : 'unavailable'}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {posmRows.map((r) => (
            <div
              key={r.label}
              className="px-3 py-2 rounded-xl ov-glass-recessed flex items-center justify-between gap-2"
            >
              <span className="text-[var(--text-secondary)]">{r.label}</span>
              <span
                className={`font-bold ${
                  r.state === 'Present'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : r.state === 'Missing'
                    ? 'text-rose-500'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {r.state}
              </span>
            </div>
          ))}
        </div>
        <div className="text-xs text-[var(--text-secondary)] pt-1">
          Freshness: <strong className="text-[var(--text-primary)]">{outlet.freshness.note}</strong>
        </div>
      </div>
    </div>
  );
};

/* =========================================================================
   5. AVAILABILITY DETAIL VIEW
   ========================================================================= */
export const AvailabilityDetailView: React.FC<{
  outlet: MasterOutletMetrics;
  category: CategoryType;
  onBack: () => void;
  onOpenOutlet: () => void;
  onOpenEvidence: (payload: EvidenceViewerPayload) => void;
}> = ({ outlet, category, onBack, onOpenOutlet, onOpenEvidence }) => {
  const ev = outlet.shelfEvidenceByCategory[category];
  const oosProv = outlet.oosProvenanceByCategory[category];
  const provMeta = provenanceMetaLabel(oosProv);
  const photo = ev.annotatedUrl || ev.originalUrl || ev.planogramUrl;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 rounded-xl ov-glass text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
        <button
          type="button"
          onClick={onOpenOutlet}
          className="min-h-[40px] px-3.5 rounded-xl ov-glass text-xs font-bold text-[#0066FF] dark:text-[#00C8FF] flex items-center gap-1 cursor-pointer"
        >
          <span>Full Outlet View</span>
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="ov-glass-strong rounded-[24px] p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] uppercase tracking-wider">
              Availability Proxy Detail · {category}
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {outlet.account} — {outlet.branch}
            </h3>
            <ProvenanceInline
              label={`Brand-Class Zero-Facing Proxy · ${provMeta.text}`}
              tone={provMeta.tone}
            />
          </div>
          <div className="font-heading text-4xl font-extrabold ov-tabular text-[var(--text-primary)]">
            {oosProv === 'unavailable' ? '—' : outlet.oosByCategory[category]}
          </div>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {oosProv === 'unavailable'
            ? `No live or Sheet 2 audit exists for ${category} at ${outlet.branch}. Audit this category to verify actual shelf availability.`
            : oosProv === 'historical_verified'
            ? `Sheet 2 historical audit recorded ${outlet.oosByCategory[category]} SKU gap(s) on ${ev.auditTimestamp || outlet.lastVisit}.`
            : `Vision AI detected ${outlet.oosByCategory[category]} brand class(es) with 0 facings during the live ${category} audit.`}
        </p>

        {ev.missingBrands.length > 0 && (
          <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] text-xs">
            <span className="text-[var(--text-muted)]">Missing planned QFI brands: </span>
            <strong className="text-rose-500">{ev.missingBrands.join(', ')}</strong>
          </div>
        )}

        {photo && (
          <button
            type="button"
            onClick={() =>
              onOpenEvidence({
                outletId: outlet.id,
                outletName: outlet.name,
                branch: outlet.branch,
                sapCode: outlet.code,
                category,
                originalUrl: ev.originalUrl,
                annotatedUrl: ev.annotatedUrl,
                planogramUrl: ev.planogramUrl,
                sosPct: ev.sosPct,
                complianceScore: ev.complianceScore,
                missingBrands: ev.missingBrands,
                unmappedBrands: ev.unmappedBrands,
                lastAuditLabel: ev.auditTimestamp || outlet.lastVisit,
                provenance: ev.provenance
              })
            }
            className="w-full h-40 rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 relative cursor-pointer block mt-2"
          >
            <img
              src={photo}
              alt={`${outlet.branch} ${category} shelf`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-[#020D1F]/80 text-white text-[11px] font-bold">
              Open Shelf Evidence
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

/* =========================================================================
   6. PROMOTION INTELLIGENCE VIEW (Flyers Simulated + Live/Demo Comp Promos)
   ========================================================================= */
export const PromotionIntelligencePanels: React.FC<{
  analytics: AnalyticsController;
  isDark: boolean;
  showSectionHeader?: boolean;
}> = ({ analytics, isDark, showSectionHeader = false }) => {
  const { metrics, palette, categoryFilter, accountFilter, outletFilter } = analytics;
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [showDemoPromos, setShowDemoPromos] = useState<boolean>(true);

  const renderPromoCard = (cp: PromoListItem) => {
    const isSelected = selectedPromoId === cp.id;
    return (
      <div key={cp.id} className="space-y-1.5">
        <button
          type="button"
          onClick={() => setSelectedPromoId((prev) => (prev === cp.id ? null : cp.id))}
          className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-2xl ov-glass-recessed flex items-center gap-3 text-left cursor-pointer transition-all ${
            isSelected ? 'ring-2 ring-[#0066FF] dark:ring-[#00C8FF]' : ''
          }`}
        >
          <span className="flex-1 text-xs font-bold text-[var(--text-primary)] truncate">
            {cp.account} · {cp.category} · {cp.brand}
          </span>
          <span className="text-[11px] text-[var(--text-muted)] ov-tabular shrink-0">
            {cp.count} spot{cp.count === 1 ? '' : 's'}
          </span>
          <ChevronRight
            size={14}
            className={`text-[var(--text-muted)] transition-transform ${
              isSelected ? 'rotate-90' : ''
            }`}
          />
        </button>

        {isSelected && (
          <div className="ov-glass rounded-2xl p-3.5 text-xs space-y-2 animate-fade-in">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-[var(--text-primary)]">{cp.outletName}</div>
                <ProvenanceInline
                  label={cp.isLive ? 'Live Questionnaire Entry' : 'Demo Sample'}
                  tone={cp.isLive ? 'live' : 'simulated'}
                />
              </div>
              <span className="text-[11px] text-[var(--text-muted)] ov-tabular">
                {cp.spottedDate}
              </span>
            </div>
            <p className="text-[var(--text-secondary)]">{cp.offerDetails}</p>
            {cp.photoUrl && (
              <div className="h-32 rounded-xl overflow-hidden border border-black/10 dark:border-white/10">
                <img
                  src={cp.photoUrl}
                  alt={`${cp.brand} promo`}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Flyer Promo Status */}
      <div className="ov-glass rounded-[24px] p-5 space-y-4">
        {showSectionHeader && (
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl ov-glass-recessed flex items-center justify-center text-[#0066FF] dark:text-[#00C8FF] shrink-0">
                <Sparkles size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Promotion &amp; Flyer Intelligence
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] ov-tabular">
                  {metrics.flyerDonut.activePct}% active flyer index (Simulated) ·{' '}
                  {metrics.livePromos.length} live &amp; {metrics.demoPromos.length} demo competitor promos
                </p>
              </div>
            </div>
            <ProvenanceInline label="Flyers Simulated · Comp Promos Separated" tone="simulated" />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-baseline gap-2 mb-3">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Flyer Promo Status
              </h4>
              <ProvenanceInline label="Simulated" tone="simulated" />
            </div>
            <div className="flex items-center gap-5">
              <svg viewBox="0 0 120 120" className="w-[110px] h-[110px] shrink-0">
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
                <text
                  x="60"
                  y="64"
                  textAnchor="middle"
                  className="font-heading"
                  fontSize="22"
                  fontWeight="800"
                  fill={isDark ? '#F5F7FA' : '#0B1D36'}
                >
                  {metrics.flyerDonut.activePct}%
                </text>
              </svg>
              <div className="space-y-2 text-xs ov-tabular">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: palette.cyan }} />
                  <span>Promo active · {metrics.flyerDonut.activePct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: palette.crimson }}
                  />
                  <span>Promo missing · {metrics.flyerDonut.missingPct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: palette.competitorBar }}
                  />
                  <span>Not applicable · {metrics.flyerDonut.naPct}%</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h4 className="text-sm font-bold text-[var(--text-primary)]">
                Flyer Items by {outletFilter !== 'All' ? 'Outlet' : 'Account'}
              </h4>
              <span className="text-[11px] text-[var(--text-muted)]">
                {categoryFilter} · {accountFilter}
              </span>
            </div>
            <div className="space-y-2.5">
              {metrics.flyerBreakdownRows.map((row) => (
                <div key={row.id} className="flex items-center gap-2.5">
                  <span className="w-24 text-xs font-medium text-[var(--text-primary)] truncate shrink-0">
                    {row.label}
                  </span>
                  <div className="flex-1 h-3 rounded-md overflow-hidden flex bg-black/10 dark:bg-white/10">
                    <div style={{ width: `${row.present}%`, backgroundColor: palette.cyan }} />
                    <div style={{ width: `${row.missing}%`, backgroundColor: palette.crimson }} />
                    <div style={{ width: `${row.wrongPrice}%`, backgroundColor: palette.amber }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Competitor Promos — Strict Separation */}
      <div className="ov-glass rounded-[24px] p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-[var(--text-primary)]">
              Competitor Promotions Spotted
            </h4>
            <p className="text-[11px] text-[var(--text-muted)]">
              Live questionnaire submissions kept strictly separate from sample promo items
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDemoPromos((v) => !v)}
            className="text-[11px] font-bold text-[#0066FF] dark:text-[#00C8FF] cursor-pointer"
          >
            {showDemoPromos ? 'Hide Demo' : 'Show Demo'}
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-500">
            Live Questionnaire Entries ({metrics.livePromos.length})
          </div>
          {metrics.livePromos.length === 0 ? (
            <div className="p-3 rounded-2xl ov-glass-recessed text-xs text-[var(--text-muted)]">
              No live competitor promos reported in current session filters yet.
            </div>
          ) : (
            metrics.livePromos.map(renderPromoCard)
          )}
        </div>

        {showDemoPromos && (
          <div className="space-y-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Simulated Demo Entries ({metrics.demoPromos.length})
            </div>
            {metrics.demoPromos.length === 0 ? (
              <div className="p-3 rounded-2xl ov-glass-recessed text-xs text-[var(--text-muted)]">
                No demo promos match current filters.
              </div>
            ) : (
              metrics.demoPromos.map(renderPromoCard)
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const PromotionIntelligenceView: React.FC<{
  analytics: AnalyticsController;
  onBack: () => void;
  isDark: boolean;
}> = ({ analytics, onBack, isDark }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 rounded-xl ov-glass text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Execution</span>
        </button>
        <ProvenanceInline label="Flyers Simulated · Comp Promos Separated" tone="simulated" />
      </div>

      <PromotionIntelligencePanels analytics={analytics} isDark={isDark} />
    </div>
  );
};

/* =========================================================================
   7. DAILY JOURNEY DETAIL VIEW
   ========================================================================= */
export const DailyJourneyDetailView: React.FC<{
  analytics: AnalyticsController;
  day: number;
  onBack: () => void;
  onSelectOutlet: (outletId: string) => void;
}> = ({ analytics, day, onBack, onSelectOutlet }) => {
  const { scheduleMeta, basePjpData } = analytics;
  const entry = scheduleMeta.scheduleByDay[day];
  const isFuture = day > scheduleMeta.cutoffDay;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] px-3 rounded-xl ov-glass text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Productivity</span>
        </button>
        {entry?.isSimulatedCompletion && (
          <ProvenanceInline label="Simulated completion ratio" tone="simulated" />
        )}
      </div>

      <div className="ov-glass-strong rounded-[24px] p-5 space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-[#0066FF] dark:text-[#00C8FF] uppercase tracking-wider">
              Daily Route Journey
            </div>
            <h3 className="font-heading text-2xl font-extrabold text-[var(--text-primary)] mt-0.5">
              {entry ? entry.dateStr : `${day} ${scheduleMeta.monthShort}`} · {scheduleMeta.year}
            </h3>
          </div>
          <CalendarDays size={20} className="text-[#0066FF] dark:text-[#00C8FF]" />
        </div>
        <p className="text-xs text-[var(--text-secondary)] ov-tabular">
          {entry
            ? isFuture
              ? `Upcoming PJP route · ${entry.plannedCount} scheduled outlets`
              : `${entry.completedCount} of ${entry.plannedCount} scheduled stops (${
                  entry.isSimulatedCompletion ? 'Simulated history' : 'Verified logs'
                })`
            : 'No PJP route planned on this date.'}
        </p>
      </div>

      {entry && entry.outlets.length > 0 && (
        <div className="ov-glass rounded-[22px] p-4 space-y-2">
          {entry.outlets.map((st, idx) => {
            const matchedOutlet = basePjpData.allOutlets.find(
              (o) =>
                (st.code && o.code === st.code) ||
                o.name.toLowerCase().includes(st.name.toLowerCase()) ||
                o.branch.toLowerCase() === st.area.toLowerCase()
            );
            const stStatus = st.verifiedStatus || (isFuture ? 'planned' : 'simulated');
            return (
              <button
                key={`${st.name}-${idx}`}
                type="button"
                disabled={!matchedOutlet}
                onClick={() => matchedOutlet && onSelectOutlet(matchedOutlet.id)}
                className={`w-full p-3 rounded-2xl ov-glass-recessed flex items-center justify-between gap-3 text-left ${
                  matchedOutlet ? 'cursor-pointer hover:border-[#0066FF]/40' : 'cursor-default'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[#0066FF]/12 text-[#0066FF] dark:text-[#00C8FF] text-xs font-extrabold flex items-center justify-center shrink-0 ov-tabular">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {st.name}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate ov-tabular">
                      {st.account} · {st.area}
                      {st.code ? ` · SAP ${st.code}` : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[11px] font-bold ${
                      stStatus === 'completed'
                        ? 'text-emerald-500'
                        : stStatus === 'partial'
                        ? 'text-amber-500'
                        : stStatus === 'missed'
                        ? 'text-rose-500'
                        : stStatus === 'simulated'
                        ? 'text-amber-500'
                        : 'text-[#0066FF] dark:text-[#00C8FF]'
                    }`}
                  >
                    {stStatus === 'completed'
                      ? 'Verified'
                      : stStatus === 'partial'
                      ? 'Partial'
                      : stStatus === 'missed'
                      ? 'Missed'
                      : stStatus === 'simulated'
                      ? 'Simulated'
                      : 'Planned'}
                  </span>
                  {matchedOutlet && (
                    <ChevronRight size={14} className="text-[var(--text-muted)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export type _UnusedGuard2 = CanonicalPlanogramSummary | typeof Sparkles | typeof CheckCircle2 | typeof AlertTriangle | typeof ShieldAlert;
