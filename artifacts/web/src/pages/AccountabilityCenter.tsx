import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Lock, Clock, ChevronUp } from "lucide-react";
import { StatusBadge, type BadgeStatus } from "@/components/ui/StatusBadge";
import {
  useActiveSessions, useAccountabilityHistory, useSessionDetail, demoAccountability,
  type AccountabilitySession, type PersonnelStatusRow,
} from "@/lib/useAccountability";

// Phase 3.5 Accountability Center — read-only desktop mirror of the mobile
// supervisor accountability workflow. Reads the existing /api/accountability GET
// endpoints; mobile is the author (Start/End/Respond/Escalate are NOT exposed —
// shown as a locked "managed from mobile" affordance). Demo fallback when empty.
const badgeStatus = (s: string): BadgeStatus =>
  s === "safe" ? "confirmed" : s === "need_help" ? "need_help" : s === "no_response" ? "missing" : "pending";

function fmtTimer(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}:${String(sec).padStart(2, "0")}`;
}
function fmtTime(iso?: string | null): string {
  if (!iso) return "—";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}
function pendingOf(s: AccountabilitySession): number {
  return Math.max(0, s.totalPersonnel - s.safeCount - s.helpCount - s.noResponseCount);
}

export function AccountabilityCenterPage() {
  const activeQ = useActiveSessions();
  const historyQ = useAccountabilityHistory();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const liveActive = activeQ.data ?? [];
  const liveHistory = historyQ.data ?? [];
  const live = liveActive.length > 0 || liveHistory.length > 0;

  const demo = useMemo(() => demoAccountability(now), [now]);
  const activeSessions = live ? liveActive : demo.active;
  const history = (live ? liveHistory : demo.history).filter((s) => s.status === "completed");

  const [selId, setSelId] = useState<number | null>(null);
  const selectedId = selId ?? activeSessions[0]?.id ?? null;
  const selected = activeSessions.find((s) => s.id === selectedId) ?? null;

  const detailQ = useSessionDetail(live ? selectedId : null);
  const personnel: PersonnelStatusRow[] = live ? detailQ.data?.personnel ?? [] : selectedId === demo.detail.session.id ? demo.detail.personnel : [];

  const elapsedMs = selected ? now - Date.parse(selected.startedAt) : 0;
  const respondedPct = selected && selected.totalPersonnel > 0
    ? Math.round(((selected.safeCount + selected.helpCount) / selected.totalPersonnel) * 100)
    : 0;

  // Zone breakdown — aggregate active sessions up to their zone.
  const zoneBreakdown = useMemo(() => {
    const m = new Map<string, { zone: string; safe: number; pending: number; help: number; missing: number; total: number }>();
    for (const s of activeSessions) {
      const e = m.get(s.zoneName) ?? { zone: s.zoneName || "—", safe: 0, pending: 0, help: 0, missing: 0, total: 0 };
      e.safe += s.safeCount; e.help += s.helpCount; e.missing += s.noResponseCount;
      e.pending += pendingOf(s); e.total += s.totalPersonnel;
      m.set(s.zoneName, e);
    }
    return [...m.values()];
  }, [activeSessions]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Accountability</h1>
        {!live && <span className="rounded-md px-2 py-0.5 text-xs text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>demo</span>}
      </div>

      {/* Active session banner */}
      {selected ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[var(--keas-radius-md)] px-3 py-2" style={{ background: "rgba(220,38,38,0.08)" }}>
          <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--keas-danger)" }}>
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: "var(--keas-danger)" }} /> LIVE
          </span>
          <span className="text-sm font-medium">{selected.locationName} · {selected.zoneName}</span>
          <span className="text-xs text-[var(--keas-text-secondary)]">by {selected.startedByName || "—"}</span>
          <span className="ml-auto flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--keas-danger)" }}>
            <Clock size={14} /> {fmtTimer(elapsedMs)}
          </span>
        </div>
      ) : (
        <div className="rounded-[var(--keas-radius-md)] border border-[var(--keas-border)] bg-[var(--keas-surface)] px-3 py-2 text-sm text-[var(--keas-text-secondary)]">
          No active accountability session.
        </div>
      )}

      {/* Multiple active sessions selector */}
      {activeSessions.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {activeSessions.map((s) => (
            <button key={s.id} onClick={() => setSelId(s.id)} className="rounded-md px-2 py-1 text-xs font-medium" style={s.id === selectedId ? { background: "var(--keas-primary-dim)", color: "var(--keas-primary)" } : { background: "var(--keas-surface-2)", color: "var(--keas-text-secondary)" }}>
              {s.locationName}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 xl:flex-row">
        {/* Left: session status + counts + zone breakdown */}
        <div className="flex w-full shrink-0 flex-col gap-3 xl:w-80">
          <Panel title="Session status" icon={<ClipboardCheck size={14} color="var(--keas-primary)" />}>
            {selected ? (
              <>
                <div className="mb-2 grid grid-cols-5 gap-1 text-center">
                  <Stat label="Total" value={selected.totalPersonnel} />
                  <Stat label="Safe" value={selected.safeCount} color="var(--keas-safe)" />
                  <Stat label="Pending" value={pendingOf(selected)} color="var(--keas-pending)" />
                  <Stat label="Help" value={selected.helpCount} color="var(--keas-help)" />
                  <Stat label="Missing" value={selected.noResponseCount} color="var(--keas-text-secondary)" />
                </div>
                <div className="mb-1 flex items-center justify-between text-xs text-[var(--keas-text-secondary)]">
                  <span>Responded</span><span>{respondedPct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: "var(--keas-surface-2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${respondedPct}%`, background: "var(--keas-safe)" }} />
                </div>
              </>
            ) : (
              <div className="text-xs text-[var(--keas-text-secondary)]">No counts.</div>
            )}
          </Panel>

          <Panel title="Zone breakdown">
            {zoneBreakdown.length === 0 ? (
              <div className="text-xs text-[var(--keas-text-secondary)]">No active zones.</div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {zoneBreakdown.map((z) => (
                  <div key={z.zone} className="text-xs">
                    <div className="font-medium">{z.zone}</div>
                    <div className="text-[var(--keas-text-secondary)]">safe {z.safe} · pending {z.pending} · help {z.help} · missing {z.missing}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {/* Authoring lock */}
          <Panel title="Session controls">
            <div className="flex items-center gap-1.5 text-xs text-[var(--keas-text-tertiary)]">
              <Lock size={12} /> Start / End / Respond — managed from mobile
            </div>
          </Panel>
        </div>

        {/* Right: roll call + history */}
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Panel title="Roll call" icon={<ClipboardCheck size={14} color="var(--keas-primary)" />}>
            {personnel.length === 0 ? (
              <div className="text-xs text-[var(--keas-text-secondary)]">{selected ? "No roll-call records." : "No active session."}</div>
            ) : (
              <div className="flex flex-col gap-1">
                {personnel.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "var(--keas-surface-2)" }}>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{p.userName || `User #${p.userId}`}</div>
                      <div className="text-[11px] text-[var(--keas-text-tertiary)]">
                        {p.badge ?? "—"}{p.userType ? ` · ${p.userType}` : ""}{p.respondedAt ? ` · ${fmtTime(p.respondedAt)}` : ""}
                      </div>
                    </div>
                    {p.escalationLevel >= 2 && p.status === "pending" && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold" style={{ background: "rgba(220,38,38,0.12)", color: "var(--keas-danger)" }}>CRITICAL</span>
                    )}
                    <StatusBadge status={badgeStatus(p.status)} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Historical sessions" icon={<ChevronUp size={14} color="var(--keas-text-secondary)" />}>
            {history.length === 0 ? (
              <div className="text-xs text-[var(--keas-text-secondary)]">No completed sessions.</div>
            ) : (
              <div className="flex flex-col gap-1">
                {history.map((s) => {
                  const r = s.report;
                  return (
                    <div key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5" style={{ background: "var(--keas-surface-2)" }}>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{s.locationName} · {s.zoneName}</div>
                        <div className="text-[11px] text-[var(--keas-text-tertiary)]">
                          {fmtTime(s.startedAt)}–{fmtTime(s.endedAt)} · by {s.startedByName || "—"}
                        </div>
                      </div>
                      <div className="text-right text-[11px] text-[var(--keas-text-secondary)]">
                        {r ? `${r.safe}/${r.totalPersonnel} safe · ${r.safePercent}%` : `${s.safeCount}/${s.totalPersonnel} safe`}
                      </div>
                      <StatusBadge status="ok" label="Completed" />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
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

function Stat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="text-[var(--keas-text-lg)] font-semibold leading-none" style={{ color: color ?? "var(--keas-text-title)" }}>{value}</div>
      <div className="text-[10px] text-[var(--keas-text-secondary)]">{label}</div>
    </div>
  );
}
