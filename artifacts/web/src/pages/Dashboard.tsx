import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { Bell, Users, CheckCircle2, LifeBuoy, HelpCircle, Lightbulb, Siren, Wifi, WifiOff } from "lucide-react";
import { scopedAlertStats, type AlertStats, type UserResponseStatus, type Zone } from "@workspace/keas-core";
import { useUsers, useZones } from "@/lib/hooks";

// Demo fallback so the dashboard renders without a backend (Phase 3.1 parity).
const DEMO_STATS: AlertStats = { confirmed: 240, pending: 66, needHelp: 6, total: 312 };

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
  const usersQ = useUsers();
  const zonesQ = useZones();

  // Live when the backend returned data; otherwise fall back to demo numbers.
  const live = (usersQ.data?.length ?? 0) > 0 && zonesQ.data !== undefined;
  let stats = DEMO_STATS;
  if (live && usersQ.data && zonesQ.data) {
    const activeZones = zonesQ.data
      .filter((z) => z.alertActive)
      .map((z) => ({
        id: z.id,
        alertTargetScope: z.alertTargetScope,
        alertTargetLocationIds: z.alertTargetLocationIds,
      })) as Array<Pick<Zone, "id" | "alertTargetScope" | "alertTargetLocationIds">>;
    const users = usersQ.data.map((u) => ({
      zoneId: u.zoneId,
      locationId: u.locationId,
      status: u.status as UserResponseStatus,
      isActive: u.isActive,
    }));
    stats = activeZones.length > 0
      ? scopedAlertStats(activeZones, users)
      : { confirmed: users.filter((u) => u.status === "confirmed").length, pending: users.filter((u) => u.status === "pending").length, needHelp: users.filter((u) => u.status === "need_help").length, total: users.length };
  }
  const missing = 11;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-medium">Operational overview</h1>
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
          style={
            live
              ? { background: "rgba(22,163,74,0.10)", color: "var(--keas-safe)" }
              : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }
          }
        >
          {live ? <Wifi size={12} /> : <WifiOff size={12} />}
          {live ? "Live" : usersQ.isLoading ? "Connecting…" : "Demo data"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Active alerts" value={live && zonesQ.data ? zonesQ.data.filter((z) => z.alertActive).length : 2} icon={Bell} />
        <KPICard label="Personnel" value={stats.total} icon={Users} />
        <KPICard label="Safe" value={stats.confirmed} tone="safe" icon={CheckCircle2} />
        <KPICard label="Need help" value={stats.needHelp} tone="help" icon={LifeBuoy} />
        <KPICard label="Missing" value={missing} tone="pending" icon={HelpCircle} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Active incidents" icon={<Siren size={16} color="var(--keas-danger)" />}>
          <div className="mb-2 py-1 pl-2" style={{ borderLeft: "3px solid var(--keas-danger)" }}>
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
            <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(239,68,68,0.12)", color: "var(--keas-help)" }}>
              {stats.needHelp} need help
            </span>
            <span className="rounded-md px-2 py-0.5 text-xs font-medium" style={{ background: "rgba(217,119,6,0.10)", color: "var(--keas-pending)" }}>
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
              const bg = z.tone === "ok" ? "rgba(22,163,74,0.10)" : z.tone === "warn" ? "rgba(217,119,6,0.10)" : "rgba(239,68,68,0.12)";
              const fg = z.tone === "ok" ? "var(--keas-safe)" : z.tone === "warn" ? "var(--keas-pending)" : "var(--keas-help)";
              return (
                <span key={z.name} className="rounded-md px-1 py-1 text-center text-xs font-medium" style={{ background: bg, color: fg }}>
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
              <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: "#34D399" }} /> safe</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: "#FBBF24" }} /> pending</span>
              <span className="flex items-center gap-1"><i className="inline-block h-2 w-2 rounded-full" style={{ background: "#EF4444" }} /> help</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
