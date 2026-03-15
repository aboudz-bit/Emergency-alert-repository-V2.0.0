export type UserStatus = 'confirmed' | 'missing' | 'no_reply' | 'need_help';
export type AlertType = 'Blackout' | 'Security Alert' | 'Shelter-in' | 'Drill' | 'Restricted Movement' | 'All Clear' | 'Custom';
export type ZoneType = 'CPF' | 'Camp' | 'Both';

export interface User {
  id: number;
  name: string;
  badge: string;
  role: 'User' | 'IT' | 'Super Admin';
  zone: 'CPF' | 'Camp';
  location: string;
  status: UserStatus;
  lastActivity: string;
  isActive: boolean;
}

export interface Alert {
  id: number;
  type: AlertType;
  zone: ZoneType;
  title: string;
  message: string;
  timestamp: string;
  sentBy: string;
  stats: {
    confirmed: number;
    missing: number;
    noReply: number;
    needHelp: number;
    total: number;
  };
  isActive: boolean;
}

const names = [
  "Abdullah Al-Rashidi", "Khalid Al-Mutairi", "Fahad Al-Dosari", "Omar Al-Shehri", "Saeed Al-Ghamdi", 
  "Nasser Al-Qahtani", "Mohammed Al-Harbi", "Faisal Al-Otaibi", "Ali Al-Zahrani", "Turki Al-Enezi", 
  "Hamad Al-Shammari", "Badr Al-Anazi", "Sultan Al-Yami", "Waleed Al-Maliki", "Rayan Al-Thaqafi", 
  "Yazeed Al-Baqami", "Majid Al-Hajri", "Saud Al-Dossari", "Ibrahim Al-Ruwaili", "Bandar Al-Subhi", 
  "Nawaf Al-Balawi", "Tariq Al-Shahrani", "Wael Al-Asmari", "Hani Al-Sufyani", "Ziad Al-Juhani", 
  "Saleh Al-Ahmadi", "Rashid Al-Mansouri", "Meshal Al-Rashidi", "Jaber Al-Mutairi", "Fares Al-Salmi", 
  "Nayef Al-Khalidi", "Saad Al-Amri", "Marzouq Al-Hajri", "Ahmad Al-Dawsari", "Sami Al-Bakri", 
  "Raed Al-Harthy", "Qasem Al-Jabri", "Adel Al-Sayed", "Khaled Al-Barrak", "Yasser Al-Mudaiheem", 
  "Talal Al-Habdan", "Hamza Al-Bishi", "Mazen Al-Sulaimi", "Dhafer Al-Qahtani", "Ghazi Al-Dawsari", 
  "Loai Al-Rashidi", "Emad Al-Shamari", "Essam Al-Juaid", "Nooreddine Al-Yami", "Bilal Al-Osaimi"
];

export const cpfLocations = ["Control Room", "OT-1", "OT-2", "OT-3", "OT-4", "OT-5", "Gas Train 1", "Gas Train 2", "Gas Train 3", "Shipping", "Utility", "WIP", "Cogen", "Central Shop", "Lab"];
export const campLocations = ["Admin", "Clinic", "Field", "IT", "Airport", "Community", "Security", "Contractors", "Other"];

// Generate exactly 30 Confirmed, 12 Missing, 8 No Reply for the active alert
const generateStatus = (index: number): UserStatus => {
  if (index < 30) return 'confirmed';
  if (index < 42) return 'missing';
  return 'no_reply';
};

export const mockUsers: User[] = names.map((name, i) => {
  const isCpf = i < 30; // 30 CPF, 20 Camp
  return {
    id: i + 1,
    name,
    badge: `10${Math.floor(1000 + Math.random() * 9000)}`,
    role: i === 0 ? 'Super Admin' : (i === 1 ? 'IT' : 'User'),
    zone: isCpf ? 'CPF' : 'Camp',
    location: isCpf ? cpfLocations[i % cpfLocations.length] : campLocations[(i - 30) % campLocations.length],
    status: generateStatus(i),
    lastActivity: new Date(Date.now() - Math.random() * 10000000).toISOString(),
    isActive: true
  };
});

export const mockAlerts: Alert[] = [
  {
    id: 1,
    type: 'Blackout',
    zone: 'CPF',
    title: 'BLACKOUT ACTIVATED',
    message: 'A blackout condition has been detected in the CPF zone. All personnel must immediately proceed to their designated muster points and await further instructions from the emergency coordinator.',
    timestamp: '2024-01-15T14:32:00Z',
    sentBy: 'Ahmed Al-Qahtani',
    stats: { confirmed: 30, missing: 12, noReply: 8, needHelp: 0, total: 50 },
    isActive: true
  },
  {
    id: 2,
    type: 'Security Alert',
    zone: 'Camp',
    title: 'SECURITY INCIDENT',
    message: 'Please remain indoors and lock all doors until further notice.',
    timestamp: '2024-01-10T09:15:00Z',
    sentBy: 'Security Team',
    stats: { confirmed: 45, missing: 2, noReply: 1, needHelp: 0, total: 48 },
    isActive: false
  },
  {
    id: 3,
    type: 'Shelter-in',
    zone: 'CPF',
    title: 'SHELter IN PLACE',
    message: 'Toxic gas alarm triggered. Shelter in place immediately.',
    timestamp: '2024-01-08T11:20:00Z',
    sentBy: 'System Auto',
    stats: { confirmed: 47, missing: 2, noReply: 1, needHelp: 0, total: 50 },
    isActive: false
  },
  {
    id: 4,
    type: 'Drill',
    zone: 'Both',
    title: 'EMERGENCY EVACUATION DRILL',
    message: 'This is a drill. Proceed to muster points.',
    timestamp: '2024-01-05T10:00:00Z',
    sentBy: 'HSE Dept',
    stats: { confirmed: 90, missing: 5, noReply: 3, needHelp: 0, total: 98 },
    isActive: false
  },
  {
    id: 5,
    type: 'All Clear',
    zone: 'CPF',
    title: 'ALL CLEAR',
    message: 'The previous emergency condition has been resolved. Return to normal operations.',
    timestamp: '2023-12-28T16:00:00Z',
    sentBy: 'Command Center',
    stats: { confirmed: 50, missing: 0, noReply: 0, needHelp: 0, total: 50 },
    isActive: false
  }
];

// In-memory store to simulate backend state
export const store = {
  users: [...mockUsers],
  alerts: [...mockAlerts],
};
