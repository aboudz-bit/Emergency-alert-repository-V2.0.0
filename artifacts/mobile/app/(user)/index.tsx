import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert } from "@/store";

function getAlertIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "Blackout":
      return "zap-off";
    case "Shelter-in":
      return "home";
    case "Security Alert":
      return "shield";
    case "Restricted Movement":
      return "lock";
    case "Drill":
      return "activity";
    case "All Clear":
      return "check-circle";
    default:
      return "alert-triangle";
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function PulsingDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.8,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          { transform: [{ scale }], opacity },
        ]}
      />
      <View style={styles.pulsingDotInner} />
    </View>
  );
}

export default function UserHomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const activeAlert = useStore(selectActiveAlert);
  const mobileUserResponse = useStore((s) => s.mobileUserResponse);
  const respondToAlert = useStore((s) => s.respondToAlert);

  const firstName = currentUser?.name?.split(" ")[0] || "User";

  const handleRespond = (response: "confirmed" | "need_help") => {
    respondToAlert(response);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header Greeting */}
      <View style={styles.headerArea}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingText}>
            <Text style={styles.greetingLabel}>Hello,</Text>
            <Text style={styles.greetingName}>{firstName}</Text>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badgeChip}>
              <Feather name="credit-card" size={12} color={Colors.textSecondary} />
              <Text style={styles.badgeChipText}>{currentUser?.badge}</Text>
            </View>
            <View style={styles.zoneChip}>
              <Feather name="map-pin" size={12} color={Colors.info} />
              <Text style={styles.zoneChipText}>{currentUser?.zone}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active Alert or All Clear */}
        {activeAlert ? (
          <>
            <Pressable onPress={() => router.push("/(user)/alert")}>
              <Card style={styles.alertCard}>
                <View style={styles.alertCardHeader}>
                  <PulsingDot />
                  <Text style={styles.alertCardLabel}>ACTIVE EMERGENCY</Text>
                </View>
                <View style={styles.alertTypeRow}>
                  <View style={styles.alertIconWrap}>
                    <Feather
                      name={getAlertIcon(activeAlert.type)}
                      size={20}
                      color={Colors.white}
                    />
                  </View>
                  <View style={styles.alertTypeText}>
                    <Text style={styles.alertTitle}>{activeAlert.title}</Text>
                    <Text style={styles.alertType}>{activeAlert.type}</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.alertMessage} numberOfLines={2}>
                  {activeAlert.message}
                </Text>
                <Text style={styles.alertTimestamp}>
                  {formatTimeAgo(activeAlert.timestamp)}
                </Text>
              </Card>
            </Pressable>

            {/* Response Buttons or Confirmed Status */}
            {mobileUserResponse ? (
              <Card style={styles.confirmedCard}>
                <View style={styles.confirmedContent}>
                  <View style={styles.confirmedIconWrap}>
                    <Feather
                      name={mobileUserResponse === "confirmed" ? "check-circle" : "alert-circle"}
                      size={28}
                      color={mobileUserResponse === "confirmed" ? Colors.safe : Colors.primary}
                    />
                  </View>
                  <View style={styles.confirmedTextWrap}>
                    <Text style={styles.confirmedTitle}>
                      {mobileUserResponse === "confirmed"
                        ? "Response Confirmed"
                        : "Help Requested"}
                    </Text>
                    <Text style={styles.confirmedSubtitle}>
                      {mobileUserResponse === "confirmed"
                        ? "You have been marked as safe"
                        : "Help is on the way"}
                    </Text>
                  </View>
                  <StatusBadge status={mobileUserResponse} />
                </View>
              </Card>
            ) : (
              <View style={styles.responseButtons}>
                <Pressable
                  style={({ pressed }) => [
                    styles.responseBtn,
                    styles.safeBtnBg,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleRespond("confirmed")}
                >
                  <Feather name="shield" size={24} color={Colors.white} />
                  <Text style={styles.responseBtnText}>I AM SAFE</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [
                    styles.responseBtn,
                    styles.helpBtnBg,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleRespond("need_help")}
                >
                  <Feather name="alert-circle" size={24} color={Colors.white} />
                  <Text style={styles.responseBtnText}>NEED HELP</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <Card style={styles.allClearCard}>
            <View style={styles.allClearContent}>
              <View style={styles.allClearIconWrap}>
                <Feather name="check-circle" size={40} color={Colors.safe} />
              </View>
              <Text style={styles.allClearTitle}>No Active Alerts</Text>
              <Text style={styles.allClearSubtitle}>
                All systems operational. You will be notified immediately if an
                emergency alert is issued.
              </Text>
            </View>
          </Card>
        )}

        {/* GPS Status */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.gpsIndicator}>
              <View style={styles.gpsActiveDot} />
              <Text style={styles.gpsText}>GPS Active</Text>
            </View>
            <StatusBadge status="enabled" label="Online" />
          </View>
        </Card>

        {/* Current Location */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.locationInfo}>
              <Feather name="map-pin" size={16} color={Colors.textSecondary} />
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>Current Location</Text>
                <Text style={styles.locationValue}>
                  {currentUser?.location || "Unknown"} - {currentUser?.zone || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerArea: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  greetingRow: {
    gap: Spacing.sm,
  },
  greetingText: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: Spacing.sm,
  },
  greetingLabel: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  greetingName: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  badgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  badgeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badgeChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.infoDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  zoneChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.info,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  alertCard: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryBorder,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  alertCardLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  pulsingDotContainer: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingDotOuter: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  pulsingDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  alertTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTypeText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  alertType: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 2,
  },
  alertMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  alertTimestamp: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  responseButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  responseBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minHeight: 80,
  },
  safeBtnBg: {
    backgroundColor: Colors.safe,
  },
  helpBtnBg: {
    backgroundColor: Colors.primary,
  },
  pressed: {
    opacity: 0.85,
  },
  responseBtnText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  confirmedCard: {
    borderColor: Colors.safeBorder,
  },
  confirmedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  confirmedIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.safeDim,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedTextWrap: {
    flex: 1,
  },
  confirmedTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  confirmedSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  allClearCard: {
    borderColor: Colors.safeBorder,
  },
  allClearContent: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  allClearIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.safeDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  allClearTitle: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  allClearSubtitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  infoCard: {
    paddingVertical: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  gpsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  gpsActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.safe,
  },
  gpsText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  locationTextWrap: {
    gap: 2,
  },
  locationLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  locationValue: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
});
