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
import { ZoneMap } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import type { UserResponseStatus } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function SupervisorMapScreen() {
  const focusCount = useRefreshOnFocus();
  const currentUser = useStore((s) => s.currentUser);
  const { activeAlert, emergencyMode } = useAlertSystemState();
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);

  const isBackup =
    currentUser?.isBackupSupervisorAssigned === true &&
    !currentUser?.isSupervisorAssigned;
  const locName = currentUser?.supervisorLocationName ?? "";
  const zoneName = currentUser?.supervisorZoneName ?? currentUser?.zone ?? "";

  const myLocationId = useMemo(() => {
    const sa = useStore.getState().supervisorAssignments.find(
      (a) => a.supervisorUserId === currentUser?.id || a.backupSupervisorUserId === currentUser?.id
    );
    return sa?.locationId ?? null;
  }, [currentUser]);

  const myLocation = useMemo(
    () => myLocationId ? locations.find((l) => l.id === myLocationId) : locations.find((l) => l.name === locName && l.zone === zoneName),
    [locations, myLocationId, locName, zoneName]
  );

  const myZone = useMemo(
    () => zones.find((z) => z.name === zoneName),
    [zones, zoneName]
  );

  const myLinkedShelters = useMemo(() => {
    if (!myLocation) return [];
    return shelters.filter(
      (s) => s.isActive && (s.linkedLocationIds || []).includes(myLocation.id)
    );
  }, [shelters, myLocation]);

  const hasActiveAlert = emergencyMode !== null;
  usePersonnelSimulation(hasActiveAlert);

  const visiblePersonnel = useVisiblePersonnel({
    scope: "location",
    locationId: myLocation?.id ?? null,
    enabled: hasActiveAlert,
  });

  const visiblePersonnelRef = useRef(visiblePersonnel);
  visiblePersonnelRef.current = visiblePersonnel;

  const [personnelDetail, setPersonnelDetail] = useState<PersonnelMapEntry | null>(null);

  const handlePersonnelPress = useCallback((userId: number) => {
    const p = visiblePersonnelRef.current.find((v) => v.userId === userId);
    if (p) setPersonnelDetail(p);
  }, []);

  const activeHazardZones = useMemo(() => {
    return hazardZones.filter((hz) => {
      if (!hz.isActive) return false;
      const alertMatch = hz.alertId == null || (activeAlert && hz.alertId === activeAlert.id);
      if (!alertMatch) return false;
      if (myLocation && hz.locationId === myLocation.id) return true;
      if (myZone && hz.zoneId === myZone.id) return true;
      if (hz.locationId == null && hz.zoneId == null) return true;
      return false;
    });
  }, [hazardZones, activeAlert, myLocation, myZone]);

  return (
    <View style={styles.container}>
      {/* Full-screen map scoped to supervisor's location */}
      <ZoneMap
        key={focusCount}
        zones={myZone ? [myZone] : []}
        selectedZoneId={null}
        onZonePress={() => {}}
        height={SCREEN_HEIGHT}
        showLabels
        locations={myLocation ? [myLocation] : []}
        highlightedLocationIds={myLocation ? [myLocation.id] : []}
        shelters={myLinkedShelters}
        personnelLocations={visiblePersonnel}
        onPersonnelPress={handlePersonnelPress}
        hazardZones={activeHazardZones}
      />

      {/* Wind indicator overlay */}
      <WindIndicator />

      {/* Floating info bar */}
      <View style={styles.floatingBar}>
        <View style={styles.infoRow}>
          <Feather name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>{locName}</Text>
          <Text style={styles.sep}>{"\u00B7"}</Text>
          <Text style={styles.zoneText}>{zoneName}</Text>
          {isBackup && (
            <>
              <Text style={styles.sep}>{"\u00B7"}</Text>
              <View style={styles.backupBadge}>
                <Text style={styles.backupText}>BACKUP</Text>
              </View>
            </>
          )}
        </View>
        {hasActiveAlert && (
          <View style={styles.alertRow}>
            <View style={styles.alertDot} />
            <Text style={styles.alertText}>
              {activeAlert?.type} · {visiblePersonnel.length} personnel tracked
            </Text>
          </View>
        )}
      </View>

      {/* Floating legend */}
      {hasActiveAlert && (
        <View style={styles.floatingLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.safe }]} />
            <Text style={styles.legendText}>Inside</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.amber }]} />
            <Text style={styles.legendText}>Outside</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
            <Text style={styles.legendText}>Contractor</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
            <Text style={styles.legendText}>Help</Text>
          </View>
          <Text style={styles.legendCount}>{visiblePersonnel.length} tracked</Text>
        </View>
      )}

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
                <Feather name="phone" size={14} color={Colors.textTertiary} />
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{personnelDetail?.mobileNumber || "N/A"}</Text>
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
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    flexShrink: 1,
  },
  sep: { fontSize: 10, color: Colors.textTertiary },
  zoneText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  backupBadge: {
    backgroundColor: Colors.amberDim,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  backupText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: Colors.amber,
    letterSpacing: 0.5,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  alertDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  alertText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
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
    gap: Spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  legendCount: { fontSize: FontSize.xs, fontFamily: "Inter_500Medium", color: Colors.textTertiary, marginLeft: "auto" },

  // Personnel detail modal
  detailOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  detailSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  detailHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.lg },
  detailAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  detailAvatarText: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold" },
  detailHeaderInfo: { flex: 1, gap: 2 },
  detailName: { fontSize: FontSize.lg, fontFamily: "Inter_600SemiBold", color: Colors.text },
  detailBadge: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  detailClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center" },
  detailBody: { gap: Spacing.md },
  detailRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  detailLabel: { fontSize: FontSize.sm, fontFamily: "Inter_500Medium", color: Colors.textSecondary, width: 80 },
  detailValue: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.text, flex: 1 },
});
