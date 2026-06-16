// Centralized, pure incident-logic helpers.
// These are the clean boundary points a future backend / realtime layer can
// call into. No React, no store, no side effects — easy to unit-test later.
import type {
  Alert, AppSettings, EscalationStatus, HeadcountReconciliation,
  IncidentPhase, TimelineEvent, TimelineEventType, User, UserResponseStatus,
} from '@/types';

// ─── Drill detection ──────────────────────────────────────────────────────────
export function isDrillAlert(alert: Alert | null | undefined): boolean {
  if (!alert) return false;
  return alert.isDrill === true || alert.type === 'Drill';
}

// ─── Lifecycle phase (derives a phase when not explicitly set) ──────────────────
export function getIncidentPhase(alert: Alert | null | undefined): IncidentPhase | null {
  if (!alert) return null;
  if (alert.lifecycle) return alert.lifecycle;
  // Derivation fallback for alerts created before lifecycle existed:
  if (!alert.isActive || alert.status === 'closed') return 'closed';
  if (alert.accountabilityComplete) return 'accountability_complete';
  if (alert.hazardClearedAt) return 'accountability_open';
  return 'active';
}

export function isHazardCleared(alert: Alert | null | undefined): boolean {
  if (!alert) return false;
  const phase = getIncidentPhase(alert);
  return phase === 'hazard_cleared' || phase === 'accountability_open' ||
    phase === 'accountability_complete' || !!alert.hazardClearedAt;
}

export function isAccountabilityOpen(alert: Alert | null | undefined): boolean {
  if (!alert) return false;
  const phase = getIncidentPhase(alert);
  return phase === 'accountability_open' ||
    (isHazardCleared(alert) && !alert.accountabilityComplete && alert.isActive);
}

export function canCloseIncident(alert: Alert | null | undefined): boolean {
  if (!alert) return false;
  return alert.accountabilityComplete === true;
}

export const PHASE_LABELS: Record<IncidentPhase, string> = {
  draft: 'Draft',
  active: 'Alert Active',
  hazard_active: 'Hazard Active',
  hazard_cleared: 'Hazard Cleared',
  accountability_open: 'Accountability Open',
  accountability_complete: 'Accountability Complete',
  closed: 'Incident Closed',
};

// ─── Personnel stats ────────────────────────────────────────────────────────────
export interface ResponseStats { confirmed: number; pending: number; needHelp: number; total: number; }

export function computeStats(users: User[]): ResponseStats {
  const active = users.filter(u => u.isActive);
  return {
    confirmed: active.filter(u => u.status === 'confirmed').length,
    pending: active.filter(u => u.status === 'pending').length,
    needHelp: active.filter(u => u.status === 'need_help').length,
    total: active.length,
  };
}

// ─── Escalation (local, time-based) ─────────────────────────────────────────────
// Returns the escalation status for one user during an active alert.
// TODO(backend/push): when realtime exists, escalation transitions should be
// driven server-side and notify supervisor → ECO; this local version only flags.
export function getEscalationStatus(
  user: User,
  activeAlert: Alert | null | undefined,
  settings: AppSettings,
  nowMs: number,
): EscalationStatus {
  if (!activeAlert || !activeAlert.isActive) return 'normal';
  if (user.status === 'confirmed') return 'normal';
  if (user.status === 'need_help') return 'escalation_required';
  // pending / no-response: escalate once past the configured timeout
  const timeoutMin = settings?.notifications?.escalationTimeoutMinutes ?? 15;
  const startMs = Date.parse(activeAlert.timestamp || '') || nowMs;
  const minutesPending = (nowMs - startMs) / 60000;
  return minutesPending >= timeoutMin ? 'escalation_required' : 'pending';
}

export const ESCALATION_LABELS: Record<EscalationStatus, string> = {
  normal: 'Normal',
  pending: 'Pending',
  escalation_required: 'Escalation Required',
  escalated_supervisor: 'Escalated → Supervisor',
  escalated_eco: 'Escalated → ECO',
};

/** Count personnel currently requiring escalation for an active alert. */
export function countEscalations(
  users: User[],
  activeAlert: Alert | null | undefined,
  settings: AppSettings,
  nowMs: number,
): number {
  if (!activeAlert) return 0;
  return users.filter(u =>
    u.isActive && getEscalationStatus(u, activeAlert, settings, nowMs) === 'escalation_required',
  ).length;
}

// ─── Headcount reconciliation ────────────────────────────────────────────────────
export function reconcileHeadcount(expected: number, locationUsers: User[]): HeadcountReconciliation {
  const active = locationUsers.filter(u => u.isActive);
  const safe = active.filter(u => u.status === 'confirmed').length;
  const needHelp = active.filter(u => u.status === 'need_help').length;
  const pending = active.filter(u => u.status === 'pending').length;
  const actual = active.length;
  const accountedFor = safe + needHelp;            // responded either way
  const missing = Math.max(0, expected - accountedFor);

  let status: HeadcountReconciliation['status'];
  let message: string;
  if (actual > expected) {
    status = 'over_count';
    message = `Headcount mismatch: Actual exceeds expected by ${actual - expected}`;
  } else if (actual < expected) {
    status = 'under_count';
    message = `Headcount mismatch: ${expected - actual} personnel not accounted for`;
  } else if (pending > 0 || accountedFor < expected) {
    status = 'pending_verification';
    message = `${pending} awaiting response — verification pending`;
  } else {
    status = 'balanced';
    message = 'All expected personnel accounted for';
  }
  return { expected, actual, safe, needHelp, pending, missing, status, message };
}

// ─── Timeline event factory ──────────────────────────────────────────────────────
export const TIMELINE_LABELS: Record<TimelineEventType, string> = {
  alert_created: 'Alert created',
  alert_activated: 'Alert activated',
  zones_selected: 'Zones selected',
  response_safe: 'Personnel reported Safe',
  response_need_help: 'Personnel requested Help',
  response_pending: 'Personnel pending / no response',
  accountability_started: 'Accountability started',
  personnel_verified: 'Personnel verified',
  escalation_required: 'Escalation required',
  hazard_all_clear: 'Hazard All Clear declared',
  accountability_complete: 'Personnel accountability complete',
  incident_closed: 'Final incident closure',
  report_generated: 'Report generated / stored',
};

export function makeTimelineEvent(
  id: number,
  type: TimelineEventType,
  timestamp: string,
  actor?: string | null,
  label?: string,
  meta?: TimelineEvent['meta'],
): TimelineEvent {
  return { id, type, timestamp, actor: actor ?? null, label: label ?? TIMELINE_LABELS[type], meta };
}
