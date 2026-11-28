import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  HelpCircle,
  Images,
  Inbox,
  LayoutGrid,
  Settings,
  Store
} from 'lucide-react';
import {
  CategoryAuditRecord,
  FieldRequest,
  FieldRequestPrefill,
  Outlet,
  PlanogramRecord,
  UserProfile
} from '../../types';
import { LivePjpDataset } from '../../services/pjpService';
import { fetchFieldRequests, getCachedFieldRequests } from '../../services/requestsService';
import { QFI_PRODUCT_CATALOGUE } from '../../data/productCatalogue';
import { RequestsModule } from './RequestsModule';
import { GalleryModule } from './GalleryModule';
import { OutletDirectoryModule } from './OutletDirectoryModule';
import { VisitLogsModule } from './VisitLogsModule';
import { PlanogramLibraryModule } from './PlanogramLibraryModule';
import { ProductCatalogueModule } from './ProductCatalogueModule';
import { SettingsModule } from './SettingsModule';
import { HelpSupportModule } from './HelpSupportModule';

export type MoreSubModuleId =
  | 'hub'
  | 'requests'
  | 'gallery'
  | 'outlet-directory'
  | 'visit-logs'
  | 'planogram-library'
  | 'product-catalogue'
  | 'settings'
  | 'help-support';

interface MoreWorkspaceScreenProps {
  executive: UserProfile;
  assignedOutlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  livePjpDataset: LivePjpDataset;
  planograms: PlanogramRecord[];
  onOpenOutletInAnalytics: (outlet: Outlet) => void;
  onOpenOutletOnMap: (outlet: Outlet) => void;
  onPendingRequestsCountChange?: (count: number) => void;
  onLogout: () => void;
}

const DEFAULT_PERFORMANCE_URL = 'https://mt-performance-app.vercel.app/';

export const MoreWorkspaceScreen: React.FC<MoreWorkspaceScreenProps> = ({
  executive,
  assignedOutlets,
  audits,
  livePjpDataset,
  planograms,
  onOpenOutletInAnalytics,
  onOpenOutletOnMap,
  onPendingRequestsCountChange,
  onLogout
}) => {
  const [activeModule, setActiveModule] = useState<MoreSubModuleId>('hub');
  const [requests, setRequests] = useState<FieldRequest[]>(() => getCachedFieldRequests());
  const [isLoadingRequests, setIsLoadingRequests] = useState<boolean>(false);
  const [requestPrefill, setRequestPrefill] = useState<FieldRequestPrefill | null>(null);
  const [galleryOutletFilter, setGalleryOutletFilter] = useState<string>('All');
  const [visitLogsOutletFilter, setVisitLogsOutletFilter] = useState<string>('');

  const loadRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const res = await fetchFieldRequests();
      setRequests(res.requests);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const pendingRequestsCount = useMemo(
    () => requests.filter((r) => r.status === 'Pending').length,
    [requests]
  );

  useEffect(() => {
    onPendingRequestsCountChange?.(pendingRequestsCount);
  }, [pendingRequestsCount, onPendingRequestsCountChange]);

  const activePlanogramsCount = useMemo(
    () => planograms.filter((p) => p.status === 'active').length,
    [planograms]
  );

  const initials =
    executive.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('') || 'SA';

  const handleOpenPerformanceApp = () => {
    const baseUrl =
      (import.meta as any).env?.VITE_PERFORMANCE_APP_URL || DEFAULT_PERFORMANCE_URL;
    try {
      const target = new URL(baseUrl);
      // Pass only safe, non-sensitive executive display identity (no credentials, tokens, or PINs)
      if (executive.repId) target.searchParams.set('repId', executive.repId);
      if (executive.name) target.searchParams.set('executive', executive.name);
      const win = window.open(target.toString(), '_blank', 'noopener,noreferrer');
      if (!win) {
        window.location.assign(target.toString());
      }
    } catch {
      window.open(DEFAULT_PERFORMANCE_URL, '_blank', 'noopener,noreferrer');
    }
  };

  if (activeModule === 'requests') {
    return (
      <RequestsModule
        executive={executive}
        assignedOutlets={assignedOutlets}
        requests={requests}
        isLoading={isLoadingRequests}
        onRefresh={loadRequests}
        onRequestCreated={(newReq) =>
          setRequests((prev) => [newReq, ...prev.filter((r) => r.id !== newReq.id)])
        }
        onRequestUpdated={(updatedReq) =>
          setRequests((prev) => prev.map((r) => (r.id === updatedReq.id ? updatedReq : r)))
        }
        prefill={requestPrefill}
        onConsumePrefill={() => setRequestPrefill(null)}
        onBack={() => setActiveModule('hub')}
      />
    );
  }

  if (activeModule === 'gallery') {
    return (
      <GalleryModule
        executive={executive}
        assignedOutlets={assignedOutlets}
        audits={audits}
        initialOutletFilter={galleryOutletFilter}
        onBack={() => {
          setGalleryOutletFilter('All');
          setActiveModule('hub');
        }}
      />
    );
  }

  if (activeModule === 'outlet-directory') {
    return (
      <OutletDirectoryModule
        executiveName={executive.name}
        executiveRepId={executive.repId}
        assignedOutlets={assignedOutlets}
        livePjpDataset={livePjpDataset}
        audits={audits}
        onViewOutletAnalytics={onOpenOutletInAnalytics}
        onViewVisitLogs={(outletName) => {
          setVisitLogsOutletFilter(outletName);
          setActiveModule('visit-logs');
        }}
        onViewGallery={(outletName) => {
          setGalleryOutletFilter(outletName);
          setActiveModule('gallery');
        }}
        onViewOnMap={onOpenOutletOnMap}
        onBack={() => setActiveModule('hub')}
      />
    );
  }

  if (activeModule === 'visit-logs') {
    return (
      <VisitLogsModule
        executive={executive}
        assignedOutlets={assignedOutlets}
        audits={audits}
        livePjpDataset={livePjpDataset}
        initialOutletFilter={visitLogsOutletFilter}
        onOpenGalleryForOutlet={(outletName) => {
          setGalleryOutletFilter(outletName);
          setActiveModule('gallery');
        }}
        onBack={() => {
          setVisitLogsOutletFilter('');
          setActiveModule('hub');
        }}
      />
    );
  }

  if (activeModule === 'planogram-library') {
    return (
      <PlanogramLibraryModule
        planograms={planograms}
        livePjpDataset={livePjpDataset}
        onRequestPlanogramChange={(prefill) => {
          setRequestPrefill({ ...prefill, nonce: Date.now() });
          setActiveModule('requests');
        }}
        onBack={() => setActiveModule('hub')}
      />
    );
  }

  if (activeModule === 'product-catalogue') {
    return <ProductCatalogueModule onBack={() => setActiveModule('hub')} />;
  }

  if (activeModule === 'settings') {
    return (
      <SettingsModule
        executive={executive}
        onLogout={onLogout}
        onBack={() => setActiveModule('hub')}
      />
    );
  }

  if (activeModule === 'help-support') {
    return <HelpSupportModule onBack={() => setActiveModule('hub')} />;
  }

  type ModuleRowConfig = {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
    iconToneClass: string;
    badgeText?: string;
    isExternal?: boolean;
    onClick: () => void;
  };

  const sections: Array<{ title: string; items: ModuleRowConfig[] }> = [
    {
      title: 'FIELD OPERATIONS',
      items: [
        {
          id: 'requests',
          title: 'Requests',
          description: 'Manager visits, planogram changes, PJP & POSM approvals',
          icon: Inbox,
          iconToneClass:
            'bg-[#00C8FF]/15 border-[#00C8FF]/35 text-[#0066FF] dark:text-[#00C8FF]',
          badgeText: pendingRequestsCount > 0 ? `${pendingRequestsCount} Pending` : undefined,
          onClick: () => setActiveModule('requests')
        },
        {
          id: 'gallery',
          title: 'Gallery',
          description: 'Historical shelf evidence & AI-analysed audit photos',
          icon: Images,
          iconToneClass:
            'bg-sky-500/15 border-sky-400/35 text-sky-600 dark:text-sky-400',
          onClick: () => {
            setGalleryOutletFilter('All');
            setActiveModule('gallery');
          }
        },
        {
          id: 'outlet-directory',
          title: 'Outlet Directory',
          description: 'Assigned hypermarket profiles, SAP codes & map jump',
          icon: Store,
          iconToneClass:
            'bg-[#0066FF]/15 border-[#008DFF]/35 text-[#0066FF] dark:text-[#3B82F6]',
          badgeText: `${assignedOutlets.length}`,
          onClick: () => setActiveModule('outlet-directory')
        },
        {
          id: 'visit-logs',
          title: 'Visit Logs',
          description: 'Historical store check-ins, SOS & compliance timelines',
          icon: ClipboardList,
          iconToneClass:
            'bg-indigo-500/15 border-indigo-400/35 text-indigo-600 dark:text-indigo-400',
          onClick: () => {
            setVisitLogsOutletFilter('');
            setActiveModule('visit-logs');
          }
        }
      ]
    },
    {
      title: 'RESOURCE LIBRARY',
      items: [
        {
          id: 'planogram-library',
          title: 'Planogram Library',
          description: 'Approved shelf-layout schematics & facing targets',
          icon: LayoutGrid,
          iconToneClass:
            'bg-[#22C55E]/15 border-[#22C55E]/35 text-emerald-600 dark:text-[#22C55E]',
          badgeText: activePlanogramsCount > 0 ? `${activePlanogramsCount}` : undefined,
          onClick: () => setActiveModule('planogram-library')
        },
        {
          id: 'product-catalogue',
          title: 'Product Catalogue',
          description: 'QFI SKU packshots, SAP item codes & barcodes',
          icon: BookOpen,
          iconToneClass:
            'bg-[#FFB800]/15 border-[#FFB800]/35 text-amber-600 dark:text-[#FFB800]',
          badgeText: `${QFI_PRODUCT_CATALOGUE.length} SKUs`,
          onClick: () => setActiveModule('product-catalogue')
        }
      ]
    },
    {
      title: 'PERFORMANCE',
      items: [
        {
          id: 'my-performance',
          title: 'My Performance',
          description: 'Launch live Modern Trade KPI scorecard portal',
          icon: Award,
          iconToneClass:
            'bg-[#00C8FF]/15 border-[#00C8FF]/35 text-[#0066FF] dark:text-[#00C8FF]',
          isExternal: true,
          onClick: handleOpenPerformanceApp
        }
      ]
    },
    {
      title: 'PREFERENCES & SUPPORT',
      items: [
        {
          id: 'settings',
          title: 'Settings',
          description: 'Display theme previews, global text scaling & account',
          icon: Settings,
          iconToneClass:
            'bg-slate-400/15 border-slate-400/35 text-slate-600 dark:text-[#94A3B8]',
          onClick: () => setActiveModule('settings')
        },
        {
          id: 'help-support',
          title: 'Help & Support',
          description: 'Supervisor contact card & Modern Trade field SOPs',
          icon: HelpCircle,
          iconToneClass:
            'bg-sky-300/15 border-sky-300/35 text-slate-600 dark:text-[#CBD5E1]',
          onClick: () => setActiveModule('help-support')
        }
      ]
    }
  ];

  return (
    <div className="flex-1 w-full h-full overflow-y-auto">
      {/* Compact Digital Cockpit Header with subtle blue radial illumination */}
      <header className="cockpit-header-glow border-b border-[#D5E2F2] dark:border-[#104878]/80 px-4 md:px-8 pt-5 pb-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0066FF] dark:text-[#00C8FF] leading-none mb-1.5">
              MARVIZ AI / WORKSPACE
            </p>
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold italic uppercase tracking-wide text-[var(--text-primary)] leading-none">
              MORE
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5">
              Resources, operations &amp; preferences
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">
                {executive.name}
              </p>
              <p className="text-[10px] font-mono text-[var(--text-muted)] ov-tabular">
                {executive.repId} · {executive.role}
              </p>
            </div>
            <div
              className="w-11 h-11 rounded-[14px] cockpit-surface-elevated border-[#008DFF]/45 flex items-center justify-center font-heading text-base font-extrabold text-[#0066FF] dark:text-[#00C8FF] shadow-[0_0_20px_-6px_rgba(0,141,255,0.45)]"
              title={`${executive.name} (${executive.repId})`}
            >
              {initials}
            </div>
          </div>
        </div>
      </header>

      {/* 4 Sections / Exact 9 Modules */}
      <div className="px-4 md:px-8 py-4 pb-28 md:pb-10">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sections.map((section) => (
            <section key={section.title} className="space-y-2">
              <h2 className="px-1 font-heading text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                {section.title}
              </h2>

              <div className="cockpit-panel rounded-[16px] overflow-hidden divide-y divide-[#D5E2F2]/80 dark:divide-[#104878]/70">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={item.onClick}
                      className="w-full min-h-[64px] px-3.5 py-3 text-left flex items-center justify-between gap-3 hover:bg-[#0066FF]/[0.05] dark:hover:bg-[#0B2542]/75 transition-colors cursor-pointer active:scale-[0.995]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-[12px] border flex items-center justify-center shrink-0 ${item.iconToneClass}`}
                        >
                          <Icon size={18} strokeWidth={2} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-base font-bold uppercase tracking-wide text-[var(--text-primary)] leading-tight">
                              {item.title}
                            </span>
                            {item.badgeText && (
                              <span className="px-2 py-0.5 rounded-full bg-[#0066FF]/12 border border-[#008DFF]/30 text-[10px] font-bold text-[#0066FF] dark:text-[#00C8FF] ov-tabular">
                                {item.badgeText}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-[var(--text-muted)]">
                        {item.isExternal ? (
                          <ExternalLink size={16} className="text-[#00C8FF]" />
                        ) : (
                          <ChevronRight size={17} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};
