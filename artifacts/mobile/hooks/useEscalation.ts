import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";

const ESCALATION_CHECK_INTERVAL_MS = 30_000;

type EscalationCallback = (escalated: Array<{ id: number; name: string; level: number; prevLevel: number }>) => void;

let onEscalationChange: EscalationCallback | null = null;
export function setEscalationCallback(cb: EscalationCallback | null) {
  onEscalationChange = cb;
}

export function useEscalation() {
  const { emergencyMode } = useAlertSystemState();
  const escalationTimeout = useStore(
    (s) => s.settings.notifications.escalationTimeoutMinutes
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkEscalation = useCallback(() => {
    const { users, currentUser } = useStore.getState();
    if (!currentUser) return;
    const hasActiveEmergency = emergencyMode !== null;
    if (!hasActiveEmergency) return;

    const now = Date.now();
    const level1Ms = escalationTimeout * 60 * 1000;
    const level2Ms = level1Ms * 2;
    const updates: Array<{ id: number; level: number; prevLevel: number; name: string }> = [];

    for (const user of users) {
      if (!user.isActive) continue;

      if (user.status === "need_help") {
        if ((user.escalationLevel ?? 0) < 3) {
          updates.push({ id: user.id, level: 3, prevLevel: user.escalationLevel ?? 0, name: user.name });
        }
        continue;
      }

      if (user.status === "confirmed") {
        if ((user.escalationLevel ?? 0) !== 0) {
          updates.push({ id: user.id, level: 0, prevLevel: user.escalationLevel ?? 0, name: user.name });
        }
        continue;
      }

      const receivedAt = user.alertReceivedAt
        ? new Date(user.alertReceivedAt).getTime()
        : now;
      const elapsed = now - receivedAt;

      let newLevel = 0;
      if (elapsed >= level2Ms) {
        newLevel = 2;
      } else if (elapsed >= level1Ms) {
        newLevel = 1;
      }

      if (newLevel !== (user.escalationLevel ?? 0)) {
        updates.push({ id: user.id, level: newLevel, prevLevel: user.escalationLevel ?? 0, name: user.name });
      }
    }

    if (updates.length > 0) {
      useStore.setState((s) => ({
        users: s.users.map((u) => {
          const upd = updates.find((x) => x.id === u.id);
          return upd ? { ...u, escalationLevel: upd.level } : u;
        }),
      }));

      const escalated = updates.filter((u) => u.level > u.prevLevel);
      if (escalated.length > 0 && onEscalationChange) {
        onEscalationChange(escalated);
      }
    }
  }, [emergencyMode, escalationTimeout]);

  useEffect(() => {
    if (emergencyMode !== null) {
      checkEscalation();
      intervalRef.current = setInterval(checkEscalation, ESCALATION_CHECK_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      useStore.setState((s) => ({
        users: s.users.map((u) => ({
          ...u,
          escalationLevel: 0,
          alertReceivedAt: null,
          receiptConfirmedAt: null,
          respondedAt: null,
        })),
      }));
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [emergencyMode, checkEscalation]);
}
