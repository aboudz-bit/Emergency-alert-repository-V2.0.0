import { useMemo } from "react";
import { useStore } from "@/store";
import type { PersonnelLocation } from "@/types";

export interface PersonnelMapEntry {
  userId: number;
  lat: number;
  lng: number;
  status: string;
  name: string;
}

export function useVisiblePersonnel(opts: {
  scope: "all" | "location" | "zone";
  locationId?: number | null;
  zoneId?: number | null;
  excludeSelf?: boolean;
}): PersonnelMapEntry[] {
  const personnelLocations = useStore((s) => s.personnelLocations);
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);

  return useMemo(() => {
    if (opts.scope === "location" && opts.locationId == null) return [];
    if (opts.scope === "zone" && opts.zoneId == null) return [];

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
      entries.push({
        userId: loc.userId,
        lat: loc.lat,
        lng: loc.lng,
        status: user?.status ?? "pending",
        name: user?.name ?? `User ${loc.userId}`,
      });
    }

    return entries;
  }, [personnelLocations, users, currentUser?.id, opts.scope, opts.locationId, opts.zoneId, opts.excludeSelf]);
}
