import { useMemo, useState } from "react";
import { Search, X, Lock, ChevronRight } from "lucide-react";
import type { UserResponseStatus, UserDto } from "@workspace/keas-core";
import { useMapData } from "@/lib/useMapData";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Phase 3.6 Personnel Center — read-only desktop mirror of the mobile
// EmergencyUsersScreen (admin/eco users) + supervisor personnel list. Search +
// Zone/Location/Status/Company filters, location-grouped roster, escalation
// badges + details drawer. Authoring (remove/start) is mobile-only (locked).
// Escalation is shown as badges + a sort key (exactly like mobile) — mobile has
// no escalation FILTER, so none is added (no web-only controls). Data via
// useMapData (live users join + demo fallback when the roster is empty).
const STATUS_FILTERS: Array<{ key: "all" | UserResponseStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Safe" },
  { key: "pending", label: "Pending" },
  { key: "need_help", label: "Help" },
];
const COMPANY_FILTERS = ["All", "Aramco", "Contractor"] as const;

const company = (u: UserDto) => (u.companyName ? u.companyName : u.userType === "Contract" ? "Contractor" : "Aramco");
const companyKind = (u: UserDto): "Aramco" | "Contractor" => (u.userType === "Contract" ? "Contractor" : "Aramco");
const STATUS_RANK: Record<string, number> = { need_help: 0, pending: 1, confirmed: 2 };

function fmtLastActive(iso?: string): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function PersonnelCenterPage() {
  const { live, users, zones, locations } = useMapData();

  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [locFilter, setLocFilter] = useState<number | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | UserResponseStatus>("all");
  const [companyFilter, setCompanyFilter] = useState<(typeof COMPANY_FILTERS)[number]>("All");
  const [selId, setSelId] = useState<number | null>(null);

  // Escalation badges show only while an incident is active (mirrors mobile).
  const emergencyActive = zones.some((z) => z.alertActive);

  const zoneOptions = zones.filter((z) => z.isActive && !z.isArchived);
  const locOptions = locations.filter((l) => l.isActive && (zoneFilter === "all" || l.zone === zoneFilter));

  const filtered = users.filter((u) => {
    if (!u.isActive) return false;
    const q = query.trim().toLowerCase();
    if (q && ![u.name, u.badge, u.zone, u.location, company(u)].some((v) => (v ?? "").toLowerCase().includes(q))) return false;
    if (zoneFilter !== "all" && u.zone !== zoneFilter) return false;
    if (locFilter !== "all" && u.locationId !== locFilter) return false;
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (companyFilter !== "All" && companyKind(u) !== companyFilter) return false;
    return true;
  });

  // Group by location (mirrors the mobile SectionList), unassigned last.
  const groups = useMemo(() => {
    const m = new Map<string, { name: string; users: UserDto[] }>();
    for (const u of filtered) {
      const key = u.location || "Unassigned";
      const g = m.get(key) ?? { name: key, users: [] };
      g.users.push(u);
      m.set(key, g);
    }
    const arr = [...m.values()];
    arr.forEach((g) =>
      g.users.sort((a, b) => (STATUS_RANK[a.status] ?? 3) - (STATUS_RANK[b.status] ?? 3) || (b.escalationLevel ?? 0) - (a.escalationLevel ?? 0) || a.name.localeCompare(b.name)),
    );
    // sections with more need_help first, then unassigned last
    arr.sort((a, b) => {
      if (a.name === "Unassigned") return 1;
      if (b.name === "Unassigned") return -1;
      const ah = a.users.filter((u) => u.status === "need_help").length;
      const bh = b.users.filter((u) => u.status === "need_help").length;
      return bh - ah || a.name.localeCompare(b.name);
    });
    return arr;
  }, [filtered]);

  const selected = selId == null ? null : users.find((u) => u.id === selId) ?? null;

  // Roster summary — counts over the displayed roster (mirrors mobile
  // EmergencyUsersScreen summary bar): safe+pending+help sum to the total;
  // "missing" = escalated personnel (escalationLevel>=2), a subset indicator.
  const activeUsers = users.filter((u) => u.isActive);
  const total = activeUsers.length;
  const stats = {
    safe: activeUsers.filter((u) => u.status === "confirmed").length,
    pending: activeUsers.filter((u) => u.status === "pending").length,
    help: activeUsers.filter((u) => u.status === "need_help").length,
    missing: activeUsers.filter((u) => (u.escalationLevel ?? 0) >= 2).length,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Personnel</h1>
        {!live && <span className="rounded-md px-2 py-0.5 text-xs text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>demo</span>}
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3">
        <SummaryTile label="Total" value={total} />
        <SummaryTile label="Safe" value={stats.safe} color="var(--keas-safe)" />
        <SummaryTile label="Pending" value={stats.pending} color="var(--keas-pending)" />
        <SummaryTile label="Need help" value={stats.help} color="var(--keas-help)" />
        <SummaryTile label="Missing" value={stats.missing} color="var(--keas-text-secondary)" />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        {/* Filters + list */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] px-2.5 py-1.5">
            <Search size={14} color="var(--keas-text-tertiary)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, badge, zone, location..." className="w-full bg-transparent text-sm outline-none" />
            {query && <button onClick={() => setQuery("")} aria-label="Clear"><X size={14} color="var(--keas-text-tertiary)" /></button>}
          </div>

          {/* Filter chips */}
          <ChipRow label="Zone">
            <Chip active={zoneFilter === "all"} onClick={() => { setZoneFilter("all"); setLocFilter("all"); }}>All</Chip>
            {zoneOptions.map((z) => (
              <Chip key={z.id} active={zoneFilter === z.name} onClick={() => { setZoneFilter(z.name); setLocFilter("all"); }}>{z.name}</Chip>
            ))}
          </ChipRow>
          <ChipRow label="Location">
            <Chip active={locFilter === "all"} onClick={() => setLocFilter("all")}>All</Chip>
            {locOptions.map((l) => (
              <Chip key={l.id} active={locFilter === l.id} onClick={() => setLocFilter(l.id)}>{l.name}</Chip>
            ))}
          </ChipRow>
          <ChipRow label="Status">
            {STATUS_FILTERS.map((s) => (
              <Chip key={s.key} active={statusFilter === s.key} onClick={() => setStatusFilter(s.key)}>{s.label}</Chip>
            ))}
          </ChipRow>
          <ChipRow label="Company">
            {COMPANY_FILTERS.map((c) => (
              <Chip key={c} active={companyFilter === c} onClick={() => setCompanyFilter(c)}>{c}</Chip>
            ))}
          </ChipRow>

          {/* Grouped list */}
          <div className="flex flex-col gap-2">
            {groups.length === 0 ? (
              <div className="rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] px-3 py-4 text-sm text-[var(--keas-text-secondary)]">No personnel match the filters.</div>
            ) : (
              groups.map((g) => {
                const h = g.users.filter((u) => u.status === "need_help").length;
                const p = g.users.filter((u) => u.status === "pending").length;
                const s = g.users.filter((u) => u.status === "confirmed").length;
                return (
                  <div key={g.name} className="overflow-hidden rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)]">
                    <div className="flex items-center justify-between border-b border-[var(--keas-border)] px-3 py-2">
                      <span className="text-sm font-medium">{g.name} <span className="text-[var(--keas-text-tertiary)]">· {g.users.length}</span></span>
                      <span className="text-xs text-[var(--keas-text-secondary)]">help {h} · pending {p} · safe {s}</span>
                    </div>
                    <div className="divide-y divide-[var(--keas-border)]">
                      {g.users.map((u) => (
                        <button key={u.id} onClick={() => setSelId(u.id)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[var(--keas-surface-2)]">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: "var(--keas-primary-dim)", color: "var(--keas-primary)" }}>
                            {u.name.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium">{u.name}</div>
                            <div className="text-[11px] text-[var(--keas-text-tertiary)]">{u.badge} · {companyKind(u)}</div>
                          </div>
                          {emergencyActive && (u.escalationLevel ?? 0) >= 2 && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(220,38,38,0.12)", color: "var(--keas-danger)" }}>CRITICAL</span>
                          )}
                          {emergencyActive && (u.escalationLevel ?? 0) === 1 && (
                            <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(217,119,6,0.10)", color: "var(--keas-pending)" }}>ESCALATED</span>
                          )}
                          <StatusBadge status={u.status as UserResponseStatus} />
                          <ChevronRight size={14} color="var(--keas-text-tertiary)" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Details drawer */}
        <div className="w-full shrink-0 lg:w-80">
          {selected ? (
            <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-lg)]">
              <div className="mb-3 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold">{selected.name}</div>
                  <div className="text-xs text-[var(--keas-text-secondary)]">{selected.role}</div>
                </div>
                <StatusBadge status={selected.status as UserResponseStatus} />
                <button onClick={() => setSelId(null)} aria-label="Close" className="text-[var(--keas-text-tertiary)]"><X size={16} /></button>
              </div>
              <DetailRow label="Badge" value={selected.badge} />
              <DetailRow label="Assigned zone" value={selected.zone || "—"} />
              <DetailRow label="Assigned location" value={selected.location || "—"} />
              <DetailRow label="Company" value={company(selected)} />
              <DetailRow label="Type" value={companyKind(selected)} />
              <DetailRow label="Account" valueNode={<StatusBadge status={selected.accountStatus === "active" ? "ok" : "warn"} label={selected.accountStatus === "active" ? "Enabled" : "Disabled"} />} />
              <DetailRow label="Last response" value={fmtLastActive(selected.lastActivity)} />
              {emergencyActive && <DetailRow label="Escalation" value={String(selected.escalationLevel ?? 0)} />}
              <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--keas-border)] pt-2 text-[11px] text-[var(--keas-text-tertiary)]">
                <Lock size={12} /> Remove / status changes — managed from mobile
              </div>
            </div>
          ) : (
            <div className="rounded-[var(--keas-radius-lg)] border border-dashed border-[var(--keas-border)] px-4 py-8 text-center text-sm text-[var(--keas-text-tertiary)]">
              Select a person to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-[var(--keas-text-tertiary)]">{label}</span>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-full px-2.5 py-0.5 text-xs font-medium" style={active ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}>
      {children}
    </button>
  );
}
function SummaryTile({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-md)]">
      <div className="text-[var(--keas-text-xxl)] font-semibold leading-none" style={{ color: color ?? "var(--keas-text-title)" }}>{value}</div>
      <div className="mt-1 text-[var(--keas-text-sm)] text-[var(--keas-text-secondary)]">{label}</div>
    </div>
  );
}
function DetailRow({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--keas-border)] py-1.5 text-sm last:border-0">
      <span className="text-[var(--keas-text-secondary)]">{label}</span>
      {valueNode ?? <span className="font-medium">{value}</span>}
    </div>
  );
}
