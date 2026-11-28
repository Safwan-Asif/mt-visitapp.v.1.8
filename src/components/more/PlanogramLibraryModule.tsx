import React, { useMemo, useState } from 'react';
import {
  FileEdit,
  LayoutGrid,
  Minus,
  Plus,
  RotateCcw,
  Search,
  X
} from 'lucide-react';
import { BRAND_COLORS, CATEGORIES } from '../../constants';
import { FieldRequestPrefill, PlanogramRecord } from '../../types';
import { LivePjpDataset } from '../../services/pjpService';
import { normalizeSapCode } from '../../services/planogramService';
import {
  MoreSubViewHeader,
  ResilientDriveImage,
  formatDateOnly
} from './MoreSharedUI';

interface PlanogramLibraryModuleProps {
  planograms: PlanogramRecord[];
  livePjpDataset: LivePjpDataset;
  onRequestPlanogramChange: (prefill: Omit<FieldRequestPrefill, 'nonce'>) => void;
  onBack: () => void;
}

export const PlanogramLibraryModule: React.FC<PlanogramLibraryModuleProps> = ({
  planograms,
  livePjpDataset,
  onRequestPlanogramChange,
  onBack
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [retailerFilter, setRetailerFilter] = useState('All');
  const [outletFilter, setOutletFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedPlanogram, setSelectedPlanogram] = useState<
    (PlanogramRecord & { retailer: string }) | null
  >(null);
  const [zoomScale, setZoomScale] = useState(1);

  const cmBySap = useMemo(() => {
    const map = new Map<string, { account: string; branch: string; custName: string }>();
    (livePjpDataset.customerMaster || []).forEach((cm) => {
      const sap = normalizeSapCode(cm.sapCode);
      if (sap) {
        map.set(sap, {
          account: cm.account || 'Modern Trade',
          branch: cm.branch || cm.area || '',
          custName: cm.custName
        });
      }
    });
    return map;
  }, [livePjpDataset.customerMaster]);

  const enrichedPlanograms = useMemo(() => {
    return planograms
      .filter((p) => p.status === 'active')
      .map((p) => {
        const cm = cmBySap.get(normalizeSapCode(p.sap_code));
        const inferredRetailer =
          cm?.account || (p.cust_name ? p.cust_name.split(/[\s-]+/)[0] : 'Modern Trade');
        return {
          ...p,
          retailer: inferredRetailer
        };
      });
  }, [planograms, cmBySap]);

  const retailers = useMemo(
    () => Array.from(new Set(enrichedPlanograms.map((p) => p.retailer).filter(Boolean))).sort(),
    [enrichedPlanograms]
  );
  const outletNames = useMemo(
    () => Array.from(new Set(enrichedPlanograms.map((p) => p.cust_name).filter(Boolean))).sort(),
    [enrichedPlanograms]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return enrichedPlanograms.filter((p) => {
      if (retailerFilter !== 'All' && p.retailer !== retailerFilter) return false;
      if (outletFilter !== 'All' && p.cust_name !== outletFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.cust_name.toLowerCase().includes(q) ||
        p.sap_code.toLowerCase().includes(q) ||
        p.planogram_id.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.retailer.toLowerCase().includes(q)
      );
    });
  }, [enrichedPlanograms, retailerFilter, outletFilter, categoryFilter, searchQuery]);

  const openPlanogram = (p: PlanogramRecord & { retailer: string }) => {
    setSelectedPlanogram(p);
    setZoomScale(1);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="RESOURCE LIBRARY / REFERENCES"
        title="PLANOGRAM LIBRARY"
        subtitle={`${filtered.length} approved read-only shelf layout${filtered.length === 1 ? '' : 's'}`}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search outlet, SAP, ID..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
              />
            </div>

            <select
              value={retailerFilter}
              onChange={(e) => setRetailerFilter(e.target.value)}
              className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="All">All Retailers</option>
              {retailers.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={outletFilter}
              onChange={(e) => setOutletFilter(e.target.value)}
              className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="All">All Outlets</option>
              {outletNames.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-2">
              <LayoutGrid size={24} className="mx-auto text-[#22C55E]" />
              <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                No Approved Planograms Found
              </p>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                Active approved store shelf planograms synced from the master planogram repository will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((p) => {
                const thumbUrl = p.image_annotated_url || p.image_original_url || '';
                const topBrands = Object.entries(p.brand_totals_json || {}).slice(0, 4);
                return (
                  <button
                    key={p.planogram_id}
                    type="button"
                    onClick={() => openPlanogram(p)}
                    className="cockpit-panel rounded-[16px] overflow-hidden text-left hover:border-[#008DFF] transition-all cursor-pointer active:scale-[0.99] flex flex-col"
                  >
                    <div className="relative h-36 bg-[#04152B] border-b border-[#104878] overflow-hidden">
                      {thumbUrl ? (
                        <ResilientDriveImage
                          src={thumbUrl}
                          alt={`${p.cust_name} ${p.category}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full p-3 flex flex-col justify-center gap-1.5">
                          {(p.bays_json || []).slice(0, 1).map((bay, bIdx) => (
                            <div key={bIdx} className="space-y-1">
                              {(bay.rows || bay.planRows || []).slice(0, 3).map((r: any, rIdx: number) => (
                                <div key={rIdx} className="flex gap-1 h-4">
                                  {Object.entries(r.faces || {}).slice(0, 5).map(([b, cnt]) => (
                                    <div
                                      key={b}
                                      style={{
                                        backgroundColor: BRAND_COLORS[b] || '#0066FF',
                                        flex: Math.max(1, Number(cnt) || 1)
                                      }}
                                      className="rounded-[3px] text-[8px] font-bold text-white flex items-center justify-center truncate px-1"
                                    >
                                      {b}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          ))}
                          {(!p.bays_json || p.bays_json.length === 0) && (
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {topBrands.map(([b, cnt]) => (
                                <span
                                  key={b}
                                  style={{ backgroundColor: BRAND_COLORS[b] || '#0066FF' }}
                                  className="px-2 py-1 rounded-[6px] text-[10px] font-bold text-white ov-tabular"
                                >
                                  {b}: {cnt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-[6px] bg-[#020D1F]/85 border border-[#22C55E]/45 text-[10px] font-bold uppercase text-[#22C55E]">
                        Approved · v{p.version}
                      </span>
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-[6px] bg-[#020D1F]/85 text-[10px] font-semibold text-[#F1F5FF]">
                        {p.category}
                      </span>
                    </div>

                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF]">
                          {p.retailer} · SAP {p.sap_code}
                        </p>
                        <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)] truncate">
                          {p.cust_name}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[#D5E2F2]/70 dark:border-[#104878]/60 ov-tabular">
                        <span>{p.total_faces} planned facings</span>
                        <span>
                          {p.updated_at ? formatDateOnly(p.updated_at) : p.created_at ? formatDateOnly(p.created_at) : 'Active'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FULL-SCREEN READ-ONLY PLANOGRAM VIEWER */}
      {selectedPlanogram && (
        <div className="fixed inset-0 z-50 bg-[#020D1F]/96 backdrop-blur-xl flex flex-col">
          <div className="px-4 py-3 border-b border-[#104878] flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E] truncate">
                APPROVED PLANOGRAM · v{selectedPlanogram.version} · {selectedPlanogram.category}
              </p>
              <h3 className="font-heading text-xl font-bold uppercase text-[#F1F5FF] truncate">
                {selectedPlanogram.cust_name}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedPlanogram(null)}
              aria-label="Close Planogram Viewer"
              className="min-h-[44px] min-w-[44px] rounded-[12px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="max-w-5xl mx-auto space-y-4">
              {(selectedPlanogram.image_annotated_url || selectedPlanogram.image_original_url) && (
                <div className="rounded-[16px] bg-[#04152B] border border-[#104878] p-3 overflow-auto flex flex-col items-center gap-3">
                  <div
                    style={{ transform: `scale(${zoomScale})`, transformOrigin: 'top center' }}
                    className="transition-transform duration-150"
                  >
                    <ResilientDriveImage
                      src={
                        selectedPlanogram.image_annotated_url ||
                        selectedPlanogram.image_original_url ||
                        ''
                      }
                      alt={selectedPlanogram.cust_name}
                      loading="eager"
                      className="max-h-[48dvh] w-auto object-contain rounded-[10px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setZoomScale((z) => Math.max(1, Number((z - 0.5).toFixed(2))))}
                      className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-mono text-[#A5B8D5] ov-tabular">
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomScale((z) => Math.min(3, Number((z + 0.5).toFixed(2))))}
                      className="min-h-[38px] min-w-[38px] rounded-[10px] bg-[#0B2542] border border-[#104878] flex items-center justify-center text-[#F1F5FF] cursor-pointer"
                    >
                      <Plus size={14} />
                    </button>
                    {zoomScale !== 1 && (
                      <button
                        type="button"
                        onClick={() => setZoomScale(1)}
                        className="min-h-[38px] px-2.5 rounded-[10px] bg-[#0B2542] border border-[#104878] text-xs text-[#00C8FF] flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        Reset
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Shelf Layout Matrix */}
              <div className="rounded-[16px] bg-[#061C35] border border-[#104878] p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-heading text-base font-bold uppercase tracking-wider text-[#F1F5FF]">
                    Approved Bay & Shelf Allocation
                  </h4>
                  <span className="text-xs font-mono text-[#00C8FF] ov-tabular">
                    Total Planned: {selectedPlanogram.total_faces} facings
                    {selectedPlanogram.target_sos
                      ? ` · Target SOS ${selectedPlanogram.target_sos}%`
                      : ''}
                  </span>
                </div>

                {selectedPlanogram.bays_json && selectedPlanogram.bays_json.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedPlanogram.bays_json.map((bay, idx) => (
                      <div
                        key={idx}
                        className="rounded-[12px] bg-[#0B2542] border border-[#104878] p-3 space-y-2"
                      >
                        <p className="text-xs font-bold uppercase text-[#00C8FF]">
                          {bay.label || `Bay ${bay.bayIndex || idx + 1}`}
                        </p>
                        {(bay.rows || bay.planRows || []).map((r: any, rIdx: number) => {
                          const facesMap: Record<string, number> = r.faces || {};
                          if (Array.isArray(r.slots)) {
                            r.slots.forEach((s: any) => {
                              facesMap[s.brand] = (facesMap[s.brand] || 0) + (Number(s.width) || 1);
                            });
                          }
                          return (
                            <div key={rIdx} className="space-y-1">
                              <span className="text-[10px] text-[#647D9E] uppercase ov-tabular">
                                Shelf Row {r.row || rIdx + 1}
                              </span>
                              <div className="flex gap-1">
                                {Object.entries(facesMap).map(([brand, cnt]) => (
                                  <div
                                    key={brand}
                                    style={{
                                      backgroundColor: BRAND_COLORS[brand] || '#0066FF',
                                      flex: Math.max(1, Number(cnt) || 1)
                                    }}
                                    className="px-2 py-1 rounded-[5px] text-[10px] font-bold text-white text-center truncate ov-tabular"
                                  >
                                    {brand} ({cnt})
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedPlanogram.brand_totals_json || {}).map(([b, cnt]) => (
                      <span
                        key={b}
                        style={{ backgroundColor: BRAND_COLORS[b] || '#0066FF' }}
                        className="px-3 py-1.5 rounded-[8px] text-xs font-bold text-white ov-tabular"
                      >
                        {b}: {cnt} facings
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metadata & Contextual Request CTA */}
              <div className="rounded-[16px] bg-[#061C35] border border-[#104878] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs flex-1">
                  <div>
                    <span className="text-[10px] uppercase text-[#647D9E] block">Planogram ID</span>
                    <span className="font-mono text-[#F1F5FF] truncate block">
                      {selectedPlanogram.planogram_id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#647D9E] block">Applicable Outlet</span>
                    <span className="text-[#F1F5FF] font-semibold">
                      {selectedPlanogram.cust_name} (SAP {selectedPlanogram.sap_code})
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#647D9E] block">Approval Status</span>
                    <span className="text-[#22C55E] font-semibold uppercase">
                      {selectedPlanogram.status} · v{selectedPlanogram.version}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-[#647D9E] block">Updated</span>
                    <span className="text-[#F1F5FF] ov-tabular">
                      {formatDateOnly(selectedPlanogram.updated_at || selectedPlanogram.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const p = selectedPlanogram;
                    setSelectedPlanogram(null);
                    onRequestPlanogramChange({
                      type: 'Planogram Change',
                      outletSapCode: p.sap_code,
                      outletName: p.cust_name,
                      priority: 'High',
                      description: `Planogram change requested for ${p.cust_name} (SAP ${p.sap_code}) · ${p.category} · Planogram ${p.planogram_id} v${p.version}.`,
                      planogramRef: {
                        planogramId: p.planogram_id,
                        version: p.version,
                        category: p.category
                      }
                    });
                  }}
                  className="min-h-[46px] px-4 rounded-[14px] btn-electric-blue font-heading text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <FileEdit size={16} />
                  <span>Request Planogram Change</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
