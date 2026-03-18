import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";
import type { UserResponseStatus, AlertStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; label: string; border: string }> = {
  confirmed: { bg: Colors.safeDim, text: Colors.safe, label: "Safe", border: Colors.safeBorder },
  pending: { bg: Colors.noreplyDim, text: Colors.noreply, label: "Pending", border: 'transparent' },
  need_help: { bg: Colors.primaryDim, text: Colors.primary, label: "Need Help", border: Colors.primaryBorder },
  active: { bg: Colors.primaryDim, text: Colors.primary, label: "Active", border: Colors.primaryBorder },
  closed: { bg: Colors.noreplyDim, text: Colors.noreply, label: "Closed", border: 'transparent' },
  draft: { bg: Colors.infoDim, text: Colors.info, label: "Draft", border: Colors.infoBorder },
  enabled: { bg: Colors.safeDim, text: Colors.safe, label: "Active", border: Colors.safeBorder },
  disabled: { bg: Colors.primaryDim, text: Colors.primary, label: "Disabled", border: Colors.primaryBorder },
  missing: { bg: Colors.missingDim, text: Colors.missing, label: "Missing", border: Colors.missingBorder },
  no_reply: { bg: Colors.noreplyDim, text: Colors.noreply, label: "No Reply", border: 'transparent' },
};

interface StatusBadgeProps {
  status: UserResponseStatus | AlertStatus | "enabled" | "disabled";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg, borderColor: config.border, borderWidth: config.border !== 'transparent' ? 1 : 0 }]}>
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
    fontFamily: "Inter_600SemiBold",
  },
});
