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
import type { EcoSlot, User } from "@/types";

export default function EcoManagementScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ecoAssignments = useStore((s) => s.ecoAssignments);
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const assignEco = useStore((s) => s.assignEco);
  const toggleEcoActive = useStore((s) => s.toggleEcoActive);

  const [pickerSlot, setPickerSlot] = useState<EcoSlot | null>(null);
  const [pickerMode, setPickerMode] = useState<"user" | "zone">("user");
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const activeUsers = useMemo(
    () => users.filter((u) => u.accountStatus === "active" && u.isActive),
    [users]
  );

  const assignedUserIds = useMemo(() => {
    const ids = new Set<number>();
    for (const a of ecoAssignments) {
      if (a.assignedUserId) ids.add(a.assignedUserId);
    }
    return ids;
  }, [ecoAssignments]);

  const availableUsers = useMemo(
    () => activeUsers.filter((u) => !assignedUserIds.has(u.id)),
    [activeUsers, assignedUserIds]
  );

  const openUserPicker = useCallback((slot: EcoSlot) => {
    setPickerSlot(slot);
    setPickerMode("user");
    setPendingUserId(null);
  }, []);

  const handlePickUser = useCallback(
    (user: User) => {
      setPendingUserId(user.id);
      setPickerMode("zone");
    },
    []
  );

  const handlePickZone = useCallback(
    (zoneId: number) => {
      if (!pickerSlot || !pendingUserId) return;
      assignEco(pickerSlot, pendingUserId, zoneId);
      setPickerSlot(null);
      setPendingUserId(null);
    },
    [pickerSlot, pendingUserId, assignEco]
  );

  const handleRemove = useCallback(
    (slot: EcoSlot) => {
      assignEco(slot, null, null);
    },
    [assignEco]
  );

  const slotLabels: Record<EcoSlot, string> = { A: "ECO A", B: "ECO B", C: "ECO C" };
  const slotColors: Record<EcoSlot, string> = {
    A: Colors.primary,
    B: Colors.info,
    C: Colors.amber,
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ECO Management</Text>
          <Text style={styles.headerSub}>Assign Emergency Coordinators</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={ecoAssignments}
        keyExtractor={(item) => item.ecoSlot}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => {
          const color = slotColors[item.ecoSlot];
          const hasUser = !!item.assignedUserId;
          return (
            <View style={styles.card}>
              {/* Slot header */}
              <View style={styles.cardHeader}>
                <View style={[styles.slotBadge, { backgroundColor: color + "20" }]}>
                  <Text style={[styles.slotBadgeText, { color }]}>
                    {slotLabels[item.ecoSlot]}
                  </Text>
                </View>
                {hasUser && (
                  <View style={styles.activeToggle}>
                    <Text style={styles.activeLabel}>
                      {item.active ? "Active" : "Inactive"}
                    </Text>
                    <Switch
                      value={item.active}
                      onValueChange={() => toggleEcoActive(item.ecoSlot)}
                      trackColor={{ false: Colors.border, true: color + "60" }}
                      thumbColor={item.active ? color : Colors.textSecondary}
                      style={{ transform: [{ scale: 0.85 }] }}
                    />
                  </View>
                )}
              </View>

              {/* Assignment */}
              {hasUser ? (
                <View style={styles.assignedBlock}>
                  <View style={styles.assignedAvatar}>
                    <Feather name="shield" size={20} color={color} />
                  </View>
                  <View style={styles.assignedInfo}>
                    <Text style={styles.assignedName}>
                      {item.assignedUserName}
                    </Text>
                    <Text style={styles.assignedMeta}>
                      Badge: {item.assignedUserBadge} · Zone: {item.assignedZoneName}
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyBlock}>
                  <Feather name="user-x" size={20} color={Colors.textTertiary} />
                  <Text style={styles.emptyText}>Not assigned</Text>
                </View>
              )}

              {/* Actions */}
              <View style={styles.cardActions}>
                <Pressable
                  style={[styles.actionBtn, { borderColor: color + "40", backgroundColor: color + "10" }]}
                  onPress={() => openUserPicker(item.ecoSlot)}
                >
                  <Feather name={hasUser ? "refresh-cw" : "user-plus"} size={14} color={color} />
                  <Text style={[styles.actionBtnText, { color }]}>
                    {hasUser ? "Replace" : "Assign"}
                  </Text>
                </Pressable>
                {hasUser && (
                  <Pressable
                    style={[styles.actionBtn, { borderColor: Colors.primaryBorder, backgroundColor: Colors.primaryDim }]}
                    onPress={() => handleRemove(item.ecoSlot)}
                  >
                    <Feather name="x" size={14} color={Colors.primary} />
                    <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Picker Modal */}
      <Modal
        visible={pickerSlot !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerSlot(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {pickerMode === "user"
                  ? `Select User for ${pickerSlot ? slotLabels[pickerSlot] : ""}`
                  : "Select Zone"}
              </Text>
              <Pressable onPress={() => setPickerSlot(null)} hitSlop={8}>
                <Feather name="x" size={22} color={Colors.textSecondary} />
              </Pressable>
            </View>

            {pickerMode === "user" ? (
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
            ) : (
              <FlatList
                data={zones.filter((z) => z.isActive && !z.isArchived)}
                keyExtractor={(item) => String(item.id)}
                style={styles.pickerList}
                renderItem={({ item }) => (
                  <Pressable style={styles.pickerRow} onPress={() => handlePickZone(item.id)}>
                    <View style={[styles.zoneDot, { backgroundColor: item.color }]} />
                    <Text style={styles.pickerName}>{item.name}</Text>
                    <Feather name="check-circle" size={18} color={Colors.safe} />
                  </Pressable>
                )}
              />
            )}
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
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, gap: Spacing.md,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  slotBadge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  slotBadgeText: { fontSize: FontSize.sm, fontFamily: "Inter_700Bold" },
  activeToggle: { flexDirection: "row", alignItems: "center", gap: Spacing.xs },
  activeLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  assignedBlock: { flexDirection: "row", alignItems: "center", gap: Spacing.md },
  assignedAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  assignedInfo: { flex: 1 },
  assignedName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  assignedMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  emptyBlock: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.md,
  },
  emptyText: { fontSize: FontSize.sm, color: Colors.textTertiary },
  cardActions: { flexDirection: "row", gap: Spacing.sm },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: Spacing.xs, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm, borderWidth: 1,
  },
  actionBtnText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold" },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: Spacing.xl, maxHeight: "75%",
  },
  modalHandle: { width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center", marginBottom: Spacing.md },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  pickerList: { maxHeight: 400 },
  pickerRow: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  pickerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  pickerName: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1 },
  pickerMeta: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  pickerEmpty: { fontSize: FontSize.sm, color: Colors.textTertiary, textAlign: "center", paddingVertical: Spacing.xl },
  zoneDot: { width: 12, height: 12, borderRadius: 6 },
});
