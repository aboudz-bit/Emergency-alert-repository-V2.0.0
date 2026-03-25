import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Alert,
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

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ZoneBreakdown } from "@/components/ui/ZoneBreakdown";
import { WindIndicator } from "@/components/ui/WindIndicator";
import { EmergencyModeBanner } from "@/components/ui/EmergencyModeBanner";
import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { ZoneMap } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert, alertEq, selectIsEmergencyActive } from "@/store";
import { useZoneBreakdown } from "@/hooks/useZoneBreakdown";
import { useVisiblePersonnel, type PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";
import { usePersonnelSimulation } from "@/hooks/usePersonnelSimulation";
import type { UserResponseStatus } from "@/types";

const MAP_HEIGHT = Math.min(Dimensions.get("window").height * 0.4, 340);

type TabKey = "confirmed" | "pending" | "need_help";

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "confirmed", label: "Safe", color: Colors.safe },
  { key: "pending", label: "Pending", color: Colors.noreply },
  { key: "need_help", label: "Help", color: Colors.primary },
];

export default function AlertMonitorScreen() {
  const focusCount = useRefreshOnFocus();
  const activeAlert = useStore(selectActiveAlert, alertEq);
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const hazardZones = useStore((s) => s.hazardZones);
  const sendAllClear = useStore((s) => s.sendAllClear);

  const currentUser = useStore((s) => s.currentUser);
  const supervisorAssignments = useStore((s) => s.supervisorAssignments);

  const hasActiveAlert = useStore(selectIsEmergencyActive);
  usePersonnelSimulation(hasActiveAlert);

  // Scope: Super Admin sees all, Supervisor/Backup sees only their assigned location
  const personnelScope = useMemo(() => {
    if (!currentUser) return { scope: "all" as const };
    const role = currentUser.role;
    if (role === "Super Admin" || role === "IT") {
      return { scope: "all" as const };
    }
    // Check if supervisor or backup supervisor for a location
    const sa = supervisorAssignments.find(
      (a) => a.supervisorUserId === currentUser.id || a.backupSupervisorUserId === currentUser.id
    );
    if (sa) {
      return { scope: "location" as const, locationId: sa.locationId };
    }
    return { scope: "all" as const };
  }, [currentUser, supervisorAssignments]);

  const visiblePersonnel = useVisiblePersonnel({
    scope: personnelScope.scope,
    locationId: "locationId" in personnelScope ? personnelScope.locationId : undefined,
    enabled: hasActiveAlert,
  });

  const visiblePersonnelRef = useRef(visiblePersonnel);
  visiblePersonnelRef.current = visiblePersonnel;

  const [selectedTab, setSelectedTab] = useState<TabKey>("confirmed");
  const [personnelDetail, setPersonnelDetail] = useState<PersonnelMapEntry | null>(null);

  const handlePersonnelPress = useCallback((userId: number) => {
    const p = visiblePersonnelRef.current.find((v) => v.userId === userId);
    if (p) setPersonnelDetail(p);
  }, []);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive && activeAlert && hz.alertId === activeAlert.id),
    [hazardZones, activeAlert]
  );

  const zoneStats = useZoneBreakdown(users, zones, activeAlert);

  const isMultiZone = zoneStats.length > 1;

  const getTabCount = useCallback(
    (key: TabKey) => {
      if (!activeAlert) return 0;
      switch (key) {
        case "confirmed": return activeAlert.stats.confirmed;
        case "pending": return activeAlert.stats.pending;
        case "need_help": return activeAlert.stats.needHelp;
      }
    },
    [activeAlert]
  );

  if (!activeAlert) {
    return (
      <View style={styles.container}>
        <EmergencyModeBanner />
        <Header title="Alert Monitor" showBack />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={48} color={Colors.safe} />
          </View>
          <Text style={styles.emptyTitle}>No Active Alert</Text>
          <Text style={styles.emptyText}>
            All clear. No emergency alerts are currently active.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EmergencyModeBanner />
      <Header title="Alert Monitor" showBack />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderLeft}>
              <View style={styles.alertIconWrap}>
                <Feather name="alert-triangle" size={16} color={Colors.primary} />
              </View>
              <View style={styles.alertTitleWrap}>
                <Text style={styles.alertType}>{activeAlert.type}</Text>
                <Text style={styles.alertMeta}>
                  {activeAlert.zone} · {format(new Date(activeAlert.timestamp), "MMM d, HH:mm")}
                </Text>
              </View>
            </View>
            <StatusBadge status="active" />
          </View>
        </Card>

        <View style={styles.tabBar}>
          <Text style={styles.tabBarLabel}>Total</Text>
          <View style={styles.tabBarRow}>
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              const count = getTabCount(tab.key);
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, isActive && { borderBottomColor: tab.color }]}
                  onPress={() => setSelectedTab(tab.key)}
                >
                  <Text style={[styles.tabCount, { color: isActive ? tab.color : Colors.textTertiary }]}>
                    {count}
                  </Text>
                  <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {zoneStats.length > 0 && (
          <View style={styles.zoneBreakdownSection}>
            <Text style={styles.zoneSectionTitle}>
              {isMultiZone ? "Per-Zone Breakdown" : `${zoneStats[0].zoneName} Zone`}
            </Text>
            <ZoneBreakdown zoneStats={zoneStats} />
          </View>
        )}

        {hasActiveAlert && (
          <View style={styles.mapSection}>
            <Text style={styles.zoneSectionTitle}>Live Personnel Map</Text>
            <View style={styles.mapContainer}>
              <ZoneMap
                key={focusCount}
                zones={zones}
                selectedZoneId={null}
                onZonePress={() => {}}
                height={MAP_HEIGHT}
                showLabels
                locations={locations}
                shelters={shelters}
                personnelLocations={visiblePersonnel}
                onPersonnelPress={handlePersonnelPress}
                hazardZones={activeHazardZones}
              />
              <WindIndicator />
            </View>
            <View style={styles.mapLegend}>
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
              <Text style={styles.legendCount}>
                {visiblePersonnel.length} tracked
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <Button
          title="All Clear"
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
          variant="safe"
          icon="check-circle"
          size="lg"
          style={{ flex: 1 }}
        />
      </View>

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
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  alertCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitleWrap: {
    flex: 1,
    gap: 2,
  },
  alertType: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertMeta: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  tabBar: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  tabBarLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  tabBarRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabCount: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  zoneBreakdownSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  zoneSectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  bottomActions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.safeDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },

  mapSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  mapContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    height: MAP_HEIGHT,
  },
  mapLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  legendCount: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    marginLeft: "auto",
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  detailSheet: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  detailBadge: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  detailClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  detailBody: {
    padding: Spacing.lg,
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
    width: 72,
  },
  detailValue: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "right",
  },
});
