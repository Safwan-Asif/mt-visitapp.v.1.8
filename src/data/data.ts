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
  total: number;
}

export interface NextStopEstimate {
  outlet: MapOutlet;
  distanceKm: number;
  etaMinutes: number;
  isDemoEstimate: true;
}

export interface MapOutlet {
  id: string;
  name: string;
  area: string;
  channel: 'Hypermarket' | 'Supermarket' | 'Express';
  latitude: number;
  longitude: number;
  visitStatus: VisitStatus;
  healthStatus: OutletHealthStatus;
  scheduledForToday: boolean;
  visitOrder: number | null;
  sosScore: number; // 0 - 5 scale
  previousSosScore: number;
  planogramPercentage: number; // 0 - 100
  previousPlanogramPercentage: number;
  oosSkuCount: number;
  lastVisitDate: string; // ISO YYYY-MM-DD
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
}

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
 * - Health status is tracked independently of visitStatus.
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
    planogramPercentage: 74,
    previousPlanogramPercentage: 79,
    oosSkuCount: 3,
    lastVisitDate: '2026-11-18',
    issues: ['Oil shelf facings dropped', '3 SKUs out of stock']
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
    planogramPercentage: 61,
    previousPlanogramPercentage: 71,
    oosSkuCount: 5,
    lastVisitDate: '2026-11-18',
    issues: ['Severe cooking oil OOS', 'Competitor end-cap encroachment']
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
    planogramPercentage: 68,
    previousPlanogramPercentage: 76,
    oosSkuCount: 4,
    lastVisitDate: '2026-11-12',
    issues: ['Low shelf visibility', '4 SKUs currently out of stock']
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
    planogramPercentage: 75,
    previousPlanogramPercentage: 78,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-13',
    issues: ['Planogram misalignment on flour bay']
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
    planogramPercentage: 71,
    previousPlanogramPercentage: 75,
    oosSkuCount: 3,
    lastVisitDate: '2026-11-11',
    issues: ['SOS decline on premium oil', '3 SKUs out of stock']
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
    planogramPercentage: 76,
    previousPlanogramPercentage: 79,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-12',
    issues: ['Shelf tag verification needed']
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
    planogramPercentage: 64,
    previousPlanogramPercentage: 72,
    oosSkuCount: 6,
    lastVisitDate: '2026-11-07',
    issues: ['6 SKUs out of stock', 'Planogram non-compliance']
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
    planogramPercentage: 77,
    previousPlanogramPercentage: 81,
    oosSkuCount: 2,
    lastVisitDate: '2026-11-14',
    issues: ['2 low-stock cooking oil SKUs', 'Planogram spacing check']
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
export function getDaysSinceLastVisit(lastVisitDate: string, referenceDate: Date = new Date('2026-11-18T12:00:00Z')): number {
  const parsed = new Date(`${lastVisitDate}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return 0;
  const diffMs = referenceDate.getTime() - parsed.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Deterministic threshold-based one-line intelligence summary.
 * Never randomized; strictly computed from outlet KPI thresholds.
 */
export function getDeterministicOutletInsight(outlet: MapOutlet): string {
  const lowSos = outlet.sosScore < 3.4;
  const warnSos = outlet.sosScore >= 3.4 && outlet.sosScore < 3.8;
  const lowPlanogram = outlet.planogramPercentage < 70;
  const warnPlanogram = outlet.planogramPercentage >= 70 && outlet.planogramPercentage < 82;
  const highOos = outlet.oosSkuCount >= 4;
  const modOos = outlet.oosSkuCount >= 2 && outlet.oosSkuCount <= 3;

  if (lowSos && highOos) {
    return `Low shelf visibility · ${outlet.oosSkuCount} SKUs currently out of stock`;
  }
  if (lowPlanogram && highOos) {
    return `Planogram drift at ${outlet.planogramPercentage}% · ${outlet.oosSkuCount} SKUs out of stock`;
  }
  if (highOos) {
    return `Critical replenishment gap · ${outlet.oosSkuCount} SKUs currently out of stock`;
  }
  if (lowSos) {
    return `Low shelf visibility (${outlet.sosScore.toFixed(1)}/5) · Shelf recovery needed`;
  }
  if (lowPlanogram) {
    return `Planogram compliance at ${outlet.planogramPercentage}% · Bay reset required`;
  }
  if (warnSos && modOos) {
    return `Moderate SOS slip · ${outlet.oosSkuCount} SKUs awaiting restock`;
  }
  if (warnPlanogram && modOos) {
    return `Planogram at ${outlet.planogramPercentage}% · ${outlet.oosSkuCount} SKUs currently out of stock`;
  }
  if (modOos) {
    return `Minor availability watch · ${outlet.oosSkuCount} SKUs low or out of stock`;
  }
  if (warnSos || warnPlanogram) {
    return `Shelf holding steady · Minor facing alignment recommended`;
  }
  if (outlet.oosSkuCount === 1) {
    return `Strong execution · 1 SKU replenishment check on next visit`;
  }
  return `Optimal shelf presence · Full SKU availability & planogram alignment`;
}

/**
 * Derive Outlet Health breakdown counts directly from the outlet records.
 */
export function deriveHealthBreakdown(outlets: MapOutlet[]): HealthBreakdown {
  let healthy = 0;
  let attention = 0;
  let critical = 0;

  for (const outlet of outlets) {
    if (outlet.healthStatus === 'critical') critical += 1;
    else if (outlet.healthStatus === 'attention') attention += 1;
    else healthy += 1;
  }

  return {
    healthy,
    attention,
    critical,
    total: outlets.length
  };
}

/**
 * Deterministic list of active issues for the Issues Requiring Attention panel.
 */
export function getDeterministicOutletIssues(outlet: MapOutlet): string[] {
  const result: string[] = [];
  if (outlet.oosSkuCount > 0) {
    result.push(
      `${outlet.oosSkuCount} ${outlet.oosSkuCount === 1 ? 'SKU' : 'SKUs'} currently out of stock`
    );
  }
  if (outlet.planogramPercentage < 82) {
    result.push('Planogram compliance below target');
  }
  if (outlet.sosScore < 3.5) {
    result.push('SOS below 3.5');
  } else if (outlet.sosScore < 3.8) {
    result.push('SOS slightly under 3.8 benchmark');
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
  const actions: string[] = [];
  if (outlet.oosSkuCount > 0) {
    actions.push('Check missing SKUs');
  }
  if (outlet.planogramPercentage < 85) {
    actions.push('Correct shelf arrangement');
  }
  if (outlet.sosScore < 4.0) {
    actions.push('Improve brand visibility');
  }
  if (actions.length < 3) {
    actions.push('Verify promotional price tags');
  }
  if (actions.length < 3) {
    actions.push('Capture post-restock shelf photo');
  }
  return actions.slice(0, 3);
}

/**
 * Compute an illustrative demo distance & ETA estimate to the next pending visit.
 * Explicitly marked as a demonstration estimate rather than live traffic routing.
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
