import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { format } from "date-fns";

import { Card } from "@/components/ui/Card";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { EmergencyReceipt } from "@/types";

function ReceiptSection({
  title,
  icon,
  receipts,
  accentColor,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  receipts: EmergencyReceipt[];
  accentColor: string;
}) {
  if (receipts.length === 0) return null;
  const confirmed = receipts.filter((r) => r.receiptConfirmed).length;
  const pending = receipts.length - confirmed;
  const pct = receipts.length > 0 ? (confirmed / receipts.length) * 100 : 0;

  return (
    <Card elevated style={[styles.card, { borderColor: accentColor, borderWidth: 1 }]}>
      <View style={styles.header}>
        <Feather name={icon} size={16} color={accentColor} />
        <Text style={[styles.title, { color: accentColor }]}>{title}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.summary}>{confirmed}/{receipts.length} confirmed</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: accentColor }]} />
      </View>
      {pending > 0 && (
        <>
          <Text style={styles.subLabel}>Pending ({pending})</Text>
          {receipts
            .filter((r) => !r.receiptConfirmed)
            .map((r) => (
              <View key={r.userId} style={styles.userRow}>
                <Feather name="clock" size={12} color={Colors.missing} />
                <Text style={styles.userName}>{r.userName}</Text>
              </View>
            ))}
        </>
      )}
      {confirmed > 0 && (
        <>
          <Text style={styles.subLabel}>Confirmed ({confirmed})</Text>
          {receipts
            .filter((r) => r.receiptConfirmed)
            .map((r) => (
              <View key={r.userId} style={styles.userRow}>
                <Feather name="check-circle" size={12} color={Colors.safe} />
                <Text style={styles.userName}>{r.userName}</Text>
                <Text style={styles.time}>
                  {r.receiptConfirmedAt ? format(new Date(r.receiptConfirmedAt), "h:mm a") : ""}
                </Text>
              </View>
            ))}
        </>
      )}
    </Card>
  );
}

export function EmergencyReceiptTracker() {
  const emergencyModes = useStore((s) => s.emergencyModes);

  const shelterReceipts = useMemo(
    () =>
      emergencyModes.shelterIn
        ? emergencyModes.receipts.filter((r) => r.modeType === "shelterIn")
        : [],
    [emergencyModes.shelterIn, emergencyModes.receipts]
  );

  const blackoutReceipts = useMemo(
    () =>
      emergencyModes.blackout
        ? emergencyModes.receipts.filter((r) => r.modeType === "blackout")
        : [],
    [emergencyModes.blackout, emergencyModes.receipts]
  );

  if (!emergencyModes.shelterIn && !emergencyModes.blackout) return null;
  if (shelterReceipts.length === 0 && blackoutReceipts.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionTitle}>Emergency Receipt Status</Text>
      <ReceiptSection
        title="Shelter In Receipts"
        icon="shield"
        receipts={shelterReceipts}
        accentColor={Colors.amber}
      />
      <ReceiptSection
        title="Blackout Receipts"
        icon="zap-off"
        receipts={blackoutReceipts}
        accentColor={Colors.primary}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  card: { gap: Spacing.sm },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
  },
  summary: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceElevated,
    overflow: "hidden" as const,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  subLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    marginTop: Spacing.xs,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  userName: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  time: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
});
