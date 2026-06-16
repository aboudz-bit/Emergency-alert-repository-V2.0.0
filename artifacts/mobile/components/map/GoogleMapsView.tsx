import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, Polyline, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { Feather } from "@expo/vector-icons";

import type { ZoneMapProps } from "./types";
import type { HazardZone } from "@/types";
import { zoneToPolygon, zonesToRegion } from "./types";
import { plumeWedgePoints } from "@/utils/geo";

// Personnel status -> dot color (mirrors the web Leaflet preview).
function personnelColor(status: string): string {
  if (status === "confirmed") return "#34D399"; // safe
  if (status === "need_help") return "#EF4444"; // need help
  return "#FBBF24"; // pending / outside
}

// Offset a lat/lng by a distance (m) along a compass bearing (deg, clockwise from north).
function offsetLatLng(lat: number, lng: number, distM: number, bearingDeg: number) {
  const b = (bearingDeg * Math.PI) / 180;
  const dLat = (distM * Math.cos(b)) / 111320;
  const dLng = (distM * Math.sin(b)) / (111320 * Math.cos((lat * Math.PI) / 180));
  return { latitude: lat + dLat, longitude: lng + dLng };
}

// Downwind plume cone (only used when a hazard zone is shaped 'plume').
function plumeCone(hz: HazardZone): { latitude: number; longitude: number }[] {
  const dir = hz.windDirectionDeg ?? 0;
  const r = hz.coldRadius || hz.warmRadius || hz.hotRadius || 300;
  const half = 30;
  const pts = [{ latitude: hz.centerLat, longitude: hz.centerLng }];
  for (let a = -half; a <= half; a += 10) {
    pts.push(offsetLatLng(hz.centerLat, hz.centerLng, r, dir + a));
  }
  return pts;
}

export function GoogleMapsView({
  zones,
  selectedZoneId,
  onZonePress,
  height,
  showLabels = true,
  editingZoneId,
  editingPoints,
  onEditingPointsChange,
  shelters,
  selectedShelterId,
  onShelterPress,
  nearestShelterId,
  personnelLocations,
  onPersonnelPress,
  hazardZones,
  trackedUserIds,
  fitTrackedTrigger,
  streets,
  selectedStreetId,
  onStreetPress,
  editingStreetId,
  editingStreetPoints,
  onEditingStreetPointsChange,
  routeStreetIds,
}: ZoneMapProps) {
  const mapRef = useRef<MapView>(null);
  const isEditing = editingZoneId != null;

  const region = useMemo(() => zonesToRegion(zones), [zones]);

  const polygons = useMemo(
    () => zones.map((z) => zoneToPolygon(z, selectedZoneId)),
    [zones, selectedZoneId]
  );

  const editZone = useMemo(
    () => (editingZoneId != null ? zones.find((z) => z.id === editingZoneId) : null),
    [zones, editingZoneId]
  );

  const activeHazards = useMemo(
    () => (hazardZones ?? []).filter((hz) => hz.isActive),
    [hazardZones]
  );
  const trackedSet = useMemo(() => new Set(trackedUserIds ?? []), [trackedUserIds]);
  const routeSet = useMemo(() => new Set(routeStreetIds ?? []), [routeStreetIds]);

  useEffect(() => {
    if (mapRef.current && zones.length > 0 && !isEditing) {
      const allPoints = zones.flatMap((z) =>
        z.polygonPoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))
      );
      const centers = zones
        .filter((z) => z.center && z.polygonPoints.length === 0)
        .map((z) => ({ latitude: z.center!.lat, longitude: z.center!.lng }));
      const fitPoints = [...allPoints, ...centers];
      if (fitPoints.length > 1) {
        mapRef.current.fitToCoordinates(fitPoints, {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        });
      }
    }
  }, [zones, isEditing]);

  // Focus the map on tracked personnel when the SmartAlertPanel requests it.
  useEffect(() => {
    if (!fitTrackedTrigger || !mapRef.current) return;
    const coords = (personnelLocations ?? [])
      .filter((p) => trackedSet.has(p.userId))
      .map((p) => ({ latitude: p.lat, longitude: p.lng }));
    if (coords.length === 1) {
      mapRef.current.animateCamera({ center: coords[0], zoom: 16 }, { duration: 500 });
    } else if (coords.length > 1) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    }
  }, [fitTrackedTrigger]);

  const handlePolygonPress = useCallback(
    (zoneId: number) => {
      if (!isEditing) onZonePress(zoneId);
    },
    [onZonePress, isEditing]
  );

  const handleVertexDrag = useCallback(
    (index: number, lat: number, lng: number) => {
      if (!editingPoints || !onEditingPointsChange) return;
      const updated = [...editingPoints];
      updated[index] = { lat, lng };
      onEditingPointsChange(updated);
    },
    [editingPoints, onEditingPointsChange]
  );

  const handleStreetVertexDrag = useCallback(
    (index: number, lat: number, lng: number) => {
      if (!editingStreetPoints || !onEditingStreetPointsChange) return;
      const updated = [...editingStreetPoints];
      updated[index] = { lat, lng };
      onEditingStreetPointsChange(updated);
    },
    [editingStreetPoints, onEditingStreetPointsChange]
  );

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        mapType="standard"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        {...(Platform.OS === "android" ? { customMapStyle: lightMapStyle } : {})}
      >
        {polygons.map((poly) => {
          if (isEditing && poly.id === editingZoneId) return null;
          const dimmed = isEditing;
          return (
            <React.Fragment key={poly.id}>
              {poly.coordinates.length > 0 && (
                <Polygon
                  coordinates={poly.coordinates.map((c) => ({
                    latitude: c.lat,
                    longitude: c.lng,
                  }))}
                  strokeColor={poly.isActive ? poly.color : "#6B7280"}
                  fillColor={
                    dimmed
                      ? poly.color + "14"
                      : poly.isSelected
                      ? poly.color + "59"
                      : poly.isActive
                      ? poly.color + "33"
                      : poly.color + "14"
                  }
                  strokeWidth={poly.isSelected ? 3 : 2}
                  tappable={!isEditing}
                  onPress={() => handlePolygonPress(poly.id)}
                />
              )}
              {showLabels && poly.center && (
                <Marker
                  coordinate={{
                    latitude: poly.center.lat,
                    longitude: poly.center.lng,
                  }}
                  onPress={() => handlePolygonPress(poly.id)}
                  anchor={{ x: 0.5, y: 1.0 }}
                  tracksViewChanges={false}
                >
                  <View
                    style={[
                      styles.label,
                      {
                        backgroundColor: poly.color,
                        opacity: poly.isActive ? 1 : 0.5,
                      },
                    ]}
                  >
                    <Text style={styles.labelText}>{poly.name}</Text>
                  </View>
                </Marker>
              )}
            </React.Fragment>
          );
        })}

        {/* ── Hazard rings (cold > warm > hot) + optional downwind plume ── */}
        {activeHazards.map((hz) => {
          const center = { latitude: hz.centerLat, longitude: hz.centerLng };
          return (
            <React.Fragment key={`hz-${hz.id}`}>
              {hz.hazardShape === "plume" && hz.windDirectionDeg != null && (
                <Polygon
                  coordinates={plumeCone(hz)}
                  strokeColor="#F87171"
                  fillColor="#F871712E"
                  strokeWidth={1.5}
                />
              )}
              <Circle center={center} radius={hz.coldRadius} strokeColor="#34D399" fillColor="#34D39914" strokeWidth={1.5} />
              <Circle center={center} radius={hz.warmRadius} strokeColor="#FBBF24" fillColor="#FBBF241F" strokeWidth={1.5} />
              <Circle center={center} radius={hz.hotRadius} strokeColor="#F87171" fillColor="#F871712E" strokeWidth={2} />
            </React.Fragment>
          );
        })}

        {/* ── Streets + ECO route highlight ── */}
        {(streets ?? []).map((st) => {
          if (st.path.length < 2) return null;
          const isRoute = routeSet.has(st.id);
          const isSel = st.id === selectedStreetId;
          const color = isRoute ? "#10B981" : isSel ? "#3B82F6" : "#9CA3AF";
          const weight = isRoute ? 6 : isSel ? 5 : 4;
          return (
            <Polyline
              key={`st-${st.id}-${isRoute ? "r" : isSel ? "s" : "n"}`}
              coordinates={st.path.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor={color}
              strokeWidth={weight}
              tappable={!!onStreetPress}
              onPress={onStreetPress ? () => onStreetPress(st.id) : undefined}
            />
          );
        })}

        {/* ── Street vertex editing (drag existing points) ── */}
        {editingStreetId != null && editingStreetPoints && editingStreetPoints.length > 0 && (
          <>
            <Polyline
              coordinates={editingStreetPoints.map((p) => ({ latitude: p.lat, longitude: p.lng }))}
              strokeColor="#3B82F6"
              strokeWidth={5}
            />
            {editingStreetPoints.map((pt, idx) => (
              <Marker
                key={`street-edit-${idx}`}
                coordinate={{ latitude: pt.lat, longitude: pt.lng }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  handleStreetVertexDrag(idx, latitude, longitude);
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={[styles.vertexMarker, { backgroundColor: "#3B82F6", width: 22, height: 22, borderRadius: 11, borderWidth: 3 }]} />
              </Marker>
            ))}
          </>
        )}

        {/* ── Shelters ── */}
        {(shelters ?? []).map((s) => {
          const isNearest = s.id === nearestShelterId;
          const bg = isNearest ? "#34D399" : "#F59E0B";
          return (
            <Marker
              key={`sh-${s.id}-${isNearest ? "n" : "o"}-${s.id === selectedShelterId ? "s" : ""}`}
              coordinate={{ latitude: s.lat, longitude: s.lng }}
              onPress={onShelterPress ? () => onShelterPress(s.id) : undefined}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View style={[styles.shelterPin, { backgroundColor: bg, borderWidth: s.id === selectedShelterId ? 3 : 2 }]}>
                <Feather name="home" size={13} color="#FFFFFF" />
              </View>
            </Marker>
          );
        })}

        {/* ── Personnel ── */}
        {(personnelLocations ?? []).map((p) => {
          const color = personnelColor(p.status);
          const isContract = p.userType === "Contract";
          const isTracked = trackedSet.has(p.userId);
          const isCritical = p.status === "need_help" || (p.escalationLevel ?? 0) >= 2;
          return (
            <Marker
              key={`pp-${p.userId}-${p.status}-${p.escalationLevel ?? 0}-${isTracked ? "t" : ""}`}
              coordinate={{ latitude: p.lat, longitude: p.lng }}
              onPress={onPersonnelPress ? () => onPersonnelPress(p.userId) : undefined}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={false}
            >
              <View
                style={[
                  styles.personnelDot,
                  {
                    backgroundColor: color,
                    borderRadius: isContract ? 2 : 7,
                    borderColor: isTracked ? "#FFFFFF" : "rgba(255,255,255,0.85)",
                    borderWidth: isTracked ? 3 : 1.5,
                  },
                  isCritical && { shadowColor: "#EF4444", shadowOpacity: 0.8, shadowRadius: 5, elevation: 5 },
                ]}
              />
            </Marker>
          );
        })}

        {isEditing && editingPoints && editingPoints.length > 0 && (
          <>
            <Polygon
              coordinates={editingPoints.map((p) => ({
                latitude: p.lat,
                longitude: p.lng,
              }))}
              strokeColor={editZone?.color || "#3B82F6"}
              fillColor={(editZone?.color || "#3B82F6") + "40"}
              strokeWidth={3}
            />
            {editingPoints.map((pt, idx) => (
              <Marker
                key={`edit-${idx}`}
                coordinate={{ latitude: pt.lat, longitude: pt.lng }}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  handleVertexDrag(idx, latitude, longitude);
                }}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View
                  style={[
                    styles.vertexMarker,
                    { backgroundColor: editZone?.color || "#3B82F6" },
                  ]}
                />
              </Marker>
            ))}
          </>
        )}
      </MapView>
    </View>
  );
}

const lightMapStyle = [
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
];

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  label: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  vertexMarker: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  personnelDot: {
    width: 14,
    height: 14,
  },
  shelterPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
});
