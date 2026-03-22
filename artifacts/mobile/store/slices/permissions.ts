import type { PermissionKey } from '@/types';
import type { SetState, GetState, AppState } from '../types';

export function createPermissionSlice(set: SetState, get: GetState): Pick<
  AppState,
  'assignPermission' | 'removePermission' | 'setUserPermissions' |
  'getUserPermissions' | 'hasPermission'
> {
  return {
    assignPermission: (userId, permission) => {
      const { currentUser, permissionAssignments } = get();
      const now = new Date().toISOString();
      const existing = permissionAssignments.find(pa => pa.userId === userId);
      if (existing) {
        if (existing.permissions.includes(permission)) return;
        set({
          permissionAssignments: permissionAssignments.map(pa =>
            pa.userId === userId
              ? { ...pa, permissions: [...pa.permissions, permission], updatedAt: now }
              : pa
          ),
          users: get().users.map(u =>
            u.id === userId
              ? { ...u, permissions: [...(u.permissions || []), permission] }
              : u
          ),
        });
      } else {
        set({
          permissionAssignments: [...permissionAssignments, {
            userId,
            permissions: [permission],
            assignedBy: currentUser?.id ?? 0,
            assignedByName: currentUser?.name ?? 'System',
            assignedAt: now,
            updatedAt: now,
          }],
          users: get().users.map(u =>
            u.id === userId
              ? { ...u, permissions: [...(u.permissions || []), permission] }
              : u
          ),
        });
      }
    },

    removePermission: (userId, permission) => {
      const { permissionAssignments } = get();
      const now = new Date().toISOString();
      set({
        permissionAssignments: permissionAssignments.map(pa =>
          pa.userId === userId
            ? { ...pa, permissions: pa.permissions.filter(p => p !== permission), updatedAt: now }
            : pa
        ),
        users: get().users.map(u =>
          u.id === userId
            ? { ...u, permissions: (u.permissions || []).filter(p => p !== permission) }
            : u
        ),
      });
    },

    setUserPermissions: (userId, permissions) => {
      const { currentUser, permissionAssignments } = get();
      const now = new Date().toISOString();
      const existing = permissionAssignments.find(pa => pa.userId === userId);
      if (existing) {
        set({
          permissionAssignments: permissionAssignments.map(pa =>
            pa.userId === userId ? { ...pa, permissions, updatedAt: now } : pa
          ),
          users: get().users.map(u => u.id === userId ? { ...u, permissions } : u),
        });
      } else {
        set({
          permissionAssignments: [...permissionAssignments, {
            userId,
            permissions,
            assignedBy: currentUser?.id ?? 0,
            assignedByName: currentUser?.name ?? 'System',
            assignedAt: now,
            updatedAt: now,
          }],
          users: get().users.map(u => u.id === userId ? { ...u, permissions } : u),
        });
      }
    },

    getUserPermissions: (userId) => {
      const { users } = get();
      const user = users.find(u => u.id === userId);
      if (!user) return [];
      if (user.role === 'Super Admin' || user.role === 'IT') return [
        'canViewGlobalLiveMap', 'canPlaceWarningZone', 'canEditHazardZone',
        'canDeleteHazardZone', 'canUnlockHazardZone', 'canManageShelters', 'canReviewAlertMonitor',
        'canChangeWindDirection', 'canActivateEmergencyMode',
      ];
      if (user.isECOAssigned && user.ecoAssignmentActive) {
        const base: PermissionKey[] = ['canViewGlobalLiveMap', 'canReviewAlertMonitor', 'canChangeWindDirection'];
        const extra = user.permissions || [];
        return [...new Set([...base, ...extra])];
      }
      return user.permissions || [];
    },

    hasPermission: (userId, permission) => {
      return get().getUserPermissions(userId).includes(permission);
    },
  };
}
