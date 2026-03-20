import React from "react";
import { StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { WIND_DIRECTIONS } from "@/types";

/**
 * Small floating wind indicator overlay for map screens.
 * Reads windDirection from global store and shows a rotated arrow.
 * Renders nothing when no wind direction is set.
 */
export function WindIndicator() {
  const windDirection = useStore((s) => s.windDirection);

  if (!windDirection) return null;

  const entry = WIND_DIRECTIONS.find((w) => w.key === windDirection);
  if (!entry) return null;

  return (
    <View style={styles.container}>
      <View style={styles.arrowWrap}>
        <View style={{ transform: [{ rotate: `${entry.degrees}deg` }] }}>
          <Feather name="arrow-down" size={18} color={Colors.primary} />
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
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: BorderRadius.md,
    padding: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 20,
  },
  arrowWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
});
