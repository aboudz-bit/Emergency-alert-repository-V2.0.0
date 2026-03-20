import type { SetState, GetState, AppState } from '../types';

export function createEmergencySlice(set: SetState, get: GetState): Pick<
  AppState,
  'setWindDirection' | 'toggleShelterIn' | 'toggleBlackout'
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

    toggleShelterIn: () => {
      const { emergencyModes, currentUser } = get();
      const now = new Date().toISOString();
      set({
        emergencyModes: {
          ...emergencyModes,
          shelterIn: !emergencyModes.shelterIn,
          shelterInActivatedAt: !emergencyModes.shelterIn ? now : null,
          shelterInActivatedBy: !emergencyModes.shelterIn ? (currentUser?.name ?? 'System') : null,
        },
      });
    },

    toggleBlackout: () => {
      const { emergencyModes, currentUser } = get();
      const now = new Date().toISOString();
      set({
        emergencyModes: {
          ...emergencyModes,
          blackout: !emergencyModes.blackout,
          blackoutActivatedAt: !emergencyModes.blackout ? now : null,
          blackoutActivatedBy: !emergencyModes.blackout ? (currentUser?.name ?? 'System') : null,
        },
      });
    },
  };
}
