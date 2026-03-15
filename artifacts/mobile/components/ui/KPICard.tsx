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
      <View style={[styles.iconWrap, { backgroundColor: dimColor }]}>
        <Feather name={icon} size={18} color={color} />
      </View>
      <Text style={styles.value}>{value}</Text>
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
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  value: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  title: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
});
