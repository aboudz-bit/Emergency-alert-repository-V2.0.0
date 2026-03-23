import { useMemo } from "react";
import { useStore } from "@/store";
import type { PersonnelLocation } from "@/types";

export interface PersonnelMapEntry {
  userId: number;
  lat: number;
  lng: number;
  status: string;
  name: string;
  badge?: string;
  role?: string | null;
  userType?: string;
  mobileNumber?: string;
  assignedLocation?: string;
  assignedLocationId?: number;
  detectedLocation?: string;
  detectedLocationId?: number | null;
  isInsideAssignedLocation?: boolean;
  lastUpdate?: number;
}

export function useVisiblePersonnel(opts: {
  scope: "all" | "location" | "zone";
  locationId?: number | null;
  zoneId?: number | null;
  excludeSelf?: boolean;
  enabled?: boolean;
}): PersonnelMapEntry[] {
  const personnelLocations = useStore((s) => s.personnelLocations);
  const users = useStore((s) => s.users);
  const locations = useStore((s) => s.locations);
  const currentUser = useStore((s) => s.currentUser);

  return useMemo(() => {
    if (opts.enabled === false) return [];
    if (opts.scope === "location" && opts.locationId == null) return [];
    if (opts.scope === "zone" && opts.zoneId == null) return [];

    if (!personnelLocations || typeof personnelLocations !== 'object') return [];

    const entries: PersonnelMapEntry[] = [];
    const locs = Object.values(personnelLocations);

    for (const loc of locs) {
      if (opts.excludeSelf && currentUser && loc.userId === currentUser.id) continue;

      if (opts.scope === "location") {
        if (loc.detectedLocationId !== opts.locationId) continue;
      } else if (opts.scope === "zone") {
        if (loc.zoneId !== opts.zoneId) continue;
      }

      const staleMs = Date.now() - loc.timestamp;
      if (staleMs > 120_000) continue;

      const user = users.find((u) => u.id === loc.userId);
      const assignedLoc = user?.locationId ? locations.find((l) => l.id === user.locationId) : null;
      const detectedLoc = loc.detectedLocationId ? locations.find((l) => l.id === loc.detectedLocationId) : null;
      const isInsideAssigned = !!(assignedLoc && loc.detectedLocationId === assignedLoc.id);
      entries.push({
        userId: loc.userId,
        lat: loc.lat,
        lng: loc.lng,
        status: user?.status ?? "pending",
        name: user?.name ?? `User ${loc.userId}`,
        badge: user?.badge,
        role: user?.role,
        userType: user?.userType ?? "Aramco",
        mobileNumber: user?.mobileNumber ?? "",
        assignedLocation: assignedLoc?.name ?? user?.location ?? "",
        assignedLocationId: assignedLoc?.id ?? user?.locationId ?? 0,
        detectedLocation: detectedLoc?.name ?? "",
        detectedLocationId: loc.detectedLocationId,
        isInsideAssignedLocation: isInsideAssigned,
        lastUpdate: loc.timestamp,
      });
    }

    return entries;
  }, [personnelLocations, users, locations, currentUser?.id, opts.scope, opts.locationId, opts.zoneId, opts.excludeSelf, opts.enabled]);
}
