import type { Alert, PermissionKey } from '@/types';
import type { AppState } from './types';

// ─── Alert selectors ─────────────────────────────────────────────────────────

// Cache for synthetic zone-alert object (avoids re-creating every render)
let _cachedZoneAlert: Alert | null = null;
let _cachedZoneAlertKey = '';

export const selectActiveAlert = (s: AppState) => {
  const fromAlerts = s.alerts.find(a => a.isActive);
  if (fromAlerts) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return fromAlerts;
  }
  const activeZones = s.zones.filter(z => z.alertActive);
  if (activeZones.length === 0) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return null;
  }
  const first = activeZones[0];
  const activeZoneIds = new Set(activeZones.map(z => z.id));
  const zoneUsers = s.users.filter(u => activeZoneIds.has(u.zoneId) && u.isActive);
  const confirmed = zoneUsers.filter(u => u.status === 'confirmed').length;
  const pending = zoneUsers.filter(u => u.status === 'pending').length;
  const needHelp = zoneUsers.filter(u => u.status === 'need_help').length;
  const total = zoneUsers.length;
  const zoneIdKey = activeZones.map(z => z.id).sort().join(',');
  const cacheKey = `${zoneIdKey}|${first.alertType}|${first.alertMessage}|${first.alertPriority}|${confirmed}|${pending}|${needHelp}|${total}`;

  if (_cachedZoneAlert && _cachedZoneAlertKey === cacheKey) {
    return _cachedZoneAlert;
  }

  _cachedZoneAlert = {
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
  _cachedZoneAlertKey = cacheKey;
  return _cachedZoneAlert;
};

export const selectHasActiveAlert = (s: AppState) =>
  s.alerts.some(a => a.isActive) || s.zones.some(z => z.alertActive);

/** True when ANY emergency condition is active — alert, zone alert, shelter-in, or blackout. */
export const selectIsEmergencyActive = (s: AppState) =>
  s.alerts.some(a => a.isActive) ||
  s.zones.some(z => z.alertActive) ||
  s.emergencyModes.shelterIn ||
  s.emergencyModes.blackout;

/** True only when a real (non-synthetic) alert is active — id !== -1. */
export const selectHasRealAlert = (s: AppState) => s.alerts.some(a => a.isActive);

// ─── Permission selectors ────────────────────────────────────────────────────

/**
 * Pre-built permission selectors — safe to use inline with useStore().
 * These are stable references that will never cause re-render loops.
 */
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

/**
 * @deprecated Use the pre-built selectCan* selectors instead.
 * This factory is unsafe when called inline inside a component render
 * (e.g. useStore(selectCurrentUserHasPermission('x'))) because it creates
 * a new function reference every render, causing infinite re-render loops.
 */
export const selectCurrentUserHasPermission = _permSel;
