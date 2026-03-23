import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Alert as RNAlert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRefreshOnFocus } from "@/hooks/useRefreshOnFocus";
import { ZoneMap } from "@/components/map";
import type { DrawMode } from "@/components/map";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { pointInPolygon, haversineDistance } from "@/utils/geo";
import { useStore, selectActiveAlert, alertEq } from "@/store";
import type { Zone, ZoneType, LatLng, Shelter, Location } from "@/types";

const { height: SCREEN_H } = Dimensions.get("window");

const ZONE_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1",
];

const ZONE_TYPES: { key: ZoneType; label: string }[] = [
  { key: "CPF", label: "CPF" },
  { key: "Custom", label: "Custom" },
];

type Mode = "view" | "pick_shape" | "draw" | "edit";

export default function ZonesScreen() {
  const focusCount = useRefreshOnFocus();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const allZonesRaw = useStore((s) => s.zones);
  const zones = useMemo(() => (allZonesRaw || []).filter((z: any) => !z.isArchived), [allZonesRaw]);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);
  const locations = useStore((s) => s.locations) ?? [];
  const updateLocation = useStore((s) => s.updateLocation);
  const shelters = useStore((s) => s.shelters) ?? [];
  const addShelter = useStore((s) => s.addShelter);
  const updateShelter = useStore((s) => s.updateShelter);
  const deleteShelter = useStore((s) => s.deleteShelter);
  const linkShelterToLocations = useStore((s) => s.linkShelterToLocations);
  const activeAlert = useStore(selectActiveAlert, alertEq);
  // Show Warning Zone button when there is ANY active alert — either a real
  // alert record in alerts[] or a zone-level alert (zones[].alertActive).
  const hasRealAlert = useStore((s) => (Array.isArray(s.alerts) && s.alerts.some((a) => a.isActive)) || (Array.isArray(s.zones) && s.zones.some((z) => z.isActive && z.alertActive)));
  const addHazardZone = useStore((s) => s.addHazardZone);
  const removeHazardZone = useStore((s) => s.removeHazardZone);
  const unlockHazardZone = useStore((s) => s.unlockHazardZone);
  const applyDefaultsToHazardZone = useStore((s) => s.applyDefaultsToHazardZone);
  const hazardZones = useStore((s) => s.hazardZones);
  const settings = useStore((s) => s.settings);
  const emergencyModes = useStore((s) => s.emergencyModes);

  // ═══ ZONE_MAP DEBUG — pre-render diagnostics ═══
  useMemo(() => {
    const tag = '[ZONE_MAP_DEBUG]';
    console.log(`${tag} ── render diagnostics ──`);

    // 1) zones
    console.log(`${tag} zones type=${typeof allZonesRaw}, isArray=${Array.isArray(allZonesRaw)}, count=${Array.isArray(allZonesRaw) ? allZonesRaw.length : 'N/A'}`);
    if (!allZonesRaw) console.error(`${tag} CRITICAL: zones is ${allZonesRaw}`);
    if (allZonesRaw && !Array.isArray(allZonesRaw)) console.error(`${tag} CRITICAL: zones is NOT an array, got ${typeof allZonesRaw}`);

    // 2) filtered zones
    console.log(`${tag} filtered zones count=${zones.length}`);

    // 3) zone boundaries & coordinates
    if (Array.isArray(zones)) {
      zones.forEach((z: any, i: number) => {
        if (!z) {
          console.error(`${tag} CRITICAL: zone[${i}] is ${z}`);
          return;
        }
        if (z.boundaryType === undefined) console.error(`${tag} zone[${i}] "${z.name}" has undefined boundaryType`);
        if (!Array.isArray(z.polygonPoints)) {
          console.error(`${tag} CRITICAL: zone[${i}] "${z.name}" polygonPoints is NOT array: ${typeof z.polygonPoints}`);
          return;
        }
        if (z.polygonPoints.length === 0 && !z.center) {
          console.warn(`${tag} zone[${i}] "${z.name}" has empty polygon AND no center`);
        }
        z.polygonPoints.forEach((pt: any, pi: number) => {
          if (!pt) {
            console.error(`${tag} zone[${i}] "${z.name}" polygonPoints[${pi}] is ${pt}`);
            return;
          }
          if (typeof pt.lat !== 'number' || typeof pt.lng !== 'number') {
            console.error(`${tag} zone[${i}] "${z.name}" polygonPoints[${pi}] invalid: lat=${pt.lat}(${typeof pt.lat}) lng=${pt.lng}(${typeof pt.lng})`);
          }
          if (isNaN(pt.lat) || isNaN(pt.lng)) {
            console.error(`${tag} zone[${i}] "${z.name}" polygonPoints[${pi}] NaN: lat=${pt.lat} lng=${pt.lng}`);
          }
        });
        if (z.center) {
          if (typeof z.center.lat !== 'number' || typeof z.center.lng !== 'number') {
            console.error(`${tag} zone[${i}] "${z.name}" center invalid: lat=${z.center.lat} lng=${z.center.lng}`);
          }
          if (isNaN(z.center.lat) || isNaN(z.center.lng)) {
            console.error(`${tag} zone[${i}] "${z.name}" center NaN: lat=${z.center.lat} lng=${z.center.lng}`);
          }
        }
      });
    }

    // 4) locations
    console.log(`${tag} locations type=${typeof locations}, isArray=${Array.isArray(locations)}, count=${Array.isArray(locations) ? locations.length : 'N/A'}`);

    // 5) shelters
    console.log(`${tag} shelters type=${typeof shelters}, isArray=${Array.isArray(shelters)}, count=${Array.isArray(shelters) ? shelters.length : 'N/A'}`);

    // 6) emergencyModes — shelterInZones & blackoutZones
    console.log(`${tag} emergencyModes=${JSON.stringify(emergencyModes ? { shelterIn: emergencyModes.shelterIn, blackout: emergencyModes.blackout, shelterInZones: emergencyModes.shelterInZones, blackoutZones: emergencyModes.blackoutZones } : null)}`);
    if (emergencyModes) {
      if (!Array.isArray(emergencyModes.shelterInZones)) console.error(`${tag} CRITICAL: shelterInZones is NOT array: ${typeof emergencyModes.shelterInZones}`);
      if (!Array.isArray(emergencyModes.blackoutZones)) console.error(`${tag} CRITICAL: blackoutZones is NOT array: ${typeof emergencyModes.blackoutZones}`);
    } else {
      console.error(`${tag} CRITICAL: emergencyModes is ${emergencyModes}`);
    }

    // 7) hazardZones
    console.log(`${tag} hazardZones type=${typeof hazardZones}, isArray=${Array.isArray(hazardZones)}, count=${Array.isArray(hazardZones) ? hazardZones.length : 'N/A'}`);

    // 8) store readiness
    console.log(`${tag} store ready check: zones=${!!allZonesRaw}, locations=${!!locations}, shelters=${!!shelters}, emergencyModes=${!!emergencyModes}`);

    console.log(`${tag} ── end diagnostics ──`);
  }, [allZonesRaw, zones, locations, shelters, emergencyModes, hazardZones]);
  // ═══ END ZONE_MAP DEBUG ═══

  const [selectedHazardId, setSelectedHazardId] = useState<number | null>(null);

  const [mode, setMode] = useState<Mode>("view");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [selectedShelterId, setSelectedShelterId] = useState<number | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [addingShelter, setAddingShelter] = useState(false);
  const [flyToZoneId, setFlyToZoneId] = useState<number | null>(null);
  const [tapPoints, setTapPoints] = useState<LatLng[]>([]);
  const [editingPoints, setEditingPoints] = useState<LatLng[]>([]);

  const [locDrawMode, setLocDrawMode] = useState(false);
  const [locDrawLocationId, setLocDrawLocationId] = useState<number | null>(null);
  const [locEditPoints, setLocEditPoints] = useState<LatLng[]>([]);
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);

  const [linkingModal, setLinkingModal] = useState(false);
  const [linkingShelterId, setLinkingShelterId] = useState<number | null>(null);
  const [linkingSelectedIds, setLinkingSelectedIds] = useState<number[]>([]);

  const [shelterNameModal, setShelterNameModal] = useState(false);
  const [pendingShelterLat, setPendingShelterLat] = useState(0);
  const [pendingShelterLng, setPendingShelterLng] = useState(0);
  const [shelterFormName, setShelterFormName] = useState("");
  const [editingShelter, setEditingShelter] = useState<Shelter | null>(null);

  const [placingHazard, setPlacingHazard] = useState(false);
  const [hazardCenter, setHazardCenter] = useState<LatLng | null>(null);

  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);
  const [formLocationId, setFormLocationId] = useState<number | null>(null);

  const pendingPointsRef = useRef<LatLng[]>([]);
  const mapCenterRef = useRef<LatLng>({ lat: 25.082, lng: 48.175 });
  const originalPointsRef = useRef<LatLng[]>([]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  // ─── Map handlers ───
  const handleMapCenterChange = useCallback((c: LatLng) => {
    mapCenterRef.current = c;
  }, []);

  const handleZonePress = useCallback((id: number) => {
    if (mode !== "view") return;
    setSelectedZoneId((prev) => (prev === id ? null : id));
    setSelectedShelterId(null);
    setSelectedLocationId(null);
  }, [mode]);

  const handleMapTap = useCallback((pt: LatLng) => {
    if (placingHazard) {
      setHazardCenter(pt);
      return;
    }
    if (addingShelter) {
      setPendingShelterLat(pt.lat);
      setPendingShelterLng(pt.lng);
      setShelterFormName(`Shelter ${String.fromCharCode(65 + shelters.length)}`);
      setShelterNameModal(true);
      return;
    }
    if (locDrawMode) {
      setLocEditPoints((prev) => [...prev, pt]);
      return;
    }
    if (mode !== "draw") return;
    setTapPoints((p) => [...p, pt]);
  }, [mode, addingShelter, shelters.length, locDrawMode, placingHazard]);

  const handleShelterPress = useCallback((shelterId: number) => {
    setSelectedShelterId((prev) => (prev === shelterId ? null : shelterId));
    setSelectedZoneId(null);
    setSelectedLocationId(null);
  }, []);

  const handleSaveShelter = useCallback(() => {
    if (!shelterFormName.trim()) return;
    const pt = { lat: pendingShelterLat, lng: pendingShelterLng };
    let matchedZoneId = 0;
    const polyZone = zones.find(
      (z) => z.polygonPoints.length >= 3 && pointInPolygon(pt, z.polygonPoints)
    );
    if (polyZone) {
      matchedZoneId = polyZone.id;
    } else {
      let minDist = Infinity;
      for (const z of zones) {
        if (!z.center) continue;
        const d = haversineDistance(pt.lat, pt.lng, z.center.lat, z.center.lng);
        if (d < minDist) { minDist = d; matchedZoneId = z.id; }
      }
    }
    addShelter({
      name: shelterFormName.trim(),
      lat: pendingShelterLat,
      lng: pendingShelterLng,
      zoneId: matchedZoneId,
      isActive: true,
      linkedLocationIds: [],
    });
    setShelterNameModal(false);
    setShelterFormName("");
    setAddingShelter(false);
  }, [shelterFormName, pendingShelterLat, pendingShelterLng, zones, addShelter]);

  const handleToggleShelterAdd = useCallback(() => {
    setAddingShelter((p) => !p);
    setSelectedShelterId(null);
    setSelectedZoneId(null);
  }, []);

  const handleToggleShelter = useCallback((sh: Shelter) => {
    updateShelter(sh.id, { isActive: !sh.isActive });
  }, [updateShelter]);

  const handleDeleteShelter = useCallback(() => {
    if (!selectedShelterId) return;
    deleteShelter(selectedShelterId);
    setSelectedShelterId(null);
  }, [selectedShelterId, deleteShelter]);

  const handleEditShelterName = useCallback(() => {
    const sh = shelters.find((s) => s.id === selectedShelterId);
    if (!sh) return;
    setEditingShelter(sh);
    setShelterFormName(sh.name);
    setShelterNameModal(true);
  }, [selectedShelterId, shelters]);

  const handleSaveEditShelter = useCallback(() => {
    if (!editingShelter || !shelterFormName.trim()) return;
    updateShelter(editingShelter.id, { name: shelterFormName.trim() });
    setShelterNameModal(false);
    setShelterFormName("");
    setEditingShelter(null);
  }, [editingShelter, shelterFormName, updateShelter]);

  // ─── HAZARD ZONE flow ───
  const handleStartPlacingHazard = useCallback(() => {
    // Guard: allow placement when any alert is active (real or zone-level)
    const state = useStore.getState();
    const hasAny = state.alerts.some((a: { isActive: boolean }) => a.isActive) || state.zones.some((z: { isActive?: boolean; alertActive?: boolean }) => z.isActive && z.alertActive);
    if (!hasAny) {
      RNAlert.alert("No active alert", "Cannot place a warning zone — no active alert found.");
      return;
    }
    setPlacingHazard(true);
    setHazardCenter(null);
    setSelectedZoneId(null);
    setSelectedShelterId(null);
    setSelectedLocationId(null);
  }, []);

  const handleConfirmHazard = useCallback(() => {
    if (!hazardCenter) return;
    // Check for any active alert (real or zone-level)
    const state = useStore.getState();
    const hasAny = state.alerts.some((a: { isActive: boolean }) => a.isActive) || state.zones.some((z: { isActive?: boolean; alertActive?: boolean }) => z.isActive && z.alertActive);
    if (!hasAny) {
      setPlacingHazard(false);
      setHazardCenter(null);
      RNAlert.alert("No active alert", "Cannot place a warning zone — no active alert found.");
      return;
    }
    addHazardZone({ centerLat: hazardCenter.lat, centerLng: hazardCenter.lng });
    setPlacingHazard(false);
    setHazardCenter(null);
  }, [hazardCenter, addHazardZone]);

  const handleCancelHazard = useCallback(() => {
    setPlacingHazard(false);
    setHazardCenter(null);
  }, []);

  // Derive a stable primitive for alert identity — avoids useMemo recomputing
  // when the activeAlert object reference changes but the id is the same.
  const alertId = activeAlert?.id ?? null;

  const activeHazardZones = useMemo(
    () => {
      if (alertId == null) return [];
      return hazardZones.filter((hz) => hz.isActive && hz.alertId === alertId);
    },
    [hazardZones, alertId]
  );

  // Reset hazard placement state when alert changes or disappears
  useEffect(() => {
    setPlacingHazard(false);
    setHazardCenter(null);
    setSelectedHazardId(null);
  }, [alertId]);

  // ─── CREATE flow ───
  const handlePressAdd = useCallback(() => {
    const used = zones.map((z) => z.color);
    setFormColor(ZONE_COLORS.find((c) => !used.includes(c)) || ZONE_COLORS[0]);
    setFormName("");
    setFormType("Custom");
    setSelectedZoneId(null);
    setMode("pick_shape");
  }, [zones]);

  const handlePickRect = useCallback(() => {
    const c = mapCenterRef.current;
    const d = 0.004;
    pendingPointsRef.current = [
      { lat: c.lat + d, lng: c.lng - d },
      { lat: c.lat + d, lng: c.lng + d },
      { lat: c.lat - d, lng: c.lng + d },
      { lat: c.lat - d, lng: c.lng - d },
    ];
    setMode("view");
    setShowSaveSheet(true);
  }, []);

  const handlePickDraw = useCallback(() => {
    setTapPoints([]);
    setMode("draw");
  }, []);

  const handleUndoTap = useCallback(() => {
    setTapPoints((p) => p.slice(0, -1));
  }, []);

  const handleFinishDraw = useCallback(() => {
    if (tapPoints.length < 3) return;
    if (selectedZoneId) {
      const pts = [...tapPoints];
      const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
      const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
      updateZone(selectedZoneId, { polygonPoints: pts, center: { lat, lng } });
      setMode("view");
      setTapPoints([]);
      return;
    }
    pendingPointsRef.current = [...tapPoints];
    setMode("view");
    setShowSaveSheet(true);
  }, [tapPoints, selectedZoneId, updateZone]);

  const handleCancelDraw = useCallback(() => {
    setMode("view");
    setTapPoints([]);
  }, []);

  const handleSaveNewZone = useCallback(() => {
    if (!formName.trim()) return;
    const pts = pendingPointsRef.current;
    if (pts.length < 3) return;
    const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
    const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
    addZone({
      name: formName.trim(), type: formType, boundaryType: "Polygon",
      polygonPoints: pts, center: { lat, lng }, isActive: true, color: formColor,
      locationId: formLocationId,
      alertActive: false, alertType: null, alertPriority: null,
      alertMessage: "", alertUpdatedAt: null, alertHistory: [],
    });
    setShowSaveSheet(false);
    setTapPoints([]);
    setFormLocationId(null);
    pendingPointsRef.current = [];
  }, [formName, formType, formColor, formLocationId, addZone]);

  const handleDiscardSave = useCallback(() => {
    setShowSaveSheet(false);
    pendingPointsRef.current = [];
    setTapPoints([]);
    setFormLocationId(null);
  }, []);

  // ─── EDIT flow — direct to boundary ───
  const handleEditZone = useCallback(() => {
    if (!selectedZone) return;
    if (selectedZone.polygonPoints.length === 0) {
      setTapPoints([]);
      setMode("draw");
      return;
    }
    originalPointsRef.current = [...selectedZone.polygonPoints];
    setEditingPoints([...selectedZone.polygonPoints]);
    setMode("edit");
  }, [selectedZone]);

  const handleResetEdit = useCallback(() => {
    setEditingPoints([...originalPointsRef.current]);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!selectedZone || editingPoints.length < 3) return;
    const lat = editingPoints.reduce((s, p) => s + p.lat, 0) / editingPoints.length;
    const lng = editingPoints.reduce((s, p) => s + p.lng, 0) / editingPoints.length;
    updateZone(selectedZone.id, {
      polygonPoints: editingPoints,
      center: { lat, lng },
    });
    setMode("view");
    setEditingPoints([]);
  }, [selectedZone, editingPoints, updateZone]);

  const handleCancelEdit = useCallback(() => {
    setMode("view");
    setEditingPoints([]);
  }, []);

  const handleToggleZone = useCallback(
    (z: Zone) => updateZone(z.id, { isActive: !z.isActive }),
    [updateZone]
  );

  const handleDeleteZone = useCallback(() => {
    if (!selectedZone) return;
    deleteZone(selectedZone.id);
    setSelectedZoneId(null);
  }, [selectedZone, deleteZone]);

  const handleFocusZone = useCallback(() => {
    if (selectedZoneId) setFlyToZoneId(selectedZoneId);
  }, [selectedZoneId]);

  // ─── Derived ───
  const selectedShelter = useMemo(
    () => shelters.find((s) => s.id === selectedShelterId) || null,
    [shelters, selectedShelterId]
  );
  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );
  const highlightedLocationIds = useMemo(() => {
    if (selectedShelter) return selectedShelter.linkedLocationIds || [];
    return [];
  }, [selectedShelter]);
  const locationsForZone = useMemo(() => {
    if (selectedZoneId) return locations.filter((l) => l.zoneId === selectedZoneId);
    return locations;
  }, [locations, selectedZoneId]);

  const drawMode: DrawMode = mode === "draw" || addingShelter || placingHazard ? "tap" : locDrawMode ? "tap" : "none";
  const showCrosshair = mode === "pick_shape";

  // ─── Location handlers ───
  const handleLocationPress = useCallback((locId: number) => {
    if (locDrawMode || mode !== "view") return;
    setSelectedLocationId((prev) => (prev === locId ? null : locId));
    setSelectedZoneId(null);
    setSelectedShelterId(null);
  }, [locDrawMode, mode]);

  const handleStartLocDraw = useCallback((locId: number) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc) return;
    setLocDrawMode(true);
    setLocDrawLocationId(locId);
    setLocEditPoints([]);
    setSelectedLocationId(null);
  }, [locations]);

  const handleStartLocEdit = useCallback((locId: number) => {
    const loc = locations.find((l) => l.id === locId);
    if (!loc || loc.polygonPoints.length < 3) return;
    setEditingLocationId(locId);
    setLocEditPoints([...loc.polygonPoints]);
    setSelectedLocationId(null);
  }, [locations]);

  const handleLocEditPointsChange = useCallback((pts: LatLng[]) => {
    setLocEditPoints(pts);
  }, []);

  const handleSaveLocEdit = useCallback(() => {
    if (editingLocationId && locEditPoints.length >= 3) {
      updateLocation(editingLocationId, { polygonPoints: locEditPoints });
    }
    setEditingLocationId(null);
    setLocEditPoints([]);
  }, [editingLocationId, locEditPoints, updateLocation]);

  const handleCancelLocEdit = useCallback(() => {
    setEditingLocationId(null);
    setLocEditPoints([]);
  }, []);

  const handleClearLocBoundary = useCallback((locId: number) => {
    updateLocation(locId, { polygonPoints: [] });
    setSelectedLocationId(null);
  }, [updateLocation]);

  const handleOpenLinking = useCallback((shId: number) => {
    const sh = shelters.find((s) => s.id === shId);
    if (!sh) return;
    const pt = { lat: sh.lat, lng: sh.lng };
    const containingZone = zones.find(
      (z) => z.polygonPoints.length >= 3 && pointInPolygon(pt, z.polygonPoints)
    );
    if (containingZone && containingZone.id !== sh.zoneId) {
      updateShelter(shId, { zoneId: containingZone.id });
    } else if (!containingZone) {
      let nearestId = sh.zoneId;
      let minDist = Infinity;
      for (const z of zones) {
        if (!z.center) continue;
        const d = haversineDistance(pt.lat, pt.lng, z.center.lat, z.center.lng);
        if (d < minDist) { minDist = d; nearestId = z.id; }
      }
      if (nearestId !== sh.zoneId) {
        updateShelter(shId, { zoneId: nearestId });
      }
    }
    setLinkingShelterId(shId);
    setLinkingSelectedIds([...(sh.linkedLocationIds || [])]);
    setLinkingModal(true);
  }, [shelters, zones, updateShelter]);

  const handleToggleLinkLocation = useCallback((locId: number) => {
    setLinkingSelectedIds((prev) =>
      prev.includes(locId) ? prev.filter((id) => id !== locId) : [...prev, locId]
    );
  }, []);

  const handleSaveLinking = useCallback(() => {
    if (linkingShelterId != null) {
      linkShelterToLocations(linkingShelterId, linkingSelectedIds);
    }
    setLinkingModal(false);
    setLinkingShelterId(null);
    setLinkingSelectedIds([]);
  }, [linkingShelterId, linkingSelectedIds, linkShelterToLocations]);

  return (
    <View style={styles.root}>
      {/* ═══ FULL-SCREEN MAP ═══ */}
      <ErrorBoundary label="ZONE_MAP" onError={(error, stack) => {
        console.error('\n========== ZONE_MAP CRASH ==========');
        console.error('ERROR NAME:', error.name);
        console.error('ERROR MESSAGE:', error.message);
        console.error('STACK:', error.stack);
        const fileMatch = error.stack?.match(/at\s+\S+\s+\(([^)]+):(\d+):\d+\)/);
        console.error('FILE:', fileMatch?.[1] ?? 'unknown');
        console.error('LINE:', fileMatch?.[2] ?? 'unknown');
        console.error('COMPONENT STACK:', stack);
        console.error('=====================================\n');
      }}>
        <ZoneMap
          key={focusCount}
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZonePress={handleZonePress}
          height={SCREEN_H}
          editingZoneId={mode === "edit" ? selectedZoneId : null}
          editingPoints={mode === "edit" ? editingPoints : undefined}
          onEditingPointsChange={setEditingPoints}
          drawMode={drawMode}
          onMapTap={handleMapTap}
          onMapCenterChange={handleMapCenterChange}
          showLocationButton={mode === "view" || mode === "pick_shape" || mode === "draw"}
          tapPointCount={tapPoints.length}
          flyToZoneId={flyToZoneId}
          showCenterCrosshair={showCrosshair}
          shelters={shelters}
          selectedShelterId={selectedShelterId}
          onShelterPress={handleShelterPress}
          locations={locations}
          selectedLocationId={selectedLocationId}
          onLocationPress={handleLocationPress}
          highlightedLocationIds={highlightedLocationIds}
          editingLocationId={editingLocationId}
          editingLocationPoints={editingLocationId ? locEditPoints : undefined}
          onEditingLocationPointsChange={handleLocEditPointsChange}
          hazardZones={activeHazardZones}
        />
      </ErrorBoundary>

      {/* ═══ FLOATING HEADER — VIEW ═══ */}
      {mode === "view" && !addingShelter && !placingHazard && (
        <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
          <Pressable style={styles.fhBtn} onPress={() => { if (router.canGoBack()) router.back(); }} hitSlop={8}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.fhTitle}>
            <Text style={styles.fhTitleText}>Zones</Text>
            <Text style={styles.fhSubtext}>{zones.length} zone{zones.length !== 1 ? "s" : ""} · {shelters.length} shelter{shelters.length !== 1 ? "s" : ""}</Text>
          </View>
          {hasRealAlert && (
            <Pressable style={[styles.fhBtn, { backgroundColor: "#EF4444" }]} onPress={handleStartPlacingHazard} hitSlop={8}>
              <Feather name="alert-triangle" size={18} color="#fff" />
            </Pressable>
          )}
          <Pressable style={[styles.fhBtn, { backgroundColor: "#F59E0B" }]} onPress={handleToggleShelterAdd} hitSlop={8}>
            <Feather name="home" size={18} color="#fff" />
          </Pressable>
          <Pressable style={styles.fhBtnAccent} onPress={handlePressAdd} hitSlop={8}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* ═══ FLOATING HEADER — ADD SHELTER ═══ */}
      {addingShelter && (
        <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
          <Pressable style={styles.fhBtn} onPress={handleToggleShelterAdd} hitSlop={8}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <View style={styles.fhTitle}>
            <Text style={styles.fhTitleText}>Add Shelter</Text>
            <Text style={styles.fhSubtext}>Tap on map to place shelter</Text>
          </View>
        </View>
      )}

      {/* ═══ FLOATING HEADER — PLACE HAZARD ═══ */}
      {placingHazard && (
        <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
          <Pressable style={styles.fhBtn} onPress={handleCancelHazard} hitSlop={8}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <View style={styles.fhTitle}>
            <Text style={[styles.fhTitleText, { color: "#EF4444" }]}>Warning Zone</Text>
            <Text style={styles.fhSubtext}>
              {hazardCenter
                ? `${hazardCenter.lat.toFixed(4)}°N, ${hazardCenter.lng.toFixed(4)}°E`
                : "Tap the map to place center"
              }
            </Text>
          </View>
        </View>
      )}

      {/* ═══ HAZARD PLACEMENT — MODE PILL ═══ */}
      {placingHazard && (
        <View style={[styles.modeHeader, { top: insets.top + 8 + 52 }]}>
          <View style={[styles.modePill, { backgroundColor: "#EF4444" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>WARNING ZONE</Text>
          </View>
          {hazardCenter && (
            <View style={styles.modeCount}>
              <Text style={styles.modeCountText}>
                Hot:{settings.hazardHotRadius || 200}m Warm:{settings.hazardWarmRadius || 500}m Cold:{settings.hazardColdRadius || 1000}m
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ═══ HAZARD PLACEMENT — BOTTOM BAR ═══ */}
      {placingHazard && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawBar}>
            <Pressable style={styles.actionBtn} onPress={handleCancelHazard}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.actionBtnPrimary, { backgroundColor: "#EF4444" }, !hazardCenter && { opacity: 0.3 }]}
              onPress={handleConfirmHazard}
              disabled={!hazardCenter}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Place</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ HAZARD ZONES LIST — bottom chips when active ═══ */}
      {mode === "view" && !addingShelter && !placingHazard && activeHazardZones.length > 0 && !selectedZone && !selectedShelter && !selectedLocation && (
        <View style={[styles.hazardChipBar, { bottom: insets.bottom + (zones.length > 0 ? 56 : 12) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipBarContent}>
            {activeHazardZones.map((hz) => (
              <Pressable
                key={hz.id}
                style={[styles.hazardChip, selectedHazardId === hz.id && styles.hazardChipSelected]}
                onPress={() => setSelectedHazardId(selectedHazardId === hz.id ? null : hz.id)}
              >
                <Feather name="alert-triangle" size={12} color="#EF4444" />
                <Text style={styles.hazardChipText}>
                  WZ {hz.centerLat.toFixed(2)}°
                </Text>
                {hz.isLocked && <Feather name="lock" size={10} color="rgba(255,255,255,0.5)" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ═══ SELECTED HAZARD ZONE — bottom sheet ═══ */}
      {mode === "view" && !addingShelter && !placingHazard && selectedHazardId != null && !selectedZone && !selectedShelter && !selectedLocation && (() => {
        const hz = activeHazardZones.find((h) => h.id === selectedHazardId);
        if (!hz) return null;
        return (
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.bsRow}>
              <View style={[styles.bsDot, { backgroundColor: "#EF4444" }]} />
              <View style={styles.bsInfo}>
                <Text style={styles.bsName}>Warning Zone</Text>
                <Text style={styles.bsMeta}>
                  {hz.centerLat.toFixed(4)}°N, {hz.centerLng.toFixed(4)}°E · {hz.isLocked ? "Locked" : "Unlocked"}
                </Text>
              </View>
              <Pressable style={styles.bsClose} onPress={() => setSelectedHazardId(null)} hitSlop={8}>
                <Feather name="x" size={16} color={Colors.textTertiary} />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
              <View style={{ flex: 1, backgroundColor: "#EF444420", borderRadius: 8, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 10, color: "#EF4444", fontFamily: "Inter_600SemiBold" }}>HOT</Text>
                <Text style={{ fontSize: 14, color: Colors.text, fontFamily: "Inter_700Bold" }}>{hz.hotRadius}m</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#EAB30820", borderRadius: 8, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 10, color: "#EAB308", fontFamily: "Inter_600SemiBold" }}>WARM</Text>
                <Text style={{ fontSize: 14, color: Colors.text, fontFamily: "Inter_700Bold" }}>{hz.warmRadius}m</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: "#22C55E20", borderRadius: 8, padding: 8, alignItems: "center" }}>
                <Text style={{ fontSize: 10, color: "#22C55E", fontFamily: "Inter_600SemiBold" }}>COLD</Text>
                <Text style={{ fontSize: 14, color: Colors.text, fontFamily: "Inter_700Bold" }}>{hz.coldRadius}m</Text>
              </View>
            </View>
            <View style={styles.bsActions}>
              {hz.isLocked ? (
                <Pressable style={styles.bsActionBtn} onPress={() => unlockHazardZone(hz.id)}>
                  <Feather name="unlock" size={16} color="#F59E0B" />
                  <Text style={[styles.bsActionText, { color: "#F59E0B" }]}>Unlock</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.bsActionBtn} onPress={() => {}}>
                  <Feather name="lock" size={16} color={Colors.text} />
                  <Text style={styles.bsActionText}>Locked</Text>
                </Pressable>
              )}
              <Pressable style={styles.bsActionBtn} onPress={() => {
                applyDefaultsToHazardZone(hz.id);
              }}>
                <Feather name="refresh-cw" size={16} color={Colors.info} />
                <Text style={[styles.bsActionText, { color: Colors.info }]}>Apply Defaults</Text>
              </Pressable>
              <Pressable style={styles.bsActionBtn} onPress={() => {
                removeHazardZone(hz.id);
                setSelectedHazardId(null);
              }}>
                <Feather name="trash-2" size={16} color={Colors.destructive} />
                <Text style={[styles.bsActionText, { color: Colors.destructive }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        );
      })()}

      {/* ═══ FLOATING HEADER — PICK SHAPE ═══ */}
      {mode === "pick_shape" && (
        <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
          <Pressable style={styles.fhBtn} onPress={handleCancelDraw} hitSlop={8}>
            <Feather name="x" size={20} color="#fff" />
          </Pressable>
          <View style={styles.fhTitle}>
            <Text style={styles.fhTitleText}>New Zone</Text>
            <Text style={styles.fhSubtext}>Choose a drawing method</Text>
          </View>
        </View>
      )}

      {/* ═══ FLOATING HEADER — DRAW ═══ */}
      {mode === "draw" && (
        <View style={[styles.modeHeader, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: Colors.info }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>{selectedZone ? `DRAW: ${selectedZone.name}` : "DRAW MODE"}</Text>
          </View>
          <View style={styles.modeCount}>
            <Text style={styles.modeCountText}>{tapPoints.length} pts</Text>
          </View>
        </View>
      )}

      {/* ═══ FLOATING HEADER — EDIT ═══ */}
      {mode === "edit" && (
        <View style={[styles.modeHeader, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#F59E0B" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>EDIT MODE</Text>
          </View>
          <View style={styles.modeCount}>
            <Text style={styles.modeCountText}>{editingPoints.length} vertices</Text>
          </View>
        </View>
      )}

      {/* ═══ SHAPE PICKER — bottom action bar ═══ */}
      {mode === "pick_shape" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.shapeRow}>
            <Pressable style={styles.shapeBtn} onPress={handlePickRect}>
              <View style={[styles.shapeBtnIcon, { backgroundColor: Colors.infoDim }]}>
                <Feather name="square" size={22} color={Colors.info} />
              </View>
              <Text style={styles.shapeBtnLabel}>Rectangle</Text>
              <Text style={styles.shapeBtnHint}>At center</Text>
            </Pressable>
            <Pressable style={styles.shapeBtn} onPress={handlePickDraw}>
              <View style={[styles.shapeBtnIcon, { backgroundColor: Colors.infoDim }]}>
                <Feather name="edit-3" size={22} color={Colors.info} />
              </View>
              <Text style={styles.shapeBtnLabel}>Free Draw</Text>
              <Text style={styles.shapeBtnHint}>Tap points</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ DRAW CONTROLS — bottom action bar ═══ */}
      {mode === "draw" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawBar}>
            <Pressable style={styles.actionBtn} onPress={handleCancelDraw}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
            {tapPoints.length > 0 && (
              <Pressable style={styles.actionBtn} onPress={handleUndoTap}>
                <Feather name="corner-up-left" size={18} color={Colors.textSecondary} />
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.actionBtnPrimary, tapPoints.length < 3 && { opacity: 0.3 }]}
              onPress={handleFinishDraw}
              disabled={tapPoints.length < 3}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ EDIT CONTROLS — bottom action bar ═══ */}
      {mode === "edit" && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawBar}>
            <Pressable style={styles.actionBtn} onPress={handleCancelEdit}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={handleResetEdit}>
              <Feather name="rotate-ccw" size={18} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={styles.actionBtnPrimary} onPress={handleSaveEdit}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ FLOATING HEADER — LOC DRAW ═══ */}
      {locDrawMode && (
        <View style={[styles.modeHeader, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#6366F1" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>LOCATION BOUNDARY</Text>
          </View>
          <View style={styles.modeCount}>
            <Text style={styles.modeCountText}>{locEditPoints.length} pts</Text>
          </View>
        </View>
      )}

      {/* ═══ LOC DRAW CONTROLS ═══ */}
      {locDrawMode && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawBar}>
            <Pressable style={styles.actionBtn} onPress={() => {
              setLocDrawMode(false);
              setLocDrawLocationId(null);
              setLocEditPoints([]);
            }}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
            {locEditPoints.length > 0 && (
              <Pressable style={styles.actionBtn} onPress={() => setLocEditPoints((p) => p.slice(0, -1))}>
                <Feather name="corner-up-left" size={18} color={Colors.textSecondary} />
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.actionBtnPrimary, { backgroundColor: "#6366F1" }, locEditPoints.length < 3 && { opacity: 0.3 }]}
              onPress={() => {
                if (locDrawLocationId && locEditPoints.length >= 3) {
                  updateLocation(locDrawLocationId, { polygonPoints: locEditPoints });
                }
                setLocDrawMode(false);
                setLocDrawLocationId(null);
                setLocEditPoints([]);
              }}
              disabled={locEditPoints.length < 3}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ LOC EDIT CONTROLS ═══ */}
      {editingLocationId != null && (
        <View style={[styles.modeHeader, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#6366F1" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>EDIT BOUNDARY</Text>
          </View>
          <View style={styles.modeCount}>
            <Text style={styles.modeCountText}>{locEditPoints.length} vertices</Text>
          </View>
        </View>
      )}
      {editingLocationId != null && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.drawBar}>
            <Pressable style={styles.actionBtn} onPress={handleCancelLocEdit}>
              <Feather name="x" size={18} color={Colors.textSecondary} />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={[styles.actionBtnPrimary, { backgroundColor: "#6366F1" }]} onPress={handleSaveLocEdit}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.actionBtnPrimaryText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ SELECTED ZONE — compact bottom sheet ═══ */}
      {mode === "view" && selectedZone && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsRow}>
            <View style={[styles.bsDot, { backgroundColor: selectedZone.color }]} />
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedZone.name}</Text>
              <Text style={styles.bsMeta}>
                {selectedZone.type} · {selectedZone.polygonPoints.length > 0 ? `${selectedZone.polygonPoints.length} pts` : "No boundary"} · {selectedZone.isActive ? "Active" : "Off"}
                {selectedZone.locationId ? ` · ${locations.find((l) => l.id === selectedZone.locationId)?.name ?? "Location"}` : ""}
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedZoneId(null)} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            {selectedZone.polygonPoints.length > 0 && (
              <Pressable style={styles.bsActionBtn} onPress={handleFocusZone}>
                <Feather name="crosshair" size={16} color={Colors.info} />
                <Text style={[styles.bsActionText, { color: Colors.info }]}>Focus</Text>
              </Pressable>
            )}
            <Pressable style={styles.bsActionBtn} onPress={handleEditZone}>
              <Feather name={selectedZone.polygonPoints.length > 0 ? "edit-2" : "pen-tool"} size={16} color={Colors.text} />
              <Text style={styles.bsActionText}>{selectedZone.polygonPoints.length > 0 ? "Edit" : "Draw"}</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={() => handleToggleZone(selectedZone)}>
              <Feather name={selectedZone.isActive ? "eye-off" : "eye"} size={16} color={Colors.text} />
              <Text style={styles.bsActionText}>{selectedZone.isActive ? "Disable" : "Enable"}</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleDeleteZone}>
              <Feather name="trash-2" size={16} color={Colors.primary} />
              <Text style={[styles.bsActionText, { color: Colors.primary }]}>Delete</Text>
            </Pressable>
          </View>
          {locationsForZone.length > 0 && (
            <>
              <View style={{ height: 1, backgroundColor: Colors.border, marginTop: 4 }} />
              <Text style={{ fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginTop: 2 }}>
                LOCATIONS ({locationsForZone.length})
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {locationsForZone.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 6,
                      paddingHorizontal: 10, paddingVertical: 6,
                      backgroundColor: Colors.surfaceElevated, borderRadius: 8,
                      borderWidth: 1, borderColor: loc.polygonPoints.length > 0 ? "#6366F1" : Colors.border,
                    }}
                    onPress={() => {
                      setSelectedLocationId(loc.id);
                      setSelectedZoneId(null);
                    }}
                  >
                    <Feather
                      name={loc.polygonPoints.length > 0 ? "check-circle" : "circle"}
                      size={12}
                      color={loc.polygonPoints.length > 0 ? "#6366F1" : Colors.textTertiary}
                    />
                    <Text style={{ fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.text }} numberOfLines={1}>
                      {loc.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}

      {/* ═══ SELECTED SHELTER — bottom sheet ═══ */}
      {mode === "view" && !addingShelter && selectedShelter && !selectedZone && !selectedLocation && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsRow}>
            <View style={[styles.bsDot, { backgroundColor: "#F59E0B" }]} />
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedShelter.name}</Text>
              <Text style={styles.bsMeta}>
                Shelter · {selectedShelter.isActive ? "Active" : "Disabled"} · {(selectedShelter.linkedLocationIds || []).length} linked
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedShelterId(null)} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            <Pressable style={styles.bsActionBtn} onPress={() => handleOpenLinking(selectedShelter.id)}>
              <Feather name="link" size={16} color="#6366F1" />
              <Text style={[styles.bsActionText, { color: "#6366F1" }]}>Link</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleEditShelterName}>
              <Feather name="edit-2" size={16} color={Colors.text} />
              <Text style={styles.bsActionText}>Rename</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={() => handleToggleShelter(selectedShelter)}>
              <Feather name={selectedShelter.isActive ? "eye-off" : "eye"} size={16} color={Colors.text} />
              <Text style={styles.bsActionText}>{selectedShelter.isActive ? "Disable" : "Enable"}</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleDeleteShelter}>
              <Feather name="trash-2" size={16} color={Colors.destructive} />
              <Text style={[styles.bsActionText, { color: Colors.destructive }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ═══ SELECTED LOCATION — bottom sheet ═══ */}
      {mode === "view" && !addingShelter && !locDrawMode && !editingLocationId && selectedLocation && !selectedZone && !selectedShelter && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsRow}>
            <View style={[styles.bsDot, { backgroundColor: "#6366F1" }]} />
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedLocation.name}</Text>
              <Text style={styles.bsMeta}>
                Location · {selectedLocation.polygonPoints.length > 0 ? `${selectedLocation.polygonPoints.length} pts` : "No boundary"}
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedLocationId(null)} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            {selectedLocation.polygonPoints.length === 0 ? (
              <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocDraw(selectedLocation.id)}>
                <Feather name="edit-3" size={16} color="#6366F1" />
                <Text style={[styles.bsActionText, { color: "#6366F1" }]}>Draw Boundary</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocEdit(selectedLocation.id)}>
                  <Feather name="move" size={16} color="#6366F1" />
                  <Text style={[styles.bsActionText, { color: "#6366F1" }]}>Edit</Text>
                </Pressable>
                <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocDraw(selectedLocation.id)}>
                  <Feather name="refresh-cw" size={16} color={Colors.text} />
                  <Text style={styles.bsActionText}>Redraw</Text>
                </Pressable>
                <Pressable style={styles.bsActionBtn} onPress={() => handleClearLocBoundary(selectedLocation.id)}>
                  <Feather name="trash-2" size={16} color={Colors.destructive} />
                  <Text style={[styles.bsActionText, { color: Colors.destructive }]}>Clear</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {/* ═══ ZONE LIST — small floating chips when nothing selected ═══ */}
      {mode === "view" && !selectedZone && !selectedShelter && !addingShelter && !placingHazard && zones.length > 0 && (
        <View style={[styles.chipBar, { bottom: insets.bottom + 12 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipBarContent}>
            {zones.map((z) => (
              <Pressable
                key={z.id}
                style={[styles.chip, !z.isActive && { opacity: 0.45 }]}
                onPress={() => { handleZonePress(z.id); setFlyToZoneId(z.id); }}
              >
                <View style={[styles.chipDot, { backgroundColor: z.color }]} />
                <Text style={styles.chipText} numberOfLines={1}>{z.name}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ═══ SAVE NEW ZONE — compact bottom sheet modal ═══ */}
      <Modal visible={showSaveSheet} transparent animationType="slide" onRequestClose={handleDiscardSave}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>Save Zone</Text>
              <Pressable onPress={handleDiscardSave} hitSlop={8}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.nameInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Zone name..."
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.inlineRow}>
              {ZONE_TYPES.map((t) => (
                <Pressable
                  key={t.key}
                  style={[styles.typeBtn, formType === t.key && styles.typeBtnActive]}
                  onPress={() => setFormType(t.key)}
                >
                  <Text style={[styles.typeBtnText, formType === t.key && { color: "#fff" }]}>{t.label}</Text>
                </Pressable>
              ))}
              <View style={styles.inlineDivider} />
              {ZONE_COLORS.slice(0, 6).map((c) => (
                <Pressable
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, formColor === c && styles.colorDotActive]}
                  onPress={() => setFormColor(c)}
                />
              ))}
            </View>

            {/* Location link picker */}
            <Text style={{ fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginTop: 8, marginBottom: 4 }}>
              LINK TO LOCATION (optional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <Pressable
                style={[styles.typeBtn, formLocationId === null && styles.typeBtnActive]}
                onPress={() => setFormLocationId(null)}
              >
                <Text style={[styles.typeBtnText, formLocationId === null && { color: "#fff" }]}>None</Text>
              </Pressable>
              {locations.map((loc) => (
                <Pressable
                  key={loc.id}
                  style={[styles.typeBtn, formLocationId === loc.id && styles.typeBtnActive]}
                  onPress={() => setFormLocationId(loc.id)}
                >
                  <Text style={[styles.typeBtnText, formLocationId === loc.id && { color: "#fff" }]} numberOfLines={1}>{loc.name}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.saveBtnRow}>
              <Pressable style={styles.discardBtn} onPress={handleDiscardSave}>
                <Text style={styles.discardBtnText}>Discard</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !formName.trim() && { opacity: 0.3 }]}
                onPress={handleSaveNewZone}
                disabled={!formName.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      {/* ═══ SHELTER-LOCATION LINKING MODAL ═══ */}
      <Modal visible={linkingModal} transparent animationType="slide" onRequestClose={() => setLinkingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20, maxHeight: SCREEN_H * 0.6 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>Link Locations</Text>
              <Pressable onPress={() => setLinkingModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={{ fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 4 }}>
              Select locations this shelter serves:
            </Text>
            <ScrollView style={{ maxHeight: SCREEN_H * 0.35 }}>
              {locations.filter((loc) => {
                const sh = shelters.find((s) => s.id === linkingShelterId);
                if (!sh) return true;
                const pt = { lat: sh.lat, lng: sh.lng };
                const containingZone = zones.find(
                  (z) => z.polygonPoints.length >= 3 && pointInPolygon(pt, z.polygonPoints)
                );
                if (containingZone) return loc.zoneId === containingZone.id;
                let nearestId = sh.zoneId;
                let minDist = Infinity;
                for (const z of zones) {
                  if (!z.center) continue;
                  const d = haversineDistance(pt.lat, pt.lng, z.center.lat, z.center.lng);
                  if (d < minDist) { minDist = d; nearestId = z.id; }
                }
                return loc.zoneId === nearestId;
              }).map((loc) => {
                const isLinked = linkingSelectedIds.includes(loc.id);
                return (
                  <Pressable
                    key={loc.id}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 10,
                      paddingVertical: 10, paddingHorizontal: 12,
                      backgroundColor: isLinked ? "rgba(99,102,241,0.08)" : "transparent",
                      borderRadius: 10, marginBottom: 2,
                    }}
                    onPress={() => handleToggleLinkLocation(loc.id)}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 2, borderColor: isLinked ? "#6366F1" : Colors.border,
                      backgroundColor: isLinked ? "#6366F1" : "transparent",
                      alignItems: "center", justifyContent: "center",
                    }}>
                      {isLinked && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text }}>{loc.name}</Text>
                      <Text style={{ fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary }}>
                        Zone: {loc.zone} · {loc.polygonPoints.length > 0 ? "Has boundary" : "No boundary"}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.saveBtnRow}>
              <Pressable style={styles.discardBtn} onPress={() => setLinkingModal(false)}>
                <Text style={styles.discardBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: "#6366F1" }]}
                onPress={handleSaveLinking}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save ({linkingSelectedIds.length})</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ═══ SHELTER NAME MODAL ═══ */}
      <Modal visible={shelterNameModal} transparent animationType="slide" onRequestClose={() => { setShelterNameModal(false); setEditingShelter(null); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>{editingShelter ? "Rename Shelter" : "New Shelter"}</Text>
              <Pressable onPress={() => { setShelterNameModal(false); setEditingShelter(null); }} hitSlop={8}>
                <Feather name="x" size={20} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.nameInput}
              value={shelterFormName}
              onChangeText={setShelterFormName}
              placeholder="Shelter name..."
              placeholderTextColor={Colors.textTertiary}
              autoFocus
            />

            <View style={styles.saveBtnRow}>
              <Pressable style={styles.discardBtn} onPress={() => { setShelterNameModal(false); setEditingShelter(null); }}>
                <Text style={styles.discardBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: "#F59E0B" }, !shelterFormName.trim() && { opacity: 0.3 }]}
                onPress={editingShelter ? handleSaveEditShelter : handleSaveShelter}
                disabled={!shelterFormName.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>{editingShelter ? "Save" : "Add"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },

  // ─── Floating header ───
  floatingHeader: {
    position: "absolute", left: 12, right: 12, flexDirection: "row",
    alignItems: "center", gap: 10, zIndex: 20,
  },
  fhBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
  },
  fhBtnAccent: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.info, alignItems: "center", justifyContent: "center",
  },
  fhTitle: { flex: 1, gap: 1 },
  fhTitleText: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  fhSubtext: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.7)",
    textShadowColor: "rgba(0,0,0,0.5)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },

  // ─── Mode header ───
  modeHeader: {
    position: "absolute", left: 12, right: 12, flexDirection: "row",
    alignItems: "center", gap: 8, zIndex: 20,
  },
  modePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  modePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  modePillText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  modeCount: {
    backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  modeCountText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },

  // ─── Bottom bar (shape picker, draw, edit) ───
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0, padding: 12, zIndex: 20,
  },
  shapeRow: { flexDirection: "row", gap: 10 },
  shapeBtn: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 16,
    backgroundColor: "rgba(15,17,23,0.88)", borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  shapeBtnIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
  },
  shapeBtnLabel: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: "#fff" },
  shapeBtnHint: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.4)" },
  drawBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(15,17,23,0.88)", borderRadius: 16, padding: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
  },
  actionBtn: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  actionBtnPrimary: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: Colors.info, borderRadius: 12,
    paddingHorizontal: 20, height: 44,
  },
  actionBtnPrimaryText: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: "#fff" },

  // ─── Zone chips (view, no selection) ───
  chipBar: { position: "absolute", left: 0, right: 0, zIndex: 15 },
  chipBarContent: { paddingHorizontal: 12, gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "rgba(15,17,23,0.75)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: "#fff", maxWidth: 100 },

  // ─── Selected zone bottom sheet ───
  bottomSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 12, zIndex: 20,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  bsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  bsDot: { width: 12, height: 12, borderRadius: 6 },
  bsInfo: { flex: 1, gap: 1 },
  bsName: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.text },
  bsMeta: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  bsClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  bsActions: { flexDirection: "row", gap: 6 },
  bsActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    paddingVertical: 10, minHeight: 44,
  },
  bsActionText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: Colors.text },

  // ─── Save sheet modal ───
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  saveSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 14,
  },
  saveSheetHandle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center",
  },
  saveSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveSheetTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  nameInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
    minHeight: 36,
  },
  typeBtnActive: { backgroundColor: Colors.info, borderColor: Colors.info },
  typeBtnText: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  inlineDivider: { width: 1, height: 24, backgroundColor: Colors.border, marginHorizontal: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 2.5, borderColor: "#fff" },
  saveBtnRow: { flexDirection: "row", gap: 8 },
  discardBtn: {
    flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48,
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surfaceElevated,
  },
  discardBtnText: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  saveBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    minHeight: 48, borderRadius: 10, backgroundColor: Colors.info,
  },
  saveBtnText: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: "#fff" },

  // ─── Hazard zone chips ───
  hazardChipBar: { position: "absolute", left: 0, right: 0, zIndex: 14 },
  hazardChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: "rgba(239,68,68,0.15)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.3)",
  },
  hazardChipSelected: {
    backgroundColor: "rgba(239,68,68,0.3)",
    borderColor: "rgba(239,68,68,0.6)",
  },
  hazardChipText: { fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold", color: "#fff", maxWidth: 120 },
});
