import type { UserResponseStatus } from "@workspace/keas-core";

export type BadgeStatus = UserResponseStatus | "ok" | "warn" | "missing";

const MAP: Record<BadgeStatus, { label: string; bg: string; fg: string }> = {
  confirmed: { label: "Safe", bg: "rgba(22,163,74,0.10)", fg: "var(--keas-safe)" },
  pending: { label: "Pending", bg: "rgba(217,119,6,0.10)", fg: "var(--keas-pending)" },
  need_help: { label: "Need help", bg: "rgba(239,68,68,0.12)", fg: "var(--keas-help)" },
  ok: { label: "OK", bg: "rgba(22,163,74,0.10)", fg: "var(--keas-safe)" },
  warn: { label: "Warning", bg: "rgba(217,119,6,0.10)", fg: "var(--keas-pending)" },
  // No-Response / Missing — mirrors mobile's "closed"/"No Response" badge tone.
  missing: { label: "No Response", bg: "var(--keas-surface-2)", fg: "var(--keas-text-secondary)" },
};

export function StatusBadge({
  status,
  label,
}: {
  status: BadgeStatus;
  label?: string;
}) {
  const s = MAP[status];
  return (
    <span
      className="inline-block rounded-md px-2 py-0.5 text-xs font-medium"
      style={{ background: s.bg, color: s.fg }}
    >
      {label ?? s.label}
    </span>
  );
}
