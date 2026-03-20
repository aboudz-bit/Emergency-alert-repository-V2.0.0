import React, { useMemo, useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
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
import { ALL_PERMISSIONS } from "@/types";
import type { PermissionKey, User } from "@/types";

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const users = useStore((s) => s.users);
  const setUserPermissions = useStore((s) => s.setUserPermissions);
  const getUserPermissions = useStore((s) => s.getUserPermissions);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localPerms, setLocalPerms] = useState<PermissionKey[]>([]);

  const eligibleUsers = useMemo(
    () => users.filter((u) => u.accountStatus === "active" && u.isActive && u.role !== "Super Admin" && u.role !== "IT"),
    [users]
  );

  const usersWithPerms = useMemo(
    () => eligibleUsers.filter((u) => (u.permissions || []).length > 0),
    [eligibleUsers]
  );

  const openEditor = useCallback((user: User) => {
    setSelectedUser(user);
    setLocalPerms(getUserPermissions(user.id));
  }, [getUserPermissions]);

  const togglePerm = useCallback((perm: PermissionKey) => {
    setLocalPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  }, []);

  const saveAndClose = useCallback(() => {
    if (selectedUser) {
      // Filter out role-based defaults to only store explicitly granted perms
      const isECO = selectedUser.isECOAssigned && selectedUser.ecoAssignmentActive;
      const defaults: PermissionKey[] = isECO ? ["canViewGlobalLiveMap", "canReviewAlertMonitor"] : [];
      const explicit = localPerms.filter((p) => !defaults.includes(p));
      setUserPermissions(selectedUser.id, explicit);
    }
    setSelectedUser(null);
    setLocalPerms([]);
  }, [selectedUser, localPerms, setUserPermissions]);

  const renderUserCard = useCallback(({ item }: { item: User }) => {
    const perms = item.permissions || [];
    const isECO = item.isECOAssigned && item.ecoAssignmentActive;
    return (
      <Pressable
        style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
        onPress={() => openEditor(item)}
      >
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
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
                  <Text style={styles.permChipText}>+{perms.length - 3}</Text>
                </View>
              )}
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
      </Pressable>
    );
  }, [openEditor]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.headerTitleArea}>
          <Text style={styles.headerTitle}>Permissions</Text>
          <Text style={styles.headerSubtitle}>Assign granular permissions to users</Text>
        </View>
      </View>

      {/* Users with assigned permissions */}
      {usersWithPerms.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Users with Custom Permissions</Text>
          {usersWithPerms.map((u) => (
            <React.Fragment key={u.id}>
              {renderUserCard({ item: u })}
            </React.Fragment>
          ))}
        </View>
      )}

      {/* All eligible users */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Users ({eligibleUsers.length})</Text>
      </View>
      <FlatList
        data={eligibleUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      {/* Permission Editor Modal */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="slide"
        onRequestClose={() => { setSelectedUser(null); setLocalPerms([]); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {selectedUser?.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.modalName}>{selectedUser?.name}</Text>
                  <Text style={styles.modalBadge}>
                    {selectedUser?.badge} · {selectedUser?.role}
                  </Text>
                </View>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => { setSelectedUser(null); setLocalPerms([]); }}
                hitSlop={8}
              >
                <Feather name="x" size={18} color={Colors.textTertiary} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <Text style={styles.modalSectionTitle}>Permissions</Text>
              <Text style={styles.modalSectionDesc}>
                Toggle permissions for this user. Role-based defaults are shown but cannot be removed.
              </Text>

              {ALL_PERMISSIONS.map((perm) => {
                const isActive = localPerms.includes(perm.key);
                const isECO = selectedUser?.isECOAssigned && selectedUser?.ecoAssignmentActive;
                const isDefault =
                  isECO && (perm.key === "canViewGlobalLiveMap" || perm.key === "canReviewAlertMonitor");

                return (
                  <View key={perm.key} style={styles.permRow}>
                    <View style={styles.permInfo}>
                      <Text style={styles.permLabel}>{perm.label}</Text>
                      <Text style={styles.permDesc}>{perm.description}</Text>
                      {isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Role Default</Text>
                        </View>
                      )}
                    </View>
                    <Switch
                      value={isActive}
                      onValueChange={() => {
                        if (isDefault) return;
                        togglePerm(perm.key);
                      }}
                      disabled={isDefault}
                      trackColor={{ false: Colors.border, true: Colors.primary + "60" }}
                      thumbColor={isActive ? Colors.primary : Colors.surfaceElevated}
                    />
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  modalName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalBadge: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalSectionTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalSectionDesc: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  permRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  permInfo: {
    flex: 1,
    gap: 2,
  },
  permLabel: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  permDesc: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  defaultBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.safe + "20",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  defaultBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.safe,
  },
  modalActions: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  saveBtnPressed: {
    opacity: 0.8,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
