import type { Alert, PermissionKey, AlertSystemState, BannerState } from '@/types';
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
    a.stats?.confirmed === b.stats?.confirmed &&
    a.stats?.pending === b.stats?.pending &&
    a.stats?.needHelp === b.stats?.needHelp &&
    a.stats?.total === b.stats?.total
  );
};

export const selectActiveAlert = (s: AppState): Alert | null => {
  const fromAlerts = s.alerts.find(a => a.isActive);
  if (fromAlerts) return fromAlerts;

  const activeZones = s.zones.filter(z => z.isActive && z.alertActive);
  const hasShelterIn = s.emergencyModes?.shelterIn ?? false;
  const hasBlackout = s.emergencyModes?.blackout ?? false;

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
    const blackoutZones = s.emergencyModes?.blackoutZones ?? [];
    const zoneLabel = blackoutZones.length > 0
      ? blackoutZones.join(', ')
      : 'All Zones';
    return {
      id: -1,
      type: 'Blackout' as Alert['type'],
      zone: zoneLabel,
      title: 'Blackout Active',
      message: 'Blackout mode is active. All lights and non-essential systems should be turned off.',
      timestamp: s.emergencyModes?.blackoutActivatedAt || new Date().toISOString(),
      sentBy: 'System',
      priority: 'High',
      status: 'active' as const,
      isActive: true,
      stats: { confirmed, pending, needHelp, total },
    } as Alert;
  }

  const shelterInZones = s.emergencyModes?.shelterInZones ?? [];
  const shelterZoneLabel = shelterInZones.length > 0
    ? shelterInZones.join(', ')
    : 'All Zones';
  return {
    id: -1,
    type: 'Shelter-in' as Alert['type'],
    zone: shelterZoneLabel,
    title: 'Shelter In Place Active',
    message: 'Shelter-in-place mode is active. All personnel should remain in their current location.',
    timestamp: s.emergencyModes?.shelterInActivatedAt || new Date().toISOString(),
    sentBy: 'System',
    priority: 'High',
    status: 'active' as const,
    isActive: true,
    stats: { confirmed, pending, needHelp, total },
  } as Alert;
};

export const selectHasActiveAlert = (s: AppState) =>
  s.alerts.some(a => a.isActive) || s.zones.some(z => z.isActive && z.alertActive);

/** True when ANY emergency condition is active — alert, zone alert, shelter-in, or blackout. */
export const selectIsEmergencyActive = (s: AppState) =>
  s.alerts.some(a => a.isActive) ||
  s.zones.some(z => z.isActive && z.alertActive) ||
  (s.emergencyModes?.shelterIn ?? false) ||
  (s.emergencyModes?.blackout ?? false);

/** True only when a real (non-synthetic) alert is active — id !== -1. */
export const selectHasRealAlert = (s: AppState) => s.alerts.some(a => a.isActive);

// ─── Unified Alert System State ─────────────────────────────────────────────

/**
 * Single canonical selector that ALL screens should use.
 * Returns the complete AlertSystemState — one source of truth for:
 *   - What emergency mode is active
 *   - The active alert (real or synthesized)
 *   - Which zones have alerts
 *   - What banners to show
 *   - Last update timestamp
 */
export const selectAlertSystemState = (s: AppState): AlertSystemState => {
  const activeZones = s.zones.filter(z => z.isActive && z.alertActive);
  const activeZoneIds = activeZones.map(z => z.id);
  const hasShelterIn = s.emergencyModes?.shelterIn ?? false;
  const hasBlackout = s.emergencyModes?.blackout ?? false;
  const realAlert = s.alerts.find(a => a.isActive) ?? null;

  // Build banners
  const banners: BannerState[] = [];
  if (hasShelterIn) {
    const zones = s.emergencyModes?.shelterInZones ?? [];
    banners.push({
      type: 'shelterIn',
      label: 'Shelter In Place Active',
      zones,
      activatedAt: s.emergencyModes?.shelterInActivatedAt ?? null,
    });
  }
  if (hasBlackout) {
    const zones = s.emergencyModes?.blackoutZones ?? [];
    banners.push({
      type: 'blackout',
      label: 'Blackout Active',
      zones,
      activatedAt: s.emergencyModes?.blackoutActivatedAt ?? null,
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

  // Determine emergency mode
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

  // Get the canonical active alert (use existing selectActiveAlert logic)
  const activeAlert = selectActiveAlert(s);

  // Determine last updated timestamp
  let lastUpdatedAt: string | null = null;
  if (realAlert) {
    lastUpdatedAt = realAlert.timestamp;
  } else if (activeZones.length > 0) {
    lastUpdatedAt = activeZones[0]?.alertUpdatedAt ?? null;
  } else if (hasBlackout) {
    lastUpdatedAt = s.emergencyModes?.blackoutActivatedAt ?? null;
  } else if (hasShelterIn) {
    lastUpdatedAt = s.emergencyModes?.shelterInActivatedAt ?? null;
  }

  return {
    emergencyMode,
    activeAlert,
    activeZoneIds,
    banners,
    lastUpdatedAt,
  };
};

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
