import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { createApiApp } from './serverApp';

const app = createApiApp();
// AI Studio dev server runs on port 3000 (container nginx proxies port 8080 to 3000)
const cliPortArg = process.argv.find((_, i, arr) => arr[i - 1] === '--port');
const PORT = cliPortArg ? Number(cliPortArg) : 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom'
    });
    app.use(vite.middlewares);

    app.use(async (req, res, next) => {
      if (
        req.originalUrl.startsWith('/api') ||
        req.originalUrl.match(/\.(js|mjs|ts|tsx|css|json|map|png|jpg|jpeg|gif|svg|ico|webp|woff|woff2|ttf|eot)$/)
      ) {
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
