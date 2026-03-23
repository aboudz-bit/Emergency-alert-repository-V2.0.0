import type { UserResponseStatus } from '@/types';
import type { SetState, GetState, AppState } from '../types';

export function createPersonnelSlice(set: SetState, get: GetState): Pick<
  AppState,
  'setExpectedManpower' | 'assignPersonnelToLocation' | 'removePersonnelFromLocation' |
  'startAccountability' | 'updatePersonnelLocation' | 'batchUpdatePersonnelLocations' |
  'clearPersonnelLocations'
> {
  return {
    setExpectedManpower: (locationId, count) => {
      set(s => ({
        locations: s.locations.map(l =>
          l.id === locationId ? { ...l, expectedManpower: count } : l,
        ),
      }));
    },

    assignPersonnelToLocation: (userId, locationId) => {
      const { currentUser: caller, locations: locs, users: allUsers, supervisorAssignments } = get();
      const loc = locs.find(l => l.id === locationId);
      if (!loc) return;
      if (caller && caller.role !== 'Super Admin' && caller.role !== 'IT') {
        const sa = supervisorAssignments.find(a => a.supervisorUserId === caller.id || a.backupSupervisorUserId === caller.id);
        if (!sa || sa.locationId !== locationId) return;
      }
      const target = allUsers.find(u => u.id === userId);
      if (!target) return;
      if (target.locationId !== 0 && (target.locationId !== loc.id || target.zoneId !== loc.zoneId)) return;
      set(s => ({
        users: s.users.map(u =>
          u.id === userId
            ? { ...u, location: loc.name, locationId: loc.id, zone: loc.zone, zoneId: loc.zoneId }
            : u,
        ),
      }));
    },

    removePersonnelFromLocation: (userId) => {
      const { currentUser: caller, users: allUsers, supervisorAssignments } = get();
      const target = allUsers.find(u => u.id === userId);
      if (!target) return;
      if (caller && caller.role !== 'Super Admin' && caller.role !== 'IT') {
        const sa = supervisorAssignments.find(a => a.supervisorUserId === caller.id || a.backupSupervisorUserId === caller.id);
        if (!sa || target.locationId !== sa.locationId) return;
      }
      set(s => ({
        users: s.users.map(u =>
          u.id === userId
            ? { ...u, location: '', locationId: 0 }
            : u,
        ),
      }));
    },

    startAccountability: (locationId) => {
      const loc = get().locations.find(l => l.id === locationId);
      if (!loc) return;
      set(s => ({
        users: s.users.map(u =>
          u.locationId === locationId && u.isActive
            ? { ...u, status: 'pending' as UserResponseStatus }
            : u,
        ),
      }));
      get().addActivityLog({
        type: 'action',
        message: `Accountability started for ${loc.name} by ${get().currentUser?.name ?? 'Supervisor'}.`,
        timestamp: new Date().toISOString(),
        actorName: get().currentUser?.name ?? undefined,
      });
    },

    updatePersonnelLocation: (loc) => set(s => ({
      personnelLocations: { ...s.personnelLocations, [loc.userId]: loc },
    })),

    batchUpdatePersonnelLocations: (locs) => set(s => {
      if (!Array.isArray(locs) || locs.length === 0) return { personnelLocations: s.personnelLocations };
      const next = { ...s.personnelLocations };
      for (const loc of locs) {
        if (loc && loc.userId != null) {
          next[loc.userId] = loc;
        }
      }
      return { personnelLocations: next };
    }),

    clearPersonnelLocations: () => set({ personnelLocations: {} }),
  };
}
