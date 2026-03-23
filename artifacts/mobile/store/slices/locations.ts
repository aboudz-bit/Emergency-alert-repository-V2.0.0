import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createLocationSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addLocation' | 'updateLocation' | 'deleteLocation' | 'reorderLocations' |
  'activateLocationAlert' | 'deactivateLocationAlert' | 'editLocationAlert'
> {
  return {
    addLocation: (location) => {
      const maxOrder = get().locations
        .filter(l => l.zoneId === location.zoneId)
        .reduce((max, l) => Math.max(max, l.sortOrder ?? 0), 0);
      set(s => ({ locations: [...s.locations, { ...location, id: Date.now(), polygonPoints: Array.isArray(location.polygonPoints) ? location.polygonPoints : [], alertHistory: Array.isArray(location.alertHistory) ? location.alertHistory : [], sortOrder: maxOrder + 1 }] }));
    },
    updateLocation: (id, partial) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...partial } : l) })),
    deleteLocation: (id) => set(s => ({
      locations: s.locations.filter(l => l.id !== id),
      shelters: s.shelters.map(sh => ({
        ...sh,
        linkedLocationIds: (sh.linkedLocationIds || []).filter(lid => lid !== id),
      })),
    })),

    reorderLocations: (zoneId, orderedIds) => set(s => ({
      locations: s.locations.map(l => {
        if (l.zoneId !== zoneId) return l;
        const idx = orderedIds.indexOf(l.id);
        return idx >= 0 ? { ...l, sortOrder: idx } : l;
      }),
    })),

    activateLocationAlert: (id, alertType, priority, message) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      set(s => ({
        locations: s.locations.map(l => l.id === id ? {
          ...l,
          alertActive: true,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: id, action: 'activated' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : l),
      }));
    },

    deactivateLocationAlert: (id) => {
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      set(s => ({
        locations: s.locations.map(l => l.id === id ? {
          ...l,
          alertActive: false,
          alertType: null,
          alertPriority: null,
          alertMessage: '',
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: id, action: 'deactivated' as const,
            alertType: l.alertType, priority: l.alertPriority, message: l.alertMessage,
            timestamp: now, user,
          }],
        } : l),
      }));
    },

    editLocationAlert: (id, alertType, priority, message) => {
      const loc = get().locations.find(l => l.id === id);
      if (!loc || !loc.alertActive) return;
      const now = new Date().toISOString();
      const user = get().currentUser?.name || null;
      set(s => ({
        locations: s.locations.map(l => l.id === id ? {
          ...l,
          alertType,
          alertPriority: priority,
          alertMessage: message,
          alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: id, action: 'edited' as const,
            alertType, priority, message, timestamp: now, user,
          }],
        } : l),
      }));
    },
  };
}
