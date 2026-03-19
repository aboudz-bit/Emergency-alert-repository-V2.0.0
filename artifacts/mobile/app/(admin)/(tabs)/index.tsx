import React, { useCallback, useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function DashboardScreen() {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);
  const activityLogs = useStore((s) => s.activityLogs);
  const logout = useStore((s) => s.logout);

  const alertZones = useMemo(
    () => zones.filter((z) => z.isActive && z.alertActive),
    [zones]
  );
  const activeAlertCount = alertZones.length;
  const hasActiveAlerts = activeAlertCount > 0;

  const stats = useMemo(() => {
    const total = users.length;
    const affectedLocations = locations.filter((l) => l.alertActive && l.isActive).length;
    const affectedUsers = hasActiveAlerts
      ? users.filter((u) => alertZones.some((z) => z.name === u.zone)).length
      : 0;
    const zoneCounts = zones
      .filter((z) => z.isActive)
      .map((z) => ({
        name: z.name,
        count: users.filter((u) => u.zoneId === z.id).length,
        color: z.color,
      }));
    return { total, zoneCounts, affectedLocations, affectedUsers };
  }, [users, zones, locations, alertZones, hasActiveAlerts]);

  const recentLogs = useMemo(() => activityLogs.slice(0, 5), [activityLogs]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  const getLogIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "alert": return "alert-triangle";
      case "action": return "zap";
      case "report": return "file-text";
      case "user": return "user";
      default: return "info";
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Dashboard"
        subtitle="Khurais Emergency Alert System"
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Feather name="bell" size={18} color={Colors.headerText} />
              {hasActiveAlerts && <View style={styles.notifDot} />}
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconBtn} hitSlop={8}>
              <Feather name="log-out" size={18} color={Colors.headerText} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KPICard
              title="Total Personnel"
              value={stats.total}
              icon="users"
              color={Colors.info}
              dimColor={Colors.infoDim}
            />
            <KPICard
              title="Active Alerts"
              value={activeAlertCount}
              icon="alert-triangle"
              color={hasActiveAlerts ? Colors.primary : Colors.safe}
              dimColor={hasActiveAlerts ? Colors.primaryDim : Colors.safeDim}
            />
          </View>
          {stats.zoneCounts.length > 0 && (
            <View style={styles.kpiRow}>
              {stats.zoneCounts.slice(0, 2).map((zc) => (
                <KPICard
                  key={zc.name}
                  title={`${zc.name} Zone`}
                  value={zc.count}
                  icon="map-pin"
                  color={zc.color}
                  dimColor={zc.color + "26"}
                />
              ))}
            </View>
          )}
          {stats.zoneCounts.length > 2 && (
            <View style={styles.kpiRow}>
              {stats.zoneCounts.slice(2, 4).map((zc) => (
                <KPICard
                  key={zc.name}
                  title={`${zc.name} Zone`}
                  value={zc.count}
                  icon="map-pin"
                  color={zc.color}
                  dimColor={zc.color + "26"}
                />
              ))}
            </View>
          )}
        </View>

        {hasActiveAlerts && (
          <Pressable onPress={() => router.push("/(admin)/send-alert")}>
            <Card style={styles.alertBanner}>
              <View style={styles.alertBannerHeader}>
                <View style={styles.alertBannerLeft}>
                  <View style={styles.alertIconCircle}>
                    <Feather name="alert-triangle" size={18} color={Colors.primary} />
                  </View>
                  <View style={styles.alertBannerTitleWrap}>
                    <Text style={styles.alertBannerTitle}>
                      {activeAlertCount} Active Alert{activeAlertCount !== 1 ? "s" : ""}
                    </Text>
                    <Text style={styles.alertBannerMeta}>
                      {alertZones.map((z) => z.name).join(", ")}
                    </Text>
                  </View>
                </View>
                <StatusBadge status="active" />
              </View>

              {alertZones.map((zone) => (
                <View key={zone.id} style={styles.zoneAlertRow}>
                  <View style={[styles.zoneAlertDot, { backgroundColor: zone.color }]} />
                  <Text style={styles.zoneAlertName}>{zone.name}</Text>
                  <View style={[styles.zoneAlertTag, { backgroundColor: (zone.alertPriority === "High" ? Colors.primary : zone.alertPriority === "Medium" ? Colors.amber : Colors.info) + "1A" }]}>
                    <Text style={[styles.zoneAlertTagText, { color: zone.alertPriority === "High" ? Colors.primary : zone.alertPriority === "Medium" ? Colors.amber : Colors.info }]}>
                      {zone.alertPriority}
                    </Text>
                  </View>
                  <Text style={styles.zoneAlertType}>{zone.alertType}</Text>
                </View>
              ))}

              <View style={styles.alertStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>
                    {activeAlertCount}
                  </Text>
                  <Text style={styles.statLabel}>Zones</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.info }]}>
                    {stats.affectedLocations}
                  </Text>
                  <Text style={styles.statLabel}>Locations</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, { color: Colors.amber }]}>
                    {stats.affectedUsers}
                  </Text>
                  <Text style={styles.statLabel}>Users</Text>
                </View>
              </View>

              <View style={styles.alertActions}>
                <Pressable
                  style={({ pressed }) => [styles.alertActionBtn, styles.alertActionSecondary, pressed && { opacity: 0.8 }]}
                  onPress={() => router.push("/(admin)/send-alert")}
                >
                  <Feather name="settings" size={14} color={Colors.text} />
                  <Text style={styles.alertActionTextDark}>Manage</Text>
                </Pressable>
              </View>
            </Card>
          </Pressable>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/send-alert")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryDim }]}>
                <Feather name="alert-triangle" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>New Alert</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/zones")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.infoDim }]}>
                <Feather name="map" size={20} color={Colors.info} />
              </View>
              <Text style={styles.quickActionText}>Zone Map</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/locations")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.safeDim }]}>
                <Feather name="map-pin" size={20} color={Colors.safe} />
              </View>
              <Text style={styles.quickActionText}>Locations</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/eco-management")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.amber + "1A" }]}>
                <Feather name="shield" size={20} color={Colors.amber} />
              </View>
              <Text style={styles.quickActionText}>ECO Management</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/supervisor-management")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.info + "1A" }]}>
                <Feather name="clipboard" size={20} color={Colors.info} />
              </View>
              <Text style={styles.quickActionText}>Supervisor Management</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {recentLogs.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No recent activity</Text>
            </Card>
          ) : (
            <Card style={styles.activityCard}>
              {recentLogs.map((log, idx) => (
                <View key={log.id}>
                  <View style={styles.logRow}>
                    <View
                      style={[
                        styles.logIcon,
                        {
                          backgroundColor:
                            log.type === "alert" ? Colors.primaryDim : Colors.infoDim,
                        },
                      ]}
                    >
                      <Feather
                        name={getLogIcon(log.type)}
                        size={14}
                        color={log.type === "alert" ? Colors.primary : Colors.info}
                      />
                    </View>
                    <View style={styles.logContent}>
                      <Text style={styles.logMessage} numberOfLines={1}>
                        {log.message}
                      </Text>
                      <Text style={styles.logTime}>
                        {format(new Date(log.timestamp), "MMM d, HH:mm")}
                        {log.actorName ? ` · ${log.actorName}` : ""}
                      </Text>
                    </View>
                  </View>
                  {idx < recentLogs.length - 1 && <View style={styles.logDivider} />}
                </View>
              ))}
            </Card>
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.destructive,
    borderWidth: 2,
    borderColor: Colors.headerBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  kpiGrid: {
    gap: Spacing.md,
  },
  kpiRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  alertBanner: {
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
    gap: Spacing.md,
  },
  alertBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  alertIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBannerTitleWrap: {
    flex: 1,
    gap: 2,
  },
  alertBannerTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertBannerMeta: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  alertMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textTitle,
    lineHeight: 22,
  },
  alertStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.primaryBorder,
  },
  alertActions: {
    flexDirection: "row",
    gap: 8,
  },
  alertActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 38,
    borderRadius: 8,
  },
  alertActionSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertActionTextDark: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTitle,
  },
  zoneAlertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  zoneAlertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneAlertName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTitle,
  },
  zoneAlertTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  zoneAlertTagText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  zoneAlertType: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTitle,
  },
  quickActionsGrid: {
    gap: Spacing.sm,
  },
  quickAction: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.85,
    backgroundColor: Colors.background,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.textTitle,
  },
  activityCard: {
    padding: 0,
    overflow: "hidden",
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  logDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
  logIcon: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  logContent: {
    flex: 1,
    gap: 2,
  },
  logMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.textTitle,
  },
  logTime: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
