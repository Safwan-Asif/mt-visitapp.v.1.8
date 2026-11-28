import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FilePlus2,
  Image as ImageIcon,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Store,
  X,
  XCircle
} from 'lucide-react';
import {
  FieldRequest,
  FieldRequestPrefill,
  FieldRequestPriority,
  FieldRequestStatus,
  FieldRequestType,
  Outlet,
  UserProfile,
  isSupervisorRole
} from '../../types';
import {
  createFieldRequest,
  updateFieldRequestStatus
} from '../../services/requestsService';
import { MoreSubViewHeader, formatShortDateTime } from './MoreSharedUI';

interface RequestsModuleProps {
  executive: UserProfile;
  assignedOutlets: Outlet[];
  requests: FieldRequest[];
  isLoading: boolean;
  onRefresh: () => void;
  onRequestCreated: (req: FieldRequest) => void;
  onRequestUpdated: (req: FieldRequest) => void;
  prefill?: FieldRequestPrefill | null;
  onConsumePrefill?: () => void;
  onBack: () => void;
}

const REQUEST_TYPES: FieldRequestType[] = [
  'Manager Visit',
  'Planogram Change',
  'PJP Modification',
  'POSM Requirement',
  'Outlet Information Correction',
  'Other'
];

const PRIORITIES: FieldRequestPriority[] = ['Normal', 'High', 'Urgent'];

const STATUS_TABS: Array<'All' | FieldRequestStatus> = [
  'All',
  'Pending',
  'Approved',
  'Rejected',
  'Completed'
];

function statusStyle(status: FieldRequestStatus): {
  badge: string;
  dot: string;
  text: string;
} {
  switch (status) {
    case 'Pending':
      return {
        badge: 'bg-[#FFB800]/15 border-[#FFB800]/40 text-amber-700 dark:text-[#FFB800]',
        dot: 'bg-[#FFB800]',
        text: 'Pending'
      };
    case 'Approved':
      return {
        badge: 'bg-[#008DFF]/15 border-[#008DFF]/40 text-[#0066FF] dark:text-[#00C8FF]',
        dot: 'bg-[#008DFF]',
        text: 'Approved'
      };
    case 'Rejected':
      return {
        badge: 'bg-[#EF4444]/15 border-[#EF4444]/40 text-rose-700 dark:text-[#EF4444]',
        dot: 'bg-[#EF4444]',
        text: 'Rejected'
      };
    case 'Completed':
      return {
        badge: 'bg-[#22C55E]/15 border-[#22C55E]/40 text-emerald-700 dark:text-[#22C55E]',
        dot: 'bg-[#22C55E]',
        text: 'Completed'
      };
  }
}

function priorityStyle(priority: FieldRequestPriority): string {
  switch (priority) {
    case 'Urgent':
      return 'bg-[#EF4444]/15 text-rose-700 dark:text-[#EF4444] border-[#EF4444]/35';
    case 'High':
      return 'bg-[#FFB800]/15 text-amber-700 dark:text-[#FFB800] border-[#FFB800]/35';
    default:
      return 'bg-[#0066FF]/10 text-[#0066FF] dark:text-[#A5B8D5] border-[#0066FF]/25 dark:border-[#104878]';
  }
}

async function compressAttachmentImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1080;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = String(reader.result || '');
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export const RequestsModule: React.FC<RequestsModuleProps> = ({
  executive,
  assignedOutlets,
  requests,
  isLoading,
  onRefresh,
  onRequestCreated,
  onRequestUpdated,
  prefill,
  onConsumePrefill,
  onBack
}) => {
  const canApprove = isSupervisorRole(executive.role);

  const [statusFilter, setStatusFilter] = useState<'All' | FieldRequestStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<FieldRequest | null>(null);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  // Composer form state
  const [formType, setFormType] = useState<FieldRequestType>('Manager Visit');
  const [outletSearch, setOutletSearch] = useState('');
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');
  const [selectedOutletName, setSelectedOutletName] = useState<string>('');
  const [selectedOutletSap, setSelectedOutletSap] = useState<string>('');
  const [formPriority, setFormPriority] = useState<FieldRequestPriority>('Normal');
  const [formDescription, setFormDescription] = useState('');
  const [formAttachment, setFormAttachment] = useState<string>('');
  const [formPlanogramRef, setFormPlanogramRef] = useState<FieldRequest['planogramRef']>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Supervisor review state
  const [managerRemarks, setManagerRemarks] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!prefill) return;
    setFormType(prefill.type || 'Planogram Change');
    setSelectedOutletId(prefill.outletId || '');
    setSelectedOutletSap(prefill.outletSapCode || '');
    setSelectedOutletName(prefill.outletName || '');
    setOutletSearch(prefill.outletName || '');
    setFormPriority(prefill.priority || 'High');
    setFormDescription(prefill.description || '');
    setFormPlanogramRef(prefill.planogramRef);
    setFormAttachment('');
    setIsComposerOpen(true);
    onConsumePrefill?.();
  }, [prefill?.nonce]);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 3200);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const counts = useMemo(() => {
    return {
      All: requests.length,
      Pending: requests.filter((r) => r.status === 'Pending').length,
      Approved: requests.filter((r) => r.status === 'Approved').length,
      Rejected: requests.filter((r) => r.status === 'Rejected').length,
      Completed: requests.filter((r) => r.status === 'Completed').length
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return requests.filter((req) => {
      if (statusFilter !== 'All' && req.status !== statusFilter) return false;
      if (!q) return true;
      return (
        req.referenceCode.toLowerCase().includes(q) ||
        req.outletName.toLowerCase().includes(q) ||
        (req.outletSapCode || '').toLowerCase().includes(q) ||
        req.type.toLowerCase().includes(q) ||
        req.description.toLowerCase().includes(q)
      );
    });
  }, [requests, statusFilter, searchQuery]);

  const outletOptions = useMemo(() => {
    const q = outletSearch.trim().toLowerCase();
    const list = assignedOutlets;
    if (!q) return list.slice(0, 30);
    return list
      .filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.branch || '').toLowerCase().includes(q) ||
          (o.code || '').toLowerCase().includes(q) ||
          (o.account || '').toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [assignedOutlets, outletSearch]);

  const handleOpenNew = () => {
    setFormType('Manager Visit');
    setOutletSearch('');
    setSelectedOutletId('');
    setSelectedOutletSap('');
    setSelectedOutletName('');
    setFormPriority('Normal');
    setFormDescription('');
    setFormAttachment('');
    setFormPlanogramRef(undefined);
    setIsComposerOpen(true);
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAttachmentImage(file);
      setFormAttachment(dataUrl);
    } catch {
      setToastMsg('Unable to attach image file');
    }
  };

  const handleSubmitNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutletName = selectedOutletName.trim() || outletSearch.trim();
    if (!targetOutletName || !formDescription.trim()) return;

    setIsSubmitting(true);
    try {
      const { request, synced } = await createFieldRequest({
        type: formType,
        outletId: selectedOutletId || undefined,
        outletSapCode: selectedOutletSap || undefined,
        outletName: targetOutletName,
        priority: formPriority,
        description: formDescription.trim(),
        attachmentDataUrl: formAttachment || undefined,
        planogramRef: formPlanogramRef,
        createdByName: executive.name,
        createdByRepId: executive.repId,
        createdByRole: executive.role
      });
      onRequestCreated(request);
      setIsComposerOpen(false);
      setSelectedRequest(request);
      setToastMsg(
        synced
          ? `${request.referenceCode} synced to Google Sheets backend`
          : `${request.referenceCode} saved locally & queued for sync`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSupervisorDecision = async (nextStatus: 'Approved' | 'Rejected' | 'Completed') => {
    if (!selectedRequest || !canApprove) return;
    setIsUpdatingStatus(true);
    try {
      const { request, synced, error } = await updateFieldRequestStatus({
        id: selectedRequest.id,
        status: nextStatus,
        managerRemarks,
        actorName: executive.name,
        actorRole: executive.role
      });
      if (error) {
        setToastMsg(error);
        return;
      }
      if (request) {
        onRequestUpdated(request);
        setSelectedRequest(request);
        setManagerRemarks('');
        setToastMsg(
          synced
            ? `${request.referenceCode} marked ${nextStatus} (Google Sheets updated)`
            : `${request.referenceCode} updated locally`
        );
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="FIELD OPERATIONS / INBOX"
        title="REQUESTS"
        subtitle="Operational escalations & supervisor approvals"
        onBack={() => (selectedRequest ? setSelectedRequest(null) : onBack())}
        rightSlot={
          !selectedRequest ? (
            <>
              <button
                type="button"
                onClick={onRefresh}
                aria-label="Sync Requests"
                className="min-h-[44px] min-w-[44px] rounded-[14px] cockpit-surface-elevated flex items-center justify-center text-[var(--text-secondary)] hover:text-[#00C8FF] transition-colors cursor-pointer"
              >
                <RefreshCw size={17} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <button
                type="button"
                onClick={handleOpenNew}
                className="min-h-[44px] px-3.5 rounded-[14px] btn-electric-blue font-heading text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <FilePlus2 size={16} />
                <span>New Request</span>
              </button>
            </>
          ) : null
        }
      />

      {toastMsg && (
        <div className="px-4 md:px-6 pt-2.5 max-w-6xl w-full mx-auto">
          <div className="rounded-[12px] bg-[#0066FF]/15 border border-[#008DFF]/45 px-3.5 py-2 text-xs font-semibold text-[#0066FF] dark:text-[#00C8FF] flex items-center justify-between gap-2">
            <span>{toastMsg}</span>
            <button type="button" onClick={() => setToastMsg(null)} className="cursor-pointer">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* DETAIL VIEW */}
      {selectedRequest ? (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#0066FF] dark:text-[#00C8FF] ov-tabular">
                      {selectedRequest.referenceCode}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${
                        statusStyle(selectedRequest.status).badge
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          statusStyle(selectedRequest.status).dot
                        }`}
                      />
                      {selectedRequest.status}
                    </span>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold ${priorityStyle(
                        selectedRequest.priority
                      )}`}
                    >
                      {selectedRequest.priority} Priority
                    </span>
                  </div>
                  <h2 className="font-heading text-2xl font-bold uppercase tracking-wide text-[var(--text-primary)]">
                    {selectedRequest.type}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Store size={13} className="text-[#00C8FF]" />
                    <span className="font-semibold text-[var(--text-primary)]">
                      {selectedRequest.outletName}
                    </span>
                    {selectedRequest.outletSapCode && (
                      <span className="font-mono text-[11px] text-[var(--text-muted)] ov-tabular">
                        · SAP {selectedRequest.outletSapCode}
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right text-[11px] text-[var(--text-muted)] ov-tabular">
                  <p>Submitted by {selectedRequest.createdByName}</p>
                  <p>{formatShortDateTime(selectedRequest.createdAt)}</p>
                </div>
              </div>

              {selectedRequest.planogramRef?.planogramId && (
                <div className="cockpit-surface-elevated rounded-[12px] px-3 py-2 text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-[#22C55E]">Linked Planogram:</span>
                  <span className="font-mono">{selectedRequest.planogramRef.planogramId}</span>
                  {selectedRequest.planogramRef.category && (
                    <span>Category: {selectedRequest.planogramRef.category}</span>
                  )}
                  {selectedRequest.planogramRef.version && (
                    <span>v{selectedRequest.planogramRef.version}</span>
                  )}
                </div>
              )}

              <div className="cockpit-surface-elevated rounded-[14px] p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Request Details
                </p>
                <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.description}
                </p>
              </div>

              {selectedRequest.attachmentDataUrl && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Attached Evidence
                  </p>
                  <img
                    src={selectedRequest.attachmentDataUrl}
                    alt="Request attachment"
                    className="w-full max-h-72 object-contain rounded-[14px] border border-[#104878]/60 bg-black/30"
                  />
                </div>
              )}

              {selectedRequest.managerRemarks && (
                <div className="rounded-[14px] bg-[#0066FF]/10 border border-[#008DFF]/35 p-3.5 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF]">
                    Supervisor Remarks
                    {selectedRequest.reviewedBy ? ` · ${selectedRequest.reviewedBy}` : ''}
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {selectedRequest.managerRemarks}
                  </p>
                </div>
              )}
            </div>

            {/* ROLE-GATED SUPERVISOR ACTIONS */}
            {canApprove && (
              <div className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-3 border-[#008DFF]/40">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#00C8FF]" />
                  <h3 className="font-heading text-base font-bold uppercase tracking-wider text-[var(--text-primary)]">
                    Supervisor Decision Controls
                  </h3>
                </div>
                <textarea
                  value={managerRemarks}
                  onChange={(e) => setManagerRemarks(e.target.value)}
                  rows={2}
                  placeholder="Optional manager remarks or execution instruction..."
                  className="w-full rounded-[12px] cockpit-surface-elevated px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleSupervisorDecision('Approved')}
                    className="min-h-[44px] rounded-[12px] bg-[#0066FF] hover:bg-[#008DFF] text-white font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>Approve</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleSupervisorDecision('Rejected')}
                    className="min-h-[44px] rounded-[12px] bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-rose-600 dark:text-[#EF4444] font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle size={15} />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleSupervisorDecision('Completed')}
                    className="min-h-[44px] rounded-[12px] bg-[#22C55E]/15 hover:bg-[#22C55E]/25 border border-[#22C55E]/40 text-emerald-700 dark:text-[#22C55E] font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 size={15} />
                    <span>Complete</span>
                  </button>
                </div>
              </div>
            )}

            {/* STATUS TIMELINE */}
            <div className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-3">
              <h3 className="font-heading text-base font-bold uppercase tracking-wider text-[var(--text-primary)]">
                Status History
              </h3>
              <div className="space-y-3">
                {(selectedRequest.statusHistory || []).map((entry, idx) => (
                  <div
                    key={`${entry.timestamp}-${idx}`}
                    className="flex items-start gap-3 text-xs"
                  >
                    <div
                      className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${
                        statusStyle(entry.status).dot
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-semibold text-[var(--text-primary)]">
                          {entry.status} · {entry.actor}
                        </span>
                        <span className="text-[11px] text-[var(--text-muted)] ov-tabular">
                          {formatShortDateTime(entry.timestamp)}
                        </span>
                      </div>
                      {entry.note && (
                        <p className="text-[var(--text-secondary)] mt-0.5">{entry.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LIST VIEW */
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Summary Strip */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { label: 'Total', value: counts.All, tone: 'text-[var(--text-primary)]' },
                { label: 'Pending', value: counts.Pending, tone: 'text-[#FFB800]' },
                { label: 'Approved', value: counts.Approved, tone: 'text-[#008DFF] dark:text-[#00C8FF]' },
                { label: 'Done', value: counts.Completed, tone: 'text-[#22C55E]' }
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="cockpit-panel rounded-[14px] px-3 py-2.5 text-center"
                >
                  <p className={`font-heading text-2xl font-extrabold ov-tabular ${stat.tone}`}>
                    {stat.value}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Search & Status Tabs */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ref #, outlet, SAP code, or keyword..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                {STATUS_TABS.map((tab) => {
                  const active = statusFilter === tab;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`min-h-[38px] px-3 rounded-[12px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        active
                          ? 'bg-[#0066FF] text-white shadow-[0_6px_18px_-4px_rgba(0,102,255,0.5)]'
                          : 'cockpit-surface-elevated text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{tab}</span>
                      <span className="text-[10px] opacity-80 ov-tabular">({counts[tab]})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chronological Cards */}
            {filteredRequests.length === 0 ? (
              <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-[14px] cockpit-surface-elevated mx-auto flex items-center justify-center text-[#00C8FF]">
                  <Clock size={22} />
                </div>
                <div>
                  <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                    No {statusFilter === 'All' ? '' : statusFilter} Requests Found
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
                    Submit operational requests for manager visits, planogram changes, PJP updates, or POSM replenishment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="min-h-[44px] px-4 rounded-[14px] btn-electric-blue font-heading text-sm font-bold uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <FilePlus2 size={16} />
                  <span>Submit First Request</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {filteredRequests.map((req) => {
                  const st = statusStyle(req.status);
                  return (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => setSelectedRequest(req)}
                      className="cockpit-panel rounded-[16px] p-4 text-left hover:border-[#008DFF] transition-all cursor-pointer active:scale-[0.99] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-[11px] font-bold text-[#0066FF] dark:text-[#00C8FF] ov-tabular">
                            {req.referenceCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${priorityStyle(
                              req.priority
                            )}`}
                          >
                            {req.priority}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${st.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.text}
                        </span>
                      </div>

                      <div>
                        <p className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--text-primary)] leading-tight">
                          {req.type}
                        </p>
                        <p className="text-xs font-medium text-[var(--text-secondary)] truncate mt-0.5">
                          {req.outletName}
                          {req.outletSapCode ? ` · SAP ${req.outletSapCode}` : ''}
                        </p>
                      </div>

                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                        {req.description}
                      </p>

                      {req.managerRemarks && (
                        <p className="text-[11px] text-[#0066FF] dark:text-[#00C8FF] truncate bg-[#0066FF]/10 rounded-[10px] px-2.5 py-1.5">
                          Remark: {req.managerRemarks}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] pt-1 border-t border-[#D5E2F2]/70 dark:border-[#104878]/60 ov-tabular">
                        <span>{req.createdByName}</span>
                        <span className="flex items-center gap-2">
                          {req.attachmentDataUrl && <Paperclip size={11} />}
                          {formatShortDateTime(req.createdAt)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW REQUEST MODAL / SHEET */}
      {isComposerOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <form
            onSubmit={handleSubmitNewRequest}
            className="w-full md:max-w-xl max-h-[92dvh] flex flex-col cockpit-panel rounded-t-[20px] md:rounded-[20px] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-[#D5E2F2] dark:border-[#104878] flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#0066FF] dark:text-[#00C8FF]">
                  NEW FIELD REQUEST
                </p>
                <h2 className="font-heading text-xl font-bold uppercase text-[var(--text-primary)]">
                  Submit Operational Request
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-[12px] cockpit-surface-elevated flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Request Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as FieldRequestType)}
                  className="w-full min-h-[44px] rounded-[12px] cockpit-surface-elevated px-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#008DFF]"
                >
                  {REQUEST_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Searchable Outlet Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Target Outlet
                </label>
                <input
                  type="text"
                  value={outletSearch}
                  onChange={(e) => {
                    setOutletSearch(e.target.value);
                    setSelectedOutletName(e.target.value);
                    setSelectedOutletId('');
                    setSelectedOutletSap('');
                  }}
                  placeholder="Search assigned outlet or SAP code..."
                  className="w-full min-h-[44px] rounded-[12px] cockpit-surface-elevated px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
                {outletOptions.length > 0 && (!selectedOutletId || outletSearch !== selectedOutletName) && (
                  <div className="max-h-36 overflow-y-auto rounded-[12px] cockpit-surface-elevated divide-y divide-[#D5E2F2]/60 dark:divide-[#104878]/60">
                    {outletOptions.map((o) => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => {
                          setSelectedOutletId(o.id);
                          setSelectedOutletSap(o.code || '');
                          setSelectedOutletName(o.name);
                          setOutletSearch(o.name);
                        }}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-[#0066FF]/10 flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <span className="font-semibold text-[var(--text-primary)] truncate">
                          {o.name}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] shrink-0 ov-tabular">
                          {o.code || o.branch}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormPriority(p)}
                      className={`min-h-[44px] rounded-[12px] text-xs font-bold border transition-all cursor-pointer ${
                        formPriority === p
                          ? 'bg-[#0066FF] border-[#00C8FF] text-white'
                          : 'cockpit-surface-elevated text-[var(--text-secondary)]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Describe the field issue, planogram discrepancy, POSM needed, or PJP adjustment..."
                  className="w-full rounded-[12px] cockpit-surface-elevated p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
              </div>

              {/* Optional Attachment */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Image Attachment (Optional)
                </label>
                <div className="flex items-center gap-3">
                  <label className="min-h-[44px] px-3.5 rounded-[12px] cockpit-surface-elevated text-xs font-semibold text-[#0066FF] dark:text-[#00C8FF] inline-flex items-center gap-2 cursor-pointer hover:border-[#008DFF]">
                    <ImageIcon size={15} />
                    <span>{formAttachment ? 'Replace Photo' : 'Attach Shelf Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAttachmentChange}
                      className="hidden"
                    />
                  </label>
                  {formAttachment && (
                    <button
                      type="button"
                      onClick={() => setFormAttachment('')}
                      className="text-xs text-rose-500 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {formAttachment && (
                  <img
                    src={formAttachment}
                    alt="Attachment preview"
                    className="h-28 rounded-[12px] object-cover border border-[#104878]"
                  />
                )}
              </div>

              {/* Auto-associated Metadata */}
              <div className="cockpit-surface-elevated rounded-[12px] px-3 py-2 text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <span>
                  Executive: <strong className="text-[var(--text-primary)]">{executive.name}</strong> ({executive.repId})
                </span>
                <span className="ov-tabular">Auto-timestamped</span>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#D5E2F2] dark:border-[#104878] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsComposerOpen(false)}
                className="min-h-[44px] px-4 rounded-[12px] cockpit-surface-elevated text-xs font-bold text-[var(--text-secondary)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !(selectedOutletName.trim() || outletSearch.trim()) || !formDescription.trim()}
                className="min-h-[44px] px-5 rounded-[12px] btn-electric-blue font-heading text-sm font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Send size={14} />
                <span>{isSubmitting ? 'Syncing...' : 'Submit Request'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
