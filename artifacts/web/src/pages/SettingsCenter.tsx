import { Lock } from "lucide-react";
import type { AppSettings } from "@workspace/keas-core";
import { useSettings, useZones } from "@/lib/hooks";
import { useMapData } from "@/lib/useMapData";
import { StatusBadge } from "@/components/ui/StatusBadge";

// Phase 3.9 Settings Center — read-only desktop mirror of the mobile admin
// Settings screen. Settings are a singleton synced from mobile (the sole author);
// every value is display-only. Sections mirror the mobile screen: General, Zone
// Settings, Hazard Zone Defaults, Default Alarm Zones, Notifications, Security,
// About. Demo fallback (mobile seedSettings) when the backend row is absent.
// Fields the mobile screen does NOT show are intentionally omitted for parity.
const DEMO_SETTINGS: AppSettings = {
  systemName: "Khurais Emergency Alert System",
  timezone: "ast",
  language: "en",
  rtlSupport: false,
  autoDetectZone: true,
  gpsAccuracyMeters: 50,
  locationUpdateIntervalSeconds: 0,
  notifications: { alertSound: true, pushNotifications: true, escalationTimeoutMinutes: 10 },
  sessionTimeoutMinutes: 60,
  requireLocationPermission: true,
  badgeAsUsername: true,
  wifiAndMobileData: true,
  systemVersion: "2.0.0-ios",
  hazardHotRadius: 200,
  hazardWarmRadius: 500,
  hazardColdRadius: 1000,
  defaultAlarmZoneIds: [1, 2],
};

export function SettingsCenterPage() {
  const settingsQ = useSettings();
  const map = useMapData();
  const zonesQ = useZones();

  const live = settingsQ.data != null;
  const s = settingsQ.data ?? DEMO_SETTINGS;
  const zones = (zonesQ.data?.length ? zonesQ.data : map.zones).filter((z) => z.isActive && !z.isArchived);
  const defaultZones = s.defaultAlarmZoneIds.map((id) => zones.find((z) => z.id === id)).filter(Boolean) as typeof zones;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-medium">Settings</h1>
        {!live && <span className="rounded-md px-2 py-0.5 text-xs text-[var(--keas-text-secondary)]" style={{ background: "var(--keas-surface-2)" }}>demo</span>}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-[var(--keas-text-tertiary)]">
          <Lock size={12} /> Managed from mobile
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section title="General">
          <Row label="System name" value={s.systemName} />
          <Row label="Version" value={s.systemVersion} />
          <Row label="Language" value={(s.language || "").toUpperCase()} />
          <Row label="Timezone" value={(s.timezone || "").toUpperCase()} />
        </Section>

        <Section title="Zone settings">
          <Row label="Auto-detect zone" node={<StatusBadge status={s.autoDetectZone ? "ok" : "warn"} label={s.autoDetectZone ? "Enabled" : "Disabled"} />} />
          <Row label="GPS accuracy" value={`${s.gpsAccuracyMeters}m`} />
        </Section>

        <Section title="Hazard zone defaults" note="Applies to new warning zones">
          <Row label="Hot radius" value={`${s.hazardHotRadius}m`} color="#F87171" />
          <Row label="Warm radius" value={`${s.hazardWarmRadius}m`} color="#FBBF24" />
          <Row label="Cold radius" value={`${s.hazardColdRadius}m`} color="#34D399" />
        </Section>

        <Section title="Default alarm zones">
          {defaultZones.length === 0 ? (
            <div className="py-1.5 text-sm text-[var(--keas-text-secondary)]">No default zones selected.</div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {defaultZones.map((z) => (
                <span key={z.id} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium" style={{ background: "var(--keas-surface-2)" }}>
                  <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: z.color }} /> {z.name}
                </span>
              ))}
            </div>
          )}
        </Section>

        <Section title="Notifications">
          <Row label="Alert sound" node={<StatusBadge status={s.notifications.alertSound ? "ok" : "warn"} label={s.notifications.alertSound ? "Enabled" : "Disabled"} />} />
          <Row label="Push notifications" node={<StatusBadge status={s.notifications.pushNotifications ? "ok" : "warn"} label={s.notifications.pushNotifications ? "Enabled" : "Disabled"} />} />
          <Row label="Escalation timeout" value={`${s.notifications.escalationTimeoutMinutes}m`} />
        </Section>

        <Section title="Security">
          <Row label="Session timeout" value={`${s.sessionTimeoutMinutes}m`} />
          <Row label="Badge as username" node={<StatusBadge status={s.badgeAsUsername ? "ok" : "warn"} label={s.badgeAsUsername ? "Enabled" : "Disabled"} />} />
        </Section>

        <Section title="About">
          <Row label="Application" value="KEAS" />
          <Row label="Version" value={s.systemVersion} />
          <Row label="Support" value="IT - Emergency Systems" />
          <Row label="Contact" value="it-support@khurais.sa" />
        </Section>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-lg)]">
      <div className="mb-2 text-sm font-medium">{title}</div>
      {children}
      {note && <div className="mt-2 text-[11px] text-[var(--keas-text-tertiary)]">{note}</div>}
    </div>
  );
}

function Row({ label, value, node, color }: { label: string; value?: string; node?: React.ReactNode; color?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--keas-border)] py-1.5 text-sm last:border-0">
      <span className="flex items-center gap-2 text-[var(--keas-text-secondary)]">
        {color && <i className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />}
        {label}
      </span>
      {node ?? <span className="font-medium">{value}</span>}
    </div>
  );
}
