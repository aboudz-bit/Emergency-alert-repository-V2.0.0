import { useMemo, useState } from "react";
import {
  Siren, Search, MapPin, Users as UsersIcon, AlertOctagon, AlertTriangle,
  Clock, X, Lock, Layers as LayersIcon, ShieldAlert,
} from "lucide-react";
import { computeEmergencyIntelligence, type UserResponseStatus } from "@workspace/keas-core";
import { useMapData } from "@/lib/useMapData";
import { LiveMapView, type Selection } from "@/components/map/LiveMapView";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ALERT_TYPE_OPTIONS, PRIORITY_OPTIONS, PRIORITY_COLORS, DEFAULT_MESSAGES, timeAgo,
} from "@/lib/alertConstants";
import { cn } from "@/lib/cn";

// Phase 3.4 Alert Center — desktop read/monitor mirror of the mobile alert
// surfaces (send-alert + alert-monitor). Mobile is the alert AUTHOR; the web
// mirrors all read/display content from synced data (demo fallback when empty)
// and renders the compose forms as DISABLED review surfaces — no web write path.
type Filter = "all" | "active" | "inactive";

export function AlertCenterPage() {
  const map = useMapData();
  const { users, zones, locations } = map;

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selZoneId, setSelZoneId] = useState<number | null>(null);
  const [mapSel, setMapSel] = useState<Selection | null>(null);

  const liveZones = useMemo(() => zones.filter((z) => !z.isArchived), [zones]);
  const activeZones = useMemo(() => liveZones.filter((z) => z.alertActive), [liveZones]);

  const intel = useMemo(
    () =>
      computeEmergencyIntelligence(
        users.map((u) => ({ id: u.id, status: u.status as UserResponseStatus, zoneId: u.zoneId, locationId: u.locationId, location: u.location, isActive: u.isActive, escalationLevel: u.escalationLevel })),
        zones.map((z) => ({ id: z.id, name: z.name, color: z.color, alertActive: z.alertActive, alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds })),
        locations.map((l) => ({ id: l.id, name: l.name })),
      ),
    [users, zones, locations],
  );

  // Summary strip — mirrors mobile send-alert useMemo (Zones/Active/Locations/Users).
  const summary = {
    zones: liveZones.filter((z) => z.isActive).length,
    active: activeZones.length,
    locations: locations.filter((l) => l.isActive).length,
    users: users.filter((u) => u.isActive).length,
  };

  const locCount = (zoneId: number) => locations.filter((l) => l.zoneId === zoneId && l.isActive).length;
  const userCount = (zoneId: number) => users.filter((u) => u.zoneId === zoneId && u.isActive).length;

  const visibleZones = liveZones
    .filter((z) => (filter === "active" ? z.alertActive : filter === "inactive" ? !z.alertActive : true))
    .filter((z) => z.name.toLowerCase().includes(query.trim().toLowerCase()));

  const selZone = selZoneId == null ? null : zones.find((z) => z.id === selZoneId) ?? null;

  return (
    <div className="space-y-3">
      {/* ── Top status: emergency banner + summary strip ── */}
      {activeZones.length > 0 && (
        <div className="flex items-center gap-2 rounded-[var(--keas-radius-md)] px-3 py-2" style={{ background: "rgba(220,38,38,0.08)" }}>
          <ShieldAlert size={16} color="var(--keas-danger)" />
          <span className="text-sm font-medium" style={{ color: "var(--keas-danger)" }}>
            {activeZones.length} zone alert{activeZones.length > 1 ? "s" : ""} active
          </span>
        </div>
      )}

      <div className="grid grid-cols-4 gap-3">
        <SummaryTile label="Zones" value={summary.zones} icon={LayersIcon} />
        <SummaryTile label="Active" value={summary.active} icon={Siren} tone={summary.active > 0 ? "alert" : "default"} />
        <SummaryTile label="Locations" value={summary.locations} icon={MapPin} />
        <SummaryTile label="Users" value={summary.users} icon={UsersIcon} />
      </div>

      {/* ── Main: monitor rail | map | zone rail ── */}
      <div className="flex flex-col gap-3 xl:flex-row">
        {/* Monitor rail */}
        <div className="flex w-full shrink-0 flex-col gap-3 xl:w-72">
          <Panel title="Active incident" icon={<Siren size={14} color="var(--keas-danger)" />} live={activeZones.length > 0}>
            {activeZones.length === 0 ? (
              <div className="text-xs text-[var(--keas-text-secondary)]">No active incident.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {activeZones.map((z) => {
                  const zi = intel.zones.find((i) => i.zoneId === z.id);
                  return (
                    <button key={z.id} onClick={() => setSelZoneId(z.id)} className="py-0.5 pl-2 text-left" style={{ borderLeft: "3px solid var(--keas-danger)" }}>
                      <div className="text-sm font-medium">{z.name} · {z.alertType ?? "Alert"}</div>
                      <div className="text-xs text-[var(--keas-text-secondary)]">
                        {z.alertPriority ? `${z.alertPriority} · ` : ""}safe {zi?.safeCount ?? 0} · pending {zi?.pendingCount ?? 0} · help {zi?.needHelpCount ?? 0}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Accountability">
            <div className="grid grid-cols-5 gap-1 text-center">
              <Stat label="Total" value={intel.isActive ? intel.totalPersonnel : summary.users} />
              <Stat label="Safe" value={intel.totalSafe} color="var(--keas-safe)" />
              <Stat label="Pending" value={intel.totalPending} color="var(--keas-pending)" />
              <Stat label="Help" value={intel.totalNeedHelp} color="var(--keas-help)" />
              <Stat label="Missing" value={intel.totalMissing} color="var(--keas-pending)" />
            </div>
          </Panel>

          <Panel title="Intelligence" icon={<AlertOctagon size={14} color="var(--keas-help)" />}>
            {intel.suggestedActions.length === 0 ? (
              <div className="text-xs text-[var(--keas-text-secondary)]">
                {intel.isActive ? "No critical actions — all personnel accounted for." : "No active incident."}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {intel.suggestedActions.slice(0, 5).map((a) => {
                  const crit = a.priority === "critical";
                  const Icon = crit ? AlertOctagon : AlertTriangle;
                  return (
                    <div key={a.id} className="flex items-start gap-2">
                      <Icon size={14} color={crit ? "var(--keas-help)" : "var(--keas-pending)"} className="mt-0.5 shrink-0" />
                      <span className="text-xs leading-snug text-[var(--keas-text-secondary)]">{a.description}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        {/* Center map */}
        <div className="relative min-h-[480px] flex-1 overflow-hidden rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)]">
          <LiveMapView
            zones={map.zones}
            locations={map.locations}
            personnel={map.personnel}
            shelters={map.shelters}
            streets={map.streets}
            routeStreetIds={map.routeStreetIds}
            hazards={map.hazards}
            selectedKey={mapSel?.key ?? null}
            onSelect={setMapSel}
          />
          {mapSel && (
            <div className="absolute right-3 top-3 z-[1000] w-60 rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] p-3 shadow-sm" style={{ background: "rgba(255,255,255,0.96)" }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--keas-text-secondary)]">{mapSel.kind}</span>
                {mapSel.kind === "Personnel" && (
                  <StatusBadge status={mapSel.tone === "safe" ? "confirmed" : mapSel.tone === "help" ? "need_help" : "pending"} />
                )}
                <button onClick={() => setMapSel(null)} className="ml-auto text-[var(--keas-text-tertiary)]" aria-label="Close"><X size={14} /></button>
              </div>
              <div className="mb-2 text-sm font-semibold">{mapSel.title}</div>
              <div className="flex flex-col gap-1">
                {mapSel.rows.map((r, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[var(--keas-text-secondary)]">{r.label}</span>
                    <span className="font-medium">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Zone rail */}
        <div className="flex w-full shrink-0 flex-col gap-2 xl:w-96">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] px-2.5 py-1.5">
            <Search size={14} color="var(--keas-text-tertiary)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search zones..."
              className="w-full bg-transparent text-sm outline-none"
            />
            {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={14} color="var(--keas-text-tertiary)" /></button>}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {(["all", "active", "inactive"] as const).map((f) => {
              const count = f === "active" ? activeZones.length : f === "inactive" ? liveZones.length - activeZones.length : liveZones.length;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize"
                  style={filter === f ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}
                >
                  {f} {count}
                </button>
              );
            })}
          </div>

          {/* Zone list */}
          <div className="flex max-h-[240px] flex-col gap-1 overflow-y-auto xl:max-h-[200px]">
            {visibleZones.length === 0 ? (
              <div className="px-2 py-3 text-xs text-[var(--keas-text-secondary)]">No zones.</div>
            ) : (
              visibleZones.map((z) => (
                <button
                  key={z.id}
                  onClick={() => setSelZoneId(z.id)}
                  className={cn(
                    "rounded-[var(--keas-radius-md)] border px-2.5 py-2 text-left",
                    selZoneId === z.id ? "border-[var(--keas-primary)]" : "border-[var(--keas-border)]",
                  )}
                  style={{ background: "var(--keas-surface)" }}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: z.color }} />
                    <span className="text-sm font-medium">{z.name}</span>
                    {z.alertActive && (
                      <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(220,38,38,0.12)", color: "var(--keas-danger)" }}>
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-[var(--keas-text-secondary)]">
                    {z.alertActive ? (
                      <>
                        {z.alertPriority ?? ""} · {z.alertType ?? "Alert"}
                        {z.alertTargetScope === "locations" ? ` · ${z.alertTargetLocationIds.length} locs` : ""}
                        {timeAgo(z.alertUpdatedAt) ? ` · ${timeAgo(z.alertUpdatedAt)}` : ""}
                      </>
                    ) : (
                      "Inactive"
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--keas-text-tertiary)]">
                    {locCount(z.id)} location{locCount(z.id) === 1 ? "" : "s"} · {userCount(z.id)} user{userCount(z.id) === 1 ? "" : "s"}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Selected zone: details + history + read-only compose review */}
          {selZone && <ZoneDetail zone={selZone} locations={locations} users={users} />}
        </div>
      </div>
    </div>
  );
}

function ZoneDetail({
  zone,
  locations,
  users,
}: {
  zone: ReturnType<typeof useMapData>["zones"][number];
  locations: ReturnType<typeof useMapData>["locations"];
  users: ReturnType<typeof useMapData>["users"];
}) {
  const zoneLocs = locations.filter((l) => l.zoneId === zone.id && l.isActive);
  const history = (zone.alertHistory ?? []) as Array<Record<string, unknown>>;
  const composeType = (zone.alertType as string) ?? "Security Alert";
  const composePriority = (zone.alertPriority as string) ?? "High";
  const composeMessage = zone.alertMessage || DEFAULT_MESSAGES[composeType] || "";

  return (
    <div className="flex flex-col gap-2 rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-3">
      <div className="text-sm font-medium">{zone.name} — details</div>

      {/* Details: locations + per-location user counts */}
      <div className="flex flex-col gap-1">
        {zoneLocs.length === 0 ? (
          <div className="text-xs text-[var(--keas-text-secondary)]">No active locations.</div>
        ) : (
          zoneLocs.map((l) => (
            <div key={l.id} className="flex items-center justify-between text-xs">
              <span>{l.name}</span>
              <span className="flex items-center gap-2">
                <span className="text-[var(--keas-text-tertiary)]">{users.filter((u) => u.locationId === l.id && u.isActive).length} users</span>
                {l.alertActive ? (
                  <span className="rounded px-1 py-0.5 text-[10px] font-medium" style={{ background: "rgba(220,38,38,0.12)", color: "var(--keas-danger)" }}>{l.alertType ?? "alert"}</span>
                ) : (
                  <span className="text-[10px] text-[var(--keas-text-tertiary)]">Inactive</span>
                )}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Read-only compose review — mirrors the mobile Activate/Edit form, disabled */}
      <div className="mt-1 border-t border-[var(--keas-border)] pt-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--keas-text-secondary)]">
          <Lock size={12} /> Alert (managed from mobile)
        </div>
        <div className="mb-1.5 flex flex-wrap gap-1">
          {ALERT_TYPE_OPTIONS.map((t) => (
            <span key={t} className="rounded-full px-2 py-0.5 text-[11px]" style={t === composeType ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)", fontWeight: 600 } : { background: "var(--keas-surface-2)", color: "var(--keas-text-tertiary)" }}>
              {t}
            </span>
          ))}
        </div>
        <div className="mb-1.5 flex gap-1">
          {PRIORITY_OPTIONS.map((p) => (
            <span key={p} className="flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]" style={p === composePriority ? { background: "var(--keas-surface-2)", color: PRIORITY_COLORS[p], fontWeight: 600 } : { color: "var(--keas-text-tertiary)" }}>
              <i className="inline-block h-2 w-2 rounded-full" style={{ background: PRIORITY_COLORS[p] }} /> {p}
            </span>
          ))}
        </div>
        <textarea
          readOnly
          value={composeMessage}
          rows={2}
          className="w-full resize-none rounded-md border border-[var(--keas-border)] bg-[var(--keas-surface-2)] px-2 py-1 text-xs text-[var(--keas-text-secondary)]"
        />
        <div className="mt-1 text-[10px] text-[var(--keas-text-tertiary)]">
          Scope: {zone.alertTargetScope === "locations" ? `${zone.alertTargetLocationIds.length} selected location(s)` : "Entire zone"}
        </div>
      </div>

      {/* History */}
      <div className="mt-1 border-t border-[var(--keas-border)] pt-2">
        <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--keas-text-secondary)]">
          <Clock size={12} /> History
        </div>
        {history.length === 0 ? (
          <div className="text-[11px] text-[var(--keas-text-tertiary)]">No history yet.</div>
        ) : (
          <div className="flex flex-col gap-1">
            {[...history].reverse().slice(0, 8).map((h, i) => (
              <div key={i} className="text-[11px] text-[var(--keas-text-secondary)]">
                <span className="font-medium">{String(h.action ?? "updated")}</span>
                {h.priority ? ` · ${String(h.priority)}` : ""}
                {h.alertType ? ` · ${String(h.alertType)}` : ""}
                {h.by ? ` · by ${String(h.by)}` : ""}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value, icon: Icon, tone = "default" }: { label: string; value: number; icon: typeof Siren; tone?: "default" | "alert" }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-md)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--keas-radius-md)]" style={{ background: tone === "alert" ? "rgba(220,38,38,0.10)" : "var(--keas-primary-dim)" }}>
        <Icon size={16} color={tone === "alert" ? "var(--keas-danger)" : "var(--keas-primary)"} />
      </span>
      <div>
        <div className="text-[var(--keas-text-xxl)] font-semibold leading-none" style={{ color: tone === "alert" ? "var(--keas-danger)" : "var(--keas-text-title)" }}>{value}</div>
        <div className="text-[var(--keas-text-sm)] text-[var(--keas-text-secondary)]">{label}</div>
      </div>
    </div>
  );
}

function Panel({ title, icon, live, children }: { title: string; icon?: React.ReactNode; live?: boolean; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-md)]">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">
        {icon}
        <span>{title}</span>
        {live && (
          <span className="ml-auto flex items-center gap-1 text-[10px] font-semibold" style={{ color: "var(--keas-danger)" }}>
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--keas-danger)" }} /> LIVE
          </span>
        )}
      </div>
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
