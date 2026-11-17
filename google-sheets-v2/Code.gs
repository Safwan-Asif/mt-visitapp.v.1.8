/**
 * MT Visit Audit - Google Sheet & Apps Script V2 Backend
 * 
 * Features:
 * - 9 Structured Tabs with exact snake_case columns
 * - Idempotent upserts keyed on row_key (updates existing row or batch-appends new)
 * - Header-name based dynamic column mapping (resilient to column reordering)
 * - Concurrency control via LockService (30-second lock timeout)
 * - Hierarchical Google Drive Photo storage: "MT Visit Photos / YYYY-MM / <outlet> /"
 * - API Key authentication stored in Script Properties
 * - Built-in setupSheet() one-click configuration and testSync() verification
 * 
 * Timezone: Asia/Qatar
 */

// ============================================================================
// 1. CONFIGURATION & SCHEMA DEFINITIONS
// ============================================================================

var SCHEMAS = {
  our_market_intel: [
    "row_key", "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
    "price_tag_ok", "price_tag_photo", "shelf_strip_present", "wobblers_present",
    "shelf_position", "promo_tag_present", "damaged_or_expired", "damaged_photo",
    "promoter_present", "fixed_anything", "fixed_note", "gondola_present",
    "gondola_photo", "our_promo_pallet", "our_pallet_photo", "sos_percent", "facings", "oos_skus", "synced_at"
  ],
  competitor_intel: [
    "row_key", "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
    "type", "brand", "brand_other", "promo_mechanic", "pack_size", "price_qar",
    "price_change", "sub_category", "photo_url", "synced_at"
  ],
  new_product_intel: [
    "row_key", "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
    "brand", "brand_other", "sub_category", "pack_size", "price_qar",
    "sku_description", "photo_url", "synced_at"
  ],
  store_intel: [
    "row_key", "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
    "back_store_visited", "backroom_stock", "oos_reason", "backroom_photo",
    "last_delivery", "oos_found", "synced_at"
  ],
  sales_intel: [
    "row_key", "visit_id", "date", "time", "rep", "outlet", "gps_lat", "gps_lng", "category",
    "order_received", "order_sku_count", "order_mton", "data_confidence", "synced_at"
  ],
  visits: [
    "visit_id", "date", "start_time", "end_time", "rep", "outlet",
    "gps_lat", "gps_lng", "data_confidence", "categories_completed", "app_version", "synced_at"
  ],
  category_audits: [
    "row_key", "timestamp", "rep_id", "rep_name", "account_name", "outlet_code",
    "outlet_name", "category", "total_facings", "share_of_shelf", "brand_breakdown",
    "discrepancy_log", "latitude", "longitude", "location_source", "price_tag_ok",
    "posm_sticker", "posm_wobbler", "needs_review", "annotated_drive_photo_url",
    "overall_score", "compliance_status", "brand_wise_pct", "company_wise_pct",
    "sos_actual_pct", "sos_target_pct", "planogram_id", "planogram_version",
    "unmapped_brands", "edited_by_rep", "synced_at"
  ],
  planogram_compliance: [
    "row_key", "visit_id", "date", "time", "rep", "sap_code", "outlet", "category",
    "planogram_id", "planogram_version", "bay_index", "row_index", "brand",
    "planned_faces", "actual_faces", "miss_faces", "compliance_type",
    "edited_by_rep", "is_extra_bay", "synced_at"
  ],
  planogram_scorecard_acks: [
    "row_key", "visit_id", "date", "time", "rep", "sap_code", "outlet", "category",
    "planogram_id", "planogram_version", "overall_score", "compliance_status",
    "brand_compliant", "company_compliant", "edited_by_rep", "acknowledged_at",
    "executive_note", "synced_at"
  ],
  sync_log: [
    "timestamp", "visit_id", "action", "status", "message"
  ],
  masters: [
    "brand", "category", "own_or_competitor"
  ]
};

var DEFAULT_MASTERS = [
  // Flour
  ["F1", "Flour", "Own"],
  ["F2", "Flour", "Own"],
  ["F3", "Flour", "Own"],
  ["SR PREM", "Flour", "Own"],
  ["KFM", "Flour", "Competitor"],
  ["Other", "Flour", "Competitor"],
  // Edible Oil
  ["Yara", "Edible Oil", "Own"],
  ["Adeera", "Edible Oil", "Own"],
  ["Zain", "Edible Oil", "Own"],
  ["Dawi", "Edible Oil", "Own"],
  ["Al Rai", "Edible Oil", "Own"],
  ["Other", "Edible Oil", "Competitor"],
  // Pasta
  ["QFM", "Pasta", "Own"],
  ["QFM PREM", "Pasta", "Own"],
  ["Zain", "Pasta", "Own"],
  ["Other", "Pasta", "Competitor"]
];

var THEME = {
  emerald: "#047857",
  teal: "#065F46",
  darkForest: "#064E3B",
  headerText: "#FFFFFF"
};

// ============================================================================
// 2. ONE-CLICK SHEET SETUP (run once)
// ============================================================================

/**
 * Creates every required tab with exact headers, frozen header rows, bold styling,
 * AutoFilters, and sensible column widths.
 */
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetNames = Object.keys(SCHEMAS);

  sheetNames.forEach(function(name, idx) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }

    var headers = SCHEMAS[name];
    var cols = headers.length;

    // Ensure enough columns
    if (sheet.getMaxColumns() < cols) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), cols - sheet.getMaxColumns());
    }

    // Write header row if empty or mismatch
    var headerRange = sheet.getRange(1, 1, 1, cols);
    headerRange.setValues([headers]);
    headerRange.setFontWeight("bold");
    headerRange.setFontColor(THEME.headerText);

    // Alternate theme color for visual clarity
    var bgColor = idx % 2 === 0 ? THEME.emerald : THEME.teal;
    if (name === "sync_log") bgColor = "#1E293B";
    if (name === "masters") bgColor = THEME.darkForest;
    headerRange.setBackground(bgColor);

    // Freeze top row
    sheet.setFrozenRows(1);

    // Setup auto filter
    try {
      var currentFilter = sheet.getFilter();
      if (currentFilter) currentFilter.remove();
      sheet.getRange(1, 1, Math.max(2, sheet.getMaxRows()), cols).createFilter();
    } catch (err) {
      Logger.log("Filter notice for " + name + ": " + err.message);
    }

    // Set sensible column widths
    for (var c = 1; c <= cols; c++) {
      var colHeader = headers[c - 1];
      if (colHeader === "row_key" || colHeader === "visit_id") {
        sheet.setColumnWidth(c, 190);
      } else if (colHeader.indexOf("photo") > -1 || colHeader.indexOf("url") > -1) {
        sheet.setColumnWidth(c, 240);
      } else if (colHeader === "outlet" || colHeader === "brand_breakdown" || colHeader === "discrepancy_log") {
        sheet.setColumnWidth(c, 220);
      } else if (colHeader === "message" || colHeader === "sku_description") {
        sheet.setColumnWidth(c, 260);
      } else if (colHeader === "date" || colHeader === "time" || colHeader === "rep" || colHeader === "category") {
        sheet.setColumnWidth(c, 120);
      } else {
        sheet.setColumnWidth(c, 130);
      }
    }

    // Populate masters sheet with seed taxonomy if empty
    if (name === "masters" && sheet.getLastRow() <= 1) {
      sheet.getRange(2, 1, DEFAULT_MASTERS.length, 3).setValues(DEFAULT_MASTERS);
    }
  });

  // Remove default 'Sheet1' if present and other sheets exist
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch (e) {}
  }

  // Set default API_KEY in Script Properties if not already set
  var props = PropertiesService.getScriptProperties();
  if (!props.getProperty("API_KEY")) {
    props.setProperty("API_KEY", "mta_secret_key_2026");
  }

  Logger.log("✓ All 9 tabs successfully created and configured!");
  return "✓ setupSheet completed successfully. Configured tabs: " + sheetNames.join(", ");
}

// ============================================================================
// 3. HTTP GET (Health Check)
// ============================================================================

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    ok: true,
    service: "mt-visit-audit",
    version: "2.0.0",
    timezone: "Asia/Qatar",
    spreadsheet_name: SpreadsheetApp.getActiveSpreadsheet().getName(),
    timestamp: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd'T'HH:mm:ss'Z'")
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 4. HTTP POST (sync_visit & upload_drive_photo)
// ============================================================================

function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;

  try {
    // Basic per-request size limit (10MB)
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Empty request body" }, 400);
    }
    if (e.postData.contents.length > 10 * 1024 * 1024) {
      return jsonResponse({ ok: false, error: "Request body exceeds 10MB limit" }, 413);
    }

    var data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (parseErr) {
      return jsonResponse({ ok: false, error: "Malformed JSON payload" }, 400);
    }

    // Validate API Key from Script Properties
    var configuredApiKey = PropertiesService.getScriptProperties().getProperty("API_KEY") || "mta_secret_key_2026";
    var incomingKey = data.api_key || (e.parameter && e.parameter.api_key);
    if (!incomingKey || incomingKey !== configuredApiKey) {
      logSync("N/A", data.action || "unknown", "REJECTED", "Invalid or missing API key");
      return jsonResponse({ ok: false, error: "Unauthorized access: invalid api_key" }, 401);
    }

    // Acquire lock (wait up to 30 seconds for concurrent reps)
    try {
      lock.waitLock(30000);
      hasLock = true;
    } catch (lockErr) {
      logSync(data.visit_id || "N/A", data.action || "unknown", "BUSY", "Lock acquisition timeout (30s)");
      return jsonResponse({ ok: false, error: "Server busy, please retry in a few moments" }, 503);
    }

    // Action 1: Upload Photo to Google Drive
    if (data.action === "upload_drive_photo") {
      return handleUploadDrivePhoto(data);
    }

    // Action 2: Sync Visit / Category Tables
    if (data.action === "sync_visit") {
      return handleSyncVisit(data);
    }

    // Unknown action
    return jsonResponse({ ok: false, error: "Unsupported action: " + data.action }, 400);

  } catch (fatalErr) {
    Logger.log("Fatal doPost error: " + fatalErr.message);
    logSync(data && data.visit_id ? data.visit_id : "N/A", data && data.action ? data.action : "error", "FATAL", fatalErr.message);
    return jsonResponse({ ok: false, error: "Internal processing error: " + fatalErr.message }, 500);
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch (e) {}
    }
  }
}

// ============================================================================
// 5. DATA INGESTION ENGINE (Idempotent & Header-Mapped)
// ============================================================================

function handleSyncVisit(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var nowStr = Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd HH:mm:ss");
  var visitId = data.visit ? data.visit.visit_id : (data.visit_id || "unknown_visit");

  var writtenCounts = {};
  var updatedCounts = {};
  var errors = [];

  // 1. Process Master Visit Row (if provided)
  if (data.visit) {
    try {
      var vRes = upsertRow(ss, "visits", data.visit, "visit_id", nowStr);
      if (vRes.updated) updatedCounts["visits"] = 1;
      else writtenCounts["visits"] = 1;
    } catch (vErr) {
      errors.push("visits: " + vErr.message);
    }
  }

  // 2. Process Multi-Table Datasets
  var tables = data.tables || {};
  var targetTableNames = [
    "our_market_intel",
    "competitor_intel",
    "new_product_intel",
    "store_intel",
    "sales_intel",
    "category_audits",
    "planogram_compliance",
    "planogram_scorecard_acks"
  ];

  targetTableNames.forEach(function(tableName) {
    var rows = tables[tableName];
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return;
    }

    try {
      var tRes = upsertBatch(ss, tableName, rows, "row_key", nowStr);
      writtenCounts[tableName] = tRes.written;
      updatedCounts[tableName] = tRes.updated;
      if (tRes.errors && tRes.errors.length > 0) {
        errors = errors.concat(tRes.errors);
      }
    } catch (tErr) {
      errors.push(tableName + ": " + tErr.message);
    }
  });

  var status = errors.length === 0 ? "SUCCESS" : (Object.keys(writtenCounts).length > 0 || Object.keys(updatedCounts).length > 0 ? "PARTIAL" : "ERROR");
  var message = "Written: " + JSON.stringify(writtenCounts) + " | Updated: " + JSON.stringify(updatedCounts);
  if (errors.length > 0) message += " | Errors: " + errors.join("; ");

  logSync(visitId, "sync_visit", status, message);

  return jsonResponse({
    ok: errors.length === 0,
    visit_id: visitId,
    status: status,
    written: writtenCounts,
    updated: updatedCounts,
    errors: errors
  });
}

/**
 * Upserts a batch of rows into a target sheet by matching uniqueKeyField ('row_key' or 'visit_id').
 * Updates existing rows in place via setValues, and appends new rows in a single batch setValues.
 */
function upsertBatch(ss, sheetName, rows, keyField, nowStr) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupSheet();
    sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error("Sheet tab " + sheetName + " does not exist and could not be created");
  }

  var lastRow = sheet.getLastRow();
  var cols = sheet.getLastColumn();
  if (lastRow === 0 || cols === 0) {
    setupSheet();
    lastRow = sheet.getLastRow();
    cols = sheet.getLastColumn();
  }

  // Read header row
  var headerRow = sheet.getRange(1, 1, 1, cols).getValues()[0];
  var keyColIdx = -1;
  for (var c = 0; c < headerRow.length; c++) {
    if (headerRow[c] === keyField) {
      keyColIdx = c;
      break;
    }
  }

  if (keyColIdx === -1) {
    throw new Error("Key column '" + keyField + "' not found in headers of " + sheetName);
  }

  // Build index map of existing keys -> row index (1-based sheet row)
  var existingKeyMap = {};
  if (lastRow > 1) {
    var existingKeys = sheet.getRange(2, keyColIdx + 1, lastRow - 1, 1).getValues();
    for (var r = 0; r < existingKeys.length; r++) {
      var k = String(existingKeys[r][0]);
      if (k) {
        existingKeyMap[k] = r + 2; // Sheet row number
      }
    }
  }

  var writtenCount = 0;
  var updatedCount = 0;
  var errors = [];
  var newRowsToWrite = [];

  rows.forEach(function(rowObj) {
    var keyValue = rowObj[keyField];
    if (!keyValue) {
      // Generate synthetic row_key if missing
      keyValue = (rowObj.visit_id || "v") + "|" + (rowObj.category || "c") + "|" + sheetName + "|" + Math.random().toString(36).substring(2, 7);
      rowObj[keyField] = keyValue;
    }

    var rowArray = mapObjectToHeaderRow(rowObj, headerRow, nowStr);

    var existingRowNumber = existingKeyMap[String(keyValue)];
    if (existingRowNumber) {
      // Update existing row
      sheet.getRange(existingRowNumber, 1, 1, cols).setValues([rowArray]);
      updatedCount++;
    } else {
      // Queue for batch insert
      newRowsToWrite.push(rowArray);
      existingKeyMap[String(keyValue)] = lastRow + newRowsToWrite.length;
      writtenCount++;
    }
  });

  // Batch insert new rows
  if (newRowsToWrite.length > 0) {
    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, newRowsToWrite.length, cols).setValues(newRowsToWrite);
  }

  return { written: writtenCount, updated: updatedCount, errors: errors };
}

/**
 * Single row upsert helper (used for visits)
 */
function upsertRow(ss, sheetName, rowObj, keyField, nowStr) {
  var batchRes = upsertBatch(ss, sheetName, [rowObj], keyField, nowStr);
  return { updated: batchRes.updated > 0, written: batchRes.written > 0 };
}

/**
 * Maps a JSON object's properties onto sheet columns strictly according to the header names.
 * Ensures numbers remain numbers, nulls become empty strings, and synced_at is stamped.
 */
function mapObjectToHeaderRow(obj, headers, nowStr) {
  var row = [];
  for (var i = 0; i < headers.length; i++) {
    var colName = headers[i];

    if (colName === "synced_at") {
      row.push(nowStr);
      continue;
    }

    var val = obj[colName];

    if (val === undefined || val === null) {
      row.push("");
    } else if (typeof val === "boolean") {
      row.push(val ? "Yes" : "No");
    } else if (typeof val === "number") {
      row.push(isNaN(val) ? "" : val);
    } else {
      row.push(String(val));
    }
  }
  return row;
}

// ============================================================================
// 6. PHOTO STORAGE IN GOOGLE DRIVE
// ============================================================================

/**
 * Stores non-aisle photos in hierarchical Drive folders:
 * "MT Visit Photos / YYYY-MM / <outlet> /"
 * File name: <visit_id>_<category>_<field>_<timestamp>.jpg
 * Permissions: Anyone with link can view (so dashboards & managers can open directly)
 */
function handleUploadDrivePhoto(data) {
  var imageBase64 = data.data_base64 || data.image || data.photo_base64;
  if (!imageBase64) {
    return jsonResponse({ ok: false, error: "Missing image base64 data" }, 400);
  }

  var mimeType = data.mime_type || "image/jpeg";
  if (!mimeType.match(/^image\//i)) {
    return jsonResponse({ ok: false, error: "Invalid mime type: only images allowed" }, 400);
  }

  // Strip data URL scheme prefix if present
  if (imageBase64.indexOf(",") > -1) {
    imageBase64 = imageBase64.split(",")[1];
  }

  // Check size limit (~5MB binary, roughly 7MB base64)
  if (imageBase64.length > 7 * 1024 * 1024) {
    return jsonResponse({ ok: false, error: "Image size exceeds 5MB limit" }, 413);
  }

  var visitId = String(data.visit_id || "visit").replace(/[^a-zA-Z0-9_-]/g, "_");
  var outletName = String(data.outlet || "General_Outlet").trim();
  var category = String(data.category || "General").replace(/[^a-zA-Z0-9_-]/g, "_");
  var field = String(data.field || "photo").replace(/[^a-zA-Z0-9_-]/g, "_");
  var monthStr = Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM");
  var timestampStr = Utilities.formatDate(new Date(), "Asia/Qatar", "yyyyMMdd_HHmmss");

  // 1. Resolve or create root folder: "MT Visit Photos"
  var rootFolder = getOrCreateFolder(DriveApp.getRootFolder(), "MT Visit Photos");

  // 2. Resolve or create month folder: "YYYY-MM"
  var monthFolder = getOrCreateFolder(rootFolder, monthStr);

  // 3. Resolve or create outlet folder: "<outlet>"
  var outletFolder = getOrCreateFolder(monthFolder, outletName);

  // 4. Create image file
  var fileName = visitId + "_" + category + "_" + field + "_" + timestampStr + ".jpg";
  var decodedBytes = Utilities.base64Decode(imageBase64);
  var blob = Utilities.newBlob(decodedBytes, mimeType, fileName);
  var file = outletFolder.createFile(blob);

  // 5. Configure access: Anyone with link can view
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  var fileUrl = file.getUrl();
  var fileId = file.getId();

  logSync(visitId, "upload_drive_photo", "SUCCESS", "Uploaded " + fileName + " (" + Math.round(blob.getBytes().length / 1024) + " KB)");

  return jsonResponse({
    ok: true,
    file_id: fileId,
    url: fileUrl,
    filename: fileName,
    folder_path: "MT Visit Photos/" + monthStr + "/" + outletName
  });
}

function getOrCreateFolder(parent, name) {
  var folders = parent.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parent.createFolder(name);
}

// ============================================================================
// 7. AUDIT LOGGING & HELPERS
// ============================================================================

function logSync(visitId, action, status, message) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("sync_log");
    if (!sheet) {
      setupSheet();
      sheet = ss.getSheetByName("sync_log");
    }
    if (sheet) {
      var nowStr = Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd HH:mm:ss");
      sheet.appendRow([nowStr, String(visitId), String(action), String(status), String(message)]);
    }
  } catch (err) {
    Logger.log("Failed to write sync_log: " + err.message);
  }
}

function jsonResponse(obj, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// 8. TEST RUNNER (Self-Test inside Apps Script)
// ============================================================================

/**
 * Runs a self-contained test sync with sample data to verify setup, column mapping,
 * and idempotency (running twice updates without duplicating rows).
 */
function testSync() {
  Logger.log("--- Starting MT Visit Audit Self-Test ---");

  // Step 1: Ensure sheets are configured
  setupSheet();

  var testVisitId = "test_visit_" + Utilities.formatDate(new Date(), "Asia/Qatar", "yyyyMMdd_HHmmss");

  var samplePayload = {
    api_key: PropertiesService.getScriptProperties().getProperty("API_KEY") || "mta_secret_key_2026",
    action: "sync_visit",
    visit: {
      visit_id: testVisitId,
      date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
      start_time: "09:15",
      end_time: "09:45",
      rep: "Safwan Asif",
      outlet: "Lulu Hypermarket - D Ring",
      gps_lat: 25.2854,
      gps_lng: 51.5310,
      data_confidence: "High",
      categories_completed: "Flour, Edible Oil, Pasta",
      app_version: "2.0.0"
    },
    tables: {
      our_market_intel: [
        {
          row_key: testVisitId + "|Flour|our_market_intel|0",
          visit_id: testVisitId,
          date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
          time: "09:20",
          rep: "Safwan Asif",
          outlet: "Lulu Hypermarket - D Ring",
          gps_lat: 25.2854,
          gps_lng: 51.5310,
          category: "Flour",
          price_tag_ok: "Yes",
          shelf_strip_present: "Yes",
          wobblers_present: "Yes",
          shelf_position: "Eye level",
          promo_tag_present: "No",
          damaged_or_expired: "No",
          promoter_present: "None",
          fixed_anything: "No",
          gondola_present: "No",
          our_promo_pallet: "No",
          sos_percent: 68.5,
          facings: 24,
          oos_skus: "None"
        }
      ],
      competitor_intel: [
        {
          row_key: testVisitId + "|Flour|competitor_intel|0",
          visit_id: testVisitId,
          date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
          time: "09:22",
          rep: "Safwan Asif",
          outlet: "Lulu Hypermarket - D Ring",
          gps_lat: 25.2854,
          gps_lng: 51.5310,
          category: "Flour",
          type: "promo",
          brand: "KFM",
          promo_mechanic: "Price off",
          pack_size: "1kg",
          price_qar: 4.75,
          price_change: "Down"
        }
      ],
      new_product_intel: [
        {
          row_key: testVisitId + "|Flour|new_product_intel|0",
          visit_id: testVisitId,
          date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
          time: "09:24",
          rep: "Safwan Asif",
          outlet: "Lulu Hypermarket - D Ring",
          gps_lat: 25.2854,
          gps_lng: 51.5310,
          category: "Flour",
          brand: "KFM",
          sub_category: "Chakki Fresh Atta",
          pack_size: "5kg",
          price_qar: 18.50,
          sku_description: "New paper pack with ziplock"
        }
      ],
      store_intel: [
        {
          row_key: testVisitId + "|Flour|store_intel|0",
          visit_id: testVisitId,
          date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
          time: "09:26",
          rep: "Safwan Asif",
          outlet: "Lulu Hypermarket - D Ring",
          gps_lat: 25.2854,
          gps_lng: 51.5310,
          category: "Flour",
          back_store_visited: "No",
          backroom_stock: "",
          oos_reason: "",
          backroom_photo: "",
          last_delivery: "",
          oos_found: "No"
        }
      ],
      sales_intel: [
        {
          row_key: testVisitId + "|Flour|sales_intel|0",
          visit_id: testVisitId,
          date: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd"),
          time: "09:28",
          rep: "Safwan Asif",
          outlet: "Lulu Hypermarket - D Ring",
          gps_lat: 25.2854,
          gps_lng: 51.5310,
          category: "Flour",
          order_received: "No",
          order_sku_count: "",
          order_mton: "",
          data_confidence: "High"
        }
      ],
      category_audits: [
        {
          row_key: testVisitId + "|Flour|category_audits|0",
          timestamp: Utilities.formatDate(new Date(), "Asia/Qatar", "yyyy-MM-dd HH:mm:ss"),
          rep_id: "#9",
          rep_name: "Safwan Asif",
          account_name: "Lulu Hypermarket",
          outlet_code: "LULU-DRING",
          outlet_name: "Lulu Hypermarket - D Ring",
          category: "Flour",
          total_facings: 24,
          share_of_shelf: 68.5,
          brand_breakdown: "F1: 12 | F2: 8 | F3: 4",
          discrepancy_log: "No manual overrides (AI counts accepted)",
          latitude: 25.2854,
          longitude: 51.5310,
          location_source: "device_gps",
          price_tag_ok: "Yes",
          posm_sticker: "Yes",
          posm_wobbler: "Yes",
          needs_review: "No",
          annotated_drive_photo_url: "https://drive.google.com/sample_preview"
        }
      ]
    }
  };

  // Run 1: First write (inserts)
  Logger.log("Executing Run 1 (Initial Insert)...");
  var res1 = handleSyncVisit(samplePayload);
  var body1 = JSON.parse(res1.getContent());
  Logger.log("Run 1 Result: " + JSON.stringify(body1));

  // Run 2: Second write with same row_keys (idempotent updates)
  Logger.log("Executing Run 2 (Idempotent Update)...");
  // Change one value to verify update
  samplePayload.tables.our_market_intel[0].fixed_anything = "Yes";
  samplePayload.tables.our_market_intel[0].fixed_note = "Straightened facing row during self-test";
  var res2 = handleSyncVisit(samplePayload);
  var body2 = JSON.parse(res2.getContent());
  Logger.log("Run 2 Result: " + JSON.stringify(body2));

  // Verification Assertions
  if (body1.written && body1.written.our_market_intel === 1 && body2.updated && body2.updated.our_market_intel === 1) {
    Logger.log("✓ SUCCESS: testSync verified both initial batch insert and idempotent in-place update!");
    return "✓ testSync passed! Insert count: " + JSON.stringify(body1.written) + " | Update count: " + JSON.stringify(body2.updated);
  } else {
    Logger.log("⚠️ WARNING: Unexpected counts in testSync. Run 1: " + JSON.stringify(body1) + " | Run 2: " + JSON.stringify(body2));
    return "testSync finished with warnings. Check Execution Log.";
  }
}
