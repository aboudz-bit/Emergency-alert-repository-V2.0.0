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

// Slices
import { createAuthSlice } from './slices/auth';
import { createAlertSlice } from './slices/alerts';
import { createZoneSlice } from './slices/zones';
import { createLocationSlice } from './slices/locations';
import { createPersonnelSlice } from './slices/personnel';
import { createShelterSlice } from './slices/shelters';
import { createHazardZoneSlice, _injectSelectActiveAlert } from './slices/hazardZones';
import { createAssignmentSlice } from './slices/assignments';
import { createPermissionSlice } from './slices/permissions';
import { createEmergencySlice } from './slices/emergency';

// Re-export selectors so existing imports from '@/store' keep working
export { selectActiveAlert, alertEq, selectHasActiveAlert, selectIsEmergencyActive, selectHasRealAlert } from './selectors';
export {
  selectCanViewGlobalLiveMap,
  selectCanPlaceWarningZone,
  selectCanEditHazardZone,
  selectCanDeleteHazardZone,
  selectCanUnlockHazardZone,
  selectCanManageShelters,
  selectCanReviewAlertMonitor,
  selectCanChangeWindDirection,
  selectCanActivateEmergencyMode,
  selectCurrentUserHasPermission,
} from './selectors';

// Re-export types so consumers can import AppState if needed
export type { AppState } from './types';

// Inject selectActiveAlert into hazardZone slice (avoids circular dep)
import { selectActiveAlert } from './selectors';
_injectSelectActiveAlert(selectActiveAlert);

console.log('[store] Initializing Zustand store...');

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ────────────────────────────────────────────────────
      isAuthenticated: false,
      currentUser: null,
      users: seedUsers,
      alerts: seedAlerts,
      zones: seedZones,
      locations: seedLocations,
      settings: seedSettings,
      activityLogs: seedActivityLogs,
      mobileUserResponse: null,
      ecoAssignments: seedEcoAssignments,
      supervisorAssignments: seedSupervisorAssignments,
      shelters: seedShelters,
      hazardZones: [],
      personnelLocations: {},
      zoneNotifications: [],
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
        receipts: [],
      },
      windDirection: null,
      windSetBy: null,
      windSetAt: null,

      // ── Settings & logs ──────────────────────────────────────────────────
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

      // ── Slices ───────────────────────────────────────────────────────────
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
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: createJSONStorage(() => AsyncStorage),
      migrate,
      partialize,
      onRehydrateStorage: () => {
        console.log('[store] Rehydration started...');
        return (state, error) => {
          if (error) {
            console.error('[store] REHYDRATION FAILED:', error);
          } else {
            console.log('[store] Rehydration completed. emergencyModes:', JSON.stringify(state?.emergencyModes ? { shelterIn: state.emergencyModes.shelterIn, blackout: state.emergencyModes.blackout, receiptsCount: Array.isArray(state.emergencyModes.receipts) ? state.emergencyModes.receipts.length : 'NOT_ARRAY' } : 'NULL'));
            console.log('[store] alerts count:', Array.isArray(state?.alerts) ? state.alerts.length : 'NOT_ARRAY');
            console.log('[store] zones count:', Array.isArray(state?.zones) ? state.zones.length : 'NOT_ARRAY');
            console.log('[store] users count:', Array.isArray(state?.users) ? state.users.length : 'NOT_ARRAY');
          }
        };
      },
    },
  ),
);
