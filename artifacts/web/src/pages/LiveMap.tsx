import { useMemo, useState } from "react";
import { X, Siren } from "lucide-react";
import { computeEmergencyIntelligence, type UserResponseStatus } from "@workspace/keas-core";
import { useAlerts } from "@/lib/hooks";
import { useMapData } from "@/lib/useMapData";
import { LiveMapView, statusLabel, type Selection } from "@/components/map/LiveMapView";
import { cn } from "@/lib/cn";

const TONE_COLOR: Record<NonNullable<Selection["tone"]>, string> = {
  safe: "var(--keas-safe)",
  pending: "var(--keas-pending)",
  help: "var(--keas-help)",
  danger: "var(--keas-danger)",
  default: "var(--keas-primary)",
};

export function LiveMapPage() {
  const { live, users, zones, locations, personnel, shelters, streets, hazards, routeStreetIds } = useMapData();
  const alertsQ = useAlerts();
  const [selected, setSelected] = useState<Selection | null>(null);

  // Active incident summary via the shared emergency-intelligence engine — the
  // SAME computation the Dashboard uses (mobile useEmergencyIntelligence), so
  // safe/pending/help/missing agree across pages. Escalated personnel count as
  // missing (not pending), exactly like mobile.
  const activeZones = zones.filter((z) => z.alertActive);
  const intel = useMemo(
    () =>
      computeEmergencyIntelligence(
        users.map((u) => ({ id: u.id, status: u.status as UserResponseStatus, zoneId: u.zoneId, locationId: u.locationId, location: u.location, isActive: u.isActive, escalationLevel: u.escalationLevel })),
        zones.map((z) => ({ id: z.id, name: z.name, color: z.color, alertActive: z.alertActive, alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds })),
        locations.map((l) => ({ id: l.id, name: l.name })),
      ),
    [users, zones, locations],
  );
  const incidentStats = useMemo(() => {
    if (intel.isActive) {
      return { total: intel.totalPersonnel, confirmed: intel.totalSafe, pending: intel.totalPending, needHelp: intel.totalNeedHelp, missing: intel.totalMissing };
    }
    const c = personnel.reduce(
      (acc, p) => {
        if (p.status === "confirmed") acc.confirmed++;
        else if (p.status === "need_help") acc.needHelp++;
        else acc.pending++;
        return acc;
      },
      { confirmed: 0, pending: 0, needHelp: 0 },
    );
    return { ...c, total: personnel.length, missing: 0 };
  }, [intel, personnel]);

  const activeAlerts = (live ? (alertsQ.data ?? []) : []).filter((a) => a.isActive);
  const activeIncidentCount = Math.max(activeAlerts.length, activeZones.length);

  return (
    <div className="relative h-full min-h-[600px] overflow-hidden rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)]">
      <LiveMapView
        zones={zones}
        locations={locations}
        personnel={personnel}
        shelters={shelters}
        streets={streets}
        routeStreetIds={routeStreetIds}
        hazards={hazards}
        selectedKey={selected?.key ?? null}
        onSelect={setSelected}
      />

      {/* ── Active incident summary (top-right) — mirrors mobile alert-monitor stats strip ── */}
      <FloatingCard className="right-3 top-3 w-64">
        <div className="mb-2 flex items-center gap-2">
          <Siren size={14} color="var(--keas-danger)" />
          <span className="text-[var(--keas-text-sm)] font-medium">Active incidents</span>
        </div>

        <div className="mb-2 grid grid-cols-5 gap-1 text-center">
          <Stat label="Total" value={incidentStats.total} />
          <Stat label="Safe" value={incidentStats.confirmed} color="var(--keas-safe)" />
          <Stat label="Pending" value={incidentStats.pending} color="var(--keas-pending)" />
          <Stat label="Help" value={incidentStats.needHelp} color="var(--keas-help)" />
          <Stat label="Missing" value={incidentStats.missing} color="var(--keas-pending)" />
        </div>

        {activeIncidentCount === 0 ? (
          <div className="text-[var(--keas-text-xs)] text-[var(--keas-text-secondary)]">No active incidents.</div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {(activeAlerts.length > 0
              ? activeAlerts.map((a) => ({ key: `a${a.id}`, title: a.zone || a.title, sub: `${a.type} · ${a.priority}` }))
              : activeZones.map((z) => ({ key: `z${z.id}`, title: z.name, sub: `${z.alertType ?? "alert"} · ${z.alertPriority ?? ""}` }))
            ).map((it) => (
              <div key={it.key} className="py-0.5 pl-2" style={{ borderLeft: "3px solid var(--keas-danger)" }}>
                <div className="text-[var(--keas-text-sm)] font-medium">{it.title}</div>
                <div className="text-[var(--keas-text-xs)] text-[var(--keas-text-secondary)]">{it.sub}</div>
              </div>
            ))}
          </div>
        )}
      </FloatingCard>

      {/* ── Selected item details (right, below summary) ── */}
      {selected && (
        <FloatingCard className="right-3 top-[232px] w-64">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[var(--keas-text-xs)] font-medium uppercase tracking-wide" style={{ color: TONE_COLOR[selected.tone ?? "default"] }}>
              {selected.kind}
            </span>
            <button onClick={() => setSelected(null)} className="ml-auto text-[var(--keas-text-tertiary)] hover:text-[var(--keas-text)]" aria-label="Close details">
              <X size={14} />
            </button>
          </div>
          <div className="mb-2 text-[var(--keas-text-md)] font-semibold">{selected.title}</div>
          <div className="flex flex-col gap-1">
            {selected.rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[var(--keas-text-sm)]">
                <span className="text-[var(--keas-text-secondary)]">{r.label}</span>
                <span className="font-medium">{r.value}</span>
              </div>
            ))}
          </div>
        </FloatingCard>
      )}

      {/* ── Legend (bottom-left) ── */}
      <FloatingCard className="bottom-3 left-3">
        <div className="flex flex-col gap-1.5 text-[var(--keas-text-xs)]">
          <div className="font-medium text-[var(--keas-text-secondary)]">Personnel</div>
          <div className="flex gap-3">
            <LegendDot color="#34D399" label={statusLabel("confirmed")} />
            <LegendDot color="#FBBF24" label={statusLabel("pending")} />
            <LegendDot color="#EF4444" label={statusLabel("need_help")} />
          </div>
          <div className="mt-1 font-medium text-[var(--keas-text-secondary)]">Hazard rings</div>
          <div className="flex gap-3">
            <LegendDot color="#F87171" label="Hot" />
            <LegendDot color="#FBBF24" label="Warm" />
            <LegendDot color="#34D399" label="Cold" />
          </div>
        </div>
      </FloatingCard>
    </div>
  );
}

function FloatingCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute z-[1000] rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] p-3 shadow-sm",
        className,
      )}
      style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(2px)" }}
    >
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="text-[var(--keas-text-lg)] font-semibold leading-none" style={{ color: color ?? "var(--keas-text-title)" }}>{value}</div>
      <div className="text-[10px] text-[var(--keas-text-secondary)]">{label}</div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
