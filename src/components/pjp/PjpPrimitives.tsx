import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calendar, CheckCircle2, Loader2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { CategoryType } from '../../types';
import { useTheme } from '../../ThemeContext';

interface HeroProgressRingProps {
  completed: number;
  total: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export const HeroProgressRing: React.FC<HeroProgressRingProps> = ({
  completed,
  total,
  size = 188,
  strokeWidth = 13,
  label = 'Outlets Completed'
}) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const safeTotal = Math.max(0, total);
  const safeCompleted = Math.min(Math.max(0, completed), safeTotal || 0);
  const ratio = safeTotal > 0 ? safeCompleted / safeTotal : 0;
  const isAllDone = safeTotal > 0 && safeCompleted >= safeTotal;

  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ratio * circumference;
  const gradId = isAllDone ? 'pjp-ring-emerald' : 'pjp-ring-electric';

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      {/* Subtle ambient glow behind the ring */}
      <div
        className={`absolute inset-3 rounded-full blur-2xl pointer-events-none transition-colors duration-700 ${
          isAllDone
            ? isDark
              ? 'bg-[#22C55E]/28'
              : 'bg-[#22C55E]/18'
            : isDark
            ? 'bg-[#008DFF]/24'
            : 'bg-[#007AFF]/14'
        }`}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 relative z-10 overflow-visible"
        aria-label={`${safeCompleted} of ${safeTotal} ${label}`}
      >
        <defs>
          <linearGradient id="pjp-ring-electric" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00C8FF" />
            <stop offset="50%" stopColor="#008DFF" />
            <stop offset="100%" stopColor="#0054E9" />
          </linearGradient>
          <linearGradient id="pjp-ring-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="55%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#16A34A" />
          </linearGradient>
          <filter id="pjp-ring-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? 'rgba(28, 72, 122, 0.45)' : 'rgba(0, 102, 255, 0.10)'}
          strokeWidth={strokeWidth}
        />

        {/* Progress Arc */}
        {safeTotal > 0 && ratio > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            filter="url(#pjp-ring-glow)"
            initial={shouldReduceMotion ? { strokeDashoffset } : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.75, ease: [0.22, 1, 0.36, 1] }
            }
          />
        )}
      </svg>

      {/* Center Readout */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-4">
        <div className="flex items-baseline justify-center gap-1 tabular-nums leading-none">
          <span
            className={`font-heading font-extrabold text-[46px] sm:text-[50px] tracking-tight ${
              isAllDone
                ? 'text-[#22C55E]'
                : 'text-[var(--text-primary)]'
            }`}
          >
            {safeCompleted}
          </span>
          <span className="font-heading font-bold text-[26px] sm:text-[28px] text-[var(--text-muted)]">
            / {safeTotal}
          </span>
        </div>
        <span className="text-[11px] font-semibold tracking-wide text-[var(--text-secondary)] mt-1">
          {label}
        </span>
      </div>
    </div>
  );
};

interface MiniProgressRingProps {
  completed: number;
  total: number;
  size?: number;
}

export const MiniProgressRing: React.FC<MiniProgressRingProps> = ({
  completed,
  total,
  size = 44
}) => {
  const { isDark } = useTheme();
  const safeTotal = Math.max(1, total);
  const ratio = Math.min(1, Math.max(0, completed / safeTotal));
  const isAllDone = completed >= total && total > 0;
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - ratio * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDark ? 'rgba(28, 72, 122, 0.48)' : 'rgba(0, 102, 255, 0.14)'}
          strokeWidth={strokeWidth}
        />
        {ratio > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={isAllDone ? '#22C55E' : '#008DFF'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500"
          />
        )}
      </svg>
      <span
        className={`absolute text-[11px] font-extrabold tabular-nums ${
          isAllDone ? 'text-[#22C55E]' : 'text-[var(--text-primary)]'
        }`}
      >
        {completed}/{total}
      </span>
    </div>
  );
};

interface SegmentedPillOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedPillSwitchProps<T extends string> {
  options: Array<SegmentedPillOption<T>>;
  value: T;
  onChange: (value: T) => void;
  layoutId?: string;
  className?: string;
}

export function SegmentedPillSwitch<T extends string>({
  options,
  value,
  onChange,
  layoutId = 'pjp-segmented-thumb',
  className = ''
}: SegmentedPillSwitchProps<T>) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      role="tablist"
      className={`p-1 rounded-full glass-panel grid gap-1 relative ${className}`}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(opt.value)}
            className={`relative z-10 min-h-[38px] px-4 rounded-full text-xs font-bold tracking-wide transition-colors cursor-pointer active:scale-[0.97] ${
              isActive
                ? 'text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : { type: 'spring', stiffness: 420, damping: 32 }
                }
                className="absolute inset-0 rounded-full btn-electric-blue -z-10"
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface CategoryMonogramBadgeProps {
  category: CategoryType;
  completed?: boolean;
  size?: 'sm' | 'md';
}

export const CategoryMonogramBadge: React.FC<CategoryMonogramBadgeProps> = ({
  category,
  completed = false,
  size = 'md'
}) => {
  const code = category === 'Edible Oil' ? 'ED' : category === 'Flour' ? 'FL' : 'PA';

  const palette =
    category === 'Edible Oil'
      ? 'bg-[#6366F1]/22 border-[#818CF8]/45 text-[#818CF8]'
      : category === 'Flour'
      ? 'bg-[#00C8FF]/18 border-[#00C8FF]/45 text-[#00C8FF]'
      : 'bg-[#F59E0B]/20 border-[#FBBF24]/45 text-[#FBBF24]';

  const dims = size === 'sm' ? 'w-8 h-8 rounded-xl text-[11px]' : 'w-11 h-11 rounded-2xl text-xs';

  return (
    <div
      className={`${dims} border flex items-center justify-center font-extrabold tracking-wider shrink-0 transition-all ${
        completed
          ? 'bg-[#22C55E]/20 border-[#22C55E]/50 text-[#22C55E] shadow-[0_0_16px_rgba(34,197,94,0.22)]'
          : palette
      }`}
    >
      {code}
    </div>
  );
};

interface VisionAiStatusCapsuleProps {
  isAiRunning: boolean;
  hasError?: boolean;
  progressPercent: number;
  onRetryAi?: () => void;
}

export const VisionAiStatusCapsule: React.FC<VisionAiStatusCapsuleProps> = ({
  isAiRunning,
  hasError = false,
  progressPercent,
  onRetryAi
}) => {
  if (hasError) {
    return (
      <div className="w-full rounded-2xl px-3.5 py-2 border border-amber-500/45 bg-amber-500/12 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400 shrink-0" />
          <span className="font-bold text-amber-700 dark:text-amber-200 truncate">
            Vision AI — Needs Retry or Manual Count
          </span>
        </div>
        {onRetryAi && (
          <button
            type="button"
            onClick={onRetryAi}
            className="px-2.5 py-1 rounded-full bg-amber-500 text-black text-[11px] font-extrabold flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
          >
            <RefreshCw size={11} />
            <span>Retry</span>
          </button>
        )}
      </div>
    );
  }

  if (isAiRunning) {
    return (
      <div className="w-full rounded-2xl px-3.5 py-2 border border-[#008DFF]/50 bg-[#0066FF]/16 flex items-center justify-between gap-2 text-xs shadow-[0_0_20px_-6px_rgba(0,141,255,0.45)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-5 h-5 rounded-full bg-[#008DFF]/25 border border-[#00C8FF]/45 flex items-center justify-center shrink-0">
            <Sparkles size={11} className="text-[#00C8FF]" />
          </span>
          <span className="font-bold text-[var(--text-primary)] truncate">
            Vision AI <span className="text-[#008DFF] dark:text-[#00C8FF]">— Analysing Shelf</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-mono tabular-nums font-bold text-[#0066FF] dark:text-[#00C8FF]">
            {Math.max(12, progressPercent)}%
          </span>
          <Loader2 size={14} className="animate-spin text-[#008DFF] dark:text-[#00C8FF]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl px-3.5 py-2 border border-[#22C55E]/40 bg-[#22C55E]/12 flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2 min-w-0">
        <CheckCircle2 size={15} className="text-[#22C55E] shrink-0" />
        <span className="font-bold text-[#15803D] dark:text-[#4ADE80] truncate">
          Vision AI — Ready for Review
        </span>
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#15803D] dark:text-[#4ADE80] shrink-0">
        Done ✓
      </span>
    </div>
  );
};

export const DohaDatePill: React.FC<{ className?: string }> = ({ className = '' }) => {
  const formatted = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Qatar',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return new Date().toDateString();
    }
  }, []);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass-subtle text-[11px] font-semibold text-[var(--text-secondary)] ${className}`}
    >
      <Calendar size={12} className="text-[#008DFF] dark:text-[#00C8FF] shrink-0" />
      <span>{formatted}</span>
    </span>
  );
};

export const AnimatedCompletionCircle: React.FC<{ size?: number }> = ({ size = 112 }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className="relative flex items-center justify-center mx-auto"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full bg-[#22C55E]/30 blur-2xl pointer-events-none" />
      <motion.div
        initial={shouldReduceMotion ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : { type: 'spring', stiffness: 280, damping: 20 }
        }
        className="relative z-10 w-full h-full rounded-full btn-emerald-glow flex items-center justify-center border-2 border-[#86EFAC]/55"
      >
        <CheckCircle2 size={Math.round(size * 0.48)} strokeWidth={2.5} className="text-white" />
      </motion.div>
    </div>
  );
};
