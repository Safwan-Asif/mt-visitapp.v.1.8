import React, { useMemo } from 'react';
import { Marker } from 'react-leaflet';
import L from 'leaflet';
import {
  MapOutlet,
  PerformanceLayerId,
  getDaysSinceLastVisit
} from '../../data/data';

export interface PinVisualSpec {
  primaryHex: string;
  highlightHex: string;
  shadeHex: string;
  primaryGlow: string;
  secondaryAlertHex: string | null;
  secondaryLabel: string | null;
  showCheckmark: boolean;
  centerLabel: string | null;
  centerMode: 'check' | 'alert' | 'store' | 'label';
}

const PIN_PALETTE = {
  blue: {
    hex: '#1D8EFF',
    highlight: '#60B5FF',
    shade: '#0B5ED7',
    glow: 'rgba(29, 142, 255, 0.72)'
  },
  green: {
    hex: '#22C55E',
    highlight: '#4ADE80',
    shade: '#15803D',
    glow: 'rgba(34, 197, 94, 0.68)'
  },
  grey: {
    hex: '#64748B',
    highlight: '#94A3B8',
    shade: '#334155',
    glow: 'rgba(100, 116, 139, 0.50)'
  },
  orange: {
    hex: '#F59E0B',
    highlight: '#FBBF24',
    shade: '#B45309',
    glow: 'rgba(245, 158, 11, 0.70)'
  },
  red: {
    hex: '#EF4444',
    highlight: '#F87171',
    shade: '#B91C1C',
    glow: 'rgba(239, 68, 68, 0.75)'
  }
};

/**
 * Resolve primary pin color from the active single-select visualization layer
 * while preserving visitStatus vs healthStatus independence via secondary badges.
 */
export function resolveOutletPinVisual(
  outlet: MapOutlet,
  activeLayer: PerformanceLayerId
): PinVisualSpec {
  const hasAudit = outlet.hasAuditHistory !== false;
  const healthBadge = !hasAudit
    ? null
    : outlet.healthStatus === 'critical'
    ? PIN_PALETTE.red.hex
    : outlet.healthStatus === 'attention'
    ? PIN_PALETTE.orange.hex
    : null;

  const visitBadge =
    outlet.visitStatus === 'completed'
      ? PIN_PALETTE.green.hex
      : outlet.visitStatus === 'planned'
      ? PIN_PALETTE.blue.hex
      : null;

  const isCompleted = outlet.visitStatus === 'completed';

  let centerMode: 'check' | 'alert' | 'store' | 'label' = isCompleted ? 'check' : 'store';
  let labelValue: string | null = null;
  let primaryTone = PIN_PALETTE.blue;
  let secondaryAlertHex: string | null = healthBadge;
  let secondaryLabel: string | null =
    hasAudit && outlet.healthStatus !== 'healthy' ? outlet.healthStatus : null;

  if (activeLayer === 'visit_status') {
    primaryTone =
      outlet.visitStatus === 'completed'
        ? PIN_PALETTE.green
        : outlet.visitStatus === 'planned'
        ? PIN_PALETTE.blue
        : PIN_PALETTE.grey;
    centerMode = isCompleted ? 'check' : 'store';
  } else if (!hasAudit) {
    primaryTone = PIN_PALETTE.grey;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    centerMode = isCompleted ? 'check' : 'store';
  } else if (activeLayer === 'sos_performance') {
    primaryTone =
      outlet.sosScore < 3.4
        ? PIN_PALETTE.red
        : outlet.sosScore < 3.8
        ? PIN_PALETTE.orange
        : PIN_PALETTE.green;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    centerMode = outlet.sosScore < 3.8 ? 'alert' : isCompleted ? 'check' : 'store';
  } else if (activeLayer === 'planogram_compliance') {
    primaryTone =
      outlet.planogramPercentage < 70
        ? PIN_PALETTE.red
        : outlet.planogramPercentage < 82
        ? PIN_PALETTE.orange
        : PIN_PALETTE.green;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    centerMode =
      outlet.planogramPercentage < 82 ? 'alert' : isCompleted ? 'check' : 'store';
  } else if (activeLayer === 'out_of_stock') {
    primaryTone =
      outlet.oosSkuCount >= 4
        ? PIN_PALETTE.red
        : outlet.oosSkuCount >= 1
        ? PIN_PALETTE.orange
        : PIN_PALETTE.green;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    if (outlet.oosSkuCount > 0) {
      centerMode = 'label';
      labelValue = String(outlet.oosSkuCount);
    } else {
      centerMode = isCompleted ? 'check' : 'store';
    }
  } else if (activeLayer === 'priority_outlets') {
    primaryTone =
      outlet.healthStatus === 'critical'
        ? PIN_PALETTE.red
        : outlet.healthStatus === 'attention'
        ? PIN_PALETTE.orange
        : outlet.scheduledForToday
        ? PIN_PALETTE.blue
        : PIN_PALETTE.grey;
    secondaryAlertHex =
      outlet.visitStatus === 'completed' ? PIN_PALETTE.green.hex : null;
    secondaryLabel = outlet.visitStatus;
    centerMode =
      outlet.healthStatus === 'critical' || outlet.healthStatus === 'attention'
        ? 'alert'
        : isCompleted
        ? 'check'
        : 'store';
  } else {
    const days = getDaysSinceLastVisit(outlet.lastVisitDate);
    primaryTone =
      days < 0
        ? PIN_PALETTE.grey
        : days >= 8
        ? PIN_PALETTE.red
        : days >= 4
        ? PIN_PALETTE.orange
        : PIN_PALETTE.green;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    centerMode = isCompleted ? 'check' : 'store';
  }

  return {
    primaryHex: primaryTone.hex,
    highlightHex: primaryTone.highlight,
    shadeHex: primaryTone.shade,
    primaryGlow: primaryTone.glow,
    secondaryAlertHex,
    secondaryLabel,
    showCheckmark: centerMode === 'check',
    centerLabel:
      centerMode === 'alert' ? '!' : centerMode === 'label' ? labelValue : null,
    centerMode
  };
}

/**
 * Larger 3D-styled Leaflet teardrop location pin DivIcon with visit-order badge,
 * specular shading, sharper inner icons, secondary health/visit dot, and animated cyan halo.
 */
export function createOutletPinIcon(
  outlet: MapOutlet,
  activeLayer: PerformanceLayerId,
  isSelected: boolean
): L.DivIcon {
  const spec = resolveOutletPinVisual(outlet, activeLayer);
  const scale = isSelected ? 1.15 : 1;
  const gradId = `pin3d-${outlet.id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const haloHtml = isSelected
    ? `<span class="marviz-selected-halo" style="position:absolute;left:50%;top:43%;width:58px;height:58px;border-radius:9999px;border:2.5px solid #38BDF8;background:rgba(56,189,248,0.25);box-shadow:0 0 24px rgba(56,189,248,0.95);pointer-events:none;"></span>`
    : '';

  const orderBadgeHtml =
    outlet.scheduledForToday && outlet.visitOrder !== null
      ? `<span style="position:absolute;top:0px;left:0px;min-width:17px;height:17px;padding:0 3px;border-radius:9999px;background:#071421;border:1.5px solid #38BDF8;color:#E0F2FE;font-size:10px;font-weight:800;font-family:'Barlow Condensed',sans-serif;display:flex;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 6px rgba(0,0,0,0.75);">${outlet.visitOrder}</span>`
      : '';

  const secondaryDotHtml = spec.secondaryAlertHex
    ? `<span style="position:absolute;top:1px;right:1px;width:12px;height:12px;border-radius:9999px;background:${spec.secondaryAlertHex};border:2px solid #071421;box-shadow:0 2px 6px rgba(0,0,0,0.75);"></span>`
    : '';

  const storeSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 12v8h14v-8"/></svg>`;
  const checkSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const alertHtml = `<span style="font-size:15px;font-weight:900;color:#FFFFFF;line-height:1;font-family:'Inter',sans-serif;">!</span>`;

  const innerSymbolHtml =
    spec.centerMode === 'check'
      ? checkSvg
      : spec.centerMode === 'alert'
      ? alertHtml
      : spec.centerMode === 'label' && spec.centerLabel
      ? `<span style="font-size:${spec.centerLabel.length > 2 ? '9.5px' : '11px'};font-weight:800;color:#FFFFFF;line-height:1;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.02em;">${spec.centerLabel}</span>`
      : storeSvg;

  const html = `
    <div style="position:relative;width:52px;height:58px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      ${haloHtml}
      <div style="position:relative;width:40px;height:48px;transform:scale(${scale});transition:transform 160ms ease;filter:drop-shadow(0 6px 12px ${spec.primaryGlow}) drop-shadow(0 2px 4px rgba(0,0,0,0.65));">
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="${gradId}" x1="8" y1="2" x2="32" y2="44" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="${spec.highlightHex}" />
              <stop offset="52%" stop-color="${spec.primaryHex}" />
              <stop offset="100%" stop-color="${spec.shadeHex}" />
            </linearGradient>
          </defs>
          <path d="M20 2C10.0589 2 2 10.0589 2 20C2 32.6 20 46 20 46C20 46 38 32.6 38 20C38 10.0589 29.9411 2 20 2Z" fill="url(#${gradId})" stroke="${isSelected ? '#E0F2FE' : '#061221'}" stroke-width="${isSelected ? '2.5' : '2'}"/>
          <path d="M10 11C12.8 6.8 16.5 5 20 5C23.5 5 27.2 6.8 30 11" stroke="rgba(255,255,255,0.45)" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        <div style="position:absolute;top:7px;left:50%;transform:translateX(-50%);width:24px;height:24px;border-radius:9999px;background:rgba(6,16,30,0.34);border:1px solid rgba(255,255,255,0.22);display:flex;align-items:center;justify-content:center;">
          ${innerSymbolHtml}
        </div>
        ${orderBadgeHtml}
        ${secondaryDotHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'marviz-pin-icon',
    html,
    iconSize: [52, 58],
    iconAnchor: [26, 50]
  });
}

/**
 * Pulsing cyan-blue executive directional navigation arrowhead beacon.
 */
export function createExecutiveBeaconIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:58px;height:58px;pointer-events:none;">
      <span class="marviz-beacon-ring" style="position:absolute;left:50%;top:50%;width:34px;height:34px;border-radius:9999px;background:rgba(56,189,248,0.34);border:1.5px solid rgba(56,189,248,0.85);"></span>
      <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:9999px;background:rgba(22,133,255,0.24);border:1px solid rgba(125,211,252,0.5);box-shadow:0 0 20px rgba(56,189,248,0.7);"></span>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:28px;height:28px;border-radius:9999px;background:rgba(8,26,48,0.94);border:2px solid #7DD3FC;display:flex;align-items:center;justify-content:center;box-shadow:0 0 16px rgba(56,189,248,0.95);">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="#38BDF8" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round">
          <polygon points="12 3 20 20 12 16 4 20 12 3"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'marviz-pin-icon',
    html,
    iconSize: [58, 58],
    iconAnchor: [29, 29]
  });
}

export interface OutletPinProps {
  outlet: MapOutlet;
  activeLayer: PerformanceLayerId;
  isSelected: boolean;
  onSelect: (outlet: MapOutlet) => void;
}

export const OutletPin: React.FC<OutletPinProps> = ({
  outlet,
  activeLayer,
  isSelected,
  onSelect
}) => {
  const icon = useMemo(
    () => createOutletPinIcon(outlet, activeLayer, isSelected),
    [outlet, activeLayer, isSelected]
  );

  return (
    <Marker
      position={[outlet.latitude, outlet.longitude]}
      icon={icon}
      zIndexOffset={isSelected ? 900 : outlet.scheduledForToday ? 240 : 120}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onSelect(outlet);
        }
      }}
    />
  );
};
