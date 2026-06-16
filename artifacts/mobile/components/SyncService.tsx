import { useEffect } from "react";
import { useStore } from "@/store";
import { pushEntity } from "@/lib/sync";

// Feature flag — OFF by default. When off, SyncService renders null and runs
// nothing, so existing mobile behavior is completely unchanged (additive only).
// Enable per build with EXPO_PUBLIC_SYNC_ENABLED=true.
const SYNC_ENABLED = process.env.EXPO_PUBLIC_SYNC_ENABLED === "true";
const SYNC_INTERVAL_MS = 15_000;

export function SyncService() {
  if (!SYNC_ENABLED) return null;
  return <SyncServiceInner />;
}

function SyncServiceInner() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const syncAll = async () => {
      const s = useStore.getState();
      // Operational entities only. Users are intentionally NOT synced — no
      // credentials on the wire; the auth flow stays mobile-local and untouched.
      const batches: Array<[string, unknown[]]> = [
        ["zones", s.zones],
        ["locations", s.locations],
        ["streets", s.streets],
        ["routes", s.ecoRoutes],
        ["alerts", s.alerts],
        ["shelters", s.shelters],
        ["personnel", Object.values(s.personnelLocations ?? {})],
        ["incidentEvents", s.incidentTimeline],
        ["settings", [s.settings]],
      ];
      for (const [entity, records] of batches) {
        if (cancelled) return;
        await pushEntity(entity, records).catch(() => {
          // backend unreachable / not provisioned — sync is best-effort
        });
      }
    };

    syncAll();
    const id = setInterval(() => {
      if (!cancelled) syncAll();
    }, SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isAuthenticated]);

  return null;
}
