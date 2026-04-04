import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

import type { ZoneMapProps } from "./types";
import { zoneToPolygon, zonesToRegion } from "./types";

export function GoogleMapsView({
  zones,
  selectedZoneId,
  onZonePress,
  height,
  showLabels = true,
  editingZoneId,
  editingPoints,
  onEditingPointsChange,
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
});
