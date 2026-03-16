import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  color?: string;
  dimColor?: string;
}

export function KPICard({
  title,
  value,
  icon,
  color = Colors.primary,
  dimColor = Colors.primaryDim,
}: KPICardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: dimColor }]}>
          <Feather name={icon} size={18} color={color} />
        </View>
        <Text style={[styles.value, { color }]}>{value}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
  },
  title: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
});
