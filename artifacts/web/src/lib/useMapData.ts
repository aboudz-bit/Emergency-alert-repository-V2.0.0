import { useMemo } from "react";
import type {
  ZoneDto, LocationDto, ShelterDto, StreetDto, HazardZoneDto, UserDto,
} from "@workspace/keas-core";
import {
  useZones, useLocations, usePersonnel, useShelters, useStreets,
  useRoutes, useHazardZones, useUsers,
} from "@/lib/hooks";
import type { PersonnelOnMap } from "@/components/map/LiveMapView";
import {
  DEMO_ZONES, DEMO_LOCATIONS, DEMO_USERS, DEMO_PERSONNEL, DEMO_SHELTERS,
  DEMO_HAZARDS, DEMO_STREETS, DEMO_ROUTE_STREET_IDS,
} from "@/lib/demoMap";

export interface MapData {
  live: boolean;
  users: UserDto[];
  zones: ZoneDto[];
  locations: LocationDto[];
  personnel: PersonnelOnMap[];
  shelters: ShelterDto[];
  streets: StreetDto[];
  hazards: HazardZoneDto[];
  routeStreetIds: Set<string>;
}

// Single source of truth for the operational data both the Live Map and the
// Dashboard render. Uses live backend data; falls back to demo geometry/roster
// only when the backend is empty (silent — mirrors the mobile demo/simulation
// path). Personnel positions are joined to the user roster for status/name.
export function useMapData(): MapData {
  const zonesQ = useZones();
  const locationsQ = useLocations();
  const personnelQ = usePersonnel();
  const sheltersQ = useShelters();
  const streetsQ = useStreets();
  const routesQ = useRoutes();
  const hazardsQ = useHazardZones();
  const usersQ = useUsers();

  const live =
    (zonesQ.data?.length ?? 0) > 0 ||
    (personnelQ.data?.length ?? 0) > 0 ||
    (sheltersQ.data?.length ?? 0) > 0 ||
    (hazardsQ.data?.length ?? 0) > 0 ||
    (streetsQ.data?.length ?? 0) > 0;

  const users = live ? (usersQ.data?.length ? usersQ.data : []) : DEMO_USERS;
  const zones = live ? (zonesQ.data ?? []) : DEMO_ZONES;
  const locations = live ? (locationsQ.data ?? []) : DEMO_LOCATIONS;
  const shelters = live ? (sheltersQ.data ?? []) : DEMO_SHELTERS;
  const streets = live ? (streetsQ.data ?? []) : DEMO_STREETS;
  const hazards = live ? (hazardsQ.data ?? []) : DEMO_HAZARDS;

  const userById = useMemo(() => {
    const m = new Map<number, { name: string; status: string; userType?: string }>();
    users.forEach((u) => m.set(u.id, { name: u.name, status: u.status, userType: u.userType }));
    return m;
  }, [users]);

  const personnel: PersonnelOnMap[] = useMemo(() => {
    if (!live) return DEMO_PERSONNEL;
    return (personnelQ.data ?? []).map((p) => {
      const u = userById.get(p.userId);
      return { ...p, name: u?.name, status: u?.status ?? "pending", userType: u?.userType };
    });
  }, [live, personnelQ.data, userById]);

  const routeStreetIds = useMemo(() => {
    if (!live) return DEMO_ROUTE_STREET_IDS;
    const ids = new Set<string>();
    (routesQ.data ?? [])
      .filter((r) => r.status === "active")
      .forEach((r) => r.streetIds.forEach((id) => ids.add(id)));
    return ids;
  }, [live, routesQ.data]);

  return { live, users, zones, locations, personnel, shelters, streets, hazards, routeStreetIds };
}
