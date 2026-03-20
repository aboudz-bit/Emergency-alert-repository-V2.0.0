import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { WIND_DIRECTIONS } from "@/types";

/**
 * Floating wind indicator overlay for map screens.
 * Shows "Wind" label and a rotated arrow.
 * Renders nothing when no wind direction is set.
 */
export function WindIndicator() {
  const windDirection = useStore((s) => s.windDirection);

  if (!windDirection) return null;

  const entry = WIND_DIRECTIONS.find((w) => w.key === windDirection);
  if (!entry) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wind</Text>
      <View style={styles.arrowWrap}>
        <View style={{ transform: [{ rotate: `${entry.degrees}deg` }] }}>
          <Feather name="navigation" size={20} color={Colors.primary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 56,
    right: 12,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
    minWidth: 44,
  },
  label: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  arrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
});
