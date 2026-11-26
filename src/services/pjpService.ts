import {
  CategoryAuditRecord,
  CategoryType,
  Outlet,
  PlanogramRecord,
  UserProfile
} from '../types';
import { CATEGORIES, INITIAL_OUTLETS, MasterOutletOption } from '../constants';
import {
  ALL_EXECUTIVE_PROFILES,
  MASTER_PJP_OUTLETS,
  PJP_DEFAULT_SECURITY_PIN,
  PJP_SCHEDULE_VISITS,
  PjpVisitRow
} from '../data/pjpMasterData';
import { MapOutlet, OutletHealthStatus, VisitStatus } from '../data/data';
import { normalizeSapCode } from './planogramService';
import {
  OLD_DOHA_PORT_FALLBACK,
  resolveDohaAreaCoords,
  isSyntheticOrOffshoreCoord
} from '../utils/dohaCoords';

export { OLD_DOHA_PORT_FALLBACK };

const PJP_LIVE_STORAGE_KEY = 'mta_live_pjp_cache_v2';

export interface SyncedExecutiveProfile {
  repRoster?: string;
  repId: string;
  rawRepId: string;
  name: string;
  username: string;
  pin: string;
  territory: string;
  role: string;
}

export interface SyncedCustomerMasterRecord {
  sapCode: string;
  custName: string;
  account: string;
  branch: string;
  area: string;
  channel: 'Hypermarket' | 'Supermarket' | 'Express';
  latitude: number | null;
  longitude: number | null;
  status: string;
}

export interface SyncedAssignmentRecord {
  month: string;
  repId: string;
  executive: string;
  sapCode: string;
  isActive: boolean;
}

export interface SyncedPjpScheduleRecord {
  date: string;
  day: string;
  repId: string;
  executive: string;
  sapCode: string;
  visitOrder: number;
  plannedCategories: string[];
}

export interface SyncedSheet2Visit {
  date: string;
  sapCode: string;
  repId: string;
  visitStatus: string;
}

export interface SyncedSheet2CategoryAudit {
  date: string;
  sapCode: string;
  category: string;
  shareOfShelfPct: number;
  planogramCompliancePct: number;
  oosSkuCount: number;
  needsReview: boolean;
  issuesSummary: string;
}

export interface LivePjpDataset {
  visits: PjpVisitRow[];
  masterOutlets: MasterOutletOption[];
  customerMaster?: SyncedCustomerMasterRecord[];
  assignments?: SyncedAssignmentRecord[];
  scheduleRows?: SyncedPjpScheduleRecord[];
  executives?: SyncedExecutiveProfile[];
  sheet2Visits?: SyncedSheet2Visit[];
  sheet2Audits?: SyncedSheet2CategoryAudit[];
  fetchedAt: number;
  source: string;
}

let memoryPjpCache: LivePjpDataset | null = null;

function hydratePjpFromStorage(): LivePjpDataset | null {
  try {
    const raw = localStorage.getItem(PJP_LIVE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.visits) || Array.isArray(parsed?.customerMaster)) {
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
    customerMaster: [],
    assignments: [],
    scheduleRows: [],
    executives: ALL_EXECUTIVE_PROFILES.map((e, idx) => ({
      repRoster: String(idx + 1),
      repId: e.repId,
      rawRepId: String(e.repId || '').replace(/^#/, ''),
      name: e.name,
      username: e.username,
      pin: e.pin || PJP_DEFAULT_SECURITY_PIN,
      territory: e.territory,
      role: e.role
    })),
    sheet2Visits: [],
    sheet2Audits: [],
    fetchedAt: 0,
    source: 'static_fallback'
  };
}

export function normalizeRepIdToken(raw?: string): string {
  return String(raw || '')
    .trim()
    .replace(/^#/, '')
    .replace(/^0+/, '')
    .toLowerCase();
}

export function matchesExecutiveIdentity(
  rowExecutive: string | undefined,
  rowRepId: string | undefined,
  execName: string | undefined,
  execRepId?: string
): boolean {
  const targetName = String(execName || '').trim().toLowerCase();
  const rowName = String(rowExecutive || '').trim().toLowerCase();
  if (targetName && rowName && rowName === targetName) return true;

  const targetRep = normalizeRepIdToken(execRepId);
  const rowRep = normalizeRepIdToken(rowRepId);
  if (targetRep && rowRep && targetRep === rowRep) return true;

  return false;
}

/**
 * Fetches live 4-tab MT PJP & GeoIntel Google Sheet dataset from backend proxy.
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
      const customerMaster = Array.isArray(json?.customerMaster) ? json.customerMaster : [];
      const assignments = Array.isArray(json?.assignments) ? json.assignments : [];
      const scheduleRows = Array.isArray(json?.scheduleRows) ? json.scheduleRows : [];
      const executives = Array.isArray(json?.executives) ? json.executives : [];
      const visits = Array.isArray(json?.visits) ? json.visits : [];
      const masterOutlets = Array.isArray(json?.masterOutlets) ? json.masterOutlets : [];
      const sheet2Visits = Array.isArray(json?.sheet2Visits) ? json.sheet2Visits : [];
      const sheet2Audits = Array.isArray(json?.sheet2Audits) ? json.sheet2Audits : [];

      if (
        customerMaster.length > 0 ||
        visits.length > 0 ||
        executives.length > 0 ||
        assignments.length > 0
      ) {
        const dataset: LivePjpDataset = {
          visits,
          masterOutlets,
          customerMaster,
          assignments,
          scheduleRows,
          executives,
          sheet2Visits,
          sheet2Audits,
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

export function getCachedExecutives(dataset?: LivePjpDataset): SyncedExecutiveProfile[] {
  const ds = dataset || getCachedLivePjpData();
  if (Array.isArray(ds.executives) && ds.executives.length > 0) {
    return ds.executives;
  }
  return getFallbackPjpDataset().executives || [];
}

export function resolveOutletCoordinates(
  outlet: Pick<Outlet, 'name' | 'branch' | 'address' | 'latitude' | 'longitude'>,
  fallbackIndex: number = 0
): { lat: number; lng: number } {
  if (!isSyntheticOrOffshoreCoord(outlet.latitude, outlet.longitude)) {
    return { lat: outlet.latitude as number, lng: outlet.longitude as number };
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

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Route optimization backend (/api/pjp/optimize-route) is unavailable in static-only hosting; deploy with the Node server.'
    );
  }

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

function pickScheduleDateForExecutive<T extends { date?: string; day?: string }>(rows: T[]): string {
  if (rows.length === 0) return '';
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const todayUtc = now.toISOString().slice(0, 10);

  if (rows.some((r) => r.date === localToday)) return localToday;
  if (rows.some((r) => r.date === todayUtc)) return todayUtc;

  const todayWeekday = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  const weekdayMatch = rows.find((r) => String(r.day || '').trim().toLowerCase() === todayWeekday);
  if (weekdayMatch?.date) return weekdayMatch.date;

  // Prefer closest future/current date, otherwise most recent past date
  const uniqueDates = Array.from(new Set(rows.map((r) => String(r.date || '')).filter(Boolean))).sort();
  if (uniqueDates.length === 0) return '';
  const nextOrToday = uniqueDates.find((d) => d >= localToday);
  return nextOrToday || uniqueDates[uniqueDates.length - 1];
}

/**
 * Builds today's (or active schedule date's) Outlet[] from live 4-tab PJP Google Sheet,
 * using real Customer_Master GPS coordinates & SAP codes for ALL executives.
 */
export function buildExecutiveOutletsFromLivePjp(
  execName: string,
  dataset: LivePjpDataset,
  execRepId?: string,
  audits: Record<string, CategoryAuditRecord> = {}
): Outlet[] {
  const cmBySap = new Map<string, SyncedCustomerMasterRecord>();
  (dataset.customerMaster || []).forEach((cm) => {
    const sap = normalizeSapCode(cm.sapCode);
    if (sap) cmBySap.set(sap, cm);
  });

  // Prefer structured scheduleRows from PJP_Schedule tab
  const schedSource: PjpVisitRow[] =
    Array.isArray(dataset.scheduleRows) && dataset.scheduleRows.length > 0
      ? dataset.scheduleRows.map((sr) => {
          const sap = normalizeSapCode(sr.sapCode);
          const cm = cmBySap.get(sap);
          return {
            date: sr.date,
            day: sr.day,
            repId: sr.repId,
            executive: sr.executive,
            account: cm?.account || '',
            outlet: cm?.custName || `Outlet ${sr.sapCode}`,
            code: sr.sapCode,
            sapCode: sr.sapCode,
            area: cm?.area || cm?.branch || 'Doha',
            visitOrder: sr.visitOrder,
            plannedCategories: sr.plannedCategories,
            latitude: cm?.latitude ?? undefined,
            longitude: cm?.longitude ?? undefined
          };
        })
      : dataset.visits || [];

  const execVisits = schedSource.filter((v) =>
    matchesExecutiveIdentity(v.executive, v.repId, execName, execRepId)
  );

  if (execVisits.length === 0) {
    return enrichOutletsWithLivePjpSapCodes(INITIAL_OUTLETS, dataset);
  }

  const targetDate = pickScheduleDateForExecutive(execVisits);
  const selectedVisits = targetDate
    ? execVisits.filter((v) => v.date === targetDate)
    : execVisits;

  const sortedVisits = [...selectedVisits].sort(
    (a, b) => (a.visitOrder ?? 999) - (b.visitOrder ?? 999)
  );

  // Deduplicate by SAP Code / outlet name within the selected day
  const seen = new Set<string>();
  const uniqueVisits: PjpVisitRow[] = [];
  sortedVisits.forEach((v) => {
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
    const cm = cmBySap.get(normalizeSapCode(sap));
    const rawOutletName = cm?.custName || v.outlet;
    const outletName =
      v.account && !rawOutletName.toLowerCase().startsWith(v.account.toLowerCase())
        ? `${v.account} - ${rawOutletName}`
        : rawOutletName;

    const rawLat = cm?.latitude ?? v.latitude;
    const rawLng = cm?.longitude ?? v.longitude;
    const coords =
      !isSyntheticOrOffshoreCoord(rawLat, rawLng)
        ? { lat: Number(rawLat), lng: Number(rawLng) }
        : resolveDohaAreaCoords(`${outletName} ${v.area || ''} ${v.account || ''}`, idx);

    const id = sap
      ? `out-sap-${sap}`
      : `out-pjp-${idx + 1}-${Math.abs(
          (v.executive + rawOutletName)
            .split('')
            .reduce((a, b) => (a << 5) - a + b.charCodeAt(0), 0)
        )}`;

    const progress: Record<CategoryType, 'Not Started' | 'In Progress' | 'Completed'> = {
      'Edible Oil': 'Not Started',
      Flour: 'Not Started',
      Pasta: 'Not Started'
    };

    CATEGORIES.forEach((cat) => {
      const hasAudit =
        Boolean(audits[`${id}_${cat}`]) ||
        Boolean(sap && audits[`out-sap-${sap}_${cat}`]) ||
        Boolean(sap && audits[`${sap}_${cat}`]);
      if (hasAudit) progress[cat] = 'Completed';
    });

    const statuses = Object.values(progress);
    const status: Outlet['status'] = statuses.every((s) => s === 'Completed')
      ? 'Completed'
      : statuses.some((s) => s === 'Completed')
      ? 'In Progress'
      : 'Not Started';

    return {
      id,
      name: outletName,
      code: sap || undefined,
      account: cm?.account || v.account || undefined,
      branch: cm?.branch || v.area || v.account || 'Doha',
      sequence: `${idx + 1} of ${total}`,
      address: `${cm?.area || v.area ? `${cm?.area || v.area}, ` : ''}${
        cm?.account || v.account ? `${cm?.account || v.account}, ` : ''
      }Qatar`,
      status,
      progress,
      latitude: coords.lat,
      longitude: coords.lng
    };
  });
}

/**
 * Reconciles the rep's active PJP Route list cleanly against live PJP_Schedule (#gid=1710652195),
 * preserving category audit progress (from existing outlets + local audits) and manually added
 * unmapped stores while dropping stale fallback INITIAL_OUTLETS.
 */
export function reconcileOutletsWithLivePjp(
  existingOutlets: Outlet[],
  execName: string,
  dataset: LivePjpDataset,
  execRepId?: string,
  audits: Record<string, CategoryAuditRecord> = {}
): Outlet[] {
  const hasLiveSchedule = (dataset.scheduleRows || []).some((s) =>
    matchesExecutiveIdentity(s.executive, s.repId, execName, execRepId)
  ) || (dataset.visits || []).some((v) =>
    matchesExecutiveIdentity(v.executive, v.repId, execName, execRepId)
  );

  if (!hasLiveSchedule) {
    return existingOutlets.length > 0
      ? enrichOutletsWithLivePjpSapCodes(existingOutlets, dataset)
      : buildExecutiveOutletsFromLivePjp(execName, dataset, execRepId);
  }

  const liveScheduledOutlets = buildExecutiveOutletsFromLivePjp(execName, dataset, execRepId);
  const existingBySap = new Map<string, Outlet>();
  const existingById = new Map<string, Outlet>();

  existingOutlets.forEach((o) => {
    existingById.set(o.id, o);
    const sap = normalizeSapCode(o.code || (o.id.startsWith('out-sap-') ? o.id.replace('out-sap-', '') : ''));
    if (sap && !existingBySap.has(sap)) {
      existingBySap.set(sap, o);
    }
  });

  const mergedScheduled = liveScheduledOutlets.map((liveOutlet) => {
    const sap = normalizeSapCode(liveOutlet.code);
    const match =
      existingById.get(liveOutlet.id) ||
      (sap ? existingBySap.get(sap) : undefined);

    const progress: Record<CategoryType, 'Not Started' | 'In Progress' | 'Completed'> = {
      'Edible Oil': match?.progress?.['Edible Oil'] || 'Not Started',
      Flour: match?.progress?.['Flour'] || 'Not Started',
      Pasta: match?.progress?.['Pasta'] || 'Not Started'
    };

    CATEGORIES.forEach((cat) => {
      const hasAudit =
        Boolean(audits[`${liveOutlet.id}_${cat}`]) ||
        Boolean(match && audits[`${match.id}_${cat}`]) ||
        Boolean(sap && audits[`out-sap-${sap}_${cat}`]) ||
        Boolean(sap && audits[`${sap}_${cat}`]);
      if (hasAudit) {
        progress[cat] = 'Completed';
      }
    });

    const statuses = Object.values(progress);
    const status: Outlet['status'] = statuses.every((s) => s === 'Completed')
      ? 'Completed'
      : statuses.some((s) => s === 'Completed' || s === 'In Progress')
      ? 'In Progress'
      : 'Not Started';

    return {
      ...liveOutlet,
      status,
      progress,
      dataConfidence: match?.dataConfidence,
      visitId: match?.visitId
    };
  });

  const scheduledSaps = new Set(
    mergedScheduled.map((o) => normalizeSapCode(o.code)).filter(Boolean)
  );
  const manualUnmapped = existingOutlets.filter((o) => {
    if (!o.isUnmapped) return false;
    const sap = normalizeSapCode(o.code);
    return !sap || !scheduledSaps.has(sap);
  });

  return [...mergedScheduled, ...manualUnmapped];
}

function estimateOosCountFromAudit(audit: CategoryAuditRecord | undefined): number {
  if (!audit) return 0;
  let oosCount = 0;
  if (audit.planogramCompliance?.missingOwnBrands?.length) {
    oosCount += audit.planogramCompliance.missingOwnBrands.length;
  }
  const qa = audit.questionnaireAnswers;
  if (qa && typeof qa === 'object') {
    if (Array.isArray(qa.oosSkus)) oosCount = Math.max(oosCount, qa.oosSkus.length);
    else if (typeof qa.oosCount === 'number') oosCount = Math.max(oosCount, qa.oosCount);
  }
  return oosCount;
}

export function buildAssignedOutletPoolForExecutive(params: {
  executive: UserProfile | null;
  dataset: LivePjpDataset;
  appOutlets: Outlet[];
  audits?: Record<string, CategoryAuditRecord>;
}): Outlet[] {
  const { executive, dataset, appOutlets, audits = {} } = params;
  const execName = executive?.name || 'Safwan Asif';
  const execRepId = executive?.repId;

  const cmBySap = new Map<string, SyncedCustomerMasterRecord>();
  (dataset.customerMaster || []).forEach((cm) => {
    const sap = normalizeSapCode(cm.sapCode);
    if (sap) cmBySap.set(sap, cm);
  });

  const existingBySap = new Map<string, Outlet>();
  appOutlets.forEach((o) => {
    const sap = normalizeSapCode(
      o.code || (o.id.startsWith('out-sap-') ? o.id.replace('out-sap-', '') : '')
    );
    if (sap && !existingBySap.has(sap)) {
      existingBySap.set(sap, o);
    }
  });

  const rawAssigns = (dataset.assignments || []).filter(
    (a) =>
      a.isActive &&
      matchesExecutiveIdentity(a.executive, a.repId, execName, execRepId)
  );
  const months = Array.from(new Set(rawAssigns.map((a) => a.month).filter(Boolean))).sort();
  const activeMonth = months.length > 0 ? months[months.length - 1] : '';
  const execAssigns = activeMonth
    ? rawAssigns.filter((a) => a.month === activeMonth)
    : rawAssigns;

  const pool: Outlet[] = [...appOutlets];
  const seenKeys = new Set<string>();
  appOutlets.forEach((o) => {
    const sap = normalizeSapCode(o.code);
    seenKeys.add(sap ? `sap:${sap}` : `id:${o.id}`);
  });

  const pushCandidate = (candidate: {
    sapCode?: string;
    name: string;
    account?: string;
    branch: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
  }, idx: number) => {
    const sap = normalizeSapCode(candidate.sapCode);
    const key = sap ? `sap:${sap}` : `name:${candidate.name.trim().toLowerCase()}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    const match = sap ? existingBySap.get(sap) : undefined;
    if (match) {
      pool.push(match);
      return;
    }

    const id = sap ? `out-sap-${sap}` : `out-pool-${idx + 1}`;
    const progress: Record<CategoryType, 'Not Started' | 'In Progress' | 'Completed'> = {
      'Edible Oil': 'Not Started',
      Flour: 'Not Started',
      Pasta: 'Not Started'
    };

    CATEGORIES.forEach((cat) => {
      const hasAudit =
        Boolean(audits[`${id}_${cat}`]) ||
        Boolean(sap && audits[`out-sap-${sap}_${cat}`]) ||
        Boolean(sap && audits[`${sap}_${cat}`]);
      if (hasAudit) progress[cat] = 'Completed';
    });

    const statuses = Object.values(progress);
    const status: Outlet['status'] = statuses.every((s) => s === 'Completed')
      ? 'Completed'
      : statuses.some((s) => s === 'Completed')
      ? 'In Progress'
      : 'Not Started';

    const coords = !isSyntheticOrOffshoreCoord(candidate.latitude ?? undefined, candidate.longitude ?? undefined)
      ? { lat: Number(candidate.latitude), lng: Number(candidate.longitude) }
      : resolveDohaAreaCoords(`${candidate.name} ${candidate.branch} ${candidate.address}`, idx);

    pool.push({
      id,
      name: candidate.name,
      code: candidate.sapCode || undefined,
      account: candidate.account || undefined,
      branch: candidate.branch || 'Doha',
      sequence: 'Assigned',
      address: candidate.address || `${candidate.branch || 'Doha'}, Qatar`,
      status,
      progress,
      latitude: coords.lat,
      longitude: coords.lng
    });
  };

  execAssigns.forEach((a, idx) => {
    const sap = normalizeSapCode(a.sapCode);
    const cm = cmBySap.get(sap);
    if (!cm) return;
    pushCandidate(
      {
        sapCode: cm.sapCode,
        name: cm.custName,
        account: cm.account,
        branch: cm.branch || cm.area || 'Doha',
        address: cm.area ? `${cm.area}, Qatar` : 'Doha, Qatar',
        latitude: cm.latitude,
        longitude: cm.longitude
      },
      idx
    );
  });

  if (execAssigns.length === 0) {
    (dataset.masterOutlets || [])
      .filter((m) => matchesExecutiveIdentity(m.executive, m.repId, execName, execRepId))
      .forEach((m, idx) => {
        pushCandidate(
          {
            sapCode: m.code,
            name: m.rawName || m.name,
            account: m.account,
            branch: m.branch || 'Doha',
            address: m.address || `${m.branch || 'Doha'}, Qatar`,
            latitude: m.latitude,
            longitude: m.longitude
          },
          idx
        );
      });
  }

  return pool;
}

/**
 * Builds live GeoIntel MapOutlet[] from:
 *  - Sheet 1: Executive_Assignments + Customer_Master (exact GPS coords) + PJP_Schedule (today's stops)
 *  - Local App State: in-progress/completed Outlets + CategoryAuditRecords
 *  - Optional Sheet 2: visits & category_audits (if accessible)
 */
export function buildGeoIntelMapOutlets(params: {
  executive: UserProfile | null;
  dataset: LivePjpDataset;
  appOutlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  useCustomAppRoute?: boolean;
}): MapOutlet[] {
  const { executive, dataset, appOutlets, audits, useCustomAppRoute = false } = params;
  const execName = executive?.name || 'Safwan Asif';
  const execRepId = executive?.repId;

  const cmBySap = new Map<string, SyncedCustomerMasterRecord>();
  (dataset.customerMaster || []).forEach((cm) => {
    const sap = normalizeSapCode(cm.sapCode);
    if (sap) cmBySap.set(sap, cm);
  });

  // Scope assignments to active executive (and latest month in Executive_Assignments if multiple)
  const rawAssigns = (dataset.assignments || []).filter(
    (a) =>
      a.isActive &&
      matchesExecutiveIdentity(a.executive, a.repId, execName, execRepId)
  );
  const months = Array.from(new Set(rawAssigns.map((a) => a.month).filter(Boolean))).sort();
  const activeMonth = months.length > 0 ? months[months.length - 1] : '';
  const execAssigns = activeMonth
    ? rawAssigns.filter((a) => a.month === activeMonth)
    : rawAssigns;

  // Determine active schedule day & stop order (either user's saved PJP custom route or live sheet PJP_Schedule)
  const execScheduleAll = (dataset.scheduleRows || []).filter((s) =>
    matchesExecutiveIdentity(s.executive, s.repId, execName, execRepId)
  );
  const targetSchedDate = pickScheduleDateForExecutive(execScheduleAll);
  const todaySched = targetSchedDate
    ? execScheduleAll.filter((s) => s.date === targetSchedDate)
    : execScheduleAll;

  const schedOrderBySap = new Map<string, number>();
  if (useCustomAppRoute) {
    appOutlets.forEach((o, idx) => {
      const sap = normalizeSapCode(
        o.code || (o.id.startsWith('out-sap-') ? o.id.replace('out-sap-', '') : '')
      );
      if (sap && !schedOrderBySap.has(sap)) {
        schedOrderBySap.set(sap, idx + 1);
      }
    });
  } else {
    [...todaySched]
      .sort((a, b) => (a.visitOrder ?? 999) - (b.visitOrder ?? 999))
      .forEach((s, idx) => {
        const sap = normalizeSapCode(s.sapCode);
        if (sap && !schedOrderBySap.has(sap)) {
          schedOrderBySap.set(sap, Number(s.visitOrder) || idx + 1);
        }
      });
  }

  // Map local appOutlets by SAP code and ID for fast status/audit merge
  const appBySap = new Map<string, Outlet>();
  appOutlets.forEach((o, idx) => {
    const sap = normalizeSapCode(o.code);
    if (sap) appBySap.set(sap, o);
    // Also support sequence fallback when synced PJP outlets match schedule
    if (!sap && o.id.startsWith('out-sap-')) {
      appBySap.set(normalizeSapCode(o.id.replace('out-sap-', '')), o);
    }
    void idx;
  });

  // Map optional Sheet 2 records by SAP code
  const s2VisitBySap = new Map<string, SyncedSheet2Visit>();
  (dataset.sheet2Visits || []).forEach((v) => {
    const sap = normalizeSapCode(v.sapCode);
    if (!sap) return;
    const prev = s2VisitBySap.get(sap);
    if (!prev || v.date >= prev.date) {
      s2VisitBySap.set(sap, v);
    }
  });

  const s2AuditsBySap = new Map<string, Record<string, SyncedSheet2CategoryAudit>>();
  (dataset.sheet2Audits || []).forEach((a) => {
    const sap = normalizeSapCode(a.sapCode);
    if (!sap) return;
    const catKey = a.category.toLowerCase();
    const existingMap = s2AuditsBySap.get(sap) || {};
    const prev = existingMap[catKey];
    if (!prev || a.date >= prev.date) {
      existingMap[catKey] = a;
      s2AuditsBySap.set(sap, existingMap);
    }
  });

  // Assemble union of SAPs assigned + scheduled today + appOutlets with SAP
  const orderedSaps: string[] = [];
  const seenSaps = new Set<string>();
  const pushSap = (raw: string | undefined) => {
    const sap = normalizeSapCode(raw);
    if (sap && !seenSaps.has(sap)) {
      seenSaps.add(sap);
      orderedSaps.push(sap);
    }
  };

  // Scheduled stops first in visit order, then remaining assigned outlets
  Array.from(schedOrderBySap.entries())
    .sort((a, b) => a[1] - b[1])
    .forEach(([sap]) => pushSap(sap));
  execAssigns.forEach((a) => pushSap(a.sapCode));
  appOutlets.forEach((o) => pushSap(o.code));

  const mapOutlets: MapOutlet[] = [];

  orderedSaps.forEach((sap, idx) => {
    const cm = cmBySap.get(sap);
    const appOutlet = appBySap.get(sap);
    if (!cm && !appOutlet) return;

    const visitOrder = schedOrderBySap.get(sap) ?? null;
    const scheduledForToday =
      visitOrder !== null ||
      (appOutlet !== undefined && appOutlet.sequence !== 'Ad-Hoc');

    const localAuditOutletId = appOutlet?.id || `out-sap-${sap}`;
    const localCatAudits: Partial<Record<CategoryType, CategoryAuditRecord>> = {};
    CATEGORIES.forEach((cat) => {
      const rec =
        audits[`${localAuditOutletId}_${cat}`] ||
        audits[`out-sap-${sap}_${cat}`] ||
        (cm?.sapCode ? audits[`${cm.sapCode}_${cat}`] : undefined);
      if (rec) localCatAudits[cat] = rec;
    });

    const s2AuditMap = s2AuditsBySap.get(sap) || {};
    const s2Visit = s2VisitBySap.get(sap);

    const hasLocalAudits = Object.keys(localCatAudits).length > 0;
    const hasS2Audits = Object.keys(s2AuditMap).length > 0;
    const hasAuditHistory = hasLocalAudits || hasS2Audits;

    const flourRec = localCatAudits['Flour'];
    const oilRec = localCatAudits['Edible Oil'];
    const pastaRec = localCatAudits['Pasta'];

    const s2Flour = s2AuditMap['flour'];
    const s2Oil = s2AuditMap['edible oil'] || s2AuditMap['oil'];
    const s2Pasta = s2AuditMap['pasta'];

    const flourSosPct = Math.round(
      flourRec
        ? flourRec.shareOfShelfPct ?? flourRec.primarySharePct ?? 0
        : s2Flour?.shareOfShelfPct ?? 0
    );
    const edibleOilSosPct = Math.round(
      oilRec
        ? oilRec.shareOfShelfPct ?? oilRec.primarySharePct ?? 0
        : s2Oil?.shareOfShelfPct ?? 0
    );
    const pastaSosPct = Math.round(
      pastaRec
        ? pastaRec.shareOfShelfPct ?? pastaRec.primarySharePct ?? 0
        : s2Pasta?.shareOfShelfPct ?? 0
    );

    const sosValues = [
      flourRec || s2Flour ? flourSosPct : null,
      oilRec || s2Oil ? edibleOilSosPct : null,
      pastaRec || s2Pasta ? pastaSosPct : null
    ].filter((v): v is number => v !== null);

    const avgSos =
      sosValues.length > 0 ? sosValues.reduce((a, b) => a + b, 0) / sosValues.length : 0;
    const sosScore = Number(Math.min(5, Math.max(0, (avgSos / 100) * 6.5)).toFixed(1));

    const pgValues: number[] = [];
    [flourRec, oilRec, pastaRec].forEach((r) => {
      if (r?.planogramCompliance?.hasPlanogram && Number.isFinite(r.planogramCompliance.overallScore)) {
        pgValues.push(Math.round(r.planogramCompliance.overallScore));
      }
    });
    [s2Flour, s2Oil, s2Pasta].forEach((r) => {
      if (r && Number.isFinite(r.planogramCompliancePct) && r.planogramCompliancePct > 0) {
        pgValues.push(Math.round(r.planogramCompliancePct));
      }
    });
    const planogramPercentage =
      pgValues.length > 0
        ? Math.round(pgValues.reduce((a, b) => a + b, 0) / pgValues.length)
        : hasAuditHistory
        ? 85
        : 0;

    const oosSkuCount =
      estimateOosCountFromAudit(flourRec) +
      estimateOosCountFromAudit(oilRec) +
      estimateOosCountFromAudit(pastaRec) +
      (hasLocalAudits
        ? 0
        : (s2Flour?.oosSkuCount || 0) + (s2Oil?.oosSkuCount || 0) + (s2Pasta?.oosSkuCount || 0));

    let healthStatus: OutletHealthStatus = 'healthy';
    if (hasAuditHistory) {
      if (
        oosSkuCount >= 4 ||
        (pgValues.length > 0 && planogramPercentage < 70) ||
        sosValues.some((v) => v < 40)
      ) {
        healthStatus = 'critical';
      } else if (
        oosSkuCount >= 1 ||
        (pgValues.length > 0 && planogramPercentage < 82) ||
        sosValues.some((v) => v <= 50)
      ) {
        healthStatus = 'attention';
      }
    }

    const allCompletedLocally =
      appOutlet?.status === 'Completed' ||
      (flourRec !== undefined && oilRec !== undefined && pastaRec !== undefined);
    const completedInS2 = s2Visit?.visitStatus === 'completed';

    const visitStatus: VisitStatus =
      allCompletedLocally || completedInS2
        ? 'completed'
        : scheduledForToday
        ? 'planned'
        : 'unscheduled';

    const latestLocalTs = [flourRec?.timestamp, oilRec?.timestamp, pastaRec?.timestamp]
      .filter((t): t is string => Boolean(t))
      .sort()
      .pop();
    const latestDate =
      (latestLocalTs && latestLocalTs.slice(0, 10).match(/^\d{4}-\d{2}-\d{2}$/)
        ? latestLocalTs.slice(0, 10)
        : latestLocalTs
        ? new Date().toISOString().slice(0, 10)
        : '') ||
      s2Visit?.date ||
      s2Flour?.date ||
      s2Oil?.date ||
      s2Pasta?.date ||
      '';

    const rawLat = cm?.latitude ?? appOutlet?.latitude;
    const rawLng = cm?.longitude ?? appOutlet?.longitude;
    const coords = !isSyntheticOrOffshoreCoord(rawLat, rawLng)
      ? { lat: Number(rawLat), lng: Number(rawLng) }
      : resolveDohaAreaCoords(
          `${cm?.custName || appOutlet?.name || ''} ${cm?.area || appOutlet?.branch || ''}`,
          idx
        );

    const issues: string[] = [];
    if (hasAuditHistory) {
      if (oosSkuCount > 0) issues.push(`${oosSkuCount} SKU${oosSkuCount > 1 ? 's' : ''} out of stock`);
      if (flourRec && flourSosPct <= 50) issues.push(`Flour SOS at ${flourSosPct}% (target >50%)`);
      if (oilRec && edibleOilSosPct <= 50)
        issues.push(`Edible Oil SOS at ${edibleOilSosPct}% (target >50%)`);
      if (pastaRec && pastaSosPct <= 50) issues.push(`Pasta SOS at ${pastaSosPct}% (target >50%)`);
    }

    mapOutlets.push({
      id: appOutlet?.id || `out-sap-${sap}`,
      sapCode: cm?.sapCode || appOutlet?.code || sap,
      hasAuditHistory,
      name: cm?.custName || appOutlet?.name || `Outlet ${sap}`,
      area: cm?.area || appOutlet?.branch || 'Doha',
      channel: cm?.channel || 'Hypermarket',
      latitude: coords.lat,
      longitude: coords.lng,
      visitStatus,
      healthStatus,
      scheduledForToday,
      visitOrder,
      sosScore,
      previousSosScore: sosScore,
      flourSosPct,
      edibleOilSosPct,
      pastaSosPct,
      planogramPercentage,
      previousPlanogramPercentage: planogramPercentage,
      oosSkuCount,
      lastVisitDate: latestDate,
      issues
    });
  });

  // Include any unmapped / ad-hoc appOutlets that don't have a SAP code yet
  appOutlets.forEach((o, idx) => {
    const sap = normalizeSapCode(o.code);
    if (sap && seenSaps.has(sap)) return;
    if (mapOutlets.some((m) => m.id === o.id)) return;
    const coords = resolveOutletCoordinates(o, idx + mapOutlets.length);
    const allCompleted = o.status === 'Completed';
    mapOutlets.push({
      id: o.id,
      sapCode: o.code,
      hasAuditHistory: allCompleted,
      name: o.name,
      area: o.branch || o.address || 'Doha',
      channel: 'Supermarket',
      latitude: coords.lat,
      longitude: coords.lng,
      visitStatus: allCompleted ? 'completed' : 'planned',
      healthStatus: 'healthy',
      scheduledForToday: true,
      visitOrder: useCustomAppRoute ? idx + 1 : null,
      sosScore: 0,
      previousSosScore: 0,
      flourSosPct: 0,
      edibleOilSosPct: 0,
      pastaSosPct: 0,
      planogramPercentage: 0,
      previousPlanogramPercentage: 0,
      oosSkuCount: 0,
      lastVisitDate: allCompleted ? new Date().toISOString().slice(0, 10) : '',
      issues: []
    });
  });

  return mapOutlets;
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

  return outlets.map((o, idx) => {
    const needsCoordRepair = isSyntheticOrOffshoreCoord(o.latitude, o.longitude);
    const repairedCoords = needsCoordRepair ? resolveOutletCoordinates(o, idx) : null;

    if (o.code && normalizeSapCode(o.code)) {
      const matchedCm = (dataset.customerMaster || []).find(
        (cm) => normalizeSapCode(cm.sapCode) === normalizeSapCode(o.code)
      );
      if (
        matchedCm &&
        !isSyntheticOrOffshoreCoord(
          matchedCm.latitude ?? undefined,
          matchedCm.longitude ?? undefined
        )
      ) {
        return {
          ...o,
          latitude: Number(matchedCm.latitude),
          longitude: Number(matchedCm.longitude)
        };
      }
      return repairedCoords
        ? { ...o, latitude: repairedCoords.lat, longitude: repairedCoords.lng }
        : o;
    }

    const nameNorm = o.name.trim().toLowerCase();
    const branchNorm = (o.branch || '').trim().toLowerCase();

    const matched = master.find((m) => {
      if (!m.code) return false;
      const mRaw = (m.rawName || m.name || '').trim().toLowerCase();
      const mName = (m.name || '').trim().toLowerCase();
      if (mRaw === nameNorm || mName === nameNorm) return true;
      if (
        branchNorm &&
        mRaw.includes(branchNorm) &&
        (!o.account || (m.account || '').toLowerCase() === o.account.toLowerCase())
      ) {
        return true;
      }
      return false;
    });

    if (!matched?.code) {
      return repairedCoords
        ? { ...o, latitude: repairedCoords.lat, longitude: repairedCoords.lng }
        : o;
    }

    const lat = !isSyntheticOrOffshoreCoord(matched.latitude, matched.longitude)
      ? Number(matched.latitude)
      : repairedCoords?.lat ?? o.latitude;
    const lng = !isSyntheticOrOffshoreCoord(matched.latitude, matched.longitude)
      ? Number(matched.longitude)
      : repairedCoords?.lng ?? o.longitude;

    return {
      ...o,
      code: matched.code,
      account: o.account || matched.account,
      latitude: lat,
      longitude: lng
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

export interface SavedCustomPjpRoute {
  date: string; // YYYY-MM-DD in Asia/Qatar
  orderedIds: string[];
  notice?: string;
  totalDistanceMeters?: number;
  totalDurationSeconds?: number;
  legs?: OptimizedRouteLeg[];
}

export function getTodayDohaDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Qatar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
  } catch {
    const now = new Date();
    const dohaMs = now.getTime() + 3 * 60 * 60 * 1000;
    return new Date(dohaMs).toISOString().slice(0, 10);
  }
}

export function loadTodayCustomPjpRoute(username?: string): SavedCustomPjpRoute | null {
  if (!username) return null;
  const key = `mta_custom_pjp_${username}`;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const todayKey = getTodayDohaDateKey();

    // Legacy boolean flag ('1') has no date stamp — expire it cleanly so schedule resets properly
    if (raw === '1') {
      localStorage.removeItem(key);
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<SavedCustomPjpRoute>;
    if (
      parsed &&
      parsed.date === todayKey &&
      Array.isArray(parsed.orderedIds) &&
      parsed.orderedIds.length > 0
    ) {
      return {
        date: parsed.date,
        orderedIds: parsed.orderedIds.map((id) => String(id)),
        notice: typeof parsed.notice === 'string' ? parsed.notice : undefined,
        totalDistanceMeters:
          typeof parsed.totalDistanceMeters === 'number' ? parsed.totalDistanceMeters : undefined,
        totalDurationSeconds:
          typeof parsed.totalDurationSeconds === 'number' ? parsed.totalDurationSeconds : undefined,
        legs: Array.isArray(parsed.legs) ? parsed.legs : undefined
      };
    }

    // Expired from a previous Doha calendar date -> auto-reset
    localStorage.removeItem(key);
    return null;
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {}
    return null;
  }
}

export function saveTodayCustomPjpRoute(
  username: string | undefined,
  payload: Omit<SavedCustomPjpRoute, 'date'> & { date?: string }
): void {
  if (!username) return;
  try {
    const record: SavedCustomPjpRoute = {
      ...payload,
      date: payload.date || getTodayDohaDateKey()
    };
    localStorage.setItem(`mta_custom_pjp_${username}`, JSON.stringify(record));
  } catch {
    // Ignore storage quota warnings
  }
}

export function clearTodayCustomPjpRoute(username?: string): void {
  if (!username) return;
  try {
    localStorage.removeItem(`mta_custom_pjp_${username}`);
  } catch {
    // Ignore storage errors
  }
}

export function applySavedRouteOrder(scheduledOutlets: Outlet[], orderedIds: string[]): Outlet[] {
  if (!orderedIds || orderedIds.length === 0 || scheduledOutlets.length === 0) {
    return scheduledOutlets;
  }

  const byId = new Map<string, Outlet>();
  scheduledOutlets.forEach((o) => byId.set(o.id, o));

  const seen = new Set<string>();
  const ordered: Outlet[] = [];

  orderedIds.forEach((id) => {
    const match = byId.get(id);
    if (match && !seen.has(match.id)) {
      seen.add(match.id);
      ordered.push(match);
    }
  });

  // Append any newly added scheduled stops not yet in orderedIds
  scheduledOutlets.forEach((o) => {
    if (!seen.has(o.id)) {
      seen.add(o.id);
      ordered.push(o);
    }
  });

  const total = ordered.length;
  return ordered.map((o, idx) => ({
    ...o,
    sequence: `${idx + 1} of ${total}`
  }));
}

