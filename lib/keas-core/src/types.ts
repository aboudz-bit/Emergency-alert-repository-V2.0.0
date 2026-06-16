// KEAS shared data model — platform-agnostic entity types.
// Mirrors artifacts/mobile/types/index.ts so mobile and web share one model.
// (Mobile is not yet migrated to import this; that is a later, verified refactor.)

// ─── Roles & Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'User' | 'IT' | 'Super Admin' | 'Supervisor' | 'Back Superior' | 'ECO';
export type AccountStatus = 'active' | 'disabled';
export type EcoSlot = 'A' | 'B' | 'C';
export type UserType = 'Aramco' | 'Contract';
export type CompanyType = 'Aramco' | 'Contractor';
export type Language = 'en' | 'ar' | 'ur';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

// ─── Wind ────────────────────────────────────────────────────────────────────
export type WindDirection = 'N_S' | 'S_N' | 'E_W' | 'W_E' | 'NE_SW' | 'NW_SE' | 'SE_NW' | 'SW_NE';

export const WIND_DIRECTIONS: { key: WindDirection; label: string; degrees: number }[] = [
  { key: 'N_S', label: 'N → S', degrees: 180 },
  { key: 'S_N', label: 'S → N', degrees: 0 },
  { key: 'E_W', label: 'E → W', degrees: 270 },
  { key: 'W_E', label: 'W → E', degrees: 90 },
  { key: 'NE_SW', label: 'NE → SW', degrees: 225 },
  { key: 'NW_SE', label: 'NW → SE', degrees: 135 },
  { key: 'SE_NW', label: 'SE → NW', degrees: 315 },
  { key: 'SW_NE', label: 'SW → NE', degrees: 45 },
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
  | 'canChangeWindDirection'
  | 'canSendAlertNotification';

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

export interface Street {
  id: string;
  name: string;
  path: LatLng[];
  createdAt: number;
  updatedAt: number;
}

export interface EcoRoute {
  id: string;
  streetIds: string[];
  createdBy: number;
  createdAt: number;
  updatedAt: number;
  status: 'active' | 'edited';
}

export type AlertHistoryAction = 'activated' | 'deactivated' | 'edited';

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
  alertTargetScope: 'zone' | 'locations';
  alertTargetLocationIds: number[];
}

// ─── Locations ────────────────────────────────────────────────────────────────
export type LocationAlertType =
  | 'Blackout'
  | 'Security Alert'
  | 'Shelter-in'
  | 'Drill'
  | 'Restricted Movement'
  | 'Custom';

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
  /** Present in the local mobile model; MUST be omitted from any web/API DTO. */
  password?: string;
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
  permissions?: PermissionKey[];
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

export interface AlertStats {
  confirmed: number;
  pending: number;
  needHelp: number;
  total: number;
}

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
  stats: AlertStats;
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
export interface BannerState {
  type: 'shelterIn' | 'blackout' | 'zoneAlert';
  label: string;
  zones: string[];
  activatedAt: string | null;
}

export interface AlertSystemState {
  emergencyMode: 'shelterIn' | 'blackout' | 'zoneAlert' | 'broadcastAlert' | null;
  activeAlert: Alert | null;
  activeZoneIds: number[];
  banners: BannerState[];
  lastUpdatedAt: string | null;
}

// ─── Incident Timeline ───────────────────────────────────────────────────────
export type IncidentEventType =
  | 'alert_started'
  | 'alert_ended'
  | 'user_received_alert'
  | 'user_safe'
  | 'user_need_help'
  | 'escalation_level_1'
  | 'escalation_critical'
  | 'broadcast_sent'
  | 'zone_updated'
  | 'shelter_assigned'
  | 'shelter_in_activated'
  | 'blackout_activated'
  | 'supervisor_action'
  | 'all_clear';

export interface IncidentEvent {
  id: string;
  timestamp: number;
  type: IncidentEventType;
  userId?: number;
  userName?: string;
  zoneId?: number;
  zoneName?: string;
  locationId?: number;
  locationName?: string;
  metadata?: Record<string, unknown>;
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
  defaultAlarmZoneIds: number[];
}
