/**
 * Geolocation service for capturing merchandiser on-site precise GPS coordinates
 * Uses browser navigator.geolocation with high-accuracy mode & outlet fallback
 */

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  source: 'device_gps' | 'outlet_fallback';
  timestamp: string;
  distanceFromOutletMeters?: number;
}

/**
 * Calculates distance in meters between two lat/lng points using Haversine formula
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Capture current GPS coordinates with high accuracy and fallback.
 * Uses a watch position accumulator window (up to 12s) to sample the best high-precision fix.
 */
export async function getAuditCoordinates(fallbackOutlet?: {
  latitude?: number;
  longitude?: number;
}): Promise<GeoLocationResult> {
  const fallbackLat = fallbackOutlet?.latitude || 25.2854;
  const fallbackLng = fallbackOutlet?.longitude || 51.5310;

  if (typeof window === 'undefined' || !navigator?.geolocation) {
    return {
      latitude: fallbackLat,
      longitude: fallbackLng,
      source: 'outlet_fallback',
      timestamp: new Date().toISOString(),
      distanceFromOutletMeters: 0
    };
  }

  return new Promise((resolve) => {
    let resolved = false;
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;

    const finish = (pos?: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch {
          // ignore
        }
      }
      clearTimeout(timer);

      const targetPos = pos || bestPosition;
      if (targetPos) {
        const lat = Number(targetPos.coords.latitude.toFixed(6));
        const lng = Number(targetPos.coords.longitude.toFixed(6));
        const dist = fallbackOutlet?.latitude && fallbackOutlet?.longitude
          ? calculateDistanceMeters(lat, lng, fallbackOutlet.latitude, fallbackOutlet.longitude)
          : undefined;

        resolve({
          latitude: lat,
          longitude: lng,
          accuracyMeters: Math.round(targetPos.coords.accuracy),
          source: 'device_gps',
          timestamp: new Date().toISOString(),
          distanceFromOutletMeters: dist
        });
      } else {
        resolve({
          latitude: fallbackLat,
          longitude: fallbackLng,
          source: 'outlet_fallback',
          timestamp: new Date().toISOString(),
          distanceFromOutletMeters: 0
        });
      }
    };

    // 12-second timeout window to allow hardware GPS chip to lock onto satellites
    const timer = setTimeout(() => {
      finish();
    }, 12000);

    // First attempt immediate single position call
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = pos;
        }
        if (pos.coords.accuracy <= 15) {
          finish(pos);
        }
      },
      (err) => {
        console.warn('[Geolocation] getCurrentPosition initial attempt note:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0
      }
    );

    // Continuously watch for more accurate fix
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!bestPosition || position.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = position;
          }
          // If accuracy is finer than 15 meters, finish immediately with precision fix!
          if (position.coords.accuracy <= 15) {
            finish(position);
          }
        },
        (error) => {
          console.warn('[Geolocation] GPS watch note:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 0
        }
      );
    } catch {
      // ignore
    }
  });
}

/**
 * Subscribes to continuous live high-precision GPS updates
 */
export function watchAuditCoordinates(
  onUpdate: (location: GeoLocationResult) => void,
  fallbackOutlet?: { latitude?: number; longitude?: number }
): () => void {
  const fallbackLat = fallbackOutlet?.latitude || 25.2854;
  const fallbackLng = fallbackOutlet?.longitude || 51.5310;

  if (typeof window === 'undefined' || !navigator?.geolocation) {
    onUpdate({
      latitude: fallbackLat,
      longitude: fallbackLng,
      source: 'outlet_fallback',
      timestamp: new Date().toISOString(),
      distanceFromOutletMeters: 0
    });
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = Number(position.coords.latitude.toFixed(6));
      const lng = Number(position.coords.longitude.toFixed(6));
      const dist = fallbackOutlet?.latitude && fallbackOutlet?.longitude
        ? calculateDistanceMeters(lat, lng, fallbackOutlet.latitude, fallbackOutlet.longitude)
        : undefined;

      onUpdate({
        latitude: lat,
        longitude: lng,
        accuracyMeters: Math.round(position.coords.accuracy),
        source: 'device_gps',
        timestamp: new Date().toISOString(),
        distanceFromOutletMeters: dist
      });
    },
    (err) => {
      console.warn('[Geolocation Watch] Note:', err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000
    }
  );

  return () => {
    navigator.geolocation.clearWatch(watchId);
  };
}

