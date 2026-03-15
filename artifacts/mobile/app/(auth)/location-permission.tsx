import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

const BENEFITS: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; description: string }[] = [
  {
    icon: "bell",
    title: "Real-time Emergency Alerts",
    description: "Receive instant notifications when an emergency is declared in your zone.",
  },
  {
    icon: "crosshair",
    title: "Geofenced Zone Detection",
    description: "Automatically determine your current zone so responders know where you are.",
  },
  {
    icon: "users",
    title: "Faster Headcount & Rescue",
    description: "Help safety teams locate and account for all personnel during incidents.",
  },
];

export default function LocationPermissionScreen() {
  const handleEnableLocation = () => {
    // TODO: Request location permissions via expo-location
    // e.g. Location.requestForegroundPermissionsAsync()
  };

  const handleExit = () => {
    // TODO: Exit / close app
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={styles.iconArea}>
          <View style={styles.iconRingOuter}>
            <View style={styles.iconRingInner}>
              <Feather name="map-pin" size={44} color={Colors.primary} />
            </View>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={styles.title}>Location Access Required</Text>
        <Text style={styles.description}>
          KEAS uses geofencing to determine your zone and deliver targeted
          emergency alerts. Location data is only used for safety purposes and is
          never shared externally.
        </Text>

        {/* Benefits */}
        <View style={styles.benefitsList}>
          {BENEFITS.map((item) => (
            <View key={item.title} style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <Feather name={item.icon} size={18} color={Colors.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{item.title}</Text>
                <Text style={styles.benefitDescription}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Spacer */}
        <View style={styles.flex} />

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Enable Location"
            onPress={handleEnableLocation}
            fullWidth
          />
          <Button
            title="Exit App"
            onPress={handleExit}
            variant="ghost"
            fullWidth
            style={styles.exitButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    paddingTop: 48,
    paddingBottom: Spacing.xxxl,
  },
  flex: {
    flex: 1,
  },

  /* Icon */
  iconArea: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  iconRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  title: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xxxl,
  },

  /* Benefits */
  benefitsList: {
    gap: Spacing.xl,
  },
  benefitRow: {
    flexDirection: "row",
    gap: Spacing.lg,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  benefitContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  benefitTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  benefitDescription: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  /* Actions */
  actions: {
    gap: Spacing.md,
  },
  exitButton: {
    marginTop: Spacing.xs,
  },
});
