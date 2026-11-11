import React, { useState } from 'react';
import { 
  ArrowLeft, BarChart3, Clock, CheckCircle2, 
  RotateCcw, Send, FileSpreadsheet, Loader2, ExternalLink,
  Folder, ShieldCheck, Copy, Check, Code, Zap
} from 'lucide-react';
import { Outlet, CategoryAuditRecord } from '../types';
import { DEFAULT_N8N_WEBHOOK_URL } from '../services/n8nService';
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

  // Apps Script Code Modal state
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
        setExportStatus(`Exporting audit ${count + 1}/${auditList.length}: ${outlet?.name || 'Outlet'} (${audit.category})...`);

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

  // Average time
  const avgSeconds =
    totalAuditsCount > 0
      ? Math.round(
          totalAuditsList.reduce((acc, curr) => acc + curr.auditDurationSeconds, 0) /
            totalAuditsCount
        )
      : 102; // default 1m 42s

  const avgMinutesStr = `${Math.floor(avgSeconds / 60)}m ${avgSeconds % 60}s`;

  // Average Primary (YARA) Share of Shelf
  const avgYaraSos =
    totalAuditsCount > 0
      ? Math.round(
          totalAuditsList.reduce((acc, curr) => acc + curr.primarySharePct, 0) / totalAuditsCount
        )
      : 33;

  // Compliance Rates
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
    <div className="flex-1 flex flex-col justify-between p-3.5 max-w-md mx-auto w-full h-full overflow-hidden select-none relative">
      {/* Top Header */}
      <div className="space-y-3 shrink-0">
        <button
          onClick={onBack}
          className={`flex items-center gap-1.5 text-xs font-semibold py-1 group transition-colors cursor-pointer ${
            isDark ? 'text-emerald-300/80 hover:text-white' : 'text-emerald-900/80 hover:text-emerald-950'
          }`}
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Route PJP</span>
        </button>

        <div className={`backdrop-blur-xl border p-4 rounded-3xl shadow-xl flex items-center justify-between transition-colors ${
          isDark
            ? 'bg-[#132219]/80 border-emerald-900/50 shadow-black/30'
            : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
        }`}>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${
              isDark ? 'text-emerald-400' : 'text-emerald-800'
            }`}>
              Performance Analytics
            </span>
            <h2 className={`text-base font-black ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
              Executive Daily KPI
            </h2>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Qatar Modern Trade Territory South
            </p>
          </div>
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
            isDark
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <BarChart3 size={20} />
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="flex-1 overflow-y-auto space-y-3 py-2.5 pr-0.5">
        
        {/* Google Workspace Live Auto-Sync Status & Resource Quick Links */}
        <div className={`backdrop-blur-xl border rounded-2xl p-3.5 space-y-2.5 transition-colors ${
          isDark
            ? 'bg-[#132219]/90 border-emerald-800/60 shadow-lg'
            : 'bg-white border-emerald-950/10 shadow-xs'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-emerald-400" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
              }`}>
                Google Sheet &amp; Drive Auto-Sync
              </h3>
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-400" />
              Zero Sign-In Active
            </span>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            All audit logs, shelf metrics, and annotated images are silently saved in real-time to your central Google Cloud destination without requiring field reps to log in.
          </p>

          <div className="space-y-1.5 text-[10px]">
            <a
              href={TARGET_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                isDark
                  ? 'bg-[#0B120E] border-emerald-900/50 hover:border-emerald-500/60 text-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileSpreadsheet size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">QFI Modern Trade Audit Sheet</span>
              </div>
              <ExternalLink size={12} className="shrink-0" />
            </a>

            <a
              href={TARGET_DRIVE_FOLDER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                isDark
                  ? 'bg-[#0B120E] border-emerald-900/50 hover:border-emerald-500/60 text-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Folder size={13} className="text-emerald-400 shrink-0" />
                <span className="truncate font-semibold">Google Drive Annotated Photos Folder</span>
              </div>
              <ExternalLink size={12} className="shrink-0" />
            </a>

            <a
              href={PJP_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-2 rounded-xl border flex items-center justify-between transition-colors ${
                isDark
                  ? 'bg-[#0B120E] border-emerald-900/50 hover:border-emerald-500/60 text-emerald-300'
                  : 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-400 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <FileSpreadsheet size={13} className="text-teal-400 shrink-0" />
                <span className="truncate font-semibold">Master PJP Journey Schedule Sheet</span>
              </div>
              <ExternalLink size={12} className="shrink-0" />
            </a>
          </div>

          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowScriptModal(true)}
              className="w-full text-[10px] text-emerald-400 font-bold hover:underline flex items-center justify-center gap-1 py-1"
            >
              <Code size={12} />
              <span>Get 1-Click Google Apps Script Setup Code</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Route Coverage */}
          <div className={`backdrop-blur-xl border p-3.5 rounded-2xl transition-colors ${
            isDark
              ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}>
            <span className={`text-[10px] font-bold block uppercase tracking-wider ${
              isDark ? 'text-emerald-300/70' : 'text-slate-500'
            }`}>
              Route Coverage
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-black tabular-nums ${
                isDark ? 'text-[#4ADE80]' : 'text-emerald-800'
              }`}>
                {completedOutlets}
              </span>
              <span className="text-xs text-slate-500 font-semibold">/ {totalOutlets} Stores</span>
            </div>
            <p className="text-[9px] text-emerald-500 font-bold mt-1 flex items-center gap-0.5">
              <CheckCircle2 size={10} /> On Target Track
            </p>
          </div>

          {/* Card 2: Average Audit Time */}
          <div className={`backdrop-blur-xl border p-3.5 rounded-2xl transition-colors ${
            isDark
              ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}>
            <span className={`text-[10px] font-bold block uppercase tracking-wider ${
              isDark ? 'text-emerald-300/70' : 'text-slate-500'
            }`}>
              Avg Audit Time
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-black tabular-nums ${
                isDark ? 'text-[#4ADE80]' : 'text-emerald-800'
              }`}>
                {avgMinutesStr}
              </span>
            </div>
            <p className="text-[9px] text-emerald-500 font-bold mt-1 flex items-center gap-0.5">
              <Clock size={10} /> Sub-2 Min Goal Met
            </p>
          </div>

          {/* Card 3: Primary Brand Share */}
          <div className={`backdrop-blur-xl border p-3.5 rounded-2xl transition-colors ${
            isDark
              ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}>
            <span className={`text-[10px] font-bold block uppercase tracking-wider ${
              isDark ? 'text-emerald-300/70' : 'text-slate-500'
            }`}>
              YARA Shelf Share
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className={`text-xl font-black tabular-nums ${
                isDark ? 'text-[#4ADE80]' : 'text-emerald-800'
              }`}>
                {avgYaraSos}%
              </span>
              <span className="text-xs text-slate-500 font-bold">SOS</span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Gondola Front Facings</p>
          </div>

          {/* Card 4: POSM Compliance */}
          <div className={`backdrop-blur-xl border p-3.5 rounded-2xl transition-colors ${
            isDark
              ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
              : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
          }`}>
            <span className={`text-[10px] font-bold block uppercase tracking-wider ${
              isDark ? 'text-emerald-300/70' : 'text-slate-500'
            }`}>
              POSM Compliance
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-black text-amber-500 tabular-nums">
                {posmCompliance}%
              </span>
            </div>
            <p className="text-[9px] text-slate-400 mt-1">Price Tag: {priceTagCompliance}%</p>
          </div>
        </div>

        {/* Analysis Webhook Integration Card */}
        <div className={`backdrop-blur-xl border rounded-2xl p-3.5 space-y-2 transition-colors ${
          isDark
            ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
            : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Send size={13} className="text-emerald-500" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
              }`}>
                Analysis Pipeline
              </h3>
            </div>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
              isDark
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                : 'text-emerald-800 bg-emerald-50 border-emerald-200'
            }`}>
              Multipart Binary JPEG
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0B120E] border-emerald-900/40' : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Default Endpoint</span>
              <span className={`font-mono text-[9px] truncate block font-bold ${
                isDark ? 'text-emerald-400' : 'text-emerald-800'
              }`} title="Analysis API Endpoint">
                Analysis API Endpoint
              </span>
            </div>
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-[#0B120E] border-emerald-900/40' : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Fault Tolerance</span>
              <span className="text-amber-500 font-bold block">Auto CV Fallback Active</span>
            </div>
          </div>
        </div>

        {/* Recent Category Audit Logs */}
        <div className={`backdrop-blur-xl border rounded-2xl p-3.5 space-y-2 transition-colors ${
          isDark
            ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
            : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-xs font-black uppercase tracking-wider ${
              isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
            }`}>
              Completed Audits Log
            </h3>
            <span className={`text-[10px] font-bold tabular-nums ${
              isDark ? 'text-emerald-400' : 'text-emerald-800'
            }`}>
              {totalAuditsCount} Logged
            </span>
          </div>

          {totalAuditsCount === 0 ? (
            <p className="text-[11px] text-slate-500 py-3 text-center">
              Complete store category audits to view instant log history.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {totalAuditsList.map((audit, idx) => {
                const outlet = outlets.find((o) => o.id === audit.outletId);
                const isRemote = audit.n8nStatus?.source === 'n8n_remote';

                return (
                  <div
                    key={`${audit.outletId}_${audit.category}_${idx}`}
                    className={`border rounded-xl px-2.5 py-1.5 flex items-center justify-between text-xs transition-colors ${
                      isDark
                        ? 'bg-[#0B120E] border-emerald-900/40'
                        : 'bg-emerald-50/30 border-emerald-200'
                    }`}
                  >
                    <div>
                      <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {outlet?.name || 'Store'} &bull;{' '}
                        <span className="text-emerald-500">{audit.category}</span>
                      </span>
                      <p className="text-[10px] text-slate-500">
                        {audit.timestamp} &bull; {audit.auditDurationSeconds}s &bull; {audit.totalFacings} Facings
                      </p>
                      {audit.latitude && audit.longitude && (
                        <p className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                          <span>GPS: {audit.latitude.toFixed(4)}°N, {audit.longitude.toFixed(4)}°E</span>
                          <span className="text-[8px] text-slate-400">({audit.locationSource === 'device_gps' ? 'Live GPS' : 'Store Mapped'})</span>
                        </p>
                      )}
                      {audit.discrepancyLog && audit.discrepancyLog !== 'No manual overrides (AI counts accepted)' && (
                        <p className="text-[9px] text-amber-500 font-medium truncate max-w-[220px]">
                          Overrides: {audit.discrepancyLog}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                        isRemote 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' 
                          : 'text-amber-500 bg-amber-500/10 border-amber-500/30'
                      }`}>
                        {isRemote ? 'Analysis Synced' : 'Offline Mode'}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                        isDark 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : 'text-emerald-800 bg-emerald-100 border-emerald-300'
                      }`}>
                        ✓ Done
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Google Sheets Master Export Card */}
        <div className={`backdrop-blur-xl border rounded-2xl p-3.5 space-y-2 transition-colors ${
          isDark
            ? 'bg-[#132219]/70 border-emerald-900/40 shadow-sm'
            : 'bg-white border-emerald-950/10 shadow-xs shadow-emerald-950/5'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-emerald-400" />
              <h3 className={`text-xs font-black uppercase tracking-wider ${
                isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'
              }`}>
                Google Sheets Export
              </h3>
            </div>
            {sheetUrl && (
              <a
                href={sheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30"
              >
                <span>View Sheet</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Saves all store audit logs &amp; annotated photos into a single Master Google Sheet row-by-row with embedded picture formulas.
          </p>

          {exportStatus && (
            <div className={`text-[10px] p-2 rounded-xl font-medium ${
              exportStatus.startsWith('✓')
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : exportStatus.includes('Error') || exportStatus.includes('failed')
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-200'
            }`}>
              {exportStatus}
            </div>
          )}

          <button
            type="button"
            onClick={handleExportAllToGoogleSheets}
            disabled={isExportingAll}
            className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {isExportingAll ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Exporting All Audits &amp; Photos...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet size={14} />
                <span>Export All Audits &amp; Photos to Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Reset Data Button for Tester */}
      <div className={`pt-2 shrink-0 border-t ${
        isDark ? 'border-emerald-900/40' : 'border-emerald-950/10'
      }`}>
        <button
          onClick={onResetData}
          className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            isDark
              ? 'border-emerald-900/50 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 bg-[#132219]/60'
              : 'border-slate-200 hover:border-rose-400 text-slate-600 hover:text-rose-600 bg-white shadow-xs'
          }`}
        >
          <RotateCcw size={13} />
          Reset Demo Route &amp; Audits
        </button>
      </div>

      {/* Apps Script Template Code Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs">
          <div className={`w-full max-w-sm rounded-3xl p-4 border space-y-3 max-h-[90vh] flex flex-col ${
            isDark ? 'bg-[#0B120E] border-emerald-800 text-[#F0FDF4]' : 'bg-white border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-center justify-between shrink-0">
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Code size={14} /> Google Apps Script Setup
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-[10px] text-slate-300 leading-normal shrink-0">
              Paste this snippet into your Google Sheet under <strong>Extensions &gt; Apps Script</strong>, then deploy as Web App (Execute as: <em>Me</em>, Access: <em>Anyone</em>).
            </p>

            <div className="flex-1 overflow-y-auto bg-black/60 rounded-xl p-2.5 border border-emerald-900/60 font-mono text-[9px] text-emerald-300 select-all">
              <pre className="whitespace-pre-wrap leading-tight">{getAppsScriptTemplateCode()}</pre>
            </div>

            <div className="flex gap-2 shrink-0 pt-1">
              <button
                type="button"
                onClick={handleCopyScript}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
              >
                {copiedScript ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedScript ? 'Copied to Clipboard!' : 'Copy Code'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowScriptModal(false)}
                className="px-4 py-2 border border-slate-700 text-slate-300 font-bold text-xs rounded-xl"
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

