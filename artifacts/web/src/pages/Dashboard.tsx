import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { Lightbulb, Siren } from "lucide-react";
import { scopedAlertStats, type Zone, type UserResponseStatus } from "@workspace/keas-core";

// Static demo data for the Phase 3.1 shell. Phase 3.2 replaces this with the
// generated React Query hooks against the shared backend. The stats below are
// computed with the SHARED keas-core logic to prove the cross-platform wiring.
const DEMO_ZONES = [
  { id: 1, alertTargetScope: "zone", alertTargetLocationIds: [] },
] as Array<Pick<Zone, "id" | "alertTargetScope" | "alertTargetLocationIds">>;

const DEMO_USERS: Array<{
  zoneId: number;
  locationId: number;
  status: UserResponseStatus;
  isActive: boolean;
}> = [
  ...Array.from({ length: 240 }, () => ({ zoneId: 1, locationId: 10, status: "confirmed" as const, isActive: true })),
  ...Array.from({ length: 66 }, () => ({ zoneId: 1, locationId: 10, status: "pending" as const, isActive: true })),
  ...Array.from({ length: 6 }, () => ({ zoneId: 1, locationId: 20, status: "need_help" as const, isActive: true })),
];

const ZONE_STATUS: Array<{ name: string; tone: "ok" | "warn" | "alert" }> = [
  { name: "OT-1", tone: "ok" },
  { name: "OT-2", tone: "alert" },
  { name: "Gas-1", tone: "warn" },
  { name: "Camp", tone: "ok" },
  { name: "CCR", tone: "ok" },
  { name: "OT-3", tone: "warn" },
  { name: "Gas-2", tone: "ok" },
  { name: "+4", tone: "ok" },
];

export function DashboardPage() {
  const stats = scopedAlertStats(DEMO_ZONES, DEMO_USERS);
  const missing = 11;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Operational overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Active alerts" value={2} />
        <KPICard label="Personnel" value={stats.total} />
        <KPICard label="Safe" value={stats.confirmed} tone="safe" />
        <KPICard label="Need help" value={stats.needHelp} tone="help" />
        <KPICard label="Missing" value={missing} tone="pending" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Active incidents" icon={<Siren size={16} color="var(--keas-danger)" />}>
          <div
            className="mb-2 py-1 pl-2"
            style={{ borderLeft: "3px solid var(--keas-danger)" }}
          >
            <div className="text-sm font-medium">Zone A · Security alert</div>
            <div className="text-xs text-[var(--keas-text-secondary)]">
              high · safe {stats.confirmed} · pending {stats.pending} · help {stats.needHelp}
            </div>
          </div>
          <div className="py-1 pl-2" style={{ borderLeft: "3px solid var(--keas-pending)" }}>
            <div className="text-sm font-medium">Camp · Shelter-in-place</div>
            <div className="text-xs text-[var(--keas-text-secondary)]">12 min · 48 personnel</div>
          </div>
        </Card>

        <Card title="Emergency intelligence" icon={<Lightbulb size={16} color="var(--keas-primary)" />}>
          <div className="mb-2 flex gap-2">
            <span
              className="rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ background: "rgba(239,68,68,0.12)", color: "var(--keas-help)" }}
            >
              {stats.needHelp} need help
            </span>
            <span
              className="rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ background: "rgba(217,119,6,0.10)", color: "var(--keas-pending)" }}
            >
              {missing} missing
            </span>
          </div>
          <p className="text-xs leading-relaxed text-[var(--keas-text-secondary)]">
            Critical at OT-2 and Gas train-1. Suggested: dispatch ECO to OT-2, open muster at Camp.
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Zone / location status">
          <div className="grid grid-cols-4 gap-1.5">
            {ZONE_STATUS.map((z) => {
              const bg =
                z.tone === "ok"
                  ? "rgba(22,163,74,0.10)"
                  : z.tone === "warn"
                    ? "rgba(217,119,6,0.10)"
                    : "rgba(239,68,68,0.12)";
              const fg =
                z.tone === "ok"
                  ? "var(--keas-safe)"
                  : z.tone === "warn"
                    ? "var(--keas-pending)"
                    : "var(--keas-help)";
              return (
                <span
                  key={z.name}
                  className="rounded-md px-1 py-1 text-center text-xs font-medium"
                  style={{ background: bg, color: fg }}
                >
                  {z.name}
                </span>
              );
            })}
          </div>
        </Card>

        <Card title="Mini live map" className="bg-[var(--keas-surface-2)]">
          <div className="flex min-h-[96px] flex-col items-center justify-center gap-1.5 text-[var(--keas-text-secondary)]">
            <span className="text-xs">react-leaflet live map arrives in Phase 3.3</span>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: "#34D399" }} /> safe
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: "#FBBF24" }} /> pending
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full" style={{ background: "#EF4444" }} /> help
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
