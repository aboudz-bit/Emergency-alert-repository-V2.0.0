import type { IncidentEventDto } from "@workspace/keas-core";

// Demo incident events — shown ONLY when the backend returns none, so the
// timeline is demonstrable in a fresh/offline environment (same silent-fallback
// pattern as demoMap.ts). Real synced incidentEvents always take precedence.
const MIN = 60_000;

// [id, minutes-ago, type, extra fields]
const REL: Array<[string, number, string, Partial<IncidentEventDto>]> = [
  ["d1", 18, "alert_started", { zoneName: "CPF", zoneId: 1 }],
  ["d2", 17, "broadcast_sent", { zoneName: "CPF", userName: "Control Room" }],
  ["d3", 15, "user_received_alert", { userName: "A. Salem", locationName: "OT-1" }],
  ["d4", 14, "user_safe", { userName: "A. Salem", locationName: "OT-1" }],
  ["d5", 12, "user_need_help", { userName: "R. Omar", locationName: "Gas Train-1" }],
  ["d6", 11, "escalation_level_1", { userName: "R. Omar", locationName: "Gas Train-1" }],
  ["d7", 8, "shelter_in_activated", { userName: "Supervisor", zoneName: "Camp" }],
  ["d8", 6, "escalation_critical", { userName: "R. Omar", locationName: "Gas Train-1" }],
  ["d9", 2, "supervisor_action", { userName: "Supervisor", locationName: "Camp" }],
];

export function demoEvents(nowMs: number): IncidentEventDto[] {
  return REL.map(([id, minsAgo, type, extra]) => ({
    id,
    type,
    timestamp: nowMs - minsAgo * MIN,
    ...extra,
  }));
}
