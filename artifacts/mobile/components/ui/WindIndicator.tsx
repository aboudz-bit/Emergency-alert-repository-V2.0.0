import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { useTranslation } from "@/i18n/useTranslation";
import { WIND_DIRECTIONS } from "@/types";

/**
 * Floating wind indicator overlay for map screens.
 * Shows "Wind" label and a rotated arrow.
 * Renders nothing when no wind direction is set.
 */
export function WindIndicator() {
  const windDirection = useStore((s) => s.windDirection);
  const { t } = useTranslation();

  if (!windDirection) return null;

  const entry = WIND_DIRECTIONS.find((w) => w.key === windDirection);
  if (!entry) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t.wind.toUpperCase()}</Text>
      <View style={styles.arrowWrap}>
        <View style={{ transform: [{ rotate: `${entry.degrees}deg` }] }}>
          <Feather name="arrow-down" size={22} color={Colors.primary} />
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
    backgroundColor: "rgba(255,255,255,0.96)",
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 20,
    minWidth: 56,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  arrowWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
});
