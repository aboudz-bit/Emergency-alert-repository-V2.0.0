import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Circle,
  CircleMarker,
  Tooltip,
  LayerGroup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type {
  ZoneDto,
  LocationDto,
  StreetDto,
  ShelterDto,
  PersonnelLocationDto,
  HazardZoneDto,
} from "@workspace/keas-core";
import {
  TILES,
  zoneFill,
  zoneStroke,
  HAZARD,
  STREET,
  SHELTER_COLOR,
  plumeCone,
  personnelColor,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from "@/lib/mapStyle";

export type PersonnelOnMap = PersonnelLocationDto & {
  name?: string;
  status?: string;
  userType?: string;
};

// A generic selection the details panel can render without DTO-specific code.
export interface Selection {
  kind: "Zone" | "Location" | "Personnel" | "Shelter" | "Hazard";
  key: string;
  title: string;
  tone?: "safe" | "pending" | "help" | "danger" | "default";
  rows: Array<{ label: string; value: string }>;
}

export interface LayerVisibility {
  zones: boolean;
  locations: boolean;
  personnel: boolean;
  shelters: boolean;
  streets: boolean;
  routes: boolean;
  hazards: boolean;
}

interface LiveMapViewProps {
  zones: ZoneDto[];
  locations: LocationDto[];
  personnel: PersonnelOnMap[];
  shelters: ShelterDto[];
  streets: StreetDto[];
  routeStreetIds: Set<string>;
  hazards: HazardZoneDto[];
  visible: LayerVisibility;
  selectedKey: string | null;
  onSelect: (sel: Selection | null) => void;
}

type LL = [number, number];
const toLL = (p: { lat: number; lng: number }): LL => [p.lat, p.lng];

// Fit the map to all rendered geometry once, the first time data arrives.
function FitBounds({ points }: { points: LL[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 15);
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40] });
    }
    done.current = true;
  }, [map, points]);
  return null;
}

export function LiveMapView({
  zones,
  locations,
  personnel,
  shelters,
  streets,
  routeStreetIds,
  hazards,
  visible,
  selectedKey,
  onSelect,
}: LiveMapViewProps) {
  const allPoints = useMemo<LL[]>(() => {
    const pts: LL[] = [];
    zones.forEach((z) => z.polygonPoints?.forEach((p) => pts.push(toLL(p))));
    locations.forEach((l) => l.polygonPoints?.forEach((p) => pts.push(toLL(p))));
    personnel.forEach((p) => pts.push([p.lat, p.lng]));
    shelters.forEach((s) => pts.push([s.lat, s.lng]));
    hazards.forEach((h) => pts.push([h.centerLat, h.centerLng]));
    return pts;
  }, [zones, locations, personnel, shelters, hazards]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: "100%", width: "100%", background: "#0b0f14" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url={TILES.satellite} maxZoom={19} />
      <TileLayer url={TILES.labels} maxZoom={19} />
      <FitBounds points={allPoints} />

      {/* ── Zones ── */}
      {visible.zones && (
        <LayerGroup>
          {zones
            .filter((z) => !z.isArchived && (z.polygonPoints?.length ?? 0) > 2)
            .map((z) => {
              const sel = selectedKey === `Zone:${z.id}`;
              return (
                <Polygon
                  key={`zone-${z.id}`}
                  positions={z.polygonPoints.map(toLL)}
                  pathOptions={{
                    color: zoneStroke(z.color, z.isActive),
                    weight: sel ? 3 : 2,
                    fillColor: z.color,
                    fillOpacity: sel ? 0.35 : z.alertActive ? 0.2 : 0.08,
                  }}
                  eventHandlers={{
                    click: () =>
                      onSelect({
                        kind: "Zone",
                        key: `Zone:${z.id}`,
                        title: z.name,
                        tone: z.alertActive ? "danger" : "default",
                        rows: [
                          { label: "Type", value: z.type },
                          { label: "Alert", value: z.alertActive ? `${z.alertType ?? "active"} · ${z.alertPriority ?? ""}` : "—" },
                          { label: "Scope", value: z.alertTargetScope === "locations" ? `${z.alertTargetLocationIds.length} location(s)` : "Whole zone" },
                          { label: "Status", value: z.isActive ? "Active" : "Inactive" },
                        ],
                      }),
                  }}
                >
                  <Tooltip permanent direction="center" className="keas-zone-label">
                    {z.name}
                  </Tooltip>
                </Polygon>
              );
            })}
        </LayerGroup>
      )}

      {/* ── Locations (location-scoped alert indicators highlight when alertActive) ── */}
      {visible.locations && (
        <LayerGroup>
          {locations
            .filter((l) => (l.polygonPoints?.length ?? 0) > 2)
            .map((l) => {
              const sel = selectedKey === `Location:${l.id}`;
              const color = l.alertActive ? "#DC2626" : "#5B3A8E";
              return (
                <Polygon
                  key={`loc-${l.id}`}
                  positions={l.polygonPoints.map(toLL)}
                  pathOptions={{
                    color,
                    weight: l.alertActive ? 2 : 1,
                    dashArray: l.alertActive ? undefined : "4 4",
                    fillColor: color,
                    fillOpacity: sel ? 0.3 : l.alertActive ? 0.18 : 0.05,
                  }}
                  eventHandlers={{
                    click: () =>
                      onSelect({
                        kind: "Location",
                        key: `Location:${l.id}`,
                        title: l.name,
                        tone: l.alertActive ? "danger" : "default",
                        rows: [
                          { label: "Zone", value: l.zone || "—" },
                          { label: "Expected", value: String(l.expectedManpower) },
                          { label: "Alert", value: l.alertActive ? `${l.alertType ?? "active"} · ${l.alertPriority ?? ""}` : "—" },
                        ],
                      }),
                  }}
                />
              );
            })}
        </LayerGroup>
      )}

      {/* ── Streets + ECO route highlight ── */}
      {(visible.streets || visible.routes) && (
        <LayerGroup>
          {streets
            .filter((st) => (st.path?.length ?? 0) >= 2)
            .map((st) => {
              const isRoute = routeStreetIds.has(st.id);
              if (isRoute && !visible.routes) return visible.streets ? null : null;
              if (!isRoute && !visible.streets) return null;
              const useRouteStyle = isRoute && visible.routes;
              return (
                <Polyline
                  key={`st-${st.id}`}
                  positions={st.path.map(toLL)}
                  pathOptions={{
                    color: useRouteStyle ? STREET.route : STREET.normal,
                    weight: useRouteStyle ? 6 : 4,
                  }}
                />
              );
            })}
        </LayerGroup>
      )}

      {/* ── Hazard rings (cold > warm > hot) + downwind plume ── */}
      {visible.hazards && (
        <LayerGroup>
          {hazards
            .filter((h) => h.isActive !== false)
            .map((h) => {
              const center: LL = [h.centerLat, h.centerLng];
              const select = () =>
                onSelect({
                  kind: "Hazard",
                  key: `Hazard:${h.id}`,
                  title: `Hazard · ${h.warningLevel}`,
                  tone: "help",
                  rows: [
                    { label: "Shape", value: h.hazardShape ?? "circle" },
                    { label: "Hot", value: `${Math.round(h.hotRadius)} m` },
                    { label: "Warm", value: `${Math.round(h.warmRadius)} m` },
                    { label: "Cold", value: `${Math.round(h.coldRadius)} m` },
                    { label: "Wind", value: h.windDirectionDeg != null ? `${Math.round(h.windDirectionDeg)}°` : "—" },
                  ],
                });
              return (
                <LayerGroup key={`hz-${h.id}`}>
                  {h.hazardShape === "plume" && h.windDirectionDeg != null && (
                    <Polygon
                      positions={plumeCone(h)}
                      pathOptions={{ color: HAZARD.plume.stroke, weight: 1.5, fillColor: HAZARD.plume.fill, fillOpacity: HAZARD.plume.fillOpacity }}
                      eventHandlers={{ click: select }}
                    />
                  )}
                  <Circle center={center} radius={h.coldRadius} pathOptions={{ color: HAZARD.cold.stroke, weight: 1.5, fillColor: HAZARD.cold.fill, fillOpacity: HAZARD.cold.fillOpacity }} eventHandlers={{ click: select }} />
                  <Circle center={center} radius={h.warmRadius} pathOptions={{ color: HAZARD.warm.stroke, weight: 1.5, fillColor: HAZARD.warm.fill, fillOpacity: HAZARD.warm.fillOpacity }} eventHandlers={{ click: select }} />
                  <Circle center={center} radius={h.hotRadius} pathOptions={{ color: HAZARD.hot.stroke, weight: 2, fillColor: HAZARD.hot.fill, fillOpacity: HAZARD.hot.fillOpacity }} eventHandlers={{ click: select }} />
                </LayerGroup>
              );
            })}
        </LayerGroup>
      )}

      {/* ── Shelters ── */}
      {visible.shelters && (
        <LayerGroup>
          {shelters
            .filter((s) => s.isActive !== false)
            .map((s) => (
              <CircleMarker
                key={`sh-${s.id}`}
                center={[s.lat, s.lng]}
                radius={7}
                pathOptions={{ color: "#ffffff", weight: 2, fillColor: SHELTER_COLOR, fillOpacity: 1 }}
                eventHandlers={{
                  click: () =>
                    onSelect({
                      kind: "Shelter",
                      key: `Shelter:${s.id}`,
                      title: s.name,
                      tone: "default",
                      rows: [
                        { label: "Linked locations", value: String(s.linkedLocationIds?.length ?? 0) },
                        { label: "Coordinates", value: `${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}` },
                      ],
                    }),
                }}
              >
                <Tooltip direction="top">{s.name}</Tooltip>
              </CircleMarker>
            ))}
        </LayerGroup>
      )}

      {/* ── Personnel (status-colored, mobile palette) ── */}
      {visible.personnel && (
        <LayerGroup>
          {personnel.map((p) => {
            const color = personnelColor(p.status ?? "pending");
            const critical = p.status === "need_help";
            return (
              <CircleMarker
                key={`pp-${p.userId}`}
                center={[p.lat, p.lng]}
                radius={critical ? 7 : 5}
                pathOptions={{ color: "#ffffff", weight: critical ? 2 : 1, fillColor: color, fillOpacity: 1 }}
                eventHandlers={{
                  click: () =>
                    onSelect({
                      kind: "Personnel",
                      key: `Personnel:${p.userId}`,
                      title: p.name ?? `User #${p.userId}`,
                      tone: p.status === "confirmed" ? "safe" : p.status === "need_help" ? "help" : "pending",
                      rows: [
                        { label: "Status", value: statusLabel(p.status) },
                        { label: "Type", value: p.userType ?? "—" },
                        { label: "Coordinates", value: `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}` },
                      ],
                    }),
                }}
              />
            );
          })}
        </LayerGroup>
      )}
    </MapContainer>
  );
}

// Operational terminology — identical to the mobile status labels.
export function statusLabel(status?: string): string {
  if (status === "confirmed") return "Safe";
  if (status === "need_help") return "Need help";
  return "Pending";
}
