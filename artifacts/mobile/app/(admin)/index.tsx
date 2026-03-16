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
import { ZoneBreakdown } from "@/components/ui/ZoneBreakdown";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert } from "@/store";
import { useZoneBreakdown } from "@/hooks/useZoneBreakdown";

export default function DashboardScreen() {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const activityLogs = useStore((s) => s.activityLogs);
  const activeAlert = useStore(selectActiveAlert);
  const sendAllClear = useStore((s) => s.sendAllClear);
  const logout = useStore((s) => s.logout);

  const zoneStats = useZoneBreakdown(users, zones, activeAlert);

  const stats = useMemo(() => {
    const total = users.length;
    const zoneCounts = zones
      .filter((z) => z.isActive)
      .map((z) => ({
        name: z.name,
        count: users.filter((u) => u.zone === z.name).length,
        color: z.color,
      }));
    return { total, zoneCounts };
  }, [users, zones]);

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
              onPress={() => router.push("/(admin)/alert-monitor")}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Feather name="bell" size={20} color={Colors.text} />
              {activeAlert && <View style={styles.notifDot} />}
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconBtn} hitSlop={8}>
              <Feather name="log-out" size={20} color={Colors.textSecondary} />
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
              value={activeAlert ? 1 : 0}
              icon="alert-triangle"
              color={activeAlert ? Colors.primary : Colors.safe}
              dimColor={activeAlert ? Colors.primaryDim : Colors.safeDim}
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

        {activeAlert && (
          <>
            <Pressable onPress={() => router.push("/(admin)/alert-monitor")}>
              <Card style={styles.alertBanner}>
                <View style={styles.alertBannerHeader}>
                  <View style={styles.alertBannerLeft}>
                    <View style={styles.alertIconCircle}>
                      <Feather name="alert-triangle" size={18} color={Colors.primary} />
                    </View>
                    <View style={styles.alertBannerTitleWrap}>
                      <Text style={styles.alertBannerTitle}>{activeAlert.type}</Text>
                      <Text style={styles.alertBannerMeta}>
                        {activeAlert.zone} · {format(new Date(activeAlert.timestamp), "HH:mm:ss")}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status="active" />
                </View>

                <Text style={styles.alertMessage} numberOfLines={2}>
                  {activeAlert.message}
                </Text>

                <View style={styles.alertStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.safe }]}>
                      {activeAlert.stats.confirmed}
                    </Text>
                    <Text style={styles.statLabel}>Safe</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.missing }]}>
                      {activeAlert.stats.missing}
                    </Text>
                    <Text style={styles.statLabel}>Missing</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.noreply }]}>
                      {activeAlert.stats.noReply}
                    </Text>
                    <Text style={styles.statLabel}>No Reply</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: Colors.primary }]}>
                      {activeAlert.stats.needHelp}
                    </Text>
                    <Text style={styles.statLabel}>Help</Text>
                  </View>
                </View>

                <View style={styles.alertActions}>
                  <Pressable
                    style={({ pressed }) => [styles.alertActionBtn, styles.alertActionSafe, pressed && { opacity: 0.8 }]}
                    onPress={sendAllClear}
                  >
                    <Feather name="check-circle" size={14} color="#fff" />
                    <Text style={styles.alertActionTextLight}>All Clear</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.alertActionBtn, styles.alertActionSecondary, pressed && { opacity: 0.8 }]}
                    onPress={() => router.push("/(admin)/alert-monitor")}
                  >
                    <Feather name="eye" size={14} color={Colors.text} />
                    <Text style={styles.alertActionTextDark}>Monitor</Text>
                  </Pressable>
                </View>
              </Card>
            </Pressable>

            {zoneStats.length > 0 && (
              <View style={styles.zoneBreakdownWrap}>
                <Text style={styles.zoneBreakdownTitle}>
                  {zoneStats.length > 1 ? "Per-Zone Breakdown" : `${zoneStats[0].zoneName} Zone`}
                </Text>
                <ZoneBreakdown zoneStats={zoneStats} />
              </View>
            )}
          </>
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
                <Feather name="alert-triangle" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionText}>New Alert</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/zones")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.infoDim }]}>
                <Feather name="map" size={24} color={Colors.info} />
              </View>
              <Text style={styles.quickActionText}>Zone Map</Text>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
              onPress={() => router.push("/(admin)/locations")}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.safeDim }]}>
                <Feather name="map-pin" size={24} color={Colors.safe} />
              </View>
              <Text style={styles.quickActionText}>Locations</Text>
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
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
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
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.surfaceElevated,
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
    color: Colors.text,
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
  alertActionSafe: {
    backgroundColor: Colors.safe,
  },
  alertActionSecondary: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertActionTextLight: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  alertActionTextDark: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  zoneBreakdownWrap: {
    gap: Spacing.sm,
  },
  zoneBreakdownTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
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
    fontFamily: "Inter_700Bold",
    color: Colors.text,
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
    backgroundColor: Colors.surfaceElevated,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
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
    color: Colors.text,
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
