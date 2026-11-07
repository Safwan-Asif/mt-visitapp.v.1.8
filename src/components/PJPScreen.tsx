import React, { useState } from 'react';
import { 
  MapPin, CheckCircle2, ChevronRight, Plus, 
  Clock, Navigation, Check 
} from 'lucide-react';
import { Outlet, UserProfile } from '../types';
import { useTheme } from '../ThemeContext';
import { PJP_GOOGLE_SHEET_URL } from '../constants';
import { FileSpreadsheet } from 'lucide-react';

interface PJPScreenProps {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
  onOpenAddModal: () => void;
  executive?: UserProfile | null;
}

export const PJPScreen: React.FC<PJPScreenProps> = ({
  outlets,
  onSelectOutlet,
  onOpenAddModal,
  executive
}) => {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'DONE'>('ALL');

  const completedCount = outlets.filter((o) =>
    Object.values(o.progress).every((status) => status === 'Completed')
  ).length;

  const totalCount = outlets.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredOutlets = outlets.filter((o) => {
    const isDone = Object.values(o.progress).every((s) => s === 'Completed');
    if (filter === 'PENDING') return !isDone;
    if (filter === 'DONE') return isDone;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col justify-between p-3.5 max-w-md mx-auto w-full h-full overflow-hidden select-none">
      {/* Top Header & Progress Summary Card */}
      <div className="space-y-3 shrink-0">
        <div
          className={`backdrop-blur-xl border p-3.5 rounded-3xl shadow-xl flex items-center justify-between relative overflow-hidden transition-colors ${
            isDark
              ? 'bg-[#132219]/80 border-emerald-900/50 shadow-black/30'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}
        >
          {/* Subtle Ambient light behind ring */}
          <div className="absolute right-2 top-2 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="space-y-0.5 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-widest ${
                  isDark ? 'text-[#10B981]' : 'text-[#047857]'
                }`}
              >
                Today's PJP Route
              </span>
              <span className={isDark ? 'text-emerald-900' : 'text-slate-300'}>&bull;</span>
              <span
                className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                <Navigation size={10} /> {executive?.repId || '#9'}
              </span>
              <a
                href={PJP_GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border flex items-center gap-1 transition-colors ${
                  isDark
                    ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300 hover:text-white'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="View Master PJP Spreadsheet"
              >
                <FileSpreadsheet size={10} />
                PJP Sheet
              </a>
            </div>
            <h2 className={`text-base font-extrabold truncate ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
              {executive?.name || 'Qatar Modern Trade'}
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {executive?.territory || 'Modern Trade Sector'} &bull;{' '}
              <span className={`font-bold tabular-nums ${isDark ? 'text-[#22C55E]' : 'text-[#047857]'}`}>
                {completedCount}
              </span>{' '}
              of <span className="font-bold tabular-nums">{totalCount}</span> Stores
            </p>
          </div>

          {/* SVG Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className={isDark ? 'text-[#182C21]' : 'text-slate-200'}
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className={`${isDark ? 'text-[#22C55E]' : 'text-[#047857]'} transition-all duration-700 ease-out`}
                fill="transparent"
                strokeDasharray={138.2}
                strokeDashoffset={138.2 - (138.2 * percent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-xs font-black tabular-nums ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Add Button */}
        <div className="flex items-center justify-between gap-2 px-1">
          {/* Filter Segmented Control */}
          <div
            className={`flex items-center p-0.5 border rounded-xl ${
              isDark ? 'bg-[#132219]/90 border-emerald-900/60' : 'bg-slate-200/70 border-slate-200'
            }`}
          >
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                filter === 'ALL'
                  ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                filter === 'PENDING'
                  ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilter('DONE')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                filter === 'DONE'
                  ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Done ({completedCount})
            </button>
          </div>

          {/* Add Store Button */}
          <button
            onClick={onOpenAddModal}
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all shadow-xs ${
              isDark
                ? 'bg-[#132219] hover:bg-[#182C21] border-emerald-900/60 text-[#10B981]'
                : 'bg-white hover:bg-emerald-50/50 border-emerald-950/15 text-[#047857]'
            }`}
          >
            <Plus size={13} />
            Add Store
          </button>
        </div>
      </div>

      {/* Outlets List (Bounded height with custom scrollbar, zero external scroll) */}
      <div className="flex-1 overflow-y-auto space-y-2.5 py-2.5 pr-0.5 my-1">
        {filteredOutlets.length === 0 ? (
          <div
            className={`h-full flex flex-col items-center justify-center p-6 text-center rounded-3xl border ${
              isDark
                ? 'text-slate-500 bg-[#132219]/30 border-emerald-950'
                : 'text-slate-400 bg-white border-slate-200'
            }`}
          >
            <CheckCircle2 size={32} className="text-emerald-500/50 mb-2" />
            <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              No stores in this view
            </p>
            <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Switch filter to inspect all assigned stores
            </p>
          </div>
        ) : (
          filteredOutlets.map((outlet, index) => {
            const isDone = Object.values(outlet.progress).every((s) => s === 'Completed');
            const doneCategoryCount = Object.values(outlet.progress).filter((s) => s === 'Completed').length;
            const inProgress = doneCategoryCount > 0 && !isDone;

            return (
              <div
                key={outlet.id}
                onClick={() => onSelectOutlet(outlet)}
                className={`backdrop-blur-xl border p-3.5 rounded-2xl transition-all cursor-pointer group shadow-sm flex flex-col gap-2 active:scale-[0.99] ${
                  isDark
                    ? 'bg-[#132219]/70 hover:bg-[#182C21] border-emerald-900/40 hover:border-emerald-600/60 shadow-black/20'
                    : 'bg-white hover:bg-emerald-50/30 border-emerald-950/10 hover:border-emerald-700/30 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 min-w-0">
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                        isDark
                          ? 'bg-[#182C21] text-[#10B981] border-emerald-800/60'
                          : 'bg-emerald-50 text-[#047857] border-emerald-200'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <h3
                      className={`text-xs font-bold transition-colors truncate ${
                        isDark
                          ? 'text-[#F0FDF4] group-hover:text-[#22C55E]'
                          : 'text-[#061A12] group-hover:text-[#047857]'
                      }`}
                    >
                      {outlet.name}
                    </h3>
                    {outlet.isUnmapped && (
                      <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                        Unmapped
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isDone ? (
                      <span className="flex items-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                        <Check size={11} className="mr-0.5" /> 3/3 Done
                      </span>
                    ) : inProgress ? (
                      <span className="flex items-center text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        <Clock size={10} className="mr-0.5" /> {doneCategoryCount}/3 Done
                      </span>
                    ) : (
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                          isDark
                            ? 'text-slate-400 bg-[#182C21] border-emerald-900/60'
                            : 'text-slate-600 bg-slate-100 border-slate-200'
                        }`}
                      >
                        Start Audit
                      </span>
                    )}
                    <ChevronRight
                      size={14}
                      className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Subtitle & Branch */}
                <div
                  className={`flex items-center justify-between text-[11px] pt-0.5 ${
                    isDark ? 'text-slate-400' : 'text-slate-600'
                  }`}
                >
                  <span
                    className={`flex items-center gap-1 truncate ${
                      isDark ? 'text-slate-300' : 'text-slate-700'
                    }`}
                  >
                    <MapPin size={11} className={isDark ? 'text-emerald-400 shrink-0' : 'text-emerald-700 shrink-0'} />
                    <span className="truncate">{outlet.branch}</span>
                  </span>

                  {/* Micro Category Indicators */}
                  <div className="flex items-center gap-1 text-[9px] font-bold shrink-0">
                    <span
                      className={
                        outlet.progress['Edible Oil'] === 'Completed'
                          ? isDark
                            ? 'text-[#22C55E]'
                            : 'text-[#047857]'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }
                    >
                      Oil
                    </span>
                    <span className={isDark ? 'text-emerald-950' : 'text-slate-300'}>&bull;</span>
                    <span
                      className={
                        outlet.progress['Flour'] === 'Completed'
                          ? isDark
                            ? 'text-[#22C55E]'
                            : 'text-[#047857]'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }
                    >
                      Flour
                    </span>
                    <span className={isDark ? 'text-emerald-950' : 'text-slate-300'}>&bull;</span>
                    <span
                      className={
                        outlet.progress['Pasta'] === 'Completed'
                          ? isDark
                            ? 'text-[#22C55E]'
                            : 'text-[#047857]'
                          : isDark
                          ? 'text-slate-500'
                          : 'text-slate-400'
                      }
                    >
                      Pasta
                    </span>
                  </div>
                </div>

                {outlet.unmappedRemark && (
                  <div className={`mt-0.5 px-2 py-1 rounded-lg border text-[10px] flex items-start gap-1 leading-tight ${
                    isDark
                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}>
                    <span className="font-bold shrink-0">Unmapped Visit Reason:</span>
                    <span className="truncate">{outlet.unmappedRemark}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Quick Action */}
      <div
        className={`pt-2 shrink-0 border-t ${
          isDark ? 'border-emerald-950' : 'border-slate-200'
        }`}
      >
        <div
          className={`backdrop-blur-xl border rounded-2xl p-2.5 flex items-center justify-between text-xs ${
            isDark
              ? 'bg-[#132219]/80 border-emerald-900/50 text-slate-300'
              : 'bg-white border-emerald-950/10 text-slate-700 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              PJP Sequence Optimized for High-Speed Route
            </span>
          </div>
          <span className={`font-bold ${isDark ? 'text-[#10B981]' : 'text-[#047857]'}`}>
            ~1m 45s / Store
          </span>
        </div>
      </div>
    </div>
  );
};
