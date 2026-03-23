import type { Alert, AlertType, PermissionKey } from '@/types';
import type { AppState } from './types';

// ─── Alert selectors ─────────────────────────────────────────────────────────

export const alertEq = (a: Alert | null, b: Alert | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.isActive === b.isActive &&
    a.zone === b.zone &&
    a.status === b.status &&
    a.timestamp === b.timestamp &&
    a.stats.confirmed === b.stats.confirmed &&
    a.stats.pending === b.stats.pending &&
    a.stats.needHelp === b.stats.needHelp &&
    a.stats.total === b.stats.total
  );
};

export const selectActiveAlert = (s: AppState): Alert | null => {
  try {
    if (!s) {
      console.error('[selectActiveAlert] State is null/undefined!');
      return null;
    }
    if (!Array.isArray(s.alerts)) {
      console.error('[selectActiveAlert] s.alerts is not an array:', typeof s.alerts, s.alerts);
      return null;
    }
    if (!Array.isArray(s.zones)) {
      console.error('[selectActiveAlert] s.zones is not an array:', typeof s.zones, s.zones);
      return null;
    }
    if (!Array.isArray(s.users)) {
      console.error('[selectActiveAlert] s.users is not an array:', typeof s.users, s.users);
      return null;
    }
    if (!s.emergencyModes || typeof s.emergencyModes !== 'object') {
      console.error('[selectActiveAlert] s.emergencyModes is invalid:', typeof s.emergencyModes, s.emergencyModes);
      return null;
    }

    const fromAlerts = s.alerts.find(a => a.isActive);
    if (fromAlerts) return fromAlerts;

    const activeZones = s.zones.filter(z => z.isActive && z.alertActive);
    const hasShelterIn = s.emergencyModes.shelterIn;
    const hasBlackout = s.emergencyModes.blackout;

    if (activeZones.length === 0 && !hasShelterIn && !hasBlackout) {
      return null;
    }

    const activeUsers = s.users.filter(u => u.isActive);
    const confirmed = activeUsers.filter(u => u.status === 'confirmed').length;
    const pending = activeUsers.filter(u => u.status === 'pending').length;
    const needHelp = activeUsers.filter(u => u.status === 'need_help').length;
    const total = activeUsers.length;

    if (activeZones.length > 0) {
      const first = activeZones[0];
      return {
        id: -1,
        type: first.alertType || 'Zone Alert',
        zone: activeZones.map(z => z.name).join(', '),
        title: `${activeZones.length} Zone Alert${activeZones.length > 1 ? 's' : ''}`,
        message: first.alertMessage || '',
        timestamp: first.alertUpdatedAt || new Date().toISOString(),
        sentBy: 'System',
        priority: first.alertPriority || 'High',
        status: 'active' as const,
        isActive: true,
        stats: { confirmed, pending, needHelp, total },
      } as Alert;
    }

    if (hasBlackout) {
      const bZones = Array.isArray(s.emergencyModes.blackoutZones) ? s.emergencyModes.blackoutZones : [];
      const zoneLabel = bZones.length > 0
        ? bZones.join(', ')
        : 'All Zones';
      return {
        id: -1,
        type: 'Blackout',
        zone: zoneLabel,
        title: 'Blackout Active',
        message: 'Blackout mode is active. All lights and non-essential systems should be turned off.',
        timestamp: s.emergencyModes.blackoutActivatedAt || new Date().toISOString(),
        sentBy: 'System',
        priority: 'High',
        status: 'active' as const,
        isActive: true,
        stats: { confirmed, pending, needHelp, total },
      } as Alert;
    }

    const sZones = Array.isArray(s.emergencyModes.shelterInZones) ? s.emergencyModes.shelterInZones : [];
    const shelterZoneLabel = sZones.length > 0
      ? sZones.join(', ')
      : 'All Zones';
    return {
      id: -1,
      type: 'Shelter-in' as AlertType,
      zone: shelterZoneLabel,
      title: 'Shelter In Place Active',
      message: 'Shelter-in-place mode is active. All personnel should remain in their current location.',
      timestamp: s.emergencyModes.shelterInActivatedAt || new Date().toISOString(),
      sentBy: 'System',
      priority: 'High',
      status: 'active' as const,
      isActive: true,
      stats: { confirmed, pending, needHelp, total },
    } as Alert;
  } catch (e: any) {
    console.error('[selectActiveAlert] CRASHED:', e.name, e.message, e.stack);
    return null;
  }
};

export const selectHasActiveAlert = (s: AppState) => {
  try {
    if (!Array.isArray(s?.alerts) || !Array.isArray(s?.zones)) return false;
    return s.alerts.some(a => a.isActive) || s.zones.some(z => z.isActive && z.alertActive);
  } catch (e: any) {
    console.error('[selectHasActiveAlert] CRASHED:', e.name, e.message, e.stack);
    return false;
  }
};

/** True when ANY emergency condition is active — alert, zone alert, shelter-in, or blackout. */
export const selectIsEmergencyActive = (s: AppState) => {
  try {
    if (!s?.emergencyModes) return false;
    return (
      (Array.isArray(s.alerts) && s.alerts.some(a => a.isActive)) ||
      (Array.isArray(s.zones) && s.zones.some(z => z.isActive && z.alertActive)) ||
      s.emergencyModes.shelterIn ||
      s.emergencyModes.blackout
    );
  } catch (e: any) {
    console.error('[selectIsEmergencyActive] CRASHED:', e.name, e.message, e.stack);
    return false;
  }
};

/** True only when a real (non-synthetic) alert is active — id !== -1. */
export const selectHasRealAlert = (s: AppState) => {
  try {
    if (!Array.isArray(s?.alerts)) return false;
    return s.alerts.some(a => a.isActive);
  } catch (e: any) {
    console.error('[selectHasRealAlert] CRASHED:', e.name, e.message, e.stack);
    return false;
  }
};

// ─── Permission selectors ────────────────────────────────────────────────────

/**
 * Pre-built permission selectors — safe to use inline with useStore().
 * These are stable references that will never cause re-render loops.
 */
const _permSel = (permission: PermissionKey) =>
  (s: AppState): boolean => {
    try {
      return s.currentUser ? s.hasPermission(s.currentUser.id, permission) : false;
    } catch (e: any) {
      console.error(`[permSel:${permission}] CRASHED:`, e.name, e.message, e.stack);
      return false;
    }
  };

export const selectCanViewGlobalLiveMap = _permSel('canViewGlobalLiveMap');
export const selectCanPlaceWarningZone = _permSel('canPlaceWarningZone');
export const selectCanEditHazardZone = _permSel('canEditHazardZone');
export const selectCanDeleteHazardZone = _permSel('canDeleteHazardZone');
export const selectCanUnlockHazardZone = _permSel('canUnlockHazardZone');
export const selectCanManageShelters = _permSel('canManageShelters');
export const selectCanReviewAlertMonitor = _permSel('canReviewAlertMonitor');
export const selectCanChangeWindDirection = _permSel('canChangeWindDirection');
export const selectCanActivateEmergencyMode = _permSel('canActivateEmergencyMode');

/**
 * @deprecated Use the pre-built selectCan* selectors instead.
 * This factory is unsafe when called inline inside a component render
 * (e.g. useStore(selectCurrentUserHasPermission('x'))) because it creates
 * a new function reference every render, causing infinite re-render loops.
 */
export const selectCurrentUserHasPermission = _permSel;
