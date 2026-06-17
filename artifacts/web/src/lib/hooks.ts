import { useQuery } from "@tanstack/react-query";
import { listEntity } from "@/lib/api";
import type {
  UserDto,
  ZoneDto,
  LocationDto,
  StreetDto,
  EcoRouteDto,
  AlertDto,
  ShelterDto,
  PersonnelLocationDto,
  HazardZoneDto,
  IncidentEventDto,
  AppSettings,
} from "@workspace/keas-core";

// Server-state hooks (the web's source of truth). Polling cadence is the v1
// realtime story; WebSocket/SSE arrives in production hardening (3.8).
const REFETCH = 8_000;

function entityQuery<T>(entity: string) {
  return useQuery({
    queryKey: ["keas", entity],
    queryFn: () => listEntity<T>(entity),
    refetchInterval: REFETCH,
  });
}

export const useUsers = () => entityQuery<UserDto>("users");
export const useZones = () => entityQuery<ZoneDto>("zones");
export const useLocations = () => entityQuery<LocationDto>("locations");
export const useStreets = () => entityQuery<StreetDto>("streets");
export const useRoutes = () => entityQuery<EcoRouteDto>("routes");
export const useAlerts = () => entityQuery<AlertDto>("alerts");
export const useShelters = () => entityQuery<ShelterDto>("shelters");
export const usePersonnel = () => entityQuery<PersonnelLocationDto>("personnel");
export const useHazardZones = () => entityQuery<HazardZoneDto>("hazardZones");
export const useIncidentEvents = () => entityQuery<IncidentEventDto>("incidentEvents");

// Settings is a SINGLETON wrapped row { id:1, data:<AppSettings>, updatedAt } —
// unwrap records[0].data. Read-only; mobile is the sole author.
export const useSettings = () =>
  useQuery({
    queryKey: ["keas", "settings"],
    queryFn: async () => {
      const rows = await listEntity<{ id: number; data: AppSettings; updatedAt: string }>("settings");
      return rows[0]?.data ?? null;
    },
    refetchInterval: REFETCH,
  });
