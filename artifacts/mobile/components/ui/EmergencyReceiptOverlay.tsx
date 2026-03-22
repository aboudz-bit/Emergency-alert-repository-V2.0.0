import React, { Component, useEffect, useRef, useState, useCallback } from "react";
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

let alarmSource: any = null;
try {
  alarmSource = require("@/assets/sounds/emergency-alarm.wav");
} catch (e) {
  console.error("[EmergencyReceiptOverlay] Failed to load alarm asset:", e);
}

// ─── Error boundary ──────────────────────────────────────────────────────────

class OverlayErrorBoundary extends Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(err: Error) {
    console.error("[EmergencyReceiptOverlay] Render error caught:", err);
    return { hasError: true };
  }
  componentDidCatch(err: Error, info: any) {
    console.error("[EmergencyReceiptOverlay] componentDidCatch:", err, info?.componentStack);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// ─── Inner component ─────────────────────────────────────────────────────────

function EmergencyReceiptOverlayInner() {
  const currentUser = useStore((s) => s.currentUser);
  const emergencyModes = useStore((s) => s.emergencyModes);
  const confirmEmergencyReceipt = useStore((s) => s.confirmEmergencyReceipt);

  // Safe array accesses – guard against corrupted/missing persisted state
  const receipts = emergencyModes?.receipts ?? [];
  const shelterInZones = emergencyModes?.shelterInZones ?? [];
  const blackoutZones = emergencyModes?.blackoutZones ?? [];

  const pendingModes: EmergencyModeType[] = [];
  if (currentUser && emergencyModes) {
    if (emergencyModes.shelterIn) {
      const receipt = receipts.find(
        (r) => r.userId === currentUser.id && r.modeType === "shelterIn"
      );
      if (receipt && !receipt.receiptConfirmed) {
        pendingModes.push("shelterIn");
      }
    }
    if (emergencyModes.blackout) {
      const receipt = receipts.find(
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
  const mountedRef = useRef(true);
  const playingRef = useRef(false);
  const audioModeInitRef = useRef(false);

  // Track mount/unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const initAudioMode = useCallback(async () => {
    if (audioModeInitRef.current) return;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      audioModeInitRef.current = true;
      console.log("[EmergencyReceiptOverlay] Audio mode initialized");
    } catch (e) {
      console.error("[EmergencyReceiptOverlay] setAudioModeAsync failed:", e);
    }
  }, []);

  const playAlarm = useCallback(async () => {
    if (playingRef.current) {
      console.log("[EmergencyReceiptOverlay] playAlarm skipped – already playing");
      return;
    }
    playingRef.current = true;
    try {
      await initAudioMode();

      if (!alarmSource) {
        console.error("[EmergencyReceiptOverlay] alarmSource is null – skipping playback");
        return;
      }

      if (soundRef.current) {
        try {
          await soundRef.current.setPositionAsync(0);
          await soundRef.current.playAsync();
          console.log("[EmergencyReceiptOverlay] Alarm replayed");
        } catch (e) {
          console.error("[EmergencyReceiptOverlay] Replay failed, recreating sound:", e);
          try {
            await soundRef.current.unloadAsync();
          } catch (_) {}
          soundRef.current = null;
        }
      }

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(alarmSource, {
          shouldPlay: true,
          volume: 1.0,
        });
        soundRef.current = sound;
        console.log("[EmergencyReceiptOverlay] Alarm sound created and playing");
      }
    } catch (e) {
      console.error("[EmergencyReceiptOverlay] playAlarm failed:", e);
    } finally {
      playingRef.current = false;
    }
  }, [initAudioMode]);

  const stopAlarm = useCallback(async () => {
    // Clear interval immediately (sync)
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Stop and unload sound (async, errors are safe to swallow)
    const sound = soundRef.current;
    soundRef.current = null;
    if (sound) {
      try {
        await sound.stopAsync();
      } catch (e) {
        console.error("[EmergencyReceiptOverlay] stopAsync failed:", e);
      }
      try {
        await sound.unloadAsync();
      } catch (e) {
        console.error("[EmergencyReceiptOverlay] unloadAsync failed:", e);
      }
    }
  }, []);

  // Audio alarm effect
  useEffect(() => {
    if (!hasPending) {
      // Only clear interval sync here; sound cleanup is handled by the
      // previous effect's return (cleanup). Avoid double-stopping.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (mountedRef.current) setAlarmCount(0);
      return;
    }

    // Start alarm
    playAlarm();
    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      setAlarmCount((c) => c + 1);
      playAlarm();
    }, ALARM_INTERVAL_MS);

    return () => {
      // Cleanup: stop sound and clear interval when hasPending goes false
      // or component unmounts
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Async sound teardown — errors logged inside stopAlarm
      const sound = soundRef.current;
      soundRef.current = null;
      if (sound) {
        sound.stopAsync().catch((e) =>
          console.error("[EmergencyReceiptOverlay] cleanup stopAsync:", e)
        );
        sound.unloadAsync().catch((e) =>
          console.error("[EmergencyReceiptOverlay] cleanup unloadAsync:", e)
        );
      }
      audioModeInitRef.current = false;
    };
  }, [hasPending, playAlarm]);

  // Pulse animation effect
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
          const zones = isShelter ? shelterInZones : blackoutZones;
          const activatedBy = isShelter
            ? emergencyModes?.shelterInActivatedBy
            : emergencyModes?.blackoutActivatedBy;

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
              {activatedBy ? (
                <Text style={styles.activatedBy}>
                  Activated by {activatedBy}
                </Text>
              ) : null}

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
                onPress={() => {
                  try {
                    confirmEmergencyReceipt(mode);
                  } catch (e) {
                    console.error("[EmergencyReceiptOverlay] confirmEmergencyReceipt failed:", e);
                  }
                }}
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

// ─── Public export (wrapped in error boundary) ────────────────────────────────

export function EmergencyReceiptOverlay() {
  return (
    <OverlayErrorBoundary>
      <EmergencyReceiptOverlayInner />
    </OverlayErrorBoundary>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
