import React from 'react';
import { 
  ArrowLeft, CheckCircle2, ChevronRight, MapPin, 
  Check, Clock, ShieldCheck 
} from 'lucide-react';
import { Outlet, CategoryType, CategoryAuditRecord } from '../types';
import { CATEGORIES } from '../constants';
import { useTheme } from '../ThemeContext';

interface OutletOverviewProps {
  outlet: Outlet;
  audits: Record<string, CategoryAuditRecord>;
  onBack: () => void;
  onSelectCategory: (category: CategoryType) => void;
}

export const OutletOverview: React.FC<OutletOverviewProps> = ({
  outlet,
  audits,
  onBack,
  onSelectCategory
}) => {
  const { isDark } = useTheme();
  const categories = CATEGORIES;
  const completedCount = categories.filter((cat) => outlet.progress[cat] === 'Completed').length;
  const allDone = completedCount === categories.length;

  return (
    <div className="flex-1 flex flex-col justify-between p-3.5 max-w-md mx-auto w-full h-full overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="space-y-3 shrink-0">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors py-1 group ${
            isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-[#061A12]'
          }`}
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Today's PJP</span>
        </button>

        {/* Store Active Overview Card */}
        <div
          className={`backdrop-blur-xl border p-4 rounded-3xl shadow-xl relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#132219]/80 border-emerald-900/50 shadow-black/30'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isDark ? 'text-[#10B981]' : 'text-[#047857]'
              }`}
            >
              Active Store Audit
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isDark
                  ? 'bg-[#182C21] text-emerald-300 border-emerald-800/60'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              Seq {outlet.sequence}
            </span>
          </div>

          <h2 className={`text-lg font-extrabold truncate ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
            {outlet.name}
          </h2>
          <p className={`text-xs flex items-center gap-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <MapPin size={12} className={isDark ? 'text-[#10B981] shrink-0' : 'text-[#047857] shrink-0'} />
            <span className="truncate">{outlet.branch} &bull; {outlet.address || 'Doha Commercial District'}</span>
          </p>

          {outlet.isUnmapped && (
            <div className="mt-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 leading-tight">
              <span className="font-bold uppercase tracking-wider text-[9px] block mb-0.5 text-amber-500">Unmapped Store Visit Reason:</span>
              <span>{outlet.unmappedRemark}</span>
            </div>
          )}

          {/* Progress bar inside card */}
          <div
            className={`mt-3 pt-3 border-t flex items-center justify-between text-[11px] ${
              isDark ? 'border-emerald-900/60' : 'border-slate-100'
            }`}
          >
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Audit Progress: <strong className={isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}>{completedCount} of 3 Categories</strong>
            </span>
            <span className={`font-bold ${allDone ? (isDark ? 'text-[#22C55E]' : 'text-[#047857]') : (isDark ? 'text-[#10B981]' : 'text-[#059669]')}`}>
              {Math.round((completedCount / 3) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Category Audit Selection Cards */}
      <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-0.5">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Mandatory Category Audits
          </h3>
          <span className={`text-[10px] font-semibold ${isDark ? 'text-[#10B981]' : 'text-[#047857]'}`}>
            Sub-2m Target
          </span>
        </div>

        {categories.map((cat) => {
          const status = outlet.progress[cat] || 'Not Started';
          const isCompleted = status === 'Completed';
          const isInProgress = status === 'In Progress';
          const auditKey = `${outlet.id}_${cat}`;
          const existingAudit = audits[auditKey];

          return (
            <div
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`backdrop-blur-xl border p-4 rounded-3xl transition-all cursor-pointer group shadow-sm flex flex-col gap-2 active:scale-[0.99] ${
                isDark
                  ? 'bg-[#132219]/70 hover:bg-[#182C21] border-emerald-900/40 hover:border-emerald-600/60 shadow-black/20'
                  : 'bg-white hover:bg-emerald-50/30 border-emerald-950/10 hover:border-emerald-700/30 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                    isCompleted 
                      ? 'bg-emerald-500/15 text-[#22C55E] border border-emerald-500/30' 
                      : isDark
                      ? 'bg-[#182C21] text-[#10B981] border border-emerald-800/60'
                      : 'bg-emerald-50 text-[#047857] border border-emerald-200'
                  }`}>
                    {cat.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold transition-colors ${
                      isDark ? 'text-[#F0FDF4] group-hover:text-[#22C55E]' : 'text-[#061A12] group-hover:text-[#047857]'
                    }`}>
                      {cat}
                    </h4>
                    <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Guided Photo &bull; Parallel POSM &bull; AI Facings
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${
                      isCompleted
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-[#10B981] dark:text-[#22C55E]'
                        : isInProgress
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                        : isDark
                        ? 'bg-[#182C21] border-emerald-900/60 text-slate-400'
                        : 'bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <>
                        <Check size={12} /> Completed
                      </>
                    ) : isInProgress ? (
                      <>
                        <Clock size={12} /> Resume
                      </>
                    ) : (
                      'Start'
                    )}
                  </span>
                  <ChevronRight size={16} className={`transition-colors ${isDark ? 'text-slate-500 group-hover:text-emerald-400' : 'text-slate-400 group-hover:text-emerald-700'}`} />
                </div>
              </div>

              {/* Extra Audit Summary if Completed */}
              {isCompleted && (
                <div
                  className={`pt-2 border-t flex items-center justify-between text-[10px] ${
                    isDark ? 'border-emerald-900/60 text-slate-400' : 'border-slate-100 text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 font-semibold ${isDark ? 'text-[#22C55E]' : 'text-[#047857]'}`}>
                      <ShieldCheck size={12} />
                      {existingAudit?.annotatedPhotoUrl ? 'AI Annotated' : 'Verified by QFI CV'}
                    </span>
                  </div>
                  <span className="tabular-nums font-medium">
                    {existingAudit
                      ? `${existingAudit.totalFacings} Facings${existingAudit.activeAisleCount && existingAudit.activeAisleCount > 1 ? ` (${existingAudit.activeAisleCount} Aisles)` : ''}`
                      : 'Audit Logged'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Banner or Action */}
      <div className="pt-2 shrink-0">
        {allDone ? (
          <div
            className={`p-3.5 border rounded-3xl text-center space-y-2 shadow-lg ${
              isDark
                ? 'bg-gradient-to-r from-[#047857]/30 to-[#065F46]/30 border-emerald-500/40'
                : 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200'
            }`}
          >
            <div className={`flex items-center justify-center gap-1.5 text-xs font-bold ${isDark ? 'text-[#22C55E]' : 'text-[#047857]'}`}>
              <CheckCircle2 size={16} /> All 3 Categories Completed for {outlet.name}!
            </div>
            <button
              onClick={onBack}
              className="w-full py-3 bg-gradient-to-r from-[#047857] via-[#065F46] to-[#10B981] hover:brightness-105 active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-emerald-950/20"
            >
              Finish &amp; Return to Route PJP
            </button>
          </div>
        ) : (
          <div
            className={`backdrop-blur-xl border rounded-2xl p-2.5 flex items-center justify-between text-xs ${
              isDark
                ? 'bg-[#132219]/70 border-emerald-900/50 text-slate-400'
                : 'bg-white border-emerald-950/10 text-slate-600 shadow-xs'
            }`}
          >
            <span>Next Category Priority:</span>
            <span className={`font-bold ${isDark ? 'text-[#10B981]' : 'text-[#047857]'}`}>
              {categories.find((c) => outlet.progress[c] !== 'Completed') || 'None'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
