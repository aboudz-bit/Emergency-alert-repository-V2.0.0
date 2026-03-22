import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addZone' | 'updateZone' | 'deleteZone' |
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

    activateZoneAlert: (zoneId, locationIds, alertType, priority, message) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      const zone = get().zones.find(z => z.id === zoneId);
      if (!zone) return;
      const locIdSet = new Set(locationIds);
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
        locations: s.locations.map(l => {
          if (l.zoneId !== zoneId) return l;
          if (!locIdSet.has(l.id)) return l;
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
        users: s.users.map(u => ({ ...u, status: 'pending' as const })),
      }));
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
