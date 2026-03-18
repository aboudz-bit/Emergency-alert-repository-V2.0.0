import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
export { useShallow } from 'zustand/react/shallow';
import type {
  User, Alert, Zone, Location, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertType, ZoneType,
  AuditLogEntry, AuditActionType, DeliveryChannel, AuditTargetType,
  EcoAssignment, EcoSlot,
} from '@/types';
import {
  seedUsers, seedAlerts, seedZones, seedLocations,
  seedActivityLogs, seedSettings, seedEcoAssignments,
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

  // ECO assignments
  ecoAssignments: EcoAssignment[];

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
  registerUser: (data: { name: string; badge: string; password: string; zone: 'CPF' | 'Camp'; location: string }) => { success: boolean; error?: string };

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

  // ── ECO actions ────────────────────────────────────────────────────────────
  assignECO: (slot: EcoSlot, userId: number, zoneId: number, zoneName: string, notes?: string) => void;
  removeECO: (slot: EcoSlot) => void;
  toggleECOActive: (slot: EcoSlot) => void;
  getEcoAssignment: (slot: EcoSlot) => EcoAssignment | undefined;
  getCurrentUserEcoAssignment: () => EcoAssignment | null;

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
      ecoAssignments: seedEcoAssignments,
      auditLog: [],
      activeBroadcast: null,

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
        const { users, currentUser } = get();
        const channels = data.deliveryChannels || ['app'];
        const operatorName = currentUser?.name || data.sentBy || 'Control Room Operator';
        const operatorId = currentUser?.id || null;
        const now = new Date().toISOString();

        // Close any currently active alert
        set(s => ({
          alerts: s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now, soundActive: false, broadcastActive: false } : a),
          users: s.users.map(u => ({ ...u, status: 'no_reply' as UserResponseStatus })),
          activeBroadcast: null,
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

        set(s => ({
          alerts: [newAlert, ...s.alerts],
          mobileUserResponse: null,
          activeBroadcast: broadcastState,
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
          users: s.users.map(u => ({ ...u, status: 'confirmed' as UserResponseStatus })),
          mobileUserResponse: 'confirmed' as UserResponseStatus,
          activeBroadcast: null,
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
          stats: { confirmed: users.length, missing: 0, noReply: 0, needHelp: 0, total: users.length },
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
          activeBroadcast: s.activeBroadcast?.alertId === alertId ? null : s.activeBroadcast,
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
        ecoAssignments: state.ecoAssignments,
        auditLog: state.auditLog,
        activeBroadcast: state.activeBroadcast,
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
