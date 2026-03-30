import type {
  User, Alert, Zone, Location, LocationAlertType, AppSettings,
  ActivityLog, UserRole, UserResponseStatus, AlertPriority,
  EcoAssignment, SupervisorAssignment, Shelter, HazardZone,
  UserType, CompanyType, PersonnelLocation, ZoneNotification,
  PermissionKey, UserPermissionAssignment,
  EmergencyModes, WindDirection, Language,
} from '@/types';

export interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  alerts: Alert[];
  zones: Zone[];
  locations: Location[];
  settings: AppSettings;
  activityLogs: ActivityLog[];
  mobileUserResponse: UserResponseStatus | null;
  ecoAssignments: EcoAssignment[];
  supervisorAssignments: SupervisorAssignment[];
  shelters: Shelter[];
  hazardZones: HazardZone[];
  personnelLocations: Record<number, PersonnelLocation>;
  zoneNotifications: ZoneNotification[];
  emergencyModes: EmergencyModes;

  // Wind direction (set by ECO)
  windDirection: WindDirection | null;
  windSetBy: string | null;
  windSetAt: string | null;
  setWindDirection: (direction: WindDirection | null) => void;

  // Emergency mode actions
  activateShelterIn: (zoneNames: string[]) => void;
  deactivateShelterIn: () => void;
  activateBlackout: (zoneNames: string[]) => void;
  deactivateBlackout: () => void;

  login: (badge: string, password: string, roleOverride?: UserRole) => { success: boolean; error?: string };
  logout: () => void;
  registerUser: (data: {
    name: string; badge: string; password: string; zone: string;
    location: string; mobileNumber: string; userType: UserType;
    role: UserRole | null;
    companyType?: CompanyType; companyName?: string;
  }) => { success: boolean; error?: string };
  approveUser: (userId: number, approverName: string, finalRole?: UserRole) => void;
  rejectUser: (userId: number, approverName: string, reason?: string) => void;

  createSuperAdmin: (data: { name: string; badge: string; password: string }) => { success: boolean; error?: string };
  toggleAccountStatus: (userId: number) => void;
  resetPassword: (userId: number, newPassword: string) => void;
  updateUserResponse: (userId: number, status: UserResponseStatus) => void;

  createAlert: (data: Omit<Alert, 'id' | 'stats' | 'isActive' | 'status'>) => Alert;
  sendAllClear: () => void;
  closeAlert: (alertId: number) => void;
  respondToAlert: (response: 'confirmed' | 'need_help') => void;

  addZone: (zone: Omit<Zone, 'id'>) => void;
  updateZone: (id: number, partial: Partial<Zone>) => void;
  deleteZone: (id: number) => void;
  archiveZone: (id: number) => void;
  restoreZone: (id: number) => void;
  safeDeleteZone: (id: number) => { success: boolean; error?: string };
  bulkReassignUsersToZone: (sourceZoneId: number, targetZoneId: number) => { success: boolean; count: number; error?: string };
  renameZone: (id: number, newName: string) => { success: boolean; error?: string };
  reorderZones: (orderedIds: number[]) => void;
  reorderLocations: (zoneId: number, orderedIds: number[]) => void;

  addLocation: (location: Omit<Location, 'id'>) => void;
  updateLocation: (id: number, partial: Partial<Location>) => void;
  deleteLocation: (id: number) => void;

  activateLocationAlert: (id: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  deactivateLocationAlert: (id: number) => void;
  editLocationAlert: (id: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;

  bulkActivateZoneAlerts: (zoneIds: number[], alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  bulkDeactivateZoneAlerts: (zoneIds: number[]) => void;
  activateZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;
  deactivateZoneAlert: (zoneId: number) => void;
  editZoneAlert: (zoneId: number, alertType: LocationAlertType, priority: AlertPriority, message: string) => void;

  updateSettings: (partial: Partial<AppSettings>) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id'>) => void;

  setExpectedManpower: (locationId: number, count: number) => void;
  assignPersonnelToLocation: (userId: number, locationId: number) => void;
  removePersonnelFromLocation: (userId: number) => void;
  startAccountability: (locationId: number) => void;

  addShelter: (shelter: Omit<Shelter, 'id'>) => void;
  updateShelter: (id: number, partial: Partial<Shelter>) => void;
  deleteShelter: (id: number) => void;
  linkShelterToLocations: (shelterId: number, locationIds: number[]) => void;

  updatePersonnelLocation: (loc: PersonnelLocation) => void;
  batchUpdatePersonnelLocations: (locs: PersonnelLocation[]) => void;
  clearPersonnelLocations: () => void;

  addHazardZone: (data: { centerLat: number; centerLng: number; warningLevel?: import('@/types').WarningLevel; zoneId?: number | null; locationId?: number | null }) => void;
  removeHazardZone: (id: number) => void;
  unlockHazardZone: (id: number) => void;
  applyDefaultsToHazardZone: (id: number) => void;
  clearHazardZones: () => void;

  sendZoneNotification: (zoneId: number, message: string) => void;

  assignEco: (slot: import('@/types').EcoSlot, userId: number | null, zoneId: number | null) => void;
  toggleEcoActive: (slot: import('@/types').EcoSlot) => void;

  assignSupervisor: (locationId: number, userId: number | null) => void;
  assignBackupSupervisor: (locationId: number, userId: number | null) => void;
  toggleSupervisorActive: (locationId: number) => void;
  toggleBackupActive: (locationId: number) => void;

  // Permission management
  permissionAssignments: UserPermissionAssignment[];
  assignPermission: (userId: number, permission: PermissionKey) => void;
  removePermission: (userId: number, permission: PermissionKey) => void;
  setUserPermissions: (userId: number, permissions: PermissionKey[]) => void;
  getUserPermissions: (userId: number) => PermissionKey[];
  hasPermission: (userId: number, permission: PermissionKey) => boolean;

  setLanguage: (language: Language) => void;

  getActiveAlert: () => Alert | null;
  getLocationsByZone: (zone: string) => Location[];
}

/** Zustand setter/getter types for slice functions */
export type SetState = (
  partial: Partial<AppState> | ((state: AppState) => Partial<AppState>),
) => void;
export type GetState = () => AppState;
