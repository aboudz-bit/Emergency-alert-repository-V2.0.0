import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

/**
 * Single high-importance Android notification channel for emergency alerts.
 * Android 8+ (API 26+) requires every notification to belong to a channel;
 * without an IMPORTANCE_MAX channel, MAX-priority notifications are silently
 * downgraded (no heads-up, no sound), which defeats emergency alerting.
 */
export const EMERGENCY_CHANNEL_ID = "emergency";

let channelEnsured = false;

export async function ensureAndroidNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android" || channelEnsured) return;
  channelEnsured = true;
  try {
    await Notifications.setNotificationChannelAsync(EMERGENCY_CHANNEL_ID, {
      name: "Emergency Alerts",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
      vibrationPattern: [0, 500, 200, 500],
      enableVibrate: true,
      bypassDnd: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      lightColor: "#5B3A8E",
    });
  } catch {
    channelEnsured = false;
  }
}

/**
 * Trigger for an immediate local notification. On Android it targets the
 * emergency channel; on iOS/web `null` delivers immediately (no channels).
 */
export function immediateEmergencyTrigger(): Notifications.NotificationTriggerInput {
  return Platform.OS === "android" ? { channelId: EMERGENCY_CHANNEL_ID } : null;
}
