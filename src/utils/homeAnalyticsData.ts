import {
  Outlet,
  CategoryAuditRecord,
  CategoryType,
  PlanogramRecord
} from '../types';
import { CATEGORIES } from '../constants';
import { PjpVisitRow } from '../data/pjpMasterData';
import {
  SyncedSheet2Visit,
  SyncedSheet2CategoryAudit
} from '../services/pjpService';
import { normalizeSapCode } from '../services/planogramService';
import {
  normalizeBrandAlias,
  normalizePlanogramCategory
} from '../config/planogramConfig';

export type CategoryFilter = 'All' | CategoryType;

export type DataProvenance =
  | 'live_verified'
  | 'historical_verified'
  | 'cached'
  | 'simulated'
  | 'unavailable';

export type PosmEvalState = 'Present' | 'Missing' | 'N/A' | 'Not Evaluated';

export interface CategoryShelfEvidence {
  originalUrl?: string;
  annotatedUrl?: string;
  planogramUrl?: string;
  sosPct: number | null;
  complianceScore: number | null;
  missingBrands: string[];
  unmappedBrands: string[];
  brandCounts: Record<string, number>;
  auditTimestamp?: string;
  auditDateIso?: string;
  provenance: DataProvenance;
}

export interface MasterOutletMetrics {
  id: string;
  name: string;
  branch: string;
  account: string;
  code?: string;
  isRouteOutlet: boolean;
  hasLiveAudit: boolean;
  hasSheet2Audit: boolean;
  mtonByCategory: Record<CategoryType, number>;
  sosByCategory: Record<CategoryType, number>;
  sosProvenanceByCategory: Record<CategoryType, DataProvenance>;
  oosByCategory: Record<CategoryType, number>;
  oosProvenanceByCategory: Record<CategoryType, DataProvenance>;
  planogramScoreByCategory: Record<CategoryType, number | null>;
  planogramProvenanceByCategory: Record<CategoryType, DataProvenance>;
  shelfEvidenceByCategory: Record<CategoryType, CategoryShelfEvidence>;
  posmStatus: {
    shelfStrips: boolean;
    wobblers: boolean;
    gondola: boolean;
    priceTag: boolean;
  };
  posmStates: {
    shelfStrips: PosmEvalState;
    wobblers: PosmEvalState;
    gondola: PosmEvalState;
    priceTag: PosmEvalState;
  };
  posmProvenance: DataProvenance;
  flyerStatus: {
    activePct: number;
    missingPct: number;
    naPct: number;
    presentItemsPct: number;
    missingItemsPct: number;
    wrongPricePct: number;
  };
  freshness: {
    evaluated: boolean;
    passed: boolean;
    note: string;
    source: 'live' | 'schedule';
  };
  lastVisit: string;
  lastVisitProvenance: DataProvenance;
  shelfPhotoUrl?: string; // Preserved for backward compat; strictly same-category only
}

export interface ExecutiveAccountGroup {
  account: string;
  outlets: MasterOutletMetrics[];
}

export interface CompetitorPromoSpot {
  id: string;
  account: string;
  outletName: string;
  category: CategoryType;
  brand: string;
  offerDetails: string;
  spottedDate: string;
  count: number;
  photoUrl?: string;
  isLive?: boolean;
  provenance: DataProvenance;
}

export interface ExecutiveDaySchedule {
  day: number;
  dateStr: string;
  isoDate: string;
  plannedCount: number;
  completedCount: number;
  verifiedCompletedCount: number;
  simulatedCompletedCount: number;
  isSimulatedCompletion: boolean;
  outlets: Array<{
    name: string;
    account: string;
    area: string;
    code?: string;
    verifiedStatus?: 'completed' | 'partial' | 'missed' | 'planned' | 'simulated';
  }>;
}

export interface ExecutivePjpCalendarMeta {
  year: number;
  month: number; // 1-based (1..12)
  monthLabel: string; // e.g. "Oct 2026"
  monthShort: string; // e.g. "Oct"
  daysInMonth: number;
  firstWeekdayOffset: number; // 0 = Sun .. 6 = Sat
  cutoffDay: number; // active "today" simulation day in PJP cycle
  scheduleByDay: Record<number, ExecutiveDaySchedule>;
  hasVerifiedSheet2Visits: boolean;
}

export interface Sheet2SosObservation {
  dateIso: string;
  category: CategoryType;
  avgSosPct: number;
  sampleCount: number;
  provenance: DataProvenance;
}

function stableHash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const ACCOUNT_WEIGHT: Record<string, number> = {
  Lulu: 1.45,
  'Al Meera': 1.25,
  C4: 1.35,
  Carrefour: 1.35,
  FFC: 1.15,
  Family: 1.1,
  Monoprix: 1.05,
  Safari: 1.12,
  Grand: 1.08,
  Rawabi: 1.0,
  Saudia: 0.96,
  MEGAMART: 1.02
};

export function normalizeAccountLabel(raw?: string, outletName?: string): string {
  const candidate = (raw || '').trim();
  if (candidate) {
    if (candidate.toUpperCase() === 'C4') return 'Carrefour';
    if (candidate.toUpperCase() === 'FFC') return 'Family Food';
    return candidate;
  }
  const firstWord = (outletName || 'Other').split(/[-—]/)[0].trim();
  if (/carrefour/i.test(firstWord)) return 'Carrefour';
  if (/family\s*food/i.test(firstWord)) return 'Family Food';
  return firstWord || 'Other';
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export function parseFlexiblePjpDate(
  dateStr: string
): { year: number; month: number; day: number; iso: string } | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec((dateStr || '').trim());
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return {
    year,
    month,
    day,
    iso: `${year}-${pad(month)}-${pad(day)}`
  };
}

function getDohaTodayParts(): { year: number; month: number; day: number; iso: string } {
  try {
    const iso = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Qatar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date());
    const parsed = parseFlexiblePjpDate(iso);
    if (parsed) return parsed;
  } catch {
    // fallback below
  }
  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    iso: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  };
}

export function buildExecutivePjpScheduleMeta(
  executiveName: string,
  pjpVisits: PjpVisitRow[],
  execOutlets: MasterOutletMetrics[],
  execRepId?: string,
  sheet2Visits: SyncedSheet2Visit[] = [],
  liveAuditDatesBySap: Map<string, string> = new Map()
): ExecutivePjpCalendarMeta {
  const cleanExec = (executiveName || '').trim().toLowerCase();
  const normRep = String(execRepId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
  const matchingVisits = (pjpVisits || []).filter((v) => {
    const vName = (v.executive || '').trim().toLowerCase();
    const vRep = String(v.repId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
    return (cleanExec && vName === cleanExec) || (normRep && vRep === normRep);
  });

  const dohaToday = getDohaTodayParts();
  let year = dohaToday.year;
  let month = dohaToday.month;
  for (const v of matchingVisits) {
    const parsed = parseFlexiblePjpDate(v.date);
    if (parsed) {
      year = parsed.year;
      month = parsed.month;
      break;
    }
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekdayOffset = new Date(year, month - 1, 1).getDay();
  const monthShort = MONTH_NAMES[month - 1] || 'Oct';
  const monthLabel = `${monthShort} ${year}`;
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  // Index verified Sheet 2 visits by (isoDate, normalizedSap)
  const s2ByDateSap = new Map<string, SyncedSheet2Visit>();
  (sheet2Visits || []).forEach((sv) => {
    const parsed = parseFlexiblePjpDate(sv.date);
    const sap = normalizeSapCode(sv.sapCode);
    if (!parsed || !sap) return;
    const svRep = String(sv.repId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
    if (normRep && svRep && svRep !== normRep) return;
    s2ByDateSap.set(`${parsed.iso}::${sap}`, sv);
  });

  const hasVerifiedSheet2Visits = s2ByDateSap.size > 0;
  const scheduleByDay: Record<number, ExecutiveDaySchedule> = {};

  if (matchingVisits.length > 0) {
    matchingVisits.forEach((v) => {
      const parsed = parseFlexiblePjpDate(v.date);
      if (!parsed || parsed.month !== month || parsed.year !== year) return;
      const d = parsed.day;
      if (!scheduleByDay[d]) {
        scheduleByDay[d] = {
          day: d,
          dateStr: `${d} ${monthShort}`,
          isoDate: parsed.iso,
          plannedCount: 0,
          completedCount: 0,
          verifiedCompletedCount: 0,
          simulatedCompletedCount: 0,
          isSimulatedCompletion: false,
          outlets: []
        };
      }
      const normalizedAccount = normalizeAccountLabel(v.account, v.outlet);
      const alreadyAdded = scheduleByDay[d].outlets.some(
        (x) =>
          (v.code && x.code === v.code) ||
          x.name.toLowerCase() === v.outlet.toLowerCase()
      );
      if (!alreadyAdded) {
        scheduleByDay[d].outlets.push({
          name: v.outlet,
          account: normalizedAccount,
          area: v.area || normalizedAccount,
          code: v.code
        });
      }
    });

    const sortedDays = Object.keys(scheduleByDay)
      .map(Number)
      .sort((a, b) => a - b);
    const isCurrentCalendarMonth =
      year === dohaToday.year && month === dohaToday.month;
    const cutoffDay = Math.min(
      daysInMonth,
      isCurrentCalendarMonth ? dohaToday.day : sortedDays[sortedDays.length - 1] || 17
    );

    sortedDays.forEach((d) => {
      const entry = scheduleByDay[d];
      entry.plannedCount = entry.outlets.length;

      if (d > cutoffDay) {
        entry.completedCount = 0;
        entry.verifiedCompletedCount = 0;
        entry.simulatedCompletedCount = 0;
        entry.isSimulatedCompletion = false;
        entry.outlets = entry.outlets.map((st) => ({
          ...st,
          verifiedStatus: 'planned'
        }));
        return;
      }

      // Check Sheet 2 + Live Audit verifications for this date
      let verifiedCount = 0;
      entry.outlets = entry.outlets.map((st) => {
        const sap = normalizeSapCode(st.code);
        const s2Match = sap ? s2ByDateSap.get(`${entry.isoDate}::${sap}`) : undefined;
        const liveDate = sap ? liveAuditDatesBySap.get(sap) : undefined;
        const hasLiveOnDay = Boolean(liveDate && liveDate === entry.isoDate);
        if (hasLiveOnDay || (s2Match && s2Match.visitStatus.toLowerCase() === 'completed')) {
          verifiedCount++;
          return { ...st, verifiedStatus: 'completed' };
        }
        if (s2Match && s2Match.visitStatus.toLowerCase() === 'partial') {
          return { ...st, verifiedStatus: 'partial' };
        }
        if (s2Match && s2Match.visitStatus.toLowerCase() === 'missed') {
          return { ...st, verifiedStatus: 'missed' };
        }
        return { ...st, verifiedStatus: hasVerifiedSheet2Visits ? 'missed' : 'simulated' };
      });

      if (hasVerifiedSheet2Visits || verifiedCount > 0) {
        entry.verifiedCompletedCount = verifiedCount;
        entry.completedCount = verifiedCount;
        entry.simulatedCompletedCount = 0;
        entry.isSimulatedCompletion = false;
      } else {
        // Simulated adherence fallback clearly flagged so UI never misrepresents it
        const h = stableHash(`${executiveName}-${year}-${month}-${d}`);
        const missed = h % 5 === 0 ? 1 : h % 9 === 0 ? Math.min(2, entry.plannedCount - 1) : 0;
        const simDone = Math.max(1, entry.plannedCount - missed);
        entry.verifiedCompletedCount = 0;
        entry.simulatedCompletedCount = simDone;
        entry.completedCount = simDone;
        entry.isSimulatedCompletion = true;
        entry.outlets = entry.outlets.map((st, idx) => ({
          ...st,
          verifiedStatus: idx < simDone ? 'simulated' : 'missed'
        }));
      }
    });

    return {
      year,
      month,
      monthLabel,
      monthShort,
      daysInMonth,
      firstWeekdayOffset,
      cutoffDay,
      scheduleByDay,
      hasVerifiedSheet2Visits
    };
  }

  // Fallback for supervisor / executive with 0 PJP sheet rows (e.g. Safwan Asif)
  const cutoffDay = Math.min(daysInMonth, dohaToday.day);
  const fallbackPool =
    execOutlets.length > 0
      ? execOutlets
      : [
          {
            id: 'f-1',
            name: 'Lulu — Al Wakra Main',
            account: 'Lulu',
            branch: 'Al Wakra Main',
            code: ''
          } as MasterOutletMetrics
        ];

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow === 5) continue; // Friday off
    const count = 4 + ((d + fallbackPool.length) % 3); // 4..6 stores
    const slice: ExecutiveDaySchedule['outlets'] = [];
    for (let i = 0; i < count; i++) {
      const store = fallbackPool[(d * 3 + i) % fallbackPool.length];
      slice.push({
        name: store.name,
        account: store.account,
        area: store.branch,
        code: store.code
      });
    }
    const h = stableHash(`${executiveName}-fallback-${d}`);
    const missed = d <= cutoffDay ? (h % 4 === 0 ? 1 : 0) : slice.length;
    const simDone = d <= cutoffDay ? Math.max(1, slice.length - missed) : 0;
    const isoDate = `${year}-${pad(month)}-${pad(d)}`;
    scheduleByDay[d] = {
      day: d,
      dateStr: `${d} ${monthShort}`,
      isoDate,
      plannedCount: slice.length,
      completedCount: simDone,
      verifiedCompletedCount: 0,
      simulatedCompletedCount: simDone,
      isSimulatedCompletion: d <= cutoffDay,
      outlets: slice.map((st, idx) => ({
        ...st,
        verifiedStatus:
          d > cutoffDay ? 'planned' : idx < simDone ? 'simulated' : 'missed'
      }))
    };
  }

  return {
    year,
    month,
    monthLabel,
    monthShort,
    daysInMonth,
    firstWeekdayOffset,
    cutoffDay,
    scheduleByDay,
    hasVerifiedSheet2Visits: false
  };
}

export function buildExecutivePjpAnalytics(
  executiveName: string,
  routeOutlets: Outlet[],
  pjpVisits: PjpVisitRow[],
  audits: Record<string, CategoryAuditRecord>,
  periodScale: number,
  execRepId?: string,
  assignedMasterOutlets: Array<{
    id: string;
    name: string;
    branch: string;
    account?: string;
    code?: string;
    executive: string;
    repId?: string;
  }> = [],
  sheet2Visits: SyncedSheet2Visit[] = [],
  sheet2Audits: SyncedSheet2CategoryAudit[] = [],
  planograms: PlanogramRecord[] = []
): {
  accounts: ExecutiveAccountGroup[];
  allOutlets: MasterOutletMetrics[];
  competitorPromos: CompetitorPromoSpot[];
  scheduleMeta: ExecutivePjpCalendarMeta;
  sheet2SosSeries: Sheet2SosObservation[];
} {
  const cleanExec = (executiveName || '').trim().toLowerCase();
  const normRep = String(execRepId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
  const byAccountMap = new Map<string, Map<string, MasterOutletMetrics>>();

  // Index Sheet 2 audits by (normalizedSap, CategoryType) keeping latest date
  const s2AuditsBySapCat = new Map<string, SyncedSheet2CategoryAudit>();
  const s2SosByDateCat = new Map<string, { sum: number; count: number; dateIso: string; category: CategoryType }>();

  (sheet2Audits || []).forEach((rec) => {
    const sap = normalizeSapCode(rec.sapCode);
    const cat = normalizePlanogramCategory(rec.category);
    const parsedDate = parseFlexiblePjpDate(rec.date);
    if (sap) {
      const key = `${sap}::${cat}`;
      const prev = s2AuditsBySapCat.get(key);
      if (!prev || rec.date >= prev.date) {
        s2AuditsBySapCat.set(key, rec);
      }
    }
    if (parsedDate && Number.isFinite(rec.shareOfShelfPct) && rec.shareOfShelfPct > 0) {
      const dKey = `${parsedDate.iso}::${cat}`;
      const cur = s2SosByDateCat.get(dKey) || {
        sum: 0,
        count: 0,
        dateIso: parsedDate.iso,
        category: cat
      };
      cur.sum += rec.shareOfShelfPct;
      cur.count += 1;
      s2SosByDateCat.set(dKey, cur);
    }
  });

  // Index active planograms by (normalizedSap, CategoryType) for reference photos in Evidence Viewer
  const planogramImgBySapCat = new Map<string, string>();
  (planograms || []).forEach((p) => {
    if (p.status !== 'active') return;
    const sap = normalizeSapCode(p.sap_code);
    const cat = normalizePlanogramCategory(p.category);
    const url = p.image_annotated_url || p.image_original_url;
    if (sap && url && !planogramImgBySapCat.has(`${sap}::${cat}`)) {
      planogramImgBySapCat.set(`${sap}::${cat}`, url);
    }
  });

  // Index live audit dates by SAP
  const liveAuditDatesBySap = new Map<string, string>();
  const findLiveAudit = (
    routeOutletObj: Outlet | undefined,
    sapCode: string | undefined,
    cat: CategoryType
  ): CategoryAuditRecord | undefined => {
    const normSap = normalizeSapCode(sapCode);
    const candidates = [
      routeOutletObj ? audits[`${routeOutletObj.id}_${cat}`] : undefined,
      normSap ? audits[`out-sap-${normSap}_${cat}`] : undefined,
      sapCode ? audits[`${sapCode}_${cat}`] : undefined,
      normSap ? audits[`${normSap}_${cat}`] : undefined
    ];
    return candidates.find((a): a is CategoryAuditRecord => Boolean(a));
  };

  const addOrMergeOutlet = (
    rawAccount: string | undefined,
    id: string,
    rawName: string,
    branch: string,
    code: string | undefined,
    isRouteOutlet: boolean,
    routeOutletObj?: Outlet
  ) => {
    const account = normalizeAccountLabel(rawAccount, rawName);
    if (!byAccountMap.has(account)) {
      byAccountMap.set(account, new Map());
    }
    const bucket = byAccountMap.get(account)!;
    const normSap = normalizeSapCode(code);
    const dedupKey =
      normSap ||
      `${account.toLowerCase()}::${(branch || rawName).toLowerCase()}`;
    const existing = bucket.get(dedupKey);
    if (existing && !isRouteOutlet) {
      return;
    }

    const h = stableHash(`${account}-${branch || rawName}-${code || id}`);
    const weight =
      ACCOUNT_WEIGHT[rawAccount || account] || ACCOUNT_WEIGHT[account] || 0.85;

    const liveByCat: Partial<Record<CategoryType, CategoryAuditRecord>> = {};
    const liveAuditsForOutlet: CategoryAuditRecord[] = [];
    CATEGORIES.forEach((cat) => {
      const found = findLiveAudit(routeOutletObj, code, cat);
      if (found) {
        liveByCat[cat] = found;
        liveAuditsForOutlet.push(found);
        if (normSap && found.timestamp) {
          const parsed = parseFlexiblePjpDate(found.timestamp);
          liveAuditDatesBySap.set(
            normSap,
            parsed ? parsed.iso : getDohaTodayParts().iso
          );
        }
      }
    });

    const mtonFlour = Number(((5.2 + (h % 65) / 10) * weight * periodScale).toFixed(1));
    const mtonOil = Number(
      ((3.1 + ((h >> 3) % 45) / 10) * weight * periodScale).toFixed(1)
    );
    const mtonPasta = Number(
      ((2.0 + ((h >> 5) % 30) / 10) * weight * periodScale).toFixed(1)
    );

    const baseSosOffset = (h % 13) - 6;
    const defaultSos: Record<CategoryType, number> = {
      Flour: Math.max(18, Math.min(62, Math.round(38 * (0.9 + weight * 0.08) + baseSosOffset))),
      'Edible Oil': Math.max(14, Math.min(58, Math.round(31 * (0.9 + weight * 0.08) + baseSosOffset))),
      Pasta: Math.max(12, Math.min(54, Math.round(29 * (0.9 + weight * 0.08) + baseSosOffset)))
    };

    const sosByCategory: Record<CategoryType, number> = {
      Flour: defaultSos.Flour,
      'Edible Oil': defaultSos['Edible Oil'],
      Pasta: defaultSos.Pasta
    };
    const sosProvenanceByCategory: Record<CategoryType, DataProvenance> = {
      Flour: 'simulated',
      'Edible Oil': 'simulated',
      Pasta: 'simulated'
    };
    const oosByCategory: Record<CategoryType, number> = {
      Flour: h % 4 === 0 ? 3 : h % 3,
      'Edible Oil': (h >> 2) % 5 === 0 ? 4 : (h >> 2) % 3,
      Pasta: (h >> 4) % 4 === 0 ? 2 : (h >> 4) % 2
    };
    const oosProvenanceByCategory: Record<CategoryType, DataProvenance> = {
      Flour: 'unavailable',
      'Edible Oil': 'unavailable',
      Pasta: 'unavailable'
    };
    const planogramScoreByCategory: Record<CategoryType, number | null> = {
      Flour: null,
      'Edible Oil': null,
      Pasta: null
    };
    const planogramProvenanceByCategory: Record<CategoryType, DataProvenance> = {
      Flour: 'unavailable',
      'Edible Oil': 'unavailable',
      Pasta: 'unavailable'
    };

    const shelfEvidenceByCategory = {} as Record<CategoryType, CategoryShelfEvidence>;
    let hasSheet2Audit = false;

    CATEGORIES.forEach((cat) => {
      const liveRec = liveByCat[cat];
      const s2Rec = normSap ? s2AuditsBySapCat.get(`${normSap}::${cat}`) : undefined;
      const planImg = normSap ? planogramImgBySapCat.get(`${normSap}::${cat}`) : undefined;

      if (liveRec) {
        const sos = Math.round(liveRec.shareOfShelfPct ?? liveRec.primarySharePct ?? 0);
        sosByCategory[cat] = sos;
        sosProvenanceByCategory[cat] = 'live_verified';

        const rawCounts = liveRec.counts || liveRec.aiCounts || {};
        const normalizedCounts: Record<string, number> = {};
        const unmappedList = new Set<string>(liveRec.unmappedBrands || []);
        Object.entries(rawCounts).forEach(([brand, cnt]) => {
          const norm = normalizeBrandAlias(brand, cat);
          if (norm.isUnmapped) {
            unmappedList.add(brand);
          }
          const key = norm.isUnmapped ? `UNMAPPED:${brand}` : norm.uiBrand;
          normalizedCounts[key] = (normalizedCounts[key] || 0) + Number(cnt || 0);
        });

        const zeroProxyCount = Object.values(rawCounts).filter((c) => c === 0).length;
        const missingOwn = liveRec.planogramCompliance?.missingOwnBrands || [];
        oosByCategory[cat] = zeroProxyCount;
        oosProvenanceByCategory[cat] = 'live_verified';

        if (liveRec.planogramCompliance?.hasPlanogram) {
          planogramScoreByCategory[cat] = Math.round(liveRec.planogramCompliance.overallScore);
          planogramProvenanceByCategory[cat] = 'live_verified';
        }

        shelfEvidenceByCategory[cat] = {
          originalUrl: liveRec.photoDataUrl || liveRec.photoUrl || undefined,
          annotatedUrl:
            liveRec.annotatedPhotoUrl ||
            liveRec.annotatedImage ||
            liveRec.n8nStatus?.annotatedImageUrl ||
            undefined,
          planogramUrl: planImg,
          sosPct: sos,
          complianceScore: planogramScoreByCategory[cat],
          missingBrands: missingOwn,
          unmappedBrands: Array.from(unmappedList),
          brandCounts: normalizedCounts,
          auditTimestamp: liveRec.timestamp,
          auditDateIso: parseFlexiblePjpDate(liveRec.timestamp)?.iso || getDohaTodayParts().iso,
          provenance: 'live_verified'
        };
      } else if (s2Rec) {
        hasSheet2Audit = true;
        if (Number.isFinite(s2Rec.shareOfShelfPct) && s2Rec.shareOfShelfPct > 0) {
          sosByCategory[cat] = Math.round(s2Rec.shareOfShelfPct);
          sosProvenanceByCategory[cat] = 'historical_verified';
        }
        oosByCategory[cat] = Math.max(0, Math.round(s2Rec.oosSkuCount || 0));
        oosProvenanceByCategory[cat] = 'historical_verified';
        if (Number.isFinite(s2Rec.planogramCompliancePct) && s2Rec.planogramCompliancePct > 0) {
          planogramScoreByCategory[cat] = Math.round(s2Rec.planogramCompliancePct);
          planogramProvenanceByCategory[cat] = 'historical_verified';
        }

        shelfEvidenceByCategory[cat] = {
          planogramUrl: planImg,
          sosPct: sosProvenanceByCategory[cat] === 'historical_verified' ? sosByCategory[cat] : null,
          complianceScore: planogramScoreByCategory[cat],
          missingBrands: [],
          unmappedBrands: [],
          brandCounts: {},
          auditTimestamp: s2Rec.date,
          auditDateIso: parseFlexiblePjpDate(s2Rec.date)?.iso || s2Rec.date,
          provenance: 'historical_verified'
        };
      } else {
        shelfEvidenceByCategory[cat] = {
          planogramUrl: planImg,
          sosPct: null,
          complianceScore: null,
          missingBrands: [],
          unmappedBrands: [],
          brandCounts: {},
          provenance: 'unavailable'
        };
      }
    });

    const hasLivePosm = liveAuditsForOutlet.length > 0;
    const posmStatus = hasLivePosm
      ? {
          shelfStrips: liveAuditsForOutlet.some((a) => a.posmShelfSticker),
          wobblers: liveAuditsForOutlet.some((a) => a.posmWobblers),
          gondola: liveAuditsForOutlet.some(
            (a) =>
              String(a.questionnaireAnswers?.dn_gondola || '').toLowerCase() === 'yes'
          ),
          priceTag: liveAuditsForOutlet.every((a) => a.priceTagOk)
        }
      : {
          shelfStrips: h % 10 !== 0,
          wobblers: (h >> 1) % 8 !== 0,
          gondola: (h >> 2) % 4 !== 0,
          priceTag: (h >> 3) % 6 !== 0
        };

    const evalGondolaState = (): PosmEvalState => {
      if (!hasLivePosm) return 'Not Evaluated';
      const answers = liveAuditsForOutlet
        .map((a) => String(a.questionnaireAnswers?.dn_gondola || '').trim().toLowerCase())
        .filter(Boolean);
      if (answers.length === 0) return 'Not Evaluated';
      if (answers.some((v) => v === 'yes')) return 'Present';
      if (answers.every((v) => v === 'n/a' || v === 'na')) return 'N/A';
      return 'Missing';
    };

    const posmStates: MasterOutletMetrics['posmStates'] = hasLivePosm
      ? {
          shelfStrips: posmStatus.shelfStrips ? 'Present' : 'Missing',
          wobblers: posmStatus.wobblers ? 'Present' : 'Missing',
          gondola: evalGondolaState(),
          priceTag: posmStatus.priceTag ? 'Present' : 'Missing'
        }
      : {
          shelfStrips: 'Not Evaluated',
          wobblers: 'Not Evaluated',
          gondola: 'Not Evaluated',
          priceTag: 'Not Evaluated'
        };

    const liveDamagedAudit = liveAuditsForOutlet.find(
      (a) => String(a.questionnaireAnswers?.os_damaged || '').toLowerCase() === 'yes'
    );
    const freshness =
      liveAuditsForOutlet.length > 0
        ? {
            evaluated: true,
            passed: !liveDamagedAudit,
            note: liveDamagedAudit
              ? `Expired/damaged packs flagged in ${liveDamagedAudit.category}`
              : `0 expired stock across ${liveAuditsForOutlet.length} live audit${
                  liveAuditsForOutlet.length > 1 ? 's' : ''
                }`,
            source: 'live' as const
          }
        : {
            evaluated: isRouteOutlet || h % 3 === 0,
            passed: h % 7 !== 0,
            note:
              h % 7 !== 0
                ? '0 expired stock verified on last visit'
                : 'Damaged/near-expiry pack flagged',
            source: 'schedule' as const
          };

    const flyerActive = 56 + (h % 30);
    const flyerMissing = Math.max(5, 90 - flyerActive);
    const flyerNa = 10;

    // Preserve shelfPhotoUrl strictly if any live audit exists (never fallback to stock)
    const latestLivePhoto = liveAuditsForOutlet
      .map(
        (a) => a.annotatedPhotoUrl || a.annotatedImage || a.photoDataUrl || a.photoUrl
      )
      .find(Boolean);

    const s2LatestDate = CATEGORIES.map((c) => shelfEvidenceByCategory[c].auditTimestamp)
      .filter((t): t is string => Boolean(t))
      .sort()
      .pop();

    const lastDay = 10 + (h % 7);
    const lastHour = 9 + (h % 7);
    const lastMin = ['05', '15', '20', '35', '45'][h % 5];

    const lastVisit =
      liveAuditsForOutlet[0]?.timestamp ||
      s2LatestDate ||
      `${lastDay} Oct, ${lastHour}:${lastMin}`;
    const lastVisitProvenance: DataProvenance =
      liveAuditsForOutlet.length > 0
        ? 'live_verified'
        : s2LatestDate
        ? 'historical_verified'
        : 'simulated';

    bucket.set(dedupKey, {
      id: existing?.id || id,
      name: branch ? `${account} — ${branch}` : rawName,
      branch: branch || rawName,
      account,
      code,
      isRouteOutlet: Boolean(existing?.isRouteOutlet || isRouteOutlet),
      hasLiveAudit: liveAuditsForOutlet.length > 0,
      hasSheet2Audit,
      mtonByCategory: {
        Flour: mtonFlour,
        'Edible Oil': mtonOil,
        Pasta: mtonPasta
      },
      sosByCategory,
      sosProvenanceByCategory,
      oosByCategory,
      oosProvenanceByCategory,
      planogramScoreByCategory,
      planogramProvenanceByCategory,
      shelfEvidenceByCategory,
      posmStatus,
      posmStates,
      posmProvenance: hasLivePosm ? 'live_verified' : 'simulated',
      flyerStatus: {
        activePct: flyerActive,
        missingPct: flyerMissing,
        naPct: flyerNa,
        presentItemsPct: 58 + (h % 25),
        missingItemsPct: 12 + ((h >> 2) % 18),
        wrongPricePct: Math.max(
          4,
          100 - (58 + (h % 25)) - (12 + ((h >> 2) % 18))
        )
      },
      freshness,
      lastVisit,
      lastVisitProvenance,
      shelfPhotoUrl: latestLivePhoto
    });
  };

  // 1. Populate accounts & outlets from assigned master outlets + PJP schedule rows
  assignedMasterOutlets
    .filter((m) => {
      const mName = (m.executive || '').trim().toLowerCase();
      const mRep = String(m.repId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
      return (cleanExec && mName === cleanExec) || (normRep && mRep === normRep);
    })
    .forEach((m) => {
      addOrMergeOutlet(m.account, m.id, m.name, m.branch, m.code, false);
    });

  const execPjpVisits =
    cleanExec || normRep
      ? (pjpVisits || []).filter((v) => {
          const vName = (v.executive || '').trim().toLowerCase();
          const vRep = String(v.repId || '').trim().replace(/^#/, '').replace(/^0+/, '').toLowerCase();
          return (cleanExec && vName === cleanExec) || (normRep && vRep === normRep);
        })
      : [];
  execPjpVisits.forEach((v, idx) => {
    addOrMergeOutlet(
      v.account,
      v.code ? `sap-${v.code}` : `pjp-idx-${idx}`,
      v.outlet,
      v.area || v.outlet,
      v.code,
      false
    );
  });

  // 2. Overlay executive's active today route outlets + live audits
  routeOutlets.forEach((o) => {
    addOrMergeOutlet(o.account, o.id, o.name, o.branch, o.code, true, o);
  });

  const accounts: ExecutiveAccountGroup[] = Array.from(byAccountMap.entries())
    .map(([account, map]) => {
      const outletsList = Array.from(map.values()).sort((a, b) => {
        if (a.isRouteOutlet !== b.isRouteOutlet) return a.isRouteOutlet ? -1 : 1;
        return a.branch.localeCompare(b.branch);
      });
      return {
        account,
        outlets: outletsList
      };
    })
    .sort((a, b) => {
      const aHasRoute = a.outlets.some((o) => o.isRouteOutlet) ? 1 : 0;
      const bHasRoute = b.outlets.some((o) => o.isRouteOutlet) ? 1 : 0;
      if (aHasRoute !== bHasRoute) return bHasRoute - aHasRoute;
      return b.outlets.length - a.outlets.length;
    });

  const allOutlets = accounts.flatMap((g) => g.outlets);
  const scheduleMeta = buildExecutivePjpScheduleMeta(
    executiveName,
    pjpVisits,
    allOutlets,
    execRepId,
    sheet2Visits,
    liveAuditDatesBySap
  );

  // Build Competitor Promos strictly distinguishing live questionnaire entries from synthetic demo spots
  const promoSpots: CompetitorPromoSpot[] = [];
  routeOutlets.forEach((o) => {
    const account = normalizeAccountLabel(o.account, o.name);
    CATEGORIES.forEach((cat) => {
      const audit = audits[`${o.id}_${cat}`];
      const ans = audit?.questionnaireAnswers;
      if (ans && String(ans.ci_promo || '').toLowerCase() === 'yes') {
        const brand =
          ans.ci_promo_brand === 'Other' && ans.ci_promo_brand_other
            ? String(ans.ci_promo_brand_other)
            : String(ans.ci_promo_brand || 'Competitor');
        promoSpots.push({
          id: `live-promo-${o.id}-${cat}`,
          account,
          outletName: o.branch ? `${account} — ${o.branch}` : o.name,
          category: cat,
          brand,
          offerDetails: String(
            ans.ci_promo_mechanic || 'In-store promotional price / multibuy'
          ),
          spottedDate: audit.timestamp || 'Today',
          count: 1,
          photoUrl: ans.ci_promo_photo || audit.photoUrl,
          isLive: true,
          provenance: 'live_verified'
        });
      }
    });
  });

  // Synthetic competitor promos clearly flagged as simulated demo data
  const brandPoolByCategory: Record<CategoryType, Array<{ brand: string; offer: string }>> = {
    Flour: [
      { brand: 'KFM', offer: 'Endcap stack · 5kg Chakki Atta QAR 3.50 off + shelf talker' },
      { brand: 'KFM', offer: 'Flyer feature · Twin-pack 2×2kg bundle at QAR 16.00' },
      { brand: 'Other', offer: 'Front-aisle promotional display with yellow price tag' }
    ],
    'Edible Oil': [
      { brand: 'Noor', offer: 'Gondola end · 1.5L×2 Corn Oil twin sleeve promo (20% off)' },
      { brand: 'Afia', offer: 'Weekend flyer discount QAR 4.00 off 2.9L bottle' }
    ],
    Pasta: [
      { brand: 'Barilla', offer: 'Buy 2 Get 1 Free · Front aisle clip strip & QAR 5.25 cut' },
      { brand: 'De Cecco', offer: 'Imported artisanal pasta island display with wobblers' }
    ]
  };

  allOutlets.slice(0, 6).forEach((o, idx) => {
    const cat = CATEGORIES[idx % CATEGORIES.length];
    const h = stableHash(`promo-${o.id}-${cat}`);
    const pick =
      brandPoolByCategory[cat][h % brandPoolByCategory[cat].length];
    promoSpots.push({
      id: `exec-cp-${o.id}-${cat}`,
      account: o.account,
      outletName: o.name,
      category: cat,
      brand: pick.brand,
      offerDetails: pick.offer,
      spottedDate: o.lastVisit,
      count: 2 + (h % 6),
      isLive: false,
      provenance: 'simulated'
    });
  });

  const sheet2SosSeries: Sheet2SosObservation[] = Array.from(s2SosByDateCat.values())
    .map((x) => ({
      dateIso: x.dateIso,
      category: x.category,
      avgSosPct: Math.round(x.sum / Math.max(1, x.count)),
      sampleCount: x.count,
      provenance: 'historical_verified' as const
    }))
    .sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  return {
    accounts,
    allOutlets,
    competitorPromos: promoSpots,
    scheduleMeta,
    sheet2SosSeries
  };
}
