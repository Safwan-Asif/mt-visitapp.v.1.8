import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { X, Sun, Moon, Info, Route, LogOut } from 'lucide-react';
import { CategoryAuditRecord, Outlet, UserProfile } from '../../types';
import { useTheme } from '../../ThemeContext';
import {
  DEFAULT_EXECUTIVE_LOCATION,
  ExecutiveLocation,
  MAP_BASE_STYLES,
  MapBaseStyle,
  MapFilterChipId,
  MapOutlet,
  PerformanceLayerId,
  QuickFilterId,
  deriveHealthBreakdown,
  deriveJourneyMetrics,
  fetchDrivingRoadRoute,
  getNextStopDemoEstimate
} from '../../data/data';
import {
  LivePjpDataset,
  buildGeoIntelMapOutlets,
  fetchLivePjpData,
  getCachedLivePjpData
} from '../../services/pjpService';
import { MobileHeader } from './MobileHeader';
import { JourneyProgressHUD } from './JourneyProgressHUD';
import { MapFilterChips } from './MapFilterChips';
import { MapLayerSelector } from './MapLayerSelector';
import { MobilePinLayerFooter } from './MobilePinLayerFooter';
import { MapView } from './MapView';
import { BottomSheetState, OutletBottomSheet } from './OutletBottomSheet';
import { DesktopTopBar } from './DesktopTopBar';
import { DesktopLeftRail } from './DesktopLeftRail';
import { DesktopRightColumn } from './DesktopRightColumn';
import { DesktopBottomBar } from './DesktopBottomBar';

interface MobileMapScreenProps {
  executive: UserProfile | null;
  appOutlets?: Outlet[];
  audits?: Record<string, CategoryAuditRecord>;
  livePjpDataset?: LivePjpDataset;
  useCustomAppRoute?: boolean;
  isSyncingPjp?: boolean;
  onStartOutletVisit: (outlet: MapOutlet) => void;
  onMoreDetails: (outletId: string, outlet: MapOutlet) => void;
  onNavigateTab: (tab: 'home' | 'pjp') => void;
  onOutletSheetOpenChange?: (isOpen: boolean) => void;
  onLogout?: () => void;
  focusedOutletRequest?: { sapCode?: string; id?: string; name?: string; nonce: number } | null;
}

export const MobileMapScreen: React.FC<MobileMapScreenProps> = ({
  executive,
  appOutlets = [],
  audits = {},
  livePjpDataset,
  useCustomAppRoute = false,
  isSyncingPjp = false,
  onStartOutletVisit,
  onMoreDetails,
  onNavigateTab: _onNavigateTab,
  onOutletSheetOpenChange,
  onLogout,
  focusedOutletRequest
}) => {
  const { isDark, toggleTheme } = useTheme();

  const [dataset, setDataset] = useState<LivePjpDataset>(
    () => livePjpDataset || getCachedLivePjpData()
  );
  const [isLoadingOutlets, setIsLoadingOutlets] = useState<boolean>(
    () => !livePjpDataset?.customerMaster?.length && !getCachedLivePjpData().customerMaster?.length
  );
  const [mapBaseStyle, setMapBaseStyle] = useState<MapBaseStyle>('satellite');
  const [activeLayer, setActiveLayer] = useState<PerformanceLayerId>('visit_status');
  const [showJourneyPlan, setShowJourneyPlan] = useState<boolean>(true);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [roadRouteCoords, setRoadRouteCoords] = useState<[number, number][]>([]);
  const [routeSource, setRouteSource] = useState<'osrm' | 'arterial_fallback'>('osrm');

  // Mobile segmented chip filter (defaults to Today Plan / pending only) & Desktop 2x2 Quick Filters
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.matchMedia
      ? !window.matchMedia('(min-width: 768px)').matches
      : typeof window !== 'undefined'
      ? window.innerWidth < 768
      : true
  );
  const [activeFilter, setActiveFilter] = useState<MapFilterChipId>('planned');
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilterId[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const desktopMq = window.matchMedia('(min-width: 768px)');
    const handleChange = () => setIsMobileViewport(!desktopMq.matches);
    handleChange();
    desktopMq.addEventListener('change', handleChange);
    return () => desktopMq.removeEventListener('change', handleChange);
  }, []);

  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<BottomSheetState>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'peek';
    }
    return 'closed';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [executiveLocation, setExecutiveLocation] = useState<ExecutiveLocation>(
    DEFAULT_EXECUTIVE_LOCATION
  );
  const [centerRequestNonce, setCenterRequestNonce] = useState<number>(0);

  const applyLiveCoords = useCallback(
    (pos: GeolocationPosition, recenterMap: boolean) => {
      const { latitude, longitude, accuracy } = pos.coords;
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
      if (latitude === 0 && longitude === 0) return;

      setExecutiveLocation({
        latitude,
        longitude,
        label: 'Live GPS Position',
        isLiveGps: true,
        accuracyMeters: Number.isFinite(accuracy) ? Math.round(accuracy) : undefined
      });

      if (recenterMap) {
        setCenterRequestNonce((n) => n + 1);
      }
    },
    []
  );

  // Automatically track the device's live GPS location after login / map mount
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    let active = true;
    let watchId: number | null = null;

    const handlePos = (pos: GeolocationPosition) => {
      if (!active) return;
      applyLiveCoords(pos, false);
    };

    const startWatch = (highAccuracy: boolean) => {
      if (!active || watchId !== null) return;
      watchId = navigator.geolocation.watchPosition(
        handlePos,
        (err) => {
          // If high-accuracy watch fails/times out indoors, downgrade once to network/Wi-Fi location
          if (active && highAccuracy && err.code !== err.PERMISSION_DENIED && watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
            startWatch(false);
          }
        },
        {
          enableHighAccuracy: highAccuracy,
          maximumAge: highAccuracy ? 15000 : 60000,
          timeout: 12000
        }
      );
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!active) return;
        applyLiveCoords(pos, false);
        startWatch(true);
      },
      (err) => {
        if (!active) return;
        if (err.code !== err.PERMISSION_DENIED) {
          navigator.geolocation.getCurrentPosition(
            (fallbackPos) => {
              if (!active) return;
              applyLiveCoords(fallbackPos, false);
              startWatch(false);
            },
            () => {
              startWatch(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 15000 }
    );

    return () => {
      active = false;
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [applyLiveCoords]);

  // Sync external livePjpDataset updates cleanly
  useEffect(() => {
    if (livePjpDataset && (livePjpDataset.customerMaster?.length || livePjpDataset.visits?.length)) {
      setDataset(livePjpDataset);
      setIsLoadingOutlets(false);
    }
  }, [livePjpDataset]);

  // Fetch live 4-tab dataset if not already populated in cache
  useEffect(() => {
    let active = true;
    fetchLivePjpData(false)
      .then((res) => {
        if (!active) return;
        setDataset(res);
      })
      .finally(() => {
        if (active) setIsLoadingOutlets(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Build live executive MapOutlets joined from Customer_Master + Executive_Assignments + PJP_Schedule + live audits + optional Sheet 2
  const outlets = useMemo<MapOutlet[]>(
    () =>
      buildGeoIntelMapOutlets({
        executive,
        dataset,
        appOutlets,
        audits,
        useCustomAppRoute
      }),
    [executive, dataset, appOutlets, audits, useCustomAppRoute]
  );

  // Default-select Stop #1 on desktop screens so the right detail card opens on a live outlet
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth < 768) return;
    if (outlets.length === 0) return;
    if (selectedOutletId && outlets.some((o) => o.id === selectedOutletId)) return;

    const firstScheduled =
      outlets
        .filter((o) => o.scheduledForToday && o.visitOrder !== null)
        .sort((a, b) => (a.visitOrder ?? 999) - (b.visitOrder ?? 999))[0] || outlets[0];

    if (firstScheduled) {
      setSelectedOutletId(firstScheduled.id);
      setSheetState('peek');
    }
  }, [outlets, selectedOutletId]);

  const lastHandledFocusNonceRef = React.useRef<number | null>(null);
  useEffect(() => {
    if (!focusedOutletRequest?.nonce || outlets.length === 0) return;
    if (lastHandledFocusNonceRef.current === focusedOutletRequest.nonce) return;

    const reqSap = String(focusedOutletRequest.sapCode || '').trim().toLowerCase();
    const reqId = String(focusedOutletRequest.id || '').trim().toLowerCase();
    const reqName = String(focusedOutletRequest.name || '').trim().toLowerCase();

    const match =
      (reqSap && outlets.find((o) => String(o.sapCode || '').trim().toLowerCase() === reqSap)) ||
      (reqId && outlets.find((o) => o.id.toLowerCase() === reqId)) ||
      (reqName &&
        outlets.find(
          (o) =>
            o.name.toLowerCase() === reqName ||
            o.name.toLowerCase().includes(reqName) ||
            reqName.includes(o.name.toLowerCase().split(' - ')[0])
        )) ||
      null;

    if (match) {
      lastHandledFocusNonceRef.current = focusedOutletRequest.nonce;
      setActiveQuickFilters([]);
      setActiveFilter('all');
      setSelectedOutletId(match.id);
      setSheetState('peek');
      setIsLayersOpen(false);
    }
  }, [focusedOutletRequest?.nonce, focusedOutletRequest, outlets]);

  const plannedStops = useMemo(
    () =>
      outlets
        .filter((o) => o.scheduledForToday && o.visitOrder !== null)
        .sort((a, b) => (a.visitOrder ?? 999) - (b.visitOrder ?? 999))
        .map((o): [number, number] => [o.latitude, o.longitude]),
    [outlets]
  );

  const plannedStopsKey = useMemo(
    () => plannedStops.map(([lat, lng]) => `${lat.toFixed(5)},${lng.toFixed(5)}`).join('|'),
    [plannedStops]
  );

  // Quantize GPS jitter (~110m) so stationary GPS drift does not re-fetch /api/map/route continuously
  const liveOriginBucketKey = executiveLocation.isLiveGps
    ? `${executiveLocation.latitude.toFixed(3)},${executiveLocation.longitude.toFixed(3)}`
    : '';

  // Fetch driving route starting at live GPS location (when available) and ending at the last scheduled stop
  useEffect(() => {
    const waypoints: [number, number][] =
      executiveLocation.isLiveGps && plannedStops.length > 0
        ? [[executiveLocation.latitude, executiveLocation.longitude], ...plannedStops]
        : plannedStops;

    if (waypoints.length < 2) {
      setRoadRouteCoords(waypoints);
      return;
    }

    let active = true;
    fetchDrivingRoadRoute(waypoints).then((result) => {
      if (!active) return;
      if (result.source === 'osrm' && result.coordinates.length >= 2) {
        const coords =
          executiveLocation.isLiveGps
            ? ([[executiveLocation.latitude, executiveLocation.longitude], ...result.coordinates] as [number, number][])
            : result.coordinates;
        setRoadRouteCoords(coords);
        setRouteSource('osrm');
      } else {
        setRoadRouteCoords(waypoints);
        setRouteSource('arterial_fallback');
      }
    });
    return () => {
      active = false;
    };
  }, [plannedStopsKey, liveOriginBucketKey]);

  // Derive Journey HUD totals & Outlet Health breakdown directly from outlet records
  const journeyMetrics = useMemo(() => deriveJourneyMetrics(outlets), [outlets]);
  const healthBreakdown = useMemo(() => deriveHealthBreakdown(outlets), [outlets]);
  const nextStopEstimate = useMemo(
    () => getNextStopDemoEstimate(outlets, executiveLocation),
    [outlets, executiveLocation]
  );

  // Mobile filter chip counts derived directly from outlet records
  const filterCounts = useMemo<Record<MapFilterChipId, number>>(() => {
    return {
      all: outlets.length,
      planned: outlets.filter((o) => o.scheduledForToday && o.visitStatus === 'planned').length,
      completed: outlets.filter((o) => o.visitStatus === 'completed').length,
      issues: outlets.filter(
        (o) => o.healthStatus === 'attention' || o.healthStatus === 'critical'
      ).length
    };
  }, [outlets]);

  // Visible outlets after applying either desktop Quick Filters or mobile filter chips
  const filteredOutlets = useMemo(() => {
    if (!isMobileViewport) {
      if (activeQuickFilters.length > 0) {
        return outlets.filter((o) => {
          if (
            activeQuickFilters.includes('planned') &&
            o.scheduledForToday &&
            o.visitStatus === 'planned'
          ) {
            return true;
          }
          if (activeQuickFilters.includes('completed') && o.visitStatus === 'completed') {
            return true;
          }
          if (activeQuickFilters.includes('attention') && o.healthStatus === 'attention') {
            return true;
          }
          if (activeQuickFilters.includes('critical') && o.healthStatus === 'critical') {
            return true;
          }
          return false;
        });
      }
      return outlets;
    }

    if (activeFilter === 'planned') {
      return outlets.filter((o) => o.scheduledForToday && o.visitStatus === 'planned');
    }
    if (activeFilter === 'completed') {
      return outlets.filter((o) => o.visitStatus === 'completed');
    }
    if (activeFilter === 'issues') {
      return outlets.filter(
        (o) => o.healthStatus === 'attention' || o.healthStatus === 'critical'
      );
    }
    return outlets;
  }, [outlets, activeFilter, activeQuickFilters, isMobileViewport]);

  const selectedOutlet = useMemo(
    () => outlets.find((o) => o.id === selectedOutletId) || null,
    [outlets, selectedOutletId]
  );

  const isMobileSheetOpen = isMobileViewport && sheetState !== 'closed' && selectedOutlet !== null;

  useEffect(() => {
    onOutletSheetOpenChange?.(isMobileSheetOpen);
  }, [isMobileSheetOpen, onOutletSheetOpenChange]);

  useEffect(() => {
    return () => {
      onOutletSheetOpenChange?.(false);
    };
  }, [onOutletSheetOpenChange]);

  const handleSelectOutlet = (outlet: MapOutlet) => {
    setSelectedOutletId(outlet.id);
    setSheetState((prev) => (prev === 'expanded' ? 'expanded' : 'peek'));
    setIsLayersOpen(false);
  };

  const handleSelectOutletFromSearch = (outlet: MapOutlet) => {
    setActiveQuickFilters([]);
    setActiveFilter('all');
    setSelectedOutletId(outlet.id);
    setSheetState('peek');
    setIsLayersOpen(false);
  };

  const handleCloseSelection = () => {
    setSheetState('closed');
    setSelectedOutletId(null);
  };

  const handleMapBackgroundTap = () => {
    if (isLayersOpen) setIsLayersOpen(false);
    if (sheetState !== 'closed' || selectedOutletId !== null) {
      handleCloseSelection();
    }
  };

  const handleMobileFilterChange = (nextFilter: MapFilterChipId) => {
    setActiveQuickFilters([]);
    setActiveFilter(nextFilter);
  };

  const handleToggleQuickFilter = (filterId: QuickFilterId) => {
    setActiveFilter('all');
    setActiveQuickFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  };

  const handleCycleBaseStyle = () => {
    setMapBaseStyle((prev) => {
      const idx = MAP_BASE_STYLES.findIndex((s) => s.id === prev);
      const next = MAP_BASE_STYLES[(idx + 1) % MAP_BASE_STYLES.length];
      return next.id;
    });
  };

  const handleRecenterExecutive = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyLiveCoords(pos, true);
        },
        (err) => {
          if (err.code !== err.PERMISSION_DENIED) {
            navigator.geolocation.getCurrentPosition(
              (fallbackPos) => {
                applyLiveCoords(fallbackPos, true);
              },
              () => {
                setCenterRequestNonce((n) => n + 1);
              },
              { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
            );
          } else {
            setCenterRequestNonce((n) => n + 1);
          }
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      );
    } else {
      setCenterRequestNonce((n) => n + 1);
    }
  };

  // Position lower-right mobile controls cleanly above MobileBottomNav; lift on peek and hide on expanded sheet
  const layersBottomOffsetClass =
    sheetState === 'expanded'
      ? 'hidden md:flex'
      : sheetState === 'peek'
      ? 'bottom-[calc(154px+env(safe-area-inset-bottom,0px))]'
      : 'bottom-[calc(78px+env(safe-area-inset-bottom,0px))]';

  return (
    <div className="dark ov-scope relative w-full h-full flex flex-col overflow-hidden ov-atmospheric-canvas select-none">
      {/* DESKTOP COMMAND CENTER HEADER BAR (md+) */}
      <DesktopTopBar
        metrics={journeyMetrics}
        outlets={outlets}
        isLiveGps={executiveLocation.isLiveGps}
        onCenterExecutive={handleRecenterExecutive}
        onSelectOutletFromSearch={handleSelectOutletFromSearch}
      />

      {/* MAIN MAP WORKSPACE */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Full-Viewport Satellite Map */}
        <MapView
          outlets={filteredOutlets}
          roadRouteCoords={roadRouteCoords}
          routeSource={routeSource}
          mapBaseStyle={mapBaseStyle}
          activeLayer={activeLayer}
          showJourneyPlan={showJourneyPlan}
          selectedOutlet={selectedOutlet}
          sheetState={sheetState}
          executiveLocation={executiveLocation}
          centerRequestNonce={centerRequestNonce}
          onSelectOutlet={handleSelectOutlet}
          onMapBackgroundTap={handleMapBackgroundTap}
          onRecenterExecutive={handleRecenterExecutive}
          onCycleBaseStyle={handleCycleBaseStyle}
          mobileControlsClosedBottomClass="bottom-[calc(78px+env(safe-area-inset-bottom,0px))]"
          isMobileLayersOpen={isLayersOpen}
          onToggleMobileLayersMenu={() => {
            setIsSettingsOpen(false);
            setIsLayersOpen((prev) => !prev);
          }}
          onResetFilter={() => {
            setActiveQuickFilters([]);
            setActiveFilter('all');
          }}
        />

        {/* Loading Banner */}
        {(isLoadingOutlets || isSyncingPjp) && outlets.length === 0 && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[440] flex justify-center pointer-events-none">
            <div className="ov-panel px-4 py-2 rounded-xl text-xs font-semibold text-sky-200">
              Syncing live territory pins…
            </div>
          </div>
        )}

        {/* DESKTOP LEFT FLOATING RAIL: MAP LAYERS + QUICK FILTERS + OUTLET LEGEND */}
        <div className="hidden md:block absolute left-3 top-3 bottom-3 z-[455] pointer-events-none">
          <DesktopLeftRail
            mapBaseStyle={mapBaseStyle}
            onSelectBaseStyle={setMapBaseStyle}
            showJourneyPlan={showJourneyPlan}
            onToggleJourneyPlan={() => setShowJourneyPlan((v) => !v)}
            activeLayer={activeLayer}
            onSelectLayer={setActiveLayer}
            activeQuickFilters={activeQuickFilters}
            onToggleQuickFilter={handleToggleQuickFilter}
          />
        </div>

        {/* DESKTOP RIGHT FLOATING COLUMN: COMPASS + JOURNEY + OUTLET HEALTH + SELECTED OUTLET CARD */}
        <div className="hidden md:block absolute right-3 top-3 bottom-[68px] z-[455] pointer-events-none">
          <DesktopRightColumn
            metrics={journeyMetrics}
            healthBreakdown={healthBreakdown}
            selectedOutlet={selectedOutlet}
            onCloseOutlet={handleCloseSelection}
            onStartOutletVisit={onStartOutletVisit}
            onMoreDetails={(outlet) => onMoreDetails(outlet.id, outlet)}
          />
        </div>

        {/* DESKTOP BOTTOM FLOATING BAR: NEXT STOP / DEMO ETA + OUTLET PRIORITY OVERVIEW */}
        <div className="hidden md:flex justify-center absolute inset-x-3 bottom-3 z-[450] pointer-events-none">
          <DesktopBottomBar
            nextStop={nextStopEstimate}
            healthBreakdown={healthBreakdown}
            onSelectOutlet={handleSelectOutlet}
          />
        </div>

        {/* MOBILE FLOATING TOP STACK (< md): HUD Header + Journey Progress + Filter Chips + Slim Pin Colour Strip */}
        <div className="md:hidden absolute inset-x-0 top-0 z-[450] pt-[max(0.5rem,env(safe-area-inset-top))] px-2.5 sm:px-4 pointer-events-none">
          <div className="max-w-lg mx-auto space-y-1.5 pointer-events-auto">
            <MobileHeader
              outlets={outlets}
              onSelectOutletFromSearch={handleSelectOutletFromSearch}
              onOpenSettings={() => {
                setIsLayersOpen(false);
                setIsSettingsOpen((v) => !v);
              }}
            />
            <JourneyProgressHUD metrics={journeyMetrics} />
            <MapFilterChips
              activeFilter={activeFilter}
              onChangeFilter={handleMobileFilterChange}
              counts={filterCounts}
            />
            <MobilePinLayerFooter
              activeLayer={activeLayer}
              onSelectLayer={(layer) => setActiveLayer(layer)}
            />
          </div>
        </div>

        {/* MOBILE MAP LAYOUT & JOURNEY PLAN POPOVER (triggered by right-side Satellite button < md) */}
        <div className="md:hidden">
          <MapLayerSelector
            isOpen={isLayersOpen}
            onToggleOpen={() => setIsLayersOpen((prev) => !prev)}
            mapBaseStyle={mapBaseStyle}
            onSelectBaseStyle={setMapBaseStyle}
            showJourneyPlan={showJourneyPlan}
            onToggleJourneyPlan={() => setShowJourneyPlan((prev) => !prev)}
            activeLayer={activeLayer}
            onSelectLayer={(layer) => setActiveLayer(layer)}
            hidePinLayers={true}
            hideTrigger={true}
            containerClassName={`absolute right-[64px] z-[455] flex flex-col items-end transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${layersBottomOffsetClass}`}
          />
        </div>

        {/* MOBILE TOUCH-DRAGGABLE BOTTOM SHEET (< md) */}
        <OutletBottomSheet
          outlet={selectedOutlet}
          sheetState={sheetState}
          onChangeState={(next) => {
            setSheetState(next);
            if (next === 'closed') {
              setSelectedOutletId(null);
            }
          }}
          onStartOutletVisit={onStartOutletVisit}
          onMoreDetails={(outlet) => onMoreDetails(outlet.id, outlet)}
        />

        {/* MOBILE SETTINGS POPOVER (< md) */}
        {isSettingsOpen && (
          <div
            role="dialog"
            aria-label="GeoIntel Settings"
            className="md:hidden fixed inset-x-3 bottom-[calc(76px+env(safe-area-inset-bottom,0px))] z-[475] max-w-sm mx-auto ov-panel-elevated rounded-2xl p-4 text-[#F1F5FF] animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.10]">
              <span className="font-heading text-sm font-bold uppercase tracking-wider">
                GeoIntel Settings
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close map settings"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-[#A5B8D5] hover:text-[#F1F5FF] hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowJourneyPlan((prev) => !prev)}
                className="w-full min-h-[44px] px-3 rounded-xl ov-glass-recessed hover:border-[#00C8FF]/45 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Route size={15} className="text-[#00C8FF]" />
                  Planned Journey Overlay
                </span>
                <span className={showJourneyPlan ? 'text-[#00C8FF] font-bold' : 'text-[#647D9E]'}>
                  {showJourneyPlan ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full min-h-[44px] px-3 rounded-xl ov-glass-recessed hover:border-[#00C8FF]/45 flex items-center justify-between text-xs font-semibold cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun size={15} className="text-[#FFB800]" /> : <Moon size={15} className="text-[#00C8FF]" />}
                  App Theme
                </span>
                <span className="text-[#A5B8D5]">{isDark ? 'Deep Navy' : 'Light'}</span>
              </button>

              <div className="rounded-xl ov-chart-well p-2.5 flex items-start gap-2 text-[11px] text-[#A5B8D5] leading-snug">
                <Info size={14} className="text-[#00C8FF] shrink-0 mt-0.5" />
                <span>
                  Live PJP outlet positions from Customer Master paired with browser GPS location tracking. Satellite imagery &copy; Esri.
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 flex items-center justify-center gap-2 text-xs font-bold text-[#FCA5A5] cursor-pointer transition-colors"
                >
                  <LogOut size={15} />
                  Sign Out ({executive?.name || 'Safwan Asif'})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
