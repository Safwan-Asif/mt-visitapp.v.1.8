import { CategoryType } from '../types';

// Live Planograms Apps Script Web App Endpoint (Tab: Planograms, gid=847697659)
export const PLANOGRAMS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbxK37aAtr99B6ulD2FxRklFYfO587iHceiJtE00OcDhxdfbdJqx3-b0UifjRcMf8RHQAQ/exec';

export type ComplianceStatus = 'COMPLIANT' | 'PARTIAL' | 'NON-COMPLIANT';

export interface PlanogramScoringConfig {
  compliantMinPct: number; // >= 85%
  partialMinPct: number;   // 70% - 84% (< 70% = NON-COMPLIANT)
  weights: {
    brand: number;
    company: number;
    sos: number;
  };
  noSosWeights: {
    brand: number;
    company: number;
  };
  missingBrandCapEnabled: boolean;
  missingBrandCapPct: number; // Cap Overall Category Score at 70% if any planned QFI brand has 0 actual faces
}

export const PLANOGRAM_SCORING_CONFIG: PlanogramScoringConfig = {
  compliantMinPct: 85,
  partialMinPct: 70,
  weights: {
    brand: 0.4,
    company: 0.4,
    sos: 0.2
  },
  noSosWeights: {
    brand: 0.5,
    company: 0.5
  },
  missingBrandCapEnabled: true,
  missingBrandCapPct: 70
};

// Canonical QFI Own Brands per Category (matching Planograms sheet brand codes)
export const PLANOGRAM_OWN_BRANDS: Record<CategoryType, string[]> = {
  'Edible Oil': ['YARA', 'ZAIN', 'AL RAI', 'ADEERA', 'DAWI'],
  'Flour': ['F1', 'F2', 'F3', 'SR', 'PREMIUM'],
  'Pasta': ['QFM', 'QFM PREM', 'ZAIN']
};

export const PLANOGRAM_COMPETITOR_BRANDS: Record<CategoryType, string[]> = {
  'Edible Oil': ['OTHER'],
  'Flour': ['KFM', 'OTHER'],
  'Pasta': ['OTHER']
};

export function normalizePlanogramCategory(rawCategory?: string): CategoryType {
  const c = (rawCategory || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
  if (c.includes('flour')) return 'Flour';
  if (c.includes('pasta')) return 'Pasta';
  return 'Edible Oil';
}

export function toPlanogramSheetCategoryKey(category: CategoryType): string {
  if (category === 'Flour') return 'flour';
  if (category === 'Pasta') return 'pasta';
  return 'edible_oil';
}

export interface NormalizedBrandResult {
  canonical: string;   // Canonical uppercase brand code used in Planogram scoring
  uiBrand: string;     // Matching UI stepper key used in CATEGORY_BRANDS
  isOwn: boolean;
  isCompetitor: boolean;
  isUnmapped: boolean;
  raw: string;
}

/**
 * Single Canonical Alias Normalizer shared across Planograms (bays_json / brand_totals_json)
 * AND Vision AI outputs (counts / boxes / planRows).
 *
 * Rules:
 * - Flour keeps SR and PREMIUM strictly separate (PREM -> PREMIUM).
 * - Edible Oil maps AL_RAI / ALRAI / RAI -> AL RAI.
 * - Pasta maps PREMIUM / PREM -> QFM PREM.
 * - Unrecognized labels are NEVER silently bucketed into OTHER; they return isUnmapped: true
 *   so audits flag them for review.
 */
export function normalizeBrandAlias(
  rawBrand: string,
  category?: CategoryType | string
): NormalizedBrandResult {
  const raw = String(rawBrand ?? '').trim();
  const clean = raw.toUpperCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const cat = normalizePlanogramCategory(category);

  if (!clean) {
    return {
      canonical: 'UNMAPPED',
      uiBrand: 'UNMAPPED',
      isOwn: false,
      isCompetitor: false,
      isUnmapped: true,
      raw
    };
  }

  // Competitor / explicit OTHER
  if (
    clean === 'OTHER' ||
    clean === 'OTHERS' ||
    clean === 'COMPETITOR' ||
    clean === 'COMP' ||
    clean === 'UNKNOWN'
  ) {
    return {
      canonical: 'OTHER',
      uiBrand: 'OTHER',
      isOwn: false,
      isCompetitor: true,
      isUnmapped: false,
      raw
    };
  }

  if (cat === 'Flour') {
    if (clean === 'F1' || /\bF1\b/.test(clean)) {
      return { canonical: 'F1', uiBrand: 'F1', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'F2' || /\bF2\b/.test(clean)) {
      return { canonical: 'F2', uiBrand: 'F2', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'F3' || /\bF3\b/.test(clean)) {
      return { canonical: 'F3', uiBrand: 'F3', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    // Keep SR and PREMIUM strictly separate! Check exact SR / SELF RAISING before PREMIUM
    if (
      clean === 'SR' ||
      clean === 'S R' ||
      clean.includes('SELF RAISING') ||
      clean.includes('SELF RISING') ||
      (clean.includes('SR') && !clean.includes('PREM'))
    ) {
      return { canonical: 'SR', uiBrand: 'SR', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'PREMIUM' || clean === 'PREM' || clean === 'QFM PREM' || clean === 'QFM PREMIUM' || clean.includes('PREMIUM') || /\bPREM\b/.test(clean)) {
      return { canonical: 'PREMIUM', uiBrand: 'PREM', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'KFM' || clean.includes('KFM')) {
      return { canonical: 'KFM', uiBrand: 'KFM', isOwn: false, isCompetitor: true, isUnmapped: false, raw };
    }
  } else if (cat === 'Pasta') {
    if (clean === 'QFM PREM' || clean === 'QFM PREMIUM' || clean === 'PREMIUM' || clean === 'PREM' || clean.includes('PREMIUM') || /\bPREM\b/.test(clean)) {
      return { canonical: 'QFM PREM', uiBrand: 'QFM PREM', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'QFM' || clean.includes('QFM')) {
      return { canonical: 'QFM', uiBrand: 'QFM', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'ZAIN' || clean.includes('ZAIN')) {
      return { canonical: 'ZAIN', uiBrand: 'ZAIN', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
  } else {
    // Edible Oil
    if (clean === 'YARA' || clean.includes('YARA')) {
      return { canonical: 'YARA', uiBrand: 'YARA', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'ZAIN' || clean.includes('ZAIN')) {
      return { canonical: 'ZAIN', uiBrand: 'ZAIN', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'ADEERA' || clean.includes('ADEERA')) {
      return { canonical: 'ADEERA', uiBrand: 'ADEERA', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'AL RAI' || clean === 'ALRAI' || clean.includes('AL RAI') || clean.includes('ALRAI') || clean === 'RAI') {
      return { canonical: 'AL RAI', uiBrand: 'AL RAI', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
    if (clean === 'DAWI' || clean.includes('DAWI')) {
      return { canonical: 'DAWI', uiBrand: 'DAWI', isOwn: true, isCompetitor: false, isUnmapped: false, raw };
    }
  }

  // Flag unrecognized brand rather than silently swallowing into OTHER
  return {
    canonical: clean,
    uiBrand: clean,
    isOwn: false,
    isCompetitor: false,
    isUnmapped: true,
    raw
  };
}

export function getComplianceStatusFromPct(
  pct: number,
  config: PlanogramScoringConfig = PLANOGRAM_SCORING_CONFIG
): ComplianceStatus {
  if (pct >= config.compliantMinPct) return 'COMPLIANT';
  if (pct >= config.partialMinPct) return 'PARTIAL';
  return 'NON-COMPLIANT';
}

export function getMinComplianceStatus(statuses: ComplianceStatus[]): ComplianceStatus {
  if (statuses.includes('NON-COMPLIANT')) return 'NON-COMPLIANT';
  if (statuses.includes('PARTIAL')) return 'PARTIAL';
  return 'COMPLIANT';
}
