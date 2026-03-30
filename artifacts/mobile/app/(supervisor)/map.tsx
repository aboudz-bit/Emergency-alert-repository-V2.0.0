import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { StatusBadge } from "@/components/ui/StatusBadge";
import { WindIndicator } from "@/components/ui/WindIndicator";
import { ZoneMap } from "@/components/map";
import { MapLegendCounts } from "@/components/map/MapLegendCounts";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import type { UserResponseStatus } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

type StatusFilter = "all" | "confirmed" | "pending" | "need_help";

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
  const [trackedUserIds, setTrackedUserIds] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [showTrackedPanel, setShowTrackedPanel] = useState(false);
  const [fitTrackedTrigger, setFitTrackedTrigger] = useState(0);

  const toggleTracked = useCallback((userId: number) => {
    setTrackedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const clearAllTracked = useCallback(() => {
    setTrackedUserIds([]);
  }, []);

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

  const filteredPersonnel = useMemo(() => {
    if (statusFilter === "all") return visiblePersonnel;
    return visiblePersonnel.filter((p) => {
      if (statusFilter === "confirmed") return p.status === "confirmed";
      if (statusFilter === "need_help") return p.status === "need_help";
      return p.status !== "confirmed" && p.status !== "need_help";
    });
  }, [visiblePersonnel, statusFilter]);

  const trackedPersonnel = useMemo(
    () => visiblePersonnel.filter((p) => trackedUserIds.includes(p.userId)),
    [visiblePersonnel, trackedUserIds]
  );

  const statusFilterCounts = useMemo(() => {
    let safe = 0, pending = 0, needHelp = 0;
    for (const p of visiblePersonnel) {
      if (p.status === "confirmed") safe++;
      else if (p.status === "need_help") needHelp++;
      else pending++;
    }
    return { all: visiblePersonnel.length, confirmed: safe, pending, need_help: needHelp };
  }, [visiblePersonnel]);

  return (
    <View style={styles.container}>
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
        personnelLocations={filteredPersonnel}
        onPersonnelPress={handlePersonnelPress}
        hazardZones={activeHazardZones}
        trackedUserIds={trackedUserIds}
        fitTrackedTrigger={fitTrackedTrigger}
      />

      <WindIndicator />

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

      {hasActiveAlert && (
        <View style={styles.controlRow}>
          {statusFilter !== "all" && (
            <Pressable
              style={styles.filterResetBtn}
              onPress={() => setStatusFilter("all")}
            >
              <Feather name="x" size={12} color="#fff" />
              <Text style={styles.filterResetText}>
                {statusFilter === "confirmed" ? "Safe" : statusFilter === "need_help" ? "Help" : "Pending"}
              </Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.controlBtn, statusFilter !== "all" && styles.controlBtnActive]}
            onPress={() => {
              const filters: StatusFilter[] = ["all", "confirmed", "pending", "need_help"];
              const idx = filters.indexOf(statusFilter);
              setStatusFilter(filters[(idx + 1) % filters.length]);
            }}
          >
            <Feather name="filter" size={14} color="#fff" />
          </Pressable>
          {trackedPersonnel.length > 0 && (
            <Pressable
              style={[styles.controlBtn, styles.trackedBtn]}
              onPress={() => {
                setShowTrackedPanel(true);
                setFitTrackedTrigger((c) => c + 1);
              }}
            >
              <Feather name="eye" size={14} color="#60A5FA" />
              <Text style={styles.trackedBtnText}>{trackedPersonnel.length}</Text>
            </Pressable>
          )}
        </View>
      )}

      {hasActiveAlert && (
        <MapLegendCounts
          personnel={visiblePersonnel}
          trackedCount={trackedPersonnel.length}
        />
      )}

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
              <Pressable
                style={[
                  styles.trackBtn,
                  personnelDetail && trackedUserIds.includes(personnelDetail.userId) && styles.trackBtnActive,
                ]}
                onPress={() => {
                  if (personnelDetail) toggleTracked(personnelDetail.userId);
                }}
              >
                <Feather
                  name={personnelDetail && trackedUserIds.includes(personnelDetail.userId) ? "eye-off" : "eye"}
                  size={14}
                  color={personnelDetail && trackedUserIds.includes(personnelDetail.userId) ? "#60A5FA" : Colors.textTertiary}
                />
              </Pressable>
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

      <Modal
        visible={showTrackedPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTrackedPanel(false)}
      >
        <View style={styles.trackedOverlay}>
          <View style={styles.trackedPanel}>
            <View style={styles.trackedPanelHeader}>
              <View style={styles.trackedPanelTitleRow}>
                <Feather name="eye" size={16} color="#60A5FA" />
                <Text style={styles.trackedPanelTitle}>
                  Tracked Personnel ({trackedPersonnel.length})
                </Text>
              </View>
              <View style={styles.trackedPanelActions}>
                {trackedPersonnel.length > 0 && (
                  <Pressable style={styles.clearAllBtn} onPress={clearAllTracked}>
                    <Text style={styles.clearAllText}>Clear All</Text>
                  </Pressable>
                )}
                <Pressable
                  style={styles.detailClose}
                  onPress={() => setShowTrackedPanel(false)}
                  hitSlop={8}
                >
                  <Feather name="x" size={16} color={Colors.textTertiary} />
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.trackedList}>
              {trackedPersonnel.length === 0 && (
                <Text style={styles.trackedEmpty}>No tracked personnel</Text>
              )}
              {trackedPersonnel.map((p) => (
                <View key={p.userId} style={styles.trackedItem}>
                  <View style={[styles.trackedDot, {
                    backgroundColor: p.status === 'confirmed' ? '#34D399'
                      : p.status === 'need_help' ? '#EF4444' : '#FBBF24'
                  }]} />
                  <View style={styles.trackedInfo}>
                    <Text style={styles.trackedName}>{p.name}</Text>
                    <Text style={styles.trackedBadgeText}>{p.badge}</Text>
                  </View>
                  <StatusBadge status={p.status as UserResponseStatus ?? "pending"} />
                  <Pressable
                    style={styles.removeTrackBtn}
                    onPress={() => toggleTracked(p.userId)}
                    hitSlop={6}
                  >
                    <Feather name="eye-off" size={14} color={Colors.textTertiary} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

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

  controlRow: {
    position: "absolute",
    top: 80,
    right: 12,
    flexDirection: "column",
    gap: 8,
    alignItems: "flex-end",
  },
  controlBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15,23,42,0.75)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  controlBtnActive: {
    backgroundColor: "rgba(96,165,250,0.25)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.5)",
  },
  filterResetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(96,165,250,0.2)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.4)",
  },
  filterResetText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#60A5FA",
  },
  trackedBtn: {
    flexDirection: "row",
    gap: 4,
    width: "auto",
    paddingHorizontal: 10,
  },
  trackedBtnText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#60A5FA",
  },

  trackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  trackBtnActive: {
    backgroundColor: "rgba(96,165,250,0.15)",
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.4)",
  },

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

  trackedOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  trackedPanel: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.55,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  trackedPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  trackedPanelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  trackedPanelTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  trackedPanelActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  clearAllText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: "#EF4444",
  },
  trackedList: {
    flexGrow: 0,
  },
  trackedEmpty: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
  trackedItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trackedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  trackedInfo: {
    flex: 1,
    gap: 1,
  },
  trackedName: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  trackedBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  removeTrackBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
