import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";

import { WindIndicator } from "@/components/ui/WindIndicator";
import { ZoneMap } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert, alertEq } from "@/store";
import { useDetectedLocation } from "@/hooks/useDetectedLocation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useTranslation } from "@/i18n/useTranslation";
import { translateShelterName, translateAlertType } from "@/i18n/translations";
import { formatDistance, findBestShelter } from "@/utils/geo";
import type { LatLng } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function ContractorMapScreen() {
  const focusCount = useRefreshOnFocus();
  const currentUser = useStore((s) => s.currentUser);
  const activeAlert = useStore(selectActiveAlert, alertEq);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);
  const { t } = useTranslation();

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState(false);

  const { detectedLocationId } = useDetectedLocation(userLocation);

  const activeShelters = useMemo(() => shelters.filter((s) => s.isActive), [shelters]);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive && activeAlert && hz.alertId === activeAlert.id),
    [hazardZones, activeAlert]
  );

  const nearestShelter = useMemo(() => {
    if (!userLocation) return null;
    return findBestShelter(
      userLocation,
      shelters,
      detectedLocationId,
      currentUser?.zoneId ?? null
    );
  }, [userLocation, shelters, detectedLocationId, currentUser?.zoneId]);

  const userHighlightedLocationIds = useMemo(() => {
    const ids: number[] = [];
    if (detectedLocationId != null) ids.push(detectedLocationId);
    else if (currentUser?.locationId) ids.push(currentUser.locationId);
    return ids;
  }, [detectedLocationId, currentUser?.locationId]);

  useEffect(() => {
    let cancelled = false;
    let sub: ExpoLocation.LocationSubscription | undefined;

    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) {
          if (!cancelled) setGpsError(true);
          return;
        }
        const watcher = await ExpoLocation.watchPositionAsync(
          { accuracy: ExpoLocation.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
          (loc) => {
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            setGpsError(false);
          },
        );
        if (cancelled) {
          watcher.remove();
          return;
        }
        sub = watcher;
      } catch {
        if (!cancelled) setGpsError(true);
      }
    })();

    return () => {
      cancelled = true;
      try { sub?.remove(); } catch (_) { /* subscription already removed */ }
    };
  }, []);

  const handleShelterPress = useCallback((id: number) => {
    setSelectedShelterId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <View style={styles.container}>
      {/* Full-screen map */}
      <ZoneMap
        key={focusCount}
        zones={zones}
        selectedZoneId={null}
        onZonePress={() => {}}
        height={SCREEN_HEIGHT}
        showLabels
        showLocationButton
        shelters={activeShelters}
        selectedShelterId={selectedShelterId}
        onShelterPress={handleShelterPress}
        nearestShelterId={nearestShelter?.shelter.id ?? null}
        userLocation={userLocation}
        locations={locations}
        highlightedLocationIds={userHighlightedLocationIds}
        hazardZones={activeHazardZones}
      />

      {/* Wind indicator overlay */}
      <WindIndicator />

      {/* Floating info bar */}
      <View style={styles.floatingBar}>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={14} color={Colors.info} />
          <Text style={styles.locationText}>
            {currentUser?.location || t.unknown} · {currentUser?.zone || t.unknown}
          </Text>
        </View>
        {nearestShelter && (
          <View style={styles.shelterRow}>
            <Feather name="navigation" size={12} color="#22C55E" />
            <Text style={styles.shelterText}>
              {t.nearest}: {translateShelterName(nearestShelter.shelter.name, t)}
            </Text>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{formatDistance(nearestShelter.distance)}</Text>
            </View>
          </View>
        )}
        {gpsError && (
          <View style={styles.gpsRow}>
            <Feather name="alert-circle" size={12} color={Colors.destructive} />
            <Text style={styles.gpsErrorText}>{t.gpsUnavailable}</Text>
          </View>
        )}
      </View>

      {/* Floating shelter count */}
      <View style={styles.floatingLegend}>
        <Feather name="home" size={14} color="#F59E0B" />
        <Text style={styles.legendText}>{activeShelters.length} {t.sheltersAvailable}</Text>
        {activeAlert && (
          <>
            <View style={styles.legendSep} />
            <View style={styles.alertDot} />
            <Text style={styles.alertText}>{translateAlertType(activeAlert.type, t)} {t.active}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Floating info bar
  floatingBar: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  locationText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  shelterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shelterText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: Colors.safeDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  distanceText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.safe,
  },
  gpsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  gpsErrorText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.destructive,
  },

  // Floating legend
  floatingLegend: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  legendSep: {
    width: 1,
    height: 14,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  alertText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
});
