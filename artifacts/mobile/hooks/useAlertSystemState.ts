import { useStore, selectAlertSystemState, defaultAlertSystemState, getHasHydrated } from '@/store';
import type { AlertSystemState } from '@/types';

/**
 * Single source of truth for the alert system state.
 *
 * ALL screens must use this hook instead of independently reading
 * `alerts`, `zones`, `emergencyModes`, etc. This prevents:
 *
 *   - Race conditions between separate selectors
 *   - Inconsistent state across Dashboard, Monitor, Banner, Map
 *   - Crashes from undefined property access on partially-updated state
 *
 * Includes a hydration guard: returns safe defaults until the store
 * has finished rehydrating from AsyncStorage.
 *
 * Usage:
 *   const { emergencyMode, activeAlert, activeZoneIds, banners } = useAlertSystemState();
 *
 *   if (!activeAlert) return <EmptyState />;
 */
export function useAlertSystemState(): AlertSystemState {
  const state = useStore(selectAlertSystemState);

  // Extra safety: if store is not yet hydrated, return defaults
  if (!getHasHydrated()) {
    if (__DEV__) {
      console.log('[useAlertSystemState] Store not hydrated yet — returning defaults');
    }
    return defaultAlertSystemState;
  }

  return state;
}
