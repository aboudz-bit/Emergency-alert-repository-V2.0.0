import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export { useShallow } from 'zustand/react/shallow';
import type {
  User, Alert, Zone, Location, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertType, ZoneType,
} from '@/types';
import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings,
} from '@/lib/mock-data';

// ─── State shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;

  // Data
  users: User[];
  alerts: Alert[];
  zones: Zone[];
  locations: Location[];
  settings: AppSettings;
  activityLogs: ActivityLog[];

  // Mobile current user response (tracks logged-in user response to active alert)
  mobileUserResponse: UserResponseStatus | null;

  // ── Auth actions ────────────────────────────────────────────────────────────
  login: (badge: string, password: string, roleOverride?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  registerUser: (data: { name: string; badge: string; password: string; zone: 'CPF' | 'Camp'; location: string }) => { success: boolean; error?: string };

  // ── User/Admin management ────────────────────────────────────────────────────
  createSuperAdmin: (data: { name: string; badge: string; password: string }) => { success: boolean; error?: string };
  toggleAccountStatus: (userId: number) => void;
  resetPassword: (userId: number, newPassword: string) => void;
  updateUserResponse: (userId: number, status: UserResponseStatus) => void;

  // ── Alert actions ────────────────────────────────────────────────────────────
  createAlert: (data: Omit<Alert, 'id' | 'stats' | 'isActive' | 'status'>) => Alert;
  sendAllClear: () => void;
  closeAlert: (alertId: number) => void;

  // ── Mobile response ─────────────────────────────────────────────────────────
  respondToAlert: (response: 'confirmed' | 'need_help') => void;

  // ── Zone actions ─────────────────────────────────────────────────────────────
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: number, partial: Partial<Zone>) => void;
  disableZone: (id: number) => void;
  deleteZone: (id: number) => void;

  // ── Location actions ─────────────────────────────────────────────────────────
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: number, partial: Partial<Location>) => void;
  disableLocation: (id: number) => void;
  deleteLocation: (id: number) => void;

  // ── Settings ─────────────────────────────────────────────────────────────────
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateNotificationSettings: (partial: Partial<AppSettings['notifications']>) => void;

  // ── Activity log ─────────────────────────────────────────────────────────────
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;

  // ── Computed helpers ─────────────────────────────────────────────────────────
  getActiveAlert: () => Alert | null;
  getAlertHistory: () => Alert[];
  getUsersByZone: (zone: 'CPF' | 'Camp') => User[];
  getLocationsByZone: (zone: string) => Location[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── Initial state ─────────────────────────────────────────────────────────
      isAuthenticated: false,
      currentUser: null,
      users: seedUsers,
      alerts: seedAlerts,
      zones: seedZones,
      locations: seedLocations,
      settings: seedSettings,
      activityLogs: seedActivityLogs,
      mobileUserResponse: null,

      // ── Auth ──────────────────────────────────────────────────────────────────

      login: (badge, password, roleOverride) => {
        const { users } = get();

        // Demo shortcut: if badge is demo credential, auto-match first user of role
        let user: User | undefined;

        if (roleOverride) {
          if (roleOverride === 'Super Admin') {
            user = users.find(u => u.role === 'Super Admin' && u.accountStatus === 'active');
          } else if (roleOverride === 'IT') {
            user = users.find(u => u.role === 'IT' && u.accountStatus === 'active');
          } else {
            user = users.find(u => u.role === 'User' && u.accountStatus === 'active');
          }
        } else {
          user = users.find(u => u.badge === badge);
        }

        if (!user) return { success: false, error: 'Badge number not found.' };
        if (user.accountStatus === 'disabled') return { success: false, error: 'Account is disabled. Contact IT.' };
        if (!roleOverride && user.password !== password) return { success: false, error: 'Incorrect password.' };

        set({ isAuthenticated: true, currentUser: user, mobileUserResponse: null });
        get().addActivityLog({
          type: 'user',
          message: `${user.name} logged in as ${user.role}.`,
          timestamp: new Date().toISOString(),
          actorId: user.id,
          actorName: user.name,
        });
        return { success: true };
      },

      logout: () => {
        set({ isAuthenticated: false, currentUser: null, mobileUserResponse: null });
      },

      registerUser: ({ name, badge, password, zone, location }) => {
        const { users } = get();
        if (users.find(u => u.badge === badge)) {
          return { success: false, error: 'Badge number already registered.' };
        }
        const newUser: User = {
          id: Date.now(),
          name,
          badge,
          password,
          role: 'User',
          zone,
          location,
          status: 'no_reply',
          accountStatus: 'active',
          lastActivity: new Date().toISOString(),
          isActive: true,
        };
        set(s => ({ users: [...s.users, newUser] }));
        get().addActivityLog({
          type: 'user',
          message: `New user registered: ${name} (${badge}).`,
          timestamp: new Date().toISOString(),
          actorName: name,
        });
        return { success: true };
      },

      // ── User / Admin management ───────────────────────────────────────────────

      createSuperAdmin: ({ name, badge, password }) => {
        const { users } = get();
        if (users.find(u => u.badge === badge)) {
          return { success: false, error: 'Badge number already exists.' };
        }
        const newAdmin: User = {
          id: Date.now(),
          name,
          badge,
          password,
          role: 'Super Admin',
          zone: 'CPF',
          location: 'Control Room',
          status: 'no_reply',
          accountStatus: 'active',
          lastActivity: new Date().toISOString(),
          isActive: true,
        };
        set(s => ({ users: [...s.users, newAdmin] }));
        get().addActivityLog({
          type: 'action',
          message: `Super Admin account created: ${name} (${badge}).`,
          timestamp: new Date().toISOString(),
        });
        return { success: true };
      },

      toggleAccountStatus: (userId) => {
        set(s => ({
          users: s.users.map(u =>
            u.id === userId
              ? { ...u, accountStatus: u.accountStatus === 'active' ? 'disabled' : 'active', isActive: u.accountStatus === 'active' ? false : true }
              : u,
          ),
        }));
      },

      resetPassword: (userId, newPassword) => {
        set(s => ({ users: s.users.map(u => u.id === userId ? { ...u, password: newPassword } : u) }));
      },

      updateUserResponse: (userId, status) => {
        set(s => {
          const users = s.users.map(u =>
            u.id === userId ? { ...u, status, lastActivity: new Date().toISOString() } : u,
          );
          // recalculate active alert stats
          const alerts = s.alerts.map(a => {
            if (!a.isActive) return a;
            return {
              ...a,
              stats: {
                confirmed: users.filter(u => u.status === 'confirmed').length,
                missing: users.filter(u => u.status === 'missing').length,
                noReply: users.filter(u => u.status === 'no_reply').length,
                needHelp: users.filter(u => u.status === 'need_help').length,
                total: users.length,
              },
            };
          });
          return { users, alerts };
        });
      },

      // ── Alert actions ─────────────────────────────────────────────────────────

      createAlert: (data) => {
        const { users } = get();
        // Close any currently active alert
        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a),
          users: s.users.map(u => ({ ...u, status: 'no_reply' as UserResponseStatus })),
        }));

        const newAlert: Alert = {
          ...data,
          id: Date.now(),
          status: 'active',
          isActive: true,
          stats: {
            confirmed: 0,
            missing: 0,
            noReply: users.length,
            needHelp: 0,
            total: users.length,
          },
        };

        set(s => ({
          alerts: [newAlert, ...s.alerts],
          mobileUserResponse: null,
        }));

        get().addActivityLog({
          type: 'alert',
          message: `${data.type} alert broadcast to ${data.zone} zone by ${data.sentBy}.`,
          timestamp: new Date().toISOString(),
          actorName: data.sentBy,
        });

        return newAlert;
      },

      sendAllClear: () => {
        const { currentUser, users } = get();
        const sentBy = currentUser?.name || 'System Auto';

        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a),
          users: s.users.map(u => ({ ...u, status: 'confirmed' as UserResponseStatus })),
          mobileUserResponse: 'confirmed' as UserResponseStatus,
        }));

        const allClearAlert: Alert = {
          id: Date.now(),
          type: 'All Clear',
          zone: 'All Zones',
          title: 'ALL CLEAR',
          message: 'The emergency condition has been fully resolved. All personnel may return to normal operations.',
          timestamp: new Date().toISOString(),
          sentBy,
          priority: 'High',
          status: 'closed',
          isActive: false,
          stats: { confirmed: users.length, missing: 0, noReply: 0, needHelp: 0, total: users.length },
        };

        set(s => ({ alerts: [allClearAlert, ...s.alerts] }));
        get().addActivityLog({
          type: 'alert',
          message: `All Clear broadcast by ${sentBy}. Emergency resolved.`,
          timestamp: new Date().toISOString(),
          actorName: sentBy,
        });
      },

      closeAlert: (alertId) => {
        set(s => ({
          alerts: s.alerts.map(a =>
            a.id === alertId ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a,
          ),
        }));
      },

      // ── Mobile response ───────────────────────────────────────────────────────

      respondToAlert: (response) => {
        const { currentUser } = get();
        if (!currentUser) return;
        get().updateUserResponse(currentUser.id, response);
        set({ mobileUserResponse: response });
      },

      // ── Zone actions ──────────────────────────────────────────────────────────

      addZone: (zone) => {
        set(s => ({ zones: [...s.zones, { ...zone, id: Date.now() }] }));
      },

      updateZone: (id, partial) => {
        set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...partial } : z) }));
      },

      disableZone: (id) => {
        set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, isActive: false } : z) }));
      },

      deleteZone: (id) => {
        set(s => ({ zones: s.zones.filter(z => z.id !== id) }));
      },

      // ── Location actions ──────────────────────────────────────────────────────

      addLocation: (location) => {
        set(s => ({ locations: [...s.locations, { ...location, id: Date.now() }] }));
      },

      updateLocation: (id, partial) => {
        set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...partial } : l) }));
      },

      disableLocation: (id) => {
        set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, isActive: false } : l) }));
      },

      deleteLocation: (id) => {
        set(s => ({ locations: s.locations.filter(l => l.id !== id) }));
      },

      // ── Settings ──────────────────────────────────────────────────────────────

      updateSettings: (partial) => {
        set(s => ({ settings: { ...s.settings, ...partial } }));
      },

      updateNotificationSettings: (partial) => {
        set(s => ({
          settings: {
            ...s.settings,
            notifications: { ...s.settings.notifications, ...partial },
          },
        }));
      },

      // ── Activity log ──────────────────────────────────────────────────────────

      addActivityLog: (log) => {
        set(s => ({
          activityLogs: [{ ...log, id: Date.now() }, ...s.activityLogs].slice(0, 50),
        }));
      },

      // ── Computed helpers ──────────────────────────────────────────────────────

      getActiveAlert: () => get().alerts.find(a => a.isActive) || null,

      getAlertHistory: () => get().alerts.filter(a => !a.isActive),

      getUsersByZone: (zone) => get().users.filter(u => u.zone === zone),

      getLocationsByZone: (zone) => get().locations.filter(l => l.zone === zone && l.isActive),
    }),
    {
      name: 'keas-store-v3',
      storage: createJSONStorage(() => localStorage),
      // Only persist auth + mobileResponse; data is always re-seeded unless already stored
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        mobileUserResponse: state.mobileUserResponse,
        users: state.users,
        alerts: state.alerts,
        settings: state.settings,
        activityLogs: state.activityLogs,
        zones: state.zones,
        locations: state.locations,
      }),
    },
  ),
);

// ─── Convenience selectors ────────────────────────────────────────────────────

export const selectActiveAlert = (s: AppState) => s.alerts.find(a => a.isActive) || null;
export const selectAlertHistory = (s: AppState) => s.alerts.filter(a => !a.isActive);
export const selectCPFUsers = (s: AppState) => s.users.filter(u => u.zone === 'CPF');
export const selectCampUsers = (s: AppState) => s.users.filter(u => u.zone === 'Camp');
export const selectAdmins = (s: AppState) =>
  s.users.filter(u => u.role === 'Super Admin' || u.role === 'IT');
