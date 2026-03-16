import { useMemo } from "react";
import type { User, Zone, Alert } from "@/types";
import type { ZoneStats } from "@/components/ui/ZoneBreakdown";

export function useZoneBreakdown(
  users: User[],
  zones: Zone[],
  activeAlert: Alert | null
): ZoneStats[] {
  return useMemo(() => {
    if (!activeAlert) return [];

    const isAllZones =
      activeAlert.zone === "All Zones" || activeAlert.zone === "all";

    const activeZones = zones.filter((z) => z.isActive);

    const targetZoneNames = isAllZones
      ? activeZones.map((z) => z.name)
      : [activeAlert.zone];

    const zoneColorMap = new Map<string, string>();
    for (const z of zones) {
      zoneColorMap.set(z.name, z.color);
    }

    const zoneIdMap = new Map<string, number>();
    for (const z of zones) zoneIdMap.set(z.name, z.id);

    return targetZoneNames.map((zoneName) => {
      const zId = zoneIdMap.get(zoneName);
      const zoneUsers = users.filter((u) => zId !== undefined && u.zoneId === zId);
      return {
        zoneName,
        zoneColor: zoneColorMap.get(zoneName) || "#6B7280",
        confirmed: zoneUsers.filter((u) => u.status === "confirmed").length,
        missing: zoneUsers.filter((u) => u.status === "missing").length,
        noReply: zoneUsers.filter((u) => u.status === "no_reply").length,
        needHelp: zoneUsers.filter((u) => u.status === "need_help").length,
        total: zoneUsers.length,
      };
    });
  }, [users, zones, activeAlert]);
}
