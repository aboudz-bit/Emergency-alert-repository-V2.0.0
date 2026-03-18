/**
 * TEMPORARY FALLBACK — Web Preview Only
 * See GoogleMapsView.tsx for the FINAL native implementation.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import type { ZoneMapProps } from "./types";
import type { Zone, LatLng } from "@/types";

/**
 * Generate the Leaflet HTML. Called when zone DATA changes (zones
 * added/removed, selection) or when entering/exiting edit mode
 * (editingZoneId changes). NOT called on every vertex drag — editing
 * point updates are handled inside the iframe via drag events.
 */
function generateLeafletHtml(
  zones: Zone[],
  editingZoneId: number | null | undefined,
  initialEditPoints: LatLng[] | undefined,
): string {
  const selectedZoneId: number | null = null; // selection is handled via postMessage
  const allPoints = zones.flatMap((z) => z.polygonPoints);
  let centerLat = 25.082;
  let centerLng = 48.175;
  if (allPoints.length > 0) {
    centerLat = allPoints.reduce((s, p) => s + p.lat, 0) / allPoints.length;
    centerLng = allPoints.reduce((s, p) => s + p.lng, 0) / allPoints.length;
  }

  const isEditing = editingZoneId != null;
  const editZone = isEditing ? zones.find((z) => z.id === editingZoneId) : null;

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
        allZonePolygons.push({id:${z.id}, layer: poly${z.id}, origOpacity: ${fillOpacity}, origColor:'${z.color}', isActive:${z.isActive}});
        poly${z.id}.on('click', function() {
          if (!tapEnabled) {
            window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
          }
        });
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
    if (!isEditing || !initialEditPoints || initialEditPoints.length === 0) return "";
    const color = editZone?.color || "#3B82F6";
    const coords = initialEditPoints.map((p) => `[${p.lat}, ${p.lng}]`).join(",");

    return `
      var editPoly = L.polygon([${coords}], {
        color: '${color}', fillColor: '${color}',
        fillOpacity: 0.25, weight: 3, dashArray: '',
      }).addTo(map);

      var editMarkers = [];
      var editPoints = [${initialEditPoints.map((p) => `{lat:${p.lat},lng:${p.lng}}`).join(",")}];
      var vertexDragging = false;

      function updateEditPoly() {
        editPoly.setLatLngs(editPoints.map(function(p){return [p.lat,p.lng]}));
        window.parent.postMessage(JSON.stringify({type:'edit_points', points: editPoints}), '*');
      }

      editPoints.forEach(function(pt, idx) {
        var m = L.marker([pt.lat, pt.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'edit-vertex',
            html: '<div class="vertex-outer"><div class="vertex-inner" style="background:${color};"></div><div class="vertex-num">' + (idx+1) + '</div></div>',
            iconAnchor: [24, 24],
          })
        }).addTo(map);
        m.on('dragstart', function() {
          vertexDragging = true;
          map.dragging.disable();
        });
        m.on('drag', function(e) {
          var ll = e.target.getLatLng();
          editPoints[idx] = {lat: ll.lat, lng: ll.lng};
          updateEditPoly();
        });
        m.on('dragend', function() {
          map.dragging.enable();
          vertexDragging = false;
        });
        editMarkers.push(m);
      });

      // Suspend location auto-centering in edit mode
      editModeActive = true;
      map.fitBounds(editPoly.getBounds(), {padding: [60, 60]});
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
        }).addTo(map).on('click', function() {
          if (!tapEnabled) {
            window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
          }
        });
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
  .leaflet-control-zoom a{background:#fff!important;color:#333!important;border-color:#ddd!important;width:40px!important;height:40px!important;line-height:40px!important;font-size:18px!important}
  .leaflet-control-zoom{border:1px solid #ddd!important;border-radius:12px!important;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)!important;margin-top:100px!important}
  .leaflet-top.leaflet-right .loc-btn{margin-top:100px!important}
  .leaflet-top.leaflet-right{padding-right:4px!important}
  .leaflet-touch .leaflet-control-zoom a{width:44px!important;height:44px!important;line-height:44px!important;font-size:20px!important}
  .vertex-outer{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;cursor:grab;position:relative}
  .vertex-inner{width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4)}
  .vertex-num{position:absolute;top:-6px;right:-4px;background:#fff;color:#333;font-size:10px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3)}
  .map-crosshair{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999;pointer-events:none;display:none}
  .map-crosshair.visible{display:block}
  .map-crosshair::before,.map-crosshair::after{content:'';position:absolute;background:rgba(59,130,246,0.6)}
  .map-crosshair::before{width:2px;height:28px;left:50%;top:50%;transform:translate(-50%,-50%)}
  .map-crosshair::after{width:28px;height:2px;left:50%;top:50%;transform:translate(-50%,-50%)}
  .crosshair-dot{position:absolute;width:8px;height:8px;border-radius:50%;border:2px solid rgba(59,130,246,0.7);background:transparent;top:50%;left:50%;transform:translate(-50%,-50%)}
  .shelter-icon{background:none!important;border:none!important}
  .shelter-marker{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25);cursor:pointer;border:2px solid #fff;transition:transform 0.2s}
  .shelter-marker.selected{transform:scale(1.3);border-color:#F59E0B;box-shadow:0 0 12px rgba(245,158,11,0.5)}
  .shelter-marker.nearest{border-color:#22C55E;box-shadow:0 0 12px rgba(34,197,94,0.5)}
  .shelter-marker.inactive{opacity:0.4}
  .shelter-label{background:#fff;color:#333;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);border:1px solid #e0e0e0}
  .user-loc-marker{width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid #fff;box-shadow:0 0 10px rgba(59,130,246,0.6)}
  .user-loc-pulse{width:40px;height:40px;border-radius:50%;background:rgba(59,130,246,0.15);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 2s infinite}
  .user-loc-wrap{position:relative;display:flex;align-items:center;justify-content:center}
  @keyframes pulse{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}
  .nearest-line{stroke:#22C55E;stroke-width:2;stroke-dasharray:8,6;fill:none;opacity:0.7}
</style></head><body>
<div id="map"></div>
<div id="crosshair" class="map-crosshair"><div class="crosshair-dot"></div></div>
<script>
  var map=L.map('map',{center:[${centerLat},${centerLng}],zoom:13,zoomControl:true,attributionControl:false,tap:true,tapTolerance:30});
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);

  // ── Global mode flags ──
  var allZonePolygons = [];
  var editModeActive = false;
  var vertexDragging = false;

  ${zonePolygons}
  ${circleMarkers}
  ${editPolygonCode}

  // ── Tap / draw mode (always present, toggled via message) ──
  var tapEnabled = false;
  var tapMarkers = [];
  var tapPoly = null;
  var tapColor = '#3B82F6';

  function addTapPoint(lat, lng) {
    var idx = tapMarkers.length + 1;
    var m = L.circleMarker([lat, lng], {
      radius: 10, color: '#fff', fillColor: tapColor,
      fillOpacity: 1, weight: 3,
    }).addTo(map);
    var label = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'zone-label',
        html: '<div style="background:'+tapColor+';color:#fff;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);min-width:22px;text-align:center;">' + idx + '</div>',
        iconAnchor: [14, -14],
      })
    }).addTo(map);
    tapMarkers.push({marker: m, label: label, lat: lat, lng: lng});
    updateTapPoly();
  }

  function updateTapPoly() {
    if (tapPoly) map.removeLayer(tapPoly);
    tapPoly = null;
    if (tapMarkers.length >= 2) {
      var coords = tapMarkers.map(function(t){return [t.lat, t.lng]});
      tapPoly = L.polygon(coords, {
        color: tapColor, fillColor: tapColor,
        fillOpacity: 0.15, weight: 2, dashArray: '6,4',
      }).addTo(map);
    }
  }

  function clearAllTapPoints() {
    tapMarkers.forEach(function(t) {
      map.removeLayer(t.marker);
      map.removeLayer(t.label);
    });
    tapMarkers = [];
    if (tapPoly) { map.removeLayer(tapPoly); tapPoly = null; }
  }

  function setTapMode(enabled) {
    tapEnabled = enabled;
    document.getElementById('map').style.cursor = enabled ? 'crosshair' : '';
    // Dim zone polygons during tap mode
    allZonePolygons.forEach(function(zp) {
      zp.layer.setStyle({ fillOpacity: enabled ? 0.08 : zp.origOpacity });
    });
  }

  map.on('click', function(e) {
    if (!tapEnabled) return;
    addTapPoint(e.latlng.lat, e.latlng.lng);
    window.parent.postMessage(JSON.stringify({type:'map_tap', lat: e.latlng.lat, lng: e.latlng.lng}), '*');
  });

  // ── Center reporting ──
  function reportCenter() {
    var c = map.getCenter();
    var z = map.getZoom();
    window.parent.postMessage(JSON.stringify({type:'map_center', lat: c.lat, lng: c.lng, zoom: z}), '*');
  }
  map.on('moveend', reportCenter);
  setTimeout(reportCenter, 300);

  // ── Location button + tracking (always present) ──
  var locBtn = L.control({position: 'topright'});
  locBtn.onAdd = function() {
    var div = L.DomUtil.create('div', 'loc-btn');
    div.setAttribute('id', 'loc-btn-wrap');
    div.innerHTML = '<div style="width:44px;height:44px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,0.18);cursor:pointer;border:1px solid #e0e0e0;" onclick="doLocate()"><svg width=\\"22\\" height=\\"22\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"#3B82F6\\" stroke-width=\\"2.5\\" stroke-linecap=\\"round\\" stroke-linejoin=\\"round\\"><circle cx=\\"12\\" cy=\\"12\\" r=\\"4\\"/><line x1=\\"12\\" y1=\\"2\\" x2=\\"12\\" y2=\\"6\\"/><line x1=\\"12\\" y1=\\"18\\" x2=\\"12\\" y2=\\"22\\"/><line x1=\\"2\\" y1=\\"12\\" x2=\\"6\\" y2=\\"12\\"/><line x1=\\"18\\" y1=\\"12\\" x2=\\"22\\" y2=\\"12\\"/></svg></div>';
    return div;
  };
  locBtn.addTo(map);

  var locMarker = null;
  var locWatchId = null;

  function doLocate() {
    if (!navigator.geolocation) return;
    // Stop any existing watch
    if (locWatchId != null) { navigator.geolocation.clearWatch(locWatchId); locWatchId = null; }
    // Start continuous tracking
    locWatchId = navigator.geolocation.watchPosition(function(pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      if (!locMarker) {
        locMarker = L.circleMarker([lat, lng], {
          radius: 8, color: '#3B82F6', fillColor: '#3B82F6',
          fillOpacity: 0.8, weight: 3,
        }).addTo(map);
        // Only fly on first fix, and never during edit mode
        if (!editModeActive && !vertexDragging) {
          map.flyTo([lat, lng], 15, {duration: 0.8});
        }
      } else {
        // Always update marker position (no camera move)
        locMarker.setLatLng([lat, lng]);
      }
      window.parent.postMessage(JSON.stringify({type:'current_location', lat: lat, lng: lng}), '*');
    }, function() {
      window.parent.postMessage(JSON.stringify({type:'location_error', message: 'Could not get location'}), '*');
    }, {enableHighAccuracy: true, timeout: 10000});
  }

  // ── Shelter markers layer (managed via postMessage — never baked into HTML) ──
  var shelterMarkers = {};
  var shelterLabels = {};
  var selectedShelterId = null;
  var nearestShelterId = null;
  var userLocMarker = null;
  var nearestLine = null;

  function addShelterMarker(s) {
    if (shelterMarkers[s.id]) removeShelterMarker(s.id);
    var isNearest = s.id === nearestShelterId;
    var isSel = s.id === selectedShelterId;
    var cls = 'shelter-marker' + (isSel ? ' selected' : '') + (isNearest ? ' nearest' : '') + (!s.isActive ? ' inactive' : '');
    var bgColor = isNearest ? '#22C55E' : '#F59E0B';
    var svgIcon = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    var marker = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: 'shelter-icon',
        html: '<div class="' + cls + '" style="background:' + bgColor + ';">' + svgIcon + '</div>',
        iconAnchor: [16, 16],
        iconSize: [32, 32],
      }),
      zIndexOffset: isNearest ? 1000 : isSel ? 900 : 500,
    }).addTo(map);
    marker.on('click', function() {
      window.parent.postMessage(JSON.stringify({type:'shelter_select', id: s.id}), '*');
    });
    shelterMarkers[s.id] = { marker: marker, data: s };
    var label = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: 'shelter-icon',
        html: '<div class="shelter-label">' + s.name + '</div>',
        iconAnchor: [40, -20],
      }),
      interactive: false,
    }).addTo(map);
    shelterLabels[s.id] = label;
  }

  function removeShelterMarker(id) {
    if (shelterMarkers[id]) { map.removeLayer(shelterMarkers[id].marker); delete shelterMarkers[id]; }
    if (shelterLabels[id]) { map.removeLayer(shelterLabels[id]); delete shelterLabels[id]; }
  }

  function refreshAllShelterStyles() {
    Object.keys(shelterMarkers).forEach(function(idStr) {
      var entry = shelterMarkers[idStr];
      if (entry && entry.data) addShelterMarker(entry.data);
    });
  }

  function setUserLocation(lat, lng) {
    if (!userLocMarker) {
      userLocMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'shelter-icon',
          html: '<div class="user-loc-wrap"><div class="user-loc-pulse"></div><div class="user-loc-marker"></div></div>',
          iconAnchor: [20, 20],
          iconSize: [40, 40],
        }),
        zIndexOffset: 2000,
        interactive: false,
      }).addTo(map);
    } else {
      userLocMarker.setLatLng([lat, lng]);
    }
  }

  function drawNearestLine(fromLat, fromLng, toLat, toLng) {
    if (nearestLine) { map.removeLayer(nearestLine); nearestLine = null; }
    nearestLine = L.polyline([[fromLat, fromLng], [toLat, toLng]], {
      color: '#22C55E', weight: 2, dashArray: '8,6', opacity: 0.7,
    }).addTo(map);
  }

  function clearNearestLine() {
    if (nearestLine) { map.removeLayer(nearestLine); nearestLine = null; }
  }

  // ── Unified message handler ──
  window.addEventListener('message', function(evt) {
    try {
      var d = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data;

      if (d.type === 'fly_to' && typeof d.lat === 'number' && !vertexDragging) {
        map.flyTo([d.lat, d.lng], d.zoom || 15, {duration: 0.8});
      }
      if (d.type === 'fly_to_bounds' && Array.isArray(d.bounds) && !vertexDragging) {
        map.flyToBounds(d.bounds, {padding: [50, 50], duration: 0.8});
      }
      if (d.type === 'set_edit_mode') {
        editModeActive = !!d.enabled;
      }
      if (d.type === 'undo_tap' && tapMarkers.length > 0) {
        var last = tapMarkers.pop();
        map.removeLayer(last.marker);
        map.removeLayer(last.label);
        updateTapPoly();
      }
      if (d.type === 'set_tap_mode') {
        if (!d.enabled) clearAllTapPoints();
        setTapMode(!!d.enabled);
      }
      if (d.type === 'select_zone') {
        var selId = d.id;
        allZonePolygons.forEach(function(zp) {
          var isSel = zp.id === selId;
          zp.layer.setStyle({
            weight: isSel ? 3 : 2,
            fillOpacity: isSel ? 0.35 : zp.origOpacity
          });
        });
      }
      if (d.type === 'update_zone_active') {
        allZonePolygons.forEach(function(zp) {
          if (zp.id === d.id) {
            zp.isActive = d.isActive;
            var baseOpacity = d.isActive ? 0.2 : 0.08;
            zp.origOpacity = baseOpacity;
            zp.layer.setStyle({
              color: d.isActive ? zp.origColor : '#6B7280',
              dashArray: d.isActive ? '' : '5,5',
              fillOpacity: baseOpacity
            });
          }
        });
      }
      if (d.type === 'set_crosshair') {
        var ch = document.getElementById('crosshair');
        if (ch) ch.className = 'map-crosshair' + (d.visible ? ' visible' : '');
      }
      if (d.type === 'set_location_button') {
        var lb = document.getElementById('loc-btn-wrap');
        if (lb) lb.style.display = d.visible ? '' : 'none';
      }
      // ── Shelter messages (all handled via postMessage, no iframe rebuild) ──
      if (d.type === 'sync_shelters' && Array.isArray(d.shelters)) {
        var existingIds = {};
        d.shelters.forEach(function(s) { existingIds[s.id] = true; addShelterMarker(s); });
        Object.keys(shelterMarkers).forEach(function(idStr) {
          if (!existingIds[idStr]) removeShelterMarker(parseInt(idStr));
        });
      }
      if (d.type === 'select_shelter') {
        selectedShelterId = d.id;
        refreshAllShelterStyles();
      }
      if (d.type === 'set_nearest_shelter') {
        nearestShelterId = d.id;
        refreshAllShelterStyles();
        if (d.id && d.userLat != null && shelterMarkers[d.id]) {
          var sData = shelterMarkers[d.id].data;
          drawNearestLine(d.userLat, d.userLng, sData.lat, sData.lng);
        } else {
          clearNearestLine();
        }
      }
      if (d.type === 'set_user_location' && typeof d.lat === 'number') {
        setUserLocation(d.lat, d.lng);
      }
      if (d.type === 'fly_to_shelter' && typeof d.lat === 'number') {
        map.flyTo([d.lat, d.lng], d.zoom || 16, {duration: 0.8});
      }
    } catch(ex) {}
  });

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
  tapPointCount = 0,
  flyToZoneId,
  showCenterCrosshair = false,
  shelters,
  selectedShelterId,
  onShelterPress,
  onShelterMapTap,
  nearestShelterId,
  userLocation,
}: ZoneMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevTapCountRef = useRef(0);
  const prevFlyToRef = useRef<number | null | undefined>(undefined);
  // Capture initial editing points when entering edit mode so that
  // ongoing vertex drags (which update editingPoints) don't regenerate HTML
  const initialEditPointsRef = useRef<LatLng[] | undefined>(undefined);
  const prevEditingZoneIdRef = useRef<number | null | undefined>(undefined);

  // Snapshot editing points when editingZoneId first becomes non-null
  if (editingZoneId !== prevEditingZoneIdRef.current) {
    prevEditingZoneIdRef.current = editingZoneId;
    initialEditPointsRef.current = editingZoneId != null ? editingPoints : undefined;
  }

  // Stable key: only regenerate when zone structure changes (add/remove/reorder/color/points),
  // NOT on isActive toggle or selection changes — those use postMessage.
  const zonesStructureKey = useMemo(
    () =>
      zones
        .map(
          (z) =>
            `${z.id}:${z.color}:${z.polygonPoints.map((p) => `${p.lat},${p.lng}`).join("|")}:${z.center?.lat},${z.center?.lng}:${z.name}`
        )
        .join(";"),
    [zones]
  );

  // Only regenerate HTML when zone STRUCTURE or edit-mode entry changes — never on
  // selection, isActive toggle, or vertex drags.
  const mapHtml = useMemo(
    () => generateLeafletHtml(zones, editingZoneId, initialEditPointsRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zonesStructureKey, editingZoneId]
  );

  // Helper to post a message to the iframe
  const postToIframe = (msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  };

  // ── Highlight selected zone via postMessage (no iframe reload) ──
  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "select_zone", id: selectedZoneId }), 80);
    return () => clearTimeout(t);
  }, [selectedZoneId]);

  // ── Sync zone isActive changes via postMessage (no iframe reload) ──
  const prevZonesRef = useRef<Zone[]>([]);
  useEffect(() => {
    const prev = prevZonesRef.current;
    prevZonesRef.current = zones;
    if (prev.length === 0) return; // first render, skip
    for (const z of zones) {
      const old = prev.find((p) => p.id === z.id);
      if (old && old.isActive !== z.isActive) {
        postToIframe({ type: "update_zone_active", id: z.id, isActive: z.isActive });
      }
    }
  }, [zones]);

  // ── Toggle edit mode (suspends location auto-centering) ──
  useEffect(() => {
    const enabled = editingZoneId != null;
    const t = setTimeout(() => postToIframe({ type: "set_edit_mode", enabled }), 120);
    return () => clearTimeout(t);
  }, [editingZoneId]);

  // ── Toggle tap/draw mode via message ──
  useEffect(() => {
    const enabled = drawMode === "tap";
    // Small delay to ensure iframe is ready after a potential HTML reload
    const t = setTimeout(() => postToIframe({ type: "set_tap_mode", enabled }), 100);
    return () => clearTimeout(t);
  }, [drawMode]);

  // ── Toggle crosshair via message ──
  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "set_crosshair", visible: showCenterCrosshair }), 100);
    return () => clearTimeout(t);
  }, [showCenterCrosshair]);

  // ── Toggle location button visibility via message ──
  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "set_location_button", visible: showLocationButton }), 100);
    return () => clearTimeout(t);
  }, [showLocationButton]);

  // Send undo message to iframe when tapPointCount decreases
  useEffect(() => {
    if (tapPointCount < prevTapCountRef.current) {
      postToIframe({ type: "undo_tap" });
    }
    prevTapCountRef.current = tapPointCount;
  }, [tapPointCount]);

  // Fly to zone when flyToZoneId changes
  useEffect(() => {
    if (flyToZoneId == null || flyToZoneId === prevFlyToRef.current) {
      prevFlyToRef.current = flyToZoneId;
      return;
    }
    prevFlyToRef.current = flyToZoneId;

    const zone = zones.find((z) => z.id === flyToZoneId);
    if (!zone) return;

    if (zone.polygonPoints.length > 0) {
      const bounds = zone.polygonPoints.map((p) => [p.lat, p.lng]);
      postToIframe({ type: "fly_to_bounds", bounds });
    } else if (zone.center) {
      postToIframe({ type: "fly_to", lat: zone.center.lat, lng: zone.center.lng, zoom: 15 });
    }
  }, [flyToZoneId, zones]);

  // ── Receive messages from iframe ──
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
        if (data.type === "shelter_select" && typeof data.id === "number" && onShelterPress) {
          onShelterPress(data.id);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onZonePress, onEditingPointsChange, onMapTap, onMapCenterChange, onShelterPress]);

  // ── Sync shelters via postMessage (no iframe reload) ──
  const prevSheltersRef = useRef<string>("");
  useEffect(() => {
    prevSheltersRef.current = "";
  }, [mapHtml]);
  useEffect(() => {
    if (!shelters) return;
    const key = JSON.stringify(shelters);
    if (key === prevSheltersRef.current) return;
    prevSheltersRef.current = key;
    const t = setTimeout(() => postToIframe({ type: "sync_shelters", shelters }), 150);
    return () => clearTimeout(t);
  }, [shelters, mapHtml]);

  // ── Select shelter via postMessage ──
  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "select_shelter", id: selectedShelterId ?? null }), 80);
    return () => clearTimeout(t);
  }, [selectedShelterId]);

  // ── Nearest shelter via postMessage ──
  useEffect(() => {
    const t = setTimeout(() => postToIframe({
      type: "set_nearest_shelter",
      id: nearestShelterId ?? null,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
    }), 80);
    return () => clearTimeout(t);
  }, [nearestShelterId, userLocation]);

  // ── User location marker via postMessage ──
  useEffect(() => {
    if (!userLocation) return;
    const t = setTimeout(() => postToIframe({ type: "set_user_location", lat: userLocation.lat, lng: userLocation.lng }), 80);
    return () => clearTimeout(t);
  }, [userLocation]);

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
