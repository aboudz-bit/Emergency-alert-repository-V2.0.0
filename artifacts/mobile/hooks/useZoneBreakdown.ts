import { useMemo } from "react";
import type { User, Zone, Alert } from "@/types";
import type { ZoneStats } from "@/components/ui/ZoneBreakdown";

const DEFAULT_ZONE_COLORS: Record<string, string> = {
  CPF: "#EF4444",
  Camp: "#3B82F6",
};

export function useZoneBreakdown(
  users: User[],
  zones: Zone[],
  activeAlert: Alert | null
): ZoneStats[] {
  return useMemo(() => {
    if (!activeAlert) return [];

    const isAllZones =
      activeAlert.zone === "All Zones" || activeAlert.zone === "all";
    const targetZones = isAllZones
      ? [...new Set(users.map((u) => u.zone))]
      : [activeAlert.zone];

    const zoneColorMap = new Map<string, string>();
    for (const z of zones) {
      zoneColorMap.set(z.name, z.color);
    }

    return targetZones.map((zoneName) => {
      const zoneUsers = users.filter((u) => u.zone === zoneName);
      return {
        zoneName,
        zoneColor:
          zoneColorMap.get(zoneName) ||
          DEFAULT_ZONE_COLORS[zoneName] ||
          "#6B7280",
        confirmed: zoneUsers.filter((u) => u.status === "confirmed").length,
        missing: zoneUsers.filter((u) => u.status === "missing").length,
        noReply: zoneUsers.filter((u) => u.status === "no_reply").length,
        needHelp: zoneUsers.filter((u) => u.status === "need_help").length,
        total: zoneUsers.length,
      };
    });
  }, [users, zones, activeAlert]);
}
