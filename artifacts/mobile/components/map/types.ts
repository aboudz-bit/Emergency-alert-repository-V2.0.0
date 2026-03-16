import type { LatLng, Zone } from "@/types";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface ZonePolygon {
  id: number;
  name: string;
  coordinates: LatLng[];
  center?: LatLng;
  color: string;
  isActive: boolean;
  isSelected: boolean;
}

export type DrawMode = "none" | "polygon" | "rectangle" | "tap";

export interface ZoneMapProps {
  zones: Zone[];
  selectedZoneId: number | null;
  onZonePress: (zoneId: number) => void;
  height: number;
  showLabels?: boolean;
  editingZoneId?: number | null;
  editingPoints?: LatLng[];
  onEditingPointsChange?: (points: LatLng[]) => void;
  drawMode?: DrawMode;
  onMapTap?: (point: LatLng) => void;
  onMapCenterChange?: (center: LatLng) => void;
  showLocationButton?: boolean;
  tapPointCount?: number;
}

export type MapProvider = "google" | "leaflet-fallback";

export function zoneToPolygon(zone: Zone, selectedId: number | null): ZonePolygon {
  return {
    id: zone.id,
    name: zone.name,
    coordinates: zone.polygonPoints,
    center: zone.center,
    color: zone.color,
    isActive: zone.isActive,
    isSelected: zone.id === selectedId,
  };
}

export function zonesToRegion(zones: Zone[]): MapRegion {
  const allPoints = zones.flatMap((z) => z.polygonPoints);
  if (allPoints.length === 0) {
    return {
      latitude: 25.082,
      longitude: 48.175,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }

  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.4 || 0.03,
    longitudeDelta: (maxLng - minLng) * 1.4 || 0.03,
  };
}

export const KHURAIS_CENTER: MapRegion = {
  latitude: 25.082,
  longitude: 48.175,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};
