import type { SetState, GetState, AppState } from '../types';
import type { AlertNotification } from '@/types';
import { nextHistoryId } from '../helpers';

export function createZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addZone' | 'updateZone' | 'deleteZone' |
  'archiveZone' | 'restoreZone' | 'safeDeleteZone' |
  'bulkReassignUsersToZone' | 'renameZone' |
  'reorderZones' | 'reorderLocations' |
  'activateZoneAlert' | 'deactivateZoneAlert' | 'editZoneAlert' |
  'bulkActivateZoneAlerts' | 'bulkDeactivateZoneAlerts' |
  'sendZoneNotification' | 'sendAlertNotification'
> {
  return {
    addZone: (zone) => set(s => ({ zones: [...s.zones, { ...zone, id: Date.now() }] })),
    updateZone: (id, partial) => set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...partial } : z) })),
    deleteZone: (id) => {
      const { zones, locations } = get();
      console.log('[deleteZone] called with id:', id, 'typeof:', typeof id, 'zones count:', zones.length);
      const zone = zones.find(z => z.id === id);
      if (!zone) { console.log('[deleteZone] zone not found'); return; }
      if (zone.alertActive) { console.log('[deleteZone] blocked: zone has active alert'); return; }
      const hasActiveChildAlert = locations.some(l => l.zoneId === id && l.alertActive);
      if (hasActiveChildAlert) { console.log('[deleteZone] blocked: location has active alert'); return; }
      set(s => ({
        zones: s.zones.filter(z => z.id !== id),
        locations: s.locations.filter(l => l.zoneId !== id),
      }));
      console.log('[deleteZone] done. new zones count:', get().zones.length);
    },

    archiveZone: (id) => {
      const before = get().zones.find(z => z.id === id);
      console.log('[archiveZone] called with id:', id, 'typeof:', typeof id, 'found:', !!before, 'wasArchived:', before?.isArchived);
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, isArchived: true } : z),
      }));
      const after = get().zones.find(z => z.id === id);
      console.log('[archiveZone] done. isArchived now:', after?.isArchived);
    },

    restoreZone: (id) => {
      console.log('[restoreZone] called with id:', id);
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, isArchived: false } : z),
      }));
      console.log('[restoreZone] done. isArchived now:', get().zones.find(z => z.id === id)?.isArchived);
    },

    safeDeleteZone: (id) => {
      const { zones, locations, shelters, users, hazardZones, alerts } = get();
      console.log('[safeDeleteZone] called with id:', id, 'typeof:', typeof id, 'zones count:', zones.length);
      const zone = zones.find(z => z.id === id);
      if (!zone) {
        console.log('[safeDeleteZone] zone NOT FOUND. zone ids:', zones.map(z => ({ id: z.id, type: typeof z.id })));
        return { success: false, error: 'Zone not found.' };
      }

      const activeLocations = locations.filter(l => l.zoneId === id);
      const activeShelters = shelters.filter(s => s.zoneId === id);
      const activeUsers = users.filter(u => u.zoneId === id);
      const hasActiveAlert = zone.alertActive === true;
      const activeHazardZones = hazardZones.filter(hz => hz.zoneId === id);
      const activeLinkedAlerts = alerts.filter(a => a.isActive && a.zone === zone.name);

      const hasLocations = activeLocations.length > 0;
      const hasShelters = activeShelters.length > 0;
      const hasUsers = activeUsers.length > 0;
      const hasHazardZones = activeHazardZones.length > 0;
      const hasLinkedAlerts = activeLinkedAlerts.length > 0;

      console.log('[safeDeleteZone] checks:', { hasLocations, hasShelters, hasUsers, hasActiveAlert, hasHazardZones, hasLinkedAlerts });

      if (hasLocations || hasShelters || hasUsers || hasActiveAlert || hasHazardZones || hasLinkedAlerts) {
        const reasons: string[] = [];
        if (hasLocations) reasons.push(`${activeLocations.length} location${activeLocations.length > 1 ? 's' : ''}`);
        if (hasShelters) reasons.push(`${activeShelters.length} shelter${activeShelters.length > 1 ? 's' : ''}`);
        if (hasUsers) reasons.push(`${activeUsers.length} user${activeUsers.length > 1 ? 's' : ''}`);
        if (hasActiveAlert) reasons.push('an active alert');
        if (hasHazardZones) reasons.push(`${activeHazardZones.length} warning zone${activeHazardZones.length > 1 ? 's' : ''}`);
        if (hasLinkedAlerts) reasons.push(`${activeLinkedAlerts.length} active linked alert${activeLinkedAlerts.length > 1 ? 's' : ''}`);
        const error = `Cannot delete "${zone.name}":\n• ${reasons.join('\n• ')}\n\nRemove these first, or archive the zone instead.`;
        console.log('[safeDeleteZone] blocked:', error);
        return { success: false, error };
      }

      set(s => ({
        zones: s.zones.filter(z => z.id !== id),
      }));
      console.log('[safeDeleteZone] deleted. new zones count:', get().zones.length);
      return { success: true };
    },

    bulkReassignUsersToZone: (sourceZoneId, targetZoneId) => {
      const { zones, users } = get();
      const sourceZone = zones.find(z => z.id === Number(sourceZoneId));
      const targetZone = zones.find(z => z.id === Number(targetZoneId));
      if (!sourceZone) return { success: false, count: 0, error: "Source zone not found" };
      if (!targetZone) return { success: false, count: 0, error: "Target zone not found" };
      if (Number(sourceZoneId) === Number(targetZoneId)) return { success: false, count: 0, error: "Source and target zones are the same" };
      if (!targetZone.isActive) return { success: false, count: 0, error: "Target zone is not active" };
      if (targetZone.isArchived) return { success: false, count: 0, error: "Target zone is archived" };

      const affected = users.filter(u => Number(u.zoneId) === Number(sourceZoneId));
      if (affected.length === 0) return { success: false, count: 0, error: "No users in this zone" };

      set(s => ({
        users: s.users.map(u =>
          Number(u.zoneId) === Number(sourceZoneId)
            ? { ...u, zoneId: Number(targetZoneId), zone: targetZone.name }
            : u
        ),
      }));

      return { success: true, count: affected.length };
    },

    renameZone: (id, newName) => {
      const trimmed = newName.trim();
      if (!trimmed) return { success: false, error: "Name cannot be empty" };

      const { zones, users, alerts, ecoAssignments, supervisorAssignments } = get();
      const zone = zones.find(z => z.id === Number(id));
      if (!zone) return { success: false, error: "Zone not found" };

      const duplicate = zones.find(z => z.id !== Number(id) && z.name.toLowerCase() === trimmed.toLowerCase());
      if (duplicate) return { success: false, error: "A zone with this name already exists" };

      const oldName = zone.name;
      if (oldName === trimmed) return { success: true };

      set(s => ({
        zones: s.zones.map(z => z.id === Number(id) ? { ...z, name: trimmed } : z),
        users: s.users.map(u => u.zone === oldName ? { ...u, zone: trimmed } : u),
        alerts: s.alerts.map(a => a.zone === oldName ? { ...a, zone: trimmed } : a),
        ecoAssignments: s.ecoAssignments.map(e =>
          e.assignedZoneName === oldName ? { ...e, assignedZoneName: trimmed } : e
        ),
        supervisorAssignments: s.supervisorAssignments.map(sa =>
          sa.zoneName === oldName ? { ...sa, zoneName: trimmed } : sa
        ),
      }));

      return { success: true };
    },

    reorderZones: (orderedIds) => {
      set(s => ({
        zones: s.zones.map(z => {
          const idx = orderedIds.indexOf(z.id);
          return idx >= 0 ? { ...z, sortOrder: idx } : z;
        }),
      }));
    },

    reorderLocations: (zoneId, orderedIds) => {
      set(s => ({
        locations: s.locations.map(l => {
          if (l.zoneId !== zoneId) return l;
          const idx = orderedIds.indexOf(l.id);
          return idx >= 0 ? { ...l, sortOrder: idx } : l;
        }),
      }));
    },

    activateZoneAlert: (zoneId, alertType, priority, message, targetScope, targetLocationIds) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const zone = get().zones.find(z => z.id === zoneId);
      if (!zone) {
        console.warn('[activateZoneAlert] Zone not found:', zoneId);
        return;
      }
      const scope = targetScope || 'zone';
      const locIds = scope === 'locations' && Array.isArray(targetLocationIds) ? targetLocationIds : [];
      const locIdSet = new Set(locIds);
      console.log('[activateZoneAlert] Activating:', { zoneId, zoneName: zone.name, alertType, priority, user, scope, locIds });
      set(s => ({
        alertSoundDismissed: false,
        zones: s.zones.map(z => z.id === zoneId ? {
          ...z,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertTargetScope: scope,
          alertTargetLocationIds: locIds,
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId, action: 'activated' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => {
          if (l.zoneId !== zoneId) return l;
          if (scope === 'locations' && !locIdSet.has(l.id)) return l;
          return {
            ...l,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(), locationId: l.id, action: 'activated' as const,
              alertType, priority, message, timestamp: now, user,
            }],
          };
        }),
        mobileUserResponse: null,
        users: s.users.map(u => {
          if (u.zoneId !== zoneId) return u;
          if (scope === 'locations' && !locIdSet.has(u.locationId)) return u;
          return {
            ...u,
            status: 'pending' as const,
            alertReceivedAt: u.alertReceivedAt ?? now,
            escalationLevel: 0,
            receiptConfirmedAt: null,
            respondedAt: null,
          };
        }),
      }));
      get().logIncidentEvent({
        type: 'zone_updated',
        zoneId,
        zoneName: zone.name,
        metadata: { action: 'activated', alertType, priority, message, targetScope: scope, targetLocationIds: locIds },
      });
      const postState = get();
      const activeZoneCount = postState.zones.filter(z => z.isActive && z.alertActive).length;
      console.log('[activateZoneAlert] Post-activation state:', {
        activeZoneCount,
        usersPending: postState.users.filter(u => u.status === 'pending').length,
        mobileUserResponse: postState.mobileUserResponse,
        targetScope: scope,
        targetLocationCount: locIds.length,
      });
    },

    deactivateZoneAlert: (zoneId) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const zone = get().zones.find(z => z.id === zoneId);
      if (!zone) return;
      set(s => ({
        zones: s.zones.map(z => z.id === zoneId ? {
          ...z,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: now,
          alertTargetScope: 'zone' as const,
          alertTargetLocationIds: [],
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId, action: 'deactivated' as const,
            alertType: z.alertType, priority: z.alertPriority, message: z.alertMessage,
            timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => l.zoneId === zoneId ? {
          ...l,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: l.id, action: 'deactivated' as const,
            alertType: l.alertType, priority: l.alertPriority, message: l.alertMessage,
            timestamp: now, user,
          }],
        } : l),
      }));
      get().logIncidentEvent({
        type: 'zone_updated',
        zoneId,
        zoneName: zone.name,
        metadata: { action: 'deactivated' },
      });
      const { zones: updatedZones, alerts: updatedAlerts } = get();
      const anyZoneActive = updatedZones.some(z => z.isActive && z.alertActive);
      const anyAlertActive = updatedAlerts.some(a => a.isActive);
      if (!anyZoneActive && !anyAlertActive) {
        set({ personnelLocations: {} });
      }
    },

    editZoneAlert: (zoneId, alertType, priority, message) => {
      const zone = get().zones.find(z => z.id === zoneId);
      if (!zone || !zone.alertActive) return;
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      set(s => ({
        zones: s.zones.map(z => z.id === zoneId ? {
          ...z,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId, action: 'edited' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => l.zoneId === zoneId ? {
          ...l,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: l.id, action: 'edited' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : l),
      }));
    },

    bulkActivateZoneAlerts: (zoneIds, alertType, priority, message) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const idSet = new Set(zoneIds);
      set(s => ({
        alertSoundDismissed: false,
        mobileUserResponse: null,
        zones: s.zones.map(z => idSet.has(z.id) ? {
          ...z,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertTargetScope: 'zone' as const,
          alertTargetLocationIds: [],
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId: z.id, action: 'activated' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => idSet.has(l.zoneId) ? {
          ...l,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: l.id, action: 'activated' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : l),
      }));
      const zones = get().zones;
      for (const zid of zoneIds) {
        const z = zones.find(zz => zz.id === zid);
        if (z) {
          get().logIncidentEvent({
            type: 'zone_updated',
            zoneId: zid,
            zoneName: z.name,
            metadata: { action: 'activated', alertType, priority, message, bulk: true },
          });
        }
      }
    },

    bulkDeactivateZoneAlerts: (zoneIds) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const idSet = new Set(zoneIds);
      set(s => ({
        zones: s.zones.map(z => idSet.has(z.id) ? {
          ...z,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: now,
          alertTargetScope: 'zone' as const,
          alertTargetLocationIds: [],
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId: z.id, action: 'deactivated' as const,
            alertType: z.alertType, priority: z.alertPriority, message: z.alertMessage,
            timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => idSet.has(l.zoneId) ? {
          ...l,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: l.id, action: 'deactivated' as const,
            alertType: l.alertType, priority: l.alertPriority, message: l.alertMessage,
            timestamp: now, user,
          }],
        } : l),
      }));
      const { zones: updZ, alerts: updA } = get();
      for (const zid of zoneIds) {
        const z = updZ.find(zz => zz.id === zid);
        if (z) {
          get().logIncidentEvent({
            type: 'zone_updated',
            zoneId: zid,
            zoneName: z.name,
            metadata: { action: 'deactivated', bulk: true },
          });
        }
      }
      const anyZA = updZ.some(z => z.isActive && z.alertActive);
      const anyAA = updA.some(a => a.isActive);
      if (!anyZA && !anyAA) {
        set({ personnelLocations: {} });
      }
    },

    sendZoneNotification: (zoneId, message) => {
      const { zones, currentUser } = get();
      const zone = zones.find(z => z.id === zoneId);
      if (!zone) return;
      const notification = {
        id: Date.now(),
        zoneId,
        zoneName: zone.name,
        message: message.trim(),
        sentBy: currentUser?.name || 'Admin',
        sentAt: new Date().toISOString(),
      };
      set(s => ({ zoneNotifications: [notification, ...s.zoneNotifications] }));
    },

    sendAlertNotification: (opts) => {
      const { zones, locations, users, currentUser, permissionAssignments } = get();
      if (!currentUser) return null;

      const hasPermission =
        currentUser.role === 'Super Admin' ||
        (currentUser.role === 'ECO' &&
          (permissionAssignments.find(p => p.userId === currentUser.id)
            ?.permissions.includes('canSendAlertNotification') ?? false));
      if (!hasPermission) return null;

      const zone = zones.find(z => z.id === opts.zoneId);
      if (!zone || !zone.alertActive) return null;

      const zoneLocations = locations.filter(l => l.zoneId === opts.zoneId && l.isActive);
      const targetLocIds = opts.scope === 'all'
        ? zoneLocations.map(l => l.id)
        : opts.targetLocationIds;
      const targetLocNames = targetLocIds.map(id => {
        const loc = locations.find(l => l.id === id);
        return loc?.name ?? `Location ${id}`;
      });

      const targetLocSet = new Set(targetLocIds);
      const recipientCount = users.filter(u =>
        u.isActive && u.locationId != null && targetLocSet.has(u.locationId)
      ).length;

      const now = new Date().toISOString();
      const notification: AlertNotification = {
        id: Date.now(),
        zoneId: opts.zoneId,
        zoneName: zone.name,
        scope: opts.scope,
        targetLocationIds: targetLocIds,
        targetLocationNames: targetLocNames,
        message: opts.message.trim(),
        sentBy: currentUser.name,
        sentById: currentUser.id,
        sentAt: now,
        recipientCount,
      };

      set(s => ({
        alertNotifications: [notification, ...s.alertNotifications],
        activityLogs: [{
          id: Date.now(),
          type: 'alert' as const,
          message: `Notification sent to ${opts.scope === 'all' ? 'all users in ' + zone.name : targetLocNames.join(', ')}: "${opts.message.trim()}"`,
          timestamp: now,
          actorId: currentUser.id,
          actorName: currentUser.name,
        }, ...s.activityLogs],
      }));

      return notification;
    },
  };
}
