import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useStore } from "@/store";

export function EmergencyModeBanner() {
  const emergencyModes = useStore((s) => s.emergencyModes);

  if (!emergencyModes.shelterIn && !emergencyModes.blackout) return null;

  return (
    <View style={styles.wrapper}>
      {emergencyModes.shelterIn && (
        <View style={[styles.banner, styles.shelterBanner]}>
          <Feather name="shield" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            Shelter In Activated – Please go to shelter
          </Text>
          <View style={styles.pulse} />
        </View>
      )}
      {emergencyModes.blackout && (
        <View style={[styles.banner, styles.blackoutBanner]}>
          <Feather name="zap-off" size={16} color="#fff" />
          <Text style={styles.bannerText}>Blackout Activated</Text>
          <View style={styles.pulse} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 0 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  shelterBanner: {
    backgroundColor: "#D97706",
  },
  blackoutBanner: {
    backgroundColor: "#5B3A8E",
  },
  bannerText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.3,
  },
  pulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
});
