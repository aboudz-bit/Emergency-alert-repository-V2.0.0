import { useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { KPICard } from "@/components/ui/KPICard";
import { LiveMapView } from "@/components/map/LiveMapView";
import { Bell, Users, CheckCircle2, LifeBuoy, HelpCircle, Lightbulb, Siren, AlertOctagon, AlertTriangle } from "lucide-react";
import {
  computeEmergencyIntelligence,
  type AlertStats,
  type UserResponseStatus,
} from "@workspace/keas-core";
import { useMapData } from "@/lib/useMapData";

// Desktop overview mirroring the mobile role dashboards (KPIs + zone status +
// emergency intelligence + embedded ZoneMap). All values are data-driven from the
// shared hooks/engine — no hardcoded content. Demo data fills in when the backend
// is empty (silent fallback, like the Live Map).
export function DashboardPage() {
  const map = useMapData();
  const { users, zones, locations } = map;

  const activeZones = useMemo(() => zones.filter((z) => z.alertActive), [zones]);

  const intel = useMemo(
    () =>
      computeEmergencyIntelligence(
        users.map((u) => ({
          id: u.id, status: u.status as UserResponseStatus, zoneId: u.zoneId,
          locationId: u.locationId, location: u.location, isActive: u.isActive,
          escalationLevel: u.escalationLevel,
        })),
        zones.map((z) => ({
          id: z.id, name: z.name, color: z.color, alertActive: z.alertActive,
          alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds,
        })),
        locations.map((l) => ({ id: l.id, name: l.name })),
      ),
    [users, zones, locations],
  );

  // Incident-scoped breakdown when an incident is active (mirrors alert-monitor),
  // else roster aggregate. safe+pending+help(+missing) always sum to the total.
  const stats: AlertStats = intel.isActive
    ? { confirmed: intel.totalSafe, pending: intel.totalPending, needHelp: intel.totalNeedHelp, total: intel.totalPersonnel }
    : {
        confirmed: users.filter((u) => u.status === "confirmed").length,
        pending: users.filter((u) => u.status === "pending").length,
        needHelp: users.filter((u) => u.status === "need_help").length,
        total: users.length,
      };
  const missing = intel.totalMissing;

  const incidents = activeZones.map((z) => {
    const zi = intel.zones.find((i) => i.zoneId === z.id);
    return {
      id: z.id, name: z.name,
      type: z.alertType ?? "Alert", priority: z.alertPriority ?? "",
      safe: zi?.safeCount ?? 0, pending: zi?.pendingCount ?? 0, help: zi?.needHelpCount ?? 0,
    };
  });

  const zoneTiles = zones
    .filter((z) => !z.isArchived)
    .map((z) => {
      const zi = intel.zones.find((i) => i.zoneId === z.id);
      const tone: "ok" | "warn" | "alert" =
        zi && (zi.needHelpCount > 0 || zi.missingCount > 0) ? "alert" : zi && zi.pendingCount > 0 ? "warn" : "ok";
      return { name: z.name, tone };
    });
  const shownTiles = zoneTiles.slice(0, 11);
  const extraTiles = zoneTiles.length - shownTiles.length;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-medium">Operational overview</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard label="Active alerts" value={activeZones.length} icon={Bell} />
        <KPICard label="Personnel" value={stats.total} icon={Users} />
        <KPICard label="Safe" value={stats.confirmed} tone="safe" icon={CheckCircle2} />
        <KPICard label="Need help" value={stats.needHelp} tone="help" icon={LifeBuoy} />
        <KPICard label="Missing" value={missing} tone="pending" icon={HelpCircle} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Active incidents" icon={<Siren size={16} color="var(--keas-danger)" />}>
          {incidents.length === 0 ? (
            <div className="text-sm text-[var(--keas-text-secondary)]">No active incidents.</div>
          ) : (
            incidents.map((inc) => (
              <div key={inc.id} className="mb-2 py-1 pl-2 last:mb-0" style={{ borderLeft: "3px solid var(--keas-danger)" }}>
                <div className="text-sm font-medium">{inc.name} · {inc.type}</div>
                <div className="text-xs text-[var(--keas-text-secondary)]">
                  {inc.priority ? `${inc.priority} · ` : ""}safe {inc.safe} · pending {inc.pending} · help {inc.help}
                </div>
              </div>
            ))
          )}
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
          {intel.suggestedActions.length === 0 ? (
            <p className="text-xs text-[var(--keas-text-secondary)]">
              {intel.isActive ? "No critical actions — all personnel accounted for." : "No active incidents."}
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {intel.suggestedActions.slice(0, 4).map((a) => {
                const crit = a.priority === "critical";
                const Icon = crit ? AlertOctagon : AlertTriangle;
                const color = crit ? "var(--keas-help)" : "var(--keas-pending)";
                return (
                  <div key={a.id} className="flex items-start gap-2">
                    <Icon size={14} color={color} className="mt-0.5 shrink-0" />
                    <span className="text-xs leading-snug text-[var(--keas-text-secondary)]">{a.description}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Zone / location status">
          {shownTiles.length === 0 ? (
            <div className="text-sm text-[var(--keas-text-secondary)]">No zones.</div>
          ) : (
            <div className="grid grid-cols-4 gap-1.5">
              {shownTiles.map((z, i) => {
                const bg = z.tone === "ok" ? "rgba(22,163,74,0.10)" : z.tone === "warn" ? "rgba(217,119,6,0.10)" : "rgba(239,68,68,0.12)";
                const fg = z.tone === "ok" ? "var(--keas-safe)" : z.tone === "warn" ? "var(--keas-pending)" : "var(--keas-help)";
                return (
                  <span key={`${z.name}-${i}`} className="truncate rounded-md px-1 py-1 text-center text-xs font-medium" style={{ background: bg, color: fg }} title={z.name}>
                    {z.name}
                  </span>
                );
              })}
              {extraTiles > 0 && (
                <span className="rounded-md px-1 py-1 text-center text-xs font-medium text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>
                  +{extraTiles}
                </span>
              )}
            </div>
          )}
        </Card>

        {/* Embedded operational map — mirrors the mobile dashboard ZoneMap preview */}
        <div className="overflow-hidden rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)]">
          <div className="px-[var(--keas-space-lg)] pb-2 pt-[14px] text-sm font-medium">Live map</div>
          <div className="h-[240px] w-full">
            <LiveMapView
              zones={map.zones}
              locations={map.locations}
              personnel={map.personnel}
              shelters={map.shelters}
              streets={map.streets}
              routeStreetIds={map.routeStreetIds}
              hazards={map.hazards}
              selectedKey={null}
              onSelect={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
