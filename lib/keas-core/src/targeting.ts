// Shared, platform-agnostic emergency-targeting logic.
// Mirrors the mobile location-scope fix (store/selectors.ts) so mobile and web
// agree on who a location-scoped alert targets and how its stats are counted.

import type { Zone, UserResponseStatus, AlertStats } from './types';

/**
 * A location-scoped zone alert (alertTargetScope === 'locations') only targets
 * users whose locationId is in alertTargetLocationIds. A whole-zone alert
 * (scope 'zone') targets the whole zone.
 */
export function userMatchesZoneScope(
  zone: Pick<Zone, 'alertTargetScope' | 'alertTargetLocationIds'>,
  user: { locationId: number },
): boolean {
  if (zone.alertTargetScope === 'locations') {
    const ids = Array.isArray(zone.alertTargetLocationIds) ? zone.alertTargetLocationIds : [];
    return ids.includes(user.locationId);
  }
  return true;
}

/**
 * Whether a user is targeted by an active zone alert (zone must be active and the
 * user must be in the zone and pass the location scope).
 */
export function isUserTargetedByZone(
  zone: Pick<Zone, 'id' | 'isActive' | 'alertActive' | 'alertTargetScope' | 'alertTargetLocationIds'>,
  user: { zoneId: number; locationId: number },
): boolean {
  if (!zone.isActive || !zone.alertActive) return false;
  if (zone.id !== user.zoneId) return false;
  return userMatchesZoneScope(zone, user);
}

/**
 * Count confirmed/pending/needHelp/total over the users who are in an active zone
 * AND match that zone's location scope. Used for responder dashboards/stats so
 * a selected-locations alert counts only targeted users (mirrors the mobile fix).
 */
export function scopedAlertStats(
  activeZones: Array<Pick<Zone, 'id' | 'alertTargetScope' | 'alertTargetLocationIds'>>,
  users: Array<{ zoneId: number; locationId: number; status: UserResponseStatus; isActive: boolean }>,
): AlertStats {
  const zoneMap = new Map(activeZones.map((z) => [z.id, z]));
  const scoped = users.filter((u) => {
    if (!u.isActive) return false;
    const z = zoneMap.get(u.zoneId);
    return z ? userMatchesZoneScope(z, u) : false;
  });
  return {
    confirmed: scoped.filter((u) => u.status === 'confirmed').length,
    pending: scoped.filter((u) => u.status === 'pending').length,
    needHelp: scoped.filter((u) => u.status === 'need_help').length,
    total: scoped.length,
  };
}
