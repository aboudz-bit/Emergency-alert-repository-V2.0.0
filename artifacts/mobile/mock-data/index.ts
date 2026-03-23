import type { User, Alert, Zone, Location, ActivityLog, AppSettings, EcoAssignment, SupervisorAssignment, Shelter } from '@/types';
import { CPF_LOCATIONS } from '@/constants/theme';

const names = [
  'Abdullah Al-Rashidi', 'Khalid Al-Mutairi', 'Fahad Al-Dosari', 'Omar Al-Shehri', 'Saeed Al-Ghamdi',
  'Nasser Al-Qahtani', 'Mohammed Al-Harbi', 'Faisal Al-Otaibi', 'Ali Al-Zahrani', 'Turki Al-Enezi',
  'Hamad Al-Shammari', 'Badr Al-Anazi', 'Sultan Al-Yami', 'Waleed Al-Maliki', 'Rayan Al-Thaqafi',
  'Yazeed Al-Baqami', 'Majid Al-Hajri', 'Saud Al-Dossari', 'Ibrahim Al-Ruwaili', 'Bandar Al-Subhi',
  'Nawaf Al-Balawi', 'Tariq Al-Shahrani', 'Wael Al-Asmari', 'Hani Al-Sufyani', 'Ziad Al-Juhani',
  'Saleh Al-Ahmadi', 'Rashid Al-Mansouri', 'Meshal Al-Rashidi', 'Jaber Al-Mutairi', 'Fares Al-Salmi',
  'Nayef Al-Khalidi', 'Saad Al-Amri', 'Marzouq Al-Hajri', 'Ahmad Al-Dawsari', 'Sami Al-Bakri',
  'Raed Al-Harthy', 'Qasem Al-Jabri', 'Adel Al-Sayed', 'Khaled Al-Barrak', 'Yasser Al-Mudaiheem',
  'Talal Al-Habdan', 'Hamza Al-Bishi', 'Mazen Al-Sulaimi', 'Dhafer Al-Qahtani', 'Ghazi Al-Dawsari',
  'Loai Al-Rashidi', 'Emad Al-Shamari', 'Essam Al-Juaid', 'Nooreddine Al-Yami', 'Bilal Al-Osaimi',
];

const badges = [
  '102934', '104822', '101156', '109982', '107543',
  '103618', '108291', '105477', '106832', '101994',
  '109123', '107765', '104391', '102847', '108564',
  '103027', '106148', '109371', '105892', '107234',
  '101463', '108907', '104715', '102381', '109654',
  '106523', '103849', '107112', '104268', '108736',
  '101827', '106394', '109041', '103572', '107983',
  '105139', '102716', '108452', '104897', '101345',
  '109218', '106781', '103164', '107529', '104063',
  '108317', '102593', '105864', '109742', '101678',
];

export const seedUsers: User[] = [
  ...names.map((name, i) => {
    const locIndex = i % CPF_LOCATIONS.length;
    const status: User['status'] =
      i < 30 ? 'confirmed' : 'pending';

    let role: User['role'] = 'User';
    if (i === 0) role = 'Super Admin';
    else if (i === 1) role = 'IT';

    return {
      id: i + 1,
      name,
      badge: badges[i],
      password: 'demo1234',
      role,
      zone: 'CPF',
      zoneId: 1,
      location: CPF_LOCATIONS[locIndex],
      locationId: locIndex + 1,
      status,
      accountStatus: i === 3 ? 'disabled' as const : 'active' as const,
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 10_000_000)).toISOString(),
      isActive: i !== 3,
    };
  }),
  {
    id: 51,
    name: 'Contractor Demo',
    badge: '200001',
    password: 'demo1234',
    role: 'User' as const,
    zone: 'CPF',
    zoneId: 1,
    location: CPF_LOCATIONS[0],
    locationId: 1,
    status: 'confirmed' as const,
    accountStatus: 'active' as const,
    lastActivity: new Date().toISOString(),
    isActive: true,
    userType: 'Contract' as const,
    companyType: 'Contractor' as const,
    companyName: 'Tamimi',
  },
];

export const seedAlerts: Alert[] = [
  {
    id: 1, type: 'Blackout', zone: 'CPF', title: 'BLACKOUT ACTIVATED',
    message: 'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Ahmed Al-Qahtani', priority: 'High', status: 'active', isActive: true,
    stats: { confirmed: 30, pending: 20, needHelp: 0, total: 50 },
  },
  {
    id: 2, type: 'Security Alert', zone: 'CPF', title: 'SECURITY INCIDENT',
    message: 'Please remain indoors and lock all doors until further notice.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Security Team', priority: 'High', status: 'closed', isActive: false,
    stats: { confirmed: 45, pending: 3, needHelp: 0, total: 48 },
  },
  {
    id: 3, type: 'Shelter-in', zone: 'CPF', title: 'SHELTER IN PLACE',
    message: 'Toxic gas alarm triggered. Shelter in place immediately.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'System Auto', priority: 'High', status: 'closed', isActive: false,
    stats: { confirmed: 47, pending: 3, needHelp: 0, total: 50 },
  },
  {
    id: 4, type: 'Drill', zone: 'All Zones', title: 'EMERGENCY EVACUATION DRILL',
    message: 'This is a drill. Proceed to muster points.',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'HSE Dept', priority: 'Medium', status: 'closed', isActive: false,
    stats: { confirmed: 90, pending: 8, needHelp: 0, total: 98 },
  },
  {
    id: 5, type: 'All Clear', zone: 'CPF', title: 'ALL CLEAR',
    message: 'The previous emergency condition has been resolved. Return to normal operations.',
    timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Command Center', priority: 'Low', status: 'closed', isActive: false,
    stats: { confirmed: 50, pending: 0, needHelp: 0, total: 50 },
  },
];

export const seedZones: Zone[] = [
  {
    id: 1, name: 'CPF', type: 'CPF', boundaryType: 'Polygon',
    locationId: null,
    polygonPoints: [
      { lat: 25.084, lng: 48.155 }, { lat: 25.084, lng: 48.175 },
      { lat: 25.072, lng: 48.175 }, { lat: 25.072, lng: 48.155 },
    ],
    center: { lat: 25.078, lng: 48.165 }, isActive: true, color: '#EF4444',
    alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: null, alertHistory: [],
  },
];

// expectedManpower per location — 50 users across 7 locations (50/7 ≈ 7-8 each)
const _expectedManpower = [8, 8, 8, 7, 7, 6, 6];
export const seedLocations: Location[] = CPF_LOCATIONS.map((name, i) => ({
  id: i + 1, name, zone: 'CPF' as const, zoneId: 1,
  expectedManpower: _expectedManpower[i],
  isActive: true, polygonPoints: [],
  alertActive: false, alertType: null, alertPriority: null,
  alertMessage: '', alertUpdatedAt: null, alertHistory: [],
}));

export const seedShelters: Shelter[] = [
  { id: 1, name: 'Shelter A - Main Gate', lat: 25.083, lng: 48.158, zoneId: 1, isActive: true, linkedLocationIds: [1, 2] },
  { id: 2, name: 'Shelter B - Control Room', lat: 25.080, lng: 48.165, zoneId: 1, isActive: true, linkedLocationIds: [3, 4] },
  { id: 3, name: 'Shelter C - South Wing', lat: 25.074, lng: 48.170, zoneId: 1, isActive: true, linkedLocationIds: [5, 6] },
  { id: 4, name: 'Shelter D - Emergency Bay', lat: 25.077, lng: 48.160, zoneId: 1, isActive: true, linkedLocationIds: [7] },
];

export const seedActivityLogs: ActivityLog[] = [
  { id: 1, type: 'info', message: 'System check completed successfully.', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 2, type: 'action', message: 'Admin Ahmed updated CPF zone boundaries.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actorName: 'Ahmed Al-Qahtani' },
  { id: 3, type: 'report', message: 'Weekly drill report generated and archived.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 4, type: 'user', message: '5 new user accounts provisioned by IT.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, type: 'alert', message: 'All Clear sent — Security Alert resolved.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

export const seedEcoAssignments: EcoAssignment[] = [
  {
    ecoSlot: 'A',
    assignedUserId: 6,
    assignedUserName: 'Nasser Al-Qahtani',
    assignedUserBadge: '103618',
    assignedZoneId: 1,
    assignedZoneName: 'CPF',
    active: true,
    assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    ecoSlot: 'B',
    assignedUserId: null,
    assignedUserName: null,
    assignedUserBadge: null,
    assignedZoneId: null,
    assignedZoneName: null,
    active: false,
    assignedAt: null,
  },
  {
    ecoSlot: 'C',
    assignedUserId: null,
    assignedUserName: null,
    assignedUserBadge: null,
    assignedZoneId: null,
    assignedZoneName: null,
    active: false,
    assignedAt: null,
  },
];

export const seedSupervisorAssignments: SupervisorAssignment[] = CPF_LOCATIONS.map((name, i) => {
  const locId = i + 1;
  if (locId === 1) return {
    locationId: 1, locationName: 'OT-1', zoneName: 'CPF',
    supervisorUserId: 7, supervisorUserName: 'Mohammed Al-Harbi', supervisorUserBadge: '108291',
    backupSupervisorUserId: 8, backupSupervisorUserName: 'Faisal Al-Otaibi', backupSupervisorUserBadge: '105477',
    supervisorActive: true, backupActive: true, totalManpower: _expectedManpower[i],
  };
  if (locId === 2) return {
    locationId: 2, locationName: 'OT-2', zoneName: 'CPF',
    supervisorUserId: 9, supervisorUserName: 'Ali Al-Zahrani', supervisorUserBadge: '106832',
    backupSupervisorUserId: null, backupSupervisorUserName: null, backupSupervisorUserBadge: null,
    supervisorActive: true, backupActive: false, totalManpower: _expectedManpower[i],
  };
  return {
    locationId: locId, locationName: name, zoneName: 'CPF',
    supervisorUserId: null, supervisorUserName: null, supervisorUserBadge: null,
    backupSupervisorUserId: null, backupSupervisorUserName: null, backupSupervisorUserBadge: null,
    supervisorActive: false, backupActive: false, totalManpower: _expectedManpower[i],
  };
});

export const seedSettings: AppSettings = {
  systemName: 'Khurais Emergency Alert System',
  timezone: 'ast',
  language: 'en',
  rtlSupport: false,
  autoDetectZone: true,
  gpsAccuracyMeters: 50,
  locationUpdateIntervalSeconds: 30,
  notifications: { alertSound: true, pushNotifications: true, escalationTimeoutMinutes: 15 },
  sessionTimeoutMinutes: 60,
  requireLocationPermission: true,
  badgeAsUsername: true,
  wifiAndMobileData: true,
  systemVersion: '2.0.0-ios',
  hazardHotRadius: 200,
  hazardWarmRadius: 500,
  hazardColdRadius: 1000,
};
