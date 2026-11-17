import {
  Outlet,
  CategoryAuditRecord,
  CategoryType
} from '../types';
import { CATEGORIES } from '../constants';
import { PjpVisitRow } from '../data/pjpMasterData';

export type CategoryFilter = 'All' | CategoryType;

export interface MasterOutletMetrics {
  id: string;
  name: string;
  branch: string;
  account: string;
  code?: string;
  isRouteOutlet: boolean;
  hasLiveAudit: boolean;
  mtonByCategory: Record<CategoryType, number>;
  sosByCategory: Record<CategoryType, number>;
  oosByCategory: Record<CategoryType, number>;
  posmStatus: {
    shelfStrips: boolean;
    wobblers: boolean;
    gondola: boolean;
    priceTag: boolean;
  };
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
  shelfPhotoUrl?: string;
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
}

export interface ExecutiveDaySchedule {
  day: number;
  dateStr: string;
  plannedCount: number;
  completedCount: number;
  outlets: Array<{ name: string; account: string; area: string; code?: string }>;
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

export function buildExecutivePjpScheduleMeta(
  executiveName: string,
  pjpVisits: PjpVisitRow[],
  execOutlets: MasterOutletMetrics[]
): ExecutivePjpCalendarMeta {
  const cleanExec = (executiveName || '').trim().toLowerCase();
  const matchingVisits = (pjpVisits || []).filter(
    (v) => (v.executive || '').trim().toLowerCase() === cleanExec
  );

  // Determine calendar year & month from executive's real PJP visits, defaulting to Oct 2026
  let year = 2026;
  let month = 10;
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
          plannedCount: 0,
          completedCount: 0,
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

    // Compute plannedCount & simulated adherence up to cutoffDay (day 16 or midpoint)
    const sortedDays = Object.keys(scheduleByDay)
      .map(Number)
      .sort((a, b) => a - b);
    const cutoffDay = Math.min(daysInMonth, 17);

    sortedDays.forEach((d) => {
      const entry = scheduleByDay[d];
      entry.plannedCount = entry.outlets.length;
      if (d > cutoffDay) {
        entry.completedCount = 0;
      } else {
        // Realistic adherence: most days full or n-1 completed, occasional gap
        const h = stableHash(`${executiveName}-${year}-${month}-${d}`);
        const missed = h % 5 === 0 ? 1 : h % 9 === 0 ? Math.min(2, entry.plannedCount - 1) : 0;
        entry.completedCount = Math.max(1, entry.plannedCount - missed);
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
      scheduleByDay
    };
  }

  // Fallback for supervisor / executive with 0 PJP sheet rows (e.g. Safwan Asif) using active route outlets
  const cutoffDay = 16;
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
          } as any
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
    scheduleByDay[d] = {
      day: d,
      dateStr: `${d} ${monthShort}`,
      plannedCount: slice.length,
      completedCount: d <= cutoffDay ? Math.max(1, slice.length - missed) : 0,
      outlets: slice
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
    scheduleByDay
  };
}

export function buildExecutivePjpAnalytics(
  executiveName: string,
  routeOutlets: Outlet[],
  pjpVisits: PjpVisitRow[],
  audits: Record<string, CategoryAuditRecord>,
  periodScale: number
): {
  accounts: ExecutiveAccountGroup[];
  allOutlets: MasterOutletMetrics[];
  competitorPromos: CompetitorPromoSpot[];
  scheduleMeta: ExecutivePjpCalendarMeta;
} {
  const cleanExec = (executiveName || '').trim().toLowerCase();
  const byAccountMap = new Map<string, Map<string, MasterOutletMetrics>>();

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
    const dedupKey =
      (code && code.trim()) ||
      `${account.toLowerCase()}::${(branch || rawName).toLowerCase()}`;
    const existing = bucket.get(dedupKey);
    if (existing && !isRouteOutlet) {
      return;
    }

    const h = stableHash(`${account}-${branch || rawName}-${code || id}`);
    const weight =
      ACCOUNT_WEIGHT[rawAccount || account] || ACCOUNT_WEIGHT[account] || 0.85;

    const liveAuditsForOutlet = routeOutletObj
      ? CATEGORIES.map((cat) => audits[`${routeOutletObj.id}_${cat}`]).filter(
          (a): a is CategoryAuditRecord => Boolean(a)
        )
      : [];

    const mtonFlour = Number(((5.2 + (h % 65) / 10) * weight * periodScale).toFixed(1));
    const mtonOil = Number(
      ((3.1 + ((h >> 3) % 45) / 10) * weight * periodScale).toFixed(1)
    );
    const mtonPasta = Number(
      ((2.0 + ((h >> 5) % 30) / 10) * weight * periodScale).toFixed(1)
    );

    const baseSosOffset = (h % 13) - 6;
    const defaultSosFlour = Math.max(
      18,
      Math.min(62, Math.round(38 * (0.9 + weight * 0.08) + baseSosOffset))
    );
    const defaultSosOil = Math.max(
      14,
      Math.min(58, Math.round(31 * (0.9 + weight * 0.08) + baseSosOffset))
    );
    const defaultSosPasta = Math.max(
      12,
      Math.min(54, Math.round(29 * (0.9 + weight * 0.08) + baseSosOffset))
    );

    const liveFlour = liveAuditsForOutlet.find((a) => a.category === 'Flour');
    const liveOil = liveAuditsForOutlet.find((a) => a.category === 'Edible Oil');
    const livePasta = liveAuditsForOutlet.find((a) => a.category === 'Pasta');

    const sosByCategory: Record<CategoryType, number> = {
      Flour: liveFlour
        ? Math.round(liveFlour.shareOfShelfPct ?? liveFlour.primarySharePct)
        : defaultSosFlour,
      'Edible Oil': liveOil
        ? Math.round(liveOil.shareOfShelfPct ?? liveOil.primarySharePct)
        : defaultSosOil,
      Pasta: livePasta
        ? Math.round(livePasta.shareOfShelfPct ?? livePasta.primarySharePct)
        : defaultSosPasta
    };

    const oosByCategory: Record<CategoryType, number> = {
      Flour: liveFlour
        ? Object.values(liveFlour.counts || liveFlour.aiCounts || {}).filter(
            (c) => c === 0
          ).length
        : h % 4 === 0
        ? 3
        : h % 3,
      'Edible Oil': liveOil
        ? Object.values(liveOil.counts || liveOil.aiCounts || {}).filter(
            (c) => c === 0
          ).length
        : (h >> 2) % 5 === 0
        ? 4
        : (h >> 2) % 3,
      Pasta: livePasta
        ? Object.values(livePasta.counts || livePasta.aiCounts || {}).filter(
            (c) => c === 0
          ).length
        : (h >> 4) % 4 === 0
        ? 2
        : (h >> 4) % 2
    };

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

    const latestPhoto = liveAuditsForOutlet
      .map(
        (a) => a.annotatedPhotoUrl || a.annotatedImage || a.photoDataUrl || a.photoUrl
      )
      .find(Boolean);

    const lastDay = 10 + (h % 7);
    const lastHour = 9 + (h % 7);
    const lastMin = ['05', '15', '20', '35', '45'][h % 5];

    bucket.set(dedupKey, {
      id: existing?.id || id,
      name: branch ? `${account} — ${branch}` : rawName,
      branch: branch || rawName,
      account,
      code,
      isRouteOutlet: Boolean(existing?.isRouteOutlet || isRouteOutlet),
      hasLiveAudit: liveAuditsForOutlet.length > 0,
      mtonByCategory: {
        Flour: mtonFlour,
        'Edible Oil': mtonOil,
        Pasta: mtonPasta
      },
      sosByCategory,
      oosByCategory,
      posmStatus,
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
      lastVisit:
        liveAuditsForOutlet[0]?.timestamp || `${lastDay} Oct, ${lastHour}:${lastMin}`,
      shelfPhotoUrl: latestPhoto
    });
  };

  // 1. Populate accounts & outlets strictly from executive's assigned PJP schedule (unsynced from MT Customer Master)
  const execPjpVisits = cleanExec
    ? (pjpVisits || []).filter(
        (v) => (v.executive || '').trim().toLowerCase() === cleanExec
      )
    : [];
  execPjpVisits.forEach((v, idx) => {
    addOrMergeOutlet(
      v.account,
      v.code ? `pjp-${v.code}` : `pjp-idx-${idx}`,
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
  const scheduleMeta = buildExecutivePjpScheduleMeta(executiveName, pjpVisits, allOutlets);

  // Build Competitor Promos scoped to this executive's accounts/outlets + live session records
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
          isLive: true
        });
      }
    });
  });

  // Synthesize realistic spotted competitor promos on executive's actual assigned outlets
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
      count: 2 + (h % 6)
    });
  });

  return { accounts, allOutlets, competitorPromos: promoSpots, scheduleMeta };
}
