import type { LatLng, Zone, Shelter, Location, HazardZone, Street } from "@/types";
import type { PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import type { LegendFilter } from "@/components/map/MapLegendCounts";

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
  flyToZoneId?: number | null;
  showCenterCrosshair?: boolean;
  shelters?: Shelter[];
  selectedShelterId?: number | null;
  onShelterPress?: (shelterId: number) => void;
  onShelterMapTap?: (point: LatLng) => void;
  nearestShelterId?: number | null;
  userLocation?: LatLng | null;
  locations?: Location[];
  selectedLocationId?: number | null;
  onLocationPress?: (locationId: number) => void;
  highlightedLocationIds?: number[];
  editingLocationId?: number | null;
  editingLocationPoints?: LatLng[];
  onEditingLocationPointsChange?: (points: LatLng[]) => void;
  personnelLocations?: PersonnelMapEntry[];
  onPersonnelPress?: (userId: number) => void;
  hazardZones?: HazardZone[];
  trackedUserIds?: number[];
  fitTrackedTrigger?: number;
  legendHighlight?: LegendFilter;
  streets?: Street[];
  selectedStreetId?: string | null;
  onStreetPress?: (streetId: string) => void;
  editingStreetId?: string | null;
  editingStreetPoints?: LatLng[];
  onEditingStreetPointsChange?: (points: LatLng[]) => void;
  streetDrawMode?: boolean;
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
