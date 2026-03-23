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
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User, UserRole, ApprovalStatus } from "@/types";

type FilterTab = "pending" | "approved" | "rejected" | "all";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

const ASSIGNABLE_ROLES: { label: string; value: UserRole }[] = [
  { label: "User", value: "User" },
  { label: "Supervisor", value: "Supervisor" },
  { label: "Back Superior", value: "Back Superior" },
  { label: "Super Admin", value: "Super Admin" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FEF3C7", text: "#92400E" },
  approved: { bg: "#D1FAE5", text: "#065F46" },
  rejected: { bg: "#FEE2E2", text: "#991B1B" },
};

export default function ApprovalsScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const approveUser = useStore((s) => s.approveUser);
  const rejectUser = useStore((s) => s.rejectUser);

  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [rejectModalUser, setRejectModalUser] = useState<User | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [roleOverride, setRoleOverride] = useState<UserRole | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const status = u.approvalStatus ?? "approved";
      if (activeTab === "all") return true;
      return status === activeTab;
    });
  }, [users, activeTab]);

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const u of users) {
      const s = u.approvalStatus ?? "approved";
      if (s === "pending") pending++;
      else if (s === "approved") approved++;
      else if (s === "rejected") rejected++;
    }
    return { pending, approved, rejected, all: users.length };
  }, [users]);

  const handleApprove = (user: User) => {
    Alert.alert(
      "Approve Registration",
      `Approve ${user.name} (Badge: ${user.badge})?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            approveUser(
              user.id,
              currentUser?.name ?? "IT Admin",
              roleOverride ?? undefined
            );
            setDetailUser(null);
            setRoleOverride(null);
          },
        },
      ]
    );
  };

  const openRejectModal = (user: User) => {
    setRejectModalUser(user);
    setRejectionReason("");
  };

  const handleReject = () => {
    if (rejectModalUser) {
      rejectUser(
        rejectModalUser.id,
        currentUser?.name ?? "IT Admin",
        rejectionReason.trim() || undefined
      );
      setRejectModalUser(null);
      setDetailUser(null);
      setRejectionReason("");
    }
  };

  const renderUserCard = ({ item }: { item: User }) => {
    const status = item.approvalStatus ?? "approved";
    const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.pending;

    return (
      <Card style={styles.userCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userBadge}>Badge: {item.badge}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
            <Text style={[styles.statusText, { color: statusColor.text }]}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Type:</Text>
          <Text style={styles.detailValue}>{item.userType ?? "Aramco"}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Role:</Text>
          <Text style={styles.detailValue}>{item.role}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Zone:</Text>
          <Text style={styles.detailValue}>{item.zone}</Text>
        </View>
        {item.mobileNumber ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <Text style={styles.detailValue}>{item.mobileNumber}</Text>
          </View>
        ) : null}
        {item.location ? (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{item.location}</Text>
          </View>
        ) : null}

        {status === "pending" && (
          <View style={styles.cardActions}>
            <Button
              title="Review"
              variant="primary"
              onPress={() => {
                setDetailUser(item);
                setRoleOverride(item.role);
              }}
              style={styles.actionBtn}
              textStyle={styles.actionBtnText}
            />
          </View>
        )}

        {status === "rejected" && item.rejectionReason ? (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Reason:</Text>
            <Text style={styles.rejectionText}>{item.rejectionReason}</Text>
          </View>
        ) : null}
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Registration Approvals"
        leftAction={
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={20} color={Colors.text} />
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
            <View style={styles.statsRow}>
              {FILTER_TABS.map((tab) => (
                <Pressable
                  key={tab.key}
                  style={[
                    styles.tabBtn,
                    activeTab === tab.key && styles.tabBtnActive,
                  ]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text
                    style={[
                      styles.tabCount,
                      activeTab === tab.key && styles.tabCountActive,
                    ]}
                  >
                    {counts[tab.key]}
                  </Text>
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab.key && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              No {activeTab === "all" ? "" : activeTab} registrations
            </Text>
          </View>
        }
      />

      {/* Review Detail Modal */}
      <Modal
        visible={detailUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetailUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Review Registration</Text>

            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Name</Text>
              <Text style={styles.modalDetailValue}>{detailUser?.name}</Text>
            </View>
            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Badge</Text>
              <Text style={styles.modalDetailValue}>{detailUser?.badge}</Text>
            </View>
            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Mobile</Text>
              <Text style={styles.modalDetailValue}>
                {detailUser?.mobileNumber || "—"}
              </Text>
            </View>
            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Type</Text>
              <Text style={styles.modalDetailValue}>
                {detailUser?.userType ?? "Aramco"}
              </Text>
            </View>
            <View style={styles.modalDetail}>
              <Text style={styles.modalDetailLabel}>Zone</Text>
              <Text style={styles.modalDetailValue}>{detailUser?.zone}</Text>
            </View>
            {detailUser?.location ? (
              <View style={styles.modalDetail}>
                <Text style={styles.modalDetailLabel}>Location</Text>
                <Text style={styles.modalDetailValue}>
                  {detailUser.location}
                </Text>
              </View>
            ) : null}

            {(detailUser?.userType ?? "Aramco") === "Aramco" && (
              <View style={styles.sectionGap}>
                <Text style={styles.sectionLabel}>Assign Role</Text>
                <View style={styles.chipRow}>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <Pressable
                      key={r.value}
                      style={[
                        styles.chip,
                        roleOverride === r.value && styles.chipSelected,
                      ]}
                      onPress={() => setRoleOverride(r.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          roleOverride === r.value && styles.chipTextSelected,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <Button
                title="Reject"
                variant="destructive"
                onPress={() => {
                  if (detailUser) openRejectModal(detailUser);
                  setDetailUser(null);
                }}
                style={styles.modalBtn}
              />
              <Button
                title="Approve"
                variant="safe"
                onPress={() => {
                  if (detailUser) handleApprove(detailUser);
                }}
                style={styles.modalBtn}
              />
            </View>

            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setDetailUser(null);
                setRoleOverride(null);
              }}
              fullWidth
            />
          </View>
        </View>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        visible={rejectModalUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Registration</Text>
            <Text style={styles.modalSubtitle}>
              Rejecting {rejectModalUser?.name} (Badge:{" "}
              {rejectModalUser?.badge})
            </Text>

            <Input
              label="Rejection Reason (optional)"
              placeholder="Enter reason for rejection"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              autoCapitalize="sentences"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="secondary"
                onPress={() => setRejectModalUser(null)}
                style={styles.modalBtn}
              />
              <Button
                title="Reject"
                variant="destructive"
                onPress={handleReject}
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
  backBtn: {
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

  statsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    alignItems: "center",
    gap: 2,
  },
  tabBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  tabCount: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  tabCountActive: {
    color: Colors.primary,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: Colors.primary,
  },

  userCard: {
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
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
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },

  detailRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    width: 70,
  },
  detailValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    flex: 1,
  },

  cardActions: {
    marginTop: Spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnText: {
    fontSize: FontSize.sm,
  },

  rejectionBox: {
    marginTop: Spacing.md,
    backgroundColor: "#FEF2F2",
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
  },
  rejectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: "#991B1B",
    marginBottom: 2,
  },
  rejectionText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: "#7F1D1D",
  },

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

  sectionGap: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  chipText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },

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
    gap: Spacing.md,
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
  },
  modalDetail: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  modalDetailLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    width: 70,
  },
  modalDetailValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    flex: 1,
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
