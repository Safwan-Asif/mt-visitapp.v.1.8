import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  MapPin,
  CheckCircle2,
  Plus,
  RefreshCw,
  Layers,
  FileSpreadsheet,
  Route as RouteIcon,
  Navigation,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Outlet, UserProfile, PlanogramRecord } from '../types';
import { useTheme } from '../ThemeContext';
import { PJP_GOOGLE_SHEET_URL } from '../constants';
import { getPlanogramsForOutlet } from '../services/planogramService';
import {
  summarizeSapPlanogramMatches,
  resolveOutletCoordinates,
  optimizePjpRouteWithGoogleMaps,
  OLD_DOHA_PORT_FALLBACK,
  OptimizedPjpRouteResult
} from '../services/pjpService';
import { PjpGoogleMap, PjpMapOutletItem } from './PjpGoogleMap';

interface PJPScreenProps {
  outlets: Outlet[];
  onSelectOutlet: (outlet: Outlet) => void;
  onOpenAddModal: () => void;
  executive?: UserProfile | null;
  planograms?: PlanogramRecord[];
  isSyncingMatch?: boolean;
  onRefreshMatch?: () => void;
  requestedFilter?: { value: 'ALL' | 'PENDING' | 'PLANOGRAM' | 'DONE'; nonce: number } | null;
}

function formatDistance(meters: number): string {
  if (!meters || meters <= 0) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

function resolveStartOrigin(): Promise<{
  lat: number;
  lng: number;
  source: 'gps' | 'old_doha_port';
}> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({
        lat: OLD_DOHA_PORT_FALLBACK.lat,
        lng: OLD_DOHA_PORT_FALLBACK.lng,
        source: 'old_doha_port'
      });
      return;
    }

    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve({
          lat: OLD_DOHA_PORT_FALLBACK.lat,
          lng: OLD_DOHA_PORT_FALLBACK.lng,
          source: 'old_doha_port'
        });
      }
    }, 4000);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const { latitude, longitude } = pos.coords;
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
          resolve({ lat: latitude, lng: longitude, source: 'gps' });
        } else {
          resolve({
            lat: OLD_DOHA_PORT_FALLBACK.lat,
            lng: OLD_DOHA_PORT_FALLBACK.lng,
            source: 'old_doha_port'
          });
        }
      },
      () => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        resolve({
          lat: OLD_DOHA_PORT_FALLBACK.lat,
          lng: OLD_DOHA_PORT_FALLBACK.lng,
          source: 'old_doha_port'
        });
      },
      { enableHighAccuracy: false, timeout: 3800, maximumAge: 60000 }
    );
  });
}

export const PJPScreen: React.FC<PJPScreenProps> = ({
  outlets,
  onSelectOutlet,
  onOpenAddModal,
  executive,
  planograms = [],
  isSyncingMatch = false,
  onRefreshMatch,
  requestedFilter
}) => {
  const { isDark } = useTheme();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'PLANOGRAM' | 'DONE'>(
    requestedFilter?.value || 'ALL'
  );
  const [autoOptimize, setAutoOptimize] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedPjpRouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(
    outlets[0]?.id || null
  );
  const [showMobileMap, setShowMobileMap] = useState<boolean>(false);

  useEffect(() => {
    if (requestedFilter?.value) {
      setFilter(requestedFilter.value);
    }
  }, [requestedFilter?.nonce, requestedFilter?.value]);

  const completedCount = outlets.filter((o) =>
    Object.values(o.progress).every((status) => status === 'Completed')
  ).length;
  const totalCount = outlets.length;
  const pendingCount = totalCount - completedCount;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const outletPlanogramsRecord = useMemo(() => {
    const rec: Record<string, PlanogramRecord[]> = {};
    outlets.forEach((o) => {
      rec[o.id] = getPlanogramsForOutlet(o, planograms);
    });
    return rec;
  }, [outlets, planograms]);

  const sapMatchSummary = useMemo(
    () => summarizeSapPlanogramMatches(outlets, planograms),
    [outlets, planograms]
  );

  const planogramMatchedCount = outlets.filter(
    (o) => (outletPlanogramsRecord[o.id] || []).length > 0
  ).length;

  const filteredOutlets = useMemo(() => {
    return outlets.filter((o) => {
      const isDone = Object.values(o.progress).every((s) => s === 'Completed');
      const hasPlanogram = (outletPlanogramsRecord[o.id] || []).length > 0;
      if (filter === 'PENDING') return !isDone;
      if (filter === 'DONE') return isDone;
      if (filter === 'PLANOGRAM') return hasPlanogram;
      return true;
    });
  }, [outlets, outletPlanogramsRecord, filter]);

  const outletCoordsRecord = useMemo(() => {
    const rec: Record<string, { lat: number; lng: number }> = {};
    outlets.forEach((o, idx) => {
      rec[o.id] = resolveOutletCoordinates(o, idx);
    });
    return rec;
  }, [outlets]);

  const runRouteOptimization = useCallback(
    async (targetList: Outlet[]) => {
      if (targetList.length === 0) {
        setOptimizedRoute(null);
        setRouteError(null);
        return;
      }

      setIsOptimizing(true);
      setRouteError(null);
      try {
        const origin = await resolveStartOrigin();
        const stops = targetList.slice(0, 25).map((o, idx) => {
          const c = outletCoordsRecord[o.id] || resolveOutletCoordinates(o, idx);
          return { id: o.id, lat: c.lat, lng: c.lng };
        });

        const result = await optimizePjpRouteWithGoogleMaps(origin, stops);
        setOptimizedRoute(result);
        setShowMobileMap(true);
      } catch (err: any) {
        setRouteError(err?.message || 'Unable to optimize route order right now.');
        setOptimizedRoute(null);
      } finally {
        setIsOptimizing(false);
      }
    },
    [outletCoordsRecord]
  );

  const handleToggleAutoOptimize = () => {
    if (autoOptimize) {
      setAutoOptimize(false);
      setOptimizedRoute(null);
      setRouteError(null);
      return;
    }
    setAutoOptimize(true);
    runRouteOptimization(filteredOutlets);
  };

  // Re-run optimization automatically if filter or outlet set changes while Auto Optimize is active
  const filteredIdsSignature = useMemo(
    () => filteredOutlets.map((o) => o.id).join(','),
    [filteredOutlets]
  );

  useEffect(() => {
    if (!autoOptimize) return;
    if (filteredOutlets.length === 0) {
      setOptimizedRoute(null);
      return;
    }
    const existingIds = new Set(optimizedRoute?.orderedIds || []);
    const allCovered =
      optimizedRoute &&
      filteredOutlets.slice(0, 25).every((o) => existingIds.has(o.id)) &&
      existingIds.size === Math.min(filteredOutlets.length, 25);

    if (!allCovered && !isOptimizing) {
      runRouteOptimization(filteredOutlets);
    }
  }, [autoOptimize, filteredIdsSignature]);

  const orderedOutlets = useMemo(() => {
    if (!autoOptimize || !optimizedRoute || optimizedRoute.orderedIds.length === 0) {
      return filteredOutlets;
    }
    const byId: Record<string, Outlet> = {};
    filteredOutlets.forEach((o) => {
      byId[o.id] = o;
    });

    const ranked: Outlet[] = [];
    const seenIds: Record<string, boolean> = {};
    optimizedRoute.orderedIds.forEach((id) => {
      if (byId[id]) {
        ranked.push(byId[id]);
        seenIds[id] = true;
      }
    });
    filteredOutlets.forEach((o) => {
      if (!seenIds[o.id]) {
        ranked.push(o);
      }
    });
    return ranked;
  }, [filteredOutlets, autoOptimize, optimizedRoute]);

  const legByOutletId = useMemo(() => {
    const rec: Record<string, { distanceMeters: number; durationSeconds: number }> = {};
    if (!optimizedRoute) return rec;
    optimizedRoute.legs.forEach((leg) => {
      rec[leg.toId] = {
        distanceMeters: leg.distanceMeters,
        durationSeconds: leg.durationSeconds
      };
    });
    return rec;
  }, [optimizedRoute]);

  // Keep selectedOutletId valid when list filters change
  useEffect(() => {
    if (orderedOutlets.length === 0) {
      setSelectedOutletId(null);
      return;
    }
    const stillVisible = orderedOutlets.some((o) => o.id === selectedOutletId);
    if (!stillVisible) {
      setSelectedOutletId(orderedOutlets[0].id);
    }
  }, [orderedOutlets, selectedOutletId]);

  const selectedOutlet = useMemo(
    () => orderedOutlets.find((o) => o.id === selectedOutletId) || orderedOutlets[0] || null,
    [orderedOutlets, selectedOutletId]
  );

  const mapItems: PjpMapOutletItem[] = useMemo(() => {
    return orderedOutlets.map((o, idx) => {
      const leg = legByOutletId[o.id];
      return {
        outlet: o,
        coords: outletCoordsRecord[o.id] || resolveOutletCoordinates(o, idx),
        stopNumber: autoOptimize ? idx + 1 : undefined,
        legDistanceMeters: leg?.distanceMeters,
        legDurationSeconds: leg?.durationSeconds
      };
    });
  }, [orderedOutlets, outletCoordsRecord, legByOutletId, autoOptimize]);

  const selectedIndex = selectedOutlet
    ? orderedOutlets.findIndex((o) => o.id === selectedOutlet.id)
    : -1;
  const selectedDoneCount = selectedOutlet
    ? Object.values(selectedOutlet.progress).filter((s) => s === 'Completed').length
    : 0;
  const selectedIsDone = selectedOutlet ? selectedDoneCount === 3 : false;
  const selectedPlanograms = selectedOutlet
    ? outletPlanogramsRecord[selectedOutlet.id] || []
    : [];
  const selectedLeg = selectedOutlet ? legByOutletId[selectedOutlet.id] : undefined;

  return (
    <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full h-full overflow-hidden px-3.5 pt-3 md:px-6 md:pt-4 select-none animate-fade-in">
      {/* Idea 1: Compact Unified Mission Bar */}
      <div className="glass-panel rounded-2xl p-3 md:px-4 md:py-3 shrink-0 space-y-2.5">
        {/* Top Row: Identity + Linear Progress + SAP Match + Sync */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--accent-primary)]">
              PJP Route
            </span>
            <span className="opacity-30 text-xs">&middot;</span>
            <span className="text-sm font-extrabold text-[var(--text-primary)] truncate">
              {executive?.name || 'Qatar Modern Trade'}
            </span>
            <span className="font-mono text-[11px] font-bold text-[var(--text-secondary)]">
              {executive?.repId || '#9'}
            </span>
            <a
              href={PJP_GOOGLE_SHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent-primary)] hover:underline ml-0.5"
              title="Open Master PJP Sheet"
            >
              <FileSpreadsheet size={12} />
              <span>PJP Sheet</span>
            </a>
          </div>

          <div className="flex items-center gap-3 flex-wrap ml-auto">
            {/* Compact Linear Progress Track */}
            <div className="flex items-center gap-2 min-w-[165px]">
              <span className="text-[11px] font-bold tabular-nums text-[var(--text-primary)] whitespace-nowrap">
                {completedCount}/{totalCount} Stores
              </span>
              <div
                className={`w-20 h-1.5 rounded-sm overflow-hidden ${
                  isDark ? 'bg-white/10' : 'bg-[#084C41]/12'
                }`}
              >
                <div
                  className="h-full bg-[var(--accent-primary)] transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[11px] font-extrabold tabular-nums text-[var(--accent-primary)]">
                {percent}%
              </span>
            </div>

            <span className="hidden sm:inline-block opacity-25 text-xs">|</span>

            {/* Compact SAP Match + Sync */}
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)] tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Layers size={12} className="text-[var(--accent-primary)] shrink-0" />
                <span>
                  SAP <strong className="text-[var(--text-primary)]">{sapMatchSummary.matchedOutletsCount}</strong>/{totalCount}
                </span>
              </span>
              {onRefreshMatch && (
                <button
                  type="button"
                  onClick={onRefreshMatch}
                  disabled={isSyncingMatch}
                  className="min-h-[28px] px-2 py-1 rounded-lg glass-subtle text-[11px] font-bold text-[var(--accent-primary)] flex items-center gap-1 cursor-pointer hover:brightness-105 active:scale-95"
                  title="Sync PJP & Planograms by SAP Code"
                >
                  <RefreshCw size={11} className={isSyncingMatch ? 'animate-spin' : ''} />
                  <span>{isSyncingMatch ? 'Syncing' : 'Sync'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Row: Segmented Tabs + Auto Optimize Toggle + Add Store */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-glass)]">
          <div
            role="tablist"
            aria-label="Filter route outlets"
            className="flex items-center p-1 glass-subtle rounded-xl overflow-x-auto no-scrollbar max-w-full"
          >
            {(
              [
                { id: 'ALL', label: `All (${totalCount})` },
                { id: 'PENDING', label: `Pending (${pendingCount})` },
                { id: 'PLANOGRAM', label: `Planogram (${planogramMatchedCount})` },
                { id: 'DONE', label: `Done (${completedCount})` }
              ] as const
            ).map((tab) => {
              const isSelected = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[34px] px-2.5 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer tabular-nums ${
                    isSelected
                      ? isDark
                        ? 'bg-[#10B981] text-[#05231C] font-bold shadow-sm'
                        : 'bg-[#084C41] text-white font-bold shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Idea 2: Auto Optimize Toggle Button */}
            <button
              type="button"
              onClick={handleToggleAutoOptimize}
              disabled={isOptimizing || filteredOutlets.length === 0}
              aria-pressed={autoOptimize}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 whitespace-nowrap border ${
                autoOptimize
                  ? isDark
                    ? 'bg-[#10B981] text-[#05231C] border-[#34D399] shadow-sm'
                    : 'bg-[#084C41] text-white border-[#084C41] shadow-sm'
                  : isDark
                  ? 'glass-subtle text-[#ECFDF5] border-white/15 hover:bg-white/10'
                  : 'glass-subtle text-[#084C41] border-[#084C41]/25 hover:bg-white/95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title="Optimize driving sequence using Google Maps Routes API"
            >
              {isOptimizing ? (
                <RefreshCw size={14} className="animate-spin shrink-0" />
              ) : (
                <RouteIcon size={14} className="shrink-0" />
              )}
              <span>{isOptimizing ? 'Optimizing...' : 'Auto Optimize'}</span>
              {autoOptimize && optimizedRoute && !isOptimizing && (
                <span className="text-[10px] font-extrabold opacity-90 pl-1 border-l border-current/25 tabular-nums">
                  {formatDistance(optimizedRoute.totalDistanceMeters)} ·{' '}
                  {formatDuration(optimizedRoute.totalDurationSeconds)}
                </span>
              )}
            </button>

            {/* Mobile collapsible map preview toggle */}
            <button
              type="button"
              onClick={() => setShowMobileMap((v) => !v)}
              className={`md:hidden min-h-[38px] px-2.5 py-1.5 rounded-xl glass-subtle text-xs font-bold flex items-center gap-1 cursor-pointer border ${
                showMobileMap
                  ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                  : 'border-[var(--border-glass)] text-[var(--text-secondary)]'
              }`}
              title="Toggle Map Preview"
            >
              <MapIcon size={14} />
              <span>Map</span>
              {showMobileMap ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              type="button"
              onClick={onOpenAddModal}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl glass-subtle border border-[var(--border-glass)] text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap ${
                isDark
                  ? 'text-[#34D399] hover:bg-white/10'
                  : 'text-[#084C41] hover:bg-white/95'
              }`}
            >
              <Plus size={14} />
              <span>Add Store</span>
            </button>
          </div>
        </div>

        {/* Route Error / Status Strip */}
        {routeError && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="truncate">{routeError}</span>
          </div>
        )}
      </div>

      {/* Main Content Area: 1-Col on Mobile, Split View (Left List + Right Sticky Details & Map) on Tablet/Desktop */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3.5 pt-3 overflow-hidden">
        {/* Mobile Collapsible Map Preview */}
        {showMobileMap && orderedOutlets.length > 0 && (
          <div className="md:hidden h-56 shrink-0">
            <PjpGoogleMap
              items={mapItems}
              selectedOutletId={selectedOutletId}
              onSelectOutletId={setSelectedOutletId}
              onStartAudit={onSelectOutlet}
              autoOptimize={autoOptimize}
              origin={optimizedRoute?.origin || null}
              encodedPolyline={optimizedRoute?.encodedPolyline}
              isDark={isDark}
            />
          </div>
        )}

        {/* Left Column (Mobile Full-Width List / Desktop-Tablet 45% Scrollable List) */}
        <div className="w-full md:w-[46%] lg:w-[44%] flex-1 md:flex-none overflow-y-auto pr-0.5 pb-24 md:pb-4 space-y-2.5">
          {autoOptimize && optimizedRoute && (
            <div className="glass-subtle rounded-xl px-3 py-2 flex items-center justify-between gap-2 text-[11px] font-semibold text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5 text-[var(--accent-primary)] font-bold">
                <Navigation size={12} />
                <span>
                  Origin:{' '}
                  {optimizedRoute.origin.source === 'gps'
                    ? 'Current GPS Location'
                    : 'Old Doha Port (Fallback)'}
                </span>
              </span>
              <span className="tabular-nums font-bold text-[var(--text-primary)]">
                Total: {formatDistance(optimizedRoute.totalDistanceMeters)} ·{' '}
                {formatDuration(optimizedRoute.totalDurationSeconds)}
              </span>
            </div>
          )}

          {orderedOutlets.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center text-center min-h-[220px]">
              <CheckCircle2 size={32} className="text-[var(--accent-primary)] opacity-50 mb-2" />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                No stores in this view
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Switch filter to inspect all assigned stores
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orderedOutlets.map((outlet, index) => {
                const doneCategoryCount = Object.values(outlet.progress).filter(
                  (s) => s === 'Completed'
                ).length;
                const isDone = doneCategoryCount === 3;
                const matchedPlans = outletPlanogramsRecord[outlet.id] || [];
                const isSelected = selectedOutlet?.id === outlet.id;
                const leg = legByOutletId[outlet.id];
                const isLast = index === orderedOutlets.length - 1;

                return (
                  <div key={outlet.id} className="relative flex items-stretch gap-2.5">
                    {/* Idea 2 Timeline Column: ONLY visible when Auto Optimize is ON */}
                    {autoOptimize && (
                      <div className="flex flex-col items-center w-7 shrink-0 pt-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-extrabold tabular-nums z-10 shadow-xs ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isSelected
                              ? isDark
                                ? 'bg-[#10B981] text-[#05231C]'
                                : 'bg-[#084C41] text-white'
                              : isDark
                              ? 'bg-white/15 text-[var(--text-primary)]'
                              : 'bg-[#084C41]/15 text-[#084C41]'
                          }`}
                        >
                          {index + 1}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 flex-1 mt-1 rounded-full ${
                              isDark ? 'bg-emerald-500/30' : 'bg-[#084C41]/25'
                            }`}
                          />
                        )}
                      </div>
                    )}

                    {/* Idea 5: Tactical Outlet Card */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedOutletId(outlet.id);
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          onSelectOutlet(outlet);
                        }
                      }}
                      onDoubleClick={() => onSelectOutlet(outlet)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectOutlet(outlet);
                        }
                      }}
                      className={`flex-1 min-w-0 glass-panel rounded-2xl p-3.5 text-left transition-all cursor-pointer group flex flex-col gap-2.5 border ${
                        isSelected
                          ? isDark
                            ? 'border-[#34D399]/70 ring-1 ring-[#34D399]/35 bg-white/[0.06]'
                            : 'border-[#084C41]/55 ring-1 ring-[#084C41]/25 bg-white/95'
                          : 'border-[var(--border-glass)] hover:border-[var(--border-glass-strong)]'
                      }`}
                    >
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-secondary)] flex-wrap">
                            {outlet.code && (
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-[var(--text-primary)]">
                                SAP {outlet.code}
                              </span>
                            )}
                            {matchedPlans.length > 0 && (
                              <span className="text-[var(--accent-primary)] font-bold">
                                Planogram (
                                {matchedPlans
                                  .map((p) => (p.category === 'Edible Oil' ? 'Oil' : p.category))
                                  .join(', ')}
                                )
                              </span>
                            )}
                            {outlet.isUnmapped && (
                              <span className="text-amber-600 dark:text-amber-400 font-bold">
                                Unmapped
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-primary)] transition-colors truncate">
                            {outlet.name}
                          </h3>

                          <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1 truncate">
                            <MapPin size={11} className="text-[var(--accent-primary)] shrink-0" />
                            <span className="truncate">{outlet.branch}</span>
                          </p>
                        </div>

                        {autoOptimize && leg && (
                          <div className="text-right shrink-0">
                            <span className="inline-block text-[10px] font-bold tabular-nums px-2 py-1 rounded-lg glass-subtle text-[var(--text-primary)]">
                              {formatDistance(leg.distanceMeters)} · {formatDuration(leg.durationSeconds)}
                            </span>
                          </div>
                        )}
                      </div>

                      {outlet.unmappedRemark && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 truncate">
                          Note: {outlet.unmappedRemark}
                        </p>
                      )}

                      {/* Bottom Tactical Row: Idea 3 Category X/3 + Idea 5 Direct CTA */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-glass)]">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap text-xs">
                          <span className="font-bold tabular-nums text-[var(--text-primary)] whitespace-nowrap">
                            Category:{' '}
                            <span
                              className={
                                isDone
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-[var(--accent-primary)]'
                              }
                            >
                              {doneCategoryCount}/3
                            </span>
                          </span>
                          <span className="opacity-30 hidden sm:inline">&middot;</span>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                            <span
                              className={
                                outlet.progress['Edible Oil'] === 'Completed'
                                  ? 'text-[var(--accent-primary)] font-bold'
                                  : 'text-[var(--text-muted)]'
                              }
                            >
                              Oil
                            </span>
                            <span className="opacity-30">&middot;</span>
                            <span
                              className={
                                outlet.progress['Flour'] === 'Completed'
                                  ? 'text-[var(--accent-primary)] font-bold'
                                  : 'text-[var(--text-muted)]'
                              }
                            >
                              Flour
                            </span>
                            <span className="opacity-30">&middot;</span>
                            <span
                              className={
                                outlet.progress['Pasta'] === 'Completed'
                                  ? 'text-[var(--accent-primary)] font-bold'
                                  : 'text-[var(--text-muted)]'
                              }
                            >
                              Pasta
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectOutlet(outlet);
                          }}
                          className={`min-h-[34px] px-3 py-1.5 rounded-xl text-[11px] font-extrabold tracking-wide uppercase flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 ${
                            isDone
                              ? isDark
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                              : isDark
                              ? 'bg-[#10B981] text-[#05231C] hover:brightness-110 shadow-xs'
                              : 'bg-[#084C41] text-white hover:bg-[#063A32] shadow-xs'
                          }`}
                        >
                          {isDone ? (
                            <>
                              <Eye size={12} />
                              <span>VIEW AUDIT</span>
                            </>
                          ) : (
                            <>
                              <span>START AUDIT</span>
                              <ArrowRight size={12} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Idea 4: Right Sticky Split-View Panel on Tablet & Desktop (Store Details + Interactive Google Map) */}
        <div className="hidden md:flex md:flex-1 flex-col gap-3 min-w-0 min-h-0 pb-4">
          {selectedOutlet ? (
            <>
              <div className="glass-panel rounded-2xl p-3.5 shrink-0 space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                      {autoOptimize && selectedIndex >= 0 && (
                        <span className="px-2 py-0.5 rounded-md bg-[var(--accent-primary)] text-white dark:text-[#05231C] tabular-nums">
                          Stop #{selectedIndex + 1} of {orderedOutlets.length}
                        </span>
                      )}
                      {selectedOutlet.code && (
                        <span className="font-mono px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/10 text-[var(--text-primary)]">
                          SAP {selectedOutlet.code}
                        </span>
                      )}
                      <span className="text-[var(--text-secondary)]">
                        Category:{' '}
                        <strong className="text-[var(--accent-primary)] tabular-nums">
                          {selectedDoneCount}/3
                        </strong>
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[var(--text-primary)] truncate">
                      {selectedOutlet.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] truncate">
                      {selectedOutlet.address || selectedOutlet.branch}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectOutlet(selectedOutlet)}
                    className={`min-h-[38px] px-3.5 py-2 rounded-xl text-xs font-extrabold tracking-wide uppercase flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 ${
                      selectedIsDone
                        ? isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                        : isDark
                        ? 'bg-[#10B981] text-[#05231C] hover:brightness-110 shadow-sm'
                        : 'bg-[#084C41] text-white hover:bg-[#063A32] shadow-sm'
                    }`}
                  >
                    {selectedIsDone ? (
                      <>
                        <Eye size={13} />
                        <span>VIEW AUDIT</span>
                      </>
                    ) : (
                      <>
                        <span>START AUDIT</span>
                        <ArrowRight size={13} />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border-glass)] text-[11px] text-[var(--text-secondary)] flex-wrap">
                  <span>
                    {selectedPlanograms.length > 0 ? (
                      <>
                        Planogram Matches:{' '}
                        <strong className="text-[var(--accent-primary)]">
                          {selectedPlanograms
                            .map((p) => (p.category === 'Edible Oil' ? 'Oil' : p.category))
                            .join(', ')}
                        </strong>
                      </>
                    ) : (
                      'Standard Audit Mode (Oil · Flour · Pasta)'
                    )}
                  </span>

                  {autoOptimize && selectedLeg && (
                    <span className="font-bold text-[var(--text-primary)] tabular-nums">
                      Leg: {formatDistance(selectedLeg.distanceMeters)} ·{' '}
                      {formatDuration(selectedLeg.durationSeconds)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 min-h-[280px]">
                <PjpGoogleMap
                  items={mapItems}
                  selectedOutletId={selectedOutlet.id}
                  onSelectOutletId={setSelectedOutletId}
                  onStartAudit={onSelectOutlet}
                  autoOptimize={autoOptimize}
                  origin={optimizedRoute?.origin || null}
                  encodedPolyline={optimizedRoute?.encodedPolyline}
                  isDark={isDark}
                />
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-2xl flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-secondary)]">
              <MapPin size={28} className="text-[var(--accent-primary)] opacity-50 mb-2" />
              Select a store to view branch details and route map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
