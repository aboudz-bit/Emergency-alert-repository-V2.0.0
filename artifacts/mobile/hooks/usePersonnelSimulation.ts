import { useEffect, useRef } from "react";
import { useStore } from "@/store";
import { findContainingLocationId } from "@/utils/geo";
import type { PersonnelLocation } from "@/types";

const SIMULATION_INTERVAL_MS = 8000;
const JITTER = 0.0003;

export function usePersonnelSimulation(enabled: boolean = true) {
  const users = useStore((s) => s.users);
  const locations = useStore((s) => s.locations);
  const zones = useStore((s) => s.zones);
  const currentUser = useStore((s) => s.currentUser);
  const updatePersonnelLocation = useStore((s) => s.updatePersonnelLocation);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const basePositionsRef = useRef<Record<number, { lat: number; lng: number }>>({});

  useEffect(() => {
    if (!enabled || !currentUser) return;

    function initBasePositions() {
      const bases: Record<number, { lat: number; lng: number }> = {};
      const activeUsers = users.filter(
        (u) => u.isActive && u.id !== currentUser!.id && u.accountStatus === "active"
      );

      for (const u of activeUsers) {
        const loc = locations.find((l) => l.id === u.locationId);
        if (loc && loc.polygonPoints.length >= 3) {
          const center = loc.polygonPoints.reduce(
            (acc, p) => ({ lat: acc.lat + p.lat / loc.polygonPoints.length, lng: acc.lng + p.lng / loc.polygonPoints.length }),
            { lat: 0, lng: 0 }
          );
          bases[u.id] = center;
        } else {
          const zone = zones.find((z) => z.id === u.zoneId);
          if (zone && zone.center) {
            bases[u.id] = { lat: zone.center.lat, lng: zone.center.lng };
          } else if (zone && zone.polygonPoints.length > 0) {
            const center = zone.polygonPoints.reduce(
              (acc, p) => ({ lat: acc.lat + p.lat / zone.polygonPoints.length, lng: acc.lng + p.lng / zone.polygonPoints.length }),
              { lat: 0, lng: 0 }
            );
            bases[u.id] = center;
          }
        }
      }
      basePositionsRef.current = bases;
    }

    function simulate() {
      const bases = basePositionsRef.current;
      Object.entries(bases).forEach(([idStr, base]) => {
        const userId = parseInt(idStr);
        const jitterLat = (Math.random() - 0.5) * JITTER * 2;
        const jitterLng = (Math.random() - 0.5) * JITTER * 2;
        const lat = base.lat + jitterLat;
        const lng = base.lng + jitterLng;
        const detectedLocationId = findContainingLocationId({ lat, lng }, locations);

        const user = users.find((u) => u.id === userId);

        const loc: PersonnelLocation = {
          userId,
          lat,
          lng,
          accuracy: 5 + Math.random() * 10,
          timestamp: Date.now(),
          detectedLocationId,
          zoneId: user?.zoneId ?? null,
        };

        updatePersonnelLocation(loc);
      });
    }

    initBasePositions();
    simulate();
    intervalRef.current = setInterval(simulate, SIMULATION_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, currentUser?.id]);
}
