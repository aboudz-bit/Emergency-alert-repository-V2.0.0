import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export { useShallow } from 'zustand/react/shallow';
import type {
  User, Alert, Zone, Location, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertType, ZoneType,
  AuditLogEntry, AuditActionType, DeliveryChannel, AuditTargetType,
  EcoAssignment, EcoSlot,
  SupervisorAssignment,
  HazardZone,
  PermissionKey, UserPermissionAssignment,
  EmergencyModes,
  EmploymentType,
  Language,
  LocationAlertType, AlertPriority,
} from '@/types';
import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings, seedEcoAssignments,
  seedSupervisorAssignments,
} from '@/lib/mock-data';

let _historyIdCounter = Date.now();
function nextHistoryId() { return ++_historyIdCounter; }

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

  // ECO assignments
  ecoAssignments: EcoAssignment[];

  // Supervisor assignments (per-location)
  supervisorAssignments: SupervisorAssignment[];

  // Hazard zones (temporary, linked to active alert)
  hazardZones: HazardZone[];

  // Audit log (system-wide operational log)
  auditLog: AuditLogEntry[];

  // Global broadcast banner state
  activeBroadcast: {
    alertId: number;
    alertType: AlertType;
    priority: string;
    zone: string;
    message: string;
    timestamp: string;
  } | null;

  // ── Auth actions ────────────────────────────────────────────────────────────
  login: (badge: string, password: string, roleOverride?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  resetToSeedData: () => void;
  registerUser: (data: { name: string; badge: string; password: string; zone: 'CPF' | 'Camp'; location: string; employmentType: EmploymentType }) => { success: boolean; error?: string };

  setLanguage: (language: Language) => void;

  // ── User/Admin management ────────────────────────────────────────────────────
  createSuperAdmin: (data: { name: string; badge: string; password: string }) => { success: boolean; error?: string };
  toggleAccountStatus: (userId: number) => void;
  resetPassword: (userId: number, newPassword: string) => void;
  updateUserResponse: (userId: number, status: UserResponseStatus) => void;

  // ── Alert actions ────────────────────────────────────────────────────────────
  createAlert: (data: Omit<Alert, 'id' | 'stats' | 'isActive' | 'status'> & { deliveryChannels?: DeliveryChannel[] }) => Alert;
  sendAllClear: () => void;
  closeAlert: (alertId: number) => void;

  // ── Audit log actions ──────────────────────────────────────────────────────
  addAuditEntry: (entry: Omit<AuditLogEntry, 'id'>) => void;

  // ── Broadcast actions ──────────────────────────────────────────────────────
  clearBroadcast: () => void;

  // ── Emergency mode actions ──────────────────────────────────────────────
  emergencyModes: EmergencyModes;
  toggleShelterIn: () => void;
  toggleBlackout: () => void;

  // ── ECO actions ────────────────────────────────────────────────────────────
  assignECO: (slot: EcoSlot, userId: number, zoneId: number, zoneName: string, notes?: string) => void;
  removeECO: (slot: EcoSlot) => void;
  toggleECOActive: (slot: EcoSlot) => void;
  getEcoAssignment: (slot: EcoSlot) => EcoAssignment | undefined;
  getCurrentUserEcoAssignment: () => EcoAssignment | null;

  // ── Supervisor actions ──────────────────────────────────────────────────────
  assignSupervisor: (locationId: number, userId: number, notes?: string) => void;
  assignBackupSupervisor: (locationId: number, userId: number, notes?: string) => void;
  removeSupervisor: (locationId: number) => void;
  removeBackupSupervisor: (locationId: number) => void;
  toggleSupervisorActive: (locationId: number) => void;
  toggleBackupSupervisorActive: (locationId: number) => void;
  updateLocationManpower: (locationId: number, totalManpower: number) => void;
  getSupervisorAssignment: (locationId: number) => SupervisorAssignment | undefined;

  // ── Mobile response ─────────────────────────────────────────────────────────
  respondToAlert: (response: 'confirmed' | 'need_help') => void;

  // ── Zone actions ─────────────────────────────────────────────────────────────
  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: number, partial: Partial<Zone>) => void;
  disableZone: (id: number) => void;
  deleteZone: (id: number) => void;
  activateZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  deactivateZoneAlert: (zoneId: number) => void;
  editZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;

  // ── Location actions ─────────────────────────────────────────────────────────
  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: number, partial: Partial<Location>) => void;
  disableLocation: (id: number) => void;
  deleteLocation: (id: number) => void;

  // ── Hazard Zone actions ──────────────────────────────────────────────────────
  addHazardZone: (data: { centerLat: number; centerLng: number; zoneId?: number | null; locationId?: number | null }) => void;
  removeHazardZone: (id: number) => void;
  unlockHazardZone: (id: number) => void;
  applyDefaultsToHazardZone: (id: number) => void;
  clearHazardZones: () => void;

  // ── Settings ─────────────────────────────────────────────────────────────────
  updateSettings: (partial: Partial<AppSettings>) => void;
  updateNotificationSettings: (partial: Partial<AppSettings['notifications']>) => void;

  // ── Activity log ─────────────────────────────────────────────────────────────
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;

  // ── Permission management ─────────────────────────────────────────────────────
  permissionAssignments: UserPermissionAssignment[];
  assignPermission: (userId: number, permission: PermissionKey) => void;
  removePermission: (userId: number, permission: PermissionKey) => void;
  setUserPermissions: (userId: number, permissions: PermissionKey[]) => void;
  getUserPermissions: (userId: number) => PermissionKey[];
  hasPermission: (userId: number, permission: PermissionKey) => boolean;

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
      ecoAssignments: seedEcoAssignments,
      supervisorAssignments: seedSupervisorAssignments,
      hazardZones: [],
      auditLog: [],
      activeBroadcast: null,
      permissionAssignments: [],
      emergencyModes: {
        shelterIn: false,
        blackout: false,
        shelterInActivatedAt: null,
        shelterInActivatedBy: null,
        blackoutActivatedAt: null,
        blackoutActivatedBy: null,
      },

      // ── Auth ──────────────────────────────────────────────────────────────────

      login: (badge, password, roleOverride) => {
        const { users, ecoAssignments, supervisorAssignments } = get();

        console.log('[LOGIN] badge:', badge, 'roleOverride:', roleOverride);
        console.log('[LOGIN] ecoAssignments count:', ecoAssignments.length, JSON.stringify(ecoAssignments.map(a => ({ slot: a.ecoSlot, userId: a.assignedUserId, active: a.active }))));
        console.log('[LOGIN] supervisorAssignments count:', supervisorAssignments.length);

        let user: User | undefined;

        if (badge && badge.trim()) {
          user = users.find(u => u.badge === badge.trim());
          console.log('[LOGIN] found by badge:', user ? `${user.name} (id=${user.id}, role=${user.role})` : 'NOT FOUND');
        }

        if (!user && roleOverride) {
          if (roleOverride === 'Super Admin') {
            user = users.find(u => u.role === 'Super Admin' && u.accountStatus === 'active');
          } else if (roleOverride === 'IT') {
            user = users.find(u => u.role === 'IT' && u.accountStatus === 'active');
          } else {
            user = users.find(u => u.role === 'User' && u.accountStatus === 'active');
          }
          console.log('[LOGIN] fallback by role:', user ? `${user.name} (id=${user.id})` : 'NOT FOUND');
        }

        if (!user) return { success: false, error: 'Badge number not found.' };
        if (user.accountStatus === 'disabled') return { success: false, error: 'Account is disabled. Contact IT.' };
        if (!roleOverride && user.password !== password) return { success: false, error: 'Incorrect password.' };

        const ecoA = ecoAssignments.find(a => a.assignedUserId === user!.id && a.active);
        console.log('[LOGIN] ECO check for userId', user.id, '→', ecoA ? `FOUND slot ${ecoA.ecoSlot}` : 'NONE');
        if (ecoA) {
          user = {
            ...user,
            isECOAssigned: true,
            ecoSlot: ecoA.ecoSlot,
            ecoZoneId: ecoA.assignedZoneId ?? undefined,
            ecoZoneName: ecoA.assignedZoneName ?? undefined,
            ecoAssignmentActive: true,
            ecoAssignedAt: ecoA.assignedAt ?? undefined,
            ecoAssignedByUserId: ecoA.assignedByUserId ?? undefined,
            ecoAssignedByName: ecoA.assignedByName ?? undefined,
            currentOperationalLocation: 'CCR',
          };
        }

        const supA = supervisorAssignments.find(a => a.supervisorUserId === user!.id && a.supervisorActive);
        console.log('[LOGIN] Supervisor check for userId', user.id, '→', supA ? `FOUND loc ${supA.locationName}` : 'NONE');
        if (supA) {
          user = {
            ...user,
            isSupervisorAssigned: true,
            supervisorLocationId: supA.locationId,
            supervisorLocationName: supA.locationName,
            supervisorZoneName: supA.zoneName,
            supervisorAssignmentActive: true,
            supervisorAssignedAt: supA.assignedAt ?? undefined,
            supervisorAssignedByUserId: supA.assignedByUserId ?? undefined,
            supervisorAssignedByName: supA.assignedByName ?? undefined,
          };
        }

        const backA = supervisorAssignments.find(a => a.backupSupervisorUserId === user!.id && a.backupActive);
        console.log('[LOGIN] Backup check for userId', user.id, '→', backA ? `FOUND loc ${backA.locationName}` : 'NONE');
        if (backA) {
          user = {
            ...user,
            isBackupSupervisorAssigned: true,
            supervisorLocationId: backA.locationId,
            supervisorLocationName: backA.locationName,
            supervisorZoneName: backA.zoneName,
            supervisorAssignmentActive: true,
            supervisorAssignedAt: backA.assignedAt ?? undefined,
            supervisorAssignedByUserId: backA.assignedByUserId ?? undefined,
            supervisorAssignedByName: backA.assignedByName ?? undefined,
          };
        }

        console.log('[LOGIN] Final user flags:', {
          isECOAssigned: user.isECOAssigned,
          ecoAssignmentActive: user.ecoAssignmentActive,
          isSupervisorAssigned: user.isSupervisorAssigned,
          isBackupSupervisorAssigned: user.isBackupSupervisorAssigned,
          supervisorAssignmentActive: user.supervisorAssignmentActive,
        });

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

      setLanguage: (language) => {
        const { currentUser } = get();
        if (!currentUser || currentUser.employmentType !== 'Contract') return;
        set({
          currentUser: { ...currentUser, language },
          users: get().users.map(u =>
            u.id === currentUser.id ? { ...u, language } : u,
          ),
        });
      },

      resetToSeedData: () => {
        set({
          isAuthenticated: false,
          currentUser: null,
          mobileUserResponse: null,
          users: seedUsers,
          alerts: seedAlerts,
          zones: seedZones,
          locations: seedLocations,
          settings: seedSettings,
          activityLogs: seedActivityLogs,
          ecoAssignments: seedEcoAssignments,
          supervisorAssignments: seedSupervisorAssignments,
          hazardZones: [],
          auditLog: [],
          activeBroadcast: null,
        });
      },

      registerUser: ({ name, badge, password, zone, location, employmentType }) => {
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
          employmentType,
          alertResponseStatus: null,
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
          employmentType: 'Aramco',
          alertResponseStatus: null,
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
          // recalculate active alert stats (only count active users)
          const activeUsers = users.filter(u => u.isActive);
          const alerts = s.alerts.map(a => {
            if (!a.isActive) return a;
            return {
              ...a,
              stats: {
                confirmed: activeUsers.filter(u => u.status === 'confirmed').length,
                missing: activeUsers.filter(u => u.status === 'missing').length,
                noReply: activeUsers.filter(u => u.status === 'no_reply').length,
                needHelp: activeUsers.filter(u => u.status === 'need_help').length,
                total: activeUsers.length,
              },
            };
          });
          return { users, alerts };
        });
      },

      // ── Alert actions ─────────────────────────────────────────────────────────

      createAlert: (data) => {
        const { users, currentUser } = get();
        const channels = data.deliveryChannels || ['app'];
        const operatorName = currentUser?.name || data.sentBy || 'Control Room Operator';
        const operatorId = currentUser?.id || null;
        const now = new Date().toISOString();

        const activeUsers = users.filter(u => u.isActive);
        const newAlert: Alert = {
          ...data,
          id: Date.now(),
          status: 'active',
          isActive: true,
          stats: {
            confirmed: 0,
            missing: 0,
            noReply: activeUsers.length,
            needHelp: 0,
            total: activeUsers.length,
          },
          deliveryChannels: channels,
          soundActive: channels.includes('sound'),
          broadcastActive: channels.includes('broadcast'),
          notificationSentAt: channels.includes('app') ? now : undefined,
          triggeredByName: operatorName,
          triggeredByUserId: operatorId,
        };

        const broadcastState = channels.includes('broadcast') ? {
          alertId: newAlert.id,
          alertType: newAlert.type,
          priority: newAlert.priority,
          zone: newAlert.zone,
          message: newAlert.message,
          timestamp: now,
        } : null;

        // Auto-activate emergency modes based on alert type
        const emergencyModes = { ...get().emergencyModes };
        if (data.type === 'Shelter-in' && !emergencyModes.shelterIn) {
          emergencyModes.shelterIn = true;
          emergencyModes.shelterInActivatedAt = now;
          emergencyModes.shelterInActivatedBy = operatorName;
        }
        if (data.type === 'Blackout' && !emergencyModes.blackout) {
          emergencyModes.blackout = true;
          emergencyModes.blackoutActivatedAt = now;
          emergencyModes.blackoutActivatedBy = operatorName;
        }

        // Single atomic set: close old alert + add new alert + clear hazard zones
        // This prevents an intermediate state where activeAlert === null
        set(s => ({
          alerts: [newAlert, ...s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now, soundActive: false, broadcastActive: false } : a)],
          users: s.users.map(u => u.isActive ? { ...u, status: 'no_reply' as UserResponseStatus } : u),
          activeBroadcast: broadcastState,
          mobileUserResponse: null,
          hazardZones: [],
          emergencyModes,
        }));

        // Audit: alert activated
        get().addAuditEntry({
          timestamp: now,
          actionType: 'activated',
          zoneName: data.zone,
          alertType: data.type,
          priority: data.priority,
          message: data.message,
          triggeredByUserId: operatorId,
          triggeredByName: operatorName,
          targetType: 'zone',
          targetName: data.zone,
          channelUsed: channels,
        });

        // Audit per channel
        if (channels.includes('app')) {
          get().addAuditEntry({
            timestamp: now,
            actionType: 'notification_sent',
            zoneName: data.zone,
            alertType: data.type,
            priority: data.priority,
            message: data.message,
            triggeredByUserId: operatorId,
            triggeredByName: operatorName,
            targetType: 'zone',
            targetName: data.zone,
            channelUsed: 'app',
            notes: 'In-app notification sent',
          });
        }
        if (channels.includes('sound')) {
          get().addAuditEntry({
            timestamp: now,
            actionType: 'sound_triggered',
            zoneName: data.zone,
            alertType: data.type,
            priority: data.priority,
            message: data.message,
            triggeredByUserId: operatorId,
            triggeredByName: operatorName,
            targetType: 'zone',
            targetName: data.zone,
            channelUsed: 'sound',
            notes: 'Alarm sound activated',
          });
        }
        if (channels.includes('broadcast')) {
          get().addAuditEntry({
            timestamp: now,
            actionType: 'broadcast_sent',
            zoneName: data.zone,
            alertType: data.type,
            priority: data.priority,
            message: data.message,
            triggeredByUserId: operatorId,
            triggeredByName: operatorName,
            targetType: 'broadcast',
            targetName: data.zone,
            channelUsed: 'broadcast',
            notes: 'Emergency broadcast banner activated',
          });
        }

        get().addActivityLog({
          type: 'alert',
          message: `${data.type} alert broadcast to ${data.zone} zone by ${operatorName}. Channels: ${channels.join(', ')}.`,
          timestamp: now,
          actorId: operatorId ?? undefined,
          actorName: operatorName,
        });

        return newAlert;
      },

      sendAllClear: () => {
        const { currentUser, users, alerts } = get();
        const sentBy = currentUser?.name || 'System Auto';
        const operatorId = currentUser?.id || null;
        const now = new Date().toISOString();
        const prevActive = alerts.find(a => a.isActive);

        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now, soundActive: false, broadcastActive: false } : a),
          users: s.users.map(u => u.isActive ? { ...u, status: 'confirmed' as UserResponseStatus } : u),
          mobileUserResponse: 'confirmed' as UserResponseStatus,
          activeBroadcast: null,
          hazardZones: [],
          emergencyModes: {
            shelterIn: false,
            blackout: false,
            shelterInActivatedAt: null,
            shelterInActivatedBy: null,
            blackoutActivatedAt: null,
            blackoutActivatedBy: null,
          },
        }));

        const allClearAlert: Alert = {
          id: Date.now(),
          type: 'All Clear',
          zone: 'All Zones',
          title: 'ALL CLEAR',
          message: 'The emergency condition has been fully resolved. All personnel may return to normal operations.',
          timestamp: now,
          sentBy,
          priority: 'High',
          status: 'closed',
          isActive: false,
          stats: { confirmed: users.filter(u => u.isActive).length, missing: 0, noReply: 0, needHelp: 0, total: users.filter(u => u.isActive).length },
          triggeredByName: sentBy,
          triggeredByUserId: operatorId,
        };

        set(s => ({ alerts: [allClearAlert, ...s.alerts] }));

        if (prevActive) {
          get().addAuditEntry({
            timestamp: now,
            actionType: 'deactivated',
            zoneName: prevActive.zone,
            alertType: prevActive.type,
            priority: prevActive.priority,
            message: 'All Clear — emergency resolved',
            triggeredByUserId: operatorId,
            triggeredByName: sentBy,
            targetType: 'zone',
            targetName: prevActive.zone,
            channelUsed: prevActive.deliveryChannels || ['app'],
            notes: 'All Clear broadcast',
          });
        }

        get().addActivityLog({
          type: 'alert',
          message: `All Clear broadcast by ${sentBy}. Emergency resolved.`,
          timestamp: now,
          actorId: operatorId ?? undefined,
          actorName: sentBy,
        });
      },

      closeAlert: (alertId) => {
        const { currentUser, alerts } = get();
        const now = new Date().toISOString();
        const alert = alerts.find(a => a.id === alertId);
        const operatorName = currentUser?.name || 'Control Room Operator';

        set(s => ({
          alerts: s.alerts.map(a =>
            a.id === alertId ? { ...a, isActive: false, status: 'closed' as const, closedAt: now, soundActive: false, broadcastActive: false } : a,
          ),
          users: s.users.map(u => u.isActive ? { ...u, status: 'confirmed' as UserResponseStatus } : u),
          mobileUserResponse: null,
          activeBroadcast: s.activeBroadcast?.alertId === alertId ? null : s.activeBroadcast,
          hazardZones: s.hazardZones.filter(hz => hz.alertId !== alertId),
        }));

        if (alert) {
          get().addAuditEntry({
            timestamp: now,
            actionType: 'deactivated',
            zoneName: alert.zone,
            alertType: alert.type,
            priority: alert.priority,
            message: 'Alert deactivated',
            triggeredByUserId: currentUser?.id || null,
            triggeredByName: operatorName,
            targetType: 'zone',
            targetName: alert.zone,
            channelUsed: alert.deliveryChannels || ['app'],
          });
        }
      },

      // ── Mobile response ───────────────────────────────────────────────────────

      respondToAlert: (response) => {
        const { currentUser } = get();
        if (!currentUser) return;
        get().updateUserResponse(currentUser.id, response);
        // Map response to alertResponseStatus: confirmed → safe, need_help → need_help
        const alertResponseStatus = response === 'confirmed' ? 'safe' as const : 'need_help' as const;
        set(s => ({
          mobileUserResponse: response,
          users: s.users.map(u =>
            u.id === currentUser.id ? { ...u, alertResponseStatus } : u,
          ),
        }));
      },

      // ── Zone actions ──────────────────────────────────────────────────────────

      addZone: (zone) => {
        set(s => ({ zones: [...s.zones, {
          alertActive: false, alertType: null, alertPriority: null,
          alertMessage: '', alertUpdatedAt: null, alertHistory: [],
          ...zone, id: Date.now(),
        }] }));
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
            alertHistory: [...z.alertHistory, {
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
            alertHistory: [...z.alertHistory, {
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
        }));
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
            alertHistory: [...z.alertHistory, {
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
        }));
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

      // ── Hazard Zone actions ──────────────────────────────────────────────────

      addHazardZone: ({ centerLat, centerLng, zoneId, locationId }) => {
        const { settings, currentUser, alerts } = get();
        // Only allow hazard zones on real alerts (not synthetic zone-alert id:-1)
        const activeAlert = alerts.find(a => a.isActive);
        if (!activeAlert || activeAlert.id <= 0) return;
        const now = new Date().toISOString();
        const hz: HazardZone = {
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
        get().addActivityLog({
          type: 'action',
          message: `Hazard zone placed at ${centerLat.toFixed(4)}, ${centerLng.toFixed(4)} by ${hz.createdBy}.`,
          timestamp: now,
          actorId: currentUser?.id ?? undefined,
          actorName: hz.createdBy,
        });
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

      // ── Audit log ───────────────────────────────────────────────────────────

      addAuditEntry: (entry) => {
        set(s => ({
          auditLog: [{ ...entry, id: Date.now() + Math.random() }, ...s.auditLog],
        }));
      },

      // ── Broadcast ─────────────────────────────────────────────────────────

      clearBroadcast: () => {
        set({ activeBroadcast: null });
      },

      // ── Emergency Modes ──────────────────────────────────────────────────
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

      // ── Supervisor actions ─────────────────────────────────────────────────

      assignSupervisor: (locationId, userId, notes) => {
        const { users, currentUser, supervisorAssignments, locations } = get();
        const targetUser = users.find(u => u.id === userId);
        const loc = locations.find(l => l.id === locationId);
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!targetUser || !loc) return;

        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const prevUserId = assignment?.supervisorUserId;
        const isReassign = prevUserId != null && prevUserId !== userId;

        // Clear previous supervisor's flags if reassigning
        if (isReassign && prevUserId) {
          set(s => ({
            users: s.users.map(u => u.id === prevUserId ? {
              ...u, isSupervisorAssigned: false, supervisorLocationId: null, supervisorLocationName: null,
              supervisorZoneName: null, supervisorAssignmentActive: false, supervisorAssignedAt: null,
              supervisorAssignedByUserId: null, supervisorAssignedByName: null,
            } : u),
          }));
        }

        // Clear target user from any other supervisor slot
        const existingAssignment = supervisorAssignments.find(a => a.supervisorUserId === userId && a.locationId !== locationId);
        if (existingAssignment) {
          set(s => ({
            supervisorAssignments: s.supervisorAssignments.map(a =>
              a.locationId === existingAssignment.locationId ? { ...a, supervisorUserId: null, supervisorUserName: null, supervisorUserBadge: null, supervisorActive: false } : a,
            ),
          }));
        }

        // Also clear target user from any backup slot (user can't be both)
        const existingBackup = get().supervisorAssignments.find(a => a.backupSupervisorUserId === userId);
        if (existingBackup) {
          set(s => ({
            supervisorAssignments: s.supervisorAssignments.map(a =>
              a.locationId === existingBackup.locationId ? { ...a, backupSupervisorUserId: null, backupSupervisorUserName: null, backupSupervisorUserBadge: null, backupActive: false } : a,
            ),
          }));
        }

        // Update or create assignment
        const updatedAssignment: SupervisorAssignment = {
          locationId, locationName: loc.name, zoneName: loc.zone,
          supervisorUserId: userId, supervisorUserName: targetUser.name, supervisorUserBadge: targetUser.badge,
          backupSupervisorUserId: assignment?.backupSupervisorUserId ?? null,
          backupSupervisorUserName: assignment?.backupSupervisorUserName ?? null,
          backupSupervisorUserBadge: assignment?.backupSupervisorUserBadge ?? null,
          supervisorActive: true,
          backupActive: assignment?.backupActive ?? false,
          totalManpower: assignment?.totalManpower ?? loc.totalManpower ?? 0,
          assignedByUserId: adminId, assignedByName: adminName, assignedAt: now,
          notes: notes || assignment?.notes || '',
        };

        set(s => {
          const exists = s.supervisorAssignments.some(a => a.locationId === locationId);
          return {
            supervisorAssignments: exists
              ? s.supervisorAssignments.map(a => a.locationId === locationId ? updatedAssignment : a)
              : [...s.supervisorAssignments, updatedAssignment],
            users: s.users.map(u => u.id === userId ? {
              ...u, isSupervisorAssigned: true, isBackupSupervisorAssigned: false,
              supervisorLocationId: locationId, supervisorLocationName: loc.name, supervisorZoneName: loc.zone,
              supervisorAssignmentActive: true, supervisorAssignedAt: now,
              supervisorAssignedByUserId: adminId, supervisorAssignedByName: adminName,
            } : u),
          };
        });

        get().addAuditEntry({
          timestamp: now, actionType: isReassign ? 'supervisor_reassigned' : 'supervisor_assigned',
          zoneName: loc.zone, alertType: 'Custom', priority: 'Medium',
          message: `Supervisor ${isReassign ? 'reassigned' : 'assigned'}: ${targetUser.name} → ${loc.name} (${loc.zone})`,
          triggeredByUserId: adminId, triggeredByName: adminName,
          targetType: 'location', targetName: loc.name, channelUsed: 'app', notes: notes || undefined,
        });
        get().addActivityLog({ type: 'action', message: `Supervisor ${isReassign ? 'reassigned' : 'assigned'}: ${targetUser.name} → ${loc.name} by ${adminName}.`, timestamp: now, actorId: adminId ?? undefined, actorName: adminName });
      },

      assignBackupSupervisor: (locationId, userId, notes) => {
        const { users, currentUser, supervisorAssignments, locations } = get();
        const targetUser = users.find(u => u.id === userId);
        const loc = locations.find(l => l.id === locationId);
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!targetUser || !loc) return;

        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const prevUserId = assignment?.backupSupervisorUserId;
        const isReassign = prevUserId != null && prevUserId !== userId;

        if (isReassign && prevUserId) {
          set(s => ({
            users: s.users.map(u => u.id === prevUserId ? {
              ...u, isBackupSupervisorAssigned: false, supervisorLocationId: null, supervisorLocationName: null,
              supervisorZoneName: null, supervisorAssignmentActive: false, supervisorAssignedAt: null,
              supervisorAssignedByUserId: null, supervisorAssignedByName: null,
            } : u),
          }));
        }

        // Clear target user from any other backup slot
        const existingBackup = supervisorAssignments.find(a => a.backupSupervisorUserId === userId && a.locationId !== locationId);
        if (existingBackup) {
          set(s => ({
            supervisorAssignments: s.supervisorAssignments.map(a =>
              a.locationId === existingBackup.locationId ? { ...a, backupSupervisorUserId: null, backupSupervisorUserName: null, backupSupervisorUserBadge: null, backupActive: false } : a,
            ),
          }));
        }

        // Also clear target user from any supervisor slot (user can't be both)
        const existingSupervisor = get().supervisorAssignments.find(a => a.supervisorUserId === userId);
        if (existingSupervisor) {
          set(s => ({
            supervisorAssignments: s.supervisorAssignments.map(a =>
              a.locationId === existingSupervisor.locationId ? { ...a, supervisorUserId: null, supervisorUserName: null, supervisorUserBadge: null, supervisorActive: false } : a,
            ),
          }));
        }

        const updatedAssignment: SupervisorAssignment = {
          locationId, locationName: loc.name, zoneName: loc.zone,
          supervisorUserId: assignment?.supervisorUserId ?? null,
          supervisorUserName: assignment?.supervisorUserName ?? null,
          supervisorUserBadge: assignment?.supervisorUserBadge ?? null,
          backupSupervisorUserId: userId, backupSupervisorUserName: targetUser.name, backupSupervisorUserBadge: targetUser.badge,
          supervisorActive: assignment?.supervisorActive ?? false,
          backupActive: true,
          totalManpower: assignment?.totalManpower ?? loc.totalManpower ?? 0,
          assignedByUserId: adminId, assignedByName: adminName, assignedAt: now,
          notes: notes || assignment?.notes || '',
        };

        set(s => {
          const exists = s.supervisorAssignments.some(a => a.locationId === locationId);
          return {
            supervisorAssignments: exists
              ? s.supervisorAssignments.map(a => a.locationId === locationId ? updatedAssignment : a)
              : [...s.supervisorAssignments, updatedAssignment],
            users: s.users.map(u => u.id === userId ? {
              ...u, isBackupSupervisorAssigned: true, isSupervisorAssigned: false,
              supervisorLocationId: locationId, supervisorLocationName: loc.name, supervisorZoneName: loc.zone,
              supervisorAssignmentActive: true, supervisorAssignedAt: now,
              supervisorAssignedByUserId: adminId, supervisorAssignedByName: adminName,
            } : u),
          };
        });

        get().addAuditEntry({
          timestamp: now, actionType: isReassign ? 'backup_supervisor_reassigned' : 'backup_supervisor_assigned',
          zoneName: loc.zone, alertType: 'Custom', priority: 'Medium',
          message: `Backup Supervisor ${isReassign ? 'reassigned' : 'assigned'}: ${targetUser.name} → ${loc.name} (${loc.zone})`,
          triggeredByUserId: adminId, triggeredByName: adminName,
          targetType: 'location', targetName: loc.name, channelUsed: 'app', notes: notes || undefined,
        });
        get().addActivityLog({ type: 'action', message: `Backup Supervisor ${isReassign ? 'reassigned' : 'assigned'}: ${targetUser.name} → ${loc.name} by ${adminName}.`, timestamp: now, actorId: adminId ?? undefined, actorName: adminName });
      },

      removeSupervisor: (locationId) => {
        const { supervisorAssignments, currentUser } = get();
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!assignment?.supervisorUserId) return;
        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const removedId = assignment.supervisorUserId;
        const removedName = assignment.supervisorUserName || 'Unknown';

        set(s => ({
          supervisorAssignments: s.supervisorAssignments.map(a => a.locationId === locationId ? {
            ...a, supervisorUserId: null, supervisorUserName: null, supervisorUserBadge: null, supervisorActive: false,
          } : a),
          users: s.users.map(u => u.id === removedId ? {
            ...u, isSupervisorAssigned: false, supervisorLocationId: null, supervisorLocationName: null,
            supervisorZoneName: null, supervisorAssignmentActive: false, supervisorAssignedAt: null,
            supervisorAssignedByUserId: null, supervisorAssignedByName: null,
          } : u),
        }));
        if (currentUser?.id === removedId) set(s => ({ currentUser: s.users.find(u => u.id === removedId) || null }));
        get().addAuditEntry({ timestamp: now, actionType: 'supervisor_removed', zoneName: assignment.zoneName, alertType: 'Custom', priority: 'Medium', message: `Supervisor removed: ${removedName} from ${assignment.locationName}`, triggeredByUserId: adminId, triggeredByName: adminName, targetType: 'location', targetName: assignment.locationName, channelUsed: 'app' });
        get().addActivityLog({ type: 'action', message: `Supervisor removed (${removedName}) from ${assignment.locationName} by ${adminName}.`, timestamp: now, actorId: adminId ?? undefined, actorName: adminName });
      },

      removeBackupSupervisor: (locationId) => {
        const { supervisorAssignments, currentUser } = get();
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!assignment?.backupSupervisorUserId) return;
        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const removedId = assignment.backupSupervisorUserId;
        const removedName = assignment.backupSupervisorUserName || 'Unknown';

        set(s => ({
          supervisorAssignments: s.supervisorAssignments.map(a => a.locationId === locationId ? {
            ...a, backupSupervisorUserId: null, backupSupervisorUserName: null, backupSupervisorUserBadge: null, backupActive: false,
          } : a),
          users: s.users.map(u => u.id === removedId ? {
            ...u, isBackupSupervisorAssigned: false, supervisorLocationId: null, supervisorLocationName: null,
            supervisorZoneName: null, supervisorAssignmentActive: false, supervisorAssignedAt: null,
            supervisorAssignedByUserId: null, supervisorAssignedByName: null,
          } : u),
        }));
        if (currentUser?.id === removedId) set(s => ({ currentUser: s.users.find(u => u.id === removedId) || null }));
        get().addAuditEntry({ timestamp: now, actionType: 'backup_supervisor_removed', zoneName: assignment.zoneName, alertType: 'Custom', priority: 'Medium', message: `Backup Supervisor removed: ${removedName} from ${assignment.locationName}`, triggeredByUserId: adminId, triggeredByName: adminName, targetType: 'location', targetName: assignment.locationName, channelUsed: 'app' });
        get().addActivityLog({ type: 'action', message: `Backup Supervisor removed (${removedName}) from ${assignment.locationName} by ${adminName}.`, timestamp: now, actorId: adminId ?? undefined, actorName: adminName });
      },

      toggleSupervisorActive: (locationId) => {
        const { supervisorAssignments, currentUser } = get();
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!assignment?.supervisorUserId) return;
        const now = new Date().toISOString();
        const newActive = !assignment.supervisorActive;
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        set(s => ({
          supervisorAssignments: s.supervisorAssignments.map(a => a.locationId === locationId ? { ...a, supervisorActive: newActive } : a),
          users: s.users.map(u => u.id === assignment.supervisorUserId ? { ...u, supervisorAssignmentActive: newActive } : u),
        }));
        if (currentUser?.id === assignment.supervisorUserId) set(s => ({ currentUser: s.users.find(u => u.id === assignment.supervisorUserId) || null }));
        get().addAuditEntry({ timestamp: now, actionType: newActive ? 'supervisor_activated' : 'supervisor_deactivated', zoneName: assignment.zoneName, alertType: 'Custom', priority: 'Medium', message: `Supervisor ${newActive ? 'activated' : 'deactivated'}: ${assignment.supervisorUserName} at ${assignment.locationName}`, triggeredByUserId: adminId, triggeredByName: adminName, targetType: 'location', targetName: assignment.locationName, channelUsed: 'app' });
      },

      toggleBackupSupervisorActive: (locationId) => {
        const { supervisorAssignments, currentUser } = get();
        const assignment = supervisorAssignments.find(a => a.locationId === locationId);
        if (!assignment?.backupSupervisorUserId) return;
        const now = new Date().toISOString();
        const newActive = !assignment.backupActive;
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        set(s => ({
          supervisorAssignments: s.supervisorAssignments.map(a => a.locationId === locationId ? { ...a, backupActive: newActive } : a),
          users: s.users.map(u => u.id === assignment.backupSupervisorUserId ? { ...u, supervisorAssignmentActive: newActive } : u),
        }));
        if (currentUser?.id === assignment.backupSupervisorUserId) set(s => ({ currentUser: s.users.find(u => u.id === assignment.backupSupervisorUserId) || null }));
        get().addAuditEntry({ timestamp: now, actionType: newActive ? 'backup_supervisor_activated' : 'backup_supervisor_deactivated', zoneName: assignment.zoneName, alertType: 'Custom', priority: 'Medium', message: `Backup Supervisor ${newActive ? 'activated' : 'deactivated'}: ${assignment.backupSupervisorUserName} at ${assignment.locationName}`, triggeredByUserId: adminId, triggeredByName: adminName, targetType: 'location', targetName: assignment.locationName, channelUsed: 'app' });
      },

      updateLocationManpower: (locationId, totalManpower) => {
        const { supervisorAssignments, locations, currentUser } = get();
        const loc = locations.find(l => l.id === locationId);
        if (!loc) return;
        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        set(s => ({
          locations: s.locations.map(l => l.id === locationId ? { ...l, totalManpower } : l),
          supervisorAssignments: s.supervisorAssignments.map(a => a.locationId === locationId ? { ...a, totalManpower } : a),
        }));
        get().addAuditEntry({ timestamp: now, actionType: 'manpower_updated', zoneName: loc.zone, alertType: 'Custom', priority: 'Low', message: `Total manpower updated to ${totalManpower} for ${loc.name}`, triggeredByUserId: adminId, triggeredByName: adminName, targetType: 'location', targetName: loc.name, channelUsed: 'app' });
        get().addActivityLog({ type: 'action', message: `Manpower updated: ${loc.name} → ${totalManpower} by ${adminName}.`, timestamp: now, actorId: adminId ?? undefined, actorName: adminName });
      },

      getSupervisorAssignment: (locationId) => get().supervisorAssignments.find(a => a.locationId === locationId),

      // ── ECO actions ─────────────────────────────────────────────────────────

      assignECO: (slot, userId, zoneId, zoneName, notes) => {
        const { users, currentUser, ecoAssignments } = get();
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) return;

        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const prevAssignment = ecoAssignments.find(a => a.ecoSlot === slot);
        const isReassign = prevAssignment?.assignedUserId != null && prevAssignment.assignedUserId !== userId;

        // If reassigning this slot, clear previous user's ECO flags
        if (isReassign && prevAssignment?.assignedUserId) {
          const prevUserId = prevAssignment.assignedUserId;
          set(s => ({
            users: s.users.map(u =>
              u.id === prevUserId ? {
                ...u,
                isECOAssigned: false,
                ecoSlot: null,
                ecoZoneId: null,
                ecoZoneName: null,
                ecoAssignmentActive: false,
                ecoAssignedAt: null,
                ecoAssignedByUserId: null,
                ecoAssignedByName: null,
                currentOperationalLocation: null,
              } : u,
            ),
          }));
        }

        // If target user is already assigned to a different slot, clear that slot first
        const existingSlot = ecoAssignments.find(a => a.assignedUserId === userId && a.ecoSlot !== slot);
        if (existingSlot) {
          set(s => ({
            ecoAssignments: s.ecoAssignments.map(a =>
              a.ecoSlot === existingSlot.ecoSlot ? {
                ecoSlot: existingSlot.ecoSlot,
                assignedUserId: null,
                assignedUserName: null,
                assignedUserBadge: null,
                assignedZoneId: null,
                assignedZoneName: null,
                active: false,
                assignedByUserId: null,
                assignedByName: null,
                assignedAt: null,
                notes: '',
              } : a,
            ),
          }));
        }

        // Update the assignment
        const newAssignment: EcoAssignment = {
          ecoSlot: slot,
          assignedUserId: userId,
          assignedUserName: targetUser.name,
          assignedUserBadge: targetUser.badge,
          assignedZoneId: zoneId,
          assignedZoneName: zoneName,
          active: true,
          assignedByUserId: adminId,
          assignedByName: adminName,
          assignedAt: now,
          notes,
        };

        set(s => ({
          ecoAssignments: s.ecoAssignments.map(a =>
            a.ecoSlot === slot ? newAssignment : a,
          ),
          users: s.users.map(u =>
            u.id === userId ? {
              ...u,
              isECOAssigned: true,
              ecoSlot: slot,
              ecoZoneId: zoneId,
              ecoZoneName: zoneName,
              ecoAssignmentActive: true,
              ecoAssignedAt: now,
              ecoAssignedByUserId: adminId,
              ecoAssignedByName: adminName,
              originalLocation: u.originalLocation || u.location,
              currentOperationalLocation: 'CCR',
            } : u,
          ),
        }));

        // Update currentUser if they're the target
        const updated = get().users.find(u => u.id === userId);
        if (updated && currentUser?.id === userId) {
          set({ currentUser: updated });
        }

        get().addAuditEntry({
          timestamp: now,
          actionType: isReassign ? 'eco_reassigned' : 'eco_assigned',
          zoneName,
          alertType: 'Custom',
          priority: 'Medium',
          message: `ECO ${slot} ${isReassign ? 'reassigned' : 'assigned'} to ${targetUser.name} for zone ${zoneName}`,
          triggeredByUserId: adminId,
          triggeredByName: adminName,
          targetType: 'zone',
          targetName: `ECO ${slot} — ${zoneName}`,
          channelUsed: 'app',
          notes: notes || undefined,
        });

        get().addActivityLog({
          type: 'action',
          message: `ECO ${slot} ${isReassign ? 'reassigned' : 'assigned'} to ${targetUser.name} (${zoneName}) by ${adminName}.`,
          timestamp: now,
          actorId: adminId ?? undefined,
          actorName: adminName,
        });
      },

      removeECO: (slot) => {
        const { ecoAssignments, currentUser } = get();
        const assignment = ecoAssignments.find(a => a.ecoSlot === slot);
        if (!assignment || !assignment.assignedUserId) return;

        const now = new Date().toISOString();
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;
        const removedUserId = assignment.assignedUserId;
        const removedUserName = assignment.assignedUserName || 'Unknown';

        // Fully reset assignment slot to empty state + clear user ECO flags
        set(s => ({
          ecoAssignments: s.ecoAssignments.map(a =>
            a.ecoSlot === slot ? {
              ecoSlot: slot,
              assignedUserId: null,
              assignedUserName: null,
              assignedUserBadge: null,
              assignedZoneId: null,
              assignedZoneName: null,
              active: false,
              assignedByUserId: null,
              assignedByName: null,
              assignedAt: null,
              notes: '',
            } : a,
          ),
          users: s.users.map(u =>
            u.id === removedUserId ? {
              ...u,
              isECOAssigned: false,
              ecoSlot: null,
              ecoZoneId: null,
              ecoZoneName: null,
              ecoAssignmentActive: false,
              ecoAssignedAt: null,
              ecoAssignedByUserId: null,
              ecoAssignedByName: null,
              currentOperationalLocation: null,
            } : u,
          ),
        }));

        // If removed user is current user, update currentUser
        if (currentUser?.id === removedUserId) {
          set(s => ({ currentUser: s.users.find(u => u.id === removedUserId) || null }));
        }

        get().addAuditEntry({
          timestamp: now,
          actionType: 'eco_removed',
          zoneName: assignment.assignedZoneName || '',
          alertType: 'Custom',
          priority: 'Medium',
          message: `ECO ${slot} removed — ${removedUserName} unassigned`,
          triggeredByUserId: adminId,
          triggeredByName: adminName,
          targetType: 'zone',
          targetName: `ECO ${slot}`,
          channelUsed: 'app',
        });

        get().addActivityLog({
          type: 'action',
          message: `ECO ${slot} removed (${removedUserName}) by ${adminName}.`,
          timestamp: now,
          actorId: adminId ?? undefined,
          actorName: adminName,
        });
      },

      toggleECOActive: (slot) => {
        const { ecoAssignments, currentUser } = get();
        const assignment = ecoAssignments.find(a => a.ecoSlot === slot);
        if (!assignment || !assignment.assignedUserId) return;

        const now = new Date().toISOString();
        const newActive = !assignment.active;
        const adminName = currentUser?.name || 'System';
        const adminId = currentUser?.id || null;

        set(s => ({
          ecoAssignments: s.ecoAssignments.map(a =>
            a.ecoSlot === slot ? { ...a, active: newActive } : a,
          ),
          users: s.users.map(u =>
            u.id === assignment.assignedUserId ? {
              ...u,
              ecoAssignmentActive: newActive,
              currentOperationalLocation: newActive ? 'CCR' : null,
            } : u,
          ),
        }));

        if (currentUser?.id === assignment.assignedUserId) {
          set(s => ({ currentUser: s.users.find(u => u.id === assignment.assignedUserId) || null }));
        }

        get().addAuditEntry({
          timestamp: now,
          actionType: newActive ? 'eco_activated' : 'eco_deactivated',
          zoneName: assignment.assignedZoneName || '',
          alertType: 'Custom',
          priority: 'Medium',
          message: `ECO ${slot} ${newActive ? 'activated' : 'deactivated'} — ${assignment.assignedUserName}`,
          triggeredByUserId: adminId,
          triggeredByName: adminName,
          targetType: 'zone',
          targetName: `ECO ${slot} — ${assignment.assignedZoneName}`,
          channelUsed: 'app',
        });
      },

      getEcoAssignment: (slot) => get().ecoAssignments.find(a => a.ecoSlot === slot),

      getCurrentUserEcoAssignment: () => {
        const { currentUser, ecoAssignments } = get();
        if (!currentUser) return null;
        return ecoAssignments.find(a => a.assignedUserId === currentUser.id && a.active) || null;
      },

      // ── Computed helpers ──────────────────────────────────────────────────────

      getActiveAlert: () => get().alerts.find(a => a.isActive) || null,

      getAlertHistory: () => get().alerts.filter(a => !a.isActive),

      getUsersByZone: (zone) => get().users.filter(u => u.zone === zone),

      getLocationsByZone: (zone) => get().locations.filter(l => l.zone === zone && l.isActive),

      // ── Permission Management ─────────────────────────────────────────────────
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
              u.id === userId ? { ...u, permissions: [...(u.permissions || []), permission] } : u
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
              u.id === userId ? { ...u, permissions: [...(u.permissions || []), permission] } : u
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
            u.id === userId ? { ...u, permissions: (u.permissions || []).filter(p => p !== permission) } : u
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
          'canChangeWindDirection',
        ] as PermissionKey[];
        if (user.isECOAssigned && user.ecoAssignmentActive) {
          const base: PermissionKey[] = ['canViewGlobalLiveMap', 'canReviewAlertMonitor', 'canChangeWindDirection'];
          const extra = user.permissions || [];
          return [...new Set([...base, ...extra])] as PermissionKey[];
        }
        return (user.permissions || []) as PermissionKey[];
      },

      hasPermission: (userId, permission) => {
        return get().getUserPermissions(userId).includes(permission);
      },
    }),
    {
      name: 'keas-store-v5',
      storage: createJSONStorage(() => localStorage),
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
        ecoAssignments: state.ecoAssignments,
        supervisorAssignments: state.supervisorAssignments,
        hazardZones: state.hazardZones,
        auditLog: state.auditLog,
        activeBroadcast: state.activeBroadcast,
        permissionAssignments: state.permissionAssignments,
        emergencyModes: state.emergencyModes,
      }),
      merge: (persistedState: any, currentState: any) => {
        if (!persistedState) return currentState;
        const merged = { ...currentState, ...persistedState };
        if (!merged.ecoAssignments || merged.ecoAssignments.length === 0) {
          merged.ecoAssignments = seedEcoAssignments;
        }
        if (!merged.supervisorAssignments || merged.supervisorAssignments.length === 0) {
          merged.supervisorAssignments = seedSupervisorAssignments;
        }
        if (!Array.isArray(merged.hazardZones)) {
          merged.hazardZones = [];
        }
        if (!Array.isArray(merged.permissionAssignments)) {
          merged.permissionAssignments = [];
        }
        if (!merged.emergencyModes) {
          merged.emergencyModes = {
            shelterIn: false, blackout: false,
            shelterInActivatedAt: null, shelterInActivatedBy: null,
            blackoutActivatedAt: null, blackoutActivatedBy: null,
          };
        }
        if (merged.settings) {
          // Migrate old field names if present
          if (merged.settings.hazardRedRadius != null && merged.settings.hazardHotRadius == null) {
            merged.settings.hazardHotRadius = merged.settings.hazardRedRadius;
            delete merged.settings.hazardRedRadius;
          }
          if (merged.settings.hazardYellowRadius != null && merged.settings.hazardWarmRadius == null) {
            merged.settings.hazardWarmRadius = merged.settings.hazardYellowRadius;
            delete merged.settings.hazardYellowRadius;
          }
          if (merged.settings.hazardGreenRadius != null && merged.settings.hazardColdRadius == null) {
            merged.settings.hazardColdRadius = merged.settings.hazardGreenRadius;
            delete merged.settings.hazardGreenRadius;
          }
          if (typeof merged.settings.hazardHotRadius !== 'number' || isNaN(merged.settings.hazardHotRadius)) {
            merged.settings.hazardHotRadius = 200;
          }
          if (typeof merged.settings.hazardWarmRadius !== 'number' || isNaN(merged.settings.hazardWarmRadius)) {
            merged.settings.hazardWarmRadius = 500;
          }
          if (typeof merged.settings.hazardColdRadius !== 'number' || isNaN(merged.settings.hazardColdRadius)) {
            merged.settings.hazardColdRadius = 1000;
          }
        }
        // Backfill zone alert fields for persisted zones that predate this change
        if (Array.isArray(merged.zones)) {
          merged.zones = merged.zones.map((z: any) => ({
            ...z,
            alertActive: z.alertActive ?? false,
            alertType: z.alertType ?? null,
            alertPriority: z.alertPriority ?? null,
            alertMessage: z.alertMessage ?? '',
            alertUpdatedAt: z.alertUpdatedAt ?? null,
            alertHistory: z.alertHistory ?? [],
          }));
        }
        // Migrate old hazard zone field names
        if (Array.isArray(merged.hazardZones)) {
          merged.hazardZones = merged.hazardZones.map((hz: any) => ({
            ...hz,
            hotRadius: hz.redRadius ?? hz.hotRadius ?? 200,
            warmRadius: hz.yellowRadius ?? hz.warmRadius ?? 500,
            coldRadius: hz.greenRadius ?? hz.coldRadius ?? 1000,
            isLocked: hz.isLocked ?? true,
            hazardShape: hz.hazardShape ?? 'circle',
          }));
        }
        return merged;
      },
    },
  ),
);

// ─── Convenience selectors ────────────────────────────────────────────────────

// Cache for synthetic zone-alert object (avoids re-creating every render)
let _cachedZoneAlert: Alert | null = null;
let _cachedZoneAlertKey = '';

/**
 * Returns the active alert. If no real alert is active but one or more zones
 * have zone-level alerts, synthesizes a virtual alert with id:-1 so the UI
 * can still display status. Consumers that need to guard against the synthetic
 * alert should use `selectHasRealAlert`.
 */
export const selectActiveAlert = (s: AppState) => {
  const fromAlerts = s.alerts.find(a => a.isActive);
  if (fromAlerts) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return fromAlerts;
  }
  // Synthesize an alert from active zone-level alerts
  const activeZones = s.zones.filter(z => z.alertActive);
  const hasShelterIn = s.emergencyModes?.shelterIn;
  const hasBlackout = s.emergencyModes?.blackout;
  if (activeZones.length === 0 && !hasShelterIn && !hasBlackout) {
    _cachedZoneAlert = null;
    _cachedZoneAlertKey = '';
    return null;
  }
  if (activeZones.length > 0) {
    const first = activeZones[0];
    const activeZoneIds = new Set(activeZones.map(z => z.id));
    const zoneUsers = s.users.filter(u => activeZoneIds.has((u as any).zoneId) && u.isActive);
    const confirmed = zoneUsers.filter(u => u.status === 'confirmed').length;
    const missing = zoneUsers.filter(u => u.status === 'missing').length;
    const noReply = zoneUsers.filter(u => u.status === 'no_reply').length;
    const needHelp = zoneUsers.filter(u => u.status === 'need_help').length;
    const total = zoneUsers.length;
    const zoneIdKey = activeZones.map(z => z.id).sort().join(',');
    const cacheKey = `${zoneIdKey}|${first.alertType}|${first.alertMessage}|${first.alertPriority}|${confirmed}|${missing}|${noReply}|${needHelp}|${total}`;

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
      stats: { confirmed, missing, noReply, needHelp, total },
    } as Alert;
    _cachedZoneAlertKey = cacheKey;
    return _cachedZoneAlert;
  }

  // Synthesize from emergency modes (shelter-in / blackout)
  const allActiveUsers = s.users.filter(u => u.isActive);
  const emConfirmed = allActiveUsers.filter(u => u.status === 'confirmed').length;
  const emMissing = allActiveUsers.filter(u => u.status === 'missing').length;
  const emNoReply = allActiveUsers.filter(u => u.status === 'no_reply').length;
  const emNeedHelp = allActiveUsers.filter(u => u.status === 'need_help').length;
  const emTotal = allActiveUsers.length;

  if (hasBlackout) {
    _cachedZoneAlert = {
      id: -1,
      type: 'Blackout',
      zone: 'All Zones',
      title: 'Blackout Active',
      message: 'Blackout mode is active. All lights and non-essential systems should be turned off.',
      timestamp: s.emergencyModes.blackoutActivatedAt || new Date().toISOString(),
      sentBy: 'System',
      priority: 'High',
      status: 'active' as const,
      isActive: true,
      stats: { confirmed: emConfirmed, missing: emMissing, noReply: emNoReply, needHelp: emNeedHelp, total: emTotal },
    } as Alert;
    _cachedZoneAlertKey = `blackout|${emConfirmed}|${emMissing}|${emNoReply}|${emNeedHelp}|${emTotal}`;
    return _cachedZoneAlert;
  }

  _cachedZoneAlert = {
    id: -1,
    type: 'Shelter-in',
    zone: 'All Zones',
    title: 'Shelter In Place Active',
    message: 'Shelter-in-place mode is active. All personnel should remain in their current location.',
    timestamp: s.emergencyModes.shelterInActivatedAt || new Date().toISOString(),
    sentBy: 'System',
    priority: 'High',
    status: 'active' as const,
    isActive: true,
    stats: { confirmed: emConfirmed, missing: emMissing, noReply: emNoReply, needHelp: emNeedHelp, total: emTotal },
  } as Alert;
  _cachedZoneAlertKey = `shelter|${emConfirmed}|${emMissing}|${emNoReply}|${emNeedHelp}|${emTotal}`;
  return _cachedZoneAlert;
};

/** True when ANY alert, zone-level alert, or emergency mode is active (includes synthetic id:-1). */
export const selectHasActiveAlert = (s: AppState) =>
  s.alerts.some(a => a.isActive) || s.zones.some(z => z.alertActive) ||
  s.emergencyModes?.shelterIn || s.emergencyModes?.blackout;

/** True only when a real (non-synthetic) alert is active — id !== -1. */
export const selectHasRealAlert = (s: AppState) => s.alerts.some(a => a.isActive);

export const selectAlertHistory = (s: AppState) => s.alerts.filter(a => !a.isActive);
export const selectCPFUsers = (s: AppState) => s.users.filter(u => u.zone === 'CPF');
export const selectCampUsers = (s: AppState) => s.users.filter(u => u.zone === 'Camp');
export const selectAdmins = (s: AppState) =>
  s.users.filter(u => u.role === 'Super Admin' || u.role === 'IT');
