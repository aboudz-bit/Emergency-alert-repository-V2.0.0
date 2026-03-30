import { useEffect, useRef, useCallback } from "react";
import { Platform, Vibration } from "react-native";
import { Audio } from "expo-av";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";

const VIBRATION_PATTERN = [0, 500, 200, 500, 200, 500];
const VIBRATION_REPEAT = Platform.OS === "android";

let webAudioCtx: AudioContext | null = null;
let webOscillator: OscillatorNode | null = null;
let webLfo: OscillatorNode | null = null;
let webGain: GainNode | null = null;
let webLfoGain: GainNode | null = null;

function startWebSound() {
  if (webOscillator) return;
  try {
    if (!webAudioCtx) webAudioCtx = new AudioContext();
    webGain = webAudioCtx.createGain();
    webGain.gain.value = 0.3;
    webGain.connect(webAudioCtx.destination);

    webOscillator = webAudioCtx.createOscillator();
    webOscillator.type = "square";
    webOscillator.frequency.value = 880;
    webOscillator.connect(webGain);
    webOscillator.start();

    webLfo = webAudioCtx.createOscillator();
    webLfo.frequency.value = 2;
    webLfoGain = webAudioCtx.createGain();
    webLfoGain.gain.value = 440;
    webLfo.connect(webLfoGain);
    webLfoGain.connect(webOscillator.frequency);
    webLfo.start();
  } catch {
    // Web Audio not available
  }
}

function stopWebSound() {
  try {
    if (webLfo) {
      webLfo.stop();
      webLfo.disconnect();
      webLfo = null;
    }
    if (webLfoGain) {
      webLfoGain.disconnect();
      webLfoGain = null;
    }
    if (webOscillator) {
      webOscillator.stop();
      webOscillator.disconnect();
      webOscillator = null;
    }
    if (webGain) {
      webGain.disconnect();
      webGain = null;
    }
  } catch {
    webLfo = null;
    webLfoGain = null;
    webOscillator = null;
    webGain = null;
  }
}

let webVibrationInterval: ReturnType<typeof setInterval> | null = null;

function startWebVibration() {
  if (webVibrationInterval) return;
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(VIBRATION_PATTERN);
    webVibrationInterval = setInterval(() => {
      navigator.vibrate(VIBRATION_PATTERN);
    }, 2400);
  }
}

function stopWebVibration() {
  if (webVibrationInterval) {
    clearInterval(webVibrationInterval);
    webVibrationInterval = null;
  }
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(0);
  }
}

const ADMIN_ROLES = new Set(["Super Admin", "ECO", "Supervisor", "IT"]);

export function useEmergencyAlerts() {
  const { emergencyMode, activeZoneIds } = useAlertSystemState();
  const alertSoundEnabled = useStore(
    (s) => s.settings.notifications.alertSound
  );
  const currentUser = useStore((s) => s.currentUser);
  const alertSoundDismissed = useStore((s) => s.alertSoundDismissed);
  const emergencyModes = useStore((s) => s.emergencyModes);
  const zones = useStore((s) => s.zones);

  const userRole = currentUser?.role;
  const userZoneId = currentUser?.zoneId;
  const userStatus = currentUser?.status;

  const userZoneName = userZoneId != null
    ? zones.find((z) => z.id === userZoneId)?.name ?? null
    : null;

  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef(false);
  const startGenRef = useRef(0);
  const vibrationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const hasActiveEmergency = emergencyMode !== null;
  const isAdmin = userRole ? ADMIN_ROLES.has(userRole) : false;
  const userHasResponded = userStatus === "confirmed" || userStatus === "need_help";

  const userInAffectedZone = (() => {
    if (emergencyMode === "broadcastAlert") return true;
    if (emergencyMode === "zoneAlert") {
      return userZoneId != null && activeZoneIds.includes(userZoneId);
    }
    if (emergencyMode === "shelterIn") {
      const targetZones = emergencyModes?.shelterInZones ?? [];
      return targetZones.length === 0 || (userZoneName != null && targetZones.includes(userZoneName));
    }
    if (emergencyMode === "blackout") {
      const targetZones = emergencyModes?.blackoutZones ?? [];
      return targetZones.length === 0 || (userZoneName != null && targetZones.includes(userZoneName));
    }
    return false;
  })();

  const shouldAlert =
    hasActiveEmergency &&
    !isAdmin &&
    userInAffectedZone &&
    !userHasResponded &&
    !alertSoundDismissed &&
    alertSoundEnabled;

  const startNativeSound = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    const gen = ++startGenRef.current;
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });
      const { sound } = await Audio.Sound.createAsync(
        require("@/assets/alert-tone.wav"),
        { isLooping: true, volume: 1.0, shouldPlay: true }
      );
      if (gen !== startGenRef.current) {
        await sound.stopAsync();
        await sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
    } catch {
      isPlayingRef.current = false;
    }
  }, []);

  const stopNativeSound = useCallback(async () => {
    isPlayingRef.current = false;
    ++startGenRef.current;
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {
        // Already unloaded
      }
      soundRef.current = null;
    }
  }, []);

  const startVibration = useCallback(() => {
    if (Platform.OS === "web") {
      startWebVibration();
      return;
    }
    if (vibrationIntervalRef.current) return;
    Vibration.vibrate(VIBRATION_PATTERN, VIBRATION_REPEAT);
    if (Platform.OS === "ios") {
      vibrationIntervalRef.current = setInterval(() => {
        Vibration.vibrate(VIBRATION_PATTERN, false);
      }, 2400);
    }
  }, []);

  const stopVibration = useCallback(() => {
    if (Platform.OS === "web") {
      stopWebVibration();
      return;
    }
    Vibration.cancel();
    if (vibrationIntervalRef.current) {
      clearInterval(vibrationIntervalRef.current);
      vibrationIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (shouldAlert) {
      if (Platform.OS === "web") {
        startWebSound();
      } else {
        startNativeSound();
      }
      startVibration();
    } else {
      if (Platform.OS === "web") {
        stopWebSound();
      } else {
        stopNativeSound();
      }
      stopVibration();
    }

    return () => {
      if (Platform.OS === "web") {
        stopWebSound();
      } else {
        stopNativeSound();
      }
      stopVibration();
    };
  }, [shouldAlert]);
}
