// Shared, platform-agnostic emergency-intelligence engine.
// Faithful port of the mobile hooks/useEmergencyIntelligence.ts logic so the web
// command center computes the SAME per-zone/per-location severity, missing/help
// counts, and suggested actions as the mobile app (no web-original logic).
import type { UserResponseStatus } from './types';

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
  priority: 'critical' | 'high' | 'medium';
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

export const EMPTY_INTELLIGENCE: EmergencyIntelligence = {
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

type IntelUser = {
  id: number;
  status: UserResponseStatus;
  zoneId: number;
  locationId: number;
  location?: string;
  isActive: boolean;
  escalationLevel?: number;
};
type IntelZone = {
  id: number;
  name: string;
  color: string;
  alertActive: boolean;
  alertTargetScope?: 'zone' | 'locations';
  alertTargetLocationIds?: number[];
};
type IntelLocation = { id: number; name: string };

/**
 * Compute emergency intelligence over the active incident. Active zones are the
 * zones with alertActive=true (web's emergencyMode signal). Returns EMPTY when no
 * zone alert is active — exactly like the mobile hook returns EMPTY when not in
 * emergencyMode.
 */
export function computeEmergencyIntelligence(
  users: IntelUser[],
  zones: IntelZone[],
  locations: IntelLocation[],
): EmergencyIntelligence {
  const activeZones = zones.filter((z) => z.alertActive);
  const activeZoneIds = activeZones.map((z) => z.id);
  if (activeZoneIds.length === 0) return EMPTY_INTELLIGENCE;

  const activeZoneIdSet = new Set(activeZoneIds);
  const zoneScopeMap = new Map<number, { scope: 'zone' | 'locations'; locIds: Set<number> }>();
  for (const z of activeZones) {
    const s = z.alertTargetScope ?? 'zone';
    const ids =
      s === 'locations' && Array.isArray(z.alertTargetLocationIds)
        ? new Set(z.alertTargetLocationIds)
        : new Set<number>();
    zoneScopeMap.set(z.id, { scope: s, locIds: ids });
  }

  const activeUsers = users.filter((u) => {
    if (!u.isActive) return false;
    if (!activeZoneIdSet.has(u.zoneId)) return false;
    const zs = zoneScopeMap.get(u.zoneId);
    if (zs && zs.scope === 'locations' && !zs.locIds.has(u.locationId)) return false;
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
        zoneId: zone.id, zoneName: zone.name, zoneColor: zone.color,
        missingCount: 0, needHelpCount: 0, pendingCount: 0, safeCount: 0,
        totalCount: 0, severity: 0, locations: [],
      });
    }
    const zi = zoneMap.get(zone.id)!;
    zi.totalCount++;
    if (u.status === 'need_help') {
      zi.needHelpCount++;
      allNeedHelpIds.push(u.id);
    } else if (u.status === 'confirmed') {
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
        locationId: u.locationId, locationName: loc?.name ?? u.location ?? 'Unknown',
        zoneId: zone.id, zoneName: zone.name,
        missingCount: 0, needHelpCount: 0, pendingCount: 0, safeCount: 0,
        totalCount: 0, criticalUserIds: [], needHelpUserIds: [],
      });
    }
    const li = locMap.get(locKey)!;
    li.totalCount++;
    if (u.status === 'need_help') {
      li.needHelpCount++;
      li.needHelpUserIds.push(u.id);
    } else if (u.status === 'confirmed') {
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
    zi.locations.sort(
      (a, b) => b.needHelpCount * 10 + b.missingCount * 5 - (a.needHelpCount * 10 + a.missingCount * 5),
    );
  }

  const allZones = Array.from(zoneMap.values()).sort((a, b) => b.severity - a.severity);
  const criticalZones = allZones.filter((z) => z.needHelpCount > 0 || z.missingCount > 0);

  const actions: SuggestedAction[] = [];
  let actionIdx = 0;
  for (const z of criticalZones) {
    for (const loc of z.locations) {
      if (loc.needHelpCount > 0) {
        actions.push({
          id: `action-${actionIdx++}`, priority: 'critical', icon: 'alert-octagon',
          title: 'Immediate Action Required',
          description: `Dispatch response team to ${loc.locationName} — ${loc.needHelpCount} requesting help`,
          zoneId: z.zoneId, locationId: loc.locationId,
        });
      }
      if (loc.missingCount > 0) {
        actions.push({
          id: `action-${actionIdx++}`, priority: 'high', icon: 'alert-triangle',
          title: 'Verify Personnel',
          description: `Supervisor must verify ${loc.missingCount} missing personnel in ${loc.locationName}`,
          zoneId: z.zoneId, locationId: loc.locationId,
        });
      }
    }
  }
  const order = { critical: 0, high: 1, medium: 2 };
  actions.sort((a, b) => order[a.priority] - order[b.priority]);

  return {
    isActive: true,
    zones: allZones,
    criticalZones,
    totalMissing: allZones.reduce((s, z) => s + z.missingCount, 0),
    totalNeedHelp: allZones.reduce((s, z) => s + z.needHelpCount, 0),
    totalPending: allZones.reduce((s, z) => s + z.pendingCount, 0),
    totalSafe: allZones.reduce((s, z) => s + z.safeCount, 0),
    totalPersonnel: allZones.reduce((s, z) => s + z.totalCount, 0),
    suggestedActions: actions,
    criticalUserIds: allCriticalIds,
    needHelpUserIds: allNeedHelpIds,
    hasCriticalSituation: false || allZones.some((z) => z.needHelpCount > 0 || z.missingCount > 0),
  };
}
