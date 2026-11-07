/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BarChart3, LogOut, Sparkles, Navigation, Sun, Moon } from 'lucide-react';
import { UserProfile, ScreenType, Outlet, CategoryType, CategoryAuditRecord } from './types';
import { INITIAL_OUTLETS, getInitialOutletsForExecutive } from './constants';
import { useTheme } from './ThemeContext';
import { LoginScreen } from './components/LoginScreen';
import { PJPScreen } from './components/PJPScreen';
import { OutletOverview } from './components/OutletOverview';
import { CameraWorkflowScreen } from './components/CameraWorkflowScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { AddOutletModal } from './components/AddOutletModal';
import { sendAuditToAppsScriptProxy, autoSaveAuditToGoogleSheet } from './services/googleSheetsService';

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
      // Purge any heavy legacy audit cache entries
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

  // Session User
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('mta_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Outlets List with route sequence and progress mapped to executive
  const [outlets, setOutlets] = useState<Outlet[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('mta_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const savedUserOutlets = localStorage.getItem(`mta_outlets_${u.username}`);
        if (savedUserOutlets) return JSON.parse(savedUserOutlets);
        return getInitialOutletsForExecutive(u.name);
      }
      const saved = localStorage.getItem('mta_outlets');
      return saved ? JSON.parse(saved) : INITIAL_OUTLETS;
    } catch {
      return INITIAL_OUTLETS;
    }
  });

  // Saved Audits per category (key: `${outletId}_${category}`)
  const [audits, setAudits] = useState<Record<string, CategoryAuditRecord>>(() => {
    try {
      const savedUserStr = localStorage.getItem('mta_user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        const userAudits = localStorage.getItem(`mta_audits_${u.username}`);
        if (userAudits) return JSON.parse(userAudits);
      }
      const saved = localStorage.getItem('mta_audits');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Screen routing state
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(() => {
    const savedUser = localStorage.getItem('mta_user');
    return savedUser ? 'PJP' : 'LOGIN';
  });

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

  // Sync to LocalStorage (both global and scoped by executive, with quota safety)
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

    // Load or generate outlets mapped to this executive
    const userOutletsKey = `mta_outlets_${userProfile.username}`;
    const userAuditsKey = `mta_audits_${userProfile.username}`;
    try {
      const savedUserOutlets = localStorage.getItem(userOutletsKey);
      if (savedUserOutlets) {
        setOutlets(JSON.parse(savedUserOutlets));
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
    setCurrentScreen('PJP');
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('mta_user');
    } catch {}
    setCurrentScreen('LOGIN');
  };

  const handleSaveAudit = (record: CategoryAuditRecord) => {
    if (!selectedOutlet || !selectedCategory) return;

    const auditKey = `${selectedOutlet.id}_${selectedCategory}`;
    setAudits((prev) => ({
      ...prev,
      [auditKey]: record
    }));

    // Update outlet category progress to Completed
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

    // Dispatch service layer transmission to Google Apps Script proxy endpoint
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

    // Also dispatch to background server auto-saver
    autoSaveAuditToGoogleSheet({
      timestamp: record.timestamp || new Date().toLocaleString(),
      outletId: selectedOutlet.id,
      outletName: selectedOutlet.name,
      accountName: selectedOutlet.name.split(' - ')[0] || selectedOutlet.name,
      outletCode: selectedOutlet.id,
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
      replyText: record.replyText || record.n8nStatus?.message || 'QFI Visit Audit Record'
    }).catch((e) => console.warn('[App] Auto-save background note:', e));

    // Return to outlet overview
    setCurrentScreen('OUTLET_OVERVIEW');
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
    setCurrentScreen('PJP');
  };

  return (
    <div
      className={`h-screen w-screen overflow-hidden flex flex-col justify-between relative antialiased select-none transition-colors duration-300 ${
        isDark ? 'bg-[#0B120E] text-[#F0FDF4]' : 'bg-[#F8FAF9] text-[#061A12]'
      }`}
    >
      {/* Glassmorphic Ambient Glow Radiants (Emerald & Agricultural Lime) */}
      <div className={`absolute -top-16 -left-16 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${isDark ? 'bg-emerald-900/20' : 'bg-emerald-500/10'}`} />
      <div className={`absolute -bottom-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${isDark ? 'bg-lime-900/15' : 'bg-lime-500/10'}`} />
      <div className={`absolute top-1/2 left-1/3 w-64 h-64 rounded-full blur-3xl pointer-events-none transition-opacity duration-700 ${isDark ? 'bg-emerald-950/30' : 'bg-emerald-400/5'}`} />

      {/* TOP HEADER BAR (Bespoke QFI Corporate Header) */}
      {user && currentScreen !== 'LOGIN' && (
        <header
          className={`px-3.5 py-2.5 backdrop-blur-xl border-b flex items-center justify-between z-20 shrink-0 transition-colors ${
            isDark
              ? 'bg-[#132219]/80 border-emerald-900/40 shadow-lg shadow-black/20'
              : 'bg-white/90 border-slate-200/80 shadow-xs shadow-emerald-950/5'
          }`}
        >
          <div className="flex items-center space-x-2.5 min-w-0">
            {/* QFI Leaf Emblem Logo */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#047857] via-[#065F46] to-[#10B981] flex items-center justify-center shadow-md shadow-emerald-950/30 text-xs font-black text-white shrink-0 border border-emerald-400/20">
              QFI
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className={`text-xs font-extrabold tracking-wide truncate ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
                  QFI Visit Audit
                </h1>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                  isDark
                    ? 'bg-emerald-950/80 border-emerald-700/50 text-emerald-300'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  PJP Active
                </span>
              </div>
              <p className={`text-[10px] font-medium truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {user.name} &bull; <span className={isDark ? 'text-emerald-400' : 'text-emerald-700 font-bold'}>{user.repId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all ${
                isDark
                  ? 'bg-[#182C21] border-emerald-900/60 text-slate-300 hover:text-white'
                  : 'bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-950 shadow-xs'
              }`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-emerald-800" />}
            </button>
            <button
              onClick={() => setCurrentScreen('DASHBOARD')}
              className={`p-2 rounded-xl border transition-all ${
                currentScreen === 'DASHBOARD'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30'
                  : isDark
                  ? 'bg-[#182C21] border-emerald-900/60 text-slate-300 hover:text-white'
                  : 'bg-slate-100/90 border-slate-200 text-slate-700 hover:text-slate-950 shadow-xs'
              }`}
              title="Performance Dashboard"
              aria-label="Performance Dashboard"
            >
              <BarChart3 size={15} />
            </button>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#182C21] border-emerald-900/60 text-slate-400 hover:text-rose-400'
                  : 'bg-slate-100/90 border-slate-200 text-slate-500 hover:text-rose-600'
              }`}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </header>
      )}

      {/* MAIN SCREEN ROUTER CONTAINER (Strict Zero-Scroll Container) */}
      <main className="flex-1 overflow-hidden relative flex flex-col z-10">
        {currentScreen === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}

        {currentScreen === 'PJP' && (
          <PJPScreen
            outlets={outlets}
            executive={user}
            onSelectOutlet={(outlet) => {
              setSelectedOutlet(outlet);
              setCurrentScreen('OUTLET_OVERVIEW');
            }}
            onOpenAddModal={() => setIsAddOutletModalOpen(true)}
          />
        )}

        {currentScreen === 'OUTLET_OVERVIEW' && selectedOutlet && (
          <OutletOverview
            outlet={selectedOutlet}
            audits={audits}
            onBack={() => {
              setSelectedOutlet(null);
              setCurrentScreen('PJP');
            }}
            onSelectCategory={(category) => {
              setSelectedCategory(category);
              setCurrentScreen('CAMERA_WORKFLOW');
            }}
          />
        )}

        {currentScreen === 'CAMERA_WORKFLOW' && selectedOutlet && selectedCategory && (
          <CameraWorkflowScreen
            outlet={selectedOutlet}
            category={selectedCategory}
            existingAudit={audits[`${selectedOutlet.id}_${selectedCategory}`]}
            onSaveAudit={handleSaveAudit}
            onBack={() => setCurrentScreen('OUTLET_OVERVIEW')}
            userProfile={user || undefined}
          />
        )}

        {currentScreen === 'DASHBOARD' && (
          <DashboardScreen
            outlets={outlets}
            audits={audits}
            onBack={() => setCurrentScreen(selectedOutlet ? 'OUTLET_OVERVIEW' : 'PJP')}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Add Ad-Hoc Store Modal */}
      <AddOutletModal
        isOpen={isAddOutletModalOpen}
        onClose={() => setIsAddOutletModalOpen(false)}
        onAdd={handleAddNewOutlet}
        currentCount={outlets.length}
        existingOutlets={outlets}
        executiveName={user?.name || 'Safwan Asif'}
      />
    </div>
  );
}
