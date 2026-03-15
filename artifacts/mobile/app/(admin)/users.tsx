import React, { useState, useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User, UserResponseStatus } from "@/types";

type FilterKey = "All" | "CPF" | "Camp";
const FILTERS: FilterKey[] = ["All", "CPF", "Camp"];

const STATUS_OPTIONS: { key: UserResponseStatus; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "missing", label: "Missing" },
  { key: "no_reply", label: "No Reply" },
  { key: "need_help", label: "Need Help" },
];

export default function UsersScreen() {
  const users = useStore((s) => s.users);
  const updateUserResponse = useStore((s) => s.updateUserResponse);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterKey>("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (selectedFilter !== "All") {
      result = result.filter((u) => u.zone === selectedFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.badge.toLowerCase().includes(q) ||
          u.location.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, selectedFilter, searchQuery]);

  const handleStatusUpdate = (userId: number, status: UserResponseStatus) => {
    updateUserResponse(userId, status);
    setSelectedUser(null);
  };

  const renderUserCard = ({ item }: { item: User }) => (
    <Pressable onPress={() => setSelectedUser(item)}>
      <Card style={styles.userCard}>
        <View style={styles.userCardHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userBadge}>Badge: {item.badge}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>
        <View style={styles.userMeta}>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {item.zone} · {item.location}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="clock" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {format(new Date(item.lastActivity), "MMM d, HH:mm")}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header title="Users" />

      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={Colors.textSecondary} />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, badge, or location..."
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {FILTERS.map((filter) => (
          <Pressable
            key={filter}
            style={[
              styles.filterChip,
              selectedFilter === filter && styles.filterChipActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === filter && styles.filterChipTextActive,
              ]}
            >
              {filter}
            </Text>
          </Pressable>
        ))}
        <View style={styles.filterCount}>
          <Text style={styles.filterCountText}>
            {filteredUsers.length} users
          </Text>
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderUserCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        visible={selectedUser !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedUser && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.modalName}>{selectedUser.name}</Text>
                  <StatusBadge status={selectedUser.status} />
                </View>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Badge</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedUser.badge}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Role</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedUser.role}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Zone</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedUser.zone}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Location</Text>
                    <Text style={styles.modalDetailValue}>
                      {selectedUser.location}
                    </Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Account</Text>
                    <StatusBadge
                      status={
                        selectedUser.accountStatus === "active"
                          ? "enabled"
                          : "disabled"
                      }
                    />
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Last Activity</Text>
                    <Text style={styles.modalDetailValue}>
                      {format(
                        new Date(selectedUser.lastActivity),
                        "MMM d, yyyy HH:mm"
                      )}
                    </Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {STATUS_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      style={[
                        styles.statusBtn,
                        selectedUser.status === opt.key && styles.statusBtnActive,
                      ]}
                      onPress={() =>
                        handleStatusUpdate(selectedUser.id, opt.key)
                      }
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          selectedUser.status === opt.key &&
                            styles.statusBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Button
                  title="Close"
                  onPress={() => setSelectedUser(null)}
                  variant="secondary"
                  fullWidth
                />
              </>
            )}
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
  searchWrap: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterCount: {
    flex: 1,
    alignItems: "flex-end",
  },
  filterCountText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  userCard: {
    gap: Spacing.sm,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
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
  userBadge: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  userMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  metaText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    gap: Spacing.lg,
  },
  modalHeader: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  modalAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  modalName: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalDetails: {
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  modalDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalDetailLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  modalDetailValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalSectionTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  statusBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  statusBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusBtnText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  statusBtnTextActive: {
    color: Colors.white,
  },
});
