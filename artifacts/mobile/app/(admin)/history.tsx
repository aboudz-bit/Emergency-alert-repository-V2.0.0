import React, { useState, useMemo } from "react";
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

  const renderAlertCard = ({ item }: { item: Alert }) => {
    const iconName = alertTypeIcons[item.type] || "alert-triangle";
    const iconColor = alertTypeColors[item.type] || Colors.primary;

    return (
      <Card style={styles.alertCard}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIconWrap, { backgroundColor: iconColor + "20" }]}>
            <Feather name={iconName} size={18} color={iconColor} />
          </View>
          <View style={styles.alertInfo}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={styles.alertMeta}>
              {item.zone} · {format(new Date(item.timestamp), "MMM d, yyyy HH:mm")}
            </Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.safe }]}>
              {item.stats.confirmed}
            </Text>
            <Text style={styles.statLabel}>Confirmed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.missing }]}>
              {item.stats.missing}
            </Text>
            <Text style={styles.statLabel}>Missing</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: Colors.noreply }]}>
              {item.stats.noReply}
            </Text>
            <Text style={styles.statLabel}>No Reply</Text>
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
          <Text style={styles.closedAt}>
            Closed: {format(new Date(item.closedAt), "MMM d, yyyy HH:mm")}
          </Text>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Alert History" />

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <Pressable
          style={[
            styles.filterChip,
            selectedType === null && styles.filterChipActive,
          ]}
          onPress={() => setSelectedType(null)}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedType === null && styles.filterChipTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {ALERT_TYPES.map((type) => (
          <Pressable
            key={type}
            style={[
              styles.filterChip,
              selectedType === type && styles.filterChipActive,
            ]}
            onPress={() => setSelectedType(selectedType === type ? null : type)}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedType === type && styles.filterChipTextActive,
              ]}
            >
              {type}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Alert List */}
      <FlatList
        data={sortedAlerts}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderAlertCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="inbox" size={48} color={Colors.textSecondary} />
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
  filterRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  alertCard: {
    gap: Spacing.md,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
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
    justifyContent: "space-around",
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  closedAt: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "right",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
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
