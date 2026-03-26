import type { HazardZone, WarningLevel } from '@/types';
import type { SetState, GetState, AppState } from '../types';

export function createHazardZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addHazardZone' | 'removeHazardZone' | 'unlockHazardZone' | 'applyDefaultsToHazardZone' | 'clearHazardZones'
> {
  return {
    addHazardZone: ({ centerLat, centerLng, warningLevel, zoneId, locationId }) => {
      const state = get();
      const { settings, currentUser } = state;
      const level: WarningLevel = warningLevel ?? 'hot';

      const now = new Date().toISOString();
      const hz: HazardZone = {
        id: Date.now(),
        zoneId: zoneId ?? null,
        locationId: locationId ?? null,
        centerLat,
        centerLng,
        hotRadius: settings.hazardHotRadius || 200,
        warmRadius: settings.hazardWarmRadius || 500,
        coldRadius: settings.hazardColdRadius || 1000,
        alertId: null,
        warningLevel: level,
        isActive: true,
        isLocked: true,
        createdBy: currentUser?.name || 'System',
        createdAt: now,
        windDirectionDeg: null,
        windMode: null,
        hazardShape: 'circle',
      };
      set(s => ({ hazardZones: [...s.hazardZones, hz] }));
    },

    removeHazardZone: (id) => {
      set(s => ({ hazardZones: s.hazardZones.filter(hz => hz.id !== id) }));
    },

    unlockHazardZone: (id) => {
      set(s => ({
        hazardZones: s.hazardZones.map(hz => hz.id === id ? { ...hz, isLocked: false } : hz),
      }));
    },

    applyDefaultsToHazardZone: (id) => {
      const { settings } = get();
      set(s => ({
        hazardZones: s.hazardZones.map(hz => hz.id === id ? {
          ...hz,
          hotRadius: settings.hazardHotRadius || 200,
          warmRadius: settings.hazardWarmRadius || 500,
          coldRadius: settings.hazardColdRadius || 1000,
        } : hz),
      }));
    },

    clearHazardZones: () => {
      set({ hazardZones: [] });
    },
  };
}
