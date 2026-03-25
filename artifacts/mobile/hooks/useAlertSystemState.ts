import { useStore, selectAlertSystemState } from '@/store';
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
 * Usage:
 *   const { emergencyMode, activeAlert, activeZoneIds, banners } = useAlertSystemState();
 *
 *   if (!activeAlert) return <EmptyState />;
 */
export function useAlertSystemState(): AlertSystemState {
  return useStore(selectAlertSystemState);
}
