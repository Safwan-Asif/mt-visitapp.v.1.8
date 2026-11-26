import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export interface CalendarDateValue {
  year: number;
  month: number; // 1..12
  day: number; // 1..31
}

export const WHEEL_YEARS = [2025, 2026, 2027] as const;

export const WHEEL_MONTHS = [
  { value: 1, label: 'Jan', full: 'January' },
  { value: 2, label: 'Feb', full: 'February' },
  { value: 3, label: 'Mar', full: 'March' },
  { value: 4, label: 'Apr', full: 'April' },
  { value: 5, label: 'May', full: 'May' },
  { value: 6, label: 'Jun', full: 'June' },
  { value: 7, label: 'Jul', full: 'July' },
  { value: 8, label: 'Aug', full: 'August' },
  { value: 9, label: 'Sep', full: 'September' },
  { value: 10, label: 'Oct', full: 'October' },
  { value: 11, label: 'Nov', full: 'November' },
  { value: 12, label: 'Dec', full: 'December' }
] as const;

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function compareCalendarDates(a: CalendarDateValue, b: CalendarDateValue): number {
  const va = a.year * 10000 + a.month * 100 + a.day;
  const vb = b.year * 10000 + b.month * 100 + b.day;
  return va - vb;
}

export function diffCalendarDaysInclusive(
  from: CalendarDateValue,
  to: CalendarDateValue
): number {
  const startUtc = Date.UTC(from.year, from.month - 1, from.day);
  const endUtc = Date.UTC(to.year, to.month - 1, to.day);
  return Math.max(1, Math.round((endUtc - startUtc) / 86400000) + 1);
}

export function formatShortCalendarDate(d: CalendarDateValue): string {
  const m = WHEEL_MONTHS[Math.max(0, Math.min(11, d.month - 1))];
  return `${d.day} ${m?.label || 'Oct'} ${d.year}`;
}

export function formatCompactCalendarDate(d: CalendarDateValue): string {
  const m = WHEEL_MONTHS[Math.max(0, Math.min(11, d.month - 1))];
  return `${d.day} ${m?.label || 'Oct'}`;
}

interface DrumOption {
  value: number;
  label: string;
}

interface DrumColumnProps {
  ariaLabel: string;
  options: DrumOption[];
  selectedValue: number;
  onChange: (value: number) => void;
  isDark: boolean;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;

const DrumColumn: React.FC<DrumColumnProps> = ({
  ariaLabel,
  options,
  selectedValue,
  onChange,
  isDark
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<number | null>(null);
  const suppressUntilRef = useRef<number>(0);
  const didInitialMountRef = useRef<boolean>(false);

  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === selectedValue)
  );
  const [visualIndex, setVisualIndex] = useState<number>(selectedIndex);

  // Sync scroll position when selectedValue or options length changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const targetTop = selectedIndex * ITEM_HEIGHT;
    setVisualIndex(selectedIndex);

    if (!didInitialMountRef.current) {
      didInitialMountRef.current = true;
      suppressUntilRef.current = Date.now() + 120;
      el.scrollTop = targetTop;
      return;
    }

    if (Math.abs(el.scrollTop - targetTop) > 2) {
      suppressUntilRef.current = Date.now() + 360;
      el.scrollTo({ top: targetTop, behavior: 'smooth' });
    }
  }, [selectedIndex, options.length]);

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const rawIdx = Math.round(el.scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(options.length - 1, rawIdx));
    setVisualIndex(clampedIdx);

    if (Date.now() < suppressUntilRef.current) return;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      const nextOption = options[clampedIdx];
      if (nextOption && nextOption.value !== selectedValue) {
        onChange(nextOption.value);
      }
    }, 95);
  };

  const handleRowClick = (idx: number, value: number) => {
    const el = containerRef.current;
    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }
    setVisualIndex(idx);
    if (el) {
      suppressUntilRef.current = Date.now() + 360;
      el.scrollTo({ top: idx * ITEM_HEIGHT, behavior: 'smooth' });
    }
    if (value !== selectedValue) {
      onChange(value);
    }
  };

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      onScroll={handleScroll}
      className="relative flex-1 overflow-y-auto no-scrollbar touch-pan-y select-none"
      style={{
        height: `${ITEM_HEIGHT * VISIBLE_ROWS}px`,
        scrollSnapType: 'y mandatory',
        WebkitOverflowScrolling: 'touch',
        maskImage:
          'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
        WebkitMaskImage:
          'linear-gradient(to bottom, transparent 0%, black 22%, black 78%, transparent 100%)',
        perspective: '520px'
      }}
    >
      {/* Top 2 spacer rows so first option can sit dead-center */}
      <div style={{ height: `${ITEM_HEIGHT * 2}px` }} aria-hidden="true" />

      {options.map((opt, idx) => {
        const diff = idx - visualIndex;
        const absDiff = Math.abs(diff);
        const isCentered = absDiff === 0;
        const scale = isCentered ? 1 : absDiff === 1 ? 0.92 : 0.84;
        const opacity = isCentered ? 1 : absDiff === 1 ? 0.68 : 0.36;
        const rotateX = Math.max(-34, Math.min(34, diff * -16));

        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={opt.value === selectedValue}
            onClick={() => handleRowClick(idx, opt.value)}
            style={{
              height: `${ITEM_HEIGHT}px`,
              scrollSnapAlign: 'center',
              transform: `rotateX(${rotateX}deg) scale(${scale})`,
              opacity,
              color: isCentered
                ? isDark
                  ? '#F1F5FF'
                  : '#0066FF'
                : 'var(--text-secondary)'
            }}
            className={`w-full flex items-center justify-center tabular-nums cursor-pointer transition-[opacity,transform] duration-100 ${
              isCentered ? 'text-[15px] font-extrabold' : 'text-[13px] font-semibold'
            }`}
          >
            {opt.label}
          </button>
        );
      })}

      {/* Bottom 2 spacer rows so last option can sit dead-center */}
      <div style={{ height: `${ITEM_HEIGHT * 2}px` }} aria-hidden="true" />
    </div>
  );
};

interface WheelDateRangePickerProps {
  fromDate: CalendarDateValue;
  toDate: CalendarDateValue;
  defaultFromDate: CalendarDateValue;
  defaultToDate: CalendarDateValue;
  hasAnyFilters: boolean;
  onChangeRange: (nextFrom: CalendarDateValue, nextTo: CalendarDateValue) => void;
  onResetAllFilters: () => void;
}

export const WheelDateRangePicker: React.FC<WheelDateRangePickerProps> = ({
  fromDate,
  toDate,
  defaultFromDate,
  defaultToDate,
  hasAnyFilters,
  onChangeRange,
  onResetAllFilters
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeEndpoint, setActiveEndpoint] = useState<'from' | 'to'>('from');
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsMobileViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Outside click + Escape dismissal (desktop popover & mobile keyboard)
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (isMobileViewport) return; // Mobile uses dedicated backdrop overlay
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobileViewport]);

  const totalSelectedDays = diffCalendarDaysInclusive(fromDate, toDate);
  const activeDate = activeEndpoint === 'from' ? fromDate : toDate;

  const monthOptions = useMemo<DrumOption[]>(
    () => WHEEL_MONTHS.map((m) => ({ value: m.value, label: m.label })),
    []
  );

  const yearOptions = useMemo<DrumOption[]>(
    () => WHEEL_YEARS.map((y) => ({ value: y, label: String(y) })),
    []
  );

  const dayOptions = useMemo<DrumOption[]>(() => {
    const maxDays = getDaysInMonth(activeDate.year, activeDate.month);
    return Array.from({ length: maxDays }, (_, idx) => ({
      value: idx + 1,
      label: String(idx + 1).padStart(2, '0')
    }));
  }, [activeDate.year, activeDate.month]);

  const handleOpen = (endpoint: 'from' | 'to') => {
    if (isOpen && activeEndpoint === endpoint) {
      setIsOpen(false);
    } else {
      setActiveEndpoint(endpoint);
      setIsOpen(true);
    }
  };

  const updateActiveDatePart = (
    part: 'month' | 'day' | 'year',
    nextVal: number
  ) => {
    const base = activeEndpoint === 'from' ? fromDate : toDate;
    const nextYear = part === 'year' ? nextVal : base.year;
    const nextMonth = part === 'month' ? nextVal : base.month;
    const maxDay = getDaysInMonth(nextYear, nextMonth);
    const rawDay = part === 'day' ? nextVal : base.day;
    const nextDate: CalendarDateValue = {
      year: nextYear,
      month: nextMonth,
      day: Math.min(rawDay, maxDay)
    };

    if (activeEndpoint === 'from') {
      const nextTo = compareCalendarDates(nextDate, toDate) > 0 ? nextDate : toDate;
      onChangeRange(nextDate, nextTo);
    } else {
      const nextFrom = compareCalendarDates(nextDate, fromDate) < 0 ? nextDate : fromDate;
      onChangeRange(nextFrom, nextDate);
    }
  };

  const pickerPanelBody = (
    <>
      {/* Mobile Drag Handle */}
      {isMobileViewport && (
        <div
          className="w-10 h-1.5 rounded-full mx-auto mb-3 bg-black/15 dark:bg-white/20"
          aria-hidden="true"
        />
      )}

      {/* Header + From / To Segmented Toggle */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="text-sm font-extrabold text-[var(--text-primary)] truncate tabular-nums">
            {formatShortCalendarDate(activeDate)}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Scroll columns to pick {activeEndpoint === 'from' ? 'start' : 'end'} date
          </div>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-xl glass-subtle text-xs font-bold shrink-0">
          <button
            type="button"
            onClick={() => setActiveEndpoint('from')}
            className={`min-h-[34px] px-3 rounded-lg cursor-pointer transition-all ${
              activeEndpoint === 'from'
                ? 'btn-electric-blue'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            From
          </button>
          <button
            type="button"
            onClick={() => setActiveEndpoint('to')}
            className={`min-h-[34px] px-3 rounded-lg cursor-pointer transition-all ${
              activeEndpoint === 'to'
                ? 'btn-electric-blue'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            To
          </button>
        </div>
      </div>

      {/* Column Titles */}
      <div className="grid grid-cols-3 gap-1 px-1 mb-1 text-[10px] font-bold text-[var(--text-muted)] text-center">
        <span>Month</span>
        <span>Day</span>
        <span>Year</span>
      </div>

      {/* Cylindrical 3-Column Wheel Drum + Centered Selection Lens */}
      <div className="relative rounded-2xl overflow-hidden border border-[var(--border-glass)] bg-black/[0.02] dark:bg-white/[0.02]">
        {/* Centered Selection Lens Band */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-1.5 rounded-xl z-0 border ${
            isDark
              ? 'bg-[#0066FF]/16 border-[#008DFF]/45'
              : 'bg-[#0066FF]/10 border-[#0066FF]/25'
          }`}
          style={{
            top: `${ITEM_HEIGHT * 2}px`,
            height: `${ITEM_HEIGHT}px`
          }}
        />

        <div className="relative z-10 flex items-center gap-1 px-1.5">
          <DrumColumn
            ariaLabel={`${activeEndpoint} Month`}
            options={monthOptions}
            selectedValue={activeDate.month}
            onChange={(val) => updateActiveDatePart('month', val)}
            isDark={isDark}
          />
          <DrumColumn
            ariaLabel={`${activeEndpoint} Day`}
            options={dayOptions}
            selectedValue={activeDate.day}
            onChange={(val) => updateActiveDatePart('day', val)}
            isDark={isDark}
          />
          <DrumColumn
            ariaLabel={`${activeEndpoint} Year`}
            options={yearOptions}
            selectedValue={activeDate.year}
            onChange={(val) => updateActiveDatePart('year', val)}
            isDark={isDark}
          />
        </div>
      </div>

      {/* Footer: Live Range Readout + Reset & Done */}
      <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-[var(--border-glass)]">
        <span className="text-[11px] font-semibold text-[var(--text-secondary)] tabular-nums truncate">
          {formatCompactCalendarDate(fromDate)} – {formatShortCalendarDate(toDate)} ·{' '}
          {totalSelectedDays}d
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onChangeRange(defaultFromDate, defaultToDate)}
            className="min-h-[40px] sm:min-h-[34px] px-3 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="min-h-[40px] sm:min-h-[34px] px-4 rounded-xl text-xs font-bold btn-electric-blue cursor-pointer active:scale-[0.98] transition-transform"
          >
            Done
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Unified From -> To Frosted Glass Trigger Bar */}
      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-[260px] glass-subtle rounded-xl p-1 flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleOpen('from')}
            aria-expanded={isOpen && activeEndpoint === 'from'}
            className={`flex-1 min-h-[44px] px-3 py-1.5 rounded-lg flex items-center gap-2 text-left transition-all cursor-pointer ${
              isOpen && activeEndpoint === 'from'
                ? isDark
                  ? 'bg-[#0066FF]/20 text-[#F1F5FF] ring-1 ring-[#008DFF]/70'
                  : 'bg-white/95 text-[#0066FF] shadow-sm ring-1 ring-[#0066FF]/35'
                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            <Calendar size={14} className="text-[var(--accent-primary)] shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] leading-none">
                From
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] tabular-nums truncate mt-0.5">
                {formatShortCalendarDate(fromDate)}
              </div>
            </div>
          </button>

          <div className="px-1.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--text-muted)] tabular-nums shrink-0">
            <ArrowRight size={13} />
            <span className="hidden xs:inline">{totalSelectedDays}d</span>
          </div>

          <button
            type="button"
            onClick={() => handleOpen('to')}
            aria-expanded={isOpen && activeEndpoint === 'to'}
            className={`flex-1 min-h-[44px] px-3 py-1.5 rounded-lg flex items-center justify-between gap-2 text-left transition-all cursor-pointer ${
              isOpen && activeEndpoint === 'to'
                ? isDark
                  ? 'bg-[#0066FF]/20 text-[#F1F5FF] ring-1 ring-[#008DFF]/70'
                  : 'bg-white/95 text-[#0066FF] shadow-sm ring-1 ring-[#0066FF]/35'
                : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
            }`}
          >
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-[var(--text-muted)] leading-none">
                To
              </div>
              <div className="text-xs sm:text-[13px] font-bold text-[var(--text-primary)] tabular-nums truncate mt-0.5">
                {formatShortCalendarDate(toDate)}
              </div>
            </div>
            <ChevronDown
              size={14}
              className={`text-[var(--text-muted)] shrink-0 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {hasAnyFilters && (
          <button
            type="button"
            onClick={onResetAllFilters}
            className="min-h-[48px] px-3.5 rounded-xl glass-subtle text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Desktop / Tablet Anchored Frosted Popover (>= 640px) */}
      {isOpen && !isMobileViewport && (
        <div
          role="dialog"
          aria-label="Select From and To dates"
          className={`absolute left-0 top-full mt-2 w-[380px] rounded-2xl p-4 shadow-2xl border border-[var(--border-glass-strong)] backdrop-blur-2xl z-40 animate-fade-in ${
            isDark ? 'bg-[#061C35]/96' : 'bg-[#F4F7FB]/98'
          }`}
        >
          {pickerPanelBody}
        </div>
      )}

      {/* Mobile Touch Bottom Sheet (< 640px) rendered via Portal above bottom nav */}
      {isOpen &&
        isMobileViewport &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Select From and To dates"
          >
            <div
              className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div
              className={`relative z-10 w-full max-w-lg rounded-t-3xl p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl border-t border-[var(--border-glass-strong)] backdrop-blur-2xl animate-fade-in ${
                isDark ? 'bg-[#061C35]/96' : 'bg-[#F4F7FB]/98'
              }`}
            >
              {pickerPanelBody}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
