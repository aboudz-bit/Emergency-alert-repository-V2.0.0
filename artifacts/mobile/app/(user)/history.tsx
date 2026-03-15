import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Alert } from "@/types";

function getAlertIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "Blackout":
      return "zap-off";
    case "Shelter-in":
      return "home";
    case "Security Alert":
      return "shield";
    case "Restricted Movement":
      return "lock";
    case "Drill":
      return "activity";
    case "All Clear":
      return "check-circle";
    default:
      return "alert-triangle";
  }
}

function getAlertIconColor(type: string): string {
  switch (type) {
    case "All Clear":
      return Colors.safe;
    case "Drill":
      return Colors.info;
    default:
      return Colors.primary;
  }
}

function AlertHistoryCard({ alert }: { alert: Alert }) {
  const formattedDate = format(new Date(alert.timestamp), "MMM d, yyyy 'at' h:mm a");
  const iconName = getAlertIcon(alert.type);
  const iconColor = getAlertIconColor(alert.type);

  return (
    <Card style={styles.alertCard}>
      <View style={styles.alertCardHeader}>
        <View style={[styles.alertIconWrap, { backgroundColor: `${iconColor}20` }]}>
          <Feather name={iconName} size={18} color={iconColor} />
        </View>
        <View style={styles.alertCardInfo}>
          <Text style={styles.alertCardTitle} numberOfLines={1}>
            {alert.title}
          </Text>
          <Text style={styles.alertCardTimestamp}>{formattedDate}</Text>
        </View>
        <StatusBadge status={alert.status} />
      </View>

      <View style={styles.alertMeta}>
        <View style={styles.metaChip}>
          <Feather name="map-pin" size={11} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{alert.zone}</Text>
        </View>
        <View style={styles.metaChip}>
          <Feather name="tag" size={11} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{alert.type}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.safe }]} />
          <Text style={styles.statValue}>{alert.stats.confirmed}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.missing }]} />
          <Text style={styles.statValue}>{alert.stats.missing}</Text>
          <Text style={styles.statLabel}>Missing</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.noreply }]} />
          <Text style={styles.statValue}>{alert.stats.noReply}</Text>
          <Text style={styles.statLabel}>No Reply</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.statValue}>{alert.stats.needHelp}</Text>
          <Text style={styles.statLabel}>Need Help</Text>
        </View>
      </View>
    </Card>
  );
}

export default function HistoryScreen() {
  const alerts = useStore((s) => s.alerts);
  const closedAlerts = alerts.filter((a) => a.status === "closed");

  return (
    <View style={styles.container}>
      <Header title="Alert History" subtitle={`${closedAlerts.length} past alerts`} />

      <FlatList
        data={closedAlerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <AlertHistoryCard alert={item} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Feather name="inbox" size={40} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Alert History</Text>
            <Text style={styles.emptySubtitle}>
              Past emergency alerts will appear here once they have been closed.
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
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  alertCard: {
    gap: Spacing.md,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  alertIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCardInfo: {
    flex: 1,
  },
  alertCardTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  alertCardTimestamp: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  alertMeta: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  metaText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginBottom: 2,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 120,
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
});
