import type { Alert, PermissionKey } from '@/types';
import type { AppState } from './types';

// ─── Alert selectors ─────────────────────────────────────────────────────────

let _cachedSyntheticAlert: Alert | null = null;
let _cachedSyntheticKey = '';

export const selectActiveAlert = (s: AppState) => {
  const fromAlerts = s.alerts.find(a => a.isActive);
  if (fromAlerts) {
    _cachedSyntheticAlert = null;
    _cachedSyntheticKey = '';
    return fromAlerts;
  }

  const activeZones = s.zones.filter(z => z.alertActive);
  const hasShelterIn = s.emergencyModes.shelterIn;
  const hasBlackout = s.emergencyModes.blackout;

  if (activeZones.length === 0 && !hasShelterIn && !hasBlackout) {
    _cachedSyntheticAlert = null;
    _cachedSyntheticKey = '';
    return null;
  }

  const activeUsers = s.users.filter(u => u.isActive);
  const confirmed = activeUsers.filter(u => u.status === 'confirmed').length;
  const pending = activeUsers.filter(u => u.status === 'pending').length;
  const needHelp = activeUsers.filter(u => u.status === 'need_help').length;
  const total = activeUsers.length;

  let type: string;
  let zone: string;
  let title: string;
  let message: string;
  let timestamp: string;
  let priority: string;

  if (activeZones.length > 0) {
    const first = activeZones[0];
    type = first.alertType || 'Zone Alert';
    zone = activeZones.map(z => z.name).join(', ');
    title = `${activeZones.length} Zone Alert${activeZones.length > 1 ? 's' : ''}`;
    message = first.alertMessage || '';
    timestamp = first.alertUpdatedAt || new Date().toISOString();
    priority = first.alertPriority || 'High';
  } else if (hasBlackout) {
    type = 'Blackout';
    zone = 'All Zones';
    title = 'Blackout Active';
    message = 'Blackout mode is active. All lights and non-essential systems should be turned off.';
    timestamp = s.emergencyModes.blackoutActivatedAt || new Date().toISOString();
    priority = 'High';
  } else {
    type = 'Shelter In Place';
    zone = 'All Zones';
    title = 'Shelter In Place Active';
    message = 'Shelter-in-place mode is active. All personnel should remain in their current location.';
    timestamp = s.emergencyModes.shelterInActivatedAt || new Date().toISOString();
    priority = 'High';
  }

  const zoneIdKey = activeZones.map(z => z.id).sort().join(',');
  const cacheKey = `zones:${zoneIdKey}|type:${type}|si:${hasShelterIn}|bo:${hasBlackout}|c:${confirmed}|p:${pending}|h:${needHelp}|t:${total}`;

  if (_cachedSyntheticAlert && _cachedSyntheticKey === cacheKey) {
    return _cachedSyntheticAlert;
  }

  _cachedSyntheticAlert = {
    id: -1,
    type,
    zone,
    title,
    message,
    timestamp,
    sentBy: 'System',
    priority,
    status: 'active' as const,
    isActive: true,
    stats: { confirmed, pending, needHelp, total },
  } as Alert;
  _cachedSyntheticKey = cacheKey;
  return _cachedSyntheticAlert;
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
