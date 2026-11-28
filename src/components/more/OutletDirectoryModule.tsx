import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Images,
  MapPin,
  Search,
  Store
} from 'lucide-react';
import { CategoryAuditRecord, Outlet } from '../../types';
import {
  LivePjpDataset,
  matchesExecutiveIdentity
} from '../../services/pjpService';
import { normalizeSapCode } from '../../services/planogramService';
import { MoreSubViewHeader, formatDateOnly } from './MoreSharedUI';

export interface DirectoryOutletProfile {
  outlet: Outlet;
  sapCode: string;
  customerName: string;
  account: string;
  branch: string;
  area: string;
  channel: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  lastVisitDate: string;
  visitFrequency: string;
}

interface OutletDirectoryModuleProps {
  executiveName: string;
  executiveRepId?: string;
  assignedOutlets: Outlet[];
  livePjpDataset: LivePjpDataset;
  audits: Record<string, CategoryAuditRecord>;
  onViewOutletAnalytics: (outlet: Outlet) => void;
  onViewVisitLogs: (outletName: string) => void;
  onViewGallery: (outletName: string) => void;
  onViewOnMap: (outlet: Outlet) => void;
  onBack: () => void;
}

export const OutletDirectoryModule: React.FC<OutletDirectoryModuleProps> = ({
  executiveName,
  executiveRepId,
  assignedOutlets,
  livePjpDataset,
  audits,
  onViewOutletAnalytics,
  onViewVisitLogs,
  onViewGallery,
  onViewOnMap,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [selectedProfile, setSelectedProfile] = useState<DirectoryOutletProfile | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const enrichedOutlets = useMemo<DirectoryOutletProfile[]>(() => {
    const cmBySap = new Map(
      (livePjpDataset.customerMaster || [])
        .filter((cm) => cm.sapCode)
        .map((cm) => [normalizeSapCode(cm.sapCode), cm])
    );

    const lastS2BySap = new Map<string, string>();
    (livePjpDataset.sheet2Visits || []).forEach((v) => {
      const sap = normalizeSapCode(v.sapCode);
      if (!sap) return;
      const prev = lastS2BySap.get(sap);
      if (!prev || v.date > prev) lastS2BySap.set(sap, v.date);
    });

    const schedFreqBySap = new Map<string, number>();
    (livePjpDataset.scheduleRows || [])
      .filter((sr) => matchesExecutiveIdentity(sr.executive, sr.repId, executiveName, executiveRepId))
      .forEach((sr) => {
        const sap = normalizeSapCode(sr.sapCode);
        if (!sap) return;
        schedFreqBySap.set(sap, (schedFreqBySap.get(sap) || 0) + 1);
      });

    return assignedOutlets.map((o) => {
      const sap = normalizeSapCode(o.code);
      const cm = sap ? cmBySap.get(sap) : undefined;
      const areaFromAddr = o.address ? o.address.split(',')[0].trim() : '';

      const localDates = Object.values(audits)
        .filter((a) => a.outletId === o.id || (sap && a.outletId === `out-sap-${sap}`))
        .map((a) => (a.timestamp ? a.timestamp.slice(0, 10) : ''))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
        .sort();

      const lastVisitDate =
        localDates[localDates.length - 1] ||
        (sap ? lastS2BySap.get(sap) : '') ||
        '';

      const scheduledCount = sap ? schedFreqBySap.get(sap) || 0 : 0;
      const visitFrequency =
        scheduledCount > 0 ? `${scheduledCount}× / PJP cycle` : 'Assigned Active';

      return {
        outlet: o,
        sapCode: cm?.sapCode || o.code || '—',
        customerName: cm?.custName || o.name,
        account: cm?.account || o.account || o.name.split(' - ')[0] || 'Modern Trade',
        branch: cm?.branch || o.branch || 'Doha',
        area: cm?.area || areaFromAddr || o.branch || 'Doha',
        channel: cm?.channel || 'Hypermarket',
        latitude: cm?.latitude ?? o.latitude ?? null,
        longitude: cm?.longitude ?? o.longitude ?? null,
        status: cm?.status || (o.status === 'Completed' ? 'Visited' : o.status),
        lastVisitDate,
        visitFrequency
      };
    });
  }, [assignedOutlets, livePjpDataset, audits, executiveName, executiveRepId]);

  const accounts = useMemo(
    () => Array.from(new Set(enrichedOutlets.map((p) => p.account).filter(Boolean))).sort(),
    [enrichedOutlets]
  );
  const areas = useMemo(
    () => Array.from(new Set(enrichedOutlets.map((p) => p.area).filter(Boolean))).sort(),
    [enrichedOutlets]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedOutlets.filter((p) => {
      if (accountFilter !== 'All' && p.account !== accountFilter) return false;
      if (areaFilter !== 'All' && p.area !== areaFilter) return false;
      if (!q) return true;
      return (
        p.customerName.toLowerCase().includes(q) ||
        p.sapCode.toLowerCase().includes(q) ||
        p.account.toLowerCase().includes(q) ||
        p.area.toLowerCase().includes(q) ||
        p.branch.toLowerCase().includes(q)
      );
    });
  }, [enrichedOutlets, accountFilter, areaFilter, searchQuery]);

  const handleCopy = (label: string, text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(label);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="FIELD OPERATIONS / MASTER"
        title="OUTLET DIRECTORY"
        subtitle={`${filtered.length} of ${enrichedOutlets.length} assigned outlets`}
        onBack={() => (selectedProfile ? setSelectedProfile(null) : onBack())}
      />

      {selectedProfile ? (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="cockpit-panel rounded-[16px] p-4 md:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#0066FF]/15 border border-[#008DFF]/40 text-[10px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF]">
                    {selectedProfile.account} · {selectedProfile.channel}
                  </span>
                  <h2 className="font-heading text-2xl font-extrabold uppercase tracking-wide text-[var(--text-primary)] leading-tight">
                    {selectedProfile.customerName}
                  </h2>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedProfile.branch} · {selectedProfile.area}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/40 text-[11px] font-semibold text-emerald-700 dark:text-[#22C55E] shrink-0">
                  {selectedProfile.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'SAP Code', value: selectedProfile.sapCode, mono: true },
                  { label: 'Customer Name', value: selectedProfile.customerName },
                  { label: 'Account', value: selectedProfile.account },
                  { label: 'Branch', value: selectedProfile.branch },
                  { label: 'Area', value: selectedProfile.area },
                  { label: 'Channel', value: selectedProfile.channel },
                  { label: 'Visit Frequency', value: selectedProfile.visitFrequency },
                  {
                    label: 'Last Visit Date',
                    value: selectedProfile.lastVisitDate
                      ? formatDateOnly(selectedProfile.lastVisitDate)
                      : 'No logged visit'
                  },
                  {
                    label: 'Coordinates',
                    value:
                      selectedProfile.latitude !== null && selectedProfile.longitude !== null
                        ? `${selectedProfile.latitude.toFixed(5)}, ${selectedProfile.longitude.toFixed(5)}`
                        : '—',
                    mono: true
                  }
                ].map((field) => (
                  <div
                    key={field.label}
                    className="cockpit-surface-elevated rounded-[12px] p-2.5 space-y-0.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {field.label}
                    </p>
                    <div className="flex items-center justify-between gap-1.5">
                      <p
                        className={`text-xs font-semibold text-[var(--text-primary)] truncate ${
                          field.mono ? 'font-mono ov-tabular' : ''
                        }`}
                      >
                        {field.value}
                      </p>
                      {(field.label === 'SAP Code' || field.label === 'Coordinates') &&
                        field.value !== '—' && (
                          <button
                            type="button"
                            onClick={() => handleCopy(field.label, field.value)}
                            className="text-[#0066FF] dark:text-[#00C8FF] shrink-0 cursor-pointer"
                            title={`Copy ${field.label}`}
                          >
                            {copiedKey === field.label ? <Check size={13} /> : <Copy size={13} />}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="cockpit-panel rounded-[16px] p-4 space-y-2.5">
              <p className="font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                Quick Actions
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onViewOutletAnalytics(selectedProfile.outlet)}
                  className="min-h-[46px] px-4 rounded-[14px] btn-electric-blue font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 size={16} />
                    View Outlet Analytics
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewOnMap(selectedProfile.outlet)}
                  className="min-h-[46px] px-4 rounded-[14px] cockpit-surface-elevated hover:border-[#008DFF] font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <MapPin size={16} className="text-[#00C8FF]" />
                    View on Map
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewVisitLogs(selectedProfile.outlet.name)}
                  className="min-h-[46px] px-4 rounded-[14px] cockpit-surface-elevated hover:border-[#008DFF] font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-indigo-400" />
                    View Visit Logs
                  </span>
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onViewGallery(selectedProfile.outlet.name)}
                  className="min-h-[46px] px-4 rounded-[14px] cockpit-surface-elevated hover:border-[#008DFF] font-heading text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Images size={16} className="text-sky-400" />
                    View Gallery
                  </span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
          <div className="max-w-6xl mx-auto space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div className="relative md:col-span-1">
                <Search
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search outlet name, SAP, account, area..."
                  className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
                />
              </div>

              <select
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
              >
                <option value="All">All Accounts ({accounts.length})</option>
                {accounts.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>

              <select
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
              >
                <option value="All">All Areas ({areas.length})</option>
                {areas.map((ar) => (
                  <option key={ar} value={ar}>
                    {ar}
                  </option>
                ))}
              </select>
            </div>

            {filtered.length === 0 ? (
              <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-2">
                <Store size={24} className="mx-auto text-[#0066FF] dark:text-[#00C8FF]" />
                <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                  No Assigned Outlets Match
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Try clearing your search query or account/area filters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {filtered.map((item) => (
                  <button
                    key={item.outlet.id}
                    type="button"
                    onClick={() => setSelectedProfile(item)}
                    className="cockpit-panel rounded-[15px] p-3.5 text-left hover:border-[#008DFF] transition-all cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-[6px] bg-[#0066FF]/12 text-[#0066FF] dark:text-[#00C8FF] ov-tabular">
                          SAP {item.sapCode}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-[var(--text-muted)] truncate">
                          {item.account} · {item.area}
                        </span>
                      </div>
                      <p className="font-heading text-lg font-bold uppercase tracking-wide text-[var(--text-primary)] truncate leading-tight">
                        {item.customerName}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)] truncate ov-tabular">
                        {item.branch} · Last visit:{' '}
                        {item.lastVisitDate ? formatDateOnly(item.lastVisitDate) : 'Pending'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[10px] font-semibold text-emerald-700 dark:text-[#22C55E]">
                        {item.status}
                      </span>
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
