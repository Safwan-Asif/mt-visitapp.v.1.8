import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  Loader2
} from 'lucide-react';
import { CategoryType, Outlet, PlanogramComplianceResult, ComplianceBadgeStatus } from '../types';
import { useTheme } from '../ThemeContext';

interface PlanogramScorecardProps {
  outlet: Outlet;
  category: CategoryType;
  result: PlanogramComplianceResult;
  isSubmittingAck?: boolean;
  onDone: (executiveNote: string) => void;
}

function getStatusStyles(status: ComplianceBadgeStatus, isDark: boolean) {
  if (status === 'COMPLIANT') {
    return {
      text: isDark ? 'text-emerald-400' : 'text-[#084C41]',
      ringStroke: isDark ? '#10B981' : '#084C41',
      Icon: CheckCircle2
    };
  }
  if (status === 'PARTIAL') {
    return {
      text: isDark ? 'text-amber-400' : 'text-amber-700',
      ringStroke: '#D97706',
      Icon: AlertTriangle
    };
  }
  return {
    text: isDark ? 'text-rose-400' : 'text-rose-700',
    ringStroke: '#DC2626',
    Icon: XCircle
  };
}

export const PlanogramScorecard: React.FC<PlanogramScorecardProps> = ({
  outlet,
  category,
  result,
  isSubmittingAck = false,
  onDone
}) => {
  const { isDark } = useTheme();
  const [executiveNote, setExecutiveNote] = useState<string>('');
  const [expandedBays, setExpandedBays] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    if (result.bayDiagnostics.length > 0) {
      initial[result.bayDiagnostics[0].bayIndex] = true;
    }
    return initial;
  });

  const toggleBay = (bayIdx: number) => {
    setExpandedBays((prev) => ({ ...prev, [bayIdx]: !prev[bayIdx] }));
  };

  const heroStyles = getStatusStyles(result.overallStatus, isDark);
  const brandStyles = getStatusStyles(result.brandStatus, isDark);
  const companyStyles = getStatusStyles(result.companyStatus, isDark);

  const ringRadius = 36;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset =
    ringCircumference - (Math.max(0, Math.min(100, result.overallScore)) / 100) * ringCircumference;

  const weakestCardNote =
    result.hasPlanogram &&
    result.overallScore >= 85 &&
    result.overallStatus !== 'COMPLIANT';

  return (
    <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full overflow-hidden select-none animate-fade-in">
      {/* Top Header */}
      <div className="px-4 pt-3 pb-2.5 shrink-0">
        <p className="text-xs font-medium text-[var(--text-secondary)] truncate tabular-nums">
          {outlet.name}
          {outlet.code ? ` · SAP ${outlet.code}` : ''}
          {result.planogramVersion ? ` · Planogram v${result.planogramVersion}` : ''}
        </p>
        <h1 className="text-xl font-extrabold tracking-tight mt-0.5 text-[var(--text-primary)]">
          {category} &middot; Planogram Scorecard
        </h1>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3.5 no-scrollbar">
        {/* Sync Confirmation */}
        <div className="glass-subtle rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs font-semibold text-[var(--accent-primary)]">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>Category audit synced to Google Sheets</span>
          </span>
          <span className="tabular-nums opacity-85">
            {result.actualTotalFaces} total faces
          </span>
        </div>

        {/* Unmapped Brand Warning */}
        {result.unmappedBrands.length > 0 && (
          <div className="glass-panel rounded-2xl px-4 py-3 text-xs space-y-1 border-amber-500/35 text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle size={15} className="shrink-0 text-amber-500" />
              <span>Unmapped Brand Flagged for Review</span>
            </div>
            <p className="opacity-90 leading-relaxed">
              Detected unrecognized label(s):{' '}
              <span className="font-mono font-bold">{result.unmappedBrands.join(', ')}</span>. Not
              collapsed into OTHER; audit marked for manager review.
            </p>
          </div>
        )}

        {!result.hasPlanogram ? (
          <div className="glass-panel rounded-3xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  No active planogram configured
                </h2>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  No active planogram target was found for{' '}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {outlet.code || outlet.name}
                  </span>{' '}
                  ({category}). Your shelf audit counts and SoS metrics were still saved cleanly.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-glass)]">
              <div>
                <p className="text-xs text-[var(--text-secondary)]">QFI Facings</p>
                <p className="text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">
                  {result.actualQfiFaces}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Actual SoS %</p>
                <p className="text-2xl font-extrabold tabular-nums text-[var(--text-primary)]">
                  {result.sosActualPct}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* 1. HERO SCORE CARD */}
            <div className="glass-panel rounded-3xl p-4 md:p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-4">
                <div className="relative w-22 h-22 shrink-0 flex items-center justify-center">
                  <svg className="w-22 h-22 -rotate-90" viewBox="0 0 88 88">
                    <circle
                      cx="44"
                      cy="44"
                      r={ringRadius}
                      fill="none"
                      stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(8,76,65,0.10)'}
                      strokeWidth="8"
                    />
                    <circle
                      cx="44"
                      cy="44"
                      r={ringRadius}
                      fill="none"
                      stroke={heroStyles.ringStroke}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                    />
                  </svg>
                  <span className="absolute text-2xl font-extrabold tabular-nums tracking-tight text-[var(--text-primary)]">
                    {result.overallScore}%
                  </span>
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">
                    Overall Category Score
                  </p>
                  <div className={`inline-flex items-center gap-1.5 text-sm font-extrabold ${heroStyles.text}`}>
                    <heroStyles.Icon size={16} />
                    <span>{result.overallStatus}</span>
                  </div>
                  <p className="text-xs tabular-nums text-[var(--text-secondary)]">
                    Brand {Math.round(result.weightsUsed.brand * 100)}% &middot; Company{' '}
                    {Math.round(result.weightsUsed.company * 100)}%
                    {result.weightsUsed.sos > 0
                      ? ` · SoS ${Math.round(result.weightsUsed.sos * 100)}%`
                      : ' · No SoS Target'}
                  </p>
                </div>
              </div>

              {result.missingBrandCapApplied && (
                <div className="glass-subtle rounded-2xl px-3.5 py-2.5 text-xs flex items-center gap-2 text-rose-600 dark:text-rose-300">
                  <AlertTriangle size={14} className="shrink-0 text-rose-500" />
                  <span>
                    Score capped at 70% because planned brand has 0 faces:{' '}
                    <strong>{result.missingOwnBrands.join(', ')}</strong>
                  </span>
                </div>
              )}

              {weakestCardNote && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Hero status capped at <strong>{result.overallStatus}</strong> to match weakest KPI card.
                </p>
              )}

              <div className="pt-2.5 border-t border-[var(--border-glass)] flex items-center justify-between gap-2 text-xs">
                <span className="text-[var(--text-secondary)]">Share of Shelf vs Target</span>
                <span className="font-bold tabular-nums text-[var(--text-primary)]">
                  {result.sosActualPct}% actual
                  {result.sosTargetPct !== null
                    ? ` vs ${result.sosTargetPct}% target (${result.sosAchievementPct}% achieved)`
                    : ' (no competitor denominator)'}
                </span>
              </div>
            </div>

            {/* 2. TWO KPI CARDS */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-panel rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  QFI Brand Compliance
                </p>
                <span className={`text-2xl font-extrabold tabular-nums block ${brandStyles.text}`}>
                  {result.brandWisePct}%
                </span>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${brandStyles.text}`}>
                  <brandStyles.Icon size={13} />
                  <span>{result.brandStatus}</span>
                </span>
              </div>

              <div className="glass-panel rounded-2xl p-4 space-y-1.5">
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  QFI Company Compliance
                </p>
                <div className="flex items-baseline justify-between gap-1">
                  <span className={`text-2xl font-extrabold tabular-nums ${companyStyles.text}`}>
                    {result.companyWisePct}%
                  </span>
                  <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                    {result.actualQfiFaces}/{result.plannedQfiFaces}
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 text-xs font-bold ${companyStyles.text}`}>
                  <companyStyles.Icon size={13} />
                  <span>{result.companyStatus}</span>
                </span>
              </div>
            </div>

            {/* 3. FACES SPLIT DETAILS */}
            <div className="glass-panel rounded-3xl divide-y divide-[var(--border-glass)] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text-primary)]">
                  Faces Details &middot; Brand Split
                </h2>
                <span className="text-xs tabular-nums text-[var(--text-secondary)]">
                  {result.actualQfiFaces} / {result.plannedQfiFaces} QFI faces
                </span>
              </div>

              {result.brandSplits.map((split) => {
                const diffStr = split.gap > 0 ? `+${split.gap}` : String(split.gap);
                const gapColor =
                  split.gap === 0
                    ? 'text-[var(--accent-primary)]'
                    : split.gap > 0
                    ? 'text-sky-600 dark:text-sky-400'
                    : 'text-rose-600 dark:text-rose-400';

                return (
                  <div
                    key={split.brand}
                    className="px-4 py-2.5 flex items-center justify-between text-sm"
                  >
                    <span className="font-semibold text-[var(--text-primary)]">{split.brand}</span>
                    <div className="flex items-center gap-3 tabular-nums">
                      <span className="text-[var(--text-primary)]">
                        {split.actual}{' '}
                        <span className="text-[var(--text-muted)]">/ {split.planned}</span>
                      </span>
                      <span className={`w-10 text-right font-bold text-xs ${gapColor}`}>
                        {diffStr}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4. DIAGNOSTIC BAY & ROW BREAKDOWN */}
            <div className="glass-panel rounded-3xl divide-y divide-[var(--border-glass)] overflow-hidden">
              <div className="px-4 py-3 flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    AI-detected rows
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] tabular-nums">
                    Spatial row breakdown ({result.actualBaysCount} shot vs {result.plannedBaysCount}{' '}
                    planned)
                  </p>
                </div>
                {result.editedByRep && (
                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0">
                    Edited by rep
                  </span>
                )}
              </div>

              {result.bayDiagnostics.map((bay) => {
                const isExpanded = Boolean(expandedBays[bay.bayIndex]);
                return (
                  <div key={bay.bayIndex}>
                    <button
                      type="button"
                      onClick={() => toggleBay(bay.bayIndex)}
                      className="w-full min-h-[48px] px-4 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {bay.bayLabel}
                        </span>
                        {bay.isExtraBay && (
                          <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                            &middot; Extra Bay
                          </span>
                        )}
                        {bay.isMissingBay && (
                          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            &middot; Not Captured
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 text-[var(--text-secondary)]">
                        <span className="text-xs font-semibold tabular-nums">
                          {bay.actualQfi} / {bay.plannedQfi} QFI
                        </span>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-2 bg-black/[0.03] dark:bg-white/[0.03]">
                        {bay.rows.length === 0 ? (
                          <p className="text-xs text-[var(--text-secondary)] py-2">
                            No QFI rows planned or detected in this bay.
                          </p>
                        ) : (
                          bay.rows.map((r) => (
                            <div
                              key={`${bay.bayIndex}-r-${r.row}`}
                              className="pt-2 border-t first:border-t-0 border-[var(--border-glass)] text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between font-semibold text-[var(--text-primary)]">
                                <span>Row {r.row}</span>
                                <span className="tabular-nums">
                                  Brand {r.brandWisePct}% &middot; Co. {r.companyWisePct}% ({r.actualQfi}/
                                  {r.plannedQfi})
                                </span>
                              </div>
                              {r.brandSplits.length > 0 && (
                                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums text-[var(--text-secondary)]">
                                  {r.brandSplits.map((bs) => (
                                    <span key={bs.brand}>
                                      {bs.brand}: {bs.actual}/{bs.planned}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Executive Review Note */}
        <div className="glass-panel rounded-2xl p-4 space-y-2">
          <label
            htmlFor="scorecard-exec-note"
            className="text-xs font-semibold block text-[var(--text-secondary)]"
          >
            Executive Note (optional)
          </label>
          <input
            id="scorecard-exec-note"
            type="text"
            value={executiveNote}
            onChange={(e) => setExecutiveNote(e.target.value)}
            placeholder="Reason for miss, shelf fix note, or stock observation..."
            className="w-full min-h-[44px] px-3.5 rounded-xl text-sm glass-subtle text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
          />
        </div>
      </div>

      {/* Sticky Bottom Done CTA */}
      <div className="px-4 pt-3 pb-4 shrink-0 glass-nav border-t">
        <button
          type="button"
          disabled={isSubmittingAck}
          onClick={() => onDone(executiveNote)}
          className={`w-full min-h-[54px] py-3.5 px-5 rounded-2xl text-sm font-bold shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 ${
            isDark ? 'bg-[#10B981] text-[#05231C]' : 'bg-[#084C41] text-white'
          }`}
        >
          {isSubmittingAck ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              <span>Saving acknowledgement…</span>
            </>
          ) : (
            <>
              <span>Done</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
