// ─── Roles & Auth ─────────────────────────────────────────────────────────────

export type UserRole = 'User' | 'IT' | 'Super Admin' | 'Supervisor' | 'Back Superior';
export type AccountStatus = 'active' | 'disabled';
export type EcoSlot = 'A' | 'B' | 'C';
export type UserType = 'Aramco' | 'Contract';
export type CompanyType = 'Aramco' | 'Contractor';
export type Language = 'en' | 'ar' | 'ur';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// ─── Wind ────────────────────────────────────────────────────────────────────

export type WindDirection = 'N_S' | 'S_N' | 'E_W' | 'W_E' | 'NE_SW' | 'NW_SE' | 'SE_NW' | 'SW_NE';

export const WIND_DIRECTIONS: { key: WindDirection; label: string; degrees: number }[] = [
  { key: 'N_S',   label: 'N \u2192 S',   degrees: 180 },
  { key: 'S_N',   label: 'S \u2192 N',   degrees: 0 },
  { key: 'E_W',   label: 'E \u2192 W',   degrees: 270 },
  { key: 'W_E',   label: 'W \u2192 E',   degrees: 90 },
  { key: 'NE_SW', label: 'NE \u2192 SW', degrees: 225 },
  { key: 'NW_SE', label: 'NW \u2192 SE', degrees: 135 },
  { key: 'SE_NW', label: 'SE \u2192 NW', degrees: 315 },
  { key: 'SW_NE', label: 'SW \u2192 NE', degrees: 45 },
];

// ─── Permissions ─────────────────────────────────────────────────────────────

export type PermissionKey =
  | 'canViewGlobalLiveMap'
  | 'canPlaceWarningZone'
  | 'canEditHazardZone'
  | 'canDeleteHazardZone'
  | 'canUnlockHazardZone'
  | 'canManageShelters'
  | 'canReviewAlertMonitor'
  | 'canChangeWindDirection';

export const ALL_PERMISSIONS: { key: PermissionKey; label: string; description: string }[] = [
  { key: 'canViewGlobalLiveMap', label: 'View Global Live Map', description: 'Access the full live alert map with all zones, locations, shelters, personnel, and hazard zones' },
  { key: 'canPlaceWarningZone', label: 'Place Warning Zone', description: 'Place new hazard/warning zones on the map during active alerts' },
  { key: 'canEditHazardZone', label: 'Edit Hazard Zone', description: 'Modify existing hazard zone settings (radius, shape, wind)' },
  { key: 'canDeleteHazardZone', label: 'Delete Hazard Zone', description: 'Remove hazard zones from the map' },
  { key: 'canUnlockHazardZone', label: 'Unlock Hazard Zone', description: 'Unlock locked hazard zones for editing' },
  { key: 'canManageShelters', label: 'Manage Shelters', description: 'Add, edit, and delete shelter locations' },
  { key: 'canReviewAlertMonitor', label: 'Review Alert Monitor', description: 'Access the alert monitor with personnel tracking and response stats' },
  { key: 'canChangeWindDirection', label: 'Change Wind Direction', description: 'Update the wind direction indicator used in the map overlay during alerts' },
];

export interface UserPermissionAssignment {
  userId: number;
  permissions: PermissionKey[];
  assignedBy: number;
  assignedByName: string;
  assignedAt: string;
  updatedAt: string;
}

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

export type ZoneType = 'CPF' | 'Custom';
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
  locationId?: number | null;
  boundaryType: ZoneBoundaryType;
  polygonPoints: LatLng[];
  center?: LatLng;
  radius?: number;
  isActive: boolean;
  isArchived: boolean;
  sortOrder: number;
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
  expectedManpower: number;
  isActive: boolean;
  sortOrder: number;
  polygonPoints: LatLng[];
  alertActive: boolean;
  alertType: LocationAlertType | null;
  alertPriority: AlertPriority | null;
  alertMessage: string;
  alertUpdatedAt: string | null;
  alertHistory: AlertHistoryEntry[];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export type UserResponseStatus = 'confirmed' | 'pending' | 'need_help';

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
  userType?: UserType;
  companyType?: CompanyType;
  companyName?: string;
  mobileNumber?: string;
  approvalStatus?: ApprovalStatus;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
  language?: Language;
  isECOAssigned?: boolean;
  ecoSlot?: EcoSlot;
  ecoZoneName?: string;
  ecoAssignmentActive?: boolean;
  isSupervisorAssigned?: boolean;
  isBackupSupervisorAssigned?: boolean;
  supervisorLocationName?: string;
  supervisorZoneName?: string;
  supervisorAssignmentActive?: boolean;

  // Granular permissions assigned by Super Admin
  permissions?: PermissionKey[];

  // Escalation tracking
  escalationLevel?: number;
  alertReceivedAt?: string | null;
  receiptConfirmedAt?: string | null;
  respondedAt?: string | null;
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
    pending: number;
    needHelp: number;
    total: number;
  };
  isActive: boolean;
}

// ─── Shelters ────────────────────────────────────────────────────────────────

export interface Shelter {
  id: number;
  name: string;
  lat: number;
  lng: number;
  zoneId: number;
  isActive: boolean;
  linkedLocationIds: number[];
}

// ─── Personnel Live Location ──────────────────────────────────────────────────

export interface PersonnelLocation {
  userId: number;
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
  detectedLocationId: number | null;
  zoneId: number | null;
}

// ─── Zone Notifications ──────────────────────────────────────────────────────

export interface ZoneNotification {
  id: number;
  zoneId: number;
  zoneName: string;
  message: string;
  sentBy: string;
  sentAt: string;
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

// ─── Hazard Zones ────────────────────────────────────────────────────────────

export type HazardShape = 'circle' | 'plume';
export type WindMode = 'manual' | 'auto';
export type WarningLevel = 'hot' | 'warm' | 'green';

export interface HazardZone {
  id: number;
  zoneId: number | null;
  locationId: number | null;
  centerLat: number;
  centerLng: number;
  hotRadius: number;
  warmRadius: number;
  coldRadius: number;
  alertId: number | null;
  warningLevel: WarningLevel;
  isActive: boolean;
  isLocked: boolean;
  createdBy: string;
  createdAt: string;
  windDirectionDeg?: number | null;
  windMode?: WindMode | null;
  hazardShape?: HazardShape | null;
}

// ─── Emergency Modes ─────────────────────────────────────────────────────────

export interface EmergencyModes {
  shelterIn: boolean;
  blackout: boolean;
  shelterInZones: string[];
  blackoutZones: string[];
  shelterInActivatedAt: string | null;
  shelterInActivatedBy: string | null;
  blackoutActivatedAt: string | null;
  blackoutActivatedBy: string | null;
}

// ─── Unified Alert System State ──────────────────────────────────────────────
// Single canonical state that all screens must use to avoid inconsistencies.

export interface BannerState {
  type: 'shelterIn' | 'blackout' | 'zoneAlert';
  label: string;
  zones: string[];
  activatedAt: string | null;
}

export interface AlertSystemState {
  /** Current emergency mode — null when no emergency is active. */
  emergencyMode: 'shelterIn' | 'blackout' | 'zoneAlert' | 'broadcastAlert' | null;
  /** The canonical active alert (real or synthesized from zones/emergency modes). */
  activeAlert: Alert | null;
  /** IDs of zones that currently have an active alert. */
  activeZoneIds: number[];
  /** Banner(s) to display on all screens. */
  banners: BannerState[];
  /** ISO timestamp of the last state change. */
  lastUpdatedAt: string | null;
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
  hazardHotRadius: number;
  hazardWarmRadius: number;
  hazardColdRadius: number;
}
