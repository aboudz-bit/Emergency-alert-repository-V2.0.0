import type { EmergencyReceipt } from '@/types';
import type { SetState, GetState, AppState } from '../types';

function generateReceipts(get: GetState, modeType: 'shelterIn' | 'blackout', zoneNames: string[]): EmergencyReceipt[] {
  try {
    const { users, zones } = get();
    if (!Array.isArray(zones) || !Array.isArray(users)) return [];
    const zoneIds = zones
      .filter((z) => zoneNames.includes(z.name) && z.isActive && !z.isArchived)
      .map((z) => z.id);
    const affectedUsers = users.filter(
      (u) => u.isActive && u.zoneId != null && zoneIds.includes(u.zoneId)
    );
    return affectedUsers.map((u) => ({
      userId: u.id,
      userName: u.name,
      modeType,
      receiptConfirmed: false,
      receiptConfirmedAt: null,
    }));
  } catch (e) {
    console.error('[emergency slice] generateReceipts failed:', e);
    return [];
  }
}

export function createEmergencySlice(set: SetState, get: GetState): Pick<
  AppState,
  'setWindDirection' | 'activateShelterIn' | 'deactivateShelterIn' | 'activateBlackout' | 'deactivateBlackout' | 'confirmEmergencyReceipt'
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
      const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
      const existingOtherReceipts = safeReceipts.filter((r) => r.modeType !== 'shelterIn');
      const newReceipts = generateReceipts(get, 'shelterIn', zoneNames);
      set({
        emergencyModes: {
          ...emergencyModes,
          shelterIn: true,
          shelterInZones: Array.isArray(zoneNames) ? zoneNames : [],
          blackoutZones: Array.isArray(emergencyModes.blackoutZones) ? emergencyModes.blackoutZones : [],
          shelterInActivatedAt: now,
          shelterInActivatedBy: currentUser?.name ?? 'System',
          receipts: [...existingOtherReceipts, ...newReceipts],
        },
      });
    },

    deactivateShelterIn: () => {
      const { emergencyModes } = get();
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
    },

    activateBlackout: (zoneNames) => {
      const { emergencyModes, currentUser } = get();
      const now = new Date().toISOString();
      const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
      const existingOtherReceipts = safeReceipts.filter((r) => r.modeType !== 'blackout');
      const newReceipts = generateReceipts(get, 'blackout', zoneNames);
      set({
        emergencyModes: {
          ...emergencyModes,
          blackout: true,
          blackoutZones: Array.isArray(zoneNames) ? zoneNames : [],
          shelterInZones: Array.isArray(emergencyModes.shelterInZones) ? emergencyModes.shelterInZones : [],
          blackoutActivatedAt: now,
          blackoutActivatedBy: currentUser?.name ?? 'System',
          receipts: [...existingOtherReceipts, ...newReceipts],
        },
      });
    },

    deactivateBlackout: () => {
      const { emergencyModes } = get();
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
    },

    confirmEmergencyReceipt: (modeType) => {
      const { emergencyModes, currentUser } = get();
      if (!currentUser) return;
      const now = new Date().toISOString();
      const safeReceipts = Array.isArray(emergencyModes.receipts) ? emergencyModes.receipts : [];
      const updatedReceipts = safeReceipts.map((r) =>
        r.userId === currentUser.id && r.modeType === modeType
          ? { ...r, receiptConfirmed: true, receiptConfirmedAt: now }
          : r
      );
      set({ emergencyModes: { ...emergencyModes, receipts: updatedReceipts } });
    },
  };
}
