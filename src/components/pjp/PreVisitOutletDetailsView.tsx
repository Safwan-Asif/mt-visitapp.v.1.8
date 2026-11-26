import React, { useMemo, useState } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Navigation,
  ArrowRight,
  Store,
  Check,
  Clock
} from 'lucide-react';
import {
  CategoryAuditRecord,
  CategoryType,
  Outlet,
  PlanogramRecord
} from '../../types';
import { CATEGORIES } from '../../constants';
import {
  LivePjpDataset,
  resolveOutletCoordinates
} from '../../services/pjpService';
import {
  findActivePlanogramForOutlet,
  normalizeSapCode
} from '../../services/planogramService';
import { CategoryMonogramBadge } from './PjpPrimitives';

interface PreVisitOutletDetailsViewProps {
  outlet: Outlet;
  stopNumber: number;
  totalStops: number;
  audits: Record<string, CategoryAuditRecord>;
  livePjpDataset: LivePjpDataset;
  planograms: PlanogramRecord[];
  onBack: () => void;
  onStartStoreAudit: (outlet: Outlet) => void;
}

export const PreVisitOutletDetailsView: React.FC<PreVisitOutletDetailsViewProps> = ({
  outlet,
  stopNumber,
  totalStops,
  audits,
  livePjpDataset,
  planograms,
  onBack,
  onStartStoreAudit
}) => {
  const shouldReduceMotion = useReducedMotion();

  const defaultCat = useMemo<CategoryType>(() => {
    const firstPending = CATEGORIES.find((c) => outlet.progress[c] !== 'Completed');
    return firstPending || 'Flour';
  }, [outlet.progress]);

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>(defaultCat);
  const [checklistOpen, setChecklistOpen] = useState<boolean>(false);

  const sap = useMemo(
    () => normalizeSapCode(outlet.code || (outlet.id.startsWith('out-sap-') ? outlet.id.replace('out-sap-', '') : '')),
    [outlet.code, outlet.id]
  );

  const coords = useMemo(
    () => resolveOutletCoordinates(outlet, Math.max(0, stopNumber - 1)),
    [outlet, stopNumber]
  );

  const mapsHref = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;

  // Customer Master channel lookup
  const customerMeta = useMemo(() => {
    if (!sap) return undefined;
    return (livePjpDataset.customerMaster || []).find(
      (cm) => normalizeSapCode(cm.sapCode) === sap
    );
  }, [livePjpDataset.customerMaster, sap]);

  // Verified Last Visit lookup from local audits or Sheet 2 visits
  const lastVisitLabel = useMemo(() => {
    const localAuditTimestamps = CATEGORIES.map(
      (cat) => audits[`${outlet.id}_${cat}`]?.timestamp
    ).filter(Boolean);
    if (localAuditTimestamps.length > 0) {
      return `Today (${localAuditTimestamps[localAuditTimestamps.length - 1]})`;
    }

    const matchingVisits = (livePjpDataset.sheet2Visits || [])
      .filter((v) => sap && normalizeSapCode(v.sapCode) === sap && v.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (matchingVisits.length > 0) {
      return `Last Visit (${matchingVisits[0].date})`;
    }

    const matchingS2Audits = (livePjpDataset.sheet2Audits || [])
      .filter((a) => sap && normalizeSapCode(a.sapCode) === sap && a.date)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    if (matchingS2Audits.length > 0) {
      return `Last Visit (${matchingS2Audits[0].date})`;
    }

    return 'No prior visit logged';
  }, [audits, outlet.id, livePjpDataset.sheet2Visits, livePjpDataset.sheet2Audits, sap]);

  // Real category intelligence metrics from current session audit or Sheet 2 history
  const categoryIntel = useMemo(() => {
    const localAudit =
      audits[`${outlet.id}_${selectedCategory}`] ||
      (sap ? audits[`out-sap-${sap}_${selectedCategory}`] : undefined);

    const matchedPlanogram = findActivePlanogramForOutlet(
      outlet,
      selectedCategory,
      planograms
    );

    if (localAudit) {
      const sos = Math.round(localAudit.shareOfShelfPct ?? localAudit.primarySharePct ?? 0);
      const plano = localAudit.planogramCompliance?.hasPlanogram
        ? Math.round(localAudit.planogramCompliance.overallScore)
        : null;
      const oos = localAudit.planogramCompliance?.missingOwnBrands?.length ?? 0;
      return {
        source: 'Current Audit' as const,
        sosValue: `${sos}%`,
        sosSub: 'Today',
        planoValue: plano !== null ? `${plano}%` : '—',
        planoSub: plano !== null ? 'Compliant score' : 'No planogram',
        oosValue: `${oos}`,
        oosSub: oos === 0 ? 'In stock' : 'SKUs missing'
      };
    }

    const s2Match = (livePjpDataset.sheet2Audits || [])
      .filter((a) => {
        if (!sap || normalizeSapCode(a.sapCode) !== sap) return false;
        const catNorm = a.category.trim().toLowerCase();
        if (selectedCategory === 'Edible Oil') {
          return catNorm === 'edible oil' || catNorm === 'oil';
        }
        return catNorm === selectedCategory.toLowerCase();
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))[0];

    if (s2Match) {
      return {
        source: 'Prior Visit' as const,
        sosValue: `${Math.round(s2Match.shareOfShelfPct)}%`,
        sosSub: s2Match.date || 'Last visit',
        planoValue:
          s2Match.planogramCompliancePct > 0
            ? `${Math.round(s2Match.planogramCompliancePct)}%`
            : '—',
        planoSub: matchedPlanogram ? `Target v${matchedPlanogram.version}` : 'Historical',
        oosValue: `${s2Match.oosSkuCount}`,
        oosSub: s2Match.oosSkuCount === 0 ? 'All in stock' : 'OOS logged'
      };
    }

    return {
      source: 'No History' as const,
      sosValue: '—',
      sosSub: 'No prior data',
      planoValue: matchedPlanogram ? `v${matchedPlanogram.version}` : '—',
      planoSub: matchedPlanogram
        ? matchedPlanogram.target_sos
          ? `SOS goal ${matchedPlanogram.target_sos}%`
          : 'Planogram active'
        : 'No prior data',
      oosValue: '—',
      oosSub: 'Pending check'
    };
  }, [audits, outlet, selectedCategory, planograms, livePjpDataset.sheet2Audits, sap]);

  const doneCount = CATEGORIES.filter((c) => outlet.progress[c] === 'Completed').length;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22 }}
      className="flex-1 flex flex-col justify-between min-h-0 w-full max-w-md mx-auto md:max-w-none px-3.5 pt-2.5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:p-0 overflow-y-auto no-scrollbar"
    >
      <div className="space-y-3">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Route"
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] cursor-pointer active:scale-95"
          >
            <ChevronLeft size={19} />
          </button>

          <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] tabular-nums">
            Outlet {String(Math.max(1, stopNumber)).padStart(2, '0')} of{' '}
            {String(Math.max(1, totalStops)).padStart(2, '0')}
          </span>

          <div className="w-10" />
        </div>

        {/* Storefront Hero Identity Card */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          <div className="relative h-24 px-4 py-3 flex flex-col justify-between bg-gradient-to-br from-[#062042] via-[#0B2D59] to-[#04152B] border-b border-[#104878]/60">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full bg-[#008DFF]/25 border border-[#00C8FF]/45 text-[10px] font-extrabold uppercase tracking-wider text-[#00C8FF]">
                {customerMeta?.channel || 'Modern Trade'}
              </span>
              <span className="text-[10px] font-mono text-[#A5B8D5] tabular-nums">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-[#00C8FF] shrink-0">
                <Store size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate">
                  {outlet.account || customerMeta?.account || outlet.branch}
                </p>
                <p className="text-[10.5px] text-[#A5B8D5] truncate">
                  {outlet.address || `${outlet.branch}, Qatar`}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-[var(--text-primary)] leading-tight truncate">
                {outlet.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 tabular-nums truncate">
                {outlet.code ? `SAP ${outlet.code} · ` : ''}
                {customerMeta?.branch || outlet.branch}
              </p>
            </div>

            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Directions to ${outlet.name}`}
              title="Open Google Maps Directions"
              className="w-11 h-11 rounded-full btn-electric-blue flex items-center justify-center shrink-0 active:scale-95 transition-transform"
            >
              <Navigation size={17} />
            </a>
          </div>
        </div>

        {/* Last Visit + Category Intelligence Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              {lastVisitLabel}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#008DFF] dark:text-[#00C8FF]">
              {categoryIntel.source}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {(['Flour', 'Edible Oil', 'Pasta'] as CategoryType[]).map((cat) => {
              const isSelected = selectedCategory === cat;
              const shortLabel = cat === 'Edible Oil' ? 'ED' : cat === 'Flour' ? 'FL' : 'PA';
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`min-h-[42px] px-2 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'btn-electric-blue text-white'
                      : 'glass-panel text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="sm:hidden">{cat === 'Edible Oil' ? 'Edible Oil' : cat}</span>
                  <span className="hidden sm:inline">{cat}</span>
                  <span className="sr-only">{shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Historical KPI Intelligence Cards (SOS · Planogram · OOS) */}
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-panel rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              SOS
            </span>
            <div className="font-heading font-extrabold text-[26px] leading-none text-[var(--text-primary)] tabular-nums">
              {categoryIntel.sosValue}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block truncate">
              {categoryIntel.sosSub}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Planogram
            </span>
            <div className="font-heading font-extrabold text-[26px] leading-none text-[#22C55E] tabular-nums">
              {categoryIntel.planoValue}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block truncate">
              {categoryIntel.planoSub}
            </span>
          </div>

          <div className="glass-panel rounded-2xl p-3 text-center space-y-1">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              OOS
            </span>
            <div className="font-heading font-extrabold text-[26px] leading-none text-[var(--text-primary)] tabular-nums">
              {categoryIntel.oosValue}
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block truncate">
              {categoryIntel.oosSub}
            </span>
          </div>
        </div>

        {/* Collapsible Audit Checklist (3 Categories) */}
        <div className="glass-panel rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setChecklistOpen((v) => !v)}
            className="w-full min-h-[46px] px-4 py-2.5 flex items-center justify-between gap-2 text-left cursor-pointer"
          >
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-[var(--text-primary)]">
                Audit Checklist ({doneCount}/3 Categories)
              </p>
              <p className="text-[10.5px] text-[var(--text-secondary)]">
                ED · FL · PA (3 Mandatory Categories)
              </p>
            </div>
            {checklistOpen ? (
              <ChevronUp size={16} className="text-[var(--text-secondary)] shrink-0" />
            ) : (
              <ChevronDown size={16} className="text-[var(--text-secondary)] shrink-0" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {checklistOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="border-t border-[var(--border-glass)] divide-y divide-[var(--border-glass)]"
              >
                {CATEGORIES.map((cat) => {
                  const status = outlet.progress[cat] || 'Not Started';
                  const isDone = status === 'Completed';
                  return (
                    <div
                      key={cat}
                      className="px-4 py-2.5 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <CategoryMonogramBadge category={cat} completed={isDone} size="sm" />
                        <span className="font-bold text-[var(--text-primary)]">{cat}</span>
                      </div>
                      {isDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#22C55E]">
                          <Check size={12} /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)]">
                          <Clock size={12} /> {status}
                        </span>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Primary Action Pill CTA */}
      <div className="pt-3 shrink-0">
        <button
          type="button"
          onClick={() => onStartStoreAudit(outlet)}
          className="w-full min-h-[54px] rounded-full btn-electric-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.97]"
        >
          <span>
            {doneCount === 3
              ? 'Review Store Audit'
              : doneCount > 0
              ? 'Continue Store Audit'
              : 'Start Store Audit'}
          </span>
          <ArrowRight size={17} />
        </button>
      </div>
    </motion.div>
  );
};
