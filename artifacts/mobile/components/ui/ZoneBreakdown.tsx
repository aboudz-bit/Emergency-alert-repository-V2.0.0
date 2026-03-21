import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useTranslation } from "@/i18n";

export interface ZoneStats {
  zoneName: string;
  zoneColor: string;
  confirmed: number;
  pending: number;
  needHelp: number;
  total: number;
}

interface ZoneBreakdownProps {
  zoneStats: ZoneStats[];
  compact?: boolean;
}

export function ZoneBreakdown({ zoneStats, compact = false }: ZoneBreakdownProps) {
  const { t } = useTranslation();
  if (zoneStats.length === 0) return null;

  return (
    <View style={styles.container}>
      {zoneStats.map((zone, idx) => (
        <View key={zone.zoneName} style={styles.zoneCard}>
          <View style={styles.zoneHeader}>
            <View style={[styles.zoneDot, { backgroundColor: zone.zoneColor }]} />
            <Text style={styles.zoneName}>{zone.zoneName}</Text>
            <Text style={styles.zoneTotal}>{zone.total}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.safe }]}>
                {zone.confirmed}
              </Text>
              <Text style={styles.statLabel}>{t.safe}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.noreply }]}>
                {zone.pending}
              </Text>
              <Text style={styles.statLabel}>{t.pending}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>
                {zone.needHelp}
              </Text>
              <Text style={styles.statLabel}>{t.help}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  zoneCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    flex: 1,
  },
  zoneTotal: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
    gap: 2,
    flex: 1,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
});
