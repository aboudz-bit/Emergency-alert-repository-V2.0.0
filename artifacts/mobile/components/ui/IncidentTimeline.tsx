import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing } from "@/constants/theme";
import type { TimelineEvent, TimelineEventType } from "@/types";

const ICON: Record<TimelineEventType, keyof typeof Feather.glyphMap> = {
  alert_created: "file-plus",
  alert_activated: "bell",
  zones_selected: "map",
  response_safe: "check-circle",
  response_need_help: "alert-circle",
  response_pending: "clock",
  accountability_started: "users",
  personnel_verified: "user-check",
  escalation_required: "alert-triangle",
  hazard_all_clear: "shield-off",
  accountability_complete: "check-square",
  incident_closed: "lock",
  report_generated: "file-text",
};

const ICON_COLOR: Partial<Record<TimelineEventType, string>> = {
  response_need_help: Colors.destructive,
  escalation_required: Colors.destructive,
  hazard_all_clear: Colors.safe,
  accountability_complete: Colors.safe,
  incident_closed: Colors.primary,
  response_safe: Colors.safe,
};

function fmt(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return ts;
  }
}

/** Read-only incident timeline / event log. */
export function IncidentTimeline({ events, max }: { events: TimelineEvent[]; max?: number }) {
  if (!events || events.length === 0) {
    return <Text style={styles.empty}>No incident events recorded yet.</Text>;
  }
  // newest first
  const ordered = [...events].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  const shown = typeof max === "number" ? ordered.slice(0, max) : ordered;

  return (
    <View>
      {shown.map((ev, idx) => (
        <View key={ev.id} style={styles.row}>
          <View style={styles.railCol}>
            <View style={[styles.dot, { borderColor: ICON_COLOR[ev.type] ?? Colors.primary }]}>
              <Feather name={ICON[ev.type] ?? "circle"} size={12} color={ICON_COLOR[ev.type] ?? Colors.primary} />
            </View>
            {idx < shown.length - 1 && <View style={styles.rail} />}
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>{ev.label}</Text>
            <Text style={styles.meta}>
              {fmt(ev.timestamp)}{ev.actor ? ` · ${ev.actor}` : ""}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textTertiary, paddingVertical: Spacing.sm },
  row: { flexDirection: "row", gap: Spacing.md },
  railCol: { alignItems: "center", width: 28 },
  dot: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1.5,
    alignItems: "center", justifyContent: "center", backgroundColor: Colors.surface,
  },
  rail: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 2 },
  body: { flex: 1, paddingBottom: Spacing.md },
  label: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textTitle },
  meta: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 1 },
});
