import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown, ChevronRight, RotateCcw, Search, SearchX } from 'lucide-react';
import { CategoryAuditRecord } from '../../types';
import { DataProvenance } from '../../utils/homeAnalyticsData';
import {
  CanonicalPlanogramSummary,
  SosTrendPoint,
  TrajectoryPoint
} from './overviewTypes';

export const AnimatedNumber: React.FC<{
  value: number;
  suffix?: string;
  decimals?: number;
  className?: string;
}> = ({ value, suffix = '', decimals = 0, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();
  const [display, setDisplay] = useState<number>(value);
  const prevRef = useRef<number>(value);

  useEffect(() => {
    if (shouldReduceMotion) {
      prevRef.current = value;
      setDisplay(value);
      return;
    }
    const startVal = prevRef.current;
    const endVal = value;
    if (startVal === endVal) return;

    const startTime = performance.now();
    const duration = 360;
    let rafId = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + (endVal - startVal) * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        prevRef.current = endVal;
        setDisplay(endVal);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
      prevRef.current = value;
    };
  }, [value, shouldReduceMotion]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : String(Math.round(display));

  return (
    <span className={`ov-tabular ${className}`}>
      {formatted}
      {suffix}
    </span>
  );
};

export const ProvenanceInline: React.FC<{
  label: string;
  tone?: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
  className?: string;
}> = ({ label, tone = 'neutral', className = '' }) => {
  const toneClass =
    tone === 'live'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'historical'
      ? 'text-[#0066FF] dark:text-[#00C8FF]'
      : tone === 'simulated'
      ? 'text-amber-700/90 dark:text-amber-400/85'
      : 'text-[var(--text-muted)]';

  return (
    <span
      className={`text-[11px] font-medium tracking-wide ${toneClass} ${className}`}
    >
      {label}
    </span>
  );
};

export function provenanceMetaLabel(prov: DataProvenance): {
  text: string;
  tone: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
} {
  switch (prov) {
    case 'live_verified':
      return { text: 'Live verified', tone: 'live' };
    case 'historical_verified':
      return { text: 'Sheet 2 historical', tone: 'historical' };
    case 'cached':
      return { text: 'Cached snapshot', tone: 'neutral' };
    case 'simulated':
      return { text: 'Simulated', tone: 'simulated' };
    default:
      return { text: 'No audit data', tone: 'unavailable' };
  }
}

export const EmptyScopeState: React.FC<{
  title?: string;
  description?: string;
  onResetFilters?: () => void;
}> = ({
  title = 'No matching outlets in active scope',
  description = 'Adjust or reset your account, outlet, or category filters to inspect territory data.',
  onResetFilters
}) => (
  <div className="ov-glass rounded-[20px] p-6 text-center flex flex-col items-center justify-center gap-3">
    <div className="w-11 h-11 rounded-[12px] ov-glass-recessed flex items-center justify-center text-[var(--text-muted)]">
      <SearchX size={20} />
    </div>
    <div className="max-w-sm space-y-1">
      <div className="text-sm font-bold text-[var(--text-primary)]">{title}</div>
      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
        {description}
      </p>
    </div>
    {onResetFilters && (
      <button
        type="button"
        onClick={onResetFilters}
        className="min-h-[40px] px-4 rounded-[12px] btn-electric-blue text-xs font-bold flex items-center gap-1.5 cursor-pointer"
      >
        <RotateCcw size={13} />
        <span>Reset Filters</span>
      </button>
    )}
  </div>
);

export const SignatureSalesGauge: React.FC<{
  pct: number;
  mtd: number;
  target: number;
  pace: number;
  remaining: number;
  perDay: string;
  dash: string;
  tx1: string;
  ty1: string;
  tx2: string;
  ty2: string;
  isDark: boolean;
  periodLabel: string;
  onInspectSales?: () => void;
  compact?: boolean;
}> = ({
  pct,
  mtd,
  target,
  pace,
  remaining,
  perDay,
  dash,
  tx1,
  ty1,
  tx2,
  ty2,
  isDark,
  periodLabel,
  onInspectSales,
  compact = false
}) => {
  const shouldReduceMotion = useReducedMotion();
  const trackColor = isDark ? 'rgba(148, 185, 232, 0.12)' : 'rgba(11, 29, 54, 0.08)';
  const tickColor = isDark ? 'rgba(164, 185, 209, 0.28)' : 'rgba(11, 29, 54, 0.16)';
  const paceColor = isDark ? '#F5F7FA' : '#0B1D36';
  const deltaPace = pct - pace;

  const ticks = Array.from({ length: 25 }, (_, idx) => {
    const angle = Math.PI - (idx / 24) * Math.PI;
    const x1 = 163 + 111 * Math.cos(angle);
    const y1 = 118 - 111 * Math.sin(angle);
    const len = idx % 6 === 0 ? 7 : 3.5;
    const x2 = 163 + (111 + len) * Math.cos(angle);
    const y2 = 118 - (111 + len) * Math.sin(angle);
    return { x1, y1, x2, y2, major: idx % 6 === 0 };
  });

  const Wrapper = onInspectSales ? motion.button : motion.div;

  return (
    <Wrapper
      {...(onInspectSales
        ? {
            type: 'button' as const,
            onClick: onInspectSales,
            whileTap: shouldReduceMotion ? undefined : { scale: 0.985 }
          }
        : {})}
      aria-label={
        onInspectSales
          ? `Sales achievement ${pct} percent, ${mtd} of ${target} MTON. Open Sales Intelligence.`
          : `Sales achievement ${pct} percent, ${mtd} of ${target} MTON`
      }
      className={`w-full relative flex flex-col items-center justify-center text-center select-none ${
        compact ? 'py-1' : 'py-2'
      } ${onInspectSales ? 'cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] rounded-[20px]' : ''}`}
    >
      {/* Atmospheric glow behind gauge arc */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[260px] h-[160px] rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: isDark
            ? 'radial-gradient(circle, rgba(0, 141, 255, 0.28) 0%, rgba(0, 229, 229, 0.11) 54%, transparent 76%)'
            : 'radial-gradient(circle, rgba(0, 102, 255, 0.14) 0%, rgba(0, 200, 255, 0.06) 54%, transparent 76%)'
        }}
      />

      {/* Semi-Circular Instrument Arc + Centered DOM Readout */}
      <div
        className={`relative z-10 w-full ${
          compact ? 'max-w-[268px]' : 'max-w-[304px]'
        } mx-auto`}
      >
        <svg
          viewBox="0 0 326 134"
          className="w-full h-auto overflow-visible block"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ovHeroGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0066FF" />
              <stop offset="52%" stopColor="#00A3FF" />
              <stop offset="100%" stopColor="#00E5E5" />
            </linearGradient>
            <filter id="ovHeroGaugeGlow" x="-20%" y="-25%" width="140%" height="150%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer precision tick marks */}
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1.toFixed(1)}
              y1={t.y1.toFixed(1)}
              x2={t.x2.toFixed(1)}
              y2={t.y2.toFixed(1)}
              stroke={tickColor}
              strokeWidth={t.major ? '1.6' : '0.9'}
              strokeLinecap="round"
            />
          ))}

          {/* Base track */}
          <path
            d="M 68 118 A 95 95 0 0 1 258 118"
            fill="none"
            stroke={trackColor}
            strokeWidth="15"
            strokeLinecap="round"
          />

          {/* Glowing progress fill */}
          <motion.path
            d="M 68 118 A 95 95 0 0 1 258 118"
            fill="none"
            stroke="url(#ovHeroGaugeGrad)"
            strokeWidth="15"
            strokeLinecap="round"
            filter="url(#ovHeroGaugeGlow)"
            initial={false}
            animate={{ strokeDasharray: dash }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
            }
          />

          {/* Schedule pace needle */}
          <line
            x1={tx1}
            y1={ty1}
            x2={tx2}
            y2={ty2}
            stroke={paceColor}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <circle cx={tx2} cy={ty2} r="3" fill={isDark ? '#00E5E5' : '#0066FF'} />
        </svg>

        {/* Centered Hero Numerical Readout */}
        <div className="absolute inset-x-0 bottom-[6px] flex flex-col items-center justify-end pointer-events-none">
          <div
            className={`font-heading font-extrabold leading-[0.88] tracking-tight text-[var(--text-primary)] ${
              compact ? 'text-[52px] sm:text-[56px]' : 'text-[58px] sm:text-[62px]'
            }`}
          >
            <AnimatedNumber value={pct} suffix="%" />
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] ov-tabular">
            <span>
              <strong className="font-semibold text-[var(--text-primary)]">{mtd}</strong> /{' '}
              {target} MTON
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span
              className={
                deltaPace >= 0
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-amber-600 dark:text-amber-400 font-semibold'
              }
            >
              {deltaPace >= 0 ? `+${deltaPace}` : deltaPace} pts vs pace
            </span>
          </div>
        </div>
      </div>

      {/* Unboxed Remaining & Required /day Telemetry */}
      <div className="relative z-10 mt-3 flex items-center justify-center gap-5 sm:gap-7 ov-tabular">
        <div className="text-center">
          <div className="text-[11px] text-[var(--text-muted)]">Remaining</div>
          <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
            <AnimatedNumber value={remaining} suffix=" MTON" />
          </div>
        </div>

        <span
          aria-hidden="true"
          className="w-px h-7 bg-black/[0.08] dark:bg-white/[0.1]"
        />

        <div className="text-center">
          <div className="text-[11px] text-[var(--text-muted)]">Required /day</div>
          <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">
            {perDay}{' '}
            <span className="text-[11px] font-normal text-[var(--text-muted)]">MTON</span>
          </div>
        </div>

        <span
          aria-hidden="true"
          className="w-px h-7 bg-black/[0.08] dark:bg-white/[0.1]"
        />

        <div className="text-center">
          <div className="text-[11px] text-[var(--text-muted)]">Cycle Pace</div>
          <div className="text-sm font-bold text-[var(--text-primary)] mt-0.5">{pace}%</div>
        </div>
      </div>

      {/* Quiet Inline Provenance & Cycle Metadata */}
      <div className="relative z-10 mt-2 flex items-center justify-center gap-1.5 text-[11px] text-[var(--text-muted)] ov-tabular">
        <ProvenanceInline label="Simulated" tone="simulated" />
        <span>·</span>
        <span>{periodLabel}</span>
      </div>
    </Wrapper>
  );
};

export interface MetricMatrixCell {
  id: string;
  title: string;
  valueLabel: string;
  subtitle: string;
  provenance: string;
  provenanceTone?: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
  valueColorClass?: string;
  onClick: () => void;
}

export const IntegratedMetricMatrix: React.FC<{
  cells: MetricMatrixCell[];
}> = ({ cells }) => {
  return (
    <div className="ov-glass rounded-[20px] overflow-hidden grid grid-cols-2 md:grid-cols-4">
      {cells.map((cell, idx) => {
        const isLeftColMobile = idx % 2 === 0;
        const isTopRowMobile = idx < 2;
        const isLastDesktop = idx === cells.length - 1;

        return (
          <button
            key={cell.id}
            type="button"
            onClick={cell.onClick}
            className={`text-left px-4 py-3.5 sm:px-5 sm:py-4 transition-colors cursor-pointer hover:bg-black/[0.025] dark:hover:bg-white/[0.035] active:bg-black/[0.04] dark:active:bg-white/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0066FF] ${
              isLeftColMobile ? 'border-r border-black/[0.06] dark:border-white/[0.07]' : ''
            } ${
              isTopRowMobile ? 'border-b border-black/[0.06] dark:border-white/[0.07] md:border-b-0' : ''
            } ${
              !isLastDesktop ? 'md:border-r md:border-black/[0.06] md:dark:border-white/[0.07]' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-[var(--text-secondary)] truncate">
                {cell.title}
              </span>
            </div>

            <div
              className={`font-heading text-[28px] sm:text-[32px] font-extrabold leading-none mt-1.5 ov-tabular ${
                cell.valueColorClass || 'text-[var(--text-primary)]'
              }`}
            >
              {cell.valueLabel}
            </div>

            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] ov-tabular truncate">
              <span className="truncate">{cell.subtitle}</span>
              <span aria-hidden="true">·</span>
              <ProvenanceInline
                label={cell.provenance}
                tone={cell.provenanceTone}
                className="shrink-0"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export interface GlassScopeOption {
  value: string;
  label: string;
  meta?: string;
}

export const GlassScopePopover: React.FC<{
  label: string;
  displayValue: string;
  value: string;
  options: GlassScopeOption[];
  onChange: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: 'left' | 'right';
}> = ({
  label,
  displayValue,
  value,
  options,
  onChange,
  searchable = false,
  searchPlaceholder = 'Search…',
  align = 'left'
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.meta && opt.meta.toLowerCase().includes(q))
    );
  }, [options, query]);

  const isNonDefault = value !== 'All' && value !== 'mtd';

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${displayValue}`}
        className={`min-h-[36px] px-3 rounded-[12px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap border ${
          open || isNonDefault
            ? 'ov-glass border-[#0066FF]/40 dark:border-[#00C8FF]/45 text-[var(--text-primary)]'
            : 'ov-glass-recessed text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
        }`}
      >
        <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)] max-w-[132px] truncate ov-tabular">
          {displayValue}
        </span>
        <ChevronDown
          size={13}
          className={`text-[var(--text-muted)] shrink-0 transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          className={`absolute top-[calc(100%+8px)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 w-64 max-h-72 flex flex-col rounded-[20px] ov-glass-strong overflow-hidden animate-fade-in`}
        >
          {searchable && (
            <div className="p-2.5 border-b border-black/[0.06] dark:border-white/[0.08] shrink-0">
              <div className="relative flex items-center">
                <Search
                  size={13}
                  className="absolute left-2.5 text-[var(--text-muted)] pointer-events-none"
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-8 pl-8 pr-2.5 rounded-[12px] ov-glass-recessed text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[#0066FF]"
                />
              </div>
            </div>
          )}

          <div className="overflow-y-auto p-1.5 space-y-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[var(--text-muted)]">
                No matching options
              </div>
            ) : (
              filtered.map((opt) => {
                const selected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-[12px] text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#0066FF]/12 dark:bg-[#00C8FF]/14 text-[#0066FF] dark:text-[#00C8FF] font-semibold'
                        : 'text-[var(--text-primary)] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.meta && (
                        <div className="text-[10px] text-[var(--text-muted)] truncate ov-tabular">
                          {opt.meta}
                        </div>
                      )}
                    </div>
                    {selected && <Check size={14} className="shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const HeadlineKpiCard: React.FC<{
  title: string;
  valueLabel: string;
  subtitle: string;
  provenance?: string;
  provenanceTone?: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
  accentColor: string;
  accentGlow?: string;
  visual: React.ReactNode;
  onClick?: () => void;
  valueColorClass?: string;
  className?: string;
}> = ({
  title,
  valueLabel,
  subtitle,
  provenance,
  provenanceTone = 'neutral',
  accentColor,
  accentGlow,
  visual,
  onClick,
  valueColorClass = 'text-[var(--text-primary)]',
  className = ''
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      {...(onClick
        ? {
            type: 'button' as const,
            onClick,
            whileHover: shouldReduceMotion ? undefined : { y: -2 },
            whileTap: shouldReduceMotion ? undefined : { scale: 0.98 }
          }
        : {})}
      className={`ov-panel relative overflow-hidden rounded-[20px] p-3.5 sm:p-4 text-left flex flex-col justify-between gap-2.5 min-h-[118px] transition-colors ${
        onClick ? 'cursor-pointer hover:border-[#008DFF]/45 dark:hover:border-[#00C8FF]/45' : ''
      } ${className}`}
    >
      {/* Subtle top colored accent line */}
      <span
        aria-hidden="true"
        className="absolute top-0 inset-x-4 h-[2px] rounded-b-full opacity-90"
        style={{
          background: accentGlow || accentColor
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: accentColor }}
          />
          <span className="text-[12px] font-semibold text-[var(--text-secondary)] truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {provenance && (
            <ProvenanceInline label={provenance} tone={provenanceTone} className="text-[10px]" />
          )}
          {onClick && (
            <ChevronRight size={13} className="text-[var(--text-muted)]" />
          )}
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div
            className={`font-heading text-[32px] sm:text-[34px] font-extrabold leading-none ov-tabular ${valueColorClass}`}
          >
            {valueLabel}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] mt-1.5 truncate ov-tabular">
            {subtitle}
          </div>
        </div>
        <div className="shrink-0">{visual}</div>
      </div>
    </Tag>
  );
};

export const KpiSparkCard: React.FC<{
  title: string;
  valueLabel: string;
  subtitle: string;
  provenance?: string;
  provenanceTone?: 'neutral' | 'live' | 'historical' | 'simulated' | 'unavailable';
  visual: React.ReactNode;
  onClick?: () => void;
  valueColorClass?: string;
}> = (props) => <HeadlineKpiCard {...props} accentColor="#008DFF" />;

export const InteractiveTrajectoryChart: React.FC<{
  points: TrajectoryPoint[];
  targetTotal: number;
  startLabel: string;
  midLabel?: string;
  endLabel: string;
  isDark: boolean;
}> = ({ points, targetTotal, startLabel, midLabel, endLabel, isDark }) => {
  const shouldReduceMotion = useReducedMotion();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const W = 440;
  const H = 166;
  const padLeft = 34;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 10;
  const plotW = W - padLeft - padRight;
  const plotH = H - padTop - padBottom;

  const maxActual = points.length > 0 ? Math.max(...points.map((p) => p.actualMton)) : 1;
  const ymax = Math.max(targetTotal * 1.06, maxActual * 1.14, 10);
  const yMid = Math.round(ymax / 2);
  const yTopTick = Math.round(ymax);

  const xAt = (idx: number) =>
    points.length <= 1
      ? padLeft + plotW
      : padLeft + (idx / Math.max(1, points.length - 1)) * plotW;
  const yAt = (v: number) => padTop + plotH - (v / ymax) * plotH;

  const actualPath =
    points.length === 0
      ? ''
      : points.length === 1
      ? `M${padLeft} ${yAt(0).toFixed(1)} L${(padLeft + plotW).toFixed(1)} ${yAt(
          points[0].actualMton
        ).toFixed(1)}`
      : `M${points
          .map((p, i) => `${xAt(i).toFixed(1)} ${yAt(p.actualMton).toFixed(1)}`)
          .join(' L')}`;

  const areaPath =
    points.length === 0
      ? ''
      : `${actualPath} L${xAt(points.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(
          1
        )} L${padLeft} ${(padTop + plotH).toFixed(1)} Z`;

  const targetPath =
    points.length === 0
      ? ''
      : points.length === 1
      ? `M${padLeft} ${yAt(0).toFixed(1)} L${(padLeft + plotW).toFixed(1)} ${yAt(
          points[0].targetMton
        ).toFixed(1)}`
      : `M${points
          .map((p, i) => `${xAt(i).toFixed(1)} ${yAt(p.targetMton).toFixed(1)}`)
          .join(' L')}`;

  const inspectIdx =
    activeIdx !== null && points[activeIdx]
      ? activeIdx
      : Math.max(0, points.length - 1);
  const inspectPt = points[inspectIdx];

  const resolveIdxFromClientX = (clientX: number) => {
    const el = svgRef.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const plotLeftPx = rect.left + (padLeft / W) * rect.width;
    const plotWidthPx = Math.max(1, (plotW / W) * rect.width);
    const frac = Math.max(0, Math.min(1, (clientX - plotLeftPx) / plotWidthPx));
    const idx = Math.round(frac * Math.max(0, points.length - 1));
    setActiveIdx(idx);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (points.length === 0) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveIdx((prev) => Math.max(0, (prev ?? points.length - 1) - 1));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveIdx((prev) => Math.min(points.length - 1, (prev ?? 0) + 1));
    } else if (e.key === 'Escape') {
      setActiveIdx(null);
    }
  };

  const lineColor = isDark ? '#00C8FF' : '#0066FF';
  const gridColor = isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0';
  const targetColor = isDark ? '#94A9C9' : '#647D9E';
  const axisTextColor = isDark ? '#647D9E' : '#647D9E';

  return (
    <div className="space-y-2">
      {/* Unboxed Live Inspection Readout */}
      {inspectPt && (
        <div className="pb-2 border-b border-black/[0.06] dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-xs ov-tabular">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: lineColor }}
            />
            <span className="font-semibold text-[var(--text-primary)]">{inspectPt.label}</span>
            <span className="text-[var(--text-muted)]">
              {activeIdx !== null ? '· Scrubbing' : '· Latest'}
            </span>
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-[var(--text-secondary)]">
              Actual{' '}
              <strong className="text-[var(--text-primary)] font-bold">
                {inspectPt.actualMton} MTON
              </strong>
            </span>
            <span className="text-[var(--text-muted)]">Target {inspectPt.targetMton}</span>
            <span
              className={`font-semibold ${
                inspectPt.varianceMton >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {inspectPt.varianceMton >= 0 ? '+' : ''}
              {inspectPt.varianceMton} ({inspectPt.variancePct >= 0 ? '+' : ''}
              {inspectPt.variancePct}%)
            </span>
          </div>
        </div>
      )}

      {/* Interactive Crosshair SVG with Explicit Y-Axis Reference Ticks */}
      <div
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label="Interactive sales vs target trajectory chart. Use pointer or left and right arrows to inspect daily values."
        className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] rounded-[12px]"
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ touchAction: 'pan-y' }}
          onPointerDown={(e) => resolveIdxFromClientX(e.clientX)}
          onPointerMove={(e) => {
            if (e.pointerType === 'mouse' || e.buttons > 0) {
              resolveIdxFromClientX(e.clientX);
            }
          }}
          onPointerLeave={() => setActiveIdx(null)}
          className="w-full h-auto block cursor-crosshair select-none"
          role="img"
        >
          <defs>
            <linearGradient id="ovTrajFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Y-axis labels */}
          <text
            x={padLeft - 6}
            y={padTop + 4}
            textAnchor="end"
            fontSize="10"
            fill={axisTextColor}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {yTopTick}
          </text>
          <text
            x={padLeft - 6}
            y={padTop + plotH * 0.5 + 3}
            textAnchor="end"
            fontSize="10"
            fill={axisTextColor}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {yMid}
          </text>
          <text
            x={padLeft - 6}
            y={padTop + plotH + 3}
            textAnchor="end"
            fontSize="10"
            fill={axisTextColor}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            0
          </text>

          {/* Horizontal reference grid */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={W - padRight}
            y2={padTop}
            stroke={gridColor}
            strokeDasharray="2 4"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH * 0.5}
            x2={W - padRight}
            y2={padTop + plotH * 0.5}
            stroke={gridColor}
            strokeDasharray="3 3"
          />
          <line
            x1={padLeft}
            y1={padTop + plotH}
            x2={W - padRight}
            y2={padTop + plotH}
            stroke={gridColor}
          />

          {areaPath && <path d={areaPath} fill="url(#ovTrajFill)" />}
          {targetPath && (
            <path
              d={targetPath}
              fill="none"
              stroke={targetColor}
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
          )}
          {actualPath && (
            <motion.path
              d={actualPath}
              fill="none"
              stroke={lineColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={shouldReduceMotion ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
              }
            />
          )}

          {inspectPt && (
            <>
              <line
                x1={xAt(inspectIdx)}
                y1={padTop}
                x2={xAt(inspectIdx)}
                y2={padTop + plotH}
                stroke={isDark ? 'rgba(255,255,255,0.28)' : 'rgba(11,29,54,0.2)'}
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={xAt(inspectIdx)}
                cy={yAt(inspectPt.targetMton)}
                r="3.2"
                fill={targetColor}
              />
              <circle
                cx={xAt(inspectIdx)}
                cy={yAt(inspectPt.actualMton)}
                r="5.2"
                fill={lineColor}
                stroke={isDark ? '#020D1F' : '#FFFFFF'}
                strokeWidth="2.2"
              />
            </>
          )}
        </svg>
      </div>

      <div
        className="flex items-center justify-between text-[11px] font-medium text-[var(--text-muted)] ov-tabular"
        style={{ paddingLeft: '34px' }}
      >
        <span>{startLabel}</span>
        {midLabel && <span>{midLabel}</span>}
        <span>{endLabel}</span>
      </div>
    </div>
  );
};

export const InteractiveSosTrendChart: React.FC<{
  points: SosTrendPoint[];
  isDark: boolean;
  accentColor?: string;
}> = ({ points, isDark, accentColor }) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const W = 360;
  const H = 112;
  const padLeft = 30;
  const padRight = 6;
  const padY = 12;
  const plotW = W - padLeft - padRight;
  const plotH = H - padY * 2;
  const values = points.map((p) => p.sosPct);
  const minV = values.length > 0 ? Math.max(0, Math.min(...values) - 8) : 0;
  const maxV = values.length > 0 ? Math.min(100, Math.max(...values) + 8) : 100;
  const span = Math.max(10, maxV - minV);

  const xAt = (idx: number) =>
    points.length <= 1
      ? padLeft + plotW
      : padLeft + (idx / Math.max(1, points.length - 1)) * plotW;
  const yAt = (v: number) => padY + plotH - ((v - minV) / span) * plotH;

  const linePath =
    points.length === 0
      ? ''
      : points.length === 1
      ? `M${padLeft} ${yAt(points[0].sosPct).toFixed(1)} L${W - padRight} ${yAt(
          points[0].sosPct
        ).toFixed(1)}`
      : `M${points
          .map((p, i) => `${xAt(i).toFixed(1)} ${yAt(p.sosPct).toFixed(1)}`)
          .join(' L')}`;

  const areaPath =
    points.length === 0
      ? ''
      : `${linePath} L${xAt(points.length - 1).toFixed(1)} ${(H - padY).toFixed(
          1
        )} L${padLeft} ${(H - padY).toFixed(1)} Z`;

  const inspectIdx =
    activeIdx !== null && points[activeIdx] ? activeIdx : Math.max(0, points.length - 1);
  const inspectPt = points[inspectIdx];
  const lineColor = accentColor || (isDark ? '#00C8FF' : '#0066FF');
  const axisInk = isDark ? '#7289A6' : '#647D9E';
  const gradId = `ovSosArea-${lineColor.replace(/[^a-zA-Z0-9]/g, '')}`;

  const resolveIdx = (clientX: number) => {
    const el = svgRef.current;
    if (!el || points.length === 0) return;
    const rect = el.getBoundingClientRect();
    const plotLeftPx = rect.left + (padLeft / W) * rect.width;
    const plotWidthPx = Math.max(1, (plotW / W) * rect.width);
    const frac = Math.max(0, Math.min(1, (clientX - plotLeftPx) / plotWidthPx));
    setActiveIdx(Math.round(frac * Math.max(0, points.length - 1)));
  };

  return (
    <div className="space-y-2">
      {inspectPt && (
        <div className="flex items-center justify-between text-xs ov-tabular">
          <span className="font-semibold text-[var(--text-secondary)]">
            {inspectPt.label} · {inspectPt.sampleCount} store
            {inspectPt.sampleCount === 1 ? '' : 's'}
          </span>
          <span className="font-extrabold" style={{ color: lineColor }}>
            {inspectPt.sosPct}% SOS
          </span>
        </div>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ touchAction: 'pan-y' }}
        onPointerDown={(e) => resolveIdx(e.clientX)}
        onPointerMove={(e) => {
          if (e.pointerType === 'mouse' || e.buttons > 0) resolveIdx(e.clientX);
        }}
        onPointerLeave={() => setActiveIdx(null)}
        className="w-full h-auto block cursor-crosshair select-none"
        role="img"
        aria-label="Share of shelf trend chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.26" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        <text x={padLeft - 5} y={padY + 4} textAnchor="end" fontSize="9.5" fill={axisInk}>
          {Math.round(maxV)}%
        </text>
        <text x={padLeft - 5} y={H - padY + 3} textAnchor="end" fontSize="9.5" fill={axisInk}>
          {Math.round(minV)}%
        </text>

        <line
          x1={padLeft}
          y1={H - padY}
          x2={W - padRight}
          y2={H - padY}
          stroke={isDark ? 'rgba(148,185,232,0.14)' : '#CBD5E1'}
        />
        <line
          x1={padLeft}
          y1={H * 0.5}
          x2={W - padRight}
          y2={H * 0.5}
          stroke={isDark ? 'rgba(148,185,232,0.08)' : '#E2E8F0'}
          strokeDasharray="3 3"
        />
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {inspectPt && (
          <>
            <line
              x1={xAt(inspectIdx)}
              y1={padY}
              x2={xAt(inspectIdx)}
              y2={H - padY}
              stroke={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(11,29,54,0.2)'}
              strokeDasharray="3 3"
            />
            <circle
              cx={xAt(inspectIdx)}
              cy={yAt(inspectPt.sosPct)}
              r="5"
              fill={lineColor}
              stroke={isDark ? '#020D1F' : '#FFFFFF'}
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      {points.length > 0 && (
        <div
          className="flex items-center justify-between text-[11px] text-[var(--text-muted)] ov-tabular"
          style={{ paddingLeft: `${padLeft}px` }}
        >
          <span>{points[0].label}</span>
          <span>{points[points.length - 1].label}</span>
        </div>
      )}
    </div>
  );
};

export function getPlanogramRingSegments(planogram: CanonicalPlanogramSummary, isDark: boolean) {
  const total = Math.max(
    1,
    planogram.compliantCount + planogram.partialCount + planogram.nonCompliantCount
  );
  const C = 251.327;
  const compLen = (planogram.compliantCount / total) * C;
  const partLen = (planogram.partialCount / total) * C;
  const nonLen = (planogram.nonCompliantCount / total) * C;

  return [
    {
      label: 'Compliant ≥85%',
      count: planogram.compliantCount,
      color: isDark ? '#10B981' : '#059669',
      dash: `${compLen.toFixed(1)} ${(C - compLen).toFixed(1)}`,
      off: '0'
    },
    {
      label: 'Partial 70–84%',
      count: planogram.partialCount,
      color: isDark ? '#FFB800' : '#D97706',
      dash: `${partLen.toFixed(1)} ${(C - partLen).toFixed(1)}`,
      off: (-compLen).toFixed(1)
    },
    {
      label: 'Below <70%',
      count: planogram.nonCompliantCount,
      color: isDark ? '#EF4444' : '#DC2626',
      dash: `${nonLen.toFixed(1)} ${(C - nonLen).toFixed(1)}`,
      off: (-(compLen + partLen)).toFixed(1)
    }
  ];
}

export type _UnusedGuard = CategoryAuditRecord;
