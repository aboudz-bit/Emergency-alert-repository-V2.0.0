import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { WebView } from "react-native-webview";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone } from "@/types";

const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAP_HEIGHT = SCREEN_HEIGHT * 0.45;

function generateMapHtml(zones: Zone[], selectedZoneId: number | null): string {
  const allPoints = zones.flatMap((z) => z.polygonPoints);
  let centerLat = 25.082;
  let centerLng = 48.175;
  if (allPoints.length > 0) {
    centerLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
    centerLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;
  }

  const zonePolygons = zones
    .filter((z) => z.polygonPoints.length > 0)
    .map((z) => {
      const isSelected = z.id === selectedZoneId;
      const coords = z.polygonPoints.map((p) => `[${p.lat}, ${p.lng}]`).join(",");
      const fillOpacity = isSelected ? 0.35 : z.isActive ? 0.2 : 0.08;
      const weight = isSelected ? 3 : 2;
      const dashArray = z.isActive ? "" : "5,5";
      const color = z.isActive ? z.color : "#6B7280";

      return `
        var poly${z.id} = L.polygon([${coords}], {
          color: '${color}',
          fillColor: '${z.color}',
          fillOpacity: ${fillOpacity},
          weight: ${weight},
          ${dashArray ? `dashArray: '${dashArray}',` : ""}
        }).addTo(map);
        poly${z.id}.on('click', function() {
          window.ReactNativeWebView.postMessage(JSON.stringify({type:'select', id:${z.id}}));
        });
        ${z.center ? `
        L.marker([${z.center.lat}, ${z.center.lng}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div style="background:${z.color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.4);${!z.isActive ? "opacity:0.5;" : ""}">${z.name}</div>',
            iconAnchor: [30, 10],
          })
        }).addTo(map);` : ""}
      `;
    })
    .join("\n");

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .zone-label { background:none !important; border:none !important; }
  .leaflet-control-zoom a {
    background: #171B24 !important; color: #F0F1F3 !important;
    border-color: #2A2F3C !important; width: 34px !important; height: 34px !important;
    line-height: 34px !important; font-size: 16px !important;
  }
  .leaflet-control-zoom { border: 1px solid #2A2F3C !important; border-radius: 10px !important; overflow: hidden; }
</style></head><body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    center: [${centerLat}, ${centerLng}],
    zoom: 13,
    zoomControl: true,
    attributionControl: false,
  });
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(map);
  ${zonePolygons}
  setTimeout(function(){
    var allBounds = [];
    ${zones.filter(z => z.polygonPoints.length > 0).map(z =>
      `allBounds.push([${z.polygonPoints.map(p => `[${p.lat},${p.lng}]`).join(",")}]);`
    ).join("\n")}
    if(allBounds.length > 0) {
      var flat = allBounds.flat();
      map.fitBounds(flat, {padding:[30,30]});
    }
  }, 200);
</script></body></html>`;
}

export default function ZonesScreen() {
  const zones = useStore((s) => s.zones);
  const updateZone = useStore((s) => s.updateZone);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const webViewRef = useRef<WebView>(null);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const mapHtml = useMemo(
    () => generateMapHtml(zones, selectedZoneId),
    [zones, selectedZoneId]
  );

  const handleToggleZone = useCallback(
    (zone: Zone) => {
      updateZone(zone.id, { isActive: !zone.isActive });
    },
    [updateZone]
  );

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "select") {
          setSelectedZoneId((prev) => (prev === data.id ? null : data.id));
        }
      } catch {}
    },
    []
  );

  const handleEditZone = useCallback(() => {
    Alert.alert(
      "Desktop Required",
      "Zone boundary editing with polygon drawing tools is available in the web admin panel. You can toggle zone status and view zone details from mobile.",
      [{ text: "OK" }]
    );
  }, []);

  const handleAddZone = useCallback(() => {
    Alert.alert(
      "Desktop Required",
      "Zone creation with boundary drawing is available in the web admin panel.",
      [{ text: "OK" }]
    );
  }, []);

  const renderZoneChip = ({ item }: { item: Zone }) => {
    const isSelected = item.id === selectedZoneId;
    return (
      <Pressable
        style={[
          styles.zoneChip,
          isSelected && { borderColor: item.color, backgroundColor: item.color + "20" },
          !item.isActive && styles.zoneChipInactive,
        ]}
        onPress={() => setSelectedZoneId(isSelected ? null : item.id)}
      >
        <View style={[styles.zoneChipDot, { backgroundColor: item.isActive ? item.color : Colors.textTertiary }]} />
        <Text
          style={[
            styles.zoneChipText,
            isSelected && { color: item.color },
            !item.isActive && { color: Colors.textTertiary },
          ]}
        >
          {item.name}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Zone Map"
        showBack
        rightAction={
          <Pressable style={styles.addBtn} onPress={handleAddZone} hitSlop={8}>
            <Feather name="plus" size={20} color={Colors.text} />
          </Pressable>
        }
      />

      <View style={styles.mapContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.mapFallback}>
            <Feather name="map" size={48} color={Colors.textSecondary} />
            <Text style={styles.mapFallbackText}>Map view requires native device</Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ html: mapHtml }}
            style={styles.mapWebView}
            onMessage={handleWebViewMessage}
            scrollEnabled={false}
            javaScriptEnabled
            originWhitelist={["*"]}
          />
        )}

        <View style={styles.zoneChipBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.zoneChipBarContent}
          >
            {zones.map((z) => (
              <React.Fragment key={z.id}>{renderZoneChip({ item: z })}</React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>

      {selectedZone ? (
        <View style={styles.detailPanel}>
          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderLeft}>
                <View style={[styles.colorBar, { backgroundColor: selectedZone.color }]} />
                <View style={styles.detailNameWrap}>
                  <Text style={styles.detailName}>{selectedZone.name}</Text>
                  <Text style={styles.detailType}>{selectedZone.type} Zone · {selectedZone.boundaryType}</Text>
                </View>
              </View>
              <StatusBadge status={selectedZone.isActive ? "enabled" : "disabled"} />
            </View>

            <View style={styles.detailStats}>
              <View style={styles.detailStatItem}>
                <Feather name="map-pin" size={14} color={Colors.textSecondary} />
                <Text style={styles.detailStatText}>
                  {selectedZone.polygonPoints.length} boundary points
                </Text>
              </View>
              {selectedZone.center && (
                <View style={styles.detailStatItem}>
                  <Feather name="crosshair" size={14} color={Colors.textSecondary} />
                  <Text style={styles.detailStatText}>
                    {selectedZone.center.lat.toFixed(4)}, {selectedZone.center.lng.toFixed(4)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailActions}>
              <Button
                title={selectedZone.isActive ? "Disable" : "Enable"}
                onPress={() => handleToggleZone(selectedZone)}
                variant={selectedZone.isActive ? "ghost" : "safe"}
                icon={selectedZone.isActive ? "eye-off" : "eye"}
                size="md"
                style={{ flex: 1 }}
              />
              <Button
                title="Edit on Web"
                onPress={handleEditZone}
                variant="secondary"
                icon="external-link"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      ) : (
        <View style={styles.detailPanel}>
          <View style={styles.hintRow}>
            <Feather name="info" size={14} color={Colors.textTertiary} />
            <Text style={styles.hintText}>Tap a zone on the map or above to view details</Text>
          </View>

          <FlatList
            data={zones}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.zoneListItem, pressed && styles.pressed]}
                onPress={() => setSelectedZoneId(item.id)}
              >
                <View style={[styles.listColorBar, { backgroundColor: item.color }]} />
                <View style={styles.zoneListInfo}>
                  <Text style={styles.zoneListName}>{item.name}</Text>
                  <Text style={styles.zoneListMeta}>
                    {item.type} · {item.polygonPoints.length} pts
                  </Text>
                </View>
                <StatusBadge status={item.isActive ? "enabled" : "disabled"} />
              </Pressable>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: "relative",
  },
  mapWebView: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapFallback: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
  },
  mapFallbackText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  zoneChipBar: {
    position: "absolute",
    bottom: Spacing.md,
    left: 0,
    right: 0,
  },
  zoneChipBarContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface + "E6",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneChipInactive: {
    opacity: 0.6,
  },
  zoneChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  detailPanel: {
    flex: 1,
  },
  detailCard: {
    margin: Spacing.lg,
    gap: Spacing.md,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  colorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  detailNameWrap: {
    gap: 2,
  },
  detailName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  detailType: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  detailStats: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailStatText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  detailActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  hintText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
  zoneListItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listColorBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  zoneListInfo: {
    flex: 1,
    gap: 2,
  },
  zoneListName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  zoneListMeta: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
});
