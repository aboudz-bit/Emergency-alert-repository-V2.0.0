// Map styling that mirrors the KEAS mobile maps EXACTLY (GoogleMapsView.tsx /
// LeafletPreviewFallback.tsx) so the web command center is visually identical.
import { KEAS_COLORS, personnelColor } from "@workspace/keas-core";

export { personnelColor };

// Tiles — the same Esri World Imagery satellite + transportation labels the
// mobile web map uses (no API key required). CartoDB voyager for the street view.
export const TILES = {
  satellite:
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  labels:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}",
  street:
    "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
} as const;

// Zone polygon fill — mirrors mobile opacity suffixes:
// selected 0x59 (35%), active 0x33 (20%), inactive/dimmed 0x14 (8%).
export function zoneFill(color: string, opts: { selected?: boolean; active?: boolean }): string {
  const suffix = opts.selected ? "59" : opts.active ? "33" : "14";
  return color + suffix;
}
export function zoneStroke(color: string, active: boolean): string {
  return active ? color : "#6B7280";
}

// Hazard ring colors — exact mobile values (GoogleMapsView hazard block).
export const HAZARD = {
  cold: { stroke: "#34D399", fill: "#34D399", fillOpacity: 0.08 },
  warm: { stroke: "#FBBF24", fill: "#FBBF24", fillOpacity: 0.12 },
  hot: { stroke: "#F87171", fill: "#F87171", fillOpacity: 0.18 },
  plume: { stroke: "#F87171", fill: "#F87171", fillOpacity: 0.18 },
} as const;

// Street / ECO route colors — exact mobile values.
export const STREET = {
  route: KEAS_COLORS.routeActive, // #10B981 — street is part of an active ECO route
  normal: KEAS_COLORS.streetNormal, // #9CA3AF
  selected: KEAS_COLORS.streetSelected, // #3B82F6
} as const;

export const SHELTER_COLOR = KEAS_COLORS.amber; // #D97706 (mobile shelter markers)

// Downwind plume cone — ported verbatim from mobile GoogleMapsView.plumeCone.
function offsetLatLng(lat: number, lng: number, distM: number, bearingDeg: number): [number, number] {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(b)) / 111320;
  const dLng = (distM * Math.sin(b)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return [lat + dLat, lng + dLng];
}

export function plumeCone(hz: {
  centerLat: number;
  centerLng: number;
  windDirectionDeg?: number | null;
  coldRadius: number;
  warmRadius: number;
  hotRadius: number;
}): [number, number][] {
  const dir = hz.windDirectionDeg ?? 0;
  const r = hz.coldRadius || hz.warmRadius || hz.hotRadius || 300;
  const half = 30;
  const pts: [number, number][] = [[hz.centerLat, hz.centerLng]];
  for (let a = -half; a <= half; a += 10) {
    pts.push(offsetLatLng(hz.centerLat, hz.centerLng, r, dir + a));
  }
  return pts;
}

// Default view — Khurais CPF area (used only when no geometry is available yet).
export const DEFAULT_CENTER: [number, number] = [25.131, 48.776];
export const DEFAULT_ZOOM = 13;
