import React, { useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'motion/react';
import {
  LayoutGrid,
  Map as MapIcon,
  Route as RouteIcon,
  CalendarCheck,
  Inbox,
  Sun,
  Moon,
  LogOut,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import { useTheme } from '../ThemeContext';

export type AppTab = 'home' | 'map' | 'pjp' | 'today' | 'requests';

interface NavigationProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  requestsCount?: number;
}

interface DesktopSidebarProps extends NavigationProps {
  executive: UserProfile;
  onLogout: () => void;
}

export const MobileBottomNav: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  requestsCount = 0
}) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  const tabs: Array<{
    id: AppTab;
    label: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  }> = [
    { id: 'map', label: 'GeoIntel', icon: MapIcon },
    { id: 'home', label: 'Overview', icon: LayoutGrid },
    { id: 'pjp', label: 'PJP Route', icon: RouteIcon },
    { id: 'today', label: 'Today', icon: CalendarCheck },
    { id: 'requests', label: 'Requests', icon: Inbox }
  ];

  const capsuleSpring = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 460, damping: 32, mass: 0.75 };

  const iconSpring = shouldReduceMotion
    ? { duration: 0 }
    : { type: 'spring' as const, stiffness: 540, damping: 22, mass: 0.55 };

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-40 pointer-events-none px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <motion.nav
        initial={shouldReduceMotion ? false : { y: 18, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={capsuleSpring}
        aria-label="Primary Mobile Navigation"
        className="mobile-bottom-nav-container pointer-events-auto relative w-fit mx-auto rounded-full glass-capsule-dock px-2 py-1.5"
      >
        {/* Subtle futuristic top specular edge highlight */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute top-0 inset-x-7 h-[1.5px] rounded-full ${
            isDark
              ? 'bg-gradient-to-r from-transparent via-[#00C8FF]/60 to-transparent'
              : 'bg-gradient-to-r from-transparent via-[#0066FF]/30 to-transparent'
          }`}
        />

        <LayoutGroup id="mobile-bottom-nav">
          <div className="grid grid-cols-5 gap-1.5 items-center">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  onClick={() => onSelectTab(tab.id)}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.88 }}
                  transition={iconSpring}
                  aria-label={tab.label}
                  title={tab.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative w-11 h-11 flex items-center justify-center rounded-full transition-colors cursor-pointer ${
                    isActive
                      ? isDark
                        ? 'text-[#00D2FF]'
                        : 'text-white'
                      : isDark
                      ? 'text-[#92A9CA] hover:text-[#F1F5FF]'
                      : 'text-[#647D9E] hover:text-[#0B1D36]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobile-dock-active-pill"
                      transition={capsuleSpring}
                      className={`absolute inset-0 rounded-full ${
                        isDark
                          ? 'bg-gradient-to-br from-[#00B7FF]/30 via-[#007AFF]/24 to-[#0054E9]/32 border border-[#00C8FF]/70 shadow-[0_0_22px_-3px_rgba(0,183,255,0.72),inset_0_1px_0_rgba(255,255,255,0.22)]'
                          : 'btn-electric-blue'
                      }`}
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={
                      shouldReduceMotion
                        ? { scale: 1, y: 0 }
                        : {
                            scale: isActive ? 1.12 : 1,
                            y: isActive ? -1 : 0
                          }
                    }
                    transition={iconSpring}
                    className="relative z-10 flex items-center justify-center"
                  >
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.3 : 1.85}
                      className={
                        isActive && isDark
                          ? 'drop-shadow-[0_0_8px_rgba(0,200,255,0.85)]'
                          : ''
                      }
                    />
                    {tab.id === 'requests' && requestsCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center tabular-nums shadow-sm bg-[#EF4444]">
                        {requestsCount > 99 ? '99+' : requestsCount}
                      </span>
                    )}
                  </motion.div>
                  {isActive && (
                    <motion.span
                      layoutId="mobile-dock-active-beacon"
                      transition={capsuleSpring}
                      aria-hidden="true"
                      className={`absolute bottom-1 w-3.5 h-[2px] rounded-full z-10 ${
                        isDark
                          ? 'bg-[#00D2FF] shadow-[0_0_8px_#00D2FF]'
                          : 'bg-white/90'
                      }`}
                    />
                  )}
                  <span className="sr-only">{tab.label}</span>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </motion.nav>
    </div>
  );
};

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  activeTab,
  onSelectTab,
  requestsCount = 0,
  executive,
  onLogout
}) => {
  const { isDark, toggleTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => !prev);
  };

  const initials = executive.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'SA';

  const navItems: Array<{
    id: AppTab;
    label: string;
    subtitle?: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    isPrimary?: boolean;
  }> = [
    { id: 'map', label: 'GeoIntel', icon: MapIcon },
    { id: 'home', label: 'Overview', icon: LayoutGrid },
    {
      id: 'pjp',
      label: 'PJP Route',
      subtitle: 'Audit Outlets',
      isPrimary: true,
      icon: RouteIcon
    },
    {
      id: 'today',
      label: 'Today',
      subtitle: 'Daily KPI',
      icon: CalendarCheck
    },
    { id: 'requests', label: 'Requests', icon: Inbox }
  ];

  return (
    <aside
      aria-label="Desktop Navigation Rail"
      className={`hidden md:flex md:flex-col shrink-0 z-30 select-none relative my-3 ml-3 h-[calc(100%-1.5rem)] rounded-[28px] backdrop-blur-2xl transition-[width,padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] justify-between ${
        isCollapsed ? 'w-[68px] py-3.5 px-2' : 'w-56 lg:w-60 py-4 px-3.5'
      } ${
        isDark
          ? 'bg-[rgba(6,24,49,0.72)] border border-[#00C8FF]/22 shadow-[0_20px_50px_-14px_rgba(0,8,24,0.92),0_0_26px_-10px_rgba(0,141,255,0.34),inset_0_1px_0_rgba(0,200,255,0.22)]'
          : 'bg-white/78 border border-[#0066FF]/18 shadow-[0_18px_42px_-12px_rgba(2,13,31,0.14),inset_0_1px_0_rgba(255,255,255,0.95)]'
      }`}
    >
      {/* Subtle futuristic edge specular accent */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-y-6 left-0 w-[1.5px] rounded-full ${
          isDark
            ? 'bg-gradient-to-b from-transparent via-[#00C8FF]/55 to-transparent'
            : 'bg-gradient-to-b from-transparent via-[#0066FF]/35 to-transparent'
        }`}
      />

      {/* Top Brand Logo (Acts as Collapse/Expand Toggle) */}
      <div className="flex flex-col gap-4">
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center' : 'justify-start gap-2.5 px-1'
          }`}
        >
          <button
            type="button"
            onClick={handleToggleCollapse}
            aria-label={isCollapsed ? 'Expand navigation strip' : 'Collapse navigation strip'}
            aria-expanded={!isCollapsed}
            title={isCollapsed ? 'Expand navigation' : 'Collapse to glass strip'}
            className={`group relative w-11 h-11 rounded-2xl flex items-center justify-center text-[11px] font-extrabold tracking-wider shrink-0 transition-all cursor-pointer active:scale-95 ${
              isDark
                ? 'btn-electric-blue ring-1 ring-[#00C8FF]/45 shadow-[0_0_20px_-2px_rgba(0,183,255,0.6)] hover:ring-[#00C8FF]/80'
                : 'btn-electric-blue shadow-[0_8px_20px_-4px_rgba(0,102,255,0.45)]'
            }`}
          >
            <span className="-translate-x-0.5 -translate-y-0.5 leading-none">QFI</span>
            <span
              aria-hidden="true"
              className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-[#020D1F]/40 border border-white/30 flex items-center justify-center text-white/95 transition-transform duration-200 group-hover:scale-110 group-hover:bg-[#020D1F]/60"
            >
              {isCollapsed ? (
                <ChevronRight size={9} strokeWidth={2.8} />
              ) : (
                <ChevronLeft size={9} strokeWidth={2.8} />
              )}
            </span>

            {isCollapsed && (
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#04152B]/92 text-[#F1F5FF] border border-[#00C8FF]/35 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 text-[#0B1D36] border border-[#0066FF]/20 shadow-lg'
                }`}
              >
                MARVIZ AI · Expand
              </span>
            )}
          </button>

          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold tracking-tight truncate text-[var(--text-primary)]">
                MARVIZ AI
              </h1>
              <p className="text-[10px] font-medium truncate text-[var(--text-secondary)]">
                Dev. by SF1
              </p>
            </div>
          )}
        </div>

        {/* Center Navigation Icons */}
        <nav
          className={`flex flex-col ${isCollapsed ? 'items-center gap-2' : 'gap-1.5'}`}
          aria-label="Workspace Tabs"
        >
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`group relative flex items-center transition-all cursor-pointer active:scale-95 ${
                  isCollapsed
                    ? 'w-11 h-11 rounded-2xl justify-center'
                    : 'w-full min-h-[44px] px-3 py-2 rounded-2xl justify-between'
                } ${
                  isActive
                    ? isDark
                      ? 'text-[#00D2FF]'
                      : 'text-white'
                    : isDark
                    ? 'text-[#92A9CA] hover:text-[#F1F5FF] hover:bg-white/[0.06]'
                    : 'text-[#475E7D] hover:text-[#0B1D36] hover:bg-[#0066FF]/[0.06]'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="desktop-rail-active-pill"
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: 'spring', stiffness: 420, damping: 32 }
                    }
                    className={`absolute inset-0 rounded-2xl ${
                      isDark
                        ? 'bg-gradient-to-br from-[#008DFF]/30 via-[#0066FF]/22 to-[#00C8FF]/15 border border-[#00C8FF]/65 shadow-[0_0_22px_-4px_rgba(0,183,255,0.65),inset_0_1px_0_rgba(255,255,255,0.2)]'
                        : 'btn-electric-blue'
                    }`}
                  />
                )}

                {/* Active left neon beacon bar */}
                {isActive && isCollapsed && (
                  <span
                    aria-hidden="true"
                    className={`absolute -left-2 w-[3px] h-5 rounded-full ${
                      isDark
                        ? 'bg-[#00D2FF] shadow-[0_0_10px_#00D2FF]'
                        : 'bg-[#0066FF] shadow-[0_0_8px_rgba(0,102,255,0.65)]'
                    }`}
                  />
                )}

                <div
                  className={`relative z-10 flex items-center ${
                    isCollapsed ? 'justify-center' : 'gap-3 min-w-0'
                  }`}
                >
                  <Icon
                    size={isCollapsed ? 20 : 18}
                    strokeWidth={isActive ? 2.3 : 1.85}
                    className={
                      isActive && isDark
                        ? 'drop-shadow-[0_0_8px_rgba(0,200,255,0.75)]'
                        : ''
                    }
                  />
                  {!isCollapsed && (
                    <div className="text-left min-w-0">
                      <span
                        className={`text-xs block leading-tight whitespace-nowrap ${
                          isActive ? 'font-bold' : 'font-semibold'
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.subtitle && (
                        <span className="text-[10px] opacity-75 block leading-tight whitespace-nowrap">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {item.id === 'requests' && requestsCount > 0 && (
                  <span
                    className={
                      isCollapsed
                        ? 'absolute -top-1 -right-1 z-20 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center tabular-nums bg-[#EF4444] shadow-sm'
                        : 'relative z-10 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums bg-[#EF4444]'
                    }
                  >
                    {requestsCount > 99 ? '99+' : requestsCount}
                  </span>
                )}

                {/* Futuristic Floating Tooltip in Collapsed Strip Mode */}
                {isCollapsed && (
                  <span
                    role="tooltip"
                    className={`pointer-events-none absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-xl text-[11px] font-bold tracking-wide whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 backdrop-blur-xl ${
                      isDark
                        ? 'bg-[#04152B]/92 text-[#F1F5FF] border border-[#00C8FF]/35 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.85)]'
                        : 'bg-white/95 text-[#0B1D36] border border-[#0066FF]/20 shadow-lg'
                    }`}
                  >
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Executive Avatar & Controls */}
      <div
        className={`flex flex-col pt-3 border-t ${
          isDark ? 'border-[#00C8FF]/15' : 'border-[#0066FF]/12'
        } ${isCollapsed ? 'items-center gap-2' : 'gap-2.5'}`}
      >
        {isCollapsed ? (
          <>
            <div
              className={`group relative w-10 h-10 rounded-2xl flex items-center justify-center text-[11px] font-extrabold tracking-wide cursor-default ${
                isDark
                  ? 'bg-[#0B2542]/80 border border-[#00C8FF]/30 text-[#00C8FF] shadow-[inset_0_1px_0_rgba(0,200,255,0.2)]'
                  : 'bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF]'
              }`}
            >
              {initials}
              <div
                role="tooltip"
                className={`pointer-events-none absolute left-[calc(100%+12px)] bottom-0 px-3 py-2 rounded-xl text-left whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#04152B]/92 text-[#F1F5FF] border border-[#00C8FF]/35 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 text-[#0B1D36] border border-[#0066FF]/20 shadow-lg'
                }`}
              >
                <p className="text-xs font-bold leading-tight">{executive.name}</p>
                <p className="text-[10px] opacity-75 font-mono">
                  {executive.repId} · {executive.territory}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`group relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-[#FFB800]'
                  : 'bg-[#0066FF]/[0.05] hover:bg-[#0066FF]/[0.12] border border-[#0066FF]/15 text-[#0066FF]'
              }`}
              title={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#04152B]/92 text-[#F1F5FF] border border-[#00C8FF]/35 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 text-[#0B1D36] border border-[#0066FF]/20 shadow-lg'
                }`}
              >
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className={`group relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isDark
                  ? 'bg-white/[0.04] hover:bg-rose-500/15 border border-white/[0.08] hover:border-rose-400/40 text-[#92A9CA] hover:text-rose-400'
                  : 'bg-black/[0.03] hover:bg-rose-500/10 border border-black/[0.08] hover:border-rose-500/35 text-[#475E7D] hover:text-rose-600'
              }`}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={16} />
              <span
                role="tooltip"
                className={`pointer-events-none absolute left-[calc(100%+12px)] px-2.5 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-150 z-50 backdrop-blur-xl ${
                  isDark
                    ? 'bg-[#04152B]/92 text-[#F1F5FF] border border-[#00C8FF]/35 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.85)]'
                    : 'bg-white/95 text-[#0B1D36] border border-[#0066FF]/20 shadow-lg'
                }`}
              >
                Sign Out
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="glass-subtle rounded-2xl p-2.5 space-y-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold truncate text-[var(--text-primary)]">
                  {executive.name}
                </span>
                <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--accent-primary)] shrink-0">
                  {executive.repId}
                </span>
              </div>
              <p className="text-[10px] truncate text-[var(--text-secondary)]">
                {executive.territory}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[38px] px-2.5 rounded-xl glass-subtle hover:bg-white/80 dark:hover:bg-white/10 text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
                aria-label="Toggle Theme"
              >
                {isDark ? (
                  <>
                    <Sun size={14} className="text-[#FFB800]" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon size={14} className="text-[#0066FF]" />
                    <span>Dark</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                className="min-h-[38px] px-2.5 rounded-xl glass-subtle hover:border-rose-500/35 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={14} />
                <span>Exit</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
