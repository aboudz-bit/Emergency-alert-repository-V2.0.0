import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createLocationSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addLocation' | 'updateLocation' | 'deleteLocation' |
  'activateLocationAlert' | 'deactivateLocationAlert' | 'editLocationAlert'
> {
  return {
    addLocation: (location) => set(s => ({ locations: [...s.locations, { ...location, id: Date.now(), polygonPoints: location.polygonPoints ?? [], alertHistory: location.alertHistory || [] }] })),
    updateLocation: (id, partial) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...partial } : l) })),
    deleteLocation: (id) => set(s => ({
      locations: s.locations.filter(l => l.id !== id),
      shelters: s.shelters.map(sh => ({
        ...sh,
        linkedLocationIds: (sh.linkedLocationIds || []).filter(lid => lid !== id),
      })),
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
