import type { SetState, GetState, AppState } from '../types';

export function createShelterSlice(set: SetState, get: GetState): Pick<
  AppState,
  'addShelter' | 'updateShelter' | 'deleteShelter' | 'linkShelterToLocations'
> {
  return {
    addShelter: (shelter) => set(s => ({ shelters: [...s.shelters, { ...shelter, id: Date.now(), linkedLocationIds: shelter.linkedLocationIds ?? [] }] })),
    updateShelter: (id, partial) => set(s => ({ shelters: s.shelters.map(sh => sh.id === id ? { ...sh, ...partial } : sh) })),
    deleteShelter: (id) => set(s => ({ shelters: s.shelters.filter(sh => sh.id !== id) })),
    linkShelterToLocations: (shelterId, locationIds) => set(s => ({
      shelters: s.shelters.map(sh => sh.id === shelterId ? { ...sh, linkedLocationIds: locationIds } : sh),
    })),
  };
}
