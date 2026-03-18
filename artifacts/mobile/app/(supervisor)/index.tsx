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

export default function SupervisorDashboardScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const alerts = useStore((s) => s.alerts);
  const activityLogs = useStore((s) => s.activityLogs);
  const logout = useStore((s) => s.logout);

  const isBackup = currentUser?.isBackupSupervisorAssigned === true && !currentUser?.isSupervisorAssigned;
  const locName = currentUser?.supervisorLocationName ?? "";
  const zoneName = currentUser?.supervisorZoneName ?? currentUser?.zone ?? "";
  const roleLabel = isBackup ? "Backup Supervisor" : "Supervisor";
  const statusLabel = isBackup ? "STANDBY" : "ACTIVE";

  const locationUsers = useMemo(
    () => users.filter((u) => u.location === locName && u.zone === zoneName && u.isActive),
    [users, locName, zoneName]
  );

  const stats = useMemo(() => {
    const total = locationUsers.length;
    const safe = locationUsers.filter((u) => u.status === "confirmed").length;
    const pending = locationUsers.filter((u) => u.status === "no_reply" || u.status === "missing").length;
    const needHelp = locationUsers.filter((u) => u.status === "need_help").length;
    const zoneAlerts = alerts.filter(
      (a) => a.isActive && (a.zone === zoneName || a.zone === "All Zones")
    ).length;
    return { total, safe, pending, needHelp, zoneAlerts };
  }, [locationUsers, alerts, zoneName]);

  const recentLogs = useMemo(() => activityLogs.slice(0, 5), [activityLogs]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <Header
        title={`${roleLabel} — ${locName}`}
        subtitle={`${currentUser?.name} • ${zoneName} • ${locName}`}
        rightAction={
          <View style={styles.headerRight}>
            <StatusBadge status={isBackup ? "missing" : "active"} label={statusLabel} />
            <Pressable onPress={handleLogout} style={styles.iconBtn} hitSlop={8}>
              <Feather name="log-out" size={20} color={Colors.text} />
            </Pressable>
          </View>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {isBackup && (
          <View style={styles.standbyBanner}>
            <Feather name="eye" size={16} color={Colors.amber} />
            <Text style={styles.standbyText}>
              You are viewing this location as Backup Supervisor (read-only standby mode).
            </Text>
          </View>
        )}

        <View style={styles.kpiRow}>
          <KPICard
            title="Manpower"
            value={stats.total}
            icon="users"
            color={Colors.text}
            dimColor={Colors.surfaceElevated}
          />
          <KPICard title="Safe" value={stats.safe} icon="check-circle" color={Colors.safe} dimColor={Colors.safeDim} />
        </View>
        <View style={styles.kpiRow}>
          <KPICard title="Pending" value={stats.pending} icon="clock" color={Colors.missing} dimColor={Colors.missingDim} />
          {stats.needHelp > 0 ? (
            <KPICard title="Need Help" value={stats.needHelp} icon="alert-circle" color={Colors.primary} dimColor={Colors.primaryDim} />
          ) : (
            <KPICard
              title="Zone Alerts"
              value={stats.zoneAlerts}
              icon="alert-triangle"
              color={stats.zoneAlerts > 0 ? Colors.primary : Colors.textSecondary}
              dimColor={stats.zoneAlerts > 0 ? Colors.primaryDim : Colors.surfaceElevated}
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Personnel — {locName}</Text>
        <Text style={styles.sectionSub}>
          Expected: {stats.total} • Safe: {stats.safe} • Pending: {stats.pending}
        </Text>
        {locationUsers.map((user) => (
          <Card key={user.id} style={styles.personnelCard}>
            <View style={styles.personnelRow}>
              <View style={styles.personnelInfo}>
                <Text style={styles.personnelName}>{user.name}</Text>
                <Text style={styles.personnelBadge}>Badge: {user.badge}</Text>
              </View>
              <View style={styles.personnelStatus}>
                <StatusBadge
                  status={
                    user.status === "confirmed" ? "confirmed" :
                    user.status === "need_help" ? "need_help" :
                    user.status === "missing" ? "missing" : "no_reply"
                  }
                />
                <Text style={styles.personnelTime}>
                  {format(new Date(user.lastActivity), "h:mm a")}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {locationUsers.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>No personnel assigned to this location.</Text>
          </Card>
        )}

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
                  <Text style={styles.logTime}>{format(new Date(log.timestamp), "h:mm a")}</Text>
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
  headerRight: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  iconBtn: {
    width: 40, height: 40, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  standbyBanner: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: Colors.amberDim, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.missingBorder,
    padding: Spacing.md,
  },
  standbyText: { flex: 1, fontSize: FontSize.sm, color: Colors.amber, fontFamily: "Inter_500Medium" },
  kpiRow: { flexDirection: "row", gap: Spacing.md },
  sectionTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: Spacing.sm },
  sectionSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -Spacing.sm },
  personnelCard: { paddingVertical: Spacing.sm },
  personnelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  personnelInfo: { flex: 1 },
  personnelName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  personnelBadge: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  personnelStatus: { alignItems: "flex-end", gap: 4 },
  personnelTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: "center", paddingVertical: Spacing.lg },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm, paddingVertical: Spacing.sm },
  logRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  logContent: { flex: 1 },
  logMsg: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logTime: { fontSize: FontSize.xs, color: Colors.textTertiary, marginTop: 2 },
});
