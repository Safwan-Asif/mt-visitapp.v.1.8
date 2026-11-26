import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Camera,
  ChevronLeft,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Layers,
  Image as ImageIcon,
  Upload,
  Loader2,
  Check,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  ZapOff,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Info,
  ClipboardCheck
} from 'lucide-react';
import {
  CategoryType,
  Outlet,
  CategoryAuditRecord,
  BoundingBox,
  UserProfile,
  AisleSessionData,
  AisleStatus,
  DuplicateMatch,
  BayDuplicateReport,
  PlanogramComplianceResult,
  PlanogramRecord
} from '../types';
import {
  CATEGORY_IMAGES,
  CATEGORIES,
  BRAND_COLORS,
  CATEGORY_BRANDS
} from '../constants';
import {
  CategoryMonogramBadge,
  AnimatedCompletionCircle
} from './pjp/PjpPrimitives';
import { 
  sendAuditToN8n, 
  N8nTransmissionResult, 
  canonicalizeBrand
} from '../services/n8nService';
import {
  autoSaveAuditToGoogleSheet,
  toDirectDriveImageUrl,
  toAlternativeDriveImageUrl,
  transformQuestionnaireToTables,
  syncFieldIntelToGoogleSheets,
  syncPlanogramScorecardAck
} from '../services/googleSheetsService';
import { normalizeBrandAlias } from '../config/planogramConfig';
import {
  fetchActivePlanograms,
  findActivePlanogramForOutlet,
  evaluatePlanogramCompliance
} from '../services/planogramService';
import { PlanogramScorecard } from './PlanogramScorecard';
import { QuestionnaireRenderer } from './QuestionnaireRenderer';
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
  planRows?: Array<{ row: number; faces: Record<string, number> }>;
  rowsFound?: number;
  unmappedBrands?: string[];
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
  const unmappedBrandsSet = new Set<string>();
  for (const b of standardBrands) {
    counts[b] = 0;
  }

  for (const [k, v] of Object.entries(rawCounts)) {
    const aliasRes = normalizeBrandAlias(k, catKey);
    const num = typeof v === 'number' ? v : Number(v);
    if (!isNaN(num)) {
      if (aliasRes.isUnmapped && num > 0) {
        unmappedBrandsSet.add(aliasRes.raw || aliasRes.canonical);
      }
      counts[aliasRes.uiBrand] = (counts[aliasRes.uiBrand] || 0) + num;
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
  const boxes = Array.isArray(target?.boxes) ? target.boxes : [];

  // Scan bounding boxes for unmapped brands as well
  boxes.forEach((box: any) => {
    const rawLabel = box?.brand || box?.label || box?.class || box?.name;
    if (rawLabel) {
      const aliasRes = normalizeBrandAlias(String(rawLabel), catKey);
      if (aliasRes.isUnmapped) {
        unmappedBrandsSet.add(aliasRes.raw || aliasRes.canonical);
      }
    }
  });

  // Extract explicit planRows if provided by n8n
  const rawPlanRows = Array.isArray(target?.planRows)
    ? target.planRows
    : Array.isArray(target?.plan_rows)
    ? target.plan_rows
    : Array.isArray(target?.rows)
    ? target.rows
    : undefined;

  const planRows = Array.isArray(rawPlanRows)
    ? rawPlanRows.map((r: any, idx: number) => ({
        row: Number(r?.row) || idx + 1,
        faces: r?.faces && typeof r.faces === 'object' ? r.faces : {}
      }))
    : undefined;

  const rowsFound =
    target?.rows_found !== undefined && !isNaN(Number(target.rows_found))
      ? Number(target.rows_found)
      : target?.rowsFound !== undefined && !isNaN(Number(target.rowsFound))
      ? Number(target.rowsFound)
      : undefined;

  const unmappedBrands = Array.from(unmappedBrandsSet);
  const needsReview = Boolean(target?.needs_review ?? target?.needsReview ?? false) || unmappedBrands.length > 0;

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
    planRows,
    rowsFound,
    unmappedBrands,
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
  planRows?: Array<{ row: number; faces: Record<string, number> }>;
  rowsFound?: number;
  unmappedBrands?: string[];
  removedDuplicates?: DuplicateMatch[];
  /** Seam with the previous (left) bay — measured on capture, confirmed by the rep before upload. */
  seam?: SeamInfo | null;
  /** True when the photo was taken with the previous-bay guide visible in the viewfinder. */
  shotWithGuide?: boolean;
  /** AI counts after the overlap with neighbouring bays is removed (baseline for the discrepancy log). */
  seamAdjustedCounts?: Record<string, number>;
  n8nStatus: any;
  isManualFallback?: boolean;
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
        planRows: existing.planRows,
        rowsFound: existing.rowsFound,
        unmappedBrands: existing.unmappedBrands,
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
  onSaveAudit: (record: CategoryAuditRecord, deferExit?: boolean) => void;
  onBack: () => void;
  onSelectNextCategory?: (category: CategoryType) => void;
  userProfile?: UserProfile;
}

export const CameraWorkflowScreen: React.FC<CameraWorkflowScreenProps> = ({
  outlet,
  category,
  existingAudit,
  onSaveAudit,
  onBack,
  onSelectNextCategory,
  userProfile
}) => {
  const { isDark } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // PJP 2.0 step state machine: SETUP -> CAPTURE -> POSM -> RESULTS -> CATEGORY_COMPLETE (-> SCORECARD)
  const [step, setStep] = useState<
    'SETUP' | 'CAPTURE' | 'POSM' | 'RESULTS' | 'CATEGORY_COMPLETE' | 'SCORECARD'
  >(existingAudit ? 'RESULTS' : 'SETUP');

  // Screen 06: Aisle & Orientation configuration
  const [aisleMode, setAisleMode] = useState<'single' | 'multi'>(() =>
    Object.keys(buildInitialAisleSessions(existingAudit)).length > 1 ? 'multi' : 'single'
  );
  const [captureOrientation, setCaptureOrientation] = useState<'horizontal' | 'vertical'>(
    'horizontal'
  );

  const [scorecardResult, setScorecardResult] = useState<PlanogramComplianceResult | null>(
    existingAudit?.planogramCompliance || null
  );
  const [isSubmittingAck, setIsSubmittingAck] = useState<boolean>(false);
  const [isSavingAudit, setIsSavingAudit] = useState<boolean>(false);
  const [activePlanogramsCache, setActivePlanogramsCache] = useState<PlanogramRecord[]>([]);

  // Generation token map to drop stale async AI responses after retake/manual fallback
  const captureGenRef = useRef<Record<string, number>>({});

  // Ensure active planogram cache is warmed for this outlet/category
  useEffect(() => {
    fetchActivePlanograms(false)
      .then((list) => {
        if (list.length > 0) setActivePlanogramsCache(list);
      })
      .catch(() => {});
  }, [outlet.id]);

  // Hidden native file inputs for hardware camera & photo gallery fallback
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Bay Sessions (starts with Bay 1; expands to Bay 2, Bay 3, ... in Multiple Aisle mode)
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

  // Post-capture tracking
  const [showPostCapturePrompt, setShowPostCapturePrompt] = useState<boolean>(false);
  const [lastCapturedAisle, setLastCapturedAisle] = useState<string>('bay_1');
  const [posmActiveBayKey, setPosmActiveBayKey] = useState<string>('bay_1');

  // Visit ID for visit-scoped autosave & table key columns
  const visitId = useMemo(
    () => outlet.visitId || `visit_${outlet.id}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}`,
    [outlet]
  );

  // Field-Intel Questionnaire Answers & Multi-Products
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, any>>(() => {
    return existingAudit?.questionnaireAnswers || {};
  });
  const [questionnaireNewProducts, setQuestionnaireNewProducts] = useState<Array<Record<string, any>>>(() => {
    return existingAudit?.questionnaireNewProducts || [];
  });

  // POSM Questionnaire state
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
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);

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

          // Check hardware torch support for Screen 07 flash pill
          setTorchSupported(Boolean(capabilities.torch));
          setTorchEnabled(false);

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
      setTorchSupported(false);
      setTorchEnabled(false);

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

  const handleToggleTorch = useCallback(async () => {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    const track = stream?.getVideoTracks?.()?.[0];
    if (!track) return;
    const caps: any = track.getCapabilities ? track.getCapabilities() : {};
    if (!caps.torch) {
      setTorchSupported(false);
      return;
    }
    const next = !torchEnabled;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as any] });
      setTorchEnabled(next);
    } catch {
      setTorchSupported(false);
      setTorchEnabled(false);
    }
  }, [torchEnabled]);

  useEffect(() => {
    if (step !== 'CAPTURE') {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraStreamActive(false);
      setTorchEnabled(false);
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
      setTorchEnabled(false);
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

  // Dynamic bay lists (sorted numerically: bay_1, bay_2, bay_3, ...)
  const bayKeys = useMemo(() => {
    return Object.keys(aisleSessions).sort((a, b) => {
      const na = parseInt(a.replace('bay_', ''), 10);
      const nb = parseInt(b.replace('bay_', ''), 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
  }, [aisleSessions]);

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

  // Previous bay whose right edge is shown as a faded guide while shooting the current bay (Bay 2, Bay 3, Bay 4, ...)
  const ghostGuideBayKey = step === 'CAPTURE' && !pendingCapture ? previousCapturedBayKey(currentAisle) : null;
  const ghostGuideUrl = ghostGuideBayKey ? aisleSessions[ghostGuideBayKey]?.capturedPhotoUrl || null : null;

  const [prevBayGhostStripUrl, setPrevBayGhostStripUrl] = useState<string>('');

  useEffect(() => {
    if (!ghostGuideUrl) {
      setPrevBayGhostStripUrl('');
      return;
    }
    let active = true;
    setPrevBayGhostStripUrl('');
    extractRightOverlapStrip(ghostGuideUrl, GHOST_GUIDE_FRAC).then((strip) => {
      if (active && strip) setPrevBayGhostStripUrl(strip);
    });
    return () => {
      active = false;
    };
  }, [ghostGuideUrl]);

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

  // Live preview of Planogram Compliance & OOS count for Screen 14 KPI tiles
  const livePlanogramMetrics = useMemo(() => {
    const activePlanogram = findActivePlanogramForOutlet(outlet, category, activePlanogramsCache);
    if (!activePlanogram) {
      return { hasPlanogram: false, score: null as number | null, oosCount: null as number | null };
    }
    const bayInputs = completedAisles.map((k, idx) => {
      const s = aisleSessions[k];
      return {
        key: s?.key || k,
        label: s?.label || `Bay ${idx + 1}`,
        boundingBoxes: s?.boxes || [],
        boxes: s?.boxes || [],
        planRows: s?.planRows,
        unmappedBrands: s?.unmappedBrands
      };
    });
    const collectedUnmapped = Array.from(
      new Set(completedAisles.flatMap((k) => aisleSessions[k]?.unmappedBrands || []))
    );
    const evalRes = evaluatePlanogramCompliance({
      outlet,
      category,
      planogram: activePlanogram,
      confirmedCounts: combinedCounts,
      initialAiCounts: combinedOrigCounts,
      actualTotalFacings: combinedTotalFacings,
      actualPrimarySharePct: primarySharePct,
      baySessions: bayInputs,
      excludedBoxIds: removedDuplicateBoxIds,
      unmappedBrands: collectedUnmapped
    });
    return {
      hasPlanogram: evalRes.hasPlanogram,
      score: evalRes.hasPlanogram ? evalRes.overallScore : null,
      oosCount: evalRes.missingOwnBrands.length
    };
  }, [
    outlet,
    category,
    activePlanogramsCache,
    completedAisles,
    aisleSessions,
    combinedCounts,
    combinedOrigCounts,
    combinedTotalFacings,
    primarySharePct,
    removedDuplicateBoxIds
  ]);

  // True provenance check for Screen 14: never report fallback/manual as AI Verified
  const resultsProvenance = useMemo(() => {
    const targetSessions =
      resultsAisleView === 'ALL'
        ? completedAisles.map((k) => aisleSessions[k]).filter(Boolean)
        : [viewSession].filter(Boolean);

    const hasManualOrFallback =
      erroredAisles.length > 0 ||
      targetSessions.some(
        (s) =>
          Boolean(s?.isManualFallback) ||
          s?.status === 'error' ||
          s?.n8nStatus?.source === 'simulated_fallback' ||
          s?.n8nStatus?.source === 'manual_fallback'
      );

    const hasEdited = Object.keys(combinedCounts).some(
      (b) => (combinedCounts[b] ?? 0) !== (combinedOrigCounts[b] ?? 0)
    );

    if (hasManualOrFallback) {
      return { mode: 'manual' as const, label: 'Manual Entry — Verify Counts' };
    }
    if (hasEdited) {
      return { mode: 'adjusted' as const, label: 'AI + Rep Adjusted' };
    }
    return { mode: 'ai_verified' as const, label: 'AI Verified ✓' };
  }, [
    resultsAisleView,
    completedAisles,
    aisleSessions,
    viewSession,
    erroredAisles,
    combinedCounts,
    combinedOrigCounts
  ]);

  // 2. Overlapping Async Upload & Analysis Handler (Protected by per-bay capture generation token)
  const startAsyncBayAnalysis = useCallback(
    async (
      targetAisle: string,
      file: File | null,
      dataUrl: string,
      seamOpts: { seam?: SeamInfo | null; shotWithGuide?: boolean; captureDims?: { width: number; height: number } } = {}
    ) => {
      const startTime = Date.now();
      const nextToken = (captureGenRef.current[targetAisle] || 0) + 1;
      captureGenRef.current[targetAisle] = nextToken;

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
          isManualFallback: false,
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

        // Guard against stale response from superseded retake or manual fallback
        if (captureGenRef.current[targetAisle] !== nextToken) {
          console.log(`[Bay ${targetAisle}] Dropping stale AI response (token ${nextToken}).`);
          return;
        }

        const normalized = normalizeN8nAuditResponse(
          result.rawResponse || result.rawNormalized || result,
          category
        );

        const isSimulated = result.source === 'simulated_fallback' || !result.success;
        const duration = Math.round((Date.now() - startTime) / 1000);

        setAisleSessions((prev) => {
          const currentPrev = prev[targetAisle];
          const newDimensions =
            (normalized.dimensionsExplicit && normalized.dimensions) ||
            seamOpts.captureDims ||
            currentPrev?.naturalDimensions ||
            normalized.dimensions || { width: 800, height: 800 };
          return {
            ...prev,
            [targetAisle]: {
              ...currentPrev,
              status: 'done',
              isManualFallback: isSimulated,
              counts: { ...normalized.counts },
              rawCounts: { ...normalized.counts },
              originalAiCounts: { ...normalized.counts },
              totalFacings: normalized.total_facings,
              annotatedPhotoUrl: normalized.annotated_image || null,
              boxes: normalized.boxes || [],
              rawBoxes: normalized.boxes || [],
              planRows: normalized.planRows,
              rowsFound: normalized.rowsFound,
              unmappedBrands: normalized.unmappedBrands,
              naturalDimensions: newDimensions,
              n8nStatus: {
                ...result,
                counts: normalized.counts,
                totalFacings: normalized.total_facings,
                needsReview: normalized.needs_review,
                annotatedImageUrl: normalized.annotated_image,
                planRows: normalized.planRows,
                rowsFound: normalized.rowsFound,
                unmappedBrands: normalized.unmappedBrands
              },
              analysisDurationSeconds: duration
            }
          };
        });
      } catch (err: any) {
        if (captureGenRef.current[targetAisle] !== nextToken) return;
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

  // Retry Vision AI for errored or fallback bays without losing captured photos
  const handleRetryAiAnalysis = useCallback(() => {
    const targets = Object.values(aisleSessions).filter(
      (s) =>
        s.capturedPhotoUrl &&
        (s.status === 'error' ||
          s.isManualFallback ||
          s.n8nStatus?.source === 'simulated_fallback' ||
          s.n8nStatus?.source === 'manual_fallback')
    );
    const list =
      targets.length > 0
        ? targets
        : Object.values(aisleSessions).filter((s) => Boolean(s.capturedPhotoUrl));
    list.forEach((s) => {
      if (s.capturedPhotoUrl) {
        startAsyncBayAnalysis(s.key, s.capturedFile, s.capturedPhotoUrl, {
          seam: s.seam ?? null,
          shotWithGuide: Boolean(s.shotWithGuide),
          captureDims: s.naturalDimensions
        });
      }
    });
  }, [aisleSessions, startAsyncBayAnalysis]);

  // Manual fallback escape hatch from Screen 08 (never writes fake DEFAULT_AI_COUNTS)
  const activateManualFallbackForInFlightBays = useCallback(() => {
    const zeroCounts: Record<string, number> = {};
    standardBrands.forEach((b) => {
      zeroCounts[b] = 0;
    });

    setAisleSessions((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        const s = next[k];
        if (!s || !s.capturedPhotoUrl) return;
        if (s.status !== 'done') {
          captureGenRef.current[k] = (captureGenRef.current[k] || 0) + 1;
          next[k] = {
            ...s,
            status: 'done',
            isManualFallback: true,
            counts: { ...zeroCounts },
            rawCounts: { ...zeroCounts },
            originalAiCounts: { ...zeroCounts },
            totalFacings: 0,
            errorMessage: undefined,
            n8nStatus: {
              source: 'manual_fallback',
              success: false,
              message: 'Manual facing entry selected by executive'
            }
          };
        }
      });
      return next;
    });
    setStep('RESULTS');
    setResultsAisleView('ALL');
  }, [standardBrands]);

  // Apply Screen 06 Aisle Mode selection (Single Aisle vs Multiple Aisle)
  const handleSelectAisleMode = (mode: 'single' | 'multi') => {
    setAisleMode(mode);
    setAisleSessions((prev) => {
      const next = { ...prev };
      if (mode === 'multi') {
        if (!next.bay_2) {
          next.bay_2 = {
            key: 'bay_2',
            label: 'Bay 2',
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
        }
      } else {
        Object.keys(next).forEach((k) => {
          if (k !== 'bay_1' && !next[k]?.capturedPhotoUrl && !next[k]?.annotatedPhotoUrl) {
            delete next[k];
          }
        });
        if (currentAisle !== 'bay_1' && !next[currentAisle]) {
          setCurrentAisle('bay_1');
        }
      }
      return next;
    });
  };

  // Retake bay escape hatch Handler: invalidates in-flight token and returns to CAPTURE for that bay only
  const handleRetakeBay = (bayKey: string) => {
    captureGenRef.current[bayKey] = (captureGenRef.current[bayKey] || 0) + 1;
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
          isManualFallback: false,
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

  /** Rep tapped Confirm: store seam, send photo for background AI analysis, then advance to the next bay or finish to Questionnaire. */
  const handleConfirmUpload = (proceedToNextBay: boolean = false) => {
    if (!pendingCapture) return;
    const { bayKey, file, dataUrl, width, height, shotWithGuide, isRetake } = pendingCapture;
    const captureDims = width && height ? { width, height } : undefined;

    startAsyncBayAnalysis(bayKey, file, dataUrl, { seam: pendingSeam, shotWithGuide, captureDims });

    // If a middle bay was re-shot, re-measure seam with right neighbour
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
    setShowPostCapturePrompt(false);

    if (isRetake) {
      setRetakeBayKey(null);
      setCameraStreamActive(false);
      setPosmActiveBayKey(bayKey);
      setStep('POSM');
      return;
    }

    // Multiple Aisle flow: advance to the next uncaptured bay or dynamically allocate Bay 3, Bay 4, ...
    if (aisleMode === 'multi' && proceedToNextBay) {
      const curIdx = bayKeys.indexOf(bayKey);
      const existingNextEmpty = bayKeys.find(
        (k, idx) =>
          idx > curIdx &&
          !aisleSessions[k]?.capturedPhotoUrl &&
          !aisleSessions[k]?.annotatedPhotoUrl
      );

      let targetNextKey = existingNextEmpty;
      if (!targetNextKey) {
        const maxNum = Math.max(
          bayKeys.length,
          ...bayKeys.map((k) => parseInt(k.replace('bay_', ''), 10) || 0)
        );
        const nextNum = maxNum + 1;
        targetNextKey = `bay_${nextNum}`;
        const newSession: AisleSession = {
          key: targetNextKey,
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
        setAisleSessions((prev) => ({
          ...prev,
          [targetNextKey!]: newSession
        }));
      }

      setCurrentAisle(targetNextKey);
      autoCaptureTriggeredRef.current = false;
      levelHoldStartTimeRef.current = null;
      return;
    }

    // Rep chose to finish capturing -> immediately launch Section 1 Questionnaire while AI runs concurrently
    setCameraStreamActive(false);
    setCurrentAisle(bayKey);
    setPosmActiveBayKey(bayKey);
    setStep('POSM');
  };

  /** Rep rejected the photo: discard it and return to the camera for the same bay. */
  const handleDiscardPending = () => {
    const discarded = pendingCapture;
    if (discarded) {
      setAisleSessions((prev) => {
        const cur = prev[discarded.bayKey];
        if (!cur || cur.capturedPhotoUrl !== discarded.dataUrl) return prev;
        return {
          ...prev,
          [discarded.bayKey]: {
            ...cur,
            capturedFile: null,
            capturedPhotoUrl: null,
            capturedFileName: null
          }
        };
      });
    }
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

  // Flexible Dynamic Bay Addition (Transmits confirmed bay to n8n if still idle, then adds next bay)
  const handleAddNewBay = () => {
    setAisleMode('multi');
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

    // Transmit the confirmed bay to n8n workflow if not yet started
    const confirmedBayKey = lastCapturedAisle || currentAisle;
    const confirmedSession = aisleSessions[confirmedBayKey];
    if (confirmedSession && confirmedSession.capturedPhotoUrl && confirmedSession.status === 'idle') {
      startAsyncBayAnalysis(confirmedBayKey, confirmedSession.capturedFile, confirmedSession.capturedPhotoUrl);
    }

    const existingEmpty = bayKeys.find(
      (k) => !aisleSessions[k]?.capturedPhotoUrl && !aisleSessions[k]?.annotatedPhotoUrl
    );
    if (existingEmpty) {
      setCurrentAisle(existingEmpty);
      setStep('CAPTURE');
      return;
    }

    const maxNum = Math.max(
      bayKeys.length,
      ...bayKeys.map((k) => parseInt(k.replace('bay_', ''), 10) || 0)
    );
    const nextNum = maxNum + 1;
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

    setAisleSessions((prev) => ({
      ...prev,
      [nextKey]: newSession
    }));
    setCurrentAisle(nextKey);
    setStep('CAPTURE');
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

    setPosmActiveBayKey(lastCapturedAisle || currentAisle || capturedAisles[0] || 'bay_1');
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

  // Save Path with duplicate click guard
  const isSaveEnabled = completedAisles.length >= 1 && !isSavingAudit;

  const handleProceedToScorecard = async () => {
    if (!isSaveEnabled) return;
    try {
      let latestPlanograms: PlanogramRecord[] = [];
      try {
        latestPlanograms = await fetchActivePlanograms(false);
      } catch {
        latestPlanograms = [];
      }
      const activePlanogram = findActivePlanogramForOutlet(outlet, category, latestPlanograms);

      const bayDiagnosticInputs = completedAisles.map((k, idx) => {
        const s = aisleSessions[k];
        return {
          key: s?.key || k,
          label: s?.label || `Bay ${idx + 1}`,
          boundingBoxes: s?.boxes || [],
          boxes: s?.boxes || [],
          planRows: s?.planRows,
          unmappedBrands: s?.unmappedBrands
        };
      });

      const collectedUnmapped = Array.from(
        new Set(completedAisles.flatMap((k) => aisleSessions[k]?.unmappedBrands || []))
      );

      const complianceResult = evaluatePlanogramCompliance({
        outlet,
        category,
        planogram: activePlanogram,
        confirmedCounts: combinedCounts,
        initialAiCounts: combinedOrigCounts,
        actualTotalFacings: combinedTotalFacings,
        actualPrimarySharePct: primarySharePct,
        baySessions: bayDiagnosticInputs,
        excludedBoxIds: removedDuplicateBoxIds,
        unmappedBrands: collectedUnmapped
      });

      setScorecardResult(complianceResult);
      setStep('SCORECARD');
    } catch (err) {
      console.warn('Scorecard transition note, falling back to direct save:', err);
      handleFinalSave();
    }
  };

  const handleFinalSave = async () => {
    if (!isSaveEnabled || isSavingAudit) return;
    setIsSavingAudit(true);
    try {

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
        planRows: s.planRows,
        rowsFound: s.rowsFound,
        unmappedBrands: s.unmappedBrands,
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

    const detectedOosBrands = Object.entries(combinedCounts)
      .filter(([_, count]) => count === 0)
      .map(([brand]) => brand);
    const hasOosFound = detectedOosBrands.length > 0;

    // Fetch cached/latest active planograms and evaluate compliance against the confirmed category totals
    let latestPlanograms: PlanogramRecord[] = [];
    try {
      latestPlanograms = await fetchActivePlanograms(false);
    } catch {
      latestPlanograms = [];
    }
    const activePlanogram = findActivePlanogramForOutlet(outlet, category, latestPlanograms);

    const bayDiagnosticInputs = completedAisles.map((k, idx) => {
      const s = aisleSessions[k];
      return {
        key: s?.key || k,
        label: s?.label || `Bay ${idx + 1}`,
        boundingBoxes: s?.boxes || [],
        boxes: s?.boxes || [],
        planRows: s?.planRows,
        unmappedBrands: s?.unmappedBrands
      };
    });

    const collectedUnmapped = Array.from(
      new Set(completedAisles.flatMap((k) => aisleSessions[k]?.unmappedBrands || []))
    );

    const complianceResult = evaluatePlanogramCompliance({
      outlet,
      category,
      planogram: activePlanogram,
      confirmedCounts: combinedCounts,
      initialAiCounts: combinedOrigCounts,
      actualTotalFacings: combinedTotalFacings,
      actualPrimarySharePct: primarySharePct,
      baySessions: bayDiagnosticInputs,
      excludedBoxIds: removedDuplicateBoxIds,
      unmappedBrands: collectedUnmapped
    });

    const needsReviewFlag =
      completedAisles.some((k) => Boolean(aisleSessions[k]?.n8nStatus?.needsReview)) ||
      complianceResult.unmappedBrands.length > 0;

    const record: CategoryAuditRecord = {
      outletId: outlet.id,
      visitId,
      category,
      priceTagOk,
      posmShelfSticker,
      posmWobblers,
      questionnaireAnswers,
      questionnaireNewProducts,
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
      activeAisleCount: completedAisles.length,
      planogramCompliance: complianceResult,
      editedByRep: complianceResult.editedByRep,
      unmappedBrands: complianceResult.unmappedBrands
    };

    // 1. Transform questionnaire responses into the 5 target tables
    const multiTables = transformQuestionnaireToTables(
      questionnaireAnswers,
      questionnaireNewProducts,
      {
        visitId,
        outletName: outlet.name,
        repIdOrName: userProfile?.repId || userProfile?.name || '#9',
        category,
        latitude: coords.latitude,
        longitude: coords.longitude,
        totalFacings: combinedTotalFacings,
        shareOfShelfPct: primarySharePct,
        oosSkus: detectedOosBrands.join(', ') || 'None',
        hasOosFound,
        dataConfidence: questionnaireAnswers.fo_confidence || 'High'
      }
    );

    const auditRecordForSync = {
      timestamp: new Date().toISOString(),
      outletId: outlet.id,
      sapCode: outlet.code || '',
      outletName: outlet.name,
      accountName: outlet.account || outlet.name.split(' - ')[0] || outlet.name,
      outletCode: outlet.code || outlet.id,
      category,
      repId: userProfile?.repId || '#9',
      repName: userProfile?.name || 'Safwan Asif',
      totalFacings: combinedTotalFacings,
      shareOfShelfPct: primarySharePct,
      shareOfShelfLabel: primaryLabel,
      brandBreakdown: Object.entries(combinedCounts).map(([b, cnt]) => `${b}: ${cnt}`).join(' | '),
      discrepancyLog: fullDiscrepancyLog,
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationSource: coords.source,
      priceTagOk,
      posmShelfSticker,
      posmWobblers,
      needsReview: needsReviewFlag,
      photoUrl: primaryPhoto,
      annotatedImage: primaryCompleted?.annotatedPhotoUrl || primaryPhoto,
      planogramCompliance: complianceResult,
      editedByRep: complianceResult.editedByRep,
      unmappedBrands: complianceResult.unmappedBrands
    };

    // 2. Dispatch multi-table sync + category_audits summary + planogram_compliance rows to Google Sheets
    syncFieldIntelToGoogleSheets(
      multiTables,
      visitId,
      outlet.id,
      category,
      auditRecordForSync,
      {
        date: new Date().toISOString().slice(0, 10),
        rep: userProfile?.name || 'Safwan Asif',
        outlet: outlet.name,
        gps_lat: coords.latitude,
        gps_lng: coords.longitude,
        data_confidence: questionnaireAnswers.fo_confidence || 'High',
        categories_completed: category
      }
    );

    // 3. Auto-Sync to Google Sheet in background (Audit_Logs combined row)
    autoSaveAuditToGoogleSheet({
      timestamp: new Date().toLocaleString(),
      outletId: outlet.id,
      outletName: outlet.name,
      accountName: outlet.account || outlet.name.split(' - ')[0] || outlet.name,
      outletCode: outlet.code || outlet.id,
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
      needsReview: needsReviewFlag,
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

    // Save audit into app state and celebrate Category Completion (Screen 15)
    onSaveAudit(record, true);
    setScorecardResult(complianceResult);
    setStep('CATEGORY_COMPLETE');
    } finally {
      setIsSavingAudit(false);
    }
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
              <span className="text-[8px] font-mono font-bold text-[#00C8FF] bg-black/85 px-1 py-0.5 rounded self-end border border-[#008DFF]/40 whitespace-nowrap">
                Counted in {prev.label}
              </span>
            )}
          </div>
        )}
        {rightSeam && (
          <div
            style={{ width: `${(1 - rightSeam.cutFracLeft) * 100}%` }}
            className={`absolute top-0 bottom-0 right-0 border-l-2 border-dashed pointer-events-none flex flex-col justify-end p-1 z-0 ${
              seamsOn ? 'border-[#00C8FF]/90 bg-black/35' : 'border-amber-400/70 bg-transparent'
            }`}
          >
            {!inLightbox && (
              <span className="text-[8px] font-mono font-bold text-[#00C8FF] bg-black/85 px-1 py-0.5 rounded self-start border border-[#008DFF]/40 whitespace-nowrap">
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
                  : 'bg-[#00C8FF]/20 border-2 border-dashed border-[#00C8FF] opacity-90'
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

  // Determine categories audited including the newly finished one for Screen 15 checklist
  const completedCategorySet = useMemo(() => {
    const set = new Set<CategoryType>();
    CATEGORIES.forEach((c) => {
      if (outlet.progress[c] === 'Completed') set.add(c);
    });
    if (step === 'CATEGORY_COMPLETE' || step === 'SCORECARD') {
      set.add(category);
    }
    return set;
  }, [outlet.progress, step, category]);

  const nextPendingCategory = useMemo(
    () => CATEGORIES.find((c) => !completedCategorySet.has(c)) || null,
    [completedCategorySet]
  );

  const visibleAspectRatioClass =
    captureOrientation === 'vertical' ? 'aspect-[3/4]' : 'aspect-[4/3]';

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full max-h-[100dvh] overflow-hidden select-none pjp-atmospheric-canvas">
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

      {/* ================= SCREEN 06: AISLE & CAPTURE SETUP ================= */}
      {step === 'SETUP' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22 }}
          className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full h-full overflow-hidden px-4 pt-3 pb-5 md:py-6"
        >
          {/* Header */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Store Audit"
              className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
            >
              <ChevronLeft size={19} />
            </button>
            <div className="min-w-0">
              <h1 className="font-heading font-extrabold text-[22px] sm:text-[24px] leading-tight tracking-tight text-[var(--text-primary)] truncate">
                Capture Setup &ndash; {category}
              </h1>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {outlet.name}
                {outlet.code ? ` · SAP ${outlet.code}` : ''}
              </p>
            </div>
          </div>

          {/* Setup Cards */}
          <div className="flex-1 overflow-y-auto py-4 space-y-5 no-scrollbar">
            {/* Aisle Mode */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] px-1">
                Configure Aisle &amp; Capture
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSelectAisleMode('single')}
                  className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[126px] transition-all cursor-pointer active:scale-[0.98] ${
                    aisleMode === 'single'
                      ? 'glass-panel border-[#00C8FF] ring-2 ring-[#008DFF]/35 shadow-[0_0_24px_-6px_rgba(0,141,255,0.45)]'
                      : 'glass-subtle hover:border-[#008DFF]/45'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      aisleMode === 'single'
                        ? 'bg-[#0066FF]/20 border-[#00C8FF]/55 text-[#00C8FF]'
                        : 'glass-panel text-[var(--text-secondary)]'
                    }`}
                  >
                    <Square size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-[var(--text-primary)] block">
                      Single Aisle
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      1 shelf frame
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectAisleMode('multi')}
                  className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[126px] transition-all cursor-pointer active:scale-[0.98] ${
                    aisleMode === 'multi'
                      ? 'glass-panel border-[#00C8FF] ring-2 ring-[#008DFF]/35 shadow-[0_0_24px_-6px_rgba(0,141,255,0.45)]'
                      : 'glass-subtle hover:border-[#008DFF]/45'
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                      aisleMode === 'multi'
                        ? 'bg-[#0066FF]/20 border-[#00C8FF]/55 text-[#00C8FF]'
                        : 'glass-panel text-[var(--text-secondary)]'
                    }`}
                  >
                    <Layers size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-[var(--text-primary)] block">
                      Multiple Aisle
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      2+ bays · add as many as needed
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Capture Orientation */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)] px-1">
                Capture Orientation
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCaptureOrientation('horizontal')}
                  className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[116px] transition-all cursor-pointer active:scale-[0.98] ${
                    captureOrientation === 'horizontal'
                      ? 'glass-panel border-[#00C8FF] ring-2 ring-[#008DFF]/35 shadow-[0_0_24px_-6px_rgba(0,141,255,0.45)]'
                      : 'glass-subtle hover:border-[#008DFF]/45'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                      captureOrientation === 'horizontal'
                        ? 'bg-[#0066FF]/20 border-[#00C8FF]/55 text-[#00C8FF]'
                        : 'glass-panel text-[var(--text-secondary)]'
                    }`}
                  >
                    <RectangleHorizontal size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-[var(--text-primary)] block">
                      Horizontal
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Wide 4:3 shelf
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCaptureOrientation('vertical')}
                  className={`rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-2.5 min-h-[116px] transition-all cursor-pointer active:scale-[0.98] ${
                    captureOrientation === 'vertical'
                      ? 'glass-panel border-[#00C8FF] ring-2 ring-[#008DFF]/35 shadow-[0_0_24px_-6px_rgba(0,141,255,0.45)]'
                      : 'glass-subtle hover:border-[#008DFF]/45'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${
                      captureOrientation === 'vertical'
                        ? 'bg-[#0066FF]/20 border-[#00C8FF]/55 text-[#00C8FF]'
                        : 'glass-panel text-[var(--text-secondary)]'
                    }`}
                  >
                    <RectangleVertical size={22} />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-[var(--text-primary)] block">
                      Vertical
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Tall 3:4 racks
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Guidance Note */}
            <div className="glass-subtle rounded-2xl px-4 py-3 flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
              <Info size={16} className="text-[#008DFF] dark:text-[#00C8FF] shrink-0" />
              <span>Capture the full shelf, front-on and level.</span>
            </div>
          </div>

          {/* Primary Open Camera CTA */}
          <div className="pt-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setCurrentAisle('bay_1');
                setStep('CAPTURE');
              }}
              className="w-full min-h-[54px] rounded-full btn-electric-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
            >
              <span>Open Camera</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= SCREEN 07: INTELLIGENT CAMERA CAPTURE ================= */}
      {step === 'CAPTURE' && (
        <div className="flex-1 flex flex-col md:flex-row md:items-stretch md:gap-4 w-full h-full max-w-6xl mx-auto overflow-hidden bg-[#020D1F] text-[#F1F5FF]">
          {/* Immersive Viewfinder Container */}
          <div className="order-1 md:order-2 flex-1 flex flex-col min-h-0 relative bg-black md:m-3 md:rounded-3xl overflow-hidden border-b md:border border-white/10">
            {/* Floating Top Camera Bar */}
            <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between gap-2 pointer-events-none">
              <div className="flex items-center gap-2 pointer-events-auto min-w-0">
                <button
                  type="button"
                  onClick={() => setStep('SETUP')}
                  aria-label="Back to Capture Setup"
                  className="w-9 h-9 rounded-full bg-[#020D1F]/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white cursor-pointer active:scale-95 shrink-0"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-3 py-1.5 rounded-full bg-[#020D1F]/80 backdrop-blur-md border border-[#104878] text-[11px] font-bold text-[#00C8FF] truncate">
                  {currentSession?.label || 'Bay 1'} &bull; {category}
                </div>
              </div>

              <span
                className={`pointer-events-auto text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 backdrop-blur-md shrink-0 ${
                  isLevel
                    ? 'text-[#22C55E] bg-[#020D1F]/80 border-[#22C55E]/45'
                    : sensorsAvailable
                    ? 'text-[#EF4444] bg-[#020D1F]/80 border-[#EF4444]/45'
                    : 'text-[#00C8FF] bg-[#020D1F]/80 border-[#008DFF]/45'
                }`}
              >
                {sensorsAvailable ? (isLevel ? '✓ Level' : 'Tilt device') : 'Level Guide'}
              </span>
            </div>

            {/* Interactive Viewfinder Surface */}
            <div
              ref={viewfinderRef}
              onClick={() => {
                if (!cameraStreamActive && !pendingCapture) startCameraStream();
              }}
              className="flex-1 relative flex items-center justify-center overflow-hidden bg-black cursor-pointer"
            >
              {/* Live WebRTC Video Stream */}
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

              {/* Fallback Shelf Photo */}
              {!cameraStreamActive && (
                <img
                  src={fallbackShelfPhoto}
                  alt={`${category} Supermarket Shelf`}
                  className="absolute inset-0 w-full h-full object-cover opacity-75"
                />
              )}

              {/* Subtle Edge Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/55 pointer-events-none" />

              {/* Previous-Bay 15% Ghost Alignment Overlay (Bay 2, Bay 3, Bay 4, ...) */}
              {ghostGuideUrl && prevBayGhostStripUrl && (() => {
                const containerW = viewfinderSize.w || 320;
                const containerH = viewfinderSize.h || 480;
                const frame =
                  cameraStreamActive && videoDims.w && videoDims.h && viewfinderSize.w && viewfinderSize.h
                    ? fitRect(viewfinderSize.w, viewfinderSize.h, videoDims.w, videoDims.h)
                    : { left: 0, top: 0, width: containerW, height: containerH };
                const overlayWidth = Math.max(24, Math.round(frame.width * GHOST_GUIDE_FRAC));
                const prevLabel = (ghostGuideBayKey && aisleSessions[ghostGuideBayKey]?.label) || 'previous bay';

                return (
                  <div
                    className="absolute pointer-events-none z-[15] overflow-hidden"
                    style={{
                      left: `${frame.left}px`,
                      top: `${frame.top}px`,
                      width: `${frame.width}px`,
                      height: `${frame.height}px`
                    }}
                  >
                    <motion.div
                      key={ghostGuideBayKey || 'ghost'}
                      initial={shouldReduceMotion ? { opacity: 0.4 } : { opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                      className="absolute top-0 bottom-0 left-0 overflow-hidden pointer-events-none border-r border-dashed border-cyan-400"
                      style={{ width: `${overlayWidth}px` }}
                    >
                      <img
                        src={prevBayGhostStripUrl}
                        alt={`${prevLabel} ghost alignment strip`}
                        className="w-full h-full object-fill block select-none"
                        draggable={false}
                      />
                    </motion.div>

                    <div className="absolute top-14 left-2 max-w-[175px] bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-cyan-400/60 pointer-events-none shadow-lg">
                      <span className="text-[9px] font-bold tracking-tight text-cyan-300 block leading-tight">
                        Align the shelf with the ghost guide.
                      </span>
                      <span className="text-[8px] font-mono text-cyan-200 block mt-0.5">
                        15% Overlap &bull; {prevLabel}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* White Frame Corner Brackets & Center Spirit Level */}
              {!pendingCapture && (
                <div className="absolute inset-5 sm:inset-8 pointer-events-none z-10 flex items-center justify-center">
                  <div className={`relative w-full max-w-md max-h-[82%] ${visibleAspectRatioClass}`}>
                    <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-white rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-white rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-white rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-white rounded-br-xl" />

                    {/* Center Spirit Level Bar */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                      <div
                        className={`w-full h-[2px] transition-colors duration-200 ${
                          sensorsAvailable
                            ? isLevel
                              ? 'bg-[#22C55E] shadow-[0_0_12px_#22C55E]'
                              : 'bg-[#EF4444]/85'
                            : 'bg-[#00C8FF]/80'
                        }`}
                      />
                      <div
                        className={`absolute w-3.5 h-3.5 rounded-full border-2 border-white ${
                          sensorsAvailable
                            ? isLevel
                              ? 'bg-[#22C55E]'
                              : 'bg-[#EF4444]'
                            : 'bg-[#008DFF]'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Right-Side Floating Camera Control Rail */}
              {!pendingCapture && (
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={handleToggleTorch}
                    disabled={!torchSupported}
                    title={torchSupported ? (torchEnabled ? 'Turn off flash' : 'Turn on flash') : 'Flash unavailable'}
                    aria-label="Toggle Flash"
                    className={`w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                      torchEnabled
                        ? 'bg-[#008DFF] border-[#00C8FF] text-white shadow-[0_0_16px_rgba(0,200,255,0.55)] cursor-pointer'
                        : torchSupported
                        ? 'bg-[#020D1F]/80 border-white/20 text-white cursor-pointer hover:border-[#00C8FF]'
                        : 'bg-[#020D1F]/55 border-white/10 text-white/35 cursor-not-allowed'
                    }`}
                  >
                    {torchEnabled ? <Zap size={16} /> : <ZapOff size={16} />}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setCaptureOrientation((prev) => (prev === 'horizontal' ? 'vertical' : 'horizontal'))
                    }
                    className="w-10 h-10 rounded-full bg-[#020D1F]/80 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-[#00C8FF] flex items-center justify-center cursor-pointer active:scale-95"
                    title="Switch Orientation Ratio"
                  >
                    {captureOrientation === 'horizontal' ? '4:3' : '3:4'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (bayKeys.length > 1) {
                        const curIdx = bayKeys.indexOf(currentAisle);
                        setCurrentAisle(bayKeys[(curIdx + 1) % bayKeys.length]);
                      } else {
                        handleSelectAisleMode('multi');
                        if (aisleSessions.bay_1?.capturedPhotoUrl) {
                          setCurrentAisle('bay_2');
                        }
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-[#020D1F]/80 backdrop-blur-md border border-white/20 text-[10px] font-extrabold text-white flex items-center justify-center cursor-pointer active:scale-95"
                    title={bayKeys.length > 1 ? 'Switch Bay' : 'Switch to Multiple Aisle'}
                  >
                    {bayKeys.length > 1 ? `${bayKeys.indexOf(currentAisle) + 1}/${bayKeys.length}` : '1B'}
                  </button>

                  {aisleMode === 'multi' && (
                    <button
                      type="button"
                      onClick={handleAddNewBay}
                      className="w-10 h-10 rounded-full bg-[#008DFF]/25 backdrop-blur-md border border-[#00C8FF]/55 text-[#00C8FF] flex items-center justify-center cursor-pointer active:scale-95"
                      title="Add another bay"
                      aria-label="Add another bay"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Camera Permission Prompt */}
              {cameraErrorNotice && !cameraStreamActive && !pendingCapture && (
                <div
                  className="absolute inset-0 z-30 bg-black/88 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center space-y-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-400/50 text-amber-300">
                    <AlertTriangle size={24} />
                  </div>
                  <div className="max-w-xs space-y-1">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
                      Camera Access Needed
                    </h4>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">{cameraErrorNotice}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full max-w-xs">
                    <button
                      type="button"
                      onClick={() => startCameraStream()}
                      className="w-full min-h-[44px] rounded-full btn-electric-blue text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={15} />
                      <span>Enable Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="w-full min-h-[42px] rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Upload size={13} />
                      <span>Use System Camera App</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Start Live Stream CTA if idle */}
              {!cameraStreamActive && !cameraErrorNotice && !pendingCapture && (
                <div
                  className="absolute bottom-5 z-20 flex flex-col items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => startCameraStream()}
                    className="min-h-[42px] px-4 py-2 rounded-full btn-electric-blue text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Camera size={14} />
                    <span>Tap to Start Camera</span>
                  </button>
                </div>
              )}

              {/* Pending Capture Seam & Overlap Review */}
              {pendingCapture && (() => {
                const pc = pendingCapture;
                const label = aisleSessions[pc.bayKey]?.label || 'Bay';
                const prevKey = previousCapturedBayKey(pc.bayKey);
                const prevSession = prevKey ? aisleSessions[prevKey] : null;
                const prevLabel = prevSession?.label || 'previous bay';
                const containerW =
                  viewfinderSize.w > 0
                    ? viewfinderSize.w
                    : viewfinderRef.current?.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 360);
                const containerH =
                  viewfinderSize.h > 0
                    ? viewfinderSize.h
                    : viewfinderRef.current?.clientHeight || (typeof window !== 'undefined' ? window.innerHeight : 480);
                const frame = fitRect(containerW, containerH, pc.width || 3, pc.height || 4);
                const seam = pendingSeam;
                const ovPct = seam ? seam.overlapFracRight * 100 : 0;
                const cutPct = seam ? seam.cutFracRight * 100 : 0;

                return (
                  <div className="absolute inset-0 z-40 bg-black" onClick={(e) => e.stopPropagation()}>
                    <div
                      ref={previewFrameRef}
                      className="absolute overflow-hidden touch-none select-none"
                      style={{ left: frame.left, top: frame.top, width: frame.width, height: frame.height }}
                      onPointerMove={(e) => {
                        if (isDraggingSeamRef.current) handleSeamDrag(e.clientX);
                      }}
                      onPointerUp={() => {
                        isDraggingSeamRef.current = false;
                      }}
                      onPointerCancel={() => {
                        isDraggingSeamRef.current = false;
                      }}
                    >
                      <img
                        src={pc.dataUrl}
                        alt={`${label} preview`}
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: 'fill' }}
                        draggable={false}
                      />

                      {prevKey && seam && !isMeasuringSeam && (
                        <>
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
                          <div
                            className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-[#00C8FF] pointer-events-none"
                            style={{ left: `${cutPct}%` }}
                          >
                            <span className="absolute top-2 left-1 whitespace-nowrap text-[9px] font-bold text-[#00C8FF] bg-[#020D1F]/85 px-1.5 py-0.5 rounded border border-[#008DFF]/60">
                              Count line
                            </span>
                          </div>
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
                          </div>
                        </>
                      )}
                    </div>

                    <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/85 to-transparent flex items-center justify-between pointer-events-auto z-10">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-white">
                        {label} &bull; Confirm Photo
                      </span>
                      <div className="flex items-center gap-2">
                        {prevKey && seam && !isMeasuringSeam && prevSession?.capturedPhotoUrl && (
                          <button
                            type="button"
                            onClick={() => setShowAlignmentCheck((v) => !v)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              showAlignmentCheck ? 'bg-amber-400 text-black' : 'bg-black/80 text-amber-300 border border-amber-400/50'
                            }`}
                          >
                            {showAlignmentCheck ? 'Hide overlap' : 'Check overlap'}
                          </button>
                        )}
                        {prevKey && isMeasuringSeam && (
                          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                            <Loader2 size={12} className="animate-spin" /> Measuring…
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Native Camera Bottom Dock (Mobile) / Left Rail (Desktop) */}
          <div className="order-2 md:order-1 md:w-[320px] md:shrink-0 bg-[#020D1F] border-t md:border-t-0 md:border-r border-[#104878]/60 px-5 pt-4 pb-[calc(18px+env(safe-area-inset-bottom,0px))] md:p-5 flex flex-col justify-between z-20 shrink-0">
            {/* Desktop Context & Bay Queue */}
            <div className="hidden md:flex flex-col gap-4">
              <div>
                <h2 className="font-heading font-extrabold text-xl text-white">Shelf Capture</h2>
                <p className="text-xs text-[#9AB0D0]">
                  {category} &middot; {aisleMode === 'multi' ? `Multiple Aisle (${bayKeys.length} Bays)` : 'Single Aisle'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00C8FF]">
                  Bay Queue
                </span>
                <div className="flex flex-wrap gap-2">
                  {bayKeys.map((k, idx) => {
                    const s = aisleSessions[k];
                    const hasPhoto = Boolean(s?.capturedPhotoUrl);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setCurrentAisle(k)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          currentAisle === k
                            ? 'btn-electric-blue text-white'
                            : hasPhoto
                            ? 'bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#4ADE80]'
                            : 'bg-white/5 border border-white/15 text-[#9AB0D0]'
                        }`}
                      >
                        <span>{s?.label || `Bay ${idx + 1}`}</span>
                        {hasPhoto && <Check size={12} />}
                      </button>
                    );
                  })}
                  {aisleMode === 'multi' && (
                    <button
                      type="button"
                      onClick={handleAddNewBay}
                      className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer bg-[#008DFF]/20 border border-[#00C8FF]/45 text-[#00C8FF] hover:bg-[#008DFF]/30"
                    >
                      <Plus size={12} />
                      <span>Add Bay</span>
                    </button>
                  )}
                </div>
              </div>
              <p className="text-xs text-[#9AB0D0] leading-relaxed">
                {ghostGuideUrl
                  ? `Align the faded left strip with ${(ghostGuideBayKey && aisleSessions[ghostGuideBayKey]?.label) || 'the previous bay'}, then tap the shutter.`
                  : 'Center the shelf horizontally, wait for the green level line, and tap the shutter.'}
              </p>
            </div>

            {/* Bottom Shutter Bar */}
            {pendingCapture ? (
              (() => {
                const isMultiFlow = aisleMode === 'multi' && !pendingCapture.isRetake;
                const curIdx = bayKeys.indexOf(pendingCapture.bayKey);
                const existingNextEmpty = bayKeys.find(
                  (k, idx) =>
                    idx > curIdx &&
                    !aisleSessions[k]?.capturedPhotoUrl &&
                    !aisleSessions[k]?.annotatedPhotoUrl
                );
                const maxNum = Math.max(
                  bayKeys.length,
                  ...bayKeys.map((k) => parseInt(k.replace('bay_', ''), 10) || 0)
                );
                const nextBayLabel = existingNextEmpty
                  ? aisleSessions[existingNextEmpty]?.label || `Bay ${curIdx + 2}`
                  : `Bay ${maxNum + 1}`;
                const needsMandatoryNext =
                  isMultiFlow &&
                  pendingCapture.bayKey === 'bay_1' &&
                  !aisleSessions.bay_2?.capturedPhotoUrl &&
                  !aisleSessions.bay_2?.annotatedPhotoUrl;

                return (
                  <div className="flex items-center justify-between gap-2 max-w-md mx-auto w-full">
                    <button
                      type="button"
                      onClick={handleDiscardPending}
                      className="h-12 px-4 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                    >
                      <RefreshCw size={14} />
                      <span>Retake</span>
                    </button>

                    {isMultiFlow && !needsMandatoryNext && (
                      <button
                        type="button"
                        onClick={() => handleConfirmUpload(true)}
                        disabled={isMeasuringSeam}
                        className="h-12 px-3.5 flex-1 rounded-full bg-[#008DFF]/20 border border-[#00C8FF]/60 text-[#00C8FF] font-bold text-xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
                      >
                        <Plus size={15} strokeWidth={2.6} />
                        <span>{nextBayLabel}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleConfirmUpload(needsMandatoryNext)}
                      disabled={isMeasuringSeam}
                      aria-label={needsMandatoryNext ? `Save & Capture ${nextBayLabel}` : 'Confirm Photo & Start Analysis'}
                      className="h-13 flex-1 rounded-full btn-electric-blue text-white font-bold text-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 whitespace-nowrap"
                    >
                      <Check size={17} strokeWidth={2.8} />
                      <span>
                        {needsMandatoryNext
                          ? `Save & ${nextBayLabel}`
                          : isMultiFlow
                          ? 'Finish'
                          : 'Use Photo'}
                      </span>
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="grid grid-cols-3 items-center max-w-md mx-auto w-full px-6">
                {/* Left: Gallery */}
                <div className="flex justify-start">
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white cursor-pointer active:scale-95"
                    aria-label="Choose from gallery"
                    title="Choose from gallery"
                  >
                    <ImageIcon size={20} />
                  </button>
                </div>

                {/* Center: Native White Double-Ring Shutter */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleManualShutter}
                    aria-label={`Capture ${currentSession?.label || 'Bay 1'}`}
                    className="w-[74px] h-[74px] rounded-full border-[3.5px] border-white/85 p-1 flex items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-[0_0_25px_rgba(0,141,255,0.45)]"
                  >
                    <span className="w-full h-full rounded-full bg-white block" />
                  </button>
                </div>

                {/* Right Spacer */}
                <div />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= SCREENS 08–13: QUESTIONNAIRE + LIVE VISION AI ================= */}
      {step === 'POSM' && (
        <QuestionnaireRenderer
          category={category}
          outletId={outlet.id}
          visitId={visitId}
          isAiRunning={inFlightAisles.length > 0}
          hasAiError={erroredAisles.length > 0}
          aiProgressPercent={Math.min(
            95,
            Math.round((completedAisles.length / Math.max(1, capturedAisles.length)) * 100)
          )}
          previewPhotoUrl={
            aisleSessions[posmActiveBayKey]?.capturedPhotoUrl ||
            capturedBaySessions[0]?.capturedPhotoUrl ||
            fallbackShelfPhoto
          }
          onRetryAi={handleRetryAiAnalysis}
          onSkipWaitToManual={activateManualFallbackForInFlightBays}
          onComplete={(answers, newProducts) => {
            setQuestionnaireAnswers(answers);
            setQuestionnaireNewProducts(newProducts);
            if (answers.os_price_tag_ok !== undefined) setPriceTagOk(answers.os_price_tag_ok === 'Yes');
            if (answers.os_shelf_strip !== undefined) setPosmShelfSticker(answers.os_shelf_strip === 'Yes');
            if (answers.os_wobblers !== undefined) setPosmWobblers(answers.os_wobblers === 'Yes');
            applySeamDeduplication();
            setStep('RESULTS');
            setResultsAisleView('ALL');
          }}
          onBackToCapture={() => setStep('CAPTURE')}
        />
      )}

      {/* ================= SCREEN 14: AI RESULTS & VERIFICATION ================= */}
      {step === 'RESULTS' && (
        <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full h-full overflow-hidden px-3.5 sm:px-5 pt-3 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => (existingAudit ? onBack() : setStep('POSM'))}
                aria-label="Back"
                className="w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="font-heading font-extrabold text-[22px] sm:text-[24px] leading-tight tracking-tight text-[var(--text-primary)] truncate">
                  {category} &ndash; Results
                </h1>
                <p className="text-[11px] text-[var(--text-secondary)] truncate">{outlet.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {resultsProvenance.mode === 'ai_verified' ? (
                <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#15803D] dark:text-[#4ADE80] text-[11px] font-extrabold">
                  {resultsProvenance.label}
                </span>
              ) : resultsProvenance.mode === 'adjusted' ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-300 text-[11px] font-extrabold">
                  {resultsProvenance.label}
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/45 text-amber-600 dark:text-amber-300 text-[10px] font-extrabold">
                    Manual Entry
                  </span>
                  <button
                    type="button"
                    onClick={handleRetryAiAnalysis}
                    className="px-2.5 py-1 rounded-full btn-electric-blue text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={10} /> Retry AI
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bay Tab Switcher + Overlap Banner */}
          <div className="space-y-1.5 pb-2 shrink-0">
            {(capturedAisles.length > 1 || !existingAudit) && (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  {capturedAisles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setResultsAisleView('ALL')}
                      className={`min-h-[32px] px-3 rounded-full text-xs font-bold cursor-pointer shrink-0 tabular-nums ${
                        resultsAisleView === 'ALL'
                          ? 'btn-electric-blue text-white'
                          : 'glass-subtle text-[var(--text-primary)]'
                      }`}
                    >
                      ALL {combinedTotalFacings}f
                    </button>
                  )}
                  {capturedAisles.map((k) => {
                    const s = aisleSessions[k];
                    if (!s) return null;
                    const isSelected =
                      resultsAisleView === k || (capturedAisles.length === 1 && resultsAisleView === 'ALL');
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setResultsAisleView(k)}
                        className={`min-h-[32px] px-3 rounded-full text-xs font-bold cursor-pointer shrink-0 tabular-nums ${
                          isSelected
                            ? 'btn-electric-blue text-white'
                            : 'glass-subtle text-[var(--text-primary)]'
                        }`}
                      >
                        {s.label} {s.totalFacings ?? 0}f
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleAddNewBay}
                  className="min-h-[32px] px-3 rounded-full text-[11px] font-bold text-[#008DFF] dark:text-[#00C8FF] glass-subtle flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus size={12} /> Add Bay
                </button>
              </div>
            )}

            {seamSummaries.length > 0 && (
              <button
                type="button"
                onClick={() => setIsDuplicatePanelExpanded(!isDuplicatePanelExpanded)}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl glass-subtle text-xs font-bold text-[#008DFF] dark:text-[#00C8FF] cursor-pointer"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Layers size={13} className="shrink-0" />
                  <span className="truncate">
                    {duplicateReviewStatus === 'kept'
                      ? 'Overlap removal off: all detections kept'
                      : `${totalDuplicatesCount} overlap bottle${totalDuplicatesCount === 1 ? '' : 's'} counted once`}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-[11px] shrink-0">
                  Details {isDuplicatePanelExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </span>
              </button>
            )}
          </div>

          {/* Main Verification Grid */}
          <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
            {/* Top Two-Column Card (Image Left + Total Facings / Steppers Right) */}
            <div className="flex-1 min-h-0 glass-panel rounded-3xl p-3 sm:p-4 grid grid-cols-1 grid-rows-[auto_minmax(0,1fr)] sm:grid-rows-1 sm:grid-cols-[1.05fr_1fr] gap-3 overflow-hidden">
              {/* Shelf Image Thumbnail */}
              <div
                ref={shelfContainerRef}
                onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
                className="relative h-44 sm:h-full rounded-2xl bg-black overflow-hidden border border-[var(--border-glass)] flex items-center justify-center cursor-pointer shrink-0"
                title="Tap to swap Annotated / Raw view"
              >
                {isStitchingPanorama ? (
                  <div className="flex flex-col items-center justify-center p-3 text-center text-[#00C8FF]">
                    <Loader2 size={20} className="animate-spin mb-1" />
                    <span className="text-[11px] font-bold text-white">Assembling Panorama…</span>
                  </div>
                ) : (
                  <img
                    ref={shelfImgRef}
                    src={resolvedImgSrc}
                    alt={`${category} annotated shelf`}
                    className="w-full h-full object-contain"
                    onLoad={updateDisplayedImgRect}
                    onError={() => setImgErrorLevel((prev) => Math.min(2, prev + 1))}
                  />
                )}

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
                      : { inset: 0 }
                  }
                >
                  {renderSeamOverlays(false)}
                </div>

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#020D1F]/80 border border-[#104878] text-[10px] font-bold text-[#00C8FF] z-20">
                  {showRawPhotoComparison ? 'Raw' : 'Annotated'}
                </span>

                {Boolean(resolvedImgSrc) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsFullScreenOpen(true);
                      setZoomScale(1);
                    }}
                    className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-[#020D1F]/85 border border-[#104878] text-[#00C8FF] flex items-center justify-center cursor-pointer active:scale-95"
                    aria-label="Enlarge shelf image"
                  >
                    <Maximize2 size={13} />
                  </button>
                )}
              </div>

              {/* Right Column: Total Facings Hero + Scrollable Brand Steppers */}
              <div className="flex flex-col min-h-0 overflow-hidden">
                <div className="flex items-end justify-between pb-2 border-b border-[var(--border-glass)] shrink-0">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
                      Total Facings
                    </span>
                    <span className="font-heading font-extrabold text-[34px] leading-none tabular-nums text-[var(--text-primary)]">
                      {resultsAisleView === 'ALL' ? combinedTotalFacings : viewSession?.totalFacings ?? 0}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddBrandOpen(true)}
                    className="px-3 py-1.5 rounded-full glass-subtle text-[11px] font-bold text-[#008DFF] dark:text-[#00C8FF] flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Plus size={12} /> Brand
                  </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto pt-2 space-y-1.5 pr-0.5 no-scrollbar">
                  {allBrandKeys.map((brand) => {
                    const count =
                      resultsAisleView === 'ALL'
                        ? (combinedCounts[brand] ?? 0)
                        : (viewSession?.counts[brand] ?? 0);
                    const upperBrand = brand.toUpperCase().trim();
                    const brandColor = BRAND_COLORS[upperBrand] || BRAND_COLORS[brand] || '#008DFF';
                    const origCount =
                      resultsAisleView === 'ALL'
                        ? combinedOrigCounts[brand]
                        : (viewSession?.seamAdjustedCounts?.[brand] ?? viewSession?.originalAiCounts[brand]);
                    const hasChanged = origCount !== undefined && count !== origCount;

                    return (
                      <div
                        key={brand}
                        className={`rounded-2xl px-2.5 py-1.5 flex items-center justify-between gap-2 ${
                          hasChanged
                            ? 'glass-subtle border-amber-500/45'
                            : 'bg-black/[0.03] dark:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: brandColor }}
                          />
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                            {brand}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(brand, -1)}
                            className="w-7 h-7 rounded-full glass-panel text-xs font-extrabold text-[var(--text-primary)] flex items-center justify-center cursor-pointer active:scale-90"
                            aria-label={`Decrease ${brand}`}
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-extrabold tabular-nums text-[var(--accent-primary)]">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateCount(brand, 1)}
                            className="w-7 h-7 rounded-full glass-panel text-xs font-extrabold text-[var(--text-primary)] flex items-center justify-center cursor-pointer active:scale-90"
                            aria-label={`Increase ${brand}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>



            {/* Bottom Dual Actions: Retake | Confirm & Save */}
            <div className="flex items-center gap-3 pt-0.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const targetBay =
                    resultsAisleView === 'ALL' ? (completedAisles[0] || currentAisle || 'bay_1') : resultsAisleView;
                  handleRetakeBay(targetBay);
                }}
                className="min-h-[50px] px-5 rounded-full glass-panel font-bold text-xs text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95 shrink-0"
              >
                Retake
              </button>

              <button
                type="button"
                onClick={handleProceedToScorecard}
                disabled={!isSaveEnabled}
                className="flex-1 min-h-[50px] rounded-full btn-electric-blue font-bold text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97] disabled:opacity-55"
              >
                {isSavingAudit ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading Scorecard…</span>
                  </>
                ) : (
                  <>
                    <span>View Scorecard</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Overlap Details Bottom Sheet */}
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
                  className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
                  onClick={() => setIsDuplicatePanelExpanded(false)}
                />
                <div className="fixed inset-x-0 bottom-0 z-50 max-w-xl mx-auto glass-panel-strong rounded-t-3xl p-4 space-y-3 max-h-[75vh] overflow-y-auto animate-fade-in">
                  <div className="w-10 h-1 bg-[var(--border-glass-strong)] rounded-full mx-auto" />
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                      Bay Overlap Deduplication
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsDuplicatePanelExpanded(false)}
                      className="text-xs font-semibold text-[var(--text-secondary)] px-2 py-1 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  {seamSummaries.map((j) => (
                    <div
                      key={`${j.leftKey}-${j.rightKey}`}
                      className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl border ${
                        isFlagged(j)
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-200'
                          : 'glass-subtle text-[var(--text-primary)]'
                      }`}
                    >
                      <span className="font-bold">
                        {j.leftLabel} ⟷ {j.rightLabel}
                        <span className="font-normal opacity-80">
                          {' '}
                          · {j.seam ? `${Math.round(j.seam.overlapFracRight * 100)}% overlap` : 'overlap unknown'}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        {!kept && <span className="font-mono tabular-nums">{j.excluded} once</span>}
                        <span className="text-[10px] uppercase font-bold">{confidenceLabel(j)}</span>
                      </span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (kept) handleRemoveDuplicates();
                      else handleKeepAllDuplicates();
                      setIsDuplicatePanelExpanded(false);
                    }}
                    className="w-full min-h-[44px] py-2.5 rounded-full glass-panel text-[var(--text-primary)] font-bold text-xs cursor-pointer"
                  >
                    {kept ? 'Count overlaps once' : 'Keep all detections (turn off)'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ================= SCREEN 15: CATEGORY COMPLETION ================= */}
      {step === 'CATEGORY_COMPLETE' && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.24 }}
          className="flex-1 flex flex-col justify-between max-w-xl mx-auto w-full h-full overflow-hidden px-5 pt-4 pb-6"
        >
          <div className="flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to Store Audit"
              className="w-10 h-10 rounded-full glass-panel flex items-center justify-center text-[var(--text-primary)] hover:border-[#008DFF] transition-colors cursor-pointer active:scale-95"
            >
              <ChevronLeft size={19} />
            </button>
            <LiveLocationBadge
              compact
              outletName={outlet.name}
              targetLatitude={outlet.latitude}
              targetLongitude={outlet.longitude}
              onLocationCaptured={setGpsCoords}
            />
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-5 py-2 overflow-y-auto no-scrollbar">
            <AnimatedCompletionCircle size={108} />

            <div className="space-y-1">
              <h1 className="font-heading font-extrabold text-[30px] sm:text-[34px] leading-tight tracking-tight text-[var(--text-primary)]">
                {category} Completed
              </h1>
              <p className="text-sm font-semibold text-[#008DFF] dark:text-[#00C8FF] tabular-nums">
                {completedCategorySet.size} / 3 Categories Audited
              </p>
            </div>

            {/* Category Progress Checklist */}
            <div className="w-full glass-panel rounded-3xl p-4 divide-y divide-[var(--border-glass)] text-left">
              {CATEGORIES.map((cat) => {
                const isDone = completedCategorySet.has(cat);
                return (
                  <div
                    key={cat}
                    className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <CategoryMonogramBadge category={cat} completed={isDone} size="sm" />
                      <span
                        className={`text-sm font-bold ${
                          isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
                        }`}
                      >
                        {cat}
                      </span>
                    </div>
                    {isDone ? (
                      <span className="w-6 h-6 rounded-full bg-[#22C55E] text-white flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.45)]">
                        <Check size={13} strokeWidth={2.8} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border border-[var(--border-glass-strong)]" />
                    )}
                  </div>
                );
              })}
            </div>

            {scorecardResult && (
              <button
                type="button"
                onClick={() => setStep('SCORECARD')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-subtle text-xs font-bold text-[#008DFF] dark:text-[#00C8FF] hover:border-[#008DFF] cursor-pointer transition-colors"
              >
                <ClipboardCheck size={14} />
                <span>
                  View Planogram Scorecard
                  {scorecardResult.hasPlanogram ? ` (${scorecardResult.overallScore}%)` : ''}
                </span>
              </button>
            )}
          </div>

          {/* Primary Bottom CTA */}
          <div className="pt-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (nextPendingCategory && onSelectNextCategory) {
                  onSelectNextCategory(nextPendingCategory);
                } else {
                  onBack();
                }
              }}
              className="w-full min-h-[54px] rounded-full btn-electric-blue font-bold text-sm tracking-wide flex items-center justify-center gap-2 cursor-pointer active:scale-[0.97]"
            >
              <span>{nextPendingCategory ? 'Next Category' : 'Finish Outlet'}</span>
              <ArrowRight size={17} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= OPTIONAL SCORECARD DETAILS ================= */}
      {step === 'SCORECARD' && scorecardResult && (
        <PlanogramScorecard
          outlet={outlet}
          category={category}
          result={scorecardResult}
          isSubmittingAck={isSubmittingAck}
          onDone={async (executiveNote) => {
            setIsSubmittingAck(true);
            try {
              await syncPlanogramScorecardAck({
                visitId,
                outletId: outlet.id,
                outletName: outlet.name,
                sapCode: outlet.code,
                category,
                rep: userProfile?.name || userProfile?.repId || '#9',
                compliance: scorecardResult,
                executiveNote
              });
            } finally {
              setIsSubmittingAck(false);
            }
            await handleFinalSave();
          }}
        />
      )}

      {/* Quick Add Brand Modal */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xs glass-panel-strong rounded-3xl p-5 space-y-3.5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
              Add Competitor SKU / Brand
            </h3>
            <form onSubmit={handleAddBrandSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold block mb-1 text-[var(--text-secondary)]">
                  Brand Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MAZOLA, AFIA"
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl px-3 py-2 text-xs uppercase glass-subtle text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold block mb-1 text-[var(--text-secondary)]">
                  Detected Facings
                </label>
                <div className="flex items-center justify-between glass-subtle rounded-xl px-3 py-1.5">
                  <button
                    type="button"
                    onClick={() => setNewBrandCount(Math.max(1, newBrandCount - 1))}
                    className="w-8 h-8 rounded-lg glass-panel font-bold flex items-center justify-center active:scale-95 cursor-pointer text-[var(--text-primary)]"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm tabular-nums text-[var(--accent-primary)]">
                    {newBrandCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewBrandCount(newBrandCount + 1)}
                    className="w-8 h-8 rounded-lg glass-panel font-bold flex items-center justify-center active:scale-95 cursor-pointer text-[var(--text-primary)]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddBrandOpen(false)}
                  className="flex-1 min-h-[42px] py-2 text-xs font-semibold rounded-xl glass-subtle text-[var(--text-secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[42px] py-2 text-xs font-bold rounded-xl cursor-pointer btn-electric-blue text-white"
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
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-black/90 border-b border-white/10 shrink-0 z-30 gap-2">
            <div className="flex items-center gap-2 truncate pr-1">
              <span className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-xs">
                {step === 'CAPTURE'
                  ? `${category} · ${aisleSessions[lastCapturedAisle]?.label || currentSession?.label || 'Bay 1'}`
                  : resultsAisleView === 'ALL'
                  ? `${category} Panorama (${completedAisles.length} Bays)`
                  : `${category} · ${viewSession?.label || 'Bay'}`}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {step === 'RESULTS' && (
                <button
                  type="button"
                  onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl border border-[#008DFF]/50 bg-[#0066FF]/20 hover:bg-[#0066FF]/35 text-[#00C8FF] cursor-pointer"
                >
                  {showRawPhotoComparison ? 'AI' : 'Raw'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.max(1, Number((prev - 0.5).toFixed(1))))}
                disabled={zoomScale <= 1}
                className="p-1.5 rounded-xl bg-[#0B2542]/80 border border-[#104878] text-[#00C8FF] disabled:opacity-40 cursor-pointer"
                aria-label="Zoom Out"
              >
                <ZoomOut size={15} />
              </button>

              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="px-2 py-1 text-xs font-mono font-bold tabular-nums text-[#00C8FF] bg-[#0B2542]/80 border border-[#104878] rounded-xl cursor-pointer min-w-[48px] text-center"
              >
                {Math.round(zoomScale * 100)}%
              </button>

              <button
                type="button"
                onClick={() => setZoomScale((prev) => Math.min(4, Number((prev + 0.5).toFixed(1))))}
                disabled={zoomScale >= 4}
                className="p-1.5 rounded-xl bg-[#0B2542]/80 border border-[#104878] text-[#00C8FF] disabled:opacity-40 cursor-pointer"
                aria-label="Zoom In"
              >
                <ZoomIn size={15} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsFullScreenOpen(false);
                  setZoomScale(1);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer ml-1"
                aria-label="Return to normal view"
              >
                <Minimize2 size={14} />
                <span>Close</span>
              </button>
            </div>
          </div>

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
              {step === 'RESULTS' && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {renderSeamOverlays(true)}
                </div>
              )}
            </div>
          </div>

          <div className="px-3 sm:px-4 py-2 bg-[#020D1F]/95 border-t border-[#104878] flex items-center justify-between text-xs text-[#A5B8D5] shrink-0 z-30 gap-2">
            <span className="text-[11px] text-[#A5B8D5] truncate">
              Double-tap or pinch to zoom &bull; Drag to pan
            </span>

            <div className="flex items-center gap-2.5 shrink-0">
              {step === 'CAPTURE' ? (
                <span className="font-mono text-[#00C8FF] text-xs">
                  {aisleSessions[lastCapturedAisle]?.capturedFileName || 'captured_photo.jpg'}
                </span>
              ) : (
                <span className="font-bold text-[#00C8FF] text-xs tabular-nums">
                  {primaryLabel}: {primarySharePct}% &bull; {resultsAisleView === 'ALL' ? combinedTotalFacings : (viewSession?.totalFacings ?? 0)}f
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
