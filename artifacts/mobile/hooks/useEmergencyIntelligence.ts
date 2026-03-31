import { useMemo } from "react";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";

export interface LocationIntelligence {
  locationId: number;
  locationName: string;
  zoneId: number;
  zoneName: string;
  missingCount: number;
  needHelpCount: number;
  pendingCount: number;
  safeCount: number;
  totalCount: number;
  criticalUserIds: number[];
  needHelpUserIds: number[];
}

export interface ZoneIntelligence {
  zoneId: number;
  zoneName: string;
  zoneColor: string;
  missingCount: number;
  needHelpCount: number;
  pendingCount: number;
  safeCount: number;
  totalCount: number;
  severity: number;
  locations: LocationIntelligence[];
}

export interface SuggestedAction {
  id: string;
  priority: "critical" | "high" | "medium";
  icon: string;
  title: string;
  description: string;
  zoneId?: number;
  locationId?: number;
}

export interface EmergencyIntelligence {
  isActive: boolean;
  zones: ZoneIntelligence[];
  criticalZones: ZoneIntelligence[];
  totalMissing: number;
  totalNeedHelp: number;
  totalPending: number;
  totalSafe: number;
  totalPersonnel: number;
  suggestedActions: SuggestedAction[];
  criticalUserIds: number[];
  needHelpUserIds: number[];
  hasCriticalSituation: boolean;
}

const EMPTY: EmergencyIntelligence = {
  isActive: false,
  zones: [],
  criticalZones: [],
  totalMissing: 0,
  totalNeedHelp: 0,
  totalPending: 0,
  totalSafe: 0,
  totalPersonnel: 0,
  suggestedActions: [],
  criticalUserIds: [],
  needHelpUserIds: [],
  hasCriticalSituation: false,
};

export function useEmergencyIntelligence(scope?: {
  type: "all" | "zone" | "location";
  zoneId?: number;
  locationId?: number;
}): EmergencyIntelligence {
  const { emergencyMode, activeZoneIds } = useAlertSystemState();
  const users = useStore((s) => s.users);
  const zones = useStore((s) => s.zones);
  const locations = useStore((s) => s.locations);

  const scopeType = scope?.type ?? "all";
  const scopeZoneId = scope?.zoneId;
  const scopeLocationId = scope?.locationId;

  return useMemo(() => {
    if (!emergencyMode) return EMPTY;
    if (scopeType === "location" && scopeLocationId == null) return EMPTY;
    if (scopeType === "zone" && scopeZoneId != null && !activeZoneIds.includes(scopeZoneId)) return EMPTY;

    const activeZoneIdSet = new Set(activeZoneIds);
    const activeUsers = users.filter((u) => {
      if (!u.isActive) return false;
      if (!activeZoneIdSet.has(u.zoneId)) return false;
      if (scopeType === "zone" && scopeZoneId != null && u.zoneId !== scopeZoneId) return false;
      if (scopeType === "location" && u.locationId !== scopeLocationId) return false;
      return true;
    });

    const zoneMap = new Map<number, ZoneIntelligence>();
    const allCriticalIds: number[] = [];
    const allNeedHelpIds: number[] = [];

    for (const u of activeUsers) {
      const zone = zones.find((z) => z.id === u.zoneId);
      if (!zone) continue;

      if (!zoneMap.has(zone.id)) {
        zoneMap.set(zone.id, {
          zoneId: zone.id,
          zoneName: zone.name,
          zoneColor: zone.color,
          missingCount: 0,
          needHelpCount: 0,
          pendingCount: 0,
          safeCount: 0,
          totalCount: 0,
          severity: 0,
          locations: [],
        });
      }
      const zi = zoneMap.get(zone.id)!;
      zi.totalCount++;

      if (u.status === "need_help") {
        zi.needHelpCount++;
        allNeedHelpIds.push(u.id);
      } else if (u.status === "confirmed") {
        zi.safeCount++;
      } else if ((u.escalationLevel ?? 0) >= 2) {
        zi.missingCount++;
        allCriticalIds.push(u.id);
      } else {
        zi.pendingCount++;
      }
    }

    const locMap = new Map<string, LocationIntelligence>();
    for (const u of activeUsers) {
      const zone = zones.find((z) => z.id === u.zoneId);
      const loc = locations.find((l) => l.id === u.locationId);
      if (!zone) continue;
      const locKey = `${zone.id}-${u.locationId}`;

      if (!locMap.has(locKey)) {
        locMap.set(locKey, {
          locationId: u.locationId,
          locationName: loc?.name ?? u.location ?? "Unknown",
          zoneId: zone.id,
          zoneName: zone.name,
          missingCount: 0,
          needHelpCount: 0,
          pendingCount: 0,
          safeCount: 0,
          totalCount: 0,
          criticalUserIds: [],
          needHelpUserIds: [],
        });
      }
      const li = locMap.get(locKey)!;
      li.totalCount++;

      if (u.status === "need_help") {
        li.needHelpCount++;
        li.needHelpUserIds.push(u.id);
      } else if (u.status === "confirmed") {
        li.safeCount++;
      } else if ((u.escalationLevel ?? 0) >= 2) {
        li.missingCount++;
        li.criticalUserIds.push(u.id);
      } else {
        li.pendingCount++;
      }
    }

    for (const li of locMap.values()) {
      const zi = zoneMap.get(li.zoneId);
      if (zi) zi.locations.push(li);
    }

    for (const zi of zoneMap.values()) {
      zi.severity = zi.needHelpCount * 10 + zi.missingCount * 5 + zi.pendingCount;
      zi.locations.sort((a, b) => (b.needHelpCount * 10 + b.missingCount * 5) - (a.needHelpCount * 10 + a.missingCount * 5));
    }

    const allZones = Array.from(zoneMap.values()).sort((a, b) => b.severity - a.severity);
    const criticalZones = allZones.filter((z) => z.needHelpCount > 0 || z.missingCount > 0);

    const actions: SuggestedAction[] = [];
    let actionIdx = 0;

    for (const z of criticalZones) {
      for (const loc of z.locations) {
        if (loc.needHelpCount > 0) {
          actions.push({
            id: `action-${actionIdx++}`,
            priority: "critical",
            icon: "alert-octagon",
            title: "Immediate Action Required",
            description: `Dispatch response team to ${loc.locationName} — ${loc.needHelpCount} requesting help`,
            zoneId: z.zoneId,
            locationId: loc.locationId,
          });
        }
        if (loc.missingCount > 0) {
          actions.push({
            id: `action-${actionIdx++}`,
            priority: "high",
            icon: "alert-triangle",
            title: "Verify Personnel",
            description: `Supervisor must verify ${loc.missingCount} missing personnel in ${loc.locationName}`,
            zoneId: z.zoneId,
            locationId: loc.locationId,
          });
        }
      }
    }

    actions.sort((a, b) => {
      const p = { critical: 0, high: 1, medium: 2 };
      return p[a.priority] - p[b.priority];
    });

    const totalMissing = allZones.reduce((s, z) => s + z.missingCount, 0);
    const totalNeedHelp = allZones.reduce((s, z) => s + z.needHelpCount, 0);
    const totalPending = allZones.reduce((s, z) => s + z.pendingCount, 0);
    const totalSafe = allZones.reduce((s, z) => s + z.safeCount, 0);
    const totalPersonnel = allZones.reduce((s, z) => s + z.totalCount, 0);

    return {
      isActive: true,
      zones: allZones,
      criticalZones,
      totalMissing,
      totalNeedHelp,
      totalPending,
      totalSafe,
      totalPersonnel,
      suggestedActions: actions,
      criticalUserIds: allCriticalIds,
      needHelpUserIds: allNeedHelpIds,
      hasCriticalSituation: totalNeedHelp > 0 || totalMissing > 0,
    };
  }, [emergencyMode, activeZoneIds, users, zones, locations, scopeType, scopeZoneId, scopeLocationId]);
}
