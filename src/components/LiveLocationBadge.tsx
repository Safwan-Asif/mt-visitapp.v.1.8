import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { getAuditCoordinates, watchAuditCoordinates, GeoLocationResult } from '../services/geolocationService';
import { useTheme } from '../ThemeContext';

interface LiveLocationBadgeProps {
  outletName: string;
  targetLatitude?: number;
  targetLongitude?: number;
  onLocationCaptured?: (location: GeoLocationResult) => void;
  compact?: boolean;
}

export const LiveLocationBadge: React.FC<LiveLocationBadgeProps> = ({
  outletName,
  targetLatitude = 25.2854,
  targetLongitude = 51.5310,
  onLocationCaptured,
  compact = false
}) => {
  const { isDark } = useTheme();
  const [location, setLocation] = useState<GeoLocationResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');

  const fetchLocation = async () => {
    setIsRefreshing(true);
    try {
      const coords = await getAuditCoordinates({
        latitude: targetLatitude,
        longitude: targetLongitude
      });
      setLocation(coords);
      if (onLocationCaptured) onLocationCaptured(coords);
    } catch (err) {
      console.warn('Error fetching live location:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLocation();

    // Check permission status if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' as any })
        .then((result) => {
          setPermissionState(result.state);
          result.onchange = () => setPermissionState(result.state);
        })
        .catch(() => setPermissionState('unknown'));
    }

    // Subscribe to continuous live updates
    const unsubscribe = watchAuditCoordinates(
      (coords) => {
        setLocation(coords);
        if (onLocationCaptured) onLocationCaptured(coords);
      },
      { latitude: targetLatitude, longitude: targetLongitude }
    );

    return () => unsubscribe();
  }, [targetLatitude, targetLongitude]);

  const currentLat = location?.latitude ?? targetLatitude;
  const currentLng = location?.longitude ?? targetLongitude;
  const isGps = location?.source === 'device_gps';
  const accuracy = location?.accuracyMeters || 4;
  const distMeters = location?.distanceFromOutletMeters;

  const mapsUrl = `https://www.google.com/maps?q=${currentLat},${currentLng}`;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-xl border backdrop-blur-md ${
        isGps
          ? isDark ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          : isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-900'
      }`}>
        <Navigation size={11} className={isRefreshing ? 'animate-spin text-emerald-400' : 'text-emerald-400'} />
        <span className="font-mono font-bold">{currentLat.toFixed(4)}°N, {currentLng.toFixed(4)}°E</span>
        <span className="opacity-75">({isGps ? `±${accuracy}m` : 'Store Mapped'})</span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center gap-0.5 ml-1 text-emerald-400 font-bold"
          title="Open in Google Maps"
        >
          <ExternalLink size={9} />
        </a>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-2xl border transition-all space-y-2 ${
      isDark
        ? 'bg-[#132219]/90 border-emerald-800/60 shadow-lg'
        : 'bg-white border-emerald-950/10 shadow-xs'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className={`w-7 h-7 rounded-xl flex items-center justify-center border ${
            isGps
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
          }`}>
            <MapPin size={15} className={isRefreshing ? 'animate-bounce' : ''} />
          </div>
          <div>
            <h4 className={`text-xs font-black uppercase tracking-wider flex items-center gap-1 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              <span>Exact GPS Coordinates</span>
              {isGps ? (
                <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded font-bold">
                  LIVE DEVICE GPS
                </span>
              ) : (
                <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-bold">
                  STORE MAPPED
                </span>
              )}
            </h4>
            <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {outletName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLocation}
          disabled={isRefreshing}
          className={`p-1.5 rounded-xl border text-[10px] font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-all ${
            isDark
              ? 'bg-[#0B120E] border-emerald-800 text-emerald-300 hover:text-white'
              : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
          }`}
          title="Acquire fresh high-precision GPS position fix"
        >
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-emerald-400' : ''} />
          <span>{isRefreshing ? 'Fixing...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Main Coordinate Grid */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className={`p-2 rounded-xl border font-mono ${
          isDark ? 'bg-[#0B120E] border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">Latitude</span>
          <span className="text-xs font-black text-emerald-400 tracking-wider">
            {currentLat.toFixed(6)}° N
          </span>
        </div>

        <div className={`p-2 rounded-xl border font-mono ${
          isDark ? 'bg-[#0B120E] border-emerald-900/50' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <span className="text-[9px] uppercase font-sans font-bold text-slate-400 block">Longitude</span>
          <span className="text-xs font-black text-emerald-400 tracking-wider">
            {currentLng.toFixed(6)}° E
          </span>
        </div>
      </div>

      {/* GPS Precision & Geofence Verification Status */}
      <div className="flex items-center justify-between text-[10px] pt-0.5">
        <div className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
          <span>
            {isGps
              ? `Precision: ±${accuracy}m ${distMeters !== undefined ? `(${distMeters}m from store)` : ''}`
              : 'Store Gondola fallback active'}
          </span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 hover:underline cursor-pointer bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30"
        >
          <span>Google Maps</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
