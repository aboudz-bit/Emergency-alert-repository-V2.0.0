import type { User, Alert, Zone, Location, ActivityLog, AppSettings } from '@/types';
import { CPF_LOCATIONS, CAMP_LOCATIONS } from '@/constants/theme';

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

export const seedUsers: User[] = names.map((name, i) => {
  const isCpf = i < 30;
  const locList = isCpf ? CPF_LOCATIONS : CAMP_LOCATIONS;
  const locIndex = isCpf ? (i % locList.length) : ((i - 30) % locList.length);
  const status: User['status'] =
    i < 30 ? 'confirmed' : i < 42 ? 'missing' : 'no_reply';

  let role: User['role'] = 'User';
  if (i === 0) role = 'Super Admin';
  else if (i === 1) role = 'IT';

  return {
    id: i + 1,
    name,
    badge: badges[i],
    password: 'demo1234',
    role,
    zone: isCpf ? 'CPF' as const : 'Camp' as const,
    location: locList[locIndex],
    status,
    accountStatus: i === 3 ? 'disabled' as const : 'active' as const,
    lastActivity: new Date(Date.now() - Math.floor(Math.random() * 10_000_000)).toISOString(),
    isActive: i !== 3,
  };
});

export const seedAlerts: Alert[] = [
  {
    id: 1, type: 'Blackout', zone: 'CPF', title: 'BLACKOUT ACTIVATED',
    message: 'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Ahmed Al-Qahtani', priority: 'High', status: 'active', isActive: true,
    stats: { confirmed: 30, missing: 12, noReply: 8, needHelp: 0, total: 50 },
  },
  {
    id: 2, type: 'Security Alert', zone: 'Camp', title: 'SECURITY INCIDENT',
    message: 'Please remain indoors and lock all doors until further notice.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Security Team', priority: 'High', status: 'closed', isActive: false,
    stats: { confirmed: 45, missing: 2, noReply: 1, needHelp: 0, total: 48 },
  },
  {
    id: 3, type: 'Shelter-in', zone: 'CPF', title: 'SHELTER IN PLACE',
    message: 'Toxic gas alarm triggered. Shelter in place immediately.',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'System Auto', priority: 'High', status: 'closed', isActive: false,
    stats: { confirmed: 47, missing: 2, noReply: 1, needHelp: 0, total: 50 },
  },
  {
    id: 4, type: 'Drill', zone: 'All Zones', title: 'EMERGENCY EVACUATION DRILL',
    message: 'This is a drill. Proceed to muster points.',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'HSE Dept', priority: 'Medium', status: 'closed', isActive: false,
    stats: { confirmed: 90, missing: 5, noReply: 3, needHelp: 0, total: 98 },
  },
  {
    id: 5, type: 'All Clear', zone: 'CPF', title: 'ALL CLEAR',
    message: 'The previous emergency condition has been resolved. Return to normal operations.',
    timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    sentBy: 'Command Center', priority: 'Low', status: 'closed', isActive: false,
    stats: { confirmed: 50, missing: 0, noReply: 0, needHelp: 0, total: 50 },
  },
];

export const seedZones: Zone[] = [
  {
    id: 1, name: 'CPF', type: 'CPF', boundaryType: 'Polygon',
    polygonPoints: [
      { lat: 25.084, lng: 48.155 }, { lat: 25.084, lng: 48.175 },
      { lat: 25.072, lng: 48.175 }, { lat: 25.072, lng: 48.155 },
    ],
    center: { lat: 25.078, lng: 48.165 }, isActive: true, color: '#EF4444',
  },
  {
    id: 2, name: 'Camp', type: 'Camp', boundaryType: 'Polygon',
    polygonPoints: [
      { lat: 25.090, lng: 48.185 }, { lat: 25.090, lng: 48.200 },
      { lat: 25.080, lng: 48.200 }, { lat: 25.080, lng: 48.185 },
    ],
    center: { lat: 25.085, lng: 48.1925 }, isActive: true, color: '#3B82F6',
  },
];

export const seedLocations: Location[] = [
  ...CPF_LOCATIONS.map((name, i) => ({ id: i + 1, name, zone: 'CPF' as const, isActive: true, alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: null, alertHistory: [] })),
  ...CAMP_LOCATIONS.map((name, i) => ({ id: CPF_LOCATIONS.length + i + 1, name, zone: 'Camp' as const, isActive: true, alertActive: false, alertType: null, alertPriority: null, alertMessage: '', alertUpdatedAt: null, alertHistory: [] })),
];

export const seedActivityLogs: ActivityLog[] = [
  { id: 1, type: 'info', message: 'System check completed successfully.', timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
  { id: 2, type: 'action', message: 'Admin Ahmed updated CPF zone boundaries.', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), actorName: 'Ahmed Al-Qahtani' },
  { id: 3, type: 'report', message: 'Weekly drill report generated and archived.', timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: 4, type: 'user', message: '5 new user accounts provisioned by IT.', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, type: 'alert', message: 'All Clear sent — Security Alert resolved.', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
];

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
};
