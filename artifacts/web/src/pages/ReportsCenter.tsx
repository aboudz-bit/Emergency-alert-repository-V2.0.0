import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ClipboardCheck, Clock, Map as MapIcon, Users as UsersIcon, Lightbulb, AlertOctagon, AlertTriangle } from "lucide-react";
import { computeEmergencyIntelligence, type UserResponseStatus, type AlertDto } from "@workspace/keas-core";
import { useAlerts, useIncidentEvents } from "@/lib/hooks";
import { useMapData } from "@/lib/useMapData";
import { useAccountabilityHistory, demoAccountability } from "@/lib/useAccountability";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DEMO_ALERTS } from "@/lib/demoMap";
import { demoEvents } from "@/lib/demoTimeline";

// Phase 3.8 Reports Center — read-only consolidation of the metrics that ALREADY
// exist in mobile: Alert History, Accountability reports, Timeline event log,
// Zone Statistics, Personnel Statistics, and the Emergency-Intelligence summary.
// Every number comes from existing sources (useAlerts / useIncidentEvents /
// useAccountabilityHistory / computeEmergencyIntelligence / roster). No export,
// no invented trend/chart analytics (mobile has none). Demo fallback when empty.
type Cat = "alerts" | "accountability" | "timeline" | "zones" | "personnel" | "intel";
const CATS: Array<{ key: Cat; label: string; icon: typeof Bell }> = [
  { key: "alerts", label: "Alert history", icon: Bell },
  { key: "accountability", label: "Accountability", icon: ClipboardCheck },
  { key: "timeline", label: "Timeline", icon: Clock },
  { key: "zones", label: "Zone statistics", icon: MapIcon },
  { key: "personnel", label: "Personnel statistics", icon: UsersIcon },
  { key: "intel", label: "Intelligence", icon: Lightbulb },
];

function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "—" : new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function ReportsCenterPage() {
  const map = useMapData();
  const { users, zones, locations } = map;
  const alertsQ = useAlerts();
  const eventsQ = useIncidentEvents();
  const historyQ = useAccountabilityHistory();
  const [cat, setCat] = useState<Cat>("alerts");
  const [now] = useState(() => Date.now());

  const alerts = (alertsQ.data?.length ? alertsQ.data : DEMO_ALERTS);
  const events = eventsQ.data?.length ? eventsQ.data : demoEvents(now);
  const sessions = (historyQ.data?.length ? historyQ.data : demoAccountability(now).history).filter((s) => s.status === "completed");

  const intel = useMemo(
    () =>
      computeEmergencyIntelligence(
        users.map((u) => ({ id: u.id, status: u.status as UserResponseStatus, zoneId: u.zoneId, locationId: u.locationId, location: u.location, isActive: u.isActive, escalationLevel: u.escalationLevel })),
        zones.map((z) => ({ id: z.id, name: z.name, color: z.color, alertActive: z.alertActive, alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds })),
        locations.map((l) => ({ id: l.id, name: l.name })),
      ),
    [users, zones, locations],
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Reports</h1>
        {!map.live && <span className="rounded-md px-2 py-0.5 text-xs text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>demo</span>}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Category nav */}
        <div className="flex shrink-0 flex-row flex-wrap gap-1 lg:w-56 lg:flex-col">
          {CATS.map((c) => (
            <button key={c.key} onClick={() => setCat(c.key)} className="flex items-center gap-2 rounded-[var(--keas-radius-md)] px-3 py-2 text-sm" style={cat === c.key ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)", fontWeight: 600 } : { color: "var(--keas-text-secondary)" }}>
              <c.icon size={15} /> {c.label}
            </button>
          ))}
        </div>

        {/* Report content */}
        <div className="min-w-0 flex-1">
          {cat === "alerts" && <AlertHistory alerts={alerts} />}
          {cat === "accountability" && <AccountabilityReport sessions={sessions} />}
          {cat === "timeline" && <TimelineReport events={events} />}
          {cat === "zones" && <ZoneStats users={users} zones={zones} />}
          {cat === "personnel" && <PersonnelStats users={users} />}
          {cat === "intel" && <IntelReport intel={intel} />}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-lg)]">
      <div className="mb-3 text-sm font-medium">{title}</div>
      {children}
    </div>
  );
}

function AlertHistory({ alerts }: { alerts: AlertDto[] }) {
  const list = alerts;
  const types = useMemo(() => {
    const m = new Map<string, number>();
    list.forEach((a) => m.set(a.type, (m.get(a.type) ?? 0) + 1));
    return [...m.entries()];
  }, [list]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const shown = typeFilter === "all" ? list : list.filter((a) => a.type === typeFilter);
  const sorted = [...shown].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  return (
    <Card title={`Alert history · ${list.length}`}>
      <div className="mb-2 flex flex-wrap gap-1">
        <Chip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>All {list.length}</Chip>
        {types.map(([t, n]) => (
          <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)}>{t} {n}</Chip>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {sorted.length === 0 ? <Empty>No alerts.</Empty> : sorted.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "var(--keas-surface-2)" }}>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{a.zone || "—"} · {a.type}</div>
              <div className="text-[11px] text-[var(--keas-text-tertiary)]">{a.priority} · {fmtTime(a.timestamp)}{a.closedAt ? ` – ${fmtTime(a.closedAt)}` : ""}</div>
            </div>
            {a.stats && (
              <div className="text-[11px] text-[var(--keas-text-secondary)]">safe {a.stats.confirmed} · pending {a.stats.pending} · help {a.stats.needHelp}</div>
            )}
            <StatusBadge status={a.isActive ? "warn" : "ok"} label={a.isActive ? "Active" : "Closed"} />
          </div>
        ))}
      </div>
    </Card>
  );
}

function AccountabilityReport({ sessions }: { sessions: ReturnType<typeof demoAccountability>["history"] }) {
  return (
    <Card title={`Accountability reports · ${sessions.length}`}>
      <div className="flex flex-col gap-1">
        {sessions.length === 0 ? <Empty>No completed sessions.</Empty> : sessions.map((s) => {
          const r = s.report;
          return (
            <div key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "var(--keas-surface-2)" }}>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{s.locationName} · {s.zoneName}</div>
                <div className="text-[11px] text-[var(--keas-text-tertiary)]">{fmtTime(s.startedAt)} – {fmtTime(s.endedAt)} · by {s.startedByName || "—"}</div>
              </div>
              <div className="text-right text-[11px] text-[var(--keas-text-secondary)]">
                {r ? `${r.safe}/${r.totalPersonnel} safe · help ${r.needHelp} · no-resp ${r.noResponse} · ${r.safePercent}%` : `${s.safeCount}/${s.totalPersonnel} safe`}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TimelineReport({ events }: { events: ReturnType<typeof demoEvents> }) {
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    events.forEach((e) => m.set(e.type, (m.get(e.type) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);
  return (
    <Card title={`Timeline · ${events.length} events`}>
      <div className="mb-3 flex flex-col gap-1">
        {counts.map(([t, n]) => (
          <div key={t} className="flex justify-between text-sm">
            <span className="text-[var(--keas-text-secondary)]">{t.replace(/_/g, " ")}</span>
            <span className="font-medium">{n}</span>
          </div>
        ))}
      </div>
      <Link to="/timeline" className="text-xs font-medium" style={{ color: "var(--keas-primary)" }}>View full incident timeline →</Link>
    </Card>
  );
}

function ZoneStats({ users, zones }: { users: ReturnType<typeof useMapData>["users"]; zones: ReturnType<typeof useMapData>["zones"] }) {
  const rows = useMemo(() => {
    const active = users.filter((u) => u.isActive);
    return zones.filter((z) => !z.isArchived).map((z) => {
      const zu = active.filter((u) => u.zoneId === z.id);
      return {
        zone: z.name,
        total: zu.length,
        safe: zu.filter((u) => u.status === "confirmed").length,
        pending: zu.filter((u) => u.status === "pending").length,
        help: zu.filter((u) => u.status === "need_help").length,
        escalated: zu.filter((u) => (u.escalationLevel ?? 0) >= 1).length,
      };
    });
  }, [users, zones]);
  return (
    <Card title="Zone statistics">
      <div className="grid grid-cols-6 gap-2 border-b border-[var(--keas-border)] pb-1 text-[11px] font-medium text-[var(--keas-text-tertiary)]">
        <span className="col-span-2">Zone</span><span>Total</span><span>Safe</span><span>Pending</span><span>Help</span>
      </div>
      {rows.length === 0 ? <Empty>No zones.</Empty> : rows.map((r) => (
        <div key={r.zone} className="grid grid-cols-6 gap-2 border-b border-[var(--keas-border)] py-1.5 text-sm last:border-0">
          <span className="col-span-2 font-medium">{r.zone}</span>
          <span>{r.total}</span>
          <span style={{ color: "var(--keas-safe)" }}>{r.safe}</span>
          <span style={{ color: "var(--keas-pending)" }}>{r.pending}</span>
          <span style={{ color: "var(--keas-help)" }}>{r.help}</span>
        </div>
      ))}
    </Card>
  );
}

function PersonnelStats({ users }: { users: ReturnType<typeof useMapData>["users"] }) {
  const a = users.filter((u) => u.isActive);
  const stat = {
    total: a.length,
    safe: a.filter((u) => u.status === "confirmed").length,
    pending: a.filter((u) => u.status === "pending").length,
    help: a.filter((u) => u.status === "need_help").length,
    escalated: a.filter((u) => (u.escalationLevel ?? 0) === 1).length,
    critical: a.filter((u) => (u.escalationLevel ?? 0) >= 2).length,
    aramco: a.filter((u) => u.userType !== "Contract").length,
    contractor: a.filter((u) => u.userType === "Contract").length,
  };
  return (
    <Card title="Personnel statistics">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Total" value={stat.total} />
        <Metric label="Safe" value={stat.safe} color="var(--keas-safe)" />
        <Metric label="Pending" value={stat.pending} color="var(--keas-pending)" />
        <Metric label="Need help" value={stat.help} color="var(--keas-help)" />
        <Metric label="Escalated" value={stat.escalated} color="var(--keas-pending)" />
        <Metric label="Critical" value={stat.critical} color="var(--keas-danger)" />
        <Metric label="Aramco" value={stat.aramco} />
        <Metric label="Contractor" value={stat.contractor} />
      </div>
    </Card>
  );
}

function IntelReport({ intel }: { intel: ReturnType<typeof computeEmergencyIntelligence> }) {
  return (
    <Card title="Emergency intelligence">
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Metric label="Personnel" value={intel.totalPersonnel} />
        <Metric label="Safe" value={intel.totalSafe} color="var(--keas-safe)" />
        <Metric label="Pending" value={intel.totalPending} color="var(--keas-pending)" />
        <Metric label="Need help" value={intel.totalNeedHelp} color="var(--keas-help)" />
        <Metric label="Missing" value={intel.totalMissing} color="var(--keas-text-secondary)" />
      </div>
      {intel.suggestedActions.length === 0 ? (
        <div className="text-xs text-[var(--keas-text-secondary)]">{intel.isActive ? "No critical actions." : "No active incident."}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {intel.suggestedActions.map((s) => {
            const crit = s.priority === "critical";
            const Icon = crit ? AlertOctagon : AlertTriangle;
            return (
              <div key={s.id} className="flex items-start gap-2">
                <Icon size={14} color={crit ? "var(--keas-help)" : "var(--keas-pending)"} className="mt-0.5 shrink-0" />
                <span className="text-xs leading-snug text-[var(--keas-text-secondary)]">{s.description}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Metric({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] p-2.5">
      <div className="text-[var(--keas-text-xl)] font-semibold leading-none" style={{ color: color ?? "var(--keas-text-title)" }}>{value}</div>
      <div className="mt-1 text-[11px] text-[var(--keas-text-secondary)]">{label}</div>
    </div>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={active ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}>{children}</button>
  );
}
function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-4 text-sm text-[var(--keas-text-secondary)]">{children}</div>;
}
