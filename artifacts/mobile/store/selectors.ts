import type { Alert, PermissionKey, AlertSystemState, BannerState } from '@/types';
import type { AppState } from './types';

export const defaultAlertSystemState: AlertSystemState = {
  emergencyMode: null,
  activeAlert: null,
  activeZoneIds: [],
  banners: [],
  lastUpdatedAt: null,
};

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
    a.stats?.confirmed === b.stats?.confirmed &&
    a.stats?.pending === b.stats?.pending &&
    a.stats?.needHelp === b.stats?.needHelp &&
    a.stats?.total === b.stats?.total
  );
};

export const selectActiveAlert = (s: AppState): Alert | null => {
  const alerts = Array.isArray(s.alerts) ? s.alerts : [];
  const zones = Array.isArray(s.zones) ? s.zones : [];
  const users = Array.isArray(s.users) ? s.users : [];
  const em = s.emergencyModes;

  const fromAlerts = alerts.find(a => a.isActive);
  if (fromAlerts) return fromAlerts;

  const activeZones = zones.filter(z => z.isActive && z.alertActive);
  const hasShelterIn = em?.shelterIn ?? false;
  const hasBlackout = em?.blackout ?? false;

  if (activeZones.length === 0 && !hasShelterIn && !hasBlackout) {
    return null;
  }

  const activeUsers = users.filter(u => u.isActive);
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
    const blackoutZones = Array.isArray(em?.blackoutZones) ? em.blackoutZones : [];
    const zoneLabel = blackoutZones.length > 0
      ? blackoutZones.join(', ')
      : 'All Zones';
    return {
      id: -1,
      type: 'Blackout' as Alert['type'],
      zone: zoneLabel,
      title: 'Blackout Active',
      message: 'Blackout mode is active. All lights and non-essential systems should be turned off.',
      timestamp: em?.blackoutActivatedAt || new Date().toISOString(),
      sentBy: 'System',
      priority: 'High',
      status: 'active' as const,
      isActive: true,
      stats: { confirmed, pending, needHelp, total },
    } as Alert;
  }

  const shelterInZones = Array.isArray(em?.shelterInZones) ? em.shelterInZones : [];
  const shelterZoneLabel = shelterInZones.length > 0
    ? shelterInZones.join(', ')
    : 'All Zones';
  return {
    id: -1,
    type: 'Shelter-in' as Alert['type'],
    zone: shelterZoneLabel,
    title: 'Shelter In Place Active',
    message: 'Shelter-in-place mode is active. All personnel should remain in their current location.',
    timestamp: em?.shelterInActivatedAt || new Date().toISOString(),
    sentBy: 'System',
    priority: 'High',
    status: 'active' as const,
    isActive: true,
    stats: { confirmed, pending, needHelp, total },
  } as Alert;
};

export const selectHasActiveAlert = (s: AppState) => {
  const alerts = Array.isArray(s.alerts) ? s.alerts : [];
  const zones = Array.isArray(s.zones) ? s.zones : [];
  return alerts.some(a => a.isActive) || zones.some(z => z.isActive && z.alertActive);
};

export const selectIsEmergencyActive = (s: AppState) => {
  const alerts = Array.isArray(s.alerts) ? s.alerts : [];
  const zones = Array.isArray(s.zones) ? s.zones : [];
  return (
    alerts.some(a => a.isActive) ||
    zones.some(z => z.isActive && z.alertActive) ||
    (s.emergencyModes?.shelterIn ?? false) ||
    (s.emergencyModes?.blackout ?? false)
  );
};

export const selectHasRealAlert = (s: AppState) => {
  const alerts = Array.isArray(s.alerts) ? s.alerts : [];
  return alerts.some(a => a.isActive);
};

let _cachedAlertSystemState: AlertSystemState = defaultAlertSystemState;
let _cachedInputKey = '';

function computeInputKey(s: AppState): string {
  const alerts = Array.isArray(s.alerts) ? s.alerts : [];
  const zones = Array.isArray(s.zones) ? s.zones : [];
  const users = Array.isArray(s.users) ? s.users : [];
  const em = s.emergencyModes;

  const activeAlert = alerts.find(a => a.isActive);
  const activeAlertKey = activeAlert
    ? `${activeAlert.id}:${activeAlert.timestamp}:${activeAlert.status}:${activeAlert.stats?.confirmed ?? 0}:${activeAlert.stats?.pending ?? 0}:${activeAlert.stats?.needHelp ?? 0}:${activeAlert.stats?.total ?? 0}:${activeAlert.message}:${activeAlert.priority}:${activeAlert.zone}`
    : 'none';
  const zoneKey = zones
    .filter(z => z.isActive && z.alertActive)
    .map(z => `${z.id}:${z.alertType}:${z.alertPriority}:${z.alertUpdatedAt}:${z.alertMessage}`)
    .join(',');
  const shelterIn = em?.shelterIn ?? false;
  const blackout = em?.blackout ?? false;
  const siZones = Array.isArray(em?.shelterInZones) ? em.shelterInZones.join(',') : '';
  const boZones = Array.isArray(em?.blackoutZones) ? em.blackoutZones.join(',') : '';
  const siAt = em?.shelterInActivatedAt ?? '';
  const boAt = em?.blackoutActivatedAt ?? '';

  const confirmed = users.filter(u => u.isActive && u.status === 'confirmed').length;
  const pending = users.filter(u => u.isActive && u.status === 'pending').length;
  const needHelp = users.filter(u => u.isActive && u.status === 'need_help').length;

  return `${activeAlertKey}|${zoneKey}|${shelterIn}|${blackout}|${siZones}|${boZones}|${siAt}|${boAt}|${confirmed}:${pending}:${needHelp}`;
}

export const selectAlertSystemState = (s: AppState): AlertSystemState => {
  if (!s || !Array.isArray(s.zones) || !Array.isArray(s.alerts)) {
    return defaultAlertSystemState;
  }

  const key = computeInputKey(s);
  if (key === _cachedInputKey) {
    return _cachedAlertSystemState;
  }

  const zones = s.zones;
  const em = s.emergencyModes;

  const activeZones = zones.filter(z => z.isActive && z.alertActive);
  const activeZoneIds = activeZones.map(z => z.id);
  const hasShelterIn = em?.shelterIn ?? false;
  const hasBlackout = em?.blackout ?? false;
  const realAlert = (Array.isArray(s.alerts) ? s.alerts : []).find(a => a.isActive) ?? null;

  const banners: BannerState[] = [];
  if (hasShelterIn) {
    const bZones = Array.isArray(em?.shelterInZones) ? em.shelterInZones : [];
    banners.push({
      type: 'shelterIn',
      label: 'Shelter In Place Active',
      zones: bZones,
      activatedAt: em?.shelterInActivatedAt ?? null,
    });
  }
  if (hasBlackout) {
    const bZones = Array.isArray(em?.blackoutZones) ? em.blackoutZones : [];
    banners.push({
      type: 'blackout',
      label: 'Blackout Active',
      zones: bZones,
      activatedAt: em?.blackoutActivatedAt ?? null,
    });
  }
  if (activeZones.length > 0) {
    banners.push({
      type: 'zoneAlert',
      label: `${activeZones.length} Zone Alert${activeZones.length > 1 ? 's' : ''}`,
      zones: activeZones.map(z => z.name),
      activatedAt: activeZones[0]?.alertUpdatedAt ?? null,
    });
  }

  let emergencyMode: AlertSystemState['emergencyMode'] = null;
  if (realAlert) {
    emergencyMode = 'broadcastAlert';
  } else if (activeZones.length > 0) {
    emergencyMode = 'zoneAlert';
  } else if (hasBlackout) {
    emergencyMode = 'blackout';
  } else if (hasShelterIn) {
    emergencyMode = 'shelterIn';
  }

  const activeAlert = selectActiveAlert(s);

  let lastUpdatedAt: string | null = null;
  if (realAlert) {
    lastUpdatedAt = realAlert.timestamp;
  } else if (activeZones.length > 0) {
    lastUpdatedAt = activeZones[0]?.alertUpdatedAt ?? null;
  } else if (hasBlackout) {
    lastUpdatedAt = em?.blackoutActivatedAt ?? null;
  } else if (hasShelterIn) {
    lastUpdatedAt = em?.shelterInActivatedAt ?? null;
  }

  const result: AlertSystemState = {
    emergencyMode,
    activeAlert,
    activeZoneIds,
    banners,
    lastUpdatedAt,
  };

  _cachedInputKey = key;
  _cachedAlertSystemState = result;
  return result;
};

const _permSel = (permission: PermissionKey) =>
  (s: AppState): boolean => s.currentUser ? s.hasPermission(s.currentUser.id, permission) : false;

export const selectCanViewGlobalLiveMap = _permSel('canViewGlobalLiveMap');
export const selectCanPlaceWarningZone = _permSel('canPlaceWarningZone');
export const selectCanEditHazardZone = _permSel('canEditHazardZone');
export const selectCanDeleteHazardZone = _permSel('canDeleteHazardZone');
export const selectCanUnlockHazardZone = _permSel('canUnlockHazardZone');
export const selectCanManageShelters = _permSel('canManageShelters');
export const selectCanReviewAlertMonitor = _permSel('canReviewAlertMonitor');
export const selectCanChangeWindDirection = _permSel('canChangeWindDirection');

export const selectCurrentUserHasPermission = _permSel;
