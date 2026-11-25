import React from 'react';
import {
  LayoutGrid,
  Map as MapIcon,
  Plus,
  CalendarCheck,
  Inbox,
  Sun,
  Moon,
  LogOut
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

  const itemClass = (isActive: boolean) =>
    `min-h-[48px] w-full flex items-center justify-center rounded-xl transition-colors cursor-pointer active:scale-95 ${
      isActive
        ? isDark
          ? 'text-[#34D399]'
          : 'text-[#084C41]'
        : isDark
        ? 'text-[#8FA39C] hover:text-[#ECFDF5]'
        : 'text-[#5A6562] hover:text-[#0F1B17]'
    }`;

  return (
    <nav
      aria-label="Primary Mobile Navigation"
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 glass-nav border-t transition-colors ${
        isDark
          ? 'shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.65)]'
          : 'shadow-[0_-8px_28px_-10px_rgba(8,40,32,0.12)]'
      }`}
    >
      <div className="grid grid-cols-5 items-center max-w-lg mx-auto px-2 pt-1.5 pb-[max(0.45rem,env(safe-area-inset-bottom))]">
        {/* 1. GeoIntel */}
        <button
          type="button"
          onClick={() => onSelectTab('map')}
          className={itemClass(activeTab === 'map')}
          aria-label="GeoIntel"
          title="GeoIntel"
          aria-current={activeTab === 'map' ? 'page' : undefined}
        >
          <MapIcon size={22} strokeWidth={activeTab === 'map' ? 2.25 : 1.8} />
        </button>

        {/* 2. Overview */}
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={itemClass(activeTab === 'home')}
          aria-label="Overview"
          title="Overview"
          aria-current={activeTab === 'home' ? 'page' : undefined}
        >
          <LayoutGrid size={22} strokeWidth={activeTab === 'home' ? 2.25 : 1.8} />
        </button>

        {/* 3. Center Elevated "+" (PJP Outlets) */}
        <div className="flex items-center justify-center pb-0.5">
          <button
            type="button"
            onClick={() => onSelectTab('pjp')}
            aria-label="PJP Route Outlets"
            title="PJP Route"
            aria-current={activeTab === 'pjp' ? 'page' : undefined}
            className={`w-[54px] h-[54px] -mt-7 rounded-[18px] flex items-center justify-center transition-all cursor-pointer active:scale-95 ring-4 ${
              isDark
                ? 'bg-[#10B981] text-[#05231C] ring-[#0B110F] shadow-[0_10px_24px_-6px_rgba(16,185,129,0.45)]'
                : 'bg-[#084C41] text-white ring-[#F5F4EF] shadow-[0_10px_24px_-6px_rgba(8,76,65,0.48)]'
            } ${activeTab === 'pjp' ? 'scale-[1.03]' : 'opacity-95 hover:opacity-100'}`}
          >
            <Plus size={25} strokeWidth={2.2} />
          </button>
        </div>

        {/* 4. Today */}
        <button
          type="button"
          onClick={() => onSelectTab('today')}
          className={itemClass(activeTab === 'today')}
          aria-label="Today"
          title="Today"
          aria-current={activeTab === 'today' ? 'page' : undefined}
        >
          <CalendarCheck size={22} strokeWidth={activeTab === 'today' ? 2.25 : 1.8} />
        </button>

        {/* 5. Requests */}
        <button
          type="button"
          onClick={() => onSelectTab('requests')}
          className={itemClass(activeTab === 'requests')}
          aria-label="Requests"
          title="Requests"
          aria-current={activeTab === 'requests' ? 'page' : undefined}
        >
          <div className="relative flex items-center justify-center">
            <Inbox size={22} strokeWidth={activeTab === 'requests' ? 2.25 : 1.8} />
            {requestsCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums shadow-sm ${
                  isDark ? 'bg-[#DC4B36]' : 'bg-[#B83B28]'
                }`}
              >
                {requestsCount > 99 ? '99+' : requestsCount}
              </span>
            )}
          </div>
        </button>
      </div>
    </nav>
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

  const navItems: Array<{
    id: AppTab;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    isPrimary?: boolean;
  }> = [
    {
      id: 'map',
      label: 'GeoIntel',
      icon: <MapIcon size={18} strokeWidth={activeTab === 'map' ? 2.2 : 1.8} />
    },
    {
      id: 'home',
      label: 'Overview',
      icon: <LayoutGrid size={18} strokeWidth={activeTab === 'home' ? 2.2 : 1.8} />
    },
    {
      id: 'pjp',
      label: 'PJP Route',
      subtitle: 'Audit Outlets',
      isPrimary: true,
      icon: <Plus size={18} strokeWidth={2.4} />
    },
    {
      id: 'today',
      label: 'Today',
      subtitle: 'Daily KPI',
      icon: <CalendarCheck size={18} strokeWidth={activeTab === 'today' ? 2.2 : 1.8} />
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: <Inbox size={18} strokeWidth={activeTab === 'requests' ? 2.2 : 1.8} />
    }
  ];

  return (
    <aside
      aria-label="Desktop Navigation Rail"
      className="hidden md:flex md:flex-col md:w-60 lg:w-64 shrink-0 glass-nav border-r z-30 h-full justify-between p-4 select-none"
    >
      <div className="space-y-6">
        {/* Brand Identity */}
        <div className="flex items-center gap-3 px-1.5 pt-1">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-extrabold tracking-wide shadow-md shrink-0 ${
              isDark
                ? 'bg-[#10B981] text-[#05231C] shadow-emerald-950/50'
                : 'bg-[#084C41] text-white shadow-[#084C41]/25'
            }`}
          >
            QFI
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-extrabold tracking-tight truncate text-[var(--text-primary)]">
              MARVIZ AI
            </h1>
            <p className="text-[11px] font-medium truncate text-[var(--text-secondary)]">
              Dev. by SF1
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Workspace Tabs">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            if (item.isPrimary) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                    isActive
                      ? isDark
                        ? 'bg-[#10B981] text-[#05231C] shadow-lg shadow-emerald-950/50'
                        : 'bg-[#084C41] text-white shadow-lg shadow-[#084C41]/25'
                      : isDark
                      ? 'bg-[#10B981]/14 hover:bg-[#10B981]/22 text-[#34D399] border border-emerald-500/25'
                      : 'bg-[#084C41]/8 hover:bg-[#084C41]/14 text-[#084C41] border border-[#084C41]/15'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive
                          ? isDark
                            ? 'bg-[#05231C]/15 text-[#05231C]'
                            : 'bg-white/15 text-white'
                          : isDark
                          ? 'bg-[#10B981] text-[#05231C]'
                          : 'bg-[#084C41] text-white'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-bold block leading-tight whitespace-nowrap">
                        {item.label}
                      </span>
                      {item.subtitle && (
                        <span
                          className={`text-[10px] block leading-tight opacity-80 whitespace-nowrap`}
                        >
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full min-h-[44px] px-3.5 py-2 rounded-2xl flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] ${
                  isActive
                    ? isDark
                      ? 'bg-white/10 text-[#ECFDF5] border border-emerald-500/25 shadow-xs'
                      : 'bg-white/90 text-[#084C41] border border-[#084C41]/15 shadow-xs'
                    : isDark
                    ? 'text-[#9CAEA8] hover:text-[#ECFDF5] hover:bg-white/5 border border-transparent'
                    : 'text-[#52635D] hover:text-[#0F1B17] hover:bg-white/55 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={isActive ? (isDark ? 'text-[#34D399]' : 'text-[#084C41]') : ''}>
                    {item.icon}
                  </span>
                  <div className="text-left min-w-0">
                    <span
                      className={`text-xs block leading-tight whitespace-nowrap ${
                        isActive ? 'font-bold' : 'font-semibold'
                      }`}
                    >
                      {item.label}
                    </span>
                    {item.subtitle && (
                      <span className="text-[10px] text-[var(--text-muted)] block leading-tight whitespace-nowrap">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </div>
                {item.id === 'requests' && requestsCount > 0 && (
                  <span
                    className={`min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center tabular-nums ${
                      isDark ? 'bg-[#DC4B36]' : 'bg-[#B83B28]'
                    }`}
                  >
                    {requestsCount > 99 ? '99+' : requestsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Executive Identity & Controls */}
      <div className="space-y-2.5 pt-4 border-t border-[var(--border-glass)]">
        <div className="glass-subtle rounded-2xl p-3 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold truncate text-[var(--text-primary)]">
              {executive.name}
            </span>
            <span className="text-[11px] font-mono tabular-nums font-semibold text-[var(--accent-primary)] shrink-0">
              {executive.repId}
            </span>
          </div>
          <p className="text-[11px] truncate text-[var(--text-secondary)]">
            {executive.territory}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="min-h-[40px] px-2.5 rounded-xl glass-subtle hover:bg-white/80 dark:hover:bg-white/10 text-xs font-semibold text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <>
                <Sun size={14} className="text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon size={14} className="text-[#084C41]" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="min-h-[40px] px-2.5 rounded-xl glass-subtle hover:border-rose-500/35 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut size={14} />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
