import React, { useMemo, useState, useCallback } from "react";
import {
  Alert as RNAlert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { User } from "@/types";

type FilterTab = "all" | "confirmed" | "missing" | "no_reply" | "need_help";

export default function PersonnelScreen() {
  const currentUser = useStore((s) => s.currentUser);
  const users = useStore((s) => s.users);
  const locations = useStore((s) => s.locations);
  const removePersonnelFromLocation = useStore((s) => s.removePersonnelFromLocation);

  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const isBackup =
    currentUser?.isBackupSupervisorAssigned === true &&
    !currentUser?.isSupervisorAssigned;
  const locName = currentUser?.supervisorLocationName ?? "";
  const zoneName = currentUser?.supervisorZoneName ?? currentUser?.zone ?? "";

  const myLocation = useMemo(
    () => locations.find((l) => l.name === locName && l.zone === zoneName),
    [locations, locName, zoneName]
  );

  // Only show users matching BOTH zone AND location
  const locationUsers = useMemo(
    () =>
      users.filter(
        (u) => u.location === locName && u.zone === zoneName && u.isActive
      ),
    [users, locName, zoneName]
  );

  const counts = useMemo(
    () => ({
      all: locationUsers.length,
      confirmed: locationUsers.filter((u) => u.status === "confirmed").length,
      missing: locationUsers.filter((u) => u.status === "missing").length,
      no_reply: locationUsers.filter((u) => u.status === "no_reply").length,
      need_help: locationUsers.filter((u) => u.status === "need_help").length,
    }),
    [locationUsers]
  );

  const filteredUsers = useMemo(
    () =>
      activeTab === "all"
        ? locationUsers
        : locationUsers.filter((u) => u.status === activeTab),
    [locationUsers, activeTab]
  );

  const handleRemove = useCallback(
    (user: User) => {
      // Guard: only allow removing users from supervisor's own location
      if (user.location !== locName || user.zone !== zoneName) return;
      RNAlert.alert(
        "Remove Personnel",
        `Remove ${user.name} (${user.badge}) from ${locName}?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: () => removePersonnelFromLocation(user.id),
          },
        ]
      );
    },
    [locName, zoneName, removePersonnelFromLocation]
  );

  const tabs: { key: FilterTab; label: string; color: string }[] = [
    { key: "all", label: "All", color: Colors.text },
    { key: "confirmed", label: "Safe", color: Colors.safe },
    { key: "missing", label: "Missing", color: Colors.missing },
    { key: "no_reply", label: "No Reply", color: Colors.noreply },
    { key: "need_help", label: "Help", color: Colors.primary },
  ];

  const renderItem = ({ item }: { item: User }) => (
    <Card style={styles.personCard}>
      <View style={styles.personRow}>
        <View style={styles.personAvatar}>
          <Feather name="user" size={18} color={Colors.textSecondary} />
        </View>
        <View style={styles.personInfo}>
          <Text style={styles.personName}>{item.name}</Text>
          <Text style={styles.personBadge}>
            Badge: {item.badge} • {item.location}
          </Text>
        </View>
        <View style={styles.personRight}>
          <StatusBadge status={item.status} />
          <Text style={styles.personTime}>
            {format(new Date(item.lastActivity), "h:mm a")}
          </Text>
        </View>
        {!isBackup && (
          <Pressable
            style={styles.removeBtn}
            onPress={() => handleRemove(item)}
            hitSlop={8}
          >
            <Feather name="x-circle" size={18} color={Colors.primary} />
          </Pressable>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Personnel" subtitle={`${locName} • ${zoneName}`} />

      {/* ── Summary bar ── */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryLabel}>
          {locationUsers.length} assigned
          {myLocation
            ? ` / ${myLocation.expectedManpower} expected`
            : ""}
        </Text>
        <Text style={styles.summaryHint}>
          {locName} only
        </Text>
      </View>

      {/* ── Filter tabs ── */}
      <View style={styles.tabRow}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && {
                backgroundColor: tab.color + "20",
                borderColor: tab.color + "40",
              },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && { color: tab.color },
              ]}
            >
              {tab.label} ({counts[tab.key]})
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="users" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              No personnel{" "}
              {activeTab !== "all"
                ? `with status "${activeTab.replace("_", " ")}"`
                : "found"}
              .
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  summaryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  summaryHint: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  tabRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  personCard: { paddingVertical: Spacing.sm },
  personRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  personAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  personInfo: { flex: 1 },
  personName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  personBadge: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  personRight: { alignItems: "flex-end", gap: 4 },
  personTime: { fontSize: FontSize.xs, color: Colors.textTertiary },
  removeBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    textAlign: "center",
    paddingVertical: Spacing.md,
  },
});
