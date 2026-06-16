import React, { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { useStore } from "@/store";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useEscalation, setEscalationCallback, type EscalationEntry } from "@/hooks/useEscalation";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { immediateEmergencyTrigger } from "@/utils/notifications";
import * as Notifications from "expo-notifications";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

export function SystemServices() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return null;

  return <SystemServicesInner />;
}

function SystemServicesInner() {
  useEmergencyAlerts();
  useEscalation();
  // Mount the push-notification pipeline (permission request, token registration,
  // Android channel, primary emergency notification, notification-tap deep link).
  usePushNotifications();

  const currentUser = useStore((s) => s.currentUser);
  const role = currentUser?.role;
  const isAdmin = role === "Super Admin" || role === "ECO" || role === "Supervisor";
  const prevNeedHelpRef = React.useRef<Set<number>>(new Set());
  const prevAlertNotifCountRef = React.useRef(0);

  const sendNotification = useCallback(
    async (title: string, body: string) => {
      if (Platform.OS === "web") {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body });
        }
        return;
      }
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: "default",
            priority: Notifications.AndroidNotificationPriority.MAX,
          },
          trigger: immediateEmergencyTrigger(),
        });
      } catch {}
    },
    []
  );

  const isEcoOrAdmin = role === "Super Admin" || role === "ECO";
  const ecoZoneName = currentUser?.ecoZoneName ?? currentUser?.zone ?? "";

  useEffect(() => {
    if (!isEcoOrAdmin) {
      setEscalationCallback(null);
      return;
    }

    setEscalationCallback((escalated) => {
      const isEco = role === "ECO";
      const criticals = escalated.filter((e) => {
        if (e.level < 2 || e.level >= 3) return false;
        if (isEco && e.zoneName && e.zoneName !== ecoZoneName) return false;
        return true;
      });

      for (const e of criticals) {
        const loc = [e.zoneName, e.locationName].filter(Boolean).join(" / ");
        const where = loc ? ` in ${loc}` : "";
        sendNotification(
          "CRITICAL: Unresponsive Personnel",
          `${e.name}${where} has not responded for 10 minutes. Immediate action required.`
        );
      }
    });

    return () => setEscalationCallback(null);
  }, [isEcoOrAdmin, role, ecoZoneName, sendNotification]);

  useEffect(() => {
    if (!isAdmin) return;

    const unsub = useStore.subscribe((state) => {
      const currentNeedHelp = new Set(
        state.users.filter((u) => u.isActive && u.status === "need_help").map((u) => u.id)
      );
      const prev = prevNeedHelpRef.current;
      const newNeedHelp = [...currentNeedHelp].filter((id) => !prev.has(id));
      prevNeedHelpRef.current = currentNeedHelp;

      if (newNeedHelp.length > 0) {
        const names = newNeedHelp
          .map((id) => state.users.find((u) => u.id === id)?.name ?? `User ${id}`)
          .slice(0, 3)
          .join(", ");
        const extra = newNeedHelp.length > 3 ? ` +${newNeedHelp.length - 3} more` : "";
        sendNotification(
          "NEED HELP",
          `${names}${extra} requested immediate assistance.`
        );
      }

    });

    return unsub;
  }, [isAdmin, sendNotification]);

  useEffect(() => {
    prevAlertNotifCountRef.current = useStore.getState().alertNotifications.length;

    const unsub = useStore.subscribe((state) => {
      const notifCount = state.alertNotifications.length;
      if (notifCount > prevAlertNotifCountRef.current) {
        const latest = state.alertNotifications[0];
        if (latest && state.currentUser) {
          const user = state.currentUser;
          const inTargetZone = latest.zoneId === user.zoneId;
          const inTargetLocation =
            latest.scope === "all" ||
            (latest.targetLocationIds ?? []).includes(user.locationId);
          if (inTargetZone && inTargetLocation) {
            sendNotification(
              `Alert Update — ${latest.zoneName}`,
              latest.message
            );
          }
        }
      }
      prevAlertNotifCountRef.current = notifCount;
    });

    return unsub;
  }, [sendNotification]);

  return null;
}
