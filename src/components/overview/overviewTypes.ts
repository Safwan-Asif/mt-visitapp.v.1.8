import { CategoryAuditRecord, CategoryType, Outlet, PlanogramRecord, UserProfile } from '../../types';
import { MasterOutletOption } from '../../constants';
import { PjpVisitRow } from '../../data/pjpMasterData';
import {
  SyncedSheet2CategoryAudit,
  SyncedSheet2Visit
} from '../../services/pjpService';
import { CalendarDateValue } from '../WheelDateRangePicker';
import {
  CategoryFilter,
  CompetitorPromoSpot,
  DataProvenance,
  ExecutiveDaySchedule,
  ExecutivePjpCalendarMeta,
  MasterOutletMetrics,
  PosmEvalState
} from '../../utils/homeAnalyticsData';

export type PeriodPreset = 'today' | 'wtd' | 'mtd' | 'custom';

export type OverviewWorkspaceId =
  | 'summary'
  | 'sales'
  | 'accounts'
  | 'shelf'
  | 'execution'
  | 'productivity'
  | 'workhours';

export type OverviewDrilldown =
  | { type: 'account'; account: string }
  | { type: 'outlet'; outletId: string; initialCategory?: CategoryType }
  | { type: 'availability'; outletId: string; category: CategoryType }
  | { type: 'promotions' }
  | { type: 'journey'; day: number }
  | null;

export interface EvidenceViewerPayload {
  outletId: string;
  outletName: string;
  branch: string;
  sapCode?: string;
  category: CategoryType;
  originalUrl?: string;
  annotatedUrl?: string;
  planogramUrl?: string;
  sosPct: number | null;
  complianceScore: number | null;
  missingBrands: string[];
  unmappedBrands: string[];
  lastAuditLabel: string;
  provenance: DataProvenance;
}

export interface HomeAnalyticsScreenProps {
  executive: UserProfile | null;
  outlets: Outlet[];
  pjpVisits: PjpVisitRow[];
  masterOutlets?: MasterOutletOption[];
  sheet2Visits?: SyncedSheet2Visit[];
  sheet2Audits?: SyncedSheet2CategoryAudit[];
  audits: Record<string, CategoryAuditRecord>;
  planograms: PlanogramRecord[];
  isSyncingPjp?: boolean;
  onSyncPjp?: () => void;
  onNavigateToPendingPjp: () => void;
  selectedMapOutlet?: {
    id: string;
    name: string;
    area: string;
    nonce: number;
  } | null;
  onClearMapOutlet?: () => void;
}

export interface IntelligenceInsight {
  id: string;
  severity: 'critical' | 'attention' | 'positive' | 'info';
  headline: string;
  context: string;
  isDemo: boolean;
  provenanceLabel: string;
  targetWorkspace: OverviewWorkspaceId;
  targetDrilldown?: OverviewDrilldown;
  targetCategory?: CategoryFilter;
}

export interface TrajectoryPoint {
  index: number;
  dayNumber: number;
  label: string;
  actualMton: number;
  targetMton: number;
  varianceMton: number;
  variancePct: number;
}

export interface SosTrendPoint {
  index: number;
  label: string;
  sosPct: number;
  sampleCount: number;
  provenance: DataProvenance;
}

export interface AccountGroupSummary {
  account: string;
  outlets: Array<
    MasterOutletMetrics & {
      filteredMton: number;
      filteredSos: number;
      totalOosSkus: number;
    }
  >;
  mton: number;
  sharePct: number;
  sosPct: number;
  oosTotals: Record<CategoryType, number>;
  oosVerifiedTotals: Record<CategoryType, boolean>;
}

export interface AccountDonutSegment {
  label: string;
  mton: number;
  sharePct: number;
  color: string;
  dash: string;
  off: string;
}

export interface PlanogramStoreEntry {
  outletId: string;
  outletName: string;
  branch: string;
  account: string;
  category: CategoryType;
  score: number;
  brandPct: number | null;
  companyPct: number | null;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON-COMPLIANT';
  provenance: DataProvenance;
}

export interface CanonicalPlanogramSummary {
  hasData: boolean;
  overallScore: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;
  evaluatedAudits: number;
  liveAuditCount: number;
  historicalAuditCount: number;
  evaluatedStores: number;
  totalPlannedStores: number;
  avgBrandPct: number;
  avgCompanyPct: number;
  activePlanogramTemplates: number;
  stores: PlanogramStoreEntry[];
  provenance: DataProvenance;
}

export interface PosmMetricRow {
  key: 'shelfStrips' | 'wobblers' | 'gondola' | 'priceTag';
  label: string;
  pct: number;
  presentCount: number;
  missingCount: number;
  naCount: number;
  notEvaluatedCount: number;
  totalCount: number;
  verifiedCount: number;
  outletPreview: Array<{
    id: string;
    name: string;
    state: PosmEvalState;
    isLive: boolean;
  }>;
}

export interface ScheduleMetricsBundle {
  workingDaysAll: number[];
  executedDays: number[];
  activeCalDay: number;
  activeDayEntry: ExecutiveDaySchedule | undefined;
  daySummaryText: string;
  isSimulatedDay: boolean;
  firstActivityLabel: string;
  lastActivityLabel: string;
  recordedSpanLabel: string;
  auditDurationLabel: string;
  ganttDays: Array<{
    day: number;
    label: string;
    isSelected: boolean;
    isSimulated: boolean;
    spanLeftPct: number;
    spanWidthPct: number;
    blocks: Array<{
      leftPct: number;
      widthPct: number;
      startLabel: string;
      endLabel: string;
      durationMins: number;
      outletHint: string;
      title: string;
    }>;
  }>;
  startTimeDots: Array<{
    day: number;
    leftPct: number;
    topPx: number;
    isLate: boolean;
    isSelected: boolean;
    timeStr: string;
  }>;
  maxPlanned: number;
  targetLow: number;
}

export interface FilterStateSnapshot {
  periodPreset: PeriodPreset;
  fromDate: CalendarDateValue;
  toDate: CalendarDateValue;
  categoryFilter: CategoryFilter;
  accountFilter: string;
  outletFilter: string;
}

export type PromoListItem = CompetitorPromoSpot;
export type CalendarMetaSnapshot = ExecutivePjpCalendarMeta;
