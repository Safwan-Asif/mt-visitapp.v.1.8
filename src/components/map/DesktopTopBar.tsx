import React, { useState } from 'react';
import {
  Calendar,
  Sun,
  Store,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Navigation
} from 'lucide-react';
import { UserProfile } from '../../types';
import { JourneyMetrics } from '../../data/data';
import execAvatarImg from '../../assets/images/exec_avatar_safwan_1795012165146.jpg';

interface DesktopTopBarProps {
  executive: UserProfile | null;
  metrics: JourneyMetrics;
  isLiveGps: boolean;
  onCenterExecutive: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function formatHeaderDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  executive,
  metrics,
  isLiveGps,
  onCenterExecutive
}) => {
  const [avatarFailed, setAvatarFailed] = useState(false);
  const execName = executive?.name || 'Safwan Asif';
  const initials = getInitials(execName);

  return (
    <header
      aria-label="Command Center Header"
      className="hidden md:flex items-center justify-between gap-3 px-4 py-2 marviz-glass-strong border-b border-sky-400/20 text-white z-[460] shrink-0"
    >
      {/* 1. Wordmark */}
      <div className="flex items-center gap-4 min-w-0 shrink-0">
        <div className="leading-none select-none">
          <div className="font-heading text-[24px] font-extrabold italic tracking-tight text-white leading-none">
            MT
          </div>
          <div className="text-[8.5px] font-bold tracking-[0.16em] text-slate-300 uppercase mt-0.5">
            FIELD SALES
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700/70 shrink-0" />

        {/* 2. Executive Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          {!avatarFailed ? (
            <img
              src={execAvatarImg}
              alt={execName}
              referrerPolicy="no-referrer"
              onError={() => setAvatarFailed(true)}
              className="w-9 h-9 rounded-full object-cover border border-sky-400/50 shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-sky-400/50 flex items-center justify-center text-xs font-bold text-sky-200 shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-white leading-tight truncate">
              {execName}
            </div>
            <div className="text-[11px] text-slate-400 leading-tight truncate">
              Sales Executive - Doha
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-700/70 shrink-0 hidden lg:block" />

        {/* 3. Date & Shift */}
        <div className="hidden lg:flex items-center gap-2.5 shrink-0">
          <Calendar size={16} className="text-slate-400 shrink-0" />
          <div>
            <div className="text-[12px] font-semibold text-slate-100 leading-tight tabular-nums">
              {formatHeaderDate()}
            </div>
            <div className="text-[10.5px] text-slate-400 leading-tight">
              Shift: AM
            </div>
          </div>
          <Sun size={16} className="text-amber-400 ml-1 shrink-0" />
        </div>
      </div>

      {/* 4. Derived Territory KPI Strip + GPS Active */}
      <div className="flex items-center gap-2 xl:gap-4 shrink-0">
        <div className="flex items-center divide-x divide-slate-700/70 bg-slate-950/45 border border-slate-700/60 rounded-xl px-1.5 py-1">
          <div className="flex items-center gap-2 px-2.5">
            <Store size={15} className="text-slate-300 shrink-0" />
            <div>
              <div className="font-heading text-[16px] font-bold leading-none text-white tabular-nums">
                {metrics.totalAssigned}
              </div>
              <div className="text-[9.5px] text-slate-400 leading-tight">Assigned</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5">
            <CalendarCheck size={15} className="text-sky-400 shrink-0" />
            <div>
              <div className="font-heading text-[16px] font-bold leading-none text-sky-300 tabular-nums">
                {metrics.plannedToday}
              </div>
              <div className="text-[9.5px] text-slate-400 leading-tight">Planned</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5">
            <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
            <div>
              <div className="font-heading text-[16px] font-bold leading-none text-emerald-300 tabular-nums">
                {metrics.completedToday}
              </div>
              <div className="text-[9.5px] text-slate-400 leading-tight">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5">
            <Clock size={15} className="text-amber-400 shrink-0" />
            <div>
              <div className="font-heading text-[16px] font-bold leading-none text-amber-300 tabular-nums">
                {metrics.pendingToday}
              </div>
              <div className="text-[9.5px] text-slate-400 leading-tight">Pending</div>
            </div>
          </div>
        </div>

        {/* GPS Status & Center Button */}
        <button
          type="button"
          onClick={onCenterExecutive}
          title="Re-centre map on executive GPS position"
          className="min-h-[40px] px-3 rounded-xl bg-slate-900/70 hover:bg-slate-800/85 border border-sky-400/30 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <div className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
            <span className="w-[3px] h-1.5 rounded-xs bg-emerald-400" />
            <span className="w-[3px] h-2.5 rounded-xs bg-emerald-400" />
            <span className="w-[3px] h-3.5 rounded-xs bg-emerald-400" />
          </div>
          <div className="text-left leading-none">
            <div className="text-[10px] font-bold text-white uppercase tracking-wide">
              GPS
            </div>
            <div className="text-[9px] font-semibold text-emerald-400 mt-0.5">
              {isLiveGps ? 'Live' : 'Active'}
            </div>
          </div>
          <Navigation size={15} className="text-sky-400 fill-sky-400 ml-0.5" />
        </button>
      </div>
    </header>
  );
};
