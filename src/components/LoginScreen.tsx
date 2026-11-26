import React, { useEffect, useState } from 'react';
import { Lock, User, Delete, CheckCircle, Sun, Moon, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../ThemeContext';
import {
  fetchLivePjpData,
  getCachedExecutives,
  SyncedExecutiveProfile
} from '../services/pjpService';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { isDark, toggleTheme } = useTheme();
  const [executives, setExecutives] = useState<SyncedExecutiveProfile[]>(() =>
    getCachedExecutives()
  );
  const [selectedExecutiveUsername, setSelectedExecutiveUsername] = useState<string>(
    () => getCachedExecutives()[0]?.username || 'safwan_asif'
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchLivePjpData(false)
      .then((dataset) => {
        if (!active) return;
        const liveExecs = getCachedExecutives(dataset);
        if (liveExecs.length > 0) {
          setExecutives(liveExecs);
          setSelectedExecutiveUsername((prev) =>
            liveExecs.some((e) => e.username === prev) ? prev : liveExecs[0].username
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const activeExecutive =
    executives.find((p) => p.username === selectedExecutiveUsername) || executives[0];

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setError(null);
      if (nextPin.length === 4) {
        attemptLogin(selectedExecutiveUsername, nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const attemptLogin = (userStr: string, pinStr: string) => {
    if (pinStr.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }
    const exec = executives.find((p) => p.username === userStr) || executives[0];
    const expectedPin = String(exec?.pin || '2026').trim();
    if (pinStr !== expectedPin) {
      setError(`Invalid PIN for ${exec?.name || 'Executive'}`);
      return;
    }
    const profile: UserProfile = {
      name: exec.name,
      username: exec.username,
      role: exec.role,
      territory: exec.territory,
      repId: exec.repId
    };
    onLogin(profile);
  };

  const handleQuickDemo = () => {
    const demoPin = String(activeExecutive?.pin || '2026').trim();
    setPin(demoPin);
    attemptLogin(selectedExecutiveUsername, demoPin);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto flex flex-col justify-between md:justify-center p-4 md:p-8 select-none">
      <div className="w-full max-w-sm md:max-w-3xl mx-auto flex flex-col gap-4 md:gap-5 my-auto">
        {/* Top Bar with Brand Tag & Theme Toggle */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isDark ? 'bg-[#00C8FF]' : 'bg-[#0066FF]'
              }`}
            />
            <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--accent-cyan)]">
              Qatar Food Industries
            </span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[40px] px-3 rounded-xl glass-subtle hover:bg-white/80 dark:hover:bg-[#0B2542] transition-all flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] cursor-pointer active:scale-95"
            title={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
            aria-label={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
          >
            {isDark ? (
              <Sun size={14} className="text-[#FFB800]" />
            ) : (
              <Moon size={14} className="text-[#0066FF]" />
            )}
            <span className="text-[11px] font-semibold">
              {isDark ? 'Light' : 'Dark'}
            </span>
          </button>
        </div>

        {/* Main Frosted Glass Login Surface */}
        <div className="glass-panel-strong rounded-3xl p-5 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 items-center">
          {/* Left Column: Brand & Executive Selector */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shrink-0 ${
                  isDark
                    ? 'btn-electric-blue'
                    : 'bg-[#0066FF] text-white shadow-[#0066FF]/25'
                }`}
              >
                <span className="text-sm font-extrabold tracking-wider leading-none">
                  QFI
                </span>
                <span className="text-[8px] font-bold uppercase tracking-widest opacity-85 mt-0.5">
                  MT v1
                </span>
              </div>
              <div>
                <h1 className="font-heading italic text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  MARVIZ AI
                </h1>
                <p className="text-xs text-[var(--text-secondary)]">
                  Modern Trade Sales Channel
                </p>
              </div>
            </div>

            {/* Executive Name Selector */}
            <div className="w-full glass-subtle rounded-2xl p-3 flex items-center gap-3">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  isDark
                    ? 'bg-[#0066FF]/20 text-[#00C8FF] border border-[#008DFF]/30'
                    : 'bg-[#0066FF]/10 text-[#0066FF]'
                }`}
              >
                <User size={16} />
              </div>

              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-cyan)]">
                    Executive
                  </span>
                  <span className="text-[10px] font-mono tabular-nums font-bold text-[var(--text-secondary)]">
                    {activeExecutive.repId}
                  </span>
                </div>

                <div className="relative mt-0.5 flex items-center">
                  <select
                    value={selectedExecutiveUsername}
                    onChange={(e) => {
                      setSelectedExecutiveUsername(e.target.value);
                      setError(null);
                    }}
                    aria-label="Executive Name"
                    className="w-full appearance-none bg-transparent text-sm font-bold pr-6 focus:outline-none cursor-pointer text-[var(--text-primary)]"
                  >
                    {executives.map((exec) => (
                      <option
                        key={exec.username}
                        value={exec.username}
                        className={
                          isDark
                            ? 'bg-[#061C35] text-[#F1F5FF]'
                            : 'bg-white text-[#0B1D36]'
                        }
                      >
                        {exec.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-0 pointer-events-none text-[var(--accent-cyan)]"
                  />
                </div>
              </div>
            </div>

            <p className="hidden md:block text-xs text-[var(--text-secondary)] leading-relaxed">
              Sign in with your 4-digit executive PIN to launch today&apos;s Modern Trade PJP
              route and shelf verification tools.
            </p>
          </div>

          {/* Right Column: PIN Dots, Keypad & Sign In CTA */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                <Lock size={13} className="text-[var(--accent-cyan)]" />
                <span>Enter 4-Digit Security PIN</span>
              </div>

              {/* 4 PIN Dots */}
              <div className="flex items-center gap-4 pt-1">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        isFilled
                          ? isDark
                            ? 'bg-[#00C8FF] scale-110 shadow-[0_0_12px_rgba(0,200,255,0.65)]'
                            : 'bg-[#0066FF] scale-110 shadow-sm'
                          : isDark
                          ? 'bg-[#0B2542] border border-[#104878]'
                          : 'bg-[#0066FF]/10 border border-[#0066FF]/25'
                      }`}
                    />
                  );
                })}
              </div>

              {error && (
                <p className="text-xs font-semibold text-[#EF4444] tracking-wide pt-0.5">
                  {error}
                </p>
              )}
            </div>

            {/* Tactile Frosted Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[276px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-2xl glass-subtle hover:bg-white/85 dark:hover:bg-[#0B2542] text-base font-bold tabular-nums text-[var(--text-primary)] transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleQuickDemo}
                className={`h-12 rounded-2xl text-[11px] font-bold transition-all flex items-center justify-center text-center leading-tight px-1 active:scale-95 cursor-pointer border ${
                  isDark
                    ? 'bg-[#0066FF]/20 hover:bg-[#0066FF]/30 border-[#008DFF]/50 text-[#00C8FF]'
                    : 'bg-[#0066FF]/10 hover:bg-[#0066FF]/15 border-[#0066FF]/25 text-[#0066FF]'
                }`}
                title="Auto-fill Executive Demo PIN"
              >
                Demo ({activeExecutive?.pin || '2026'})
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-2xl glass-subtle hover:bg-white/85 dark:hover:bg-[#0B2542] text-base font-bold tabular-nums text-[var(--text-primary)] transition-all flex items-center justify-center active:scale-95 cursor-pointer"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="h-12 rounded-2xl glass-subtle hover:bg-white/85 dark:hover:bg-[#0B2542] text-[var(--text-secondary)] hover:text-[#EF4444] transition-all flex items-center justify-center active:scale-95 cursor-pointer"
                aria-label="Delete last digit"
              >
                <Delete size={18} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => attemptLogin(selectedExecutiveUsername, pin)}
              disabled={pin.length !== 4}
              className={`w-full max-w-[276px] min-h-[48px] py-3 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 ${
                pin.length === 4
                  ? isDark
                    ? 'btn-electric-blue active:scale-[0.99] cursor-pointer'
                    : 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25 hover:brightness-110 active:scale-[0.99] cursor-pointer'
                  : 'glass-subtle text-[var(--text-muted)] cursor-not-allowed opacity-70'
              }`}
            >
              <CheckCircle size={15} />
              <span className="whitespace-nowrap">Sign In &amp; Start Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
