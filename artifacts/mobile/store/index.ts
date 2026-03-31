import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings,
  seedEcoAssignments, seedSupervisorAssignments, seedShelters,
} from '@/mock-data';

import type { AppState } from './types';
import { STORE_NAME, STORE_VERSION, migrate, partialize } from './migrations';

import { createAuthSlice } from './slices/auth';
import { createAlertSlice } from './slices/alerts';
import { createZoneSlice } from './slices/zones';
import { createLocationSlice } from './slices/locations';
import { createPersonnelSlice } from './slices/personnel';
import { createShelterSlice } from './slices/shelters';
import { createHazardZoneSlice } from './slices/hazardZones';
import { createAssignmentSlice } from './slices/assignments';
import { createPermissionSlice } from './slices/permissions';
import { createEmergencySlice } from './slices/emergency';
import { createAccountabilitySlice, accountabilityInitialState } from './slices/accountability';
import { createIncidentTimelineSlice, incidentTimelineInitialState } from './slices/incidentTimeline';

export { selectActiveAlert, alertEq, selectHasActiveAlert, selectIsEmergencyActive, selectHasRealAlert, selectAlertSystemState, defaultAlertSystemState } from './selectors';
export {
  selectCanViewGlobalLiveMap,
  selectCanPlaceWarningZone,
  selectCanEditHazardZone,
  selectCanDeleteHazardZone,
  selectCanUnlockHazardZone,
  selectCanManageShelters,
  selectCanReviewAlertMonitor,
  selectCanChangeWindDirection,
  selectCurrentUserHasPermission,
} from './selectors';

export type { AppState } from './types';

let _hasHydrated = false;

export function getHasHydrated(): boolean {
  return _hasHydrated;
}

const safeAsyncStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.error('[Store] AsyncStorage.getItem FAILED:', e);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.error('[Store] AsyncStorage.setItem FAILED:', e);
    }
  },
  removeItem: async (name: string) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.error('[Store] AsyncStorage.removeItem FAILED:', e);
    }
  },
}));

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      users: seedUsers,
      alerts: seedAlerts,
      zones: seedZones,
      locations: seedLocations,
      settings: seedSettings,
      activityLogs: seedActivityLogs,
      mobileUserResponse: null,
      alertSoundDismissed: false,
      dismissAlertSound: () => set({ alertSoundDismissed: true }),
      ecoAssignments: seedEcoAssignments,
      supervisorAssignments: seedSupervisorAssignments,
      shelters: seedShelters,
      hazardZones: [],
      personnelLocations: {},
      zoneNotifications: [],
      alertNotifications: [],
      permissionAssignments: [],
      emergencyModes: {
        shelterIn: false,
        blackout: false,
        shelterInZones: [],
        blackoutZones: [],
        shelterInActivatedAt: null,
        shelterInActivatedBy: null,
        blackoutActivatedAt: null,
        blackoutActivatedBy: null,
      },
      windDirection: null,
      windSetBy: null,
      windSetAt: null,

      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),
      addActivityLog: (log) => {
        set(s => ({ activityLogs: [{ ...log, id: Date.now() }, ...s.activityLogs].slice(0, 50) }));
      },
      getActiveAlert: () => get().alerts.find(a => a.isActive) || null,
      getLocationsByZone: (zone) => {
        const z = get().zones.find(zn => zn.name === zone);
        return get().locations.filter(l =>
          z ? l.zoneId === z.id && l.isActive : l.zone === zone && l.isActive
        );
      },

      ...createAuthSlice(set, get),
      ...createAlertSlice(set, get),
      ...createZoneSlice(set, get),
      ...createLocationSlice(set, get),
      ...createPersonnelSlice(set, get),
      ...createShelterSlice(set, get),
      ...createHazardZoneSlice(set, get),
      ...createAssignmentSlice(set, get),
      ...createPermissionSlice(set, get),
      ...createEmergencySlice(set, get),
      ...accountabilityInitialState,
      ...createAccountabilitySlice(set, get),
      ...incidentTimelineInitialState,
      ...createIncidentTimelineSlice(set, get),
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: safeAsyncStorage,
      migrate: (persisted, version) => {
        try {
          return migrate(persisted as any, version);
        } catch (e) {
          console.error('[Store] Migration FAILED — resetting to seed data:', e);
          return {
            isAuthenticated: false,
            currentUser: null,
            users: seedUsers,
            alerts: seedAlerts,
            zones: seedZones,
            locations: seedLocations,
            settings: seedSettings,
            activityLogs: seedActivityLogs,
            mobileUserResponse: null,
            alertSoundDismissed: false,
            ecoAssignments: seedEcoAssignments,
            supervisorAssignments: seedSupervisorAssignments,
            shelters: seedShelters,
            hazardZones: [],
            personnelLocations: {},
            zoneNotifications: [],
            alertNotifications: [],
            permissionAssignments: [],
            emergencyModes: {
              shelterIn: false,
              blackout: false,
              shelterInZones: [],
              blackoutZones: [],
              shelterInActivatedAt: null,
              shelterInActivatedBy: null,
              blackoutActivatedAt: null,
              blackoutActivatedBy: null,
            },
            windDirection: null,
            windSetBy: null,
            windSetAt: null,
          } as unknown as AppState;
        }
      },
      partialize,
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[Store] Rehydration FAILED:', error);
            try {
              AsyncStorage.removeItem(STORE_NAME);
            } catch (clearErr) {
              console.error('[Store] Failed to clear corrupted storage:', clearErr);
            }
          }
          _hasHydrated = true;
        };
      },
    },
  ),
);
