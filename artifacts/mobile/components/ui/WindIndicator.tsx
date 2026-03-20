import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { WIND_DIRECTIONS } from "@/types";

const COMPASS_SIZE = 52;
const RING_SIZE = 44;

/**
 * Compact compass-style wind indicator overlay for map screens.
 * Shows cardinal directions (N highlighted), a rotated wind arrow,
 * and the "Wind" label. Renders nothing when no wind direction is set.
 */
export function WindIndicator() {
  const windDirection = useStore((s) => s.windDirection);

  if (!windDirection) return null;

  const entry = WIND_DIRECTIONS.find((w) => w.key === windDirection);
  if (!entry) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Wind</Text>
      <View style={styles.compass}>
        {/* Compass ring */}
        <View style={styles.ring}>
          {/* Cardinal labels */}
          <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
          <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
          <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
          <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

          {/* Tick marks */}
          <View style={[styles.tick, styles.tickN]} />
          <View style={[styles.tick, styles.tickE]} />
          <View style={[styles.tick, styles.tickS]} />
          <View style={[styles.tick, styles.tickW]} />

          {/* Arrow that rotates */}
          <View style={[styles.arrowContainer, { transform: [{ rotate: `${entry.degrees}deg` }] }]}>
            <View style={styles.arrowHead} />
            <View style={styles.arrowTail} />
          </View>

          {/* Center dot */}
          <View style={styles.centerDot} />
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
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 20,
  },
  label: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  compass: {
    width: COMPASS_SIZE,
    height: COMPASS_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  // Cardinal direction labels
  cardinal: {
    position: "absolute",
    fontSize: 7,
    fontFamily: "Inter_700Bold",
    color: Colors.textTertiary,
  },
  cardinalN: {
    top: 2,
    color: Colors.primary,
    fontSize: 8,
  },
  cardinalS: {
    bottom: 2,
  },
  cardinalE: {
    right: 3,
  },
  cardinalW: {
    left: 3,
  },

  // Small tick marks at cardinal points
  tick: {
    position: "absolute",
    backgroundColor: Colors.border,
  },
  tickN: {
    top: 0,
    width: 1.5,
    height: 4,
    left: RING_SIZE / 2 - 0.75,
    backgroundColor: Colors.primary,
  },
  tickS: {
    bottom: 0,
    width: 1,
    height: 3,
    left: RING_SIZE / 2 - 0.5,
  },
  tickE: {
    right: 0,
    height: 1,
    width: 3,
    top: RING_SIZE / 2 - 0.5,
  },
  tickW: {
    left: 0,
    height: 1,
    width: 3,
    top: RING_SIZE / 2 - 0.5,
  },

  // Arrow (points downward by default, rotated via degrees)
  arrowContainer: {
    position: "absolute",
    alignItems: "center",
    height: RING_SIZE - 16,
    justifyContent: "space-between",
  },
  arrowHead: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: Colors.primary,
  },
  arrowTail: {
    width: 2,
    height: 12,
    backgroundColor: Colors.primary,
    borderRadius: 1,
  },

  // Center pivot
  centerDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.primary,
  },
});
