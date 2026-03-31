import type { Street, LatLng } from '@/types';
import type { SetState, GetState, AppState } from '../types';

export interface StreetState {
  streets: Street[];
}

export interface StreetActions {
  addStreet: (path: LatLng[]) => Street;
  updateStreet: (id: string, partial: Partial<Pick<Street, 'name' | 'path'>>) => void;
  deleteStreet: (id: string) => void;
  duplicateStreet: (id: string) => Street | null;
}

export const streetInitialState: StreetState = {
  streets: [],
};

export function createStreetSlice(set: SetState, get: GetState): StreetActions {
  function nextStreetName(): string {
    const existing = get().streets;
    let n = existing.length + 1;
    const names = new Set(existing.map(s => s.name));
    while (names.has(`Street-${n}`)) n++;
    return `Street-${n}`;
  }

  return {
    addStreet: (path) => {
      const now = Date.now();
      const street: Street = {
        id: `street-${now}`,
        name: nextStreetName(),
        path,
        createdAt: now,
        updatedAt: now,
      };
      set(s => ({ streets: [...s.streets, street] }));
      return street;
    },

    updateStreet: (id, partial) => {
      set(s => ({
        streets: s.streets.map(st =>
          st.id === id
            ? { ...st, ...partial, updatedAt: Date.now() }
            : st,
        ),
      }));
    },

    deleteStreet: (id) => {
      set(s => ({ streets: s.streets.filter(st => st.id !== id) }));
    },

    duplicateStreet: (id) => {
      const source = get().streets.find(st => st.id === id);
      if (!source) return null;
      const now = Date.now();
      const copy: Street = {
        id: `street-${now}`,
        name: `${source.name} (copy)`,
        path: source.path.map(p => ({ ...p })),
        createdAt: now,
        updatedAt: now,
      };
      set(s => ({ streets: [...s.streets, copy] }));
      return copy;
    },
  };
}
