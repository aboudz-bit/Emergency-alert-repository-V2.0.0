import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { SupervisorAssignment, User } from "@/types";

type PickerTarget = "supervisor" | "backup";

export default function SupervisorManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const supervisorAssignments = useStore((s) => s.supervisorAssignments);
  const users = useStore((s) => s.users);
  const assignSupervisor = useStore((s) => s.assignSupervisor);
  const assignBackupSupervisor = useStore((s) => s.assignBackupSupervisor);
  const toggleSupervisorActive = useStore((s) => s.toggleSupervisorActive);
  const toggleBackupActive = useStore((s) => s.toggleBackupActive);

  const [pickerAssignment, setPickerAssignment] = useState<SupervisorAssignment | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>("supervisor");

  const activeUsers = useMemo(
    () => users.filter((u) => u.accountStatus === "active" && u.isActive),
    [users]
  );

  const assignedUserIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of supervisorAssignments) {
      if (a.supervisorUserId) ids.add(a.supervisorUserId);
      if (a.backupSupervisorUserId) ids.add(a.backupSupervisorUserId);
    }
    return ids;
  }, [supervisorAssignments]);

  const availableUsers = useMemo(
    () => activeUsers.filter((u) => !assignedUserIds.has(u.id)),
    [activeUsers, assignedUserIds]
  );

  const openPicker = useCallback((assignment: SupervisorAssignment, target: PickerTarget) => {
    setPickerAssignment(assignment);
    setPickerTarget(target);
  }, []);

  const handlePickUser = useCallback(
    (user: User) => {
      if (!pickerAssignment) return;
      if (pickerTarget === "supervisor") {
        assignSupervisor(pickerAssignment.locationId, user.id);
      } else {
        assignBackupSupervisor(pickerAssignment.locationId, user.id);
      }
      setPickerAssignment(null);
    },
    [pickerAssignment, pickerTarget, assignSupervisor, assignBackupSupervisor]
  );

  const handleRemove = useCallback(
    (locationId: number, target: PickerTarget) => {
      if (target === "supervisor") {
        assignSupervisor(locationId, null);
      } else {
        assignBackupSupervisor(locationId, null);
      }
    },
    [assignSupervisor, assignBackupSupervisor]
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Supervisor Management</Text>
          <Text style={styles.headerSub}>Assign Supervisors per Location</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={supervisorAssignments}
        keyExtractor={(item) => String(item.locationId)}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => {
          const hasSupervisor = !!item.supervisorUserId;
          const hasBackup = !!item.backupSupervisorUserId;
          return (
            <View style={styles.card}>
              {/* Location header */}
              <View style={styles.cardHeader}>
                <View style={styles.locationBadge}>
                  <Feather name="map-pin" size={14} color={Colors.info} />
                  <Text style={styles.locationName}>{item.locationName}</Text>
                </View>
                <Text style={styles.zoneBadge}>{item.zoneName}</Text>
              </View>

              {/* Supervisor */}
              <View style={styles.roleSection}>
                <View style={styles.roleLabelRow}>
                  <Text style={styles.roleLabel}>Supervisor</Text>
                  {hasSupervisor && (
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>
                        {item.supervisorActive ? "Active" : "Inactive"}
                      </Text>
                      <Switch
                        value={item.supervisorActive}
                        onValueChange={() => toggleSupervisorActive(item.locationId)}
                        trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                        thumbColor={item.supervisorActive ? Colors.safe : Colors.textSecondary}
                        style={{ transform: [{ scale: 0.8 }] }}
                      />
                    </View>
                  )}
                </View>
                {hasSupervisor ? (
                  <View style={styles.assignedRow}>
                    <View style={styles.avatar}>
                      <Feather name="shield" size={16} color={Colors.safe} />
                    </View>
                    <View style={styles.assignedInfo}>
                      <Text style={styles.assignedName}>{item.supervisorUserName}</Text>
                      <Text style={styles.assignedMeta}>Badge: {item.supervisorUserBadge}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyRow}>
                    <Feather name="user-x" size={16} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>Not assigned</Text>
                  </View>
                )}
                <View style={styles.btnRow}>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: Colors.safe + "40", backgroundColor: Colors.safe + "10" }]}
                    onPress={() => openPicker(item, "supervisor")}
                  >
                    <Feather name={hasSupervisor ? "refresh-cw" : "user-plus"} size={13} color={Colors.safe} />
                    <Text style={[styles.actionBtnText, { color: Colors.safe }]}>
                      {hasSupervisor ? "Replace" : "Assign"}
                    </Text>
                  </Pressable>
                  {hasSupervisor && (
                    <Pressable
                      style={[styles.actionBtn, { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryDim }]}
                      onPress={() => handleRemove(item.locationId, "supervisor")}
                    >
                      <Feather name="x" size={13} color={Colors.primary} />
                      <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Backup Supervisor */}
              <View style={styles.roleSection}>
                <View style={styles.roleLabelRow}>
                  <Text style={styles.roleLabel}>Backup Supervisor</Text>
                  {hasBackup && (
                    <View style={styles.toggleRow}>
                      <Text style={styles.toggleLabel}>
                        {item.backupActive ? "Active" : "Inactive"}
                      </Text>
                      <Switch
                        value={item.backupActive}
                        onValueChange={() => toggleBackupActive(item.locationId)}
                        trackColor={{ false: Colors.border, true: Colors.amber + "60" }}
                        thumbColor={item.backupActive ? Colors.amber : Colors.textSecondary}
                        style={{ transform: [{ scale: 0.8 }] }}
                      />
                    </View>
                  )}
                </View>
                {hasBackup ? (
                  <View style={styles.assignedRow}>
                    <View style={styles.avatar}>
                      <Feather name="shield" size={16} color={Colors.amber} />
                    </View>
                    <View style={styles.assignedInfo}>
                      <Text style={styles.assignedName}>{item.backupSupervisorUserName}</Text>
                      <Text style={styles.assignedMeta}>Badge: {item.backupSupervisorUserBadge}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyRow}>
                    <Feather name="user-x" size={16} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>Not assigned</Text>
                  </View>
                )}
                <View style={styles.btnRow}>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: Colors.amber + "40", backgroundColor: Colors.amber + "10" }]}
                    onPress={() => openPicker(item, "backup")}
                  >
                    <Feather name={hasBackup ? "refresh-cw" : "user-plus"} size={13} color={Colors.amber} />
                    <Text style={[styles.actionBtnText, { color: Colors.amber }]}>
                      {hasBackup ? "Replace" : "Assign"}
                    </Text>
                  </Pressable>
                  {hasBackup && (
                    <Pressable
                      style={[styles.actionBtn, { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryDim }]}
                      onPress={() => handleRemove(item.locationId, "backup")}
                    >
                      <Feather name="x" size={13} color={Colors.primary} />
                      <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Manpower footer */}
              <View style={styles.manpowerRow}>
                <Feather name="users" size={13} color={Colors.textSecondary} />
                <Text style={styles.manpowerText}>
                  Expected Manpower: {item.totalManpower}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* User Picker Modal */}
      <Modal
        visible={pickerAssignment !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerAssignment(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerTarget === "supervisor" ? "Select Supervisor" : "Select Backup"} for{" "}
                {pickerAssignment?.locationName ?? ""}
              </Text>
              <Pressable onPress={() => setPickerAssignment(null)} hitSlop={8}>
                <Feather name="x" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={availableUsers}
              keyExtractor={(item) => String(item.id)}
              style={styles.pickerList}
              renderItem={({ item }) => (
                <Pressable style={styles.pickerRow} onPress={() => handlePickUser(item)}>
                  <View style={styles.pickerAvatar}>
                    <Feather name="user" size={16} color={Colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{item.name}</Text>
                    <Text style={styles.pickerMeta}>
                      Badge: {item.badge} · {item.location}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
                </Pressable>
              )}
              ListEmptyComponent={
                <Text style={styles.pickerEmpty}>No available users.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary },
  list: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.xs },
  locationBadge: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  locationName: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.text },
  zoneBadge: {
    fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.info,
    backgroundColor: Colors.infoDim, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full,
  },
  roleSection: { gap: Spacing.xs },
  roleLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  roleLabel: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  toggleLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  assignedRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  avatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  assignedInfo: { flex: 1 },
  assignedName: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.text },
  assignedMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },
  emptyRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.sm,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  btnRow: { flexDirection: "row", gap: Spacing.xs, marginTop: Spacing.xs },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.xs, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  actionBtnText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  manpowerRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.xs,
    paddingTop: Spacing.xs, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  manpowerText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.xl, maxHeight: "75%",
  },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: Spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text, flex: 1 },
  pickerList: { maxHeight: 400 },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  pickerName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  pickerMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  pickerEmpty: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: "center", paddingVertical: Spacing.xl },
});
