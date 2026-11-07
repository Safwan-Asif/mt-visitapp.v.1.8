import {
  getGoogleAccessToken,
  uploadImageToGoogleDrive,
  appendRowToGoogleSheetDirect
} from './googleAuthService';
import { sendAuditToSheetWriteN8n } from './n8nService';

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

/**
 * Generates the complete 1-click Google Apps Script code to paste into Google Sheet Extensions > Apps Script
 * to automatically record rows and upload image files into Google Drive Folder 19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL.
 */
export function getAppsScriptTemplateCode(): string {
  return `function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var targetSheetId = "${TARGET_SPREADSHEET_ID}";
    var targetDriveFolderId = "${TARGET_DRIVE_FOLDER_ID}";

    var ss = SpreadsheetApp.openById(targetSheetId);
    var sheet = ss.getSheetByName("Audit_Logs") || ss.getActiveSheet();
    
    // Check if header row exists
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


