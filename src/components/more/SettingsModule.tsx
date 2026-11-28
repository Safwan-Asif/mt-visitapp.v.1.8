import React, { useState } from 'react';
import { Check, LogOut, Moon, Sun, Type, User } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { TextScaleOption, UserProfile } from '../../types';
import { MoreSubViewHeader } from './MoreSharedUI';

interface SettingsModuleProps {
  executive: UserProfile;
  onLogout: () => void;
  onBack: () => void;
}

const TEXT_SIZE_OPTIONS: Array<{
  scale: TextScaleOption;
  label: string;
  pct: string;
}> = [
  { scale: 0.9, label: 'Small', pct: '90%' },
  { scale: 1.0, label: 'Default', pct: '100%' },
  { scale: 1.1, label: 'Large', pct: '110%' },
  { scale: 1.2, label: 'Extra Large', pct: '120%' }
];

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  executive,
  onLogout,
  onBack
}) => {
  const { theme, setTheme, textScale, setTextScale } = useTheme();
  const [confirmSignOutOpen, setConfirmSignOutOpen] = useState(false);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="PREFERENCES & SUPPORT / COCKPIT"
        title="SETTINGS"
        subtitle="Display theme, global text scaling & executive profile"
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* THEME PREVIEW CARDS */}
          <section className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] dark:text-[#00C8FF]">
                APPEARANCE
              </p>
              <h2 className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                Cockpit Display Theme
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Light Mode Preview Card */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`relative rounded-[14px] p-3 text-left transition-all cursor-pointer border-2 ${
                  theme === 'light'
                    ? 'border-[#0066FF] shadow-[0_0_20px_-6px_rgba(0,102,255,0.55)] bg-[#F4F7FB]'
                    : 'border-[#D5E2F2] dark:border-[#104878] bg-[#EEF3FA] opacity-80 hover:opacity-100'
                }`}
              >
                <div className="rounded-[10px] bg-white border border-[#D5E2F2] p-2.5 space-y-1.5 mb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-12 rounded-full bg-[#0066FF]" />
                    <Sun size={12} className="text-[#FFB800]" />
                  </div>
                  <div className="h-2.5 w-4/5 rounded bg-[#0B1D36]/80" />
                  <div className="h-2 w-3/5 rounded bg-[#647D9E]/45" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold uppercase text-[#0B1D36]">
                    Light Mode
                  </span>
                  {theme === 'light' && (
                    <span className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>

              {/* Dark Mode Preview Card */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`relative rounded-[14px] p-3 text-left transition-all cursor-pointer border-2 ${
                  theme === 'dark'
                    ? 'border-[#008DFF] shadow-[0_0_24px_-6px_rgba(0,200,255,0.55)] bg-[#020D1F]'
                    : 'border-[#D5E2F2] dark:border-[#104878] bg-[#04152B] opacity-85 hover:opacity-100'
                }`}
              >
                <div className="rounded-[10px] bg-[#061C35] border border-[#104878] p-2.5 space-y-1.5 mb-2.5">
                  <div className="flex items-center justify-between">
                    <span className="h-2 w-12 rounded-full bg-[#00C8FF]" />
                    <Moon size={12} className="text-[#00C8FF]" />
                  </div>
                  <div className="h-2.5 w-4/5 rounded bg-[#F1F5FF]/90" />
                  <div className="h-2 w-3/5 rounded bg-[#A5B8D5]/40" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-heading text-sm font-bold uppercase text-[#F1F5FF]">
                    Dark Mode
                  </span>
                  {theme === 'dark' && (
                    <span className="w-5 h-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </section>

          {/* TEXT SIZE SCALING */}
          <section className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] dark:text-[#00C8FF]">
                  ACCESSIBILITY
                </p>
                <h2 className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                  Text Size
                </h2>
              </div>
              <Type size={18} className="text-[#0066FF] dark:text-[#00C8FF]" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TEXT_SIZE_OPTIONS.map((opt) => {
                const active = Math.abs(textScale - opt.scale) < 0.01;
                return (
                  <button
                    key={opt.pct}
                    type="button"
                    onClick={() => setTextScale(opt.scale)}
                    className={`min-h-[54px] px-3 py-2 rounded-[12px] border text-left transition-all cursor-pointer ${
                      active
                        ? 'bg-[#0066FF]/15 border-[#008DFF] text-[var(--text-primary)] shadow-[0_0_18px_-6px_rgba(0,141,255,0.55)]'
                        : 'cockpit-surface-elevated text-[var(--text-secondary)] hover:border-[#008DFF]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {active && <Check size={13} className="text-[#0066FF] dark:text-[#00C8FF]" />}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-muted)] ov-tabular">
                      {opt.pct}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Live Preview */}
            <div className="cockpit-surface-elevated rounded-[14px] p-3.5 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Live Preview ({Math.round(textScale * 100)}%)
              </p>
              <p
                style={{ fontSize: `${1.05 * textScale}rem` }}
                className="font-heading font-bold uppercase tracking-wide text-[var(--text-primary)] leading-tight"
              >
                Lulu Hypermarket
              </p>
              <p
                style={{ fontSize: `${0.82 * textScale}rem` }}
                className="text-[var(--text-secondary)]"
              >
                Al Wakra Main · Visit scheduled
              </p>
            </div>
          </section>

          {/* COMPACT ACCOUNT CARD */}
          <section className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <User size={16} className="text-[#0066FF] dark:text-[#00C8FF]" />
              <h2 className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                Account
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="cockpit-surface-elevated rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Executive Name
                </p>
                <p className="text-xs font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                  {executive.name}
                </p>
              </div>
              <div className="cockpit-surface-elevated rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Username
                </p>
                <p className="text-xs font-mono font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                  @{executive.username} ({executive.repId})
                </p>
              </div>
              <div className="cockpit-surface-elevated rounded-[12px] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Assigned Role
                </p>
                <p className="text-xs font-semibold text-[#0066FF] dark:text-[#00C8FF] mt-0.5 truncate">
                  {executive.role}
                </p>
              </div>
            </div>
          </section>

          {/* DISCREET SIGN OUT */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => setConfirmSignOutOpen(true)}
              className="min-h-[44px] px-5 rounded-[14px] cockpit-surface-elevated border-rose-500/30 hover:border-rose-500/70 text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* SIGN OUT CONFIRMATION DIALOG */}
      {confirmSignOutOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm cockpit-panel rounded-[18px] p-5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-500">
                SESSION CONFIRMATION
              </p>
              <h3 className="font-heading text-xl font-bold uppercase text-[var(--text-primary)]">
                Sign Out of Marviz AI?
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Saved PJP routes, cached planograms, and synced requests remain preserved for your next login.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmSignOutOpen(false)}
                className="min-h-[44px] rounded-[12px] cockpit-surface-elevated text-xs font-bold text-[var(--text-primary)] cursor-pointer"
              >
                Stay Signed In
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmSignOutOpen(false);
                  onLogout();
                }}
                className="min-h-[44px] rounded-[12px] bg-[#EF4444] hover:bg-rose-600 text-xs font-bold text-white cursor-pointer"
              >
                Confirm Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
