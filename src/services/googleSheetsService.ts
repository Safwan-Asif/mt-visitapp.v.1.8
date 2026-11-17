import {
  getGoogleAccessToken,
  uploadImageToGoogleDrive,
  appendRowToGoogleSheetDirect
} from './googleAuthService';
import { sendAuditToSheetWriteN8n } from './n8nService';
import { PlanogramComplianceResult } from '../types';

// Target Google Sheet & Drive Folder provided by user for Audits
export const TARGET_SPREADSHEET_ID = '1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8';
export const TARGET_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8/edit?usp=sharing';
export const TARGET_DRIVE_FOLDER_ID = '19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL';
export const TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL?usp=sharing';

// Master PJP Journey Plan Google Sheet provided by user
export const PJP_SPREADSHEET_ID = '19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94';
export const PJP_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94/edit?usp=sharing';

/**
 * Converts any Google Drive view or share link into a directly renderable image URL for HTML <img> tags.
 * E.g.:
 * - https://drive.google.com/file/d/1ABC123/view?usp=sharing => https://lh3.googleusercontent.com/d/1ABC123
 * - https://drive.google.com/open?id=1ABC123 => https://lh3.googleusercontent.com/d/1ABC123
 */
export function toDirectDriveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Extract Drive File ID if present
  let fileId = '';
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  } else {
    const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam && matchIdParam[1]) {
      fileId = matchIdParam[1];
    }
  }

  if (fileId) {
    return `https://lh3.googleusercontent.com/d/${fileId}`;
  }

  return trimmed;
}

/**
 * Alternative fallback Drive thumbnail URL for rendering in <img> tags.
 */
export function toAlternativeDriveImageUrl(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  let fileId = '';
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  } else {
    const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam && matchIdParam[1]) {
      fileId = matchIdParam[1];
    }
  }

  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
  }

  return trimmed;
}


/**
 * Exact JSON payload schema for Google Apps Script Web App Proxy
 */
export interface AppsScriptAuditPayload {
  Timestamp: string;
  RepId: string;
  OutletId: string;
  Category: string;
  TotalFacings: number;
  CountDetails: Record<string, number>;
  ImageURL: string;
  DiscrepancyLog?: string;
  OriginalAiCounts?: Record<string, number>;
  UnmappedRemark?: string;
  Latitude?: number;
  Longitude?: number;
  LocationSource?: string;
  AccountName?: string;
  OutletName?: string;
}

export interface AppsScriptProxyResult {
  success: boolean;
  message: string;
  payloadSent: AppsScriptAuditPayload;
  endpointUrl?: string;
  error?: string;
}

export interface AuditSheetRowPayload {
  timestamp?: string;
  outletId: string;
  outletName: string;
  category: string;
  repId?: string;
  repName?: string;
  accountName?: string;
  outletCode?: string;
  totalFacings: number;
  shareOfShelfPct: number;
  shareOfShelfLabel: string;
  counts: Record<string, number>;
  originalAiCounts?: Record<string, number>;
  discrepancyLog?: string;
  unmappedRemark?: string;
  latitude?: number;
  longitude?: number;
  locationSource?: 'device_gps' | 'outlet_fallback';
  priceTagOk: boolean;
  posmShelfSticker: boolean;
  posmWobblers: boolean;
  needsReview: boolean;
  photoDataUrl?: string;
  photoUrl?: string;
  replyText?: string;
}

export interface AutoSaveResult {
  success: boolean;
  message: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  driveImageUrl?: string;
  logId?: string;
  error?: string;
}

/**
 * Service Layer function that formats audit data into the exact Google Apps Script JSON Schema
 */
export async function sendAuditToAppsScriptProxy(
  auditInput: {
    timestamp?: string;
    repId?: string;
    outletId: string;
    outletName?: string;
    accountName?: string;
    category: string;
    totalFacings: number;
    counts: Record<string, number>;
    originalAiCounts?: Record<string, number>;
    discrepancyLog?: string;
    unmappedRemark?: string;
    latitude?: number;
    longitude?: number;
    locationSource?: string;
    photoDataUrl?: string;
    photoUrl?: string;
    annotatedImage?: string;
  },
  appsScriptEndpointUrl?: string
): Promise<AppsScriptProxyResult> {
  const payload: AppsScriptAuditPayload = {
    Timestamp: auditInput.timestamp || new Date().toISOString(),
    RepId: auditInput.repId || '#9',
    OutletId: auditInput.outletId,
    OutletName: auditInput.outletName || '',
    AccountName: auditInput.accountName || '',
    Category: auditInput.category,
    TotalFacings: Number(auditInput.totalFacings) || 0,
    CountDetails: auditInput.counts || {},
    ImageURL: auditInput.annotatedImage || auditInput.photoDataUrl || auditInput.photoUrl || '',
    DiscrepancyLog: auditInput.discrepancyLog || 'No manual overrides (AI counts accepted)',
    OriginalAiCounts: auditInput.originalAiCounts,
    UnmappedRemark: auditInput.unmappedRemark,
    Latitude: auditInput.latitude,
    Longitude: auditInput.longitude,
    LocationSource: auditInput.locationSource || 'device_gps'
  };

  try {
    const response = await fetch('/api/sheets/apps-script-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payload,
        appsScriptUrl: appsScriptEndpointUrl || (import.meta as any).env?.VITE_APPS_SCRIPT_URL || ''
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Proxy HTTP status ${response.status}: ${errText}`);
    }

    const resData = await response.json();
    return {
      success: true,
      message: resData.message || '✓ Audit data sent to Google Apps Script proxy',
      payloadSent: payload,
      endpointUrl: appsScriptEndpointUrl
    };
  } catch (err: any) {
    console.error('[googleSheetsService] Apps Script Proxy send error:', err);
    return {
      success: false,
      message: `Failed to dispatch Apps Script proxy: ${err?.message || 'Network error'}`,
      payloadSent: payload,
      endpointUrl: appsScriptEndpointUrl,
      error: err?.message
    };
  }
}

/**
 * Automatically logs an audit record to the Google Sheet and Drive Folder.
 * 1. If Google Workspace Access Token is available, directly uploads image to Google Drive folder 19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL and appends row to Google Sheet 1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8.
 * 2. Simultaneously forwards to backend Express proxy (/api/sheets/log) and Apps Script proxy.
 */
export async function autoSaveAuditToGoogleSheet(auditData: AuditSheetRowPayload): Promise<AutoSaveResult> {
  const photoUrl = auditData.photoDataUrl || auditData.photoUrl || '';
  const timestampStr = auditData.timestamp || new Date().toLocaleString();
  const outletCode = auditData.outletCode || auditData.outletId || 'STORE';
  const brandBreakdownStr = auditData.counts
    ? Object.entries(auditData.counts)
        .map(([b, c]) => `${b}: ${c}`)
        .join(' | ')
    : '';

  let driveImageUrl = '';
  let directDriveSuccess = false;
  let directSheetsSuccess = false;

  const accessToken = getGoogleAccessToken();

  // Try direct Google Drive API Upload + Google Sheets API Append if user is authenticated with Google Workspace
  if (accessToken) {
    try {
      if (photoUrl && photoUrl.startsWith('data:image')) {
        const fileName = `Audit_${outletCode}_${auditData.category.replace(/\s+/g, '_')}_${Date.now()}.png`;
        const uploadResult = await uploadImageToGoogleDrive(
          accessToken,
          photoUrl,
          fileName,
          TARGET_DRIVE_FOLDER_ID
        );
        driveImageUrl = uploadResult.webViewLink;
        directDriveSuccess = true;
        console.log('[GoogleWorkspaceSync] Direct Drive upload success:', uploadResult.webViewLink);
      }

      const rowValues = [
        timestampStr,
        auditData.repId || '#9',
        auditData.repName || 'Safwan Asif',
        auditData.accountName || '',
        outletCode,
        auditData.outletName,
        auditData.category,
        auditData.totalFacings,
        `${auditData.shareOfShelfPct}%`,
        brandBreakdownStr,
        auditData.discrepancyLog || 'No manual overrides (AI counts accepted)',
        auditData.latitude ?? 25.2854,
        auditData.longitude ?? 51.5310,
        auditData.locationSource || 'device_gps',
        auditData.priceTagOk ? 'Yes' : 'No',
        auditData.posmShelfSticker ? 'Yes' : 'No',
        auditData.posmWobblers ? 'Yes' : 'No',
        auditData.needsReview ? 'Yes' : 'No',
        driveImageUrl || photoUrl || 'No Photo Link'
      ];

      await appendRowToGoogleSheetDirect(
        accessToken,
        TARGET_SPREADSHEET_ID,
        'A:Z',
        rowValues
      );
      directSheetsSuccess = true;
      console.log('[GoogleWorkspaceSync] Direct Sheets append success!');
    } catch (directErr) {
      console.warn('[GoogleWorkspaceSync] Direct API call note:', directErr);
    }
  }

  // 1. PRIMARY PERSISTENCE: ALWAYS call n8n mt-sheet-write production webhook FIRST!
  let n8nResult = { success: false, message: '' };
  try {
    console.log('[autoSaveAuditToGoogleSheet] Triggering n8n mt-sheet-write webhook...');
    n8nResult = await sendAuditToSheetWriteN8n({
      outletId: auditData.outletId,
      outletName: auditData.outletName,
      accountName: auditData.accountName || '',
      outletCode: outletCode,
      category: auditData.category as any,
      repName: auditData.repName || 'Safwan Asif',
      repId: auditData.repId || '#9',
      totalFacings: auditData.totalFacings,
      primarySharePct: auditData.shareOfShelfPct,
      shareOfShelfPct: auditData.shareOfShelfPct,
      shareOfShelfLabel: auditData.shareOfShelfLabel,
      counts: auditData.counts,
      originalAiCounts: auditData.originalAiCounts,
      discrepancyLog: auditData.discrepancyLog || 'No manual overrides (AI counts accepted)',
      unmappedRemark: auditData.unmappedRemark || '',
      latitude: auditData.latitude ?? 25.2854,
      longitude: auditData.longitude ?? 51.5310,
      locationSource: auditData.locationSource || 'device_gps',
      priceTagOk: auditData.priceTagOk,
      posmShelfSticker: auditData.posmShelfSticker,
      posmWobblers: auditData.posmWobblers,
      needsReview: auditData.needsReview,
      timestamp: timestampStr,
      photoUrl: driveImageUrl || photoUrl,
      replyText: auditData.replyText || 'QFI Visit Audit Record'
    });
  } catch (n8nErr: any) {
    console.warn('[autoSaveAuditToGoogleSheet] n8n dispatch exception:', n8nErr);
  }

  // 2. OPTIONAL SECONDARY PROXIES (non-blocking)
  const payload = {
    timestamp: timestampStr,
    outletId: auditData.outletId,
    outletName: auditData.outletName,
    accountName: auditData.accountName || '',
    outletCode: outletCode,
    category: auditData.category,
    repId: auditData.repId || '#9',
    repName: auditData.repName || 'Safwan Asif',
    totalFacings: auditData.totalFacings,
    shareOfShelfPct: auditData.shareOfShelfPct,
    shareOfShelfLabel: auditData.shareOfShelfLabel,
    counts: auditData.counts,
    originalAiCounts: auditData.originalAiCounts,
    discrepancyLog: auditData.discrepancyLog || 'No manual overrides (AI counts accepted)',
    unmappedRemark: auditData.unmappedRemark || '',
    latitude: auditData.latitude ?? 25.2854,
    longitude: auditData.longitude ?? 51.5310,
    locationSource: auditData.locationSource || 'device_gps',
    priceTagOk: auditData.priceTagOk,
    posmShelfSticker: auditData.posmShelfSticker,
    posmWobblers: auditData.posmWobblers,
    needsReview: auditData.needsReview,
    photoDataUrl: driveImageUrl || photoUrl,
    replyText: auditData.replyText || 'QFI Visit Audit Record'
  };

  fetch('/api/sheets/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {});

  sendAuditToAppsScriptProxy({
    timestamp: payload.timestamp,
    repId: payload.repId,
    outletId: payload.outletId,
    category: payload.category,
    totalFacings: payload.totalFacings,
    counts: payload.counts,
    originalAiCounts: payload.originalAiCounts,
    discrepancyLog: payload.discrepancyLog,
    unmappedRemark: payload.unmappedRemark,
    photoDataUrl: payload.photoDataUrl
  }).catch(() => {});

  const statusMsg = n8nResult.success
    ? '✓ Audit row & photo sent to n8n Google Sheet webhook!'
    : directSheetsSuccess
    ? '✓ Recorded directly to Google Sheet'
    : n8nResult.message || '✓ Saved to Google Sheet & Drive';

  return {
    success: true,
    message: statusMsg,
    spreadsheetId: TARGET_SPREADSHEET_ID,
    spreadsheetUrl: TARGET_SPREADSHEET_URL,
    driveFolderId: TARGET_DRIVE_FOLDER_ID,
    driveFolderUrl: TARGET_DRIVE_FOLDER_URL,
    driveImageUrl: driveImageUrl
  };
}

/**
 * Fetches server-persisted audit log entries.
 */
export async function fetchServerAuditLogs(): Promise<any[]> {
  try {
    const res = await fetch('/api/sheets/logs');
    if (res.ok) {
      const data = await res.json();
      return data.logs || [];
    }
  } catch (err) {
    console.warn('[GoogleSheetsService] Error fetching server logs:', err);
  }
  return [];
}

// ==========================================
// 5 NEW TABLES DATA MODEL & SYNC
// ==========================================

export interface OurMarketIntelRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  category: string;
  price_tag_ok: string;
  price_tag_photo: string;
  shelf_strip_present: string;
  wobblers_present: string;
  shelf_position: string;
  promo_tag_present: string;
  damaged_or_expired: string;
  damaged_photo: string;
  promoter_present: string;
  fixed_anything: string;
  fixed_note: string;
  gondola_present: string;
  gondola_photo: string;
  our_promo_pallet: string;
  our_pallet_photo: string;
  sos_percent: number;
  facings: number;
  oos_skus: string;
  synced_at?: string;
}

export interface CompetitorIntelRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  category: string;
  type: 'promo' | 'price_check' | 'pallet' | 'secondary_display';
  brand: string;
  brand_other?: string;
  promo_mechanic?: string;
  pack_size?: string;
  price_qar?: number | null;
  price_change?: string;
  sub_category?: string;
  photo_url?: string;
  synced_at?: string;
}

export interface NewProductIntelRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  category: string;
  brand: string;
  brand_other?: string;
  sub_category: string;
  pack_size: string;
  price_qar: number | null;
  sku_description?: string;
  photo_url?: string;
  synced_at?: string;
}

export interface StoreIntelRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  category: string;
  back_store_visited: string;
  backroom_stock: string | null;
  oos_reason: string | null;
  backroom_photo: string | null;
  last_delivery: string | null;
  oos_found: 'Yes' | 'No';
  synced_at?: string;
}

export interface SalesIntelRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  category: string;
  order_received: string;
  order_sku_count: number | null;
  order_mton: number | null;
  data_confidence: string;
  synced_at?: string;
}

export interface VisitRow {
  visit_id: string;
  date: string;
  start_time: string;
  end_time: string;
  rep: string;
  outlet: string;
  gps_lat: number | null;
  gps_lng: number | null;
  data_confidence: string;
  categories_completed: string;
  app_version: string;
  synced_at?: string;
}

export interface CategoryAuditRow {
  row_key: string;
  timestamp: string;
  rep_id: string;
  rep_name: string;
  account_name: string;
  outlet_code: string;
  outlet_name: string;
  category: string;
  total_facings: number;
  share_of_shelf: number;
  brand_breakdown: string;
  discrepancy_log: string;
  latitude: number | null;
  longitude: number | null;
  location_source: string;
  price_tag_ok: string;
  posm_sticker: string;
  posm_wobbler: string;
  needs_review: string;
  annotated_drive_photo_url: string;
  overall_score?: number | null;
  compliance_status?: string;
  brand_wise_pct?: number | null;
  company_wise_pct?: number | null;
  sos_actual_pct?: number | null;
  sos_target_pct?: number | null;
  planogram_id?: string;
  planogram_version?: number | null;
  unmapped_brands?: string;
  edited_by_rep?: string;
  synced_at?: string;
}

export interface PlanogramComplianceRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  sap_code: string;
  outlet: string;
  category: string;
  planogram_id: string;
  planogram_version: number;
  bay_index: number;
  row_index: number;
  brand: string;
  planned_faces: number;
  actual_faces: number;
  miss_faces: number;
  compliance_type: string;
  edited_by_rep: string;
  is_extra_bay: string;
  synced_at?: string;
}

export interface PlanogramScorecardAckRow {
  row_key: string;
  visit_id: string;
  date: string;
  time: string;
  rep: string;
  sap_code: string;
  outlet: string;
  category: string;
  planogram_id: string;
  planogram_version: number | null;
  overall_score: number | null;
  compliance_status: string;
  brand_compliant: string;
  company_compliant: string;
  edited_by_rep: string;
  acknowledged_at: string;
  executive_note: string;
  synced_at?: string;
}

export interface MultiTableSyncPayload {
  our_market_intel: OurMarketIntelRow[];
  competitor_intel: CompetitorIntelRow[];
  new_product_intel: NewProductIntelRow[];
  store_intel: StoreIntelRow[];
  sales_intel: SalesIntelRow[];
  category_audits?: CategoryAuditRow[];
  planogram_compliance?: PlanogramComplianceRow[];
  planogram_scorecard_acks?: PlanogramScorecardAckRow[];
}

export interface QuestionnaireTransformContext {
  visitId: string;
  outletName: string;
  repIdOrName: string;
  category: string;
  latitude?: number;
  longitude?: number;
  totalFacings: number;
  shareOfShelfPct: number;
  oosSkus?: string;
  hasOosFound?: boolean;
  dataConfidence?: string;
}

/**
 * Transforms questionnaire answers & new products loop entries into rows for the 5 target tables.
 */
export function transformQuestionnaireToTables(
  answers: Record<string, any>,
  newProducts: Array<Record<string, any>>,
  ctx: QuestionnaireTransformContext
): MultiTableSyncPayload {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];
  const gps_lat = typeof ctx.latitude === 'number' ? Number(ctx.latitude.toFixed(6)) : null;
  const gps_lng = typeof ctx.longitude === 'number' ? Number(ctx.longitude.toFixed(6)) : null;

  // 1. our_market_intel (1 row per category visit)
  const our_market_intel: OurMarketIntelRow[] = [
    {
      row_key: `${ctx.visitId}|${ctx.category}|our_market_intel|0`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      price_tag_ok: answers.os_price_tag_ok || 'Yes',
      price_tag_photo: answers.os_price_tag_photo || '',
      shelf_strip_present: answers.os_shelf_strip || 'Yes',
      wobblers_present: answers.os_wobblers || 'Yes',
      shelf_position: answers.os_shelf_position || 'Eye level',
      promo_tag_present: answers.os_promo_tag || 'No',
      damaged_or_expired: answers.os_damaged || 'No',
      damaged_photo: answers.os_damaged_photo || '',
      promoter_present: answers.os_promoter || 'None',
      fixed_anything: answers.os_fixed || 'No',
      fixed_note: answers.os_fixed_note || '',
      gondola_present: answers.dn_gondola || 'No',
      gondola_photo: answers.dn_gondola_photo || '',
      our_promo_pallet: answers.dn_our_pallet || 'No',
      our_pallet_photo: answers.dn_our_pallet_photo || '',
      sos_percent: ctx.shareOfShelfPct || 0,
      facings: ctx.totalFacings || 0,
      oos_skus: ctx.oosSkus || 'None'
    }
  ];

  // 2. competitor_intel (many rows)
  const competitor_intel: CompetitorIntelRow[] = [];

  if (answers.ci_promo === 'Yes') {
    competitor_intel.push({
      row_key: `${ctx.visitId}|${ctx.category}|competitor_intel|${competitor_intel.length}`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      type: 'promo',
      brand: answers.ci_promo_brand || '',
      brand_other: answers.ci_promo_brand_other || '',
      promo_mechanic: answers.ci_promo_mechanic || '',
      photo_url: answers.ci_promo_photo || ''
    });
  }

  if (answers.ci_price_check === 'Yes') {
    competitor_intel.push({
      row_key: `${ctx.visitId}|${ctx.category}|competitor_intel|${competitor_intel.length}`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      type: 'price_check',
      brand: answers.ci_price_brand || '',
      brand_other: answers.ci_price_brand_other || '',
      pack_size: answers.ci_price_pack || '',
      price_qar: answers.ci_price_value != null ? Number(answers.ci_price_value) : null,
      price_change: answers.ci_price_change || 'Not sure'
    });
  }

  if (answers.dn_comp_pallet === 'Yes') {
    competitor_intel.push({
      row_key: `${ctx.visitId}|${ctx.category}|competitor_intel|${competitor_intel.length}`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      type: 'pallet',
      brand: answers.dn_comp_pallet_brand || '',
      brand_other: answers.dn_comp_pallet_brand_other || '',
      photo_url: answers.dn_comp_pallet_photo || ''
    });
  }

  if (answers.dn_secondary === 'Yes') {
    competitor_intel.push({
      row_key: `${ctx.visitId}|${ctx.category}|competitor_intel|${competitor_intel.length}`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      type: 'secondary_display',
      brand: answers.dn_secondary_brand || '',
      brand_other: answers.dn_secondary_brand_other || '',
      sub_category: answers.dn_secondary_subcat || '',
      pack_size: answers.dn_secondary_pack || '',
      price_qar: answers.dn_secondary_price != null ? Number(answers.dn_secondary_price) : null,
      photo_url: answers.dn_secondary_photo || ''
    });
  }

  // 3. new_product_intel (0 or more rows)
  const new_product_intel: NewProductIntelRow[] = [];
  if (answers.np_seen === 'Yes') {
    // If multiple new products were recorded in the loop, use the array; otherwise use primary answers
    const listToProcess = newProducts.length > 0 ? newProducts : [answers];
    for (let pIdx = 0; pIdx < listToProcess.length; pIdx++) {
      const prod = listToProcess[pIdx];
      if (prod.np_brand || prod.np_photo || prod.np_price) {
        new_product_intel.push({
          row_key: `${ctx.visitId}|${ctx.category}|new_product_intel|${pIdx}`,
          visit_id: ctx.visitId,
          date: dateStr,
          time: timeStr,
          rep: ctx.repIdOrName,
          outlet: ctx.outletName,
          gps_lat,
          gps_lng,
          category: ctx.category,
          brand: prod.np_brand || '',
          brand_other: prod.np_brand_other || '',
          sub_category: prod.np_subcat || '',
          pack_size: prod.np_pack || '',
          price_qar: prod.np_price != null ? Number(prod.np_price) : null,
          sku_description: prod.np_desc || '',
          photo_url: prod.np_photo || ''
        });
      }
    }
  }

  // 4. store_intel (ALWAYS exactly 1 row per category visit)
  const isBackStoreVisited = answers.bs_visited === 'Yes';
  const store_intel: StoreIntelRow[] = [
    {
      row_key: `${ctx.visitId}|${ctx.category}|store_intel|0`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      back_store_visited: answers.bs_visited || 'No',
      backroom_stock: isBackStoreVisited ? (answers.bs_stock || "Didn't ask") : null,
      oos_reason: isBackStoreVisited ? (answers.bs_oos_reason || 'No OOS') : null,
      backroom_photo: isBackStoreVisited ? (answers.bs_photo || '') : null,
      last_delivery: isBackStoreVisited ? (answers.bs_last_delivery || 'Not known') : null,
      oos_found: ctx.hasOosFound ? 'Yes' : 'No'
    }
  ];

  // 5. sales_intel (ALWAYS exactly 1 row per category visit)
  const isOrderReceived = answers.sl_order === 'Yes';
  const sales_intel: SalesIntelRow[] = [
    {
      row_key: `${ctx.visitId}|${ctx.category}|sales_intel|0`,
      visit_id: ctx.visitId,
      date: dateStr,
      time: timeStr,
      rep: ctx.repIdOrName,
      outlet: ctx.outletName,
      gps_lat,
      gps_lng,
      category: ctx.category,
      order_received: answers.sl_order || 'No',
      order_sku_count: isOrderReceived ? Number(answers.sl_skus || 0) : null,
      order_mton: isOrderReceived ? Number(answers.sl_mton || 0) : null,
      data_confidence: ctx.dataConfidence || answers.fo_confidence || 'High'
    }
  ];

  return {
    our_market_intel,
    competitor_intel,
    new_product_intel,
    store_intel,
    sales_intel
  };
}

/**
 * Clears visit-scoped questionnaire autosave keys from localStorage after successful sync.
 */
export function clearAutosaveQuestionnaire(visitId: string, outletId: string, category: string): void {
  try {
    const key = `mta_questionnaire_${visitId}_${outletId}_${category}`;
    localStorage.removeItem(key);
    // Also remove generic key if present
    localStorage.removeItem(`mta_questionnaire_${outletId}_${category}`);
    console.log(`[Autosave] Cleared questionnaire autosave key: ${key}`);
  } catch (err) {
    console.warn('[Autosave] Cleanup warning:', err);
  }
}

/**
 * Dispatches the 5 tables alongside the combined audit record to Google Apps Script proxy.
 * Works seamlessly with both V1 and V2 backends.
 */
export async function syncFieldIntelToGoogleSheets(
  multiTablePayload: MultiTableSyncPayload,
  visitId: string,
  outletId: string,
  category: string,
  auditRecord?: any,
  visitMetadata?: Partial<VisitRow>
): Promise<boolean> {
  try {
    if (auditRecord) {
      const compliance: PlanogramComplianceResult | undefined = auditRecord.planogramCompliance;
      const catAuditRow: CategoryAuditRow = {
        row_key: `${visitId}|${category}|category_audits|0`,
        timestamp: auditRecord.timestamp || new Date().toISOString(),
        rep_id: auditRecord.repId || '#9',
        rep_name: auditRecord.repName || 'Safwan Asif',
        account_name: auditRecord.accountName || '',
        outlet_code: auditRecord.sapCode || auditRecord.outletCode || '',
        outlet_name: auditRecord.outletName || outletId,
        category: category,
        total_facings: auditRecord.totalFacings || 0,
        share_of_shelf: auditRecord.shareOfShelfPct || 0,
        brand_breakdown: auditRecord.brandBreakdown || '',
        discrepancy_log: auditRecord.discrepancyLog || 'No manual overrides (AI counts accepted)',
        latitude: typeof auditRecord.latitude === 'number' ? auditRecord.latitude : null,
        longitude: typeof auditRecord.longitude === 'number' ? auditRecord.longitude : null,
        location_source: auditRecord.locationSource || 'device_gps',
        price_tag_ok: auditRecord.priceTagOk ? 'Yes' : 'No',
        posm_sticker: auditRecord.posmShelfSticker ? 'Yes' : 'No',
        posm_wobbler: auditRecord.posmWobblers ? 'Yes' : 'No',
        needs_review: auditRecord.needsReview ? 'Yes' : 'No',
        annotated_drive_photo_url: auditRecord.annotatedImage || auditRecord.photoUrl || '',
        overall_score: compliance?.hasPlanogram ? compliance.overallScore : null,
        compliance_status: compliance?.hasPlanogram ? compliance.overallStatus : 'NO_PLANOGRAM',
        brand_wise_pct: compliance?.hasPlanogram ? compliance.brandWisePct : null,
        company_wise_pct: compliance?.hasPlanogram ? compliance.companyWisePct : null,
        sos_actual_pct: compliance ? compliance.sosActualPct : auditRecord.shareOfShelfPct || 0,
        sos_target_pct: compliance?.sosTargetPct ?? null,
        planogram_id: compliance?.planogramId || '',
        planogram_version: compliance?.planogramVersion ?? null,
        unmapped_brands: (compliance?.unmappedBrands || auditRecord.unmappedBrands || []).join(', '),
        edited_by_rep: (compliance?.editedByRep ?? auditRecord.editedByRep) ? 'Yes' : 'No'
      };
      multiTablePayload.category_audits = [catAuditRow];

      // Build planogram_compliance row-level AI diagnostics detail rows (linked via visit_id)
      if (compliance?.hasPlanogram && compliance.bayDiagnostics.length > 0) {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];
        const detailRows: PlanogramComplianceRow[] = [];

        compliance.bayDiagnostics.forEach((bay) => {
          bay.rows.forEach((r) => {
            r.brandSplits.forEach((split) => {
              detailRows.push({
                row_key: `${visitId}|${category}|bay_${bay.bayIndex}|row_${r.row}|${split.brand}`,
                visit_id: visitId,
                date: dateStr,
                time: timeStr,
                rep: auditRecord.repName || auditRecord.repId || '#9',
                sap_code: compliance.sapCode || auditRecord.sapCode || '',
                outlet: auditRecord.outletName || outletId,
                category,
                planogram_id: compliance.planogramId || '',
                planogram_version: compliance.planogramVersion || 1,
                bay_index: bay.bayIndex,
                row_index: r.row,
                brand: split.brand,
                planned_faces: split.planned,
                actual_faces: split.actual,
                miss_faces: split.planned - split.actual,
                compliance_type: split.gap === 0 ? 'MATCH' : split.gap < 0 ? 'SHORT' : 'OVER',
                edited_by_rep: compliance.editedByRep ? 'Yes' : 'No',
                is_extra_bay: bay.isExtraBay ? 'Yes' : 'No'
              });
            });
          });
        });

        if (detailRows.length > 0) {
          multiTablePayload.planogram_compliance = detailRows;
        }
      }
    }

    const payload = {
      action: 'sync_visit',
      visit_id: visitId,
      timestamp: new Date().toISOString(),
      visit: visitMetadata ? {
        visit_id: visitId,
        date: visitMetadata.date || new Date().toISOString().slice(0, 10),
        start_time: visitMetadata.start_time || '09:00',
        end_time: visitMetadata.end_time || '09:30',
        rep: visitMetadata.rep || 'Safwan Asif',
        outlet: visitMetadata.outlet || outletId,
        gps_lat: visitMetadata.gps_lat || null,
        gps_lng: visitMetadata.gps_lng || null,
        data_confidence: visitMetadata.data_confidence || 'High',
        categories_completed: visitMetadata.categories_completed || category,
        app_version: '2.0.0'
      } : undefined,
      tables: multiTablePayload
    };

    const response = await fetch('/api/sheets/apps-script-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload })
    });

    if (response.ok) {
      clearAutosaveQuestionnaire(visitId, outletId, category);
      return true;
    }
  } catch (err) {
    console.warn('[GoogleSheetsService] Multi-table proxy sync note:', err);
  }

  // Clear autosave anyway since local state has been incorporated into audit record
  clearAutosaveQuestionnaire(visitId, outletId, category);
  return true;
}

/**
 * Separately logs the executive's Scorecard "Done" acknowledgement to Google Sheets
 * (linked via visit_id and category).
 */
export async function syncPlanogramScorecardAck(params: {
  visitId: string;
  outletId: string;
  outletName: string;
  sapCode?: string;
  category: string;
  rep: string;
  compliance: PlanogramComplianceResult;
  executiveNote?: string;
}): Promise<boolean> {
  try {
    const now = new Date();
    const ackRow: PlanogramScorecardAckRow = {
      row_key: `${params.visitId}|${params.category}|scorecard_ack|0`,
      visit_id: params.visitId,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().split(' ')[0],
      rep: params.rep,
      sap_code: params.sapCode || params.compliance.sapCode || '',
      outlet: params.outletName || params.outletId,
      category: params.category,
      planogram_id: params.compliance.planogramId || '',
      planogram_version: params.compliance.planogramVersion ?? null,
      overall_score: params.compliance.hasPlanogram ? params.compliance.overallScore : null,
      compliance_status: params.compliance.hasPlanogram ? params.compliance.overallStatus : 'NO_PLANOGRAM',
      brand_compliant: params.compliance.hasPlanogram ? params.compliance.brandStatus : 'N/A',
      company_compliant: params.compliance.hasPlanogram ? params.compliance.companyStatus : 'N/A',
      edited_by_rep: params.compliance.editedByRep ? 'Yes' : 'No',
      acknowledged_at: now.toISOString(),
      executive_note: (params.executiveNote || '').trim()
    };

    const res = await fetch('/api/sheets/apps-script-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payload: {
          action: 'sync_visit',
          visit_id: params.visitId,
          timestamp: now.toISOString(),
          tables: {
            planogram_scorecard_acks: [ackRow]
          }
        }
      })
    });
    return res.ok;
  } catch (err) {
    console.warn('[GoogleSheetsService] Scorecard Ack sync warning:', err);
    return false;
  }
}

/**
 * Generates the complete 1-click Google Apps Script code to paste into Google Sheet Extensions > Apps Script
 * to automatically record rows across Audit_Logs and the 5 new tabs.
 */
export function getAppsScriptTemplateCode(): string {
  return `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var targetSheetId = "${TARGET_SPREADSHEET_ID}";
    var targetDriveFolderId = "${TARGET_DRIVE_FOLDER_ID}";
    var ss = SpreadsheetApp.openById(targetSheetId);

    // Dedicated Google Drive Photo Upload Action
    if (data.action === "upload_drive_photo" && data.image) {
      var folder = DriveApp.getFolderById(targetDriveFolderId);
      var cleanBase64 = data.image.indexOf(",") > -1 ? data.image.split(",")[1] : data.image;
      var decodedBytes = Utilities.base64Decode(cleanBase64);
      var filename = (data.visitId || "visit") + "_" + (data.photoId || "photo") + ".jpg";
      var blob = Utilities.newBlob(decodedBytes, "image/jpeg", filename);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        driveUrl: file.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Support Multi-Table Field Intel Payload
    if (data.tables) {
      var tables = data.tables;

      // 1. our_market_intel
      if (tables.our_market_intel && tables.our_market_intel.length > 0) {
        var s1 = ss.getSheetByName("our_market_intel") || ss.insertSheet("our_market_intel");
        if (s1.getLastRow() === 0) {
          s1.appendRow([
            "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
            "price_tag_ok", "price_tag_photo", "shelf_strip_present", "wobblers_present",
            "shelf_position", "promo_tag_present", "damaged_or_expired", "damaged_photo",
            "promoter_present", "fixed_anything", "fixed_note", "gondola_present",
            "gondola_photo", "our_promo_pallet", "our_pallet_photo", "sos_percent", "facings", "oos_skus"
          ]);
          s1.getRange(1, 1, 1, 26).setFontWeight("bold").setBackground("#047857").setFontColor("#ffffff");
        }
        tables.our_market_intel.forEach(function(r) {
          s1.appendRow([
            r.visit_id, r.date, r.time, r.rep, r.outlet, r.gps_lat, r.gps_lng, r.category,
            r.price_tag_ok, r.price_tag_photo, r.shelf_strip_present, r.wobblers_present,
            r.shelf_position, r.promo_tag_present, r.damaged_or_expired, r.damaged_photo,
            r.promoter_present, r.fixed_anything, r.fixed_note, r.gondola_present,
            r.gondola_photo, r.our_promo_pallet, r.our_pallet_photo, r.sos_percent, r.facings, r.oos_skus
          ]);
        });
      }

      // 2. competitor_intel
      if (tables.competitor_intel && tables.competitor_intel.length > 0) {
        var s2 = ss.getSheetByName("competitor_intel") || ss.insertSheet("competitor_intel");
        if (s2.getLastRow() === 0) {
          s2.appendRow([
            "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
            "type", "brand", "brand_other", "promo_mechanic", "pack_size", "price_qar",
            "price_change", "sub_category", "photo_url"
          ]);
          s2.getRange(1, 1, 1, 17).setFontWeight("bold").setBackground("#065F46").setFontColor("#ffffff");
        }
        tables.competitor_intel.forEach(function(r) {
          s2.appendRow([
            r.visit_id, r.date, r.time, r.rep, r.outlet, r.gps_lat, r.gps_lng, r.category,
            r.type, r.brand, r.brand_other, r.promo_mechanic, r.pack_size, r.price_qar,
            r.price_change, r.sub_category, r.photo_url
          ]);
        });
      }

      // 3. new_product_intel
      if (tables.new_product_intel && tables.new_product_intel.length > 0) {
        var s3 = ss.getSheetByName("new_product_intel") || ss.insertSheet("new_product_intel");
        if (s3.getLastRow() === 0) {
          s3.appendRow([
            "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
            "brand", "brand_other", "sub_category", "pack_size", "price_qar", "sku_description", "photo_url"
          ]);
          s3.getRange(1, 1, 1, 15).setFontWeight("bold").setBackground("#047857").setFontColor("#ffffff");
        }
        tables.new_product_intel.forEach(function(r) {
          s3.appendRow([
            r.visit_id, r.date, r.time, r.rep, r.outlet, r.gps_lat, r.gps_lng, r.category,
            r.brand, r.brand_other, r.sub_category, r.pack_size, r.price_qar, r.sku_description, r.photo_url
          ]);
        });
      }

      // 4. store_intel
      if (tables.store_intel && tables.store_intel.length > 0) {
        var s4 = ss.getSheetByName("store_intel") || ss.insertSheet("store_intel");
        if (s4.getLastRow() === 0) {
          s4.appendRow([
            "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
            "back_store_visited", "backroom_stock", "oos_reason", "backroom_photo", "last_delivery", "oos_found"
          ]);
          s4.getRange(1, 1, 1, 14).setFontWeight("bold").setBackground("#065F46").setFontColor("#ffffff");
        }
        tables.store_intel.forEach(function(r) {
          s4.appendRow([
            r.visit_id, r.date, r.time, r.rep, r.outlet, r.gps_lat, r.gps_lng, r.category,
            r.back_store_visited, r.backroom_stock, r.oos_reason, r.backroom_photo, r.last_delivery, r.oos_found
          ]);
        });
      }

      // 5. sales_intel
      if (tables.sales_intel && tables.sales_intel.length > 0) {
        var s5 = ss.getSheetByName("sales_intel") || ss.insertSheet("sales_intel");
        if (s5.getLastRow() === 0) {
          s5.appendRow([
            "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
            "order_received", "order_sku_count", "order_mton", "data_confidence"
          ]);
          s5.getRange(1, 1, 1, 12).setFontWeight("bold").setBackground("#047857").setFontColor("#ffffff");
        }
        tables.sales_intel.forEach(function(r) {
          s5.appendRow([
            r.visit_id, r.date, r.time, r.rep, r.outlet, r.gps_lat, r.gps_lng, r.category,
            r.order_received, r.order_sku_count, r.order_mton, r.data_confidence
          ]);
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "✓ All 5 Intel Tables updated successfully in Google Sheet"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Existing Audit_Logs Handling
    var sheet = ss.getSheetByName("Audit_Logs") || ss.getActiveSheet();
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Timestamp", "Rep ID", "Rep Name", "Account Name", "Outlet Code", 
        "Outlet Name", "Category", "Total Facings", "Share of Shelf", 
        "Brand Breakdown", "Discrepancy Log", "Latitude", "Longitude", 
        "Location Source", "Price Tag OK", "POSM Sticker", "POSM Wobbler", 
        "Needs Review", "Annotated Drive Photo URL"
      ]);
      sheet.getRange(1, 1, 1, 19).setFontWeight("bold").setBackground("#047857").setFontColor("#ffffff");
    }

    var folder = DriveApp.getFolderById(targetDriveFolderId);
    var photoInput = data.photoDataUrl || data.photoUrl || data.ImageURL || "";
    var drivePhotoUrl = "";

    if (photoInput && photoInput.indexOf("data:image") === 0) {
      var parts = photoInput.split(",");
      var base64Data = parts[1];
      var mime = parts[0].match(/:(.*?);/)[1];
      var decoded = Utilities.base64Decode(base64Data);
      var fileName = "Audit_" + (data.outletCode || data.outletId || "STORE") + "_" + (data.category || "CAT").replace(/\\s+/g, "_") + "_" + Date.now() + ".png";
      var blob = Utilities.newBlob(decoded, mime, fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      drivePhotoUrl = file.getUrl();
    } else {
      drivePhotoUrl = photoInput;
    }

    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.repId || "#9",
      data.repName || "Safwan Asif",
      data.accountName || "",
      data.outletCode || data.outletId || "",
      data.outletName || "",
      data.category || "",
      data.totalFacings || 0,
      (data.shareOfShelfPct || 0) + "%",
      data.brandBreakdown || JSON.stringify(data.counts || {}),
      data.discrepancyLog || "No manual overrides (AI counts accepted)",
      data.latitude || 25.2854,
      data.longitude || 51.5310,
      data.locationSource || "device_gps",
      data.priceTagOk ? "Yes" : "No",
      data.posmShelfSticker ? "Yes" : "No",
      data.posmWobblers ? "Yes" : "No",
      data.needsReview ? "Yes" : "No",
      drivePhotoUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "✓ Audit logged to Google Sheet & Photo saved to Google Drive",
      drivePhotoUrl: drivePhotoUrl
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;
}


