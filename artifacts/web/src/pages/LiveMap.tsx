import { useMemo, useState } from "react";
import { Wifi, WifiOff, X, Layers, Siren } from "lucide-react";
import {
  scopedAlertStats,
  type AlertStats,
  type UserResponseStatus,
  type Zone,
} from "@workspace/keas-core";
import {
  useZones,
  useLocations,
  usePersonnel,
  useShelters,
  useStreets,
  useRoutes,
  useHazardZones,
  useUsers,
  useAlerts,
} from "@/lib/hooks";
import {
  LiveMapView,
  statusLabel,
  type Selection,
  type LayerVisibility,
  type PersonnelOnMap,
} from "@/components/map/LiveMapView";
import {
  DEMO_ZONES,
  DEMO_PERSONNEL,
  DEMO_SHELTERS,
  DEMO_HAZARDS,
  DEMO_STREETS,
  DEMO_ROUTE_STREET_IDS,
} from "@/lib/demoMap";
import { cn } from "@/lib/cn";

const LAYERS: Array<{ key: keyof LayerVisibility; label: string }> = [
  { key: "zones", label: "Zones" },
  { key: "locations", label: "Locations" },
  { key: "personnel", label: "Personnel" },
  { key: "shelters", label: "Shelters" },
  { key: "streets", label: "Streets" },
  { key: "routes", label: "ECO routes" },
  { key: "hazards", label: "Hazards" },
];

const TONE_COLOR: Record<NonNullable<Selection["tone"]>, string> = {
  safe: "var(--keas-safe)",
  pending: "var(--keas-pending)",
  help: "var(--keas-help)",
  danger: "var(--keas-danger)",
  default: "var(--keas-primary)",
};

export function LiveMapPage() {
  const zonesQ = useZones();
  const locationsQ = useLocations();
  const personnelQ = usePersonnel();
  const sheltersQ = useShelters();
  const streetsQ = useStreets();
  const routesQ = useRoutes();
  const hazardsQ = useHazardZones();
  const usersQ = useUsers();
  const alertsQ = useAlerts();

  const [visible, setVisible] = useState<LayerVisibility>({
    zones: true, locations: true, personnel: true, shelters: true,
    streets: true, routes: true, hazards: true,
  });
  const [selected, setSelected] = useState<Selection | null>(null);

  // Live when the backend returned any operational geometry; else demo fallback.
  const hasBackend =
    (zonesQ.data?.length ?? 0) > 0 ||
    (personnelQ.data?.length ?? 0) > 0 ||
    (sheltersQ.data?.length ?? 0) > 0 ||
    (hazardsQ.data?.length ?? 0) > 0 ||
    (streetsQ.data?.length ?? 0) > 0;
  const live = hasBackend;

  // Join personnel positions with the user roster for status/name (when synced).
  const userById = useMemo(() => {
    const m = new Map<number, { name: string; status: string; userType?: string }>();
    (usersQ.data ?? []).forEach((u) => m.set(u.id, { name: u.name, status: u.status, userType: u.userType }));
    return m;
  }, [usersQ.data]);

  const zones = live ? (zonesQ.data ?? []) : DEMO_ZONES;
  const locations = live ? (locationsQ.data ?? []) : [];
  const shelters = live ? (sheltersQ.data ?? []) : DEMO_SHELTERS;
  const streets = live ? (streetsQ.data ?? []) : DEMO_STREETS;
  const hazards = live ? (hazardsQ.data ?? []) : DEMO_HAZARDS;

  const personnel: PersonnelOnMap[] = useMemo(() => {
    if (!live) return DEMO_PERSONNEL;
    return (personnelQ.data ?? []).map((p) => {
      const u = userById.get(p.userId);
      return { ...p, name: u?.name, status: u?.status ?? "pending", userType: u?.userType };
    });
  }, [live, personnelQ.data, userById]);

  const routeStreetIds = useMemo(() => {
    if (!live) return DEMO_ROUTE_STREET_IDS;
    const ids = new Set<string>();
    (routesQ.data ?? []).filter((r) => r.status === "active").forEach((r) => r.streetIds.forEach((id) => ids.add(id)));
    return ids;
  }, [live, routesQ.data]);

  // Active incident summary — scoped stats over the live roster (mobile logic).
  const activeZones = zones.filter((z) => z.alertActive);
  const incidentStats: AlertStats = useMemo(() => {
    if (live && (usersQ.data?.length ?? 0) > 0) {
      const az = activeZones.map((z) => ({ id: z.id, alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds })) as Array<Pick<Zone, "id" | "alertTargetScope" | "alertTargetLocationIds">>;
      const us = (usersQ.data ?? []).map((u) => ({ zoneId: u.zoneId, locationId: u.locationId, status: u.status as UserResponseStatus, isActive: u.isActive }));
      if (az.length > 0) return scopedAlertStats(az, us);
    }
    // Fallback: aggregate personnel-on-map statuses.
    const c = personnel.reduce(
      (acc, p) => {
        if (p.status === "confirmed") acc.confirmed++;
        else if (p.status === "need_help") acc.needHelp++;
        else acc.pending++;
        return acc;
      },
      { confirmed: 0, pending: 0, needHelp: 0 },
    );
    return { ...c, total: personnel.length };
  }, [live, usersQ.data, activeZones, personnel]);

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
        visible={visible}
        selectedKey={selected?.key ?? null}
        onSelect={setSelected}
      />

      {/* ── Layer toggles (top-left) ── */}
      <FloatingCard className="left-3 top-3 w-44">
        <div className="mb-2 flex items-center gap-1.5 text-[var(--keas-text-sm)] font-medium">
          <Layers size={14} /> Layers
        </div>
        <div className="flex flex-col gap-1.5">
          {LAYERS.map((l) => (
            <label key={l.key} className="flex cursor-pointer items-center gap-2 text-[var(--keas-text-sm)]">
              <input
                type="checkbox"
                checked={visible[l.key]}
                onChange={(e) => setVisible((v) => ({ ...v, [l.key]: e.target.checked }))}
                className="accent-[var(--keas-primary)]"
              />
              {l.label}
            </label>
          ))}
        </div>
      </FloatingCard>

      {/* ── Active incident summary (top-right) ── */}
      <FloatingCard className="right-3 top-3 w-64">
        <div className="mb-2 flex items-center gap-2">
          <Siren size={14} color="var(--keas-danger)" />
          <span className="text-[var(--keas-text-sm)] font-medium">Active incidents</span>
          <span
            className="ml-auto inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[var(--keas-text-xs)] font-medium"
            style={live ? { background: "rgba(22,163,74,0.10)", color: "var(--keas-safe)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}
          >
            {live ? <Wifi size={11} /> : <WifiOff size={11} />}
            {live ? "Live" : "Demo"}
          </span>
        </div>

        <div className="mb-2 grid grid-cols-4 gap-1 text-center">
          <Stat label="Total" value={incidentStats.total} />
          <Stat label="Safe" value={incidentStats.confirmed} color="var(--keas-safe)" />
          <Stat label="Pending" value={incidentStats.pending} color="var(--keas-pending)" />
          <Stat label="Help" value={incidentStats.needHelp} color="var(--keas-help)" />
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
