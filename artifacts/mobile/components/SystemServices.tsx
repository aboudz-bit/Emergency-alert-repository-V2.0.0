import React, { useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { useStore } from "@/store";
import { useEmergencyAlerts } from "@/hooks/useEmergencyAlerts";
import { useEscalation, setEscalationCallback } from "@/hooks/useEscalation";
import * as Notifications from "expo-notifications";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
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

  const currentUser = useStore((s) => s.currentUser);
  const role = currentUser?.role;
  const isAdmin = role === "Super Admin" || role === "ECO" || role === "Supervisor";
  const prevNeedHelpRef = React.useRef<Set<number>>(new Set());

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
          trigger: null,
        });
      } catch {}
    },
    []
  );

  useEffect(() => {
    if (!isAdmin) {
      setEscalationCallback(null);
      return;
    }

    setEscalationCallback((escalated) => {
      const criticals = escalated.filter((e) => e.level >= 2);
      const warnings = escalated.filter((e) => e.level === 1);

      if (criticals.length > 0) {
        const names = criticals
          .slice(0, 3)
          .map((e) => e.name)
          .join(", ");
        const extra = criticals.length > 3 ? ` +${criticals.length - 3} more` : "";
        sendNotification(
          "CRITICAL: Unresponsive Personnel",
          `${names}${extra} — no response received. Immediate action required.`
        );
      }

      if (warnings.length > 0) {
        sendNotification(
          "Escalation Warning",
          `${warnings.length} personnel have not responded within the timeout period.`
        );
      }
    });

    return () => setEscalationCallback(null);
  }, [isAdmin, sendNotification]);

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

  return null;
}
