import type { LatLng } from "@/types";

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

/** Forward geodesic: point at `bearingDeg` (0=N, 90=E) and `distanceM` from origin. */
export function destinationPoint(
  lat: number,
  lng: number,
  bearingDeg: number,
  distanceM: number,
): LatLng {
  const R = 6371000;
  const br = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;
  const dr = distanceM / R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(br),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(dr) * Math.cos(lat1),
      Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

/**
 * Simple downwind plume wedge (cone) — NOT a scientific dispersion model.
 * Returns a closed polygon: center → arc across ±halfAngle around the downwind
 * bearing at `radiusM` → back to center.
 */
export function plumeWedgePoints(
  center: LatLng,
  bearingDeg: number,
  radiusM: number,
  halfAngleDeg = 28,
  steps = 10,
): LatLng[] {
  const pts: LatLng[] = [{ lat: center.lat, lng: center.lng }];
  const start = bearingDeg - halfAngleDeg;
  const end = bearingDeg + halfAngleDeg;
  for (let i = 0; i <= steps; i++) {
    const b = start + ((end - start) * i) / steps;
    pts.push(destinationPoint(center.lat, center.lng, b, radiusM));
  }
  pts.push({ lat: center.lat, lng: center.lng });
  return pts;
}

export function pointInPolygon(pt: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat,
      yi = polygon[i].lng;
    const xj = polygon[j].lat,
      yj = polygon[j].lng;
    const intersect =
      yi > pt.lng !== yj > pt.lng &&
      pt.lat < ((xj - xi) * (pt.lng - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function findContainingLocationId(
  pt: LatLng,
  locations: { id: number; polygonPoints: LatLng[] }[]
): number | null {
  for (const loc of locations) {
    if (loc.polygonPoints.length >= 3 && pointInPolygon(pt, loc.polygonPoints)) {
      return loc.id;
    }
  }
  return null;
}

export function findBestShelter<
  T extends { id: number; lat: number; lng: number; isActive: boolean; linkedLocationIds: number[]; zoneId?: number }
>(
  userLocation: LatLng,
  shelters: T[],
  detectedLocationId: number | null,
  userZoneId: number | null
): { shelter: T; distance: number } | null {
  const active = shelters.filter((s) => s.isActive);
  if (active.length === 0) return null;

  let candidates = active;

  if (detectedLocationId != null) {
    const linked = active.filter((s) =>
      (s.linkedLocationIds || []).includes(detectedLocationId)
    );
    if (linked.length > 0) candidates = linked;
  }

  if (candidates.length === active.length && userZoneId != null) {
    const zoneFiltered = active.filter((s) => s.zoneId === userZoneId);
    if (zoneFiltered.length > 0) candidates = zoneFiltered;
  }

  let best: T | null = null;
  let minDist = Infinity;
  for (const s of candidates) {
    const d = haversineDistance(userLocation.lat, userLocation.lng, s.lat, s.lng);
    if (d < minDist) {
      minDist = d;
      best = s;
    }
  }
  return best ? { shelter: best, distance: minDist } : null;
}
