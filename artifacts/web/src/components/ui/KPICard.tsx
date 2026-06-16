import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

// Mirrors artifacts/mobile/components/ui/KPICard.tsx: a colored icon chip + value
// on the top row, label beneath. Tone drives both the icon chip and the icon color.
const TONES: Record<
  "default" | "safe" | "pending" | "help",
  { fg: string; chip: string }
> = {
  default: { fg: "var(--keas-primary)", chip: "var(--keas-primary-dim)" },
  safe: { fg: "var(--keas-safe)", chip: "rgba(22,163,74,0.08)" },
  pending: { fg: "var(--keas-pending)", chip: "rgba(217,119,6,0.08)" },
  help: { fg: "var(--keas-help)", chip: "rgba(239,68,68,0.10)" },
};

export function KPICard({
  label,
  value,
  tone = "default",
  icon: Icon,
}: {
  label: string;
  value: number | string;
  tone?: "default" | "safe" | "pending" | "help";
  icon?: LucideIcon;
}) {
  const t = TONES[tone];
  return (
    <div
      className="flex flex-col gap-2 rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-lg)]"
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <span
            className="flex h-9 w-9 items-center justify-center rounded-[var(--keas-radius-md)]"
            style={{ background: t.chip }}
          >
            <Icon size={16} color={t.fg} />
          </span>
        )}
        <span
          className={cn("text-[var(--keas-text-xxl)] font-semibold leading-none")}
          style={{ color: tone === "default" ? "var(--keas-text-title)" : t.fg }}
        >
          {value}
        </span>
      </div>
      <span className="text-[var(--keas-text-sm)] text-[var(--keas-text-secondary)]">
        {label}
      </span>
    </div>
  );
}
