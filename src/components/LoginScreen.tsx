import React, { useState } from 'react';
import { Lock, User, Delete, CheckCircle, Sun, Moon, Leaf, ChevronDown } from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../ThemeContext';
import { EXECUTIVE_PROFILES } from '../constants';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { isDark, toggleTheme } = useTheme();
  const [selectedExecutiveUsername, setSelectedExecutiveUsername] = useState<string>(
    EXECUTIVE_PROFILES[0].username
  );
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeExecutive = EXECUTIVE_PROFILES.find((p) => p.username === selectedExecutiveUsername) || EXECUTIVE_PROFILES[0];

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
    if (pinStr !== '2026') {
      setError('Invalid PIN. All executives use PIN 2026');
      return;
    }
    const exec = EXECUTIVE_PROFILES.find((p) => p.username === userStr) || EXECUTIVE_PROFILES[0];
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
    setPin('2026');
    attemptLogin(selectedExecutiveUsername, '2026');
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-4 max-w-sm mx-auto w-full h-full overflow-hidden select-none relative">
      {/* Top Bar with Theme Toggle */}
      <div className="w-full flex justify-between items-center pt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <Leaf size={14} className={isDark ? 'text-[#10B981]' : 'text-[#047857]'} />
          <span className={`text-[10px] font-black tracking-widest uppercase ${isDark ? 'text-[#10B981]' : 'text-[#047857]'}`}>
            QFI Enterprise
          </span>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
            isDark
              ? 'bg-[#132219] border-emerald-900/60 text-emerald-300 hover:text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-950 shadow-xs'
          }`}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-[#047857]" />}
          <span className="text-[10px] uppercase font-bold tracking-wider">
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>
      </div>

      {/* Top Branding Section (Qatar Food Industries) */}
      <div className="flex flex-col items-center">
        <div className="relative mb-2.5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#047857] via-[#065F46] to-[#10B981] flex flex-col items-center justify-center shadow-xl shadow-emerald-950/40 border border-emerald-400/30">
            <span className="text-white text-base font-black tracking-wider leading-none">QFI</span>
            <span className="text-[8px] font-bold text-emerald-200 uppercase tracking-widest mt-0.5">Qatar</span>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-emerald-400 text-[8px] font-black text-slate-950 px-1.5 py-0.5 rounded-full border border-slate-950 shadow-sm">
            MT v1.0
          </div>
        </div>

        <h1 className={`text-base font-black tracking-tight ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
          Qatar Food Industries
        </h1>
        <p className={`text-[11px] text-center mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Modern Trade In-Store Audit &bull; AI Shelf Verification
        </p>

        {/* Executive Name Dropdown Field */}
        <div
          className={`w-full mt-3.5 backdrop-blur-xl border rounded-2xl p-2.5 flex items-center gap-2.5 transition-colors ${
            isDark
              ? 'bg-[#132219]/70 border-emerald-900/50'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}
        >
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-emerald-950/80 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            <User size={15} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span
                className={`text-[9px] uppercase font-bold tracking-wider block leading-tight ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              >
                Executive Name
              </span>
              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-md ${
                isDark ? 'bg-emerald-950 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {activeExecutive.repId}
              </span>
            </div>
            <div className="relative mt-0.5 flex items-center">
              <select
                value={selectedExecutiveUsername}
                onChange={(e) => setSelectedExecutiveUsername(e.target.value)}
                className={`w-full appearance-none bg-transparent text-xs font-bold pr-5 focus:outline-none cursor-pointer ${
                  isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
                }`}
              >
                {EXECUTIVE_PROFILES.map((exec) => (
                  <option
                    key={exec.username}
                    value={exec.username}
                    className={isDark ? 'bg-[#132219] text-[#F0FDF4]' : 'bg-white text-[#061A12]'}
                  >
                    {exec.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className={`absolute right-0 pointer-events-none ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Middle: PIN Dots & Feedback */}
      <div className="my-auto py-2 flex flex-col items-center">
        <div
          className={`flex items-center gap-1.5 text-xs mb-2.5 font-semibold ${
            isDark ? 'text-slate-300' : 'text-[#061A12]'
          }`}
        >
          <Lock size={13} className={isDark ? 'text-[#10B981]' : 'text-[#047857]'} />
          <span>Enter 4-Digit Security PIN</span>
        </div>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-4 mb-1.5">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  isFilled
                    ? isDark
                      ? 'bg-[#22C55E] shadow-md shadow-emerald-500/50 scale-110'
                      : 'bg-[#047857] shadow-md shadow-emerald-950/30 scale-110'
                    : isDark
                    ? 'bg-[#182C21] border border-emerald-900/60'
                    : 'bg-slate-200 border border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-[11px] font-semibold text-rose-500 tracking-wide mt-1">{error}</p>
        )}
      </div>

      {/* Bottom: Tactile Numeric Keypad */}
      <div className="pb-2">
        <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className={`h-12 rounded-2xl border text-base font-bold transition-all flex items-center justify-center shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-[#132219]/90 hover:bg-[#182C21] border-emerald-900/50 text-[#F0FDF4]'
                  : 'bg-white hover:bg-emerald-50/50 border-emerald-950/10 text-[#061A12] shadow-xs'
              }`}
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleQuickDemo}
            className={`h-12 rounded-2xl border text-[10px] font-bold transition-all flex items-center justify-center text-center leading-tight px-1 active:scale-95 ${
              isDark
                ? 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-700/50 text-emerald-300'
                : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-800'
            }`}
            title="Auto-fill Demo PIN"
          >
            Demo (2026)
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className={`h-12 rounded-2xl border text-base font-bold transition-all flex items-center justify-center shadow-xs active:scale-95 ${
              isDark
                ? 'bg-[#132219]/90 hover:bg-[#182C21] border-emerald-900/50 text-[#F0FDF4]'
                : 'bg-white hover:bg-emerald-50/50 border-emerald-950/10 text-[#061A12] shadow-xs'
            }`}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`h-12 rounded-2xl border transition-all flex items-center justify-center active:scale-95 ${
              isDark
                ? 'bg-[#132219]/90 hover:bg-[#182C21] border-emerald-900/50 text-slate-400 hover:text-rose-400'
                : 'bg-white hover:bg-emerald-50/50 border-emerald-950/10 text-slate-500 hover:text-rose-600 shadow-xs'
            }`}
            aria-label="Delete last digit"
          >
            <Delete size={18} />
          </button>
        </div>

        <button
          onClick={() => attemptLogin(selectedExecutiveUsername, pin)}
          disabled={pin.length !== 4}
          className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
            pin.length === 4
              ? 'bg-gradient-to-r from-[#047857] via-[#065F46] to-[#10B981] text-white shadow-lg shadow-emerald-950/30 hover:brightness-105 active:scale-[0.99] border border-emerald-400/30'
              : isDark
              ? 'bg-[#132219] border border-emerald-950 text-slate-500 cursor-not-allowed'
              : 'bg-slate-200 border border-slate-300 text-slate-400 cursor-not-allowed'
          }`}
        >
          <CheckCircle size={15} />
          Sign In &amp; Start PJP Route
        </button>
      </div>
    </div>
  );
};
