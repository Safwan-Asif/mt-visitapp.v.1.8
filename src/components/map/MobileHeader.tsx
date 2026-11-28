import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, MapPin, SlidersHorizontal } from 'lucide-react';
import { MapOutlet } from '../../data/data';

interface MobileHeaderProps {
  outlets: MapOutlet[];
  onSelectOutletFromSearch: (outlet: MapOutlet) => void;
  onOpenSettings?: () => void;
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

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  outlets,
  onSelectOutletFromSearch,
  onOpenSettings
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isSearchOpen]);

  const matchingOutlets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return outlets.slice(0, 6);
    }
    return outlets
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          o.area.toLowerCase().includes(q) ||
          o.id.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [outlets, query]);

  const handleSelect = (outlet: MapOutlet) => {
    onSelectOutletFromSearch(outlet);
    setQuery('');
    setIsSearchOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <header
        aria-label="GeoIntel Header"
        className="ov-panel-elevated rounded-xl px-3 py-1.5 flex items-center justify-between gap-2 text-white"
      >
        {/* Wordmark matching Desktop HUD */}
        <div className="leading-none select-none pl-0.5">
          <div className="font-heading text-[18px] sm:text-[19px] font-extrabold italic tracking-tight text-white leading-none">
            GEOINTEL
          </div>
          <div className="text-[7.5px] font-bold tracking-[0.16em] text-slate-300 uppercase mt-0.5">
            HEADS UP DISPLAY
          </div>
        </div>

        {/* Compact Action Icons: Search & Map Settings */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label={isSearchOpen ? 'Close outlet search' : 'Search Doha outlets'}
            aria-expanded={isSearchOpen}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0 ${
              isSearchOpen
                ? 'bg-[#0066FF] text-white'
                : 'text-[#A5B8D5] hover:text-[#F1F5FF] hover:bg-white/10'
            }`}
          >
            {isSearchOpen ? <X size={14} /> : <Search size={14} />}
          </button>

          {onOpenSettings && (
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                onOpenSettings();
              }}
              aria-label="Open GeoIntel settings and theme"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A5B8D5] hover:text-[#F1F5FF] hover:bg-white/10 transition-colors cursor-pointer active:scale-95 shrink-0"
            >
              <SlidersHorizontal size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Expandable Floating Outlet Quick-Search Drawer */}
      {isSearchOpen && (
        <div
          role="dialog"
          aria-label="Search Doha outlets"
          className="mt-1.5 ov-glass-strong rounded-2xl p-2 text-[#F1F5FF] animate-fade-in"
        >
          <div className="flex items-center gap-2 px-2.5 h-10 rounded-xl ov-glass-recessed focus-within:border-[#00C8FF]/65">
            <Search size={15} className="text-sky-400 shrink-0" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && matchingOutlets.length > 0) {
                  handleSelect(matchingOutlets[0]);
                }
              }}
              placeholder="Search outlet, area or ID..."
              aria-label="Search outlet name, area, or ID"
              className="w-full bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search query"
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <ul className="mt-1.5 max-h-56 overflow-y-auto divide-y divide-slate-800/70 no-scrollbar">
            {matchingOutlets.length === 0 ? (
              <li className="py-3 px-2 text-center text-xs text-slate-400">
                No matching Doha outlets
              </li>
            ) : (
              matchingOutlets.map((outlet) => {
                const status = getOutletStatusIndicator(outlet);
                return (
                  <li key={outlet.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(outlet)}
                      className="w-full min-h-[44px] px-2.5 py-2 rounded-xl hover:bg-white/10 active:bg-white/15 flex items-center justify-between gap-2 text-left cursor-pointer transition-colors"
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
                        <span className="text-[9.5px] font-medium text-slate-400">
                          {status.label}
                        </span>
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
  );
};
