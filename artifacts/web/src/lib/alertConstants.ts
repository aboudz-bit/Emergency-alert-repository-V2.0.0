// Alert compose constants — mirror the mobile send-alert screen exactly
// (artifacts/mobile/app/(admin)/(tabs)/send-alert.tsx ALERT_TYPE_OPTIONS /
// PRIORITY_OPTIONS and artifacts/mobile/constants/theme.ts DEFAULT_MESSAGES).
// Used to render the read-only compose review (web does not author alerts).
export const ALERT_TYPE_OPTIONS = ["Security Alert", "Drill", "Restricted Movement", "Custom"] as const;

export const PRIORITY_OPTIONS = ["High", "Medium", "Low"] as const;

// High = primary, Medium = amber, Low = info (= primary) — exact mobile mapping.
export const PRIORITY_COLORS: Record<string, string> = {
  High: "var(--keas-primary)",
  Medium: "var(--keas-amber)",
  Low: "var(--keas-primary)",
};

export const DEFAULT_MESSAGES: Record<string, string> = {
  "Security Alert":
    "A security incident is in progress. Remain indoors, lock all doors and windows, and await further instructions from security personnel.",
  "Restricted Movement":
    "Movement across zones is currently restricted. Remain at your current location and await further instructions.",
  Drill:
    "This is an emergency evacuation drill. Proceed to your designated muster points in a calm and orderly fashion. This is only a drill.",
  Custom: "",
  "All Clear": "The emergency condition has been resolved. All personnel may return to normal operations.",
};

// Relative "time ago" for alertUpdatedAt (ISO string). Mirrors the mobile row time-ago.
export function timeAgo(iso?: string | null, now = Date.now()): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const s = Math.max(0, Math.floor((now - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
