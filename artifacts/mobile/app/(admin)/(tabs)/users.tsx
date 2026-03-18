import React, { useState, useMemo, useCallback } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User, UserResponseStatus } from "@/types";

const SCREEN_H = Dimensions.get("window").height;

const STATUS_OPTIONS: { key: UserResponseStatus; label: string }[] = [
  { key: "confirmed", label: "Safe" },
  { key: "pending", label: "Pending" },
  { key: "need_help", label: "Need Help" },
];

export default function UsersScreen() {
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const updateUserResponse = useStore((s) => s.updateUserResponse);

  const filterOptions = useMemo(() => {
    const zoneNames = zones.filter((z) => z.isActive).map((z) => z.name);
    return ["All", ...zoneNames];
  }, [zones]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState<"All" | UserResponseStatus>("All");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const statusFilterOptions: { key: "All" | UserResponseStatus; label: string }[] = [
    { key: "All", label: "All" },
    { key: "confirmed", label: "Safe" },
    { key: "pending", label: "Pending" },
    { key: "need_help", label: "Need Help" },
  ];

  const filteredUsers = useMemo(() => {
    let result = users;
    if (selectedFilter !== "All") {
      const filterZone = zones.find((z) => z.name === selectedFilter);
      if (filterZone) {
        result = result.filter((u) => u.zoneId === filterZone.id);
      }
    }
    if (selectedStatus !== "All") {
      result = result.filter((u) => u.status === selectedStatus);
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
  }, [users, zones, selectedFilter, selectedStatus, searchQuery]);

  const handleStatusUpdate = useCallback(
    (userId: number, status: UserResponseStatus) => {
      updateUserResponse(userId, status);
      setSelectedUser(null);
    },
    [updateUserResponse]
  );

  const renderUserCard = useCallback(
    ({ item }: { item: User }) => (
      <Pressable onPress={() => setSelectedUser(item)}>
        <View style={styles.userCard}>
          <View style={styles.userCardHeader}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userBadge}>{item.badge}</Text>
            </View>
            <StatusBadge status={item.status} />
          </View>
          <View style={styles.userMeta}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={11} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {item.zone} · {item.location}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Feather name="clock" size={11} color={Colors.textSecondary} />
              <Text style={styles.metaText}>
                {format(new Date(item.lastActivity), "MMM d, HH:mm")}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    ),
    []
  );

  return (
    <View style={styles.container}>
      <Header title="Users" />

      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color={Colors.textSecondary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search name, badge, location..."
            placeholderTextColor={Colors.textTertiary}
            style={styles.searchInput}
          />
        </View>
      </View>

      <View style={styles.filterRow}>
        {filterOptions.map((filter) => (
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
      </View>

      <View style={styles.filterRow}>
        {statusFilterOptions.map((opt) => (
          <Pressable
            key={opt.key}
            style={[
              styles.filterChip,
              selectedStatus === opt.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(opt.key)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === opt.key && styles.filterChipTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
        <View style={styles.filterCount}>
          <Text style={styles.filterCountText}>
            {filteredUsers.length}
          </Text>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderUserCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="users" size={36} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        }
      />

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
                    <Text style={styles.modalDetailValue}>{selectedUser.badge}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Role</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.role}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Zone</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.zone}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Location</Text>
                    <Text style={styles.modalDetailValue}>{selectedUser.location}</Text>
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Account</Text>
                    <StatusBadge
                      status={selectedUser.accountStatus === "active" ? "enabled" : "disabled"}
                    />
                  </View>
                  <View style={styles.modalDetailRow}>
                    <Text style={styles.modalDetailLabel}>Last Active</Text>
                    <Text style={styles.modalDetailValue}>
                      {format(new Date(selectedUser.lastActivity), "MMM d, HH:mm")}
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
                      onPress={() => handleStatusUpdate(selectedUser.id, opt.key)}
                    >
                      <Text
                        style={[
                          styles.statusBtnText,
                          selectedUser.status === opt.key && styles.statusBtnTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Pressable
                  style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.8 }]}
                  onPress={() => setSelectedUser(null)}
                >
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
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

  // ─── Search ───
  searchWrap: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingLeft: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    paddingVertical: 0,
    paddingRight: 12,
    height: 40,
  },

  // ─── Filters ───
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    height: 32,
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
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
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
  },

  // ─── List ───
  listContent: {
    paddingHorizontal: 12,
    gap: 6,
    paddingTop: 4,
    paddingBottom: 80,
  },
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  userCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  userInfo: {
    flex: 1,
    gap: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  userBadge: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  userMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },

  // ─── Empty ───
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 16,
    width: "100%",
    maxWidth: 380,
    maxHeight: SCREEN_H * 0.7,
    gap: 10,
  },
  modalHeader: {
    alignItems: "center",
    gap: 6,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  modalName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalDetails: {
    gap: 8,
    paddingVertical: 10,
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
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  modalDetailValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  modalSectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },

  // ─── Status grid (2×2) ───
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusBtn: {
    width: "48.5%" as any,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusBtnText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  statusBtnTextActive: {
    color: Colors.white,
  },

  // ─── Close ───
  closeBtn: {
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
});
