import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { FontSize, Spacing, BorderRadius } from "@/constants/theme";

/**
 * Unmistakable DRILL banner. Yellow/black treatment, deliberately NOT the red
 * emergency styling, so a drill can never be confused with a real emergency.
 */
export function DrillBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.banner, compact && styles.compact]}>
      <Feather name="alert-triangle" size={compact ? 14 : 18} color="#111111" />
      <Text style={[styles.text, compact && styles.textCompact]}>
        THIS IS A DRILL — NO REAL EMERGENCY
      </Text>
      <Feather name="alert-triangle" size={compact ? 14 : 18} color="#111111" />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    backgroundColor: "#FACC15", // amber-400 — distinct from emergency red
    borderWidth: 2,
    borderColor: "#111111",
    borderStyle: "dashed",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  compact: {
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  text: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: "#111111",
    letterSpacing: 0.5,
    textAlign: "center",
    flexShrink: 1,
  },
  textCompact: {
    fontSize: FontSize.xs,
  },
});
