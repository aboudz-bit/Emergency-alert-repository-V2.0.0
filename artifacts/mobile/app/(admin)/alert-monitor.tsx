import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmergencyModeBanner } from "@/components/ui/EmergencyModeBanner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WindIndicator } from "@/components/ui/WindIndicator";
import { ZoneMap } from "@/components/map";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useZoneBreakdown } from "@/hooks/useZoneBreakdown";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import type { UserResponseStatus } from "@/types";
import { useRouter } from "expo-router";

export default function AlertMonitorScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeAlert, emergencyMode } = useAlertSystemState();
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);
  const sendAllClear = useStore((s) => s.sendAllClear);

  const currentUser = useStore((s) => s.currentUser);
  const supervisorAssignments = useStore((s) => s.supervisorAssignments);

  const { activeZoneIds } = useAlertSystemState();
  const hasActiveAlert = emergencyMode !== null;
  usePersonnelSimulation(hasActiveAlert);

  const alertZoneIds = useMemo(() => {
    if (!activeAlert) return [];
    const isAllZones = activeAlert.zone === "All Zones" || activeAlert.zone === "all";
    if (isAllZones) {
      return zones.filter((z) => z.isActive).map((z) => z.id);
    }
    const targetNames = activeAlert.zone.includes(", ")
      ? activeAlert.zone.split(", ").map((n) => n.trim())
      : [activeAlert.zone];
    return zones.filter((z) => targetNames.includes(z.name)).map((z) => z.id);
  }, [activeAlert, zones]);

  const personnelScope = useMemo(() => {
    if (!currentUser) return { scope: "zone" as const, zoneIds: alertZoneIds };
    const role = currentUser.role;
    if (role === "Super Admin" || role === "IT") {
      return { scope: "zone" as const, zoneIds: alertZoneIds };
    }
    const sa = supervisorAssignments.find(
      (a) => a.supervisorUserId === currentUser.id || a.backupSupervisorUserId === currentUser.id
    );
    if (sa) {
      return { scope: "location" as const, locationId: sa.locationId };
    }
    return { scope: "zone" as const, zoneIds: alertZoneIds };
  }, [currentUser, supervisorAssignments, alertZoneIds]);

  const visiblePersonnel = useVisiblePersonnel({
    scope: personnelScope.scope,
    locationId: "locationId" in personnelScope ? personnelScope.locationId : undefined,
    zoneIds: "zoneIds" in personnelScope ? personnelScope.zoneIds : undefined,
    enabled: hasActiveAlert,
  });

  const visiblePersonnelRef = useRef(visiblePersonnel);
  visiblePersonnelRef.current = visiblePersonnel;

  const [personnelDetail, setPersonnelDetail] = useState<PersonnelMapEntry | null>(null);
  const [showZoneBreakdown, setShowZoneBreakdown] = useState(false);

  type FilterKey = "safe" | "pending" | "contract" | "help";
  const [activeFilters, setActiveFilters] = useState<Set<FilterKey>>(new Set());

  const toggleFilter = useCallback((key: FilterKey) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const filteredPersonnel = useMemo(() => {
    if (activeFilters.size === 0) return visiblePersonnel;
    return visiblePersonnel.filter((p) => {
      if (activeFilters.has("help") && p.status === "need_help") return true;
      if (activeFilters.has("contract") && p.userType === "Contract") return true;
      if (activeFilters.has("safe") && p.status === "confirmed") return true;
      if (activeFilters.has("pending") && p.status === "pending") return true;
      return false;
    });
  }, [visiblePersonnel, activeFilters]);

  const handlePersonnelPress = useCallback((userId: number) => {
    const p = visiblePersonnelRef.current.find((v) => v.userId === userId);
    if (p) setPersonnelDetail(p);
  }, []);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive && activeAlert && hz.alertId === activeAlert.id),
    [hazardZones, activeAlert]
  );

  const zoneStats = useZoneBreakdown(users, zones, activeAlert);

  const scopedCounts = useMemo(() => {
    if (zoneStats.length === 0) {
      return {
        confirmed: activeAlert?.stats?.confirmed ?? 0,
        pending: activeAlert?.stats?.pending ?? 0,
        needHelp: activeAlert?.stats?.needHelp ?? 0,
      };
    }
    return zoneStats.reduce(
      (acc, zs) => ({
        confirmed: acc.confirmed + zs.confirmed,
        pending: acc.pending + zs.pending,
        needHelp: acc.needHelp + zs.needHelp,
      }),
      { confirmed: 0, pending: 0, needHelp: 0 },
    );
  }, [zoneStats, activeAlert]);

  const safeCount = scopedCounts.confirmed;
  const pendingCount = scopedCounts.pending;
  const helpCount = scopedCounts.needHelp;

  const safeFilterCount = useMemo(() => visiblePersonnel.filter((p) => p.status === "confirmed").length, [visiblePersonnel]);
  const pendingFilterCount = useMemo(() => visiblePersonnel.filter((p) => p.status === "pending").length, [visiblePersonnel]);
  const contractFilterCount = useMemo(() => visiblePersonnel.filter((p) => p.userType === "Contract").length, [visiblePersonnel]);
  const helpFilterCount = useMemo(() => visiblePersonnel.filter((p) => p.status === "need_help").length, [visiblePersonnel]);

  if (!activeAlert) {
    return (
      <View style={styles.container}>
        <EmergencyModeBanner />
        <View style={[styles.emptyHeader, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); }} hitSlop={8}>
            <Feather name="chevron-left" size={22} color="#333" />
          </Pressable>
          <Text style={styles.emptyHeaderTitle}>Alert Monitor</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={48} color={Colors.safe} />
          </View>
          <Text style={styles.emptyTitle}>No Active Alert</Text>
          <Text style={styles.emptyText}>All clear. No emergency alerts are currently active.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EmergencyModeBanner />

      <View style={[styles.compactHeader, { paddingTop: insets.top + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => { if (router.canGoBack()) router.back(); }} hitSlop={8}>
          <Feather name="chevron-left" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerInfo}>
          <View style={styles.headerTitleRow}>
            <Feather name="activity" size={14} color="#F87171" />
            <Text style={styles.headerTitle}>{activeAlert.type}</Text>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <Text style={styles.headerMeta}>
            {activeAlert.zone ?? "Unknown"} · {activeAlert.timestamp ? format(new Date(activeAlert.timestamp), "HH:mm") : ""}
          </Text>
        </View>
      </View>

      <View style={styles.statsStrip}>
        <Text style={styles.statsZone}>{activeAlert.zone ?? "CPF"}</Text>
        <View style={styles.statsDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: "#34D399" }]} />
          <Text style={styles.statLabel}>Safe</Text>
          <Text style={[styles.statValue, { color: "#34D399" }]}>{safeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: "#FBBF24" }]} />
          <Text style={styles.statLabel}>Pending</Text>
          <Text style={[styles.statValue, { color: "#FBBF24" }]}>{pendingCount}</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: "#F87171" }]} />
          <Text style={styles.statLabel}>Help</Text>
          <Text style={[styles.statValue, { color: "#F87171" }]}>{helpCount}</Text>
        </View>
        {zoneStats.length > 1 && (
          <Pressable style={styles.breakdownBtn} onPress={() => setShowZoneBreakdown(true)}>
            <Feather name="bar-chart-2" size={14} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.mapWrapper}>
        <ZoneMap
          zones={zones}
          selectedZoneId={null}
          onZonePress={() => {}}
          height={Dimensions.get("window").height}
          showLabels
          locations={locations}
          shelters={shelters}
          personnelLocations={filteredPersonnel}
          onPersonnelPress={handlePersonnelPress}
          hazardZones={activeHazardZones}
        />
        <WindIndicator />

        <View style={[styles.legendOverlay, { bottom: insets.bottom + 72 }]} pointerEvents="box-none">
          <Pressable
            style={[styles.legendChip, activeFilters.has("safe") && styles.legendChipActive]}
            onPress={() => toggleFilter("safe")}
          >
            <View style={[styles.legendDot, { backgroundColor: "#34D399" }]} />
            <Text style={styles.legendChipText}>Safe {safeFilterCount}</Text>
            {activeFilters.has("safe") && <Feather name="x" size={10} color="rgba(255,255,255,0.7)" />}
          </Pressable>
          <Pressable
            style={[styles.legendChip, activeFilters.has("pending") && styles.legendChipActive]}
            onPress={() => toggleFilter("pending")}
          >
            <View style={[styles.legendDot, { backgroundColor: "#FBBF24" }]} />
            <Text style={styles.legendChipText}>Pending {pendingFilterCount}</Text>
            {activeFilters.has("pending") && <Feather name="x" size={10} color="rgba(255,255,255,0.7)" />}
          </Pressable>
          <Pressable
            style={[styles.legendChip, activeFilters.has("contract") && styles.legendChipActive]}
            onPress={() => toggleFilter("contract")}
          >
            <View style={[styles.legendDot, { backgroundColor: "#FB923C" }]} />
            <Text style={styles.legendChipText}>Contract {contractFilterCount}</Text>
            {activeFilters.has("contract") && <Feather name="x" size={10} color="rgba(255,255,255,0.7)" />}
          </Pressable>
          <Pressable
            style={[styles.legendChip, activeFilters.has("help") && styles.legendChipActive]}
            onPress={() => toggleFilter("help")}
          >
            <View style={[styles.legendDot, { backgroundColor: "#F87171" }]} />
            <Text style={styles.legendChipText}>Help {helpFilterCount}</Text>
            {activeFilters.has("help") && <Feather name="x" size={10} color="rgba(255,255,255,0.7)" />}
          </Pressable>
          <Pressable
            style={[styles.legendChip, { backgroundColor: "rgba(0,0,0,0.5)" }]}
            onPress={() => { if (activeFilters.size > 0) setActiveFilters(new Set()); }}
          >
            <Text style={styles.legendChipText}>
              {activeFilters.size > 0 ? `${filteredPersonnel.length}/${visiblePersonnel.length}` : `${visiblePersonnel.length}`} tracked
            </Text>
            {activeFilters.size > 0 && <Feather name="x-circle" size={11} color="rgba(255,255,255,0.6)" />}
          </Pressable>
        </View>

        <View style={[styles.allClearFab, { bottom: insets.bottom + 16 }]} pointerEvents="box-none">
          <Pressable
            style={styles.allClearBtn}
            onPress={() => {
              Alert.alert(
                "Send All Clear",
                "This will close the alert and mark everyone as safe. Continue?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Confirm", style: "default", onPress: sendAllClear },
                ]
              );
            }}
          >
            <Feather name="check-circle" size={20} color="#fff" />
            <Text style={styles.allClearText}>All Clear</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={showZoneBreakdown}
        transparent
        animationType="slide"
        onRequestClose={() => setShowZoneBreakdown(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowZoneBreakdown(false)}>
          <View style={[styles.breakdownSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.breakdownHeader}>
              <Text style={styles.breakdownTitle}>Zone Breakdown</Text>
              <Pressable style={styles.closeBtn} onPress={() => setShowZoneBreakdown(false)} hitSlop={8}>
                <Feather name="x" size={16} color="#999" />
              </Pressable>
            </View>
            {zoneStats.map((zs, i) => (
              <View key={i} style={styles.breakdownRow}>
                <View style={[styles.breakdownZoneDot, { backgroundColor: zs.zoneColor }]} />
                <Text style={styles.breakdownZoneName} numberOfLines={1}>{zs.zoneName}</Text>
                <View style={styles.breakdownCounts}>
                  <Text style={[styles.breakdownCount, { color: "#34D399" }]}>{zs.confirmed}</Text>
                  <Text style={styles.breakdownSep}>/</Text>
                  <Text style={[styles.breakdownCount, { color: "#FBBF24" }]}>{zs.pending}</Text>
                  <Text style={styles.breakdownSep}>/</Text>
                  <Text style={[styles.breakdownCount, { color: "#F87171" }]}>{zs.needHelp}</Text>
                </View>
              </View>
            ))}
            <View style={styles.breakdownLegend}>
              <View style={[styles.legendDot, { backgroundColor: "#34D399" }]} />
              <Text style={styles.breakdownLegendText}>Safe</Text>
              <View style={[styles.legendDot, { backgroundColor: "#FBBF24" }]} />
              <Text style={styles.breakdownLegendText}>Pending</Text>
              <View style={[styles.legendDot, { backgroundColor: "#F87171" }]} />
              <Text style={styles.breakdownLegendText}>Help</Text>
            </View>
          </View>
        </Pressable>
      </Modal>

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
                backgroundColor: personnelDetail?.status === 'confirmed' ? "#D1FAE5"
                  : personnelDetail?.status === 'need_help' ? "#FEE2E2"
                  : "#F3F4F6"
              }]}>
                <Text style={[styles.detailAvatarText, {
                  color: personnelDetail?.status === 'confirmed' ? "#059669"
                    : personnelDetail?.status === 'need_help' ? "#DC2626"
                    : "#6B7280"
                }]}>
                  {personnelDetail?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View style={styles.detailHeaderInfo}>
                <Text style={styles.detailName}>{personnelDetail?.name}</Text>
                <Text style={styles.detailBadge}>{personnelDetail?.badge}</Text>
              </View>
              <Pressable style={styles.closeBtn} onPress={() => setPersonnelDetail(null)} hitSlop={8}>
                <Feather name="x" size={16} color="#999" />
              </Pressable>
            </View>

            <View style={styles.detailBody}>
              <View style={styles.detailRow}>
                <Feather name="shield" size={14} color="#9CA3AF" />
                <Text style={styles.detailLabel}>Role</Text>
                <Text style={styles.detailValue}>{personnelDetail?.role || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="phone" size={14} color="#9CA3AF" />
                <Text style={styles.detailLabel}>Phone</Text>
                <Text style={styles.detailValue}>{personnelDetail?.mobileNumber || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="activity" size={14} color="#9CA3AF" />
                <Text style={styles.detailLabel}>Status</Text>
                <StatusBadge status={personnelDetail?.status as UserResponseStatus ?? "pending"} />
              </View>
              <View style={styles.detailRow}>
                <Feather name="map-pin" size={14} color="#9CA3AF" />
                <Text style={styles.detailLabel}>Assigned</Text>
                <Text style={styles.detailValue}>{personnelDetail?.assignedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="navigation" size={14} color="#9CA3AF" />
                <Text style={styles.detailLabel}>Detected</Text>
                <Text style={styles.detailValue}>{personnelDetail?.detectedLocation || "N/A"}</Text>
              </View>
              <View style={styles.detailRow}>
                <Feather name="clock" size={14} color="#9CA3AF" />
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
    backgroundColor: "#111827",
  },

  compactHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 6,
    backgroundColor: "#111827",
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  headerInfo: { flex: 1, gap: 1 },
  headerTitleRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  headerTitle: {
    fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff",
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: "#F87171",
    marginLeft: 4,
  },
  liveText: {
    fontSize: 9, fontFamily: "Inter_700Bold", color: "#F87171",
    letterSpacing: 1.2,
  },
  headerMeta: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.5)",
  },

  statsStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#1F2937",
  },
  statsZone: {
    fontSize: 11, fontFamily: "Inter_700Bold", color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.5,
  },
  statsDivider: {
    width: 1, height: 16, backgroundColor: "rgba(255,255,255,0.15)",
  },
  statItem: {
    flexDirection: "row", alignItems: "center", gap: 4,
  },
  statDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  statLabel: {
    fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.45)",
  },
  statValue: {
    fontSize: 13, fontFamily: "Inter_700Bold",
  },
  breakdownBtn: {
    marginLeft: "auto",
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  mapWrapper: {
    flex: 1,
    position: "relative",
  },

  legendOverlay: {
    position: "absolute", left: 12, right: 12,
    flexDirection: "row", flexWrap: "wrap", gap: 6,
    zIndex: 10,
  },
  legendChip: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
  },
  legendChipActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
  },
  legendDot: {
    width: 7, height: 7, borderRadius: 4,
  },
  legendChipText: {
    fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#fff",
  },

  allClearFab: {
    position: "absolute", left: 16, right: 16,
    zIndex: 15,
  },
  allClearBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#059669",
    height: 48, borderRadius: 24,
    shadowColor: "#059669", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  allClearText: {
    fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff",
  },

  emptyHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingBottom: 8,
    backgroundColor: Colors.background,
  },
  emptyHeaderTitle: {
    fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  emptyContainer: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: Spacing.xxl, gap: Spacing.md,
    backgroundColor: Colors.background,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.safeDim,
    alignItems: "center", justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.md, fontFamily: "Inter_400Regular",
    color: Colors.textSecondary, textAlign: "center",
  },

  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
  },
  breakdownSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 10,
  },
  sheetHandle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB",
    alignSelf: "center", marginBottom: 4,
  },
  breakdownHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  breakdownTitle: {
    fontSize: 16, fontFamily: "Inter_700Bold", color: "#1F2937",
  },
  closeBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  breakdownRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 8, paddingHorizontal: 4,
    borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  breakdownZoneDot: {
    width: 10, height: 10, borderRadius: 5,
  },
  breakdownZoneName: {
    flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#374151",
  },
  breakdownCounts: {
    flexDirection: "row", alignItems: "center", gap: 2,
  },
  breakdownCount: {
    fontSize: 14, fontFamily: "Inter_700Bold", minWidth: 20, textAlign: "center",
  },
  breakdownSep: {
    fontSize: 12, color: "#D1D5DB",
  },
  breakdownLegend: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingTop: 4,
  },
  breakdownLegendText: {
    fontSize: 10, fontFamily: "Inter_500Medium", color: "#9CA3AF", marginRight: 6,
  },

  detailOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center", alignItems: "center",
    paddingHorizontal: 32,
  },
  detailSheet: {
    width: "100%", maxWidth: 320,
    backgroundColor: "#fff", borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 8,
  },
  detailHeader: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6",
  },
  detailAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  detailAvatarText: {
    fontSize: 16, fontFamily: "Inter_700Bold",
  },
  detailHeaderInfo: { flex: 1, gap: 1 },
  detailName: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: "#1F2937",
  },
  detailBadge: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7280",
  },
  detailBody: {
    padding: 14, gap: 10,
  },
  detailRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  detailLabel: {
    fontSize: 12, fontFamily: "Inter_500Medium", color: "#6B7280", width: 68,
  },
  detailValue: {
    flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold",
    color: "#1F2937", textAlign: "right",
  },
});
