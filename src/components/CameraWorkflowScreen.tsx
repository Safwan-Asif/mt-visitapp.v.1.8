import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Camera, ArrowLeft, Plus, CheckCircle2, AlertCircle, 
  ShieldCheck, Tag, Layers,
  Image as ImageIcon, Upload,
  Loader2, Check, Maximize2, Minimize2, ZoomIn, ZoomOut, X,
  ChevronDown, ChevronUp, AlertTriangle, RefreshCw
} from 'lucide-react';
import { 
  CategoryType, Outlet, CategoryAuditRecord, BoundingBox, 
  UserProfile, AisleKey, AisleSessionData, AisleStatus,
  DuplicateMatch, BayDuplicateReport
} from '../types';
import { 
  CATEGORY_IMAGES, DEFAULT_AI_COUNTS, SAMPLE_BOUNDING_BOXES, 
  BRAND_COLORS, CATEGORY_BRANDS 
} from '../constants';
import { 
  sendAuditToN8n, 
  N8nTransmissionResult, 
  canonicalizeBrand
} from '../services/n8nService';
import {
  autoSaveAuditToGoogleSheet,
  toDirectDriveImageUrl,
  toAlternativeDriveImageUrl
} from '../services/googleSheetsService';
import { getAuditCoordinates, GeoLocationResult } from '../services/geolocationService';
import {
  SeamInfo,
  buildSeam,
  estimateSeam,
  computeSeamExclusions,
  GHOST_GUIDE_FRAC
} from '../services/seamAlignment';
import { useTheme } from '../ThemeContext';
import { LiveLocationBadge } from './LiveLocationBadge';

/**
 * Formats a clear, scannable discrepancy log describing exact AI vs User modifications.
 * e.g. "F1: System said 12 but user changed to 14 (+2); PREM: System said 4 but user changed to 3 (-1)"
 */
export function formatDiscrepancyLog(
  original: Record<string, number> = {},
  modified: Record<string, number> = {}
): string {
  const allBrands = Array.from(new Set([...Object.keys(original), ...Object.keys(modified)]));
  const discrepancies: string[] = [];

  for (const b of allBrands) {
    const orig = original[b] ?? 0;
    const mod = modified[b] ?? 0;
    if (orig !== mod) {
      const diff = mod - orig;
      const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
      discrepancies.push(`${b}: System said ${orig} but user changed to ${mod} (${diffStr})`);
    }
  }

  if (discrepancies.length === 0) {
    return 'No manual overrides (AI counts accepted)';
  }
  return discrepancies.join('; ');
}

/**
 * Helper to slice the rightmost percentage strip (default 15%) of a captured shelf photo.
 * Used for live viewfinder "ghost" onion-skin alignment when shooting adjacent bays.
 */
export function extractRightOverlapStrip(
  imageUrl: string, 
  overlapPct: number = 0.15
): Promise<string> {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve('');
      return;
    }
    const img = new Image();
    if (!imageUrl.startsWith('data:') && !imageUrl.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        const nw = img.naturalWidth || 800;
        const nh = img.naturalHeight || 800;
        const pct = Math.max(0.08, Math.min(0.30, overlapPct || 0.15));
        const stripW = Math.max(10, Math.round(nw * pct));
        const startX = nw - stripW;

        const canvas = document.createElement('canvas');
        canvas.width = stripW;
        canvas.height = nh;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve('');
          return;
        }
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, startX, 0, stripW, nh, 0, 0, stripW, nh);
        resolve(canvas.toDataURL('image/png'));
      } catch (e) {
        console.warn('Ghost strip extraction note:', e);
        resolve('');
      }
    };
    img.onerror = () => resolve('');
    img.src = imageUrl;
  });
}

export interface NormalizedN8nAuditOutput {
  success: boolean;
  annotated_image?: string;
  replyText?: string;
  needs_review: boolean;
  total_facings: number;
  counts: Record<string, number>;
  boxes: any[];
  meta?: any;
  dimensions?: { width: number; height: number };
  /** True only when n8n reported the image size (not guessed from box extents). */
  dimensionsExplicit?: boolean;
  /** True when n8n already dropped the boxes left of the seam (seam-aware parse node). */
  seamApplied?: boolean;
}

/**
 * Normalizer for the n8n webhook response in CameraWorkflowScreen.
 * Extracts top-level fields: success, annotated_image, replyText, needs_review, total_facings, counts, and boxes.
 */
export function normalizeN8nAuditResponse(raw: any, category?: CategoryType): NormalizedN8nAuditOutput {
  let target = raw;
  if (typeof target === 'string') {
    try {
      target = JSON.parse(target);
    } catch {
      // not json
    }
  }

  if (Array.isArray(target) && target.length > 0) {
    target = target[0];
  }

  if (target && typeof target === 'object') {
    if (target.body !== undefined) {
      target = target.body;
      if (Array.isArray(target) && target.length > 0) target = target[0];
    }
    if (target && typeof target === 'object' && target.json !== undefined && target.counts === undefined && target.total_facings === undefined) {
      target = target.json;
      if (Array.isArray(target) && target.length > 0) target = target[0];
    }
  }

  const success = target?.success !== undefined ? Boolean(target.success) : true;

  let totalFacings: number = 0;
  if (typeof target?.total_facings === 'number') {
    totalFacings = target.total_facings;
  } else if (typeof target?.totalFacings === 'number') {
    totalFacings = target.totalFacings;
  } else if (target?.total_facings !== undefined && target?.total_facings !== null && !isNaN(Number(target.total_facings))) {
    totalFacings = Number(target.total_facings);
  } else if (target?.totalFacings !== undefined && target?.totalFacings !== null && !isNaN(Number(target.totalFacings))) {
    totalFacings = Number(target.totalFacings);
  }

  // A seam-aware n8n returns de-duplicated `counts` plus `counts_before_seam`. The app applies
  // the seam itself (so the rep can review and restore bottles), so it starts from the full counts.
  const seamApplied = Boolean(target?.seam_applied);
  const countsSource = seamApplied && target?.counts_before_seam && typeof target.counts_before_seam === 'object'
    ? target.counts_before_seam
    : target?.counts;

  // Parse stringified JSON counts if delivered as string
  let rawCounts = countsSource;
  if (typeof rawCounts === 'string') {
    try {
      rawCounts = JSON.parse(rawCounts);
    } catch {
      rawCounts = {};
    }
  }
  if (!rawCounts || typeof rawCounts !== 'object') {
    rawCounts = {};
  }

  const catKey = category || 'Edible Oil';
  const standardBrands = CATEGORY_BRANDS[catKey] || ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'];

  const counts: Record<string, number> = {};
  for (const b of standardBrands) {
    counts[b] = 0;
  }

  for (const [k, v] of Object.entries(rawCounts)) {
    const canonicalKey = canonicalizeBrand(k, catKey);
    const num = typeof v === 'number' ? v : Number(v);
    if (!isNaN(num)) {
      counts[canonicalKey] = (counts[canonicalKey] || 0) + num;
    }
  }

  for (const b of standardBrands) {
    if (counts[b] === undefined) {
      counts[b] = 0;
    }
  }

  if (seamApplied || (totalFacings === 0 && target?.total_facings === undefined && target?.totalFacings === undefined)) {
    totalFacings = Object.values(counts).reduce((acc, v) => acc + (v ?? 0), 0);
  }

  let annotatedImage: string | undefined = 
    target?.drive_url ||
    target?.driveUrl ||
    target?.drive_photo_url ||
    target?.drivePhotoUrl ||
    target?.annotated_image || 
    target?.annotatedImage || 
    target?.annotatedImageUrl || 
    target?.annotatedPhotoUrl ||
    target?.image_url ||
    target?.photo_url;

  if (!annotatedImage && typeof target?.binary?.data === 'string') {
    const mime = target.binary.mimeType || 'image/jpeg';
    annotatedImage = `data:${mime};base64,${target.binary.data}`;
  }

  if (annotatedImage && !annotatedImage.startsWith('http://') && !annotatedImage.startsWith('https://') && !annotatedImage.startsWith('blob:') && !annotatedImage.startsWith('data:')) {
    const mime = annotatedImage.startsWith('iVBORw') ? 'image/png' : 'image/jpeg';
    annotatedImage = `data:${mime};base64,${annotatedImage}`;
  }

  const replyText = typeof target?.replyText === 'string' ? target.replyText : undefined;
  const needsReview = Boolean(target?.needs_review ?? target?.needsReview ?? false);
  const boxes = Array.isArray(target?.boxes) ? target.boxes : [];

  // Extract dimensions from imagemediametadata, image, or meta returned by n8n
  let width = target?.imagemediametadata?.width || target?.imageMediaMetadata?.width || target?.image?.width || target?.meta?.width || target?.dimensions?.width;
  let height = target?.imagemediametadata?.height || target?.imageMediaMetadata?.height || target?.image?.height || target?.meta?.height || target?.dimensions?.height;

  // If not found at top level, check raw input wrappers
  if ((!width || !height) && raw && typeof raw === 'object') {
    const rawObj = Array.isArray(raw) ? raw[0] : raw;
    width = width || rawObj?.imagemediametadata?.width || rawObj?.imageMediaMetadata?.width || rawObj?.image?.width || rawObj?.meta?.width;
    height = height || rawObj?.imagemediametadata?.height || rawObj?.imageMediaMetadata?.height || rawObj?.image?.height || rawObj?.meta?.height;
  }

  const dimensionsExplicit = Boolean(width && height);

  // Fallback: deduce from max bounding box extent if boxes exist
  if ((!width || !height) && boxes.length > 0) {
    const maxBoxX = Math.max(...boxes.map((b: any) => (b.x || 0) + (b.width || 0)));
    const maxBoxY = Math.max(...boxes.map((b: any) => (b.y || 0) + (b.height || 0)));
    if (maxBoxX > 0 && maxBoxY > 0) {
      width = width || (maxBoxX > 900 ? 1920 : (maxBoxX > 700 ? (maxBoxX > 750 ? 960 : 720) : 800));
      height = height || (maxBoxY > 1100 ? 1280 : 1080);
    }
  }

  return {
    success,
    total_facings: totalFacings,
    counts,
    annotated_image: annotatedImage,
    needs_review: needsReview,
    replyText,
    boxes,
    meta: target?.meta,
    dimensions: width && height ? { width: Number(width), height: Number(height) } : undefined,
    dimensionsExplicit,
    seamApplied
  };
}

/**
 * Flexible AisleSession model holding async per-bay upload/analysis state,
 * rawBoxes, naturalDimensions, rawCounts, editable counts, and status for later deduplication.
 */
export interface AisleSession {
  key: string;
  label: string;
  status: AisleStatus;
  capturedFile: File | null;
  capturedPhotoUrl: string | null;
  capturedFileName: string | null;
  naturalDimensions: { width: number; height: number };
  annotatedPhotoUrl: string | null;
  rawCounts: Record<string, number>;
  counts: Record<string, number>;
  originalAiCounts: Record<string, number>;
  totalFacings: number | null;
  boxes: BoundingBox[];
  rawBoxes: any[];
  removedDuplicates?: DuplicateMatch[];
  /** Seam with the previous (left) bay — measured on capture, confirmed by the rep before upload. */
  seam?: SeamInfo | null;
  /** True when the photo was taken with the previous-bay guide visible in the viewfinder. */
  shotWithGuide?: boolean;
  /** AI counts after the overlap with neighbouring bays is removed (baseline for the discrepancy log). */
  seamAdjustedCounts?: Record<string, number>;
  n8nStatus: any;
  analysisStartTime: number | null;
  analysisDurationSeconds: number;
  errorMessage?: string;
}

// ============================================================================
// CROSS-BAY OVERLAP DE-DUPLICATION (measured seams — see services/seamAlignment.ts)
// ============================================================================

/** Box ids from n8n ("box-1", "box-2", …) repeat in every bay, so ids are namespaced per bay. */
export const bayBoxId = (bayKey: string, box: any, index: number) =>
  `${bayKey}:${String(box?.id ?? `idx-${index}`)}`;

/** Frame width the bay's boxes are expressed in. */
const bayFrameWidth = (bay: AisleSession) => bay.naturalDimensions?.width || 800;

/**
 * Builds per-bay reports of boxes that belong to the neighbouring bay, using the
 * dividing line in the middle of each measured overlap. Bays must be in
 * left-to-right order. A bay only gets a left seam if it was shot right after its
 * left neighbour (the seam's leftBayKey must match).
 */
export function buildSeamDuplicateReports(baysInOrder: AisleSession[]): Record<string, BayDuplicateReport> {
  const reports: Record<string, BayDuplicateReport> = {};
  baysInOrder.forEach((bay) => {
    reports[bay.key] = { bayKey: bay.key, bayLabel: bay.label, hasDuplicates: false, duplicates: [] };
  });

  const seamBays = baysInOrder.map((bay) => ({
    key: bay.key,
    label: bay.label,
    boxes: (bay.rawBoxes && bay.rawBoxes.length > 0 ? bay.rawBoxes : bay.boxes || []).map((b: any, i: number) => ({
      ...b,
      __id: bayBoxId(bay.key, b, i)
    })),
    frameWidth: bayFrameWidth(bay),
    seam: bay.seam || null
  }));

  for (const ex of computeSeamExclusions(seamBays)) {
    const box = ex.box;
    const report = reports[ex.bayKey];
    report.duplicates.push({
      boxId: box.__id,
      brand: ex.brand,
      x: typeof box.x === 'number' ? box.x : 0,
      y: typeof box.y === 'number' ? box.y : 0,
      width: typeof box.width === 'number' ? box.width : 0,
      height: typeof box.height === 'number' ? box.height : 0,
      confidence: box.confidence,
      matchedWithBoxId: '',
      leftBayKey: ex.side === 'left-edge' ? ex.otherBayKey : ex.bayKey,
      rightBayKey: ex.side === 'left-edge' ? ex.bayKey : ex.otherBayKey
    });
    report.hasDuplicates = true;
  }
  return reports;
}

/**
 * Visible slice of each bay in the joined panorama (fractions of photo width):
 * each bay is shown from its left count line to its right count line, so the
 * panorama has no repeated shelf area.
 */
export function computeBayCrops(baysInOrder: AisleSession[]): Record<string, { start: number; end: number }> {
  const crops: Record<string, { start: number; end: number }> = {};
  baysInOrder.forEach((bay, i) => {
    const prev = baysInOrder[i - 1];
    const next = baysInOrder[i + 1];
    const leftSeam = prev && bay.seam && bay.seam.leftBayKey === prev.key ? bay.seam : null;
    const rightSeam = next && next.seam && next.seam.leftBayKey === bay.key ? next.seam : null;
    const start = leftSeam ? leftSeam.cutFracRight : 0;
    const end = rightSeam ? rightSeam.cutFracLeft : 1;
    crops[bay.key] = end - start > 0.05 ? { start, end } : { start: 0, end: 1 };
  });
  return crops;
}

/** Rectangle of an image of size iw×ih fitted (object-contain) inside cw×ch. */
function fitRect(cw: number, ch: number, iw: number, ih: number) {
  const safeCw = cw > 0 ? cw : (typeof window !== 'undefined' ? window.innerWidth : 360);
  const safeCh = ch > 0 ? ch : (typeof window !== 'undefined' ? window.innerHeight : 480);
  const safeIw = iw > 0 ? iw : 3;
  const safeIh = ih > 0 ? ih : 4;
  const scale = Math.min(safeCw / safeIw, safeCh / safeIh);
  const width = safeIw * scale;
  const height = safeIh * scale;
  return { left: (safeCw - width) / 2, top: (safeCh - height) / 2, width, height };
}

/**
 * 3. Stitches captured bay photos left-to-right into a single panoramic image on an offscreen canvas.
 * - Width: sum of each bay's width scaled to a common height factor.
 * - Height: common height factor preserving aspect ratios.
 * - Draws dashed vertical seam markers and bay labels ("Bay 1", "Bay 2", ...).
 * - Uses annotatedPhotoUrl where available and capturedPhotoUrl where not, adding a "RAW" badge if unannotated.
 */
export async function stitchBayPanorama(
  bays: AisleSession[],
  forceRaw: boolean = false,
  crops: Record<string, { start: number; end: number }> = {}
): Promise<string> {
  const validBays = bays.filter(
    (b) => Boolean(b.capturedPhotoUrl || b.annotatedPhotoUrl)
  );

  if (validBays.length === 0) {
    throw new Error('No captured bays to stitch');
  }

  // If only one bay is captured, skip stitching and show that bay's annotated image directly
  if (validBays.length === 1) {
    const single = validBays[0];
    const src = forceRaw 
      ? (single.capturedPhotoUrl || single.annotatedPhotoUrl || '') 
      : (single.annotatedPhotoUrl || single.capturedPhotoUrl || '');
    return src;
  }

  try {
    // Load all bay images in parallel
    const bayImageMeta = await Promise.all(
      validBays.map(async (bay) => {
        const isAnnotatedAvailable = Boolean(bay.annotatedPhotoUrl);
        const isUsingAnnotated = !forceRaw && isAnnotatedAvailable;
        const rawTargetUrl = isUsingAnnotated ? bay.annotatedPhotoUrl! : bay.capturedPhotoUrl!;
        const targetUrl = toDirectDriveImageUrl(rawTargetUrl);
        
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          if (!targetUrl.startsWith('data:') && !targetUrl.startsWith('blob:')) {
            image.crossOrigin = 'anonymous';
          }
          image.onload = () => resolve(image);
          image.onerror = () => {
            const fallbackImg = new Image();
            fallbackImg.onload = () => resolve(fallbackImg);
            fallbackImg.onerror = (err) => reject(err);
            fallbackImg.src = targetUrl;
          };
          image.src = targetUrl;
        });

        const width = img.naturalWidth || bay.naturalDimensions?.width || 800;
        const height = img.naturalHeight || bay.naturalDimensions?.height || 800;

        return {
          bay,
          img,
          width,
          height,
          isRaw: !isUsingAnnotated
        };
      })
    );

    // Tallest bay's naturalDimensions.height
    const maxHeight = Math.max(...bayImageMeta.map((m) => m.height));
    const targetHeight = Math.min(1200, Math.max(600, maxHeight));

    // Scale both width and height by the same factor (targetHeight / meta.height) to preserve aspect ratio
    // Each bay is drawn only between its count lines (crop), so overlapping shelf area appears once.
    const scaledSegments = bayImageMeta.map((meta) => {
      const crop = crops[meta.bay.key] || { start: 0, end: 1 };
      const scale = targetHeight / (meta.height || targetHeight);
      const scaledWidth = Math.max(1, Math.round((meta.width || 800) * (crop.end - crop.start) * scale));
      return {
        ...meta,
        crop,
        scaledWidth,
        scaledHeight: targetHeight
      };
    });

    const totalWidth = scaledSegments.reduce((sum, seg) => sum + seg.scaledWidth, 0);
    const totalHeight = targetHeight;

    // Render on offscreen HTMLCanvasElement
    const canvas = document.createElement('canvas');
    canvas.width = totalWidth;
    canvas.height = totalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // Fill dark background
    ctx.fillStyle = '#0B120E';
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Draw each bay segment left-to-right in aisle order
    let currentX = 0;
    scaledSegments.forEach((seg, index) => {
      const srcX = seg.crop.start * seg.width;
      const srcW = (seg.crop.end - seg.crop.start) * seg.width;
      ctx.drawImage(seg.img, srcX, 0, srcW, seg.height, currentX, 0, seg.scaledWidth, seg.scaledHeight);

      // Draw thin vertical dashed dividers at each seam
      if (index > 0) {
        ctx.save();
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)'; // emerald green
        ctx.beginPath();
        ctx.moveTo(currentX, 0);
        ctx.lineTo(currentX, totalHeight);
        ctx.stroke();
        ctx.restore();
      }

      // Draw small "Bay N" label above each segment
      const badgePaddingX = 10;
      const labelText = seg.bay.label;

      ctx.save();
      ctx.font = 'bold 16px "Plus Jakarta Sans", system-ui, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const badgeWidth = textWidth + badgePaddingX * 2;
      const badgeHeight = 28;
      const badgeX = currentX + 12;
      const badgeY = 12;

      // Badge background
      ctx.fillStyle = 'rgba(11, 18, 14, 0.88)';
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 8);
      } else {
        ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight);
      }
      ctx.fill();
      ctx.stroke();

      // Badge text
      ctx.fillStyle = '#F0FDF4';
      ctx.textBaseline = 'middle';
      ctx.fillText(labelText, badgeX + badgePaddingX, badgeY + badgeHeight / 2);

      // If unannotated, draw small "RAW" pill next to bay label
      if (seg.isRaw) {
        const rawText = 'RAW';
        ctx.font = 'bold 12px "Plus Jakarta Sans", system-ui, sans-serif';
        const rawWidth = ctx.measureText(rawText).width + 12;
        const rawX = badgeX + badgeWidth + 6;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(rawX, badgeY, rawWidth, badgeHeight, 8);
        } else {
          ctx.rect(rawX, badgeY, rawWidth, badgeHeight);
        }
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(rawText, rawX + 6, badgeY + badgeHeight / 2);
      }

      ctx.restore();

      currentX += seg.scaledWidth;
    });

    return canvas.toDataURL('image/jpeg', 0.88);
  } catch (err) {
    console.warn('Panorama canvas build failed, falling back to first bay:', err);
    const primary = validBays[0];
    return primary.annotatedPhotoUrl || primary.capturedPhotoUrl || '';
  }
}

/**
 * Builds initial bay sessions dynamically:
 * Starts with existing bays from previous audit, or starts with just ONE bay (Bay 1).
 */
function buildInitialAisleSessions(
  existingAudit?: CategoryAuditRecord
): Record<string, AisleSession> {
  const existingAisles = existingAudit?.aisles;

  if (existingAisles && Object.keys(existingAisles).length > 0) {
    const sessions: Record<string, AisleSession> = {};
    Object.entries(existingAisles).forEach(([k, existing], idx) => {
      if (!existing) return;
      sessions[k] = {
        key: k,
        label: existing.label || `Bay ${idx + 1}`,
        status: existing.status || 'done',
        capturedFile: null,
        capturedPhotoUrl: existing.capturedPhotoUrl || null,
        capturedFileName: existing.capturedFileName || null,
        naturalDimensions: existing.naturalDimensions || { width: 800, height: 800 },
        annotatedPhotoUrl: existing.annotatedPhotoUrl || null,
        rawCounts: existing.rawCounts || existing.counts || {},
        counts: existing.counts || {},
        originalAiCounts: existing.originalAiCounts || existing.counts || {},
        totalFacings: existing.totalFacings ?? null,
        boxes: existing.boundingBoxes || [],
        rawBoxes: existing.rawBoxes || [],
        n8nStatus: null,
        analysisStartTime: null,
        analysisDurationSeconds: 0
      };
    });
    return sessions;
  }

  // Default: start with just ONE bay (Bay 1)
  const hasInitialPhoto = Boolean(existingAudit?.photoUrl || existingAudit?.annotatedPhotoUrl);
  return {
    bay_1: {
      key: 'bay_1',
      label: 'Bay 1',
      status: hasInitialPhoto ? 'done' : 'idle',
      capturedFile: null,
      capturedPhotoUrl: existingAudit?.photoUrl || null,
      capturedFileName: hasInitialPhoto ? 'bay_1.jpg' : null,
      naturalDimensions: { width: 800, height: 800 },
      annotatedPhotoUrl: existingAudit?.annotatedPhotoUrl || null,
      rawCounts: existingAudit?.aiCounts || {},
      counts: existingAudit?.counts || existingAudit?.aiCounts || {},
      originalAiCounts: existingAudit?.originalAiCounts || existingAudit?.aiCounts || {},
      totalFacings: existingAudit?.totalFacings ?? null,
      boxes: [],
      rawBoxes: [],
      n8nStatus: null,
      analysisStartTime: null,
      analysisDurationSeconds: 0
    }
  };
}

interface CameraWorkflowScreenProps {
  outlet: Outlet;
  category: CategoryType;
  existingAudit?: CategoryAuditRecord;
  onSaveAudit: (record: CategoryAuditRecord) => void;
  onBack: () => void;
  userProfile?: UserProfile;
}

export const CameraWorkflowScreen: React.FC<CameraWorkflowScreenProps> = ({
  outlet,
  category,
  existingAudit,
  onSaveAudit,
  onBack,
  userProfile
}) => {
  const { isDark } = useTheme();

  // 1. Three-step state machine: CAPTURE -> POSM -> RESULTS
  const [step, setStep] = useState<'CAPTURE' | 'POSM' | 'RESULTS'>(
    existingAudit ? 'RESULTS' : 'CAPTURE'
  );

  // Hidden native file inputs for hardware camera & photo gallery fallback
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Bay Sessions (can be 1, 2, or many bays)
  const [aisleSessions, setAisleSessions] = useState<Record<string, AisleSession>>(() =>
    buildInitialAisleSessions(existingAudit)
  );

  // Active Bay currently targeted in the capture viewfinder
  const [currentAisle, setCurrentAisle] = useState<string>(() => {
    const initialKeys = Object.keys(buildInitialAisleSessions(existingAudit));
    return initialKeys[0] || 'bay_1';
  });

  // In RESULTS step: tabs are 'ALL' (default) | bay keys ('bay_1', 'bay_2', ...)
  const [resultsAisleView, setResultsAisleView] = useState<string | 'ALL'>('ALL');

  // Post-capture inline prompt state: when true, shows "Scan next bay" & "Done shooting"
  const [showPostCapturePrompt, setShowPostCapturePrompt] = useState<boolean>(false);
  const [lastCapturedAisle, setLastCapturedAisle] = useState<string>('bay_1');

  // POSM Questionnaire state (visibility driven solely by step === 'POSM')
  const [priceTagOk, setPriceTagOk] = useState<boolean>(existingAudit?.priceTagOk ?? true);
  const [posmShelfSticker, setPosmShelfSticker] = useState<boolean>(
    existingAudit?.posmShelfSticker ?? true
  );
  const [posmWobblers, setPosmWobblers] = useState<boolean>(existingAudit?.posmWobblers ?? false);

  // WebRTC Live Camera & Sensors state (Back Facing Camera Only)
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStreamActive, setCameraStreamActive] = useState<boolean>(false);
  const [cameraErrorNotice, setCameraErrorNotice] = useState<string | null>(null);
  const [isLevel, setIsLevel] = useState<boolean>(false);
  const [sensorsAvailable, setSensorsAvailable] = useState<boolean>(false);

  // Device motion stability tracking for auto-capture
  const levelHoldStartTimeRef = useRef<number | null>(null);
  const autoCaptureTriggeredRef = useRef<boolean>(false);
  const lastMotionMagnitudeRef = useRef<number>(0);

  // Quiet 5-second interval tick for "Analysing... (Ns)"
  const [, setQuietTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setQuietTick((t) => t + 1);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Visual inspection state in RESULTS
  const [showRawPhotoComparison, setShowRawPhotoComparison] = useState<boolean>(false);
  const [imgErrorLevel, setImgErrorLevel] = useState<number>(0);

  // 3. Panorama on the ALL tab state
  const [stitchedPanoramaUrl, setStitchedPanoramaUrl] = useState<string | null>(null);
  const [isStitchingPanorama, setIsStitchingPanorama] = useState<boolean>(false);

  // Full screen zoom / enlarge lightbox state
  const [isFullScreenOpen, setIsFullScreenOpen] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);

  // Close full screen viewer on Escape key
  useEffect(() => {
    if (!isFullScreenOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullScreenOpen(false);
        setZoomScale(1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreenOpen]);

  // Quick Add Brand modal state
  const [isAddBrandOpen, setIsAddBrandOpen] = useState<boolean>(false);
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [newBrandCount, setNewBrandCount] = useState<number>(2);

  // Upload-on-confirm: a captured photo waits here until the rep taps Upload.
  // For Bay 2+, the overlap with the previous bay is measured and shown for confirmation.
  const [pendingCapture, setPendingCapture] = useState<{
    bayKey: string;
    file: File | null;
    dataUrl: string;
    width: number;
    height: number;
    shotWithGuide: boolean;
    isRetake: boolean;
  } | null>(null);
  const [pendingSeam, setPendingSeam] = useState<SeamInfo | null>(null);
  const [isMeasuringSeam, setIsMeasuringSeam] = useState<boolean>(false);
  const [showAlignmentCheck, setShowAlignmentCheck] = useState<boolean>(false);
  const previewFrameRef = useRef<HTMLDivElement | null>(null);
  const pendingDataUrlRef = useRef<string | null>(null);
  const isDraggingSeamRef = useRef<boolean>(false);

  // Viewfinder geometry: the live video is shown uncropped (object-contain) so the
  // preview matches the saved photo exactly; the guide is positioned on that frame.
  const viewfinderRef = useRef<HTMLDivElement | null>(null);
  const [viewfinderSize, setViewfinderSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [videoDims, setVideoDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  // Blocks level-triggered auto-capture while the rep is lining up the guide or reviewing a photo.
  const captureBlockedRef = useRef<boolean>(false);
  useEffect(() => {
    if (step !== 'CAPTURE') return;
    const el = viewfinderRef.current;
    if (!el) return;
    const update = () => setViewfinderSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [step]);

  // Latest auto-capture function (the sensor listener is bound once per step, so it must not hold a stale closure).
  const autoCaptureFnRef = useRef<() => void>(() => {});

  // Cross-Bay Duplicate Detection States
  const [duplicateReports, setDuplicateReports] = useState<Record<string, BayDuplicateReport>>({});
  const [duplicateReviewStatus, setDuplicateReviewStatus] = useState<'pending' | 'removed' | 'kept'>('pending');
  const [isDuplicatePanelExpanded, setIsDuplicatePanelExpanded] = useState<boolean>(true);
  const [removedDuplicateBoxIds, setRemovedDuplicateBoxIds] = useState<Set<string>>(new Set());

  // Image letterbox-free bounding rect tracking in Shelf Preview
  const shelfContainerRef = useRef<HTMLDivElement | null>(null);
  const shelfImgRef = useRef<HTMLImageElement | null>(null);
  const [displayedImgRect, setDisplayedImgRect] = useState<{ left: number; top: number; width: number; height: number } | null>(null);

  const updateDisplayedImgRect = useCallback(() => {
    if (!shelfContainerRef.current || !shelfImgRef.current) return;
    const container = shelfContainerRef.current;
    const img = shelfImgRef.current;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const nw = img.naturalWidth || 800;
    const nh = img.naturalHeight || 800;

    if (!cw || !ch || !nw || !nh) return;

    const cRatio = cw / ch;
    const iRatio = nw / nh;

    let renderedW = cw;
    let renderedH = ch;
    let offsetX = 0;
    let offsetY = 0;

    if (iRatio > cRatio) {
      // Image is wider than container: letterboxed top & bottom
      renderedW = cw;
      renderedH = cw / iRatio;
      offsetY = (ch - renderedH) / 2;
    } else {
      // Image is taller than container: letterboxed left & right
      renderedH = ch;
      renderedW = ch * iRatio;
      offsetX = (cw - renderedW) / 2;
    }

    setDisplayedImgRect({
      left: offsetX,
      top: offsetY,
      width: renderedW,
      height: renderedH
    });
  }, []);

  // Update image rect on window resize
  useEffect(() => {
    window.addEventListener('resize', updateDisplayedImgRect);
    return () => window.removeEventListener('resize', updateDisplayedImgRect);
  }, [updateDisplayedImgRect]);

  // Timing & Geolocation
  const [auditStartTime] = useState<number>(Date.now());
  const [gpsCoords, setGpsCoords] = useState<GeoLocationResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState<boolean>(false);

  // Debug flag for sample shelf link (only visible with ?debug=1 or #debug)
  const isDebugMode = typeof window !== 'undefined' && 
    (new URLSearchParams(window.location.search).has('debug') || window.location.hash.includes('debug'));

  // Fallback shelf photo
  const fallbackShelfPhoto = CATEGORY_IMAGES[category];

  useEffect(() => {
    getAuditCoordinates({ latitude: outlet.latitude, longitude: outlet.longitude })
      .then((coords) => setGpsCoords(coords))
      .catch((err) => console.warn('Geolocation capture note:', err));
  }, [outlet]);

  // Start WebRTC camera stream targeting Back Facing Camera (Environment) with comprehensive error logging & constraint validation
  const startCameraStream = useCallback(async () => {
    console.group('📷 WebRTC Camera Initialization Debug Log');

    if (!navigator.mediaDevices?.getUserMedia) {
      const errorMsg = 'WebRTC camera API (navigator.mediaDevices.getUserMedia) is not supported in this browser environment or iframe context.';
      console.error('❌ Camera Init Error:', errorMsg);
      console.groupEnd();
      setCameraStreamActive(false);
      setCameraErrorNotice(errorMsg);
      return;
    }

    // Check supported constraints by browser
    const supportedConstraints = navigator.mediaDevices.getSupportedConstraints?.() || {};
    console.info('ℹ️ Browser Supported Media Constraints:', supportedConstraints);

    // Check camera permission status if query API is available
    if (typeof navigator.permissions?.query === 'function') {
      try {
        const permStatus = await navigator.permissions.query({ name: 'camera' as any });
        console.info(`ℹ️ Camera Permission State: [${permStatus.state}]`);
      } catch (pErr) {
        console.warn('Note: Permissions query API not supported for camera on this browser:', pErr);
      }
    }

    // Stop existing stream tracks first
    if (videoRef.current && videoRef.current.srcObject) {
      const existing = videoRef.current.srcObject as MediaStream;
      existing.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    const constraintTiers: MediaStreamConstraints[] = [];

    // Intelligent device scoring to pinpoint 1x main back camera (strictly avoiding 0.5x ultra-wide lenses)
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.info('ℹ️ Available Input Devices:', devices);
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      console.info(`ℹ️ Found ${videoInputs.length} video input device(s):`, videoInputs);

      // Score devices: prioritize 1x standard/main back camera and heavily penalize 0.5x ultra-wide, telephoto & front cameras
      const scoredDevices = videoInputs.map((d) => {
        const label = (d.label || '').toLowerCase();
        let score = 0;

        // Front / selfie cameras
        if (label.includes('front') || label.includes('selfie') || label.includes('user') || label.includes('truedepth')) {
          score -= 1000;
        }

        // Ultra-wide (0.5x) cameras: heavily penalized so 0.5x zoom is NEVER auto-selected
        if (label.includes('ultra') || label.includes('0.5') || (label.includes('wide-angle') && label.includes('ultra'))) {
          score -= 500;
        }

        // Telephoto (2x, 3x, 5x, 10x) cameras: penalized
        if (label.includes('tele') || label.includes('zoom') || label.includes('periscope')) {
          score -= 300;
        }

        // Macro or virtual cameras: penalized
        if (label.includes('macro') || label.includes('virtual')) {
          score -= 200;
        }

        // Primary 1x main camera bonuses:
        // iOS standard main camera is labeled "Back Camera" or "Back Dual Wide Camera" (without "ultra")
        if (label === 'back camera' || label === 'rear camera') {
          score += 180;
        }
        if (label.includes('main') || label.includes('primary') || label.includes('standard') || label.includes('camera 1') || label.includes('camera2 1')) {
          score += 150;
        }
        if (label.includes('wide') && !label.includes('ultra')) {
          score += 100;
        }
        if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
          score += 80;
        }

        return { device: d, score, label };
      });

      scoredDevices.sort((a, b) => b.score - a.score);
      console.info('📊 Ranked camera devices (top is preferred 1x lens):', scoredDevices);

      const bestBackDevice = scoredDevices[0] && scoredDevices[0].score > -100 ? scoredDevices[0].device : null;

      if (bestBackDevice && bestBackDevice.deviceId) {
        console.info('✅ Pinpointed 1x main rear camera:', bestBackDevice.label, bestBackDevice.deviceId);
        constraintTiers.push(
          {
            video: {
              deviceId: { ideal: bestBackDevice.deviceId },
              width: { ideal: 3840 },
              height: { ideal: 2160 }
            },
            audio: false
          },
          {
            video: {
              deviceId: { ideal: bestBackDevice.deviceId },
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            },
            audio: false
          },
          {
            video: {
              deviceId: { ideal: bestBackDevice.deviceId }
            },
            audio: false
          }
        );
      }
    } catch (enumErr) {
      console.warn('Device enumeration note:', enumErr);
    }

    // High-clarity 1x environment camera fallbacks (requests full HD / 4K resolution)
    if (supportedConstraints.facingMode) {
      constraintTiers.push(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 3840 },
            height: { ideal: 2160 }
          },
          audio: false
        },
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          },
          audio: false
        },
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false }
      );
    } else {
      console.warn('facingMode constraint is not listed in supportedConstraints by this browser.');
    }

    // Basic fallback constraint
    constraintTiers.push({ video: true, audio: false });

    let activeStream: MediaStream | null = null;
    let lastError: any = null;

    for (let i = 0; i < constraintTiers.length; i++) {
      const constraints = constraintTiers[i];
      console.info(`Attempting constraint tier #${i + 1}:`, constraints);
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream) {
          console.info(`✅ Successfully obtained MediaStream on tier #${i + 1}:`, activeStream);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`⚠️ Constraint tier #${i + 1} failed:`, {
          name: err?.name,
          message: err?.message,
          constraint: err?.constraint,
          err
        });
      }
    }

    if (activeStream && videoRef.current) {
      videoRef.current.srcObject = activeStream;
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('muted', 'true');

      // Hardware Track Optimization: Enforce 1.0x optical zoom and continuous autofocus for clear shelf details
      try {
        const track = activeStream.getVideoTracks()[0];
        if (track) {
          const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
          const advancedSettings: any = {};

          // Enforce 1.0x standard zoom (bypass 0.5x ultra-wide default on multi-camera devices)
          if (capabilities.zoom) {
            const minZ = capabilities.zoom.min ?? 1;
            const maxZ = capabilities.zoom.max ?? 1;
            const targetZ = Math.min(Math.max(1.0, minZ), maxZ);
            advancedSettings.zoom = targetZ;
            console.info(`🔍 Enforcing 1x zoom on camera track: ${targetZ} (device range: ${minZ}-${maxZ})`);
          }

          // Enforce continuous autofocus for clear, crisp shelf details
          if (capabilities.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
            advancedSettings.focusMode = 'continuous';
          }

          // Enforce continuous auto exposure
          if (capabilities.exposureMode && Array.isArray(capabilities.exposureMode) && capabilities.exposureMode.includes('continuous')) {
            advancedSettings.exposureMode = 'continuous';
          }

          if (Object.keys(advancedSettings).length > 0) {
            await track.applyConstraints({ advanced: [advancedSettings] });
            console.info('✅ Applied optimal camera hardware constraints (1x zoom & continuous focus):', advancedSettings);
          }

          // If the initially assigned track happens to be an ultra-wide lens, re-enumerate now that labels are unlocked and switch to 1x main
          const trackLabel = (track.label || '').toLowerCase();
          if (trackLabel.includes('ultra') || trackLabel.includes('0.5')) {
            console.warn('Initial camera track selected 0.5x ultra-wide lens. Switching to 1x main camera...');
            try {
              const freshDevices = await navigator.mediaDevices.enumerateDevices();
              const freshInputs = freshDevices.filter((d) => d.kind === 'videoinput');
              const main1xDevice = freshInputs.find((d) => {
                const l = (d.label || '').toLowerCase();
                return !l.includes('front') && !l.includes('ultra') && !l.includes('0.5') && !l.includes('tele') && (l.includes('back') || l.includes('main') || l.includes('wide'));
              });
              if (main1xDevice && main1xDevice.deviceId && main1xDevice.deviceId !== track.getSettings?.().deviceId) {
                console.info('Switching from 0.5x ultra-wide to 1x main camera:', main1xDevice.label);
                const betterStream = await navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: { exact: main1xDevice.deviceId },
                    width: { ideal: 3840, min: 1920 },
                    height: { ideal: 2160, min: 1080 }
                  },
                  audio: false
                });
                track.stop();
                activeStream = betterStream;
                videoRef.current.srcObject = betterStream;
              }
            } catch (switchErr) {
              console.warn('Lens switch note:', switchErr);
            }
          }
        }
      } catch (optErr) {
        console.warn('Track hardware optimization note:', optErr);
      }

      try {
        await videoRef.current.play();
        console.info('▶️ Video stream playing successfully at 1x zoom');
      } catch (playErr) {
        console.warn('Mobile video play deferred:', playErr);
      }
      setCameraStreamActive(true);
      setCameraErrorNotice(null);
      console.groupEnd();
    } else {
      console.warn('Live WebRTC camera stream note:', lastError?.message || lastError);
      console.groupEnd();
      setCameraStreamActive(false);

      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        setCameraErrorNotice('Camera access denied by browser or device permission policy. Tap below to re-request permission or allow camera in browser site settings.');
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError' || lastError?.message?.includes('not found')) {
        setCameraErrorNotice('No camera hardware detected on device. You can snap using the native camera app or upload from gallery.');
      } else if (lastError?.name === 'NotReadableError' || lastError?.name === 'TrackStartError') {
        setCameraErrorNotice('Camera is currently in use by another application.');
      } else if (lastError?.name === 'OverconstrainedError') {
        setCameraErrorNotice(`Camera constraints unsupported (${lastError?.constraint || 'resolution'}).`);
      } else {
        setCameraErrorNotice(lastError?.message || 'Live camera stream initialization failed. Tap below to re-try or snap photo.');
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 'CAPTURE') {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraStreamActive(false);
      return;
    }

    startCameraStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraStreamActive(false);
    };
  }, [step, currentAisle, startCameraStream]);

  // Motion & Orientation sensors for Level line & Auto-Capture
  useEffect(() => {
    if (step !== 'CAPTURE') return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null) return;
      setSensorsAvailable(true);

      // Roll angle in degrees (±3° level tolerance)
      const roll = e.gamma;
      const level = Math.abs(roll) <= 3.0;
      setIsLevel(level);

      const now = Date.now();
      const isMotionLow = lastMotionMagnitudeRef.current < 1.5;

      if (level && isMotionLow) {
        if (!levelHoldStartTimeRef.current) {
          levelHoldStartTimeRef.current = now;
        } else if (now - levelHoldStartTimeRef.current >= 500 && !autoCaptureTriggeredRef.current && !captureBlockedRef.current) {
          autoCaptureTriggeredRef.current = true;
          autoCaptureFnRef.current();
        }
      } else {
        levelHoldStartTimeRef.current = null;
        autoCaptureTriggeredRef.current = false;
      }
    };

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.acceleration || e.accelerationIncludingGravity;
      if (!acc) return;
      const mag = Math.sqrt(
        (acc.x || 0) ** 2 + (acc.y || 0) ** 2 + ((acc.z || 0) - 9.8) ** 2
      );
      lastMotionMagnitudeRef.current = mag;
    };

    window.addEventListener('deviceorientation', handleOrientation, true);
    window.addEventListener('devicemotion', handleMotion, true);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
    };
  }, [step]);

  // Retake bay escape hatch tracking
  const [retakeBayKey, setRetakeBayKey] = useState<string | null>(null);

  // Dynamic bay lists
  const bayKeys = useMemo(() => Object.keys(aisleSessions), [aisleSessions]);

  // Captured bays list (bays with photos)
  const capturedAisles = useMemo(() => {
    return bayKeys.filter((k) =>
      Boolean(aisleSessions[k]?.capturedPhotoUrl || aisleSessions[k]?.annotatedPhotoUrl)
    );
  }, [bayKeys, aisleSessions]);

  // Completed bays list (status === 'done')
  const completedAisles = useMemo(() => {
    return bayKeys.filter((k) => aisleSessions[k]?.status === 'done');
  }, [bayKeys, aisleSessions]);

  // In-flight bays list (status === 'analysing' or 'uploading')
  const inFlightAisles = useMemo(() => {
    return bayKeys.filter((k) => 
      aisleSessions[k]?.status === 'analysing' || aisleSessions[k]?.status === 'uploading'
    );
  }, [bayKeys, aisleSessions]);

  // Errored bays list (status === 'error')
  const erroredAisles = useMemo(() => {
    return bayKeys.filter((k) => aisleSessions[k]?.status === 'error');
  }, [bayKeys, aisleSessions]);

  // All captured bays must have status === 'done' to allow POSM submit
  const allCapturedDone = useMemo(() => {
    if (capturedAisles.length === 0) return false;
    return capturedAisles.every((k) => aisleSessions[k]?.status === 'done');
  }, [capturedAisles, aisleSessions]);

  /** Nearest earlier bay (in shooting order) that has a photo — the left neighbour for the seam. */
  const previousCapturedBayKey = useCallback((bayKey: string): string | null => {
    const idx = bayKeys.indexOf(bayKey);
    for (let i = idx - 1; i >= 0; i--) {
      if (aisleSessions[bayKeys[i]]?.capturedPhotoUrl) return bayKeys[i];
    }
    return null;
  }, [bayKeys, aisleSessions]);

  const nextCapturedBayKey = useCallback((bayKey: string): string | null => {
    const idx = bayKeys.indexOf(bayKey);
    if (idx < 0) return null;
    for (let i = idx + 1; i < bayKeys.length; i++) {
      if (aisleSessions[bayKeys[i]]?.capturedPhotoUrl) return bayKeys[i];
    }
    return null;
  }, [bayKeys, aisleSessions]);

  // Previous bay whose right edge is shown as a faded guide while shooting the current bay
  const ghostGuideBayKey = step === 'CAPTURE' && !pendingCapture ? previousCapturedBayKey(currentAisle) : null;
  const ghostGuideUrl = ghostGuideBayKey ? aisleSessions[ghostGuideBayKey]?.capturedPhotoUrl || null : null;

  useEffect(() => {
    captureBlockedRef.current = Boolean(pendingCapture) || Boolean(ghostGuideUrl);
  }, [pendingCapture, ghostGuideUrl]);

  // Standard brands list
  const standardBrands = CATEGORY_BRANDS[category] || ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'];
  const allBrandKeys = useMemo(() => {
    return Array.from(
      new Set([...standardBrands, ...Object.values(aisleSessions).flatMap((s) => Object.keys(s.counts))])
    );
  }, [category, aisleSessions, standardBrands]);

  // Active view session references
  const currentSession = aisleSessions[currentAisle] || Object.values(aisleSessions)[0];
  const viewSession = resultsAisleView === 'ALL' 
    ? (completedAisles[0] ? aisleSessions[completedAisles[0]] : currentSession)
    : (aisleSessions[resultsAisleView] || currentSession);

  // Combined counts across completed aisles only
  const combinedCounts: Record<string, number> = useMemo(() => {
    const res: Record<string, number> = {};
    for (const b of allBrandKeys) {
      res[b] = completedAisles.reduce(
        (sum, k) => sum + (aisleSessions[k]?.counts[b] ?? 0),
        0
      );
    }
    return res;
  }, [completedAisles, aisleSessions, allBrandKeys]);

  const combinedTotalFacings = useMemo(() => {
    return Object.values(combinedCounts).reduce((a, b) => a + (b ?? 0), 0);
  }, [combinedCounts]);

  // Combined original AI counts across completed aisles
  const combinedOrigCounts: Record<string, number> = useMemo(() => {
    const res: Record<string, number> = {};
    for (const b of allBrandKeys) {
      res[b] = completedAisles.reduce(
        (sum, k) =>
          sum +
          (aisleSessions[k]?.seamAdjustedCounts?.[b] ??
            aisleSessions[k]?.originalAiCounts[b] ??
            aisleSessions[k]?.counts[b] ??
            0),
        0
      );
    }
    return res;
  }, [completedAisles, aisleSessions, allBrandKeys]);

  // Primary share metrics
  const primaryCount = useMemo(() => {
    if (category === 'Edible Oil') {
      return (
        (combinedCounts['YARA'] ?? 0) +
        (combinedCounts['ZAIN'] ?? 0) +
        (combinedCounts['DAWI'] ?? 0) +
        (combinedCounts['AL RAI'] ?? 0) +
        (combinedCounts['ADEERA'] ?? 0)
      );
    } else if (category === 'Flour') {
      return (
        (combinedCounts['F1'] ?? 0) +
        (combinedCounts['F2'] ?? 0) +
        (combinedCounts['F3'] ?? 0) +
        (combinedCounts['PREM'] ?? 0) +
        (combinedCounts['SR'] ?? 0) +
        (combinedCounts['KFM'] ?? 0)
      );
    } else {
      return (
        (combinedCounts['QFM'] ?? 0) +
        (combinedCounts['QFM PREM'] ?? 0) +
        (combinedCounts['ZAIN'] ?? 0)
      );
    }
  }, [category, combinedCounts]);

  const primarySharePct = combinedTotalFacings > 0 
    ? Math.round((primaryCount / combinedTotalFacings) * 100) 
    : 0;
  const primaryLabel = category === 'Edible Oil' ? 'QFI SOS' : 'QFM SOS';

  // 3. Panorama Canvas Assembler Effect for ALL Tab in RESULTS
  const capturedBaySessions = useMemo(() => {
    return bayKeys
      .map((k) => aisleSessions[k])
      .filter((s) => Boolean(s?.capturedPhotoUrl || s?.annotatedPhotoUrl));
  }, [bayKeys, aisleSessions]);

  // 3. Panorama Canvas Caching for ALL tab in RESULTS
  // Clear cached panorama when leaving RESULTS step
  useEffect(() => {
    if (step !== 'RESULTS') {
      if (stitchedPanoramaUrl !== null) {
        setStitchedPanoramaUrl(null);
      }
    }
  }, [step, stitchedPanoramaUrl]);

  // Built once on entering RESULTS and cached until RESULTS is left
  useEffect(() => {
    if (step !== 'RESULTS') return;
    if (stitchedPanoramaUrl !== null) return; // Already cached

    if (capturedBaySessions.length <= 1) {
      const single = capturedBaySessions[0];
      setStitchedPanoramaUrl(single?.annotatedPhotoUrl || single?.capturedPhotoUrl || null);
      return;
    }

    let isMounted = true;
    setIsStitchingPanorama(true);

    const crops = duplicateReviewStatus === 'removed' ? computeBayCrops(capturedBaySessions) : {};
    stitchBayPanorama(capturedBaySessions, showRawPhotoComparison, crops)
      .then((dataUrl) => {
        if (isMounted) {
          setStitchedPanoramaUrl(dataUrl);
          setIsStitchingPanorama(false);
        }
      })
      .catch((err) => {
        console.warn('Panorama assembly note, falling back:', err);
        if (isMounted) {
          const fallback = capturedBaySessions[0];
          setStitchedPanoramaUrl(fallback?.annotatedPhotoUrl || fallback?.capturedPhotoUrl || null);
          setIsStitchingPanorama(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [step, capturedBaySessions, stitchedPanoramaUrl, showRawPhotoComparison]);

  // 2. Overlapping Async Upload & Analysis Handler (Runs in background without touching POSM)
  const startAsyncBayAnalysis = useCallback(
    async (
      targetAisle: string,
      file: File | null,
      dataUrl: string,
      seamOpts: { seam?: SeamInfo | null; shotWithGuide?: boolean; captureDims?: { width: number; height: number } } = {}
    ) => {
      const startTime = Date.now();

      // Immediately set status to analysing
      setAisleSessions((prev) => ({
        ...prev,
        [targetAisle]: {
          ...(prev[targetAisle] || {
            key: targetAisle,
            label: `Bay ${Object.keys(prev).length + 1}`,
            status: 'idle',
            naturalDimensions: seamOpts.captureDims || { width: 800, height: 800 },
            rawCounts: {},
            counts: {},
            originalAiCounts: {},
            totalFacings: null,
            boxes: [],
            rawBoxes: [],
            n8nStatus: null,
            analysisStartTime: null,
            analysisDurationSeconds: 0
          }),
          status: 'analysing',
          capturedFile: file,
          capturedPhotoUrl: dataUrl,
          capturedFileName: file?.name || `${targetAisle}_capture.jpg`,
          ...(seamOpts.captureDims ? { naturalDimensions: seamOpts.captureDims } : {}),
          seam: seamOpts.seam ?? null,
          shotWithGuide: Boolean(seamOpts.shotWithGuide),
          analysisStartTime: startTime,
          errorMessage: undefined
        }
      }));

      try {
        console.log(`[Bay ${targetAisle}] Starting transmission to n8n...`);
        const result = await sendAuditToN8n(
          file || dataUrl,
          {
            outletId: outlet.id,
            outletName: outlet.name,
            accountName: outlet.name.split(' - ')[0] || outlet.name,
            outletCode: outlet.id,
            category,
            aisle: targetAisle,
            aisleLabel: aisleSessions[targetAisle]?.label || targetAisle,
            repName: userProfile?.name || 'Safwan Asif',
            repId: userProfile?.repId || '#9',
            totalFacings: 0,
            primarySharePct: 0,
            shareOfShelfPct: 0,
            shareOfShelfLabel: primaryLabel,
            counts: {},
            originalAiCounts: {},
            discrepancyLog: '',
            unmappedRemark: outlet.unmappedRemark,
            latitude: gpsCoords?.latitude ?? outlet.latitude ?? 25.2854,
            longitude: gpsCoords?.longitude ?? outlet.longitude ?? 51.5310,
            locationSource: gpsCoords?.source || 'device_gps',
            priceTagOk,
            posmShelfSticker,
            posmWobblers,
            needsReview: false,
            timestamp: new Date().toISOString(),
            seam: seamOpts.seam
              ? {
                  previousBay: seamOpts.seam.leftBayKey,
                  cutFrac: seamOpts.seam.cutFracRight,
                  overlapFrac: seamOpts.seam.overlapFracRight,
                  confidence: seamOpts.seam.confidence,
                  method: seamOpts.seam.method
                }
              : undefined
          },
          90000,
          seamOpts.captureDims || { width: 800, height: 800 }
        );
        console.log(`[Bay ${targetAisle}] Transmission result:`, result);

        const normalized = normalizeN8nAuditResponse(
          result.rawResponse || result.rawNormalized || result,
          category
        );

        const duration = Math.round((Date.now() - startTime) / 1000);

        setAisleSessions((prev) => {
          const currentPrev = prev[targetAisle];
          const newDimensions = (normalized.dimensionsExplicit && normalized.dimensions)
            || seamOpts.captureDims
            || currentPrev?.naturalDimensions
            || normalized.dimensions
            || { width: 800, height: 800 };
          return {
            ...prev,
            [targetAisle]: {
              ...currentPrev,
              status: 'done',
              counts: { ...normalized.counts },
              rawCounts: { ...normalized.counts },
              originalAiCounts: { ...normalized.counts },
              totalFacings: normalized.total_facings,
              annotatedPhotoUrl: normalized.annotated_image || null,
              boxes: normalized.boxes || [],
              rawBoxes: normalized.boxes || [],
              naturalDimensions: newDimensions,
              n8nStatus: {
                ...result,
                counts: normalized.counts,
                totalFacings: normalized.total_facings,
                needsReview: normalized.needs_review,
                annotatedImageUrl: normalized.annotated_image
              },
              analysisDurationSeconds: duration
            }
          };
        });
      } catch (err: any) {
        console.error(`[Bay ${targetAisle}] Async analysis failed:`, err);
        const duration = Math.round((Date.now() - startTime) / 1000);

        setAisleSessions((prev) => ({
          ...prev,
          [targetAisle]: {
            ...prev[targetAisle],
            status: 'error',
            errorMessage: err?.message || 'Analysis failed',
            analysisDurationSeconds: duration
          }
        }));
      }
    },
    [outlet, category, userProfile, primaryLabel, priceTagOk, posmShelfSticker, posmWobblers, gpsCoords, aisleSessions]
  );

  // 3. Errored Bay Escape Hatch Handler: returns to CAPTURE for that bay only
  const handleRetakeBay = (bayKey: string) => {
    setRetakeBayKey(bayKey);
    setCurrentAisle(bayKey);
    setAisleSessions((prev) => {
      const s = prev[bayKey];
      if (!s) return prev;
      return {
        ...prev,
        [bayKey]: {
          ...s,
          status: 'idle',
          capturedFile: null,
          capturedPhotoUrl: null,
          capturedFileName: null,
          annotatedPhotoUrl: null,
          errorMessage: undefined
        }
      };
    });
    setShowPostCapturePrompt(false);
    setStep('CAPTURE');
  };

  /**
   * Every capture (camera, gallery, sample) lands here. Nothing is uploaded yet:
   * the rep reviews the photo — and for Bay 2+ the measured overlap — then taps Upload.
   */
  const beginBayPreview = useCallback(
    (targetAisle: string, file: File | null, dataUrl: string, dims: { width: number; height: number } | null) => {
      const isRetake = retakeBayKey === targetAisle;
      const prevKey = previousCapturedBayKey(targetAisle);
      const prevUrl = prevKey ? aisleSessions[prevKey]?.capturedPhotoUrl : null;
      const shotWithGuide = Boolean(prevUrl) && !file; // live camera shots of Bay 2+ show the guide

      setLastCapturedAisle(targetAisle);
      setShowPostCapturePrompt(false);
      setShowAlignmentCheck(false);
      setPendingSeam(null);
      pendingDataUrlRef.current = dataUrl;

      // Immediately persist captured photo into aisleSessions state so ghost guide and results preview work seamlessly
      setAisleSessions((prev) => {
        const existing = prev[targetAisle] || {
          key: targetAisle,
          label: `Bay ${Object.keys(prev).length + 1}`,
          status: 'idle',
          naturalDimensions: dims || { width: 800, height: 800 },
          rawCounts: {},
          counts: {},
          originalAiCounts: {},
          totalFacings: null,
          boxes: [],
          rawBoxes: [],
          n8nStatus: null,
          analysisStartTime: null,
          analysisDurationSeconds: 0
        };
        return {
          ...prev,
          [targetAisle]: {
            ...existing,
            capturedFile: file || existing.capturedFile || null,
            capturedPhotoUrl: dataUrl,
            capturedFileName: file?.name || existing.capturedFileName || `${targetAisle}_capture.jpg`,
            ...(dims ? { naturalDimensions: dims } : {})
          }
        };
      });

      setPendingCapture({
        bayKey: targetAisle,
        file,
        dataUrl,
        width: dims?.width || 0,
        height: dims?.height || 0,
        shotWithGuide,
        isRetake
      });

      const finishMeasure = (w: number, h: number) => {
        if (w && h) {
          setPendingCapture((p) => (p && p.dataUrl === dataUrl ? { ...p, width: w, height: h } : p));
        }
        if (!prevKey || !prevUrl) {
          setIsMeasuringSeam(false);
          return;
        }
        setIsMeasuringSeam(true);
        estimateSeam(prevUrl, dataUrl, prevKey, targetAisle, { shotWithGuide })
          .then((seam) => {
            if (pendingDataUrlRef.current === dataUrl) setPendingSeam(seam);
          })
          .finally(() => {
            if (pendingDataUrlRef.current === dataUrl) setIsMeasuringSeam(false);
          });
      };

      if (dims?.width && dims?.height) {
        finishMeasure(dims.width, dims.height);
      } else {
        const probe = new Image();
        probe.onload = () => finishMeasure(probe.naturalWidth, probe.naturalHeight);
        probe.onerror = () => finishMeasure(0, 0);
        probe.src = dataUrl;
      }
    },
    [retakeBayKey, previousCapturedBayKey, aisleSessions]
  );

  /** Rep tapped Upload: store the confirmed seam and send the photo for analysis. */
  const handleConfirmUpload = () => {
    if (!pendingCapture) return;
    const { bayKey, file, dataUrl, width, height, shotWithGuide, isRetake } = pendingCapture;
    const captureDims = width && height ? { width, height } : undefined;

    startAsyncBayAnalysis(bayKey, file, dataUrl, { seam: pendingSeam, shotWithGuide, captureDims });

    // If a middle bay was re-shot, the seam of the bay to its right is stale: re-measure it.
    const nextKey = nextCapturedBayKey(bayKey);
    const nextUrl = nextKey ? aisleSessions[nextKey]?.capturedPhotoUrl : null;
    if (nextKey && nextUrl) {
      const nextShotWithGuide = Boolean(aisleSessions[nextKey]?.shotWithGuide);
      estimateSeam(dataUrl, nextUrl, bayKey, nextKey, { shotWithGuide: nextShotWithGuide }).then((seam) => {
        setAisleSessions((prev) => (prev[nextKey] ? { ...prev, [nextKey]: { ...prev[nextKey], seam } } : prev));
      });
    }

    pendingDataUrlRef.current = null;
    setPendingCapture(null);
    setPendingSeam(null);
    setShowAlignmentCheck(false);

    if (isRetake) {
      setRetakeBayKey(null);
      setShowPostCapturePrompt(false);
      setStep('POSM');
    } else {
      setShowPostCapturePrompt(true);
    }
  };

  /** Rep rejected the photo: discard it and return to the camera for the same bay. */
  const handleDiscardPending = () => {
    pendingDataUrlRef.current = null;
    setPendingCapture(null);
    setPendingSeam(null);
    setIsMeasuringSeam(false);
    setShowAlignmentCheck(false);
    autoCaptureTriggeredRef.current = false;
    levelHoldStartTimeRef.current = null;
  };

  /** Rep dragged the overlap edge in the preview (fraction of the new photo's width). */
  const handleSeamDrag = (clientX: number) => {
    const frame = previewFrameRef.current;
    if (!frame || !pendingCapture) return;
    const rect = frame.getBoundingClientRect();
    const frac = Math.max(0, Math.min(0.8, (clientX - rect.left) / rect.width));
    const prevKey = previousCapturedBayKey(pendingCapture.bayKey);
    if (!prevKey) return;
    setPendingSeam((cur) => {
      const ratio = cur?.widthRatio ?? 1;
      return buildSeam(prevKey, pendingCapture.bayKey, frac, ratio, {
        score: cur?.score ?? 0,
        confidence: cur?.confidence ?? 'none',
        method: 'manual',
        scale: cur?.scale ?? 1,
        dyFrac: cur?.dyFrac ?? 0
      });
    });
  };

  // Auto-capture frame execution from WebRTC video stream
  const handleAutoCaptureTrigger = useCallback(async () => {
    if (!videoRef.current || !cameraStreamActive) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const video = videoRef.current;
      const stream = video.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks?.()?.[0];

      // Attempt hardware ImageCapture API if supported for uncompressed sensor resolution
      if (track && (window as any).ImageCapture) {
        try {
          const imageCapture = new (window as any).ImageCapture(track);
          const blob = await imageCapture.takePhoto();
          const dataUrl = await new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(blob);
          });
          const img = new Image();
          img.onload = () => {
            beginBayPreview(currentAisle, null, dataUrl, { width: img.naturalWidth, height: img.naturalHeight });
          };
          img.src = dataUrl;
          return;
        } catch (icErr) {
          console.warn('Hardware ImageCapture note, using high-clarity canvas snapshot:', icErr);
        }
      }

      const w = video.videoWidth || 1920;
      const h = video.videoHeight || 1080;
      if (w === 0 || h === 0) {
        cameraInputRef.current?.click();
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        cameraInputRef.current?.click();
        return;
      }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.98);

      beginBayPreview(currentAisle, null, dataUrl, { width: canvas.width, height: canvas.height });
    } catch (err) {
      console.warn('Auto-capture canvas snapshot note, falling back to system camera:', err);
      cameraInputRef.current?.click();
    }
  }, [cameraStreamActive, currentAisle, beginBayPreview]);
  autoCaptureFnRef.current = handleAutoCaptureTrigger;

  // Manual Shutter Click handler: snaps live video frame inside app or opens system camera
  const handleManualShutter = () => {
    if (pendingCapture) return;
    if (cameraStreamActive && videoRef.current && videoRef.current.videoWidth > 0) {
      handleAutoCaptureTrigger();
    } else {
      cameraInputRef.current?.click();
    }
  };

  // File Picker selected handler: reads full-resolution image data from device gallery/camera app
  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      const img = new Image();
      img.onload = () => {
        beginBayPreview(currentAisle, file, dataUrl, { width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        beginBayPreview(currentAisle, file, dataUrl, null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Debug Demo Sample Shelf
  const handleUseDemoSample = () => {
    beginBayPreview(currentAisle, null, fallbackShelfPhoto, null);
  };

  // Flexible Dynamic Bay Addition (Transmits confirmed bay to n8n, then adds next bay)
  const handleAddNewBay = () => {
    setShowPostCapturePrompt(false);
    autoCaptureTriggeredRef.current = false;
    levelHoldStartTimeRef.current = null;
    setPendingCapture(null);
    setPendingSeam(null);
    setIsMeasuringSeam(false);
    setShowAlignmentCheck(false);

    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (!cameraStreamActive) {
      startCameraStream();
    }

    // Transmit the confirmed bay to n8n workflow only now
    const confirmedBayKey = lastCapturedAisle || currentAisle;
    const confirmedSession = aisleSessions[confirmedBayKey];
    if (confirmedSession && confirmedSession.capturedPhotoUrl && confirmedSession.status === 'idle') {
      startAsyncBayAnalysis(confirmedBayKey, confirmedSession.capturedFile, confirmedSession.capturedPhotoUrl);
    }

    setAisleSessions((prev) => {
      const keys = Object.keys(prev);
      // Check if there is an existing empty bay
      const existingEmpty = keys.find(
        (k) => !prev[k].capturedPhotoUrl && !prev[k].annotatedPhotoUrl
      );
      if (existingEmpty) {
        setCurrentAisle(existingEmpty);
        setStep('CAPTURE');
        return prev;
      }

      // Create next bay dynamically
      const nextNum = keys.length + 1;
      const nextKey = `bay_${nextNum}`;
      const newSession: AisleSession = {
        key: nextKey,
        label: `Bay ${nextNum}`,
        status: 'idle',
        capturedFile: null,
        capturedPhotoUrl: null,
        capturedFileName: null,
        naturalDimensions: { width: 800, height: 800 },
        annotatedPhotoUrl: null,
        rawCounts: {},
        counts: {},
        originalAiCounts: {},
        totalFacings: null,
        boxes: [],
        rawBoxes: [],
        n8nStatus: null,
        analysisStartTime: null,
        analysisDurationSeconds: 0
      };

      setCurrentAisle(nextKey);
      setStep('CAPTURE');
      return {
        ...prev,
        [nextKey]: newSession
      };
    });
  };

  // 1. Tapping "Proceed to POSM Form" confirms all captured photos and transmits them to n8n
  const handleDoneShooting = () => {
    setShowPostCapturePrompt(false);

    // Transmit all captured bays that haven't been processed yet to n8n
    Object.values(aisleSessions).forEach((session) => {
      if (session.capturedPhotoUrl && session.status === 'idle') {
        startAsyncBayAnalysis(session.key, session.capturedFile, session.capturedPhotoUrl);
      }
    });

    setStep('POSM');
  };

  // 2. Submitting POSM: gated on all captured bays reaching status === 'done'
  // Applies the measured bay seams (each bottle counted by exactly one bay) on entering RESULTS.
  const handlePosmSubmit = () => {
    if (!allCapturedDone || erroredAisles.length > 0) return;
    applySeamDeduplication();
    setStep('RESULTS');
    setResultsAisleView('ALL');
  };

  /**
   * Deducts every box that belongs to a neighbouring bay (per the confirmed seams).
   * Anything deducted earlier — by seams or by manual taps — is restored first, so
   * running this again (e.g. after going back to POSM) never double-deducts.
   */
  const applySeamDeduplication = () => {
    const ordered = bayKeys.map((k) => aisleSessions[k]).filter((s) => s && s.status === 'done');
    const rawReports = buildSeamDuplicateReports(ordered);
    const reports: Record<string, BayDuplicateReport> = {};
    Object.entries(rawReports).forEach(([k, r]) => {
      reports[k] = { ...r, duplicates: r.duplicates.map((d) => ({ ...d, brand: canonicalizeBrand(d.brand, category) })) };
    });

    const previouslyRemoved = removedDuplicateBoxIds;
    const previousReports = duplicateReports;
    const newlyRemovedIds = new Set<string>();

    setAisleSessions((prev) => {
      const updated = { ...prev };
      const counts: Record<string, Record<string, number>> = {};
      const getCounts = (k: string) => (counts[k] ??= { ...(updated[k]?.counts || {}) });

      // 1. Restore earlier deductions
      Object.values(previousReports).forEach((rep) => {
        rep.duplicates.forEach((d) => {
          if (!previouslyRemoved.has(d.boxId) || !updated[rep.bayKey]) return;
          const c = getCounts(rep.bayKey);
          c[d.brand] = (c[d.brand] || 0) + 1;
        });
      });

      // 2. Deduct boxes owned by the neighbouring bay
      Object.values(reports).forEach((rep) => {
        rep.duplicates.forEach((d) => {
          newlyRemovedIds.add(d.boxId);
          const c = getCounts(rep.bayKey);
          if ((c[d.brand] || 0) > 0) c[d.brand] -= 1;
        });
      });

      Object.entries(counts).forEach(([k, c]) => {
        const session = updated[k];
        updated[k] = {
          ...session,
          counts: c,
          totalFacings: Object.values(c).reduce((a, b) => a + (b ?? 0), 0),
          removedDuplicates: reports[k]?.duplicates || []
        };
      });

      // AI counts after seam removal = baseline for the discrepancy log (rep edits are measured against it)
      ordered.forEach((s) => {
        const orig = updated[s.key]?.originalAiCounts || {};
        const adjusted: Record<string, number> = { ...orig };
        (reports[s.key]?.duplicates || []).forEach((d) => {
          if ((adjusted[d.brand] || 0) > 0) adjusted[d.brand] -= 1;
        });
        updated[s.key] = { ...updated[s.key], seamAdjustedCounts: adjusted };
      });

      return updated;
    });

    setDuplicateReports(reports);
    setRemovedDuplicateBoxIds(newlyRemovedIds);
    setDuplicateReviewStatus('removed');
    setIsDuplicatePanelExpanded(false);
    setStitchedPanoramaUrl(null);
  };

  // 1-Tap Toggle for any box on the active bay to add or remove it as a duplicate
  const handleToggleBoxDuplicate = (boxId: string, bayKey: string, boxBrand: string) => {
    const isCurrentlyRemoved = removedDuplicateBoxIds.has(boxId);
    setAisleSessions((prev) => {
      const session = prev[bayKey];
      if (!session) return prev;
      const nextCounts = { ...session.counts };

      if (isCurrentlyRemoved) {
        // Restore: add 1 facing back
        nextCounts[boxBrand] = (nextCounts[boxBrand] || 0) + 1;
      } else {
        // Mark as duplicate: deduct 1 facing
        if (nextCounts[boxBrand] && nextCounts[boxBrand] > 0) nextCounts[boxBrand] -= 1;
      }

      const nextTotal = Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0);
      return {
        ...prev,
        [bayKey]: {
          ...session,
          counts: nextCounts,
          totalFacings: nextTotal
        }
      };
    });

    setRemovedDuplicateBoxIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyRemoved) {
        next.delete(boxId);
      } else {
        next.add(boxId);
      }
      return next;
    });

    setDuplicateReports((prev) => {
      const rep = prev[bayKey];
      if (!rep) return prev;
      // Restored boxes stay in the report (shown as "Counted") so the rep can tap them again.
      const exists = rep.duplicates.some((d) => d.boxId === boxId);
      const nextDups = [...rep.duplicates];
      if (!isCurrentlyRemoved && !exists) {
        nextDups.push({
          boxId,
          brand: boxBrand,
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          confidence: 0.95,
          matchedWithBoxId: '',
          leftBayKey: '',
          rightBayKey: bayKey
        });
      }
      return {
        ...prev,
        [bayKey]: {
          ...rep,
          hasDuplicates: nextDups.length > 0,
          duplicates: nextDups
        }
      };
    });
  };

  // Cross-Bay Duplicates Summary
  const totalDuplicatesCount = useMemo(() => {
    return Object.values(duplicateReports).reduce(
      (sum, r) => sum + r.duplicates.filter((d) => removedDuplicateBoxIds.has(d.boxId)).length,
      0
    );
  }, [duplicateReports, removedDuplicateBoxIds]);

  /** One row per bay join, for the results summary. */
  const seamSummaries = useMemo(() => {
    const ordered = completedAisles.map((k) => aisleSessions[k]).filter(Boolean);
    return ordered.slice(1).map((bay, i) => {
      const left = ordered[i];
      const seam = bay.seam && bay.seam.leftBayKey === left.key ? bay.seam : null;
      const excluded = [
        ...(duplicateReports[left.key]?.duplicates || []).filter((d) => d.rightBayKey === bay.key),
        ...(duplicateReports[bay.key]?.duplicates || []).filter((d) => d.leftBayKey === left.key)
      ].filter((d) => removedDuplicateBoxIds.has(d.boxId)).length;
      return { leftKey: left.key, leftLabel: left.label, rightKey: bay.key, rightLabel: bay.label, seam, excluded };
    });
  }, [completedAisles, aisleSessions, duplicateReports, removedDuplicateBoxIds]);

  // "Keep all": restores every deducted bottle and turns the seam cut off
  const handleKeepAllDuplicates = () => {
    setAisleSessions((prev) => {
      const updated = { ...prev };
      Object.values(duplicateReports).forEach((rep) => {
        const session = updated[rep.bayKey];
        if (!session) return;
        const c = { ...session.counts };
        rep.duplicates.forEach((d) => {
          if (removedDuplicateBoxIds.has(d.boxId)) c[d.brand] = (c[d.brand] || 0) + 1;
        });
        updated[rep.bayKey] = {
          ...session,
          counts: c,
          totalFacings: Object.values(c).reduce((a, b) => a + (b ?? 0), 0),
          removedDuplicates: [],
          seamAdjustedCounts: undefined
        };
      });
      return updated;
    });
    setRemovedDuplicateBoxIds(new Set());
    setDuplicateReviewStatus('kept');
    setIsDuplicatePanelExpanded(false);
    setStitchedPanoramaUrl(null);
  };

  // "Re-apply": counts each bottle once again using the seams
  const handleRemoveDuplicates = () => {
    applySeamDeduplication();
  };

  // 6. Proportional Delta Distribution on ALL Tab
  const handleUpdateCount = (brand: string, delta: number) => {
    if (resultsAisleView !== 'ALL') {
      // Editing on an individual BAY tab directly updates that bay
      setAisleSessions((prev) => {
        const session = prev[resultsAisleView];
        if (!session) return prev;
        const currentVal = session.counts[brand] ?? 0;
        const nextVal = Math.max(0, currentVal + delta);
        const nextCounts = { ...session.counts, [brand]: nextVal };
        const nextTotal = Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0);

        return {
          ...prev,
          [resultsAisleView]: {
            ...session,
            counts: nextCounts,
            totalFacings: nextTotal
          }
        };
      });
      return;
    }

    // Proportional allocation across completed bays for ALL tab
    if (completedAisles.length === 0) return;

    setAisleSessions((prev) => {
      const currentBrandTotal = completedAisles.reduce(
        (sum, k) => sum + (prev[k]?.counts[brand] ?? 0),
        0
      );
      const nextBrandTotal = Math.max(0, currentBrandTotal + delta);
      const actualDelta = nextBrandTotal - currentBrandTotal;
      if (actualDelta === 0) return prev;

      const nextAisleSessions = { ...prev };

      if (currentBrandTotal === 0) {
        // If all bays have 0, assign adjustment to the first completed bay
        const targetBay = completedAisles[0];
        const prevSession = prev[targetBay];
        if (!prevSession) return prev;
        const updatedCounts = {
          ...prevSession.counts,
          [brand]: (prevSession.counts[brand] ?? 0) + actualDelta
        };
        nextAisleSessions[targetBay] = {
          ...prevSession,
          counts: updatedCounts,
          totalFacings: Object.values(updatedCounts).reduce((a, b) => a + (b ?? 0), 0)
        };
      } else {
        // Calculate proportional shares
        let remainder = actualDelta;
        const bayDeltas: Record<string, number> = {};
        completedAisles.forEach((k) => {
          bayDeltas[k] = 0;
        });

        completedAisles.forEach((k) => {
          const share = (prev[k]?.counts[brand] ?? 0) / currentBrandTotal;
          const shareDelta = actualDelta > 0 
            ? Math.floor(actualDelta * share) 
            : Math.ceil(actualDelta * share);
          bayDeltas[k] = shareDelta;
          remainder -= shareDelta;
        });

        // Remainder allocated to the bay with the highest count
        if (remainder !== 0) {
          let largestBay = completedAisles[0];
          let maxCount = -1;
          completedAisles.forEach((k) => {
            const c = prev[k]?.counts[brand] ?? 0;
            if (c > maxCount) {
              maxCount = c;
              largestBay = k;
            }
          });
          bayDeltas[largestBay] += remainder;
        }

        completedAisles.forEach((k) => {
          const prevSession = prev[k];
          if (!prevSession) return;
          const updatedVal = Math.max(0, (prevSession.counts[brand] ?? 0) + bayDeltas[k]);
          const updatedCounts = { ...prevSession.counts, [brand]: updatedVal };
          nextAisleSessions[k] = {
            ...prevSession,
            counts: updatedCounts,
            totalFacings: Object.values(updatedCounts).reduce((a, b) => a + (b ?? 0), 0)
          };
        });
      }

      return nextAisleSessions;
    });
  };

  // Add Brand submit
  const handleAddBrandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const cleanName = newBrandName.trim().toUpperCase();

    const targetBay = resultsAisleView === 'ALL'
      ? (completedAisles[0] || currentAisle)
      : resultsAisleView;

    setAisleSessions((prev) => {
      const s = prev[targetBay];
      if (!s) return prev;
      const nextCounts = { ...s.counts, [cleanName]: (s.counts[cleanName] ?? 0) + newBrandCount };
      return {
        ...prev,
        [targetBay]: {
          ...s,
          counts: nextCounts,
          totalFacings: Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0)
        }
      };
    });

    setNewBrandName('');
    setNewBrandCount(2);
    setIsAddBrandOpen(false);
  };

  // Save Path with Pending Bays
  const isSaveEnabled = completedAisles.length >= 1;

  const handleFinalSave = async () => {
    if (!isSaveEnabled) return;

    const elapsedSeconds = Math.round((Date.now() - auditStartTime) / 1000);
    const coords =
      gpsCoords ||
      (await getAuditCoordinates({ latitude: outlet.latitude, longitude: outlet.longitude }));

    const serializedAisles: Partial<Record<string, AisleSessionData>> = {};

    Object.keys(aisleSessions).forEach((key) => {
      const s = aisleSessions[key];
      const hasPhoto = Boolean(s.capturedPhotoUrl || s.annotatedPhotoUrl);
      if (!hasPhoto && s.status === 'idle') return;

      const finalStatus: AisleStatus =
        s.status === 'analysing' || s.status === 'uploading' 
          ? 'pending' 
          : s.status;

      serializedAisles[key] = {
        key,
        label: s.label,
        status: finalStatus,
        capturedPhotoUrl: s.capturedPhotoUrl || undefined,
        capturedFileName: s.capturedFileName || undefined,
        annotatedPhotoUrl: s.annotatedPhotoUrl || undefined,
        rawCounts: s.rawCounts,
        counts: s.counts,
        originalAiCounts: s.originalAiCounts,
        totalFacings: s.totalFacings ?? 0,
        boundingBoxes: s.boxes,
        rawBoxes: s.rawBoxes,
        naturalDimensions: s.naturalDimensions,
        removedDuplicates: (duplicateReports[key]?.duplicates || []).filter((d) => removedDuplicateBoxIds.has(d.boxId)),
        seam: s.seam || undefined,
        timestamp: new Date().toISOString()
      };
    });

    const firstCompletedKey = completedAisles[0] || Object.keys(aisleSessions)[0];
    const primaryCompleted = aisleSessions[firstCompletedKey] || aisleSessions[currentAisle];
    const primaryPhoto =
      primaryCompleted?.annotatedPhotoUrl || primaryCompleted?.capturedPhotoUrl || fallbackShelfPhoto;

    const baySummaryStr = completedAisles
      .map((k) => `${aisleSessions[k]?.label || k}: ${aisleSessions[k]?.totalFacings ?? 0}f`)
      .join(', ');

    const currentDiscrepancyLog = formatDiscrepancyLog(combinedOrigCounts, combinedCounts);
    const seamNote = seamSummaries
      .map((j) => {
        const pct = j.seam ? Math.round(j.seam.overlapFracRight * 100) : 0;
        const how = j.seam ? `${j.seam.method}/${j.seam.confidence}` : 'no seam';
        return `${j.leftLabel}|${j.rightLabel}: ${pct}% overlap (${how}), ${j.excluded} counted once`;
      })
      .join('; ');
    const dupNote = seamSummaries.length > 0
      ? ` [Overlap: ${duplicateReviewStatus === 'kept' ? 'rep kept all detections; ' : ''}${seamNote}]`
      : '';
    const fullDiscrepancyLog = `[${completedAisles.length} Bay(s): ${baySummaryStr}]${dupNote} ${currentDiscrepancyLog}`;

    const record: CategoryAuditRecord = {
      outletId: outlet.id,
      category,
      priceTagOk,
      posmShelfSticker,
      posmWobblers,
      aiCounts: combinedCounts,
      counts: combinedCounts,
      originalAiCounts: combinedOrigCounts,
      discrepancyLog: fullDiscrepancyLog,
      unmappedRemark: outlet.unmappedRemark,
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationSource: coords.source,
      totalFacings: combinedTotalFacings,
      primarySharePct: primarySharePct,
      shareOfShelfPct: primarySharePct,
      shareOfShelfLabel: primaryLabel,
      photoUrl: primaryCompleted?.capturedPhotoUrl || fallbackShelfPhoto,
      annotatedPhotoUrl: primaryCompleted?.annotatedPhotoUrl || undefined,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      auditDurationSeconds: elapsedSeconds,
      aisles: serializedAisles,
      activeAisleCount: completedAisles.length
    };

    // Auto-Sync to Google Sheet in background
    autoSaveAuditToGoogleSheet({
      timestamp: new Date().toLocaleString(),
      outletId: outlet.id,
      outletName: outlet.name,
      accountName: outlet.name.split(' - ')[0] || outlet.name,
      category,
      repId: userProfile?.repId || '#9',
      repName: userProfile?.name || 'Safwan Asif',
      totalFacings: combinedTotalFacings,
      shareOfShelfPct: primarySharePct,
      shareOfShelfLabel: primaryLabel,
      counts: combinedCounts,
      originalAiCounts: combinedOrigCounts,
      discrepancyLog: fullDiscrepancyLog,
      unmappedRemark: outlet.unmappedRemark,
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationSource: coords.source,
      priceTagOk,
      posmShelfSticker,
      posmWobblers,
      needsReview: completedAisles.some((k) => Boolean(aisleSessions[k]?.n8nStatus?.needsReview)),
      photoDataUrl: primaryPhoto,
      replyText: `${outlet.name} - ${category} (${completedAisles.length} bays completed)`
    }).then((res) => {
      if (!res.success) {
        setSyncError(res.message || 'Auto-sync failed');
      }
    }).catch((err) => {
      console.warn('Background sheet auto-save note:', err);
      setSyncError(err?.message || 'Auto-sync network error');
    });

    onSaveAudit(record);
  };

  // Background Sync Retry handler
  const handleRetrySync = async () => {
    setIsRetryingSync(true);
    setSyncError(null);
    try {
      const firstCompletedKey = completedAisles[0] || Object.keys(aisleSessions)[0];
      const primaryCompleted = aisleSessions[firstCompletedKey] || aisleSessions[currentAisle];
      const res = await autoSaveAuditToGoogleSheet({
        timestamp: new Date().toLocaleString(),
        outletId: outlet.id,
        outletName: outlet.name,
        accountName: outlet.name.split(' - ')[0] || outlet.name,
        category,
        repId: userProfile?.repId || '#9',
        repName: userProfile?.name || 'Safwan Asif',
        totalFacings: combinedTotalFacings,
        shareOfShelfPct: primarySharePct,
        shareOfShelfLabel: primaryLabel,
        counts: combinedCounts,
        originalAiCounts: combinedOrigCounts,
        discrepancyLog: formatDiscrepancyLog(combinedOrigCounts, combinedCounts),
        unmappedRemark: outlet.unmappedRemark,
        latitude: gpsCoords?.latitude ?? outlet.latitude ?? 25.2854,
        longitude: gpsCoords?.longitude ?? outlet.longitude ?? 51.5310,
        locationSource: gpsCoords?.source || 'device_gps',
        priceTagOk,
        posmShelfSticker,
        posmWobblers,
        needsReview: false,
        photoDataUrl: primaryCompleted?.annotatedPhotoUrl || primaryCompleted?.capturedPhotoUrl || fallbackShelfPhoto,
        replyText: `${outlet.name} - ${category} (retry)`
      });
      if (!res.success) {
        setSyncError(res.message || 'Retry failed');
      }
    } catch (err: any) {
      setSyncError(err?.message || 'Retry error');
    } finally {
      setIsRetryingSync(false);
    }
  };

  // Image source resolution for RESULTS tab
  /**
   * Count-line overlays on the results photo.
   * - ALL tab: joined panorama (each bay cropped at its count lines) with a divider at every join.
   * - Bay tab: shaded areas that belong to the neighbouring bay + every bottle that bay doesn't
   *   count (red) or that the rep restored (green). Tap toggles.
   */
  const renderSeamOverlays = (inLightbox: boolean) => {
    const ordered = completedAisles.map((k) => aisleSessions[k]).filter(Boolean);
    const seamsOn = duplicateReviewStatus === 'removed';
    const crops = seamsOn ? computeBayCrops(ordered) : {};
    const isAllView = resultsAisleView === 'ALL' && ordered.length > 1;

    if (isAllView) {
      const segW = ordered.map((b) => {
        const c = crops[b.key] || { start: 0, end: 1 };
        const w = b.naturalDimensions?.width || 800;
        const h = b.naturalDimensions?.height || 800;
        return (c.end - c.start) * (w / h);
      });
      const total = segW.reduce((a, v) => a + v, 0) || 1;
      let acc = 0;
      return ordered.slice(0, -1).map((b, idx) => {
        acc += segW[idx];
        const next = ordered[idx + 1];
        const hasSeam = seamsOn && next.seam && next.seam.leftBayKey === b.key;
        return (
          <div
            key={`${inLightbox ? 'lb-' : ''}join-${b.key}`}
            style={{ left: `${(acc / total) * 100}%` }}
            className={`absolute top-0 bottom-0 w-0 border-r-2 border-dashed z-0 pointer-events-none ${hasSeam ? 'border-emerald-400/90' : 'border-amber-400/80'}`}
          >
            {!inLightbox && (
              <span className="absolute top-1 -translate-x-1/2 text-[8px] font-mono font-bold text-emerald-200 bg-black/85 px-1 py-0.5 rounded border border-emerald-500/30 whitespace-nowrap">
                {hasSeam ? `Count line ${b.label} | ${next.label}` : `${b.label} | ${next.label}`}
              </span>
            )}
          </div>
        );
      });
    }

    const bayKey = resultsAisleView === 'ALL' ? ordered[0]?.key : resultsAisleView;
    const bayIndex = ordered.findIndex((b) => b.key === bayKey);
    if (bayIndex < 0) return null;
    const session = ordered[bayIndex];
    const prev = ordered[bayIndex - 1];
    const next = ordered[bayIndex + 1];
    const leftSeam = prev && session.seam && session.seam.leftBayKey === prev.key ? session.seam : null;
    const rightSeam = next && next.seam && next.seam.leftBayKey === session.key ? next.seam : null;
    const bayW = session.naturalDimensions?.width || 800;
    const bayH = session.naturalDimensions?.height || 1280;
    const report = duplicateReports[session.key];

    return (
      <>
        {leftSeam && (
          <div
            style={{ width: `${leftSeam.cutFracRight * 100}%` }}
            className={`absolute top-0 bottom-0 left-0 border-r-2 border-dashed pointer-events-none flex flex-col justify-end p-1 z-0 ${
              seamsOn ? 'border-emerald-400/90 bg-black/35' : 'border-amber-400/70 bg-transparent'
            }`}
          >
            {!inLightbox && (
              <span className="text-[8px] font-mono font-bold text-emerald-200 bg-black/85 px-1 py-0.5 rounded self-end border border-emerald-500/30 whitespace-nowrap">
                Counted in {prev.label}
              </span>
            )}
          </div>
        )}
        {rightSeam && (
          <div
            style={{ width: `${(1 - rightSeam.cutFracLeft) * 100}%` }}
            className={`absolute top-0 bottom-0 right-0 border-l-2 border-dashed pointer-events-none flex flex-col justify-end p-1 z-0 ${
              seamsOn ? 'border-emerald-400/90 bg-black/35' : 'border-amber-400/70 bg-transparent'
            }`}
          >
            {!inLightbox && (
              <span className="text-[8px] font-mono font-bold text-emerald-200 bg-black/85 px-1 py-0.5 rounded self-start border border-emerald-500/30 whitespace-nowrap">
                Counted in {next.label}
              </span>
            )}
          </div>
        )}
        {(report?.duplicates || []).map((dup) => {
          const isRemoved = removedDuplicateBoxIds.has(dup.boxId);
          const leftPct = (dup.x / bayW) * 100;
          const topPct = (dup.y / bayH) * 100;
          const widthPct = ((dup.width || 40) / bayW) * 100;
          const heightPct = ((dup.height || 80) / bayH) * 100;
          if (!dup.width && !dup.height && !dup.x && !dup.y) return null;
          return (
            <button
              key={`${inLightbox ? 'lb-' : ''}dup-${dup.boxId}`}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleBoxDuplicate(dup.boxId, session.key, dup.brand);
              }}
              style={{
                left: `${Math.max(0, Math.min(99, leftPct))}%`,
                top: `${Math.max(0, Math.min(99, topPct))}%`,
                width: `${Math.max(1.5, widthPct)}%`,
                height: `${Math.max(2, heightPct)}%`
              }}
              className={`absolute rounded transition-all flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 z-10 ${
                isRemoved
                  ? 'bg-red-950/40 border-2 border-red-500 opacity-80'
                  : 'bg-emerald-500/20 border-2 border-dashed border-emerald-400 opacity-90'
              }`}
              title={isRemoved ? `${dup.brand}: counted in the neighbouring bay. Tap to count here too.` : `${dup.brand}: counted here. Tap to stop counting.`}
              aria-label={`${isRemoved ? 'Count' : 'Stop counting'} ${dup.brand} bottle`}
            >
              {isRemoved && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <div className="w-[140%] h-[2px] bg-red-500 rotate-[-45deg]" />
                </div>
              )}
            </button>
          );
        })}
      </>
    );
  };

  // Image source resolution for RESULTS tab (guarantees a valid image is shown and never blank)
  const activePhotoDisplay = useMemo(() => {
    if (resultsAisleView === 'ALL') {
      if (capturedBaySessions.length > 1) {
        return stitchedPanoramaUrl || (capturedAisles[0] ? aisleSessions[capturedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto;
      }
      return (capturedAisles[0] ? aisleSessions[capturedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto;
    }
    return viewSession?.capturedPhotoUrl || viewSession?.annotatedPhotoUrl || (capturedAisles[0] ? aisleSessions[capturedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto;
  }, [resultsAisleView, capturedBaySessions, stitchedPanoramaUrl, capturedAisles, aisleSessions, viewSession, fallbackShelfPhoto]);

  const displayAnnotatedPhoto = useMemo(() => {
    if (showRawPhotoComparison) return activePhotoDisplay;
    if (resultsAisleView === 'ALL') {
      if (capturedBaySessions.length > 1) {
        return stitchedPanoramaUrl || (capturedAisles[0] ? aisleSessions[capturedAisles[0]]?.annotatedPhotoUrl || aisleSessions[capturedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto;
      }
      return (capturedAisles[0] ? aisleSessions[capturedAisles[0]]?.annotatedPhotoUrl || aisleSessions[capturedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto;
    }
    return viewSession?.annotatedPhotoUrl || viewSession?.capturedPhotoUrl || fallbackShelfPhoto;
  }, [showRawPhotoComparison, activePhotoDisplay, resultsAisleView, capturedBaySessions, stitchedPanoramaUrl, capturedAisles, aisleSessions, viewSession, fallbackShelfPhoto]);

  const resolvedImgSrc = useMemo(() => {
    const rawSrc = displayAnnotatedPhoto || activePhotoDisplay || fallbackShelfPhoto;
    if (!rawSrc) return fallbackShelfPhoto;

    // Directly return base64 Data URLs, blob URLs, and local workspace image paths
    if (
      rawSrc.startsWith('data:') || 
      rawSrc.startsWith('blob:') || 
      rawSrc.startsWith('/') ||
      rawSrc.startsWith('assets/')
    ) {
      return rawSrc;
    }

    if (imgErrorLevel === 0) return toDirectDriveImageUrl(rawSrc) || rawSrc;
    if (imgErrorLevel === 1) return toAlternativeDriveImageUrl(rawSrc) || rawSrc;
    return rawSrc || fallbackShelfPhoto;
  }, [displayAnnotatedPhoto, activePhotoDisplay, imgErrorLevel, fallbackShelfPhoto]);

  // Lightbox Image resolution:
  // When in CAPTURE step, ALWAYS display the photo the user actually captured!
  const currentLightboxImage = useMemo(() => {
    if (step === 'CAPTURE') {
      const capturedBay = aisleSessions[lastCapturedAisle] || aisleSessions[currentAisle];
      if (capturedBay?.capturedPhotoUrl) {
        return capturedBay.capturedPhotoUrl;
      }
    }
    return resolvedImgSrc || fallbackShelfPhoto;
  }, [step, aisleSessions, lastCapturedAisle, currentAisle, resolvedImgSrc, fallbackShelfPhoto]);

  // Elapsed analysis seconds formatted quietly (multiples of 5s)
  const getQuietElapsedText = (session?: AisleSession) => {
    if (!session?.analysisStartTime) return 'Analysing… (5s)';
    const totalSec = Math.max(5, Math.floor((Date.now() - session.analysisStartTime) / 1000));
    const roundedSec = Math.max(5, Math.round(totalSec / 5) * 5);
    return `Analysing… (${roundedSec}s)`;
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-3 md:p-4 w-full h-full max-h-[100dvh] md:max-w-7xl md:mx-auto overflow-hidden select-none">
      {/* Hidden Native File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoFileSelected}
        aria-label="Capture photo with native camera"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoFileSelected}
        aria-label="Upload photo from device gallery"
      />

      {/* Top Bar: Back, Location, Category & Step Indicator */}
      <div className={`flex items-center justify-between pb-2 shrink-0 border-b gap-1.5 ${
        isDark ? 'border-emerald-900/40' : 'border-emerald-950/10'
      }`}>
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-semibold transition-colors shrink-0 ${
            isDark ? 'text-emerald-300/80 hover:text-white' : 'text-emerald-900/80 hover:text-emerald-950'
          }`}
        >
          <ArrowLeft size={15} />
          <span className="truncate max-w-[105px]">{outlet.name}</span>
        </button>

        <LiveLocationBadge
          compact
          outletName={outlet.name}
          targetLatitude={outlet.latitude}
          targetLongitude={outlet.longitude}
          onLocationCaptured={setGpsCoords}
        />

        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            isDark 
              ? 'bg-[#132219] text-emerald-300 border-emerald-800/60' 
              : 'bg-emerald-50 text-emerald-900 border-emerald-200'
          }`}>
            {step === 'CAPTURE' 
              ? `1. ${currentSession?.label || 'Bay 1'}` 
              : step === 'POSM'
              ? '2. POSM'
              : `3. Results (${completedAisles.length} Bay${completedAisles.length > 1 ? 's' : ''})`}
          </span>
        </div>
      </div>

      {/* Sync Error Retry Notification Banner */}
      {syncError && (
        <div className="mb-2 p-2 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-between text-[11px] text-rose-300 shrink-0">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <AlertCircle size={13} className="text-rose-400 shrink-0" />
            <span className="truncate">Sync failed: {syncError}</span>
          </div>
          <button
            type="button"
            onClick={handleRetrySync}
            disabled={isRetryingSync}
            className="px-2 py-0.5 rounded-lg bg-rose-500 text-white font-bold text-[10px] shrink-0 active:scale-95 cursor-pointer"
          >
            {isRetryingSync ? 'Retrying…' : 'Retry'}
          </button>
        </div>
      )}

      {/* ================= STEP 1: CAPTURE ================= */}
      {step === 'CAPTURE' && !showPostCapturePrompt && (
        <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-5 overflow-hidden py-1">
          {/* Camera Guidance Viewfinder & Auto-Capture (Snapchat-style Live Video Feed) */}
          <div 
            ref={viewfinderRef}
            onClick={() => {
              if (!cameraStreamActive && !pendingCapture) startCameraStream();
            }}
            className="order-1 md:order-2 flex-1 relative rounded-3xl border border-emerald-900/60 overflow-hidden bg-black flex flex-col items-center justify-center shadow-inner group cursor-pointer"
          >
            {/* Live WebRTC Video Stream (Fills viewfinder) */}
            {/* object-contain: the viewfinder shows exactly the frame that will be saved (no hidden edges) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setVideoDims({ w: v.videoWidth, h: v.videoHeight });
              }}
              onResize={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) setVideoDims({ w: v.videoWidth, h: v.videoHeight });
              }}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
                cameraStreamActive ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Simulated / Fallback Shelf Photo when live video stream is connecting or unavailable */}
            {!cameraStreamActive && (
              <img
                src={fallbackShelfPhoto}
                alt={`${category} Supermarket Shelf`}
                className="absolute inset-0 w-full h-full object-cover opacity-80"
              />
            )}

            {/* Soft edge darkening scrim */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

            {/* Previous-bay guide: the right edge of the last bay, faded over the left of the frame.
                Lining it up keeps the overlap consistent and makes the overlap measurement reliable. */}
            {ghostGuideUrl && (() => {
              const baseW = cameraStreamActive && videoDims.w && viewfinderSize.w ? viewfinderSize.w : 320;
              const baseH = cameraStreamActive && videoDims.h && viewfinderSize.h ? viewfinderSize.h : 480;
              const frame = cameraStreamActive && videoDims.w && viewfinderSize.w
                ? fitRect(viewfinderSize.w, viewfinderSize.h, videoDims.w, videoDims.h)
                : { left: 0, top: 0, width: baseW, height: baseH };
              const overlayWidth = Math.max(80, Math.round((frame.width || baseW) * GHOST_GUIDE_FRAC));

              return (
                <div
                  className="absolute top-0 bottom-0 left-0 overflow-hidden pointer-events-none z-[15] border-r-2 border-dashed border-amber-400 bg-amber-500/10 shadow-xl"
                  style={{ width: `${overlayWidth}px` }}
                >
                  <img
                    src={ghostGuideUrl}
                    alt="Previous bay overlay guide"
                    className="absolute top-0 right-0 h-full max-w-none opacity-65 filter brightness-110 contrast-110"
                    style={{ width: `${Math.max(300, frame.width || baseW)}px`, objectFit: 'fill' }}
                  />
                  <div className="absolute top-12 left-1 right-1 bg-black/90 backdrop-blur-md px-1.5 py-1 rounded border border-amber-400/90 shadow-md flex items-center justify-center text-center">
                    <span className="text-[9px] font-black uppercase tracking-tight text-amber-300">
                      Align with {aisleSessions[ghostGuideBayKey!]?.label || 'Bay 1'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Camera Guidance: Level Line & Banner */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
              {/* Top Viewfinder Banner */}
              <div className="w-full flex items-center justify-between pointer-events-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-black/75 px-2.5 py-1 rounded-lg border border-emerald-500/40 backdrop-blur-md">
                  Target: {category} &bull; {currentSession?.label || 'Bay 1'}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 backdrop-blur-md ${
                    isLevel 
                      ? 'text-emerald-400 bg-black/75 border-emerald-500/50' 
                      : 'text-rose-400 bg-black/75 border-rose-500/50'
                  }`}>
                    {sensorsAvailable ? (isLevel ? '✓ Level' : 'Tilt device') : 'Manual Center'}
                  </span>
                </div>
              </div>

              {/* Horizontal Level Line drawn across live camera view */}
              <div className="relative w-full flex items-center justify-center my-auto z-10">
                <div 
                  className={`w-full h-[2.5px] transition-colors duration-200 ${
                    sensorsAvailable 
                      ? isLevel 
                        ? 'bg-[#22C55E] shadow-md shadow-emerald-400' 
                        : 'bg-[#EF4444] shadow-md shadow-rose-500' 
                      : 'bg-emerald-400/80'
                  }`}
                />
                {/* Center tick indicator */}
                <div 
                  className={`absolute w-4 h-4 rounded-full border-2 transition-colors ${
                    sensorsAvailable
                      ? isLevel
                        ? 'bg-[#22C55E] border-white shadow-lg shadow-emerald-400'
                        : 'bg-[#EF4444] border-white shadow-lg shadow-rose-500'
                      : 'bg-emerald-500 border-white'
                  }`}
                />
              </div>

              {/* Bottom Guidance Cue */}
              <div className="w-full flex items-center justify-center pointer-events-auto">
                <span className="text-[10px] font-medium text-slate-200 bg-black/80 px-3 py-1 rounded-full border border-emerald-500/40 backdrop-blur-md shadow-md text-center max-w-sm truncate">
                  {ghostGuideUrl
                    ? 'Line up the faded strip with the shelf • Tap shutter to snap'
                    : 'Hold level • Tap shutter to snap'}
                </span>
              </div>
            </div>

            {/* Camera Permission / Initialization Alert Box */}
            {cameraErrorNotice && !cameraStreamActive && !showPostCapturePrompt && !pendingCapture && (
              <div className="absolute inset-0 z-30 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center space-y-3 pointer-events-auto animate-fade-in">
                <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/60 text-amber-300 shadow-lg">
                  <AlertTriangle size={28} />
                </div>
                <div className="max-w-xs space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">Camera Permission & Status</h4>
                  <p className="text-[10px] text-amber-200/90 leading-relaxed font-medium">
                    {cameraErrorNotice}
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-full max-w-xs pt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCameraStream();
                    }}
                    className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 hover:brightness-110 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Camera size={15} />
                    <span>Re-request Camera Permission</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-[11px] font-semibold rounded-xl flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Snap via System Camera App</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tap to Activate Live Stream Badge (When camera permission pending) */}
            {!cameraStreamActive && !cameraErrorNotice && !showPostCapturePrompt && !pendingCapture && (
              <div className="absolute bottom-14 z-20 pointer-events-auto flex flex-col items-center space-y-1.5 animate-pulse">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    startCameraStream();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xl border border-emerald-400/60 flex items-center gap-1.5 active:scale-95 cursor-pointer"
                >
                  <Camera size={14} />
                  <span>Tap to Start Live Camera</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                  className="text-[9px] text-emerald-300 hover:text-white underline font-semibold bg-black/75 px-2 py-0.5 rounded"
                >
                  Or snap with system camera
                </button>
              </div>
            )}

            {/* Review-before-upload: nothing is sent to n8n until the rep taps Upload.
                For Bay 2+, the measured overlap with the previous bay is shaded; the rep can drag its edge. */}
            {pendingCapture && (() => {
              const pc = pendingCapture;
              const label = aisleSessions[pc.bayKey]?.label || 'Bay';
              const prevKey = previousCapturedBayKey(pc.bayKey);
              const prevSession = prevKey ? aisleSessions[prevKey] : null;
              const prevLabel = prevSession?.label || 'previous bay';
              const containerW = viewfinderSize.w > 0 ? viewfinderSize.w : (viewfinderRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360));
              const containerH = viewfinderSize.h > 0 ? viewfinderSize.h : (viewfinderRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 480));
              const frame = fitRect(containerW, containerH, pc.width || 3, pc.height || 4);
              const seam = pendingSeam;
              const ovPct = seam ? seam.overlapFracRight * 100 : 0;
              const cutPct = seam ? seam.cutFracRight * 100 : 0;
              const needsCheck = Boolean(prevKey) && !isMeasuringSeam && (!seam || seam.method !== 'manual') &&
                (!seam || seam.confidence === 'low' || seam.confidence === 'none');
              const confidenceText: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low', none: 'Not measured' };

              return (
                <div
                  className="absolute inset-0 z-40 bg-black"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Photo frame (exactly the photo, no letterbox) */}
                  <div
                    ref={previewFrameRef}
                    className="absolute overflow-hidden touch-none select-none"
                    style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
                    onPointerMove={(e) => {
                      if (isDraggingSeamRef.current) handleSeamDrag(e.clientX);
                    }}
                    onPointerUp={() => { isDraggingSeamRef.current = false; }}
                    onPointerCancel={() => { isDraggingSeamRef.current = false; }}
                  >
                    <img src={pc.dataUrl} alt={`${label} preview`} className="absolute inset-0 w-full h-full" style={{ objectFit: 'fill' }} draggable={false} />

                    {prevKey && seam && !isMeasuringSeam && (
                      <>
                        {/* Overlap area (already photographed in the previous bay) */}
                        <div
                          className="absolute top-0 bottom-0 left-0 overflow-hidden bg-amber-500/25 pointer-events-none"
                          style={{ width: `${ovPct}%` }}
                        >
                          {showAlignmentCheck && prevSession?.capturedPhotoUrl && (
                            <img
                              src={prevSession.capturedPhotoUrl}
                              alt=""
                              className="absolute max-w-none opacity-60"
                              style={{
                                width: `${(100 / Math.max(0.05, ovPct / 100)) / seam.widthRatio}%`,
                                right: 0,
                                top: `calc(50% - ${seam.dyFrac * 100}%)`,
                                transform: 'translateY(-50%)'
                              }}
                            />
                          )}
                        </div>
                        {/* Count line: left of it belongs to the previous bay */}
                        <div
                          className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-400 pointer-events-none"
                          style={{ left: `${cutPct}%` }}
                        >
                          <span className="absolute top-2 left-1 whitespace-nowrap text-[9px] font-black text-emerald-200 bg-black/80 px-1 py-0.5 rounded border border-emerald-500/50">
                            Count line
                          </span>
                        </div>
                        {/* Draggable overlap edge */}
                        <div
                          role="slider"
                          aria-label={`Where ${prevLabel} ends`}
                          aria-valuenow={Math.round(ovPct)}
                          aria-valuemin={0}
                          aria-valuemax={80}
                          className="absolute top-0 bottom-0 w-11 -ml-[22px] flex items-center justify-center cursor-ew-resize touch-none"
                          style={{ left: `${ovPct}%` }}
                          onPointerDown={(e) => {
                            isDraggingSeamRef.current = true;
                            (e.currentTarget.parentElement as HTMLElement)?.setPointerCapture?.(e.pointerId);
                            handleSeamDrag(e.clientX);
                          }}
                        >
                          <div className="h-full w-[3px] bg-amber-400 shadow shadow-black" />
                          <div className="absolute w-7 h-12 rounded-lg bg-amber-400 text-black text-[11px] font-black flex items-center justify-center shadow-lg">
                            ⟷
                          </div>
                          <span className="absolute bottom-24 whitespace-nowrap text-[9px] font-black text-amber-200 bg-black/85 px-1.5 py-0.5 rounded border border-amber-500/50">
                            {prevLabel} ends here
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Header */}
                  <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between pointer-events-none">
                    <span className="text-[11px] font-black uppercase tracking-wider text-white">{label} &bull; Review before upload</span>
                    {prevKey && isMeasuringSeam && (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Loader2 size={12} className="animate-spin" /> Measuring overlap…
                      </span>
                    )}
                  </div>

                  {/* Footer: status + actions */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5 space-y-2 bg-gradient-to-t from-black/95 via-black/85 to-transparent">
                    {prevKey && seam && !isMeasuringSeam && (
                      <div className={`text-[11px] rounded-xl px-2.5 py-1.5 border ${
                        needsCheck ? 'bg-amber-500/15 border-amber-500/50 text-amber-200' : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      }`}>
                        {needsCheck ? (
                          <span className="flex items-start gap-1.5">
                            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                            <span>Couldn't measure the overlap reliably. Drag the amber edge to where {prevLabel}'s photo ends, or set it to the far left if there's no overlap.</span>
                          </span>
                        ) : (
                          <span>
                            Overlap with {prevLabel}: <strong>{Math.round(ovPct)}%</strong>
                            {seam.method === 'manual' ? ' (set by you)' : ` · ${confidenceText[seam.confidence]} confidence`}
                            . Bottles left of the count line are counted in {prevLabel}.
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleDiscardPending}
                        className="h-11 px-3 rounded-2xl border border-slate-600 bg-slate-900/90 text-slate-200 font-bold text-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
                      >
                        <RefreshCw size={14} />
                        <span>Retake</span>
                      </button>
                      {prevKey && seam && !isMeasuringSeam && prevSession?.capturedPhotoUrl && (
                        <button
                          type="button"
                          onClick={() => setShowAlignmentCheck((v) => !v)}
                          className={`h-11 px-3 rounded-2xl border font-bold text-xs active:scale-95 cursor-pointer ${
                            showAlignmentCheck ? 'bg-amber-500 text-black border-amber-300' : 'bg-slate-900/90 text-amber-200 border-amber-600/60'
                          }`}
                          title={`Overlay ${prevLabel} on the overlap to check the alignment`}
                        >
                          {showAlignmentCheck ? 'Hide check' : 'Check'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConfirmUpload}
                        disabled={isMeasuringSeam}
                        className="flex-1 h-11 rounded-2xl bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                      >
                        <Upload size={15} />
                        <span>Upload {label}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Capture Controls Dock: Desktop Left Sidebar + Mobile Bottom Shutter Bar */}
          {!showPostCapturePrompt && (
            <div className="order-2 md:order-1 md:w-[380px] md:shrink-0 flex flex-col justify-between shrink-0 pt-2 pb-6 sm:pb-3 px-3 md:p-5 mt-1 md:mt-0 bg-gradient-to-t md:bg-none from-black via-black/95 to-black/80 md:bg-[#132219]/90 backdrop-blur-md rounded-t-3xl md:rounded-3xl border-t md:border border-emerald-900/60 shadow-2xl z-20 select-none overflow-hidden">
              {/* Visual grip bar hint for mobile viewports */}
              <div className="w-10 h-1 bg-emerald-800/40 rounded-full mx-auto mb-1 md:hidden" />

              {/* Desktop-only Bay Queue & Operational Guidance */}
              <div className="hidden md:flex flex-col gap-3">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">
                      Shelf Capture
                    </h3>
                    <p className="text-[11px] text-emerald-300/80">
                      Target: {category} &bull; {currentSession?.label || 'Bay 1'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                    {capturedAisles.length} Captured
                  </span>
                </div>

                {/* Bay Sequence Progress Card */}
                <div className="p-3 rounded-2xl bg-black/50 border border-emerald-900/50 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Bay Sequence Queue
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {bayKeys.map((k, idx) => {
                      const s = aisleSessions[k];
                      const isCaptured = Boolean(s?.capturedPhotoUrl);
                      const isCurrent = currentAisle === k;
                      return (
                        <div
                          key={k}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                            isCurrent
                              ? 'bg-emerald-500/25 border-emerald-400 text-white ring-1 ring-emerald-400/50'
                              : isCaptured
                              ? 'bg-emerald-950/60 border-emerald-800/60 text-emerald-300'
                              : 'bg-black/40 border-slate-800 text-slate-500'
                          }`}
                        >
                          <span>{s?.label || `Bay ${idx + 1}`}</span>
                          {isCaptured && <CheckCircle2 size={12} className="text-emerald-400" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Guidance & Alignment Helper */}
                <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-800/30 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Layers size={13} className="text-emerald-400" />
                    <span>Alignment Guidance</span>
                  </div>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    {ghostGuideUrl
                      ? 'Align the faded edge on the left with the shelf you previously photographed to ensure seamless multi-bay stitching.'
                      : 'Hold camera upright and level with the middle shelf. Tap Shutter when the center line turns green.'}
                  </p>
                </div>
              </div>

              {/* Common Primary Actions: Shutter & Gallery Buttons */}
              <div className="space-y-2.5 pt-2 md:pt-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Primary 1: Shutter Button */}
                  <button
                    type="button"
                    onClick={handleManualShutter}
                    className="h-14 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] active:scale-[0.97] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950/60 flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer ring-2 ring-emerald-500/30"
                  >
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                      <Camera size={16} className="text-white stroke-[2.5]" />
                    </div>
                    <span>Shoot {currentSession?.label || 'Bay 1'}</span>
                  </button>

                  {/* Primary 2: Device Gallery / Library Upload */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={Boolean(pendingCapture)}
                    className={`h-14 border disabled:opacity-40 active:scale-[0.97] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                      isDark
                        ? 'bg-[#132219]/90 hover:bg-[#1b3024] text-emerald-200 border-emerald-700/60'
                        : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-950/20'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Upload size={15} className="text-emerald-400" />
                    </div>
                    <span>Gallery</span>
                  </button>
                </div>

                {/* Bottom auxiliary link: Done Shooting or Sample Shelf */}
                <div className="flex items-center justify-between px-1 pt-1 text-[11px]">
                  {capturedAisles.length > 0 ? (
                    <button
                      type="button"
                      onClick={handleDoneShooting}
                      className="text-emerald-400 font-bold flex items-center gap-1.5 hover:underline cursor-pointer bg-emerald-950/40 px-2.5 py-1.5 rounded-xl border border-emerald-800/40 w-full justify-center md:w-auto"
                    >
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span>Proceed to POSM ({capturedAisles.length} captured)</span>
                    </button>
                  ) : <div />}

                  {isDebugMode && (
                    <button
                      type="button"
                      onClick={handleUseDemoSample}
                      className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer hidden md:flex"
                    >
                      <span>Sample {category} ({currentSession?.label || 'Bay 1'})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dedicated Post-Capture Photo Review Screen: Split on Desktop, Stacked on Mobile */}
      {step === 'CAPTURE' && showPostCapturePrompt && (
        <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-5 overflow-hidden animate-fade-in py-1 select-none">
          {/* Controls Dock (Desktop Left Sidebar, Mobile Bottom Deck) */}
          <div className="order-2 md:order-1 md:w-[380px] md:shrink-0 flex flex-col justify-between shrink-0 pt-2 pb-5 sm:pb-3 px-3 md:p-5 mt-1 md:mt-0 bg-[#132219]/90 backdrop-blur-md rounded-t-3xl md:rounded-3xl border-t md:border border-emerald-900/60 shadow-2xl z-20 space-y-3">
            {/* Review Status Header */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20 animate-pulse" />
                  <span className="text-xs font-bold text-white tracking-wide">
                    {aisleSessions[lastCapturedAisle]?.label || 'Bay 1'} Captured
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400/90 font-mono bg-black/60 px-2.5 py-0.5 rounded-full border border-emerald-800/40">
                  Standard HD
                </span>
              </div>

              {/* Status Notice */}
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-emerald-200">
                      Photo Stored Locally
                    </span>
                    <span className="text-[10px] text-emerald-400/80">
                      Processed securely with n8n AI workflow
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono bg-black/50 px-2 py-0.5 rounded border border-emerald-800/40">
                  Ready
                </span>
              </div>

              {/* Desktop-only bay sequence recap */}
              <div className="hidden md:block p-3 rounded-2xl bg-black/40 border border-emerald-900/40 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Audit Progress
                </div>
                <p className="text-[11px] text-slate-300">
                  You have captured {capturedAisles.length} bay{capturedAisles.length > 1 ? 's' : ''} for {category}. You can proceed to the POSM compliance form or add another bay.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleDoneShooting}
                className="w-full h-12 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 hover:brightness-110 active:scale-[0.98] text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer transition-all border border-emerald-400/40"
              >
                <CheckCircle2 size={16} />
                <span>Proceed to POSM Form</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleRetakeBay(lastCapturedAisle)}
                  className="h-11 bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/50 active:scale-[0.98] text-rose-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <RefreshCw size={13} className="text-rose-400" />
                  <span>Retake Picture</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddNewBay}
                  className="h-11 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/50 active:scale-[0.98] text-emerald-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Plus size={14} className="text-emerald-400" />
                  <span>+ Add a Bay</span>
                </button>
              </div>
            </div>
          </div>

          {/* Large, High-Fidelity Photo Preview Frame (Desktop Right Canvas, Mobile Top Preview) */}
          <div
            onClick={() => setIsFullScreenOpen(true)}
            className="order-1 md:order-2 flex-1 relative min-h-[280px] md:min-h-0 rounded-3xl overflow-hidden border border-emerald-500/40 bg-black/95 flex items-center justify-center shadow-2xl cursor-pointer group"
          >
            {aisleSessions[lastCapturedAisle]?.capturedPhotoUrl ? (
              <img
                src={aisleSessions[lastCapturedAisle]?.capturedPhotoUrl!}
                alt="Captured Shelf Preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-slate-400 text-xs font-medium">No photo available</div>
            )}

            {/* Discreet Filename & Resolution Tag */}
            <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-slate-300 font-mono border border-white/10 shadow-md">
              {aisleSessions[lastCapturedAisle]?.capturedFileName || 'shelf-photo.jpg'}
            </div>

            {/* Tap to zoom tooltip hint */}
            <div className="absolute top-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] text-slate-200 opacity-75 group-hover:opacity-100 transition-opacity flex items-center gap-1 border border-white/10 shadow-md">
              <Maximize2 size={11} />
              <span>Tap to zoom</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: POSM QUESTIONNAIRE ================= */}
      {/* 1. Driven solely by step === 'POSM'. Split on Desktop, Compact on Mobile */}
      {step === 'POSM' && (
        <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-5 overflow-hidden py-1">
          {/* Left Column: POSM Form & Submission Controls */}
          <div className="order-1 md:w-[450px] md:shrink-0 flex flex-col justify-between h-full bg-[#132219]/90 border border-emerald-900/60 rounded-3xl p-3 sm:p-4 md:p-5 overflow-hidden shadow-xl space-y-3">
            {/* Header Card with In-Flight Analysis Background Indicator */}
            <div className={`p-3.5 rounded-2xl border space-y-2 shrink-0 ${
              isDark ? 'bg-black/40 border-emerald-900/50' : 'bg-white border-emerald-950/10 shadow-xs'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`text-sm font-black uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {category} POSM Compliance
                  </h3>
                  <p className={`text-[11px] ${isDark ? 'text-emerald-300/80' : 'text-slate-600'}`}>
                    Store shelf verification checklist
                  </p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${
                  isDark ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' : 'bg-emerald-100 text-emerald-900 border-emerald-200'
                }`}>
                  {capturedAisles.length} Bay{capturedAisles.length > 1 ? 's' : ''} Photographed
                </span>
              </div>

              {/* In-flight async analysis status */}
              <div className={`text-[11px] p-2 rounded-xl border flex items-center justify-between ${
                inFlightAisles.length > 0 
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                  : erroredAisles.length > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                <div className="flex items-center gap-2 truncate pr-2">
                  {inFlightAisles.length > 0 ? (
                    <Loader2 size={13} className="animate-spin text-amber-400 shrink-0" />
                  ) : erroredAisles.length > 0 ? (
                    <AlertCircle size={13} className="text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                  )}
                  <span className="truncate">
                    {inFlightAisles.length > 0
                      ? `Background analysis in flight for ${inFlightAisles.length} bay(s)…`
                      : erroredAisles.length > 0
                      ? `${erroredAisles.length} bay analysis failed`
                      : `All ${completedAisles.length} bay analyses complete`}
                  </span>
                </div>
                <span className="text-[10px] font-mono shrink-0">
                  {allCapturedDone ? 'Ready' : 'In Flight'}
                </span>
              </div>
            </div>

            {/* 3. Errored Bay Escape Hatch */}
            {erroredAisles.length > 0 && (
              <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-2 shrink-0">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-bold">
                  <AlertCircle size={15} className="text-rose-400 shrink-0" />
                  <span>Analysis failed for {erroredAisles.map((k) => aisleSessions[k]?.label || k).join(', ')}</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  A bay in error cannot proceed to results. Please retake to re-analyse.
                </p>
                <div className="space-y-1.5 pt-0.5">
                  {erroredAisles.map((k) => (
                    <div key={k} className="flex items-center justify-between p-2 rounded-xl bg-black/50 border border-rose-500/30">
                      <span className="text-xs font-bold text-white">
                        {aisleSessions[k]?.label || k}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRetakeBay(k)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <Camera size={13} />
                        <span>Retake {aisleSessions[k]?.label || k}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable POSM Questionnaire Form */}
            <div className="flex-1 overflow-y-auto space-y-2.5 px-0.5 min-h-0">
              {/* Toggle 1: Price Tag */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-black/30 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
              }`}>
                <div className="pr-2">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Tag size={14} className="text-emerald-400" />
                    Price tags legible &amp; present?
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Shelf edge label or neck promotional pricing active
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPriceTagOk(true)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      priceTagOk
                        ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriceTagOk(false)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      !priceTagOk
                        ? 'bg-rose-600 text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Toggle 2: Shelf Sticker */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-black/30 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
              }`}>
                <div className="pr-2">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <ShieldCheck size={14} className="text-emerald-400" />
                    POSM shelf strips &amp; stickers intact?
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Primary brand shelf divider &amp; rail branding in place
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPosmShelfSticker(true)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      posmShelfSticker
                        ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosmShelfSticker(false)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      !posmShelfSticker
                        ? 'bg-rose-600 text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {/* Toggle 3: Wobblers */}
              <div className={`p-3 rounded-2xl border flex items-center justify-between ${
                isDark ? 'bg-black/30 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
              }`}>
                <div className="pr-2">
                  <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    <Layers size={14} className="text-amber-400" />
                    Promotional wobblers deployed?
                  </h4>
                  <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Active campaign shelf talker or special offer danglers
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPosmWobblers(true)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      posmWobblers
                        ? 'bg-gradient-to-r from-[#047857] to-[#10B981] text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosmWobblers(false)}
                    className={`min-h-[38px] min-w-[50px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      !posmWobblers
                        ? 'bg-rose-600 text-white shadow-md'
                        : isDark ? 'bg-[#0B120E] text-slate-400 border border-emerald-900/40' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Submit POSM: gated on all captured bays status === 'done' */}
            <div className="shrink-0 space-y-2 pt-1 border-t border-emerald-900/40">
              {/* Live in-flight status line naming the bay still in flight */}
              {inFlightAisles.length > 0 && (
                <p className="text-xs font-semibold text-amber-400 text-center flex items-center justify-center gap-1.5 animate-pulse">
                  <Loader2 size={13} className="animate-spin text-amber-400 shrink-0" />
                  <span>
                    Analyse still running for {inFlightAisles.map((k) => aisleSessions[k]?.label || k).join(', ')}…
                  </span>
                </p>
              )}

              {erroredAisles.length > 0 && (
                <p className="text-xs font-semibold text-rose-400 text-center flex items-center justify-center gap-1.5">
                  <AlertCircle size={13} className="text-rose-400 shrink-0" />
                  <span>
                    Analysis failed for {erroredAisles.map((k) => aisleSessions[k]?.label || k).join(', ')}. Retake required.
                  </span>
                </p>
              )}

              <button
                type="button"
                disabled={!allCapturedDone || erroredAisles.length > 0}
                onClick={handlePosmSubmit}
                className={`w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  allCapturedDone && erroredAisles.length === 0
                    ? 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] active:scale-[0.99] text-white shadow-xl shadow-emerald-950/40 hover:brightness-110'
                    : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                }`}
              >
                <span>Submit POSM &bull; Proceed to Results</span>
                <CheckCircle2 size={16} />
              </button>

              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => setStep('CAPTURE')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer py-1"
                >
                  <Camera size={12} />
                  <span>Shoot Another Bay First</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column (Desktop Only): Shelf Reference Canvas */}
          <div className="order-2 hidden md:flex md:flex-1 h-full bg-black rounded-3xl border border-emerald-900/60 p-4 overflow-hidden relative flex-col justify-between shadow-2xl">
            <div className="flex items-center justify-between pb-2 z-10">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Shelf Photo Reference ({capturedAisles.length} Bay{capturedAisles.length > 1 ? 's' : ''})
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60">
                Visual Inspection Mode
              </span>
            </div>

            <div
              onClick={() => setIsFullScreenOpen(true)}
              className="flex-1 relative rounded-2xl overflow-hidden bg-black/95 flex items-center justify-center cursor-pointer group"
            >
              {aisleSessions[lastCapturedAisle]?.capturedPhotoUrl ? (
                <img
                  src={aisleSessions[lastCapturedAisle]?.capturedPhotoUrl!}
                  alt="Shelf Reference"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-xs font-medium">No photo available</div>
              )}

              <div className="absolute top-2.5 right-2.5 bg-black/75 px-2.5 py-1 rounded-lg text-[10px] text-slate-200 border border-white/10 opacity-75 group-hover:opacity-100 flex items-center gap-1">
                <Maximize2 size={11} />
                <span>Tap to enlarge</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[11px] text-emerald-300/80">
              Compare physical POSM status against the photographed shelf before proceeding to final count results.
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: RESULTS ================= */}
      {/* Responsive layout: Split 2-Column on Desktop/Tablet, 58/42 Zero-Scroll on Mobile */}
      {step === 'RESULTS' && (
        <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-5 h-full overflow-hidden">
          {/* Controls & Brand Facings Dock (Desktop Left Column, Mobile Bottom 42% Area) */}
          <div className="order-2 md:order-1 md:w-[460px] md:shrink-0 flex flex-col flex-1 md:h-full bg-transparent md:bg-[#132219]/80 md:rounded-3xl md:border md:border-emerald-900/60 md:p-4 overflow-hidden shadow-xl min-h-0 pt-1 md:pt-4">
            {/* Dynamic Results Tab Strip: ALL | BAY 1 | BAY 2 ... + Add Bay */}
            <div className="flex items-center justify-between pb-1.5 gap-1 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {/* Show ALL tab if more than 1 bay captured */}
                {capturedAisles.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setResultsAisleView('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                      resultsAisleView === 'ALL'
                        ? 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                        : isDark
                        ? 'bg-[#132219] text-emerald-300 border border-emerald-800/60 hover:text-white'
                        : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50'
                    }`}
                  >
                    <span>ALL</span>
                    <span className={`text-[9px] font-bold px-1 py-0.2 rounded ${
                      resultsAisleView === 'ALL'
                        ? 'bg-white/20 text-white'
                        : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                    }`}>
                      {combinedTotalFacings}f
                    </span>
                  </button>
                )}

                {/* Bay tabs: All captured bays are status === 'done' */}
                {capturedAisles.map((k) => {
                  const s = aisleSessions[k];
                  if (!s) return null;
                  const isSelected = (resultsAisleView === k) || (capturedAisles.length === 1 && resultsAisleView === 'ALL');

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        setResultsAisleView(k);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] text-white shadow-md shadow-emerald-950/40 ring-1 ring-emerald-400/50'
                          : isDark
                          ? 'bg-[#132219] text-emerald-300 border border-emerald-800/60 hover:text-white'
                          : 'bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50'
                      }`}
                    >
                      <span>{s.label}</span>
                      <span className={`text-[9px] font-black px-1 py-0.2 rounded ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-900'
                      }`}>
                        {s.totalFacings ?? 0}f
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Flexible + Add Bay Button: Always available to scan another bay */}
              <button
                type="button"
                onClick={handleAddNewBay}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-black text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                title="Shoot another bay"
              >
                <Plus size={11} />
                <span>Add Bay</span>
              </button>
            </div>

            {/* Bay overlap summary banner: each bottle in an overlap is counted by one bay only */}
            {seamSummaries.length > 0 && (() => {
              const isFlagged = (j: typeof seamSummaries[number]) =>
                !j.seam || (j.seam.method !== 'manual' && (j.seam.confidence === 'low' || j.seam.confidence === 'none'));
              const flaggedCount = seamSummaries.filter(isFlagged).length;
              const kept = duplicateReviewStatus === 'kept';
              const confidenceLabel = (j: typeof seamSummaries[number]) => {
                if (!j.seam) return 'No overlap set';
                if (j.seam.method === 'manual') return 'Set by rep';
                return { high: 'High', medium: 'Medium', low: 'Low', none: 'Not measured' }[j.seam.confidence];
              };
              return (
                <div className="pb-1.5 shrink-0 animate-fade-in space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDuplicatePanelExpanded(!isDuplicatePanelExpanded)}
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      kept
                        ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                        : flaggedCount > 0
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {flaggedCount > 0 && !kept ? <AlertTriangle size={13} className="shrink-0" /> : <Layers size={13} className="shrink-0" />}
                      <span className="truncate">
                        {kept
                          ? 'Overlap removal off: all detections kept'
                          : flaggedCount > 0
                          ? `Check ${flaggedCount} bay join${flaggedCount > 1 ? 's' : ''} · ${totalDuplicatesCount} counted once`
                          : `${totalDuplicatesCount} bottle${totalDuplicatesCount === 1 ? '' : 's'} in bay overlaps counted once`}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] shrink-0">
                      Details {isDuplicatePanelExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>

                  {/* Desktop Inline Expanded Overlap Panel */}
                  {isDuplicatePanelExpanded && (
                    <div className="hidden md:block p-2.5 rounded-2xl bg-black/90 border border-emerald-900/60 space-y-2 text-left">
                      {seamSummaries.map((j) => (
                        <div
                          key={`${j.leftKey}-${j.rightKey}`}
                          className={`flex items-center justify-between text-[11px] px-2 py-1.5 rounded-lg border ${
                            isFlagged(j) ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-[#132219]/80 border-emerald-900/50 text-emerald-100'
                          }`}
                        >
                          <span className="font-bold">
                            {j.leftLabel} ⟷ {j.rightLabel}
                            <span className="font-normal opacity-80"> · {j.seam ? `${Math.round(j.seam.overlapFracRight * 100)}% overlap` : 'overlap unknown'}</span>
                          </span>
                          <span className="flex items-center gap-1.5 shrink-0">
                            {!kept && <span className="font-mono">{j.excluded} once</span>}
                            <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full border border-current/40">{confidenceLabel(j)}</span>
                          </span>
                        </div>
                      ))}
                      <p className="text-[10px] text-emerald-300/80">
                        Open a bay tab to see count lines. <span className="text-red-400 font-bold">Red ✕</span> = counted in neighbouring bay. <span className="text-emerald-300 font-bold">Green</span> = counted here.
                      </p>
                      <button
                        type="button"
                        onClick={kept ? handleRemoveDuplicates : handleKeepAllDuplicates}
                        className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                      >
                        {kept ? 'Count overlaps once' : 'Keep all detections (turn off)'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Brand Facings Area: Scrollable rows and steppers */}
            <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between px-1 pb-1 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    isDark ? 'text-emerald-300/70' : 'text-emerald-950/70'
                  }`}>
                    Brand Facings
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                    isDark ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                  }`}>
                    {resultsAisleView === 'ALL' ? 'ALL' : viewSession?.label}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400">
                    Total: {resultsAisleView === 'ALL' ? combinedTotalFacings : (viewSession?.totalFacings ?? 0)}
                  </span>
                </div>

                {/* Add Competitor SKU button */}
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(true)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border flex items-center gap-1 transition-all cursor-pointer ${
                    isDark
                      ? 'text-emerald-300 hover:text-white bg-[#132219] hover:bg-[#1b3024] border-emerald-800/60'
                      : 'text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                  }`}
                >
                  <Plus size={11} />
                  <span>+ Brand</span>
                </button>
              </div>

              {/* Scrollable Brand List */}
              <div className="flex-1 min-h-0 overflow-y-auto space-y-1 px-0.5 pb-1 scroll-smooth">
                {allBrandKeys.map((brand) => {
                  const count = resultsAisleView === 'ALL' 
                    ? (combinedCounts[brand] ?? 0) 
                    : (viewSession?.counts[brand] ?? 0);
                  const upperBrand = brand.toUpperCase().trim();
                  const brandColor = BRAND_COLORS[upperBrand] || BRAND_COLORS[brand] || '#16A34A';
                  const isPrimary = category === 'Edible Oil'
                    ? ['YARA', 'ZAIN', 'DAWI', 'AL RAI', 'ADEERA'].includes(upperBrand)
                    : category === 'Flour'
                    ? ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM'].includes(upperBrand)
                    : ['QFM', 'QFM PREM', 'ZAIN'].includes(upperBrand);

                  const origCount = resultsAisleView === 'ALL'
                    ? combinedOrigCounts[brand]
                    : (viewSession?.seamAdjustedCounts?.[brand] ?? viewSession?.originalAiCounts[brand]);

                  // Delta tag appears ONLY once a value has changed from its initial count
                  const hasChangedFromInitial = origCount !== undefined && count !== origCount;
                  const diff = hasChangedFromInitial ? count - origCount : 0;

                  return (
                    <div
                      key={brand}
                      className={`border rounded-2xl px-3 py-1.5 flex items-center justify-between transition-all ${
                        hasChangedFromInitial
                          ? 'border-amber-500/60 bg-amber-500/5 ring-1 ring-amber-500/30'
                          : isPrimary
                          ? isDark
                            ? 'border-emerald-500/50 bg-[#132219]/90 shadow-sm'
                            : 'border-emerald-500/60 bg-emerald-50/50 shadow-xs'
                          : isDark
                          ? 'border-emerald-900/40 bg-[#132219]/60'
                          : 'border-emerald-950/10 bg-white shadow-xs'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: brandColor }}
                        />
                        <div>
                          <span className={`text-xs font-black flex items-center gap-1 ${
                            isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
                          }`}>
                            {brand}
                            {isPrimary && (
                              <span className={`text-[8px] font-black uppercase px-1 py-0.2 rounded border ${
                                isDark
                                  ? 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40'
                                  : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                              }`}>
                                {category === 'Edible Oil' ? 'QFI' : 'QFM'}
                              </span>
                            )}
                          </span>
                          {/* Delta tag ONLY once modified from initial count */}
                          {hasChangedFromInitial && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="text-[8px] font-extrabold text-amber-500 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                                Initial {origCount} &rarr; Adjusted {count} ({diff > 0 ? `+${diff}` : diff})
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Steppers visible at all times */}
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(brand, -1)}
                          className={`w-7 h-7 rounded-xl font-bold text-base flex items-center justify-center border active:scale-95 transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#0B120E] text-emerald-200 border-emerald-900/60 hover:border-emerald-600'
                              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-400'
                          }`}
                          aria-label={`Decrease ${brand}`}
                        >
                          -
                        </button>
                        <span className={`w-6 text-center text-sm font-black tabular-nums ${
                          isDark ? 'text-[#4ADE80]' : 'text-emerald-800'
                        }`}>
                          {count}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCount(brand, 1)}
                          className={`w-7 h-7 rounded-xl font-bold text-base flex items-center justify-center border active:scale-95 transition-all cursor-pointer ${
                            isDark
                              ? 'bg-[#0B120E] text-emerald-200 border-emerald-900/60 hover:border-emerald-600'
                              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-400'
                          }`}
                          aria-label={`Increase ${brand}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save Action Bar Dock */}
              <div className="pt-2 pb-1 space-y-1.5 shrink-0 border-t border-emerald-900/40">
                <button
                  type="button"
                  onClick={handleFinalSave}
                  disabled={!isSaveEnabled}
                  className="w-full py-3.5 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={16} />
                  <span>
                    Confirm &amp; Save Category Audit ({completedAisles.length} Bay{completedAisles.length > 1 ? 's' : ''})
                  </span>
                </button>

                <div className="flex items-center justify-center gap-4 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setStep('POSM')}
                    className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer py-1"
                  >
                    <ShieldCheck size={11} /> Review POSM
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('CAPTURE')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer py-1"
                  >
                    <Camera size={11} /> Return to Camera
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Shelf Image Preview Canvas (Desktop Right Column, Mobile Top 58% Canvas) */}
          <div 
            ref={shelfContainerRef}
            onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
            className="order-1 md:order-2 md:flex-1 h-[58%] md:h-full shrink-0 min-h-[220px] bg-black rounded-3xl border border-emerald-900/60 overflow-hidden shadow-2xl relative flex items-center justify-center cursor-pointer group"
            title="Tap photo to swap between Annotated and Raw view"
          >
            {isStitchingPanorama ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-emerald-300">
                <Loader2 size={24} className="animate-spin text-emerald-400 mb-2" />
                <p className="text-xs font-bold text-white">Assembling Multi-Bay Panorama…</p>
                <p className="text-[10px] text-emerald-400/80 mt-0.5">Stitching {capturedBaySessions.length} bays left-to-right</p>
              </div>
            ) : !resolvedImgSrc ? (
              <div className="flex flex-col items-center justify-center p-4 text-center text-amber-300">
                <ImageIcon size={26} className="text-amber-400 mb-1" />
                <p className="text-xs font-bold text-white">No Photo Available</p>
              </div>
            ) : (
              <img
                ref={shelfImgRef}
                src={resolvedImgSrc}
                alt="QFI Shelf Audit preview"
                className="w-full h-full object-contain block transition-all hover:scale-[1.01] active:scale-[0.99] cursor-zoom-in"
                onLoad={updateDisplayedImgRect}
                onError={() => setImgErrorLevel((prev) => Math.min(2, prev + 1))}
              />
            )}

            {/* Duplicate Bottles Shelf View Highlight: Pixel-Perfect Overlay */}
            <div 
              className="absolute pointer-events-none overflow-hidden z-10"
              style={
                displayedImgRect
                  ? {
                      left: `${displayedImgRect.left}px`,
                      top: `${displayedImgRect.top}px`,
                      width: `${displayedImgRect.width}px`,
                      height: `${displayedImgRect.height}px`
                    }
                  : {
                      inset: 0
                    }
              }
            >
              {renderSeamOverlays(false)}
            </div>

            {/* Tap-to-swap Mode indicator badge */}
            <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-1 pointer-events-none z-20">
              <span>
                {resultsAisleView === 'ALL' && capturedBaySessions.length > 1
                  ? (showRawPhotoComparison ? 'Raw Panorama (Tap for AI)' : 'Annotated Panorama (Tap for Raw)')
                  : (showRawPhotoComparison ? 'Raw Photo (Tap for AI)' : 'AI Annotated (Tap for Raw)')}
              </span>
            </div>

            {/* Enlarge / Full Screen Button */}
            {Boolean(resolvedImgSrc) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreenOpen(true);
                  setZoomScale(1);
                }}
                className="absolute top-2.5 right-2.5 z-20 px-2.5 py-1 rounded-xl bg-black/85 hover:bg-black border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white text-[10px] font-bold shadow-lg backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer group/btn"
                title="View image in full screen with zoom"
                aria-label="Enlarge image to full screen"
              >
                <Maximize2 size={12} className="stroke-[2.5] text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                <span>Enlarge</span>
              </button>
            )}

            {/* Bottom Scrim Info */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-emerald-100 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-900/70 shadow-sm pointer-events-auto z-20">
              <span className="font-semibold truncate max-w-[180px]">
                {resultsAisleView === 'ALL'
                  ? `${category} Panorama (${completedAisles.length} Bay${completedAisles.length > 1 ? 's' : ''})`
                  : `${category} • ${viewSession?.label || 'Bay'}`}
              </span>
              <span className="text-[#4ADE80] font-black shrink-0">
                {primaryLabel}: {primarySharePct}%
              </span>
            </div>
          </div>

          {/* Mobile-Only Slide-Up Sheet for Overlap Details */}
          {isDuplicatePanelExpanded && seamSummaries.length > 0 && (() => {
            const isFlagged = (j: typeof seamSummaries[number]) =>
              !j.seam || (j.seam.method !== 'manual' && (j.seam.confidence === 'low' || j.seam.confidence === 'none'));
            const kept = duplicateReviewStatus === 'kept';
            const confidenceLabel = (j: typeof seamSummaries[number]) => {
              if (!j.seam) return 'No overlap set';
              if (j.seam.method === 'manual') return 'Set by rep';
              return { high: 'High', medium: 'Medium', low: 'Low', none: 'Not measured' }[j.seam.confidence];
            };
            return (
              <>
                <div
                  className="fixed inset-0 bg-black/75 z-40 md:hidden"
                  onClick={() => setIsDuplicatePanelExpanded(false)}
                />
                <div className="fixed inset-x-0 bottom-0 z-50 md:hidden bg-[#0c1811] border-t border-emerald-500/50 rounded-t-3xl p-4 shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto animate-fade-in">
                  <div className="w-10 h-1 bg-emerald-800/40 rounded-full mx-auto" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Bay Overlap Deduplication
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsDuplicatePanelExpanded(false)}
                      className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
                    >
                      Close
                    </button>
                  </div>
                  {seamSummaries.map((j) => (
                    <div
                      key={`${j.leftKey}-${j.rightKey}`}
                      className={`flex items-center justify-between text-[11px] px-2.5 py-2 rounded-xl border ${
                        isFlagged(j) ? 'bg-amber-500/10 border-amber-500/40 text-amber-200' : 'bg-[#132219]/80 border-emerald-900/50 text-emerald-100'
                      }`}
                    >
                      <span className="font-bold">
                        {j.leftLabel} ⟷ {j.rightLabel}
                        <span className="font-normal opacity-80"> · {j.seam ? `${Math.round(j.seam.overlapFracRight * 100)}% overlap` : 'overlap unknown'}</span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {!kept && <span className="font-mono">{j.excluded} once</span>}
                        <span className="text-[9px] uppercase font-black px-1.5 py-0.5 rounded-full border border-current/40">{confidenceLabel(j)}</span>
                      </span>
                    </div>
                  ))}
                  <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                    Open a bay tab to see its count lines. <span className="text-red-400 font-bold">Red ✕</span> = counted in the neighbouring bay (tap to count here too). <span className="text-emerald-300 font-bold">Green</span> = counted here (tap to undo).
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (kept) handleRemoveDuplicates();
                      else handleKeepAllDuplicates();
                      setIsDuplicatePanelExpanded(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                  >
                    {kept ? 'Count overlaps once' : 'Keep all detections (turn off)'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Quick Add Brand Modal */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-xs border rounded-3xl p-4 shadow-2xl space-y-3 ${
            isDark ? 'bg-[#132219] border-emerald-900/60' : 'bg-white border-emerald-950/15'
          }`}>
            <h3 className={`text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
            }`}>
              Add Competitor SKU / Brand
            </h3>
            <form onSubmit={handleAddBrandSubmit} className="space-y-3">
              <div>
                <label className={`text-[10px] font-bold block mb-1 ${
                  isDark ? 'text-emerald-300/80' : 'text-slate-600'
                }`}>
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAZOLA, AFIA"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/40 border transition-all ${
                    isDark
                      ? 'bg-[#0B120E] border-emerald-900/60 text-[#F0FDF4] placeholder-slate-600'
                      : 'bg-emerald-50/40 border-emerald-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[10px] font-bold block mb-1 ${
                  isDark ? 'text-emerald-300/80' : 'text-slate-600'
                }`}>
                  Detected Facings
                </label>
                <div className={`flex items-center justify-between border rounded-xl px-3 py-1.5 ${
                  isDark ? 'bg-[#0B120E] border-emerald-900/60' : 'bg-emerald-50/40 border-emerald-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => setNewBrandCount(Math.max(1, newBrandCount - 1))}
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center active:scale-95 cursor-pointer ${
                      isDark ? 'bg-[#132219] text-white' : 'bg-white text-slate-900 shadow-xs'
                    }`}
                  >
                    -
                  </button>
                  <span className={`font-black text-sm tabular-nums ${
                    isDark ? 'text-[#4ADE80]' : 'text-emerald-800'
                  }`}>
                    {newBrandCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewBrandCount(newBrandCount + 1)}
                    className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center active:scale-95 cursor-pointer ${
                      isDark ? 'bg-[#132219] text-white' : 'bg-white text-slate-900 shadow-xs'
                    }`}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className={`flex-1 py-2 text-xs font-semibold rounded-xl cursor-pointer ${
                    isDark ? 'text-slate-400 hover:text-white bg-[#0B120E]' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-black text-white bg-gradient-to-r from-[#047857] to-[#10B981] rounded-xl hover:brightness-110 shadow-md shadow-emerald-950/30 cursor-pointer"
                >
                  Add Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Screen Image Lightbox Modal with Pan & Zoom */}
      {isFullScreenOpen && currentLightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image preview with zoom"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-black/90 border-b border-emerald-900/60 shrink-0 z-30 gap-2">
            <div className="flex items-center gap-2 truncate pr-1">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[120px] sm:max-w-xs">
                {step === 'CAPTURE'
                  ? `${category} • ${aisleSessions[lastCapturedAisle]?.label || currentSession?.label || 'Bay 1'} (Photo Preview)`
                  : resultsAisleView === 'ALL'
                  ? `${category} Panorama (${completedAisles.length} Bay${completedAisles.length > 1 ? 's' : ''})`
                  : `${category} • ${viewSession?.label || 'Bay'}`}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 shrink-0 hidden xs:inline">
                {step === 'CAPTURE' ? 'Original Photo' : (showRawPhotoComparison ? 'Raw' : 'AI')}
              </span>
            </div>

            {/* Action & Zoom Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Toggle Raw / Annotated (Only on Results Tab) */}
              {step === 'RESULTS' && (
                <button
                  type="button"
                  onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
                  className="px-2 sm:px-2.5 py-1 text-[11px] font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                  title="Toggle between AI annotated and raw view"
                >
                  {showRawPhotoComparison ? 'AI' : 'Raw'}
                </button>
              )}

              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(1, Number((prev - 0.5).toFixed(1))))}
                disabled={zoomScale <= 1}
                className="p-1.5 rounded-xl bg-[#132219] hover:bg-[#1a3023] border border-emerald-800/60 text-emerald-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                title="Zoom Out (-50%)"
                aria-label="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>

              {/* Zoom Level Indicator / Reset */}
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-1.5 sm:px-2 py-1 text-xs font-mono font-black text-emerald-300 bg-[#132219] hover:bg-[#1a3023] border border-emerald-800/60 rounded-xl hover:text-white active:scale-95 transition-all cursor-pointer min-w-[44px] text-center"
                title="Reset zoom to 100%"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))))}
                disabled={zoomScale >= 4}
                className="p-1.5 rounded-xl bg-[#132219] hover:bg-[#1a3023] border border-emerald-800/60 text-emerald-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all cursor-pointer"
                title="Zoom In (+50%)"
                aria-label="Zoom In"
              >
                <ZoomIn size={15} />
              </button>

              {/* Prominent Normal View / Exit Button for Mobile & PC */}
              <button
                type="button"
                onClick={() => {
                  setIsFullScreenOpen(false);
                  setZoomScale(1);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 border border-rose-400/80 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer ml-1"
                title="Exit full screen and return to normal view (Esc)"
                aria-label="Return to normal view"
              >
                <Minimize2 size={14} className="stroke-[2.5]" />
                <span className="font-bold">Normal View</span>
              </button>
            </div>
          </div>

          {/* Center Zoomable Viewport */}
          <div 
            className="flex-1 overflow-auto flex items-center justify-center p-3 relative cursor-grab active:cursor-grabbing"
            onDoubleClick={() => {
              setZoomScale((prev) => (prev > 1 ? 1 : 2));
            }}
          >
            <div 
              className="relative transition-transform duration-200 ease-out origin-center flex items-center justify-center max-w-full max-h-full"
              style={{ transform: `scale(${zoomScale})` }}
            >
              <img
                src={currentLightboxImage}
                alt="Enlarged shelf preview"
                className="max-h-[82vh] max-w-[96vw] object-contain shadow-2xl rounded-xl"
                draggable={false}
              />
              {/* Duplicate Bottles Overlay in Lightbox (Only in RESULTS step) */}
              {step === 'RESULTS' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {renderSeamOverlays(true)}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Information & Mobile Action Footer */}
          <div className="px-3 sm:px-4 py-2 bg-black/90 border-t border-emerald-900/60 flex items-center justify-between text-xs text-emerald-200 shrink-0 z-30 gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="text-[11px] text-emerald-300/80 font-medium truncate">
                Double-tap or pinch to zoom &bull; Drag to pan
              </span>
              <span className="hidden md:inline text-[10px] text-emerald-400/60">
                (Press Esc or tap Normal View)
              </span>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {step === 'CAPTURE' ? (
                <span className="font-mono text-emerald-300 text-xs bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                  {aisleSessions[lastCapturedAisle]?.capturedFileName || 'captured_photo.jpg'}
                </span>
              ) : (
                <span className="font-bold text-[#4ADE80] text-xs">
                  {primaryLabel}: {primarySharePct}% &bull; {resultsAisleView === 'ALL' ? combinedTotalFacings : (viewSession?.totalFacings ?? 0)}f
                </span>
              )}

              {/* Bottom Quick Normal View Button for Easy Thumb Reach */}
              <button
                type="button"
                onClick={() => {
                  setIsFullScreenOpen(false);
                  setZoomScale(1);
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow active:scale-95 transition-all cursor-pointer border border-rose-400/40"
                title="Return to normal view"
                aria-label="Return to normal view"
              >
                <Minimize2 size={13} className="stroke-[2.5]" />
                <span>Normal View</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
