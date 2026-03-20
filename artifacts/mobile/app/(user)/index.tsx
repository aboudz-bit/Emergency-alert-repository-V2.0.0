import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ExpoLocation from "expo-location";

import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore, selectActiveAlert, selectHasActiveAlert } from "@/store";
import { useDetectedLocation } from "@/hooks/useDetectedLocation";
import { usePersonnelTracking } from "@/hooks/usePersonnelTracking";
import { formatDistance, findBestShelter } from "@/utils/geo";
import type { LatLng } from "@/types";
import { EmergencyModeBanner } from "@/components/ui/EmergencyModeBanner";
import { useTranslation } from "@/i18n";

function getAlertIcon(type: string): keyof typeof Feather.glyphMap {
  switch (type) {
    case "Blackout": return "zap-off";
    case "Shelter-in": return "home";
    case "Security Alert": return "shield";
    case "Restricted Movement": return "lock";
    case "Drill": return "activity";
    case "All Clear": return "check-circle";
    default: return "alert-triangle";
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
          Animated.timing(scale, { toValue: 2, duration: 1000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale, opacity]);

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View style={[styles.pulsingDotOuter, { transform: [{ scale }], opacity }]} />
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
  const shelters = useStore((s) => s.shelters);
  const { t } = useTranslation();

  const [userLocation, setUserLocation] = useState<LatLng | null>(null);

  const firstName = currentUser?.name?.split(" ")[0] || "User";

  const { detectedLocationId } = useDetectedLocation(userLocation);

  const hasActiveAlert = useStore(selectHasActiveAlert);
  usePersonnelTracking(hasActiveAlert);

  const activeShelters = useMemo(() => shelters.filter((s) => s.isActive), [shelters]);

  const nearestShelter = useMemo(() => {
    if (!userLocation) return null;
    return findBestShelter(
      userLocation,
      shelters,
      detectedLocationId,
      currentUser?.zoneId ?? null
    );
  }, [userLocation, shelters, detectedLocationId, currentUser?.zoneId]);

  useEffect(() => {
    let sub: ExpoLocation.LocationSubscription | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;
        sub = await ExpoLocation.watchPositionAsync(
          { accuracy: ExpoLocation.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
          (loc) => {
            setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          },
        );
      } catch {
        // GPS unavailable
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <EmergencyModeBanner />
      <View style={styles.headerArea}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextWrap}>
            <Text style={styles.greetingLabel}>{t.hello}</Text>
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
        {activeAlert ? (
          <>
            <Pressable onPress={() => router.push("/(user)/alert")}>
              <Card style={styles.alertCard}>
                <View style={styles.alertCardHeader}>
                  <PulsingDot />
                  <Text style={styles.alertCardLabel}>{t.activeEmergency}</Text>
                </View>
                <View style={styles.alertTypeRow}>
                  <View style={styles.alertIconWrap}>
                    <Feather name={getAlertIcon(activeAlert.type)} size={22} color={Colors.white} />
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

            {mobileUserResponse ? (
              <Card style={styles.confirmedCard}>
                <View style={styles.confirmedContent}>
                  <View
                    style={[
                      styles.confirmedIconWrap,
                      {
                        backgroundColor:
                          mobileUserResponse === "confirmed" ? Colors.safeDim : Colors.primaryDim,
                      },
                    ]}
                  >
                    <Feather
                      name={mobileUserResponse === "confirmed" ? "check-circle" : "alert-circle"}
                      size={28}
                      color={mobileUserResponse === "confirmed" ? Colors.safe : Colors.primary}
                    />
                  </View>
                  <View style={styles.confirmedTextWrap}>
                    <Text style={styles.confirmedTitle}>
                      {mobileUserResponse === "confirmed" ? t.responseConfirmed : t.helpRequested}
                    </Text>
                    <Text style={styles.confirmedSubtitle}>
                      {mobileUserResponse === "confirmed"
                        ? t.markedAsSafe
                        : t.helpOnTheWay}
                    </Text>
                  </View>
                  <StatusBadge status={mobileUserResponse} />
                </View>
              </Card>
            ) : (
              <View style={styles.responseButtons}>
                <Pressable
                  style={({ pressed }) => [styles.responseBtn, styles.safeBtnBg, pressed && styles.pressed]}
                  onPress={() => respondToAlert("confirmed")}
                >
                  <Feather name="shield" size={28} color={Colors.white} />
                  <Text style={styles.responseBtnText}>{t.iAmSafe}</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.responseBtn, styles.helpBtnBg, pressed && styles.pressed]}
                  onPress={() => respondToAlert("need_help")}
                >
                  <Feather name="alert-circle" size={28} color={Colors.white} />
                  <Text style={styles.responseBtnText}>{t.needHelp}</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <Card style={styles.allClearCard}>
            <View style={styles.allClearContent}>
              <View style={styles.allClearIconWrap}>
                <Feather name="check-circle" size={44} color={Colors.safe} />
              </View>
              <Text style={styles.allClearTitle}>{t.noActiveAlerts}</Text>
              <Text style={styles.allClearSubtitle}>
                {t.allSystemsOperational}
              </Text>
            </View>
          </Card>
        )}

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.gpsIndicator}>
              <View style={styles.gpsActiveDot} />
              <Text style={styles.gpsText}>{t.gpsActive}</Text>
            </View>
            <StatusBadge status="enabled" label="Online" />
          </View>
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.locationInfo}>
              <Feather name="map-pin" size={16} color={Colors.textSecondary} />
              <View style={styles.locationTextWrap}>
                <Text style={styles.locationLabel}>{t.currentLocation}</Text>
                <Text style={styles.locationValue}>
                  {currentUser?.location || "Unknown"} · {currentUser?.zone || "Unknown"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* ═══ SHELTER INFO ═══ */}
        <View style={styles.shelterSection}>
          <View style={styles.shelterHeader}>
            <View style={styles.shelterHeaderLeft}>
              <Feather name="home" size={18} color="#F59E0B" />
              <Text style={styles.shelterTitle}>{t.nearbyShelters}</Text>
            </View>
            <Text style={styles.shelterCount}>{activeShelters.length} {t.available}</Text>
          </View>

          {nearestShelter && (
            <Card style={styles.nearestCard}>
              <View style={styles.nearestRow}>
                <View style={styles.nearestIcon}>
                  <Feather name="navigation" size={18} color="#22C55E" />
                </View>
                <View style={styles.nearestInfo}>
                  <Text style={styles.nearestLabel}>{t.nearestShelter}</Text>
                  <Text style={styles.nearestName}>{nearestShelter.shelter.name}</Text>
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceText}>{formatDistance(nearestShelter.distance)}</Text>
                </View>
              </View>
            </Card>
          )}
        </View>

        <View style={{ height: Spacing.xxl }} />
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
  greetingTextWrap: {
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
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
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
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 1,
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
  },
  alertCard: {
    backgroundColor: Colors.primaryDim,
    borderColor: Colors.primaryBorder,
    gap: Spacing.md,
  },
  alertCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  alertCardLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 1.2,
  },
  pulsingDotContainer: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingDotOuter: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
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
  },
  alertIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  alertTypeText: {
    flex: 1,
    gap: 2,
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
  },
  alertMessage: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 22,
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
    minHeight: 96,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedTextWrap: {
    flex: 1,
    gap: 2,
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
  shelterSection: {
    gap: Spacing.sm,
  },
  shelterHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.xs,
  },
  shelterHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  shelterTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  shelterCount: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  nearestCard: {
    borderColor: "#BBF7D0",
    backgroundColor: "#F0FDF4",
    paddingVertical: Spacing.md,
  },
  nearestRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  nearestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
  },
  nearestInfo: {
    flex: 1,
    gap: 2,
  },
  nearestLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  nearestName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  distanceBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  distanceText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: "#16A34A",
  },
});
