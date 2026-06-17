// Demo geometry — rendered ONLY when the backend returns no data, so the Live
// Map is never blank in a fresh/offline environment. Centered on the Khurais
// CPF area to match the mobile seed. Real backend data always takes precedence.
import type {
  ZoneDto,
  PersonnelLocationDto,
  ShelterDto,
  HazardZoneDto,
  StreetDto,
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
];

export const DEMO_ROUTE_STREET_IDS = new Set<string>(["s1"]);

export const DEMO_CENTER = C;
