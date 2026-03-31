import type { SetState, GetState, AppState } from '../types';
import type { LatLng } from '@/types';

export interface EcoRoute {
  id: string;
  streetIds: string[];
  createdBy: number;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'edited';
}

export interface RouteState {
  ecoRoutes: EcoRoute[];
}

export interface RouteActions {
  createRoute: (streetIds: string[], createdBy: number) => EcoRoute;
  updateRoute: (id: string, streetIds: string[]) => void;
  deleteRoute: (id: string) => void;
  clearRoutes: () => void;
}

export const routeInitialState: RouteState = {
  ecoRoutes: [],
};

const CONNECTION_THRESHOLD = 0.0003;

function pointsClose(a: LatLng, b: LatLng): boolean {
  return Math.abs(a.lat - b.lat) < CONNECTION_THRESHOLD && Math.abs(a.lng - b.lng) < CONNECTION_THRESHOLD;
}

export function areStreetsConnected(streetA: { path: LatLng[] }, streetB: { path: LatLng[] }): boolean {
  if (streetA.path.length < 2 || streetB.path.length < 2) return false;
  const aStart = streetA.path[0];
  const aEnd = streetA.path[streetA.path.length - 1];
  const bStart = streetB.path[0];
  const bEnd = streetB.path[streetB.path.length - 1];
  return pointsClose(aEnd, bStart) || pointsClose(aEnd, bEnd)
    || pointsClose(aStart, bStart) || pointsClose(aStart, bEnd);
}

export function createRouteSlice(set: SetState, _get: GetState): RouteActions {
  return {
    createRoute: (streetIds, createdBy) => {
      const now = Date.now();
      const route: EcoRoute = {
        id: `route-${now}`,
        streetIds,
        createdBy,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      };
      set(s => ({
        ecoRoutes: [
          ...s.ecoRoutes.map(r => r.status === 'active' ? { ...r, status: 'edited' as const, updatedAt: now } : r),
          route,
        ],
      }));
      return route;
    },

    updateRoute: (id, streetIds) => {
      set(s => ({
        ecoRoutes: s.ecoRoutes.map(r =>
          r.id === id
            ? { ...r, streetIds, updatedAt: Date.now(), status: 'edited' as const }
            : r,
        ),
      }));
    },

    deleteRoute: (id) => {
      set(s => ({ ecoRoutes: s.ecoRoutes.filter(r => r.id !== id) }));
    },

    clearRoutes: () => {
      set({ ecoRoutes: [] });
    },
  };
}
