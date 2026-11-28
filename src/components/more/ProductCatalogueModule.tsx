import React, { useMemo, useState } from 'react';
import { Check, Copy, Package, Search, X } from 'lucide-react';
import { CATEGORIES } from '../../constants';
import { QFI_PRODUCT_CATALOGUE } from '../../data/productCatalogue';
import { CatalogSku, CategoryType } from '../../types';
import { MoreSubViewHeader } from './MoreSharedUI';

interface ProductCatalogueModuleProps {
  onBack: () => void;
}

const PackshotVisual: React.FC<{
  sku: CatalogSku;
  side?: 'front' | 'back';
  compact?: boolean;
}> = ({ sku, side = 'front', compact = false }) => {
  const isOil = sku.category === 'Edible Oil';
  const isFlour = sku.category === 'Flour';

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center overflow-hidden ${
        compact ? 'p-3' : 'p-6'
      }`}
      style={{
        background: `radial-gradient(circle at 50% 35%, ${sku.brandColor}33 0%, rgba(4, 21, 43, 0.92) 78%)`
      }}
    >
      {/* Clean geometric product silhouette */}
      <div
        className={`relative flex flex-col items-center justify-between border shadow-lg transition-transform ${
          isOil
            ? compact
              ? 'w-14 h-24 rounded-t-[14px] rounded-b-[8px]'
              : 'w-24 h-40 rounded-t-[20px] rounded-b-[12px]'
            : isFlour
            ? compact
              ? 'w-16 h-22 rounded-[8px]'
              : 'w-28 h-36 rounded-[12px]'
            : compact
            ? 'w-16 h-20 rounded-[6px]'
            : 'w-28 h-32 rounded-[10px]'
        }`}
        style={{
          backgroundColor: side === 'front' ? '#0B2542' : '#061C35',
          borderColor: sku.brandColor
        }}
      >
        <div
          className="w-full py-1 px-1.5 text-center font-heading font-extrabold uppercase tracking-wider text-white truncate rounded-t-[inherit]"
          style={{
            backgroundColor: sku.brandColor,
            fontSize: compact ? '9px' : '12px'
          }}
        >
          {sku.brand}
        </div>

        <div className="px-1.5 text-center space-y-0.5 my-auto">
          {side === 'front' ? (
            <>
              <p
                className={`font-heading font-bold uppercase text-[#F1F5FF] leading-tight ${
                  compact ? 'text-[10px]' : 'text-sm'
                }`}
              >
                {sku.category}
              </p>
              <p
                className={`font-mono font-semibold text-[#00C8FF] ov-tabular ${
                  compact ? 'text-[9px]' : 'text-xs'
                }`}
              >
                {sku.packSize}
              </p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase text-[#A5B8D5]">NUTRITION / SAP</p>
              <p className="font-mono text-[10px] text-[#00C8FF] ov-tabular">
                {sku.sapItemCode}
              </p>
              <div className="mx-auto w-14 h-4 bg-white/90 rounded-[2px] flex items-center justify-center gap-[1.5px] px-1">
                {[2, 1, 3, 1, 2, 1, 2, 3, 1].map((w, i) => (
                  <span
                    key={i}
                    className="h-3 bg-[#020D1F]"
                    style={{ width: `${w}px` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="w-full pb-1.5 px-1.5 text-center">
          <span className="text-[8px] font-mono text-[#A5B8D5] block truncate ov-tabular">
            {side === 'front' ? sku.skuCode : sku.barcode}
          </span>
        </div>
      </div>
    </div>
  );
};

export const ProductCatalogueModule: React.FC<ProductCatalogueModuleProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | CategoryType>('All');
  const [brandFilter, setBrandFilter] = useState('All');
  const [selectedSku, setSelectedSku] = useState<CatalogSku | null>(null);
  const [packshotSide, setPackshotSide] = useState<'front' | 'back'>('front');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const brands = useMemo(() => {
    const base =
      categoryFilter === 'All'
        ? QFI_PRODUCT_CATALOGUE
        : QFI_PRODUCT_CATALOGUE.filter((s) => s.category === categoryFilter);
    return Array.from(new Set(base.map((s) => s.brand)));
  }, [categoryFilter]);

  const filteredSkus = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return QFI_PRODUCT_CATALOGUE.filter((s) => {
      if (categoryFilter !== 'All' && s.category !== categoryFilter) return false;
      if (brandFilter !== 'All' && s.brand !== brandFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.brand.toLowerCase().includes(q) ||
        s.skuCode.toLowerCase().includes(q) ||
        s.sapItemCode.toLowerCase().includes(q) ||
        s.barcode.includes(q)
      );
    });
  }, [categoryFilter, brandFilter, searchQuery]);

  const handleCopy = (field: string, value: string) => {
    try {
      navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <MoreSubViewHeader
        eyebrow="RESOURCE LIBRARY / SKU MASTER"
        title="PRODUCT CATALOGUE"
        subtitle={`${filteredSkus.length} QFI reference SKU${filteredSkus.length === 1 ? '' : 's'}`}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 pb-28 md:pb-8">
        <div className="max-w-6xl mx-auto space-y-3.5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="relative md:col-span-2">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU name, brand, SAP item code, or barcode..."
                className="w-full min-h-[44px] pl-10 pr-4 rounded-[14px] cockpit-surface-elevated text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[#008DFF]"
              />
            </div>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="min-h-[44px] rounded-[14px] cockpit-surface-elevated px-3 text-xs font-semibold text-[var(--text-primary)]"
            >
              <option value="All">All Brands ({brands.length})</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {(['All', ...CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategoryFilter(cat);
                  setBrandFilter('All');
                }}
                className={`min-h-[38px] px-3.5 rounded-[12px] text-xs font-semibold whitespace-nowrap cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-[#0066FF] text-white'
                    : 'cockpit-surface-elevated text-[var(--text-secondary)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {filteredSkus.length === 0 ? (
            <div className="cockpit-panel rounded-[16px] p-8 text-center space-y-2">
              <Package size={24} className="mx-auto text-[#FFB800]" />
              <p className="font-heading text-lg font-bold uppercase text-[var(--text-primary)]">
                No Matching SKUs
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Adjust category, brand, or search keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredSkus.map((sku) => (
                <button
                  key={sku.skuCode}
                  type="button"
                  onClick={() => {
                    setSelectedSku(sku);
                    setPackshotSide('front');
                  }}
                  className="cockpit-panel rounded-[15px] overflow-hidden text-left hover:border-[#008DFF] transition-all cursor-pointer active:scale-[0.98] flex flex-col"
                >
                  <div className="h-32 border-b border-[#D5E2F2] dark:border-[#104878] relative">
                    <PackshotVisual sku={sku} compact />
                    <span
                      className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full ring-2 ring-[#020D1F]/60"
                      style={{ backgroundColor: sku.brandColor }}
                    />
                  </div>
                  <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className="text-[10px] font-extrabold uppercase tracking-wider"
                          style={{ color: sku.brandColor === '#4B0082' ? '#A78BFA' : sku.brandColor }}
                        >
                          {sku.brand}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] ov-tabular">
                          {sku.packSize}
                        </span>
                      </div>
                      <p className="font-heading text-base font-bold uppercase text-[var(--text-primary)] leading-tight mt-0.5 line-clamp-2">
                        {sku.name}
                      </p>
                    </div>
                    <p className="text-[10px] font-mono text-[var(--text-muted)] pt-1 border-t border-[#D5E2F2]/60 dark:border-[#104878]/60 truncate ov-tabular">
                      {sku.skuCode}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SKU DETAIL MODAL */}
      {selectedSku && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:max-w-lg max-h-[92dvh] flex flex-col cockpit-panel rounded-t-[20px] md:rounded-[20px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#D5E2F2] dark:border-[#104878] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: selectedSku.brandColor }}
                />
                <span className="text-xs font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#00C8FF] truncate">
                  {selectedSku.brand} · {selectedSku.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSku(null)}
                className="min-h-[40px] min-w-[40px] rounded-[10px] cockpit-surface-elevated flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="rounded-[16px] overflow-hidden border border-[#104878] h-52 relative">
                <PackshotVisual sku={selectedSku} side={packshotSide} />
                <div className="absolute bottom-2.5 right-2.5 flex rounded-[10px] bg-[#020D1F]/85 border border-[#104878] p-0.5">
                  <button
                    type="button"
                    onClick={() => setPackshotSide('front')}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold cursor-pointer ${
                      packshotSide === 'front' ? 'bg-[#0066FF] text-white' : 'text-[#A5B8D5]'
                    }`}
                  >
                    Front
                  </button>
                  <button
                    type="button"
                    onClick={() => setPackshotSide('back')}
                    className={`px-2.5 py-1 rounded-[8px] text-[10px] font-semibold cursor-pointer ${
                      packshotSide === 'back' ? 'bg-[#0066FF] text-white' : 'text-[#A5B8D5]'
                    }`}
                  >
                    Back
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-extrabold uppercase text-[var(--text-primary)]">
                  {selectedSku.name}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {selectedSku.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: 'SKU Code', value: selectedSku.skuCode, copyable: true },
                  { label: 'SAP Item Code', value: selectedSku.sapItemCode, copyable: true },
                  { label: 'Barcode (EAN-13)', value: selectedSku.barcode, copyable: true },
                  { label: 'Pack Size', value: selectedSku.packSize, copyable: false },
                  {
                    label: 'Packaging Config',
                    value: selectedSku.packagingConfig,
                    copyable: false,
                    span2: true
                  }
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`cockpit-surface-elevated rounded-[12px] p-2.5 ${
                      item.span2 ? 'col-span-2' : ''
                    }`}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      {item.label}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-xs font-mono font-semibold text-[var(--text-primary)] ov-tabular">
                        {item.value}
                      </p>
                      {item.copyable && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item.label, item.value)}
                          className="text-[#0066FF] dark:text-[#00C8FF] cursor-pointer"
                          title={`Copy ${item.label}`}
                        >
                          {copiedField === item.label ? <Check size={13} /> : <Copy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
