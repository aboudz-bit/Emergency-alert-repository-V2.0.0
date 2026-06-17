// Demo geometry — rendered ONLY when the backend returns no data, so the Live
// Map is never blank in a fresh/offline environment. Centered on the Khurais
// CPF area to match the mobile seed. Real backend data always takes precedence.
import type {
  ZoneDto,
  LocationDto,
  UserDto,
  PersonnelLocationDto,
  ShelterDto,
  HazardZoneDto,
  StreetDto,
  EcoRouteDto,
} from "@workspace/keas-core";

const C: [number, number] = [25.131, 48.776];

export const DEMO_ZONES: ZoneDto[] = [
  {
    id: 1, name: "CPF", type: "CPF", boundaryType: "Polygon",
    polygonPoints: [
      { lat: 25.137, lng: 48.768 }, { lat: 25.137, lng: 48.784 },
      { lat: 25.126, lng: 48.784 }, { lat: 25.126, lng: 48.768 },
    ],
    center: { lat: 25.1315, lng: 48.776 }, isActive: true, isArchived: false,
    sortOrder: 0, color: "#5B3A8E", alertActive: true, alertType: "Security Alert",
    alertPriority: "High", alertMessage: "", alertHistory: [],
    alertTargetScope: "zone", alertTargetLocationIds: [],
  },
  {
    id: 2, name: "Camp", type: "CPF", boundaryType: "Polygon",
    polygonPoints: [
      { lat: 25.124, lng: 48.786 }, { lat: 25.124, lng: 48.796 },
      { lat: 25.117, lng: 48.796 }, { lat: 25.117, lng: 48.786 },
    ],
    center: { lat: 25.1205, lng: 48.791 }, isActive: true, isArchived: false,
    sortOrder: 1, color: "#16A34A", alertActive: false, alertType: null,
    alertPriority: null, alertMessage: "", alertHistory: [],
    alertTargetScope: "zone", alertTargetLocationIds: [],
  },
];

export const DEMO_PERSONNEL: Array<PersonnelLocationDto & { name: string; status: string; userType: string }> = [
  { userId: 1, lat: 25.134, lng: 48.773, accuracy: 5, timestamp: 0, name: "A. Salem", status: "confirmed", userType: "Aramco" },
  { userId: 2, lat: 25.132, lng: 48.778, accuracy: 5, timestamp: 0, name: "M. Khan", status: "pending", userType: "Contract" },
  { userId: 3, lat: 25.129, lng: 48.781, accuracy: 5, timestamp: 0, name: "R. Omar", status: "need_help", userType: "Contract" },
  { userId: 4, lat: 25.1285, lng: 48.7725, accuracy: 5, timestamp: 0, name: "S. Ali", status: "confirmed", userType: "Aramco" },
  { userId: 5, lat: 25.1205, lng: 48.7905, accuracy: 5, timestamp: 0, name: "T. Noor", status: "pending", userType: "Aramco" },
];

export const DEMO_SHELTERS: ShelterDto[] = [
  { id: 1, name: "Muster Point A", lat: 25.1335, lng: 48.7805, zoneId: 1, isActive: true, linkedLocationIds: [] },
  { id: 2, name: "Camp Shelter", lat: 25.1195, lng: 48.7885, zoneId: 2, isActive: true, linkedLocationIds: [] },
];

export const DEMO_HAZARDS: HazardZoneDto[] = [
  {
    id: 1, zoneId: 1, locationId: null, centerLat: 25.1325, centerLng: 48.7765,
    hotRadius: 120, warmRadius: 260, coldRadius: 420, alertId: null,
    warningLevel: "hot", isActive: true, isLocked: false, createdBy: "demo",
    windDirectionDeg: 135, windMode: "manual", hazardShape: "plume",
  },
];

export const DEMO_STREETS: StreetDto[] = [
  { id: "s1", name: "Main Access", path: [{ lat: 25.135, lng: 48.770 }, { lat: 25.131, lng: 48.776 }, { lat: 25.128, lng: 48.781 }], createdAt: 0 },
  { id: "s2", name: "Perimeter Road", path: [{ lat: 25.128, lng: 48.781 }, { lat: 25.124, lng: 48.786 }, { lat: 25.120, lng: 48.790 }], createdAt: 0 },
  { id: "s3", name: "Camp Spur", path: [{ lat: 25.120, lng: 48.790 }, { lat: 25.119, lng: 48.788 }], createdAt: 0 },
];

export const DEMO_ROUTE_STREET_IDS = new Set<string>(["s1", "s2"]);

// Demo ECO routes — the Route List/Details need full EcoRoute objects (useMapData
// only flattens the active street IDs). Mobile EcoRoute has NO name field, so
// routes are labeled by index/status/date, never an invented title.
export const DEMO_ROUTES: EcoRouteDto[] = [
  { id: "r1", streetIds: ["s1", "s2"], createdBy: 8, status: "active", createdAt: 0, updatedAt: 0 },
  { id: "r0", streetIds: ["s1"], createdBy: 8, status: "edited", createdAt: 0, updatedAt: 0 },
];

export const DEMO_CENTER = C;

// Demo locations + roster — feed the shared emergency-intelligence engine and the
// Dashboard KPIs when the backend roster is empty. Zone 1 (CPF) is alertActive,
// so intelligence is computed over its users (need_help + missing present).
export const DEMO_LOCATIONS: LocationDto[] = [
  { id: 1, name: "OT-1", zone: "CPF", zoneId: 1, expectedManpower: 4, isActive: true, sortOrder: 0, polygonPoints: [], alertActive: false, alertMessage: "", alertHistory: [] },
  { id: 2, name: "Gas Train-1", zone: "CPF", zoneId: 1, expectedManpower: 4, isActive: true, sortOrder: 1, polygonPoints: [], alertActive: true, alertMessage: "", alertHistory: [] },
  { id: 3, name: "Camp", zone: "Camp", zoneId: 2, expectedManpower: 5, isActive: true, sortOrder: 2, polygonPoints: [], alertActive: false, alertMessage: "", alertHistory: [] },
];

function du(id: number, name: string, zoneId: number, zone: string, locationId: number, location: string, status: string, escalationLevel = 0): UserDto {
  return {
    id, name, badge: `B${1000 + id}`, role: "User", zone, zoneId, location, locationId,
    status: status as UserDto["status"], accountStatus: "active", isActive: true,
    userType: id % 2 === 0 ? "Contract" : "Aramco", escalationLevel,
  };
}

export const DEMO_USERS: UserDto[] = [
  du(1, "A. Salem", 1, "CPF", 1, "OT-1", "confirmed"),
  du(2, "M. Khan", 1, "CPF", 1, "OT-1", "confirmed"),
  du(3, "S. Ali", 1, "CPF", 1, "OT-1", "pending"),
  du(4, "R. Omar", 1, "CPF", 2, "Gas Train-1", "need_help"),
  du(5, "K. Idris", 1, "CPF", 2, "Gas Train-1", "pending", 2),
  du(6, "F. Hadi", 1, "CPF", 2, "Gas Train-1", "pending"),
  du(7, "T. Noor", 1, "CPF", 2, "Gas Train-1", "confirmed"),
  du(8, "Y. Said", 2, "Camp", 3, "Camp", "confirmed"),
  du(9, "N. Aziz", 2, "Camp", 3, "Camp", "pending"),
];
