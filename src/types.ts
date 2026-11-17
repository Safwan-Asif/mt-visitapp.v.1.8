export type CategoryType = 'Edible Oil' | 'Flour' | 'Pasta';

export type CategoryStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface OutletProgress {
  'Edible Oil': CategoryStatus;
  'Flour': CategoryStatus;
  'Pasta': CategoryStatus;
}

export interface Outlet {
  id: string;
  name: string;
  code?: string; // SAP customer code (matches Planograms.sap_code)
  account?: string;
  branch: string;
  sequence: string;
  address?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: OutletProgress;
  latitude?: number;
  longitude?: number;
  isUnmapped?: boolean;
  unmappedRemark?: string;
  visitId?: string;
  dataConfidence?: string;
}

export interface BrandFacing {
  brand: string;
  count: number;
  color?: string;
  isPrimary?: boolean;
}

export interface BoundingBox {
  id: string;
  brand: string;
  top: number; // percentage (0-100)
  left: number; // percentage (0-100)
  width: number; // percentage (0-100)
  height: number; // percentage (0-100)
  confidence: number;
  color: string;
  pixelCoords?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label?: string;
  thickness?: number;
  fontSize?: number;
  labelBackground?: string;
}

export interface CategoryAuditRecord {
  outletId: string;
  visitId?: string;
  category: CategoryType;
  priceTagOk: boolean;
  posmShelfSticker: boolean;
  posmWobblers: boolean;
  questionnaireAnswers?: Record<string, any>;
  questionnaireNewProducts?: Array<Record<string, any>>;
  aiCounts: Record<string, number>;
  counts?: Record<string, number>;
  originalAiCounts?: Record<string, number>;
  discrepancyLog?: string;
  unmappedRemark?: string;
  totalFacings: number;
  primarySharePct: number;
  shareOfShelfPct?: number;
  shareOfShelfLabel?: string;
  photoUrl: string;
  photoDataUrl?: string;
  annotatedPhotoUrl?: string;
  annotatedImage?: string;
  timestamp: string;
  auditDurationSeconds: number;
  needsReview?: boolean;
  replyText?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'device_gps' | 'outlet_fallback';
  aisles?: Partial<Record<AisleKey, AisleSessionData>>;
  activeAisleCount?: number;
  planogramCompliance?: PlanogramComplianceResult;
  editedByRep?: boolean;
  unmappedBrands?: string[];
  n8nStatus?: {
    success: boolean;
    source: 'n8n_remote' | 'simulated_fallback';
    message: string;
    latencyMs: number;
    retried?: boolean;
    endpoint?: string;
    annotatedImageUrl?: string;
  };
}

export type AisleKey = string;

export type AisleStatus = 'idle' | 'uploading' | 'analysing' | 'analyzing' | 'done' | 'completed' | 'error' | 'pending';

export interface AisleSessionData {
  key: AisleKey;
  label: string;
  status: AisleStatus;
  capturedPhotoUrl?: string;
  capturedFileName?: string;
  annotatedPhotoUrl?: string;
  rawCounts?: Record<string, number>;
  counts: Record<string, number>;
  originalAiCounts?: Record<string, number>;
  totalFacings: number;
  boundingBoxes?: BoundingBox[];
  rawBoxes?: any[];
  naturalDimensions?: { width: number; height: number };
  removedDuplicates?: DuplicateMatch[];
  seam?: {
    leftBayKey: string;
    rightBayKey: string;
    overlapFracRight: number;
    cutFracLeft: number;
    cutFracRight: number;
    confidence: string;
    method: string;
  };
  n8nStatus?: any;
  planRows?: Array<{ row: number; faces: Record<string, number> }>;
  rowsFound?: number;
  unmappedBrands?: string[];
  rightEdgeGhostUrl?: string | null;
  timestamp?: string;
}

export interface DuplicateMatch {
  boxId: string;
  brand: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  confidence?: number;
  matchedWithBoxId?: string;
  leftBayKey?: string;
  rightBayKey?: string;
}

export interface BayDuplicateReport {
  bayKey: string;
  bayLabel: string;
  hasDuplicates: boolean;
  duplicates: DuplicateMatch[];
}

export interface UserProfile {
  name: string;
  username: string;
  role: string;
  territory: string;
  repId: string;
  kpiRating?: number | string;
  pjpPercent?: number | string;
  monthlyTarget?: number | string;
  outletsBilled?: number | string;
}

export type ScreenType = 'LOGIN' | 'PJP' | 'OUTLET_OVERVIEW' | 'CAMERA_WORKFLOW' | 'DASHBOARD';

export interface PlanogramSlot {
  pos: number;
  brand: string;
  width: number;
}

export interface PlanogramRow {
  row: number;
  slots?: PlanogramSlot[];
  faces?: Record<string, number>;
}

export interface PlanogramBay {
  bayIndex: number;
  label: string;
  rows?: PlanogramRow[];
  planRows?: Array<{ row: number; faces: Record<string, number> }>;
  rowsFound?: number;
  imageOriginalUrl?: string;
  imageAnnotatedUrl?: string;
}

export interface PlanogramRecord {
  planogram_id: string;
  sap_code: string;
  cust_name: string;
  category: string;
  version: number;
  status: string;
  superseded_at?: string;
  created_by?: string;
  created_at?: string;
  updated_by?: string;
  updated_at?: string;
  bays_json: PlanogramBay[];
  brand_totals_json: Record<string, number>;
  total_faces: number;
  rows_found: number;
  image_original_url?: string;
  image_annotated_url?: string;
  notes?: string;
  target_sos?: number | null;
}

export type ComplianceBadgeStatus = 'COMPLIANT' | 'PARTIAL' | 'NON-COMPLIANT';

export interface PlanogramBrandSplit {
  brand: string;
  planned: number;
  actual: number;
  gap: number;
  matched: number;
}

export interface PlanogramRowDiagnostic {
  bayIndex: number;
  bayLabel: string;
  row: number;
  isExtraBay: boolean;
  plannedQfi: number;
  actualQfi: number;
  brandWisePct: number;
  companyWisePct: number;
  brandSplits: PlanogramBrandSplit[];
}

export interface PlanogramBayDiagnostic {
  bayIndex: number;
  bayLabel: string;
  isExtraBay: boolean;
  isMissingBay: boolean;
  plannedRowsCount: number;
  detectedRowsCount: number;
  plannedQfi: number;
  actualQfi: number;
  rows: PlanogramRowDiagnostic[];
}

export interface PlanogramComplianceResult {
  hasPlanogram: boolean;
  planogramId?: string;
  planogramVersion?: number;
  custName?: string;
  sapCode?: string;
  overallScore: number;
  rawOverallScore: number;
  overallStatus: ComplianceBadgeStatus;
  brandWisePct: number;
  brandStatus: ComplianceBadgeStatus;
  companyWisePct: number;
  companyStatus: ComplianceBadgeStatus;
  sosActualPct: number;
  sosTargetPct: number | null;
  sosAchievementPct: number | null;
  weightsUsed: {
    brand: number;
    company: number;
    sos: number;
  };
  missingBrandCapApplied: boolean;
  missingOwnBrands: string[];
  editedByRep: boolean;
  unmappedBrands: string[];
  plannedQfiFaces: number;
  actualQfiFaces: number;
  plannedTotalFaces: number;
  actualTotalFaces: number;
  plannedBaysCount: number;
  actualBaysCount: number;
  brandSplits: PlanogramBrandSplit[];
  bayDiagnostics: PlanogramBayDiagnostic[];
  scorecardAcknowledgedAt?: string;
  executiveNote?: string;
}

