/**
 * ──────────────────────────────────────────────────────────────────────────────
 * TEMPORARY FALLBACK — Web Preview Only
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * This component renders a Leaflet map via iframe for the Expo web preview
 * environment where react-native-maps (Google Maps) cannot render.
 *
 * This is NOT the final map implementation. It exists solely so the web
 * preview remains usable during development.
 *
 * FINAL TARGET: Google Maps via react-native-maps (see GoogleMapsView.tsx)
 *
 * This file will be removed once the project ships on native iOS/Android
 * where Google Maps renders natively.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import type { ZoneMapProps } from "./types";
import type { Zone } from "@/types";

function generateLeafletHtml(zones: Zone[], selectedZoneId: number | null): string {
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

      const labelCoord = z.center
        ? `${z.center.lat}, ${z.center.lng}`
        : `${z.polygonPoints[0].lat}, ${z.polygonPoints[0].lng}`;

      return `
        var poly${z.id} = L.polygon([${coords}], {
          color: '${color}', fillColor: '${z.color}',
          fillOpacity: ${fillOpacity}, weight: ${weight},
          ${dashArray ? `dashArray: '${dashArray}',` : ""}
        }).addTo(map);
        poly${z.id}.on('click', function() {
          window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
        });
        L.marker([${labelCoord}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div style="background:${z.color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.4);${!z.isActive ? "opacity:0.5;" : ""}">${z.name}</div>',
            iconAnchor: [30, 10],
          })
        }).addTo(map);`;
    })
    .join("\n");

  const circleMarkers = zones
    .filter((z) => z.polygonPoints.length === 0 && z.center)
    .map((z) => {
      const isSelected = z.id === selectedZoneId;
      return `
        L.circleMarker([${z.center!.lat}, ${z.center!.lng}], {
          radius: ${isSelected ? 14 : 10}, color: '${z.color}',
          fillColor: '${z.color}', fillOpacity: ${isSelected ? 0.5 : 0.3},
          weight: ${isSelected ? 3 : 2},
        }).addTo(map).on('click', function() {
          window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
        });
        L.marker([${z.center!.lat}, ${z.center!.lng}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div style="background:${z.color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.4);">${z.name}</div>',
            iconAnchor: [30, -12],
          })
        }).addTo(map);`;
    })
    .join("\n");

  const fitBoundsCode = (() => {
    const polyZones = zones.filter((z) => z.polygonPoints.length > 0);
    const centerZones = zones.filter((z) => z.polygonPoints.length === 0 && z.center);
    const parts = [
      ...polyZones.map(
        (z) => `allBounds.push([${z.polygonPoints.map((p) => `[${p.lat},${p.lng}]`).join(",")}]);`
      ),
      ...centerZones.map(
        (z) => `allBounds.push([[${z.center!.lat},${z.center!.lng}]]);`
      ),
    ];
    return parts.join("\n");
  })();

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%}
  .zone-label{background:none!important;border:none!important}
  .leaflet-control-zoom a{background:#171B24!important;color:#F0F1F3!important;border-color:#2A2F3C!important;width:34px!important;height:34px!important;line-height:34px!important;font-size:16px!important}
  .leaflet-control-zoom{border:1px solid #2A2F3C!important;border-radius:10px!important;overflow:hidden}
</style></head><body>
<div id="map"></div>
<script>
  var map=L.map('map',{center:[${centerLat},${centerLng}],zoom:13,zoomControl:true,attributionControl:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
  ${zonePolygons}
  ${circleMarkers}
  setTimeout(function(){
    var allBounds=[];
    ${fitBoundsCode}
    if(allBounds.length>0){var flat=allBounds.flat();if(flat.length>1)map.fitBounds(flat,{padding:[30,30]})}
  },200);
<\/script></body></html>`;
}

export function LeafletPreviewFallback({
  zones,
  selectedZoneId,
  onZonePress,
  height,
}: ZoneMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const mapHtml = useMemo(
    () => generateLeafletHtml(zones, selectedZoneId),
    [zones, selectedZoneId]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "zone_select" && typeof data.id === "number") {
          onZonePress(data.id);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onZonePress]);

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        ref={(el: any) => {
          iframeRef.current = el;
        }}
        srcDoc={mapHtml}
        style={{ width: "100%", height: "100%", border: "none" }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#0F1117",
  },
});
