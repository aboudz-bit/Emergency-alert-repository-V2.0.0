import React from "react";
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
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert } from "@/store";

export default function DashboardScreen() {
  const router = useRouter();
  const users = useStore((s) => s.users);
  const activityLogs = useStore((s) => s.activityLogs);
  const activeAlert = useStore(selectActiveAlert);
  const sendAllClear = useStore((s) => s.sendAllClear);
  const logout = useStore((s) => s.logout);

  const totalUsers = users.length;
  const cpfUsers = users.filter((u) => u.zone === "CPF").length;
  const campUsers = users.filter((u) => u.zone === "Camp").length;
  const activeAlertCount = activeAlert ? 1 : 0;

  const recentLogs = activityLogs.slice(0, 5);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const getLogIcon = (type: string): keyof typeof Feather.glyphMap => {
    switch (type) {
      case "alert":
        return "alert-triangle";
      case "action":
        return "zap";
      case "report":
        return "file-text";
      case "user":
        return "user";
      default:
        return "info";
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
            >
              <Feather name="bell" size={20} color={Colors.text} />
              {activeAlert && <View style={styles.notifDot} />}
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconBtn}>
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
        {/* KPI Grid */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiRow}>
            <KPICard
              title="Total Users"
              value={totalUsers}
              icon="users"
              color={Colors.info}
              dimColor={Colors.infoDim}
            />
            <KPICard
              title="CPF Users"
              value={cpfUsers}
              icon="hard-drive"
              color={Colors.safe}
              dimColor={Colors.safeDim}
            />
          </View>
          <View style={styles.kpiRow}>
            <KPICard
              title="Camp Users"
              value={campUsers}
              icon="home"
              color={Colors.amber}
              dimColor={Colors.amberDim}
            />
            <KPICard
              title="Active Alerts"
              value={activeAlertCount}
              icon="alert-triangle"
              color={activeAlert ? Colors.primary : Colors.safe}
              dimColor={activeAlert ? Colors.primaryDim : Colors.safeDim}
            />
          </View>
        </View>

        {/* Active Alert Banner */}
        {activeAlert && (
          <Card style={styles.alertBanner}>
            <View style={styles.alertBannerHeader}>
              <View style={styles.alertBannerLeft}>
                <Feather
                  name="alert-triangle"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.alertBannerTitle}>{activeAlert.type}</Text>
              </View>
              <StatusBadge status="active" />
            </View>
            <View style={styles.alertMeta}>
              <Text style={styles.alertMetaText}>
                Zone: {activeAlert.zone}
              </Text>
              <Text style={styles.alertMetaText}>
                {format(new Date(activeAlert.timestamp), "HH:mm:ss")}
              </Text>
            </View>
            <Text style={styles.alertMessage} numberOfLines={2}>
              {activeAlert.message}
            </Text>
            <View style={styles.alertStats}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.safe }]}>
                  {activeAlert.stats.confirmed}
                </Text>
                <Text style={styles.statLabel}>Confirmed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.missing }]}>
                  {activeAlert.stats.missing}
                </Text>
                <Text style={styles.statLabel}>Missing</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: Colors.noreply }]}>
                  {activeAlert.stats.noReply}
                </Text>
                <Text style={styles.statLabel}>No Reply</Text>
              </View>
            </View>
            <Button
              title="Send All Clear"
              onPress={sendAllClear}
              variant="safe"
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          </Card>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentLogs.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>No recent activity</Text>
            </Card>
          ) : (
            recentLogs.map((log) => (
              <View key={log.id} style={styles.logRow}>
                <View
                  style={[
                    styles.logIcon,
                    {
                      backgroundColor:
                        log.type === "alert"
                          ? Colors.primaryDim
                          : Colors.infoDim,
                    },
                  ]}
                >
                  <Feather
                    name={getLogIcon(log.type)}
                    size={14}
                    color={
                      log.type === "alert" ? Colors.primary : Colors.info
                    }
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
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push("/(admin)/send-alert")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.primaryDim },
                ]}
              >
                <Feather
                  name="alert-triangle"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.quickActionText}>New Alert</Text>
            </Pressable>
            <Pressable
              style={styles.quickAction}
              onPress={() => router.push("/(admin)/zones")}
            >
              <View
                style={[
                  styles.quickActionIcon,
                  { backgroundColor: Colors.infoDim },
                ]}
              >
                <Feather name="map" size={22} color={Colors.info} />
              </View>
              <Text style={styles.quickActionText}>Manage Zones</Text>
            </Pressable>
          </View>
        </View>
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
    padding: Spacing.sm,
    position: "relative",
  },
  notifDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl,
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
  },
  alertBannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  alertBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  alertBannerTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertMeta: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  alertMetaText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  alertMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  alertStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.primaryBorder,
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
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
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
    paddingVertical: Spacing.lg,
  },
  quickActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  quickAction: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    alignItems: "center",
    gap: Spacing.md,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
});
