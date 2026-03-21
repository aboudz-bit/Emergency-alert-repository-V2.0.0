import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";
import { useTranslation } from "@/i18n";
import type { TranslationStrings } from "@/i18n";
import type { UserResponseStatus, AlertStatus } from "@/types";

const statusConfig: Record<string, { bg: string; text: string; labelKey: keyof TranslationStrings }> = {
  confirmed: { bg: Colors.safeDim, text: Colors.safe, labelKey: "statusSafe" },
  pending: { bg: Colors.noreplyDim, text: Colors.noreply, labelKey: "statusPending" },
  need_help: { bg: Colors.primaryDim, text: Colors.primary, labelKey: "statusNeedHelp" },
  active: { bg: Colors.primaryDim, text: Colors.primary, labelKey: "statusActive" },
  closed: { bg: Colors.noreplyDim, text: Colors.noreply, labelKey: "statusClosed" },
  draft: { bg: Colors.infoDim, text: Colors.info, labelKey: "statusDraft" },
  enabled: { bg: Colors.safeDim, text: Colors.safe, labelKey: "statusEnabled" },
  disabled: { bg: Colors.primaryDim, text: Colors.primary, labelKey: "statusDisabled" },
  missing: { bg: Colors.missingDim, text: Colors.missing, labelKey: "statusMissing" },
  no_reply: { bg: Colors.noreplyDim, text: Colors.noreply, labelKey: "statusNoReply" },
};

interface StatusBadgeProps {
  status: UserResponseStatus | AlertStatus | "enabled" | "disabled";
  label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>
        {label || t[config.labelKey]}
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
