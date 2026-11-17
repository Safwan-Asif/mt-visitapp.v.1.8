import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, RefreshCw, ExternalLink, ShieldCheck } from 'lucide-react';
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
  targetLongitude = 51.531,
  onLocationCaptured,
  compact = false
}) => {
  const { isDark } = useTheme();
  const [location, setLocation] = useState<GeoLocationResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      <div
        className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-xl glass-subtle ${
          isGps
            ? 'text-[var(--accent-primary)]'
            : isDark
            ? 'text-amber-300'
            : 'text-amber-700'
        }`}
      >
        <Navigation size={11} className={isRefreshing ? 'animate-spin' : ''} />
        <span className="font-mono font-bold tabular-nums">
          {currentLat.toFixed(4)}°N, {currentLng.toFixed(4)}°E
        </span>
        <span className="opacity-75 tabular-nums">
          ({isGps ? `±${accuracy}m` : 'Mapped'})
        </span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline flex items-center ml-0.5 font-bold"
          title="Open in Google Maps"
        >
          <ExternalLink size={9} />
        </a>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              isGps
                ? isDark
                  ? 'bg-emerald-500/15 text-[#34D399]'
                  : 'bg-[#084C41]/10 text-[#084C41]'
                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
            }`}
          >
            <MapPin size={15} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)] truncate">
              Exact GPS Coordinates &middot; {isGps ? 'Live GPS' : 'Store Mapped'}
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] truncate">{outletName}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchLocation}
          disabled={isRefreshing}
          className="min-h-[34px] px-2.5 rounded-xl glass-subtle text-[11px] font-bold text-[var(--accent-primary)] flex items-center gap-1 cursor-pointer active:scale-95 transition-all shrink-0"
          title="Acquire fresh high-precision GPS position fix"
        >
          <RefreshCw size={11} className={isRefreshing ? 'animate-spin' : ''} />
          <span>{isRefreshing ? 'Fixing…' : 'Refresh'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl glass-subtle font-mono">
          <span className="text-[10px] uppercase font-sans font-bold text-[var(--text-muted)] block">
            Latitude
          </span>
          <span className="text-xs font-extrabold text-[var(--accent-primary)] tabular-nums">
            {currentLat.toFixed(6)}° N
          </span>
        </div>

        <div className="p-2.5 rounded-xl glass-subtle font-mono">
          <span className="text-[10px] uppercase font-sans font-bold text-[var(--text-muted)] block">
            Longitude
          </span>
          <span className="text-xs font-extrabold text-[var(--accent-primary)] tabular-nums">
            {currentLng.toFixed(6)}° E
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] pt-0.5">
        <div className="flex items-center gap-1 text-[var(--accent-primary)] font-medium">
          <ShieldCheck size={12} className="shrink-0" />
          <span className="tabular-nums">
            {isGps
              ? `Precision: ±${accuracy}m${distMeters !== undefined ? ` (${distMeters}m away)` : ''}`
              : 'Store Gondola fallback active'}
          </span>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-primary)] font-bold flex items-center gap-1 hover:underline"
        >
          <span>Google Maps</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
};
