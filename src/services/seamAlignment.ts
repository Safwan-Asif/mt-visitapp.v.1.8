/**
 * Bay seam alignment & overlap de-duplication.
 *
 * Reps shoot bays left to right, so the right edge of Bay N overlaps the left
 * edge of Bay N+1. This module:
 *   1. MEASURES the overlap between two adjacent bay photos (image matching on
 *      the phone — no extra Roboflow calls), and
 *   2. Places a dividing line in the middle of the overlap. Every detected box
 *      is then owned by exactly one bay:
 *        - Bay N keeps boxes whose centre is LEFT of its cut line
 *        - Bay N+1 keeps boxes whose centre is RIGHT of its cut line
 *      Bottles inside the overlap are visible whole in both photos, so cutting
 *      by box centre never slices a bottle, and half-bottles at Bay N's right
 *      edge are dropped from Bay N and counted whole in Bay N+1.
 *
 * All seam positions are stored as FRACTIONS of each photo's width so they are
 * independent of whatever resolution the CV model reports boxes in.
 */

export type SeamConfidence = 'high' | 'medium' | 'low' | 'none';
export type SeamMethod = 'auto' | 'manual' | 'guide' | 'none';

export interface SeamInfo {
  leftBayKey: string;
  rightBayKey: string;
  /** Fraction (0..1) of the RIGHT bay's width that also appears in the left bay. */
  overlapFracRight: number;
  /** overlapFracLeft = overlapFracRight * widthRatio (accounts for zoom/aspect differences). */
  widthRatio: number;
  /** Left bay keeps boxes with centreX / width < cutFracLeft. */
  cutFracLeft: number;
  /** Right bay keeps boxes with centreX / width >= cutFracRight. */
  cutFracRight: number;
  /** Best normalised cross-correlation score (-1..1), 0 when not measured. */
  score: number;
  confidence: SeamConfidence;
  method: SeamMethod;
  /** Relative zoom of right photo vs left photo (1 = same). */
  scale: number;
  /** Vertical shift of right photo vs left photo, as a fraction of photo height. */
  dyFrac: number;
}

/** Width of the faded previous-bay guide shown in the viewfinder (and the prior for the measurement). */
export const GHOST_GUIDE_FRAC = 0.3;

/** Search limits for the overlap, as a fraction of the left photo's width. */
export const MIN_OVERLAP_FRAC = 0.04;
export const MAX_OVERLAP_FRAC = 0.7;

// Thresholds below are starting values — tune them against real bay pairs.
const SCORE_NONE = 0.15;
const SCORE_LOW = 0.3;
const SCORE_HIGH = 0.5;
const MARGIN_LOW = 0.03;
const MARGIN_HIGH = 0.06;
/** How strongly the guide overlap is favoured (score units per 100% of width away from it). */
const PRIOR_WEIGHT = 0.15;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Builds a SeamInfo with consistent cut lines from an overlap measurement. */
export function buildSeam(
  leftBayKey: string,
  rightBayKey: string,
  overlapFracRight: number,
  widthRatio: number,
  extras: Partial<Pick<SeamInfo, 'score' | 'confidence' | 'method' | 'scale' | 'dyFrac'>> = {}
): SeamInfo {
  const ovR = clamp(overlapFracRight, 0, 0.95);
  const ovL = clamp(ovR * widthRatio, 0, 0.95);
  return {
    leftBayKey,
    rightBayKey,
    overlapFracRight: ovR,
    widthRatio,
    cutFracLeft: 1 - ovL / 2,
    cutFracRight: ovR / 2,
    score: extras.score ?? 0,
    confidence: extras.confidence ?? 'none',
    method: extras.method ?? 'none',
    scale: extras.scale ?? 1,
    dyFrac: extras.dyFrac ?? 0
  };
}

// ============================================================================
// PURE IMAGE MATCHING (testable without a browser)
// ============================================================================

export interface GrayImage {
  data: Float32Array;
  w: number;
  h: number;
}

/** Edge-strength image (|dx| + |dy|). Matching on edges is robust to exposure changes between shots. */
export function gradientImage(img: GrayImage): GrayImage {
  const { data, w, h } = img;
  const out = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const dx = data[i + 1] - data[i - 1];
      const dy = data[i + w] - data[i - w];
      out[i] = Math.abs(dx) + Math.abs(dy);
    }
  }
  return { data: out, w, h };
}

/** Bilinear resize. */
export function resizeGray(img: GrayImage, nw: number, nh: number): GrayImage {
  const out = new Float32Array(nw * nh);
  const sx = img.w / nw;
  const sy = img.h / nh;
  for (let y = 0; y < nh; y++) {
    const fy = Math.min(img.h - 1, Math.max(0, (y + 0.5) * sy - 0.5));
    const y0 = Math.floor(fy);
    const y1 = Math.min(img.h - 1, y0 + 1);
    const wy = fy - y0;
    for (let x = 0; x < nw; x++) {
      const fx = Math.min(img.w - 1, Math.max(0, (x + 0.5) * sx - 0.5));
      const x0 = Math.floor(fx);
      const x1 = Math.min(img.w - 1, x0 + 1);
      const wx = fx - x0;
      const a = img.data[y0 * img.w + x0];
      const b = img.data[y0 * img.w + x1];
      const c = img.data[y1 * img.w + x0];
      const d = img.data[y1 * img.w + x1];
      out[y * nw + x] = (a * (1 - wx) + b * wx) * (1 - wy) + (c * (1 - wx) + d * wx) * wy;
    }
  }
  return { data: out, w: nw, h: nh };
}

/**
 * Zero-mean normalised cross-correlation between the right `ow` columns of A
 * and the left `ow` columns of B (B already scaled), with B shifted down by dy0 rows.
 */
function zncc(A: GrayImage, B: GrayImage, ow: number, dy0: number, stride: number, rowStride = stride): number {
  const xA0 = A.w - ow;
  const vStart = Math.max(0, -dy0);
  const vEnd = Math.min(B.h, A.h - dy0);
  if (vEnd - vStart < A.h * 0.5 || ow > B.w || ow < 2) return -1;

  let n = 0, sa = 0, sb = 0, saa = 0, sbb = 0, sab = 0;
  for (let v = vStart; v < vEnd; v += rowStride) {
    const rowA = (v + dy0) * A.w + xA0;
    const rowB = v * B.w;
    for (let u = 0; u < ow; u += stride) {
      const a = A.data[rowA + u];
      const b = B.data[rowB + u];
      sa += a; sb += b; saa += a * a; sbb += b * b; sab += a * b;
      n++;
    }
  }
  if (n < 50) return -1;
  const cov = sab - (sa * sb) / n;
  const va = saa - (sa * sa) / n;
  const vb = sbb - (sb * sb) / n;
  if (va <= 1e-6 || vb <= 1e-6) return -1;
  return cov / Math.sqrt(va * vb);
}

export interface OverlapEstimate {
  /** Overlap width as a fraction of the LEFT image width. */
  overlapFracLeft: number;
  /** Overlap width as a fraction of the RIGHT image width. */
  overlapFracRight: number;
  widthRatio: number;
  scale: number;
  dyFrac: number;
  score: number;
  margin: number;
  confidence: SeamConfidence;
}

interface Candidate { ow: number; s: number; dy: number; score: number; raw: number; }

function searchOverlap(
  A: GrayImage,
  B: GrayImage,
  owRange: [number, number],
  scales: number[],
  dyRange: [number, number],
  dyStep: number,
  stride: number,
  priorFrac: number | null,
  priorWeight: number,
  curve?: Map<number, number>,
  rowStride = stride
): Candidate {
  let best: Candidate = { ow: 0, s: 1, dy: 0, score: -Infinity, raw: -Infinity };
  for (const s of scales) {
    const Bs = s === 1 ? B : resizeGray(B, Math.max(2, Math.round(B.w * s)), Math.max(2, Math.round(B.h * s)));
    const centreOffset = Math.round((A.h - Bs.h) / 2);
    for (let dy = dyRange[0]; dy <= dyRange[1]; dy += dyStep) {
      const dy0 = centreOffset + dy;
      for (let ow = owRange[0]; ow <= owRange[1]; ow++) {
        const raw = zncc(A, Bs, ow, dy0, stride, rowStride);
        if (raw <= -1) continue;
        const score = priorFrac !== null ? raw - priorWeight * Math.abs(ow / A.w - priorFrac) : raw;
        if (curve) curve.set(ow, Math.max(curve.get(ow) ?? -Infinity, score));
        if (score > best.score) best = { ow, s, dy, score, raw };
      }
    }
  }
  return best;
}

/** Local maxima of the coarse score curve, best first, at least `sep` apart. */
function curvePeaks(curve: Map<number, number>, sep: number, maxPeaks: number): number[] {
  const keys = Array.from(curve.keys()).sort((a, b) => a - b);
  const peaks = keys.filter((ow, i) => {
    const v = curve.get(ow)!;
    const prev = i > 0 ? curve.get(keys[i - 1])! : -Infinity;
    const next = i < keys.length - 1 ? curve.get(keys[i + 1])! : -Infinity;
    return v >= prev && v >= next;
  });
  peaks.sort((a, b) => curve.get(b)! - curve.get(a)!);
  const chosen: number[] = [];
  for (const p of peaks) {
    if (chosen.every((c) => Math.abs(c - p) >= sep)) chosen.push(p);
    if (chosen.length >= maxPeaks) break;
  }
  return chosen;
}

/**
 * Estimates how much of the left photo's right edge reappears at the right
 * photo's left edge. Coarse-to-fine search over overlap width, zoom (±10%) and
 * vertical shift (±6% of height).
 *
 * `priorFrac` (fraction of left width) gently favours the overlap the rep was
 * guided to — useful on shelves of identical bottles where several shifts look alike.
 */
export function estimateOverlap(
  leftGray: GrayImage,
  rightGray: GrayImage,
  priorFrac: number | null = null
): OverlapEstimate {
  // Normalise both images to the same height first (aspect ratios kept).
  const COARSE_H = 96;
  const FINE_H = 480;
  const toH = (g: GrayImage, H: number) => resizeGray(g, Math.max(8, Math.round((g.w * H) / g.h)), H);

  // --- Coarse pass ---
  const Ac = gradientImage(toH(leftGray, COARSE_H));
  const Bc = gradientImage(toH(rightGray, COARSE_H));
  const coarseScales = [0.9, 0.925, 0.95, 0.975, 1, 1.025, 1.05, 1.075, 1.1];
  const dyMaxC = Math.round(COARSE_H * 0.06);
  const owMinC = Math.max(3, Math.round(Ac.w * MIN_OVERLAP_FRAC));
  const owMaxC = Math.min(Bc.w - 1, Math.round(Ac.w * MAX_OVERLAP_FRAC));
  const curve = new Map<number, number>();
  const coarseBest = searchOverlap(Ac, Bc, [owMinC, owMaxC], coarseScales, [-dyMaxC, dyMaxC], 1, 1, priorFrac, PRIOR_WEIGHT, curve);
  if (coarseBest.score === -Infinity) {
    return { overlapFracLeft: 0, overlapFracRight: 0, widthRatio: 1, scale: 1, dyFrac: 0, score: 0, margin: 0, confidence: 'none' };
  }

  // Repeated identical bottles make several shifts (one facing apart) look alike at
  // low resolution, where price tags and small print disappear. So every distinct
  // coarse peak is re-checked at high resolution, and confidence is the gap between
  // the best and second-best candidate there.
  const sep = Math.max(3, Math.round(Ac.w * 0.04));
  const peaks = curvePeaks(curve, sep, 5);

  const k = FINE_H / COARSE_H;
  const Af = gradientImage(toH(leftGray, FINE_H));
  const Bf = gradientImage(toH(rightGray, FINE_H));

  const fineResults: Candidate[] = peaks.map((owC) => {
    // Recover the zoom / vertical shift for this peak, then refine at full detail.
    const c = searchOverlap(Ac, Bc, [Math.max(owMinC, owC - 1), Math.min(owMaxC, owC + 1)], coarseScales, [-dyMaxC, dyMaxC], 1, 1, priorFrac, PRIOR_WEIGHT);
    const fineScales = [c.s - 0.0125, c.s, c.s + 0.0125].filter((s) => s >= 0.88 && s <= 1.12);
    const owCentre = Math.round(c.ow * k);
    const owSpan = Math.ceil(k);
    const dyCentre = Math.round(c.dy * k);
    const dySpan = Math.ceil(k / 2);
    // Full horizontal detail (price-tag text), every 2nd row for speed.
    const f = searchOverlap(
      Af, Bf,
      [Math.max(3, owCentre - owSpan), Math.min(Bf.w - 1, owCentre + owSpan)],
      fineScales,
      [dyCentre - dySpan, dyCentre + dySpan], 1, 1,
      priorFrac, PRIOR_WEIGHT, undefined, 2
    );
    return f.score > -Infinity ? f : { ...c, ow: owCentre, dy: dyCentre };
  });
  fineResults.sort((a, b) => b.score - a.score);
  const result = fineResults[0];
  const margin = fineResults.length > 1 ? result.score - fineResults[1].score : 1;

  const overlapFracLeft = result.ow / Af.w;
  const rightScaledW = Bf.w * result.s;
  const overlapFracRight = result.ow / rightScaledW;
  const widthRatio = rightScaledW / Af.w;

  const score = result.raw;
  let confidence: SeamConfidence;
  if (score < SCORE_NONE) confidence = 'none';
  else if (score < SCORE_LOW || margin < MARGIN_LOW) confidence = 'low';
  else if (score < SCORE_HIGH || margin < MARGIN_HIGH) confidence = 'medium';
  else confidence = 'high';

  return {
    overlapFracLeft,
    overlapFracRight: clamp(overlapFracRight, 0, 0.95),
    widthRatio,
    scale: result.s,
    dyFrac: result.dy / FINE_H,
    score,
    margin,
    confidence
  };
}

// ============================================================================
// BROWSER WRAPPER
// ============================================================================

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load bay photo for seam alignment'));
    img.src = src;
  });
}

/** Loads a photo into a grayscale buffer at the given height (aspect ratio kept). */
export async function loadGray(src: string, targetH = 640): Promise<{ gray: GrayImage; naturalW: number; naturalH: number }> {
  const img = await loadImage(src);
  const nW = img.naturalWidth || img.width;
  const nH = img.naturalHeight || img.height;
  const h = Math.min(targetH, nH);
  const w = Math.max(8, Math.round((nW * h) / nH));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(img, 0, 0, w, h);
  const px = ctx.getImageData(0, 0, w, h).data;
  const data = new Float32Array(w * h);
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    data[i] = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];
  }
  return { gray: { data, w, h }, naturalW: nW, naturalH: nH };
}

/**
 * Measures the seam between two bay photos. Never throws: if matching fails the
 * seam falls back to the guide overlap (when the rep shot with the guide) or to
 * zero overlap, with confidence 'none' so the rep is asked to set the line.
 */
export async function estimateSeam(
  leftPhotoUrl: string,
  rightPhotoUrl: string,
  leftBayKey: string,
  rightBayKey: string,
  opts: { shotWithGuide?: boolean } = {}
): Promise<SeamInfo> {
  const prior = opts.shotWithGuide ? GHOST_GUIDE_FRAC : null;
  try {
    const [L, R] = await Promise.all([loadGray(leftPhotoUrl), loadGray(rightPhotoUrl)]);
    const est = estimateOverlap(L.gray, R.gray, prior);
    if (est.confidence === 'none') {
      return fallbackSeam(leftBayKey, rightBayKey, L.naturalW / L.naturalH, R.naturalW / R.naturalH, prior, est.score);
    }
    return buildSeam(leftBayKey, rightBayKey, est.overlapFracRight, est.widthRatio, {
      score: Number(est.score.toFixed(3)),
      confidence: est.confidence,
      method: 'auto',
      scale: Number(est.scale.toFixed(4)),
      dyFrac: Number(est.dyFrac.toFixed(4))
    });
  } catch (err) {
    console.warn('[seamAlignment] measurement failed:', err);
    return fallbackSeam(leftBayKey, rightBayKey, 1, 1, prior, 0);
  }
}

function fallbackSeam(
  leftBayKey: string,
  rightBayKey: string,
  aspectLeft: number,
  aspectRight: number,
  prior: number | null,
  score: number
): SeamInfo {
  const widthRatio = aspectRight / aspectLeft;
  const overlapFracRight = prior !== null ? prior / widthRatio : 0;
  return buildSeam(leftBayKey, rightBayKey, overlapFracRight, widthRatio, {
    score,
    confidence: 'none',
    method: prior !== null ? 'guide' : 'none'
  });
}

// ============================================================================
// BOX OWNERSHIP (which bay counts which bottle)
// ============================================================================

export interface SeamBay {
  key: string;
  label?: string;
  boxes: any[];
  /** Width of the coordinate frame the boxes are expressed in (pixels). */
  frameWidth: number;
  /** Seam with the previous (left) bay, if any. */
  seam?: SeamInfo | null;
}

export interface SeamExclusion {
  bayKey: string;
  box: any;
  brand: string;
  /** 'left-edge' = dropped because the previous bay owns it; 'right-edge' = the next bay owns it. */
  side: 'left-edge' | 'right-edge';
  otherBayKey: string;
  centreFrac: number;
}

/** Horizontal centre of a box as a fraction of the photo width. */
export function boxCentreFrac(box: any, frameWidth: number): number | null {
  if (box?.pixelCoords && typeof box.pixelCoords.x === 'number' && frameWidth > 0) {
    return (box.pixelCoords.x + (box.pixelCoords.width || 0) / 2) / frameWidth;
  }
  if (typeof box?.x === 'number' && frameWidth > 0) {
    return (box.x + (typeof box.width === 'number' ? box.width : 0) / 2) / frameWidth;
  }
  if (typeof box?.left === 'number' && box.left <= 100) {
    return (box.left + (typeof box.width === 'number' ? box.width : 0) / 2) / 100;
  }
  return null;
}

/**
 * Decides which boxes each bay must NOT count, using the dividing line of each seam.
 * `bays` must be in left-to-right order.
 */
export function computeSeamExclusions(bays: SeamBay[]): SeamExclusion[] {
  const out: SeamExclusion[] = [];
  bays.forEach((bay, i) => {
    const leftSeam = bay.seam && i > 0 && bay.seam.leftBayKey === bays[i - 1].key ? bay.seam : null;
    const next = bays[i + 1];
    const rightSeam = next?.seam && next.seam.leftBayKey === bay.key ? next.seam : null;
    if (!leftSeam && !rightSeam) return;

    for (const box of bay.boxes || []) {
      const c = boxCentreFrac(box, bay.frameWidth);
      if (c === null) continue;
      const brand = String(box.brand || box.label || 'OTHER').toUpperCase().trim();
      if (leftSeam && leftSeam.overlapFracRight > 0 && c < leftSeam.cutFracRight) {
        out.push({ bayKey: bay.key, box, brand, side: 'left-edge', otherBayKey: leftSeam.leftBayKey, centreFrac: c });
      } else if (rightSeam && rightSeam.overlapFracRight > 0 && c >= rightSeam.cutFracLeft) {
        out.push({ bayKey: bay.key, box, brand, side: 'right-edge', otherBayKey: rightSeam.rightBayKey, centreFrac: c });
      }
    }
  });
  return out;
}
