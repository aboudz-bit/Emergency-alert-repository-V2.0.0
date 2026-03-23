import { useEffect, useRef } from "react";
import * as ExpoLocation from "expo-location";
import { useStore } from "@/store";
import { findContainingLocationId } from "@/utils/geo";
import type { PersonnelLocation } from "@/types";

const FALLBACK_INTERVAL_MS = 8000;

export function usePersonnelTracking(enabled: boolean = true) {
  const currentUser = useStore((s) => s.currentUser);
  const locations = useStore((s) => s.locations);
  const settings = useStore((s) => s.settings);
  const updatePersonnelLocation = useStore((s) => s.updatePersonnelLocation);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const permissionGrantedRef = useRef(false);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  useEffect(() => {
    if (!enabled || !currentUser) return;

    let cancelled = false;

    const intervalMs = (settings.locationUpdateIntervalSeconds ?? 8) * 1000;
    const clampedInterval = Math.max(5000, Math.min(intervalMs, 30000));

    async function requestPermission(): Promise<boolean> {
      if (permissionGrantedRef.current) return true;
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        permissionGrantedRef.current = status === "granted";
        return permissionGrantedRef.current;
      } catch {
        return false;
      }
    }

    async function pollPosition() {
      if (cancelled || !enabledRef.current) return;
      const hasPermission = await requestPermission();
      if (!hasPermission || cancelled) return;

      try {
        const pos = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });

        if (cancelled || !enabledRef.current) return;

        const pt = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const currentLocations = useStore.getState().locations;
        const detectedLocationId = findContainingLocationId(pt, currentLocations);

        const loc: PersonnelLocation = {
          userId: currentUser!.id,
          lat: pt.lat,
          lng: pt.lng,
          accuracy: pos.coords.accuracy ?? 0,
          timestamp: Date.now(),
          detectedLocationId,
          zoneId: currentUser!.zoneId,
        };

        updatePersonnelLocation(loc);
      } catch {}
    }

    pollPosition();
    intervalRef.current = setInterval(pollPosition, clampedInterval);

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, currentUser?.id]);
}
