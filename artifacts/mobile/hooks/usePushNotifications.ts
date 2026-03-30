import { useEffect, useRef, useCallback, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
  }),
});

export type NotificationPermissionStatus = "granted" | "denied" | "undetermined";

export function usePushNotifications() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const pushEnabled = useStore((s) => s.settings.notifications.pushNotifications);
  const { emergencyMode, activeAlert } = useAlertSystemState();

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>("undetermined");
  const [pushToken, setPushToken] = useState<string | null>(null);
  const lastNotifiedAlertRef = useRef<string | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === "web") {
      if ("Notification" in window) {
        const result = await Notification.requestPermission();
        setPermissionStatus(result === "granted" ? "granted" : "denied");
        return result === "granted";
      }
      setPermissionStatus("denied");
      return false;
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") {
      setPermissionStatus("granted");
      return true;
    }
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status === "granted" ? "granted" : "denied");
    return status === "granted";
  }, []);

  const registerToken = useCallback(async () => {
    if (Platform.OS === "web") return;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync();
      setPushToken(tokenData.data);
    } catch {
      // Token registration failed
    }
  }, []);

  useEffect(() => {
    if (!pushEnabled || !currentUser) return;
    requestPermission().then((granted) => {
      if (granted) registerToken();
    });
  }, [pushEnabled, currentUser?.id]);

  useEffect(() => {
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.screen === "alert") {
        router.push("/(user)/alert");
      }
    });
    return () => {
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [router]);

  useEffect(() => {
    if (!pushEnabled || !currentUser) return;
    if (!emergencyMode || !activeAlert) {
      lastNotifiedAlertRef.current = null;
      return;
    }

    const alertKey = `${emergencyMode}-${activeAlert.id}`;
    if (lastNotifiedAlertRef.current === alertKey) return;
    lastNotifiedAlertRef.current = alertKey;

    const title = emergencyMode === "broadcastAlert"
      ? "EMERGENCY ALERT"
      : emergencyMode === "zoneAlert"
        ? "ZONE ALERT"
        : emergencyMode === "blackout"
          ? "BLACKOUT ACTIVATED"
          : "SHELTER IN PLACE";

    const body = activeAlert.message || "An emergency has been activated. Open the app immediately.";

    if (Platform.OS === "web") {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body, icon: "/icon.png", requireInteraction: true });
      }
    } else {
      Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: "default",
          priority: Notifications.AndroidNotificationPriority.MAX,
          data: { screen: "alert", alertId: activeAlert.id },
        },
        trigger: null,
      }).catch(() => {});
    }
  }, [emergencyMode, activeAlert?.id, pushEnabled, currentUser?.id]);

  const sendLocalNotification = useCallback(async (title: string, body: string, data?: Record<string, unknown>) => {
    if (Platform.OS === "web") {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(title, { body });
      }
      return;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title, body, sound: "default",
        priority: Notifications.AndroidNotificationPriority.MAX,
        data: data ?? {},
      },
      trigger: null,
    }).catch(() => {});
  }, []);

  return {
    permissionStatus,
    pushToken,
    requestPermission,
    sendLocalNotification,
  };
}
