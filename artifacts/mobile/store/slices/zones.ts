import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addZone' | 'updateZone' | 'deleteZone' |
  'renameZone' | 'mergeZones' | 'moveLocationsBetweenZones' | 'splitZone' | 'archiveZone' |
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

    renameZone: (id, newName) => {
      const zone = get().zones.find(z => z.id === id);
      if (!zone) return;
      const oldName = zone.name;
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, name: newName } : z),
        locations: s.locations.map(l => l.zoneId === id ? { ...l, zone: newName } : l),
        users: s.users.map(u => u.zone === oldName ? { ...u, zone: newName } : u),
        ecoAssignments: s.ecoAssignments.map(e =>
          e.assignedZoneName === oldName ? { ...e, assignedZoneName: newName } : e
        ),
        supervisorAssignments: s.supervisorAssignments.map(sa =>
          sa.zoneName === oldName ? { ...sa, zoneName: newName } : sa
        ),
        emergencyModes: {
          ...s.emergencyModes,
          shelterInZones: (s.emergencyModes.shelterInZones ?? []).map(n => n === oldName ? newName : n),
          blackoutZones: (s.emergencyModes.blackoutZones ?? []).map(n => n === oldName ? newName : n),
        },
        zoneNotifications: s.zoneNotifications.map(zn =>
          zn.zoneId === id ? { ...zn, zoneName: newName } : zn
        ),
      }));
    },

    mergeZones: (sourceId, targetId) => {
      const { zones } = get();
      const source = zones.find(z => z.id === sourceId);
      const target = zones.find(z => z.id === targetId);
      if (!source || !target || sourceId === targetId) return;
      const sourceName = source.name;
      const targetName = target.name;
      const maxTargetOrder = get().locations
        .filter(l => l.zoneId === targetId)
        .reduce((max, l) => Math.max(max, l.sortOrder ?? 0), 0);
      let orderOffset = 0;
      set(s => ({
        zones: s.zones.map(z => z.id === sourceId ? { ...z, isArchived: true, isActive: false } : z),
        locations: s.locations.map(l =>
          l.zoneId === sourceId ? { ...l, zoneId: targetId, zone: targetName, sortOrder: maxTargetOrder + 1 + (orderOffset++) } : l
        ),
        shelters: s.shelters.map(sh =>
          sh.zoneId === sourceId ? { ...sh, zoneId: targetId } : sh
        ),
        users: s.users.map(u =>
          u.zone === sourceName ? { ...u, zone: targetName, zoneId: targetId } : u
        ),
        ecoAssignments: s.ecoAssignments.map(e =>
          e.assignedZoneId === sourceId ? { ...e, assignedZoneId: targetId, assignedZoneName: targetName } : e
        ),
        supervisorAssignments: s.supervisorAssignments.map(sa =>
          sa.zoneName === sourceName ? { ...sa, zoneName: targetName } : sa
        ),
        emergencyModes: {
          ...s.emergencyModes,
          shelterInZones: [...new Set((s.emergencyModes.shelterInZones ?? []).map(n => n === sourceName ? targetName : n))],
          blackoutZones: [...new Set((s.emergencyModes.blackoutZones ?? []).map(n => n === sourceName ? targetName : n))],
        },
      }));
    },

    moveLocationsBetweenZones: (locationIds, targetZoneId) => {
      const target = get().zones.find(z => z.id === targetZoneId);
      if (!target) return;
      const locIdSet = new Set(locationIds);
      const maxTargetOrder = get().locations
        .filter(l => l.zoneId === targetZoneId)
        .reduce((max, l) => Math.max(max, l.sortOrder ?? 0), 0);
      let moveOffset = 0;
      set(s => ({
        locations: s.locations.map(l =>
          locIdSet.has(l.id) ? { ...l, zoneId: targetZoneId, zone: target.name, sortOrder: maxTargetOrder + 1 + (moveOffset++) } : l
        ),
        users: s.users.map(u =>
          locIdSet.has(u.locationId) ? { ...u, zoneId: targetZoneId, zone: target.name } : u
        ),
        supervisorAssignments: s.supervisorAssignments.map(sa =>
          locIdSet.has(sa.locationId) ? { ...sa, zoneName: target.name } : sa
        ),
      }));
    },

    splitZone: (sourceZoneId, locationIds, newZoneName, newZoneColor) => {
      const source = get().zones.find(z => z.id === sourceZoneId);
      if (!source || locationIds.length === 0) return;
      const newZoneId = Date.now();
      const locIdSet = new Set(locationIds);
      let splitOffset = 0;
      set(s => ({
        zones: [...s.zones, {
          id: newZoneId,
          name: newZoneName,
          type: source.type,
          boundaryType: 'Polygon' as const,
          polygonPoints: [],
          center: source.center,
          isActive: true,
          isArchived: false,
          color: newZoneColor,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: null,
          alertHistory: [],
        }],
        locations: s.locations.map(l =>
          locIdSet.has(l.id) ? { ...l, zoneId: newZoneId, zone: newZoneName, sortOrder: splitOffset++ } : l
        ),
        users: s.users.map(u =>
          locIdSet.has(u.locationId) ? { ...u, zoneId: newZoneId, zone: newZoneName } : u
        ),
        supervisorAssignments: s.supervisorAssignments.map(sa =>
          locIdSet.has(sa.locationId) ? { ...sa, zoneName: newZoneName } : sa
        ),
      }));
    },

    archiveZone: (id) => {
      const zone = get().zones.find(z => z.id === id);
      if (!zone || zone.alertActive) return;
      set(s => ({
        zones: s.zones.map(z => z.id === id ? { ...z, isArchived: true, isActive: false } : z),
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
