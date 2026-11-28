import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar,
  Store,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Navigation,
  Search,
  X,
  MapPin
} from 'lucide-react';
import { JourneyMetrics, MapOutlet } from '../../data/data';

interface DesktopTopBarProps {
  metrics: JourneyMetrics;
  outlets: MapOutlet[];
  isLiveGps: boolean;
  onCenterExecutive: () => void;
  onSelectOutletFromSearch: (outlet: MapOutlet) => void;
}

function formatCompactHeaderDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

function getOutletStatusIndicator(outlet: MapOutlet): {
  dotClass: string;
  label: string;
} {
  if (outlet.visitStatus === 'completed') {
    return { dotClass: 'bg-emerald-400', label: 'Completed' };
  }
  if (outlet.visitStatus === 'planned') {
    return { dotClass: 'bg-[#1D8EFF]', label: 'Planned' };
  }
  return { dotClass: 'bg-slate-400', label: 'Unplanned' };
}

export const DesktopTopBar: React.FC<DesktopTopBarProps> = ({
  metrics,
  outlets,
  isLiveGps,
  onCenterExecutive,
  onSelectOutletFromSearch
}) => {
  const [query, setQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isDropdownOpen]);

  const matchingOutlets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return outlets.slice(0, 6);
    return outlets
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.area.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [outlets, query]);

  const handleSelectOutlet = (outlet: MapOutlet) => {
    onSelectOutletFromSearch(outlet);
    setQuery('');
    setIsDropdownOpen(false);
  };

  return (
    <header
      aria-label="Command Center Header"
      className="hidden md:flex items-center justify-between gap-3 px-4 py-2 ov-panel-elevated border-x-0 border-t-0 text-white z-[465] shrink-0"
    >
      {/* 1. Wordmark + Compact Date */}
      <div className="flex items-center gap-3.5 min-w-0 shrink-0">
        <div className="leading-none select-none">
          <div className="font-heading text-[21px] font-extrabold italic tracking-tight text-white leading-none">
            GEOINTEL
          </div>
          <div className="text-[8.5px] font-bold tracking-[0.16em] text-slate-300 uppercase mt-0.5">
            HEADS UP DISPLAY
          </div>
        </div>

        <div className="h-7 w-px bg-white/10 shrink-0" />

        {/* Small Date (visible on both tablets & desktops) */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-300 whitespace-nowrap shrink-0 ov-tabular">
          <Calendar size={13} className="text-sky-400 shrink-0" />
          <span>{formatCompactHeaderDate()}</span>
        </div>
      </div>

      {/* 2. Outlet Quick-Search */}
      <div ref={searchBoxRef} className="relative flex-1 max-w-[280px] lg:max-w-[320px] min-w-[160px]">
        <div className="flex items-center gap-2 h-9 px-3 rounded-xl ov-glass-recessed focus-within:border-[#00C8FF]/65 transition-colors">
          <Search size={14} className="text-sky-400 shrink-0" />
          <input
            type="search"
            value={query}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matchingOutlets.length > 0) {
                handleSelectOutlet(matchingOutlets[0]);
              }
            }}
            placeholder="Search Doha outlets, area or ID..."
            aria-label="Search Doha outlets"
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-slate-400 hover:text-white cursor-pointer shrink-0"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {isDropdownOpen && (
          <div
            role="listbox"
            aria-label="Matching Doha outlets"
            className="absolute left-0 right-0 top-[calc(100%+6px)] ov-glass-strong rounded-xl overflow-hidden z-[520]"
          >
            <ul className="max-h-64 overflow-y-auto divide-y divide-slate-800/75 no-scrollbar">
              {matchingOutlets.length === 0 ? (
                <li className="py-3 px-3 text-center text-xs text-slate-400">
                  No matching Doha outlets
                </li>
              ) : (
                matchingOutlets.map((outlet) => {
                  const status = getOutletStatusIndicator(outlet);
                  return (
                    <li key={outlet.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectOutlet(outlet)}
                        className="w-full px-3 py-2 hover:bg-white/10 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${status.dotClass}`}
                              aria-hidden="true"
                            />
                            <span className="text-xs font-semibold text-white truncate">
                              {outlet.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[10.5px] text-slate-400 mt-0.5 truncate pl-3.5">
                            <MapPin size={10} className="text-sky-400 shrink-0" />
                            <span className="truncate">{outlet.area}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-slate-300 tabular-nums block">
                            {outlet.id}
                          </span>
                          <span className="text-[9.5px] text-slate-400">{status.label}</span>
                        </div>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 3. Derived Territory KPI Strip + GPS Active */}
      <div className="flex items-center gap-2 xl:gap-3 shrink-0">
        <div className="flex items-center divide-x divide-white/10 ov-chart-well rounded-xl px-1.5 py-1">
          <div className="flex items-center gap-2 px-2">
            <Store size={14} className="text-slate-300 shrink-0" />
            <div>
              <div className="font-heading text-[15px] font-bold leading-none text-white ov-tabular">
                {metrics.totalAssigned}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">Assigned</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <CalendarCheck size={14} className="text-sky-400 shrink-0" />
            <div>
              <div className="font-heading text-[15px] font-bold leading-none text-sky-300 ov-tabular">
                {metrics.plannedToday}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">Planned</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <div>
              <div className="font-heading text-[15px] font-bold leading-none text-emerald-300 ov-tabular">
                {metrics.completedToday}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">Completed</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2">
            <Clock size={14} className="text-amber-400 shrink-0" />
            <div>
              <div className="font-heading text-[15px] font-bold leading-none text-amber-300 ov-tabular">
                {metrics.pendingToday}
              </div>
              <div className="text-[9px] text-slate-400 leading-tight">Pending</div>
            </div>
          </div>
        </div>

        {/* GPS Status & Center Button */}
        <button
          type="button"
          onClick={onCenterExecutive}
          title="Re-centre map on executive GPS position"
          className="min-h-[38px] px-2.5 rounded-xl ov-glass-recessed hover:border-[#00C8FF]/55 flex items-center gap-2 cursor-pointer transition-colors"
        >
          <div className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
            <span className={`w-[3px] h-1.5 rounded-xs ${isLiveGps ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className={`w-[3px] h-2.5 rounded-xs ${isLiveGps ? 'bg-emerald-400' : 'bg-amber-400/70'}`} />
            <span className={`w-[3px] h-3.5 rounded-xs ${isLiveGps ? 'bg-emerald-400' : 'bg-slate-600'}`} />
          </div>
          <div className="text-left leading-none">
            <div className="text-[10px] font-bold text-white uppercase tracking-wide">
              GPS
            </div>
            <div className={`text-[9px] font-semibold mt-0.5 ${isLiveGps ? 'text-emerald-400' : 'text-amber-300'}`}>
              {isLiveGps ? 'Live' : 'Demo'}
            </div>
          </div>
          <Navigation size={14} className="text-sky-400 fill-sky-400 ml-0.5" />
        </button>
      </div>
    </header>
  );
};
