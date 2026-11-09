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
  branch: string;
  sequence: string;
  address?: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: OutletProgress;
  latitude?: number;
  longitude?: number;
  isUnmapped?: boolean;
  unmappedRemark?: string;
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
  category: CategoryType;
  priceTagOk: boolean;
  posmShelfSticker: boolean;
  posmWobblers: boolean;
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

export type AisleStatus = 'idle' | 'uploading' | 'analysing' | 'done' | 'error' | 'pending';

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
