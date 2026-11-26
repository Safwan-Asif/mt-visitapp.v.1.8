import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  Check,
  ChevronRight,
  Lock,
  ArrowRight,
  Clock
} from 'lucide-react';
import { Outlet, CategoryType, CategoryAuditRecord, PlanogramRecord } from '../types';
import { CATEGORIES } from '../constants';
import { FinishOutletScreen } from './FinishOutletScreen';
import {
  fetchActivePlanograms,
  findActivePlanogramForOutlet,
  getPlannedQfiTotal
} from '../services/planogramService';
import { CategoryMonogramBadge, MiniProgressRing } from './pjp/PjpPrimitives';

interface OutletOverviewProps {
  outlet: Outlet;
  audits: Record<string, CategoryAuditRecord>;
  planograms?: PlanogramRecord[];
  isLastPendingOutlet?: boolean;
  onBack: () => void;
  onSelectCategory: (category: CategoryType) => void;
  onFinishOutlet?: (confidence: string) => void;
  onFinishScreenChange?: (active: boolean) => void;
}

export const OutletOverview: React.FC<OutletOverviewProps> = ({
  outlet,
  audits,
  planograms,
  isLastPendingOutlet = false,
  onBack,
  onSelectCategory,
  onFinishOutlet,
  onFinishScreenChange
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [showFinishScreen, setShowFinishScreen] = useState<boolean>(false);
  const [localPlanograms, setLocalPlanograms] = useState<PlanogramRecord[]>(planograms || []);

  useEffect(() => {
    fetchActivePlanograms(true)
      .then((list) => {
        if (list.length > 0) setLocalPlanograms(list);
      })
      .catch(() => {});
  }, [outlet.id]);

  const activePlanogramPool = planograms && planograms.length > 0 ? planograms : localPlanograms;

  const categories = CATEGORIES;
  const completedCount = categories.filter((cat) => outlet.progress[cat] === 'Completed').length;
  const allDone = completedCount === categories.length;

  const openFinishScreen = () => {
    if (!allDone) return;
    setShowFinishScreen(true);
    onFinishScreenChange?.(true);
  };

  if (showFinishScreen) {
    return (
      <FinishOutletScreen
        outlet={outlet}
        visitId={outlet.visitId || `visit_${outlet.id}_${new Date().toISOString().slice(0, 10)}`}
        isLastPendingOutlet={isLastPendingOutlet}
        onFinishOutlet={(confidence) => {
          onFinishScreenChange?.(false);
          onFinishOutlet?.(confidence);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden select-none pjp-atmospheric-canvas">
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
        className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full h-full overflow-hidden px-4 pt-3 pb-[calc(86px+env(safe-area-inset-bottom,0px))] md:py-6"
      >
        {/* Top Store Audit Header */}
        <div className="space-y-4 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to Route"
                className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft size={19} />
              </button>
              <div className="min-w-0">
                <h1 className="font-heading font-extrabold text-[26px] leading-none tracking-tight text-[var(--text-primary)]">
                  Store Audit
                </h1>
                <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                  {outlet.name}
                  {outlet.code ? ` · SAP ${outlet.code}` : ''}
                </p>
              </div>
            </div>

            <MiniProgressRing completed={completedCount} total={3} size={46} />
          </div>

          {outlet.isUnmapped && outlet.unmappedRemark && (
            <div className="glass-subtle rounded-2xl px-3.5 py-2.5 text-xs text-amber-700 dark:text-amber-300 border-amber-500/35">
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                Unmapped Visit Reason
              </span>
              <span>{outlet.unmappedRemark}</span>
            </div>
          )}
        </div>

        {/* Category Audit Selection Rows */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">
              Select Category to Audit
            </h2>
            <span className="text-[11px] font-bold text-[#008DFF] dark:text-[#00C8FF] tabular-nums">
              {completedCount}/3 Done
            </span>
          </div>

          <div className="space-y-2.5">
            {categories.map((cat) => {
              const status = outlet.progress[cat] || 'Not Started';
              const isCompleted = status === 'Completed';
              const isInProgress = status === 'In Progress';
              const auditKey = `${outlet.id}_${cat}`;
              const existingAudit = audits[auditKey];
              const matchedPlanogram = findActivePlanogramForOutlet(
                outlet,
                cat,
                activePlanogramPool
              );
              const plannedQfi = matchedPlanogram
                ? getPlannedQfiTotal(matchedPlanogram, cat)
                : 0;

              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => onSelectCategory(cat)}
                  className={`w-full rounded-3xl p-4 text-left transition-all cursor-pointer group flex items-center justify-between gap-3 active:scale-[0.985] ${
                    isCompleted
                      ? 'glass-panel border-[#22C55E]/45'
                      : 'glass-panel hover:border-[#008DFF]/65'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CategoryMonogramBadge category={cat} completed={isCompleted} size="md" />
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-extrabold text-[var(--text-primary)] group-hover:text-[#008DFF] dark:group-hover:text-[#00C8FF] transition-colors">
                        {cat}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] tabular-nums truncate mt-0.5">
                        {isCompleted && existingAudit
                          ? `${existingAudit.totalFacings} Facings · ${Math.round(
                              existingAudit.shareOfShelfPct ?? existingAudit.primarySharePct ?? 0
                            )}% SOS`
                          : matchedPlanogram
                          ? `Planogram v${matchedPlanogram.version} · ${plannedQfi} faces`
                          : 'Capture · POSM · Facings'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isCompleted ? (
                      <span className="w-7 h-7 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-[0_0_12px_rgba(34,197,94,0.45)]">
                        <Check size={14} strokeWidth={2.8} />
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 text-[11px] font-bold">
                        <Clock size={12} /> Resume
                      </span>
                    ) : (
                      <ChevronRight
                        size={18}
                        className="text-[var(--text-muted)] group-hover:text-[#00C8FF] transition-colors"
                      />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Gated Complete Outlet CTA */}
        <div className="pt-2 shrink-0">
          <button
            type="button"
            disabled={!allDone}
            onClick={openFinishScreen}
            className={`w-full min-h-[54px] rounded-full font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
              allDone
                ? 'btn-electric-blue cursor-pointer active:scale-[0.97]'
                : 'glass-panel text-[var(--text-muted)] opacity-75 cursor-not-allowed'
            }`}
          >
            {allDone ? (
              <>
                <span>Complete Outlet</span>
                <ArrowRight size={17} />
              </>
            ) : (
              <>
                <Lock size={15} />
                <span>Complete Outlet ({completedCount}/3 Audited)</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
