# Modern Trade (MT) Visit Audit Application

Production-ready, zero-scroll mobile web app for in-store Modern Trade merchandisers featuring parallel compliance checks, Roboflow CV shelf verification, and fault-tolerant n8n webhook multipart synchronization.

---

## Deploying to Vercel

This repository is pre-configured for instant zero-configuration deployment to **Vercel**.

### Option A: Deploy via Vercel Dashboard (Git Integration)
1. Push this repository to GitHub, GitLab, or Bitbucket.
2. Log in to [Vercel](https://vercel.com) and click **"Add New..." → "Project"**.
3. Import this repository.
4. Vercel will automatically detect **Vite**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install --legacy-peer-deps` (configured via `.npmrc` & `vercel.json`)
5. (Optional) In **Environment Variables**, add:
   - `VITE_N8N_WEBHOOK_URL`: Your custom n8n webhook endpoint URL (defaults to `https://n8n.instance.internal/webhook/mt-visit-audit` if omitted).
6. Click **Deploy**.

### Option B: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI globally (if not installed)
npm i -g vercel

# 2. Deploy to preview
vercel

# 3. Deploy to production
vercel --prod
```

---

## Included Vercel Configuration (`vercel.json`)

The included `vercel.json` ensures:
- **SPA Rewrites**: All paths rewrite to `/index.html` preventing 404 errors on deep page refreshes.
- **Immutable Asset Caching**: High-performance HTTP caching for hashed Vite assets (`/assets/*`).
- **Clean Bundling**: Hashed image assets (Edible Oil, Flour, Pasta shelves) bundled into `dist/assets/`.
