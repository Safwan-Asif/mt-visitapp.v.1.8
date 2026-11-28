import React, { useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, Minus, Crosshair, Map as MapIcon, Mountain, Globe, Layers } from 'lucide-react';
import {
  DOHA_CENTER,
  DOHA_LANDMARKS,
  DohaLandmark,
  ExecutiveLocation,
  MAP_BASE_STYLES,
  MapBaseStyle,
  MapOutlet,
  PerformanceLayerId
} from '../../data/data';
import { OutletPin, createExecutiveBeaconIcon } from './OutletPin';
import { BottomSheetState } from './OutletBottomSheet';

function createLandmarkIcon(landmark: DohaLandmark): L.DivIcon {
  const iconSvg =
    landmark.kind === 'stadium'
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2"><ellipse cx="12" cy="11" rx="9" ry="5"/><path d="M3 11v4c0 2.8 4 5 9 5s9-2.2 9-5v-4"/></svg>`
      : landmark.kind === 'corniche'
      ? `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" stroke-width="2"><path d="M12 2v14"/><path d="M7 18h10"/><path d="M9 18l3-9 3 9"/></svg>`
      : `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E2E8F0" stroke-width="2"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.7l-.5 1.2 6.8 3.6-2.8 2.8-2.2-.6-1 1 2.5 1.5L8 19l1-1-.6-2.2 2.8-2.8 3.6 6.8 1.2-.5c.5-.2.8-.6.7-1.1z"/></svg>`;

  const arrowHtml =
    landmark.arrowDirection === 'left'
      ? `<span style="color:#94A3B8;font-size:12px;font-weight:700;">&larr;</span>`
      : landmark.arrowDirection === 'right'
      ? `<span style="color:#38BDF8;font-size:12px;font-weight:700;">&rarr;</span>`
      : '';

  const html = `
    <div style="display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:10px;background:rgba(8,18,33,0.78);border:1px solid rgba(148,163,184,0.28);backdrop-filter:blur(8px);box-shadow:0 4px 12px rgba(0,0,0,0.45);white-space:nowrap;pointer-events:none;">
      ${arrowHtml}
      <span style="display:flex;align-items:center;justify-content:center;">${iconSvg}</span>
      <span style="font-size:10.5px;font-weight:600;color:#F1F5F9;line-height:1.15;letter-spacing:0.01em;">${landmark.name}</span>
    </div>
  `;

  return L.divIcon({
    className: 'marviz-pin-icon',
    html,
    iconSize: [140, 28],
    iconAnchor: [70, 14]
  });
}

interface MapViewProps {
  outlets: MapOutlet[];
  roadRouteCoords: [number, number][];
  routeSource: 'osrm' | 'arterial_fallback';
  mapBaseStyle: MapBaseStyle;
  activeLayer: PerformanceLayerId;
  showJourneyPlan: boolean;
  selectedOutlet: MapOutlet | null;
  sheetState: BottomSheetState;
  executiveLocation: ExecutiveLocation;
  centerRequestNonce: number;
  onSelectOutlet: (outlet: MapOutlet) => void;
  onMapBackgroundTap: () => void;
  onRecenterExecutive: () => void;
  onCycleBaseStyle?: () => void;
  onResetFilter?: () => void;
  mobileControlsClosedBottomClass?: string;
  isMobileLayersOpen?: boolean;
  onToggleMobileLayersMenu?: () => void;
}

interface MapControllerProps {
  selectedOutlet: MapOutlet | null;
  sheetState: BottomSheetState;
  executiveLocation: ExecutiveLocation;
  centerRequestNonce: number;
  mapRef: React.MutableRefObject<L.Map | null>;
  onMapBackgroundTap: () => void;
}

const MapController: React.FC<MapControllerProps> = ({
  selectedOutlet,
  sheetState,
  executiveLocation,
  centerRequestNonce,
  mapRef,
  onMapBackgroundTap
}) => {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);

  useMapEvents({
    click: () => {
      onMapBackgroundTap();
    }
  });

  // Smoothly focus selected outlet slightly above center when sheet is open
  useEffect(() => {
    if (!selectedOutlet || sheetState === 'closed') return;
    const currentZoom = Math.max(map.getZoom(), 13);
    const targetLatOffset = sheetState === 'expanded' ? -0.0085 : -0.004;
    map.flyTo(
      [selectedOutlet.latitude + targetLatOffset, selectedOutlet.longitude],
      currentZoom,
      { duration: 0.45 }
    );
  }, [selectedOutlet?.id, sheetState, map]);

  const executiveLocationRef = useRef(executiveLocation);
  useEffect(() => {
    executiveLocationRef.current = executiveLocation;
  }, [executiveLocation]);

  // Only move camera when the user explicitly taps re-centre, preserving their zoom level
  useEffect(() => {
    if (centerRequestNonce === 0) return;
    const loc = executiveLocationRef.current;
    map.panTo([loc.latitude, loc.longitude], { animate: true, duration: 0.45 });
  }, [centerRequestNonce, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  outlets,
  roadRouteCoords,
  routeSource,
  mapBaseStyle,
  activeLayer,
  showJourneyPlan,
  selectedOutlet,
  sheetState,
  executiveLocation,
  centerRequestNonce,
  onSelectOutlet,
  onMapBackgroundTap,
  onRecenterExecutive,
  onCycleBaseStyle,
  onResetFilter,
  mobileControlsClosedBottomClass = 'bottom-[calc(78px+env(safe-area-inset-bottom,0px))]',
  isMobileLayersOpen = false,
  onToggleMobileLayersMenu
}) => {
  const mapRef = useRef<L.Map | null>(null);

  const executiveBeaconIcon = useMemo(() => createExecutiveBeaconIcon(), []);

  const activeStyleConfig = useMemo(
    () =>
      MAP_BASE_STYLES.find((s) => s.id === mapBaseStyle) || MAP_BASE_STYLES[0],
    [mapBaseStyle]
  );

  const tileThemeClass =
    mapBaseStyle === 'tactical_terrain'
      ? 'marviz-tiles-tactical-terrain'
      : mapBaseStyle === 'tactical_dark'
      ? 'marviz-tiles-tactical-dark'
      : 'marviz-tiles-satellite';

  const landmarkIcons = useMemo(
    () =>
      DOHA_LANDMARKS.map((lm) => ({
        landmark: lm,
        icon: createLandmarkIcon(lm)
      })),
    []
  );

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const controlsBottomClass =
    sheetState === 'expanded'
      ? 'hidden md:flex md:bottom-3 md:flex-row'
      : sheetState === 'peek'
      ? 'bottom-[calc(154px+env(safe-area-inset-bottom,0px))] md:bottom-3 flex-col md:flex-row'
      : `${mobileControlsClosedBottomClass} md:bottom-3 flex-col md:flex-row`;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={DOHA_CENTER}
        zoom={12}
        minZoom={3}
        maxZoom={18}
        zoomControl={false}
        attributionControl={false}
        className={`marviz-leaflet-container ${tileThemeClass}`}
      >
        <TileLayer
          key={activeStyleConfig.id}
          url={activeStyleConfig.tileUrl}
          attribution={activeStyleConfig.attribution}
          maxZoom={18}
        />

        <MapController
          selectedOutlet={selectedOutlet}
          sheetState={sheetState}
          executiveLocation={executiveLocation}
          centerRequestNonce={centerRequestNonce}
          mapRef={mapRef}
          onMapBackgroundTap={onMapBackgroundTap}
        />

        {/* Doha Road-Following Planned Journey Polyline (OSRM / Arterial Fallback) */}
        {showJourneyPlan && roadRouteCoords.length > 1 && (
          <>
            <Polyline
              positions={roadRouteCoords}
              pathOptions={{
                color: '#0066FF',
                weight: 10,
                opacity: 0.34,
                lineCap: 'round',
                lineJoin: 'round',
                className: 'marviz-route-glow'
              }}
            />
            <Polyline
              positions={roadRouteCoords}
              pathOptions={{
                color: '#00C8FF',
                weight: 4,
                opacity: 0.95,
                dashArray: routeSource === 'osrm' ? undefined : '10 6',
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Doha Geographic Landmark Callouts */}
        {landmarkIcons.map(({ landmark, icon }) => (
          <Marker
            key={landmark.id}
            position={[landmark.latitude, landmark.longitude]}
            icon={icon}
            zIndexOffset={50}
            interactive={false}
          />
        ))}

        {/* Executive Live Location Indicator */}
        <Marker
          position={[executiveLocation.latitude, executiveLocation.longitude]}
          icon={executiveBeaconIcon}
          zIndexOffset={700}
          interactive={false}
        />

        {/* Filtered Outlet Pins */}
        {outlets.map((outlet) => (
          <OutletPin
            key={outlet.id}
            outlet={outlet}
            activeLayer={activeLayer}
            isSelected={selectedOutlet?.id === outlet.id && sheetState !== 'closed'}
            onSelect={onSelectOutlet}
          />
        ))}
      </MapContainer>

      {/* Subtle Architectural Contour & Orbital Telemetry Overlay */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-[375] marviz-tactical-grid ${
          mapBaseStyle === 'satellite' ? 'opacity-65' : 'opacity-90'
        }`}
      />

      {/* Subtle Tactical Vignette around screen edges for contrast */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[380] bg-[radial-gradient(circle_at_center,transparent_58%,rgba(2,8,19,0.52)_100%)]"
      />

      {/* Empty Filter State */}
      {outlets.length === 0 && (
        <div className="absolute inset-0 z-[430] flex items-center justify-center px-6 pointer-events-none">
          <div className="ov-panel-elevated rounded-2xl p-4 text-center max-w-xs pointer-events-auto text-white">
            <p className="font-heading text-base font-bold uppercase tracking-wide">
              No matching outlets
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Adjust your filter chip to view assigned Doha territory outlets.
            </p>
            {onResetFilter && (
              <button
                type="button"
                onClick={onResetFilter}
                className="mt-3 min-h-[40px] px-4 rounded-xl bg-[#0066FF] hover:bg-[#008DFF] text-xs font-bold uppercase tracking-wider text-[#F1F5FF] cursor-pointer transition-colors"
              >
                Show All Outlets
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Map Controls: Style Toggle, Zoom +/- and Re-centre GPS (Vertical on Mobile, Horizontal Dock on Desktop) */}
      <div
        className={`absolute right-3 z-[450] flex gap-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${controlsBottomClass}`}
      >
        {(onCycleBaseStyle || onToggleMobileLayersMenu) && (
          <button
            type="button"
            onClick={() => {
              if (
                onToggleMobileLayersMenu &&
                typeof window !== 'undefined' &&
                !window.matchMedia('(min-width: 768px)').matches
              ) {
                onToggleMobileLayersMenu();
              } else {
                onCycleBaseStyle?.();
              }
            }}
            aria-expanded={onToggleMobileLayersMenu ? isMobileLayersOpen : undefined}
            aria-label={`Map layout and journey layers (current: ${activeStyleConfig.label})`}
            title={`Map Mode: ${activeStyleConfig.label}`}
            className={`relative w-11 h-11 rounded-2xl ov-panel flex flex-col items-center justify-center active:scale-95 transition-all cursor-pointer ${
              isMobileLayersOpen
                ? 'border-[#00C8FF]/80 bg-[#0066FF]/28 text-white shadow-[0_0_16px_rgba(0,141,255,0.45)]'
                : 'text-[#00C8FF] hover:text-white hover:border-[#00C8FF]/55'
            }`}
          >
            <span
              aria-hidden="true"
              className="md:hidden absolute top-1 right-1 text-[#00C8FF]/90"
            >
              <Layers size={8} strokeWidth={2.5} />
            </span>
            {mapBaseStyle === 'tactical_terrain' ? (
              <Mountain size={15} />
            ) : mapBaseStyle === 'tactical_dark' ? (
              <MapIcon size={15} />
            ) : (
              <Globe size={15} />
            )}
            <span className="text-[8px] font-bold uppercase tracking-tight leading-none mt-0.5 text-[#F1F5FF]">
              {activeStyleConfig.shortLabel}
            </span>
          </button>
        )}

        <div className="ov-panel rounded-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom in map"
            className="w-11 h-11 flex items-center justify-center text-[#F1F5FF] hover:bg-white/10 active:bg-[#0066FF]/25 transition-colors cursor-pointer"
          >
            <Plus size={18} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom out map"
            className="w-11 h-11 flex items-center justify-center text-[#F1F5FF] hover:bg-white/10 active:bg-[#0066FF]/25 transition-colors cursor-pointer"
          >
            <Minus size={18} />
          </button>
        </div>

        <button
          type="button"
          onClick={onRecenterExecutive}
          aria-label="Re-centre on current location"
          title="Re-centre on Doha executive position"
          className="w-11 h-11 rounded-2xl ov-panel flex items-center justify-center text-[#00C8FF] hover:text-white hover:border-[#00C8FF]/55 active:scale-95 transition-all cursor-pointer"
        >
          <Crosshair size={18} />
        </button>
      </div>
    </div>
  );
};
