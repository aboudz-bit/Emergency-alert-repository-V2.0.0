import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { ALL_PERMISSIONS } from "@/types";
import type { PermissionKey, User } from "@/types";
import {
  PermissionModuleCard,
  type PermissionSubItem,
} from "@/components/ui/PermissionModuleCard";

// ─── Permission Module Groupings ────────────────────────────────────────────

interface PermissionModule {
  id: string;
  title: string;
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  permissions: PermissionSubItem[];
}

const PERMISSION_MODULES: PermissionModule[] = [
  {
    id: "live-map",
    title: "Live Map",
    icon: "map",
    iconColor: "#3B82F6",
    iconBg: "rgba(59, 130, 246, 0.10)",
    permissions: [
      { key: "canViewGlobalLiveMap", label: "View Global Live Map" },
      { key: "canReviewAlertMonitor", label: "Review Alert Monitor" },
    ],
  },
  {
    id: "eco-controls",
    title: "ECO / Alert Controls",
    icon: "alert-triangle",
    iconColor: "#F59E0B",
    iconBg: "rgba(245, 158, 11, 0.10)",
    permissions: [
      { key: "canChangeWindDirection", label: "Change Wind Direction" },
      { key: "canPlaceWarningZone", label: "Place Warning Zone" },
      { key: "canEditHazardZone", label: "Edit Hazard Zone" },
      { key: "canDeleteHazardZone", label: "Delete Hazard Zone" },
      { key: "canUnlockHazardZone", label: "Unlock Hazard Zone" },
    ],
  },
  {
    id: "shelters",
    title: "Shelters",
    icon: "home",
    iconColor: "#16A34A",
    iconBg: "rgba(22, 163, 74, 0.10)",
    permissions: [{ key: "canManageShelters", label: "Manage Shelters" }],
  },
];

// ─── Screen ─────────────────────────────────────────────────────────────────

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const users = useStore((s) => s.users);
  const setUserPermissions = useStore((s) => s.setUserPermissions);
  const getUserPermissions = useStore((s) => s.getUserPermissions);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localPerms, setLocalPerms] = useState<PermissionKey[]>([]);

  const eligibleUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.accountStatus === "active" &&
          u.isActive &&
          u.role !== "Super Admin" &&
          u.role !== "IT"
      ),
    [users]
  );

  const usersWithPerms = useMemo(
    () => eligibleUsers.filter((u) => (u.permissions || []).length > 0),
    [eligibleUsers]
  );

  const openEditor = useCallback(
    (user: User) => {
      setSelectedUser(user);
      setLocalPerms(getUserPermissions(user.id));
    },
    [getUserPermissions]
  );

  const togglePerm = useCallback((perm: PermissionKey) => {
    setLocalPerms((prev) =>
      prev.includes(perm)
        ? prev.filter((p) => p !== perm)
        : [...prev, perm]
    );
  }, []);

  const saveAndClose = useCallback(() => {
    if (selectedUser) {
      const isECO =
        selectedUser.isECOAssigned && selectedUser.ecoAssignmentActive;
      const defaults: PermissionKey[] = isECO
        ? ["canViewGlobalLiveMap", "canReviewAlertMonitor", "canChangeWindDirection"]
        : [];
      const explicit = localPerms.filter((p) => !defaults.includes(p));
      setUserPermissions(selectedUser.id, explicit);
    }
    setSelectedUser(null);
    setLocalPerms([]);
  }, [selectedUser, localPerms, setUserPermissions]);

  // Compute default perms for selected user
  const defaultPerms = useMemo((): PermissionKey[] => {
    if (!selectedUser) return [];
    const isECO =
      selectedUser.isECOAssigned && selectedUser.ecoAssignmentActive;
    return isECO
      ? ["canViewGlobalLiveMap", "canReviewAlertMonitor", "canChangeWindDirection"]
      : [];
  }, [selectedUser]);

  const renderUserCard = useCallback(
    ({ item }: { item: User }) => {
      const perms = item.permissions || [];
      const isECO = item.isECOAssigned && item.ecoAssignmentActive;
      return (
        <Pressable
          style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
          onPress={() => openEditor(item)}
        >
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userMeta}>
              {item.badge} · {item.role}
              {isECO ? " · ECO" : ""}
              {item.isSupervisorAssigned ? " · Supervisor" : ""}
            </Text>
            {perms.length > 0 && (
              <View style={styles.permChips}>
                {perms.slice(0, 3).map((p) => (
                  <View key={p} style={styles.permChip}>
                    <Text style={styles.permChipText}>
                      {ALL_PERMISSIONS.find((ap) => ap.key === p)?.label || p}
                    </Text>
                  </View>
                ))}
                {perms.length > 3 && (
                  <View style={[styles.permChip, styles.permChipMore]}>
                    <Text style={styles.permChipText}>
                      +{perms.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
          <Feather
            name="chevron-right"
            size={16}
            color={Colors.textTertiary}
          />
        </Pressable>
      );
    },
    [openEditor]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>Permissions</Text>
          <Text style={styles.headerSubtitle}>
            Assign granular permissions to users
          </Text>
        </View>
      </View>

      {/* Users with assigned permissions */}
      {usersWithPerms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Users with Custom Permissions
          </Text>
          {usersWithPerms.map((u) => (
            <React.Fragment key={u.id}>
              {renderUserCard({ item: u })}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* All eligible users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          All Users ({eligibleUsers.length})
        </Text>
      </View>
      <FlatList
        data={eligibleUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* ═══ Permission Editor Modal ═══ */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSelectedUser(null);
          setLocalPerms([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              { paddingBottom: insets.bottom + Spacing.lg },
            ]}
          >
            {/* ── Modal Handle ── */}
            <View style={styles.modalHandle}>
              <View style={styles.handleBar} />
            </View>

            {/* ── Modal Header ── */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalIconWrap}>
                  <Feather name="shield" size={22} color={Colors.primary} />
                </View>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Edit Permissions</Text>
                  <Text style={styles.modalUserName}>
                    {selectedUser?.name}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => {
                  setSelectedUser(null);
                  setLocalPerms([]);
                }}
                hitSlop={8}
              >
                <Feather name="x" size={18} color={Colors.textTertiary} />
              </Pressable>
            </View>

            {/* ── User info strip ── */}
            <View style={styles.userStrip}>
              <View style={styles.userStripAvatar}>
                <Text style={styles.userStripAvatarText}>
                  {selectedUser?.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.userStripInfo}>
                <Text style={styles.userStripName}>
                  {selectedUser?.name}
                </Text>
                <Text style={styles.userStripMeta}>
                  {selectedUser?.badge} · {selectedUser?.role}
                  {selectedUser?.isECOAssigned &&
                  selectedUser?.ecoAssignmentActive
                    ? " · ECO"
                    : ""}
                </Text>
              </View>
            </View>

            {/* ── Module cards ── */}
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              {defaultPerms.length > 0 && (
                <View style={styles.roleNote}>
                  <Feather
                    name="info"
                    size={14}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.roleNoteText}>
                    Role-based defaults are shown but cannot be removed.
                  </Text>
                </View>
              )}

              {PERMISSION_MODULES.map((mod) => (
                <PermissionModuleCard
                  key={mod.id}
                  icon={mod.icon}
                  iconColor={mod.iconColor}
                  iconBg={mod.iconBg}
                  title={mod.title}
                  permissions={mod.permissions}
                  activePerms={localPerms}
                  defaultPerms={defaultPerms}
                  onToggle={togglePerm}
                />
              ))}
            </ScrollView>

            {/* ── Save button ── */}
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.saveBtn,
                  pressed && styles.saveBtnPressed,
                ]}
                onPress={saveAndClose}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>Save Permissions</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleArea: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  userMeta: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  permChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  permChip: {
    backgroundColor: Colors.primaryDim,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  permChipMore: {
    backgroundColor: Colors.surfaceElevated,
  },
  permChipText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  separator: {
    height: Spacing.sm,
  },

  // ─── Modal ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xxl + 4,
    borderTopRightRadius: BorderRadius.xxl + 4,
    maxHeight: "92%",
  },
  modalHandle: {
    alignItems: "center",
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.xs,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  modalIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  modalHeaderText: {
    flex: 1,
    gap: 2,
  },
  modalTitle: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalUserName: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  userStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  userStripAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  userStripAvatarText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  userStripInfo: {
    flex: 1,
    gap: 1,
  },
  userStripName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  userStripMeta: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  roleNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  roleNoteText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  modalActions: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.md + 2,
  },
  saveBtnPressed: {
    opacity: 0.85,
  },
  saveBtnText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
