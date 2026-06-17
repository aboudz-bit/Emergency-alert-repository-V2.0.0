import { useMemo, useState } from "react";
import { Search, X, Lock, Spline, Route as RouteIcon, Clock } from "lucide-react";
import { useRoutes } from "@/lib/hooks";
import { useMapData } from "@/lib/useMapData";
import { LiveMapView } from "@/components/map/LiveMapView";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DEMO_ROUTES } from "@/lib/demoMap";

// Phase 3.7 Streets & Routes Center — READ-ONLY desktop mirror of the mobile
// street-segments screen + ECO route builder. Shows the street/route inventory,
// route steps/metadata/status/length/history, and previews on LiveMapView. ALL
// authoring (draw/edit/rename/delete streets; build/undo/clear/confirm routes) is
// mobile-only and shown as a locked "managed from mobile" affordance. No web write.

// Route length — mirrors the mobile live-map haversine-style sum (111320 m/deg,
// cos(lat) for lng scaling).
function pathMeters(path: Array<{ lat: number; lng: number }>): number {
  let m = 0;
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const dLat = (b.lat - a.lat) * 111320;
    const dLng = (b.lng - a.lng) * 111320 * Math.cos((a.lat * Math.PI) / 180);
    m += Math.hypot(dLat, dLng);
  }
  return m;
}
function fmtLen(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}
function fmtDate(ts?: number): string {
  if (!ts || ts <= 0) return "—";
  return new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function StreetsRoutesPage({ initialTab }: { initialTab: "streets" | "routes" }) {
  const map = useMapData();
  const routesQ = useRoutes();
  const streets = map.streets;
  const routes = map.live ? routesQ.data ?? [] : DEMO_ROUTES;
  const users = map.users;

  const [tab, setTab] = useState<"streets" | "routes">(initialTab);
  const [query, setQuery] = useState("");
  const [selStreetId, setSelStreetId] = useState<string | null>(null);
  const [selRouteId, setSelRouteId] = useState<string | null>(null);

  const streetById = useMemo(() => new Map(streets.map((s) => [s.id, s])), [streets]);
  const authorName = (id: number) => users.find((u) => u.id === id)?.name ?? `User #${id}`;

  const visibleStreets = streets.filter((s) => s.name.toLowerCase().includes(query.trim().toLowerCase()));
  const selStreet = selStreetId ? streetById.get(selStreetId) ?? null : null;
  const selRoute = selRouteId ? routes.find((r) => r.id === selRouteId) ?? null : null;

  // Map highlight: selected route's streets, or the selected street.
  const highlightIds = useMemo(() => {
    if (tab === "routes" && selRoute) return new Set(selRoute.streetIds);
    if (tab === "streets" && selStreetId) return new Set([selStreetId]);
    return map.routeStreetIds;
  }, [tab, selRoute, selStreetId, map.routeStreetIds]);

  // Route history — derived from the routes list (mobile has no history endpoint;
  // each createRoute supersedes the prior active route -> status 'edited').
  const routeHistory = useMemo(
    () => [...routes].sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)),
    [routes],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Streets &amp; Routes</h1>
        {!map.live && <span className="rounded-md px-2 py-0.5 text-xs text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>demo</span>}
        <div className="ml-2 flex gap-1">
          <Tab active={tab === "streets"} onClick={() => setTab("streets")} icon={<Spline size={14} />}>Streets {streets.length}</Tab>
          <Tab active={tab === "routes"} onClick={() => setTab("routes")} icon={<RouteIcon size={14} />}>Routes {routes.length}</Tab>
        </div>
      </div>

      <div className="flex flex-col gap-3 xl:flex-row">
        {/* List */}
        <div className="flex w-full shrink-0 flex-col gap-2 xl:w-80">
          {tab === "streets" ? (
            <>
              <div className="flex items-center gap-2 rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] px-2.5 py-1.5">
                <Search size={14} color="var(--keas-text-tertiary)" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search streets..." className="w-full bg-transparent text-sm outline-none" />
                {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={14} color="var(--keas-text-tertiary)" /></button>}
              </div>
              <div className="flex max-h-[520px] flex-col gap-1 overflow-y-auto">
                {visibleStreets.length === 0 ? (
                  <Empty>No streets.</Empty>
                ) : (
                  visibleStreets.map((s) => (
                    <ListRow key={s.id} active={selStreetId === s.id} onClick={() => setSelStreetId(s.id)}>
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-[11px] text-[var(--keas-text-tertiary)]">{s.path.length} points</div>
                    </ListRow>
                  ))
                )}
              </div>
            </>
          ) : (
            <div className="flex max-h-[560px] flex-col gap-1 overflow-y-auto">
              {routes.length === 0 ? (
                <Empty>No routes.</Empty>
              ) : (
                routes.map((r, i) => (
                  <ListRow key={r.id} active={selRouteId === r.id} onClick={() => setSelRouteId(r.id)}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Route {i + 1}</span>
                      <span className="ml-auto"><StatusBadge status={r.status === "active" ? "ok" : "warn"} label={r.status === "active" ? "Active" : "Edited"} /></span>
                    </div>
                    <div className="text-[11px] text-[var(--keas-text-tertiary)]">{r.streetIds.length} streets · {fmtDate(r.createdAt)}</div>
                  </ListRow>
                ))
              )}
            </div>
          )}
        </div>

        {/* Map preview */}
        <div className="relative min-h-[420px] flex-1 overflow-hidden rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)]">
          <LiveMapView
            zones={map.zones}
            locations={map.locations}
            personnel={map.personnel}
            shelters={map.shelters}
            streets={map.streets}
            routeStreetIds={highlightIds}
            hazards={map.hazards}
            selectedKey={null}
            onSelect={() => {}}
          />
        </div>

        {/* Details */}
        <div className="flex w-full shrink-0 flex-col gap-3 xl:w-80">
          {tab === "streets" ? (
            selStreet ? (
              <Panel title="Street details">
                <div className="text-base font-semibold">{selStreet.name}</div>
                <DetailRow label="Points" value={String(selStreet.path.length)} />
                <DetailRow label="Length" value={fmtLen(pathMeters(selStreet.path))} />
                <DetailRow label="Created" value={fmtDate(selStreet.createdAt)} />
                <DetailRow label="In active route" value={map.routeStreetIds.has(selStreet.id) ? "Yes" : "No"} />
                <LockNote>Rename / Edit path / Duplicate / Delete — managed from mobile</LockNote>
              </Panel>
            ) : (
              <Empty>Select a street to view details</Empty>
            )
          ) : selRoute ? (
            <>
              <Panel title="Route details">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-base font-semibold">Route</span>
                  <StatusBadge status={selRoute.status === "active" ? "ok" : "warn"} label={selRoute.status === "active" ? "Active" : "Edited"} />
                </div>
                <DetailRow label="Streets" value={String(selRoute.streetIds.length)} />
                <DetailRow label="Length" value={fmtLen(selRoute.streetIds.reduce((m, id) => m + pathMeters(streetById.get(id)?.path ?? []), 0))} />
                <DetailRow label="Author" value={authorName(selRoute.createdBy)} />
                <DetailRow label="Created" value={fmtDate(selRoute.createdAt)} />
                <DetailRow label="Updated" value={fmtDate(selRoute.updatedAt)} />
                <LockNote>Route mode / Undo / Clear / Confirm — managed from mobile</LockNote>
              </Panel>
              <Panel title="Assigned streets">
                <ol className="flex flex-col gap-1">
                  {selRoute.streetIds.map((id, i) => (
                    <li key={id} className="flex items-center gap-2 text-sm">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold" style={{ background: "var(--keas-primary-dim)", color: "var(--keas-primary)" }}>{i + 1}</span>
                      {streetById.get(id)?.name ?? `Street ${id}`}
                    </li>
                  ))}
                </ol>
              </Panel>
            </>
          ) : (
            <Empty>Select a route to view details</Empty>
          )}

          {tab === "routes" && (
            <Panel title="Route history" icon={<Clock size={14} color="var(--keas-text-secondary)" />}>
              {routeHistory.length === 0 ? (
                <div className="text-xs text-[var(--keas-text-secondary)]">No route history.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {routeHistory.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-2 text-xs">
                      <StatusBadge status={r.status === "active" ? "ok" : "warn"} label={r.status === "active" ? "Active" : "Edited"} />
                      <span className="text-[var(--keas-text-secondary)]">Route {routes.length - i} · {r.streetIds.length} streets · {fmtDate(r.updatedAt ?? r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Tab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium" style={active ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}>
      {icon}{children}
    </button>
  );
}
function ListRow({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-[var(--keas-radius-md)] border px-2.5 py-2 text-left" style={{ background: "var(--keas-surface)", borderColor: active ? "var(--keas-primary)" : "var(--keas-border)" }}>
      {children}
    </button>
  );
}
function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-md)]">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium">{icon}<span>{title}</span></div>
      {children}
    </div>
  );
}
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--keas-border)] py-1.5 text-sm last:border-0">
      <span className="text-[var(--keas-text-secondary)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
function LockNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-1.5 border-t border-[var(--keas-border)] pt-2 text-[11px] text-[var(--keas-text-tertiary)]">
      <Lock size={12} /> {children}
    </div>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[var(--keas-radius-lg)] border border-dashed border-[var(--keas-border)] px-4 py-8 text-center text-sm text-[var(--keas-text-tertiary)]">{children}</div>;
}
