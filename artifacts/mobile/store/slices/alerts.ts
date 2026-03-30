import type { Alert, UserResponseStatus } from '@/types';
import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createAlertSlice(set: SetState, get: GetState): Pick<
  AppState,
  'updateUserResponse' | 'createAlert' | 'sendAllClear' | 'closeAlert' | 'respondToAlert'
> {
  return {
    updateUserResponse: (userId, status) => {
      const { currentUser } = get();
      if (!currentUser || currentUser.id !== userId) return;
      set(s => {
        const users = s.users.map(u =>
          u.id === userId ? { ...u, status, lastActivity: new Date().toISOString() } : u,
        );
        const alerts = s.alerts.map(a => {
          if (!a.isActive) return a;
          const isAllZones = a.zone === 'All Zones' || a.zone === 'all';
          // Handle comma-separated zone names from multi-zone alerts
          const zoneNames = a.zone.includes(', ') ? a.zone.split(', ').map(n => n.trim()) : [a.zone];
          const targetZones = isAllZones ? [] : s.zones.filter(z => zoneNames.includes(z.name));
          const targetZoneIds = new Set(targetZones.map(z => z.id));
          const relevantUsers = isAllZones
            ? users.filter(u => u.isActive)
            : targetZoneIds.size > 0
              ? users.filter(u => targetZoneIds.has(u.zoneId) && u.isActive)
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
      set(s => ({
        alerts: [newAlert, ...s.alerts.map(a => a.isActive ? { ...a, isActive: false, status: 'closed' as const, closedAt: now } : a)],
        users: s.users.map(u => ({
          ...u,
          status: 'pending' as UserResponseStatus,
          escalationLevel: 0,
          alertReceivedAt: now,
          receiptConfirmedAt: null,
          respondedAt: null,
        })),
        hazardZones: s.hazardZones.filter(hz => hz.alertId == null),
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
        users: s.users.map(u => ({
          ...u,
          status: 'confirmed' as UserResponseStatus,
          escalationLevel: 0,
          alertReceivedAt: null,
          receiptConfirmedAt: null,
          respondedAt: null,
        })),
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
        hazardZones: s.hazardZones.filter(hz => hz.alertId == null),
        emergencyModes: {
          shelterIn: false,
          blackout: false,
          shelterInZones: [],
          blackoutZones: [],
          shelterInActivatedAt: null,
          shelterInActivatedBy: null,
          blackoutActivatedAt: null,
          blackoutActivatedBy: null,
        },
        windDirection: null,
        windSetBy: null,
        windSetAt: null,
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
      if (alertId === -1) {
        get().sendAllClear();
        return;
      }
      set(s => {
        const updatedAlerts = s.alerts.map(a =>
          a.id === alertId ? { ...a, isActive: false, status: 'closed' as const, closedAt: new Date().toISOString() } : a,
        );
        const anyAlertActive = updatedAlerts.some(a => a.isActive);
        const anyZoneActive = s.zones.some(z => z.isActive && z.alertActive);
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
      const now = new Date().toISOString();
      get().updateUserResponse(currentUser.id, response);
      set(s => ({
        mobileUserResponse: response,
        users: s.users.map(u =>
          u.id === currentUser.id
            ? {
                ...u,
                respondedAt: now,
                receiptConfirmedAt: response === 'confirmed' ? now : u.receiptConfirmedAt,
                escalationLevel: response === 'need_help' ? 3 : 0,
              }
            : u,
        ),
      }));
    },
  };
}
