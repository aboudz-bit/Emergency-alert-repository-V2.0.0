import React, { useCallback, useMemo, useState } from "react";
import {
  Alert as RNAlert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
import { EmergencyModeBanner } from "@/components/ui/EmergencyModeBanner";

export default function SupervisorDashboardScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users) ?? [];
  const alerts = useStore((s) => s.alerts) ?? [];
  const zones = useStore((s) => s.zones) ?? [];
  const locations = useStore((s) => s.locations) ?? [];
  const shelters = useStore((s) => s.shelters) ?? [];
  const activityLogs = useStore((s) => s.activityLogs) ?? [];
  const logout = useStore((s) => s.logout);
  const setExpectedManpower = useStore((s) => s.setExpectedManpower);
  const startAccountability = useStore((s) => s.startAccountability);

  const isBackup =
    currentUser?.isBackupSupervisorAssigned === true &&
    !currentUser?.isSupervisorAssigned;
  const locName = currentUser?.supervisorLocationName ?? "";
  const zoneName =
    currentUser?.supervisorZoneName ?? currentUser?.zone ?? "";
  const roleLabel = isBackup ? "Backup Supervisor" : "Supervisor";
  const statusLabel = isBackup ? "STANDBY" : "ACTIVE";

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

  const locationUsers = useMemo(
    () =>
      myLocation
        ? users.filter((u) => u.locationId === myLocation.id && u.isActive)
        : [],
    [users, myLocation]
  );

  const stats = useMemo(() => {
    const actual = locationUsers.length;
    const expected = myLocation?.expectedManpower ?? 0;
    const safe = locationUsers.filter(
      (u) => u.status === "confirmed"
    ).length;
    const pending = locationUsers.filter(
      (u) => u.status === "pending"
    ).length;
    const needHelp = locationUsers.filter(
      (u) => u.status === "need_help"
    ).length;
    const zoneAlerts = alerts.filter(
      (a) => a.isActive && (a.zone === zoneName || a.zone === "All Zones")
    ).length;
    return { actual, expected, safe, pending, needHelp, zoneAlerts, hasBoundary: (myLocation?.polygonPoints?.length ?? 0) >= 3 };
  }, [locationUsers, alerts, zoneName, myLocation]);

  const myLinkedShelters = useMemo(() => {
    if (!myLocation) return [];
    return shelters.filter(
      (s) => s.isActive && (s.linkedLocationIds || []).includes(myLocation.id)
    );
  }, [shelters, myLocation]);

  const recentLogs = useMemo(
    () => activityLogs.filter(l => l.type === 'alert' || l.type === 'action').slice(0, 5),
    [activityLogs]
  );

  // ── Edit Manpower modal ──────────────────────────────────────────────
  const [manpowerModalVisible, setManpowerModalVisible] = useState(false);
  const [manpowerInput, setManpowerInput] = useState("");

  const openManpowerModal = useCallback(() => {
    setManpowerInput(String(myLocation?.expectedManpower ?? 0));
    setManpowerModalVisible(true);
  }, [myLocation]);

  const saveManpower = useCallback(() => {
    const count = parseInt(manpowerInput, 10);
    if (isNaN(count) || count < 0 || !myLocation) return;
    setExpectedManpower(myLocation.id, count);
    setManpowerModalVisible(false);
  }, [manpowerInput, myLocation, setExpectedManpower]);

  // ── Start Accountability ─────────────────────────────────────────────
  const handleStartAccountability = useCallback(() => {
    if (!myLocation) return;
    RNAlert.alert(
      "Start Accountability",
      `Reset all ${locationUsers.length} personnel at ${locName} to "Pending" and begin accountability?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start",
          style: "destructive",
          onPress: () => startAccountability(myLocation.id),
        },
      ]
    );
  }, [myLocation, locationUsers.length, locName, startAccountability]);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <EmergencyModeBanner />
      <Header
        title={`${roleLabel} — ${locName}`}
        subtitle={`${currentUser?.name} • ${zoneName} • ${locName}`}
        rightAction={
          <View style={styles.headerRight}>
            <StatusBadge
              status={isBackup ? "closed" : "active"}
              label={statusLabel}
            />
            <Pressable
              onPress={handleLogout}
              style={styles.iconBtn}
              hitSlop={8}
            >
              <Feather name="log-out" size={20} color={Colors.text} />
            </Pressable>
          </View>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {isBackup && (
          <View style={styles.standbyBanner}>
            <Feather name="eye" size={16} color={Colors.amber} />
            <Text style={styles.standbyText}>
              You are viewing this location as Backup Supervisor (read-only
              standby mode).
            </Text>
          </View>
        )}

        {/* ── Active Zone Alert ── */}
        {myZone?.alertActive && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Feather name="alert-triangle" size={18} color={Colors.white} />
              <Text style={styles.alertLabel}>ACTIVE ALERT</Text>
              <View
                style={[
                  styles.alertPriorityBadge,
                  myZone.alertPriority === "High" && { backgroundColor: Colors.primary },
                  myZone.alertPriority === "Medium" && { backgroundColor: Colors.amber },
                  myZone.alertPriority === "Low" && { backgroundColor: Colors.info },
                ]}
              >
                <Text style={styles.alertPriorityText}>
                  {myZone.alertPriority}
                </Text>
              </View>
            </View>
            <Text style={styles.alertType}>
              {myZone.alertType?.toUpperCase()} ACTIVATED
            </Text>
            <Text style={styles.alertZone}>{zoneName}</Text>
            <Text style={styles.alertMessage}>{myZone.alertMessage}</Text>
            {myZone.alertUpdatedAt && (
              <Text style={styles.alertTime}>
                {format(new Date(myZone.alertUpdatedAt), "MMM d, h:mm a")}
              </Text>
            )}
          </View>
        )}

        {/* ── KPI Cards ── */}
        <View style={styles.kpiRow}>
          <KPICard
            title="Expected"
            value={stats.expected}
            icon="users"
            color={Colors.text}
            dimColor={Colors.surfaceElevated}
          />
          <KPICard
            title="Actual"
            value={stats.actual}
            icon="user-check"
            color={
              stats.actual >= stats.expected
                ? Colors.safe
                : Colors.missing
            }
            dimColor={
              stats.actual >= stats.expected
                ? Colors.safeDim
                : Colors.missingDim
            }
          />
        </View>
        <View style={styles.kpiRow}>
          <KPICard
            title="Safe"
            value={stats.safe}
            icon="check-circle"
            color={Colors.safe}
            dimColor={Colors.safeDim}
          />
          <KPICard
            title="Pending"
            value={stats.pending}
            icon="clock"
            color={Colors.missing}
            dimColor={Colors.missingDim}
          />
        </View>
        {myLinkedShelters.length > 0 && (
          <View style={styles.kpiRow}>
            <KPICard
              title="Linked Shelters"
              value={myLinkedShelters.length}
              icon="home"
              color={Colors.info}
              dimColor={Colors.surfaceElevated}
            />
            <KPICard
              title="Need Help"
              value={stats.needHelp}
              icon="alert-circle"
              color={stats.needHelp > 0 ? Colors.primary : Colors.safe}
              dimColor={stats.needHelp > 0 ? Colors.missingDim : Colors.safeDim}
            />
          </View>
        )}

        {/* ── Action Buttons (supervisor only, not backup) ── */}
        {!isBackup && (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.actionBtn}
              onPress={openManpowerModal}
            >
              <Feather name="edit-3" size={16} color={Colors.info} />
              <Text style={styles.actionBtnText}>Edit Manpower</Text>
            </Pressable>
            <Pressable
              style={styles.actionBtn}
              onPress={() => router.push("/(supervisor)/personnel")}
            >
              <Feather name="users" size={16} color={Colors.safe} />
              <Text style={styles.actionBtnTextGreen}>
                View Personnel
              </Text>
            </Pressable>
          </View>
        )}
        {!isBackup && (
          <Pressable
            style={styles.accountabilityBtn}
            onPress={handleStartAccountability}
          >
            <Feather name="play-circle" size={18} color={Colors.white} />
            <Text style={styles.accountabilityBtnText}>
              Start Accountability
            </Text>
          </Pressable>
        )}

        {/* ── Personnel List ── */}
        <Text style={styles.sectionTitle}>
          Personnel — {locName}
        </Text>
        <Text style={styles.sectionSub}>
          Expected: {stats.expected} • Actual: {stats.actual} • Safe:{" "}
          {stats.safe} • Pending: {stats.pending}
        </Text>
        {locationUsers.map((user) => (
          <Card key={user.id} style={styles.personnelCard}>
            <View style={styles.personnelRow}>
              <View style={styles.personnelInfo}>
                <Text style={styles.personnelName}>{user.name}</Text>
                <Text style={styles.personnelBadge}>
                  Badge: {user.badge}
                </Text>
              </View>
              <View style={styles.personnelStatus}>
                <StatusBadge status={user.status} />
                <Text style={styles.personnelTime}>
                  {format(new Date(user.lastActivity), "h:mm a")}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {locationUsers.length === 0 && (
          <Card>
            <Text style={styles.emptyText}>
              No personnel assigned to this location.
            </Text>
          </Card>
        )}

        {/* ── Recent Activity ── */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Card>
          {recentLogs.length === 0 ? (
            <Text style={styles.emptyText}>No recent activity.</Text>
          ) : (
            recentLogs.map((log, i) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  i < recentLogs.length - 1 && styles.logRowBorder,
                ]}
              >
                <Feather
                  name={
                    log.type === "alert"
                      ? "alert-triangle"
                      : log.type === "action"
                        ? "zap"
                        : "info"
                  }
                  size={14}
                  color={Colors.textSecondary}
                />
                <View style={styles.logContent}>
                  <Text style={styles.logMsg} numberOfLines={2}>
                    {log.message}
                  </Text>
                  <Text style={styles.logTime}>
                    {format(new Date(log.timestamp), "h:mm a")}
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* ── Edit Manpower Modal ── */}
      <Modal
        visible={manpowerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setManpowerModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Expected Manpower — {locName}
            </Text>
            <Text style={styles.modalSub}>
              Set the expected number of personnel for this location.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={manpowerInput}
              onChangeText={setManpowerInput}
              keyboardType="number-pad"
              placeholder="e.g. 10"
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setManpowerModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.modalSaveBtn}
                onPress={saveManpower}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  standbyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.amberDim,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.missingBorder,
    padding: Spacing.md,
  },
  standbyText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.amber,
    fontFamily: "Inter_500Medium",
  },
  // ── Alert Card ──
  alertCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  alertLabel: {
    flex: 1,
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 1,
  },
  alertPriorityBadge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  alertPriorityText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  alertType: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  alertZone: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
  },
  alertMessage: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
    marginTop: Spacing.xs,
  },
  alertTime: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
    marginTop: Spacing.xs,
  },
  kpiRow: { flexDirection: "row", gap: Spacing.md },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },
  actionBtnTextGreen: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.safe,
  },
  accountabilityBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  accountabilityBtnText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  sectionSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  personnelCard: { paddingVertical: Spacing.sm },
  personnelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  personnelInfo: { flex: 1 },
  personnelName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  personnelBadge: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  personnelStatus: { alignItems: "flex-end", gap: 4 },
  personnelTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: Spacing.lg,
  },
  logRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  logRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  logContent: { flex: 1 },
  logMsg: { fontSize: FontSize.sm, color: Colors.textSecondary },
  logTime: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  // ── Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  modalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.info,
    alignItems: "center",
  },
  modalSaveText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
  },
});
