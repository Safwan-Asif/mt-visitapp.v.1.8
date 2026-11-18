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
  primaryGlow: string;
  secondaryAlertHex: string | null;
  secondaryLabel: string | null;
  showCheckmark: boolean;
  centerLabel: string | null;
  centerMode: 'check' | 'alert' | 'store' | 'label';
}

const PIN_PALETTE = {
  blue: { hex: '#1D8EFF', glow: 'rgba(29, 142, 255, 0.55)' },
  green: { hex: '#22C55E', glow: 'rgba(34, 197, 94, 0.50)' },
  grey: { hex: '#64748B', glow: 'rgba(100, 116, 139, 0.35)' },
  orange: { hex: '#F59E0B', glow: 'rgba(245, 158, 11, 0.55)' },
  red: { hex: '#EF4444', glow: 'rgba(239, 68, 68, 0.62)' }
};

/**
 * Resolve primary pin color from the active single-select visualization layer
 * while preserving visitStatus vs healthStatus independence via secondary badges.
 */
export function resolveOutletPinVisual(
  outlet: MapOutlet,
  activeLayer: PerformanceLayerId
): PinVisualSpec {
  const healthBadge =
    outlet.healthStatus === 'critical'
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
  const orderLabel =
    outlet.scheduledForToday && outlet.visitOrder !== null && !isCompleted
      ? String(outlet.visitOrder)
      : null;

  let centerMode: 'check' | 'alert' | 'store' | 'label' = isCompleted ? 'check' : 'store';
  let labelValue: string | null = null;
  let primaryTone = PIN_PALETTE.blue;
  let secondaryAlertHex: string | null = healthBadge;
  let secondaryLabel: string | null =
    outlet.healthStatus !== 'healthy' ? outlet.healthStatus : null;

  if (activeLayer === 'visit_status') {
    primaryTone =
      outlet.visitStatus === 'completed'
        ? PIN_PALETTE.green
        : outlet.visitStatus === 'planned'
        ? PIN_PALETTE.blue
        : PIN_PALETTE.grey;
    // Show ! if attention/critical on non-completed outlets when visit_status is active? Keep primary visit color and crisp secondary ring, OR if priority/health alert show ! inside when unscheduled/attention? Keep storefront for planned/unplanned and check for completed + crisp alert corner badge so Visit Status and Health stay strictly independent!
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
    centerMode =
      outlet.sosScore < 3.8 ? 'alert' : isCompleted ? 'check' : 'store';
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
    // activeLayer === 'last_visit'
    const days = getDaysSinceLastVisit(outlet.lastVisitDate);
    primaryTone =
      days >= 8
        ? PIN_PALETTE.red
        : days >= 4
        ? PIN_PALETTE.orange
        : PIN_PALETTE.green;
    secondaryAlertHex = visitBadge;
    secondaryLabel = outlet.visitStatus;
    if (days > 0) {
      centerMode = 'label';
      labelValue = `${days}d`;
    } else {
      centerMode = isCompleted ? 'check' : 'store';
    }
  }

  return {
    primaryHex: primaryTone.hex,
    primaryGlow: primaryTone.glow,
    secondaryAlertHex,
    secondaryLabel,
    showCheckmark: centerMode === 'check',
    centerLabel:
      centerMode === 'alert'
        ? '!'
        : centerMode === 'label'
        ? labelValue
        : orderLabel && centerMode === 'store'
        ? null
        : null,
    centerMode
  };
}

/**
 * Build a custom Leaflet teardrop location pin DivIcon with a 44x44 tap target,
 * storefront/check/alert glyph, optional secondary status ring/dot, and selected cyan halo.
 */
export function createOutletPinIcon(
  outlet: MapOutlet,
  activeLayer: PerformanceLayerId,
  isSelected: boolean
): L.DivIcon {
  const spec = resolveOutletPinVisual(outlet, activeLayer);
  const scale = isSelected ? 1.18 : 1;

  const haloHtml = isSelected
    ? `<span class="marviz-selected-halo" style="position:absolute;left:50%;top:42%;width:46px;height:46px;border-radius:9999px;border:2px solid #38BDF8;background:rgba(56,189,248,0.24);box-shadow:0 0 20px rgba(56,189,248,0.9);pointer-events:none;"></span>`
    : '';

  const secondaryDotHtml = spec.secondaryAlertHex
    ? `<span style="position:absolute;top:1px;right:3px;width:10px;height:10px;border-radius:9999px;background:${spec.secondaryAlertHex};border:2px solid #071421;box-shadow:0 0 6px rgba(0,0,0,0.65);"></span>`
    : '';

  const storeSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M5 12v8h14v-8"/></svg>`;
  const checkSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  const alertHtml = `<span style="font-size:13px;font-weight:900;color:#FFFFFF;line-height:1;font-family:'Inter',sans-serif;">!</span>`;

  const innerSymbolHtml =
    spec.centerMode === 'check'
      ? checkSvg
      : spec.centerMode === 'alert'
      ? alertHtml
      : spec.centerMode === 'label' && spec.centerLabel
      ? `<span style="font-size:${spec.centerLabel.length > 2 ? '8.5px' : '10px'};font-weight:800;color:#FFFFFF;line-height:1;font-family:'Barlow Condensed',sans-serif;letter-spacing:0.02em;">${spec.centerLabel}</span>`
      : storeSvg;

  const html = `
    <div style="position:relative;width:44px;height:48px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      ${haloHtml}
      <div style="position:relative;width:30px;height:36px;transform:scale(${scale});transition:transform 160ms ease;filter:drop-shadow(0 4px 10px ${spec.primaryGlow});">
        <svg width="30" height="36" viewBox="0 0 30 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 1C7.8203 1 2 6.8203 2 14C2 23.25 15 35 15 35C15 35 28 23.25 28 14C28 6.8203 22.1797 1 15 1Z" fill="${spec.primaryHex}" stroke="${isSelected ? '#E0F2FE' : '#071421'}" stroke-width="${isSelected ? '2.2' : '1.8'}"/>
        </svg>
        <div style="position:absolute;top:5px;left:50%;transform:translateX(-50%);width:18px;height:18px;border-radius:9999px;background:rgba(7,20,33,0.28);display:flex;align-items:center;justify-content:center;">
          ${innerSymbolHtml}
        </div>
        ${secondaryDotHtml}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'marviz-pin-icon',
    html,
    iconSize: [44, 48],
    iconAnchor: [22, 42]
  });
}

/**
 * Pulsing cyan-blue executive directional navigation arrowhead beacon.
 */
export function createExecutiveBeaconIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:54px;height:54px;pointer-events:none;">
      <span class="marviz-beacon-ring" style="position:absolute;left:50%;top:50%;width:30px;height:30px;border-radius:9999px;background:rgba(56,189,248,0.34);border:1.5px solid rgba(56,189,248,0.85);"></span>
      <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:9999px;background:rgba(22,133,255,0.22);border:1px solid rgba(125,211,252,0.45);box-shadow:0 0 18px rgba(56,189,248,0.65);"></span>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:26px;height:26px;border-radius:9999px;background:rgba(8,26,48,0.92);border:2px solid #7DD3FC;display:flex;align-items:center;justify-content:center;box-shadow:0 0 14px rgba(56,189,248,0.95);">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#38BDF8" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round">
          <polygon points="12 3 20 20 12 16 4 20 12 3"/>
        </svg>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'marviz-pin-icon',
    html,
    iconSize: [54, 54],
    iconAnchor: [27, 27]
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
      zIndexOffset={isSelected ? 900 : outlet.scheduledForToday ? 200 : 100}
      eventHandlers={{
        click: (e) => {
          L.DomEvent.stopPropagation(e);
          onSelect(outlet);
        }
      }}
    />
  );
};

