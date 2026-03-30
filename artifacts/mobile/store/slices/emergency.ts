import type { SetState, GetState, AppState } from '../types';

export function createEmergencySlice(set: SetState, get: GetState): Pick<
  AppState,
  'setWindDirection' | 'activateShelterIn' | 'deactivateShelterIn' | 'activateBlackout' | 'deactivateBlackout'
> {
  return {
    setWindDirection: (direction) => {
      const { currentUser } = get();
      set({
        windDirection: direction,
        windSetBy: direction ? (currentUser?.name ?? 'ECO') : null,
        windSetAt: direction ? new Date().toISOString() : null,
      });
    },

    activateShelterIn: (zoneNames) => {
      const { emergencyModes, currentUser } = get();
      const now = new Date().toISOString();
      set(s => ({
        emergencyModes: {
          ...emergencyModes,
          shelterIn: true,
          shelterInZones: zoneNames,
          shelterInActivatedAt: now,
          shelterInActivatedBy: currentUser?.name ?? 'System',
        },
        users: s.users.map(u => u.alertReceivedAt ? u : {
          ...u,
          alertReceivedAt: now,
          escalationLevel: 0,
          receiptConfirmedAt: null,
          respondedAt: null,
        }),
      }));
    },

    deactivateShelterIn: () => {
      const { emergencyModes } = get();
      set({
        emergencyModes: {
          ...emergencyModes,
          shelterIn: false,
          shelterInZones: [],
          shelterInActivatedAt: null,
          shelterInActivatedBy: null,
        },
      });
    },

    activateBlackout: (zoneNames) => {
      const { emergencyModes, currentUser } = get();
      const now = new Date().toISOString();
      set(s => ({
        emergencyModes: {
          ...emergencyModes,
          blackout: true,
          blackoutZones: zoneNames,
          blackoutActivatedAt: now,
          blackoutActivatedBy: currentUser?.name ?? 'System',
        },
        users: s.users.map(u => u.alertReceivedAt ? u : {
          ...u,
          alertReceivedAt: now,
          escalationLevel: 0,
          receiptConfirmedAt: null,
          respondedAt: null,
        }),
      }));
    },

    deactivateBlackout: () => {
      const { emergencyModes } = get();
      set({
        emergencyModes: {
          ...emergencyModes,
          blackout: false,
          blackoutZones: [],
          blackoutActivatedAt: null,
          blackoutActivatedBy: null,
        },
      });
    },
  };
}
