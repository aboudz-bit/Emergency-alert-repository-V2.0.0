import type { User, UserRole, UserResponseStatus } from '@/types';
import type { SetState, GetState, AppState } from '../types';

export function createAuthSlice(set: SetState, get: GetState): Pick<
  AppState,
  'login' | 'logout' | 'registerUser' | 'approveUser' | 'rejectUser' |
  'createSuperAdmin' | 'toggleAccountStatus' | 'resetPassword' | 'setLanguage'
> {
  return {
    login: (badge, password, roleOverride) => {
      const { users, ecoAssignments, supervisorAssignments } = get();
      let user: User | undefined;

      if (roleOverride) {
        user = users.find(u => u.role === roleOverride && u.accountStatus === 'active');
      } else {
        user = users.find(u => u.badge === badge);
      }

      if (!user) return { success: false, error: 'Badge number not found.' };
      if (user.accountStatus === 'disabled') return { success: false, error: 'Account is disabled. Contact IT.' };
      if (!roleOverride && user.approvalStatus === 'pending') return { success: false, error: 'Your account is pending IT approval.' };
      if (!roleOverride && user.approvalStatus === 'rejected') return { success: false, error: 'Your registration was rejected. Please contact IT.' };
      if (!roleOverride && user.password !== password) return { success: false, error: 'Incorrect password.' };

      const ecoA = ecoAssignments.find(a => a.assignedUserId === user!.id && a.active);
      const supA = supervisorAssignments.find(a => a.supervisorUserId === user!.id && a.supervisorActive);
      const backA = supervisorAssignments.find(a => a.backupSupervisorUserId === user!.id && a.backupActive);

      const enrichedUser: User = {
        ...user,
        ...(ecoA ? {
          isECOAssigned: true,
          ecoSlot: ecoA.ecoSlot,
          ecoZoneName: ecoA.assignedZoneName ?? undefined,
          ecoAssignmentActive: true,
        } : {}),
        ...(backA ? {
          isBackupSupervisorAssigned: true,
          supervisorLocationName: backA.locationName,
          supervisorZoneName: backA.zoneName,
          supervisorAssignmentActive: true,
        } : {}),
        ...(supA ? {
          isSupervisorAssigned: true,
          supervisorLocationName: supA.locationName,
          supervisorZoneName: supA.zoneName,
          supervisorAssignmentActive: true,
        } : {}),
      };

      set({ isAuthenticated: true, currentUser: enrichedUser, mobileUserResponse: null });
      return { success: true };
    },

    logout: () => set({ isAuthenticated: false, currentUser: null, mobileUserResponse: null }),

    registerUser: ({ name, badge, password, zone, location, mobileNumber, userType, role }) => {
      const { users, zones, locations: locs } = get();
      if (users.find(u => u.badge === badge)) {
        return { success: false, error: 'Badge number already registered.' };
      }
      const matchedZone = zones.find(z => z.name === zone);
      const matchedLoc = location ? locs.find(l => l.name === location && l.zone === zone) : null;
      const newUser: User = {
        id: Date.now(), name, badge, password,
        role: role ?? 'User',
        zone, location: location || '',
        zoneId: matchedZone?.id ?? 0,
        locationId: matchedLoc?.id ?? 0,
        status: 'pending', accountStatus: 'active',
        lastActivity: new Date().toISOString(), isActive: true,
        userType,
        mobileNumber,
        approvalStatus: 'pending',
        approvedBy: null, approvedAt: null, rejectionReason: null,
      };
      set(s => ({ users: [...s.users, newUser] }));
      return { success: true };
    },

    approveUser: (userId, approverName, finalRole) => {
      set(s => ({
        users: s.users.map(u =>
          u.id === userId
            ? {
                ...u,
                approvalStatus: 'approved' as const,
                approvedBy: approverName,
                approvedAt: new Date().toISOString(),
                rejectionReason: null,
                ...(finalRole ? { role: finalRole } : {}),
              }
            : u,
        ),
      }));
    },

    rejectUser: (userId, approverName, reason) => {
      set(s => ({
        users: s.users.map(u =>
          u.id === userId
            ? {
                ...u,
                approvalStatus: 'rejected' as const,
                approvedBy: approverName,
                approvedAt: new Date().toISOString(),
                rejectionReason: reason || null,
              }
            : u,
        ),
      }));
    },

    createSuperAdmin: ({ name, badge, password }) => {
      const { users, zones, locations: locs } = get();
      if (users.find(u => u.badge === badge)) {
        return { success: false, error: 'Badge number already exists.' };
      }
      const cpfZone = zones.find(z => z.name === 'CPF');
      const ccr = locs.find(l => l.name === 'CCR' && l.zoneId === (cpfZone?.id ?? 1));
      const newAdmin: User = {
        id: Date.now(), name, badge, password, role: 'Super Admin',
        zone: 'CPF', zoneId: cpfZone?.id ?? 1,
        location: 'CCR', locationId: ccr?.id ?? 7,
        status: 'pending',
        accountStatus: 'active', lastActivity: new Date().toISOString(), isActive: true,
      };
      set(s => ({ users: [...s.users, newAdmin] }));
      return { success: true };
    },

    toggleAccountStatus: (userId) => {
      set(s => ({
        users: s.users.map(u =>
          u.id === userId
            ? { ...u, accountStatus: u.accountStatus === 'active' ? 'disabled' as const : 'active' as const, isActive: u.accountStatus !== 'active' }
            : u,
        ),
      }));
    },

    resetPassword: (userId, newPassword) => {
      set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, password: newPassword } : u) }));
    },

    setLanguage: (language) => {
      const { currentUser } = get();
      if (!currentUser || currentUser.userType !== 'Contract') return;
      set({
        currentUser: { ...currentUser, language },
        users: get().users.map(u =>
          u.id === currentUser.id ? { ...u, language } : u
        ),
      });
    },
  };
}
