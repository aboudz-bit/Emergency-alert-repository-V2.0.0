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

const CAMP_LOCATION_NAMES = ['Camp Block-A', 'Camp Block-B', 'Camp Mess Hall'];

export const seedUsers: User[] = [
  ...names.map((name, i) => {
    const locIndex = i % CPF_LOCATIONS.length;
    let status: User['status'] = 'pending';
    if (i < 25) status = 'confirmed';
    else if (i >= 45) status = 'need_help';

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

  ...[
    { id: 100, name: 'Hassan Al-Dosari',   badge: '300001', status: 'confirmed' as const, userType: 'Aramco' as const, locIdx: 0 },
    { id: 101, name: 'Yousef Al-Subaie',   badge: '300002', status: 'confirmed' as const, userType: 'Aramco' as const, locIdx: 0 },
    { id: 102, name: 'Fawaz Al-Otaibi',    badge: '300003', status: 'confirmed' as const, userType: 'Aramco' as const, locIdx: 1 },
    { id: 103, name: 'Mansour Al-Dossari', badge: '300004', status: 'confirmed' as const, userType: 'Aramco' as const, locIdx: 1 },
    { id: 104, name: 'Abdulaziz Al-Harbi', badge: '300005', status: 'confirmed' as const, userType: 'Aramco' as const, locIdx: 2 },
    { id: 105, name: 'Naif Al-Shehri',     badge: '300006', status: 'pending' as const,   userType: 'Aramco' as const, locIdx: 0 },
    { id: 106, name: 'Mishari Al-Qahtani', badge: '300007', status: 'pending' as const,   userType: 'Aramco' as const, locIdx: 1 },
    { id: 107, name: 'Sultan Al-Mutairi',  badge: '300008', status: 'pending' as const,   userType: 'Aramco' as const, locIdx: 2 },
    { id: 108, name: 'Turki Al-Ahmadi',    badge: '300009', status: 'pending' as const,   userType: 'Aramco' as const, locIdx: 0 },
    { id: 109, name: 'Bader Al-Rashidi',   badge: '300010', status: 'need_help' as const, userType: 'Aramco' as const, locIdx: 1 },
    { id: 110, name: 'Saad Al-Anazi',      badge: '300011', status: 'need_help' as const, userType: 'Aramco' as const, locIdx: 2 },
    { id: 111, name: 'Ravi Kumar',         badge: '300012', status: 'confirmed' as const, userType: 'Contract' as const, locIdx: 0, companyName: 'Tamimi' },
    { id: 112, name: 'Arjun Patel',        badge: '300013', status: 'confirmed' as const, userType: 'Contract' as const, locIdx: 1, companyName: 'Tamimi' },
    { id: 113, name: 'Deepak Sharma',      badge: '300014', status: 'pending' as const,   userType: 'Contract' as const, locIdx: 2, companyName: 'Tamimi' },
    { id: 114, name: 'Vikram Singh',       badge: '300015', status: 'pending' as const,   userType: 'Contract' as const, locIdx: 0, companyName: 'SRACO' },
    { id: 115, name: 'Rajesh Nair',        badge: '300016', status: 'need_help' as const, userType: 'Contract' as const, locIdx: 1, companyName: 'SRACO' },
  ].map((u) => ({
    id: u.id,
    name: u.name,
    badge: u.badge,
    password: 'demo1234',
    role: 'User' as const,
    zone: 'Camp',
    zoneId: 2,
    location: CAMP_LOCATION_NAMES[u.locIdx],
    locationId: 101 + u.locIdx,
    status: u.status,
    accountStatus: 'active' as const,
    lastActivity: new Date(Date.now() - Math.floor(Math.random() * 5_000_000)).toISOString(),
    isActive: true,
    userType: u.userType,
    companyType: (u.userType === 'Contract' ? 'Contractor' : 'Aramco') as User['companyType'],
    companyName: u.companyName,
  })),
];

export const seedAlerts: Alert[] = [
  {
    id: 1, type: 'Blackout', zone: 'CPF', title: 'BLACKOUT ACTIVATED',
    message: 'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Ahmed Al-Qahtani', priority: 'High', status: 'active', isActive: true,
    stats: { confirmed: 26, pending: 20, needHelp: 5, total: 51 },
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
  {
    id: 2, name: 'Camp', type: 'Custom', boundaryType: 'Polygon',
    locationId: null,
    polygonPoints: [
      { lat: 25.090, lng: 48.178 }, { lat: 25.090, lng: 48.192 },
      { lat: 25.082, lng: 48.192 }, { lat: 25.082, lng: 48.178 },
    ],
    center: { lat: 25.086, lng: 48.185 }, isActive: true, color: '#3B82F6',
    alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: null, alertHistory: [],
  },
];

const _expectedManpower = [8, 8, 8, 7, 7, 6, 6];

const CPF_LOCATION_POLYGONS: Record<string, { lat: number; lng: number }[]> = {
  'OT-1': [
    { lat: 25.0835, lng: 48.1550 }, { lat: 25.0835, lng: 48.1600 },
    { lat: 25.0810, lng: 48.1600 }, { lat: 25.0810, lng: 48.1550 },
  ],
  'OT-2': [
    { lat: 25.0835, lng: 48.1610 }, { lat: 25.0835, lng: 48.1660 },
    { lat: 25.0810, lng: 48.1660 }, { lat: 25.0810, lng: 48.1610 },
  ],
  'OT-3': [
    { lat: 25.0835, lng: 48.1670 }, { lat: 25.0835, lng: 48.1720 },
    { lat: 25.0810, lng: 48.1720 }, { lat: 25.0810, lng: 48.1670 },
  ],
  'Gas Train-1': [
    { lat: 25.0800, lng: 48.1550 }, { lat: 25.0800, lng: 48.1620 },
    { lat: 25.0770, lng: 48.1620 }, { lat: 25.0770, lng: 48.1550 },
  ],
  'Gas Train-2': [
    { lat: 25.0800, lng: 48.1630 }, { lat: 25.0800, lng: 48.1700 },
    { lat: 25.0770, lng: 48.1700 }, { lat: 25.0770, lng: 48.1630 },
  ],
  'Camp': [
    { lat: 25.0760, lng: 48.1550 }, { lat: 25.0760, lng: 48.1630 },
    { lat: 25.0730, lng: 48.1630 }, { lat: 25.0730, lng: 48.1550 },
  ],
  'CCR': [
    { lat: 25.0760, lng: 48.1640 }, { lat: 25.0760, lng: 48.1750 },
    { lat: 25.0730, lng: 48.1750 }, { lat: 25.0730, lng: 48.1640 },
  ],
};

const CAMP_LOCATION_POLYGONS: { lat: number; lng: number }[][] = [
  [
    { lat: 25.0895, lng: 48.1780 }, { lat: 25.0895, lng: 48.1840 },
    { lat: 25.0870, lng: 48.1840 }, { lat: 25.0870, lng: 48.1780 },
  ],
  [
    { lat: 25.0865, lng: 48.1780 }, { lat: 25.0865, lng: 48.1840 },
    { lat: 25.0840, lng: 48.1840 }, { lat: 25.0840, lng: 48.1780 },
  ],
  [
    { lat: 25.0865, lng: 48.1850 }, { lat: 25.0865, lng: 48.1920 },
    { lat: 25.0830, lng: 48.1920 }, { lat: 25.0830, lng: 48.1850 },
  ],
];

export const seedLocations: Location[] = [
  ...CPF_LOCATIONS.map((name, i) => ({
    id: i + 1, name, zone: 'CPF' as const, zoneId: 1,
    expectedManpower: _expectedManpower[i],
    isActive: true,
    polygonPoints: CPF_LOCATION_POLYGONS[name] ?? [],
    alertActive: false, alertType: null, alertPriority: null,
    alertMessage: '', alertUpdatedAt: null, alertHistory: [],
  })),
  ...CAMP_LOCATION_NAMES.map((name, i) => ({
    id: 101 + i, name, zone: 'Camp' as const, zoneId: 2,
    expectedManpower: i === 2 ? 4 : 6,
    isActive: true,
    polygonPoints: CAMP_LOCATION_POLYGONS[i],
    alertActive: false, alertType: null, alertPriority: null,
    alertMessage: '', alertUpdatedAt: null, alertHistory: [],
  })),
];

export const seedShelters: Shelter[] = [
  { id: 1, name: 'Shelter A - Main Gate', lat: 25.0830, lng: 48.1575, zoneId: 1, isActive: true, linkedLocationIds: [1, 2] },
  { id: 2, name: 'Shelter B - Control Room', lat: 25.0800, lng: 48.1650, zoneId: 1, isActive: true, linkedLocationIds: [3, 4] },
  { id: 3, name: 'Shelter C - South Wing', lat: 25.0745, lng: 48.1700, zoneId: 1, isActive: true, linkedLocationIds: [5, 6] },
  { id: 4, name: 'Shelter D - Emergency Bay', lat: 25.0770, lng: 48.1600, zoneId: 1, isActive: true, linkedLocationIds: [7] },
  { id: 5, name: 'Camp Muster Point', lat: 25.0870, lng: 48.1840, zoneId: 2, isActive: true, linkedLocationIds: [101, 102, 103] },
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
