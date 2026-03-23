import type { EmergencyReceipt } from '@/types';
import type { SetState, GetState, AppState } from '../types';

function generateReceipts(get: GetState, modeType: 'shelterIn' | 'blackout', zoneNames: string[]): EmergencyReceipt[] {
  try {
    const state = get();
    const { users, zones } = state;
    if (!Array.isArray(zones)) {
      console.error('[emergency slice] generateReceipts: zones is not an array:', typeof zones);
      return [];
    }
    if (!Array.isArray(users)) {
      console.error('[emergency slice] generateReceipts: users is not an array:', typeof users);
      return [];
    }
    if (!Array.isArray(zoneNames)) {
      console.error('[emergency slice] generateReceipts: zoneNames is not an array:', typeof zoneNames);
      return [];
    }
    const zoneIds = zones
      .filter((z) => zoneNames.includes(z.name) && z.isActive && !z.isArchived)
      .map((z) => z.id);
    console.log('[emergency slice] generateReceipts: zoneIds =', zoneIds, 'for zoneNames =', zoneNames);
    const affectedUsers = users.filter(
      (u) => u.isActive && u.zoneId != null && zoneIds.includes(u.zoneId)
    );
    console.log('[emergency slice] generateReceipts: affectedUsers count =', affectedUsers.length);
    return affectedUsers.map((u) => ({
      userId: u.id,
      userName: u.name,
      modeType,
      receiptConfirmed: false,
      receiptConfirmedAt: null,
    }));
  } catch (e: any) {
    console.error('[emergency slice] generateReceipts CRASHED:', e.name, e.message, e.stack);
    return [];
  }
}

export function createEmergencySlice(set: SetState, get: GetState): Pick<
  AppState,
  'setWindDirection' | 'activateShelterIn' | 'deactivateShelterIn' | 'activateBlackout' | 'deactivateBlackout' | 'confirmEmergencyReceipt'
> {
  return {
    setWindDirection: (direction) => {
      try {
        const { currentUser } = get();
        set({
          windDirection: direction,
          windSetBy: direction ? (currentUser?.name ?? 'ECO') : null,
          windSetAt: direction ? new Date().toISOString() : null,
        });
      } catch (e: any) {
        console.error('[emergency slice] setWindDirection CRASHED:', e.name, e.message, e.stack);
      }
    },

    activateShelterIn: (zoneNames) => {
      try {
        console.log('[emergency slice] activateShelterIn called with:', zoneNames);
        const { emergencyModes, currentUser } = get();
        if (!emergencyModes || typeof emergencyModes !== 'object') {
          console.error('[emergency slice] activateShelterIn: emergencyModes is invalid:', emergencyModes);
          return;
        }
        const now = new Date().toISOString();
        const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
        const existingOtherReceipts = safeReceipts.filter((r) => r.modeType !== 'shelterIn');
        const newReceipts = generateReceipts(get, 'shelterIn', zoneNames);
        const newState = {
          emergencyModes: {
            ...emergencyModes,
            shelterIn: true,
            shelterInZones: Array.isArray(zoneNames) ? zoneNames : [],
            blackoutZones: Array.isArray(emergencyModes.blackoutZones) ? emergencyModes.blackoutZones : [],
            shelterInActivatedAt: now,
            shelterInActivatedBy: currentUser?.name ?? 'System',
            receipts: [...existingOtherReceipts, ...newReceipts],
          },
        };
        console.log('[emergency slice] activateShelterIn setting state with receipts count:', newState.emergencyModes.receipts.length);
        set(newState);
      } catch (e: any) {
        console.error('[emergency slice] activateShelterIn CRASHED:', e.name, e.message, e.stack);
      }
    },

    deactivateShelterIn: () => {
      try {
        console.log('[emergency slice] deactivateShelterIn called');
        const { emergencyModes } = get();
        if (!emergencyModes) {
          console.error('[emergency slice] deactivateShelterIn: emergencyModes is null');
          return;
        }
        const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
        set({
          emergencyModes: {
            ...emergencyModes,
            shelterIn: false,
            shelterInZones: [],
            shelterInActivatedAt: null,
            shelterInActivatedBy: null,
            receipts: safeReceipts.filter((r) => r.modeType !== 'shelterIn'),
          },
        });
      } catch (e: any) {
        console.error('[emergency slice] deactivateShelterIn CRASHED:', e.name, e.message, e.stack);
      }
    },

    activateBlackout: (zoneNames) => {
      try {
        console.log('[emergency slice] activateBlackout called with:', zoneNames);
        const { emergencyModes, currentUser } = get();
        if (!emergencyModes || typeof emergencyModes !== 'object') {
          console.error('[emergency slice] activateBlackout: emergencyModes is invalid:', emergencyModes);
          return;
        }
        const now = new Date().toISOString();
        const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
        const existingOtherReceipts = safeReceipts.filter((r) => r.modeType !== 'blackout');
        const newReceipts = generateReceipts(get, 'blackout', zoneNames);
        const newState = {
          emergencyModes: {
            ...emergencyModes,
            blackout: true,
            blackoutZones: Array.isArray(zoneNames) ? zoneNames : [],
            shelterInZones: Array.isArray(emergencyModes.shelterInZones) ? emergencyModes.shelterInZones : [],
            blackoutActivatedAt: now,
            blackoutActivatedBy: currentUser?.name ?? 'System',
            receipts: [...existingOtherReceipts, ...newReceipts],
          },
        };
        console.log('[emergency slice] activateBlackout setting state with receipts count:', newState.emergencyModes.receipts.length);
        set(newState);
      } catch (e: any) {
        console.error('[emergency slice] activateBlackout CRASHED:', e.name, e.message, e.stack);
      }
    },

    deactivateBlackout: () => {
      try {
        console.log('[emergency slice] deactivateBlackout called');
        const { emergencyModes } = get();
        if (!emergencyModes) {
          console.error('[emergency slice] deactivateBlackout: emergencyModes is null');
          return;
        }
        const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
        set({
          emergencyModes: {
            ...emergencyModes,
            blackout: false,
            blackoutZones: [],
            blackoutActivatedAt: null,
            blackoutActivatedBy: null,
            receipts: safeReceipts.filter((r) => r.modeType !== 'blackout'),
          },
        });
      } catch (e: any) {
        console.error('[emergency slice] deactivateBlackout CRASHED:', e.name, e.message, e.stack);
      }
    },

    confirmEmergencyReceipt: (modeType) => {
      try {
        console.log('[emergency slice] confirmEmergencyReceipt called for:', modeType);
        const { emergencyModes, currentUser } = get();
        if (!currentUser) {
          console.error('[emergency slice] confirmEmergencyReceipt: no currentUser');
          return;
        }
        if (!emergencyModes || typeof emergencyModes !== 'object') {
          console.error('[emergency slice] confirmEmergencyReceipt: emergencyModes is invalid');
          return;
        }
        const now = new Date().toISOString();
        const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
        const updatedReceipts = safeReceipts.map((r) =>
          r.userId === currentUser.id && r.modeType === modeType
            ? { ...r, receiptConfirmed: true, receiptConfirmedAt: now }
            : r
        );
        set({ emergencyModes: { ...emergencyModes, receipts: updatedReceipts } });
      } catch (e: any) {
        console.error('[emergency slice] confirmEmergencyReceipt CRASHED:', e.name, e.message, e.stack);
      }
    },
  };
}
