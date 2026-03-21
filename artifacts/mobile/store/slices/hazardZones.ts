import type { HazardZone } from '@/types';
import type { SetState, GetState, AppState } from '../types';

// selectActiveAlert is needed here — imported lazily to avoid circular deps
let _selectActiveAlert: ((s: AppState) => import('@/types').Alert | null) | null = null;
export function _injectSelectActiveAlert(fn: (s: AppState) => import('@/types').Alert | null) {
  _selectActiveAlert = fn;
}

export function createHazardZoneSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addHazardZone' | 'removeHazardZone' | 'unlockHazardZone' | 'applyDefaultsToHazardZone' | 'clearHazardZones'
> {
  return {
    addHazardZone: ({ centerLat, centerLng, zoneId, locationId }) => {
      const state = get();
      const { settings, currentUser, alerts, zones } = state;
      let activeAlert = alerts.find(a => a.isActive);
      if (!activeAlert) {
        const hasZoneAlert = zones.some(z => z.isActive && z.alertActive);
        if (!hasZoneAlert) return;
        activeAlert = _selectActiveAlert?.(state) ?? undefined;
        if (!activeAlert) return;
      }
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
        alertId: activeAlert.id,
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
