import React, { useMemo, useRef, useEffect, useCallback } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";

import { Colors } from "@/constants/theme";
import type { ZoneMapProps } from "./types";
import { zoneToPolygon, zonesToRegion } from "./types";

export function GoogleMapsView({
  zones,
  selectedZoneId,
  onZonePress,
  height,
  showLabels = true,
}: ZoneMapProps) {
  const mapRef = useRef<MapView>(null);

  const region = useMemo(() => zonesToRegion(zones), [zones]);

  const polygons = useMemo(
    () => zones.map((z) => zoneToPolygon(z, selectedZoneId)),
    [zones, selectedZoneId]
  );

  useEffect(() => {
    if (mapRef.current && zones.length > 0) {
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
  }, [zones]);

  const handlePolygonPress = useCallback(
    (zoneId: number) => {
      onZonePress(zoneId);
    },
    [onZonePress]
  );

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        mapType="standard"
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        customMapStyle={darkMapStyle}
      >
        {polygons.map((poly) => (
          <React.Fragment key={poly.id}>
            {poly.coordinates.length > 0 && (
              <Polygon
                coordinates={poly.coordinates.map((c) => ({
                  latitude: c.lat,
                  longitude: c.lng,
                }))}
                strokeColor={poly.isActive ? poly.color : "#6B7280"}
                fillColor={
                  poly.isSelected
                    ? poly.color + "59"
                    : poly.isActive
                    ? poly.color + "33"
                    : poly.color + "14"
                }
                strokeWidth={poly.isSelected ? 3 : 2}
                tappable
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
                anchor={{ x: 0.5, y: 0.5 }}
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
        ))}
      </MapView>
    </View>
  );
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "land",
    elementType: "geometry",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  labelText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
});
