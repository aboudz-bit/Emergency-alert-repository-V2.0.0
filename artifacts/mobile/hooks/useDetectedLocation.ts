import { useMemo } from "react";
import { useStore } from "@/store";
import { findContainingLocationId } from "@/utils/geo";
import type { LatLng } from "@/types";

export function useDetectedLocation(userLocation: LatLng | null) {
  const locations = useStore((s) => s.locations) ?? [];

  const detectedLocationId = useMemo(() => {
    if (!userLocation) return null;
    return findContainingLocationId(userLocation, locations);
  }, [userLocation, locations]);

  const detectedLocation = useMemo(
    () => (detectedLocationId != null ? locations.find((l) => l.id === detectedLocationId) ?? null : null),
    [detectedLocationId, locations]
  );

  return { detectedLocationId, detectedLocation };
}
