import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle, CheckCircle2, Bell, ShieldCheck, AlertTriangle, ArrowUpCircle,
  Flame, Megaphone, MapPin, Home, Shield, Moon, User, CheckCheck, Circle,
  RotateCcw, Play, Pause, Clock,
} from "lucide-react";
import type { IncidentEventDto } from "@workspace/keas-core";
import { useIncidentEvents } from "@/lib/hooks";
import { useIncidentReplay, type ReplaySpeed } from "@/lib/useIncidentReplay";
import { demoEvents } from "@/lib/demoTimeline";

// Faithful web mirror of mobile components/ui/IncidentTimelinePanel.tsx —
// same event icons + colors, labels, Live/Replay toggle, replay controls, and
// dark-slate panel styling. Data comes from the synced incidentEvents (with a
// demo fallback when empty, like the Live Map).
const EVENT_ICONS: Record<string, { Icon: LucideIcon; color: string }> = {
  alert_started: { Icon: AlertCircle, color: "#EF4444" },
  alert_ended: { Icon: CheckCircle2, color: "#22C55E" },
  user_received_alert: { Icon: Bell, color: "#F59E0B" },
  user_safe: { Icon: ShieldCheck, color: "#22C55E" },
  user_need_help: { Icon: AlertTriangle, color: "#EF4444" },
  escalation_level_1: { Icon: ArrowUpCircle, color: "#F59E0B" },
  escalation_critical: { Icon: Flame, color: "#DC2626" },
  broadcast_sent: { Icon: Megaphone, color: "#3B82F6" },
  zone_updated: { Icon: MapPin, color: "#8B5CF6" },
  shelter_assigned: { Icon: Home, color: "#0EA5E9" },
  shelter_in_activated: { Icon: Shield, color: "#F97316" },
  blackout_activated: { Icon: Moon, color: "#64748B" },
  supervisor_action: { Icon: User, color: "#6366F1" },
  all_clear: { Icon: CheckCheck, color: "#10B981" },
};

// Ported verbatim from mobile IncidentTimelinePanel.eventLabel.
function eventLabel(evt: IncidentEventDto): string {
  switch (evt.type) {
    case "alert_started":
      return `Alert Started${evt.zoneName ? ` — ${evt.zoneName}` : ""}`;
    case "alert_ended":
      return "Alert Ended";
    case "user_safe":
      return `${evt.userName ?? "User"} marked SAFE`;
    case "user_need_help":
      return `${evt.userName ?? "User"} needs HELP`;
    case "escalation_level_1":
      return `${evt.userName ?? "User"} escalated (Level 1)`;
    case "escalation_critical":
      return `${evt.userName ?? "User"} CRITICAL escalation`;
    case "zone_updated": {
      const action = (evt.metadata?.action as string) ?? "updated";
      return `Zone ${evt.zoneName ?? ""} ${action}`;
    }
    case "shelter_in_activated":
      return `Shelter-In activated by ${evt.userName ?? "System"}`;
    case "blackout_activated":
      return `Blackout activated by ${evt.userName ?? "System"}`;
    case "all_clear":
      return `ALL CLEAR by ${evt.userName ?? "System"}`;
    default:
      return evt.type.replace(/_/g, " ");
  }
}

function formatTs(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

const SPEEDS: ReplaySpeed[] = [1, 2, 4, 8];

export function TimelinePage() {
  const eventsQ = useIncidentEvents();
  const base = useMemo(() => Date.now(), []);
  const live = (eventsQ.data?.length ?? 0) > 0;
  const events = useMemo(
    () => (live ? eventsQ.data! : demoEvents(base)),
    [live, eventsQ.data, base],
  );

  const [mode, setMode] = useState<"live" | "replay">("live");
  const replay = useIncidentReplay(events);

  const sorted = useMemo(() => [...events].sort((a, b) => a.timestamp - b.timestamp), [events]);
  const shown = mode === "replay" ? replay.visibleEvents : sorted;
  const count = mode === "replay" ? replay.totalEvents : events.length;

  const switchMode = (m: "live" | "replay") => {
    setMode(m);
    if (m === "live") replay.reset();
  };

  return (
    <div className="flex h-full min-h-[600px] flex-col overflow-hidden rounded-[var(--keas-radius-lg)] border border-[#1E293B] bg-[#0F172A] text-[#E2E8F0]">
      {/* Header — mirrors mobile TIMELINE header + count badge */}
      <div className="flex items-center gap-2 border-b border-[#1E293B] px-4 py-3">
        <Clock size={16} color="#94A3B8" />
        <span className="text-[11px] font-bold uppercase tracking-[1px] text-[#94A3B8]">Timeline</span>
        {count > 0 && (
          <span className="ml-1 rounded-full bg-[#334155] px-1.5 py-px text-[10px] font-semibold text-[#CBD5E1]">
            {count}
          </span>
        )}

        {/* Live / Replay mode toggle */}
        <div className="ml-4 flex items-center gap-1.5">
          {(["live", "replay"] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="rounded-md px-3 py-1 text-xs font-semibold capitalize"
              style={
                mode === m
                  ? { background: "#3B82F6", color: "#fff" }
                  : { background: "#1E293B", color: "#94A3B8" }
              }
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === "replay" && (
        <ReplayControls replay={replay} />
      )}

      {/* Event list */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {shown.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#475569]">
            {mode === "replay" ? "Press play to start replay" : "No events recorded yet"}
          </div>
        ) : (
          shown.map((evt, idx) => (
            <EventRow
              key={evt.id}
              event={evt}
              isLast={idx === shown.length - 1}
              isCurrent={mode === "replay" && idx === replay.currentIndex}
              onClick={() => {
                if (mode === "replay") replay.scrubTo(idx);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ReplayControls({ replay }: { replay: ReturnType<typeof useIncidentReplay> }) {
  return (
    <div className="flex flex-col gap-2 border-b border-[#1E293B] px-4 py-3">
      <div className="flex items-center gap-2">
        <button onClick={replay.reset} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1E293B]" aria-label="Reset replay">
          <RotateCcw size={18} color="#94A3B8" />
        </button>
        <button
          onClick={replay.isPlaying ? replay.pause : replay.play}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3B82F6]"
          aria-label={replay.isPlaying ? "Pause replay" : "Play replay"}
        >
          {replay.isPlaying ? <Pause size={20} color="#fff" /> : <Play size={20} color="#fff" />}
        </button>

        {/* Speed selector */}
        <div className="ml-auto flex gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => replay.setSpeed(s)}
              className="rounded px-2 py-0.5 text-[11px] font-semibold"
              style={replay.speed === s ? { background: "#3B82F6", color: "#fff" } : { background: "#1E293B", color: "#64748B" }}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Progress (scrubbable) */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min={0}
          max={Math.max(0, replay.totalEvents - 1)}
          value={replay.currentIndex < 0 ? 0 : replay.currentIndex}
          onChange={(e) => replay.scrubTo(Number(e.target.value))}
          className="h-1 w-full accent-[#3B82F6]"
        />
        <div className="text-right text-[10px] text-[#64748B]">
          {formatDuration(replay.elapsed)} / {formatDuration(replay.duration)}
        </div>
      </div>
    </div>
  );
}

function EventRow({
  event,
  isLast,
  isCurrent,
  onClick,
}: {
  event: IncidentEventDto;
  isLast: boolean;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const cfg = EVENT_ICONS[event.type] ?? { Icon: Circle, color: "#64748B" };
  const { Icon } = cfg;
  return (
    <button
      onClick={onClick}
      className="flex w-full gap-2 text-left"
      style={isCurrent ? { background: "rgba(59,130,246,0.1)", borderRadius: 8 } : undefined}
    >
      <div className="flex w-7 flex-col items-center pt-1">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full" style={{ background: cfg.color }}>
          <Icon size={12} color="#fff" />
        </span>
        {!isLast && <span className="my-0.5 w-0.5 flex-1 bg-[#1E293B]" />}
      </div>
      <div className="flex-1 pb-2 pl-1 pt-1">
        <div className="text-[13px] font-medium text-[#E2E8F0]">{eventLabel(event)}</div>
        <div className="mt-0.5 text-[10px] text-[#64748B]">{formatTs(event.timestamp)}</div>
        {event.locationName && <div className="mt-px text-[10px] text-[#475569]">{event.locationName}</div>}
      </div>
    </button>
  );
}
