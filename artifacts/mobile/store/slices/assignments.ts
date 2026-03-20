import type { SetState, GetState, AppState } from '../types';

export function createAssignmentSlice(set: SetState, get: GetState): Pick<
  AppState,
  'assignEco' | 'toggleEcoActive' |
  'assignSupervisor' | 'assignBackupSupervisor' | 'toggleSupervisorActive' | 'toggleBackupActive'
> {
  return {
    assignEco: (slot, userId, zoneId) => {
      const { users: allUsers, zones: allZones } = get();
      const user = userId ? allUsers.find(u => u.id === userId) : null;
      const zone = zoneId ? allZones.find(z => z.id === zoneId) : null;
      set(s => ({
        ecoAssignments: s.ecoAssignments.map(a =>
          a.ecoSlot === slot
            ? {
                ...a,
                assignedUserId: user?.id ?? null,
                assignedUserName: user?.name ?? null,
                assignedUserBadge: user?.badge ?? null,
                assignedZoneId: zone?.id ?? null,
                assignedZoneName: zone?.name ?? null,
                active: !!user,
                assignedAt: user ? new Date().toISOString() : null,
              }
            : a,
        ),
      }));
    },

    toggleEcoActive: (slot) => {
      set(s => ({
        ecoAssignments: s.ecoAssignments.map(a =>
          a.ecoSlot === slot ? { ...a, active: !a.active } : a,
        ),
      }));
    },

    assignSupervisor: (locationId, userId) => {
      const { users: allUsers, locations: allLocs } = get();
      const user = userId ? allUsers.find(u => u.id === userId) : null;
      const loc = allLocs.find(l => l.id === locationId);
      if (!loc) return;
      set(s => ({
        supervisorAssignments: s.supervisorAssignments.map(a =>
          a.locationId === locationId
            ? {
                ...a,
                supervisorUserId: user?.id ?? null,
                supervisorUserName: user?.name ?? null,
                supervisorUserBadge: user?.badge ?? null,
                supervisorActive: !!user,
              }
            : a,
        ),
      }));
    },

    assignBackupSupervisor: (locationId, userId) => {
      const { users: allUsers, locations: allLocs } = get();
      const user = userId ? allUsers.find(u => u.id === userId) : null;
      const loc = allLocs.find(l => l.id === locationId);
      if (!loc) return;
      set(s => ({
        supervisorAssignments: s.supervisorAssignments.map(a =>
          a.locationId === locationId
            ? {
                ...a,
                backupSupervisorUserId: user?.id ?? null,
                backupSupervisorUserName: user?.name ?? null,
                backupSupervisorUserBadge: user?.badge ?? null,
                backupActive: !!user,
              }
            : a,
        ),
      }));
    },

    toggleSupervisorActive: (locationId) => {
      set(s => ({
        supervisorAssignments: s.supervisorAssignments.map(a =>
          a.locationId === locationId
            ? { ...a, supervisorActive: !a.supervisorActive }
            : a,
        ),
      }));
    },

    toggleBackupActive: (locationId) => {
      set(s => ({
        supervisorAssignments: s.supervisorAssignments.map(a =>
          a.locationId === locationId
            ? { ...a, backupActive: !a.backupActive }
            : a,
        ),
      }));
    },
  };
}
