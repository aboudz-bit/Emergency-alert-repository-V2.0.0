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
import { useStore, selectIsCurrentUserTargeted } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import { useTranslation } from "@/i18n/useTranslation";
import { translateAlertType, translateAlertTitle, translateAlertMessage, translateZone } from "@/i18n/translations";

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

function formatTimeAgo(timestamp: string, t: import("@/i18n/translations").TranslationStrings): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return `${mins} ${t.minutesAgo}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${t.hoursAgo}`;
  return `${Math.floor(hours / 24)} ${t.daysAgo}`;
}

function PulsingDot({ size = 14 }: { size?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 2,
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
    <View style={[styles.pulsingDotContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.pulsingDotOuter,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
            opacity,
          },
        ]}
      />
      <View
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: (size * 0.6) / 2,
          backgroundColor: Colors.primary,
        }}
      />
    </View>
  );
}

export default function AlertDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activeAlert: rawActiveAlert } = useAlertSystemState();
  // Non-targeted users (same zone, unselected location) see no active alert.
  const isUserTargeted = useStore(selectIsCurrentUserTargeted);
  const activeAlert = isUserTargeted ? rawActiveAlert : null;
  const mobileUserResponse = useStore((s) => s.mobileUserResponse);
  const respondToAlert = useStore((s) => s.respondToAlert);
  const dismissAlertSound = useStore((s) => s.dismissAlertSound);
  const { t } = useTranslation();

  useEffect(() => {
    if (activeAlert) {
      dismissAlertSound();
    }
  }, [activeAlert, dismissAlertSound]);

  const handleRespond = (response: "confirmed" | "need_help") => {
    respondToAlert(response);
  };

  if (!activeAlert) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: insets.top },
          styles.centeredContainer,
        ]}
      >
        <View style={styles.noAlertContent}>
          <View style={styles.noAlertIconWrap}>
            <Feather name="check-circle" size={48} color={Colors.safe} />
          </View>
          <Text style={styles.noAlertTitle}>{t.noActiveAlert}</Text>
          <Text style={styles.noAlertSubtitle}>
            {t.noEmergencyAlerts}
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && { opacity: 0.85 },
            ]}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={18} color={Colors.text} />
            <Text style={styles.backButtonText}>{t.backToHome}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          style={styles.topBarBackBtn}
        >
          <Feather name="arrow-left" size={22} color={Colors.text} />
        </Pressable>
        <View style={styles.topBarCenter}>
          <PulsingDot size={10} />
          <Text style={styles.topBarLabel}>{t.activeEmergency}</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Alert Type Icon and Title */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Feather
              name={getAlertIcon(activeAlert.type)}
              size={36}
              color={Colors.white}
            />
          </View>
          <Text style={styles.heroTitle}>{translateAlertTitle(activeAlert.title, t)}</Text>
          <Text style={styles.heroType}>{translateAlertType(activeAlert.type, t)}</Text>
        </View>

        {/* Full Message */}
        <Card style={styles.messageCard}>
          <Text style={styles.messageSectionLabel}>{t.alertMessage}</Text>
          <Text style={styles.messageText}>{translateAlertMessage(activeAlert.message, t)}</Text>
        </Card>

        {/* Info Row */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Feather name="clock" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>{t.issued}</Text>
              <Text style={styles.infoValue}>
                {formatTimeAgo(activeAlert.timestamp, t)}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Feather name="user" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>{t.sentBy}</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {activeAlert.sentBy}
              </Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Feather name="map-pin" size={14} color={Colors.textSecondary} />
              <Text style={styles.infoLabel}>{t.zone}</Text>
              <Text style={styles.infoValue}>{translateZone(activeAlert.zone, t)}</Text>
            </View>
          </View>
        </Card>

        {/* Live Stats */}
        <Card style={styles.statsCard}>
          <Text style={styles.statsSectionLabel}>{t.liveResponseStatus}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View
                style={[styles.statDot, { backgroundColor: Colors.safe }]}
              />
              <Text style={styles.statCount}>
                {activeAlert.stats?.confirmed ?? 0}
              </Text>
              <Text style={styles.statLabel}>{t.safe}</Text>
            </View>
            <View style={styles.statItem}>
              <View
                style={[styles.statDot, { backgroundColor: Colors.noreply }]}
              />
              <Text style={styles.statCount}>
                {activeAlert.stats?.pending ?? 0}
              </Text>
              <Text style={styles.statLabel}>{t.pending}</Text>
            </View>
            <View style={styles.statItem}>
              <View
                style={[styles.statDot, { backgroundColor: Colors.primary }]}
              />
              <Text style={styles.statCount}>
                {activeAlert.stats?.needHelp ?? 0}
              </Text>
              <Text style={styles.statLabel}>{t.needHelp}</Text>
            </View>
          </View>
        </Card>

        {/* Response Buttons or Confirmed Status */}
        {mobileUserResponse ? (
          <Card style={styles.confirmedCard}>
            <View style={styles.confirmedContent}>
              <View
                style={[
                  styles.confirmedIconWrap,
                  {
                    backgroundColor:
                      mobileUserResponse === "confirmed"
                        ? Colors.safeDim
                        : Colors.primaryDim,
                  },
                ]}
              >
                <Feather
                  name={
                    mobileUserResponse === "confirmed"
                      ? "check-circle"
                      : "alert-circle"
                  }
                  size={32}
                  color={
                    mobileUserResponse === "confirmed"
                      ? Colors.safe
                      : Colors.primary
                  }
                />
              </View>
              <Text style={styles.confirmedTitle}>
                {mobileUserResponse === "confirmed"
                  ? t.responseConfirmed
                  : t.helpRequested}
              </Text>
              <Text style={styles.confirmedSubtitle}>
                {mobileUserResponse === "confirmed"
                  ? t.noFurtherAction
                  : t.assistanceOnTheWay}
              </Text>
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
              <Feather name="shield" size={28} color={Colors.white} />
              <Text style={styles.responseBtnTitle}>{t.iAmSafe}</Text>
              <Text style={styles.responseBtnSubtitle}>
                {t.confirmYouAreSafe}
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.responseBtn,
                styles.helpBtnBg,
                pressed && styles.pressed,
              ]}
              onPress={() => handleRespond("need_help")}
            >
              <Feather name="alert-circle" size={28} color={Colors.white} />
              <Text style={styles.responseBtnTitle}>{t.needHelp}</Text>
              <Text style={styles.responseBtnSubtitle}>
                {t.requestAssistance}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryDim,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryBorder,
  },
  topBarBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  topBarLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
    letterSpacing: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  heroTitle: {
    fontSize: FontSize.xxxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  heroType: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  messageCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  messageSectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.md,
  },
  messageText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
    lineHeight: 26,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    textAlign: "center",
  },
  infoDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
  },
  statsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  statsSectionLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: Spacing.xs,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statCount: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  responseButtons: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  responseBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minHeight: 100,
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
  responseBtnTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  responseBtnSubtitle: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  confirmedCard: {
    borderColor: Colors.safeBorder,
  },
  confirmedContent: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  confirmedIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmedTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  confirmedSubtitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.lg,
  },
  pulsingDotContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulsingDotOuter: {
    position: "absolute",
    backgroundColor: Colors.primary,
  },
  noAlertContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.lg,
  },
  noAlertIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.safeDim,
    alignItems: "center",
    justifyContent: "center",
  },
  noAlertTitle: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  noAlertSubtitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
});
