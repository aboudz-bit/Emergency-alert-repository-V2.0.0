import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/ui/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User } from "@/types";

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  "Super Admin": { bg: Colors.primaryDim, text: Colors.primary },
  IT: { bg: Colors.infoDim, text: Colors.info },
  User: { bg: Colors.noreplyDim, text: Colors.noreply },
};

export default function ITDashboardScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const toggleAccountStatus = useStore((s) => s.toggleAccountStatus);
  const resetPassword = useStore((s) => s.resetPassword);
  const logout = useStore((s) => s.logout);

  const [search, setSearch] = useState("");
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.badge.toLowerCase().includes(q)
    );
  }, [users, search]);

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.accountStatus === "active").length;
    const disabled = total - active;
    const pendingApproval = users.filter((u) => u.approvalStatus === "pending").length;
    return { total, active, disabled, pendingApproval };
  }, [users]);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const handleToggleStatus = (user: User) => {
    const action =
      user.accountStatus === "active" ? "disable" : "enable";
    Alert.alert(
      `${action === "disable" ? "Disable" : "Enable"} Account`,
      `Are you sure you want to ${action} the account for ${user.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          style: action === "disable" ? "destructive" : "default",
          onPress: () => toggleAccountStatus(user.id),
        },
      ]
    );
  };

  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setPasswordError("");
    setResetModalVisible(true);
  };

  const handleResetPassword = () => {
    if (!newPassword.trim()) {
      setPasswordError("Password is required.");
      return;
    }
    if (newPassword.trim().length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (selectedUser) {
      resetPassword(selectedUser.id, newPassword.trim());
      setResetModalVisible(false);
      Alert.alert("Success", `Password has been reset for ${selectedUser.name}.`);
    }
  };

  const renderUserCard = ({ item }: { item: User }) => {
    const roleColor = ROLE_COLORS[item.role] || ROLE_COLORS.User;
    const isActive = item.accountStatus === "active";

    return (
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userBadge}>Badge: {item.badge}</Text>
          </View>
          <StatusBadge status={isActive ? "enabled" : "disabled"} />
        </View>

        <View style={styles.roleRow}>
          <View style={[styles.roleChip, { backgroundColor: roleColor.bg }]}>
            <Text style={[styles.roleChipText, { color: roleColor.text }]}>
              {item.role}
            </Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Button
            title="Reset Password"
            variant="secondary"
            onPress={() => openResetModal(item)}
            style={styles.actionBtn}
            textStyle={styles.actionBtnText}
          />
          <Button
            title={isActive ? "Disable" : "Enable"}
            variant={isActive ? "destructive" : "safe"}
            onPress={() => handleToggleStatus(item)}
            style={styles.actionBtn}
            textStyle={styles.actionBtnText}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="IT Administration"
        subtitle={currentUser?.name}
        rightAction={
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color={Colors.textSecondary} />
          </Pressable>
        }
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUserCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerSection}>
            {/* Search */}
            <Input
              placeholder="Search by name or badge..."
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.safe }]}>
                  {stats.active}
                </Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, { color: Colors.primary }]}>
                  {stats.disabled}
                </Text>
                <Text style={styles.statLabel}>Disabled</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <Button
                title={stats.pendingApproval > 0 ? `Approvals (${stats.pendingApproval})` : "Approvals"}
                onPress={() => router.push("/(it)/approvals")}
                fullWidth
                style={styles.approvalBtn}
              />
              <Button
                title="Create Admin"
                variant="secondary"
                onPress={() => router.push("/(it)/create-admin")}
                fullWidth
              />
            </View>

            {/* Section title */}
            <Text style={styles.sectionTitle}>All Accounts</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="users" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No accounts found</Text>
          </View>
        }
      />

      {/* Reset Password Modal */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>
              Set a new password for {selectedUser?.name}
            </Text>

            <Input
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError("");
              }}
              autoCapitalize="none"
              error={passwordError}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setResetModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                title="Confirm"
                variant="primary"
                onPress={handleResetPassword}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoutBtn: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
  },
  listContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  headerSection: {
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  /* Stats */
  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: "center",
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* Action Buttons */
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  approvalBtn: {
    flex: 1,
  },

  /* Section */
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  /* User Card */
  userCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  userName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  userBadge: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  roleRow: {
    flexDirection: "row",
    marginTop: Spacing.md,
  },
  roleChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleChipText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  cardActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 40,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
  },

  /* Empty */
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  modalContent: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
  },
});
