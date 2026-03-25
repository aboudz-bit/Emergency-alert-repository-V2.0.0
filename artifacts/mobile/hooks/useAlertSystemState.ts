import { useStore, selectAlertSystemState, defaultAlertSystemState, getHasHydrated } from '@/store';
import type { AlertSystemState } from '@/types';

export function useAlertSystemState(): AlertSystemState {
  const state = useStore(selectAlertSystemState);

  if (!getHasHydrated()) {
    return defaultAlertSystemState;
  }

  return state;
}
