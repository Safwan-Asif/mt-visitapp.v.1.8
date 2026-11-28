import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { toAlternativeDriveImageUrl, toDirectDriveImageUrl } from '../../services/googleSheetsService';

export interface MoreSubViewHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightSlot?: React.ReactNode;
}

export const MoreSubViewHeader: React.FC<MoreSubViewHeaderProps> = ({
  eyebrow = 'MARVIZ AI / MORE',
  title,
  subtitle,
  onBack,
  rightSlot
}) => {
  return (
    <header className="sticky top-0 z-20 cockpit-header-glow bg-[var(--bg-canvas)]/90 backdrop-blur-xl border-b border-[#D5E2F2] dark:border-[#104878]/80 px-4 md:px-6 py-3 shrink-0">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to More Workspace"
            className="min-h-[44px] min-w-[44px] rounded-[14px] cockpit-surface-elevated flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
          >
            <ArrowLeft size={18} strokeWidth={2.2} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] dark:text-[#00C8FF] leading-none mb-1 truncate">
              {eyebrow}
            </p>
            <h1 className="font-heading text-2xl md:text-[28px] font-extrabold italic uppercase tracking-wide text-[var(--text-primary)] leading-none truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-[var(--text-secondary)] mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightSlot && <div className="shrink-0 flex items-center gap-2">{rightSlot}</div>}
      </div>
    </header>
  );
};

export const ResilientDriveImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  loading?: 'lazy' | 'eager';
  fallbackNode?: React.ReactNode;
}> = ({ src, alt, className = '', loading = 'lazy', fallbackNode }) => {
  const [attempt, setAttempt] = useState<number>(0);

  const primary = toDirectDriveImageUrl(src);
  const secondary = toAlternativeDriveImageUrl(src);
  const candidates = [primary, secondary !== primary ? secondary : '', src].filter(Boolean);
  const activeSrc = candidates[attempt] || '';

  if (!activeSrc) {
    return (
      <>
        {fallbackNode || (
          <div className="w-full h-full flex items-center justify-center bg-[#061C35]/40 text-[10px] text-[var(--text-muted)]">
            No preview
          </div>
        )}
      </>
    );
  }

  return (
    <img
      src={activeSrc}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => {
        if (attempt + 1 < candidates.length) {
          setAttempt((prev) => prev + 1);
        } else {
          setAttempt(candidates.length);
        }
      }}
    />
  );
};

export function formatShortDateTime(raw?: string): string {
  if (!raw) return '—';
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date(parsed));
  } catch {
    return raw;
  }
}

export function formatDateOnly(raw?: string): string {
  if (!raw) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    const [y, m, d] = raw.trim().split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(dt);
  }
  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) return raw;
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(parsed));
}
