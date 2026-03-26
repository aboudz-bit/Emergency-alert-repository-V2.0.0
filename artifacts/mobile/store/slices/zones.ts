import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addZone' | 'updateZone' | 'deleteZone' |
  'archiveZone' | 'restoreZone' | 'safeDeleteZone' |
  'reorderZones' | 'reorderLocations' |
  'activateZoneAlert' | 'deactivateZoneAlert' | 'editZoneAlert' |
  'bulkActivateZoneAlerts' | 'bulkDeactivateZoneAlerts' |
  'sendZoneNotification'
> {
  return {
    addZone: (zone) => set(s => ({ zones: [...s.zones, { ...zone, id: Date.now() }] })),
    updateZone: (id, partial) => set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...partial } : z) })),
    deleteZone: (id) => {
      const { zones, locations } = get();
      const zone = zones.find(z => z.id === id);
      if (zone?.alertActive) return;
      const hasActiveChildAlert = locations.some(l => l.zoneId === id && l.alertActive);
      if (hasActiveChildAlert) return;
      set(s => ({
        zones: s.zones.filter(z => z.id !== id),
        locations: s.locations.filter(l => l.zoneId !== id),
      }));
    },

    archiveZone: (id) => {
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, isArchived: true } : z),
      }));
    },

    restoreZone: (id) => {
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, isArchived: false } : z),
      }));
    },

    safeDeleteZone: (id) => {
      const { zones, locations, shelters, users, hazardZones, alerts } = get();
      const zone = zones.find(z => z.id === id);
      if (!zone) return { success: false, error: 'Zone not found.' };

      const hasLocations = locations.some(l => l.zoneId === id);
      const hasShelters = shelters.some(s => s.zoneId === id);
      const hasUsers = users.some(u => u.zoneId === id);
      const hasAlerts = zone.alertActive || (zone.alertHistory && zone.alertHistory.length > 0);
      const hasHazardZones = hazardZones.some(hz => hz.zoneId === id);
      const hasLinkedAlerts = alerts.some(a => a.zone === zone.name);

      if (hasLocations || hasShelters || hasUsers || hasAlerts || hasHazardZones || hasLinkedAlerts) {
        return { success: false, error: 'Zone cannot be deleted because it has linked data. Archive instead.' };
      }

      set(s => ({
        zones: s.zones.filter(z => z.id !== id),
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

    activateZoneAlert: (zoneId, alertType, priority, message) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const zone = get().zones.find(z => z.id === zoneId);
      if (!zone) {
        console.warn('[activateZoneAlert] Zone not found:', zoneId);
        return;
      }
      console.log('[activateZoneAlert] Activating:', { zoneId, zoneName: zone.name, alertType, priority, user });
      set(s => ({
        zones: s.zones.map(z => z.id === zoneId ? {
          ...z,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId, action: 'activated' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : z),
        locations: s.locations.map(l => l.zoneId === zoneId ? {
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
        mobileUserResponse: null,
        users: s.users.map(u => ({ ...u, status: 'pending' as const })),
      }));
      // Post-activation diagnostic
      const postState = get();
      const activeZoneCount = postState.zones.filter(z => z.isActive && z.alertActive).length;
      console.log('[activateZoneAlert] Post-activation state:', {
        activeZoneCount,
        usersPending: postState.users.filter(u => u.status === 'pending').length,
        mobileUserResponse: postState.mobileUserResponse,
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
        zones: s.zones.map(z => idSet.has(z.id) ? {
          ...z,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
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
  };
}
