import type { UserResponseStatus } from "@workspace/keas-core";

const MAP: Record<
  UserResponseStatus | "ok" | "warn",
  { label: string; bg: string; fg: string }
> = {
  confirmed: { label: "Safe", bg: "rgba(22,163,74,0.10)", fg: "var(--keas-safe)" },
  pending: { label: "Pending", bg: "rgba(217,119,6,0.10)", fg: "var(--keas-pending)" },
  need_help: { label: "Need help", bg: "rgba(239,68,68,0.12)", fg: "var(--keas-help)" },
  ok: { label: "OK", bg: "rgba(22,163,74,0.10)", fg: "var(--keas-safe)" },
  warn: { label: "Warning", bg: "rgba(217,119,6,0.10)", fg: "var(--keas-pending)" },
};

export function StatusBadge({
  status,
  label,
}: {
  status: UserResponseStatus | "ok" | "warn";
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
