import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { findContainingLocationId } from "@/utils/geo";
import type { PersonnelLocation } from "@/types";

const SIMULATION_INTERVAL_MS = 8000;
const JITTER = 0.0003;

/** Compute a base position for a user from their location or zone. */
function computeBasePosition(
  user: { locationId?: number | null; zoneId?: number | null },
  locations: { id: number; polygonPoints: { lat: number; lng: number }[] }[],
  zones: { id: number; center?: { lat: number; lng: number } | null; polygonPoints: { lat: number; lng: number }[] }[],
): { lat: number; lng: number } | null {
  const loc = locations.find((l) => l.id === user.locationId);
  if (loc && loc.polygonPoints.length >= 3) {
    return loc.polygonPoints.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat / loc.polygonPoints.length, lng: acc.lng + p.lng / loc.polygonPoints.length }),
      { lat: 0, lng: 0 },
    );
  }
  const zone = zones.find((z) => z.id === user.zoneId);
  if (zone && zone.center) {
    return { lat: zone.center.lat, lng: zone.center.lng };
  }
  if (zone && zone.polygonPoints.length > 0) {
    return zone.polygonPoints.reduce(
      (acc, p) => ({ lat: acc.lat + p.lat / zone.polygonPoints.length, lng: acc.lng + p.lng / zone.polygonPoints.length }),
      { lat: 0, lng: 0 },
    );
  }
  return null;
}

export function usePersonnelSimulation(enabled: boolean = true) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const basePositionsRef = useRef<Record<number, { lat: number; lng: number }>>({});

  useEffect(() => {
    // Read current user from store snapshot — avoids subscribing to store
    // changes which would cause re-renders and an infinite update loop.
    const { currentUser } = useStore.getState();
    if (!enabled || !currentUser) return;

    const currentUserId = currentUser.id;

    /** Sync basePositions with current store state — add new, remove gone, update moved. */
    function refreshBasePositions() {
      const { users, locations, zones } = useStore.getState();
      const activeUsers = users.filter(
        (u) => u.isActive && u.id !== currentUserId && u.accountStatus === "active",
      );

      const bases = basePositionsRef.current;
      const activeIds = new Set<number>();

      for (const u of activeUsers) {
        activeIds.add(u.id);
        if (!bases[u.id]) {
          // New user — compute and add a base position
          const pos = computeBasePosition(u, locations, zones);
          if (pos) bases[u.id] = pos;
        }
      }

      // Remove users that are no longer active
      for (const idStr of Object.keys(bases)) {
        const id = parseInt(idStr);
        if (!activeIds.has(id)) {
          delete bases[id];
        }
      }
    }

    function simulate() {
      refreshBasePositions();

      const { users: liveUsers, locations: liveLocs, batchUpdatePersonnelLocations } = useStore.getState();
      const bases = basePositionsRef.current;
      const batch: PersonnelLocation[] = [];

      for (const [idStr, base] of Object.entries(bases)) {
        const userId = parseInt(idStr);
        const jitterLat = (Math.random() - 0.5) * JITTER * 2;
        const jitterLng = (Math.random() - 0.5) * JITTER * 2;
        const lat = base.lat + jitterLat;
        const lng = base.lng + jitterLng;
        const detectedLocationId = findContainingLocationId({ lat, lng }, liveLocs);
        const user = liveUsers.find((u) => u.id === userId);

        batch.push({
          userId,
          lat,
          lng,
          accuracy: 5 + Math.random() * 10,
          timestamp: Date.now(),
          detectedLocationId,
          zoneId: user?.zoneId ?? null,
        });
      }

      if (batch.length > 0) {
        batchUpdatePersonnelLocations(batch);
      }
    }

    // Initial run — defer to avoid store updates during React's commit phase
    basePositionsRef.current = {};
    const initialTimeout = setTimeout(() => {
      refreshBasePositions();
      simulate();
    }, 0);
    intervalRef.current = setInterval(simulate, SIMULATION_INTERVAL_MS);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);
}
