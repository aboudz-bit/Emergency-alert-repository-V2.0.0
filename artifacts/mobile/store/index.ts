import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User, Alert, Zone, Location, LocationAlertType, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertPriority,
  AlertHistoryEntry,
} from '@/types';
import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings,
} from '@/mock-data';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  alerts: Alert[];
  zones: Zone[];
  locations: Location[];
  settings: AppSettings;
  activityLogs: ActivityLog[];
  mobileUserResponse: UserResponseStatus | null;

  login: (badge: string, password: string, roleOverride?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  registerUser: (data: { name: string; badge: string; password: string; zone: string; location: string }) => { success: boolean; error?: string };

  createSuperAdmin: (data: { name: string; badge: string; password: string }) => { success: boolean; error?: string };
  toggleAccountStatus: (userId: number) => void;
  resetPassword: (userId: number, newPassword: string) => void;
  updateUserResponse: (userId: number, status: UserResponseStatus) => void;

  createAlert: (data: Omit<Alert, 'id' | 'stats' | 'isActive' | 'status'>) => Alert;
  sendAllClear: () => void;
  closeAlert: (alertId: number) => void;
  respondToAlert: (response: 'confirmed' | 'need_help') => void;

  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: number, partial: Partial<Zone>) => void;
  deleteZone: (id: number) => void;

  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: number, partial: Partial<Location>) => void;
  deleteLocation: (id: number) => void;

  activateLocationAlert: (id: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  deactivateLocationAlert: (id: number) => void;
  editLocationAlert: (id: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;

  updateSettings: (partial: Partial<AppSettings>) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;

  getActiveAlert: () => Alert | null;
  getLocationsByZone: (zone: string) => Location[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      currentUser: null,
      users: seedUsers,
      alerts: seedAlerts,
      zones: seedZones,
      locations: seedLocations,
      settings: seedSettings,
      activityLogs: seedActivityLogs,
      mobileUserResponse: null,

      login: (badge, password, roleOverride) => {
        const { users } = get();
        let user: User | undefined;

        if (roleOverride) {
          user = users.find(u => u.role === roleOverride && u.accountStatus === 'active');
        } else {
          user = users.find(u => u.badge === badge);
        }

        if (!user) return { success: false, error: 'Badge number not found.' };
        if (user.accountStatus === 'disabled') return { success: false, error: 'Account is disabled. Contact IT.' };
        if (!roleOverride && user.password !== password) return { success: false, error: 'Incorrect password.' };

        set({ isAuthenticated: true, currentUser: user, mobileUserResponse: null });
        return { success: true };
      },

      logout: () => set({ isAuthenticated: false, currentUser: null, mobileUserResponse: null }),

      registerUser: ({ name, badge, password, zone, location }) => {
        const { users } = get();
        if (users.find(u => u.badge === badge)) {
          return { success: false, error: 'Badge number already registered.' };
        }
        const newUser: User = {
          id: Date.now(), name, badge, password, role: 'User', zone, location,
          status: 'no_reply', accountStatus: 'active',
          lastActivity: new Date().toISOString(), isActive: true,
        };
        set(s => ({ users: [...s.users, newUser] }));
        return { success: true };
      },

      createSuperAdmin: ({ name, badge, password }) => {
        const { users } = get();
        if (users.find(u => u.badge === badge)) {
          return { success: false, error: 'Badge number already exists.' };
        }
        const newAdmin: User = {
          id: Date.now(), name, badge, password, role: 'Super Admin',
          zone: 'CPF', location: 'Control Room', status: 'no_reply',
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

      updateUserResponse: (userId, status) => {
        set(s => {
          const users = s.users.map(u =>
            u.id === userId ? { ...u, status, lastActivity: new Date().toISOString() } : u,
          );
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

      createAlert: (data) => {
        const { users } = get();
        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a),
          users: s.users.map(u => ({ ...u, status: 'no_reply' as UserResponseStatus })),
        }));
        const newAlert: Alert = {
          ...data, id: Date.now(), status: 'active', isActive: true,
          stats: { confirmed: 0, missing: 0, noReply: users.length, needHelp: 0, total: users.length },
        };
        set(s => ({ alerts: [newAlert, ...s.alerts], mobileUserResponse: null }));
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
          id: Date.now(), type: 'All Clear', zone: 'All Zones', title: 'ALL CLEAR',
          message: 'The emergency condition has been fully resolved. All personnel may return to normal operations.',
          timestamp: new Date().toISOString(), sentBy, priority: 'High', status: 'closed', isActive: false,
          stats: { confirmed: users.length, missing: 0, noReply: 0, needHelp: 0, total: users.length },
        };
        set(s => ({ alerts: [allClearAlert, ...s.alerts] }));
      },

      closeAlert: (alertId) => {
        set(s => ({
          alerts: s.alerts.map(a =>
            a.id === alertId ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a,
          ),
        }));
      },

      respondToAlert: (response) => {
        const { currentUser } = get();
        if (!currentUser) return;
        get().updateUserResponse(currentUser.id, response);
        set({ mobileUserResponse: response });
      },

      addZone: (zone) => set(s => ({ zones: [...s.zones, { ...zone, id: Date.now() }] })),
      updateZone: (id, partial) => set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...partial } : z) })),
      deleteZone: (id) => set(s => ({ zones: s.zones.filter(z => z.id !== id) })),

      addLocation: (location) => set(s => ({ locations: [...s.locations, { ...location, id: Date.now() }] })),
      updateLocation: (id, partial) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...partial } : l) })),
      deleteLocation: (id) => set(s => ({ locations: s.locations.filter(l => l.id !== id) })),

      activateLocationAlert: (id, alertType, priority, message) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        set(s => ({
          locations: s.locations.map(l => l.id === id ? {
            ...l,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: Date.now(),
              locationId: id,
              action: 'activated' as const,
              alertType,
              priority,
              message,
              timestamp: now,
              user,
            }],
          } : l),
        }));
      },
      deactivateLocationAlert: (id) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        set(s => ({
          locations: s.locations.map(l => l.id === id ? {
            ...l,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: Date.now(),
              locationId: id,
              action: 'deactivated' as const,
              alertType: l.alertType,
              priority: l.alertPriority,
              message: l.alertMessage,
              timestamp: now,
              user,
            }],
          } : l),
        }));
      },
      editLocationAlert: (id, alertType, priority, message) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        set(s => ({
          locations: s.locations.map(l => l.id === id ? {
            ...l,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: Date.now(),
              locationId: id,
              action: 'edited' as const,
              alertType,
              priority,
              message,
              timestamp: now,
              user,
            }],
          } : l),
        }));
      },

      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),

      addActivityLog: (log) => {
        set(s => ({ activityLogs: [{ ...log, id: Date.now() }, ...s.activityLogs].slice(0, 50) }));
      },

      getActiveAlert: () => get().alerts.find(a => a.isActive) || null,
      getLocationsByZone: (zone) => get().locations.filter(l => l.zone === zone && l.isActive),
    }),
    {
      name: 'keas-mobile-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentUser: state.currentUser,
        mobileUserResponse: state.mobileUserResponse,
        users: state.users,
        alerts: state.alerts,
        zones: state.zones,
        locations: state.locations,
        settings: state.settings,
        activityLogs: state.activityLogs,
      }),
    },
  ),
);

export const selectActiveAlert = (s: AppState) => s.alerts.find(a => a.isActive) || null;
