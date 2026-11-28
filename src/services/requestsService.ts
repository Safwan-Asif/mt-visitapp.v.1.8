import {
  FieldRequest,
  FieldRequestPriority,
  FieldRequestStatus,
  FieldRequestType
} from '../types';

const REQUESTS_STORAGE_KEY = 'mta_field_requests_v1';

function readCachedRequests(): FieldRequest[] {
  try {
    const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCachedRequests(items: FieldRequest[]): void {
  try {
    localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    // Ignore storage quota issues
  }
}

function mergeRequestLists(serverList: FieldRequest[], localList: FieldRequest[]): FieldRequest[] {
  const byId = new Map<string, FieldRequest>();

  for (const req of serverList) {
    if (req && req.id) {
      byId.set(req.id, { ...req, syncState: 'synced' });
    }
  }

  for (const localReq of localList) {
    if (!localReq || !localReq.id) continue;
    const existing = byId.get(localReq.id);
    if (!existing) {
      byId.set(localReq.id, localReq);
    } else {
      const localUpdated = Date.parse(localReq.updatedAt || localReq.createdAt || '') || 0;
      const serverUpdated = Date.parse(existing.updatedAt || existing.createdAt || '') || 0;
      if (localReq.syncState === 'queued' && localUpdated > serverUpdated) {
        byId.set(localReq.id, localReq);
      }
    }
  }

  return Array.from(byId.values()).sort(
    (a, b) =>
      (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0)
  );
}

export function getCachedFieldRequests(): FieldRequest[] {
  return readCachedRequests().sort(
    (a, b) =>
      (Date.parse(b.createdAt || '') || 0) - (Date.parse(a.createdAt || '') || 0)
  );
}

export async function fetchFieldRequests(): Promise<{
  requests: FieldRequest[];
  source: 'sheets_backend' | 'local_cache';
}> {
  const cached = readCachedRequests();
  try {
    const res = await fetch('/api/requests');
    if (res.ok) {
      const json = await res.json();
      const serverList: FieldRequest[] = Array.isArray(json?.requests) ? json.requests : [];
      const merged = mergeRequestLists(serverList, cached);
      writeCachedRequests(merged);
      return {
        requests: merged,
        source: 'sheets_backend'
      };
    }
  } catch (err) {
    console.warn('[requestsService] Falling back to local cache:', err);
  }

  return {
    requests: cached,
    source: 'local_cache'
  };
}

export interface CreateFieldRequestInput {
  type: FieldRequestType;
  outletId?: string;
  outletSapCode?: string;
  outletName: string;
  priority: FieldRequestPriority;
  description: string;
  attachmentDataUrl?: string;
  planogramRef?: {
    planogramId?: string;
    version?: number;
    category?: string;
  };
  createdByName: string;
  createdByRepId: string;
  createdByRole: string;
}

export async function createFieldRequest(
  input: CreateFieldRequestInput
): Promise<{ request: FieldRequest; synced: boolean }> {
  const nowIso = new Date().toISOString();
  const tempId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tempRef = `REQ-${nowIso.slice(0, 4)}-${String(Math.floor(1000 + Math.random() * 9000))}`;

  const optimistic: FieldRequest = {
    id: tempId,
    referenceCode: tempRef,
    type: input.type,
    outletId: input.outletId,
    outletSapCode: input.outletSapCode,
    outletName: input.outletName,
    priority: input.priority,
    description: input.description.trim(),
    attachmentDataUrl: input.attachmentDataUrl,
    planogramRef: input.planogramRef,
    status: 'Pending',
    createdByName: input.createdByName,
    createdByRepId: input.createdByRepId,
    createdByRole: input.createdByRole,
    createdAt: nowIso,
    updatedAt: nowIso,
    statusHistory: [
      {
        status: 'Pending',
        actor: input.createdByName,
        actorRole: input.createdByRole,
        timestamp: nowIso,
        note: 'Submitted by field executive'
      }
    ],
    syncState: 'queued'
  };

  try {
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...input,
        clientRequestId: tempId
      })
    });

    if (res.ok) {
      const json = await res.json();
      if (json?.request) {
        const saved: FieldRequest = {
          ...json.request,
          syncState: 'synced'
        };
        const current = readCachedRequests().filter((r) => r.id !== tempId && r.id !== saved.id);
        writeCachedRequests([saved, ...current]);
        return { request: saved, synced: Boolean(json.sheetsSynced ?? true) };
      }
    }
  } catch (err) {
    console.warn('[requestsService] Offline/queued request creation:', err);
  }

  const next = [optimistic, ...readCachedRequests()];
  writeCachedRequests(next);
  return { request: optimistic, synced: false };
}

export async function updateFieldRequestStatus(params: {
  id: string;
  status: Exclude<FieldRequestStatus, 'Pending'>;
  managerRemarks?: string;
  actorName: string;
  actorRole: string;
}): Promise<{ request: FieldRequest | null; synced: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/requests/${encodeURIComponent(params.id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: params.status,
        managerRemarks: params.managerRemarks || '',
        actorName: params.actorName,
        actorRole: params.actorRole
      })
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        request: null,
        synced: false,
        error: json?.error || `Failed to update request (HTTP ${res.status})`
      };
    }

    if (json?.request) {
      const updated: FieldRequest = { ...json.request, syncState: 'synced' };
      const current = readCachedRequests();
      const idx = current.findIndex((r) => r.id === updated.id);
      if (idx >= 0) {
        current[idx] = updated;
        writeCachedRequests(current);
      } else {
        writeCachedRequests([updated, ...current]);
      }
      return { request: updated, synced: Boolean(json.sheetsSynced ?? true) };
    }
  } catch (err: any) {
    console.warn('[requestsService] Status update network fallback:', err);
  }

  const nowIso = new Date().toISOString();
  const cached = readCachedRequests();
  const target = cached.find((r) => r.id === params.id);
  if (!target) {
    return { request: null, synced: false, error: 'Request record not found' };
  }

  const updatedLocal: FieldRequest = {
    ...target,
    status: params.status,
    managerRemarks: params.managerRemarks?.trim() || target.managerRemarks,
    reviewedBy: params.actorName,
    reviewedAt: nowIso,
    updatedAt: nowIso,
    syncState: 'queued',
    statusHistory: [
      ...(target.statusHistory || []),
      {
        status: params.status,
        actor: params.actorName,
        actorRole: params.actorRole,
        timestamp: nowIso,
        note: params.managerRemarks?.trim() || `Marked as ${params.status}`
      }
    ]
  };
  writeCachedRequests(cached.map((r) => (r.id === params.id ? updatedLocal : r)));
  return { request: updatedLocal, synced: false };
}
