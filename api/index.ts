import type { IncomingMessage, ServerResponse } from 'http';
import { createApiApp } from '../serverApp.js';

const app = createApiApp();

export default function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.url) {
    const parsed = new URL(req.url, 'http://localhost');
    const subpath = parsed.searchParams.get('__vercel_path');
    if (subpath !== null) {
      parsed.searchParams.delete('__vercel_path');
      const qs = parsed.searchParams.toString();
      const cleanSubpath = subpath.replace(/^\/+/, '');
      req.url = `/api/${cleanSubpath}${qs ? `?${qs}` : ''}`;
    }
  }
  return app(req as any, res as any);
}
