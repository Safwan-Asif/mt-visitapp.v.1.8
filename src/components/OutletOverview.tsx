import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Check,
  Clock,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { Outlet, CategoryType, CategoryAuditRecord, PlanogramRecord } from '../types';
import { CATEGORIES } from '../constants';
import { useTheme } from '../ThemeContext';
import { FinishOutletScreen } from './FinishOutletScreen';
import {
  fetchActivePlanograms,
  findActivePlanogramForOutlet,
  getPlannedQfiTotal
} from '../services/planogramService';

interface OutletOverviewProps {
  outlet: Outlet;
  audits: Record<string, CategoryAuditRecord>;
  planograms?: PlanogramRecord[];
  onBack: () => void;
  onSelectCategory: (category: CategoryType) => void;
  onFinishOutlet?: (confidence: string) => void;
  onFinishScreenChange?: (active: boolean) => void;
}

export const OutletOverview: React.FC<OutletOverviewProps> = ({
  outlet,
  audits,
  planograms,
  onBack,
  onSelectCategory,
  onFinishOutlet,
  onFinishScreenChange
}) => {
  const { isDark } = useTheme();
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
    setShowFinishScreen(true);
    onFinishScreenChange?.(true);
  };

  if (showFinishScreen) {
    return (
      <FinishOutletScreen
        outlet={outlet}
        visitId={outlet.visitId || `visit_${outlet.id}_${new Date().toISOString().slice(0, 10)}`}
        onFinishOutlet={(confidence) => {
          onFinishScreenChange?.(false);
          onFinishOutlet?.(confidence);
          onBack();
        }}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-5xl mx-auto w-full h-full overflow-hidden px-3.5 pt-3.5 md:px-8 md:pt-6 select-none animate-fade-in">
      {/* Top Back & Outlet Summary */}
      <div className="space-y-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[40px] inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors group cursor-pointer"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Route PJP</span>
        </button>

        <div className="glass-panel rounded-3xl p-4 md:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              Active Store Audit
            </span>
            <span className="text-xs font-mono font-bold tabular-nums text-[var(--text-secondary)]">
              Seq {outlet.sequence}
            </span>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--text-primary)] truncate">
              {outlet.name}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5 mt-1">
              <MapPin size={13} className="text-[var(--accent-primary)] shrink-0" />
              <span className="truncate tabular-nums">
                {outlet.code ? `SAP ${outlet.code} · ` : ''}
                {outlet.branch} &middot; {outlet.address || 'Doha Commercial District'}
              </span>
            </p>
          </div>

          {outlet.isUnmapped && (
            <div className="glass-subtle rounded-2xl p-2.5 text-xs text-amber-700 dark:text-amber-300">
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-0.5">
                Unmapped Visit Reason
              </span>
              <span>{outlet.unmappedRemark}</span>
            </div>
          )}

          <div className="pt-2.5 border-t border-[var(--border-glass)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">
              Audit Progress:{' '}
              <strong className="text-[var(--text-primary)] tabular-nums">
                {completedCount} of 3 Categories
              </strong>
            </span>
            <span className="font-extrabold tabular-nums text-[var(--accent-primary)]">
              {Math.round((completedCount / 3) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Audit Cards */}
      <div className="flex-1 overflow-y-auto pt-4 pb-24 md:pb-8 space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Mandatory Category Audits
          </h3>
          <span className="text-[11px] font-semibold text-[var(--accent-primary)]">
            Sub-2m Target
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                className="glass-panel rounded-3xl p-4 text-left transition-all cursor-pointer group flex flex-col justify-between gap-3 hover:border-[var(--border-glass-strong)] active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                        isCompleted
                          ? isDark
                            ? 'bg-emerald-500/20 text-[#34D399]'
                            : 'bg-[#084C41] text-white'
                          : isDark
                          ? 'bg-white/10 text-[#34D399]'
                          : 'bg-[#084C41]/10 text-[#084C41]'
                      }`}
                    >
                      {cat.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors">
                        {cat}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] tabular-nums leading-snug">
                        {matchedPlanogram
                          ? `Planogram v${matchedPlanogram.version} · ${plannedQfi} QFI faces`
                          : 'Photo · POSM · Facings'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pt-1">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent-primary)]">
                        <Check size={13} /> Done
                      </span>
                    ) : isInProgress ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
                        <Clock size={12} /> Resume
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">
                        Start
                      </span>
                    )}
                    <ChevronRight
                      size={16}
                      className="text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors"
                    />
                  </div>
                </div>

                {isCompleted && (
                  <div className="pt-2.5 border-t border-[var(--border-glass)] flex items-center justify-between text-xs text-[var(--text-secondary)] w-full">
                    <span className="flex items-center gap-1 font-semibold text-[var(--accent-primary)]">
                      <ShieldCheck size={13} />
                      {existingAudit?.annotatedPhotoUrl ? 'AI Annotated' : 'Verified CV'}
                    </span>
                    <span className="tabular-nums font-medium">
                      {existingAudit
                        ? `${existingAudit.totalFacings} Facings${
                            existingAudit.activeAisleCount && existingAudit.activeAisleCount > 1
                              ? ` (${existingAudit.activeAisleCount} Bays)`
                              : ''
                          }`
                        : 'Audit Logged'}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Finish Outlet Banner */}
        {allDone && (
          <div className="pt-2">
            <div className="glass-panel-strong rounded-3xl p-4 md:p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs font-bold text-[var(--accent-primary)]">
                <CheckCircle2 size={16} />
                <span>All 3 Categories Completed for {outlet.name}</span>
              </div>
              <button
                type="button"
                onClick={openFinishScreen}
                className={`w-full max-w-md mx-auto min-h-[52px] py-3.5 px-5 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#10B981] text-[#05231C] shadow-emerald-950/40'
                    : 'bg-[#084C41] text-white shadow-[#084C41]/25'
                }`}
              >
                <span>Finish Outlet &bull; Rate Confidence</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
