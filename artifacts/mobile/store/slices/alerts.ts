import type { Alert, UserResponseStatus } from '@/types';
import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';

export function createAlertSlice(set: SetState, get: GetState): Pick<
  AppState,
  'updateUserResponse' | 'createAlert' | 'sendAllClear' | 'closeAlert' | 'respondToAlert'
> {
  return {
    updateUserResponse: (userId, status) => {
      set(s => {
        const users = s.users.map(u =>
          u.id === userId ? { ...u, status, lastActivity: new Date().toISOString() } : u,
        );
        const alerts = s.alerts.map(a => {
          if (!a.isActive) return a;
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
  };
}
