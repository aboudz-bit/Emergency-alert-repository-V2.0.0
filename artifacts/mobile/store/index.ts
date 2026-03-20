import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  User, Alert, Zone, Location, LocationAlertType, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertPriority,
  AlertHistoryEntry, ZoneAlertHistoryEntry,
  EcoAssignment, SupervisorAssignment, Shelter, HazardZone,
  UserType, ApprovalStatus, PersonnelLocation, ZoneNotification,
  PermissionKey, UserPermissionAssignment,
  EmergencyModes, WindDirection, Language,
} from '@/types';
import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings,
  seedEcoAssignments, seedSupervisorAssignments, seedShelters,
} from '@/mock-data';

let _historyIdCounter = 0;
function nextHistoryId(): number {
  return Date.now() * 1000 + (++_historyIdCounter % 1000);
}

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
  ecoAssignments: EcoAssignment[];
  supervisorAssignments: SupervisorAssignment[];
  shelters: Shelter[];
  hazardZones: HazardZone[];
  personnelLocations: Record<number, PersonnelLocation>;
  zoneNotifications: ZoneNotification[];
  emergencyModes: EmergencyModes;

  // Wind direction (set by ECO)
  windDirection: WindDirection | null;
  windSetBy: string | null;
  windSetAt: string | null;
  setWindDirection: (direction: WindDirection | null) => void;

  // Emergency mode actions
  toggleShelterIn: () => void;
  toggleBlackout: () => void;

  login: (badge: string, password: string, roleOverride?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  registerUser: (data: {
    name: string; badge: string; password: string; zone: string;
    location: string; mobileNumber: string; userType: UserType;
    role: UserRole | null;
  }) => { success: boolean; error?: string };
  approveUser: (userId: number, approverName: string, finalRole?: UserRole) => void;
  rejectUser: (userId: number, approverName: string, reason?: string) => void;

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

  bulkActivateZoneAlerts: (zoneIds: number[], alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  bulkDeactivateZoneAlerts: (zoneIds: number[]) => void;
  activateZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  deactivateZoneAlert: (zoneId: number) => void;
  editZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;

  updateSettings: (partial: Partial<AppSettings>) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;

  setExpectedManpower: (locationId: number, count: number) => void;
  assignPersonnelToLocation: (userId: number, locationId: number) => void;
  removePersonnelFromLocation: (userId: number) => void;
  startAccountability: (locationId: number) => void;

  addShelter: (shelter: Omit<Shelter, 'id'>) => void;
  updateShelter: (id: number, partial: Partial<Shelter>) => void;
  deleteShelter: (id: number) => void;
  linkShelterToLocations: (shelterId: number, locationIds: number[]) => void;

  updatePersonnelLocation: (loc: PersonnelLocation) => void;
  batchUpdatePersonnelLocations: (locs: PersonnelLocation[]) => void;
  clearPersonnelLocations: () => void;

  addHazardZone: (data: { centerLat: number; centerLng: number; zoneId?: number | null; locationId?: number | null }) => void;
  removeHazardZone: (id: number) => void;
  unlockHazardZone: (id: number) => void;
  applyDefaultsToHazardZone: (id: number) => void;
  clearHazardZones: () => void;

  sendZoneNotification: (zoneId: number, message: string) => void;

  assignEco: (slot: import('@/types').EcoSlot, userId: number | null, zoneId: number | null) => void;
  toggleEcoActive: (slot: import('@/types').EcoSlot) => void;

  assignSupervisor: (locationId: number, userId: number | null) => void;
  assignBackupSupervisor: (locationId: number, userId: number | null) => void;
  toggleSupervisorActive: (locationId: number) => void;
  toggleBackupActive: (locationId: number) => void;

  // Permission management
  permissionAssignments: UserPermissionAssignment[];
  assignPermission: (userId: number, permission: PermissionKey) => void;
  removePermission: (userId: number, permission: PermissionKey) => void;
  setUserPermissions: (userId: number, permissions: PermissionKey[]) => void;
  getUserPermissions: (userId: number) => PermissionKey[];
  hasPermission: (userId: number, permission: PermissionKey) => boolean;

  setLanguage: (language: Language) => void;

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
      ecoAssignments: seedEcoAssignments,
      supervisorAssignments: seedSupervisorAssignments,
      shelters: seedShelters,
      hazardZones: [],
      personnelLocations: {},
      zoneNotifications: [],
      permissionAssignments: [],
      emergencyModes: {
        shelterIn: false,
        blackout: false,
        shelterInActivatedAt: null,
        shelterInActivatedBy: null,
        blackoutActivatedAt: null,
        blackoutActivatedBy: null,
      },

      windDirection: null,
      windSetBy: null,
      windSetAt: null,
      setWindDirection: (direction) => {
        const { currentUser } = get();
        set({
          windDirection: direction,
          windSetBy: direction ? (currentUser?.name ?? 'ECO') : null,
          windSetAt: direction ? new Date().toISOString() : null,
        });
      },

      toggleShelterIn: () => {
        const { emergencyModes, currentUser } = get();
        const now = new Date().toISOString();
        set({
          emergencyModes: {
            ...emergencyModes,
            shelterIn: !emergencyModes.shelterIn,
            shelterInActivatedAt: !emergencyModes.shelterIn ? now : null,
            shelterInActivatedBy: !emergencyModes.shelterIn ? (currentUser?.name ?? 'System') : null,
          },
        });
      },

      toggleBlackout: () => {
        const { emergencyModes, currentUser } = get();
        const now = new Date().toISOString();
        set({
          emergencyModes: {
            ...emergencyModes,
            blackout: !emergencyModes.blackout,
            blackoutActivatedAt: !emergencyModes.blackout ? now : null,
            blackoutActivatedBy: !emergencyModes.blackout ? (currentUser?.name ?? 'System') : null,
          },
        });
      },

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

      updateUserResponse: (userId, status) => {
        set(s => {
          const users = s.users.map(u =>
            u.id === userId ? { ...u, status, lastActivity: new Date().toISOString() } : u,
          );
          const alerts = s.alerts.map(a => {
            if (!a.isActive) return a;
            // Only count users in the alert's targeted zone(s)
            const isAllZones = a.zone === 'All Zones' || a.zone === 'all';
            const targetZone = isAllZones ? null : s.zones.find(z => z.name === a.zone);
            const relevantUsers = isAllZones
              ? users.filter(u => u.isActive)
              : targetZone
                ? users.filter(u => u.zoneId === targetZone.id && u.isActive)
                : users.filter(u => u.isActive);
            return {
              ...a,
              stats: {
                confirmed: relevantUsers.filter(u => u.status === 'confirmed').length,
                pending: relevantUsers.filter(u => u.status === 'pending').length,
                needHelp: relevantUsers.filter(u => u.status === 'need_help').length,
                total: relevantUsers.length,
              },
            };
          });
          return { users, alerts };
        });
      },

      createAlert: (data) => {
        const { users } = get();
        const now = new Date().toISOString();
        const newAlert: Alert = {
          ...data, id: Date.now(), status: 'active', isActive: true,
          stats: { confirmed: 0, pending: users.length, needHelp: 0, total: users.length },
        };
        // Single atomic set: close old alert + add new alert + clear hazard zones
        // This prevents an intermediate state where activeAlert === null
        set(s => ({
          alerts: [newAlert, ...s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now } : a)],
          users: s.users.map(u => ({ ...u, status: 'pending' as UserResponseStatus })),
          hazardZones: [],
          mobileUserResponse: null,
        }));
        return newAlert;
      },

      sendAllClear: () => {
        const { currentUser, users } = get();
        const sentBy = currentUser?.name || 'System Auto';
        const now = new Date().toISOString();
        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now } : a),
          users: s.users.map(u => ({ ...u, status: 'confirmed' as UserResponseStatus })),
          zones: s.zones.map(z => z.alertActive ? {
            ...z,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(), zoneId: z.id, action: 'deactivated' as const,
              alertType: z.alertType, priority: z.alertPriority, message: z.alertMessage,
              timestamp: now, user: sentBy,
            }],
          } : z),
          locations: s.locations.map(l => l.alertActive ? {
            ...l,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(), locationId: l.id, action: 'deactivated' as const,
              alertType: l.alertType, priority: l.alertPriority, message: l.alertMessage,
              timestamp: now, user: sentBy,
            }],
          } : l),
          personnelLocations: {},
          mobileUserResponse: 'confirmed' as UserResponseStatus,
          hazardZones: [],
        }));
        const allClearAlert: Alert = {
          id: Date.now(), type: 'All Clear', zone: 'All Zones', title: 'ALL CLEAR',
          message: 'The emergency condition has been fully resolved. All personnel may return to normal operations.',
          timestamp: now, sentBy, priority: 'High', status: 'closed', isActive: false,
          stats: { confirmed: users.length, pending: 0, needHelp: 0, total: users.length },
        };
        set(s => ({ alerts: [allClearAlert, ...s.alerts] }));
      },

      closeAlert: (alertId) => {
        set(s => {
          const updatedAlerts = s.alerts.map(a =>
            a.id === alertId ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a,
          );
          const anyAlertActive = updatedAlerts.some(a => a.isActive);
          const anyZoneActive = s.zones.some(z => z.alertActive);
          return {
            alerts: updatedAlerts,
            hazardZones: s.hazardZones.filter(hz => hz.alertId !== alertId),
            ...(!anyAlertActive && !anyZoneActive ? { personnelLocations: {} } : {}),
          };
        });
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

      addLocation: (location) => set(s => ({ locations: [...s.locations, { ...location, id: Date.now(), polygonPoints: location.polygonPoints ?? [], alertHistory: location.alertHistory || [] }] })),
      updateLocation: (id, partial) => set(s => ({ locations: s.locations.map(l => l.id === id ? { ...l, ...partial } : l) })),
      deleteLocation: (id) => set(s => ({
        locations: s.locations.filter(l => l.id !== id),
        shelters: s.shelters.map(sh => ({
          ...sh,
          linkedLocationIds: (sh.linkedLocationIds || []).filter(lid => lid !== id),
        })),
      })),

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
              id: nextHistoryId(),
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
              id: nextHistoryId(),
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
        const loc = get().locations.find(l => l.id === id);
        if (!loc || !loc.alertActive) return;
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
              id: nextHistoryId(),
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

      bulkActivateZoneAlerts: (zoneIds, alertType, priority, message) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        const idSet = new Set(zoneIds);
        set(s => ({
          zones: s.zones.map(z => idSet.has(z.id) ? {
            ...z,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(),
              zoneId: z.id,
              action: 'activated' as const,
              alertType,
              priority,
              message,
              timestamp: now,
              user,
            }],
          } : z),
          locations: s.locations.map(l => idSet.has(l.zoneId) ? {
            ...l,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(),
              locationId: l.id,
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
      bulkDeactivateZoneAlerts: (zoneIds) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        const idSet = new Set(zoneIds);
        set(s => ({
          zones: s.zones.map(z => idSet.has(z.id) ? {
            ...z,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(),
              zoneId: z.id,
              action: 'deactivated' as const,
              alertType: z.alertType,
              priority: z.alertPriority,
              message: z.alertMessage,
              timestamp: now,
              user,
            }],
          } : z),
          locations: s.locations.map(l => idSet.has(l.zoneId) ? {
            ...l,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(),
              locationId: l.id,
              action: 'deactivated' as const,
              alertType: l.alertType,
              priority: l.alertPriority,
              message: l.alertMessage,
              timestamp: now,
              user,
            }],
          } : l),
        }));
        const { zones: updZ, alerts: updA } = get();
        const anyZA = updZ.some(z => z.alertActive);
        const anyAA = updA.some(a => a.isActive);
        if (!anyZA && !anyAA) {
          set({ personnelLocations: {} });
        }
      },
      activateZoneAlert: (zoneId, alertType, priority, message) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        const zone = get().zones.find(z => z.id === zoneId);
        if (!zone) return;
        set(s => ({
          zones: s.zones.map(z => z.id === zoneId ? {
            ...z,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(),
              zoneId,
              action: 'activated' as const,
              alertType,
              priority,
              message,
              timestamp: now,
              user,
            }],
          } : z),
          locations: s.locations.map(l => l.zoneId === zoneId ? {
            ...l,
            alertActive: true,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(),
              locationId: l.id,
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
      deactivateZoneAlert: (zoneId) => {
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        const zone = get().zones.find(z => z.id === zoneId);
        if (!zone) return;
        set(s => ({
          zones: s.zones.map(z => z.id === zoneId ? {
            ...z,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(),
              zoneId,
              action: 'deactivated' as const,
              alertType: z.alertType,
              priority: z.alertPriority,
              message: z.alertMessage,
              timestamp: now,
              user,
            }],
          } : z),
          locations: s.locations.map(l => l.zoneId === zoneId ? {
            ...l,
            alertActive: false,
            alertType: null,
            alertPriority: null,
            alertMessage: '',
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(),
              locationId: l.id,
              action: 'deactivated' as const,
              alertType: l.alertType,
              priority: l.alertPriority,
              message: l.alertMessage,
              timestamp: now,
              user,
            }],
          } : l),
        }));
        const { zones: updatedZones, alerts: updatedAlerts } = get();
        const anyZoneActive = updatedZones.some(z => z.alertActive);
        const anyAlertActive = updatedAlerts.some(a => a.isActive);
        if (!anyZoneActive && !anyAlertActive) {
          set({ personnelLocations: {} });
        }
      },
      editZoneAlert: (zoneId, alertType, priority, message) => {
        const zone = get().zones.find(z => z.id === zoneId);
        if (!zone || !zone.alertActive) return;
        const now = new Date().toISOString();
        const user = get().currentUser?.name || null;
        set(s => ({
          zones: s.zones.map(z => z.id === zoneId ? {
            ...z,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(z.alertHistory || []), {
              id: nextHistoryId(),
              zoneId,
              action: 'edited' as const,
              alertType,
              priority,
              message,
              timestamp: now,
              user,
            }],
          } : z),
          locations: s.locations.map(l => l.zoneId === zoneId ? {
            ...l,
            alertType,
            alertPriority: priority,
            alertMessage: message,
            alertUpdatedAt: now,
            alertHistory: [...(l.alertHistory || []), {
              id: nextHistoryId(),
              locationId: l.id,
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
        // Guard: non-admin callers can only assign to their own location
        if (caller && caller.role !== 'Super Admin' && caller.role !== 'IT') {
          const sa = supervisorAssignments.find(a => a.supervisorUserId === caller.id || a.backupSupervisorUserId === caller.id);
          if (!sa || sa.locationId !== locationId) return;
        }
        // Guard: target user must be in same zone+location already (or unassigned)
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
        // Guard: non-admin callers can only remove from their own location
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
        // Reset all personnel at this location to pending for fresh accountability
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

      addShelter: (shelter) => set(s => ({ shelters: [...s.shelters, { ...shelter, id: Date.now(), linkedLocationIds: shelter.linkedLocationIds ?? [] }] })),
      updateShelter: (id, partial) => set(s => ({ shelters: s.shelters.map(sh => sh.id === id ? { ...sh, ...partial } : sh) })),
      deleteShelter: (id) => set(s => ({ shelters: s.shelters.filter(sh => sh.id !== id) })),
      linkShelterToLocations: (shelterId, locationIds) => set(s => ({
        shelters: s.shelters.map(sh => sh.id === shelterId ? { ...sh, linkedLocationIds: locationIds } : sh),
      })),

      addHazardZone: ({ centerLat, centerLng, zoneId, locationId }) => {
        const state = get();
        const { settings, currentUser, alerts, zones } = state;
        // Use real alert if available, otherwise fall back to synthetic alert from zone alerts
        let activeAlert = alerts.find(a => a.isActive);
        if (!activeAlert) {
          const hasZoneAlert = zones.some(z => z.alertActive);
          if (!hasZoneAlert) return;
          // Use selectActiveAlert to get the synthetic alert derived from zone alerts
          activeAlert = selectActiveAlert(state);
          if (!activeAlert) return;
        }
        const now = new Date().toISOString();
        const hz: import('@/types').HazardZone = {
          id: Date.now(),
          zoneId: zoneId ?? null,
          locationId: locationId ?? null,
          centerLat,
          centerLng,
          hotRadius: settings.hazardHotRadius || 200,
          warmRadius: settings.hazardWarmRadius || 500,
          coldRadius: settings.hazardColdRadius || 1000,
          alertId: activeAlert.id,
          isActive: true,
          isLocked: true,
          createdBy: currentUser?.name || 'System',
          createdAt: now,
          windDirectionDeg: null,
          windMode: null,
          hazardShape: 'circle',
        };
        set(s => ({ hazardZones: [...s.hazardZones, hz] }));
      },

      removeHazardZone: (id) => {
        set(s => ({ hazardZones: s.hazardZones.filter(hz => hz.id !== id) }));
      },

      unlockHazardZone: (id) => {
        set(s => ({
          hazardZones: s.hazardZones.map(hz => hz.id === id ? { ...hz, isLocked: false } : hz),
        }));
      },

      applyDefaultsToHazardZone: (id) => {
        const { settings } = get();
        set(s => ({
          hazardZones: s.hazardZones.map(hz => hz.id === id ? {
            ...hz,
            hotRadius: settings.hazardHotRadius || 200,
            warmRadius: settings.hazardWarmRadius || 500,
            coldRadius: settings.hazardColdRadius || 1000,
          } : hz),
        }));
      },

      clearHazardZones: () => {
        set({ hazardZones: [] });
      },

      updatePersonnelLocation: (loc) => set(s => ({
        personnelLocations: { ...s.personnelLocations, [loc.userId]: loc },
      })),

      batchUpdatePersonnelLocations: (locs) => set(s => {
        const next = { ...s.personnelLocations };
        for (const loc of locs) {
          next[loc.userId] = loc;
        }
        return { personnelLocations: next };
      }),

      clearPersonnelLocations: () => set({ personnelLocations: {} }),

      sendZoneNotification: (zoneId, message) => {
        const { zones, currentUser } = get();
        const zone = zones.find(z => z.id === zoneId);
        if (!zone) return;
        const notification: ZoneNotification = {
          id: Date.now(),
          zoneId,
          zoneName: zone.name,
          message: message.trim(),
          sentBy: currentUser?.name || 'Admin',
          sentAt: new Date().toISOString(),
        };
        set(s => ({ zoneNotifications: [notification, ...s.zoneNotifications] }));
      },

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

      updateSettings: (partial) => set(s => ({ settings: { ...s.settings, ...partial } })),

      addActivityLog: (log) => {
        set(s => ({ activityLogs: [{ ...log, id: Date.now() }, ...s.activityLogs].slice(0, 50) }));
      },

      getActiveAlert: () => get().alerts.find(a => a.isActive) || null,
      getLocationsByZone: (zone) => {
        const z = get().zones.find(zn => zn.name === zone);
        return get().locations.filter(l =>
          z ? l.zoneId === z.id && l.isActive : l.zone === zone && l.isActive
        );
      },

      // ─── Permission Management ─────────────────────────────────────────
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
        // Super Admin and IT have all permissions implicitly
        if (user.role === 'Super Admin' || user.role === 'IT') return [
          'canViewGlobalLiveMap', 'canPlaceWarningZone', 'canEditHazardZone',
          'canDeleteHazardZone', 'canUnlockHazardZone', 'canManageShelters', 'canReviewAlertMonitor',
          'canChangeWindDirection',
        ];
        // ECO users get these permissions by default
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
    }),
    {
      name: 'keas-mobile-store-v18',
      version: 18,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted: any, version: number) => {
        const state = persisted as any;
        if (version < 1) {
          // Backfill zone alert fields
          if (Array.isArray(state?.zones)) {
            state.zones = state.zones.map((z: any) => ({
              ...z,
              alertActive: z.alertActive ?? false,
              alertType: z.alertType ?? null,
              alertPriority: z.alertPriority ?? null,
              alertMessage: z.alertMessage ?? '',
              alertUpdatedAt: z.alertUpdatedAt ?? null,
              alertHistory: z.alertHistory ?? [],
            }));
          }
          if (Array.isArray(state?.locations)) {
            state.locations = state.locations.map((loc: any) => ({
              ...loc,
              alertHistory: loc.alertHistory ?? [],
            }));
          }
        }
        if (version < 2) {
          // Fix zoneId mapping: resolve from zone name → zone.id
          const zoneNameToId = new Map<string, number>();
          if (Array.isArray(state?.zones)) {
            for (const z of state.zones) {
              zoneNameToId.set(z.name, z.id);
            }
          }
          if (Array.isArray(state?.locations)) {
            state.locations = state.locations.map((loc: any) => ({
              ...loc,
              zoneId: (loc.zoneId && loc.zoneId !== 0)
                ? loc.zoneId
                : (zoneNameToId.get(loc.zone) ?? 0),
            }));
          }
        }
        if (version < 3) {
          // Backfill zoneId / locationId on users
          const zoneNameToId = new Map<string, number>();
          if (Array.isArray(state?.zones)) {
            for (const z of state.zones) zoneNameToId.set(z.name, z.id);
          }
          const locKey = (name: string, zoneId: number) => `${zoneId}:${name}`;
          const locNameToId = new Map<string, number>();
          if (Array.isArray(state?.locations)) {
            for (const l of state.locations) locNameToId.set(locKey(l.name, l.zoneId), l.id);
          }
          if (Array.isArray(state?.users)) {
            state.users = state.users.map((u: any) => {
              const zid = u.zoneId ?? zoneNameToId.get(u.zone) ?? 0;
              const lid = u.locationId ?? locNameToId.get(locKey(u.location, zid)) ?? 0;
              return { ...u, zoneId: zid, locationId: lid };
            });
          }
        }
        if (version < 4) {
          if (!state.ecoAssignments || !Array.isArray(state.ecoAssignments) || state.ecoAssignments.length === 0) {
            state.ecoAssignments = seedEcoAssignments;
          }
          if (!state.supervisorAssignments || !Array.isArray(state.supervisorAssignments) || state.supervisorAssignments.length === 0) {
            state.supervisorAssignments = seedSupervisorAssignments;
          }
        }
        if (version < 5) {
          // Flatten location hierarchy: single CPF zone with 7 locations
          state.zones = seedZones;
          state.locations = seedLocations;
          state.users = seedUsers;
          state.supervisorAssignments = seedSupervisorAssignments;
        }
        if (version < 6) {
          // Backfill expectedManpower on locations
          if (Array.isArray(state?.locations)) {
            state.locations = state.locations.map((loc: any) => ({
              ...loc,
              expectedManpower: loc.expectedManpower ?? 0,
            }));
          }
        }
        if (version < 7) {
          // Simplify status model: remove missing + no_reply, replace with pending
          if (Array.isArray(state?.users)) {
            state.users = state.users.map((u: any) => ({
              ...u,
              status: u.status === 'missing' || u.status === 'no_reply' ? 'pending' : u.status,
            }));
          }
          if (Array.isArray(state?.alerts)) {
            state.alerts = state.alerts.map((a: any) => ({
              ...a,
              stats: a.stats ? {
                confirmed: a.stats.confirmed ?? 0,
                pending: (a.stats.pending ?? 0) + (a.stats.missing ?? 0) + (a.stats.noReply ?? 0),
                needHelp: a.stats.needHelp ?? 0,
                total: a.stats.total ?? 0,
              } : a.stats,
            }));
          }
        }
        if (version < 8) {
          if (!state.shelters || !Array.isArray(state.shelters)) {
            state.shelters = seedShelters;
          }
        }
        if (version < 9) {
          if (Array.isArray(state?.users) && !state.users.find((u: any) => u.badge === '200001')) {
            state.users.push({
              id: 51, name: 'Contractor Demo', badge: '200001', password: 'demo1234',
              role: 'User', zone: 'CPF', zoneId: 1, location: 'OT-1', locationId: 1,
              status: 'confirmed', accountStatus: 'active',
              lastActivity: new Date().toISOString(), isActive: true,
            });
          }
        }
        if (version < 10) {
          if (Array.isArray(state?.users)) {
            state.users = state.users.map((u: any) => ({
              ...u,
              userType: u.userType ?? (u.badge === '200001' ? 'Contract' : 'Aramco'),
              mobileNumber: u.mobileNumber ?? '',
              approvalStatus: u.approvalStatus ?? 'approved',
              approvedBy: u.approvedBy ?? null,
              approvedAt: u.approvedAt ?? null,
              rejectionReason: u.rejectionReason ?? null,
            }));
          }
        }
        if (version < 11) {
          if (Array.isArray(state?.locations)) {
            state.locations = state.locations.map((l: any) => ({
              ...l,
              polygonPoints: l.polygonPoints ?? [],
            }));
          }
          if (Array.isArray(state?.shelters)) {
            state.shelters = state.shelters.map((s: any) => ({
              ...s,
              linkedLocationIds: s.linkedLocationIds ?? [],
            }));
          }
        }
        if (version < 12) {
          if (!Array.isArray(state?.zoneNotifications)) {
            state.zoneNotifications = [];
          }
        }
        if (version < 13) {
          if (!Array.isArray(state?.hazardZones)) {
            state.hazardZones = [];
          }
          if (state?.settings) {
            if (typeof state.settings.hazardRedRadius !== 'number' || isNaN(state.settings.hazardRedRadius)) {
              state.settings.hazardRedRadius = 200;
            }
            if (typeof state.settings.hazardYellowRadius !== 'number' || isNaN(state.settings.hazardYellowRadius)) {
              state.settings.hazardYellowRadius = 500;
            }
            if (typeof state.settings.hazardGreenRadius !== 'number' || isNaN(state.settings.hazardGreenRadius)) {
              state.settings.hazardGreenRadius = 1000;
            }
          }
        }
        if (version < 14) {
          // Rename radius fields: red→hot, yellow→warm, green→cold; add isLocked + wind fields
          if (state?.settings) {
            state.settings.hazardHotRadius = state.settings.hazardRedRadius ?? state.settings.hazardHotRadius ?? 200;
            state.settings.hazardWarmRadius = state.settings.hazardYellowRadius ?? state.settings.hazardWarmRadius ?? 500;
            state.settings.hazardColdRadius = state.settings.hazardGreenRadius ?? state.settings.hazardColdRadius ?? 1000;
            delete state.settings.hazardRedRadius;
            delete state.settings.hazardYellowRadius;
            delete state.settings.hazardGreenRadius;
          }
          if (Array.isArray(state?.hazardZones)) {
            state.hazardZones = state.hazardZones.map((hz: any) => ({
              ...hz,
              hotRadius: hz.redRadius ?? hz.hotRadius ?? 200,
              warmRadius: hz.yellowRadius ?? hz.warmRadius ?? 500,
              coldRadius: hz.greenRadius ?? hz.coldRadius ?? 1000,
              isLocked: hz.isLocked ?? true,
              windDirectionDeg: hz.windDirectionDeg ?? null,
              windMode: hz.windMode ?? null,
              hazardShape: hz.hazardShape ?? 'circle',
            }));
          }
        }
        if (version < 15) {
          // Backfill locationId on existing zones
          if (Array.isArray(state?.zones)) {
            state.zones = state.zones.map((z: any) => ({
              ...z,
              locationId: z.locationId ?? null,
            }));
          }
        }
        if (version < 16) {
          // canChangeWindDirection added — no data migration needed
          // (getUserPermissions grants it dynamically for Super Admin/IT/ECO roles)
        }
        if (version < 17) {
          // emergencyModes was not persisted before — seed a safe default
          if (!state.emergencyModes) {
            state.emergencyModes = {
              shelterIn: false,
              blackout: false,
              shelterInActivatedAt: null,
              shelterInActivatedBy: null,
              blackoutActivatedAt: null,
              blackoutActivatedBy: null,
            };
          }
        }
        if (version < 18) {
          // permissionAssignments was not persisted before — seed empty array
          if (!Array.isArray(state.permissionAssignments)) {
            state.permissionAssignments = [];
          }
        }
        return persisted as AppState;
      },
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
        ecoAssignments: state.ecoAssignments,
        supervisorAssignments: state.supervisorAssignments,
        shelters: state.shelters,
        hazardZones: state.hazardZones,
        zoneNotifications: state.zoneNotifications,
        windDirection: state.windDirection,
        windSetBy: state.windSetBy,
        windSetAt: state.windSetAt,
        emergencyModes: state.emergencyModes,
        permissionAssignments: state.permissionAssignments,
      }),
    },
  ),
);

let _cachedZoneAlert: import('@/types').Alert | null = null;
let _cachedZoneAlertKey = '';

export const selectActiveAlert = (s: AppState) => {
  const fromAlerts = s.alerts.find(a => a.isActive);
  if (fromAlerts) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return fromAlerts;
  }
  const activeZones = s.zones.filter(z => z.alertActive);
  if (activeZones.length === 0) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return null;
  }
  const first = activeZones[0];
  const activeZoneIds = new Set(activeZones.map(z => z.id));
  const zoneUsers = s.users.filter(u => activeZoneIds.has(u.zoneId) && u.isActive);
  const confirmed = zoneUsers.filter(u => u.status === 'confirmed').length;
  const pending = zoneUsers.filter(u => u.status === 'pending').length;
  const needHelp = zoneUsers.filter(u => u.status === 'need_help').length;
  const total = zoneUsers.length;
  const zoneIdKey = activeZones.map(z => z.id).sort().join(',');
  const cacheKey = `${zoneIdKey}|${first.alertType}|${first.alertMessage}|${first.alertPriority}|${confirmed}|${pending}|${needHelp}|${total}`;

  if (_cachedZoneAlert && _cachedZoneAlertKey === cacheKey) {
    return _cachedZoneAlert;
  }

  _cachedZoneAlert = {
    id: -1,
    type: first.alertType || 'Zone Alert',
    zone: activeZones.map(z => z.name).join(', '),
    title: `${activeZones.length} Zone Alert${activeZones.length > 1 ? 's' : ''}`,
    message: first.alertMessage || '',
    timestamp: first.alertUpdatedAt || new Date().toISOString(),
    sentBy: 'System',
    priority: first.alertPriority || 'High',
    status: 'active' as const,
    isActive: true,
    stats: { confirmed, pending, needHelp, total },
  } as import('@/types').Alert;
  _cachedZoneAlertKey = cacheKey;
  return _cachedZoneAlert;
};
export const selectHasActiveAlert = (s: AppState) => s.alerts.some(a => a.isActive) || s.zones.some(z => z.alertActive);
/** True only when a real (non-synthetic) alert is active — id !== -1. */
export const selectHasRealAlert = (s: AppState) => s.alerts.some(a => a.isActive);

/**
 * Pre-built permission selectors — safe to use inline with useStore().
 * These are stable references that will never cause re-render loops.
 */
const _permSel = (permission: import('@/types').PermissionKey) =>
  (s: AppState): boolean => s.currentUser ? s.hasPermission(s.currentUser.id, permission) : false;

export const selectCanViewGlobalLiveMap = _permSel('canViewGlobalLiveMap');
export const selectCanPlaceWarningZone = _permSel('canPlaceWarningZone');
export const selectCanEditHazardZone = _permSel('canEditHazardZone');
export const selectCanDeleteHazardZone = _permSel('canDeleteHazardZone');
export const selectCanUnlockHazardZone = _permSel('canUnlockHazardZone');
export const selectCanManageShelters = _permSel('canManageShelters');
export const selectCanReviewAlertMonitor = _permSel('canReviewAlertMonitor');
export const selectCanChangeWindDirection = _permSel('canChangeWindDirection');

/**
 * @deprecated Use the pre-built selectCan* selectors instead.
 * This factory is unsafe when called inline inside a component render
 * (e.g. useStore(selectCurrentUserHasPermission('x'))) because it creates
 * a new function reference every render, causing infinite re-render loops.
 */
export const selectCurrentUserHasPermission = _permSel;
