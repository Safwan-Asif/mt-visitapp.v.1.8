import React from 'react';
import { Map as MapIcon, BarChart3, Activity, Settings } from 'lucide-react';

export type MapMobileTabId = 'map' | 'analytics' | 'activity' | 'settings';

interface MobileBottomNavigationProps {
  activeTab: MapMobileTabId;
  onSelectTab: (tab: MapMobileTabId) => void;
}

const NAV_TABS: Array<{
  id: MapMobileTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}> = [
  { id: 'map', label: 'Map', icon: MapIcon },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export const MobileBottomNavigation: React.FC<MobileBottomNavigationProps> = ({
  activeTab,
  onSelectTab
}) => {
  return (
    <nav
      aria-label="Field Sales Map Navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-[480] ov-panel-elevated border-x-0 border-b-0"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto px-2 pt-1 pb-[max(0.35rem,env(safe-area-inset-bottom))]">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`min-h-[48px] w-full flex flex-col items-center justify-center gap-1 rounded-xl transition-colors cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#38BDF8] bg-[#1685FF]/14'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              <span
                className={`text-[10.5px] leading-none tracking-wide ${
                  isActive ? 'font-bold text-white' : 'font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
