import {
  CategoryType,
  Outlet,
  PlanogramRecord,
  PlanogramBay,
  PlanogramComplianceResult,
  PlanogramBrandSplit,
  PlanogramBayDiagnostic,
  PlanogramRowDiagnostic,
  AisleSessionData,
  BoundingBox
} from '../types';
import {
  PLANOGRAM_SCORING_CONFIG,
  PLANOGRAM_OWN_BRANDS,
  normalizePlanogramCategory,
  normalizeBrandAlias,
  getComplianceStatusFromPct,
  getMinComplianceStatus
} from '../config/planogramConfig';

const PLANOGRAM_CACHE_STORAGE_KEY = 'mta_planograms_active_cache_v1';

let memoryPlanogramsCache: PlanogramRecord[] = [];
let memoryCacheFetchedAt = 0;

function safeParseJson<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return val as T;
}

function normalizePlanogramRecord(raw: any): PlanogramRecord | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawBays = raw.bays_json ?? raw.bays;
  const rawBrandTotals = raw.brand_totals_json ?? raw.brandTotals ?? raw.brandSummary;

  const parsedBays = safeParseJson<PlanogramBay[]>(rawBays, []);
  const parsedBrandTotals = safeParseJson<Record<string, number>>(rawBrandTotals, {});

  const sapVal = raw.sap_code ?? raw.sap ?? '';
  const custVal = raw.cust_name ?? raw.custName ?? '';
  const idVal = raw.planogram_id ?? raw.id ?? `${sapVal || 'plan'}-${raw.category || 'cat'}-v${raw.version || 1}`;

  return {
    planogram_id: String(idVal),
    sap_code: String(sapVal).trim(),
    cust_name: String(custVal).trim(),
    category: normalizePlanogramCategory(raw.category),
    version: Number(raw.version) || 1,
    status: String(raw.status || 'active').trim().toLowerCase(),
    superseded_at: raw.superseded_at ? String(raw.superseded_at) : undefined,
    created_by: raw.created_by || raw.createdBy ? String(raw.created_by || raw.createdBy) : undefined,
    created_at: raw.created_at || raw.createdAt ? String(raw.created_at || raw.createdAt) : undefined,
    updated_by: raw.updated_by || raw.updatedBy ? String(raw.updated_by || raw.updatedBy) : undefined,
    updated_at: raw.updated_at || raw.updatedAt ? String(raw.updated_at || raw.updatedAt) : undefined,
    bays_json: Array.isArray(parsedBays) ? parsedBays : [],
    brand_totals_json: parsedBrandTotals && typeof parsedBrandTotals === 'object' ? parsedBrandTotals : {},
    total_faces: Number(raw.total_faces ?? raw.totalFaces) || 0,
    rows_found: Number(raw.rows_found ?? raw.rowCount ?? raw.rowsFound) || 0,
    image_original_url:
      raw.image_original_url || raw.imageOriginalUrl
        ? String(raw.image_original_url || raw.imageOriginalUrl)
        : undefined,
    image_annotated_url:
      raw.image_annotated_url || raw.imageAnnotatedUrl
        ? String(raw.image_annotated_url || raw.imageAnnotatedUrl)
        : undefined,
    notes: raw.notes ? String(raw.notes) : undefined,
    target_sos:
      raw.target_sos !== undefined && raw.target_sos !== null && String(raw.target_sos).trim() !== ''
        ? Number(raw.target_sos)
        : raw.targetSos !== undefined && raw.targetSos !== null && String(raw.targetSos).trim() !== ''
        ? Number(raw.targetSos)
        : null
  };
}

function hydratePlanogramsFromLocalStorage(): PlanogramRecord[] {
  try {
    const raw = localStorage.getItem(PLANOGRAM_CACHE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.planograms)) {
      memoryPlanogramsCache = parsed.planograms;
      memoryCacheFetchedAt = Number(parsed.fetchedAt) || 0;
      return memoryPlanogramsCache;
    }
  } catch {
    // Ignore corrupt localStorage cache
  }
  return [];
}

/**
 * Fetches active planograms via /api/planograms proxy and retains the highest active version
 * per sap_code + category. Pass forceRefresh = true on outlet open to check for mid-day updates.
 */
export async function fetchActivePlanograms(forceRefresh: boolean = false): Promise<PlanogramRecord[]> {
  if (!forceRefresh && memoryPlanogramsCache.length > 0 && Date.now() - memoryCacheFetchedAt < 5 * 60 * 1000) {
    return memoryPlanogramsCache;
  }

  try {
    const url = forceRefresh ? '/api/planograms?force=1' : '/api/planograms';
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const rawList: any[] = Array.isArray(json?.planograms) ? json.planograms : [];
      const activeOnly: PlanogramRecord[] = rawList
        .map((item: any) => normalizePlanogramRecord(item))
        .filter((p: PlanogramRecord | null): p is PlanogramRecord => Boolean(p && p.status === 'active'));

      // Keep highest version if duplicate active rows exist for same outlet + category
      const dedupMap = new Map<string, PlanogramRecord>();
      activeOnly.forEach((p: PlanogramRecord) => {
        const key = `${(p.sap_code || p.cust_name).toLowerCase()}|${p.category}`;
        const prev = dedupMap.get(key);
        if (!prev || p.version >= prev.version) {
          dedupMap.set(key, p);
        }
      });

      const normalizedList = Array.from(dedupMap.values());
      if (normalizedList.length > 0 || rawList.length === 0) {
        memoryPlanogramsCache = normalizedList;
        memoryCacheFetchedAt = Date.now();
        try {
          localStorage.setItem(
            PLANOGRAM_CACHE_STORAGE_KEY,
            JSON.stringify({ planograms: normalizedList, fetchedAt: memoryCacheFetchedAt })
          );
        } catch {
          // Ignore storage quota warnings
        }
      }
      return memoryPlanogramsCache;
    }
  } catch (err) {
    console.warn('[PlanogramService] Live planogram refresh failed, using cache:', err);
  }

  return memoryPlanogramsCache.length > 0
    ? memoryPlanogramsCache
    : hydratePlanogramsFromLocalStorage();
}

export function getCachedActivePlanograms(): PlanogramRecord[] {
  return memoryPlanogramsCache.length > 0
    ? memoryPlanogramsCache
    : hydratePlanogramsFromLocalStorage();
}

export function normalizeSapCode(val?: string | number | null): string {
  if (val === null || val === undefined) return '';
  return String(val)
    .trim()
    .replace(/\.0+$/, '')
    .toLowerCase();
}

function normalizeStoreText(val?: string): string {
  return (val || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesOutletByCustName(planogram: PlanogramRecord, outlet: Outlet): boolean {
  const custNorm = normalizeStoreText(planogram.cust_name);
  if (!custNorm) return false;
  const outletNameNorm = normalizeStoreText(outlet.name);
  const outletBranchNorm = normalizeStoreText(outlet.branch);
  if (custNorm === outletNameNorm) return true;
  if (
    outletBranchNorm &&
    custNorm.includes(outletBranchNorm) &&
    outlet.account &&
    custNorm.includes(normalizeStoreText(outlet.account))
  ) {
    return true;
  }
  return false;
}

/**
 * Returns ALL active planograms matched to an outlet by SAP Code (strict primary join key),
 * falling back to cust_name only if outlet.code is unavailable.
 */
export function getPlanogramsForOutlet(
  outlet: Outlet,
  planograms?: PlanogramRecord[]
): PlanogramRecord[] {
  const list = planograms && planograms.length > 0 ? planograms : getCachedActivePlanograms();
  if (!list || list.length === 0) return [];

  const active = list.filter((p) => p.status === 'active');
  const outletSap = normalizeSapCode(outlet.code);

  const bestByCat = new Map<CategoryType, PlanogramRecord>();

  const sapMatches = outletSap
    ? active.filter((p) => normalizeSapCode(p.sap_code) === outletSap)
    : active.filter((p) => matchesOutletByCustName(p, outlet));

  sapMatches.forEach((p) => {
    const cat = normalizePlanogramCategory(p.category);
    const existing = bestByCat.get(cat);
    if (!existing || p.version >= existing.version) {
      bestByCat.set(cat, p);
    }
  });

  // Fallback by cust_name if outletSap was present but had no match
  if (bestByCat.size === 0 && outletSap) {
    active
      .filter((p) => matchesOutletByCustName(p, outlet))
      .forEach((p) => {
        const cat = normalizePlanogramCategory(p.category);
        const existing = bestByCat.get(cat);
        if (!existing || p.version >= existing.version) {
          bestByCat.set(cat, p);
        }
      });
  }

  return Array.from(bestByCat.values());
}

/**
 * Returns planned QFI own-brand facing total for a PlanogramRecord.
 */
export function getPlannedQfiTotal(planogram: PlanogramRecord, category?: CategoryType): number {
  const cat = category || normalizePlanogramCategory(planogram.category);
  const ownBrands = PLANOGRAM_OWN_BRANDS[cat] || [];
  const totals = planogram.brand_totals_json || {};
  const normalized: Record<string, number> = {};
  Object.entries(totals).forEach(([rawBrand, cnt]) => {
    const norm = normalizeBrandAlias(rawBrand, cat);
    normalized[norm.canonical] = (normalized[norm.canonical] || 0) + (Number(cnt) || 0);
  });
  return ownBrands.reduce((sum, b) => sum + (normalized[b] || 0), 0);
}

/**
 * Finds the active planogram for an outlet + category.
 * Matches strictly by normalized SAP Code + category first, falling back to trimmed case-insensitive cust_name.
 */
export function findActivePlanogramForOutlet(
  outlet: Outlet,
  category: CategoryType,
  planograms?: PlanogramRecord[]
): PlanogramRecord | null {
  const list = planograms && planograms.length > 0 ? planograms : getCachedActivePlanograms();
  if (!list || list.length === 0) return null;

  const targetCat = normalizePlanogramCategory(category);
  const candidates = list.filter(
    (p) => p.status === 'active' && normalizePlanogramCategory(p.category) === targetCat
  );

  if (candidates.length === 0) return null;

  const outletSap = normalizeSapCode(outlet.code);
  if (outletSap) {
    const bySap = candidates
      .filter((p) => normalizeSapCode(p.sap_code) === outletSap)
      .sort((a, b) => b.version - a.version);
    if (bySap.length > 0) return bySap[0];
  }

  const byCustName = candidates
    .filter((p) => matchesOutletByCustName(p, outlet))
    .sort((a, b) => b.version - a.version);

  return byCustName[0] || null;
}

/**
 * Extracts normalized canonical brand counts per shelf row from a bay's planned definition.
 */
function extractPlannedBayRows(bay: PlanogramBay, category: CategoryType): Array<{ row: number; faces: Record<string, number> }> {
  const rowMap = new Map<number, Record<string, number>>();

  if (Array.isArray(bay.rows) && bay.rows.length > 0) {
    bay.rows.forEach((r, idx) => {
      const rowNum = Number(r.row) || idx + 1;
      const faces = rowMap.get(rowNum) || {};
      if (Array.isArray(r.slots)) {
        r.slots.forEach((slot) => {
          const norm = normalizeBrandAlias(slot.brand, category);
          const width = Number(slot.width) || 0;
          if (width > 0) {
            faces[norm.canonical] = (faces[norm.canonical] || 0) + width;
          }
        });
      } else if (r.faces && typeof r.faces === 'object') {
        Object.entries(r.faces).forEach(([brand, cnt]) => {
          const norm = normalizeBrandAlias(brand, category);
          const n = Number(cnt) || 0;
          if (n > 0) faces[norm.canonical] = (faces[norm.canonical] || 0) + n;
        });
      }
      rowMap.set(rowNum, faces);
    });
  } else if (Array.isArray(bay.planRows) && bay.planRows.length > 0) {
    bay.planRows.forEach((r, idx) => {
      const rowNum = Number(r.row) || idx + 1;
      const faces = rowMap.get(rowNum) || {};
      Object.entries(r.faces || {}).forEach(([brand, cnt]) => {
        const norm = normalizeBrandAlias(brand, category);
        const n = Number(cnt) || 0;
        if (n > 0) faces[norm.canonical] = (faces[norm.canonical] || 0) + n;
      });
      rowMap.set(rowNum, faces);
    });
  }

  return Array.from(rowMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([row, faces]) => ({ row, faces }));
}

/**
 * Clusters AI bounding boxes top-to-bottom by Y-center when explicit planRows are not provided by n8n.
 * Respects excluded duplicate IDs from multi-bay seam deduplication so overlapped bottles aren't double counted.
 */
export function extractActualBayRows(
  bay: Partial<AisleSessionData>,
  category: CategoryType,
  excludedBoxIds?: Set<string>
): Array<{ row: number; faces: Record<string, number> }> {
  // 1. Prefer explicit planRows returned directly from n8n if available
  if (Array.isArray(bay.planRows) && bay.planRows.length > 0) {
    return bay.planRows
      .map((r, idx) => {
        const faces: Record<string, number> = {};
        Object.entries(r.faces || {}).forEach(([brand, count]) => {
          const norm = normalizeBrandAlias(brand, category);
          const n = Number(count) || 0;
          if (n > 0) {
            faces[norm.canonical] = (faces[norm.canonical] || 0) + n;
          }
        });
        return { row: Number(r.row) || idx + 1, faces };
      })
      .sort((a, b) => a.row - b.row);
  }

  // 2. Otherwise cluster boundingBoxes top-to-bottom by vertical Y-center (0-100%)
  const rawBoxes: BoundingBox[] = Array.isArray(bay.boundingBoxes)
    ? bay.boundingBoxes
    : Array.isArray((bay as any).boxes)
    ? (bay as any).boxes
    : [];

  const filtered = rawBoxes.filter((b) => !excludedBoxIds || !excludedBoxIds.has(b.id));
  if (filtered.length === 0) return [];

  const items = filtered
    .map((b) => {
      const h = typeof b.height === 'number' && b.height > 0 ? b.height : 10;
      const top = typeof b.top === 'number' ? b.top : 0;
      return {
        yCenter: top + h / 2,
        height: h,
        brand: normalizeBrandAlias(b.brand || b.label || '', category).canonical
      };
    })
    .sort((a, b) => a.yCenter - b.yCenter);

  // Adaptive vertical tolerance: half of median box height (clamped 5% - 14%)
  const heights = items.map((i) => i.height).sort((a, b) => a - b);
  const medianHeight = heights[Math.floor(heights.length / 2)] || 12;
  const rowThreshold = Math.max(5, Math.min(14, medianHeight * 0.65));

  const clusters: Array<{ avgY: number; items: typeof items }> = [];
  for (const item of items) {
    const last = clusters[clusters.length - 1];
    if (!last || Math.abs(item.yCenter - last.avgY) > rowThreshold) {
      clusters.push({ avgY: item.yCenter, items: [item] });
    } else {
      last.items.push(item);
      last.avgY =
        last.items.reduce((acc, it) => acc + it.yCenter, 0) / last.items.length;
    }
  }

  return clusters.map((cluster, idx) => {
    const faces: Record<string, number> = {};
    cluster.items.forEach((it) => {
      faces[it.brand] = (faces[it.brand] || 0) + 1;
    });
    return {
      row: idx + 1,
      faces
    };
  });
}

export interface EvaluatePlanogramInput {
  outlet: Outlet;
  category: CategoryType;
  planogram: PlanogramRecord | null;
  confirmedCounts: Record<string, number>;
  initialAiCounts: Record<string, number>;
  actualTotalFacings: number;
  actualPrimarySharePct: number;
  baySessions: Array<{
    key: string;
    label: string;
    boundingBoxes?: BoundingBox[];
    boxes?: BoundingBox[];
    planRows?: Array<{ row: number; faces: Record<string, number> }>;
    unmappedBrands?: string[];
  }>;
  excludedBoxIds?: Set<string>;
  unmappedBrands?: string[];
}

/**
 * Evaluates Planogram Compliance:
 * - Headline Brand-Wise %, Company-Wise %, and SoS Achievement % are computed strictly at the
 *   CATEGORY level from confirmed counts (so manual +/- edits never disagree with row diagnostics).
 * - Overall Status can never exceed the weakest of the Brand and Company KPI cards.
 * - Optional 70% cap applies automatically if any planned QFI brand has 0 actual faces.
 * - Bay/row breakdowns operate strictly on AI-detected spatial rows and surface an editedByRep flag.
 */
export function evaluatePlanogramCompliance(
  input: EvaluatePlanogramInput
): PlanogramComplianceResult {
  const {
    category,
    planogram,
    confirmedCounts,
    initialAiCounts,
    actualTotalFacings,
    actualPrimarySharePct,
    baySessions,
    excludedBoxIds
  } = input;

  const cfg = PLANOGRAM_SCORING_CONFIG;
  const ownBrands = PLANOGRAM_OWN_BRANDS[category] || [];
  const ownSet = new Set(ownBrands);

  // Collect any unmapped brand strings detected across counts & bays
  const unmappedSet = new Set<string>(input.unmappedBrands || []);
  baySessions.forEach((b) => (b.unmappedBrands || []).forEach((u) => unmappedSet.add(u)));

  // Normalize confirmed & initial AI counts into canonical brand keys
  const normConfirmed: Record<string, number> = {};
  Object.entries(confirmedCounts || {}).forEach(([rawKey, val]) => {
    const cnt = Number(val) || 0;
    const res = normalizeBrandAlias(rawKey, category);
    if (res.isUnmapped && cnt > 0) {
      unmappedSet.add(res.raw || res.canonical);
    }
    normConfirmed[res.canonical] = (normConfirmed[res.canonical] || 0) + cnt;
  });

  const normInitialAi: Record<string, number> = {};
  Object.entries(initialAiCounts || {}).forEach(([rawKey, val]) => {
    const cnt = Number(val) || 0;
    const res = normalizeBrandAlias(rawKey, category);
    normInitialAi[res.canonical] = (normInitialAi[res.canonical] || 0) + cnt;
  });

  // Check if rep manually changed any brand count via + / - steppers
  const allEditKeys = new Set([...Object.keys(normConfirmed), ...Object.keys(normInitialAi)]);
  let editedByRep = false;
  allEditKeys.forEach((k) => {
    if ((normConfirmed[k] || 0) !== (normInitialAi[k] || 0)) {
      editedByRep = true;
    }
  });

  const actualQfiFaces = ownBrands.reduce((sum, b) => sum + (normConfirmed[b] || 0), 0);
  const unmappedBrands = Array.from(unmappedSet);

  // Handle missing active planogram gracefully
  if (!planogram) {
    return {
      hasPlanogram: false,
      overallScore: 0,
      rawOverallScore: 0,
      overallStatus: 'PARTIAL',
      brandWisePct: 0,
      brandStatus: 'PARTIAL',
      companyWisePct: 0,
      companyStatus: 'PARTIAL',
      sosActualPct: Number(actualPrimarySharePct.toFixed(1)),
      sosTargetPct: null,
      sosAchievementPct: null,
      weightsUsed: { ...cfg.weights },
      missingBrandCapApplied: false,
      missingOwnBrands: [],
      editedByRep,
      unmappedBrands,
      plannedQfiFaces: 0,
      actualQfiFaces,
      plannedTotalFaces: 0,
      actualTotalFaces: actualTotalFacings,
      plannedBaysCount: 0,
      actualBaysCount: baySessions.length,
      brandSplits: ownBrands.map((brand) => ({
        brand,
        planned: 0,
        actual: normConfirmed[brand] || 0,
        gap: normConfirmed[brand] || 0,
        matched: 0
      })),
      bayDiagnostics: []
    };
  }

  // 1. Normalize Planned Totals from brand_totals_json (or fallback to summing bays_json)
  const plannedTotals: Record<string, number> = {};
  if (planogram.brand_totals_json && Object.keys(planogram.brand_totals_json).length > 0) {
    Object.entries(planogram.brand_totals_json).forEach(([rawBrand, cnt]) => {
      const norm = normalizeBrandAlias(rawBrand, category);
      const n = Number(cnt) || 0;
      plannedTotals[norm.canonical] = (plannedTotals[norm.canonical] || 0) + n;
    });
  } else {
    planogram.bays_json.forEach((bay) => {
      extractPlannedBayRows(bay, category).forEach((r) => {
        Object.entries(r.faces).forEach(([b, cnt]) => {
          plannedTotals[b] = (plannedTotals[b] || 0) + cnt;
        });
      });
    });
  }

  const plannedQfiFaces = ownBrands.reduce((sum, b) => sum + (plannedTotals[b] || 0), 0);
  const sumBrandTotals = Object.values(plannedTotals).reduce((a, b) => a + b, 0);
  const plannedTotalFaces = planogram.total_faces > 0 ? planogram.total_faces : sumBrandTotals;

  // 2. Category-Level Headline Brand-Wise % = Sum min(actual, planned) per QFI brand / Sum planned QFI
  const brandSplits: PlanogramBrandSplit[] = [];
  let brandMatchedSum = 0;
  const missingOwnBrands: string[] = [];

  const splitKeys = Array.from(
    new Set([
      ...ownBrands,
      ...Object.keys(plannedTotals).filter((k) => plannedTotals[k] > 0),
      ...Object.keys(normConfirmed).filter((k) => normConfirmed[k] > 0)
    ])
  );

  splitKeys.forEach((brand) => {
    const planned = plannedTotals[brand] || 0;
    const actual = normConfirmed[brand] || 0;
    const isQfiBrand = ownSet.has(brand);
    const matched = isQfiBrand ? Math.min(actual, planned) : 0;

    if (isQfiBrand) {
      brandMatchedSum += matched;
      if (planned > 0 && actual === 0) {
        missingOwnBrands.push(brand);
      }
    }

    if (planned > 0 || actual > 0) {
      brandSplits.push({
        brand,
        planned,
        actual,
        gap: actual - planned,
        matched
      });
    }
  });

  const brandWisePct =
    plannedQfiFaces > 0
      ? Math.round((brandMatchedSum / plannedQfiFaces) * 100)
      : actualQfiFaces > 0
      ? 100
      : 0;

  // 3. Category-Level Headline Company-Wise % = min(actual QFI, planned QFI) / planned QFI
  const companyWisePct =
    plannedQfiFaces > 0
      ? Math.round((Math.min(actualQfiFaces, plannedQfiFaces) / plannedQfiFaces) * 100)
      : actualQfiFaces > 0
      ? 100
      : 0;

  // 4. Target SoS % & SoS Achievement %
  // Auto-calculated if OTHER (or competitor planned faces) exists in brand_totals_json, OR manual target_sos override
  const hasCompetitorDenominator =
    (plannedTotals['OTHER'] || 0) > 0 ||
    Object.entries(plannedTotals).some(([b, n]) => !ownSet.has(b) && n > 0);

  let sosTargetPct: number | null = null;
  if (typeof planogram.target_sos === 'number' && planogram.target_sos > 0) {
    sosTargetPct = Number(planogram.target_sos.toFixed(1));
  } else if (hasCompetitorDenominator && plannedTotalFaces > 0) {
    sosTargetPct = Number(((plannedQfiFaces / plannedTotalFaces) * 100).toFixed(1));
  }

  const sosActualPct = Number(actualPrimarySharePct.toFixed(1));
  const sosAchievementPct =
    sosTargetPct !== null && sosTargetPct > 0
      ? Math.round(Math.min(100, (sosActualPct / sosTargetPct) * 100))
      : null;

  // 5. Weighted Overall Category Score (40/40/20 or 50/50 fallback when SoS target unavailable)
  const weightsUsed =
    sosAchievementPct !== null
      ? { ...cfg.weights }
      : { ...cfg.noSosWeights, sos: 0 };

  const rawOverallScore = Math.round(
    brandWisePct * weightsUsed.brand +
      companyWisePct * weightsUsed.company +
      (sosAchievementPct ?? 0) * weightsUsed.sos
  );

  // Apply 70% Missing-Brand Cap if enabled & any planned QFI brand has 0 actual faces
  const missingBrandCapApplied =
    cfg.missingBrandCapEnabled && missingOwnBrands.length > 0 && rawOverallScore > cfg.missingBrandCapPct;
  const overallScore = missingBrandCapApplied
    ? cfg.missingBrandCapPct
    : rawOverallScore;

  // 6. Status Banding (>= 85 COMPLIANT, 70-84 PARTIAL, < 70 NON-COMPLIANT)
  // Rule: Hero overallStatus can never exceed the weakest of the two KPI cards
  const brandStatus = getComplianceStatusFromPct(brandWisePct, cfg);
  const companyStatus = getComplianceStatusFromPct(companyWisePct, cfg);
  const rawBandStatus = getComplianceStatusFromPct(overallScore, cfg);
  const overallStatus = getMinComplianceStatus([brandStatus, companyStatus, rawBandStatus]);

  // 7. Diagnostic Bay & Row Breakdowns (strictly from AI-detected spatial rows)
  const plannedBays = Array.isArray(planogram.bays_json)
    ? [...planogram.bays_json].sort((a, b) => (Number(a.bayIndex) || 0) - (Number(b.bayIndex) || 0))
    : [];

  const maxBays = Math.max(plannedBays.length, baySessions.length);
  const bayDiagnostics: PlanogramBayDiagnostic[] = [];

  for (let i = 0; i < maxBays; i++) {
    const plannedBay = plannedBays[i];
    const actualBay = baySessions[i];
    const bayIndex = plannedBay ? Number(plannedBay.bayIndex) || i + 1 : i + 1;
    const bayLabel = plannedBay?.label || actualBay?.label || `Bay ${bayIndex}`;
    const isExtraBay = !plannedBay && Boolean(actualBay);
    const isMissingBay = Boolean(plannedBay) && !actualBay;

    const plannedRows = plannedBay ? extractPlannedBayRows(plannedBay, category) : [];
    const actualRows = actualBay
      ? extractActualBayRows(actualBay, category, excludedBoxIds)
      : [];

    const maxRows = Math.max(plannedRows.length, actualRows.length);
    const rowDiagnostics: PlanogramRowDiagnostic[] = [];
    let bayPlannedQfi = 0;
    let bayActualQfi = 0;

    for (let rIdx = 0; rIdx < maxRows; rIdx++) {
      const pRow = plannedRows[rIdx];
      const aRow = actualRows[rIdx];
      const rowNum = pRow?.row || aRow?.row || rIdx + 1;
      const pFaces = pRow?.faces || {};
      const aFaces = aRow?.faces || {};

      const rowPlannedQfi = ownBrands.reduce((s, b) => s + (pFaces[b] || 0), 0);
      const rowActualQfi = ownBrands.reduce((s, b) => s + (aFaces[b] || 0), 0);
      bayPlannedQfi += rowPlannedQfi;
      bayActualQfi += rowActualQfi;

      let rowBrandMatched = 0;
      const rowBrands = Array.from(
        new Set([...ownBrands.filter((b) => (pFaces[b] || 0) > 0 || (aFaces[b] || 0) > 0)])
      );

      const rowSplits: PlanogramBrandSplit[] = rowBrands.map((b) => {
        const p = pFaces[b] || 0;
        const a = aFaces[b] || 0;
        const matched = Math.min(a, p);
        rowBrandMatched += matched;
        return {
          brand: b,
          planned: p,
          actual: a,
          gap: a - p,
          matched
        };
      });

      const rowBrandPct =
        rowPlannedQfi > 0
          ? Math.round((rowBrandMatched / rowPlannedQfi) * 100)
          : rowActualQfi > 0
          ? 100
          : 100;
      const rowCompanyPct =
        rowPlannedQfi > 0
          ? Math.round((Math.min(rowActualQfi, rowPlannedQfi) / rowPlannedQfi) * 100)
          : rowActualQfi > 0
          ? 100
          : 100;

      rowDiagnostics.push({
        bayIndex,
        bayLabel,
        row: rowNum,
        isExtraBay,
        plannedQfi: rowPlannedQfi,
        actualQfi: rowActualQfi,
        brandWisePct: rowBrandPct,
        companyWisePct: rowCompanyPct,
        brandSplits: rowSplits
      });
    }

    bayDiagnostics.push({
      bayIndex,
      bayLabel,
      isExtraBay,
      isMissingBay,
      plannedRowsCount: plannedRows.length,
      detectedRowsCount: actualRows.length,
      plannedQfi: bayPlannedQfi,
      actualQfi: bayActualQfi,
      rows: rowDiagnostics
    });
  }

  return {
    hasPlanogram: true,
    planogramId: planogram.planogram_id,
    planogramVersion: planogram.version,
    custName: planogram.cust_name,
    sapCode: planogram.sap_code,
    overallScore,
    rawOverallScore,
    overallStatus,
    brandWisePct,
    brandStatus,
    companyWisePct,
    companyStatus,
    sosActualPct,
    sosTargetPct,
    sosAchievementPct,
    weightsUsed,
    missingBrandCapApplied,
    missingOwnBrands,
    editedByRep,
    unmappedBrands,
    plannedQfiFaces,
    actualQfiFaces,
    plannedTotalFaces,
    actualTotalFaces: actualTotalFacings,
    plannedBaysCount: plannedBays.length,
    actualBaysCount: baySessions.length,
    brandSplits,
    bayDiagnostics
  };
}
