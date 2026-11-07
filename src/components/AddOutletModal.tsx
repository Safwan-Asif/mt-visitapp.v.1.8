import React, { useState } from 'react';
import { X, Store, MapPin, Plus, AlertCircle, FileText, ChevronDown } from 'lucide-react';
import { Outlet } from '../types';
import { useTheme } from '../ThemeContext';
import { UNMAPPED_MASTER_OUTLETS, MasterOutletOption } from '../constants';

interface AddOutletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (outlet: Outlet) => void;
  currentCount: number;
  existingOutlets?: Outlet[];
  executiveName?: string;
}

export const AddOutletModal: React.FC<AddOutletModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentCount,
  existingOutlets = [],
  executiveName = 'Safwan Asif'
}) => {
  const { isDark } = useTheme();

  // Filter master outlets mapped to the executive and not already in current journey plan
  const cleanExec = (executiveName || '').trim().toLowerCase();
  const availableOutlets: MasterOutletOption[] = UNMAPPED_MASTER_OUTLETS.filter((masterStore) => {
    // Executive match
    const storeExec = (masterStore.executive || '').trim().toLowerCase();
    const isExecutiveMatch = !storeExec || storeExec === cleanExec || (cleanExec.includes('safwan') && storeExec.includes('safwan'));
    // Check if not already added
    const alreadyExists = existingOutlets.some(
      (o) => o.name.toLowerCase() === masterStore.name.toLowerCase() && 
             o.branch.toLowerCase() === masterStore.branch.toLowerCase()
    );
    return isExecutiveMatch && !alreadyExists;
  });

  const [selectedStoreId, setSelectedStoreId] = useState<string>(
    availableOutlets[0]?.id || ''
  );

  React.useEffect(() => {
    if (availableOutlets.length > 0 && (!selectedStoreId || !availableOutlets.some((s) => s.id === selectedStoreId))) {
      setSelectedStoreId(availableOutlets[0].id);
    }
  }, [availableOutlets, selectedStoreId, isOpen]);

  const [remark, setRemark] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedMasterStore = availableOutlets.find((s) => s.id === selectedStoreId) || availableOutlets[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMasterStore) {
      setValidationError('Please select an outlet from the master list');
      return;
    }
    if (!remark.trim() || remark.trim().length < 5) {
      setValidationError('Please provide a specific remark/reason for this unmapped visit (min 5 characters)');
      return;
    }

    const newOutlet: Outlet = {
      id: `out-unmapped-${Date.now()}`,
      name: selectedMasterStore.name,
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
      latitude: 25.2854,
      longitude: 51.5310
    };

    onAdd(newOutlet);
    setRemark('');
    setValidationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-sm border rounded-3xl p-5 shadow-2xl relative ${
        isDark ? 'bg-[#132219] border-emerald-900/60' : 'bg-white border-emerald-950/15'
      }`}>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1.5 rounded-xl cursor-pointer ${
            isDark ? 'text-slate-400 hover:text-white bg-[#0B120E]' : 'text-slate-500 hover:text-slate-900 bg-slate-100'
          }`}
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
            <Store size={20} />
          </div>
          <div>
            <h3 className={`text-sm font-black ${isDark ? 'text-[#F0FDF4]' : 'text-[#061A12]'}`}>
              Add Unmapped Store
            </h3>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Master Mapped Outlets for {executiveName}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Master Outlet Dropdown */}
          <div>
            <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
              isDark ? 'text-emerald-300/80' : 'text-slate-600'
            }`}>
              Select Store from Master List
            </label>
            <div className={`relative border rounded-xl transition-all ${
              isDark ? 'bg-[#0B120E] border-emerald-900/60' : 'bg-emerald-50/40 border-emerald-200'
            }`}>
              <select
                value={selectedStoreId}
                onChange={(e) => {
                  setSelectedStoreId(e.target.value);
                  setValidationError(null);
                }}
                className={`w-full appearance-none px-3 py-2.5 pr-8 text-xs font-semibold bg-transparent focus:outline-none cursor-pointer ${
                  isDark ? 'text-[#F0FDF4]' : 'text-slate-900'
                }`}
              >
                {availableOutlets.length === 0 ? (
                  <option value="">No unmapped outlets available</option>
                ) : (
                  availableOutlets.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      className={isDark ? 'bg-[#132219] text-[#F0FDF4]' : 'bg-white text-slate-900'}
                    >
                      {item.name} — {item.branch}
                    </option>
                  ))
                )}
              </select>
              <ChevronDown
                size={14}
                className={`absolute right-3 top-3 pointer-events-none ${
                  isDark ? 'text-emerald-400' : 'text-emerald-700'
                }`}
              />
            </div>
          </div>

          {/* Selected Store Preview Details */}
          {selectedMasterStore && (
            <div className={`p-2.5 rounded-xl border text-[11px] flex items-start gap-2 ${
              isDark ? 'bg-[#182C21]/60 border-emerald-900/40 text-slate-300' : 'bg-emerald-50/60 border-emerald-100 text-slate-700'
            }`}>
              <MapPin size={13} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-bold text-xs block text-emerald-600 dark:text-emerald-400">
                  {selectedMasterStore.name} ({selectedMasterStore.branch})
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                  {selectedMasterStore.address}
                </span>
              </div>
            </div>
          )}

          {/* Remark Box (Mandatory) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                isDark ? 'text-amber-400' : 'text-amber-700'
              }`}>
                <FileText size={11} />
                Reason for Unmapped Visit *
              </label>
              <span className="text-[9px] text-rose-500 font-bold">Mandatory</span>
            </div>
            <textarea
              required
              rows={3}
              placeholder="Explain why you are visiting this store when it's not mapped on today's Journey Plan (e.g. Supervisor directive / urgent Flour & Oil stockout verification / ad-hoc POSM replenishment)..."
              value={remark}
              onChange={(e) => {
                setRemark(e.target.value);
                setValidationError(null);
              }}
              className={`w-full border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all resize-none leading-relaxed ${
                isDark
                  ? 'bg-[#0B120E] border-amber-900/40 text-[#F0FDF4] placeholder-slate-600'
                  : 'bg-amber-50/30 border-amber-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <p className={`text-[9px] mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              This explanation will be logged and highlighted in spreadsheet &amp; supervisor reports.
            </p>
          </div>

          {validationError && (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10px] font-semibold flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                isDark
                  ? 'border-emerald-900/50 text-slate-400 hover:text-white bg-[#0B120E]'
                  : 'border-slate-200 text-slate-600 hover:text-slate-900 bg-slate-100'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedMasterStore || remark.trim().length < 5}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black shadow-lg flex items-center justify-center gap-1.5 transition-all ${
                selectedMasterStore && remark.trim().length >= 5
                  ? 'bg-gradient-to-r from-amber-600 via-emerald-600 to-emerald-500 text-white shadow-emerald-950/40 hover:brightness-110 cursor-pointer active:scale-[0.99]'
                  : isDark
                  ? 'bg-[#182C21] text-slate-500 border border-emerald-950 cursor-not-allowed opacity-60'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
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
