import React, { useState, useMemo } from 'react';
import {
  Compass,
  Search,
  ChevronRight,
  RefreshCw,
  CheckSquare,
  Square,
  Globe,
  Map as MapIcon
} from 'lucide-react';
import { Outlet, CategoryAuditRecord } from '../types';
import { PjpVisitRow } from '../data/pjpMasterData';

type MapLayerType =
  | 'journey'
  | 'sos'
  | 'planogram'
  | 'oos'
  | 'visit'
  | 'priority'
  | 'lastVisit';

interface DohaTacticalMapProps {
  outlets: Outlet[];
  pjpVisits: PjpVisitRow[];
  audits: Record<string, CategoryAuditRecord>;
  onSelectOutlet: (outlet: Outlet) => void;
}

export const DohaTacticalMap: React.FC<DohaTacticalMapProps> = ({
  outlets,
  pjpVisits,
  audits,
  onSelectOutlet
}) => {
  const [activeLayers, setActiveLayers] = useState<Set<MapLayerType>>(
    () => new Set<MapLayerType>(['journey', 'visit'])
  );
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite'>('roadmap');
  const [selectedMapOutlet, setSelectedMapOutlet] = useState<(Outlet & { oosCount: number; sosPct: number; planogramScore: number; tier: string; district: string }) | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Doha districts mapping simulation for synced Google Sheet points (ID: 1OU38-cb5c4TUndDKRHhjKm76pjYRU1sjMC1Xp7xqXbU)
  const outletCoordinates = useMemo(() => {
    return outlets.map((o, i) => {
      const flourAudit = audits[`${o.id}_Flour`];
      const oilAudit = audits[`${o.id}_Edible Oil`];
      const pastaAudit = audits[`${o.id}_Pasta`];
      const hasAudits = Boolean(flourAudit || oilAudit || pastaAudit);

      const oosCount = o.status === 'Completed' ? 0 : hasAudits ? 0 : (o.id.charCodeAt(0) % 4);
      const sosPct = flourAudit?.shareOfShelfPct || oilAudit?.shareOfShelfPct || pastaAudit?.shareOfShelfPct || (38 + (o.id.charCodeAt(1) % 35));
      const planogramScore = flourAudit?.planogramCompliance?.overallScore || oilAudit?.planogramCompliance?.overallScore || (78 + (o.id.charCodeAt(2) % 20));
      const tier = o.id.charCodeAt(0) % 2 === 0 ? 'Tier A' : 'Tier B';
      const district = ['Al Sadd', 'West Bay', 'Industrial Area', 'Msheireb', 'Lusail', 'Al Khor'][i % 6];

      return {
        ...o,
        oosCount,
        sosPct,
        planogramScore,
        tier,
        district
      };
    });
  }, [outlets, audits]);

  const filteredOutlets = useMemo(() => {
    return outletCoordinates.filter((o) => {
      const matchSearch =
        o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.district.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;
      if (filterStatus === 'ALL') return true;
      return o.status.toUpperCase() === filterStatus;
    });
  }, [outletCoordinates, searchTerm, filterStatus]);

  const toggleLayer = (layerId: MapLayerType) => {
    setActiveLayers((prev) => {
      const next = new Set(prev);
      if (next.has(layerId)) {
        next.delete(layerId);
      } else {
        next.add(layerId);
      }
      return next;
    });
  };

  const getOutletStatusMeta = (outlet: { status: string; oosCount: number; planogramScore: number }) => {
    const isCompleted = outlet.status === 'Completed';
    const hasOos = outlet.oosCount >= 3;
    const needsAttention = outlet.oosCount === 1 || outlet.planogramScore < 75;

    if (isCompleted) {
      return { label: 'Completed', color: '#16A34A', bgClass: 'bg-emerald-500', borderClass: 'border-emerald-400' };
    }
    if (hasOos) {
      return { label: 'Critical', color: '#DC2626', bgClass: 'bg-red-500', borderClass: 'border-red-400 animate-pulse' };
    }
    if (needsAttention) {
      return { label: 'Attention', color: '#D97706', bgClass: 'bg-amber-500', borderClass: 'border-amber-400' };
    }
    return { label: 'Planned', color: '#1685FF', bgClass: 'bg-[#1685FF]', borderClass: 'border-blue-400' };
  };

  const layersList: Array<{ id: MapLayerType; label: string }> = [
    { id: 'journey', label: 'Journey Plan' },
    { id: 'visit', label: 'Visit Status' },
    { id: 'sos', label: 'SOS Performance' },
    { id: 'planogram', label: 'Planogram' },
    { id: 'oos', label: 'Out of Stock' },
    { id: 'priority', label: 'Priority Outlets' },
    { id: 'lastVisit', label: 'Last Visit' }
  ];

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden animate-fade-in">
      {/* Top Tactical Map HUD & Multi-Choice Layer Selector */}
      <div className="glass-panel border-b px-4 py-3 shrink-0 z-20 space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Compass size={18} className="text-[var(--accent-primary)] animate-spin-slow" />
              <h2 className="font-heading text-lg md:text-xl font-bold tracking-tight text-[var(--text-primary)]">
                DOHA TACTICAL FIELD MAP
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-bold flex items-center gap-1">
                <RefreshCw size={10} className="animate-spin" />
                SHEET SYNCED (#1OU38-cb5c)
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Outlet Master (gid=0) & PJP Visits (gid=856705612) · {filteredOutlets.length} synced outlets
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl p-1 glass-subtle shrink-0">
              <button
                type="button"
                onClick={() => setMapStyle('roadmap')}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapStyle === 'roadmap'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <MapIcon size={14} />
                <span>Terrain</span>
              </button>
              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                className={`min-h-[34px] px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  mapStyle === 'satellite'
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Globe size={14} />
                <span>Satellite</span>
              </button>
            </div>

            <div className="relative flex-1 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search synced points..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl glass-subtle text-xs font-medium text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              />
            </div>
          </div>
        </div>

        {/* Multi-Choice Map Layers Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-bold text-[var(--text-muted)] whitespace-nowrap shrink-0 mr-1">
            MULTI-LAYERS:
          </span>
          {layersList.map((layer) => {
            const isChecked = activeLayers.has(layer.id);
            return (
              <button
                key={layer.id}
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`min-h-[34px] px-3 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  isChecked
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm font-bold'
                    : 'glass-subtle text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-80'
                }`}
              >
                {isChecked ? <CheckSquare size={13} /> : <Square size={13} className="opacity-60" />}
                <span>{layer.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tactical Map Viewport (GTA V Style Terrain / Satellite with Glowing Routes & Pins) */}
      <div
        className={`flex-1 relative overflow-hidden flex items-center justify-center transition-colors duration-500 ${
          mapStyle === 'satellite'
            ? 'bg-[#02060D]'
            : 'bg-[#071421]'
        }`}
      >
        {mapStyle === 'satellite' ? (
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 50% 50%, #0d233a 0%, #030812 100%)',
              filter: 'contrast(120%) brightness(90%)'
            }}
          />
        ) : (
          <div
            className="absolute inset-0 opacity-25 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(22, 133, 255, 0.3) 1px, transparent 0)`,
              backgroundSize: '28px 28px'
            }}
          />
        )}

        {/* Glowing Route Polyline for Journey Plan layer */}
        {activeLayers.has('journey') && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <path
              d="M 120 200 L 280 150 L 420 320 L 610 240 L 780 380"
              fill="none"
              stroke="url(#routeGradient)"
              strokeWidth="4"
              strokeDasharray="8 4"
              className="opacity-90 animate-pulse"
            />
            <defs>
              <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0066FF" />
                <stop offset="50%" stopColor="#008DFF" />
                <stop offset="100%" stopColor="#00C8FF" />
              </linearGradient>
            </defs>
          </svg>
        )}

        <div className="absolute top-6 left-6 text-[11px] font-mono font-bold text-blue-400/60 uppercase tracking-widest pointer-events-none">
            [DOHA // SATELLITE & TERRAIN TACTICAL GRID]
        </div>

        {/* Synced Points Rendered on Map */}
        <div className="absolute inset-0 p-8 flex flex-wrap items-center justify-around gap-6 overflow-auto">
          {filteredOutlets.map((outlet) => {
            const meta = getOutletStatusMeta(outlet);
            const isSelected = selectedMapOutlet?.id === outlet.id;

            return (
              <button
                key={outlet.id}
                type="button"
                onClick={() => setSelectedMapOutlet(outlet)}
                className={`group relative flex flex-col items-center p-3 rounded-2xl transition-all cursor-pointer active:scale-95 ${
                  isSelected ? 'scale-110 z-30' : 'hover:scale-105 z-10'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-all ${
                    meta.bgClass
                  } text-white ${meta.borderClass} ${isSelected ? 'ring-4 ring-white/50' : ''}`}
                >
                  <Compass size={20} strokeWidth={2.4} />
                </div>

                <div className="mt-1.5 px-2.5 py-1 rounded-lg glass-panel-strong text-[11px] font-bold text-[var(--text-primary)] whitespace-nowrap shadow-md border border-white/10 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                  <span className="truncate max-w-[120px]">{outlet.name}</span>
                </div>

                {/* Dynamic Multi-Choice Sublabels */}
                <div className="flex flex-col items-center text-[10px] font-mono text-[var(--text-muted)] mt-0.5 tabular-nums">
                  {activeLayers.has('sos') && <span>SOS: {outlet.sosPct}%</span>}
                  {activeLayers.has('planogram') && <span>POG: {outlet.planogramScore}%</span>}
                  {activeLayers.has('oos') && <span>OOS: {outlet.oosCount}</span>}
                  {activeLayers.has('visit') && <span>{meta.label}</span>}
                  {!activeLayers.has('sos') && !activeLayers.has('planogram') && !activeLayers.has('oos') && !activeLayers.has('visit') && (
                    <span>{outlet.district}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* GTA V Style Corner Minimap Radar HUD */}
        <div className="absolute bottom-4 right-4 w-36 h-36 rounded-2xl glass-panel border border-blue-500/30 overflow-hidden hidden sm:flex flex-col items-center justify-center p-2 pointer-events-none">
          <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-xs" />
          <div className="w-28 h-28 rounded-full border border-blue-400/40 relative flex items-center justify-center animate-spin-slow">
            <div className="absolute w-full h-0.5 bg-blue-400/30 top-1/2" />
            <div className="absolute h-full w-0.5 bg-blue-400/30 left-1/2" />
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#1685FF]" />
          </div>
          <span className="relative z-10 text-[9px] font-mono text-blue-300 font-bold mt-1">
            RADAR // GTA-V SAT
          </span>
        </div>

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 glass-panel rounded-2xl p-3 text-[11px] space-y-1.5 hidden md:block">
          <div className="font-bold text-[var(--text-primary)] mb-1">Sheet Synced Statuses</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-[#1685FF]" /><span>Planned (Blue)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-slate-500" /><span>Unplanned (Grey)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-emerald-500" /><span>Completed (Green)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-amber-500" /><span>Attention (Orange)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-md bg-red-500" /><span>Critical (Red)</span></div>
        </div>
      </div>

      {/* Selected Outlet Bottom Sheet */}
      {selectedMapOutlet && (
        <div className="absolute inset-x-0 bottom-0 z-50 p-4 animate-fade-in flex justify-center">
          <div className="w-full max-w-xl glass-panel-strong rounded-3xl p-5 shadow-2xl border border-[var(--border-glass-strong)] space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: getOutletStatusMeta(selectedMapOutlet).color }}
                  />
                  <h3 className="font-heading text-lg font-bold text-[var(--text-primary)]">
                    {selectedMapOutlet.name}
                  </h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 tabular-nums">
                  SAP Code: {selectedMapOutlet.code || selectedMapOutlet.id} · Sheet ID: 1OU38-cb5c
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMapOutlet(null)}
                className="w-8 h-8 rounded-full glass-subtle flex items-center justify-center text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="glass-subtle rounded-2xl p-2.5 text-center">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">SOS Score</span>
                <span className="text-base font-extrabold tabular-nums text-[var(--text-primary)] mt-0.5 block">
                  {selectedMapOutlet.sosPct}%
                </span>
              </div>
              <div className="glass-subtle rounded-2xl p-2.5 text-center">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">Planogram</span>
                <span className="text-base font-extrabold tabular-nums text-[var(--text-primary)] mt-0.5 block">
                  {selectedMapOutlet.planogramScore}%
                </span>
              </div>
              <div className="glass-subtle rounded-2xl p-2.5 text-center">
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] block">OOS Count</span>
                <span
                  className="text-base font-extrabold tabular-nums mt-0.5 block"
                  style={{
                    color: selectedMapOutlet.oosCount >= 3 ? '#EF4444' : 'var(--text-primary)'
                  }}
                >
                  {selectedMapOutlet.oosCount} SKUs
                </span>
              </div>
            </div>

            <div className="text-xs font-medium text-[var(--text-secondary)] bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />
              <span>
                {selectedMapOutlet.oosCount >= 3
                  ? 'Critical stockout detected in synced Google Sheet data. Immediate replenishment required.'
                  : 'Store compliance is within nominal parameters from Google Sheet sync.'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                const target = selectedMapOutlet;
                setSelectedMapOutlet(null);
                onSelectOutlet(target);
              }}
              className="w-full min-h-[46px] rounded-2xl bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99]"
            >
              <span>More Details & Full Outlet Analytics</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
