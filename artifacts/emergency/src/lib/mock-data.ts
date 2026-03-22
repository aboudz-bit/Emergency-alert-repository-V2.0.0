/**
 * Centralized mock data — re-exports from types and provides seeded data.
 * All state is managed by the Zustand store (src/store/index.ts).
 * This file provides the initial seed data only.
 */

export type {
  UserStatus,
  UserResponseStatus,
  UserRole,
  AlertType,
  ZoneType,
  EmploymentType,
  User,
  Alert,
  Zone,
  Location,
  AppSettings,
  ActivityLog,
} from '@/types';

// ─── Location lists ────────────────────────────────────────────────────────────

export const cpfLocations = [
  'Control Room', 'OT-1', 'OT-2', 'OT-3', 'OT-4', 'OT-5',
  'Gas Train 1', 'Gas Train 2', 'Gas Train 3', 'Shipping',
  'Utility', 'WIP', 'Cogen', 'Central Shop', 'Lab',
];

export const campLocations = [
  'Admin', 'Clinic', 'Field', 'IT', 'Airport',
  'Community', 'Security', 'Contractors', 'Other',
];

// ─── Seed users (50 personnel) ─────────────────────────────────────────────────

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

import type { User, Alert, Zone, Location, ActivityLog, AppSettings, EcoAssignment, SupervisorAssignment, EmploymentType } from '@/types';

export const seedUsers: User[] = names.map((name, i) => {
  const isCpf = i < 30;
  const locList = isCpf ? cpfLocations : campLocations;
  const locIndex = isCpf ? (i % locList.length) : ((i - 30) % locList.length);
  const status: User['status'] = 'no_reply';

  let role: User['role'] = 'User';
  if (i === 0) role = 'Super Admin';
  else if (i === 1) role = 'IT';

  // Alternate employment type: even index = aramco, odd index = contract
  const employmentType: EmploymentType = i % 2 === 0 ? 'Aramco' : 'Contract';

  return {
    id: i + 1,
    name,
    badge: badges[i],
    password: 'demo1234',
    role,
    zone: isCpf ? 'CPF' : 'Camp',
    location: locList[locIndex],
    status,
    accountStatus: i === 3 ? 'disabled' : 'active',
    lastActivity: new Date(Date.now() - Math.floor(Math.random() * 10_000_000)).toISOString(),
    isActive: i !== 3,
    employmentType,
    alertResponseStatus: null,
  };
});

export const seedAlerts: Alert[] = [];

export const seedZones: Zone[] = [
  {
    id: 1,
    name: 'CPF',
    type: 'CPF',
    boundaryType: 'Polygon',
    points: [
      { x: 10, y: 10 }, { x: 55, y: 8 }, { x: 60, y: 45 }, { x: 50, y: 58 }, { x: 15, y: 55 }, { x: 8, y: 35 },
    ],
    polygonPoints: [
      { lat: 25.084, lng: 48.155 },
      { lat: 25.084, lng: 48.175 },
      { lat: 25.072, lng: 48.175 },
      { lat: 25.072, lng: 48.155 },
    ],
    center: { lat: 25.078, lng: 48.165 },
    isActive: true,
    color: '#EF4444',
    alertActive: false,
    alertType: null,
    alertPriority: null,
    alertMessage: '',
    alertUpdatedAt: null,
    alertHistory: [],
  },
  {
    id: 2,
    name: 'Camp',
    type: 'Camp',
    boundaryType: 'Polygon',
    points: [
      { x: 65, y: 15 }, { x: 92, y: 12 }, { x: 95, y: 55 }, { x: 70, y: 60 }, { x: 62, y: 40 },
    ],
    polygonPoints: [
      { lat: 25.090, lng: 48.185 },
      { lat: 25.090, lng: 48.200 },
      { lat: 25.080, lng: 48.200 },
      { lat: 25.080, lng: 48.185 },
    ],
    center: { lat: 25.085, lng: 48.1925 },
    isActive: true,
    color: '#3B82F6',
    alertActive: false,
    alertType: null,
    alertPriority: null,
    alertMessage: '',
    alertUpdatedAt: null,
    alertHistory: [],
  },
];

// Manpower distribution for CPF locations (30 CPF users across 15 locations)
const cpfManpower = [4, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1];
const campManpower = [3, 2, 2, 2, 2, 2, 2, 2, 3];

export const seedLocations: Location[] = [
  ...cpfLocations.map((name, i) => ({ id: i + 1, name, zone: 'CPF' as const, isActive: true, totalManpower: cpfManpower[i] || 2 })),
  ...campLocations.map((name, i) => ({ id: cpfLocations.length + i + 1, name, zone: 'Camp' as const, isActive: true, totalManpower: campManpower[i] || 2 })),
];

export const seedActivityLogs: ActivityLog[] = [
  { id: 1, type: 'info', message: 'System initialized. No active alerts.', timestamp: new Date().toISOString() },
];

export const seedSettings: AppSettings = {
  systemName: 'Khurais Emergency Alert System',
  timezone: 'ast',
  language: 'en',
  rtlSupport: false,
  autoDetectZone: true,
  gpsAccuracyMeters: 50,
  locationUpdateIntervalSeconds: 30,
  notifications: {
    alertSound: true,
    pushNotifications: true,
    escalationTimeoutMinutes: 15,
  },
  sessionTimeoutMinutes: 60,
  requireLocationPermission: true,
  badgeAsUsername: true,
  wifiAndMobileData: true,
  systemVersion: '2.0.0-phase2',
  hazardHotRadius: 50,
  hazardWarmRadius: 150,
  hazardColdRadius: 300,
};

// ─── Seed ECO assignments ────────────────────────────────────────────────────

// ECO A is assigned to user index 5 (Nasser Al-Qahtani) for CPF
// ECO B and C are empty slots
export const seedEcoAssignments: EcoAssignment[] = [
  {
    ecoSlot: 'A',
    assignedUserId: 6, // Nasser Al-Qahtani (id = index+1)
    assignedUserName: 'Nasser Al-Qahtani',
    assignedUserBadge: '103618',
    assignedZoneId: 1,
    assignedZoneName: 'CPF',
    active: true,
    assignedByUserId: 1,
    assignedByName: 'Abdullah Al-Rashidi',
    assignedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    notes: 'Primary ECO for CPF operations',
  },
  {
    ecoSlot: 'B',
    assignedUserId: null,
    assignedUserName: null,
    assignedUserBadge: null,
    assignedZoneId: null,
    assignedZoneName: null,
    active: false,
    assignedByUserId: null,
    assignedByName: null,
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
    assignedByUserId: null,
    assignedByName: null,
    assignedAt: null,
  },
];

// Apply ECO flags to the seed user who is assigned as ECO A
const ecoUserId = 6; // Nasser Al-Qahtani
const ecoUserIdx = seedUsers.findIndex(u => u.id === ecoUserId);
if (ecoUserIdx >= 0) {
  seedUsers[ecoUserIdx] = {
    ...seedUsers[ecoUserIdx],
    isECOAssigned: true,
    ecoSlot: 'A',
    ecoZoneId: 1,
    ecoZoneName: 'CPF',
    ecoAssignmentActive: true,
    ecoAssignedAt: seedEcoAssignments[0].assignedAt,
    ecoAssignedByUserId: 1,
    ecoAssignedByName: 'Abdullah Al-Rashidi',
    originalLocation: seedUsers[ecoUserIdx].location,
    currentOperationalLocation: 'CCR',
  };
}

// ─── Seed Supervisor assignments ──────────────────────────────────────────────

// OT-1: Supervisor = Mohammed Al-Harbi (id=7), Backup = Faisal Al-Otaibi (id=8)
// OT-2: Supervisor = Ali Al-Zahrani (id=9), no backup
export const seedSupervisorAssignments: SupervisorAssignment[] = [
  {
    locationId: 2, // OT-1
    locationName: 'OT-1',
    zoneName: 'CPF',
    supervisorUserId: 7,
    supervisorUserName: 'Mohammed Al-Harbi',
    supervisorUserBadge: '108291',
    backupSupervisorUserId: 8,
    backupSupervisorUserName: 'Faisal Al-Otaibi',
    backupSupervisorUserBadge: '105477',
    supervisorActive: true,
    backupActive: true,
    totalManpower: 2,
    assignedByUserId: 1,
    assignedByName: 'Abdullah Al-Rashidi',
    assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    notes: 'Primary OT-1 supervision',
  },
  {
    locationId: 3, // OT-2
    locationName: 'OT-2',
    zoneName: 'CPF',
    supervisorUserId: 9,
    supervisorUserName: 'Ali Al-Zahrani',
    supervisorUserBadge: '106832',
    backupSupervisorUserId: null,
    backupSupervisorUserName: null,
    backupSupervisorUserBadge: null,
    supervisorActive: true,
    backupActive: false,
    totalManpower: 2,
    assignedByUserId: 1,
    assignedByName: 'Abdullah Al-Rashidi',
    assignedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    notes: '',
  },
];

// Apply supervisor flags to seed users
const supervisorPairs: Array<{ userId: number; locId: number; locName: string; zone: string; isSupervisor: boolean }> = [
  { userId: 7, locId: 2, locName: 'OT-1', zone: 'CPF', isSupervisor: true },
  { userId: 8, locId: 2, locName: 'OT-1', zone: 'CPF', isSupervisor: false },
  { userId: 9, locId: 3, locName: 'OT-2', zone: 'CPF', isSupervisor: true },
];
for (const sp of supervisorPairs) {
  const idx = seedUsers.findIndex(u => u.id === sp.userId);
  if (idx >= 0) {
    seedUsers[idx] = {
      ...seedUsers[idx],
      isSupervisorAssigned: sp.isSupervisor,
      isBackupSupervisorAssigned: !sp.isSupervisor,
      supervisorLocationId: sp.locId,
      supervisorLocationName: sp.locName,
      supervisorZoneName: sp.zone,
      supervisorAssignmentActive: true,
      supervisorAssignedAt: seedSupervisorAssignments[0].assignedAt,
      supervisorAssignedByUserId: 1,
      supervisorAssignedByName: 'Abdullah Al-Rashidi',
    };
  }
}

// Legacy store shim — keep for any file that hasn't been updated yet
export const store = {
  get users() { return seedUsers; },
  get alerts() { return seedAlerts; },
};
