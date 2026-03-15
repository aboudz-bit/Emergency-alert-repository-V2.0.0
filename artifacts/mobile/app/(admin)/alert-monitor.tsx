import React, { useState, useMemo, useCallback } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ZoneBreakdown } from "@/components/ui/ZoneBreakdown";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert } from "@/store";
import { useZoneBreakdown } from "@/hooks/useZoneBreakdown";
import type { UserResponseStatus } from "@/types";

type TabKey = "confirmed" | "missing" | "no_reply" | "need_help";

const TABS: { key: TabKey; label: string; color: string }[] = [
  { key: "confirmed", label: "Safe", color: Colors.safe },
  { key: "missing", label: "Missing", color: Colors.missing },
  { key: "no_reply", label: "No Reply", color: Colors.noreply },
  { key: "need_help", label: "Help", color: Colors.primary },
];

export default function AlertMonitorScreen() {
  const activeAlert = useStore(selectActiveAlert);
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const sendAllClear = useStore((s) => s.sendAllClear);
  const closeAlert = useStore((s) => s.closeAlert);

  const [selectedTab, setSelectedTab] = useState<TabKey>("confirmed");

  const zoneStats = useZoneBreakdown(users, zones, activeAlert);

  const isMultiZone = zoneStats.length > 1;

  const filteredUsers = useMemo(
    () => users.filter((u) => u.status === selectedTab),
    [users, selectedTab]
  );

  const getTabCount = useCallback(
    (key: TabKey) => {
      if (!activeAlert) return 0;
      switch (key) {
        case "confirmed": return activeAlert.stats.confirmed;
        case "missing": return activeAlert.stats.missing;
        case "no_reply": return activeAlert.stats.noReply;
        case "need_help": return activeAlert.stats.needHelp;
      }
    },
    [activeAlert]
  );

  if (!activeAlert) {
    return (
      <View style={styles.container}>
        <Header title="Alert Monitor" showBack />
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="check-circle" size={48} color={Colors.safe} />
          </View>
          <Text style={styles.emptyTitle}>No Active Alert</Text>
          <Text style={styles.emptyText}>
            All clear. No emergency alerts are currently active.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Alert Monitor" showBack />

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertHeaderLeft}>
              <View style={styles.alertIconWrap}>
                <Feather name="alert-triangle" size={16} color={Colors.primary} />
              </View>
              <View style={styles.alertTitleWrap}>
                <Text style={styles.alertType}>{activeAlert.type}</Text>
                <Text style={styles.alertMeta}>
                  {activeAlert.zone} · {format(new Date(activeAlert.timestamp), "MMM d, HH:mm")}
                </Text>
              </View>
            </View>
            <StatusBadge status="active" />
          </View>
        </Card>

        <View style={styles.tabBar}>
          <Text style={styles.tabBarLabel}>Total</Text>
          <View style={styles.tabBarRow}>
            {TABS.map((tab) => {
              const isActive = selectedTab === tab.key;
              const count = getTabCount(tab.key);
              return (
                <Pressable
                  key={tab.key}
                  style={[styles.tab, isActive && { borderBottomColor: tab.color }]}
                  onPress={() => setSelectedTab(tab.key)}
                >
                  <Text style={[styles.tabCount, { color: isActive ? tab.color : Colors.textTertiary }]}>
                    {count}
                  </Text>
                  <Text style={[styles.tabLabel, isActive && { color: tab.color }]}>
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {zoneStats.length > 0 && (
          <View style={styles.zoneBreakdownSection}>
            <Text style={styles.zoneSectionTitle}>
              {isMultiZone ? "Per-Zone Breakdown" : `${zoneStats[0].zoneName} Zone`}
            </Text>
            <ZoneBreakdown zoneStats={zoneStats} />
          </View>
        )}

        <View style={styles.userListSection}>
          <Text style={styles.zoneSectionTitle}>
            Personnel — {TABS.find((t) => t.key === selectedTab)?.label} ({filteredUsers.length})
          </Text>
          {filteredUsers.length === 0 ? (
            <View style={styles.listEmpty}>
              <Text style={styles.listEmptyText}>No users with this status</Text>
            </View>
          ) : (
            filteredUsers.map((item) => (
              <View key={item.id} style={styles.userRow}>
                <View style={styles.userAvatar}>
                  <Text style={styles.userAvatarText}>
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.name}</Text>
                  <Text style={styles.userDetails}>
                    {item.badge} · {item.zone} · {item.location}
                  </Text>
                </View>
                <StatusBadge status={item.status} />
              </View>
            ))
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomActions}>
        <Button
          title="All Clear"
          onPress={sendAllClear}
          variant="safe"
          icon="check-circle"
          size="lg"
          style={{ flex: 1 }}
        />
        <Button
          title="Close"
          onPress={() => closeAlert(activeAlert.id)}
          variant="secondary"
          icon="x"
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  alertCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    borderColor: Colors.primaryBorder,
    backgroundColor: Colors.primaryDim,
  },
  alertHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  alertHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTitleWrap: {
    flex: 1,
    gap: 2,
  },
  alertType: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  alertMeta: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  tabBar: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  tabBarLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  tabBarRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: 2,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabCount: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  zoneBreakdownSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  zoneSectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  userListSection: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  listEmpty: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
  },
  listEmptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
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
  userDetails: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  bottomActions: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.safeDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
