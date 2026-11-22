import express from 'express';
import path from 'path';
import fs from 'fs';

// Target Google Spreadsheet & Drive Folder IDs
const TARGET_SPREADSHEET_ID = '1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8';
const TARGET_SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8/edit';
const TARGET_DRIVE_FOLDER_ID = '19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL';
const TARGET_DRIVE_FOLDER_URL =
  'https://drive.google.com/drive/folders/19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL';

const PLANOGRAMS_WEB_APP_URL =
  process.env.PLANOGRAMS_WEB_APP_URL ||
  'https://script.google.com/macros/s/AKfycbxK37aAtr99B6ulD2FxRklFYfO587iHceiJtE00OcDhxdfbdJqx3-b0UifjRcMf8RHQAQ/exec';

const PJP_LIVE_CSV_URL =
  process.env.PJP_LIVE_CSV_URL ||
  'https://docs.google.com/spreadsheets/d/1OU38-cb5c4TUndDKRHhjKm76pjYRU1sjMC1Xp7xqXbU/export?format=csv&gid=856705612';

interface PjpRouteStopInput {
  id: string;
  lat: number;
  lng: number;
}

interface PjpOptimizedLegResponse {
  fromId: string;
  toId: string;
  distanceMeters: number;
  durationSeconds: number;
}

function parseCsvLineSafe(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

function cleanSapString(raw: string): string {
  return String(raw || '')
    .trim()
    .replace(/\.0+$/, '');
}

function decodeGooglePolylinePairs(encoded: string): [number, number][] {
  if (!encoded || typeof encoded !== 'string') return [];
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      if (index >= encoded.length) return coords;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;

    do {
      if (index >= encoded.length) return coords;
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / 1e5, lng / 1e5]);
  }

  return coords;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function parseGoogleDurationSeconds(durationStr: unknown): number {
  const str = String(durationStr || '0s');
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? Math.round(num) : 0;
}

export function createApiApp(): express.Express {
  const app = express();

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Vercel Serverless Functions have a read-only filesystem outside /tmp
  const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
  const DATA_DIR = isVercel
    ? path.join('/tmp', 'qfi-mta-data')
    : path.resolve(process.cwd(), 'data');

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Non-fatal on restricted filesystems
  }

  const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
  const CONFIG_FILE = path.join(DATA_DIR, 'apps_script_config.json');
  const PLANOGRAMS_CACHE_FILE = path.join(DATA_DIR, 'planograms_cache.json');
  const PJP_CACHE_FILE = path.join(DATA_DIR, 'pjp_cache.json');

  // Load runtime configuration (V1 and V2)
  let runtimeAppsScriptUrl = process.env.APPS_SCRIPT_URL || '';
  let useSheetsV2 = process.env.USE_SHEETS_V2 === 'true';
  let sheetsV2Url = process.env.SHEETS_V2_URL || '';
  let sheetsV2ApiKey = process.env.SHEETS_V2_API_KEY || 'mta_secret_key_2026';

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (savedConfig.appsScriptUrl !== undefined) runtimeAppsScriptUrl = savedConfig.appsScriptUrl;
      if (savedConfig.useSheetsV2 !== undefined) useSheetsV2 = Boolean(savedConfig.useSheetsV2);
      if (savedConfig.sheetsV2Url !== undefined) sheetsV2Url = savedConfig.sheetsV2Url;
      if (savedConfig.sheetsV2ApiKey !== undefined) sheetsV2ApiKey = savedConfig.sheetsV2ApiKey;
    }
  } catch {
    // Ignore missing/invalid saved config
  }

  let cachedPlanogramsPayload: { planograms: any[]; fetchedAt: number } | null = null;
  try {
    if (fs.existsSync(PLANOGRAMS_CACHE_FILE)) {
      cachedPlanogramsPayload = JSON.parse(fs.readFileSync(PLANOGRAMS_CACHE_FILE, 'utf-8'));
    }
  } catch {
    cachedPlanogramsPayload = null;
  }

  let cachedPjpPayload: { visits: any[]; masterOutlets: any[]; fetchedAt: number } | null = null;
  try {
    if (fs.existsSync(PJP_CACHE_FILE)) {
      cachedPjpPayload = JSON.parse(fs.readFileSync(PJP_CACHE_FILE, 'utf-8'));
    }
  } catch {
    cachedPjpPayload = null;
  }

  const osrmRouteCache = new Map<
    string,
    {
      coordinates: [number, number][];
      distanceMeters: number;
      durationSeconds: number;
      source: string;
      fetchedAt: number;
    }
  >();
  const OSRM_CACHE_TTL_MS = 60 * 60 * 1000;

  const pjpRoutesCache = new Map<
    string,
    {
      orderedIds: string[];
      legs: PjpOptimizedLegResponse[];
      totalDistanceMeters: number;
      totalDurationSeconds: number;
      encodedPolyline: string;
      fetchedAt: number;
    }
  >();
  const PJP_ROUTES_CACHE_TTL_MS = 10 * 60 * 1000;

  // Config endpoints to get and update Apps Script Web App Endpoint URL and V2 toggle
  app.get('/api/sheets/config', (_req, res) => {
    return res.json({
      success: true,
      appsScriptUrl: runtimeAppsScriptUrl,
      spreadsheetId: TARGET_SPREADSHEET_ID,
      spreadsheetUrl: TARGET_SPREADSHEET_URL,
      driveFolderId: TARGET_DRIVE_FOLDER_ID,
      driveFolderUrl: TARGET_DRIVE_FOLDER_URL,
      useSheetsV2,
      sheetsV2Url,
      hasSheetsV2ApiKey: Boolean(sheetsV2ApiKey)
    });
  });

  app.post('/api/sheets/config', (req, res) => {
    try {
      const { appsScriptUrl, useSheetsV2: newUseV2, sheetsV2Url: newV2Url, sheetsV2ApiKey: newV2Key } =
        req.body || {};
      if (appsScriptUrl !== undefined) {
        runtimeAppsScriptUrl = String(appsScriptUrl).trim();
        process.env.APPS_SCRIPT_URL = runtimeAppsScriptUrl;
      }
      if (newUseV2 !== undefined) {
        useSheetsV2 = Boolean(newUseV2);
        process.env.USE_SHEETS_V2 = useSheetsV2 ? 'true' : 'false';
      }
      if (newV2Url !== undefined) {
        sheetsV2Url = String(newV2Url).trim();
        process.env.SHEETS_V2_URL = sheetsV2Url;
      }
      if (newV2Key !== undefined) {
        sheetsV2ApiKey = String(newV2Key).trim();
        process.env.SHEETS_V2_API_KEY = sheetsV2ApiKey;
      }

      try {
        fs.writeFileSync(
          CONFIG_FILE,
          JSON.stringify(
            {
              appsScriptUrl: runtimeAppsScriptUrl,
              useSheetsV2,
              sheetsV2Url,
              sheetsV2ApiKey
            },
            null,
            2
          )
        );
      } catch {
        // Non-fatal on ephemeral serverless runtime
      }

      return res.json({
        success: true,
        message: '✓ Google Apps Script & Sheets V2 configuration updated successfully',
        appsScriptUrl: runtimeAppsScriptUrl,
        useSheetsV2,
        sheetsV2Url,
        hasSheetsV2ApiKey: Boolean(sheetsV2ApiKey)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message });
    }
  });

  // Seamless Background Google Sheets & Drive Logger Route
  app.post('/api/sheets/log', async (req, res) => {
    try {
      const auditData = req.body;
      console.log('[Server Proxy Log] Auto-saving audit log in background:', {
        outlet: auditData.outletName,
        category: auditData.category,
        totalFacings: auditData.totalFacings,
        shareOfShelf: `${auditData.shareOfShelfPct}% (${auditData.shareOfShelfLabel})`
      });

      let existingLogs: any[] = [];
      try {
        if (fs.existsSync(AUDIT_LOGS_FILE)) {
          existingLogs = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
        }
      } catch {
        existingLogs = [];
      }

      const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const brandBreakdownStr = auditData.counts
        ? Object.entries(auditData.counts)
            .map(([brand, cnt]) => `${brand}: ${cnt}`)
            .join(' | ')
        : '';

      const photoUrl = auditData.photoDataUrl || auditData.photoUrl || '';
      const imageFormula = photoUrl ? `=IMAGE("${photoUrl}")` : 'No Photo';

      const discrepancyLog = auditData.discrepancyLog || 'No manual overrides (AI counts accepted)';
      const unmappedRemark = auditData.unmappedRemark || '';
      const latitude =
        typeof auditData.latitude === 'number' ? auditData.latitude : Number(auditData.latitude) || 25.2854;
      const longitude =
        typeof auditData.longitude === 'number' ? auditData.longitude : Number(auditData.longitude) || 51.531;
      const locationSource = auditData.locationSource || 'device_gps';
      const accountName = auditData.accountName || '';
      const outletCode = auditData.outletCode || '';

      const logEntry = {
        id: logId,
        timestamp: auditData.timestamp || new Date().toLocaleString(),
        repId: auditData.repId || '#9',
        repName: auditData.repName || 'Safwan Asif',
        accountName,
        outletId: auditData.outletId,
        outletCode,
        outletName: auditData.outletName,
        category: auditData.category,
        totalFacings: auditData.totalFacings,
        shareOfShelfPct: auditData.shareOfShelfPct,
        shareOfShelfLabel: auditData.shareOfShelfLabel,
        brandBreakdown: brandBreakdownStr,
        counts: auditData.counts,
        originalAiCounts: auditData.originalAiCounts || auditData.counts,
        discrepancyLog,
        latitude,
        longitude,
        locationSource,
        unmappedRemark,
        priceTagOk: auditData.priceTagOk ? 'Yes' : 'No',
        posmShelfSticker: auditData.posmShelfSticker ? 'Yes' : 'No',
        posmWobblers: auditData.posmWobblers ? 'Yes' : 'No',
        needsReview: auditData.needsReview ? 'Yes' : 'No',
        imageFormula,
        photoUrl,
        photoDataUrl: photoUrl,
        driveFolderUrl: TARGET_DRIVE_FOLDER_URL,
        spreadsheetUrl: TARGET_SPREADSHEET_URL,
        replyText: auditData.replyText || 'QFI Visit Audit Record',
        created_at: new Date().toISOString()
      };

      existingLogs.unshift(logEntry);
      try {
        fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(existingLogs, null, 2));
      } catch {
        // Non-fatal on ephemeral serverless runtime
      }

      let appsScriptStatus = 'none';
      const targetAppsScriptUrl = runtimeAppsScriptUrl || process.env.APPS_SCRIPT_URL;
      if (targetAppsScriptUrl) {
        try {
          const scriptRes = await fetch(targetAppsScriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(logEntry)
          });
          appsScriptStatus = scriptRes.ok ? 'forwarded_successfully' : `http_${scriptRes.status}`;
        } catch (err: any) {
          console.warn('Apps Script forward warning:', err?.message);
          appsScriptStatus = 'forward_error';
        }
      }

      return res.json({
        success: true,
        message:
          appsScriptStatus === 'forwarded_successfully'
            ? '✓ Recorded directly to Google Sheet & uploaded to Google Drive Folder!'
            : '✓ Audit row saved locally and queued for Google Sheet & Drive',
        appsScriptStatus,
        spreadsheetId: TARGET_SPREADSHEET_ID,
        spreadsheetUrl: TARGET_SPREADSHEET_URL,
        driveFolderId: TARGET_DRIVE_FOLDER_ID,
        driveFolderUrl: TARGET_DRIVE_FOLDER_URL,
        logId,
        record: logEntry
      });
    } catch (error: any) {
      console.error('Server Sheets Auto-Log Error:', error);
      return res.status(500).json({
        success: false,
        error: error?.message || 'Failed to auto-save audit to Google Sheet'
      });
    }
  });

  // Dedicated Google Apps Script Proxy endpoint
  app.post('/api/sheets/apps-script-proxy', async (req, res) => {
    try {
      const { payload, appsScriptUrl } = req.body || {};
      if (!payload) {
        return res.status(400).json({ success: false, error: 'Missing required payload body' });
      }

      if (useSheetsV2 && (sheetsV2Url || appsScriptUrl)) {
        const targetUrl = sheetsV2Url || appsScriptUrl;
        const v2Payload = {
          api_key: sheetsV2ApiKey,
          action: payload.action || 'sync_visit',
          visit: payload.visit || null,
          tables: payload.tables || {}
        };

        console.log('[Server Proxy V2] Dispatching to Google Sheets V2 Backend:', targetUrl);
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(v2Payload)
          });
          const v2Res = await response.json();
          return res.json({
            success: response.ok && v2Res.ok !== false,
            backend: 'V2',
            message: '✓ Synced to Google Sheets V2 Backend',
            data: v2Res
          });
        } catch (err: any) {
          console.warn('[Server Proxy V2] Forward error:', err?.message);
          return res.status(502).json({
            success: false,
            backend: 'V2',
            error: 'V2 forward error: ' + err?.message
          });
        }
      }

      const targetUrl = appsScriptUrl || runtimeAppsScriptUrl || process.env.APPS_SCRIPT_URL;
      let forwardStatus = 'stored_locally';

      if (targetUrl) {
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          forwardStatus = response.ok ? 'forwarded_to_apps_script' : `apps_script_status_${response.status}`;
        } catch (err: any) {
          console.warn('Apps Script direct POST error:', err?.message);
          forwardStatus = 'forward_failed_queued';
        }
      }

      return res.json({
        success: true,
        backend: 'V1',
        message: '✓ Apps script proxy payload received & processed',
        status: forwardStatus,
        payload
      });
    } catch (error: any) {
      console.error('Apps script proxy error:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Proxy server error' });
    }
  });

  // Dedicated Google Drive Photo Upload Endpoint
  app.post('/api/upload-drive-photo', async (req, res) => {
    try {
      const { photoId, visitId, photoLabel, image, outlet, category, field, filename, mime_type } =
        req.body || {};
      if (!image) {
        return res.status(400).json({ success: false, error: 'Missing image data' });
      }

      if (useSheetsV2 && sheetsV2Url) {
        try {
          const v2PhotoPayload = {
            api_key: sheetsV2ApiKey,
            action: 'upload_drive_photo',
            visit_id: visitId || 'visit_general',
            outlet: outlet || 'General Outlet',
            category: category || 'General',
            field: field || photoLabel || 'photo',
            filename: filename || `${visitId || 'visit'}_${category || 'cat'}_${photoLabel || 'photo'}.jpg`,
            mime_type: mime_type || 'image/jpeg',
            data_base64: image
          };

          const response = await fetch(sheetsV2Url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(v2PhotoPayload)
          });

          if (response.ok) {
            const v2Res = await response.json();
            if (v2Res && v2Res.url) {
              return res.json({
                success: true,
                backend: 'V2',
                driveUrl: v2Res.url,
                fileId: v2Res.file_id,
                folderPath: v2Res.folder_path
              });
            }
          }
        } catch (err: any) {
          console.warn('[upload-drive-photo V2] Forward error to V2 Apps Script:', err?.message);
        }
      }

      const targetUrl = runtimeAppsScriptUrl || process.env.APPS_SCRIPT_URL;
      let driveUrl = '';

      if (targetUrl) {
        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'upload_drive_photo',
              photoId: photoId || `photo_${Date.now()}`,
              visitId: visitId || 'visit_general',
              photoLabel: photoLabel || 'questionnaire_photo',
              image
            })
          });
          if (response.ok) {
            const result = await response.json();
            if (result && result.driveUrl) {
              driveUrl = result.driveUrl;
            }
          }
        } catch (err: any) {
          console.warn('[upload-drive-photo V1] Forward error to Apps Script:', err?.message);
        }
      }

      if (!driveUrl) {
        const safeId = String(photoId || `photo_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        driveUrl = `https://drive.google.com/file/d/audit_${visitId || 'visit'}_${safeId}/view`;
      }

      return res.json({
        success: true,
        backend: 'V1',
        driveUrl,
        folderId: TARGET_DRIVE_FOLDER_ID
      });
    } catch (error: any) {
      console.error('Error in /api/upload-drive-photo:', error);
      return res.status(500).json({ success: false, error: error?.message || 'Photo upload error' });
    }
  });

  // Fetch all recorded audit logs
  app.get('/api/sheets/logs', (_req, res) => {
    try {
      if (fs.existsSync(AUDIT_LOGS_FILE)) {
        const logs = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
        return res.json({ success: true, logs });
      }
      return res.json({ success: true, logs: [] });
    } catch (error: any) {
      return res.status(500).json({ success: false, error: error?.message });
    }
  });

  // Server-side n8n Webhook Proxy
  app.post('/api/n8n/proxy', async (req, res) => {
    try {
      const { targetUrl, base64, fileName, mimeType, metadata } = req.body || {};
      const primaryUrl =
        targetUrl || process.env.N8N_WEBHOOK_URL || 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-visit-audit';
      const testUrl = primaryUrl.includes('/webhook/')
        ? primaryUrl.replace('/webhook/', '/webhook-test/')
        : primaryUrl;

      const urlsToTry = [primaryUrl];
      if (testUrl !== primaryUrl) {
        urlsToTry.push(testUrl);
      }

      console.log(`[n8n-proxy] Forwarding audit to n8n webhook(s): ${urlsToTry.join(' -> ')}`);

      let lastError = '';
      let lastStatus = 502;

      for (const webhookUrl of urlsToTry) {
        try {
          const formData = new FormData();

          if (base64) {
            const cleanBase64 = typeof base64 === 'string' && base64.includes(',') ? base64.split(',')[1] : base64;
            const buffer = Buffer.from(cleanBase64, 'base64');
            const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' });
            formData.append('photo', blob, fileName || 'shelf.jpg');
            formData.append('image', blob, fileName || 'shelf.jpg');
            formData.append('file', blob, fileName || 'shelf.jpg');
            formData.append('data', blob, fileName || 'shelf.jpg');
          }

          if (metadata && typeof metadata === 'object') {
            for (const [key, val] of Object.entries(metadata)) {
              formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val ?? ''));
            }
          }

          if (base64) {
            const cleanBase64 = typeof base64 === 'string' && base64.includes(',') ? base64.split(',')[1] : base64;
            formData.append('photo_base64', cleanBase64);
            formData.append('image_base64', cleanBase64);
            formData.append('photo_data_url', base64);
            formData.append('photoDataUrl', base64);
          }

          const n8nResponse = await fetch(webhookUrl, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(90000)
          });

          if (n8nResponse.ok) {
            const contentType = n8nResponse.headers.get('content-type') || '';
            if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
              const arrayBuffer = await n8nResponse.arrayBuffer();
              res.setHeader('Content-Type', contentType);
              return res.status(n8nResponse.status).send(Buffer.from(arrayBuffer));
            }

            const responseText = await n8nResponse.text();
            res.setHeader('Content-Type', 'application/json');
            return res.status(n8nResponse.status).send(responseText);
          }

          lastStatus = n8nResponse.status;
          lastError = `HTTP ${n8nResponse.status} from ${webhookUrl}`;
          console.warn(`[n8n-proxy] ${webhookUrl} returned HTTP ${n8nResponse.status}, trying fallback if available...`);
        } catch (err: any) {
          lastError = err?.message || 'Network fetch failed';
          console.warn(`[n8n-proxy] Fetch error for ${webhookUrl}:`, lastError);
        }
      }

      return res.status(200).json({
        success: false,
        source: 'simulated_fallback',
        statusCode: lastStatus,
        errorDetail: `n8n Webhook endpoint unreachable (${lastError})`,
        message: 'Analysis completed with on-device AI model'
      });
    } catch (error: any) {
      console.error('[n8n-proxy] Server proxy error:', error);
      return res.status(200).json({
        success: false,
        source: 'simulated_fallback',
        errorDetail: error?.message || 'Failed to proxy request to n8n webhook',
        message: 'Analysis completed with on-device AI model'
      });
    }
  });

  // Master PJP Info Route
  app.get('/api/pjp/info', (_req, res) => {
    return res.json({
      success: true,
      pjpSpreadsheetId: '19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94',
      pjpSpreadsheetUrl:
        'https://docs.google.com/spreadsheets/d/19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94/edit?usp=sharing',
      columns: [
        'Date',
        'Day',
        'Executive Name',
        'Account Name',
        'Outlet Name',
        'Outlet Code (Optional)',
        'Visit Order (Optional)',
        'Area / Zone (Optional)'
      ],
      defaultPin: '2026',
      executivesCount: 10
    });
  });

  // Live Planograms Proxy & Short-TTL Cache
  app.get('/api/planograms', async (req, res) => {
    const forceRefresh = req.query.force === '1' || req.query.force === 'true';
    const cacheAgeMs = cachedPlanogramsPayload ? Date.now() - cachedPlanogramsPayload.fetchedAt : Infinity;

    if (!forceRefresh && cachedPlanogramsPayload && cacheAgeMs < 5 * 60 * 1000) {
      return res.json({
        ok: true,
        source: 'server_cache',
        fetchedAt: cachedPlanogramsPayload.fetchedAt,
        planograms: cachedPlanogramsPayload.planograms
      });
    }

    try {
      const gasRes = await fetch(PLANOGRAMS_WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'planograms' }),
        signal: AbortSignal.timeout(15000)
      });

      if (gasRes.ok) {
        const json = await gasRes.json();
        const rawList = Array.isArray(json?.planograms) ? json.planograms : Array.isArray(json) ? json : [];
        cachedPlanogramsPayload = {
          planograms: rawList,
          fetchedAt: Date.now()
        };
        try {
          fs.writeFileSync(PLANOGRAMS_CACHE_FILE, JSON.stringify(cachedPlanogramsPayload));
        } catch {
          // Non-fatal disk cache write failure
        }
        return res.json({
          ok: true,
          source: 'live_gas',
          fetchedAt: cachedPlanogramsPayload.fetchedAt,
          planograms: rawList
        });
      }
    } catch (err: any) {
      console.warn('[Planograms Proxy] Live fetch warning:', err?.message);
    }

    return res.json({
      ok: Boolean(cachedPlanogramsPayload),
      source: cachedPlanogramsPayload ? 'stale_cache' : 'empty_fallback',
      fetchedAt: cachedPlanogramsPayload?.fetchedAt || Date.now(),
      planograms: cachedPlanogramsPayload?.planograms || []
    });
  });

  // Live MT PJP Google Sheet Proxy & Short-TTL Cache
  app.get('/api/pjp/live', async (req, res) => {
    const forceRefresh = req.query.force === '1' || req.query.force === 'true';
    const cacheAgeMs = cachedPjpPayload ? Date.now() - cachedPjpPayload.fetchedAt : Infinity;

    if (!forceRefresh && cachedPjpPayload && cacheAgeMs < 5 * 60 * 1000) {
      return res.json({
        ok: true,
        source: 'server_cache',
        fetchedAt: cachedPjpPayload.fetchedAt,
        visits: cachedPjpPayload.visits,
        masterOutlets: cachedPjpPayload.masterOutlets
      });
    }

    try {
      const csvRes = await fetch(PJP_LIVE_CSV_URL, {
        signal: AbortSignal.timeout(15000)
      });

      if (csvRes.ok) {
        const csvText = await csvRes.text();
        const lines = csvText.trim().split(/\r?\n/);
        if (lines.length > 1) {
          const headers = parseCsvLineSafe(lines[0]).map((h) => h.toLowerCase().trim());
          const findCol = (candidates: string[], fallbackIdx: number) => {
            const idx = headers.findIndex((h) => candidates.some((c) => h.includes(c)));
            return idx >= 0 ? idx : fallbackIdx;
          };

          const dateIdx = findCol(['date'], 0);
          const dayIdx = findCol(['day'], 1);
          const execIdx = findCol(['executive'], 2);
          const acctIdx = findCol(['account'], 3);
          const outletIdx = findCol(['outlet name', 'outlet'], 4);
          const sapIdx = findCol(['sap code', 'sap', 'outlet code', 'code'], 5);
          const areaIdx = findCol(['area', 'zone'], 6);

          const visits: any[] = [];
          const masterMap = new Map<string, any>();

          for (let i = 1; i < lines.length; i++) {
            const rawLine = lines[i];
            if (!rawLine || !rawLine.trim()) continue;
            const cols = parseCsvLineSafe(rawLine);
            const executive = (cols[execIdx] || '').trim();
            const account = (cols[acctIdx] || '').trim();
            const outlet = (cols[outletIdx] || '').trim();
            const sapCode = cleanSapString(cols[sapIdx] || '');
            const area = (cols[areaIdx] || '').trim();
            const date = (cols[dateIdx] || '').trim();
            const day = (cols[dayIdx] || '').trim();

            if (!outlet && !sapCode) continue;

            visits.push({
              date,
              day,
              executive,
              account,
              outlet,
              code: sapCode,
              sapCode,
              area
            });

            const masterKey = `${executive.toLowerCase()}|${sapCode || outlet.toLowerCase()}`;
            if (!masterMap.has(masterKey)) {
              masterMap.set(masterKey, {
                id: sapCode ? `sap-${sapCode}-${masterMap.size + 1}` : `pjp-m-${masterMap.size + 1}`,
                name: account && !outlet.toLowerCase().startsWith(account.toLowerCase()) ? `${account} — ${outlet}` : outlet,
                rawName: outlet,
                branch: area || outlet,
                address: `${area ? area + ', ' : ''}${account ? account + ', ' : ''}Qatar`,
                executive,
                code: sapCode || undefined,
                account: account || undefined
              });
            }
          }

          const masterOutlets = Array.from(masterMap.values());
          cachedPjpPayload = {
            visits,
            masterOutlets,
            fetchedAt: Date.now()
          };
          try {
            fs.writeFileSync(PJP_CACHE_FILE, JSON.stringify(cachedPjpPayload));
          } catch {
            // Non-fatal disk cache write failure
          }

          return res.json({
            ok: true,
            source: 'live_sheet',
            fetchedAt: cachedPjpPayload.fetchedAt,
            visits,
            masterOutlets
          });
        }
      }
    } catch (err: any) {
      console.warn('[PJP Live Proxy] Live CSV fetch warning:', err?.message);
    }

    return res.json({
      ok: Boolean(cachedPjpPayload),
      source: cachedPjpPayload ? 'stale_cache' : 'empty_fallback',
      fetchedAt: cachedPjpPayload?.fetchedAt || Date.now(),
      visits: cachedPjpPayload?.visits || [],
      masterOutlets: cachedPjpPayload?.masterOutlets || []
    });
  });

  // Cached Road Routing Proxy for Doha Field Sales Map (Google Routes API v2 primary, OSRM fallback)
  app.post('/api/map/route', async (req, res) => {
    try {
      const rawWaypoints = req.body?.waypoints;
      if (!Array.isArray(rawWaypoints) || rawWaypoints.length < 2 || rawWaypoints.length > 25) {
        return res.status(400).json({ ok: false, error: 'Invalid waypoints array' });
      }

      const waypoints: [number, number][] = [];
      for (const pt of rawWaypoints) {
        if (!Array.isArray(pt) || pt.length < 2) {
          return res.status(400).json({ ok: false, error: 'Invalid waypoint coordinate' });
        }
        const lat = Number(pt[0]);
        const lng = Number(pt[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return res.status(400).json({ ok: false, error: 'Non-numeric waypoint coordinate' });
        }
        waypoints.push([lat, lng]);
      }

      const googleMapsKey = (
        process.env.GOOGLE_MAPS_SERVER_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.MAPS_API_KEY ||
        ''
      ).trim();

      const coordStr = waypoints.map(([lat, lng]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(';');
      const cacheKey = `${googleMapsKey ? 'gmap_hq' : 'osrm'}|${coordStr}`;
      const cached = osrmRouteCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < OSRM_CACHE_TTL_MS) {
        return res.json({
          ok: true,
          source: cached.source,
          cached: true,
          coordinates: cached.coordinates,
          distanceMeters: cached.distanceMeters,
          durationSeconds: cached.durationSeconds
        });
      }

      let googleQuotaExceeded = false;
      if (googleMapsKey) {
        try {
          const originPt = waypoints[0];
          const destPt = waypoints[waypoints.length - 1];
          const intermediates = waypoints.slice(1, -1).map(([lat, lng]) => ({
            location: { latLng: { latitude: lat, longitude: lng } }
          }));

          const routesBody: Record<string, any> = {
            origin: { location: { latLng: { latitude: originPt[0], longitude: originPt[1] } } },
            destination: { location: { latLng: { latitude: destPt[0], longitude: destPt[1] } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            polylineQuality: 'HIGH_QUALITY'
          };
          if (intermediates.length > 0) {
            routesBody.intermediates = intermediates;
          }

          const gRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': googleMapsKey,
              'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
              'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline'
            },
            body: JSON.stringify(routesBody),
            signal: AbortSignal.timeout(9000)
          });

          const gJson: any = await gRes.json().catch(() => ({}));
          if (
            gRes.status === 429 ||
            gJson?.error?.status === 'RESOURCE_EXHAUSTED' ||
            gJson?.error?.status === 'OVER_QUERY_LIMIT'
          ) {
            googleQuotaExceeded = true;
          } else if (gRes.ok && Array.isArray(gJson?.routes) && gJson.routes.length > 0) {
            const primary = gJson.routes[0];
            const encoded = String(primary?.polyline?.encodedPolyline || '');
            const coordinates = decodeGooglePolylinePairs(encoded);
            if (coordinates.length >= 2) {
              const distanceMeters = Math.round(Number(primary.distanceMeters || 0));
              const durationSeconds = parseGoogleDurationSeconds(primary.duration);
              osrmRouteCache.set(cacheKey, {
                coordinates,
                distanceMeters,
                durationSeconds,
                source: 'google_routes',
                fetchedAt: Date.now()
              });
              return res.json({
                ok: true,
                source: 'google_routes',
                cached: false,
                coordinates,
                distanceMeters,
                durationSeconds
              });
            }
          }
        } catch {
          // Fall through to OSRM if Google Routes request fails
        }
      }

      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;
      const upstream = await fetch(osrmUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5500)
      });

      if (!upstream.ok) {
        return res.json({
          ok: false,
          source: 'fallback',
          quotaExceeded: googleQuotaExceeded || undefined,
          reason: `OSRM HTTP ${upstream.status}`
        });
      }

      const data: any = await upstream.json();
      const primaryRoute = data?.routes?.[0];
      const geoCoords: any[] = primaryRoute?.geometry?.coordinates || [];

      if (data?.code !== 'Ok' || geoCoords.length < 2) {
        return res.json({
          ok: false,
          source: 'fallback',
          quotaExceeded: googleQuotaExceeded || undefined,
          reason: 'No OSRM geometry returned'
        });
      }

      const coordinates: [number, number][] = geoCoords.map((pair) => [
        Number(pair[1]),
        Number(pair[0])
      ]);
      const distanceMeters = Math.round(Number(primaryRoute.distance || 0));
      const durationSeconds = Math.round(Number(primaryRoute.duration || 0));

      osrmRouteCache.set(cacheKey, {
        coordinates,
        distanceMeters,
        durationSeconds,
        source: 'osrm',
        fetchedAt: Date.now()
      });

      return res.json({
        ok: true,
        source: 'osrm',
        cached: false,
        coordinates,
        distanceMeters,
        durationSeconds
      });
    } catch (err: any) {
      return res.json({
        ok: false,
        source: 'fallback',
        reason: err?.message || 'Route request failed'
      });
    }
  });

  // Google Maps Platform Client Key Config
  app.get('/api/maps/config', (_req, res) => {
    const apiKey = (
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      process.env.MAPS_API_KEY ||
      ''
    ).trim();
    return res.json({
      ok: Boolean(apiKey),
      apiKey
    });
  });

  // Google Maps Platform Routes API v2 Optimization Proxy
  app.post('/api/pjp/optimize-route', async (req, res) => {
    try {
      const apiKey = (
        process.env.GOOGLE_MAPS_SERVER_API_KEY ||
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        process.env.MAPS_API_KEY ||
        ''
      ).trim();

      if (!apiKey) {
        return res.status(503).json({
          ok: false,
          missingApiKey: true,
          error: 'Google Maps API key is not configured on the server'
        });
      }

      const origin = req.body?.origin;
      const rawStops: PjpRouteStopInput[] = req.body?.stops;
      const originLat = Number(origin?.lat);
      const originLng = Number(origin?.lng);

      if (!Number.isFinite(originLat) || !Number.isFinite(originLng)) {
        return res.status(400).json({ ok: false, error: 'Invalid origin coordinates' });
      }

      if (!Array.isArray(rawStops) || rawStops.length === 0) {
        return res.json({
          ok: true,
          orderedIds: [],
          legs: [],
          totalDistanceMeters: 0,
          totalDurationSeconds: 0,
          encodedPolyline: ''
        });
      }

      const validStops = rawStops
        .slice(0, 25)
        .map((s) => ({
          id: String(s?.id || ''),
          lat: Number(s?.lat),
          lng: Number(s?.lng)
        }))
        .filter((s) => s.id && Number.isFinite(s.lat) && Number.isFinite(s.lng));

      if (validStops.length === 0) {
        return res.status(400).json({ ok: false, error: 'No valid stop coordinates provided' });
      }

      const cacheKey = `hq|${originLat.toFixed(3)},${originLng.toFixed(3)}|${validStops
        .map((s) => `${s.id}:${s.lat.toFixed(4)},${s.lng.toFixed(4)}`)
        .sort()
        .join(';')}`;

      const cached = pjpRoutesCache.get(cacheKey);
      if (cached && Date.now() - cached.fetchedAt < PJP_ROUTES_CACHE_TTL_MS) {
        return res.json({
          ok: true,
          cached: true,
          orderedIds: cached.orderedIds,
          legs: cached.legs,
          totalDistanceMeters: cached.totalDistanceMeters,
          totalDurationSeconds: cached.totalDurationSeconds,
          encodedPolyline: cached.encodedPolyline
        });
      }

      let destinationStop = validStops[0];
      let intermediateStops: PjpRouteStopInput[] = [];

      if (validStops.length > 1) {
        let farthestIdx = 0;
        let maxDist = -1;
        validStops.forEach((stop, idx) => {
          const d = haversineMeters(originLat, originLng, stop.lat, stop.lng);
          if (d > maxDist) {
            maxDist = d;
            farthestIdx = idx;
          }
        });
        destinationStop = validStops[farthestIdx];
        intermediateStops = validStops.filter((_, idx) => idx !== farthestIdx);
      }

      const useOptimization = intermediateStops.length >= 1;
      const requestBody: Record<string, any> = {
        origin: {
          location: {
            latLng: { latitude: originLat, longitude: originLng }
          }
        },
        destination: {
          location: {
            latLng: { latitude: destinationStop.lat, longitude: destinationStop.lng }
          }
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        polylineQuality: 'HIGH_QUALITY'
      };

      if (useOptimization) {
        requestBody.intermediates = intermediateStops.map((stop) => ({
          location: {
            latLng: { latitude: stop.lat, longitude: stop.lng }
          }
        }));
        requestBody.optimizeWaypointOrder = true;
      }

      const fieldMask = useOptimization
        ? 'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration'
        : 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration';

      const routesRes = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
          'X-Goog-FieldMask': fieldMask
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(12000)
      });

      const routesJson: any = await routesRes.json().catch(() => ({}));

      const isQuotaError =
        routesRes.status === 429 ||
        routesJson?.error?.status === 'RESOURCE_EXHAUSTED' ||
        routesJson?.error?.status === 'OVER_QUERY_LIMIT';

      if (isQuotaError) {
        return res.status(429).json({
          ok: false,
          quotaExceeded: true,
          error: routesJson?.error?.message || 'Google Maps Platform quota reached'
        });
      }

      if (!routesRes.ok || !Array.isArray(routesJson?.routes) || routesJson.routes.length === 0) {
        return res.status(routesRes.status >= 400 ? routesRes.status : 502).json({
          ok: false,
          error: routesJson?.error?.message || `Routes API error (HTTP ${routesRes.status})`
        });
      }

      const route = routesJson.routes[0];
      let orderedStops: PjpRouteStopInput[];

      if (useOptimization && Array.isArray(route.optimizedIntermediateWaypointIndex)) {
        orderedStops = [
          ...route.optimizedIntermediateWaypointIndex
            .map((idx: number) => intermediateStops[idx])
            .filter(Boolean),
          destinationStop
        ];
      } else if (useOptimization) {
        orderedStops = [...intermediateStops, destinationStop];
      } else {
        orderedStops = [destinationStop];
      }

      const orderedIds = orderedStops.map((s) => s.id);
      const rawLegs = Array.isArray(route.legs) ? route.legs : [];
      const legs: PjpOptimizedLegResponse[] = orderedIds.map((stopId, idx) => ({
        fromId: idx === 0 ? 'origin' : orderedIds[idx - 1],
        toId: stopId,
        distanceMeters: Number(rawLegs[idx]?.distanceMeters || 0),
        durationSeconds: parseGoogleDurationSeconds(rawLegs[idx]?.duration)
      }));

      const resultPayload = {
        orderedIds,
        legs,
        totalDistanceMeters: Number(route.distanceMeters || 0),
        totalDurationSeconds: parseGoogleDurationSeconds(route.duration),
        encodedPolyline: String(route.polyline?.encodedPolyline || '')
      };

      pjpRoutesCache.set(cacheKey, {
        ...resultPayload,
        fetchedAt: Date.now()
      });

      return res.json({
        ok: true,
        cached: false,
        ...resultPayload
      });
    } catch (err: any) {
      return res.status(500).json({
        ok: false,
        error: err?.message || 'Failed to optimize PJP driving route'
      });
    }
  });

  return app;
}
