# Step-by-Step Setup Guide: MT Visit Audit Google Sheet V2 Backend

Follow these steps to set up the new Google Sheet and Google Apps Script Web App. This setup runs completely independently of your legacy Google Sheet.

---

### Step 1: Create the New Google Sheet
1. Open [Google Sheets](https://sheets.new) in your browser.
2. Name the spreadsheet: **`MT Visit Audit - Production Database V2`** (or any name you prefer).

---

### Step 2: Open Google Apps Script
1. In the Google Sheet top menu, click **Extensions** &rarr; **Apps Script**.
2. A new tab opens with the Apps Script code editor.
3. Name your project at the top: **`MT Visit Audit Backend V2`**.

---

### Step 3: Configure Timezone (`appsscript.json`)
1. In the left sidebar of the Apps Script editor, click the **Gear icon (Project Settings)**.
2. Check the box: **"Show 'appsscript.json' manifest file in editor"**.
3. Click back on the **Editor icon (`< >`)** in the left sidebar.
4. Click on **`appsscript.json`**. Replace its entire contents with:
```json
{
  "timeZone": "Asia/Qatar",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE"
  }
}
```
5. Click **Save** (disk icon or `Ctrl+S` / `Cmd+S`).

---

### Step 4: Paste the Backend Code (`Code.gs`)
1. In the left sidebar, click on **`Code.gs`**.
2. Delete whatever is currently in `Code.gs`.
3. Copy the entire contents of `google-sheets-v2/Code.gs` and paste it into `Code.gs`.
4. Click **Save** (`Ctrl+S` / `Cmd+S`).

---

### Step 5: Run `setupSheet()` Once
1. At the top toolbar of the Apps Script editor, ensure the function dropdown shows **`setupSheet`**.
2. Click **Run**.
3. Google will ask for authorization (**"Authorization Required"**):
   - Click **Review Permissions**.
   - Select your Google account (`qfirestaurantchannel@gmail.com`).
   - Click **Advanced** &rarr; click **Go to MT Visit Audit Backend V2 (unsafe)**.
   - Click **Allow**.
4. In the bottom **Execution log**, you will see:
   `✓ All 9 tabs successfully created and configured!`
5. Switch back to your Google Sheet tab. You will see all 9 tabs created with headers, formatting, filters, and column widths:
   - `our_market_intel`
   - `competitor_intel`
   - `new_product_intel`
   - `store_intel`
   - `sales_intel`
   - `visits`
   - `category_audits`
   - `sync_log`
   - `masters`

---

### Step 6: Set Script Properties (`API_KEY`)
1. In the Apps Script left sidebar, click the **Gear icon (Project Settings)**.
2. Scroll down to **Script Properties** &rarr; click **Edit script properties** &rarr; **Add script property**.
   - **Property**: `API_KEY`
   - **Value**: `mta_secret_key_2026` (or any custom secret key)
3. Click **Save script properties**.

---

### Step 7: Run `testSync()` to Verify
1. Switch back to the **Editor (`< >`)** &rarr; select **`testSync`** in the function dropdown.
2. Click **Run**.
3. Watch the Execution Log:
   - It writes sample test rows (Run 1: Inserts).
   - It executes Run 2 with the same `row_key` and verifies in-place idempotent updates without duplicates.
   - You should see: `✓ SUCCESS: testSync verified both initial batch insert and idempotent in-place update!`
4. Check your Sheet tabs (`our_market_intel`, `store_intel`, `visits`, etc.) to confirm sample test rows arrived cleanly.

---

### Step 8: Deploy as Web App
1. Click the blue **Deploy** button at the top right &rarr; **New deployment**.
2. Next to "Select type", click the **Gear icon** &rarr; select **Web app**.
3. Configure the fields:
   - **Description**: `MT Visit Audit V2 Production`
   - **Execute as**: `Me (your email)`
   - **Who has access**: `Anyone` *(Note: The script authenticates requests via the `api_key` parameter in every request, so unauthorized access is rejected)*.
4. Click **Deploy**.
5. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/AKfycb.../exec`).

---

### Step 9: Activate in the MT Visit Audit Web App
You can activate the new backend in two ways:

#### Option A: Via Settings UI in App
1. Open the app &rarr; go to Settings / Integration Config.
2. Paste your new Apps Script Web App URL into **Sheets V2 URL**.
3. Toggle **Use Sheets V2** to **ON**.

#### Option B: Via Environment Variables / API
Set the following in `.env` or in the server configuration:
```env
USE_SHEETS_V2="true"
SHEETS_V2_URL="https://script.google.com/macros/s/YOUR_DEPLOYED_URL/exec"
SHEETS_V2_API_KEY="mta_secret_key_2026"
```

To switch back to the old Sheet at any time, simply set `USE_SHEETS_V2="false"`.
