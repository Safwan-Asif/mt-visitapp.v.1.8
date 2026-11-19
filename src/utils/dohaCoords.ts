export const OLD_DOHA_PORT_FALLBACK = {
  lat: 25.2916,
  lng: 51.5477,
  label: 'Old Doha Port'
} as const;

/**
 * Decodes a Google Encoded Polyline string (1e5 precision) synchronously
 * into { lat, lng } points for immediate road-hugging map rendering.
 */
export function decodeEncodedPolyline(encoded: string): Array<{ lat: number; lng: number }> {
  if (!encoded || typeof encoded !== 'string') return [];

  const points: Array<{ lat: number; lng: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      if (index >= encoded.length) return points;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return points;
}

/**
 * Resolves known Doha / Qatar retail areas & landmarks to accurate on-land GPS coordinates.
 */
export function resolveDohaAreaCoords(text: string, fallbackIndex: number = 0): { lat: number; lng: number } {
  const lower = (text || '').toLowerCase();
  const areaCoords: Array<[RegExp, number, number]> = [
    [/old doha port|corniche/, 25.2916, 51.5477],
    [/wakra|wakrah|wukair|madinatna/, 25.1768, 51.6035],
    [/barwa village/, 25.2145, 51.5648],
    [/barwa city/, 25.2225, 51.5194],
    [/mall of qatar|qatar mall|mall of qata/, 25.3218, 51.3506],
    [/festival city/, 25.3886, 51.4398],
    [/pearl|floresta|medina central|porto arabia/, 25.3713, 51.5492],
    [/lagoona|west bay|city center|dafna|marina/, 25.3256, 51.5295],
    [/mansoura/, 25.2749, 51.5398],
    [/muntaza|muntazah/, 25.2698, 51.5315],
    [/msheireb|musherib/, 25.2867, 51.5298],
    [/bin mahmoud/, 25.2842, 51.5141],
    [/bin omran/, 25.2995, 51.5032],
    [/al sadd|sadd/, 25.2816, 51.4988],
    [/villaggio|hyatt|aziziah|azizia/, 25.2602, 51.4426],
    [/salwa|west walk/, 25.2618, 51.4914],
    [/ain khalid|abu sidra|abuhamour|abu hamour/, 25.2328, 51.4712],
    [/muaither|maither|murra/, 25.2584, 51.4162],
    [/rayyan|gharrafat|gharaffa|q mall|izghawa|zghawa/, 25.3092, 51.4424],
    [/old airport|airport|matar/, 25.2524, 51.5568],
    [/thumama|nuaija|mamoura/, 25.2422, 51.5385],
    [/d ring/, 25.2562, 51.5236],
    [/b ring|rawdat al khail/, 25.2718, 51.5294],
    [/tawar|markhiya|leabeeb|leabaib|kheesha|umm salal/, 25.3446, 51.4728],
    [/lusail|fox hills|vendome|place vendome/, 25.4176, 51.5174],
    [/al khor|dhakhira/, 25.6804, 51.4969],
    [/shahaniya/, 25.3735, 51.2244],
    [/mesaieed|umm said/, 24.9912, 51.5516],
    [/birkat al awamer/, 25.0752, 51.4664],
    [/street 27|street 37|street 52|industrial|sanaya/, 25.1886, 51.4342],
    [/najma/, 25.2695, 51.5476],
    [/hilal/, 25.2585, 51.5342],
    [/umm ghuwailina|ghuwailina/, 25.2774, 51.5542],
    [/madinat khalifa|khalifa/, 25.3215, 51.4765],
    [/duhail|landmark/, 25.3428, 51.4622],
    [/waab|al waab/, 25.2586, 51.4628],
    [/sudan|al soudan/, 25.2645, 51.4754]
  ];

  for (const [pattern, lat, lng] of areaCoords) {
    if (pattern.test(lower)) {
      const jitter = ((fallbackIndex % 5) - 2) * 0.0012;
      return { lat: lat + jitter, lng: lng + jitter * 0.7 };
    }
  }

  // On-land central Doha fallback (slightly west/south of Corniche coastline so stops never land in water)
  const angle = fallbackIndex * 1.15;
  const radius = 0.012 + (fallbackIndex % 4) * 0.007;
  return {
    lat: 25.272 + Math.sin(angle) * radius,
    lng: 51.495 + Math.cos(angle) * radius
  };
}

/**
 * Detects legacy synthetic diagonal coordinates (25.2854 + idx*0.012, 51.5310 + idx*0.008)
 * that placed non-Safwan outlets offshore in the Arabian Gulf, or obviously invalid Qatar coordinates.
 */
export function isSyntheticOrOffshoreCoord(lat?: number, lng?: number): boolean {
  if (
    typeof lat !== 'number' ||
    typeof lng !== 'number' ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) <= 1 ||
    Math.abs(lng) <= 1
  ) {
    return true;
  }

  // Outside Qatar bounding box
  if (lat < 24.45 || lat > 26.25 || lng < 50.65 || lng > 51.75) {
    return true;
  }

  // Legacy northeast synthetic step grid from getInitialOutletsForExecutive
  for (let i = 0; i < 40; i++) {
    const legacyLat = 25.2854 + i * 0.012;
    const legacyLng = 51.531 + i * 0.008;
    if (Math.abs(lat - legacyLat) < 0.00035 && Math.abs(lng - legacyLng) < 0.00035) {
      return i >= 1;
    }
  }

  return false;
}
