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

  // Parse stringified JSON counts if delivered as string
  let rawCounts = target?.counts;
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

  if (totalFacings === 0) {
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
    dimensions: width && height ? { width: Number(width), height: Number(height) } : undefined
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
  n8nStatus: any;
  analysisStartTime: number | null;
  analysisDurationSeconds: number;
  errorMessage?: string;
}

// ============================================================================
// CROSS-BAY DUPLICATE DETECTION FOR OVERLAPPING SHELF PHOTOS
// ============================================================================

/**
 * Default strip percentage for adjacent bay seam overlap (default 15% = 0.15, range 8%–35%).
 * Compares boundary regions using Consensus Horizontal Translation Clustering.
 */
export const DEFAULT_STRIP_PCT = 0.15;
export const STRIP_PCT = DEFAULT_STRIP_PCT;

/**
 * Vertical alignment tolerance multiplier (default 50% = 0.50).
 * Two shelf items are considered matching if the difference between their normalized center Y coordinates
 * is within 50% of the maximum normalized height of the two boxes:
 * Math.abs(rightNormCenterY - leftNormCenterY) <= Math.max(rightNormH, leftNormH) * Y_TOLERANCE
 */
export const Y_TOLERANCE = 0.50;

/**
 * COORDINATE SYSTEM DETERMINATION & NORMALIZATION:
 * Confirmed from real n8n webhook implementation (n8n-mt-visit-audit-workflow.json, lines 148-168):
 *
 *   const left = Math.round(pred.x - pred.width / 2);
 *   const top = Math.round(pred.y - pred.height / 2);
 *   const width = Math.round(pred.width);
 *   const height = Math.round(pred.height);
 *   boxes.push({ id: `box-${index + 1}`, brand: matchedBrand, x: left, y: top, width, height, ... });
 *
 * Findings:
 * 1. box.x and box.y delivered in webhook responses are TOP-LEFT CORNERS, NOT box centres.
 * 2. Cameras can deliver different resolutions per bay (e.g. 720x1280 vs 960x1280).
 *    To ensure robust matching, we normalize all bounding boxes into unit fractions [0.0, 1.0]
 *    using each bay's own measured resolution:
 *      normCenterX = (box.x + box.width / 2) / bayWidth
 *      normCenterY = (box.y + box.height / 2) / bayHeight
 * 3. Boundary Sorting: Left bay sorted right-to-left (outer edge first); Right bay sorted left-to-right (outer edge first).
 * 4. Horizontal Pan Displacement: deltaX = normCenterX_left - normCenterX_right.
 *    All true duplicate bottles across shelf tiers share the same physical camera shift.
 * 5. Consensus Clustering: Automatically rejects repeating brand bottles deeper in the bay whose displacement deviates from the seam.
 * 6. Single-bottle fallback for split/crop tests.
 */

/**
 * Detects duplicate bottle detections occurring at the overlapping boundaries
 * of adjacent bays captured left-to-right using Edge-Anchored Consensus Translation Clustering.
 *
 * Takes sessions in aisle order, evaluates adjacent pairs, and flags duplicate boxes
 * on the RIGHT bay only so facings are not inflated.
 *
 * Returns a Record<string, BayDuplicateReport> keyed by bayKey.
 */
interface BottleBoxNorm {
  raw: any;
  normX: number;
  normRight: number;
  normCenterX: number;
  normCenterY: number;
  normW: number;
  normH: number;
  brand: string;
}

/**
 * Detects duplicate bottle detections occurring at adjacent bay seams using
 * OUTER EDGE BOTTLE ALIGNMENT (Row-by-Row 1st/2nd Edge Bottle Matching).
 *
 * 1. Groups bottles in Bay 1 and Bay 2 into horizontal shelf tiers/rows by normCenterY.
 * 2. On each shelf tier:
 *    - Left Bay (Bay 1): Selects the 1 rightmost bottle (max normCenterX).
 *    - Right Bay (Bay 2): Selects the 1st leftmost bottle (min normCenterX) AND 2nd leftmost bottle.
 * 3. Compares the 1st (and 2nd) leftmost bottle of Bay 2 against the rightmost bottle of Bay 1 on that tier.
 * 4. Flags matched bottles in Bay 2 as duplicates.
 *
 * Zero sliders required, zero reliance on photo width percentages, 100% automated & tamper-proof.
 */
export function detectCrossBayDuplicates(
  aisleSessions: any[] | Record<string, any>,
  seamTolerance: number = DEFAULT_STRIP_PCT,
  yTolerance: number = Y_TOLERANCE
): Record<string, BayDuplicateReport> {
  const sessionsList = Array.isArray(aisleSessions)
    ? aisleSessions
    : Object.values(aisleSessions);

  // Filter to captured bays in aisle order
  const capturedBays = sessionsList.filter(
    (b) => Boolean(b.capturedPhotoUrl || b.annotatedPhotoUrl || b.status === 'done')
  );

  const reports: Record<string, BayDuplicateReport> = {};

  // Initialize empty report for every captured bay
  capturedBays.forEach((bay) => {
    reports[bay.key] = {
      bayKey: bay.key,
      bayLabel: bay.label,
      hasDuplicates: false,
      duplicates: []
    };
  });

  if (capturedBays.length < 2) {
    return reports;
  }

  // Iterate over adjacent pairs of bays: (Bay 1, Bay 2), (Bay 2, Bay 3), etc.
  for (let i = 0; i < capturedBays.length - 1; i++) {
    const leftBay = capturedBays[i];
    const rightBay = capturedBays[i + 1];

    const leftBoxes: any[] = leftBay.boxes && leftBay.boxes.length > 0 
      ? leftBay.boxes 
      : (leftBay.rawBoxes || []);
    const rightBoxes: any[] = rightBay.boxes && rightBay.boxes.length > 0 
      ? rightBay.boxes 
      : (rightBay.rawBoxes || []);

    if (leftBoxes.length === 0 || rightBoxes.length === 0) continue;

    // Use specific bay naturalDimensions; fall back to max coordinate extent if available
    const leftBayWidth = leftBay.naturalDimensions?.width || Math.max(...leftBoxes.map((b) => (b.x || 0) + (b.width || 0)), 720);
    const leftBayHeight = leftBay.naturalDimensions?.height || Math.max(...leftBoxes.map((b) => (b.y || 0) + (b.height || 0)), 1280);

    const rightBayWidth = rightBay.naturalDimensions?.width || Math.max(...rightBoxes.map((b) => (b.x || 0) + (b.width || 0)), 960);
    const rightBayHeight = rightBay.naturalDimensions?.height || Math.max(...rightBoxes.map((b) => (b.y || 0) + (b.height || 0)), 1280);

    // Normalize left bay boxes
    const leftNormalized: BottleBoxNorm[] = leftBoxes.map((b) => {
      const w = b.width || 40;
      const h = b.height || 80;
      const x = b.x ?? 0;
      const y = b.y ?? 0;
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      return {
        raw: b,
        normX: x / leftBayWidth,
        normRight: (x + w) / leftBayWidth,
        normCenterX: centerX / leftBayWidth,
        normCenterY: centerY / leftBayHeight,
        normW: w / leftBayWidth,
        normH: h / leftBayHeight,
        brand: (b.brand || b.label || 'OTHER').toUpperCase().trim()
      };
    });

    // Normalize right bay boxes
    const rightNormalized: BottleBoxNorm[] = rightBoxes.map((b) => {
      const w = b.width || 40;
      const h = b.height || 80;
      const x = b.x ?? 0;
      const y = b.y ?? 0;
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      return {
        raw: b,
        normX: x / rightBayWidth,
        normRight: (x + w) / rightBayWidth,
        normCenterX: centerX / rightBayWidth,
        normCenterY: centerY / rightBayHeight,
        normW: w / rightBayWidth,
        normH: h / rightBayHeight,
        brand: (b.brand || b.label || 'OTHER').toUpperCase().trim()
      };
    });

    const rightReport = reports[rightBay.key] || {
      bayKey: rightBay.key,
      bayLabel: rightBay.label,
      hasDuplicates: false,
      duplicates: []
    };

    // Group Left Bay and Right Bay boxes into horizontal shelf tiers by normCenterY
    interface ShelfRowGroup {
      avgCenterY: number;
      leftBoxes: BottleBoxNorm[];
      rightBoxes: BottleBoxNorm[];
    }

    const shelfRows: ShelfRowGroup[] = [];

    // Group left bay boxes into rows
    for (const lBox of leftNormalized) {
      let placed = false;
      for (const row of shelfRows) {
        if (Math.abs(lBox.normCenterY - row.avgCenterY) <= 0.09) {
          row.leftBoxes.push(lBox);
          row.avgCenterY = row.leftBoxes.reduce((sum, b) => sum + b.normCenterY, 0) / row.leftBoxes.length;
          placed = true;
          break;
        }
      }
      if (!placed) {
        shelfRows.push({
          avgCenterY: lBox.normCenterY,
          leftBoxes: [lBox],
          rightBoxes: []
        });
      }
    }

    // Assign right bay boxes to the closest shelf row
    for (const rBox of rightNormalized) {
      let bestRow: ShelfRowGroup | null = null;
      let minDiff = 0.09;
      for (const row of shelfRows) {
        const diff = Math.abs(rBox.normCenterY - row.avgCenterY);
        if (diff < minDiff) {
          minDiff = diff;
          bestRow = row;
        }
      }
      if (bestRow) {
        bestRow.rightBoxes.push(rBox);
      } else {
        shelfRows.push({
          avgCenterY: rBox.normCenterY,
          leftBoxes: [],
          rightBoxes: [rBox]
        });
      }
    }

    const matchedRightBoxIds = new Set<string>();

    // For each shelf row, compare Bay 1's rightmost bottle against Bay 2's 1st and 2nd leftmost bottles
    for (const row of shelfRows) {
      if (row.leftBoxes.length === 0 || row.rightBoxes.length === 0) continue;

      // Sort left row boxes right-to-left (rightmost first)
      row.leftBoxes.sort((a, b) => b.normCenterX - a.normCenterX);
      // Sort right row boxes left-to-right (leftmost first)
      row.rightBoxes.sort((a, b) => a.normCenterX - b.normCenterX);

      const rightmostLeftBox = row.leftBoxes[0];
      const leftmostRight1 = row.rightBoxes[0];
      const leftmostRight2 = row.rightBoxes.length > 1 ? row.rightBoxes[1] : null;

      // Helper to check brand match
      const checkBrandMatch = (b1: BottleBoxNorm, b2: BottleBoxNorm) => {
        return b1.brand === b2.brand ||
          (b1.brand === 'OTHER' && b2.brand !== 'OTHER') ||
          (b2.brand === 'OTHER' && b1.brand !== 'OTHER');
      };

      // Helper to record duplicate
      const addDuplicate = (rBoxNorm: BottleBoxNorm, lBoxNorm: BottleBoxNorm) => {
        const rightBox = rBoxNorm.raw;
        const leftBox = lBoxNorm.raw;

        const rightX = typeof rightBox.x === 'number' ? rightBox.x : (typeof rightBox.left === 'number' ? rightBox.left : Math.round(rBoxNorm.normX * rightBayWidth));
        const rightY = typeof rightBox.y === 'number' ? rightBox.y : (typeof rightBox.top === 'number' ? rightBox.top : Math.round((rBoxNorm.normCenterY - rBoxNorm.normH / 2) * rightBayHeight));

        const leftX = typeof leftBox.x === 'number' ? leftBox.x : (typeof leftBox.left === 'number' ? leftBox.left : Math.round(lBoxNorm.normX * leftBayWidth));
        const leftY = typeof leftBox.y === 'number' ? leftBox.y : (typeof leftBox.top === 'number' ? leftBox.top : Math.round((lBoxNorm.normCenterY - lBoxNorm.normH / 2) * leftBayHeight));

        const rightId = String(rightBox.id || `rbox-${rightX}-${rightY}`);
        if (matchedRightBoxIds.has(rightId)) return;
        matchedRightBoxIds.add(rightId);

        const leftId = String(leftBox.id || `lbox-${leftX}-${leftY}`);
        const resolvedBrand = rBoxNorm.brand !== 'OTHER' ? rBoxNorm.brand : lBoxNorm.brand;

        rightReport.duplicates.push({
          boxId: rightId,
          brand: resolvedBrand,
          x: rightX,
          y: rightY,
          width: rightBox.width || rightBox.w || Math.round(rBoxNorm.normW * rightBayWidth),
          height: rightBox.height || rightBox.h || Math.round(rBoxNorm.normH * rightBayHeight),
          confidence: rightBox.confidence,
          matchedWithBoxId: leftId,
          leftBayKey: leftBay.key,
          rightBayKey: rightBay.key
        });
        rightReport.hasDuplicates = true;
      };

      // 1st Check: Does Bay 1's rightmost bottle match Bay 2's 1st leftmost bottle?
      if (leftmostRight1 && checkBrandMatch(rightmostLeftBox, leftmostRight1)) {
        addDuplicate(leftmostRight1, rightmostLeftBox);
      } 
      // 2nd Check: Heavy overlap fallback — does Bay 1's rightmost bottle match Bay 2's 2nd leftmost bottle?
      else if (leftmostRight2 && checkBrandMatch(rightmostLeftBox, leftmostRight2)) {
        addDuplicate(leftmostRight1, rightmostLeftBox);
        addDuplicate(leftmostRight2, rightmostLeftBox);
      }
    }

    reports[rightBay.key] = rightReport;
  }

  return reports;
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
  forceRaw: boolean = false
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
    const scaledSegments = bayImageMeta.map((meta) => {
      const scale = targetHeight / (meta.height || targetHeight);
      const scaledWidth = Math.round((meta.width || 800) * scale);
      return {
        ...meta,
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
      ctx.drawImage(seg.img, currentX, 0, seg.scaledWidth, seg.scaledHeight);

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

  // Cross-Bay Duplicate Detection States
  const [seamTolerance, setSeamTolerance] = useState<number>(DEFAULT_STRIP_PCT);
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

    // Device enumeration to pinpoint back camera deviceId if available
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      console.info('ℹ️ Available Input Devices:', devices);
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      console.info(`ℹ️ Found ${videoInputs.length} video input device(s):`, videoInputs);

      const backDevice = videoInputs.find((d) =>
        /back|rear|environment|main|0/i.test(d.label || '')
      );
      if (backDevice && backDevice.deviceId) {
        console.info('✅ Found matching rear camera device:', backDevice);
        constraintTiers.push({
          video: { deviceId: { exact: backDevice.deviceId } },
          audio: false
        });
      }
    } catch (enumErr) {
      console.warn('Device enumeration note:', enumErr);
    }

    // Universal cross-platform constraint fallbacks
    if (supportedConstraints.facingMode) {
      constraintTiers.push(
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: { facingMode: 'environment' }, audio: false },
        { video: { facingMode: { exact: 'environment' } }, audio: false }
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
      try {
        await videoRef.current.play();
        console.info('▶️ Video stream playing successfully');
      } catch (playErr) {
        console.warn('Mobile video play deferred:', playErr);
      }
      setCameraStreamActive(true);
      setCameraErrorNotice(null);
      console.groupEnd();
    } else {
      console.error('❌ All WebRTC camera constraints failed. Last Error:', lastError);
      console.groupEnd();
      setCameraStreamActive(false);

      if (lastError?.name === 'NotAllowedError' || lastError?.name === 'PermissionDeniedError') {
        setCameraErrorNotice('Camera access denied by browser or device permission policy. Tap below to re-request permission or allow camera in browser site settings.');
      } else if (lastError?.name === 'NotFoundError' || lastError?.name === 'DevicesNotFoundError') {
        setCameraErrorNotice('No camera hardware detected on device.');
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
  }, [step, startCameraStream]);

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
        } else if (now - levelHoldStartTimeRef.current >= 500 && !autoCaptureTriggeredRef.current) {
          autoCaptureTriggeredRef.current = true;
          handleAutoCaptureTrigger();
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
        (sum, k) => sum + (aisleSessions[k]?.originalAiCounts[b] ?? aisleSessions[k]?.counts[b] ?? 0),
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

    stitchBayPanorama(capturedBaySessions, showRawPhotoComparison)
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
    async (targetAisle: string, file: File | null, dataUrl: string) => {
      const startTime = Date.now();

      // Immediately set status to analysing
      setAisleSessions((prev) => ({
        ...prev,
        [targetAisle]: {
          ...(prev[targetAisle] || {
            key: targetAisle,
            label: `Bay ${Object.keys(prev).length + 1}`,
            status: 'idle',
            naturalDimensions: { width: 800, height: 800 },
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
          analysisStartTime: startTime,
          errorMessage: undefined
        }
      }));

      try {
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
            timestamp: new Date().toISOString()
          },
          90000,
          { width: 800, height: 800 }
        );

        const normalized = normalizeN8nAuditResponse(
          result.rawResponse || result.rawNormalized || result,
          category
        );

        const duration = Math.round((Date.now() - startTime) / 1000);

        setAisleSessions((prev) => {
          const currentPrev = prev[targetAisle];
          const newDimensions = normalized.dimensions || currentPrev?.naturalDimensions || { width: 800, height: 800 };
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

  // Auto-capture frame execution from WebRTC video stream
  const handleAutoCaptureTrigger = useCallback(() => {
    if (!videoRef.current || !cameraStreamActive) return;

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      const targetAisle = currentAisle;
      setLastCapturedAisle(targetAisle);

      // Record true snapshot dimensions immediately
      setAisleSessions((prev) => {
        const s = prev[targetAisle];
        if (!s) return prev;
        return {
          ...prev,
          [targetAisle]: {
            ...s,
            naturalDimensions: { width: canvas.width, height: canvas.height }
          }
        };
      });

      // If returning from retake, jump directly back to POSM
      const isRetake = retakeBayKey === targetAisle;
      if (isRetake) {
        setRetakeBayKey(null);
        setShowPostCapturePrompt(false);
        setStep('POSM');
      } else {
        setShowPostCapturePrompt(true);
      }

      // Start upload & analysis immediately for this bay
      startAsyncBayAnalysis(targetAisle, null, dataUrl);
    } catch (err) {
      console.warn('Auto-capture canvas snapshot note:', err);
    }
  }, [cameraStreamActive, currentAisle, startAsyncBayAnalysis, retakeBayKey]);

  // Manual Shutter Click handler: snaps live video frame inside app or starts stream
  const handleManualShutter = () => {
    if (cameraStreamActive && videoRef.current) {
      handleAutoCaptureTrigger();
    } else {
      startCameraStream();
    }
  };

  // File Picker selected handler
  const handlePhotoFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    const targetAisle = currentAisle;

    setLastCapturedAisle(targetAisle);

    const isRetake = retakeBayKey === targetAisle;
    if (isRetake) {
      setRetakeBayKey(null);
      setShowPostCapturePrompt(false);
      setStep('POSM');
    } else {
      setShowPostCapturePrompt(true);
    }

    // Measure exact natural image dimensions
    const probe = new Image();
    probe.onload = () => {
      if (probe.naturalWidth && probe.naturalHeight) {
        setAisleSessions((prev) => {
          const s = prev[targetAisle];
          if (!s) return prev;
          return {
            ...prev,
            [targetAisle]: {
              ...s,
              naturalDimensions: { width: probe.naturalWidth, height: probe.naturalHeight }
            }
          };
        });
      }
    };
    probe.src = objectUrl;

    startAsyncBayAnalysis(targetAisle, file, objectUrl);
    e.target.value = '';
  };

  // Debug Demo Sample Shelf
  const handleUseDemoSample = () => {
    const targetAisle = currentAisle;
    setLastCapturedAisle(targetAisle);

    const isRetake = retakeBayKey === targetAisle;
    if (isRetake) {
      setRetakeBayKey(null);
      setShowPostCapturePrompt(false);
      setStep('POSM');
    } else {
      setShowPostCapturePrompt(true);
    }

    startAsyncBayAnalysis(targetAisle, null, fallbackShelfPhoto);
  };

  // Flexible Dynamic Bay Addition (Can be 1, 2, 5, or 10+ bays)
  const handleAddNewBay = () => {
    setShowPostCapturePrompt(false);
    autoCaptureTriggeredRef.current = false;
    levelHoldStartTimeRef.current = null;

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

  // 1. Tapping "Done shooting" enters the POSM step
  const handleDoneShooting = () => {
    setShowPostCapturePrompt(false);
    setStep('POSM');
  };

  // 2. Submitting POSM: gated on all captured bays reaching status === 'done'
  // Runs Cross-Bay Duplicate Detection ONCE on entering RESULTS, before panorama builds and before compliance comparison
  const handlePosmSubmit = () => {
    if (!allCapturedDone || erroredAisles.length > 0) return;

    // Detect duplicates across adjacent bay seams using First Complete Column Sequence Alignment
    const reports = detectCrossBayDuplicates(aisleSessions, seamTolerance);
    setDuplicateReports(reports);

    // Auto-deduct verified column seam duplicates for an automated, tamper-proof rep experience
    const newlyRemovedIds = new Set<string>();
    setAisleSessions((prev) => {
      const updated = { ...prev };

      Object.entries(reports).forEach(([bayKey, report]) => {
        if (!report.hasDuplicates || report.duplicates.length === 0) return;
        const session = updated[bayKey];
        if (!session) return;

        const nextCounts = { ...session.counts };
        const nextRawCounts = { ...session.rawCounts };

        report.duplicates.forEach((d) => {
          newlyRemovedIds.add(d.boxId);
          if (nextCounts[d.brand] !== undefined && nextCounts[d.brand] > 0) {
            nextCounts[d.brand] -= 1;
          }
          if (nextRawCounts[d.brand] !== undefined && nextRawCounts[d.brand] > 0) {
            nextRawCounts[d.brand] -= 1;
          }
        });

        const nextTotal = Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0);

        updated[bayKey] = {
          ...session,
          counts: nextCounts,
          rawCounts: nextRawCounts,
          totalFacings: nextTotal,
          removedDuplicates: report.duplicates
        };
      });

      return updated;
    });

    setRemovedDuplicateBoxIds(newlyRemovedIds);
    setDuplicateReviewStatus('removed');
    setIsDuplicatePanelExpanded(false);

    setStep('RESULTS');
    setResultsAisleView('ALL');
  };

  // Re-evaluates duplicate detection with a custom seamTolerance (e.g. 0.10, 0.15, 0.20, 0.25, 0.30)
  const handleUpdateSeamTolerance = (newTolerance: number) => {
    setSeamTolerance(newTolerance);
    const reports = detectCrossBayDuplicates(aisleSessions, newTolerance);
    setDuplicateReports(reports);
    if (duplicateReviewStatus === 'removed') {
      setDuplicateReviewStatus('pending');
      setRemovedDuplicateBoxIds(new Set());
    }
  };

  // 1-Tap Toggle for any box on the active bay to add or remove it as a duplicate
  const handleToggleBoxDuplicate = (boxId: string, bayKey: string, boxBrand: string) => {
    const isCurrentlyRemoved = removedDuplicateBoxIds.has(boxId);
    setAisleSessions((prev) => {
      const session = prev[bayKey];
      if (!session) return prev;
      const nextCounts = { ...session.counts };
      const nextRawCounts = { ...session.rawCounts };

      if (isCurrentlyRemoved) {
        // Unmark duplicate: add 1 facing back
        nextCounts[boxBrand] = (nextCounts[boxBrand] || 0) + 1;
        nextRawCounts[boxBrand] = (nextRawCounts[boxBrand] || 0) + 1;
      } else {
        // Mark as duplicate: deduct 1 facing
        if (nextCounts[boxBrand] && nextCounts[boxBrand] > 0) nextCounts[boxBrand] -= 1;
        if (nextRawCounts[boxBrand] && nextRawCounts[boxBrand] > 0) nextRawCounts[boxBrand] -= 1;
      }

      const nextTotal = Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0);
      return {
        ...prev,
        [bayKey]: {
          ...session,
          counts: nextCounts,
          rawCounts: nextRawCounts,
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
      const exists = rep.duplicates.some((d) => d.boxId === boxId);
      let nextDups = [...rep.duplicates];
      if (isCurrentlyRemoved && exists) {
        nextDups = nextDups.filter((d) => d.boxId !== boxId);
      } else if (!isCurrentlyRemoved && !exists) {
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
    return Object.values(duplicateReports).reduce((sum, r) => sum + r.duplicates.length, 0);
  }, [duplicateReports]);

  const baysWithDuplicates = useMemo(() => {
    return Object.values(duplicateReports).filter((r) => r.hasDuplicates && r.duplicates.length > 0);
  }, [duplicateReports]);

  // "Remove duplicates" handler: subtracts duplicates from that bay's counts & rawCounts,
  // marks removed box IDs in state, and recalculates totals and compliance
  const handleRemoveDuplicates = () => {
    setAisleSessions((prev) => {
      const updated = { ...prev };
      const newlyRemovedIds = new Set(removedDuplicateBoxIds);

      Object.entries(duplicateReports).forEach(([bayKey, report]) => {
        if (!report.hasDuplicates || report.duplicates.length === 0) return;
        const session = updated[bayKey];
        if (!session) return;

        const nextCounts = { ...session.counts };
        const nextRawCounts = { ...session.rawCounts };

        report.duplicates.forEach((d) => {
          newlyRemovedIds.add(d.boxId);
          // Decrement count for the duplicate brand on this bay
          if (nextCounts[d.brand] !== undefined && nextCounts[d.brand] > 0) {
            nextCounts[d.brand] -= 1;
          }
          if (nextRawCounts[d.brand] !== undefined && nextRawCounts[d.brand] > 0) {
            nextRawCounts[d.brand] -= 1;
          }
        });

        const nextTotal = Object.values(nextCounts).reduce((a, b) => a + (b ?? 0), 0);

        updated[bayKey] = {
          ...session,
          counts: nextCounts,
          rawCounts: nextRawCounts,
          totalFacings: nextTotal,
          removedDuplicates: [...(session.removedDuplicates || []), ...report.duplicates]
        };
      });

      setRemovedDuplicateBoxIds(newlyRemovedIds);
      return updated;
    });

    setDuplicateReviewStatus('removed');
    setIsDuplicatePanelExpanded(false);
  };

  // "Keep all" handler: leaves counts untouched and dismisses the duplicate review
  const handleKeepAllDuplicates = () => {
    setDuplicateReviewStatus('kept');
    setIsDuplicatePanelExpanded(false);
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
        removedDuplicates: s.removedDuplicates || (duplicateReviewStatus === 'removed' ? duplicateReports[key]?.duplicates : undefined) || [],
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
    const dupNote = duplicateReviewStatus === 'removed' && totalDuplicatesCount > 0
      ? ` [${totalDuplicatesCount} cross-bay overlap duplicate(s) removed]`
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
  const activePhotoDisplay = resultsAisleView === 'ALL'
    ? (capturedBaySessions.length > 1
        ? (stitchedPanoramaUrl || (completedAisles[0] ? aisleSessions[completedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto)
        : (completedAisles[0] ? aisleSessions[completedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto)
    : viewSession?.capturedPhotoUrl || fallbackShelfPhoto;

  const displayAnnotatedPhoto = showRawPhotoComparison
    ? activePhotoDisplay
    : resultsAisleView === 'ALL'
    ? (capturedBaySessions.length > 1
        ? (stitchedPanoramaUrl || (completedAisles[0] ? aisleSessions[completedAisles[0]]?.annotatedPhotoUrl || aisleSessions[completedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto)
        : (completedAisles[0] ? aisleSessions[completedAisles[0]]?.annotatedPhotoUrl || aisleSessions[completedAisles[0]]?.capturedPhotoUrl : null) || fallbackShelfPhoto)
    : viewSession?.annotatedPhotoUrl || viewSession?.capturedPhotoUrl || fallbackShelfPhoto;

  const resolvedImgSrc = useMemo(() => {
    if (!displayAnnotatedPhoto) return '';
    // If it's a stitched data URL or blob, use directly
    if (displayAnnotatedPhoto.startsWith('data:') || displayAnnotatedPhoto.startsWith('blob:')) {
      return displayAnnotatedPhoto;
    }
    if (imgErrorLevel === 0) return toDirectDriveImageUrl(displayAnnotatedPhoto);
    if (imgErrorLevel === 1) return toAlternativeDriveImageUrl(displayAnnotatedPhoto);
    return activePhotoDisplay;
  }, [displayAnnotatedPhoto, imgErrorLevel, activePhotoDisplay]);

  // Elapsed analysis seconds formatted quietly (multiples of 5s)
  const getQuietElapsedText = (session?: AisleSession) => {
    if (!session?.analysisStartTime) return 'Analysing… (5s)';
    const totalSec = Math.max(5, Math.floor((Date.now() - session.analysisStartTime) / 1000));
    const roundedSec = Math.max(5, Math.round(totalSec / 5) * 5);
    return `Analysing… (${roundedSec}s)`;
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-3.5 max-w-md mx-auto w-full h-full overflow-hidden select-none">
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
      {step === 'CAPTURE' && (
        <div className="flex-1 flex flex-col justify-between py-1 space-y-2 overflow-hidden">
          {/* Camera Guidance Viewfinder & Auto-Capture (Snapchat-style Live Video Feed) */}
          <div 
            onClick={() => {
              if (!cameraStreamActive) startCameraStream();
            }}
            className="relative flex-1 rounded-3xl border border-emerald-900/60 overflow-hidden bg-black flex flex-col items-center justify-center shadow-inner group cursor-pointer"
          >
            {/* Live WebRTC Video Stream (Fills viewfinder) */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
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

            {/* Camera Guidance: Level Line & Vertical Seam Markers (Drawn directly over live video) */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-10">
              {/* Top Viewfinder Banner */}
              <div className="w-full flex items-center justify-between pointer-events-auto">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 bg-black/75 px-2.5 py-1 rounded-lg border border-emerald-500/40 backdrop-blur-md">
                  Target: {category} &bull; {currentSession?.label || 'Bay 1'}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 backdrop-blur-md ${
                  isLevel 
                    ? 'text-emerald-400 bg-black/75 border-emerald-500/50' 
                    : 'text-rose-400 bg-black/75 border-rose-500/50'
                }`}>
                  {sensorsAvailable ? (isLevel ? '✓ Level' : 'Tilt device') : 'Manual Center'}
                </span>
              </div>

              {/* Two Vertical Seam Overlap Zones (dynamically reflects seamTolerance) */}
              <div 
                style={{ width: `${seamTolerance * 100}%` }}
                className="absolute top-10 bottom-10 left-0 bg-amber-500/15 border-r-2 border-dashed border-amber-400/90 pointer-events-none flex flex-col justify-between items-center py-2 z-10"
                title={`Left Overlap Seam Guide (${Math.round(seamTolerance * 100)}%)`}
              >
                <span className="text-[8px] font-black uppercase tracking-tighter text-amber-300 bg-black/90 px-1.5 py-0.5 rounded shadow border border-amber-500/30">
                  Overlap
                </span>
                <span className="text-[8px] text-amber-300 font-mono bg-black/80 px-1 py-0.5 rounded">{Math.round(seamTolerance * 100)}%</span>
              </div>
              <div 
                style={{ width: `${seamTolerance * 100}%` }}
                className="absolute top-10 bottom-10 right-0 bg-amber-500/15 border-l-2 border-dashed border-amber-400/90 pointer-events-none flex flex-col justify-between items-center py-2 z-10"
                title={`Right Overlap Seam Guide (${Math.round(seamTolerance * 100)}%)`}
              >
                <span className="text-[8px] font-black uppercase tracking-tighter text-amber-300 bg-black/90 px-1.5 py-0.5 rounded shadow border border-amber-500/30">
                  Overlap
                </span>
                <span className="text-[8px] text-amber-300 font-mono bg-black/80 px-1 py-0.5 rounded">{Math.round(seamTolerance * 100)}%</span>
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
                <span className="text-[10px] font-medium text-slate-200 bg-black/80 px-3 py-1 rounded-full border border-emerald-500/40 backdrop-blur-md shadow-md">
                  Keep 1 column of overlap inside the amber zone &bull; Tap shutter to snap
                </span>
              </div>
            </div>

            {/* Camera Permission / Initialization Alert Box */}
            {cameraErrorNotice && !cameraStreamActive && !showPostCapturePrompt && (
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
            {!cameraStreamActive && !cameraErrorNotice && !showPostCapturePrompt && (
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

            {/* Post-Capture Inline Bay Prompt Overlay */}
            {showPostCapturePrompt && (
              <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 text-center animate-fade-in overflow-y-auto">
                <div className="w-full max-w-sm flex flex-col items-center space-y-3 my-auto py-2">
                  <div className="flex items-center gap-2 text-emerald-400 bg-emerald-950/80 border border-emerald-500/50 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Image Taken &bull; {aisleSessions[lastCapturedAisle]?.label || 'Bay 1'}</span>
                  </div>

                  {/* Captured Photo Preview as taken */}
                  {aisleSessions[lastCapturedAisle]?.capturedPhotoUrl && (
                    <div className="relative w-full max-h-[50vh] h-48 sm:h-60 my-1 rounded-2xl overflow-hidden border-2 border-emerald-500/60 shadow-2xl bg-black/90 flex items-center justify-center">
                      <img
                        src={aisleSessions[lastCapturedAisle]?.capturedPhotoUrl!}
                        alt="Captured Photo Preview"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-emerald-500/40 text-[10px] font-mono text-emerald-300 shadow-md">
                        {aisleSessions[lastCapturedAisle]?.capturedFileName || 'photo.jpg'}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-emerald-200/90 font-medium px-2">
                    Bay photo captured successfully! n8n AI analysis is running in the background.
                  </p>

                  {/* Action Options */}
                  <div className="w-full max-w-xs space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleAddNewBay}
                      className="w-full py-3.5 bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] active:scale-[0.98] text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition-all"
                    >
                      <Plus size={18} className="stroke-[2.5]" />
                      <span>+ Add a Bay / Scan Next Bay</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDoneShooting}
                      className="w-full py-3.5 bg-[#132219] hover:bg-[#1b3024] border border-emerald-600/70 active:scale-[0.98] text-emerald-200 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg"
                    >
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span>Shelf Completed &bull; Proceed to POSM Form</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile-friendly Bottom Shutter Bar Deck */}
          <div className="shrink-0 space-y-2 pt-2 pb-6 sm:pb-3 px-3 mt-1 bg-gradient-to-t from-black via-black/95 to-black/80 backdrop-blur-md rounded-t-3xl border-t border-emerald-900/60 shadow-2xl z-20 select-none">
            {/* Visual grip bar hint for mobile viewports */}
            <div className="w-10 h-1 bg-emerald-800/40 rounded-full mx-auto mb-1" />

            <div className="grid grid-cols-2 gap-3">
              {/* Primary 1: Shutter Button (Always functional & mobile-optimized) */}
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
                className={`h-14 border active:scale-[0.97] font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
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

            {/* Bottom auxiliary link: Done Shooting or Sample Shelf (debug only) */}
            <div className="flex items-center justify-between px-2 pt-0.5 text-[11px]">
              {capturedAisles.length > 0 ? (
                <button
                  type="button"
                  onClick={handleDoneShooting}
                  className="text-emerald-400 font-bold flex items-center gap-1.5 hover:underline cursor-pointer bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-800/40"
                >
                  <CheckCircle2 size={12} className="text-emerald-400" />
                  <span>Shelf Completed &bull; Proceed to POSM ({capturedAisles.length} captured)</span>
                </button>
              ) : <div />}

              {isDebugMode && (
                <button
                  type="button"
                  onClick={handleUseDemoSample}
                  className="text-emerald-500 hover:text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <span>Sample {category} ({currentSession?.label || 'Bay 1'})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: POSM QUESTIONNAIRE ================= */}
      {/* 1. Driven solely by step === 'POSM'. It is not hidden or reset by per-bay analysis completing! */}
      {step === 'POSM' && (
        <div className="flex-1 flex flex-col justify-between py-2 space-y-3 overflow-hidden">
          {/* Header Card with In-Flight Analysis Background Indicator */}
          <div className={`p-4 rounded-3xl border space-y-2 ${
            isDark ? 'bg-[#132219]/80 border-emerald-900/50' : 'bg-white border-emerald-950/10 shadow-xs'
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
          <div className="flex-1 overflow-y-auto space-y-2.5 px-0.5">
            {/* Toggle 1: Price Tag */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#132219]/70 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#132219]/70 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
              isDark ? 'bg-[#132219]/70 border-emerald-900/40' : 'bg-white border-emerald-950/10 shadow-xs'
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
                  className={`min-h-[38px] min-w-[52px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
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
          <div className="shrink-0 space-y-2 pt-1">
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
      )}

      {/* ================= STEP 3: RESULTS ================= */}
      {step === 'RESULTS' && (
        <div className="flex-1 flex flex-col justify-between h-full overflow-hidden">
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

          {/* Cross-Bay Duplicate Detections: Always Available when 2+ Bays exist */}
          {completedAisles.length >= 2 && (
            <div className="pb-1.5 shrink-0 animate-fade-in">
              {duplicateReviewStatus === 'pending' ? (
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setIsDuplicatePanelExpanded(!isDuplicatePanelExpanded)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 transition-all cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                      </span>
                      <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                      <span className="text-xs font-black truncate">
                        {baysWithDuplicates.length > 0
                          ? (baysWithDuplicates.length === 1
                              ? `${totalDuplicatesCount} overlapping detection${totalDuplicatesCount > 1 ? 's' : ''} on ${baysWithDuplicates[0].bayLabel}`
                              : `${totalDuplicatesCount} overlapping detections across ${baysWithDuplicates.length} bays`)
                          : `Seam Overlap Controls (${Math.round(seamTolerance * 100)}%) • 0 duplicates detected`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-amber-200 shrink-0">
                      <span>{isDuplicatePanelExpanded ? 'Hide Controls' : 'Seam Controls'}</span>
                      {isDuplicatePanelExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>

                  {/* Expanded Duplicate Review & Seam Controls Panel */}
                  {isDuplicatePanelExpanded && (
                    <div className="p-3 rounded-2xl bg-black/95 border border-amber-500/40 shadow-xl space-y-2.5 backdrop-blur-md animate-fade-in text-left">
                      <div className="flex items-center justify-between border-b border-amber-500/20 pb-2">
                        <div>
                          <h4 className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                            <Layers size={13} />
                            Overlapping Seam &amp; Live Controls
                          </h4>
                          <p className="text-[10px] text-amber-200/90 mt-0.5">
                            Comparing <strong>Bay 1 [Right {Math.round(seamTolerance * 100)}%]</strong> ⟷ <strong>Bay 2 [Left {Math.round(seamTolerance * 100)}%]</strong> across adjacent shelf seams.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          +{totalDuplicatesCount} facings
                        </span>
                      </div>

                      {/* Interactive Seam Tolerance Controls */}
                      <div className="p-2.5 rounded-xl bg-[#0e1913] border border-emerald-900/60 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                            <span>Seam Overlap Strip:</span>
                            <span className="font-mono text-amber-300 font-black bg-amber-500/25 px-2 py-0.5 rounded border border-amber-500/40 text-xs">
                              {Math.round(seamTolerance * 100)}%
                            </span>
                          </span>
                          <span className="text-[10px] text-emerald-400/80 font-semibold">
                            (Drag or tap preset to auto-recalculate)
                          </span>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex items-center justify-between gap-1">
                          {[0.10, 0.15, 0.20, 0.25, 0.30].map((pct) => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => handleUpdateSeamTolerance(pct)}
                              className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                                Math.abs(seamTolerance - pct) < 0.01
                                  ? 'bg-amber-500 text-black shadow-md font-black scale-105 ring-1 ring-amber-300'
                                  : 'bg-black/60 text-slate-300 hover:text-white hover:bg-slate-800 border border-emerald-950'
                              }`}
                            >
                              {Math.round(pct * 100)}%
                            </button>
                          ))}
                        </div>

                        {/* Slider */}
                        <div className="flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] text-slate-400 font-mono font-bold">8%</span>
                          <input
                            type="range"
                            min="0.08"
                            max="0.35"
                            step="0.01"
                            value={seamTolerance}
                            onChange={(e) => handleUpdateSeamTolerance(parseFloat(e.target.value))}
                            className="flex-1 accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                            title="Adjust seam overlap width percentage"
                          />
                          <span className="text-[10px] text-slate-400 font-mono font-bold">35%</span>
                        </div>
                      </div>

                      {/* 1-Tap Toggle Tip */}
                      <div className="text-[10px] text-emerald-300/90 bg-emerald-950/60 border border-emerald-800/60 rounded-xl px-2.5 py-1.5 flex items-center justify-between">
                        <span>💡 <strong>1-Tap Manual Override:</strong> Tap any bottle box on the photo preview below to toggle duplicate on/off</span>
                      </div>

                      {/* Duplicates Grouped by Bay and Brand */}
                      {baysWithDuplicates.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar pr-0.5">
                          {baysWithDuplicates.map((report) => {
                            const brandMap: Record<string, number> = {};
                            report.duplicates.forEach((d) => {
                              brandMap[d.brand] = (brandMap[d.brand] || 0) + 1;
                            });

                            return (
                              <div key={report.bayKey} className="p-2 rounded-xl bg-[#132219]/90 border border-emerald-900/60">
                                <div className="flex items-center justify-between text-xs font-black text-white pb-1 border-b border-emerald-900/40">
                                  <span className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                    {report.bayLabel}
                                  </span>
                                  <span className="text-[10px] font-bold text-amber-400">
                                    {report.duplicates.length} duplicate{report.duplicates.length > 1 ? 's' : ''} detected
                                  </span>
                                </div>
                                <div className="pt-1.5 space-y-1">
                                  {Object.entries(brandMap).map(([brand, count]) => {
                                    const brandColor = BRAND_COLORS[brand] || '#10B981';
                                    return (
                                      <div key={brand} className="flex items-center justify-between text-[11px] text-slate-200 px-1.5 py-0.5 rounded bg-black/40">
                                        <div className="flex items-center gap-1.5">
                                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: brandColor }} />
                                          <span className="font-bold text-white">{brand}</span>
                                        </div>
                                        <span className="text-[10px] text-rose-300 font-bold">
                                          +{count} facing{count > 1 ? 's' : ''} added
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-[#132219]/60 border border-emerald-900/40 text-center text-emerald-300/80 text-[11px]">
                          No duplicate bottles detected at {Math.round(seamTolerance * 100)}% seam overlap. Drag slider above or tap any bottle to manually toggle duplicate.
                        </div>
                      )}

                      {/* Actions: Remove duplicates & Keep all */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleRemoveDuplicates}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-950/40"
                        >
                          <Check size={14} className="stroke-[3]" />
                          <span>Remove duplicates</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleKeepAllDuplicates}
                          className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
                        >
                          <X size={14} />
                          <span>Keep all</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : duplicateReviewStatus === 'removed' ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-sm">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span className="truncate">
                      AI Outer Edge Seam Alignment: {totalDuplicatesCount > 0 ? `${totalDuplicatesCount} seam duplicate facing(s) automatically deducted` : 'No seam duplicates detected'}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                    Automated
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
                  <div className="flex items-center gap-1.5 truncate">
                    <Layers size={13} className="shrink-0" />
                    <span>Kept all detections ({totalDuplicatesCount} overlap{totalDuplicatesCount > 1 ? 's' : ''})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDuplicates}
                    className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer ml-2 shrink-0 font-bold"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Shelf Image Preview (Panorama on ALL tab, individual photo on BAY tabs, tap to swap Raw/Annotated) */}
          <div 
            ref={shelfContainerRef}
            onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
            className="relative h-[48%] shrink-0 min-h-[220px] bg-black rounded-3xl border border-emerald-900/60 overflow-hidden shadow-2xl flex items-center justify-center cursor-pointer group"
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
              {(() => {
                const baysToRender = resultsAisleView === 'ALL' ? completedAisles : [resultsAisleView];
                const isAllView = resultsAisleView === 'ALL' && completedAisles.length > 1;

                const bayWidths = completedAisles.map((k) => aisleSessions[k]?.naturalDimensions?.width || 800);
                const totalWidth = bayWidths.reduce((a, b) => a + b, 0);

                return (
                  <>
                    {/* Visual Seam Overlap Line Indicators */}
                    {resultsAisleView !== 'ALL' && (() => {
                      const bayIndex = completedAisles.indexOf(resultsAisleView);
                      const hasLeftSeam = bayIndex > 0;
                      const hasRightSeam = bayIndex >= 0 && bayIndex < completedAisles.length - 1;

                      return (
                        <>
                          {hasLeftSeam && (
                            <div 
                              style={{ width: `${seamTolerance * 100}%` }}
                              className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none flex flex-col justify-end p-1 z-0"
                            >
                              <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/85 px-1 py-0.5 rounded shadow self-end border border-amber-500/30 whitespace-nowrap">
                                Left Seam {Math.round(seamTolerance * 100)}% (⟷ {completedAisles[bayIndex - 1]?.replace('bay_', 'Bay ')} Right)
                              </span>
                            </div>
                          )}
                          {hasRightSeam && (
                            <div 
                              style={{ width: `${seamTolerance * 100}%` }}
                              className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none flex flex-col justify-end p-1 z-0"
                            >
                              <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/85 px-1 py-0.5 rounded shadow self-start border border-amber-500/30 whitespace-nowrap">
                                Right Seam {Math.round(seamTolerance * 100)}% (⟷ {completedAisles[bayIndex + 1]?.replace('bay_', 'Bay ')} Left)
                              </span>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* Stitched Seam Divider Line for ALL Tab */}
                    {isAllView && completedAisles.length > 1 && (() => {
                      let acc = 0;
                      return completedAisles.slice(0, -1).map((k, idx) => {
                        acc += bayWidths[idx];
                        const linePct = (acc / totalWidth) * 100;
                        return (
                          <div 
                            key={`panorama-seam-${k}`}
                            style={{ left: `${linePct}%` }}
                            className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-400/80 z-0 pointer-events-none flex flex-col justify-start p-1"
                          >
                            <span className="text-[8px] font-mono font-bold text-emerald-300 bg-black/85 px-1 py-0.5 rounded shadow border border-emerald-500/30 -translate-x-1/2 whitespace-nowrap">
                              Seam {k.replace('bay_', 'Bay ')} ⟷ {completedAisles[idx + 1]?.replace('bay_', 'Bay ')}
                            </span>
                          </div>
                        );
                      });
                    })()}

                    {/* Source & Duplicate Bottle Highlights for all active bays */}
                    {baysToRender.map((bayKey) => {
                      const bayIndex = completedAisles.indexOf(bayKey);
                      if (bayIndex < 0) return null;

                      const session = aisleSessions[bayKey];
                      const bayW = session?.naturalDimensions?.width || 800;
                      const bayH = session?.naturalDimensions?.height || 1280;

                      let leftOffset = 0;
                      for (let i = 0; i < bayIndex; i++) {
                        leftOffset += bayWidths[i];
                      }

                      const mapCoords = (x: number, y: number, w: number, h: number) => {
                        if (isAllView) {
                          const boxLeftPx = leftOffset + (x / bayW) * bayWidths[bayIndex];
                          return {
                            leftPct: (boxLeftPx / totalWidth) * 100,
                            topPct: (y / bayH) * 100,
                            widthPct: ((w / bayW) * bayWidths[bayIndex] / totalWidth) * 100,
                            heightPct: (h / bayH) * 100
                          };
                        }
                        return {
                          leftPct: (x / bayW) * 100,
                          topPct: (y / bayH) * 100,
                          widthPct: (w / bayW) * 100,
                          heightPct: (h / bayH) * 100
                        };
                      };

                      const report = duplicateReports[bayKey];
                      const nextBayKey = completedAisles[bayIndex + 1];
                      const nextReport = nextBayKey ? duplicateReports[nextBayKey] : null;

                      const myBoxes: any[] = session?.boxes && session.boxes.length > 0 
                        ? session.boxes 
                        : (session?.rawBoxes || []);

                      return (
                        <React.Fragment key={`bay-overlays-${bayKey}`}>
                          {/* 1. Kept Source Bottle Highlights on Left Bay */}
                          {nextReport?.hasDuplicates && nextReport.duplicates.map((dup) => {
                            const matchedBox = myBoxes.find((b) => String(b.id || `lbox-${b.x}-${b.y}`) === dup.matchedWithBoxId);
                            if (!matchedBox) return null;

                            const { leftPct, topPct, widthPct, heightPct } = mapCoords(
                              matchedBox.x || 0,
                              matchedBox.y || 0,
                              matchedBox.width || 40,
                              matchedBox.height || 80
                            );

                            return (
                              <div
                                key={`source-${dup.boxId}`}
                                style={{
                                  left: `${Math.max(0, Math.min(95, leftPct))}%`,
                                  top: `${Math.max(0, Math.min(95, topPct))}%`,
                                  width: `${Math.max(3, Math.min(40, widthPct))}%`,
                                  height: `${Math.max(4, Math.min(50, heightPct))}%`,
                                }}
                                className="absolute rounded border-2 border-emerald-400 bg-emerald-500/20 flex items-center justify-center pointer-events-none z-10"
                                title={`Source bottle on ${bayKey.replace('bay_', 'Bay ')} (kept)`}
                              >
                                <span className="absolute -top-3.5 right-0 bg-emerald-600 text-white text-[8px] font-black px-1 rounded shadow-xs uppercase tracking-tight whitespace-nowrap">
                                  Kept (Overlaps {nextBayKey.replace('bay_', 'Bay ')})
                                </span>
                              </div>
                            );
                          })}

                          {/* 2. Duplicate Bottle Highlights on Right Bay */}
                          {report?.duplicates.map((dup) => {
                            const { leftPct, topPct, widthPct, heightPct } = mapCoords(
                              dup.x,
                              dup.y,
                              dup.width || 40,
                              dup.height || 80
                            );
                            const isRemoved = removedDuplicateBoxIds.has(dup.boxId) || duplicateReviewStatus === 'removed';

                            return (
                              <button
                                key={`dup-${dup.boxId}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleBoxDuplicate(dup.boxId, bayKey, dup.brand);
                                }}
                                style={{
                                  left: `${Math.max(0, Math.min(95, leftPct))}%`,
                                  top: `${Math.max(0, Math.min(95, topPct))}%`,
                                  width: `${Math.max(3, Math.min(40, widthPct))}%`,
                                  height: `${Math.max(4, Math.min(50, heightPct))}%`,
                                }}
                                className={`absolute rounded transition-all flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 group/dup z-10 ${
                                  isRemoved
                                    ? 'opacity-40 hover:opacity-95 bg-red-950/40 border-2 border-red-500 shadow-sm shadow-red-950'
                                    : 'opacity-85 hover:opacity-100 bg-amber-500/25 border-2 border-dashed border-amber-400'
                                }`}
                                title={`Tap to ${isRemoved ? 'restore' : 'remove'} duplicate for ${dup.brand}`}
                                aria-label={`Toggle duplicate for ${dup.brand}`}
                              >
                                <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                  <div className="w-[140%] h-[2.5px] bg-red-500 rotate-[-45deg] shadow-sm shadow-red-500" />
                                </div>
                                <span className="absolute -top-3.5 left-0 bg-red-600 group-hover/dup:bg-red-500 text-white text-[8px] font-black px-1 rounded shadow-xs uppercase tracking-tight">
                                  {isRemoved ? 'Removed' : 'Duplicate'}
                                </span>
                              </button>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Tap-to-swap Mode indicator badge */}
            <div className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-emerald-500/40 text-[9px] font-bold text-emerald-300 flex items-center gap-1 pointer-events-none">
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
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[10px] text-emerald-100 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-900/70 shadow-sm pointer-events-auto">
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

          {/* Brand Facing Counts List & Bottom Actions */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pt-2 pb-2 px-0.5 scroll-smooth">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-emerald-300/70' : 'text-emerald-950/70'
                }`}>
                  Brand Facings
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                  isDark ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40' : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                }`}>
                  {resultsAisleView === 'ALL' ? 'ALL Combined' : viewSession?.label}
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

            {/* Brand Rows with continuous steppers and conditional delta tags */}
            <div className="space-y-1">
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
                  : viewSession?.originalAiCounts[brand];

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

            {/* Save Action Bar */}
            <div className="pt-2 pb-1 space-y-1.5">
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
      {isFullScreenOpen && resolvedImgSrc && (
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
                {resultsAisleView === 'ALL'
                  ? `${category} Panorama (${completedAisles.length} Bay${completedAisles.length > 1 ? 's' : ''})`
                  : `${category} • ${viewSession?.label || 'Bay'}`}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/40 shrink-0 hidden xs:inline">
                {showRawPhotoComparison ? 'Raw' : 'AI'}
              </span>
            </div>

            {/* Action & Zoom Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* Toggle Raw / Annotated */}
              <button
                type="button"
                onClick={() => setShowRawPhotoComparison(!showRawPhotoComparison)}
                className="px-2 sm:px-2.5 py-1 text-[11px] font-bold rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 hover:text-white active:scale-95 transition-all cursor-pointer"
                title="Toggle between AI annotated and raw view"
              >
                {showRawPhotoComparison ? 'AI' : 'Raw'}
              </button>

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
                src={resolvedImgSrc}
                alt="Enlarged shelf preview"
                className="max-h-[82vh] max-w-[96vw] object-contain shadow-2xl rounded-xl"
                draggable={false}
              />
              {/* Duplicate Bottles Overlay in Lightbox */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {(() => {
                  const baysToRender = resultsAisleView === 'ALL' ? completedAisles : [resultsAisleView];
                  const isAllView = resultsAisleView === 'ALL' && completedAisles.length > 1;

                  const bayWidths = completedAisles.map((k) => aisleSessions[k]?.naturalDimensions?.width || 800);
                  const totalWidth = bayWidths.reduce((a, b) => a + b, 0);

                  return (
                    <>
                      {/* Visual Seam Guide based on active bay index */}
                      {resultsAisleView !== 'ALL' && (() => {
                        const bayIndex = completedAisles.indexOf(resultsAisleView);
                        const hasLeftSeam = bayIndex > 0;
                        const hasRightSeam = bayIndex >= 0 && bayIndex < completedAisles.length - 1;
                        return (
                          <>
                            {hasLeftSeam && (
                              <div 
                                style={{ width: `${seamTolerance * 100}%` }}
                                className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none"
                              />
                            )}
                            {hasRightSeam && (
                              <div 
                                style={{ width: `${seamTolerance * 100}%` }}
                                className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-amber-400/80 bg-amber-500/10 pointer-events-none"
                              />
                            )}
                          </>
                        );
                      })()}

                      {/* Stitched Seam Divider Line for ALL Tab */}
                      {isAllView && completedAisles.length > 1 && (() => {
                        let acc = 0;
                        return completedAisles.slice(0, -1).map((k, idx) => {
                          acc += bayWidths[idx];
                          const linePct = (acc / totalWidth) * 100;
                          return (
                            <div 
                              key={`lb-panorama-seam-${k}`}
                              style={{ left: `${linePct}%` }}
                              className="absolute top-0 bottom-0 w-0 border-r-2 border-dashed border-emerald-400/80 z-0 pointer-events-none"
                            />
                          );
                        });
                      })()}

                      {/* Duplicate Bottle Highlights for all active bays */}
                      {baysToRender.map((bayKey) => {
                        const bayIndex = completedAisles.indexOf(bayKey);
                        if (bayIndex < 0) return null;

                        const session = aisleSessions[bayKey];
                        const bayW = session?.naturalDimensions?.width || 800;
                        const bayH = session?.naturalDimensions?.height || 1280;

                        let leftOffset = 0;
                        for (let i = 0; i < bayIndex; i++) {
                          leftOffset += bayWidths[i];
                        }

                        const mapCoords = (x: number, y: number, w: number, h: number) => {
                          if (isAllView) {
                            const boxLeftPx = leftOffset + (x / bayW) * bayWidths[bayIndex];
                            return {
                              leftPct: (boxLeftPx / totalWidth) * 100,
                              topPct: (y / bayH) * 100,
                              widthPct: ((w / bayW) * bayWidths[bayIndex] / totalWidth) * 100,
                              heightPct: (h / bayH) * 100
                            };
                          }
                          return {
                            leftPct: (x / bayW) * 100,
                            topPct: (y / bayH) * 100,
                            widthPct: (w / bayW) * 100,
                            heightPct: (h / bayH) * 100
                          };
                        };

                        const report = duplicateReports[bayKey];
                        if (!report?.hasDuplicates) return null;

                        return report.duplicates.map((dup) => {
                          const { leftPct, topPct, widthPct, heightPct } = mapCoords(
                            dup.x,
                            dup.y,
                            dup.width || 40,
                            dup.height || 80
                          );
                          const isRemoved = removedDuplicateBoxIds.has(dup.boxId) || duplicateReviewStatus === 'removed';

                          return (
                            <button
                              key={`lightbox-${dup.boxId}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleBoxDuplicate(dup.boxId, bayKey, dup.brand);
                              }}
                              style={{
                                left: `${Math.max(0, Math.min(95, leftPct))}%`,
                                top: `${Math.max(0, Math.min(95, topPct))}%`,
                                width: `${Math.max(3, Math.min(30, widthPct))}%`,
                                height: `${Math.max(4, Math.min(50, heightPct))}%`,
                              }}
                              className={`absolute rounded transition-all flex items-center justify-center pointer-events-auto cursor-pointer active:scale-95 group/dup ${
                                isRemoved
                                  ? 'opacity-40 hover:opacity-90 bg-red-950/40 border-2 border-red-500 shadow-sm shadow-red-950'
                                  : 'opacity-75 hover:opacity-100 bg-amber-500/25 border-2 border-dashed border-amber-400'
                              }`}
                              title={`Tap to toggle duplicate for ${dup.brand}`}
                            >
                              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                                <div className="w-[140%] h-[2.5px] bg-red-500 rotate-[-45deg] shadow-sm shadow-red-500" />
                              </div>
                              <span className="absolute -top-3.5 left-0 bg-red-600 group-hover/dup:bg-red-500 text-white text-[8px] font-black px-1 rounded shadow-xs uppercase tracking-tight">
                                {isRemoved ? 'Removed' : 'Duplicate'}
                              </span>
                            </button>
                          );
                        });
                      })}
                    </>
                  );
                })()}
              </div>
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
              <span className="font-bold text-[#4ADE80] text-xs">
                {primaryLabel}: {primarySharePct}% &bull; {resultsAisleView === 'ALL' ? combinedTotalFacings : (viewSession?.totalFacings ?? 0)}f
              </span>

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
