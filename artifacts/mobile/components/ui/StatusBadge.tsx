import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";
import type { UserResponseStatus, AlertStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  confirmed: { bg: Colors.safeDim, text: Colors.safe, label: "Confirmed" },
  missing: { bg: Colors.missingDim, text: Colors.missing, label: "Missing" },
  no_reply: { bg: Colors.noreplyDim, text: Colors.noreply, label: "No Reply" },
  need_help: { bg: Colors.primaryDim, text: Colors.primary, label: "Need Help" },
  active: { bg: Colors.primaryDim, text: Colors.primary, label: "Active" },
  closed: { bg: Colors.noreplyDim, text: Colors.noreply, label: "Closed" },
  draft: { bg: Colors.infoDim, text: Colors.info, label: "Draft" },
  enabled: { bg: Colors.safeDim, text: Colors.safe, label: "Active" },
  disabled: { bg: Colors.primaryDim, text: Colors.primary, label: "Disabled" },
};

interface StatusBadgeProps {
  status: UserResponseStatus | AlertStatus | "enabled" | "disabled";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.no_reply;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
});
