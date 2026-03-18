// ─── Roles & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'User' | 'IT' | 'Super Admin';
export type AccountStatus = 'active' | 'disabled';
export type EcoSlot = 'A' | 'B' | 'C';

export interface EcoAssignment {
  ecoSlot: EcoSlot;
  assignedUserId: number | null;
  assignedUserName: string | null;
  assignedUserBadge: string | null;
  assignedZoneId: number | null;
  assignedZoneName: string | null;
  active: boolean;
  assignedAt: string | null;
}

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
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export type ZoneType = 'CPF' | 'Camp' | 'Custom';
export type ZoneBoundaryType = 'Polygon' | 'Circle';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface ZoneAlertHistoryEntry {
  id: number;
  zoneId: number;
  action: AlertHistoryAction;
  alertType: LocationAlertType | null;
  priority: AlertPriority | null;
  message: string;
  timestamp: string;
  user: string | null;
}

export interface Zone {
  id: number;
  name: string;
  type: ZoneType;
  parentZoneId?: number | null;
  boundaryType: ZoneBoundaryType;
  polygonPoints: LatLng[];
  center?: LatLng;
  radius?: number;
  isActive: boolean;
  color: string;
  alertActive: boolean;
  alertType: LocationAlertType | null;
  alertPriority: AlertPriority | null;
  alertMessage: string;
  alertUpdatedAt: string | null;
  alertHistory: ZoneAlertHistoryEntry[];
}

// ─── Locations ────────────────────────────────────────────────────────────────

export type LocationAlertType =
  | 'Blackout'
  | 'Security Alert'
  | 'Shelter-in'
  | 'Drill'
  | 'Restricted Movement'
  | 'Custom';

export type AlertHistoryAction = 'activated' | 'deactivated' | 'edited';

export interface AlertHistoryEntry {
  id: number;
  locationId: number;
  action: AlertHistoryAction;
  alertType: LocationAlertType | null;
  priority: AlertPriority | null;
  message: string;
  timestamp: string;
  user: string | null;
}

export interface Location {
  id: number;
  name: string;
  zone: string;
  zoneId: number;
  isActive: boolean;
  alertActive: boolean;
  alertType: LocationAlertType | null;
  alertPriority: AlertPriority | null;
  alertMessage: string;
  alertUpdatedAt: string | null;
  alertHistory: AlertHistoryEntry[];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserResponseStatus = 'confirmed' | 'missing' | 'no_reply' | 'need_help';

export interface User {
  id: number;
  name: string;
  badge: string;
  password: string;
  role: UserRole;
  zone: string;
  zoneId: number;
  location: string;
  locationId: number;
  status: UserResponseStatus;
  accountStatus: AccountStatus;
  lastActivity: string;
  isActive: boolean;
  isECOAssigned?: boolean;
  ecoSlot?: EcoSlot;
  ecoZoneName?: string;
  ecoAssignmentActive?: boolean;
  isSupervisorAssigned?: boolean;
  isBackupSupervisorAssigned?: boolean;
  supervisorLocationName?: string;
  supervisorZoneName?: string;
  supervisorAssignmentActive?: boolean;
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
  isActive: boolean;
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
}
