import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { WindIndicator } from "@/components/ui/WindIndicator";
import { WindDirectionPicker } from "@/components/ui/WindDirectionPicker";
import { ZoneMap } from "@/components/map";
import { MapLegendCounts } from "@/components/map/MapLegendCounts";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectCanChangeWindDirection } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { useEmergencyIntelligence } from "@/hooks/useEmergencyIntelligence";
import { SmartAlertPanel } from "@/components/ui/SmartAlertPanel";
import IncidentTimelinePanel from "@/components/ui/IncidentTimelinePanel";
import type { UserResponseStatus, WindDirection } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

// Pre-built selector — stable reference, safe to use inline with useStore()
const selectCanChangeWind = selectCanChangeWindDirection;

export default function ECOLiveMapScreen() {
  const focusCount = useRefreshOnFocus();
  const { activeAlert, emergencyMode, activeZoneIds } = useAlertSystemState();
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);

  const hasActiveAlert = emergencyMode !== null;
  usePersonnelSimulation(hasActiveAlert);

  const visiblePersonnel = useVisiblePersonnel({
    scope: "zone",
    zoneIds: activeZoneIds,
    enabled: hasActiveAlert,
  });

  const visiblePersonnelRef = useRef(visiblePersonnel);
  visiblePersonnelRef.current = visiblePersonnel;

  const windDirection = useStore((s) => s.windDirection);
  const setWindDirection = useStore((s) => s.setWindDirection);
  const canChangeWind = useStore(selectCanChangeWind);
  const [windPickerVisible, setWindPickerVisible] = useState(false);

  const intelligence = useEmergencyIntelligence({
    type: "zone",
    zoneId: activeZoneIds.length === 1 ? activeZoneIds[0] : undefined,
  });

  const [intelTrackedIds, setIntelTrackedIds] = useState<number[]>([]);
  const [fitTrigger, setFitTrigger] = useState(0);

  const handleIntelFocusZone = useCallback((zoneId: number) => {
    const zoneIntel = intelligence.zones.find((z) => z.zoneId === zoneId);
    if (zoneIntel) {
      const ids = [...(zoneIntel.locations.flatMap((l) => [...l.needHelpUserIds, ...l.criticalUserIds]))];
      setIntelTrackedIds(ids);
      setFitTrigger((v) => v + 1);
    }
  }, [intelligence.zones]);

  const handleIntelFocusLocation = useCallback((locationId: number) => {
    for (const z of intelligence.zones) {
      const loc = z.locations.find((l) => l.locationId === locationId);
      if (loc) {
        const ids = [...loc.needHelpUserIds, ...loc.criticalUserIds];
        setIntelTrackedIds(ids);
        setFitTrigger((v) => v + 1);
        break;
      }
    }
  }, [intelligence.zones]);

  const [personnelDetail, setPersonnelDetail] = useState<PersonnelMapEntry | null>(null);

  const handlePersonnelPress = useCallback((userId: number) => {
    const p = visiblePersonnelRef.current.find((v) => v.userId === userId);
    if (p) setPersonnelDetail(p);
  }, []);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive && (hz.alertId == null || (activeAlert && hz.alertId === activeAlert.id))),
    [hazardZones, activeAlert]
  );

  if (!activeAlert) {
    return (
      <View style={styles.container}>
        <ZoneMap
          key={focusCount}
          zones={zones}
          selectedZoneId={null}
          onZonePress={() => {}}
          height={SCREEN_HEIGHT}
          showLabels
          locations={locations}
          shelters={shelters}
        />
        <WindIndicator />
        {canChangeWind && (
          <>
            <Pressable
              style={[styles.windButton, windDirection != null && styles.windButtonActive]}
              onPress={() => setWindPickerVisible(true)}
            >
              <Feather name="wind" size={18} color={windDirection ? Colors.white : Colors.primary} />
            </Pressable>
            <WindDirectionPicker
              visible={windPickerVisible}
              current={windDirection}
              onSelect={(dir) => setWindDirection(dir)}
              onClose={() => setWindPickerVisible(false)}
            />
          </>
        )}
      </View>
    );
  }

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
        locations={locations}
        shelters={shelters}
        personnelLocations={visiblePersonnel}
        onPersonnelPress={handlePersonnelPress}
        hazardZones={activeHazardZones}
        trackedUserIds={intelTrackedIds}
        fitTrackedTrigger={fitTrigger}
      />

      {/* Floating alert info bar */}
      <View style={styles.floatingBar}>
        <View style={styles.alertInfoRow}>
          <View style={styles.alertDot} />
          <Text style={styles.alertTypeText}>{activeAlert.type}</Text>
          <Text style={styles.alertSep}>{"\u00B7"}</Text>
          <Text style={styles.alertZoneText}>{activeAlert.zone}</Text>
          <Text style={styles.alertSep}>{"\u00B7"}</Text>
          <Text style={styles.alertTimeText}>
            {format(new Date(activeAlert.timestamp), "HH:mm")}
          </Text>
        </View>
      </View>

      <SmartAlertPanel
        intelligence={intelligence}
        onFocusZone={handleIntelFocusZone}
        onFocusLocation={handleIntelFocusLocation}
      />
      <IncidentTimelinePanel />

      {/* Wind indicator overlay */}
      <WindIndicator />

      {/* Wind control button (permission-gated) */}
      {canChangeWind && (
        <>
          <Pressable
            style={[styles.windButton, windDirection != null && styles.windButtonActive]}
            onPress={() => setWindPickerVisible(true)}
          >
            <Feather name="wind" size={18} color={windDirection ? Colors.white : Colors.primary} />
          </Pressable>

          {/* Wind direction picker modal */}
          <WindDirectionPicker
            visible={windPickerVisible}
            current={windDirection}
            onSelect={(dir) => setWindDirection(dir)}
            onClose={() => setWindPickerVisible(false)}
          />
        </>
      )}

      <MapLegendCounts personnel={visiblePersonnel} />

      {/* Personnel Detail Modal */}
      <Modal
        visible={personnelDetail !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPersonnelDetail(null)}
      >
        <Pressable style={styles.detailOverlay} onPress={() => setPersonnelDetail(null)}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <View style={[styles.detailAvatar, {
                backgroundColor: personnelDetail?.status === 'confirmed' ? Colors.safeDim
                  : personnelDetail?.status === 'need_help' ? Colors.primaryDim
                  : Colors.surfaceElevated
              }]}>
                <Text style={[styles.detailAvatarText, {
                  color: personnelDetail?.status === 'confirmed' ? Colors.safe
                    : personnelDetail?.status === 'need_help' ? Colors.primary
                    : Colors.textSecondary
                }]}>
                  {personnelDetail?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.detailHeaderInfo}>
                <Text style={styles.detailName}>{personnelDetail?.name}</Text>
                <Text style={styles.detailBadge}>{personnelDetail?.badge}</Text>
              </View>
              <Pressable style={styles.detailClose} onPress={() => setPersonnelDetail(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <Feather name="shield" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{personnelDetail?.role || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="phone" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{personnelDetail?.mobileNumber || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="activity" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Status</Text>
                <StatusBadge status={personnelDetail?.status as UserResponseStatus ?? "pending"} />
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Assigned</Text>
                <Text style={styles.detailValue}>{personnelDetail?.assignedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="navigation" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Detected</Text>
                <Text style={styles.detailValue}>{personnelDetail?.detectedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="clock" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Last Update</Text>
                <Text style={styles.detailValue}>
                  {personnelDetail?.lastUpdate
                    ? format(new Date(personnelDetail.lastUpdate), "HH:mm:ss")
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // Floating alert bar
  floatingBar: {
    position: "absolute",
    top: 8,
    left: 12,
    right: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  alertInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  alertTypeText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertSep: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  alertZoneText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  alertTimeText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  // Wind control button
  windButton: {
    position: "absolute",
    top: 56,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 20,
  },
  windButtonActive: {
    backgroundColor: Colors.primary,
  },

  // Personnel detail modal
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  detailAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  detailAvatarText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  detailHeaderInfo: {
    flex: 1,
    gap: 2,
  },
  detailName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  detailBadge: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  detailClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    gap: Spacing.md,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    width: 80,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    flex: 1,
  },
});
