import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  Polyline,
  useMap,
  useMapsLibrary,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
  ColorScheme
} from '@vis.gl/react-google-maps';
import { Navigation, MapPin, Loader2, ExternalLink } from 'lucide-react';
import { Outlet } from '../types';
import { decodeEncodedPolyline } from '../utils/dohaCoords';

export interface PjpMapOutletItem {
  outlet: Outlet;
  coords: { lat: number; lng: number };
  stopNumber?: number;
  legDistanceMeters?: number;
  legDurationSeconds?: number;
}

interface PjpGoogleMapProps {
  items: PjpMapOutletItem[];
  selectedOutletId: string | null;
  onSelectOutletId: (id: string) => void;
  onStartAudit?: (outlet: Outlet) => void;
  autoOptimize: boolean;
  origin?: { lat: number; lng: number; source: 'gps' | 'old_doha_port' } | null;
  encodedPolyline?: string;
  isDark: boolean;
  className?: string;
}

const DOHA_DEFAULT_CENTER = { lat: 25.2854, lng: 51.531 };

let cachedMapsConfig: { apiKey: string; mapId: string } | null = null;
let inflightConfigPromise: Promise<{ apiKey: string; mapId: string }> | null = null;

function formatDistanceCompact(meters?: number): string {
  if (!meters || meters <= 0) return '';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function formatDurationCompact(seconds?: number): string {
  if (!seconds || seconds <= 0) return '';
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
}

const MapQuotaMonitor: React.FC = () => {
  const status = useApiLoadingStatus();
  useEffect(() => {
    if (status === APILoadingStatus.AUTH_FAILURE) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  }, [status]);
  return null;
};

interface ViewportControllerProps {
  items: PjpMapOutletItem[];
  origin?: { lat: number; lng: number; source: 'gps' | 'old_doha_port' } | null;
  decodedPath: Array<{ lat: number; lng: number }>;
  autoOptimize: boolean;
  encodedPolyline?: string;
  selectedOutletId: string | null;
}

const MapViewportController: React.FC<ViewportControllerProps> = ({
  items,
  origin,
  decodedPath,
  autoOptimize,
  encodedPolyline,
  selectedOutletId
}) => {
  const map = useMap();
  const coreLib = useMapsLibrary('core');
  const prevSelectionRef = useRef<string | null>(null);
  const lastFitSignatureRef = useRef<string>('');

  // Fit bounds when route changes or items set changes meaningfully
  useEffect(() => {
    if (!map || !coreLib || items.length === 0) return;

    const fitSignature = `${autoOptimize ? '1' : '0'}|${encodedPolyline ? encodedPolyline.slice(0, 24) : ''}|${
      origin ? `${origin.lat.toFixed(3)},${origin.lng.toFixed(3)}` : 'no-origin'
    }|${items.map((i) => i.outlet.id).join(',')}`;

    if (lastFitSignatureRef.current === fitSignature) return;
    lastFitSignatureRef.current = fitSignature;

    const bounds = new coreLib.LatLngBounds();
    let count = 0;

    if (autoOptimize && origin) {
      bounds.extend({ lat: origin.lat, lng: origin.lng });
      count++;
    }

    items.forEach((item) => {
      bounds.extend(item.coords);
      count++;
    });

    if (autoOptimize && decodedPath.length > 0) {
      const step = Math.max(1, Math.floor(decodedPath.length / 20));
      for (let i = 0; i < decodedPath.length; i += step) {
        bounds.extend(decodedPath[i]);
      }
    }

    if (count === 1) {
      const target = items[0]?.coords || DOHA_DEFAULT_CENTER;
      map.setCenter(target);
      map.setZoom(13);
    } else if (count > 1) {
      map.fitBounds(bounds, { top: 44, right: 44, bottom: 44, left: 44 });
    }
  }, [map, coreLib, items, origin, decodedPath, autoOptimize, encodedPolyline]);

  // Pan smoothly to newly clicked outlet without overriding initial route fit
  useEffect(() => {
    if (!map || !selectedOutletId) return;
    if (prevSelectionRef.current === selectedOutletId) return;
    prevSelectionRef.current = selectedOutletId;

    const target = items.find((i) => i.outlet.id === selectedOutletId);
    if (target) {
      map.panTo(target.coords);
    }
  }, [map, selectedOutletId, items]);

  return null;
};

interface OutletMarkerProps {
  item: PjpMapOutletItem;
  isSelected: boolean;
  isInfoOpen: boolean;
  autoOptimize: boolean;
  onSelect: () => void;
  onCloseInfo: () => void;
  onStartAudit?: (outlet: Outlet) => void;
}

const OutletMarkerNode: React.FC<OutletMarkerProps> = ({
  item,
  isSelected,
  isInfoOpen,
  autoOptimize,
  onSelect,
  onCloseInfo,
  onStartAudit
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const { outlet, coords, stopNumber, legDistanceMeters, legDurationSeconds } = item;

  const doneCategories = Object.values(outlet.progress).filter((s) => s === 'Completed').length;
  const isDone = doneCategories === 3;
  const isInProgress = doneCategories > 0 && !isDone;

  let background = '#1E293B';
  let borderColor = '#0F172A';
  if (isDone) {
    background = '#059669';
    borderColor = '#065F46';
  } else if (isSelected) {
    background = '#084C41';
    borderColor = '#34D399';
  } else if (isInProgress) {
    background = '#D97706';
    borderColor = '#92400E';
  }

  const glyphText =
    autoOptimize && typeof stopNumber === 'number'
      ? String(stopNumber)
      : isDone
      ? '✓'
      : isSelected
      ? '★'
      : '•';

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={coords}
        onClick={onSelect}
        title={outlet.name}
        zIndex={isSelected ? 60 : isDone ? 15 : 30}
      >
        <Pin
          background={background}
          borderColor={borderColor}
          glyphColor="#FFFFFF"
          glyphText={glyphText}
          scale={isSelected ? 1.22 : 1.0}
        />
      </AdvancedMarker>

      {isInfoOpen && marker && (
        <InfoWindow anchor={marker} onCloseClick={onCloseInfo} maxWidth={250}>
          <div className="p-1 text-slate-900 space-y-1.5 min-w-[180px]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                {autoOptimize && typeof stopNumber === 'number' && (
                  <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                    Stop #{stopNumber}
                  </span>
                )}
                <p className="text-xs font-extrabold leading-snug text-slate-900">
                  {outlet.name}
                </p>
                <p className="text-[11px] text-slate-600">{outlet.branch}</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 text-[11px]">
              <span className="font-semibold text-slate-700">
                Category: <strong className="text-emerald-700">{doneCategories}/3</strong>
              </span>
              {autoOptimize && legDistanceMeters ? (
                <span className="font-semibold text-slate-600 tabular-nums">
                  {formatDistanceCompact(legDistanceMeters)} · {formatDurationCompact(legDurationSeconds)}
                </span>
              ) : null}
            </div>

            {onStartAudit && (
              <button
                type="button"
                onClick={() => onStartAudit(outlet)}
                className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-[#084C41] text-white text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-[#063A32] cursor-pointer"
              >
                <span>{isDone ? 'View Audit' : 'Start Audit'}</span>
                <ExternalLink size={11} />
              </button>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export const PjpGoogleMap: React.FC<PjpGoogleMapProps> = ({
  items,
  selectedOutletId,
  onSelectOutletId,
  onStartAudit,
  autoOptimize,
  origin,
  encodedPolyline,
  isDark,
  className = ''
}) => {
  const envKey = ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '').trim();
  const envMapId = ((import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID || '').trim();
  const [apiKey, setApiKey] = useState<string>(cachedMapsConfig?.apiKey || envKey || '');
  const [mapId, setMapId] = useState<string>(cachedMapsConfig?.mapId || envMapId || 'DEMO_MAP_ID');
  const [keyLoading, setKeyLoading] = useState<boolean>(!(cachedMapsConfig?.apiKey || envKey));
  const [infoOutletId, setInfoOutletId] = useState<string | null>(null);

  const decodedPath = useMemo(
    () => (encodedPolyline ? decodeEncodedPolyline(encodedPolyline) : []),
    [encodedPolyline]
  );

  useEffect(() => {
    if (apiKey && (cachedMapsConfig?.mapId || envMapId)) {
      cachedMapsConfig = { apiKey, mapId: cachedMapsConfig?.mapId || envMapId || 'DEMO_MAP_ID' };
      setKeyLoading(false);
      return;
    }

    let cancelled = false;
    if (!inflightConfigPromise) {
      inflightConfigPromise = fetch('/api/maps/config')
        .then(async (r) => {
          const ct = r.headers.get('content-type') || '';
          if (!r.ok || !ct.includes('application/json')) {
            return { apiKey: envKey, mapId: envMapId || 'DEMO_MAP_ID' };
          }
          const d = await r.json();
          return {
            apiKey: String(d?.apiKey || envKey || '').trim(),
            mapId: String(d?.mapId || envMapId || 'DEMO_MAP_ID').trim() || 'DEMO_MAP_ID'
          };
        })
        .catch(() => ({ apiKey: envKey, mapId: envMapId || 'DEMO_MAP_ID' }));
    }

    inflightConfigPromise.then((resolved) => {
      if (cancelled) return;
      cachedMapsConfig = resolved;
      if (!apiKey) setApiKey(resolved.apiKey);
      if (!envMapId && resolved.mapId) setMapId(resolved.mapId);
      setKeyLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey, envKey, envMapId]);

  const handleMarkerSelect = useCallback(
    (id: string) => {
      onSelectOutletId(id);
      setInfoOutletId(id);
    },
    [onSelectOutletId]
  );

  const initialCenter = useMemo(() => {
    if (selectedOutletId) {
      const found = items.find((i) => i.outlet.id === selectedOutletId);
      if (found) return found.coords;
    }
    return items[0]?.coords || DOHA_DEFAULT_CENTER;
  }, [items, selectedOutletId]);

  if (keyLoading) {
    return (
      <div
        className={`w-full h-full min-h-[240px] rounded-2xl glass-subtle flex flex-col items-center justify-center gap-2 text-xs text-[var(--text-secondary)] ${className}`}
      >
        <Loader2 size={20} className="animate-spin text-[var(--accent-primary)]" />
        <span>Loading Google Map...</span>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div
        className={`w-full h-full min-h-[240px] rounded-2xl glass-subtle flex flex-col items-center justify-center gap-2 p-4 text-center ${className}`}
      >
        <MapPin size={22} className="text-[var(--accent-primary)] opacity-60" />
        <p className="text-xs font-bold text-[var(--text-primary)]">Google Map Unavailable</p>
        <p className="text-[11px] text-[var(--text-secondary)] max-w-[260px]">
          Configure a Google Maps API key to preview outlet pins and optimized driving routes.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`w-full h-full min-h-[240px] rounded-2xl overflow-hidden border border-[var(--border-glass)] relative ${className}`}
    >
      <APIProvider apiKey={apiKey} language="en" region="QA" libraries={['marker', 'geometry']}>
        <MapQuotaMonitor />
        <GoogleMap
          mapId={mapId}
          defaultCenter={initialCenter}
          defaultZoom={12}
          gestureHandling="greedy"
          clickableIcons={false}
          disableDefaultUI
          zoomControl
          colorScheme={isDark ? ColorScheme.DARK : ColorScheme.LIGHT}
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          style={{ width: '100%', height: '100%' }}
        >
          <MapViewportController
            items={items}
            origin={origin}
            decodedPath={decodedPath}
            autoOptimize={autoOptimize}
            encodedPolyline={encodedPolyline}
            selectedOutletId={selectedOutletId}
          />

          {autoOptimize && origin && (
            <AdvancedMarker
              position={{ lat: origin.lat, lng: origin.lng }}
              title={
                origin.source === 'gps'
                  ? 'Start: Current GPS Location'
                  : 'Start: Old Doha Port (Fallback)'
              }
              zIndex={45}
            >
              <Pin
                background="#0284C7"
                borderColor="#0369A1"
                glyphColor="#FFFFFF"
                glyphText={origin.source === 'gps' ? 'GPS' : 'P'}
                scale={0.95}
              />
            </AdvancedMarker>
          )}

          {autoOptimize && decodedPath.length > 1 && (
            <Polyline
              path={decodedPath}
              strokeColor={isDark ? '#34D399' : '#084C41'}
              strokeOpacity={0.92}
              strokeWeight={5}
            />
          )}

          {items.map((item) => (
            <OutletMarkerNode
              key={item.outlet.id}
              item={item}
              isSelected={item.outlet.id === selectedOutletId}
              isInfoOpen={infoOutletId === item.outlet.id}
              autoOptimize={autoOptimize}
              onSelect={() => handleMarkerSelect(item.outlet.id)}
              onCloseInfo={() => setInfoOutletId(null)}
              onStartAudit={onStartAudit}
            />
          ))}
        </GoogleMap>
      </APIProvider>

      {autoOptimize && origin && (
        <div className="absolute bottom-2.5 left-2.5 right-14 pointer-events-none flex items-center gap-1.5">
          <div className="pointer-events-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white/90 dark:bg-[#0B110F]/90 backdrop-blur-md border border-[var(--border-glass)] text-[var(--text-primary)] shadow-sm">
            <Navigation size={11} className="text-sky-600 dark:text-sky-400 shrink-0" />
            <span className="truncate">
              Start: {origin.source === 'gps' ? 'Current GPS' : 'Old Doha Port'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
