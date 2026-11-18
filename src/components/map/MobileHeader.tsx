import React from 'react';
import { Navigation, Compass } from 'lucide-react';
import { UserProfile } from '../../types';

interface MobileHeaderProps {
  executive: UserProfile | null;
  isLiveGps: boolean;
  onCenterExecutive?: () => void;
}

function getInitials(name?: string): string {
  if (!name) return 'SA';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
}

function formatCompactDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  executive,
  isLiveGps,
  onCenterExecutive
}) => {
  const execName = executive?.name || 'Safwan Asif';
  const initials = getInitials(execName);

  return (
    <header
      aria-label="Field Sales Header"
      className="marviz-glass rounded-2xl px-3 py-2 flex items-center justify-between gap-2 text-[var(--map-text-primary)]"
    >
      {/* Left: Brand + Wordmark + Territory & Date */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1685FF] to-[#0EA5E9] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(22,133,255,0.45)] border border-sky-300/30"
          aria-hidden="true"
        >
          <Compass size={17} strokeWidth={2.2} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-[15px] font-bold tracking-wide uppercase leading-none text-white truncate">
              MT Field Sales
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/25 leading-none shrink-0">
              Marviz AI
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-300/90 truncate">
            <span className="font-medium text-sky-300/95">Territory: Doha</span>
            <span className="text-slate-500" aria-hidden="true">·</span>
            <span className="tabular-nums text-slate-300/80">{formatCompactDate()}</span>
          </div>
        </div>
      </div>

      {/* Right: Executive Avatar + Name + GPS Status */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onCenterExecutive}
          title={isLiveGps ? 'Live GPS Active — Tap to centre' : 'Doha Demo GPS — Tap to centre'}
          aria-label="GPS status indicator"
          className="min-h-[36px] min-w-[36px] px-2 rounded-xl bg-slate-900/65 hover:bg-slate-800/80 border border-slate-700/70 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-95"
        >
          <span className="relative flex h-2 w-2 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLiveGps ? 'bg-emerald-400 animate-ping' : 'bg-sky-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                isLiveGps ? 'bg-emerald-400' : 'bg-sky-400'
              }`}
            />
          </span>
          <Navigation size={11} className={isLiveGps ? 'text-emerald-400' : 'text-sky-300'} />
          <span className="text-[10px] font-semibold tracking-wide text-slate-200 uppercase">
            GPS
          </span>
        </button>

        <div className="flex items-center gap-1.5 pl-1">
          <div className="hidden sm:block text-right max-w-[110px]">
            <p className="text-[11px] font-semibold text-white leading-tight truncate">
              {execName}
            </p>
            <p className="text-[9px] font-medium text-slate-400 leading-tight truncate">
              {executive?.repId || '#9'} · MT Exec
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-full bg-slate-800 border border-sky-400/45 flex items-center justify-center text-[11px] font-bold text-sky-200 shadow-inner shrink-0"
            title={execName}
            aria-label={`Sales executive ${execName}`}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
};
