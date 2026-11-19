import React, { useEffect, useMemo, useState } from 'react';
import { X, Sun, Moon, Info, Route, LogOut } from 'lucide-react';
import { UserProfile } from '../../types';
import { useTheme } from '../../ThemeContext';
import {
  DEFAULT_EXECUTIVE_LOCATION,
  DOHA_ARTERIAL_ROUTE_FALLBACK,
  ExecutiveLocation,
  MAP_BASE_STYLES,
  MapBaseStyle,
  MapFilterChipId,
  MapOutlet,
  MOCK_DOHA_OUTLETS,
  PerformanceLayerId,
  QuickFilterId,
  deriveHealthBreakdown,
  deriveJourneyMetrics,
  fetchDrivingRoadRoute,
  getNextStopDemoEstimate,
  mockOutletDataSource
} from '../../data/data';
import { MobileHeader } from './MobileHeader';
import { JourneyProgressHUD } from './JourneyProgressHUD';
import { MapFilterChips } from './MapFilterChips';
import { MapLayerSelector } from './MapLayerSelector';
import { MapView } from './MapView';
import { BottomSheetState, OutletBottomSheet } from './OutletBottomSheet';
import { DesktopTopBar } from './DesktopTopBar';
import { DesktopLeftRail } from './DesktopLeftRail';
import { DesktopRightColumn } from './DesktopRightColumn';
import { DesktopBottomBar } from './DesktopBottomBar';

interface MobileMapScreenProps {
  executive: UserProfile | null;
  onStartOutletVisit: (outlet: MapOutlet) => void;
  onMoreDetails: (outletId: string, outlet: MapOutlet) => void;
  onNavigateTab: (tab: 'home' | 'pjp') => void;
  onLogout?: () => void;
}

export const MobileMapScreen: React.FC<MobileMapScreenProps> = ({
  executive,
  onStartOutletVisit,
  onMoreDetails,
  onNavigateTab,
  onLogout
}) => {
  const { isDark, toggleTheme } = useTheme();

  const [outlets, setOutlets] = useState<MapOutlet[]>(MOCK_DOHA_OUTLETS);
  const [isLoadingOutlets, setIsLoadingOutlets] = useState<boolean>(true);
  const [mapBaseStyle, setMapBaseStyle] = useState<MapBaseStyle>('satellite');
  const [activeLayer, setActiveLayer] = useState<PerformanceLayerId>('visit_status');
  const [showJourneyPlan, setShowJourneyPlan] = useState<boolean>(true);
  const [isLayersOpen, setIsLayersOpen] = useState<boolean>(false);
  const [roadRouteCoords, setRoadRouteCoords] = useState<[number, number][]>(
    DOHA_ARTERIAL_ROUTE_FALLBACK
  );
  const [routeSource, setRouteSource] = useState<'osrm' | 'arterial_fallback'>(
    'arterial_fallback'
  );

  // Mobile segmented chip filter & Desktop 2x2 Quick Filters
  const [activeFilter, setActiveFilter] = useState<MapFilterChipId>('all');
  const [activeQuickFilters, setActiveQuickFilters] = useState<QuickFilterId[]>([]);

  // On wide desktop screens default-select Lulu Hypermarket (MT-QA-106) so the tactical card is immediately visible; on mobile keep sheet closed until pin tap
  const [selectedOutletId, setSelectedOutletId] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return 'MT-QA-106';
    }
    return null;
  });
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

  // Load typed outlet records via replaceable data-source interface
  useEffect(() => {
    let active = true;
    mockOutletDataSource
      .loadOutlets()
      .then((records) => {
        if (!active) return;
        setOutlets(records);
      })
      .finally(() => {
        if (active) setIsLoadingOutlets(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Fetch real Doha street-following driving route across today's 8 scheduled stops
  useEffect(() => {
    const plannedStops = outlets
      .filter((o) => o.scheduledForToday && o.visitOrder !== null)
      .sort((a, b) => (a.visitOrder ?? 99) - (b.visitOrder ?? 99))
      .map((o): [number, number] => [o.latitude, o.longitude]);

    if (plannedStops.length < 2) return;

    let active = true;
    fetchDrivingRoadRoute(plannedStops).then((result) => {
      if (!active) return;
      if (result.coordinates.length >= 2) {
        setRoadRouteCoords(result.coordinates);
        setRouteSource(result.source);
      }
    });
    return () => {
      active = false;
    };
  }, [outlets]);

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
  }, [outlets, activeFilter, activeQuickFilters]);

  const selectedOutlet = useMemo(
    () => outlets.find((o) => o.id === selectedOutletId) || null,
    [outlets, selectedOutletId]
  );

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
          const { latitude, longitude } = pos.coords;
          const insideDohaBounds =
            latitude >= 24.4 && latitude <= 26.3 && longitude >= 50.6 && longitude <= 51.8;
          if (insideDohaBounds) {
            setExecutiveLocation({
              latitude,
              longitude,
              label: 'Live GPS Position',
              isLiveGps: true
            });
          }
          setCenterRequestNonce((n) => n + 1);
        },
        () => {
          setCenterRequestNonce((n) => n + 1);
        },
        { enableHighAccuracy: true, timeout: 3500 }
      );
    } else {
      setCenterRequestNonce((n) => n + 1);
    }
  };

  // Lift mobile lower-left Layers button cleanly above the bottom sheet and native 5-tab MobileBottomNav
  const layersBottomOffsetClass =
    sheetState === 'expanded'
      ? 'bottom-[calc(422px+env(safe-area-inset-bottom,0px))]'
      : sheetState === 'peek'
      ? 'bottom-[calc(216px+env(safe-area-inset-bottom,0px))]'
      : 'bottom-[calc(88px+env(safe-area-inset-bottom,0px))]';

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#071421] select-none">
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
          onResetFilter={() => {
            setActiveQuickFilters([]);
            setActiveFilter('all');
          }}
        />

        {/* Loading Banner */}
        {isLoadingOutlets && (
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-[440] flex justify-center pointer-events-none">
            <div className="marviz-glass px-4 py-2 rounded-xl text-xs font-semibold text-sky-200">
              Loading Doha territory pins…
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
        <div className="hidden md:block absolute right-16 top-3 bottom-3 z-[455] pointer-events-none">
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
        <div className="hidden md:block absolute left-[252px] bottom-3.5 z-[450] pointer-events-none">
          <DesktopBottomBar
            nextStop={nextStopEstimate}
            healthBreakdown={healthBreakdown}
            onSelectOutlet={handleSelectOutlet}
          />
        </div>

        {/* MOBILE FLOATING TOP STACK (< md): Slim Header + Journey HUD + Filter Chips */}
        <div className="md:hidden absolute inset-x-0 top-0 z-[450] pt-[max(0.5rem,env(safe-area-inset-top))] px-2.5 sm:px-4 pointer-events-none">
          <div className="max-w-lg mx-auto space-y-1.5 pointer-events-auto">
            <MobileHeader
              outlets={outlets}
              onSelectOutletFromSearch={handleSelectOutletFromSearch}
            />
            <JourneyProgressHUD metrics={journeyMetrics} />
            <MapFilterChips
              activeFilter={activeFilter}
              onChangeFilter={handleMobileFilterChange}
              counts={filterCounts}
            />
          </div>
        </div>

        {/* MOBILE LOWER-LEFT FLOATING LAYERS CONTROL (< md) */}
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
            bottomOffsetClass={layersBottomOffsetClass}
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
            aria-label="Map Settings"
            className="md:hidden fixed inset-x-3 bottom-[calc(74px+env(safe-area-inset-bottom,0px))] z-[475] max-w-sm mx-auto marviz-glass-strong rounded-2xl p-4 text-white animate-fade-in"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-700/70">
              <span className="font-heading text-sm font-bold uppercase tracking-wider">
                Map Settings
              </span>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                aria-label="Close map settings"
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="pt-3 space-y-2.5">
              <button
                type="button"
                onClick={() => setShowJourneyPlan((prev) => !prev)}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900/65 border border-slate-700/70 flex items-center justify-between text-xs font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Route size={15} className="text-sky-400" />
                  Planned Journey Overlay
                </span>
                <span className={showJourneyPlan ? 'text-sky-400 font-bold' : 'text-slate-400'}>
                  {showJourneyPlan ? 'ON' : 'OFF'}
                </span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full min-h-[44px] px-3 rounded-xl bg-slate-900/65 border border-slate-700/70 flex items-center justify-between text-xs font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
                  App Theme
                </span>
                <span className="text-slate-300">{isDark ? 'Dark Tactical' : 'Light'}</span>
              </button>

              <div className="rounded-xl bg-slate-900/50 border border-slate-700/50 p-2.5 flex items-start gap-2 text-[11px] text-slate-300 leading-snug">
                <Info size={14} className="text-sky-400 shrink-0 mt-0.5" />
                <span>
                  Demonstration Doha outlet positions and illustrative route line shown until live GPS sync is connected. Satellite imagery &copy; Esri.
                </span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/35 flex items-center justify-center gap-2 text-xs font-bold text-red-300 cursor-pointer"
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
