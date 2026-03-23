import type { LatLng, Zone, Shelter, Location, HazardZone } from "@/types";
import type { PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";

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
}

export type MapProvider = "google" | "leaflet-fallback";

export function zoneToPolygon(zone: Zone, selectedId: number | null): ZonePolygon {
  const tag = '[ZONE_MAP:zoneToPolygon]';
  if (!zone) {
    console.error(`${tag} zone is ${zone}`);
    return { id: 0, name: '??', coordinates: [], color: '#999', isActive: false, isSelected: false };
  }
  const safeCoords = Array.isArray(zone.polygonPoints)
    ? zone.polygonPoints.filter((pt) => {
        if (!pt || typeof pt.lat !== 'number' || typeof pt.lng !== 'number' || isNaN(pt.lat) || isNaN(pt.lng)) {
          console.error(`${tag} zone "${zone.name}" dropping bad coord:`, pt);
          return false;
        }
        return true;
      })
    : [];
  if (!Array.isArray(zone.polygonPoints)) {
    console.error(`${tag} zone "${zone.name}" polygonPoints is ${typeof zone.polygonPoints}`);
  }
  return {
    id: zone.id,
    name: zone.name,
    coordinates: safeCoords,
    center: zone.center,
    color: zone.color,
    isActive: zone.isActive,
    isSelected: zone.id === selectedId,
  };
}

export function zonesToRegion(zones: Zone[]): MapRegion {
  const tag = '[ZONE_MAP:zonesToRegion]';
  const DEFAULT_REGION: MapRegion = {
    latitude: 25.082,
    longitude: 48.175,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  if (!Array.isArray(zones)) {
    console.error(`${tag} zones is not array: ${typeof zones}`);
    return DEFAULT_REGION;
  }

  const allPoints = zones.flatMap((z) => {
    if (!z || !Array.isArray(z.polygonPoints)) {
      console.error(`${tag} skipping zone with bad polygonPoints:`, z?.name);
      return [];
    }
    return z.polygonPoints;
  }).filter((p) => {
    if (!p || typeof p.lat !== 'number' || typeof p.lng !== 'number' || isNaN(p.lat) || isNaN(p.lng)) {
      console.error(`${tag} filtering out invalid point:`, p);
      return false;
    }
    return true;
  });

  if (allPoints.length === 0) {
    console.log(`${tag} no valid points, using default region`);
    return DEFAULT_REGION;
  }

  const lats = allPoints.map((p) => p.lat);
  const lngs = allPoints.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const region = {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: (maxLat - minLat) * 1.4 || 0.03,
    longitudeDelta: (maxLng - minLng) * 1.4 || 0.03,
  };

  if (isNaN(region.latitude) || isNaN(region.longitude)) {
    console.error(`${tag} computed region has NaN values:`, region);
    return DEFAULT_REGION;
  }

  return region;
}

export const KHURAIS_CENTER: MapRegion = {
  latitude: 25.082,
  longitude: 48.175,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
};
