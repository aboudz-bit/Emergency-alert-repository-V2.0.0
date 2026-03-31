/**
 * TEMPORARY FALLBACK — Web Preview Only
 * See GoogleMapsView.tsx for the FINAL native implementation.
 *
 * Redesigned to feel like Google Maps — satellite tiles, cleaner polygons,
 * shelter clustering, zoom-dependent labels, floating controls.
 */

import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";
import type { ZoneMapProps } from "./types";
import type { Zone, LatLng } from "@/types";

const GMAPS_KEY: string = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function generateLeafletHtml(
  zones: Zone[],
  editingZoneId: number | null | undefined,
  initialEditPoints: LatLng[] | undefined,
  googleMapsKey: string,
): string {
  const selectedZoneId: number | null = null;
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
      const fillOpacity = isEditing ? 0.04 : isSelected ? 0.25 : z.isActive ? 0.1 : 0.04;
      const weight = isSelected ? 2.5 : 1.2;
      const dashArray = z.isActive ? "" : "5,5";
      const color = z.isActive ? z.color : "#6B728080";
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
        var zoneLabel${z.id} = L.marker([${labelCoord}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div class="zone-label-inner" style="--zone-color:${z.color};${!z.isActive ? "opacity:0.4;" : ""}">${z.name}</div>',
            iconAnchor: [30, 12],
          }),
          interactive: false,
        }).addTo(zoneLabelsGroup);`;
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
          fillColor: '${z.color}', fillOpacity: ${isSelected ? 0.4 : 0.2},
          weight: ${isSelected ? 2.5 : 1.5},
        }).addTo(map).on('click', function() {
          if (!tapEnabled) {
            window.parent.postMessage(JSON.stringify({type:'zone_select', id:${z.id}}), '*');
          }
        });
        var zoneLabel${z.id} = L.marker([${z.center!.lat}, ${z.center!.lng}], {
          icon: L.divIcon({
            className: 'zone-label',
            html: '<div class="zone-label-inner" style="--zone-color:${z.color}">${z.name}</div>',
            iconAnchor: [30, -4],
          }),
          interactive: false,
        }).addTo(zoneLabelsGroup);`;
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

  const useGoogleTiles = !!googleMapsKey;

  return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><\/script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%}
  body{background:#1a1a2e}

  .zone-label{background:none!important;border:none!important}
  .edit-vertex{background:none!important;border:none!important}
  .loc-btn{background:none!important;border:none!important}
  .shelter-icon{background:none!important;border:none!important}

  .zone-label-inner{
    color:#fff;padding:3px 8px;border-radius:4px;font-size:10px;font-weight:600;
    white-space:nowrap;letter-spacing:0.3px;
    background:rgba(0,0,0,0.55);backdrop-filter:blur(4px);
    border:1px solid rgba(255,255,255,0.12);
    text-shadow:0 1px 2px rgba(0,0,0,0.6);
  }

  .leaflet-control-zoom{display:none!important}

  .gm-fab{
    width:44px;height:44px;border-radius:22px;
    background:#fff;display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 6px rgba(0,0,0,0.25),0 0 2px rgba(0,0,0,0.1);
    cursor:pointer;border:none;outline:none;
    transition:box-shadow 0.2s,transform 0.15s;
  }
  .gm-fab:hover{box-shadow:0 4px 12px rgba(0,0,0,0.3);transform:scale(1.05)}
  .gm-fab:active{transform:scale(0.95)}
  .gm-fab svg{pointer-events:none}

  .gm-controls{
    position:absolute;right:12px;bottom:120px;z-index:800;
    display:flex;flex-direction:column;gap:10px;
  }

  .gm-zoom-group{
    display:flex;flex-direction:column;border-radius:22px;overflow:hidden;
    box-shadow:0 2px 6px rgba(0,0,0,0.25),0 0 2px rgba(0,0,0,0.1);
  }
  .gm-zoom-btn{
    width:44px;height:40px;background:#fff;border:none;cursor:pointer;
    display:flex;align-items:center;justify-content:center;outline:none;
    transition:background 0.15s;
  }
  .gm-zoom-btn:hover{background:#f5f5f5}
  .gm-zoom-btn:active{background:#e8e8e8}
  .gm-zoom-sep{height:1px;background:#e0e0e0;margin:0}

  .gm-layers-popup{
    position:absolute;right:60px;bottom:0;z-index:810;
    background:#fff;border-radius:12px;padding:6px;
    box-shadow:0 4px 16px rgba(0,0,0,0.2);display:none;min-width:130px;
  }
  .gm-layers-popup.visible{display:block}
  .gm-layer-opt{
    padding:8px 12px;border-radius:8px;cursor:pointer;font-size:12px;
    font-weight:500;color:#333;display:flex;align-items:center;gap:8px;
    transition:background 0.15s;
  }
  .gm-layer-opt:hover{background:#f0f0f0}
  .gm-layer-opt.active{background:#e8f0fe;color:#1a73e8;font-weight:600}
  .gm-layer-dot{width:8px;height:8px;border-radius:50%}

  .vertex-outer{width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;cursor:grab;position:relative}
  .vertex-inner{width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.4)}
  .vertex-num{position:absolute;top:-6px;right:-4px;background:#fff;color:#333;font-size:10px;font-weight:700;width:16px;height:16px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3)}

  .map-crosshair{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:999;pointer-events:none;display:none}
  .map-crosshair.visible{display:block}
  .map-crosshair::before,.map-crosshair::after{content:'';position:absolute;background:rgba(59,130,246,0.6)}
  .map-crosshair::before{width:2px;height:28px;left:50%;top:50%;transform:translate(-50%,-50%)}
  .map-crosshair::after{width:28px;height:2px;left:50%;top:50%;transform:translate(-50%,-50%)}
  .crosshair-dot{position:absolute;width:8px;height:8px;border-radius:50%;border:2px solid rgba(59,130,246,0.7);background:transparent;top:50%;left:50%;transform:translate(-50%,-50%)}

  .shelter-marker{
    width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;border:2.5px solid #fff;
    transition:transform 0.2s,box-shadow 0.2s;
  }
  .shelter-marker.selected{transform:scale(1.25);border-color:#FBBF24;box-shadow:0 0 0 3px rgba(251,191,36,0.3),0 2px 8px rgba(0,0,0,0.3)}
  .shelter-marker.nearest{border-color:#34D399;box-shadow:0 0 0 3px rgba(52,211,153,0.3),0 2px 8px rgba(0,0,0,0.3)}
  .shelter-marker.inactive{opacity:0.35}

  .shelter-label{
    background:rgba(0,0,0,0.6);color:#fff;padding:2px 7px;border-radius:4px;
    font-size:9px;font-weight:600;white-space:nowrap;
    backdrop-filter:blur(4px);letter-spacing:0.2px;
    border:1px solid rgba(255,255,255,0.1);
  }

  .shelter-cluster{
    width:38px;height:38px;border-radius:50%;
    background:rgba(245,158,11,0.85);border:2.5px solid #fff;
    display:flex;align-items:center;justify-content:center;
    color:#fff;font-size:13px;font-weight:700;
    box-shadow:0 2px 8px rgba(0,0,0,0.3);cursor:pointer;
    transition:transform 0.2s;
  }
  .shelter-cluster:hover{transform:scale(1.1)}

  .user-loc-marker{width:16px;height:16px;border-radius:50%;background:#4285F4;border:3px solid #fff;box-shadow:0 0 10px rgba(66,133,244,0.5)}
  .user-loc-pulse{width:40px;height:40px;border-radius:50%;background:rgba(66,133,244,0.15);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);animation:pulse 2s infinite}
  .user-loc-wrap{position:relative;display:flex;align-items:center;justify-content:center}
  @keyframes pulse{0%{transform:translate(-50%,-50%) scale(1);opacity:1}100%{transform:translate(-50%,-50%) scale(2.5);opacity:0}}

  .nearest-line{stroke:#34D399;stroke-width:2;stroke-dasharray:8,6;fill:none;opacity:0.7}

  .loc-label-inner{
    background:rgba(0,0,0,0.55);color:#fff;padding:2px 6px;border-radius:4px;
    font-size:9px;font-weight:600;white-space:nowrap;
    backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.1);
  }

  .personnel-dot-wrap{width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer}
  .personnel-dot{width:12px;height:12px;border-radius:50%;border:2px solid rgba(255,255,255,0.9);box-shadow:0 1px 4px rgba(0,0,0,0.3);pointer-events:none;transition:background 0.3s}
  .personnel-dot.square{border-radius:2px}
  .personnel-dot.safe{background:#34D399}
  .personnel-dot.outside{background:#FBBF24}
  .personnel-dot.need-help{background:#EF4444;animation:help-pulse 1.4s ease-in-out infinite;box-shadow:0 0 6px rgba(239,68,68,0.6)}
  .personnel-dot.escalated{box-shadow:0 0 8px rgba(251,191,36,0.7);animation:esc-pulse 2s ease-in-out infinite}
  .personnel-dot.esc-critical{box-shadow:0 0 12px rgba(239,68,68,0.8);animation:help-pulse 1.4s ease-in-out infinite}
  .personnel-dot.tracked{border:3px solid rgba(255,255,255,1);box-shadow:0 0 10px rgba(96,165,250,0.7),0 0 20px rgba(96,165,250,0.3);animation:track-glow 2.5s ease-in-out infinite}
  .personnel-dot.tracked.need-help{animation:help-pulse 1.4s ease-in-out infinite}
  .personnel-dot.tracked.esc-critical{animation:help-pulse 1.4s ease-in-out infinite}
  .personnel-dot.dimmed{opacity:0.25;transform:scale(0.7);animation:none !important;box-shadow:none !important}
  .personnel-dot.highlighted{transform:scale(1.3);box-shadow:0 0 8px rgba(255,255,255,0.5)}
  .personnel-dot.intel-focus{width:16px;height:16px;border:3px solid #fff;box-shadow:0 0 18px rgba(239,68,68,0.9),0 0 30px rgba(239,68,68,0.5);animation:intel-ring 1.2s ease-in-out infinite}
  @keyframes intel-ring{0%,100%{box-shadow:0 0 14px rgba(239,68,68,0.7),0 0 24px rgba(239,68,68,0.3)}50%{box-shadow:0 0 22px rgba(239,68,68,1),0 0 40px rgba(239,68,68,0.6)}}
  @keyframes help-pulse{0%,100%{transform:scale(1);box-shadow:0 0 6px rgba(239,68,68,0.4)}50%{transform:scale(1.3);box-shadow:0 0 14px rgba(239,68,68,0.8)}}
  @keyframes esc-pulse{0%,100%{box-shadow:0 0 6px rgba(251,191,36,0.4)}50%{box-shadow:0 0 12px rgba(251,191,36,0.8)}}
  @keyframes track-glow{0%,100%{box-shadow:0 0 8px rgba(96,165,250,0.5),0 0 16px rgba(96,165,250,0.2)}50%{box-shadow:0 0 14px rgba(96,165,250,0.8),0 0 24px rgba(96,165,250,0.4)}}

  .leaflet-container{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}


</style></head><body>
<div id="map"></div>
<div id="crosshair" class="map-crosshair"><div class="crosshair-dot"></div></div>

<div class="gm-controls" id="gm-controls">
  <button class="gm-fab" id="btn-locate" title="My location" onclick="doLocate()">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg>
  </button>
  <div style="position:relative">
    <button class="gm-fab" id="btn-layers" title="Map type" onclick="toggleLayersMenu()">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    </button>
    <div class="gm-layers-popup" id="layers-popup">
      <div class="gm-layer-opt" data-layer="satellite" onclick="switchLayer('satellite')">
        <div class="gm-layer-dot" style="background:#2d5016"></div>Satellite
      </div>
      <div class="gm-layer-opt active" data-layer="hybrid" onclick="switchLayer('hybrid')">
        <div class="gm-layer-dot" style="background:#1a5c1a"></div>Hybrid
      </div>
      <div class="gm-layer-opt" data-layer="standard" onclick="switchLayer('standard')">
        <div class="gm-layer-dot" style="background:#e8e4df"></div>Standard
      </div>
      ${useGoogleTiles ? `<div class="gm-layer-opt" data-layer="terrain" onclick="switchLayer('terrain')">
        <div class="gm-layer-dot" style="background:#b5d6a7"></div>Terrain
      </div>` : `<div class="gm-layer-opt" data-layer="dark" onclick="switchLayer('dark')">
        <div class="gm-layer-dot" style="background:#263238"></div>Dark
      </div>`}
    </div>
  </div>
  <div class="gm-zoom-group">
    <button class="gm-zoom-btn" onclick="map.zoomIn()" title="Zoom in">
      <svg width="18" height="18" viewBox="0 0 24 24" stroke="#666" stroke-width="2.5" fill="none"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
    <div class="gm-zoom-sep"></div>
    <button class="gm-zoom-btn" onclick="map.zoomOut()" title="Zoom out">
      <svg width="18" height="18" viewBox="0 0 24 24" stroke="#666" stroke-width="2.5" fill="none"><line x1="5" y1="12" x2="19" y2="12"/></svg>
    </button>
  </div>
</div>

<script>
  var map=L.map('map',{center:[${centerLat},${centerLng}],zoom:13,zoomControl:false,attributionControl:false,tap:true,tapTolerance:30});

  var useGoogleTiles = ${useGoogleTiles ? 'true' : 'false'};
  var tileLayers = {};
  if (useGoogleTiles) {
    tileLayers.satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{maxZoom:22,attribution:'&copy; Google'});
    tileLayers.hybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',{maxZoom:22,attribution:'&copy; Google'});
    tileLayers.standard = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{maxZoom:22,attribution:'&copy; Google'});
    tileLayers.terrain = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',{maxZoom:22,attribution:'&copy; Google'});
  } else {
    tileLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Esri'});
    tileLayers.labels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,pane:'overlayPane'});
    tileLayers.placeLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,pane:'overlayPane'});
    tileLayers.standard = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19});
    tileLayers.dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19});
  }

  var esriFallbackLayers = {
    satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Esri'}),
    labels: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,pane:'overlayPane'}),
    placeLabels: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,pane:'overlayPane'})
  };

  var googleTileErrors = 0;
  var googleFallbackTriggered = false;
  function onGoogleTileError() {
    googleTileErrors++;
    if (googleTileErrors >= 5 && !googleFallbackTriggered) {
      googleFallbackTriggered = true;
      useGoogleTiles = false;
      Object.values(tileLayers).forEach(function(l){map.removeLayer(l)});
      tileLayers = {
        satellite: esriFallbackLayers.satellite,
        labels: esriFallbackLayers.labels,
        placeLabels: esriFallbackLayers.placeLabels,
        standard: L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',{maxZoom:19}),
        dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19})
      };
      tileLayers.satellite.addTo(map);
      tileLayers.labels.addTo(map);
      tileLayers.placeLabels.addTo(map);
      console.log('[ZoneMap] Google tiles failed — fell back to Esri');
    }
  }
  if (useGoogleTiles) {
    Object.values(tileLayers).forEach(function(l){l.on('tileerror', onGoogleTileError)});
  }

  var currentLayer = 'hybrid';
  if (useGoogleTiles && tileLayers.hybrid) {
    tileLayers.hybrid.addTo(map);
  } else {
    tileLayers.satellite.addTo(map);
    if (tileLayers.labels) tileLayers.labels.addTo(map);
    if (tileLayers.placeLabels) tileLayers.placeLabels.addTo(map);
  }

  function switchLayer(name) {
    Object.values(tileLayers).forEach(function(l){map.removeLayer(l)});
    if (useGoogleTiles && tileLayers[name]) {
      tileLayers[name].addTo(map);
    } else {
      if (name === 'satellite') {
        tileLayers.satellite.addTo(map);
      } else if (name === 'hybrid') {
        tileLayers.satellite.addTo(map);
        if (tileLayers.labels) tileLayers.labels.addTo(map);
        if (tileLayers.placeLabels) tileLayers.placeLabels.addTo(map);
      } else if (name === 'standard') {
        tileLayers.standard.addTo(map);
      } else if (name === 'dark' && tileLayers.dark) {
        tileLayers.dark.addTo(map);
      }
    }
    currentLayer = name;
    document.querySelectorAll('.gm-layer-opt').forEach(function(el){
      el.classList.toggle('active', el.getAttribute('data-layer') === name);
    });
    toggleLayersMenu(true);
  }

  function toggleLayersMenu(forceClose) {
    var popup = document.getElementById('layers-popup');
    if (forceClose === true) { popup.classList.remove('visible'); return; }
    popup.classList.toggle('visible');
  }
  document.getElementById('map').addEventListener('click', function(){
    document.getElementById('layers-popup').classList.remove('visible');
  });

  var zoneLabelsGroup = L.layerGroup().addTo(map);

  var allZonePolygons = [];
  var editModeActive = false;
  var vertexDragging = false;

  ${zonePolygons}
  ${circleMarkers}
  ${editPolygonCode}

  map.on('zoomend', function() {
    var z = map.getZoom();
    if (z >= 13) {
      if (!map.hasLayer(zoneLabelsGroup)) map.addLayer(zoneLabelsGroup);
    } else {
      if (map.hasLayer(zoneLabelsGroup)) map.removeLayer(zoneLabelsGroup);
    }
  });

  var tapEnabled = false;
  var tapMarkers = [];
  var tapPoly = null;
  var tapColor = '#4285F4';

  function addTapPoint(lat, lng) {
    var idx = tapMarkers.length + 1;
    var m = L.circleMarker([lat, lng], {
      radius: 8, color: '#fff', fillColor: tapColor,
      fillOpacity: 1, weight: 2.5,
    }).addTo(map);
    var label = L.marker([lat, lng], {
      icon: L.divIcon({
        className: 'zone-label',
        html: '<div style="background:'+tapColor+';color:#fff;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.3);min-width:20px;text-align:center;">' + idx + '</div>',
        iconAnchor: [14, -12],
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
        fillOpacity: 0.1, weight: 1.5, dashArray: '6,4',
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
    allZonePolygons.forEach(function(zp) {
      zp.layer.setStyle({ fillOpacity: enabled ? 0.04 : zp.origOpacity });
    });
  }

  map.on('click', function(e) {
    if (!tapEnabled) return;
    addTapPoint(e.latlng.lat, e.latlng.lng);
    window.parent.postMessage(JSON.stringify({type:'map_tap', lat: e.latlng.lat, lng: e.latlng.lng}), '*');
  });

  function reportCenter() {
    var c = map.getCenter();
    var z = map.getZoom();
    window.parent.postMessage(JSON.stringify({type:'map_center', lat: c.lat, lng: c.lng, zoom: z}), '*');
  }
  map.on('moveend', reportCenter);
  setTimeout(reportCenter, 300);

  var locMarker = null;
  var locWatchId = null;

  function doLocate() {
    if (!navigator.geolocation) return;
    var btn = document.getElementById('btn-locate');
    if (btn) { btn.querySelector('svg').setAttribute('stroke','#4285F4'); }
    if (locWatchId != null) { navigator.geolocation.clearWatch(locWatchId); locWatchId = null; }
    locWatchId = navigator.geolocation.watchPosition(function(pos) {
      var lat = pos.coords.latitude;
      var lng = pos.coords.longitude;
      if (!locMarker) {
        locMarker = L.marker([lat, lng], {
          icon: L.divIcon({
            className: 'shelter-icon',
            html: '<div class="user-loc-wrap"><div class="user-loc-pulse"></div><div class="user-loc-marker"></div></div>',
            iconAnchor: [20, 20],
            iconSize: [40, 40],
          }),
          zIndexOffset: 2000,
          interactive: false,
        }).addTo(map);
        if (!editModeActive && !vertexDragging) {
          map.flyTo([lat, lng], 15, {duration: 0.8});
        }
      } else {
        locMarker.setLatLng([lat, lng]);
      }
      window.parent.postMessage(JSON.stringify({type:'current_location', lat: lat, lng: lng}), '*');
    }, function() {
      window.parent.postMessage(JSON.stringify({type:'location_error', message: 'Could not get location'}), '*');
    }, {enableHighAccuracy: true, timeout: 10000});
  }

  var shelterMarkers = {};
  var shelterLabels = {};
  var shelterClusterMarkers = {};
  var selectedShelterId = null;
  var nearestShelterId = null;
  var userLocMarker = null;
  var nearestLine = null;
  var clusteringEnabled = true;
  var CLUSTER_DISTANCE = 40;

  function addShelterMarker(s) {
    if (shelterMarkers[s.id]) removeShelterMarker(s.id);
    var isNearest = s.id === nearestShelterId;
    var isSel = s.id === selectedShelterId;
    var cls = 'shelter-marker' + (isSel ? ' selected' : '') + (isNearest ? ' nearest' : '') + (!s.isActive ? ' inactive' : '');
    var bgColor = isNearest ? '#34D399' : '#F59E0B';
    var svgIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    var marker = L.marker([s.lat, s.lng], {
      icon: L.divIcon({
        className: 'shelter-icon',
        html: '<div class="' + cls + '" style="background:' + bgColor + ';">' + svgIcon + '</div>',
        iconAnchor: [17, 17],
        iconSize: [34, 34],
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
        iconAnchor: [40, -8],
      }),
      interactive: false,
      zIndexOffset: 400,
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
    updateShelterClustering();
  }

  function updateShelterClustering() {
    Object.keys(shelterClusterMarkers).forEach(function(k) {
      map.removeLayer(shelterClusterMarkers[k]);
    });
    shelterClusterMarkers = {};

    var zoom = map.getZoom();
    var showLabels = zoom >= 15;
    var doCluster = zoom < 14 && clusteringEnabled;

    Object.keys(shelterLabels).forEach(function(id) {
      if (showLabels) {
        if (!map.hasLayer(shelterLabels[id])) map.addLayer(shelterLabels[id]);
      } else {
        if (map.hasLayer(shelterLabels[id])) map.removeLayer(shelterLabels[id]);
      }
    });

    if (!doCluster) {
      Object.keys(shelterMarkers).forEach(function(id) {
        if (!map.hasLayer(shelterMarkers[id].marker)) map.addLayer(shelterMarkers[id].marker);
      });
      return;
    }

    var items = [];
    Object.keys(shelterMarkers).forEach(function(id) {
      var entry = shelterMarkers[id];
      if (!entry || !entry.data) return;
      var pt = map.latLngToContainerPoint([entry.data.lat, entry.data.lng]);
      items.push({id: id, x: pt.x, y: pt.y, data: entry.data, marker: entry.marker, clustered: false});
    });

    var clusters = [];
    for (var i = 0; i < items.length; i++) {
      if (items[i].clustered) continue;
      var cluster = [items[i]];
      items[i].clustered = true;
      for (var j = i + 1; j < items.length; j++) {
        if (items[j].clustered) continue;
        var dx = items[i].x - items[j].x;
        var dy = items[i].y - items[j].y;
        if (Math.sqrt(dx*dx + dy*dy) < CLUSTER_DISTANCE) {
          cluster.push(items[j]);
          items[j].clustered = true;
        }
      }
      clusters.push(cluster);
    }

    clusters.forEach(function(cluster, ci) {
      if (cluster.length === 1) {
        if (!map.hasLayer(cluster[0].marker)) map.addLayer(cluster[0].marker);
        return;
      }
      cluster.forEach(function(item) {
        if (map.hasLayer(item.marker)) map.removeLayer(item.marker);
      });
      var avgLat = cluster.reduce(function(s,c){return s+c.data.lat},0)/cluster.length;
      var avgLng = cluster.reduce(function(s,c){return s+c.data.lng},0)/cluster.length;
      var cm = L.marker([avgLat, avgLng], {
        icon: L.divIcon({
          className: 'shelter-icon',
          html: '<div class="shelter-cluster">' + cluster.length + '</div>',
          iconAnchor: [19, 19],
          iconSize: [38, 38],
        }),
        zIndexOffset: 600,
      }).addTo(map);
      cm.on('click', function() {
        var bounds = L.latLngBounds(cluster.map(function(c){return [c.data.lat, c.data.lng]}));
        map.flyToBounds(bounds.pad(0.3), {duration: 0.5});
      });
      shelterClusterMarkers['cluster_' + ci] = cm;
    });
  }

  map.on('zoomend', updateShelterClustering);
  map.on('moveend', function() {
    if (map.getZoom() < 14 && clusteringEnabled) updateShelterClustering();
  });

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
      color: '#34D399', weight: 2, dashArray: '8,6', opacity: 0.7,
    }).addTo(map);
  }

  function clearNearestLine() {
    if (nearestLine) { map.removeLayer(nearestLine); nearestLine = null; }
  }

  var personnelMarkers = {};
  var personnelData = {};
  var intelFocusedIds = {};
  var trackedUserIds = {};
  function setTrackedUsers(ids) {
    trackedUserIds = {};
    (ids || []).forEach(function(id) { trackedUserIds[id] = true; });
    Object.keys(personnelMarkers).forEach(function(uid) {
      var el = personnelMarkers[uid].getElement();
      if (!el) return;
      var dot = el.querySelector('.personnel-dot');
      if (!dot) return;
      if (trackedUserIds[uid]) {
        if (!dot.classList.contains('tracked')) dot.classList.add('tracked');
      } else {
        dot.classList.remove('tracked');
      }
    });
  }
  function fitTrackedUsers() {
    var ids = Object.keys(trackedUserIds);
    if (ids.length === 0) return;
    var latlngs = [];
    ids.forEach(function(uid) {
      if (personnelMarkers[uid]) latlngs.push(personnelMarkers[uid].getLatLng());
    });
    if (latlngs.length === 1) {
      map.flyTo(latlngs[0], Math.max(map.getZoom(), 16), {duration: 0.6});
    } else if (latlngs.length > 1) {
      map.flyToBounds(L.latLngBounds(latlngs).pad(0.3), {duration: 0.6, maxZoom: 17});
    }
  }
  var currentLegendHighlight = null;
  function matchesLegendFilter(pData, filter) {
    if (!filter) return true;
    if (filter === 'safe') return pData.status === 'confirmed';
    if (filter === 'pending') return pData.status !== 'confirmed' && pData.status !== 'need_help';
    if (filter === 'help') return pData.status === 'need_help';
    if (filter === 'aramco') return pData.userType !== 'Contract';
    if (filter === 'contractor') return pData.userType === 'Contract';
    return true;
  }
  function setLegendHighlight(filter) {
    currentLegendHighlight = filter || null;
    Object.keys(personnelMarkers).forEach(function(uid) {
      var el = personnelMarkers[uid].getElement();
      if (!el) return;
      var dot = el.querySelector('.personnel-dot');
      if (!dot) return;
      var pd = personnelData[uid];
      if (!currentLegendHighlight || !pd) {
        dot.classList.remove('dimmed');
        dot.classList.remove('highlighted');
      } else if (matchesLegendFilter(pd, currentLegendHighlight)) {
        dot.classList.remove('dimmed');
        dot.classList.add('highlighted');
      } else {
        dot.classList.add('dimmed');
        dot.classList.remove('highlighted');
      }
    });
  }
  function syncPersonnel(list) {
    var seen = {};
    list.forEach(function(p) {
      seen[p.userId] = true;
      personnelData[p.userId] = { status: p.status, userType: p.userType };
      var statusClass;
      if (p.status === 'confirmed') { statusClass = 'safe'; }
      else if (p.status === 'need_help') { statusClass = 'need-help'; }
      else { statusClass = 'outside'; }
      var escClass = '';
      if (p.escalationLevel >= 2) { escClass = ' esc-critical'; }
      else if (p.escalationLevel === 1) { escClass = ' escalated'; }
      var shapeClass = (p.userType === 'Contract') ? ' square' : '';
      var trackClass = trackedUserIds[p.userId] ? ' tracked' : '';
      var dimClass = '';
      if (currentLegendHighlight) {
        dimClass = matchesLegendFilter({status: p.status, userType: p.userType}, currentLegendHighlight) ? ' highlighted' : ' dimmed';
      }
      var intelClass = intelFocusedIds[p.userId] ? ' intel-focus' : '';
      var fullClass = 'personnel-dot ' + statusClass + shapeClass + escClass + trackClass + dimClass + intelClass;
      if (personnelMarkers[p.userId]) {
        personnelMarkers[p.userId].setLatLng([p.lat, p.lng]);
        var el = personnelMarkers[p.userId].getElement();
        if (el) {
          var dot = el.querySelector('.personnel-dot');
          if (dot) dot.className = fullClass;
        }
      } else {
        var m = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: 'shelter-icon',
            html: '<div class="personnel-dot-wrap"><div class="' + fullClass + '"></div></div>',
            iconAnchor: [12, 12],
            iconSize: [24, 24],
          }),
          zIndexOffset: 500,
          interactive: true,
        }).addTo(map);
        (function(uid) {
          m.on('click', function() {
            window.parent.postMessage(JSON.stringify({type:'personnel_select', userId: uid}), '*');
          });
        })(p.userId);
        personnelMarkers[p.userId] = m;
      }
    });
    Object.keys(personnelMarkers).forEach(function(id) {
      if (!seen[id]) {
        map.removeLayer(personnelMarkers[id]);
        delete personnelMarkers[id];
        delete personnelData[id];
      }
    });
  }

  var hazardCircles = {};
  function syncHazardZones(list) {
    var seen = {};
    list.forEach(function(hz) {
      seen[hz.id] = true;
      if (hazardCircles[hz.id]) {
        hazardCircles[hz.id].hot.setLatLng([hz.centerLat, hz.centerLng]);
        hazardCircles[hz.id].hot.setRadius(hz.hotRadius);
        hazardCircles[hz.id].warm.setLatLng([hz.centerLat, hz.centerLng]);
        hazardCircles[hz.id].warm.setRadius(hz.warmRadius);
        hazardCircles[hz.id].cold.setLatLng([hz.centerLat, hz.centerLng]);
        hazardCircles[hz.id].cold.setRadius(hz.coldRadius);
      } else {
        var cold = L.circle([hz.centerLat, hz.centerLng], {
          radius: hz.coldRadius, color: '#34D399', fillColor: '#34D399',
          fillOpacity: 0.08, weight: 1.5, interactive: false,
        }).addTo(map);
        var warm = L.circle([hz.centerLat, hz.centerLng], {
          radius: hz.warmRadius, color: '#FBBF24', fillColor: '#FBBF24',
          fillOpacity: 0.12, weight: 1.5, interactive: false,
        }).addTo(map);
        var hot = L.circle([hz.centerLat, hz.centerLng], {
          radius: hz.hotRadius, color: '#F87171', fillColor: '#F87171',
          fillOpacity: 0.18, weight: 2, interactive: false,
        }).addTo(map);
        hazardCircles[hz.id] = { hot: hot, warm: warm, cold: cold };
      }
    });
    Object.keys(hazardCircles).forEach(function(idStr) {
      if (!seen[idStr]) {
        map.removeLayer(hazardCircles[idStr].hot);
        map.removeLayer(hazardCircles[idStr].warm);
        map.removeLayer(hazardCircles[idStr].cold);
        delete hazardCircles[idStr];
      }
    });
  }

  var locPolygons = {};
  var locLabels = {};
  var selectedLocId = null;
  var highlightedLocIds = [];
  var locEditPoly = null;
  var locEditMarkers = [];
  var locEditPoints = [];
  var locEditId = null;

  function addLocPolygon(loc) {
    removeLocPolygon(loc.id);
    if (!loc.polygonPoints || loc.polygonPoints.length < 3) return;
    var coords = loc.polygonPoints.map(function(p){return [p.lat, p.lng]});
    var isSel = loc.id === selectedLocId;
    var isHL = highlightedLocIds.indexOf(loc.id) >= 0;
    var fillOp = isSel ? 0.25 : isHL ? 0.2 : 0.08;
    var weight = isSel ? 2 : isHL ? 1.5 : 1;
    var color = isSel ? '#4285F4' : isHL ? '#FBBF24' : '#818CF8';
    var poly = L.polygon(coords, {
      color: color, fillColor: color,
      fillOpacity: fillOp, weight: weight,
      dashArray: '4,4',
    }).addTo(map);
    poly.on('click', function() {
      if (!tapEnabled) {
        window.parent.postMessage(JSON.stringify({type:'location_select', id: loc.id}), '*');
      }
    });
    locPolygons[loc.id] = { layer: poly, data: loc };
    var cLat = loc.polygonPoints.reduce(function(s,p){return s+p.lat},0) / loc.polygonPoints.length;
    var cLng = loc.polygonPoints.reduce(function(s,p){return s+p.lng},0) / loc.polygonPoints.length;
    var label = L.marker([cLat, cLng], {
      icon: L.divIcon({
        className: 'shelter-icon',
        html: '<div class="loc-label-inner">' + loc.name + '</div>',
        iconAnchor: [30, 18],
      }),
      interactive: false,
      zIndexOffset: 200,
    }).addTo(map);
    locLabels[loc.id] = label;
  }

  function removeLocPolygon(id) {
    if (locPolygons[id]) { map.removeLayer(locPolygons[id].layer); delete locPolygons[id]; }
    if (locLabels[id]) { map.removeLayer(locLabels[id]); delete locLabels[id]; }
  }

  function refreshAllLocStyles() {
    Object.keys(locPolygons).forEach(function(idStr) {
      var entry = locPolygons[idStr];
      if (entry && entry.data) addLocPolygon(entry.data);
    });
  }

  function startLocEdit(locId, points, color) {
    clearLocEdit();
    locEditId = locId;
    locEditPoints = points.map(function(p){return {lat:p.lat,lng:p.lng}});
    var editColor = color || '#4285F4';
    locEditPoly = L.polygon(locEditPoints.map(function(p){return [p.lat,p.lng]}), {
      color: editColor, fillColor: editColor,
      fillOpacity: 0.25, weight: 3,
    }).addTo(map);
    locEditPoints.forEach(function(pt, idx) {
      var m = L.marker([pt.lat, pt.lng], {
        draggable: true,
        icon: L.divIcon({
          className: 'edit-vertex',
          html: '<div class="vertex-outer"><div class="vertex-inner" style="background:' + editColor + ';"></div><div class="vertex-num">' + (idx+1) + '</div></div>',
          iconAnchor: [24, 24],
        })
      }).addTo(map);
      m.on('dragstart', function() { vertexDragging = true; map.dragging.disable(); });
      m.on('drag', function(e) {
        var ll = e.target.getLatLng();
        locEditPoints[idx] = {lat: ll.lat, lng: ll.lng};
        locEditPoly.setLatLngs(locEditPoints.map(function(p){return [p.lat,p.lng]}));
        window.parent.postMessage(JSON.stringify({type:'loc_edit_points', points: locEditPoints}), '*');
      });
      m.on('dragend', function() { map.dragging.enable(); vertexDragging = false; });
      locEditMarkers.push(m);
    });
    editModeActive = true;
    map.fitBounds(locEditPoly.getBounds(), {padding: [60, 60]});
  }

  function clearLocEdit() {
    if (locEditPoly) { map.removeLayer(locEditPoly); locEditPoly = null; }
    locEditMarkers.forEach(function(m) { map.removeLayer(m); });
    locEditMarkers = [];
    locEditPoints = [];
    locEditId = null;
    editModeActive = false;
  }

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
            weight: isSel ? 2.5 : 1.2,
            fillOpacity: isSel ? 0.25 : zp.origOpacity
          });
        });
      }
      if (d.type === 'update_zone_active') {
        allZonePolygons.forEach(function(zp) {
          if (zp.id === d.id) {
            zp.isActive = d.isActive;
            var baseOpacity = d.isActive ? 0.1 : 0.04;
            zp.origOpacity = baseOpacity;
            zp.layer.setStyle({
              color: d.isActive ? zp.origColor : '#6B728080',
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
        var ctrl = document.getElementById('gm-controls');
        if (ctrl) ctrl.style.display = d.visible ? '' : 'none';
      }
      if (d.type === 'sync_shelters' && Array.isArray(d.shelters)) {
        var existingIds = {};
        d.shelters.forEach(function(s) { existingIds[s.id] = true; addShelterMarker(s); });
        Object.keys(shelterMarkers).forEach(function(idStr) {
          if (!existingIds[idStr]) removeShelterMarker(parseInt(idStr));
        });
        updateShelterClustering();
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
      if (d.type === 'sync_personnel' && Array.isArray(d.personnel)) {
        syncPersonnel(d.personnel);
      }
      if (d.type === 'set_tracked_users' && Array.isArray(d.userIds)) {
        setTrackedUsers(d.userIds);
      }
      if (d.type === 'set_legend_highlight') {
        setLegendHighlight(d.filter || null);
      }
      if (d.type === 'fit_tracked_users') {
        fitTrackedUsers();
      }
      if (d.type === 'focus_critical_users' && Array.isArray(d.userIds) && d.userIds.length > 0) {
        intelFocusedIds = {};
        var cBounds = [];
        d.userIds.forEach(function(uid) {
          intelFocusedIds[uid] = true;
          if (personnelMarkers[uid]) {
            cBounds.push(personnelMarkers[uid].getLatLng());
            var cel = personnelMarkers[uid].getElement();
            if (cel) { var cd = cel.querySelector('.personnel-dot'); if (cd && cd.className.indexOf('intel-focus') === -1) cd.className += ' intel-focus'; }
            personnelMarkers[uid].setZIndexOffset(2000);
          }
        });
        if (cBounds.length > 0) {
          map.fitBounds(L.latLngBounds(cBounds).pad(0.3), {duration: 0.6, maxZoom: 17});
        }
      }
      if (d.type === 'clear_intel_focus') {
        intelFocusedIds = {};
        Object.keys(personnelMarkers).forEach(function(uid) {
          var el = personnelMarkers[uid].getElement();
          if (el) { var dot = el.querySelector('.personnel-dot'); if (dot) dot.className = dot.className.replace(/ ?intel-focus/g, ''); }
          personnelMarkers[uid].setZIndexOffset(500);
        });
      }
      if (d.type === 'sync_hazard_zones' && Array.isArray(d.hazardZones)) {
        syncHazardZones(d.hazardZones);
      }
      if (d.type === 'sync_locations' && Array.isArray(d.locations)) {
        var existingLocIds = {};
        d.locations.forEach(function(loc) { existingLocIds[loc.id] = true; addLocPolygon(loc); });
        Object.keys(locPolygons).forEach(function(idStr) {
          if (!existingLocIds[idStr]) removeLocPolygon(parseInt(idStr));
        });
      }
      if (d.type === 'select_location') {
        selectedLocId = d.id;
        refreshAllLocStyles();
      }
      if (d.type === 'highlight_locations') {
        highlightedLocIds = Array.isArray(d.ids) ? d.ids : [];
        refreshAllLocStyles();
      }
      if (d.type === 'start_loc_edit') {
        startLocEdit(d.id, d.points || [], d.color);
      }
      if (d.type === 'clear_loc_edit') {
        clearLocEdit();
      }
      if (d.type === 'add_loc_edit_point' && typeof d.lat === 'number') {
        locEditPoints.push({lat: d.lat, lng: d.lng});
        if (locEditPoly) {
          locEditPoly.setLatLngs(locEditPoints.map(function(p){return [p.lat,p.lng]}));
        } else {
          locEditPoly = L.polygon(locEditPoints.map(function(p){return [p.lat,p.lng]}), {
            color: '#4285F4', fillColor: '#4285F4',
            fillOpacity: 0.25, weight: 3,
          }).addTo(map);
        }
        var nm = L.marker([d.lat, d.lng], {
          draggable: true,
          icon: L.divIcon({
            className: 'edit-vertex',
            html: '<div class="vertex-outer"><div class="vertex-inner" style="background:#4285F4;"></div><div class="vertex-num">' + locEditPoints.length + '</div></div>',
            iconAnchor: [24, 24],
          })
        }).addTo(map);
        var capturedIdx = locEditPoints.length - 1;
        nm.on('dragstart', function() { vertexDragging = true; map.dragging.disable(); });
        nm.on('drag', function(e) {
          var ll = e.target.getLatLng();
          locEditPoints[capturedIdx] = {lat: ll.lat, lng: ll.lng};
          if (locEditPoly) locEditPoly.setLatLngs(locEditPoints.map(function(p){return [p.lat,p.lng]}));
          window.parent.postMessage(JSON.stringify({type:'loc_edit_points', points: locEditPoints}), '*');
        });
        nm.on('dragend', function() { map.dragging.enable(); vertexDragging = false; });
        locEditMarkers.push(nm);
        window.parent.postMessage(JSON.stringify({type:'loc_edit_points', points: locEditPoints}), '*');
      }
      if (d.type === 'undo_loc_edit_point' && locEditMarkers.length > 0) {
        var lastM = locEditMarkers.pop();
        map.removeLayer(lastM);
        locEditPoints.pop();
        if (locEditPoly) locEditPoly.setLatLngs(locEditPoints.map(function(p){return [p.lat,p.lng]}));
        window.parent.postMessage(JSON.stringify({type:'loc_edit_points', points: locEditPoints}), '*');
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
  locations,
  selectedLocationId,
  onLocationPress,
  highlightedLocationIds,
  editingLocationId,
  editingLocationPoints,
  onEditingLocationPointsChange,
  personnelLocations,
  onPersonnelPress,
  hazardZones,
  trackedUserIds,
  fitTrackedTrigger,
  legendHighlight,
}: ZoneMapProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevTapCountRef = useRef(0);
  const prevFlyToRef = useRef<number | null | undefined>(undefined);
  const initialEditPointsRef = useRef<LatLng[] | undefined>(undefined);
  const prevEditingZoneIdRef = useRef<number | null | undefined>(undefined);

  if (editingZoneId !== prevEditingZoneIdRef.current) {
    prevEditingZoneIdRef.current = editingZoneId;
    initialEditPointsRef.current = editingZoneId != null ? editingPoints : undefined;
  }

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

  const mapHtml = useMemo(
    () => generateLeafletHtml(zones, editingZoneId, initialEditPointsRef.current, GMAPS_KEY),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [zonesStructureKey, editingZoneId]
  );

  const postToIframe = (msg: Record<string, unknown>) => {
    iframeRef.current?.contentWindow?.postMessage(JSON.stringify(msg), "*");
  };

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "select_zone", id: selectedZoneId }), 80);
    return () => clearTimeout(t);
  }, [selectedZoneId]);

  const prevZonesRef = useRef<Zone[]>([]);
  useEffect(() => {
    const prev = prevZonesRef.current;
    prevZonesRef.current = zones;
    if (prev.length === 0) return;
    for (const z of zones) {
      const old = prev.find((p) => p.id === z.id);
      if (old && old.isActive !== z.isActive) {
        postToIframe({ type: "update_zone_active", id: z.id, isActive: z.isActive });
      }
    }
  }, [zones]);

  useEffect(() => {
    const enabled = editingZoneId != null;
    const t = setTimeout(() => postToIframe({ type: "set_edit_mode", enabled }), 120);
    return () => clearTimeout(t);
  }, [editingZoneId]);

  useEffect(() => {
    const enabled = drawMode === "tap";
    const t = setTimeout(() => postToIframe({ type: "set_tap_mode", enabled }), 100);
    return () => clearTimeout(t);
  }, [drawMode]);

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "set_crosshair", visible: showCenterCrosshair }), 100);
    return () => clearTimeout(t);
  }, [showCenterCrosshair]);

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "set_location_button", visible: showLocationButton }), 100);
    return () => clearTimeout(t);
  }, [showLocationButton]);

  useEffect(() => {
    if (tapPointCount < prevTapCountRef.current) {
      postToIframe({ type: "undo_tap" });
    }
    prevTapCountRef.current = tapPointCount;
  }, [tapPointCount]);

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
        if (data.type === "location_select" && typeof data.id === "number" && onLocationPress) {
          onLocationPress(data.id);
        }
        if (data.type === "loc_edit_points" && Array.isArray(data.points) && onEditingLocationPointsChange) {
          onEditingLocationPointsChange(data.points);
        }
        if (data.type === "personnel_select" && typeof data.userId === "number" && onPersonnelPress) {
          onPersonnelPress(data.userId);
        }
      } catch {}
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onZonePress, onEditingPointsChange, onMapTap, onMapCenterChange, onShelterPress, onLocationPress, onEditingLocationPointsChange, onPersonnelPress]);

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

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "select_shelter", id: selectedShelterId ?? null }), 80);
    return () => clearTimeout(t);
  }, [selectedShelterId]);

  useEffect(() => {
    const t = setTimeout(() => postToIframe({
      type: "set_nearest_shelter",
      id: nearestShelterId ?? null,
      userLat: userLocation?.lat,
      userLng: userLocation?.lng,
    }), 80);
    return () => clearTimeout(t);
  }, [nearestShelterId, userLocation]);

  useEffect(() => {
    if (!userLocation) return;
    const t = setTimeout(() => postToIframe({ type: "set_user_location", lat: userLocation.lat, lng: userLocation.lng }), 80);
    return () => clearTimeout(t);
  }, [userLocation]);

  const prevLocationsRef = useRef<string>("");
  useEffect(() => {
    prevLocationsRef.current = "";
  }, [mapHtml]);
  useEffect(() => {
    if (!locations) return;
    const key = JSON.stringify(locations.map(l => ({ id: l.id, name: l.name, polygonPoints: l.polygonPoints })));
    if (key === prevLocationsRef.current) return;
    prevLocationsRef.current = key;
    const t = setTimeout(() => postToIframe({ type: "sync_locations", locations }), 200);
    return () => clearTimeout(t);
  }, [locations, mapHtml]);

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "select_location", id: selectedLocationId ?? null }), 80);
    return () => clearTimeout(t);
  }, [selectedLocationId]);

  useEffect(() => {
    const t = setTimeout(() => postToIframe({ type: "highlight_locations", ids: highlightedLocationIds ?? [] }), 80);
    return () => clearTimeout(t);
  }, [highlightedLocationIds]);

  useEffect(() => {
    if (editingLocationId != null && editingLocationPoints) {
      const t = setTimeout(() => postToIframe({ type: "start_loc_edit", id: editingLocationId, points: editingLocationPoints }), 150);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => postToIframe({ type: "clear_loc_edit" }), 80);
      return () => clearTimeout(t);
    }
  }, [editingLocationId]);

  useEffect(() => {
    if (!personnelLocations || personnelLocations.length === 0) {
      postToIframe({ type: "sync_personnel", personnel: [] });
      return;
    }
    const t = setTimeout(() => postToIframe({ type: "sync_personnel", personnel: personnelLocations }), 80);
    return () => clearTimeout(t);
  }, [personnelLocations]);

  useEffect(() => {
    postToIframe({ type: "set_tracked_users", userIds: trackedUserIds || [] });
  }, [trackedUserIds]);

  useEffect(() => {
    postToIframe({ type: "set_legend_highlight", filter: legendHighlight || null });
  }, [legendHighlight]);

  const prevFitTriggerRef = useRef(0);
  useEffect(() => {
    if (fitTrackedTrigger && fitTrackedTrigger !== prevFitTriggerRef.current) {
      prevFitTriggerRef.current = fitTrackedTrigger;
      const t = setTimeout(() => postToIframe({ type: "fit_tracked_users" }), 100);
      return () => clearTimeout(t);
    }
  }, [fitTrackedTrigger]);

  useEffect(() => {
    if (!hazardZones || hazardZones.length === 0) {
      postToIframe({ type: "sync_hazard_zones", hazardZones: [] });
      return;
    }
    const active = hazardZones.filter((hz) => hz.isActive);
    const t = setTimeout(() => postToIframe({ type: "sync_hazard_zones", hazardZones: active }), 120);
    return () => clearTimeout(t);
  }, [hazardZones]);

  const blobUrl = useMemo(() => {
    const blob = new Blob([mapHtml], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [mapHtml]);

  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        ref={(el: any) => {
          iframeRef.current = el;
        }}
        src={blobUrl}
        style={{ width: "100%", height: "100%", border: "none" }}
        allow="geolocation"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
});
