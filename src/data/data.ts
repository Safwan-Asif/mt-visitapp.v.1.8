export type VisitStatus = 'planned' | 'completed' | 'unscheduled';

export type OutletHealthStatus = 'healthy' | 'attention' | 'critical';

export type PerformanceLayerId =
  | 'visit_status'
  | 'sos_performance'
  | 'planogram_compliance'
  | 'out_of_stock'
  | 'priority_outlets'
  | 'last_visit';

export type MapFilterChipId = 'all' | 'planned' | 'completed' | 'issues';

export type QuickFilterId = 'planned' | 'completed' | 'attention' | 'critical';

export type MapBaseStyle = 'satellite' | 'tactical_terrain' | 'tactical_dark';

export interface MapBaseStyleConfig {
  id: MapBaseStyle;
  label: string;
  shortLabel: string;
  description: string;
  tileUrl: string;
  attribution: string;
}

export const MAP_BASE_STYLES: MapBaseStyleConfig[] = [
  {
    id: 'satellite',
    label: 'Esri Satellite',
    shortLabel: 'Satellite',
    description: 'High-resolution Doha satellite imagery',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
  },
  {
    id: 'tactical_terrain',
    label: 'Tactical Terrain',
    shortLabel: 'Terrain',
    description: 'Dark topographic road & contour grading',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  },
  {
    id: 'tactical_dark',
    label: 'Tactical Dark',
    shortLabel: 'Dark',
    description: 'High-contrast midnight vector streets',
    tileUrl: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }
];

export interface DohaLandmark {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  kind: 'stadium' | 'corniche' | 'airport';
  arrowDirection?: 'left' | 'right';
}

export interface HealthBreakdown {
  healthy: number;
  attention: number;
  critical: number;
  pending?: number;
  total: number;
}

export interface NextStopEstimate {
  outlet: MapOutlet;
  distanceKm: number;
  etaMinutes: number;
  isDemoEstimate: true;
}

export interface RoadRouteResult {
  coordinates: [number, number][];
  source: 'osrm' | 'arterial_fallback';
  distanceMeters?: number;
  durationSeconds?: number;
}

export interface MapOutlet {
  id: string;
  sapCode?: string;
  hasAuditHistory?: boolean;
  name: string;
  area: string;
  channel: 'Hypermarket' | 'Supermarket' | 'Express';
  latitude: number;
  longitude: number;
  visitStatus: VisitStatus;
  healthStatus: OutletHealthStatus;
  scheduledForToday: boolean;
  visitOrder: number | null;
  sosScore: number; // 0 - 5 aggregate index
  previousSosScore: number;
  flourSosPct: number; // Target > 50%
  edibleOilSosPct: number; // Target > 50%
  pastaSosPct: number; // Target > 50%
  planogramPercentage: number; // 0 - 100
  previousPlanogramPercentage: number;
  oosSkuCount: number;
  lastVisitDate: string; // ISO YYYY-MM-DD or '' if unaudited
  issues: string[];
}

export interface JourneyMetrics {
  totalAssigned: number;
  plannedToday: number;
  completedToday: number;
  pendingToday: number;
  progressPercent: number;
}

export interface ExecutiveLocation {
  latitude: number;
  longitude: number;
  label: string;
  isLiveGps: boolean;
  accuracyMeters?: number;
}

export const SOS_TARGET_PCT = 50;

export const DOHA_CENTER: [number, number] = [25.2854, 51.531];

export const DEFAULT_EXECUTIVE_LOCATION: ExecutiveLocation = {
  latitude: 25.2768,
  longitude: 51.5236,
  label: 'Field Executive · Doha Central (Demo)',
  isLiveGps: false
};

/**
 * 18 demonstration outlet records across Doha, Qatar.
 * Approximate coordinates are illustrative demonstration positions only,
 * not verified business GPS coordinates.
 *
 * Relationships:
 * - Total assigned: 18
 * - Scheduled for today: 8 (visitOrder 1..8)
 *   - Completed today: 5 (visitOrder 1..5)
 *   - Planned pending: 3 (visitOrder 6..8)
 * - Assigned but not planned today: 10 (visitOrder null)
 * - Health breakdown: 8 Healthy, 6 Needs Attention, 4 Critical (independent of visitStatus)
 * - Category SOS% target: > 50% for Flour, Edible Oil, and Pasta
 */
export const MOCK_DOHA_OUTLETS: MapOutlet[] = [
  // --- TODAY'S 5 COMPLETED VISITS (visitOrder 1..5) ---
  {
    id: 'MT-QA-101',
    name: 'Carrefour City Center',
    area: 'West Bay, Doha',
    channel: 'Hypermarket',
    latitude: 25.3256,
    longitude: 51.5295,
    visitStatus: 'completed',
    healthStatus: 'healthy',
    scheduledForToday: true,
    visitOrder: 1,
    sosScore: 4.4,
    previousSosScore: 4.1,
    flourSosPct: 64,
    edibleOilSosPct: 58,
    pastaSosPct: 61,
    planogramPercentage: 92,
    previousPlanogramPercentage: 88,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-18',
    issues: []
  },
  {
    id: 'MT-QA-102',
    name: 'Monoprix West Bay',
    area: 'Al Dafna, Doha',
    channel: 'Supermarket',
    latitude: 25.3172,
    longitude: 51.5228,
    visitStatus: 'completed',
    healthStatus: 'healthy',
    scheduledForToday: true,
    visitOrder: 2,
    sosScore: 4.1,
    previousSosScore: 4.0,
    flourSosPct: 59,
    edibleOilSosPct: 54,
    pastaSosPct: 56,
    planogramPercentage: 86,
    previousPlanogramPercentage: 84,
    oosSkuCount: 1,
    lastVisitDate: '2026-11-18',
    issues: ['1 low-stock pasta SKU']
  },
  {
    id: 'MT-QA-103',
    name: 'Al Meera Al Mansoura',
    area: 'Al Mansoura, Doha',
    channel: 'Supermarket',
    latitude: 25.2749,
    longitude: 51.5398,
    visitStatus: 'completed',
    healthStatus: 'attention',
    scheduledForToday: true,
    visitOrder: 3,
    sosScore: 3.4,
    previousSosScore: 3.7,
    flourSosPct: 53,
    edibleOilSosPct: 44,
    pastaSosPct: 49,
    planogramPercentage: 74,
    previousPlanogramPercentage: 79,
    oosSkuCount: 3,
    lastVisitDate: '2026-11-18',
    issues: ['Oil shelf facings dropped below 50%', '3 SKUs out of stock']
  },
  {
    id: 'MT-QA-104',
    name: 'Lulu Express Bin Mahmoud',
    area: 'Bin Mahmoud, Doha',
    channel: 'Express',
    latitude: 25.2842,
    longitude: 51.5141,
    visitStatus: 'completed',
    healthStatus: 'healthy',
    scheduledForToday: true,
    visitOrder: 4,
    sosScore: 4.0,
    previousSosScore: 3.8,
    flourSosPct: 57,
    edibleOilSosPct: 53,
    pastaSosPct: 55,
    planogramPercentage: 84,
    previousPlanogramPercentage: 80,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-18',
    issues: []
  },
  {
    id: 'MT-QA-105',
    name: 'Safari Hypermarket Salwa',
    area: 'Salwa Road, Doha',
    channel: 'Hypermarket',
    latitude: 25.2618,
    longitude: 51.4914,
    visitStatus: 'completed',
    healthStatus: 'critical',
    scheduledForToday: true,
    visitOrder: 5,
    sosScore: 2.6,
    previousSosScore: 3.3,
    flourSosPct: 43,
    edibleOilSosPct: 36,
    pastaSosPct: 41,
    planogramPercentage: 61,
    previousPlanogramPercentage: 71,
    oosSkuCount: 5,
    lastVisitDate: '2026-11-18',
    issues: ['Severe cooking oil OOS', 'All categories below 50% SOS target']
  },

  // --- TODAY'S 3 PENDING PLANNED VISITS (visitOrder 6..8) ---
  {
    id: 'MT-QA-106',
    name: 'Lulu Hypermarket',
    area: 'Al Muntazah, Doha',
    channel: 'Hypermarket',
    latitude: 25.2698,
    longitude: 51.5315,
    visitStatus: 'planned',
    healthStatus: 'critical',
    scheduledForToday: true,
    visitOrder: 6,
    sosScore: 3.2,
    previousSosScore: 3.8,
    flourSosPct: 47,
    edibleOilSosPct: 38,
    pastaSosPct: 54,
    planogramPercentage: 68,
    previousPlanogramPercentage: 76,
    oosSkuCount: 4,
    lastVisitDate: '2026-11-12',
    issues: ['Edible Oil & Flour below 50% SOS', '4 SKUs currently out of stock']
  },
  {
    id: 'MT-QA-107',
    name: 'Carrefour Villaggio',
    area: 'Al Waab, Doha',
    channel: 'Hypermarket',
    latitude: 25.2602,
    longitude: 51.4426,
    visitStatus: 'planned',
    healthStatus: 'attention',
    scheduledForToday: true,
    visitOrder: 7,
    sosScore: 3.5,
    previousSosScore: 3.6,
    flourSosPct: 48,
    edibleOilSosPct: 52,
    pastaSosPct: 55,
    planogramPercentage: 75,
    previousPlanogramPercentage: 78,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-13',
    issues: ['Flour bay SOS below 50% target', 'Planogram misalignment']
  },
  {
    id: 'MT-QA-108',
    name: 'Al Meera Old Airport',
    area: 'Old Airport, Doha',
    channel: 'Supermarket',
    latitude: 25.2524,
    longitude: 51.5568,
    visitStatus: 'planned',
    healthStatus: 'healthy',
    scheduledForToday: true,
    visitOrder: 8,
    sosScore: 4.3,
    previousSosScore: 4.2,
    flourSosPct: 62,
    edibleOilSosPct: 57,
    pastaSosPct: 60,
    planogramPercentage: 89,
    previousPlanogramPercentage: 87,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-15',
    issues: []
  },

  // --- 10 ASSIGNED OUTLETS NOT PLANNED FOR TODAY ---
  {
    id: 'MT-QA-109',
    name: 'Monoprix Pearl Qatar',
    area: 'The Pearl, Doha',
    channel: 'Supermarket',
    latitude: 25.3688,
    longitude: 51.5476,
    visitStatus: 'unscheduled',
    healthStatus: 'healthy',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 4.5,
    previousSosScore: 4.4,
    flourSosPct: 66,
    edibleOilSosPct: 61,
    pastaSosPct: 65,
    planogramPercentage: 94,
    previousPlanogramPercentage: 92,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-16',
    issues: []
  },
  {
    id: 'MT-QA-110',
    name: 'Al Meera Legtaifiya',
    area: 'Legtaifiya, Doha',
    channel: 'Supermarket',
    latitude: 25.3512,
    longitude: 51.5191,
    visitStatus: 'unscheduled',
    healthStatus: 'attention',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 3.4,
    previousSosScore: 3.7,
    flourSosPct: 52,
    edibleOilSosPct: 48,
    pastaSosPct: 45,
    planogramPercentage: 73,
    previousPlanogramPercentage: 77,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-10',
    issues: ['Missing secondary pasta display', '2 SKUs out of stock']
  },
  {
    id: 'MT-QA-111',
    name: 'Carrefour Landmark',
    area: 'Al Gharafa, Doha',
    channel: 'Hypermarket',
    latitude: 25.3319,
    longitude: 51.4648,
    visitStatus: 'unscheduled',
    healthStatus: 'healthy',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 4.2,
    previousSosScore: 4.0,
    flourSosPct: 58,
    edibleOilSosPct: 55,
    pastaSosPct: 57,
    planogramPercentage: 88,
    previousPlanogramPercentage: 85,
    oosSkuCount: 1,
    lastVisitDate: '2026-11-15',
    issues: ['1 low-stock flour pack']
  },
  {
    id: 'MT-QA-112',
    name: 'Lulu Hypermarket Al Gharafa',
    area: 'Al Gharafa North, Doha',
    channel: 'Hypermarket',
    latitude: 25.3446,
    longitude: 51.4545,
    visitStatus: 'unscheduled',
    healthStatus: 'critical',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 2.8,
    previousSosScore: 3.5,
    flourSosPct: 44,
    edibleOilSosPct: 39,
    pastaSosPct: 46,
    planogramPercentage: 62,
    previousPlanogramPercentage: 74,
    oosSkuCount: 5,
    lastVisitDate: '2026-11-08',
    issues: ['Overdue audit (10d)', '5 SKUs out of stock']
  },
  {
    id: 'MT-QA-113',
    name: 'Family Food Centre Al Nasr',
    area: 'Al Nasr, Doha',
    channel: 'Supermarket',
    latitude: 25.2798,
    longitude: 51.5038,
    visitStatus: 'unscheduled',
    healthStatus: 'healthy',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 4.1,
    previousSosScore: 3.9,
    flourSosPct: 56,
    edibleOilSosPct: 54,
    pastaSosPct: 58,
    planogramPercentage: 85,
    previousPlanogramPercentage: 82,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-16',
    issues: []
  },
  {
    id: 'MT-QA-114',
    name: 'Spar Tawar Mall',
    area: 'Al Duhail, Doha',
    channel: 'Hypermarket',
    latitude: 25.3414,
    longitude: 51.4879,
    visitStatus: 'unscheduled',
    healthStatus: 'attention',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 3.3,
    previousSosScore: 3.6,
    flourSosPct: 51,
    edibleOilSosPct: 42,
    pastaSosPct: 49,
    planogramPercentage: 71,
    previousPlanogramPercentage: 75,
    oosSkuCount: 3,
    lastVisitDate: '2026-11-11',
    issues: ['Edible Oil & Pasta SOS under 50%', '3 SKUs out of stock']
  },
  {
    id: 'MT-QA-115',
    name: 'Lulu D-Ring Road',
    area: 'Al Hilal, Doha',
    channel: 'Hypermarket',
    latitude: 25.2571,
    longitude: 51.5395,
    visitStatus: 'unscheduled',
    healthStatus: 'healthy',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 4.3,
    previousSosScore: 4.1,
    flourSosPct: 60,
    edibleOilSosPct: 56,
    pastaSosPct: 59,
    planogramPercentage: 90,
    previousPlanogramPercentage: 88,
    oosSkuCount: 0,
    lastVisitDate: '2026-11-17',
    issues: []
  },
  {
    id: 'MT-QA-116',
    name: 'Al Meera Najma',
    area: 'Najma, Doha',
    channel: 'Supermarket',
    latitude: 25.2689,
    longitude: 51.5484,
    visitStatus: 'unscheduled',
    healthStatus: 'attention',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 3.5,
    previousSosScore: 3.7,
    flourSosPct: 53,
    edibleOilSosPct: 47,
    pastaSosPct: 51,
    planogramPercentage: 76,
    previousPlanogramPercentage: 79,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-12',
    issues: ['Edible Oil SOS at 47%', 'Shelf tag verification needed']
  },
  {
    id: 'MT-QA-117',
    name: 'Grand Mall Hypermarket',
    area: 'Mesaimeer, Doha',
    channel: 'Hypermarket',
    latitude: 25.2328,
    longitude: 51.4986,
    visitStatus: 'unscheduled',
    healthStatus: 'critical',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 2.7,
    previousSosScore: 3.4,
    flourSosPct: 42,
    edibleOilSosPct: 37,
    pastaSosPct: 44,
    planogramPercentage: 64,
    previousPlanogramPercentage: 72,
    oosSkuCount: 6,
    lastVisitDate: '2026-11-07',
    issues: ['6 SKUs out of stock', 'All SOS categories below 50%']
  },
  {
    id: 'MT-QA-118',
    name: 'Al Meera Al Wakrah North',
    area: 'Al Wakrah, Doha South',
    channel: 'Supermarket',
    latitude: 25.2145,
    longitude: 51.5842,
    visitStatus: 'unscheduled',
    healthStatus: 'attention',
    scheduledForToday: false,
    visitOrder: null,
    sosScore: 3.5,
    previousSosScore: 3.8,
    flourSosPct: 49,
    edibleOilSosPct: 52,
    pastaSosPct: 48,
    planogramPercentage: 77,
    previousPlanogramPercentage: 81,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-14',
    issues: ['Flour & Pasta SOS near 50% threshold', '2 low-stock SKUs']
  }
];

export const DOHA_LANDMARKS: DohaLandmark[] = [
  {
    id: 'lm-lusail',
    name: 'Lusail Stadium',
    latitude: 25.4195,
    longitude: 51.4904,
    kind: 'stadium',
    arrowDirection: 'right'
  },
  {
    id: 'lm-corniche',
    name: 'Doha Corniche',
    latitude: 25.2942,
    longitude: 51.5396,
    kind: 'corniche'
  },
  {
    id: 'lm-hia',
    name: 'Hamad International Airport',
    latitude: 25.2609,
    longitude: 51.6088,
    kind: 'airport',
    arrowDirection: 'left'
  }
];

/**
 * Curated Doha arterial road-waypoint fallback tracing major expressways
 * (West Bay -> Corniche -> Al Mansoura C-Ring -> Bin Mahmoud -> Salwa Rd -> Al Muntazah -> Al Waab -> Old Airport)
 * used immediately until live OSRM road geometry loads (or if OSRM is unreachable).
 */
export const DOHA_ARTERIAL_ROUTE_FALLBACK: [number, number][] = [
  [25.3256, 51.5295], // 1. Carrefour City Center
  [25.3238, 51.5262],
  [25.3198, 51.5238],
  [25.3172, 51.5228], // 2. Monoprix West Bay
  [25.3125, 51.5266],
  [25.3028, 51.5335], // Corniche / Majlis Al Taawon St
  [25.2912, 51.5384],
  [25.2804, 51.5408], // Ras Abu Aboud / C-Ring approach
  [25.2749, 51.5398], // 3. Al Meera Al Mansoura
  [25.2742, 51.5318], // C-Ring Rd Westbound
  [25.2788, 51.5205],
  [25.2842, 51.5141], // 4. Lulu Express Bin Mahmoud
  [25.2782, 51.5094],
  [25.2695, 51.5022], // Salwa Rd / Ramada Signal
  [25.2618, 51.4914], // 5. Safari Hypermarket Salwa
  [25.2636, 51.5048], // Salwa Rd Eastbound
  [25.2678, 51.5218],
  [25.2698, 51.5315], // 6. Lulu Hypermarket Al Muntazah
  [25.2645, 51.5238], // Rawdat Al Khail / Wholesale Market St
  [25.2588, 51.5032],
  [25.2564, 51.4742], // Al Waab St
  [25.2602, 51.4426], // 7. Carrefour Villaggio
  [25.2498, 51.4545], // Sabah Al Ahmad Corridor / E-Ring
  [25.2442, 51.4925],
  [25.2448, 51.5322],
  [25.2524, 51.5568]  // 8. Al Meera Old Airport
];

/**
 * Fetch real street-following driving geometry via backend OSRM proxy,
 * returning curated Doha arterial waypoints cleanly on offline/timeout fallback.
 */
export async function fetchDrivingRoadRoute(
  waypoints: [number, number][]
): Promise<RoadRouteResult> {
  if (waypoints.length < 2) {
    return { coordinates: waypoints, source: 'arterial_fallback' };
  }

  try {
    const res = await fetch('/api/map/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ waypoints })
    });
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 429) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
    if (res.ok && contentType.includes('application/json')) {
      const json = await res.json();
      if (json?.quotaExceeded) {
        window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
      }
      if (json?.ok && Array.isArray(json.coordinates) && json.coordinates.length >= 2) {
        return {
          coordinates: json.coordinates,
          source: 'osrm',
          distanceMeters: json.distanceMeters,
          durationSeconds: json.durationSeconds
        };
      }
    }
  } catch {
    // Graceful arterial road fallback below
  }

  return {
    coordinates: DOHA_ARTERIAL_ROUTE_FALLBACK,
    source: 'arterial_fallback'
  };
}

/**
 * Derive Journey Progress HUD counters strictly from the dataset.
 */
export function deriveJourneyMetrics(outlets: MapOutlet[]): JourneyMetrics {
  const totalAssigned = outlets.length;
  const todaysOutlets = outlets.filter((o) => o.scheduledForToday);
  const plannedToday = todaysOutlets.length;
  const completedToday = todaysOutlets.filter((o) => o.visitStatus === 'completed').length;
  const pendingToday = todaysOutlets.filter((o) => o.visitStatus === 'planned').length;
  const progressPercent =
    plannedToday > 0 ? Math.round((completedToday / plannedToday) * 1000) / 10 : 0;

  return {
    totalAssigned,
    plannedToday,
    completedToday,
    pendingToday,
    progressPercent
  };
}

/**
 * Compute days elapsed since last visit relative to reference date.
 */
export function getDaysSinceLastVisit(
  lastVisitDate: string,
  referenceDate: Date = new Date()
): number {
  if (!lastVisitDate || !lastVisitDate.trim()) return -1;
  const parsed = new Date(`${lastVisitDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return -1;
  const diffMs = referenceDate.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export interface LastVisitRecency {
  days: number;
  relativeText: string;
  formattedDate: string;
  tone: 'recent' | 'attention' | 'overdue';
  badgeClass: string;
}

/**
 * Format human-readable relative recency and calendar date for Last Visit banners.
 */
export function formatLastVisitRecency(
  lastVisitDate: string,
  referenceDate: Date = new Date()
): LastVisitRecency | null {
  if (!lastVisitDate || !lastVisitDate.trim()) return null;
  const days = getDaysSinceLastVisit(lastVisitDate, referenceDate);
  if (days < 0) return null;
  const parsed = new Date(`${lastVisitDate.slice(0, 10)}T00:00:00Z`);
  const formattedDate = !Number.isNaN(parsed.getTime())
    ? parsed.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })
    : lastVisitDate;

  let relativeText = 'Today';
  let tone: 'recent' | 'attention' | 'overdue' = 'recent';
  let badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';

  if (days === 0) {
    relativeText = 'Today';
    tone = 'recent';
    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
  } else if (days === 1) {
    relativeText = '1 day ago';
    tone = 'recent';
    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
  } else if (days < 4) {
    relativeText = `${days} days ago`;
    tone = 'recent';
    badgeClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
  } else if (days < 8) {
    relativeText = `${days} days ago`;
    tone = 'attention';
    badgeClass = 'bg-amber-500/20 text-amber-300 border-amber-400/40';
  } else {
    relativeText = `${days} days ago · Overdue`;
    tone = 'overdue';
    badgeClass = 'bg-red-500/20 text-red-300 border-red-400/40';
  }

  return {
    days,
    relativeText,
    formattedDate,
    tone,
    badgeClass
  };
}

/**
 * Count how many categories are currently below the > 50% SOS target.
 */
export function getBelowTargetSosCategories(outlet: MapOutlet): string[] {
  if (outlet.hasAuditHistory === false) return [];
  const lagging: string[] = [];
  if (outlet.flourSosPct <= SOS_TARGET_PCT) lagging.push('Flour');
  if (outlet.edibleOilSosPct <= SOS_TARGET_PCT) lagging.push('Edible Oil');
  if (outlet.pastaSosPct <= SOS_TARGET_PCT) lagging.push('Pasta');
  return lagging;
}

/**
 * Deterministic threshold-based one-line intelligence summary.
 * Never randomized; strictly computed from outlet KPI thresholds.
 */
export function getDeterministicOutletInsight(outlet: MapOutlet): string {
  if (outlet.hasAuditHistory === false) {
    return outlet.scheduledForToday
      ? `Scheduled stop${outlet.visitOrder ? ` #${outlet.visitOrder}` : ''} today · Complete shelf audit to record KPIs`
      : 'Assigned territory outlet · Awaiting first audit record';
  }

  const laggingCats = getBelowTargetSosCategories(outlet);
  const lowPlanogram = outlet.planogramPercentage < 70;
  const warnPlanogram = outlet.planogramPercentage >= 70 && outlet.planogramPercentage < 82;
  const highOos = outlet.oosSkuCount >= 4;
  const modOos = outlet.oosSkuCount >= 2 && outlet.oosSkuCount <= 3;

  if (laggingCats.length > 0 && highOos) {
    return `${laggingCats.join(' & ')} SOS ≤50% · ${outlet.oosSkuCount} SKUs out of stock`;
  }
  if (lowPlanogram && highOos) {
    return `Planogram drift at ${outlet.planogramPercentage}% · ${outlet.oosSkuCount} SKUs out of stock`;
  }
  if (highOos) {
    return `Critical replenishment gap · ${outlet.oosSkuCount} SKUs currently out of stock`;
  }
  if (laggingCats.length > 0) {
    return `${laggingCats.join(', ')} SOS below 50% target · Expand shelf facings`;
  }
  if (lowPlanogram) {
    return `Planogram compliance at ${outlet.planogramPercentage}% · Bay reset required`;
  }
  if (warnPlanogram && modOos) {
    return `Planogram at ${outlet.planogramPercentage}% · ${outlet.oosSkuCount} SKUs out of stock`;
  }
  if (modOos) {
    return `Minor availability watch · ${outlet.oosSkuCount} SKUs awaiting restock`;
  }
  if (outlet.oosSkuCount === 1) {
    return `All SOS categories >50% target · 1 SKU restock check`;
  }
  return `All SOS categories above 50% target · Optimal shelf execution`;
}

/**
 * Derive Outlet Health breakdown counts directly from the audited outlet records.
 */
export function deriveHealthBreakdown(outlets: MapOutlet[]): HealthBreakdown {
  let healthy = 0;
  let attention = 0;
  let critical = 0;
  let pending = 0;

  for (const outlet of outlets) {
    if (outlet.hasAuditHistory === false) {
      pending += 1;
      continue;
    }
    if (outlet.healthStatus === 'critical') critical += 1;
    else if (outlet.healthStatus === 'attention') attention += 1;
    else healthy += 1;
  }

  return {
    healthy,
    attention,
    critical,
    pending,
    total: outlets.length
  };
}

/**
 * Deterministic list of active issues for the Issues Requiring Attention panel.
 */
export function getDeterministicOutletIssues(outlet: MapOutlet): string[] {
  if (outlet.hasAuditHistory === false) {
    return [];
  }
  const result: string[] = [];
  if (outlet.oosSkuCount > 0) {
    result.push(
      `${outlet.oosSkuCount} ${outlet.oosSkuCount === 1 ? 'SKU' : 'SKUs'} currently out of stock`
    );
  }
  if (outlet.planogramPercentage < 82) {
    result.push('Planogram compliance below target');
  }
  const lagging = getBelowTargetSosCategories(outlet);
  if (lagging.length > 0) {
    result.push(`${lagging.join(' & ')} SOS below 50% target`);
  }
  if (result.length === 0 && outlet.issues.length > 0) {
    return outlet.issues.slice(0, 3);
  }
  return result;
}

/**
 * Deterministic recommended actions derived from outlet thresholds.
 */
export function getDeterministicRecommendedActions(outlet: MapOutlet): string[] {
  if (outlet.hasAuditHistory === false) {
    return [
      'Capture shelf photos across categories',
      'Verify promotional price tags & POSM',
      'Log OOS and competitor visibility'
    ];
  }
  const actions: string[] = [];
  if (outlet.oosSkuCount > 0) {
    actions.push('Check missing SKUs');
  }
  if (outlet.planogramPercentage < 85) {
    actions.push('Correct shelf arrangement');
  }
  if (getBelowTargetSosCategories(outlet).length > 0) {
    actions.push('Reclaim facings to reach >50% SOS');
  }
  if (actions.length < 3) {
    actions.push('Verify promotional price tags');
  }
  if (actions.length < 3) {
    actions.push('Confirm POSM wobbler placement');
  }
  return actions.slice(0, 3);
}

/**
 * Compute an illustrative demo distance & ETA estimate to the next pending visit.
 */
export function getNextStopDemoEstimate(
  outlets: MapOutlet[],
  execLoc: ExecutiveLocation
): NextStopEstimate | null {
  const nextPending = outlets
    .filter((o) => o.scheduledForToday && o.visitStatus === 'planned')
    .sort((a, b) => (a.visitOrder ?? 99) - (b.visitOrder ?? 99))[0];

  if (!nextPending) return null;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(nextPending.latitude - execLoc.latitude);
  const dLng = toRad(nextPending.longitude - execLoc.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(execLoc.latitude)) *
      Math.cos(toRad(nextPending.latitude)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const straightKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const demoKm = Math.max(0.8, Number((straightKm * 1.25).toFixed(1)));
  const demoMinutes = Math.max(4, Math.round((demoKm / 26) * 60 + 2));

  return {
    outlet: nextPending,
    distanceKm: demoKm,
    etaMinutes: demoMinutes,
    isDemoEstimate: true
  };
}

/**
 * Future-ready data source abstraction so Google Sheets or Supabase
 * can replace the demonstration outlet records cleanly.
 */
export interface MapOutletDataSource {
  loadOutlets(): Promise<MapOutlet[]>;
}

export const mockOutletDataSource: MapOutletDataSource = {
  async loadOutlets(): Promise<MapOutlet[]> {
    return MOCK_DOHA_OUTLETS;
  }
};
