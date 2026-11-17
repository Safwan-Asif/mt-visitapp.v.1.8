import React from 'react';
import { Home, Map as MapIcon, Inbox } from 'lucide-react';
import { AppTab } from './NavigationShell';

interface PlaceholderTabScreenProps {
  tab: Extract<AppTab, 'home' | 'map' | 'requests'>;
}

const TAB_COPY: Record<
  Extract<AppTab, 'home' | 'map' | 'requests'>,
  { title: string; subtitle: string; icon: React.ReactNode }
> = {
  home: {
    title: 'Home',
    subtitle: 'Executive workspace reserved for upcoming modules.',
    icon: <Home size={22} strokeWidth={1.75} />
  },
  map: {
    title: 'Map',
    subtitle: 'Territory routing view reserved for upcoming release.',
    icon: <MapIcon size={22} strokeWidth={1.75} />
  },
  requests: {
    title: 'Requests',
    subtitle: 'Store requests & approvals inbox reserved for upcoming release.',
    icon: <Inbox size={22} strokeWidth={1.75} />
  }
};

export const PlaceholderTabScreen: React.FC<PlaceholderTabScreenProps> = ({ tab }) => {
  const meta = TAB_COPY[tab];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto px-4 pt-4 pb-24 md:px-8 md:py-8 flex flex-col max-w-5xl mx-auto animate-fade-in">
      <div className="mb-5">
        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {meta.title}
        </h2>
      </div>

      <div className="flex-1 glass-panel rounded-3xl p-8 flex flex-col items-center justify-center text-center min-h-[280px]">
        <div className="w-12 h-12 rounded-2xl glass-subtle flex items-center justify-center text-[var(--accent-primary)] mb-3">
          {meta.icon}
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">{meta.title}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xs leading-relaxed">
          {meta.subtitle}
        </p>
      </div>
    </div>
  );
};
