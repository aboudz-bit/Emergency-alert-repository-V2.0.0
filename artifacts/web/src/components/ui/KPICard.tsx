import { cn } from "@/lib/cn";

export function KPICard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number | string;
  tone?: "default" | "safe" | "pending" | "help";
}) {
  const toneColor =
    tone === "safe"
      ? "text-[var(--keas-safe)]"
      : tone === "pending"
        ? "text-[var(--keas-pending)]"
        : tone === "help"
          ? "text-[var(--keas-help)]"
          : "text-[var(--keas-text)]";
  return (
    <div className="rounded-lg bg-[var(--keas-surface)] border border-[var(--keas-border)] p-3">
      <div className="text-xs text-[var(--keas-text-secondary)]">{label}</div>
      <div className={cn("mt-0.5 text-2xl font-medium", toneColor)}>{value}</div>
    </div>
  );
}
