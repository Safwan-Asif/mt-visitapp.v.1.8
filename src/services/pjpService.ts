import { Outlet, PlanogramRecord } from '../types';
import { INITIAL_OUTLETS, MasterOutletOption } from '../constants';
import { MASTER_PJP_OUTLETS, PJP_SCHEDULE_VISITS, PjpVisitRow } from '../data/pjpMasterData';
import { normalizeSapCode } from './planogramService';

const PJP_LIVE_STORAGE_KEY = 'mta_live_pjp_cache_v1';

export interface LivePjpDataset {
  visits: PjpVisitRow[];
  masterOutlets: MasterOutletOption[];
  fetchedAt: number;
  source: string;
}

let memoryPjpCache: LivePjpDataset | null = null;

function hydratePjpFromStorage(): LivePjpDataset | null {
  try {
    const raw = localStorage.getItem(PJP_LIVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.visits) && Array.isArray(parsed?.masterOutlets)) {
      memoryPjpCache = parsed as LivePjpDataset;
      return memoryPjpCache;
    }
  } catch {
    // Ignore invalid localStorage cache
  }
  return null;
}

export function getFallbackPjpDataset(): LivePjpDataset {
  return {
    visits: PJP_SCHEDULE_VISITS,
    masterOutlets: MASTER_PJP_OUTLETS,
    fetchedAt: 0,
    source: 'static_fallback'
  };
}

/**
 * Fetches live MT PJP schedule & master outlets (with SAP Code) from the Google Sheet proxy.
 */
export async function fetchLivePjpData(forceRefresh: boolean = false): Promise<LivePjpDataset> {
  if (!forceRefresh && memoryPjpCache && Date.now() - memoryPjpCache.fetchedAt < 5 * 60 * 1000) {
    return memoryPjpCache;
  }

  try {
    const url = forceRefresh ? '/api/pjp/live?force=1' : '/api/pjp/live';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const visits = Array.isArray(json?.visits) ? json.visits : [];
      const masterOutlets = Array.isArray(json?.masterOutlets) ? json.masterOutlets : [];
      if (visits.length > 0) {
        const dataset: LivePjpDataset = {
          visits,
          masterOutlets,
          fetchedAt: Number(json.fetchedAt) || Date.now(),
          source: String(json.source || 'live_sheet')
        };
        memoryPjpCache = dataset;
        try {
          localStorage.setItem(PJP_LIVE_STORAGE_KEY, JSON.stringify(dataset));
        } catch {
          // Ignore storage quota warnings
        }
        return dataset;
      }
    }
  } catch (err) {
    console.warn('[PJPService] Live PJP fetch failed, using cached/fallback dataset:', err);
  }

  return memoryPjpCache || hydratePjpFromStorage() || getFallbackPjpDataset();
}

export function getCachedLivePjpData(): LivePjpDataset {
  return memoryPjpCache || hydratePjpFromStorage() || getFallbackPjpDataset();
}

function resolveDohaAreaCoords(text: string, fallbackIndex: number = 0): { lat: number; lng: number } {
  const lower = text.toLowerCase();
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
    [/al khor|dhakhira/, 25.6804, 51.4969],
    [/shahaniya/, 25.3735, 51.2244],
    [/birkat al awamer/, 25.0752, 51.4664],
    [/street 27|street 37|street 52|industrial|sanaya/, 25.1886, 51.4342]
  ];

  for (const [pattern, lat, lng] of areaCoords) {
    if (pattern.test(lower)) {
      const jitter = ((fallbackIndex % 5) - 2) * 0.0018;
      return { lat: lat + jitter, lng: lng + jitter * 0.8 };
    }
  }

  // Deterministic Doha grid fallback centered around Central Doha
  const angle = fallbackIndex * 1.1;
  const radius = 0.015 + (fallbackIndex % 4) * 0.01;
  return {
    lat: 25.2854 + Math.sin(angle) * radius,
    lng: 51.531 + Math.cos(angle) * radius
  };
}

export const OLD_DOHA_PORT_FALLBACK = {
  lat: 25.2916,
  lng: 51.5477,
  label: 'Old Doha Port'
} as const;

export function resolveOutletCoordinates(
  outlet: Pick<Outlet, 'name' | 'branch' | 'address' | 'latitude' | 'longitude'>,
  fallbackIndex: number = 0
): { lat: number; lng: number } {
  if (
    typeof outlet.latitude === 'number' &&
    typeof outlet.longitude === 'number' &&
    Number.isFinite(outlet.latitude) &&
    Number.isFinite(outlet.longitude) &&
    Math.abs(outlet.latitude) > 1 &&
    Math.abs(outlet.longitude) > 1
  ) {
    return { lat: outlet.latitude, lng: outlet.longitude };
  }
  const searchText = `${outlet.name || ''} ${outlet.branch || ''} ${outlet.address || ''}`;
  return resolveDohaAreaCoords(searchText, fallbackIndex);
}

export interface OptimizedRouteLeg {
  fromId: string;
  toId: string;
  distanceMeters: number;
  durationSeconds: number;
}

export interface OptimizedPjpRouteResult {
  orderedIds: string[];
  legs: OptimizedRouteLeg[];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  encodedPolyline: string;
  origin: { lat: number; lng: number; source: 'gps' | 'old_doha_port' };
}

export async function optimizePjpRouteWithGoogleMaps(
  origin: { lat: number; lng: number; source: 'gps' | 'old_doha_port' },
  stops: Array<{ id: string; lat: number; lng: number }>
): Promise<OptimizedPjpRouteResult> {
  const response = await fetch('/api/pjp/optimize-route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin: { lat: origin.lat, lng: origin.lng },
      stops
    })
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 429 || data?.quotaExceeded) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    throw new Error(data?.error || 'Google Maps Platform quota reached');
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || 'Unable to compute optimized driving route');
  }

  return {
    orderedIds: Array.isArray(data.orderedIds) ? data.orderedIds : stops.map((s) => s.id),
    legs: Array.isArray(data.legs) ? data.legs : [],
    totalDistanceMeters: Number(data.totalDistanceMeters || 0),
    totalDurationSeconds: Number(data.totalDurationSeconds || 0),
    encodedPolyline: String(data.encodedPolyline || ''),
    origin
  };
}

/**
 * Builds today's (or executive's active schedule date) Outlet[] from live MT PJP visits,
 * ensuring every store carries its exact SAP Code from the PJP MT sheet.
 */
export function buildExecutiveOutletsFromLivePjp(
  execName: string,
  dataset: LivePjpDataset
): Outlet[] {
  if (!execName || execName === 'Safwan Asif') {
    return enrichOutletsWithLivePjpSapCodes(INITIAL_OUTLETS, dataset);
  }

  const cleanExec = execName.trim().toLowerCase();
  const execVisits = (dataset.visits || []).filter(
    (v) => (v.executive || '').trim().toLowerCase() === cleanExec
  );

  if (execVisits.length === 0) {
    return enrichOutletsWithLivePjpSapCodes(INITIAL_OUTLETS, dataset);
  }

  // Prefer visits matching today's weekday name (Sunday..Saturday) if present in the monthly schedule
  const todayWeekday = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const todayDateStr = new Date().toISOString().slice(0, 10);

  let selectedVisits = execVisits.filter((v) => v.date === todayDateStr);
  if (selectedVisits.length === 0) {
    const weekdayMatch = execVisits.find((v) => (v.day || '').trim().toLowerCase() === todayWeekday);
    if (weekdayMatch) {
      selectedVisits = execVisits.filter((v) => v.date === weekdayMatch.date);
    }
  }
  if (selectedVisits.length === 0) {
    const firstDate = execVisits[0].date;
    selectedVisits = execVisits.filter((v) => v.date === firstDate);
  }

  // Deduplicate by SAP Code / outlet name within the selected day
  const seen = new Set<string>();
  const uniqueVisits: PjpVisitRow[] = [];
  selectedVisits.forEach((v) => {
    const sap = normalizeSapCode((v as any).sapCode || v.code);
    const dedupKey = sap || (v.outlet || '').trim().toLowerCase();
    if (!seen.has(dedupKey)) {
      seen.add(dedupKey);
      uniqueVisits.push(v);
    }
  });

  const total = uniqueVisits.length;
  return uniqueVisits.map((v, idx) => {
    const sap = String((v as any).sapCode || v.code || '').trim();
    const outletName =
      v.account && !v.outlet.toLowerCase().startsWith(v.account.toLowerCase())
        ? `${v.account} - ${v.outlet}`
        : v.outlet;
    const coords = resolveDohaAreaCoords(`${outletName} ${v.area || ''} ${v.account || ''}`, idx);
    return {
      id: sap ? `out-sap-${sap}` : `out-pjp-${idx + 1}-${Math.abs((v.executive + v.outlet).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
      name: outletName,
      code: sap || undefined,
      account: v.account || undefined,
      branch: v.area || v.account || 'Doha',
      sequence: `${idx + 1} of ${total}`,
      address: `${v.area ? v.area + ', ' : ''}${v.account ? v.account + ', ' : ''}Qatar`,
      status: 'Not Started' as const,
      progress: {
        'Edible Oil': 'Not Started' as const,
        'Flour': 'Not Started' as const,
        'Pasta': 'Not Started' as const
      },
      latitude: coords.lat,
      longitude: coords.lng
    };
  });
}

/**
 * Attaches/updates SAP Code on existing Outlet objects by matching against live PJP MT master records,
 * preserving visit progress & audit status intact.
 */
export function enrichOutletsWithLivePjpSapCodes(
  outlets: Outlet[],
  dataset: LivePjpDataset
): Outlet[] {
  const master = dataset.masterOutlets || [];
  if (master.length === 0) return outlets;

  return outlets.map((o) => {
    if (o.code && normalizeSapCode(o.code)) return o;

    const nameNorm = o.name.trim().toLowerCase();
    const branchNorm = (o.branch || '').trim().toLowerCase();

    const matched = master.find((m) => {
      if (!m.code) return false;
      const mRaw = (m.rawName || m.name || '').trim().toLowerCase();
      const mName = (m.name || '').trim().toLowerCase();
      if (mRaw === nameNorm || mName === nameNorm) return true;
      if (branchNorm && mRaw.includes(branchNorm) && (!o.account || (m.account || '').toLowerCase() === o.account.toLowerCase())) {
        return true;
      }
      return false;
    });

    if (!matched?.code) return o;
    return {
      ...o,
      code: matched.code,
      account: o.account || matched.account
    };
  });
}

/**
 * Summarizes SAP Code match status across a PJP outlet list and the active Planograms list.
 */
export function summarizeSapPlanogramMatches(
  outlets: Outlet[],
  planograms: PlanogramRecord[]
): {
  matchedOutletsCount: number;
  totalOutletsCount: number;
  matchedSapCodes: Set<string>;
} {
  const activePlanSaps = new Set(
    planograms
      .filter((p) => p.status === 'active')
      .map((p) => normalizeSapCode(p.sap_code))
      .filter(Boolean)
  );

  const matchedSapCodes = new Set<string>();
  let matchedOutletsCount = 0;

  outlets.forEach((o) => {
    const sap = normalizeSapCode(o.code);
    if (sap && activePlanSaps.has(sap)) {
      matchedSapCodes.add(sap);
      matchedOutletsCount++;
    }
  });

  return {
    matchedOutletsCount,
    totalOutletsCount: outlets.length,
    matchedSapCodes
  };
}
