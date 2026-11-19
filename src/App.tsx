/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LogOut, Sun, Moon } from 'lucide-react';
import { UserProfile, ScreenType, Outlet, CategoryType, CategoryAuditRecord, PlanogramRecord } from './types';
import { INITIAL_OUTLETS, getInitialOutletsForExecutive, MasterOutletOption } from './constants';
import { useTheme } from './ThemeContext';
import { LoginScreen } from './components/LoginScreen';
import { PJPScreen } from './components/PJPScreen';
import { OutletOverview } from './components/OutletOverview';
import { CameraWorkflowScreen } from './components/CameraWorkflowScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AddOutletModal } from './components/AddOutletModal';
import { DesktopSidebar, MobileBottomNav, AppTab } from './components/NavigationShell';
import { PlaceholderTabScreen } from './components/PlaceholderTabScreen';
import { HomeAnalyticsScreen } from './components/HomeAnalyticsScreen';
import { MobileMapScreen } from './components/map/MobileMapScreen';
import { sendAuditToAppsScriptProxy, autoSaveAuditToGoogleSheet } from './services/googleSheetsService';
import { fetchActivePlanograms, getCachedActivePlanograms } from './services/planogramService';
import {
  fetchLivePjpData,
  getCachedLivePjpData,
  buildExecutiveOutletsFromLivePjp,
  enrichOutletsWithLivePjpSapCodes
} from './services/pjpService';
import { PjpVisitRow } from './data/pjpMasterData';

/**
 * Strip heavy base64 image strings before saving to localStorage to prevent QuotaExceededError.
 * Full images remain preserved in React memory state and are transmitted to the backend proxy & Google Sheet.
 */
function sanitizeAuditsForStorage(auditsRecord: Record<string, CategoryAuditRecord>): Record<string, CategoryAuditRecord> {
  const sanitized: Record<string, CategoryAuditRecord> = {};
  for (const [key, record] of Object.entries(auditsRecord)) {
    sanitized[key] = {
      ...record,
      photoDataUrl: record.photoDataUrl && record.photoDataUrl.startsWith('data:') && record.photoDataUrl.length > 500 ? '' : record.photoDataUrl,
      annotatedPhotoUrl: record.annotatedPhotoUrl && record.annotatedPhotoUrl.startsWith('data:') && record.annotatedPhotoUrl.length > 500 ? '' : record.annotatedPhotoUrl,
      annotatedImage: record.annotatedImage && record.annotatedImage.startsWith('data:') && record.annotatedImage.length > 500 ? '' : record.annotatedImage,
    };
  }
  return sanitized;
}

/**
 * Safely writes to localStorage, catching QuotaExceededError and freeing stale cache if needed.
 */
function safeSetLocalStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`[Storage] Quota protection caught for "${key}":`, err?.message);
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('mta_audits') && k !== key)) {
          localStorage.removeItem(k);
        }
      }
      localStorage.setItem(key, value);
    } catch {
      // Graceful fallback: do not throw or crash application UI
    }
  }
}

// Initial storage self-healing to clear any pre-existing bloated keys from previous sessions
try {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('mta_audits')) {
      const val = localStorage.getItem(k);
      if (val && val.length > 100000) {
        try {
          const parsed = JSON.parse(val);
          const cleaned = sanitizeAuditsForStorage(parsed);
          localStorage.setItem(k, JSON.stringify(cleaned));
        } catch {
          localStorage.removeItem(k);
        }
      }
    }
  }
} catch {
  // Ignore quota errors during initial sweep
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();

  // Always require login/password on startup
  try {
    localStorage.removeItem('mta_user');
  } catch {}

  const [user, setUser] = useState<UserProfile | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>(INITIAL_OUTLETS);
  const [audits, setAudits] = useState<Record<string, CategoryAuditRecord>>({});
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('LOGIN');
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isFinishingOutlet, setIsFinishingOutlet] = useState<boolean>(false);
  const [isMapsQuotaExceeded, setIsMapsQuotaExceeded] = useState<boolean>(false);

  useEffect(() => {
    const handleQuotaExceeded = () => setIsMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(() => {
    try {
      const savedId = localStorage.getItem('mta_selected_outlet_id');
      if (savedId) {
        const found = outlets.find((o) => o.id === savedId);
        return found || null;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(() => {
    return (localStorage.getItem('mta_selected_category') as CategoryType) || null;
  });

  const [isAddOutletModalOpen, setIsAddOutletModalOpen] = useState<boolean>(false);
  const [mapAnalyticsTarget, setMapAnalyticsTarget] = useState<{
    id: string;
    name: string;
    area: string;
    nonce: number;
  } | null>(null);
  const [pjpRequestedFilter, setPjpRequestedFilter] = useState<{
    value: 'ALL' | 'PENDING' | 'PLANOGRAM' | 'DONE';
    nonce: number;
  } | null>(null);
  const [planograms, setPlanograms] = useState<PlanogramRecord[]>(() => getCachedActivePlanograms());
  const [liveMasterOutlets, setLiveMasterOutlets] = useState<MasterOutletOption[]>(
    () => getCachedLivePjpData().masterOutlets
  );
  const [livePjpVisits, setLivePjpVisits] = useState<PjpVisitRow[]>(
    () => getCachedLivePjpData().visits
  );
  const [isSyncingMatch, setIsSyncingMatch] = useState<boolean>(false);

  const syncPjpAndPlanograms = async (execName?: string, hasSavedRoute: boolean = true) => {
    setIsSyncingMatch(true);
    try {
      const [livePlans, livePjp] = await Promise.all([
        fetchActivePlanograms(true),
        fetchLivePjpData(true)
      ]);
      if (livePlans.length > 0) setPlanograms(livePlans);
      if (livePjp.masterOutlets.length > 0) setLiveMasterOutlets(livePjp.masterOutlets);
      if (livePjp.visits.length > 0) setLivePjpVisits(livePjp.visits);

      if (!hasSavedRoute && execName) {
        setOutlets(buildExecutiveOutletsFromLivePjp(execName, livePjp));
      } else {
        setOutlets((prev) => enrichOutletsWithLivePjpSapCodes(prev, livePjp));
      }
    } catch {
      // Non-fatal offline cache fallback
    } finally {
      setIsSyncingMatch(false);
    }
  };

  useEffect(() => {
    if (user?.username) {
      safeSetLocalStorage(`mta_outlets_${user.username}`, JSON.stringify(outlets));
    }
    safeSetLocalStorage('mta_outlets', JSON.stringify(outlets));
  }, [outlets, user]);

  useEffect(() => {
    const sanitized = sanitizeAuditsForStorage(audits);
    const serialized = JSON.stringify(sanitized);
    if (user?.username) {
      safeSetLocalStorage(`mta_audits_${user.username}`, serialized);
    }
    safeSetLocalStorage('mta_audits', serialized);
  }, [audits, user]);

  useEffect(() => {
    if (selectedOutlet) {
      safeSetLocalStorage('mta_selected_outlet_id', selectedOutlet.id);
    } else {
      try {
        localStorage.removeItem('mta_selected_outlet_id');
      } catch {}
    }
  }, [selectedOutlet]);

  useEffect(() => {
    if (selectedCategory) {
      safeSetLocalStorage('mta_selected_category', selectedCategory);
    } else {
      try {
        localStorage.removeItem('mta_selected_category');
      } catch {}
    }
  }, [selectedCategory]);

  const handleLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    safeSetLocalStorage('mta_user', JSON.stringify(userProfile));

    const userOutletsKey = `mta_outlets_${userProfile.username}`;
    const userAuditsKey = `mta_audits_${userProfile.username}`;
    let hasSavedOutlets = false;
    try {
      const savedUserOutlets = localStorage.getItem(userOutletsKey);
      if (savedUserOutlets) {
        hasSavedOutlets = true;
        setOutlets(enrichOutletsWithLivePjpSapCodes(JSON.parse(savedUserOutlets), getCachedLivePjpData()));
      } else {
        const initialExecOutlets = getInitialOutletsForExecutive(userProfile.name);
        setOutlets(initialExecOutlets);
        safeSetLocalStorage(userOutletsKey, JSON.stringify(initialExecOutlets));
      }
      const savedUserAudits = localStorage.getItem(userAuditsKey);
      setAudits(savedUserAudits ? JSON.parse(savedUserAudits) : {});
    } catch {
      setOutlets(getInitialOutletsForExecutive(userProfile.name));
    }

    setSelectedOutlet(null);
    setSelectedCategory(null);
    setIsFinishingOutlet(false);
    setActiveTab('home');
    setCurrentScreen('DASHBOARD');

    syncPjpAndPlanograms(userProfile.name, hasSavedOutlets);
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('mta_user');
    } catch {}
    setSelectedOutlet(null);
    setSelectedCategory(null);
    setIsFinishingOutlet(false);
    setCurrentScreen('LOGIN');
  };

  const handleSelectTab = (tab: AppTab) => {
    setActiveTab(tab);
    setIsFinishingOutlet(false);
    setSelectedCategory(null);
    if (tab === 'pjp') {
      setPjpRequestedFilter(null);
    }

    if (tab === 'today') {
      setSelectedOutlet(null);
      setCurrentScreen('DASHBOARD');
    } else if (tab === 'pjp') {
      setSelectedOutlet(null);
      setCurrentScreen('PJP');
    } else {
      setSelectedOutlet(null);
      setCurrentScreen('PJP');
    }
  };

  const navigateToPendingPjp = () => {
    setPjpRequestedFilter({ value: 'PENDING', nonce: Date.now() });
    setActiveTab('pjp');
    setIsFinishingOutlet(false);
    setSelectedCategory(null);
    setSelectedOutlet(null);
    setCurrentScreen('PJP');
  };

  const handleSaveAudit = (record: CategoryAuditRecord, deferExit: boolean = false) => {
    if (!selectedOutlet || !selectedCategory) return;

    const auditKey = `${selectedOutlet.id}_${selectedCategory}`;
    setAudits((prev) => ({
      ...prev,
      [auditKey]: record
    }));

    setOutlets((prev) =>
      prev.map((o) => {
        if (o.id === selectedOutlet.id) {
          const updatedProgress = {
            ...o.progress,
            [selectedCategory]: 'Completed' as const
          };
          const allCompleted = Object.values(updatedProgress).every((st) => st === 'Completed');
          const updatedOutlet: Outlet = {
            ...o,
            progress: updatedProgress,
            status: allCompleted ? 'Completed' : 'In Progress'
          };
          setSelectedOutlet(updatedOutlet);
          return updatedOutlet;
        }
        return o;
      })
    );

    const counts = record.counts || record.aiCounts || {};
    const annotatedImg = record.annotatedImage || record.annotatedPhotoUrl || record.n8nStatus?.annotatedImageUrl || record.photoDataUrl || record.photoUrl || '';
    const sosPct = record.shareOfShelfPct ?? record.primarySharePct ?? 0;
    const sosLabel = record.shareOfShelfLabel || (selectedCategory === 'Edible Oil' ? 'QFI SOS (YARA+ZAIN+DAWI+AL RAI+ADEERA)' : 'QFM SOS (QFM)');
    const discrepancyLog = record.discrepancyLog || 'No manual overrides (AI counts accepted)';
    const originalAiCounts = record.originalAiCounts || counts;
    const unmappedRemark = selectedOutlet.unmappedRemark || '';

    sendAuditToAppsScriptProxy({
      timestamp: record.timestamp || new Date().toISOString(),
      repId: user?.repId || '#9',
      outletId: selectedOutlet.id,
      outletName: selectedOutlet.name,
      accountName: selectedOutlet.name.split(' - ')[0] || selectedOutlet.name,
      category: selectedCategory,
      totalFacings: record.totalFacings,
      counts: counts,
      originalAiCounts: originalAiCounts,
      discrepancyLog: discrepancyLog,
      unmappedRemark: unmappedRemark,
      latitude: record.latitude,
      longitude: record.longitude,
      locationSource: record.locationSource,
      photoDataUrl: record.photoDataUrl || record.photoUrl,
      photoUrl: record.photoUrl,
      annotatedImage: annotatedImg
    }).then((res) => {
      console.log('[App] Google Apps Script Proxy dispatch status:', res.message, res.payloadSent);
    }).catch((err) => {
      console.warn('[App] Google Apps Script Proxy error:', err);
    });

    autoSaveAuditToGoogleSheet({
      timestamp: record.timestamp || new Date().toLocaleString(),
      outletId: selectedOutlet.id,
      outletName: selectedOutlet.name,
      accountName: selectedOutlet.name.split(' - ')[0] || selectedOutlet.name,
      outletCode: selectedOutlet.code || selectedOutlet.id,
      category: selectedCategory,
      repId: user?.repId || '#9',
      repName: user?.name || 'Safwan Asif',
      totalFacings: record.totalFacings,
      shareOfShelfPct: sosPct,
      shareOfShelfLabel: sosLabel,
      counts: counts,
      originalAiCounts: originalAiCounts,
      discrepancyLog: discrepancyLog,
      unmappedRemark: unmappedRemark,
      latitude: record.latitude,
      longitude: record.longitude,
      locationSource: record.locationSource,
      priceTagOk: record.priceTagOk,
      posmShelfSticker: record.posmShelfSticker,
      posmWobblers: record.posmWobblers,
      needsReview: record.needsReview ?? false,
      photoDataUrl: annotatedImg,
      replyText: record.replyText || 'Visit Audit Record'
    }).catch((e) => console.warn('[App] Auto-save background note:', e));

    if (!deferExit) {
      setCurrentScreen('OUTLET_OVERVIEW');
    }
  };

  const handleAddNewOutlet = (newOutlet: Outlet) => {
    setOutlets((prev) => [newOutlet, ...prev]);
  };

  const handleResetData = () => {
    const defaultOutlets = user ? getInitialOutletsForExecutive(user.name) : INITIAL_OUTLETS;
    setOutlets(defaultOutlets);
    setAudits({});
    if (user?.username) {
      localStorage.removeItem(`mta_outlets_${user.username}`);
      localStorage.removeItem(`mta_audits_${user.username}`);
    }
    localStorage.removeItem('mta_outlets');
    localStorage.removeItem('mta_audits');
    localStorage.removeItem('mta_selected_outlet_id');
    localStorage.removeItem('mta_selected_category');
    setSelectedOutlet(null);
    setSelectedCategory(null);
    setIsFinishingOutlet(false);
    setActiveTab('pjp');
    setCurrentScreen('PJP');
  };

  const isAuthenticated = Boolean(user) && currentScreen !== 'LOGIN';
  const isActiveAudit = currentScreen === 'CAMERA_WORKFLOW' || isFinishingOutlet;
  const requestsCount = 0; // Hidden on bar until requests module ships

  return (
    <div
      className={`h-[100dvh] w-full overflow-hidden flex flex-col relative antialiased select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0B110F] text-[#ECFDF5]' : 'bg-[#F5F4EF] text-[#0F1B17]'
      }`}
    >
      {isMapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm shrink-0">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
      {/* Subtle Ambient Frosted Mesh Radiance */}
      <div
        className={`fixed -top-24 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isDark ? 'bg-emerald-900/20' : 'bg-[#084C41]/8'
        }`}
      />
      <div
        className={`fixed -bottom-28 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${
          isDark ? 'bg-teal-900/15' : 'bg-emerald-600/8'
        }`}
      />

      {/* Desktop / Tablet Frosted Glass Left Sidebar Rail */}
      {isAuthenticated && user && !isActiveAudit && (
        <DesktopSidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          requestsCount={requestsCount}
          executive={user}
          onLogout={handleLogout}
        />
      )}

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Compact Mobile Top Header (Hidden on Desktop/Tablet, Active Audits, and full-viewport Map View) */}
        {isAuthenticated && !isActiveAudit && activeTab !== 'map' && (
          <header className="md:hidden h-12 px-4 glass-nav border-b flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                  isDark ? 'bg-[#10B981] text-[#05231C]' : 'bg-[#084C41] text-white'
                }`}
              >
                QFI
              </div>
              <h1 className="text-sm font-extrabold tracking-tight truncate text-[var(--text-primary)]">
                QFI MARVIZ AI
              </h1>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={toggleTheme}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title={isDark ? 'Switch to Frosted Light' : 'Switch to Dark Glass'}
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </header>
        )}

        {/* Active Route Viewport */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {currentScreen === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}

          {isAuthenticated && currentScreen === 'CAMERA_WORKFLOW' && selectedOutlet && selectedCategory && (
            <CameraWorkflowScreen
              outlet={selectedOutlet}
              category={selectedCategory}
              existingAudit={audits[`${selectedOutlet.id}_${selectedCategory}`]}
              onSaveAudit={handleSaveAudit}
              onBack={() => setCurrentScreen('OUTLET_OVERVIEW')}
              userProfile={user || undefined}
            />
          )}

          {isAuthenticated && currentScreen === 'OUTLET_OVERVIEW' && selectedOutlet && (
            <OutletOverview
              outlet={selectedOutlet}
              audits={audits}
              planograms={planograms}
              onFinishScreenChange={setIsFinishingOutlet}
              onBack={() => {
                setIsFinishingOutlet(false);
                setSelectedOutlet(null);
                setActiveTab('pjp');
                setCurrentScreen('PJP');
              }}
              onSelectCategory={(category) => {
                setSelectedCategory(category);
                setCurrentScreen('CAMERA_WORKFLOW');
              }}
              onFinishOutlet={(confidence) => {
                setIsFinishingOutlet(false);
                setOutlets((prev) =>
                  prev.map((o) =>
                    o.id === selectedOutlet.id
                      ? { ...o, status: 'Completed', dataConfidence: confidence }
                      : o
                  )
                );
                const visitId = selectedOutlet.visitId || `visit_${selectedOutlet.id}_${new Date().toISOString().slice(0, 10)}`;
                fetch('/api/sheets/apps-script-proxy', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    payload: {
                      action: 'sync_visit',
                      visit_id: visitId,
                      visit: {
                        visit_id: visitId,
                        date: new Date().toISOString().slice(0, 10),
                        start_time: '09:00',
                        end_time: new Date().toTimeString().slice(0, 5),
                        rep: user?.name || 'Safwan Asif',
                        outlet: selectedOutlet.name,
                        gps_lat: null,
                        gps_lng: null,
                        data_confidence: confidence,
                        categories_completed: 'Flour, Edible Oil, Pasta',
                        app_version: '2.0.0'
                      },
                      tables: {}
                    }
                  })
                }).catch(() => {});
              }}
            />
          )}

          {isAuthenticated && currentScreen !== 'CAMERA_WORKFLOW' && currentScreen !== 'OUTLET_OVERVIEW' && (
            <>
              {activeTab === 'home' && (
                <HomeAnalyticsScreen
                  executive={user}
                  outlets={outlets}
                  pjpVisits={livePjpVisits}
                  audits={audits}
                  planograms={planograms}
                  isSyncingPjp={isSyncingMatch}
                  onSyncPjp={() => syncPjpAndPlanograms(user?.name, true)}
                  onNavigateToPendingPjp={navigateToPendingPjp}
                  selectedMapOutlet={mapAnalyticsTarget}
                  onClearMapOutlet={() => setMapAnalyticsTarget(null)}
                />
              )}

              {activeTab === 'map' && (
                <MobileMapScreen
                  executive={user}
                  onStartOutletVisit={(mapOutlet) => {
                    const lowerName = mapOutlet.name.toLowerCase();
                    const existing =
                      outlets.find((o) => o.id === mapOutlet.id) ||
                      outlets.find(
                        (o) =>
                          o.name.toLowerCase().includes(lowerName) ||
                          lowerName.includes(o.name.toLowerCase().split(' - ')[0])
                      );

                    const catStatus =
                      mapOutlet.visitStatus === 'completed' ? 'Completed' : 'Not Started';

                    const targetOutlet: Outlet = existing || {
                      id: mapOutlet.id,
                      code: mapOutlet.id,
                      name: `${mapOutlet.name} - ${mapOutlet.area.split(',')[0]}`,
                      account: mapOutlet.name.split(' ')[0],
                      branch: mapOutlet.area.split(',')[0].trim(),
                      sequence: String(mapOutlet.visitOrder ?? 99),
                      address: mapOutlet.area,
                      latitude: mapOutlet.latitude,
                      longitude: mapOutlet.longitude,
                      status:
                        mapOutlet.visitStatus === 'completed' ? 'Completed' : 'Not Started',
                      progress: {
                        Flour: catStatus,
                        'Edible Oil': catStatus,
                        Pasta: catStatus
                      }
                    };

                    if (!existing) {
                      setOutlets((prev) => [targetOutlet, ...prev]);
                    }
                    setSelectedOutlet(targetOutlet);
                    setCurrentScreen('OUTLET_OVERVIEW');
                  }}
                  onMoreDetails={(outletId, mapOutlet) => {
                    setMapAnalyticsTarget({
                      id: outletId,
                      name: mapOutlet.name,
                      area: mapOutlet.area,
                      nonce: Date.now()
                    });
                    setActiveTab('home');
                    setCurrentScreen('DASHBOARD');
                  }}
                  onNavigateTab={(tab) => handleSelectTab(tab)}
                  onLogout={handleLogout}
                />
              )}

              {activeTab === 'requests' && (
                <PlaceholderTabScreen tab="requests" />
              )}

              {activeTab === 'pjp' && (
                <PJPScreen
                  outlets={outlets}
                  executive={user}
                  planograms={planograms}
                  isSyncingMatch={isSyncingMatch}
                  onRefreshMatch={() => syncPjpAndPlanograms(user?.name, true)}
                  requestedFilter={pjpRequestedFilter}
                  onSelectOutlet={(outlet) => {
                    setSelectedOutlet(outlet);
                    setCurrentScreen('OUTLET_OVERVIEW');
                    fetchActivePlanograms(true)
                      .then((list) => {
                        if (list.length > 0) setPlanograms(list);
                      })
                      .catch(() => {});
                  }}
                  onOpenAddModal={() => setIsAddOutletModalOpen(true)}
                />
              )}

              {activeTab === 'today' && (
                <DashboardScreen
                  outlets={outlets}
                  audits={audits}
                  executive={user}
                  onBack={navigateToPendingPjp}
                  onNavigateToPendingPjp={navigateToPendingPjp}
                  onResetData={handleResetData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (5 Tabs: Home, Map, +, Today, Requests — hidden only during active audits & login) */}
      {isAuthenticated && !isActiveAudit && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          requestsCount={requestsCount}
        />
      )}

      {/* Add Ad-Hoc Store Modal */}
      <AddOutletModal
        isOpen={isAddOutletModalOpen}
        onClose={() => setIsAddOutletModalOpen(false)}
        onAdd={handleAddNewOutlet}
        currentCount={outlets.length}
        existingOutlets={outlets}
        executiveName={user?.name || 'Safwan Asif'}
        liveMasterOutlets={liveMasterOutlets}
        planograms={planograms}
      />
      </div>
    </div>
  );
}
