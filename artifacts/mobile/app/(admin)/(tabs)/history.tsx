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
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius, ALERT_TYPES } from "@/constants/theme";
import { useStore } from "@/store";
import type { Alert } from "@/types";

const alertTypeIcons: Record<string, keyof typeof Feather.glyphMap> = {
  Blackout: "zap-off",
  "Shelter-in": "shield",
  "Security Alert": "alert-octagon",
  "Restricted Movement": "lock",
  Drill: "activity",
  "All Clear": "check-circle",
  Custom: "edit-3",
};

const alertTypeColors: Record<string, string> = {
  Blackout: Colors.amber,
  "Shelter-in": Colors.primary,
  "Security Alert": Colors.primary,
  "Restricted Movement": Colors.missing,
  Drill: Colors.info,
  "All Clear": Colors.safe,
  Custom: Colors.textSecondary,
};

export default function HistoryScreen() {
  const alerts = useStore((s) => s.alerts);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const sortedAlerts = useMemo(() => {
    let result = [...alerts].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (selectedType) {
      result = result.filter((a) => a.type === selectedType);
    }
    return result;
  }, [alerts, selectedType]);

  const alertCounts = useMemo(() => {
    const counts: Record<string, number> = { All: alerts.length };
    for (const type of ALERT_TYPES) {
      counts[type] = alerts.filter((a) => a.type === type).length;
    }
    return counts;
  }, [alerts]);

  const renderAlertCard = useCallback(
    ({ item }: { item: Alert }) => {
      const iconName = alertTypeIcons[item.type] || "alert-triangle";
      const iconColor = alertTypeColors[item.type] || Colors.primary;

      return (
        <Card style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={[styles.alertIconWrap, { backgroundColor: iconColor + "20" }]}>
              <Feather name={iconName} size={18} color={iconColor} />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.alertMeta}>
                {item.zone} · {format(new Date(item.timestamp), "MMM d, HH:mm")}
              </Text>
            </View>
            <StatusBadge status={item.status} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.safe }]}>
                {item.stats.confirmed}
              </Text>
              <Text style={styles.statLabel}>Safe</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.noreply }]}>
                {item.stats.pending}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {item.stats.needHelp}
              </Text>
              <Text style={styles.statLabel}>Help</Text>
            </View>
          </View>

          {item.closedAt && (
            <View style={styles.closedRow}>
              <Feather name="check-circle" size={12} color={Colors.textTertiary} />
              <Text style={styles.closedAt}>
                Closed {format(new Date(item.closedAt), "MMM d, HH:mm")}
              </Text>
            </View>
          )}
        </Card>
      );
    },
    []
  );

  return (
    <View style={styles.container}>
      {/* ─── Fixed header ─── */}
      <Header title="Alert History" />

      {/* ─── Fixed filter tabs ─── */}
      <View style={styles.tabBarOuter}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          <Pressable
            style={[styles.tab, selectedType === null && styles.tabActive]}
            onPress={() => setSelectedType(null)}
          >
            <Text style={[styles.tabText, selectedType === null && styles.tabTextActive]}>
              All
            </Text>
            <View style={[styles.tabBadge, selectedType === null && styles.tabBadgeActive]}>
              <Text style={[styles.tabBadgeText, selectedType === null && styles.tabBadgeTextActive]}>
                {alertCounts.All}
              </Text>
            </View>
          </Pressable>
          {ALERT_TYPES.map((type) => {
            const isActive = selectedType === type;
            const count = alertCounts[type] || 0;
            const isEmpty = count === 0;
            const color = alertTypeColors[type] || Colors.textSecondary;
            return (
              <Pressable
                key={type}
                style={[styles.tab, isActive && styles.tabActive, isEmpty && styles.tabEmpty]}
                onPress={() => setSelectedType(isActive ? null : type)}
              >
                <View style={[styles.tabDot, { backgroundColor: isEmpty ? Colors.textTertiary : color }]} />
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                    isEmpty && styles.tabTextEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {type}
                </Text>
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ─── Result count ─── */}
      <View style={styles.resultBar}>
        <Text style={styles.resultText}>
          {sortedAlerts.length} alert{sortedAlerts.length !== 1 ? "s" : ""}
          {selectedType ? ` · ${selectedType}` : ""}
        </Text>
      </View>

      {/* ─── Scrollable content ─── */}
      <FlatList
        data={sortedAlerts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderAlertCard}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyText}>
              {selectedType
                ? `No ${selectedType} alerts found`
                : "No alerts have been sent yet"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Tab bar ───
  tabBarOuter: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabBarScroll: {
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    minHeight: 44,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabEmpty: {
    opacity: 0.45,
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tabText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.text,
  },
  tabTextEmpty: {
    color: Colors.textTertiary,
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primaryDim,
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
  },
  tabBadgeTextActive: {
    color: Colors.primary,
  },

  // ─── Result bar ───
  resultBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  resultText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },

  // ─── List ───
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  alertCard: {
    gap: Spacing.sm,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  alertInfo: {
    flex: 1,
    gap: 2,
  },
  alertTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  alertMeta: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.sm,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  closedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    justifyContent: "flex-end",
  },
  closedAt: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  // ─── Empty ───
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
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
