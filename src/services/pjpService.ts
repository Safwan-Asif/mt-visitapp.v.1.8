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
    return {
      id: sap ? `out-sap-${sap}` : `out-pjp-${idx + 1}-${Math.abs((v.executive + v.outlet).split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`,
      name: v.account && !v.outlet.toLowerCase().startsWith(v.account.toLowerCase())
        ? `${v.account} - ${v.outlet}`
        : v.outlet,
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
      latitude: 25.2854 + idx * 0.012,
      longitude: 51.5310 + idx * 0.008
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
