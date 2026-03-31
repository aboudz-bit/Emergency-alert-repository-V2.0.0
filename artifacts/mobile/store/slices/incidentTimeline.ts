import type { IncidentEvent, IncidentEventType } from '@/types';
import type { SetState, GetState } from '../types';

export interface IncidentTimelineState {
  incidentTimeline: IncidentEvent[];
}

export interface IncidentTimelineActions {
  logIncidentEvent: (event: Omit<IncidentEvent, 'id' | 'timestamp'>) => void;
  clearIncidentTimeline: () => void;
}

export const incidentTimelineInitialState: IncidentTimelineState = {
  incidentTimeline: [],
};

const MAX_EVENTS = 500;

export function createIncidentTimelineSlice(
  set: SetState,
  get: GetState,
): IncidentTimelineActions {
  return {
    logIncidentEvent: (event) => {
      const entry: IncidentEvent = {
        ...event,
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: Date.now(),
      };
      set((s) => ({
        incidentTimeline: [...s.incidentTimeline, entry].slice(-MAX_EVENTS),
      }));
    },

    clearIncidentTimeline: () => {
      set({ incidentTimeline: [] });
    },
  };
}
