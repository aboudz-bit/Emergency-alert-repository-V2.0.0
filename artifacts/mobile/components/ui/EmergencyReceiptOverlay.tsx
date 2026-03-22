import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { EmergencyModeType } from "@/types";

const ALARM_INTERVAL_MS = 30_000;

const alarmSource = require("@/assets/sounds/emergency-alarm.wav");

export function EmergencyReceiptOverlay() {
  const currentUser = useStore((s) => s.currentUser);
  const emergencyModes = useStore((s) => s.emergencyModes);
  const confirmEmergencyReceipt = useStore((s) => s.confirmEmergencyReceipt);

  const pendingModes: EmergencyModeType[] = [];
  if (currentUser) {
    if (emergencyModes.shelterIn) {
      const receipt = emergencyModes.receipts.find(
        (r) => r.userId === currentUser.id && r.modeType === "shelterIn"
      );
      if (receipt && !receipt.receiptConfirmed) {
        pendingModes.push("shelterIn");
      }
    }
    if (emergencyModes.blackout) {
      const receipt = emergencyModes.receipts.find(
        (r) => r.userId === currentUser.id && r.modeType === "blackout"
      );
      if (receipt && !receipt.receiptConfirmed) {
        pendingModes.push("blackout");
      }
    }
  }

  const hasPending = pendingModes.length > 0;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [alarmCount, setAlarmCount] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playAlarm = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      if (soundRef.current) {
        await soundRef.current.setPositionAsync(0);
        await soundRef.current.playAsync();
      } else {
        const { sound } = await Audio.Sound.createAsync(alarmSource, {
          shouldPlay: true,
          volume: 1.0,
        });
        soundRef.current = sound;
      }
    } catch (_e) {}
  }, []);

  const stopAlarm = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch (_e) {}
      soundRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hasPending) {
      stopAlarm();
      setAlarmCount(0);
      return;
    }
    playAlarm();
    intervalRef.current = setInterval(() => {
      setAlarmCount((c) => c + 1);
      playAlarm();
    }, ALARM_INTERVAL_MS);

    return () => {
      stopAlarm();
    };
  }, [hasPending, playAlarm, stopAlarm]);

  useEffect(() => {
    if (!hasPending) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [hasPending, pulseAnim]);

  if (!hasPending) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        {pendingModes.map((mode) => {
          const isShelter = mode === "shelterIn";
          const zones = isShelter
            ? emergencyModes.shelterInZones
            : emergencyModes.blackoutZones;
          const activatedBy = isShelter
            ? emergencyModes.shelterInActivatedBy
            : emergencyModes.blackoutActivatedBy;

          return (
            <View
              key={mode}
              style={[
                styles.card,
                isShelter ? styles.cardShelter : styles.cardBlackout,
              ]}
            >
              <Animated.View style={[styles.iconCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Feather
                  name={isShelter ? "shield" : "zap-off"}
                  size={32}
                  color="#fff"
                />
              </Animated.View>

              <Text style={styles.modeTitle}>
                {isShelter ? "SHELTER IN" : "BLACKOUT"}
              </Text>
              <Text style={styles.modeSubtitle}>
                Emergency Mode Activated
              </Text>

              {zones.length > 0 && (
                <Text style={styles.zonesText}>
                  Zones: {zones.join(", ")}
                </Text>
              )}
              {activatedBy && (
                <Text style={styles.activatedBy}>
                  Activated by {activatedBy}
                </Text>
              )}

              {alarmCount > 0 && (
                <View style={styles.alarmBadge}>
                  <Feather name="bell" size={12} color="#fff" />
                  <Text style={styles.alarmText}>
                    Reminder #{alarmCount}
                  </Text>
                </View>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.confirmBtn,
                  isShelter ? styles.confirmBtnShelter : styles.confirmBtnBlackout,
                  pressed && { opacity: 0.85 },
                ]}
                onPress={() => confirmEmergencyReceipt(mode)}
              >
                <Feather name="check-circle" size={20} color="#fff" />
                <Text style={styles.confirmBtnText}>Confirm Receipt</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
    padding: Spacing.xl,
  },
  content: {
    width: "100%",
    maxWidth: 380,
    gap: Spacing.lg,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardShelter: {
    backgroundColor: Colors.amber,
  },
  cardBlackout: {
    backgroundColor: Colors.primary,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  modeTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 2,
  },
  modeSubtitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  zonesText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.9)",
    marginTop: 4,
  },
  activatedBy: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  alarmBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: Spacing.sm,
  },
  alarmText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 16,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  confirmBtnShelter: {
    backgroundColor: "#92400E",
  },
  confirmBtnBlackout: {
    backgroundColor: "#3B1F6E",
  },
  confirmBtnText: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
