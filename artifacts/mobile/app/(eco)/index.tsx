import React, { useCallback, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { EmergencyModeBanner } from "@/components/ui/EmergencyModeBanner";

export default function ECODashboardScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const locations = useStore((s) => s.locations);
  const shelters = useStore((s) => s.shelters);
  const zones = useStore((s) => s.zones);
  const alerts = useStore((s) => s.alerts);
  const activityLogs = useStore((s) => s.activityLogs);
  const logout = useStore((s) => s.logout);

  const zoneName = currentUser?.ecoZoneName ?? currentUser?.zone ?? "";
  const zoneObj = useMemo(
    () => zones.find((z) => z.name === zoneName),
    [zones, zoneName]
  );
  const zoneId = zoneObj?.id ?? null;

  const zoneLocations = useMemo(
    () => zoneId !== null ? locations.filter((l) => l.zoneId === zoneId && l.isActive) : [],
    [locations, zoneId]
  );

  const zoneUsers = useMemo(
    () => zoneId !== null ? users.filter((u) => u.zoneId === zoneId && u.isActive) : [],
    [users, zoneId]
  );

  const stats = useMemo(() => {
    const total = zoneUsers.length;
    const safe = zoneUsers.filter((u) => u.status === "confirmed").length;
    const pending = zoneUsers.filter(
      (u) => u.status === "pending"
    ).length;
    const needHelp = zoneUsers.filter((u) => u.status === "need_help").length;
    const activeAlerts = alerts.filter(
      (a) => a.isActive && (a.zone === zoneName || a.zone === "All Zones")
    ).length;
    return { total, safe, pending, needHelp, activeAlerts, locationCount: zoneLocations.length };
  }, [zoneUsers, alerts, zoneName, zoneLocations]);

  const locationBreakdown = useMemo(() => {
    return zoneLocations.map((loc) => {
      const locUsers = zoneUsers.filter((u) => u.locationId === loc.id);
      const safe = locUsers.filter((u) => u.status === "confirmed").length;
      const pending = locUsers.filter(
        (u) => u.status === "pending"
      ).length;
      const needHelp = locUsers.filter((u) => u.status === "need_help").length;
      const linkedShelterCount = shelters.filter(
        (s) => s.isActive && (s.linkedLocationIds || []).includes(loc.id)
      ).length;
      const hasBoundary = (loc.polygonPoints?.length ?? 0) >= 3;
      return {
        id: loc.id,
        name: loc.name,
        expected: loc.expectedManpower,
        manpower: locUsers.length,
        safe,
        pending,
        needHelp,
        alertActive: loc.alertActive,
        linkedShelterCount,
        hasBoundary,
      };
    });
  }, [zoneLocations, zoneUsers, shelters]);

  const activeAlerts = useMemo(
    () => alerts.filter((a) => a.isActive && (a.zone === zoneName || a.zone === "All Zones")),
    [alerts, zoneName]
  );

  const recentLogs = useMemo(() => activityLogs.slice(0, 5), [activityLogs]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <EmergencyModeBanner />
      <Header
        title={`ECO ${currentUser?.ecoSlot ?? ""} — ${zoneName}`}
        subtitle={`${currentUser?.name} • Operational: CCR`}
        rightAction={
          <Pressable onPress={handleLogout} style={styles.iconBtn} hitSlop={8}>
            <Feather name="log-out" size={20} color={Colors.text} />
          </Pressable>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.roleBanner}>
          <View style={styles.roleBannerLeft}>
            <Feather name="shield" size={18} color={Colors.info} />
            <Text style={styles.roleBannerText}>Emergency Coordinator</Text>
          </View>
          <StatusBadge status="active" />
        </View>

        <View style={styles.kpiRow}>
          <KPICard
            title="Locations"
            value={stats.locationCount}
            icon="map-pin"
            color={Colors.info}
            dimColor={Colors.infoDim}
          />
          <KPICard
            title="Manpower"
            value={stats.total}
            icon="users"
            color={Colors.text}
            dimColor={Colors.surfaceElevated}
          />
        </View>
        <View style={styles.kpiRow}>
          <KPICard title="Safe" value={stats.safe} icon="check-circle" color={Colors.safe} dimColor={Colors.safeDim} />
          <KPICard title="Pending" value={stats.pending} icon="clock" color={Colors.missing} dimColor={Colors.missingDim} />
        </View>
        {stats.needHelp > 0 && (
          <View style={styles.kpiRow}>
            <KPICard title="Need Help" value={stats.needHelp} icon="alert-circle" color={Colors.primary} dimColor={Colors.primaryDim} />
            <View style={{ flex: 1 }} />
          </View>
        )}

        {activeAlerts.length > 0 && (
          <Card elevated style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Feather name="alert-triangle" size={18} color={Colors.primary} />
              <Text style={styles.alertTitle}>Active Alerts ({activeAlerts.length})</Text>
            </View>
            {activeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <View style={styles.alertItemHeader}>
                  <Text style={styles.alertType}>{alert.type}</Text>
                  <StatusBadge status="active" label={alert.priority} />
                </View>
                <Text style={styles.alertMsg} numberOfLines={2}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {format(new Date(alert.timestamp), "MMM d, h:mm a")} • Zone: {alert.zone}
                </Text>
              </View>
            ))}
          </Card>
        )}

        <Text style={styles.sectionTitle}>Location Breakdown</Text>
        {locationBreakdown.map((loc) => (
          <Card key={loc.id} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <Text style={styles.locationName}>{loc.name}</Text>
              <StatusBadge status={loc.alertActive ? "active" : "confirmed"} label={loc.alertActive ? "ALERT" : "CLEAR"} />
            </View>
            <View style={styles.locationStats}>
              <View style={styles.locStat}>
                <Text style={styles.locStatValue}>{loc.expected}</Text>
                <Text style={styles.locStatLabel}>Expected</Text>
              </View>
              <View style={styles.locStat}>
                <Text style={[styles.locStatValue, { color: loc.manpower >= loc.expected ? Colors.safe : Colors.missing }]}>{loc.manpower}</Text>
                <Text style={styles.locStatLabel}>Actual</Text>
              </View>
              <View style={styles.locStat}>
                <Text style={[styles.locStatValue, { color: Colors.safe }]}>{loc.safe}</Text>
                <Text style={styles.locStatLabel}>Safe</Text>
              </View>
              <View style={styles.locStat}>
                <Text style={[styles.locStatValue, { color: Colors.missing }]}>{loc.pending}</Text>
                <Text style={styles.locStatLabel}>Pending</Text>
              </View>
              {loc.needHelp > 0 && (
                <View style={styles.locStat}>
                  <Text style={[styles.locStatValue, { color: Colors.primary }]}>{loc.needHelp}</Text>
                  <Text style={styles.locStatLabel}>Help</Text>
                </View>
              )}
              <View style={styles.locStat}>
                <Text style={styles.locStatValue}>{loc.linkedShelterCount}</Text>
                <Text style={styles.locStatLabel}>Shelters</Text>
              </View>
            </View>
          </Card>
        ))}

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card>
          {recentLogs.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity.</Text>
          ) : (
            recentLogs.map((log, i) => (
              <View key={log.id} style={[styles.logRow, i < recentLogs.length - 1 && styles.logRowBorder]}>
                <Feather
                  name={log.type === "alert" ? "alert-triangle" : log.type === "action" ? "zap" : "info"}
                  size={14}
                  color={Colors.textSecondary}
                />
                <View style={styles.logContent}>
                  <Text style={styles.logMsg} numberOfLines={2}>{log.message}</Text>
                  <Text style={styles.logTime}>{format(new Date(log.timestamp), "MMM d, h:mm a")}</Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  iconBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  roleBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: Colors.infoDim, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.infoBorder,
    padding: Spacing.md,
  },
  roleBannerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  roleBannerText: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.info },
  kpiRow: { flexDirection: "row", gap: Spacing.md },
  alertCard: { borderColor: Colors.primaryBorder, borderWidth: 1 },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, marginBottom: Spacing.sm },
  alertTitle: { fontSize: FontSize.lg, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  alertItem: { paddingVertical: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  alertItemHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  alertType: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  alertMsg: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 4 },
  alertTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
  sectionTitle: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text,
    marginTop: Spacing.sm,
  },
  locationCard: { gap: Spacing.sm },
  locationHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  locationName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  locationStats: { flexDirection: "row", gap: Spacing.xl },
  locStat: { alignItems: "center" },
  locStatValue: { fontSize: FontSize.xl, fontFamily: "Inter_700Bold", color: Colors.text },
  locStatLabel: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: "center", paddingVertical: Spacing.lg },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  logContent: { flex: 1 },
  logMsg: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
});
