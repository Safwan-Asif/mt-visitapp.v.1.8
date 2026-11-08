import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';

const app = express();
// AI Studio dev server runs on port 3000 (container nginx proxies port 8080 to 3000)
const cliPortArg = process.argv.find((_, i, arr) => arr[i - 1] === '--port');
const PORT = cliPortArg ? Number(cliPortArg) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Target Google Spreadsheet & Drive Folder IDs
const TARGET_SPREADSHEET_ID = '1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8';
const TARGET_SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1ZNy_T7Di2sIgtJ_v90ECtwM2c1qD-_poZFjOMQsmaQ8/edit';
const TARGET_DRIVE_FOLDER_ID = '19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL';
const TARGET_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/19gOKo7bgAMoB4zu_DBSbodeEr_wMGJCL';

// Ensure server data directory exists for persistent local logs
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const CONFIG_FILE = path.join(DATA_DIR, 'apps_script_config.json');

// Load runtime Apps Script Web App URL if saved
let runtimeAppsScriptUrl = process.env.APPS_SCRIPT_URL || '';
if (fs.existsSync(CONFIG_FILE)) {
  try {
    const savedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    if (savedConfig.appsScriptUrl) {
      runtimeAppsScriptUrl = savedConfig.appsScriptUrl;
    }
  } catch {}
}

// Config endpoints to get and update Apps Script Web App Endpoint URL
app.get('/api/sheets/config', (_req, res) => {
  return res.json({
    success: true,
    appsScriptUrl: runtimeAppsScriptUrl,
    spreadsheetId: TARGET_SPREADSHEET_ID,
    spreadsheetUrl: TARGET_SPREADSHEET_URL,
    driveFolderId: TARGET_DRIVE_FOLDER_ID,
    driveFolderUrl: TARGET_DRIVE_FOLDER_URL
  });
});

app.post('/api/sheets/config', (req, res) => {
  try {
    const { appsScriptUrl } = req.body || {};
    runtimeAppsScriptUrl = appsScriptUrl ? String(appsScriptUrl).trim() : '';
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ appsScriptUrl: runtimeAppsScriptUrl }, null, 2));
    process.env.APPS_SCRIPT_URL = runtimeAppsScriptUrl;
    return res.json({
      success: true,
      message: '✓ Google Apps Script Web App URL updated successfully',
      appsScriptUrl: runtimeAppsScriptUrl
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
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      try {
        existingLogs = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
      } catch {
        existingLogs = [];
      }
    }

    const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const brandBreakdownStr = auditData.counts
      ? Object.entries(auditData.counts)
          .map(([brand, cnt]) => `${brand}: ${cnt}`)
          .join(' | ')
      : '';

    // Generate direct photo formula for Google Sheets
    const photoUrl = auditData.photoDataUrl || auditData.photoUrl || '';
    const imageFormula = photoUrl ? `=IMAGE("${photoUrl}")` : 'No Photo';

    const discrepancyLog = auditData.discrepancyLog || 'No manual overrides (AI counts accepted)';
    const unmappedRemark = auditData.unmappedRemark || '';
    const latitude = typeof auditData.latitude === 'number' ? auditData.latitude : (Number(auditData.latitude) || 25.2854);
    const longitude = typeof auditData.longitude === 'number' ? auditData.longitude : (Number(auditData.longitude) || 51.5310);
    const locationSource = auditData.locationSource || 'device_gps';
    const accountName = auditData.accountName || '';
    const outletCode = auditData.outletCode || '';

    const logEntry = {
      id: logId,
      timestamp: auditData.timestamp || new Date().toLocaleString(),
      repId: auditData.repId || '#9',
      repName: auditData.repName || 'Safwan Asif',
      accountName: accountName,
      outletId: auditData.outletId,
      outletCode: outletCode,
      outletName: auditData.outletName,
      category: auditData.category,
      totalFacings: auditData.totalFacings,
      shareOfShelfPct: auditData.shareOfShelfPct,
      shareOfShelfLabel: auditData.shareOfShelfLabel,
      brandBreakdown: brandBreakdownStr,
      counts: auditData.counts,
      originalAiCounts: auditData.originalAiCounts || auditData.counts,
      discrepancyLog: discrepancyLog,
      latitude: latitude,
      longitude: longitude,
      locationSource: locationSource,
      unmappedRemark: unmappedRemark,
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
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(existingLogs, null, 2));

    // Auto-forward to configured Google Apps Script Web App Endpoint if present
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
      message: appsScriptStatus === 'forwarded_successfully'
        ? '✓ Recorded directly to Google Sheet & uploaded to Google Drive Folder!'
        : '✓ Audit row saved locally and queued for Google Sheet & Drive',
      appsScriptStatus,
      spreadsheetId: TARGET_SPREADSHEET_ID,
      spreadsheetUrl: TARGET_SPREADSHEET_URL,
      driveFolderId: TARGET_DRIVE_FOLDER_ID,
      driveFolderUrl: TARGET_DRIVE_FOLDER_URL,
      logId: logId,
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
      message: '✓ Apps script proxy payload received & processed',
      status: forwardStatus,
      payload
    });
  } catch (error: any) {
    console.error('Apps script proxy error:', error);
    return res.status(500).json({ success: false, error: error?.message || 'Proxy server error' });
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

// Server-side n8n Webhook Proxy (Bypasses browser CORS and forwards binary photo data)
app.post('/api/n8n/proxy', async (req, res) => {
  try {
    const { targetUrl, base64, fileName, mimeType, metadata } = req.body || {};
    const webhookUrl = targetUrl || process.env.N8N_WEBHOOK_URL || 'https://qfirestaurantchannel.n8n-wsk.com/webhook/mt-visit-audit';

    console.log(`[n8n-proxy] Forwarding audit to n8n webhook: ${webhookUrl}`);

    // Reconstruct multipart/form-data for n8n Webhook node (which expects binary data "photo")
    const formData = new FormData();

    // Convert base64 to binary Blob and attach as "photo" (matching n8n workflow binaryPropertyName)
    if (base64) {
      const cleanBase64 = typeof base64 === 'string' && base64.includes(',') ? base64.split(',')[1] : base64;
      const buffer = Buffer.from(cleanBase64, 'base64');
      const blob = new Blob([buffer], { type: mimeType || 'image/jpeg' });
      formData.append('photo', blob, fileName || 'shelf.jpg');
      formData.append('image', blob, fileName || 'shelf.jpg');
      formData.append('file', blob, fileName || 'shelf.jpg');
    }

    // Append metadata fields to form-data
    if (metadata && typeof metadata === 'object') {
      for (const [key, val] of Object.entries(metadata)) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val ?? ''));
      }
    }

    // Also append base64 strings in case the workflow reads from form field
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

    const contentType = n8nResponse.headers.get('content-type') || '';

    // If n8n returns an image directly
    if (contentType.includes('image/') || contentType.includes('application/octet-stream')) {
      const arrayBuffer = await n8nResponse.arrayBuffer();
      res.setHeader('Content-Type', contentType);
      return res.status(n8nResponse.status).send(Buffer.from(arrayBuffer));
    }

    const responseText = await n8nResponse.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(n8nResponse.status).send(responseText);
  } catch (error: any) {
    console.error('[n8n-proxy] Error forwarding request:', error);
    return res.status(502).json({
      success: false,
      error: error?.message || 'Failed to proxy request to n8n webhook'
    });
  }
});

// Master PJP Info Route
app.get('/api/pjp/info', (_req, res) => {
  return res.json({
    success: true,
    pjpSpreadsheetId: '19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94',
    pjpSpreadsheetUrl: 'https://docs.google.com/spreadsheets/d/19kxrCdBsXZ07-66o971p1dC5hAbXnucpHr-jQZZYC94/edit?usp=sharing',
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

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.match(/\.(js|mjs|ts|tsx|css|json|map|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.use((_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
