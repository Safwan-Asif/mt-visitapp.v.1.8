import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { MapPin, ArrowRight, Eye } from 'lucide-react';
import {
  CategoryAuditRecord,
  Outlet,
  PlanogramRecord,
  UserProfile
} from '../types';
import { useTheme } from '../ThemeContext';
import {
  LivePjpDataset,
  OLD_DOHA_PORT_FALLBACK,
  OptimizedPjpRouteResult,
  OptimizedRouteLeg,
  getCachedLivePjpData,
  loadTodayCustomPjpRoute,
  optimizePjpRouteWithGoogleMaps,
  resolveOutletCoordinates
} from '../services/pjpService';
import { PjpGoogleMap, PjpMapOutletItem } from './PjpGoogleMap';
import { PjpLandingView } from './pjp/PjpLandingView';
import { PjpListView } from './pjp/PjpListView';
import { PjpMapView } from './pjp/PjpMapView';
import { PreVisitOutletDetailsView } from './pjp/PreVisitOutletDetailsView';

type PjpStage = 'landing' | 'route' | 'details';
type PjpViewMode = 'list' | 'map';

interface PJPScreenProps {
  outlets: Outlet[];
  assignedPool?: Outlet[];
  audits?: Record<string, CategoryAuditRecord>;
  livePjpDataset?: LivePjpDataset;
  onSelectOutlet: (outlet: Outlet) => void;
  onOpenAddModal: () => void;
  isCustomRoute?: boolean;
  onResetCustomRoute?: () => void;
  onSaveCustomRoute?: (
    nextOutlets: Outlet[],
    meta?: {
      notice?: string;
      totalDistanceMeters?: number;
      totalDurationSeconds?: number;
      legs?: OptimizedRouteLeg[];
    }
  ) => void;
  onBackToGeoIntel?: () => void;
  onViewDailySummary?: () => void;
  onOutletDetailOpenChange?: (isOpen: boolean) => void;
  executive?: UserProfile | null;
  planograms?: PlanogramRecord[];
  isSyncingMatch?: boolean;
  onRefreshMatch?: () => void;
  requestedFilter?: {
    value: 'ALL' | 'PENDING' | 'PLANOGRAM' | 'DONE';
    nonce: number;
  } | null;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateRoadSequenceMetrics(
  origin: { lat: number; lng: number },
  orderedList: Outlet[],
  coordsById: Record<string, { lat: number; lng: number }>
): {
  legs: OptimizedRouteLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
} {
  const legs: OptimizedRouteLeg[] = [];
  let prevId = 'origin';
  let prevLat = origin.lat;
  let prevLng = origin.lng;
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;

  orderedList.forEach((o, idx) => {
    const c = coordsById[o.id] || resolveOutletCoordinates(o, idx);
    const roadDist = Math.round(haversineMeters(prevLat, prevLng, c.lat, c.lng) * 1.28);
    const roadSec = orderedList.length > 0 ? Math.max(120, Math.round(roadDist / 7.8 + 90)) : 0;
    legs.push({
      fromId: prevId,
      toId: o.id,
      distanceMeters: roadDist,
      durationSeconds: roadSec
    });
    totalDistanceMeters += roadDist;
    totalDurationSeconds += roadSec;
    prevId = o.id;
    prevLat = c.lat;
    prevLng = c.lng;
  });

  return { legs, totalDistanceMeters, totalDurationSeconds };
}

function nearestNeighborOrder(
  origin: { lat: number; lng: number },
  list: Outlet[],
  coordsById: Record<string, { lat: number; lng: number }>
): Outlet[] {
  const remaining = [...list];
  const result: Outlet[] = [];
  let curLat = origin.lat;
  let curLng = origin.lng;

  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = coordsById[remaining[i].id] || resolveOutletCoordinates(remaining[i], i);
      const d = haversineMeters(curLat, curLng, c.lat, c.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [chosen] = remaining.splice(bestIdx, 1);
    result.push(chosen);
    const chosenCoords = coordsById[chosen.id] || resolveOutletCoordinates(chosen, 0);
    curLat = chosenCoords.lat;
    curLng = chosenCoords.lng;
  }

  return result;
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
    }, 3500);

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
      { enableHighAccuracy: false, timeout: 3200, maximumAge: 60000 }
    );
  });
}

const VIEW_MODE_KEY = 'mta_pjp_view_mode_v2';

export const PJPScreen: React.FC<PJPScreenProps> = ({
  outlets,
  assignedPool,
  audits = {},
  livePjpDataset,
  onSelectOutlet,
  onOpenAddModal,
  isCustomRoute = false,
  onResetCustomRoute,
  onSaveCustomRoute,
  onViewDailySummary,
  onOutletDetailOpenChange,
  executive,
  planograms = [],
  isSyncingMatch = false,
  onRefreshMatch,
  requestedFilter
}) => {
  const { isDark } = useTheme();
  const [stage, setStage] = useState<PjpStage>(() =>
    requestedFilter?.value === 'PENDING' ? 'route' : 'landing'
  );
  const [viewMode, setViewMode] = useState<PjpViewMode>(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY);
      if (saved === 'list' || saved === 'map') return saved;
    } catch {}
    return 'list';
  });

  const handleChangeViewMode = useCallback((mode: PjpViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {}
  }, []);

  useEffect(() => {
    if (requestedFilter?.value === 'PENDING') {
      setStage('route');
      handleChangeViewMode('list');
    }
  }, [requestedFilter, handleChangeViewMode]);

  const [savedToast, setSavedToast] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [routeNotice, setRouteNotice] = useState<string | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedPjpRouteResult | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const showToast = useCallback((msg: string) => {
    setSavedToast(msg);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => setSavedToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const fixedOutlets = useMemo(() => {
    const pool = assignedPool && assignedPool.length > 0 ? assignedPool : outlets;
    if (!isCustomRoute || outlets.length === 0) {
      return pool;
    }
    const poolById = new Map<string, Outlet>();
    pool.forEach((o) => poolById.set(o.id, o));
    const ordered: Outlet[] = [];
    const seen = new Set<string>();

    outlets.forEach((o) => {
      const fresh = poolById.get(o.id) || o;
      if (!seen.has(fresh.id)) {
        seen.add(fresh.id);
        ordered.push(fresh);
      }
    });
    pool.forEach((o) => {
      if (!seen.has(o.id)) {
        seen.add(o.id);
        ordered.push(o);
      }
    });
    return ordered;
  }, [outlets, assignedPool, isCustomRoute]);

  const [routeIds, setRouteIds] = useState<string[]>(() => fixedOutlets.map((o) => o.id));
  const [activeDetailOutletId, setActiveDetailOutletId] = useState<string | null>(
    () => fixedOutlets[0]?.id || null
  );

  const fixedSignature = useMemo(() => fixedOutlets.map((o) => o.id).join('|'), [fixedOutlets]);
  useEffect(() => {
    setRouteIds(fixedOutlets.map((o) => o.id));
  }, [fixedSignature, isCustomRoute]);

  useEffect(() => {
    if (!isCustomRoute) {
      setOptimizedRoute(null);
      setRouteNotice(null);
      return;
    }
    const saved = loadTodayCustomPjpRoute(executive?.username);
    if (saved) {
      if (saved.notice) {
        setRouteNotice(saved.notice);
      }
      if (
        typeof saved.totalDistanceMeters === 'number' &&
        typeof saved.totalDurationSeconds === 'number'
      ) {
        setOptimizedRoute({
          orderedIds: saved.orderedIds,
          legs: saved.legs || [],
          totalDistanceMeters: saved.totalDistanceMeters,
          totalDurationSeconds: saved.totalDurationSeconds,
          encodedPolyline: '',
          origin: {
            lat: OLD_DOHA_PORT_FALLBACK.lat,
            lng: OLD_DOHA_PORT_FALLBACK.lng,
            source: 'old_doha_port'
          }
        });
      }
    }
  }, [isCustomRoute, executive?.username]);

  const catalogById = useMemo(() => {
    const map = new Map<string, Outlet>();
    fixedOutlets.forEach((o) => map.set(o.id, o));
    return map;
  }, [fixedOutlets]);

  const scheduledRouteOutlets = useMemo(() => {
    return routeIds
      .map((id) => catalogById.get(id))
      .filter((o): o is Outlet => Boolean(o));
  }, [routeIds, catalogById]);

  const outletCoordsRecord = useMemo(() => {
    const rec: Record<string, { lat: number; lng: number }> = {};
    fixedOutlets.forEach((o, idx) => {
      rec[o.id] = resolveOutletCoordinates(o, idx);
    });
    return rec;
  }, [fixedOutlets]);

  const runRouteOptimization = useCallback(
    async (targetList: Outlet[]) => {
      if (targetList.length === 0) return;
      setIsOptimizing(true);
      setRouteNotice(null);

      const persistOptimized = (
        reordered: Outlet[],
        metrics: {
          legs: OptimizedRouteLeg[];
          totalDistanceMeters: number;
          totalDurationSeconds: number;
        },
        noticeLabel: string
      ) => {
        const total = reordered.length;
        const finalized = reordered.map((o, idx) => ({
          ...o,
          sequence: `${idx + 1} of ${total}`
        }));
        setRouteIds(finalized.map((o) => o.id));
        setRouteNotice(noticeLabel);
        if (onSaveCustomRoute) {
          onSaveCustomRoute(finalized, {
            notice: noticeLabel,
            totalDistanceMeters: metrics.totalDistanceMeters,
            totalDurationSeconds: metrics.totalDurationSeconds,
            legs: metrics.legs
          });
        }
        showToast('Route optimised & saved for today — resets automatically tomorrow');
      };

      try {
        const origin = await resolveStartOrigin();
        const waypoints = targetList.map((o, idx) => {
          const c = outletCoordsRecord[o.id] || resolveOutletCoordinates(o, idx);
          return { id: o.id, lat: c.lat, lng: c.lng };
        });
        const res = await optimizePjpRouteWithGoogleMaps(origin, waypoints);
        if (res && res.orderedIds.length === targetList.length) {
          const mapById = new Map<string, Outlet>();
          targetList.forEach((o) => mapById.set(o.id, o));
          const reorderedOutlets = res.orderedIds
            .map((id) => mapById.get(id))
            .filter((o): o is Outlet => Boolean(o));
          if (reorderedOutlets.length === targetList.length) {
            setOptimizedRoute({
              ...res,
              origin
            });
            persistOptimized(
              reorderedOutlets,
              {
                legs: res.legs,
                totalDistanceMeters: res.totalDistanceMeters,
                totalDurationSeconds: res.totalDurationSeconds
              },
              'Optimised Today · Resets Midnight'
            );
            return;
          }
        }

        const fallbackOrdered = nearestNeighborOrder(origin, targetList, outletCoordsRecord);
        const est = estimateRoadSequenceMetrics(origin, fallbackOrdered, outletCoordsRecord);
        setOptimizedRoute({
          orderedIds: fallbackOrdered.map((o) => o.id),
          legs: est.legs,
          totalDistanceMeters: est.totalDistanceMeters,
          totalDurationSeconds: est.totalDurationSeconds,
          encodedPolyline: '',
          origin
        });
        persistOptimized(fallbackOrdered, est, 'Optimised Today · Resets Midnight');
      } catch {
        const origin = {
          lat: OLD_DOHA_PORT_FALLBACK.lat,
          lng: OLD_DOHA_PORT_FALLBACK.lng,
          source: 'old_doha_port' as const
        };
        const fallbackOrdered = nearestNeighborOrder(origin, targetList, outletCoordsRecord);
        const est = estimateRoadSequenceMetrics(origin, fallbackOrdered, outletCoordsRecord);
        setOptimizedRoute({
          orderedIds: fallbackOrdered.map((o) => o.id),
          legs: est.legs,
          totalDistanceMeters: est.totalDistanceMeters,
          totalDurationSeconds: est.totalDurationSeconds,
          encodedPolyline: '',
          origin
        });
        persistOptimized(fallbackOrdered, est, 'Optimised Today · Resets Midnight');
      } finally {
        setIsOptimizing(false);
      }
    },
    [outletCoordsRecord, onSaveCustomRoute, showToast]
  );

  const handleResetToSchedule = useCallback(() => {
    setOptimizedRoute(null);
    setRouteNotice(null);
    if (onResetCustomRoute) {
      onResetCustomRoute();
    }
    showToast('Restored original PJP Schedule stop order');
  }, [onResetCustomRoute, showToast]);

  const legByOutletId = useMemo(() => {
    const map: Record<string, OptimizedRouteLeg> = {};
    if (optimizedRoute && optimizedRoute.legs) {
      optimizedRoute.legs.forEach((l) => {
        map[l.toId] = l;
      });
    }
    return map;
  }, [optimizedRoute]);

  const defaultEstimatedMetrics = useMemo(() => {
    const origin = { lat: OLD_DOHA_PORT_FALLBACK.lat, lng: OLD_DOHA_PORT_FALLBACK.lng };
    return estimateRoadSequenceMetrics(origin, scheduledRouteOutlets, outletCoordsRecord);
  }, [scheduledRouteOutlets, outletCoordsRecord]);

  const estimatedLegsById = useMemo(() => {
    const map: Record<string, OptimizedRouteLeg> = {};
    defaultEstimatedMetrics.legs.forEach((l) => {
      map[l.toId] = l;
    });
    return map;
  }, [defaultEstimatedMetrics]);

  const displayDistanceMeters =
    optimizedRoute?.totalDistanceMeters ?? defaultEstimatedMetrics.totalDistanceMeters;
  const displayDurationSeconds =
    optimizedRoute?.totalDurationSeconds ?? defaultEstimatedMetrics.totalDurationSeconds;

  const activeDetailOutlet = useMemo(() => {
    return (
      catalogById.get(activeDetailOutletId || '') ||
      scheduledRouteOutlets[0] ||
      null
    );
  }, [catalogById, activeDetailOutletId, scheduledRouteOutlets]);

  const mapItems: PjpMapOutletItem[] = useMemo(() => {
    return scheduledRouteOutlets.map((o, idx) => {
      const leg = legByOutletId[o.id];
      return {
        outlet: o,
        coords: outletCoordsRecord[o.id] || resolveOutletCoordinates(o, idx),
        stopNumber: idx + 1,
        legDistanceMeters: leg?.distanceMeters,
        legDurationSeconds: leg?.durationSeconds
      };
    });
  }, [scheduledRouteOutlets, outletCoordsRecord, legByOutletId]);

  const activeDataset = livePjpDataset || getCachedLivePjpData();

  const openOutletDetails = useCallback((outlet: Outlet) => {
    setActiveDetailOutletId(outlet.id);
    setStage('details');
  }, []);

  const isDetailsStageOpen = stage === 'details' && Boolean(activeDetailOutlet);

  useEffect(() => {
    onOutletDetailOpenChange?.(isDetailsStageOpen);
  }, [isDetailsStageOpen, onOutletDetailOpenChange]);

  useEffect(() => {
    return () => {
      onOutletDetailOpenChange?.(false);
    };
  }, [onOutletDetailOpenChange]);

  const activeDoneCount = activeDetailOutlet
    ? Object.values(activeDetailOutlet.progress).filter((s) => s === 'Completed').length
    : 0;
  const activeIsDone = activeDoneCount === 3;
  const activeStopIndex = activeDetailOutlet
    ? Math.max(1, scheduledRouteOutlets.findIndex((o) => o.id === activeDetailOutlet.id) + 1)
    : 1;

  const mapOrigin = optimizedRoute?.origin || {
    lat: OLD_DOHA_PORT_FALLBACK.lat,
    lng: OLD_DOHA_PORT_FALLBACK.lng,
    source: 'old_doha_port' as const
  };

  return (
    <div className="flex-1 flex flex-col w-full h-full overflow-hidden select-none pjp-atmospheric-canvas">
      <div className="flex-1 min-h-0 flex flex-col md:flex-row max-w-7xl mx-auto w-full md:px-6 md:py-4 md:gap-5 overflow-hidden">
        {/* LEFT / MOBILE PRIMARY VIEWPORT */}
        <div className="w-full md:w-[46%] lg:w-[43%] flex-1 md:flex-none flex flex-col min-h-0 overflow-hidden">
          {stage === 'landing' && (
            <PjpLandingView
              outlets={scheduledRouteOutlets}
              executive={executive}
              isSyncingMatch={isSyncingMatch}
              onRefreshSync={onRefreshMatch}
              onStartRoute={() => setStage('route')}
              onSelectOutletDetails={openOutletDetails}
              onViewDailySummary={onViewDailySummary}
            />
          )}

          {stage === 'route' && (
            <>
              {/* Mobile switches between List & Map; Desktop keeps List in Left Column while Map sits in Right Column */}
              <div className={viewMode === 'map' ? 'hidden md:flex md:flex-1 md:flex-col md:min-h-0' : 'flex-1 flex flex-col min-h-0'}>
                <PjpListView
                  outlets={scheduledRouteOutlets}
                  selectedOutletId={activeDetailOutlet?.id || null}
                  viewMode={viewMode}
                  onChangeViewMode={handleChangeViewMode}
                  onBackToLanding={() => setStage('landing')}
                  onSelectOutletDetails={openOutletDetails}
                  isOptimizing={isOptimizing}
                  isCustomRoute={isCustomRoute}
                  routeNotice={routeNotice}
                  onAutoOptimise={() => runRouteOptimization(scheduledRouteOutlets)}
                  onResetRoute={handleResetToSchedule}
                  onOpenAddModal={onOpenAddModal}
                  legByOutletId={legByOutletId}
                  totalDistanceMeters={displayDistanceMeters}
                  totalDurationSeconds={displayDurationSeconds}
                  savedToast={savedToast}
                />
              </div>

              {viewMode === 'map' && (
                <div className="flex-1 flex flex-col min-h-0 md:hidden">
                  <PjpMapView
                    outlets={scheduledRouteOutlets}
                    mapItems={mapItems}
                    selectedOutletId={activeDetailOutlet?.id || null}
                    onSelectOutletId={setActiveDetailOutletId}
                    onSelectOutletDetails={openOutletDetails}
                    viewMode={viewMode}
                    onChangeViewMode={handleChangeViewMode}
                    onBackToLanding={() => setStage('landing')}
                    origin={mapOrigin}
                    encodedPolyline={optimizedRoute?.encodedPolyline}
                    isDark={isDark}
                    isOptimizing={isOptimizing}
                    isCustomRoute={isCustomRoute}
                    onAutoOptimise={() => runRouteOptimization(scheduledRouteOutlets)}
                    onResetRoute={handleResetToSchedule}
                    legByOutletId={legByOutletId}
                    estimatedLegsById={estimatedLegsById}
                  />
                </div>
              )}
            </>
          )}

          {stage === 'details' && activeDetailOutlet && (
            <PreVisitOutletDetailsView
              outlet={activeDetailOutlet}
              stopNumber={activeStopIndex}
              totalStops={scheduledRouteOutlets.length}
              audits={audits}
              livePjpDataset={activeDataset}
              planograms={planograms}
              onBack={() => setStage('route')}
              onStartStoreAudit={onSelectOutlet}
            />
          )}
        </div>

        {/* DESKTOP SPLIT RIGHT COLUMN: Active Stop Banner + Interactive Route Map */}
        <div className="hidden md:flex md:flex-1 flex-col gap-3 min-w-0 min-h-0">
          {activeDetailOutlet ? (
            <>
              <div className="glass-panel rounded-3xl p-4 shrink-0 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                    <span className="px-2.5 py-0.5 rounded-full btn-electric-blue text-white tabular-nums">
                      Stop #{activeStopIndex} of {scheduledRouteOutlets.length}
                    </span>
                    {activeDetailOutlet.code && (
                      <span className="font-mono px-2 py-0.5 rounded-full glass-subtle text-[var(--text-primary)]">
                        SAP {activeDetailOutlet.code}
                      </span>
                    )}
                    <span className="text-[var(--text-secondary)]">
                      Categories:{' '}
                      <strong className="text-[#008DFF] dark:text-[#00C8FF] tabular-nums">
                        {activeDoneCount}/3
                      </strong>
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] truncate">
                    {activeDetailOutlet.name}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {activeDetailOutlet.address || activeDetailOutlet.branch}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOutlet(activeDetailOutlet)}
                  className={`min-h-[42px] px-4 py-2 rounded-full text-xs font-extrabold tracking-wide flex items-center gap-1.5 shrink-0 cursor-pointer transition-all active:scale-95 ${
                    activeIsDone ? 'btn-emerald-glow' : 'btn-electric-blue'
                  }`}
                >
                  {activeIsDone ? (
                    <>
                      <Eye size={14} />
                      <span>View Audit</span>
                    </>
                  ) : (
                    <>
                      <span>Start Audit</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 min-h-[280px] rounded-3xl overflow-hidden border border-[var(--border-glass-strong)] shadow-xl">
                <PjpGoogleMap
                  items={mapItems}
                  selectedOutletId={activeDetailOutlet.id}
                  onSelectOutletId={(id) => {
                    setActiveDetailOutletId(id);
                  }}
                  onStartAudit={openOutletDetails}
                  autoOptimize={true}
                  origin={mapOrigin}
                  encodedPolyline={optimizedRoute?.encodedPolyline}
                  isDark={isDark}
                  className="rounded-3xl border-0"
                />
              </div>
            </>
          ) : (
            <div className="glass-panel rounded-3xl flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[var(--text-secondary)]">
              <MapPin size={28} className="text-[var(--accent-primary)] opacity-50 mb-2" />
              Select a store to view branch details and route map.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
