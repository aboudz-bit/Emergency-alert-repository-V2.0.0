// ─── Roles & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'User' | 'IT' | 'Super Admin';
export type AccountStatus = 'active' | 'disabled';

export interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  selectedRole: UserRole;
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export type ZoneType = 'CPF' | 'Camp' | 'Both' | 'Custom';
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
export type AlertTarget = 'CPF' | 'Camp' | 'Both';

export interface Alert {
  id: number;
  type: AlertType;
  zone: ZoneType;
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
