import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";
import type { UserResponseStatus, AlertStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: Colors.safeDim, text: Colors.safe, label: "Safe" },
  pending: { bg: Colors.noreplyDim, text: Colors.noreply, label: "Pending" },
  need_help: { bg: Colors.primaryDim, text: Colors.primary, label: "Need Help" },
  active: { bg: Colors.primaryDim, text: Colors.primary, label: "Active" },
  closed: { bg: Colors.noreplyDim, text: Colors.noreply, label: "Closed" },
  draft: { bg: Colors.infoDim, text: Colors.info, label: "Draft" },
  enabled: { bg: Colors.safeDim, text: Colors.safe, label: "Active" },
  disabled: { bg: Colors.primaryDim, text: Colors.primary, label: "Disabled" },
  missing: { bg: Colors.missingDim, text: Colors.missing, label: "Missing" },
  no_reply: { bg: Colors.noreplyDim, text: Colors.noreply, label: "No Reply" },
};

interface StatusBadgeProps {
  status: UserResponseStatus | AlertStatus | "enabled" | "disabled";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
  },
});
