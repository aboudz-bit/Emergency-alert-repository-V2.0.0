/**
 * TEMPORARY FALLBACK — Web Preview Only
 * See GoogleMapsView.tsx for the FINAL native implementation.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import type { ZoneMapProps } from "./types";
import type { Zone, LatLng } from "@/types";

function generateLeafletHtml(
  zones: Zone[],
  selectedZoneId: number | null,
  editingZoneId: number | null | undefined,
  editingPoints: LatLng[] | undefined,
  drawMode: string,
  showLocationButton: boolean
): string {
  const allPoints = zones.flatMap((z) => z.polygonPoints);
  let centerLat = 25.082;
  let centerLng = 48.175;
  if (allPoints.length > 0) {
    centerLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
    centerLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;
  }

  const isEditing = editingZoneId != null;
  const editZone = isEditing ? zones.find((z) => z.id === editingZoneId) : null;
  const isTapMode = drawMode === "tap";

  const zonePolygons = zones
    .filter((z) => z.polygonPoints.length > 0)
    .map((z) => {
      if (isEditing && z.id === editingZoneId) return "";
      const isSelected = z.id === selectedZoneId;
      const coords = z.polygonPoints.map((p) => `[${p.lat}, ${p.lng}]`).join(",");
      const fillOpacity = isEditing ? 0.08 : isSelected ? 0.35 : z.isActive ? 0.2 : 0.08;
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
        ${
          !isEditing
            ? `poly${z.id}.on('click', function() {
          window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
        });`
            : ""
        }
        L.marker([${labelCoord}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div style="background:${z.color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);${!z.isActive ? "opacity:0.5;" : ""}">${z.name}</div>',
            iconAnchor: [30, 10],
          })
        }).addTo(map);`;
    })
    .join("\n");

  const editPolygonCode = (() => {
    if (!isEditing || !editingPoints || editingPoints.length === 0) return "";
    const color = editZone?.color || "#3B82F6";
    const coords = editingPoints.map((p) => `[${p.lat}, ${p.lng}]`).join(",");

    return `
      var editPoly = L.polygon([${coords}], {
        color: '${color}', fillColor: '${color}',
        fillOpacity: 0.25, weight: 3, dashArray: '',
      }).addTo(map);

      var editMarkers = [];
      var editPoints = [${editingPoints.map((p) => `{lat:${p.lat},lng:${p.lng}}`).join(",")}];

      function updateEditPoly() {
        editPoly.setLatLngs(editPoints.map(function(p){return [p.lat,p.lng]}));
        window.parent.postMessage(JSON.stringify({type:'edit_points', points: editPoints}), '*');
      }

      editPoints.forEach(function(pt, idx) {
        var m = L.marker([pt.lat, pt.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'edit-vertex',
            html: '<div style="width:28px;height:28px;border-radius:50%;background:${color};border:4px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:grab;"></div>',
            iconAnchor: [14, 14],
          })
        }).addTo(map);
        m.on('drag', function(e) {
          var ll = e.target.getLatLng();
          editPoints[idx] = {lat: ll.lat, lng: ll.lng};
          updateEditPoly();
        });
        editMarkers.push(m);
      });

      // fit to editing zone
      map.fitBounds(editPoly.getBounds(), {padding: [50, 50]});
    `;
  })();

  const circleMarkers = zones
    .filter((z) => z.polygonPoints.length === 0 && z.center)
    .map((z) => {
      if (isEditing && z.id === editingZoneId) return "";
      const isSelected = z.id === selectedZoneId;
      return `
        L.circleMarker([${z.center!.lat}, ${z.center!.lng}], {
          radius: ${isSelected ? 14 : 10}, color: '${z.color}',
          fillColor: '${z.color}', fillOpacity: ${isSelected ? 0.5 : 0.3},
          weight: ${isSelected ? 3 : 2},
        }).addTo(map)${!isEditing ? `.on('click', function() {
          window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
        })` : ""};
        L.marker([${z.center!.lat}, ${z.center!.lng}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div style="background:${z.color};color:#fff;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);">${z.name}</div>',
            iconAnchor: [30, -12],
          })
        }).addTo(map);`;
    })
    .join("\n");

  const fitBoundsCode = (() => {
    if (isEditing) return "";
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

  const tapModeCode = isTapMode
    ? `
      map.on('click', function(e) {
        window.parent.postMessage(JSON.stringify({type:'map_tap', lat: e.latlng.lat, lng: e.latlng.lng}), '*');
      });
    `
    : "";

  const mapCenterReportCode = `
    function reportCenter() {
      var c = map.getCenter();
      window.parent.postMessage(JSON.stringify({type:'map_center', lat: c.lat, lng: c.lng}), '*');
    }
    map.on('moveend', reportCenter);
    setTimeout(reportCenter, 300);
  `;

  const locationButtonCode = showLocationButton
    ? `
      var locBtn = L.control({position: 'bottomright'});
      locBtn.onAdd = function() {
        var div = L.DomUtil.create('div', 'loc-btn');
        div.innerHTML = '<div style="width:40px;height:40px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.15);cursor:pointer;border:1px solid #ddd;" onclick="doLocate()"><svg width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#3B82F6\\" stroke-width=\\"2\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"12\\" cy=\\"12\\" r=\\"10\\"/><line x1=\\"12\\" y1=\\"8\\" x2=\\"12\\" y2=\\"12\\"/><line x1=\\"12\\" y1=\\"16\\" x2=\\"12.01\\" y2=\\"16\\"/></svg></div>';
        return div;
      };
      locBtn.addTo(map);
      var locMarker = null;
      function doLocate() {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(pos) {
            var lat = pos.coords.latitude;
            var lng = pos.coords.longitude;
            map.setView([lat, lng], 15);
            if (locMarker) map.removeLayer(locMarker);
            locMarker = L.circleMarker([lat, lng], {
              radius: 8, color: '#3B82F6', fillColor: '#3B82F6',
              fillOpacity: 0.8, weight: 3,
            }).addTo(map);
            window.parent.postMessage(JSON.stringify({type:'current_location', lat: lat, lng: lng}), '*');
          }, function() {
            window.parent.postMessage(JSON.stringify({type:'location_error', message: 'Could not get location'}), '*');
          }, {enableHighAccuracy: true, timeout: 10000});
        }
      }
    `
    : "";

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%}
  .zone-label{background:none!important;border:none!important}
  .edit-vertex{background:none!important;border:none!important}
  .loc-btn{background:none!important;border:none!important}
  .leaflet-control-zoom a{background:#fff!important;color:#333!important;border-color:#ddd!important;width:34px!important;height:34px!important;line-height:34px!important;font-size:16px!important}
  .leaflet-control-zoom{border:1px solid #ddd!important;border-radius:10px!important;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)!important}
  ${isTapMode ? `#map{cursor:crosshair!important}` : ""}
</style></head><body>
<div id="map"></div>
<script>
  var map=L.map('map',{center:[${centerLat},${centerLng}],zoom:13,zoomControl:true,attributionControl:false});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);
  ${zonePolygons}
  ${circleMarkers}
  ${editPolygonCode}
  ${tapModeCode}
  ${mapCenterReportCode}
  ${locationButtonCode}
  ${
    !isEditing
      ? `setTimeout(function(){
    var allBounds=[];
    ${fitBoundsCode}
    if(allBounds.length>0){var flat=allBounds.flat();if(flat.length>1)map.fitBounds(flat,{padding:[30,30]})}
  },200);`
      : ""
  }
<\/script></body></html>`;
}

export function LeafletPreviewFallback({
  zones,
  selectedZoneId,
  onZonePress,
  height,
  editingZoneId,
  editingPoints,
  onEditingPointsChange,
  drawMode = "none",
  onMapTap,
  onMapCenterChange,
  showLocationButton = false,
}: ZoneMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const mapHtml = useMemo(
    () => generateLeafletHtml(zones, selectedZoneId, editingZoneId, editingPoints, drawMode, showLocationButton),
    [zones, selectedZoneId, editingZoneId, editingPoints, drawMode, showLocationButton]
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data.type === "zone_select" && typeof data.id === "number") {
          onZonePress(data.id);
        }
        if (data.type === "edit_points" && Array.isArray(data.points) && onEditingPointsChange) {
          onEditingPointsChange(data.points);
        }
        if (data.type === "map_tap" && typeof data.lat === "number" && onMapTap) {
          onMapTap({ lat: data.lat, lng: data.lng });
        }
        if (data.type === "map_center" && typeof data.lat === "number" && onMapCenterChange) {
          onMapCenterChange({ lat: data.lat, lng: data.lng });
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onZonePress, onEditingPointsChange, onMapTap, onMapCenterChange]);

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
    backgroundColor: "#F5F5F5",
  },
});
