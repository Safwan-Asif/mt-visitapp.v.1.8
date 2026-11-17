import React, { useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Clock,
  CheckCircle2,
  RotateCcw,
  Send,
  FileSpreadsheet,
  Loader2,
  ExternalLink,
  Folder,
  ShieldCheck,
  Copy,
  Check,
  Code,
  Zap
} from 'lucide-react';
import { Outlet, CategoryAuditRecord } from '../types';
import { useTheme } from '../ThemeContext';
import {
  autoSaveAuditToGoogleSheet,
  getAppsScriptTemplateCode,
  TARGET_SPREADSHEET_URL,
  TARGET_DRIVE_FOLDER_URL,
  PJP_SPREADSHEET_URL
} from '../services/googleSheetsService';

interface DashboardScreenProps {
  outlets: Outlet[];
  audits: Record<string, CategoryAuditRecord>;
  onBack: () => void;
  onResetData: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  outlets,
  audits,
  onBack,
  onResetData
}) => {
  const { isDark } = useTheme();

  const [isExportingAll, setIsExportingAll] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [sheetUrl] = useState<string>(TARGET_SPREADSHEET_URL);

  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(getAppsScriptTemplateCode());
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleExportAllToGoogleSheets = async () => {
    setIsExportingAll(true);
    setExportStatus('Auto-syncing all audit logs to Google Sheet & Drive...');

    try {
      const auditList = Object.values(audits);
      if (auditList.length === 0) {
        setExportStatus('No completed audits in session yet. Complete an audit to sync!');
        setIsExportingAll(false);
        return;
      }

      let count = 0;
      for (const audit of auditList) {
        const outlet = outlets.find((o) => o.id === audit.outletId);
        setExportStatus(
          `Exporting audit ${count + 1}/${auditList.length}: ${outlet?.name || 'Outlet'} (${audit.category})...`
        );

        const photoToUpload = audit.annotatedPhotoUrl || audit.photoUrl;

        await autoSaveAuditToGoogleSheet({
          timestamp: audit.timestamp || new Date().toLocaleString(),
          outletId: audit.outletId,
          outletName: outlet?.name || 'Outlet',
          category: audit.category,
          repId: '#9',
          repName: 'Safwan Asif',
          totalFacings: audit.totalFacings,
          shareOfShelfPct: audit.primarySharePct,
          shareOfShelfLabel: audit.category === 'Edible Oil' ? 'QFI SOS' : 'QFM SOS',
          counts: audit.counts || audit.aiCounts,
          originalAiCounts: audit.originalAiCounts,
          discrepancyLog: audit.discrepancyLog || 'No manual overrides (AI counts accepted)',
          unmappedRemark: audit.unmappedRemark || outlet?.unmappedRemark || '',
          priceTagOk: audit.priceTagOk,
          posmShelfSticker: audit.posmShelfSticker,
          posmWobblers: audit.posmWobblers,
          needsReview: false,
          photoDataUrl: photoToUpload,
          replyText: audit.n8nStatus?.message || 'QFI Visit Audit Record'
        });

        count++;
      }

      setExportStatus(`✓ Exported all ${count} audit logs & photos into Google Sheet & Drive!`);
    } catch (err: any) {
      console.error('Batch export error:', err);
      setExportStatus(`Export Note: ${err?.message || 'Queued to Google Sheet'}`);
    } finally {
      setIsExportingAll(false);
    }
  };

  const totalOutlets = outlets.length;
  const completedOutlets = outlets.filter((o) =>
    Object.values(o.progress).every((s) => s === 'Completed')
  ).length;

  const totalAuditsList = Object.values(audits);
  const totalAuditsCount = totalAuditsList.length;

  const avgSeconds =
    totalAuditsCount > 0
      ? Math.round(
          totalAuditsList.reduce((acc, curr) => acc + curr.auditDurationSeconds, 0) /
            totalAuditsCount
        )
      : 102;

  const avgMinutesStr = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

  const avgYaraSos =
    totalAuditsCount > 0
      ? Math.round(
          totalAuditsList.reduce((acc, curr) => acc + curr.primarySharePct, 0) / totalAuditsCount
        )
      : 33;

  const priceTagCompliance =
    totalAuditsCount > 0
      ? Math.round(
          (totalAuditsList.filter((a) => a.priceTagOk).length / totalAuditsCount) * 100
        )
      : 100;

  const posmCompliance =
    totalAuditsCount > 0
      ? Math.round(
          (totalAuditsList.filter((a) => a.posmShelfSticker).length / totalAuditsCount) * 100
        )
      : 92;

  return (
    <div className="flex-1 flex flex-col max-w-6xl mx-auto w-full h-full overflow-hidden px-3.5 pt-3.5 md:px-8 md:pt-6 select-none animate-fade-in">
      {/* Header Banner */}
      <div className="space-y-3 shrink-0">
        <div className="glass-panel rounded-3xl p-4 md:p-5 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--accent-primary)]">
              <span>Today &middot; Performance Analytics</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Executive Daily KPI
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Qatar Modern Trade Territory
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onBack}
              className="min-h-[40px] px-3 rounded-xl glass-subtle text-xs font-semibold text-[var(--text-primary)] hover:bg-white/80 dark:hover:bg-white/10 inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Route PJP</span>
            </button>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isDark
                  ? 'bg-[#10B981]/15 text-[#34D399]'
                  : 'bg-[#084C41]/10 text-[#084C41]'
              }`}
            >
              <BarChart3 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Scrollable Grid Body */}
      <div className="flex-1 overflow-y-auto pt-3 pb-24 md:pb-8 space-y-3.5 pr-0.5">
        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="glass-panel rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Route Coverage
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tabular-nums text-[var(--accent-primary)]">
                {completedOutlets}
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] tabular-nums">
                / {totalOutlets} Stores
              </span>
            </div>
            <p className="text-[11px] text-[var(--accent-primary)] font-semibold flex items-center gap-1 pt-0.5">
              <CheckCircle2 size={12} /> On Target Track
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              Avg Audit Time
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tabular-nums text-[var(--accent-primary)]">
                {avgMinutesStr}
              </span>
            </div>
            <p className="text-[11px] text-[var(--accent-primary)] font-semibold flex items-center gap-1 pt-0.5">
              <Clock size={12} /> Sub-2 Min Goal
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              YARA Shelf Share
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold tabular-nums text-[var(--accent-primary)]">
                {avgYaraSos}%
              </span>
              <span className="text-xs font-bold text-[var(--text-secondary)]">SOS</span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] pt-0.5">
              Gondola Front Facings
            </p>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block">
              POSM Compliance
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                {posmCompliance}%
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] tabular-nums pt-0.5">
              Price Tag: {priceTagCompliance}%
            </p>
          </div>
        </div>

        {/* Two-Column Operations Section on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* Google Workspace Live Auto-Sync */}
          <div className="glass-panel rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-[var(--accent-primary)]" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                  Google Sheet &amp; Drive Auto-Sync
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[var(--accent-primary)] flex items-center gap-1 shrink-0">
                <ShieldCheck size={13} /> Zero Sign-In Active
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Audit logs, shelf metrics, and annotated images sync silently to Google Workspace without field login.
            </p>

            <div className="space-y-2 text-xs">
              <a
                href={TARGET_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between transition-colors text-[var(--text-primary)]"
              >
                <span className="flex items-center gap-2 truncate font-semibold">
                  <FileSpreadsheet size={14} className="text-[var(--accent-primary)] shrink-0" />
                  <span className="truncate">QFI Modern Trade Audit Sheet</span>
                </span>
                <ExternalLink size={13} className="text-[var(--text-muted)] shrink-0" />
              </a>

              <a
                href={TARGET_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between transition-colors text-[var(--text-primary)]"
              >
                <span className="flex items-center gap-2 truncate font-semibold">
                  <Folder size={14} className="text-[var(--accent-primary)] shrink-0" />
                  <span className="truncate">Google Drive Annotated Photos Folder</span>
                </span>
                <ExternalLink size={13} className="text-[var(--text-muted)] shrink-0" />
              </a>

              <a
                href={PJP_SPREADSHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-2xl glass-subtle hover:border-[var(--border-glass-strong)] flex items-center justify-between transition-colors text-[var(--text-primary)]"
              >
                <span className="flex items-center gap-2 truncate font-semibold">
                  <FileSpreadsheet size={14} className="text-teal-600 dark:text-teal-400 shrink-0" />
                  <span className="truncate">Master PJP Journey Schedule Sheet</span>
                </span>
                <ExternalLink size={13} className="text-[var(--text-muted)] shrink-0" />
              </a>
            </div>

            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="w-full min-h-[36px] text-xs text-[var(--accent-primary)] font-bold hover:underline flex items-center justify-center gap-1.5 pt-1 cursor-pointer"
            >
              <Code size={13} />
              <span>Get 1-Click Google Apps Script Setup Code</span>
            </button>
          </div>

          {/* Completed Category Audit Logs + Pipeline + Batch Export */}
          <div className="space-y-3.5 flex flex-col">
            <div className="glass-panel rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Send size={14} className="text-[var(--accent-primary)]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                    Analysis Pipeline
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-[var(--accent-primary)]">
                  Multipart JPEG
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 rounded-2xl glass-subtle">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Endpoint
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[var(--accent-primary)] truncate block">
                    Analysis API Proxy
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl glass-subtle">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Fault Tolerance
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 text-[11px] font-bold block">
                    Auto CV Fallback
                  </span>
                </div>
              </div>
            </div>

            {/* Completed Audits Log */}
            <div className="glass-panel rounded-3xl p-4 space-y-2.5 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                  Completed Audits Log
                </h3>
                <span className="text-xs font-bold tabular-nums text-[var(--accent-primary)]">
                  {totalAuditsCount} Logged
                </span>
              </div>

              {totalAuditsCount === 0 ? (
                <p className="text-xs text-[var(--text-secondary)] py-4 text-center">
                  Complete store category audits to view instant log history.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {totalAuditsList.map((audit, idx) => {
                    const outlet = outlets.find((o) => o.id === audit.outletId);
                    const isRemote = audit.n8nStatus?.source === 'n8n_remote';

                    return (
                      <div
                        key={`${audit.outletId}_${audit.category}_${idx}`}
                        className="glass-subtle rounded-2xl px-3 py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-[var(--text-primary)] truncate">
                            {outlet?.name || 'Store'} &middot;{' '}
                            <span className="text-[var(--accent-primary)]">{audit.category}</span>
                          </p>
                          <p className="text-[11px] text-[var(--text-secondary)] tabular-nums truncate">
                            {audit.timestamp} &middot; {audit.auditDurationSeconds}s &middot;{' '}
                            {audit.totalFacings} Facings
                          </p>
                          {audit.latitude && audit.longitude && (
                            <p className="text-[10px] text-[var(--accent-primary)] font-mono tabular-nums">
                              GPS: {audit.latitude.toFixed(4)}°N, {audit.longitude.toFixed(4)}°E (
                              {audit.locationSource === 'device_gps' ? 'Live GPS' : 'Store Mapped'})
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-bold text-[var(--accent-primary)] shrink-0">
                          {isRemote ? 'Synced' : 'Offline'} &middot; Done
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Batch Export & Reset */}
        <div className="glass-panel rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-[var(--accent-primary)]" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-primary)]">
                Google Sheets Master Export
              </h3>
            </div>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold text-[var(--accent-primary)] hover:underline inline-flex items-center gap-1"
              >
                <span>View Sheet</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>

          {exportStatus && (
            <div className="glass-subtle rounded-2xl p-2.5 text-xs font-medium text-[var(--text-primary)]">
              {exportStatus}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportAllToGoogleSheets}
              disabled={isExportingAll}
              className={`min-h-[48px] py-2.5 px-4 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50 ${
                isDark
                  ? 'bg-[#10B981] text-[#05231C]'
                  : 'bg-[#084C41] text-white'
              }`}
            >
              {isExportingAll ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Exporting All Audits…</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet size={15} />
                  <span>Export All Audits &amp; Photos</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onResetData}
              className="min-h-[48px] py-2.5 px-4 rounded-2xl glass-subtle hover:border-rose-500/40 text-xs font-bold text-[var(--text-secondary)] hover:text-rose-600 dark:hover:text-rose-400 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span>Reset Demo Route &amp; Audits</span>
            </button>
          </div>
        </div>
      </div>

      {/* Apps Script Template Code Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel-strong rounded-3xl p-5 space-y-3 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[var(--accent-primary)] flex items-center gap-1.5">
                <Code size={14} /> Google Apps Script Setup
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="w-8 h-8 rounded-xl glass-subtle flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed shrink-0">
              Paste this snippet into your Google Sheet under <strong>Extensions &gt; Apps Script</strong>, then deploy as Web App (Execute as: <em>Me</em>, Access: <em>Anyone</em>).
            </p>

            <div className="flex-1 overflow-y-auto bg-black/80 rounded-2xl p-3 border border-emerald-500/20 font-mono text-[10px] text-emerald-300 select-all">
              <pre className="whitespace-pre-wrap leading-tight">
                {getAppsScriptTemplateCode()}
              </pre>
            </div>

            <div className="flex gap-2 shrink-0 pt-1">
              <button
                type="button"
                onClick={handleCopyScript}
                className={`flex-1 min-h-[44px] py-2 font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark ? 'bg-[#10B981] text-[#05231C]' : 'bg-[#084C41] text-white'
                }`}
              >
                {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="min-h-[44px] px-4 py-2 glass-subtle text-[var(--text-primary)] font-bold text-xs rounded-2xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
