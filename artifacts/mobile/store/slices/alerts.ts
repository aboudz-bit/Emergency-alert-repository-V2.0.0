import type { Alert, UserResponseStatus } from '@/types';
import type { SetState, GetState, AppState } from '../types';
import { nextHistoryId } from '../helpers';
import { selectIsCurrentUserTargeted, userMatchesZoneScope } from '../selectors';
import { makeTimelineEvent } from '@/utils/incident';
import { checklistForAlert } from '@/constants/incident';

export function createAlertSlice(set: SetState, get: GetState): Pick<
  AppState,
  'updateUserResponse' | 'createAlert' | 'sendAllClear' | 'completePersonnelAccountability' |
  'closeIncident' | 'toggleChecklistItem' | 'appendTimelineEvent' | 'closeAlert' | 'respondToAlert'
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
          // Map by id so we can apply each zone's location scope: a location-scoped
          // alert counts only users in its targeted locations; a whole-zone alert
          // counts the whole zone.
          const targetZoneMap = new Map(targetZones.map(z => [z.id, z] as const));
          const relevantUsers = isAllZones
            ? users.filter(u => u.isActive)
            : targetZoneMap.size > 0
              ? users.filter(u => {
                  if (!u.isActive) return false;
                  const z = targetZoneMap.get(u.zoneId);
                  return z ? userMatchesZoneScope(z, u) : false;
                })
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
      const { users, currentUser } = get();
      const now = new Date().toISOString();
      const id = Date.now();
      const isDrill = data.isDrill === true || data.type === 'Drill';
      const actor = data.sentBy || currentUser?.name || 'System';
      const timeline = [
        makeTimelineEvent(nextHistoryId(), 'alert_created', now, actor),
        makeTimelineEvent(nextHistoryId(), 'alert_activated', now, actor, undefined, { zone: data.zone, priority: data.priority }),
      ];
      const newAlert: Alert = {
        ...data,
        id,
        status: 'active',
        isActive: true,
        isDrill,
        lifecycle: 'hazard_active',
        hazardClearedAt: null,
        hazardClearedBy: null,
        accountabilityComplete: false,
        accountabilityCompletedAt: null,
        accountabilityCompletedBy: null,
        timeline,
        checklist: checklistForAlert(data.type, isDrill),
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
        alertSoundDismissed: false,
      }));
      get().logIncidentEvent({
        type: 'alert_started',
        zoneName: data.zone,
        metadata: { alertType: data.type, priority: data.priority, alertId: newAlert.id },
      });
      return newAlert;
    },

    // ── HAZARD ALL CLEAR ONLY ──────────────────────────────────────────────────
    // Business rule: "All Clear" clears only the hazard/emergency condition.
    // It must NOT mark personnel safe/confirmed and must NOT reset response counts.
    // The active alert stays active so personnel accountability remains OPEN.
    sendAllClear: () => {
      const { currentUser } = get();
      const sentBy = currentUser?.name || 'System Auto';
      const now = new Date().toISOString();
      set(s => ({
        // Keep the active alert active for accountability; record hazard-cleared phase.
        alerts: s.alerts.map(a => {
          if (!a.isActive) return a;
          const ev = makeTimelineEvent(nextHistoryId(), 'hazard_all_clear', now, sentBy);
          return {
            ...a,
            lifecycle: 'accountability_open' as const,
            hazardClearedAt: now,
            hazardClearedBy: sentBy,
            timeline: [...(a.timeline || []), ev],
            // stats deliberately UNTOUCHED — they reflect real personnel responses
          };
        }),
        // Hazard conditions themselves are cleared:
        zones: s.zones.map(z => z.alertActive ? {
          ...z,
          alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: now,
          alertHistory: [...(z.alertHistory || []), {
            id: nextHistoryId(), zoneId: z.id, action: 'deactivated' as const,
            alertType: z.alertType, priority: z.alertPriority, message: z.alertMessage, timestamp: now, user: sentBy,
          }],
        } : z),
        locations: s.locations.map(l => l.alertActive ? {
          ...l,
          alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: now,
          alertHistory: [...(l.alertHistory || []), {
            id: nextHistoryId(), locationId: l.id, action: 'deactivated' as const,
            alertType: l.alertType, priority: l.alertPriority, message: l.alertMessage, timestamp: now, user: sentBy,
          }],
        } : l),
        hazardZones: s.hazardZones.filter(hz => hz.alertId == null),
        emergencyModes: {
          shelterIn: false, blackout: false, shelterInZones: [], blackoutZones: [],
          shelterInActivatedAt: null, shelterInActivatedBy: null,
          blackoutActivatedAt: null, blackoutActivatedBy: null,
        },
        windDirection: null, windSetBy: null, windSetAt: null,
        // NOTE: users, mobileUserResponse and personnelLocations are intentionally
        // left as-is — accountability continues after the hazard is cleared.
      }));
    },

    completePersonnelAccountability: () => {
      const { currentUser } = get();
      const by = currentUser?.name || 'System';
      const now = new Date().toISOString();
      set(s => ({
        alerts: s.alerts.map(a => {
          if (!a.isActive) return a;
          const ev = makeTimelineEvent(nextHistoryId(), 'accountability_complete', now, by);
          return {
            ...a,
            accountabilityComplete: true,
            accountabilityCompletedAt: now,
            accountabilityCompletedBy: by,
            lifecycle: 'accountability_complete' as const,
            timeline: [...(a.timeline || []), ev],
          };
        }),
      }));
    },

    closeIncident: (override = false) => {
      const active = get().alerts.find(a => a.isActive);
      if (!active) return { success: false, error: 'No active incident to close.' };
      if (!active.accountabilityComplete && !override) {
        return { success: false, error: 'Personnel accountability is not complete. Authorized override required to force closure.' };
      }
      const { currentUser } = get();
      const by = currentUser?.name || 'System';
      const now = new Date().toISOString();
      set(s => ({
        alerts: s.alerts.map(a => {
          if (a.id !== active.id) return a;
          const closeEv = makeTimelineEvent(nextHistoryId(), 'incident_closed', now, by,
            override ? 'Final incident closure (OVERRIDE — accountability incomplete)' : undefined);
          const reportEv = makeTimelineEvent(nextHistoryId(), 'report_generated', now, by);
          return {
            ...a, isActive: false, status: 'closed' as const, closedAt: now, closedBy: by,
            lifecycle: 'closed' as const, timeline: [...(a.timeline || []), closeEv, reportEv],
          };
        }),
        personnelLocations: {},
      }));
      get().addActivityLog({
        type: 'report',
        message: `Incident "${active.title}" closed by ${by}${override ? ' (override)' : ''}. Report stored.`,
        timestamp: now, actorName: by,
      });
      return { success: true };
    },

    toggleChecklistItem: (alertId, itemId) => set(s => ({
      alerts: s.alerts.map(a => a.id === alertId
        ? { ...a, checklist: (a.checklist || []).map(c => c.id === itemId ? { ...c, done: !c.done } : c) }
        : a),
    })),

    appendTimelineEvent: (alertId, type, label, meta) => {
      const now = new Date().toISOString();
      const by = get().currentUser?.name || null;
      set(s => ({
        alerts: s.alerts.map(a => a.id === alertId
          ? { ...a, timeline: [...(a.timeline || []), makeTimelineEvent(nextHistoryId(), type, now, by, label, meta)] }
          : a),
      }));
    },

    closeAlert: (alertId) => {
      if (alertId === -1) {
        // synthetic (zone/emergency-mode) alert → hazard-clear path
        get().sendAllClear();
        return;
      }
      const closedAlert = get().alerts.find(a => a.id === alertId);
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
      get().logIncidentEvent({
        type: 'alert_ended',
        metadata: { alertId, alertType: closedAlert?.type },
      });
    },

    respondToAlert: (response) => {
      const { currentUser } = get();
      if (!currentUser) return;
      // Guard: a user who is not targeted by the active alert (e.g. same zone
      // but an unselected location) must not be able to respond and pollute stats.
      if (!selectIsCurrentUserTargeted(get())) return;
      const now = new Date().toISOString();
      get().updateUserResponse(currentUser.id, response);
      set(s => ({
        mobileUserResponse: response,
        alertSoundDismissed: true,
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
      const active = get().alerts.find(a => a.isActive);
      if (active) {
        get().appendTimelineEvent(
          active.id,
          response === 'need_help' ? 'response_need_help' : 'response_safe',
          undefined,
          { user: currentUser.name },
        );
      }
      get().logIncidentEvent({
        type: response === 'confirmed' ? 'user_safe' : 'user_need_help',
        userId: currentUser.id,
        userName: currentUser.name,
        zoneId: currentUser.zoneId,
        zoneName: currentUser.zone,
        locationId: currentUser.locationId,
        locationName: currentUser.location,
      });
    },
  };
}
