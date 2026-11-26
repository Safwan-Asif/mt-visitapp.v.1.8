import React, { useState, useMemo } from 'react';
import { X, Store, MapPin, Plus, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { Outlet, PlanogramRecord } from '../types';
import { useTheme } from '../ThemeContext';
import { UNMAPPED_MASTER_OUTLETS, MasterOutletOption } from '../constants';
import { normalizeSapCode } from '../services/planogramService';

interface AddOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (outlet: Outlet) => void;
  currentCount: number;
  existingOutlets?: Outlet[];
  executiveName?: string;
  liveMasterOutlets?: MasterOutletOption[];
  planograms?: PlanogramRecord[];
}

export const AddOutletModal: React.FC<AddOutletModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentCount,
  existingOutlets = [],
  executiveName = 'Safwan Asif',
  liveMasterOutlets,
  planograms = []
}) => {
  const { isDark } = useTheme();

  const activePlanSapMap = useMemo(() => {
    const map = new Map<string, string[]>();
    planograms
      .filter((p) => p.status === 'active')
      .forEach((p) => {
        const sap = normalizeSapCode(p.sap_code);
        if (!sap) return;
        const arr = map.get(sap) || [];
        if (!arr.includes(p.category)) arr.push(p.category);
        map.set(sap, arr);
      });
    return map;
  }, [planograms]);

  const cleanExec = (executiveName || '').trim().toLowerCase();
  const isSupervisor = cleanExec.includes('safwan');
  const sourceOutlets =
    liveMasterOutlets && liveMasterOutlets.length > 0 ? liveMasterOutlets : UNMAPPED_MASTER_OUTLETS;

  const availableOutlets: MasterOutletOption[] = useMemo(() => {
    const seenKeys = new Set<string>();
    const list: MasterOutletOption[] = [];

    for (const masterStore of sourceOutlets) {
      const storeExec = (masterStore.executive || '').trim().toLowerCase();
      const isExecutiveMatch = isSupervisor || !storeExec || storeExec === cleanExec;
      if (!isExecutiveMatch) continue;

      const sapNorm = normalizeSapCode(masterStore.code);
      const alreadyExists = existingOutlets.some((o) => {
        const existingSap = normalizeSapCode(o.code);
        if (sapNorm && existingSap) return sapNorm === existingSap;
        return (
          o.name.toLowerCase() === masterStore.name.toLowerCase() &&
          o.branch.toLowerCase() === masterStore.branch.toLowerCase()
        );
      });
      if (alreadyExists) continue;

      const dedupKey = sapNorm || masterStore.name.toLowerCase();
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);
      list.push(masterStore);
    }

    return list.sort((a, b) => {
      const aHasPlan = activePlanSapMap.has(normalizeSapCode(a.code)) ? 1 : 0;
      const bHasPlan = activePlanSapMap.has(normalizeSapCode(b.code)) ? 1 : 0;
      if (aHasPlan !== bHasPlan) return bHasPlan - aHasPlan;
      return a.name.localeCompare(b.name);
    });
  }, [sourceOutlets, isSupervisor, cleanExec, existingOutlets, activePlanSapMap]);

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    availableOutlets[0]?.id || ''
  );

  React.useEffect(() => {
    if (
      availableOutlets.length > 0 &&
      (!selectedStoreId || !availableOutlets.some((s) => s.id === selectedStoreId))
    ) {
      setSelectedStoreId(availableOutlets[0].id);
    }
  }, [availableOutlets, selectedStoreId, isOpen]);

  const [remark, setRemark] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedMasterStore =
    availableOutlets.find((s) => s.id === selectedStoreId) || availableOutlets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterStore) {
      setValidationError('Please select an outlet from the master list');
      return;
    }
    if (!remark.trim() || remark.trim().length < 5) {
      setValidationError(
        'Please provide a specific remark/reason for this unmapped visit (min 5 characters)'
      );
      return;
    }

    const newOutlet: Outlet = {
      id: `out-unmapped-${Date.now()}`,
      name: selectedMasterStore.name,
      code: selectedMasterStore.code || undefined,
      account: selectedMasterStore.account || undefined,
      branch: selectedMasterStore.branch,
      address: selectedMasterStore.address,
      sequence: `${currentCount + 1} of ${currentCount + 1}`,
      status: 'Not Started',
      isUnmapped: true,
      unmappedRemark: remark.trim(),
      progress: {
        'Edible Oil': 'Not Started',
        'Flour': 'Not Started',
        'Pasta': 'Not Started'
      },
      latitude: selectedMasterStore.latitude ?? 25.2854,
      longitude: selectedMasterStore.longitude ?? 51.531
    };

    onAdd(newOutlet);
    setRemark('');
    setValidationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md glass-panel-strong rounded-3xl p-5 md:p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl glass-subtle flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Store size={19} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Add Unmapped Store
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Master Mapped Outlets for {executiveName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider block mb-1.5 text-[var(--text-secondary)]">
              Select Store from Master List
            </label>
            <div className="relative glass-subtle rounded-2xl">
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  setValidationError(null);
                }}
                className="w-full appearance-none px-3.5 py-3 pr-8 text-xs font-semibold bg-transparent focus:outline-none cursor-pointer text-[var(--text-primary)]"
              >
                {availableOutlets.length === 0 ? (
                  <option value="">No unmapped outlets available</option>
                ) : (
                  availableOutlets.map((item) => {
                    const matchedCats = activePlanSapMap.get(normalizeSapCode(item.code));
                    return (
                      <option
                        key={item.id}
                        value={item.id}
                        className={
                          isDark
                            ? 'bg-[#061C35] text-[#F1F5FF]'
                            : 'bg-white text-[#0B1D36]'
                        }
                      >
                        {matchedCats ? '★ [Planogram] ' : ''}
                        {item.name}
                        {item.code ? ` (SAP ${item.code})` : ''}
                      </option>
                    );
                  })
                )}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-3.5 pointer-events-none text-[var(--accent-primary)]"
              />
            </div>
          </div>

          {selectedMasterStore && (
            <div className="glass-subtle rounded-2xl p-3 text-xs flex items-start gap-2.5">
              <MapPin size={14} className="text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold block text-[var(--text-primary)]">
                  {selectedMasterStore.name} ({selectedMasterStore.branch})
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] block truncate tabular-nums">
                  {selectedMasterStore.code ? `SAP ${selectedMasterStore.code} · ` : ''}
                  {selectedMasterStore.address}
                </span>
                {activePlanSapMap.has(normalizeSapCode(selectedMasterStore.code)) && (
                  <span className="text-[11px] font-bold text-[var(--accent-primary)] block mt-0.5">
                    Planogram Matched:{' '}
                    {activePlanSapMap.get(normalizeSapCode(selectedMasterStore.code))?.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <FileText size={12} />
                Reason for Unmapped Visit *
              </label>
              <span className="text-[10px] text-rose-500 font-bold">Mandatory</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Explain why you are visiting this store when it's not mapped on today's Journey Plan..."
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setValidationError(null);
              }}
              className="w-full glass-subtle rounded-2xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all resize-none leading-relaxed"
            />
            <p className="text-[10px] mt-1 text-[var(--text-muted)]">
              Logged and highlighted in spreadsheet &amp; supervisor reports.
            </p>
          </div>

          {validationError && (
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5">
              <AlertCircle size={13} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="pt-1 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[44px] py-2.5 rounded-2xl glass-subtle text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMasterStore || remark.trim().length < 5}
              className={`flex-1 min-h-[44px] py-2.5 rounded-2xl text-xs font-bold shadow-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedMasterStore && remark.trim().length >= 5
                  ? 'btn-electric-blue cursor-pointer active:scale-[0.99]'
                  : 'glass-subtle text-[var(--text-muted)] cursor-not-allowed opacity-60'
              }`}
            >
              <Plus size={14} /> Add to Route
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
