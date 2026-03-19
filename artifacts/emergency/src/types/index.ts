// ─── Roles & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'User' | 'IT' | 'Super Admin';
export type AccountStatus = 'active' | 'disabled';

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  selectedRole: UserRole;
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export type ZoneType = 'CPF' | 'Camp' | 'Custom';
export type ZoneBoundaryType = 'Polygon' | 'Circle';

export interface ZonePoint {
  x: number;
  y: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Zone {
  id: number;
  name: string;
  type: ZoneType;
  parentZoneId?: number | null;
  boundaryType: ZoneBoundaryType;
  points: ZonePoint[];
  polygonPoints: LatLng[];
  center?: LatLng;
  radius?: number;
  isActive: boolean;
  color: string;
}

// ─── Locations ────────────────────────────────────────────────────────────────

export interface Location {
  id: number;
  name: string;
  zone: string;
  isActive: boolean;
  totalManpower?: number;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserResponseStatus = 'confirmed' | 'missing' | 'no_reply' | 'need_help';
// legacy alias kept for backward compat
export type UserStatus = UserResponseStatus;

export interface User {
  id: number;
  name: string;
  badge: string;
  password: string;
  role: UserRole;
  zone: 'CPF' | 'Camp';
  location: string;
  status: UserResponseStatus;
  accountStatus: AccountStatus;
  lastActivity: string;
  isActive: boolean;

  // ECO assignment fields (user remains role='User' with ECO overlay)
  // NOTE: currentOperationalLocation='CCR' is a string-only value for now.
  // CCR is not a Location entity. Convert to a real Location reference if needed later.
  isECOAssigned?: boolean;
  ecoSlot?: EcoSlot | null;
  ecoZoneId?: number | null;
  ecoZoneName?: string | null;
  ecoAssignmentActive?: boolean;
  ecoAssignedAt?: string | null;
  ecoAssignedByUserId?: number | null;
  ecoAssignedByName?: string | null;
  originalLocation?: string | null;
  currentOperationalLocation?: string | null;

  // Supervisor / Backup Supervisor assignment fields (user remains role='User')
  isSupervisorAssigned?: boolean;
  isBackupSupervisorAssigned?: boolean;
  supervisorLocationId?: number | null;
  supervisorLocationName?: string | null;
  supervisorZoneName?: string | null;
  supervisorAssignmentActive?: boolean;
  supervisorAssignedAt?: string | null;
  supervisorAssignedByUserId?: number | null;
  supervisorAssignedByName?: string | null;
}

// ─── ECO (Emergency Coordinator) ─────────────────────────────────────────────

export type EcoSlot = 'A' | 'B' | 'C';

export interface EcoAssignment {
  ecoSlot: EcoSlot;
  assignedUserId: number | null;
  assignedUserName: string | null;
  assignedUserBadge?: string | null;
  assignedZoneId: number | null;
  assignedZoneName: string | null;
  active: boolean;
  assignedByUserId: number | null;
  assignedByName: string | null;
  assignedAt: string | null;
  expiresAt?: string | null;
  notes?: string;
}

export type EcoAuditActionType =
  | 'eco_assigned'
  | 'eco_reassigned'
  | 'eco_activated'
  | 'eco_deactivated'
  | 'eco_removed';

// ─── Supervisor ──────────────────────────────────────────────────────────────

export interface SupervisorAssignment {
  locationId: number;
  locationName: string;
  zoneName: string;
  supervisorUserId: number | null;
  supervisorUserName: string | null;
  supervisorUserBadge: string | null;
  backupSupervisorUserId: number | null;
  backupSupervisorUserName: string | null;
  backupSupervisorUserBadge: string | null;
  supervisorActive: boolean;
  backupActive: boolean;
  totalManpower: number;
  assignedByUserId: number | null;
  assignedByName: string | null;
  assignedAt: string | null;
  notes: string;
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export type AlertType =
  | 'Blackout'
  | 'Security Alert'
  | 'Shelter-in'
  | 'Drill'
  | 'Restricted Movement'
  | 'All Clear'
  | 'Custom';

export type AlertPriority = 'High' | 'Medium' | 'Low';
export type AlertStatus = 'active' | 'closed' | 'draft';
export type AlertTarget = string;

export interface Alert {
  id: number;
  type: AlertType;
  zone: string;
  title: string;
  message: string;
  timestamp: string;
  closedAt?: string;
  sentBy: string;
  priority: AlertPriority;
  status: AlertStatus;
  stats: {
    confirmed: number;
    missing: number;
    noReply: number;
    needHelp: number;
    total: number;
  };
  /** @deprecated use status === 'active' */
  isActive: boolean;

  // Notification layer extensions
  deliveryChannels?: DeliveryChannel[];
  soundActive?: boolean;
  broadcastActive?: boolean;
  notificationSentAt?: string;
  triggeredByName?: string;
  triggeredByUserId?: number | null;
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

export type ActivityLogType = 'alert' | 'action' | 'report' | 'info' | 'user';

export interface ActivityLog {
  id: number;
  type: ActivityLogType;
  message: string;
  timestamp: string;
  actorId?: number;
  actorName?: string;
}

// ─── Delivery Channels & Audit ────────────────────────────────────────────

export type DeliveryChannel = 'app' | 'sound' | 'broadcast';

export type AuditActionType =
  | 'activated'
  | 'deactivated'
  | 'edited'
  | 'broadcast_sent'
  | 'notification_sent'
  | 'sound_triggered'
  | 'sound_stopped'
  | 'acknowledgment_received'
  | 'eco_assigned'
  | 'eco_reassigned'
  | 'eco_activated'
  | 'eco_deactivated'
  | 'eco_removed'
  | 'supervisor_assigned'
  | 'supervisor_reassigned'
  | 'supervisor_removed'
  | 'supervisor_activated'
  | 'supervisor_deactivated'
  | 'backup_supervisor_assigned'
  | 'backup_supervisor_reassigned'
  | 'backup_supervisor_removed'
  | 'backup_supervisor_activated'
  | 'backup_supervisor_deactivated'
  | 'manpower_updated';

export type AuditTargetType = 'location' | 'zone' | 'broadcast';

export interface AuditLogEntry {
  id: number;
  timestamp: string;
  actionType: AuditActionType;
  zoneId?: number | null;
  zoneName: string;
  locationId?: number | null;
  locationName?: string | null;
  alertType: AlertType;
  priority: AlertPriority;
  message: string;
  triggeredByUserId?: number | null;
  triggeredByName: string;
  targetType: AuditTargetType;
  targetName: string;
  channelUsed: DeliveryChannel | DeliveryChannel[] | string;
  notes?: string;
}

// ─── Hazard Zones ────────────────────────────────────────────────────────────

export interface HazardZone {
  id: number;
  zoneId: number | null;
  locationId: number | null;
  centerLat: number;
  centerLng: number;
  redRadius: number;
  yellowRadius: number;
  greenRadius: number;
  alertId: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface NotificationPolicy {
  alertSound: boolean;
  pushNotifications: boolean;
  escalationTimeoutMinutes: number;
}

export interface AppSettings {
  systemName: string;
  timezone: string;
  language: string;
  rtlSupport: boolean;
  autoDetectZone: boolean;
  gpsAccuracyMeters: number;
  locationUpdateIntervalSeconds: number;
  notifications: NotificationPolicy;
  sessionTimeoutMinutes: number;
  requireLocationPermission: boolean;
  badgeAsUsername: boolean;
  wifiAndMobileData: boolean;
  systemVersion: string;
  hazardRedRadius: number;
  hazardYellowRadius: number;
  hazardGreenRadius: number;
}
