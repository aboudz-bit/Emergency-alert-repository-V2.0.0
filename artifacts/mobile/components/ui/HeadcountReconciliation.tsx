import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type { HeadcountReconciliation as Reconciliation } from "@/types";

const STATUS_STYLE: Record<Reconciliation["status"], { bg: string; border: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
  balanced:             { bg: Colors.safeDim,    border: Colors.safeBorder,    fg: Colors.safe,        icon: "check-circle" },
  under_count:          { bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.20)", fg: Colors.destructive, icon: "alert-octagon" },
  over_count:           { bg: Colors.missingDim, border: Colors.missingBorder, fg: Colors.missing,     icon: "alert-triangle" },
  pending_verification: { bg: Colors.missingDim, border: Colors.missingBorder, fg: Colors.missing,     icon: "clock" },
};

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Supervisor headcount reconciliation panel with explicit mismatch warning. */
export function HeadcountReconciliation({ data }: { data: Reconciliation }) {
  const s = STATUS_STYLE[data.status];
  return (
    <View style={styles.wrap}>
      <View style={[styles.banner, { backgroundColor: s.bg, borderColor: s.border }]}>
        <Feather name={s.icon} size={16} color={s.fg} />
        <Text style={[styles.bannerText, { color: s.fg }]}>{data.message}</Text>
      </View>
      <View style={styles.grid}>
        <Stat label="Expected" value={data.expected} />
        <Stat label="Actual" value={data.actual} />
        <Stat label="Safe" value={data.safe} color={Colors.safe} />
        <Stat label="Need Help" value={data.needHelp} color={Colors.destructive} />
        <Stat label="Pending" value={data.pending} color={Colors.missing} />
        <Stat label="Missing" value={data.missing} color={data.missing > 0 ? Colors.destructive : Colors.textSecondary} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  banner: {
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    borderWidth: 1, borderRadius: BorderRadius.md, padding: Spacing.md,
  },
  bannerText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", flexShrink: 1 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  stat: { width: "33.33%", paddingVertical: Spacing.sm, alignItems: "center" },
  statValue: { fontSize: FontSize.xl, fontFamily: "Inter_700Bold", color: Colors.textTitle },
  statLabel: { fontSize: FontSize.xs, fontFamily: "Inter_500Medium", color: Colors.textSecondary, marginTop: 2 },
});
