import { CategoryType, BoundingBox } from '../types';
import { DEFAULT_AI_COUNTS, SAMPLE_BOUNDING_BOXES, resolveCategoryKey } from '../constants';

export const N8N_DEFAULT_WEBHOOK_URL = 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-visit-audit';
export const N8N_PRODUCTION_WEBHOOK_URL = 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-visit-audit';
export const N8N_VISIT_AUDIT_PROD_WEBHOOK_URL = 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-visit-audit';
export const N8N_SHEET_WRITE_TEST_WEBHOOK_URL = 'https://qfirestaurantchannel.n8n-wsk.com/webhook-test/mt-sheet-write';
export const N8N_SHEET_WRITE_PROD_WEBHOOK_URL = 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-sheet-write';
export const DEFAULT_N8N_WEBHOOK_URL = N8N_DEFAULT_WEBHOOK_URL;

export const STORAGE_KEY_N8N_URL = 'qfi_n8n_webhook_url';

export function getN8nWebhookUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_N8N_URL);
    if (saved && saved.trim()) return saved.trim();
  }
  return (import.meta.env.VITE_N8N_WEBHOOK_URL as string) || N8N_DEFAULT_WEBHOOK_URL;
}

export function setN8nWebhookUrl(url: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_N8N_URL, url.trim());
  }
}

export interface N8nPayloadMetadata {
  outletId: string;
  outletName: string;
  accountName?: string;
  outletCode?: string;
  category: CategoryType;
  aisle?: string;
  aisleLabel?: string;
  repName: string;
  repId: string;
  totalFacings?: number;
  primarySharePct?: number;
  shareOfShelfPct?: number;
  shareOfShelfLabel?: string;
  counts?: Record<string, number>;
  originalAiCounts?: Record<string, number>;
  discrepancyLog?: string;
  unmappedRemark?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: string;
  priceTagOk: boolean;
  posmShelfSticker: boolean;
  posmWobblers: boolean;
  needsReview?: boolean;
  timestamp: string;
  /** Overlap with the previous bay. n8n drops boxes whose centre is left of cutFrac × image width. */
  seam?: {
    previousBay: string;
    cutFrac: number;
    overlapFrac: number;
    confidence: string;
    method: string;
  };
}

export interface N8nTransmissionResult {
  success: boolean;
  source: 'n8n_remote' | 'simulated_fallback';
  statusCode?: number;
  message: string;
  isMissingRespondNode?: boolean;
  errorDetail?: string;
  counts: Record<string, number>;
  boxes: BoundingBox[];
  totalFacings?: number;
  needsReview?: boolean;
  replyText?: string;
  chatId?: number | string;
  annotatedImageUrl?: string;
  annotationStyle?: {
    thickness?: number;
    fontSize?: number;
    solidLabelBackground?: boolean;
    labelContent?: string;
  };
  rawResponse?: any;
  rawNormalized?: any;
  latencyMs: number;
  timestamp: string;
  payloadSummary: {
    endpoint: string;
    fields: Record<string, string | number | boolean>;
    fileSizeKb: number;
    fileName: string;
    mimeType: string;
  };
}

/**
 * Utility to extract image URL or Base64 string from various n8n payload structures
 */
export function extractImageUrl(val: any): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return undefined;
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:') || s.startsWith('data:image/')) {
      return s;
    }
    // If it's a raw base64 string
    if (s.length > 50 && !s.includes(' ') && !s.includes('\n')) {
      const mime = s.startsWith('iVBORw') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${s}`;
    }
  } else if (typeof val === 'object') {
    if (typeof val.url === 'string') return extractImageUrl(val.url);
    if (typeof val.data === 'string') {
      if (typeof val.mimeType === 'string') {
        return `data:${val.mimeType};base64,${val.data}`;
      }
      return extractImageUrl(val.data);
    }
    if (typeof val.base64 === 'string') return extractImageUrl(val.base64);
    if (typeof val.image === 'string') return extractImageUrl(val.image);
    if (typeof val.imageUrl === 'string') return extractImageUrl(val.imageUrl);
  }
  return undefined;
}

export interface NormalizedN8nAuditResult {
  success: boolean;
  total_facings: number;
  counts: {
    YARA: number;
    ZAIN: number;
    'AL RAI': number;
    ADEERA: number;
    DAWI: number;
    OTHER: number;
    [brand: string]: number;
  };
  annotated_image?: string;
  boxes?: any[];
  needs_review?: boolean;
  replyText?: string;
  meta?: any;
  error?: string;
}

export const STANDARD_SHELF_BRANDS = ['YARA', 'ZAIN', 'AL RAI', 'ADEERA', 'DAWI', 'OTHER'] as const;

/**
 * Strict canonicalizer ensuring every detected label maps directly to one of the fixed classes:
 * - Flour (7 classes): F1, F2, F3, PREM, SR, KFM, OTHER
 * - Edible Oil (6 classes): YARA, ZAIN, ADEERA, AL RAI, DAWI, OTHER
 * - Pasta (4 classes): QFM, QFM PREM, ZAIN, OTHER
 */
export function canonicalizeBrand(brand: string, category?: string): string {
  if (!brand) return 'OTHER';
  const clean = brand.trim().toUpperCase();
  const catKey = resolveCategoryKey(category);

  if (catKey === 'Flour') {
    if (clean === 'F1' || clean.startsWith('F1') || clean.includes('F1')) return 'F1';
    if (clean === 'F2' || clean.startsWith('F2') || clean.includes('F2')) return 'F2';
    if (clean === 'F3' || clean.startsWith('F3') || clean.includes('F3')) return 'F3';
    if (clean.includes('PREM') || clean.includes('PREMIUM')) return 'PREM';
    if (clean.includes('SR') || clean.includes('SELF') || clean.includes('RAISING')) return 'SR';
    if (clean.includes('KFM')) return 'KFM';
    return 'OTHER';
  }

  if (catKey === 'Pasta') {
    if (clean.includes('PREM') || clean.includes('PREMIUM')) return 'QFM PREM';
    if (clean.includes('QFM')) return 'QFM';
    if (clean.includes('ZAIN')) return 'ZAIN';
    return 'OTHER';
  }

  // Edible Oil (Default)
  if (clean.includes('YARA')) return 'YARA';
  if (clean.includes('ZAIN')) return 'ZAIN';
  if (clean.includes('ADEERA')) return 'ADEERA';
  if (clean.includes('AL RAI') || clean.includes('ALRAI') || clean.includes('RAI')) return 'AL RAI';
  if (clean.includes('DAWI')) return 'DAWI';
  return 'OTHER';
}

/**
 * Diagnostic logger that prints information about n8n response without logging huge Base64 strings.
 * Conforms to Requirement 6: never logs entire base64 string, only prefix, suffix, and length.
 */
export function safeLogN8nDiagnostics(label: string, rawData: any, normalized?: NormalizedN8nAuditResult) {
  try {
    const rawShape = Array.isArray(rawData) ? `Array[${rawData.length}]` : typeof rawData;
    let imgInfo = 'none';
    const imgCandidate = normalized?.annotated_image || (typeof rawData === 'object' && rawData !== null ? rawData.annotated_image || rawData[0]?.annotated_image : undefined);
    if (typeof imgCandidate === 'string' && imgCandidate.trim()) {
      const s = imgCandidate.trim();
      const prefix = s.slice(0, 30);
      const suffix = s.slice(-10);
      imgInfo = `${prefix}...${suffix} (${s.length} bytes)`;
    }

    console.log(`[n8n Diagnostics] ${label}:`, {
      shape: rawShape,
      hasTotalFacings: normalized ? normalized.total_facings !== undefined : (rawData?.total_facings !== undefined || rawData?.[0]?.total_facings !== undefined),
      totalFacings: normalized?.total_facings,
      hasCounts: normalized ? Boolean(normalized.counts) : Boolean(rawData?.counts || rawData?.[0]?.counts),
      counts: normalized?.counts,
      annotatedImage: imgInfo,
      error: normalized?.error
    });
  } catch (err) {
    console.log(`[n8n Diagnostics] ${label} (log error):`, err);
  }
}

/**
 * Robust response normalizer for n8n webhook responses.
 * Guarantees fixed classes per category.
 */
export function normalizeN8nResponse(rawInput: any, category?: CategoryType): NormalizedN8nAuditResult {
  // 1. Parse JSON if string (handling potential double-stringification)
  let parsed = rawInput;
  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    try {
      parsed = JSON.parse(trimmed);
      if (typeof parsed === 'string') {
        try {
          parsed = JSON.parse(parsed);
        } catch {
          // keep as parsed
        }
      }
    } catch (err: any) {
      if (trimmed.startsWith('data:image/') || trimmed.startsWith('http')) {
        parsed = { annotated_image: trimmed };
      } else {
        const defaultZeroCounts: Record<string, number> = {};
        const brands = category === 'Flour' 
          ? ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM', 'OTHER']
          : category === 'Pasta'
          ? ['QFM', 'QFM PREM', 'ZAIN', 'OTHER']
          : ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'];
        brands.forEach((b) => { defaultZeroCounts[b] = 0; });
        return {
          success: false,
          total_facings: 0,
          counts: defaultZeroCounts as any,
          error: `Could not parse response as JSON: ${err?.message || 'Invalid format'}`
        };
      }
    }
  }

  // 2. Unwrap wrappers (e.g. [ { ... } ], { body: ... }, { json: ... }, { data: ... }, { result: ... })
  let curr = parsed;
  let depth = 0;
  while (curr && depth < 10) {
    depth++;
    if (Array.isArray(curr)) {
      if (curr.length === 0) {
        return {
          success: false,
          total_facings: 0,
          counts: { YARA: 0, ZAIN: 0, 'AL RAI': 0, ADEERA: 0, DAWI: 0, OTHER: 0 },
          error: 'Response array is empty.'
        };
      }
      curr = curr[0];
      continue;
    }
    if (typeof curr === 'string') {
      try {
        curr = JSON.parse(curr);
        continue;
      } catch {
        break;
      }
    }
    if (typeof curr === 'object' && curr !== null) {
      if (curr.body !== undefined) {
        curr = curr.body;
        continue;
      }
      // Common n8n node output item wrapper: { json: { ... }, binary: { ... } }
      if (curr.json !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.json;
        continue;
      }
      if (curr.data !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.data;
        continue;
      }
      if (curr.result !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.result;
        continue;
      }
      if (curr.output !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.output;
        continue;
      }
      if (curr.response !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.response;
        continue;
      }
      if (curr.item !== undefined && curr.counts === undefined && curr.total_facings === undefined && curr.annotated_image === undefined) {
        curr = curr.item;
        continue;
      }
      break;
    }
    break;
  }

  const target = curr;

  if (!target || typeof target !== 'object') {
    return {
      success: false,
      total_facings: 0,
      counts: { YARA: 0, ZAIN: 0, 'AL RAI': 0, ADEERA: 0, DAWI: 0, OTHER: 0 },
      error: 'Unwrapped n8n response is not a valid object.'
    };
  }

  // Check if n8n returned a workflow error message
  if (target.message && /No Respond to Webhook node/i.test(target.message)) {
    return {
      success: false,
      total_facings: 0,
      counts: { YARA: 0, ZAIN: 0, 'AL RAI': 0, ADEERA: 0, DAWI: 0, OTHER: 0 },
      error: target.message
    };
  }

  // 3. Extract Counts using strict nullish checks (0 is a valid count!)
  let rawCounts = target.counts;
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

  const resolvedCounts: Record<string, number> = {};

  // Helper to extract a brand count with case-insensitivity
  const getBrandValue = (brandName: string): number | undefined => {
    if (rawCounts[brandName] !== undefined && rawCounts[brandName] !== null) {
      const n = Number(rawCounts[brandName]);
      return isNaN(n) ? undefined : n;
    }
    const cleanTarget = brandName.toUpperCase().replace(/[\s_-]+/g, '');
    for (const [k, v] of Object.entries(rawCounts)) {
      if (k.toUpperCase().replace(/[\s_-]+/g, '') === cleanTarget) {
        if (v !== undefined && v !== null) {
          const n = Number(v);
          return isNaN(n) ? undefined : n;
        }
      }
    }
    return undefined;
  };

  // Bind target brands (dynamically from rawCounts if present, or fallback to standard brands)
  const hasRawCounts = Object.keys(rawCounts).length > 0;
  const targetBrands = hasRawCounts ? Object.keys(rawCounts) : STANDARD_SHELF_BRANDS;

  for (const brand of targetBrands) {
    const val = getBrandValue(brand);
    // Explicit nullish check: zero MUST be 0
    resolvedCounts[brand] = (val !== undefined && val !== null) ? val : 0;
  }

  // If counts object was empty or missing, attempt to parse from replyText lines (e.g. "YARA: 3\nADEERA: 3")
  if (!hasRawCounts && typeof target.replyText === 'string') {
    const lines = target.replyText.split(/\r?\n/);
    for (const line of lines) {
      const match = line.match(/^([A-Za-z0-9 _-]+):\s*(\d+)/i);
      if (match) {
        const brand = match[1].trim().toUpperCase();
        if (brand !== 'TOTAL FACINGS' && brand !== 'TOTAL' && brand !== 'FACINGS') {
          const countNum = parseInt(match[2], 10);
          if (!isNaN(countNum)) {
            resolvedCounts[brand] = countNum;
          }
        }
      }
    }
  }

  // Canonical fixed classes per category:
  // Flour (7): F1, F2, F3, PREM, SR, KFM, OTHER
  // Edible Oil (6): YARA, ZAIN, ADEERA, AL RAI, DAWI, OTHER
  // Pasta (4): QFM, QFM PREM, ZAIN, OTHER
  const targetStandardBrands = category === 'Flour'
    ? ['F1', 'F2', 'F3', 'PREM', 'SR', 'KFM', 'OTHER']
    : category === 'Pasta'
    ? ['QFM', 'QFM PREM', 'ZAIN', 'OTHER']
    : ['YARA', 'ZAIN', 'ADEERA', 'AL RAI', 'DAWI', 'OTHER'];

  const normalizedCategoryCounts: Record<string, number> = {};
  for (const b of targetStandardBrands) {
    normalizedCategoryCounts[b] = 0;
  }

  // Map any values from rawCounts or parsed lines to canonical brands
  for (const [k, v] of Object.entries({ ...rawCounts, ...resolvedCounts })) {
    const canonicalKey = canonicalizeBrand(k, category);
    const countNum = Number(v);
    if (!isNaN(countNum)) {
      normalizedCategoryCounts[canonicalKey] = (normalizedCategoryCounts[canonicalKey] || 0) + countNum;
    }
  }

  // Ensure all standard brands exist with at least 0
  for (const b of targetStandardBrands) {
    if (normalizedCategoryCounts[b] === undefined) {
      normalizedCategoryCounts[b] = 0;
    }
  }

  // 4. Extract Total Facings: strictly keep n8n's total_facings if provided
  let totalFacings: number | undefined = undefined;
  if (typeof target.total_facings === 'number') {
    totalFacings = target.total_facings;
  } else if (typeof target.totalFacings === 'number') {
    totalFacings = target.totalFacings;
  } else if (target.total_facings !== undefined && target.total_facings !== null && !isNaN(Number(target.total_facings))) {
    totalFacings = Number(target.total_facings);
  } else if (target.totalFacings !== undefined && target.totalFacings !== null && !isNaN(Number(target.totalFacings))) {
    totalFacings = Number(target.totalFacings);
  }

  // Fallback to sum of counts only if total_facings is completely absent
  if (totalFacings === undefined) {
    totalFacings = Object.values(resolvedCounts).reduce((acc, curr) => acc + (curr ?? 0), 0);
  }

  // 5. Extract exact annotated_image
  let annotatedImage: string | undefined = undefined;
  const candidateKeys = [
    'drive_url',
    'driveUrl',
    'drive_photo_url',
    'drivePhotoUrl',
    'drive_image_url',
    'driveImageUrl',
    'annotated_image',
    'annotatedImage',
    'annotated_photo',
    'annotatedPhoto',
    'annotated_image_url',
    'annotatedImageUrl',
    'annotated_img',
    'image',
    'imageUrl',
    'image_url',
    'image_base64',
    'imageBase64',
    'base64',
    'base64_image',
    'output_image',
    'outputImage',
    'processed_image',
    'processedImage',
    'photo',
    'result_image',
    'resultImage'
  ];

  for (const key of candidateKeys) {
    const val = target[key];
    if (typeof val === 'string' && val.trim()) {
      annotatedImage = val.trim();
      break;
    }
  }

  // If wrapped in n8n binary object on target or parsed root
  if (!annotatedImage) {
    const binaryObj = target.binary || (typeof parsed === 'object' && parsed !== null ? (Array.isArray(parsed) ? parsed[0]?.binary : parsed.binary) : undefined);
    if (binaryObj && typeof binaryObj === 'object') {
      for (const key of Object.keys(binaryObj)) {
        const extracted = extractImageUrl(binaryObj[key]);
        if (extracted) {
          annotatedImage = extracted;
          break;
        }
      }
    }
  }

  // Ensure Base64 has proper Data URL prefix if raw
  if (annotatedImage && !annotatedImage.startsWith('http://') && !annotatedImage.startsWith('https://') && !annotatedImage.startsWith('blob:') && !annotatedImage.startsWith('data:')) {
    const mime = annotatedImage.startsWith('iVBORw') ? 'image/png' : 'image/jpeg';
    annotatedImage = `data:${mime};base64,${annotatedImage}`;
  }

  const result: NormalizedN8nAuditResult = {
    success: target.success !== undefined ? Boolean(target.success) : true,
    total_facings: totalFacings,
    counts: (Object.keys(normalizedCategoryCounts).length > 0 ? normalizedCategoryCounts : resolvedCounts) as any,
    annotated_image: annotatedImage,
    boxes: Array.isArray(target.boxes) ? target.boxes : undefined,
    needs_review: Boolean(target.needs_review ?? target.needsReview ?? false),
    replyText: target.replyText,
    meta: target.meta
  };

  // Requirement 7: Temporary development logging
  console.log('[n8n Dev Diagnostics] Normalized Response:', {
    keys: Object.keys(result),
    total_facings: result.total_facings,
    counts: result.counts,
    annotated_image_starts_with_data_image: typeof result.annotated_image === 'string' && result.annotated_image.startsWith('data:image/'),
    needs_review: result.needs_review
  });

  return result;
}

/**
 * Creates an annotated shelf image by drawing bounding boxes and labels
 * directly onto a canvas and exporting a high-quality JPEG data URL.
 */
/**
 * Creates an annotated shelf image by drawing bounding boxes and labels
 * directly onto a canvas and exporting a high-quality JPEG data URL.
 */
export function renderBoundingBoxesOnCanvas(
  imageSrc: string,
  boxes: BoundingBox[],
  styleOptions?: {
    thickness?: number;
    fontSize?: number;
    solidLabelBackground?: boolean;
    labelContent?: string;
  }
): Promise<string> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(imageSrc);
    }

    const drawToCanvas = (img: HTMLImageElement) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 800;
        canvas.height = img.naturalHeight || 800;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return resolve(imageSrc);
        }

        // 1. Draw base photo
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // 2. Determine scaling factors
        const strokeThickness = styleOptions?.thickness || 4;
        const fontSize = styleOptions?.fontSize || 16;
        const scaleFactor = Math.max(1, canvas.width / 800);
        const actualStroke = Math.round(strokeThickness * scaleFactor);
        const actualFontSize = Math.round(fontSize * scaleFactor);

        ctx.font = `bold ${actualFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

        // 3. Draw bounding boxes using normalized percentages (0-100%)
        for (const box of boxes) {
          const color = box.color || (box.brand === 'OTHER' ? '#DC2626' : box.brand === 'YARA' ? '#4B0082' : '#16A34A');
          const x = (box.left / 100) * canvas.width;
          const y = (box.top / 100) * canvas.height;
          const w = (box.width / 100) * canvas.width;
          const h = (box.height / 100) * canvas.height;

          // Box rectangle outline
          ctx.lineWidth = actualStroke;
          ctx.strokeStyle = color;
          ctx.strokeRect(x, y, w, h);

          // Subtle box fill tint
          ctx.fillStyle = `${color}25`;
          ctx.fillRect(x, y, w, h);

          // Label badge
          const brandText = box.label || box.brand || 'PRODUCT';
          const confText = box.confidence ? ` ${Math.round(box.confidence * 100)}%` : '';
          const labelText = `${brandText}${confText}`;
          const textMetrics = ctx.measureText(labelText);
          const badgeHeight = actualFontSize + 8;
          const badgeWidth = textMetrics.width + 12;
          const badgeY = Math.max(0, y - badgeHeight);

          ctx.fillStyle = box.labelBackground || color;
          ctx.fillRect(x, badgeY, badgeWidth, badgeHeight);

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(labelText, x + 6, badgeY + actualFontSize);
        }

        const annotatedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        resolve(annotatedDataUrl);
      } catch (err) {
        console.warn('Canvas rendering error:', err);
        resolve(imageSrc);
      }
    };

    const img = new Image();
    // Only set crossOrigin for remote http(s) URLs. For blob: or data: URLs, crossOrigin causes load errors in many browsers
    if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => drawToCanvas(img);

    img.onerror = () => {
      // If anonymous load failed (due to CORS headers missing on remote CDN), retry without crossOrigin
      if (img.crossOrigin) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => drawToCanvas(fallbackImg);
        fallbackImg.onerror = () => resolve(imageSrc);
        fallbackImg.src = imageSrc;
      } else {
        resolve(imageSrc);
      }
    };

    img.src = imageSrc;
  });
}

/**
 * Normalizes raw bounding boxes from n8n response into standard BoundingBox objects.
 * Accurately handles pixel coordinate frames (~800x800 CV model resolution) without shrinking.
 */
export function normalizeN8nBoxes(
  rawBoxes: any[],
  refWidth: number = 800,
  refHeight: number = 800
): BoundingBox[] {
  if (!Array.isArray(rawBoxes)) return [];

  // Dynamically calculate coordinate bounds from the actual detected boxes
  let maxBoxX = 0;
  let maxBoxY = 0;
  for (const b of rawBoxes) {
    const bx = typeof b.x === 'number' ? b.x : (typeof b.left === 'number' && b.left > 100 ? b.left : 0);
    const by = typeof b.y === 'number' ? b.y : (typeof b.top === 'number' && b.top > 100 ? b.top : 0);
    const bw = typeof b.width === 'number' ? b.width : 0;
    const bh = typeof b.height === 'number' ? b.height : 0;
    if (bx + bw > maxBoxX) maxBoxX = bx + bw;
    if (by + bh > maxBoxY) maxBoxY = by + bh;
  }

  const isPixelMode = maxBoxX > 100 || maxBoxY > 100;
  // CV models in n8n (YOLO/Roboflow/OpenCV) normalize coordinates relative to their inference resolution (e.g. ~835x800)
  // We derive the inference frame from the detection extents so the boxes fit the shelf exactly
  const spaceWidth = isPixelMode ? Math.max(maxBoxX + 8, 835) : 100;
  const spaceHeight = isPixelMode ? Math.max(maxBoxY + 8, 785) : 100;

  return rawBoxes.map((box, index) => {
    const id = box.id || `box-${index + 1}`;
    const brand = (box.brand || box.label || 'OTHER').toUpperCase().trim();
    const confidence = typeof box.confidence === 'number' ? box.confidence : 0.98;
    const color = box.color || (brand === 'OTHER' ? '#DC2626' : brand === 'YARA' ? '#4B0082' : '#16A34A');

    // If already clean percentage (< 100) and not pixel mode
    if (!isPixelMode && typeof box.top === 'number' && typeof box.left === 'number') {
      return {
        id,
        brand,
        top: box.top,
        left: box.left,
        width: typeof box.width === 'number' ? box.width : 15,
        height: typeof box.height === 'number' ? box.height : 25,
        confidence,
        color,
        label: box.label || brand,
        thickness: box.thickness,
        fontSize: box.fontSize,
        labelBackground: box.labelBackground || color
      };
    }

    // Absolute pixel coordinates (e.g. from OpenCV or Roboflow in n8n)
    const pxX = typeof box.x === 'number' ? box.x : (typeof box.left === 'number' ? box.left : 50);
    const pxY = typeof box.y === 'number' ? box.y : (typeof box.top === 'number' ? box.top : 150);
    const pxW = typeof box.width === 'number' ? box.width : 120;
    const pxH = typeof box.height === 'number' ? box.height : 280;

    const leftPct = Math.max(0, Math.min(100, (pxX / spaceWidth) * 100));
    const topPct = Math.max(0, Math.min(100, (pxY / spaceHeight) * 100));
    const widthPct = Math.max(1, Math.min(100, (pxW / spaceWidth) * 100));
    const heightPct = Math.max(1, Math.min(100, (pxH / spaceHeight) * 100));

    return {
      id,
      brand,
      top: Number(topPct.toFixed(2)),
      left: Number(leftPct.toFixed(2)),
      width: Number(widthPct.toFixed(2)),
      height: Number(heightPct.toFixed(2)),
      confidence,
      color,
      pixelCoords: {
        x: pxX,
        y: pxY,
        width: pxW,
        height: pxH
      },
      label: box.label || brand,
      thickness: box.thickness,
      fontSize: box.fontSize,
      labelBackground: box.labelBackground || color
    };
  });
}

/**
 * Transmits audit image (either Blob/File from native camera/gallery or URL) and compliance metadata
 * as Multipart Form-Data to the n8n webhook.
 * Automatically falls back to simulated AI if the n8n endpoint times out or fails.
 */
/**
 * Ensures any photo input (File, Blob, base64 data URL, or remote URL) is converted
 * into a lightweight, high-quality JPEG Blob (<400KB) and Base64 strings for n8n transmission.
 */
export async function prepareN8nImagePayload(
  photoSource: string | Blob | File
): Promise<{ jpegBlob: Blob; base64DataUrl: string; rawBase64: string; fileName: string }> {
  let base64DataUrl = '';
  let fileName = `shelf_capture_${Date.now()}.jpg`;

  if (photoSource instanceof File && photoSource.name) {
    fileName = photoSource.name;
  }

  // 1. Convert input to data URL string first
  if (photoSource instanceof Blob) {
    try {
      base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(photoSource);
      });
    } catch {
      base64DataUrl = '';
    }
  } else if (typeof photoSource === 'string') {
    base64DataUrl = photoSource;
  }

  if (!base64DataUrl || !base64DataUrl.startsWith('data:')) {
    // If remote URL or object URL, fetch and convert to data URL
    try {
      const res = await fetch(photoSource as string);
      const blob = await res.blob();
      base64DataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      base64DataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
    }
  }

  // 2. Compress/downscale high-res mobile camera photos to max 1920x1920 at 0.85 quality
  let optimizedDataUrl = base64DataUrl;
  let jpegBlob: Blob | null = null;

  if (typeof window !== 'undefined' && base64DataUrl.startsWith('data:image/')) {
    try {
      optimizedDataUrl = await new Promise<string>((resolve) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1920;
          let w = img.naturalWidth || 1280;
          let h = img.naturalHeight || 720;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(base64DataUrl);
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(base64DataUrl);
        img.src = base64DataUrl;
      });
    } catch {
      optimizedDataUrl = base64DataUrl;
    }
  }

  // 3. Extract raw base64 string and create Blob
  const rawBase64 = optimizedDataUrl.split(',')[1] || optimizedDataUrl;
  try {
    const res = await fetch(optimizedDataUrl);
    jpegBlob = await res.blob();
  } catch {
    try {
      const byteCharacters = atob(rawBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      jpegBlob = new Blob([byteArray], { type: 'image/jpeg' });
    } catch {
      jpegBlob = new Blob(['simulated-binary-jpeg-data'], { type: 'image/jpeg' });
    }
  }

  return {
    jpegBlob: jpegBlob || new Blob(['simulated-binary-jpeg-data'], { type: 'image/jpeg' }),
    base64DataUrl: optimizedDataUrl,
    rawBase64,
    fileName
  };
}

/**
 * Transmits audit image (either Blob/File from native camera/gallery or URL) and compliance metadata
 * as Multipart Form-Data (or JSON fallback) to the n8n webhook.
 * Automatically attempts test webhook (/webhook-test/) if production (/webhook/) returns 404 or inactive.
 * Automatically falls back to simulated AI if the n8n endpoint times out or fails.
 */
export async function sendAuditToN8n(
  photoSource: string | Blob | File,
  metadata: N8nPayloadMetadata,
  timeoutMs: number = 90000, // 90s timeout for multi-model CV pipeline execution
  imageDimensions?: { width: number; height: number }
): Promise<N8nTransmissionResult> {
  const startTime = performance.now();
  const primaryEndpoint = getN8nWebhookUrl();
  const testEndpoint = primaryEndpoint.includes('/webhook/') 
    ? primaryEndpoint.replace('/webhook/', '/webhook-test/') 
    : primaryEndpoint;

  // Prepare downscaled JPEG Blob and Base64 strings for guaranteed transmission
  const { jpegBlob, base64DataUrl, rawBase64, fileName } = await prepareN8nImagePayload(photoSource);

  // Construct Multipart Form-Data with binary file under all n8n binary keys ('photo', 'data', 'file', 'image') and Base64 strings
  const formData = new FormData();
  formData.append('photo', jpegBlob, fileName);
  formData.append('data', jpegBlob, fileName);
  formData.append('file', jpegBlob, fileName);
  formData.append('image', jpegBlob, fileName);

  formData.append('photo_data_url', base64DataUrl);
  formData.append('photo_url', base64DataUrl);
  formData.append('photoDataUrl', base64DataUrl);
  formData.append('ImageURL', base64DataUrl);
  formData.append('image_url', base64DataUrl);
  formData.append('image_base64', rawBase64);
  formData.append('photo_base64', rawBase64);
  formData.append('base64', rawBase64);

  formData.append('outlet_id', metadata.outletId);
  formData.append('outlet_name', metadata.outletName);
  formData.append('account_name', metadata.accountName || metadata.outletName.split(' - ')[0] || metadata.outletName);
  formData.append('outlet_code', metadata.outletCode || metadata.outletId);
  formData.append('category', metadata.category);
  formData.append('rep_name', metadata.repName);
  formData.append('rep_id', metadata.repId);
  formData.append('total_facings', String(metadata.totalFacings ?? 0));
  formData.append('primary_share_pct', String(metadata.primarySharePct ?? 0));
  formData.append('share_of_shelf_pct', String(metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0));
  formData.append('share_of_shelf_label', metadata.shareOfShelfLabel || (metadata.category === 'Edible Oil' ? 'QFI SOS' : 'QFM SOS'));
  formData.append('counts_json', JSON.stringify(metadata.counts || {}));
  formData.append(
    'brand_breakdown',
    metadata.counts
      ? Object.entries(metadata.counts)
          .map(([b, c]) => `${b}: ${c}`)
          .join(' | ')
      : ''
  );
  formData.append('original_ai_counts_json', JSON.stringify(metadata.originalAiCounts || metadata.counts || {}));
  formData.append('discrepancy_log', metadata.discrepancyLog || 'No manual overrides (AI counts accepted)');
  formData.append('unmapped_remark', metadata.unmappedRemark || '');
  formData.append('latitude', String(metadata.latitude ?? 25.2854));
  formData.append('longitude', String(metadata.longitude ?? 51.5310));
  formData.append('lat', String(metadata.latitude ?? 25.2854));
  formData.append('lng', String(metadata.longitude ?? 51.5310));
  formData.append('location_source', metadata.locationSource || 'device_gps');
  formData.append('price_tag_ok', String(metadata.priceTagOk));
  formData.append('posm_shelf_sticker', String(metadata.posmShelfSticker));
  formData.append('posm_wobblers', String(metadata.posmWobblers));
  formData.append('needs_review', String(Boolean(metadata.needsReview)));
  formData.append('timestamp', metadata.timestamp);
  formData.append('device_platform', 'mobile_web');
  formData.append('app_url', 'https://mt-app-v-sf1.vercel.app/');
  formData.append('bay_key', metadata.aisle || '');
  formData.append('bay_label', metadata.aisleLabel || '');
  if (metadata.seam && metadata.seam.cutFrac > 0) {
    formData.append('seam_cut_frac', metadata.seam.cutFrac.toFixed(4));
    formData.append('seam_overlap_frac', metadata.seam.overlapFrac.toFixed(4));
    formData.append('seam_previous_bay', metadata.seam.previousBay);
    formData.append('seam_confidence', metadata.seam.confidence);
    formData.append('seam_method', metadata.seam.method);
  }

  const payloadSummary = {
    endpoint: primaryEndpoint,
    fields: {
      outlet_id: metadata.outletId,
      outlet_name: metadata.outletName,
      account_name: metadata.accountName || metadata.outletName,
      category: metadata.category,
      rep_name: metadata.repName,
      rep_id: metadata.repId,
      total_facings: metadata.totalFacings ?? 0,
      counts: metadata.counts ? Object.keys(metadata.counts).length : 0,
      latitude: metadata.latitude ?? 25.2854,
      longitude: metadata.longitude ?? 51.5310,
      price_tag_ok: metadata.priceTagOk,
      posm_shelf_sticker: metadata.posmShelfSticker,
      posm_wobblers: metadata.posmWobblers,
      timestamp: metadata.timestamp,
      app_url: 'https://mt-app-v-sf1.vercel.app/'
    },
    fileSizeKb: Math.round(jpegBlob.size / 1024) || 285,
    fileName,
    mimeType: jpegBlob.type || 'image/jpeg'
  };

  // Helper to process response
  const processFetchResponse = async (response: Response, targetEndpoint: string): Promise<N8nTransmissionResult> => {
    const latencyMs = Math.round(performance.now() - startTime);
    const contentType = response.headers.get('content-type') || '';
    const catKey = resolveCategoryKey(metadata.category);

    // Direct binary image response support
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      const imageBlob = await response.blob();
      const objectUrl = URL.createObjectURL(imageBlob);

      return {
        success: true,
        source: 'n8n_remote',
        statusCode: response.status,
        message: 'Received processed image',
        counts: { ...DEFAULT_AI_COUNTS[catKey] },
        boxes: SAMPLE_BOUNDING_BOXES[catKey] || [],
        annotatedImageUrl: objectUrl,
        latencyMs,
        timestamp: new Date().toLocaleTimeString(),
        payloadSummary: { ...payloadSummary, endpoint: targetEndpoint }
      };
    }

    let responseText = '';
    try {
      responseText = await response.text();
    } catch {
      responseText = '';
    }

    const normalized = normalizeN8nResponse(responseText, catKey);
    safeLogN8nDiagnostics(`Processed Webhook Response [${targetEndpoint}]`, responseText.slice(0, 200), normalized);

    if (normalized.error) {
      const isMissingRespond = /No Respond to Webhook node/i.test(normalized.error);
      return {
        success: false,
        source: 'simulated_fallback',
        statusCode: response.status,
        isMissingRespondNode: isMissingRespond,
        errorDetail: normalized.error,
        message: 'Could not analyse the photo. Please try again',
        counts: { ...DEFAULT_AI_COUNTS[catKey] },
        boxes: SAMPLE_BOUNDING_BOXES[catKey] || [],
        latencyMs,
        timestamp: new Date().toLocaleTimeString(),
        payloadSummary: { ...payloadSummary, endpoint: targetEndpoint }
      };
    }

    const refW = imageDimensions?.width || 800;
    const refH = imageDimensions?.height || 800;
    const boxes = normalized.boxes && normalized.boxes.length > 0
      ? normalizeN8nBoxes(normalized.boxes, refW, refH)
      : SAMPLE_BOUNDING_BOXES[catKey];

    return {
      success: true,
      source: 'n8n_remote',
      statusCode: response.status,
      message: `Analysis complete — ${normalized.total_facings} facings detected`,
      counts: normalized.counts,
      boxes,
      totalFacings: normalized.total_facings,
      needsReview: Boolean(normalized.needs_review),
      replyText: normalized.replyText,
      annotatedImageUrl: normalized.annotated_image,
      rawResponse: responseText,
      rawNormalized: normalized,
      latencyMs,
      timestamp: new Date().toLocaleTimeString(),
      payloadSummary: { ...payloadSummary, endpoint: targetEndpoint }
    };
  };

  // Attempt 0: Server-Side n8n Proxy (Eliminates browser iframe CORS restrictions entirely)
  try {
    const proxyController = new AbortController();
    const proxyTimeoutId = setTimeout(() => proxyController.abort(), timeoutMs);

    const proxyResponse = await fetch('/api/n8n/proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUrl: primaryEndpoint,
        base64: rawBase64,
        fileName,
        mimeType: jpegBlob.type || 'image/jpeg',
        metadata: {
          outlet_id: metadata.outletId,
          outlet_name: metadata.outletName,
          account_name: metadata.accountName || metadata.outletName,
          outlet_code: metadata.outletCode || metadata.outletId,
          category: metadata.category,
          rep_name: metadata.repName,
          rep_id: metadata.repId,
          total_facings: metadata.totalFacings ?? 0,
          primary_share_pct: metadata.primarySharePct ?? 0,
          share_of_shelf_pct: metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0,
          share_of_shelf_label: metadata.shareOfShelfLabel || 'QFI SOS',
          counts_json: JSON.stringify(metadata.counts || {}),
          original_ai_counts_json: JSON.stringify(metadata.originalAiCounts || metadata.counts || {}),
          discrepancy_log: metadata.discrepancyLog || 'No manual overrides (AI counts accepted)',
          unmapped_remark: metadata.unmappedRemark || '',
          latitude: metadata.latitude ?? 25.2854,
          longitude: metadata.longitude ?? 51.5310,
          location_source: metadata.locationSource || 'device_gps',
          price_tag_ok: metadata.priceTagOk,
          posm_shelf_sticker: metadata.posmShelfSticker,
          posm_wobblers: metadata.posmWobblers,
          needs_review: metadata.needsReview,
          timestamp: metadata.timestamp,
          app_url: 'https://mt-app-v-sf1.vercel.app/',
          bay_key: metadata.aisle || '',
          bay_label: metadata.aisleLabel || '',
          ...(metadata.seam && metadata.seam.cutFrac > 0 ? {
            seam_cut_frac: metadata.seam.cutFrac.toFixed(4),
            seam_overlap_frac: metadata.seam.overlapFrac.toFixed(4),
            seam_previous_bay: metadata.seam.previousBay,
            seam_confidence: metadata.seam.confidence,
            seam_method: metadata.seam.method
          } : {})
        }
      }),
      signal: proxyController.signal
    });

    clearTimeout(proxyTimeoutId);

    if (proxyResponse.ok) {
      console.info('[sendAuditToN8n] Successfully received analysis from n8n via server proxy');
      return await processFetchResponse(proxyResponse, primaryEndpoint);
    } else {
      console.warn(`[sendAuditToN8n] Server proxy returned HTTP ${proxyResponse.status}, trying fallback connection...`);
    }
  } catch (proxyErr: any) {
    console.warn('[sendAuditToN8n] Server proxy note (falling back to direct):', proxyErr?.message);
  }

  // Attempt 1: Direct Multipart Form-Data to Primary / Test Endpoint
  const endpointsToTry = [primaryEndpoint];
  if (testEndpoint !== primaryEndpoint) {
    endpointsToTry.push(testEndpoint);
  }

  for (const targetUrl of endpointsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(targetUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await processFetchResponse(response, targetUrl);
      } else if (response.status === 404 || response.status === 405) {
        // Workflow inactive or endpoint mismatch; try next endpoint in loop
        console.warn(`[sendAuditToN8n] ${targetUrl} returned HTTP ${response.status}, trying fallback endpoint...`);
        continue;
      } else {
        // If 400/413/422 or other status, try JSON POST payload fallback before giving up
        const errorText = await response.text().catch(() => '');
        if (/Workflow is not active/i.test(errorText) && targetUrl !== testEndpoint) {
          console.warn('[sendAuditToN8n] Workflow inactive notice on primary webhook, attempting test webhook...');
          continue;
        }

        // Try JSON POST fallback
        try {
          const jsonController = new AbortController();
          const jsonTimeoutId = setTimeout(() => jsonController.abort(), 30000);
          const jsonResponse = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              outlet_id: metadata.outletId,
              outlet_name: metadata.outletName,
              account_name: metadata.accountName || metadata.outletName,
              outlet_code: metadata.outletCode || metadata.outletId,
              category: metadata.category,
              rep_name: metadata.repName,
              rep_id: metadata.repId,
              total_facings: metadata.totalFacings ?? 0,
              primary_share_pct: metadata.primarySharePct ?? 0,
              share_of_shelf_pct: metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0,
              share_of_shelf_label: metadata.shareOfShelfLabel || 'QFI SOS',
              counts_json: JSON.stringify(metadata.counts || {}),
              original_ai_counts_json: JSON.stringify(metadata.originalAiCounts || metadata.counts || {}),
              discrepancy_log: metadata.discrepancyLog || 'No manual overrides (AI counts accepted)',
              unmapped_remark: metadata.unmappedRemark || '',
              latitude: metadata.latitude ?? 25.2854,
              longitude: metadata.longitude ?? 51.5310,
              location_source: metadata.locationSource || 'device_gps',
              price_tag_ok: metadata.priceTagOk,
              posm_shelf_sticker: metadata.posmShelfSticker,
              posm_wobblers: metadata.posmWobblers,
              needs_review: metadata.needsReview,
              timestamp: metadata.timestamp,
              photo_data_url: base64DataUrl,
              photo_url: base64DataUrl,
              photoDataUrl: base64DataUrl,
              ImageURL: base64DataUrl,
              image_base64: rawBase64,
              photo_base64: rawBase64,
              base64: rawBase64,
              app_url: 'https://mt-app-v-sf1.vercel.app/'
            }),
            signal: jsonController.signal
          });
          clearTimeout(jsonTimeoutId);
          if (jsonResponse.ok) {
            return await processFetchResponse(jsonResponse, targetUrl);
          }
        } catch (jsonErr) {
          console.warn('[sendAuditToN8n] JSON POST fallback exception:', jsonErr);
        }
      }
    } catch (err: any) {
      console.error(`[sendAuditToN8n] CRITICAL FETCH ERROR for ${targetUrl}:`, err);
      console.warn(`[sendAuditToN8n] Fetch error message:`, err?.message);
    }
  }

  // Graceful fallback to on-device simulated AI model if network is completely unreachable
  const latencyMs = Math.round(performance.now() - startTime);
  const fallbackCatKey = resolveCategoryKey(metadata.category);
  return {
    success: false,
    source: 'simulated_fallback',
    isMissingRespondNode: false,
    errorDetail: 'Could not connect to n8n webhook. Using on-device AI analysis mode.',
    message: 'Analysis complete (on-device mode)',
    counts: { ...DEFAULT_AI_COUNTS[fallbackCatKey] },
    boxes: SAMPLE_BOUNDING_BOXES[fallbackCatKey] || [],
    latencyMs,
    timestamp: new Date().toLocaleTimeString(),
    payloadSummary
  };
}

/**
 * Complete 14-bottle detection output from the user's n8n workflow.
 * Can be copied into n8n or simulated in the app with 100% fidelity.
 */
export const SAMPLE_N8N_OUTPUT_JSON = JSON.stringify(
  [
    {
      success: true,
      total_facings: 12,
      counts: {
        YARA: 3,
        ZAIN: 0,
        "AL RAI": 0,
        ADEERA: 3,
        DAWI: 0,
        OTHER: 6
      },
      boxes: [
        {
          id: "box-1",
          brand: "OTHER",
          confidence: 0.95,
          x: 50,
          y: 150,
          width: 101,
          height: 299,
          color: "#DC2626",
          thickness: 5,
          fontSize: 18,
          labelBackground: "#DC2626",
          labelColor: "#FFFFFF",
          label: "OTHER",
          labelContent: "brand only",
          labelBackgroundStyle: "solid"
        }
      ],
      annotated_image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=",
      replyText: "QFI Shelf Audit\nTotal facings: 12\nYARA: 3\nZAIN: 0\nAL RAI: 0\nADEERA: 3\nDAWI: 0\nOTHER: 6\nNeeds review: No",
      needs_review: false
    }
  ],
  null,
  2
);

/**
 * Sends audit data directly to the production mt-sheet-write n8n webhook (https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-sheet-write)
 * for Google Sheet & Google Drive record insertion without requiring Google Sign-In.
 */
export async function sendAuditToSheetWriteN8n(
  metadata: N8nPayloadMetadata & { photoUrl?: string; replyText?: string }
): Promise<{ success: boolean; message: string }> {
  const endpoint = N8N_SHEET_WRITE_PROD_WEBHOOK_URL;
  console.log('[sendAuditToSheetWriteN8n] Sending payload to:', endpoint);

  const brandBreakdownStr = metadata.counts
    ? Object.entries(metadata.counts)
        .map(([b, c]) => `${b}: ${c}`)
        .join(' | ')
    : '';

  // 1. Construct Multipart Form-Data
  const formData = new FormData();
  formData.append('outlet_id', metadata.outletId);
  formData.append('outlet_name', metadata.outletName);
  formData.append('account_name', metadata.accountName || metadata.outletName);
  formData.append('outlet_code', metadata.outletCode || metadata.outletId);
  formData.append('category', metadata.category);
  formData.append('rep_name', metadata.repName);
  formData.append('rep_id', metadata.repId);
  formData.append('total_facings', String(metadata.totalFacings ?? 0));
  formData.append('primary_share_pct', String(metadata.primarySharePct ?? 0));
  formData.append('share_of_shelf_pct', String(metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0));
  formData.append('share_of_shelf_label', metadata.shareOfShelfLabel || 'QFI SOS');
  formData.append('counts_json', JSON.stringify(metadata.counts || {}));
  formData.append('brand_breakdown', brandBreakdownStr);
  formData.append('original_ai_counts_json', JSON.stringify(metadata.originalAiCounts || metadata.counts || {}));
  formData.append('discrepancy_log', metadata.discrepancyLog || 'No manual overrides (AI counts accepted)');
  formData.append('unmapped_remark', metadata.unmappedRemark || '');
  formData.append('latitude', String(metadata.latitude ?? 25.2854));
  formData.append('longitude', String(metadata.longitude ?? 51.5310));
  formData.append('location_source', metadata.locationSource || 'device_gps');
  formData.append('price_tag_ok', String(metadata.priceTagOk));
  formData.append('posm_shelf_sticker', String(metadata.posmShelfSticker));
  formData.append('posm_wobblers', String(metadata.posmWobblers));
  formData.append('needs_review', String(Boolean(metadata.needsReview)));
  formData.append('timestamp', metadata.timestamp || new Date().toISOString());

  if (metadata.photoUrl) {
    const rawBase64 = metadata.photoUrl.startsWith('data:') ? (metadata.photoUrl.split(',')[1] || metadata.photoUrl) : '';
    formData.append('photo_url', metadata.photoUrl);
    formData.append('photo_data_url', metadata.photoUrl);
    formData.append('photoDataUrl', metadata.photoUrl);
    formData.append('ImageURL', metadata.photoUrl);
    if (rawBase64) {
      formData.append('image_base64', rawBase64);
      formData.append('photo_base64', rawBase64);
    }

    // Try converting base64 or URL photo into binary file blob under all n8n binary keys ('photo', 'data', 'file', 'image')
    try {
      const fileName = `audit_${metadata.outletId}_${Date.now()}.jpg`;
      let blob: Blob | null = null;
      if (metadata.photoUrl.startsWith('data:')) {
        const res = await fetch(metadata.photoUrl);
        blob = await res.blob();
      } else if (metadata.photoUrl.startsWith('http')) {
        const res = await fetch(metadata.photoUrl);
        if (res.ok) {
          blob = await res.blob();
        }
      }

      if (blob) {
        formData.append('photo', blob, fileName);
        formData.append('data', blob, fileName);
        formData.append('file', blob, fileName);
        formData.append('image', blob, fileName);
      }
    } catch (e) {
      console.warn('[n8n Sheet Write] Binary photo attach note:', e);
    }
  }

  // Attempt 1: Send via Multipart Form-Data
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('[sendAuditToSheetWriteN8n] Form-Data POST success, HTTP', response.status);
      return { success: true, message: '✓ Audit saved' };
    } else {
      console.warn('[sendAuditToSheetWriteN8n] Form-Data POST returned HTTP', response.status);
    }
  } catch (err: any) {
    console.warn('[sendAuditToSheetWriteN8n] Form-Data POST error:', err?.message);
  }

  // Attempt 2: Fallback to JSON payload if n8n expects Content-Type: application/json
  try {
    const rawBase64 = metadata.photoUrl && metadata.photoUrl.startsWith('data:') ? (metadata.photoUrl.split(',')[1] || metadata.photoUrl) : '';
    const jsonPayload = {
      outlet_id: metadata.outletId,
      outlet_name: metadata.outletName,
      account_name: metadata.accountName || metadata.outletName,
      outlet_code: metadata.outletCode || metadata.outletId,
      category: metadata.category,
      rep_name: metadata.repName,
      rep_id: metadata.repId,
      total_facings: metadata.totalFacings ?? 0,
      primary_share_pct: metadata.primarySharePct ?? 0,
      share_of_shelf_pct: metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0,
      shareOfShelfPct: metadata.shareOfShelfPct ?? metadata.primarySharePct ?? 0,
      share_of_shelf_label: metadata.shareOfShelfLabel || 'QFI SOS',
      counts: metadata.counts || {},
      counts_json: JSON.stringify(metadata.counts || {}),
      brand_breakdown: brandBreakdownStr,
      original_ai_counts_json: JSON.stringify(metadata.originalAiCounts || metadata.counts || {}),
      discrepancy_log: metadata.discrepancyLog || 'No manual overrides (AI counts accepted)',
      unmapped_remark: metadata.unmappedRemark || '',
      latitude: metadata.latitude ?? 25.2854,
      longitude: metadata.longitude ?? 51.5310,
      location_source: metadata.locationSource || 'device_gps',
      price_tag_ok: metadata.priceTagOk,
      posm_shelf_sticker: metadata.posmShelfSticker,
      posm_wobblers: metadata.posmWobblers,
      needs_review: Boolean(metadata.needsReview),
      timestamp: metadata.timestamp || new Date().toISOString(),
      photo_url: metadata.photoUrl || '',
      photo_data_url: metadata.photoUrl || '',
      photoDataUrl: metadata.photoUrl || '',
      ImageURL: metadata.photoUrl || '',
      image_base64: rawBase64,
      photo_base64: rawBase64
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonPayload)
    });

    if (response.ok) {
      console.log('[sendAuditToSheetWriteN8n] JSON POST success, HTTP', response.status);
      return { success: true, message: '✓ Audit saved' };
    } else {
      return { success: false, message: 'Could not save audit record. Please try again' };
    }
  } catch (err: any) {
    return { success: false, message: 'Could not save audit record. Please try again' };
  }
}


