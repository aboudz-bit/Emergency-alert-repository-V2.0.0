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
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";
import type { Zone, ZoneType, LatLng, Shelter, Location, WarningLevel } from "@/types";

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
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);
  const locations = useStore((s) => s.locations);
  const updateLocation = useStore((s) => s.updateLocation);
  const shelters = useStore((s) => s.shelters);
  const addShelter = useStore((s) => s.addShelter);
  const updateShelter = useStore((s) => s.updateShelter);
  const deleteShelter = useStore((s) => s.deleteShelter);
  const linkShelterToLocations = useStore((s) => s.linkShelterToLocations);
  const { activeAlert } = useAlertSystemState();
  const addHazardZone = useStore((s) => s.addHazardZone);
  const removeHazardZone = useStore((s) => s.removeHazardZone);
  const unlockHazardZone = useStore((s) => s.unlockHazardZone);
  const applyDefaultsToHazardZone = useStore((s) => s.applyDefaultsToHazardZone);
  const hazardZones = useStore((s) => s.hazardZones);
  const settings = useStore((s) => s.settings);

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
  const [warningLevel, setWarningLevel] = useState<WarningLevel>("hot");

  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);
  const [formLocationId, setFormLocationId] = useState<number | null>(null);

  const [fabOpen, setFabOpen] = useState(false);

  const pendingPointsRef = useRef<LatLng[]>([]);
  const mapCenterRef = useRef<LatLng>({ lat: 25.082, lng: 48.175 });
  const originalPointsRef = useRef<LatLng[]>([]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const handleMapCenterChange = useCallback((c: LatLng) => {
    mapCenterRef.current = c;
  }, []);

  const handleZonePress = useCallback((id: number) => {
    if (mode !== "view") return;
    setSelectedZoneId((prev) => (prev === id ? null : id));
    setSelectedShelterId(null);
    setSelectedLocationId(null);
    setFabOpen(false);
  }, [mode]);

  const handleMapTap = useCallback((pt: LatLng) => {
    setFabOpen(false);
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
    setFabOpen(false);
  }, []);

  const handleSaveShelter = useCallback(() => {
    if (!shelterFormName.trim()) return;
    const nearestZone = zones[0];
    addShelter({
      name: shelterFormName.trim(),
      lat: pendingShelterLat,
      lng: pendingShelterLng,
      zoneId: nearestZone?.id ?? 0,
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
    setFabOpen(false);
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

  const handleStartPlacingHazard = useCallback(() => {
    setPlacingHazard(true);
    setHazardCenter(null);
    setWarningLevel("hot");
    setSelectedZoneId(null);
    setSelectedShelterId(null);
    setSelectedLocationId(null);
    setFabOpen(false);
  }, []);

  const handleConfirmHazard = useCallback(() => {
    if (!hazardCenter) return;
    addHazardZone({ centerLat: hazardCenter.lat, centerLng: hazardCenter.lng, warningLevel });
    setPlacingHazard(false);
    setHazardCenter(null);
  }, [hazardCenter, warningLevel, addHazardZone]);

  const handleCancelHazard = useCallback(() => {
    setPlacingHazard(false);
    setHazardCenter(null);
  }, []);

  const activeHazardZones = useMemo(
    () => hazardZones.filter((hz) => hz.isActive),
    [hazardZones]
  );

  const handlePressAdd = useCallback(() => {
    const used = zones.map((z) => z.color);
    setFormColor(ZONE_COLORS.find((c) => !used.includes(c)) || ZONE_COLORS[0]);
    setFormName("");
    setFormType("Custom");
    setSelectedZoneId(null);
    setMode("pick_shape");
    setFabOpen(false);
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
    pendingPointsRef.current = [...tapPoints];
    setMode("view");
    setShowSaveSheet(true);
  }, [tapPoints]);

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

  const handleEditZone = useCallback(() => {
    if (!selectedZone) return;
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
    setLinkingShelterId(shId);
    setLinkingSelectedIds([...(sh.linkedLocationIds || [])]);
    setLinkingModal(true);
  }, [shelters]);

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

  const showBottomSheet = mode === "view" && !addingShelter && !placingHazard && !locDrawMode && editingLocationId == null;

  return (
    <View style={styles.root}>
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

      {mode === "view" && !addingShelter && !placingHazard && (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable style={styles.topBackBtn} onPress={() => { if (router.canGoBack()) router.back(); }} hitSlop={8}>
            <Feather name="chevron-left" size={22} color="#333" />
          </Pressable>
          <View style={styles.topSearchBar}>
            <Feather name="map" size={16} color="#999" />
            <Text style={styles.topSearchText}>
              {zones.length} zone{zones.length !== 1 ? "s" : ""} · {shelters.length} shelter{shelters.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>
      )}

      {addingShelter && (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable style={styles.topBackBtn} onPress={handleToggleShelterAdd} hitSlop={8}>
            <Feather name="x" size={20} color="#333" />
          </Pressable>
          <View style={[styles.topSearchBar, { backgroundColor: "#FEF3C7" }]}>
            <Feather name="home" size={16} color="#D97706" />
            <Text style={[styles.topSearchText, { color: "#92400E" }]}>Tap map to place shelter</Text>
          </View>
        </View>
      )}

      {placingHazard && (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable style={styles.topBackBtn} onPress={handleCancelHazard} hitSlop={8}>
            <Feather name="x" size={20} color="#333" />
          </Pressable>
          <View style={[styles.topSearchBar, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="alert-triangle" size={16} color="#DC2626" />
            <Text style={[styles.topSearchText, { color: "#991B1B" }]}>
              {hazardCenter ? `${hazardCenter.lat.toFixed(4)}°N, ${hazardCenter.lng.toFixed(4)}°E` : "Tap to place warning zone"}
            </Text>
          </View>
        </View>
      )}

      {mode === "view" && !addingShelter && !placingHazard && (
        <View style={[styles.toolColumn, { bottom: insets.bottom + 180 }]}>
          <Pressable style={[styles.toolBtn, { backgroundColor: "#FEE2E2" }]} onPress={handleStartPlacingHazard}>
            <Feather name="alert-triangle" size={18} color="#DC2626" />
          </Pressable>
          <Pressable style={[styles.toolBtn, { backgroundColor: "#FEF3C7" }]} onPress={handleToggleShelterAdd}>
            <Feather name="home" size={18} color="#D97706" />
          </Pressable>
          <Pressable style={[styles.toolBtn, { backgroundColor: "#DBEAFE" }]} onPress={handlePressAdd}>
            <Feather name="hexagon" size={18} color="#2563EB" />
          </Pressable>
        </View>
      )}

      {placingHazard && (
        <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
          <View style={styles.adminBarInner}>
            <Pressable style={styles.adminBarCancel} onPress={handleCancelHazard}>
              <Feather name="x" size={18} color="#666" />
            </Pressable>
            <View style={styles.levelPicker}>
              <Pressable
                style={[styles.levelBtn, warningLevel === "hot" && styles.levelBtnHotActive]}
                onPress={() => setWarningLevel("hot")}
              >
                <Text style={[styles.levelBtnText, warningLevel === "hot" && styles.levelBtnTextActive]}>Hot</Text>
              </Pressable>
              <Pressable
                style={[styles.levelBtn, warningLevel === "warm" && styles.levelBtnWarmActive]}
                onPress={() => setWarningLevel("warm")}
              >
                <Text style={[styles.levelBtnText, warningLevel === "warm" && styles.levelBtnTextActive]}>Warm</Text>
              </Pressable>
              <Pressable
                style={[styles.levelBtn, warningLevel === "green" && styles.levelBtnGreenActive]}
                onPress={() => setWarningLevel("green")}
              >
                <Text style={[styles.levelBtnText, warningLevel === "green" && styles.levelBtnTextActive]}>Green</Text>
              </Pressable>
            </View>
            <Pressable
              style={[styles.adminBarConfirm, { backgroundColor: "#DC2626" }, !hazardCenter && { opacity: 0.3 }]}
              onPress={handleConfirmHazard}
              disabled={!hazardCenter}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.adminBarConfirmText}>Place</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showBottomSheet && activeHazardZones.length > 0 && !selectedZone && !selectedShelter && !selectedLocation && (
        <View style={[styles.chipBar, { bottom: insets.bottom + (zones.length > 0 ? 56 : 12) }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipBarContent}>
            {activeHazardZones.map((hz) => (
              <Pressable
                key={hz.id}
                style={[styles.hazardChip, selectedHazardId === hz.id && styles.hazardChipSelected]}
                onPress={() => setSelectedHazardId(selectedHazardId === hz.id ? null : hz.id)}
              >
                <Feather name="alert-triangle" size={11} color="#DC2626" />
                <Text style={styles.hazardChipText}>WZ {hz.centerLat.toFixed(2)}°</Text>
                {hz.isLocked && <Feather name="lock" size={9} color="rgba(255,255,255,0.5)" />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {showBottomSheet && selectedHazardId != null && !selectedZone && !selectedShelter && !selectedLocation && (() => {
        const hz = activeHazardZones.find((h) => h.id === selectedHazardId);
        if (!hz) return null;
        return (
          <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
            <View style={styles.bsHandle} />
            <View style={styles.bsRow}>
              <View style={[styles.bsIconWrap, { backgroundColor: "#FEE2E2" }]}>
                <Feather name="alert-triangle" size={18} color="#DC2626" />
              </View>
              <View style={styles.bsInfo}>
                <Text style={styles.bsName}>Warning Zone ({hz.warningLevel ? hz.warningLevel.charAt(0).toUpperCase() + hz.warningLevel.slice(1) : "Hot"})</Text>
                <Text style={styles.bsMeta}>
                  {hz.centerLat.toFixed(4)}°N, {hz.centerLng.toFixed(4)}°E · {hz.isLocked ? "Locked" : "Unlocked"}
                </Text>
              </View>
              <Pressable style={styles.bsClose} onPress={() => setSelectedHazardId(null)} hitSlop={8}>
                <Feather name="x" size={16} color="#999" />
              </Pressable>
            </View>
            <View style={styles.bsRadiusRow}>
              <View style={[styles.bsRadiusCard, { backgroundColor: "#FEF2F2" }]}>
                <Text style={[styles.bsRadiusLabel, { color: "#DC2626" }]}>HOT</Text>
                <Text style={styles.bsRadiusValue}>{hz.hotRadius}m</Text>
              </View>
              <View style={[styles.bsRadiusCard, { backgroundColor: "#FFFBEB" }]}>
                <Text style={[styles.bsRadiusLabel, { color: "#D97706" }]}>WARM</Text>
                <Text style={styles.bsRadiusValue}>{hz.warmRadius}m</Text>
              </View>
              <View style={[styles.bsRadiusCard, { backgroundColor: "#F0FDF4" }]}>
                <Text style={[styles.bsRadiusLabel, { color: "#16A34A" }]}>COLD</Text>
                <Text style={styles.bsRadiusValue}>{hz.coldRadius}m</Text>
              </View>
            </View>
            <View style={styles.bsActions}>
              {hz.isLocked ? (
                <Pressable style={styles.bsActionBtn} onPress={() => unlockHazardZone(hz.id)}>
                  <Feather name="unlock" size={15} color="#D97706" />
                  <Text style={[styles.bsActionText, { color: "#D97706" }]}>Unlock</Text>
                </Pressable>
              ) : (
                <Pressable style={styles.bsActionBtn} onPress={() => {}}>
                  <Feather name="lock" size={15} color="#666" />
                  <Text style={styles.bsActionText}>Locked</Text>
                </Pressable>
              )}
              <Pressable style={styles.bsActionBtn} onPress={() => applyDefaultsToHazardZone(hz.id)}>
                <Feather name="refresh-cw" size={15} color="#2563EB" />
                <Text style={[styles.bsActionText, { color: "#2563EB" }]}>Defaults</Text>
              </Pressable>
              <Pressable style={styles.bsActionBtn} onPress={() => { removeHazardZone(hz.id); setSelectedHazardId(null); }}>
                <Feather name="trash-2" size={15} color="#DC2626" />
                <Text style={[styles.bsActionText, { color: "#DC2626" }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        );
      })()}

      {mode === "pick_shape" && (
        <View style={[styles.topBar, { top: insets.top + 8 }]}>
          <Pressable style={styles.topBackBtn} onPress={handleCancelDraw} hitSlop={8}>
            <Feather name="x" size={20} color="#333" />
          </Pressable>
          <View style={[styles.topSearchBar, { backgroundColor: "#DBEAFE" }]}>
            <Feather name="hexagon" size={16} color="#2563EB" />
            <Text style={[styles.topSearchText, { color: "#1E40AF" }]}>Choose drawing method</Text>
          </View>
        </View>
      )}

      {mode === "draw" && (
        <View style={[styles.modeBanner, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#2563EB" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>DRAW</Text>
          </View>
          <View style={styles.modePillCount}>
            <Text style={styles.modePillCountText}>{tapPoints.length} pts</Text>
          </View>
        </View>
      )}

      {mode === "edit" && (
        <View style={[styles.modeBanner, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#D97706" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>EDIT</Text>
          </View>
          <View style={styles.modePillCount}>
            <Text style={styles.modePillCountText}>{editingPoints.length} vertices</Text>
          </View>
        </View>
      )}

      {mode === "pick_shape" && (
        <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
          <View style={styles.shapeRow}>
            <Pressable style={styles.shapeBtn} onPress={handlePickRect}>
              <View style={[styles.shapeBtnIcon, { backgroundColor: "#DBEAFE" }]}>
                <Feather name="square" size={22} color="#2563EB" />
              </View>
              <Text style={styles.shapeBtnLabel}>Rectangle</Text>
              <Text style={styles.shapeBtnHint}>At center</Text>
            </Pressable>
            <Pressable style={styles.shapeBtn} onPress={handlePickDraw}>
              <View style={[styles.shapeBtnIcon, { backgroundColor: "#DBEAFE" }]}>
                <Feather name="edit-3" size={22} color="#2563EB" />
              </View>
              <Text style={styles.shapeBtnLabel}>Free Draw</Text>
              <Text style={styles.shapeBtnHint}>Tap points</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mode === "draw" && (
        <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
          <View style={styles.adminBarInner}>
            <Pressable style={styles.adminBarCancel} onPress={handleCancelDraw}>
              <Feather name="x" size={18} color="#666" />
            </Pressable>
            {tapPoints.length > 0 && (
              <Pressable style={styles.adminBarCancel} onPress={handleUndoTap}>
                <Feather name="corner-up-left" size={18} color="#666" />
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.adminBarConfirm, tapPoints.length < 3 && { opacity: 0.3 }]}
              onPress={handleFinishDraw}
              disabled={tapPoints.length < 3}
            >
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.adminBarConfirmText}>Done</Text>
            </Pressable>
          </View>
        </View>
      )}

      {mode === "edit" && (
        <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
          <View style={styles.adminBarInner}>
            <Pressable style={styles.adminBarCancel} onPress={handleCancelEdit}>
              <Feather name="x" size={18} color="#666" />
            </Pressable>
            <Pressable style={styles.adminBarCancel} onPress={handleResetEdit}>
              <Feather name="rotate-ccw" size={18} color="#666" />
            </Pressable>
            <View style={{ flex: 1 }} />
            <Pressable style={[styles.adminBarConfirm, { backgroundColor: "#D97706" }]} onPress={handleSaveEdit}>
              <Feather name="check" size={18} color="#fff" />
              <Text style={styles.adminBarConfirmText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {locDrawMode && (
        <View style={[styles.modeBanner, { top: insets.top + 8 }]}>
          <View style={[styles.modePill, { backgroundColor: "#7C3AED" }]}>
            <View style={styles.modePillDot} />
            <Text style={styles.modePillText}>BOUNDARY</Text>
          </View>
          <View style={styles.modePillCount}>
            <Text style={styles.modePillCountText}>{locEditPoints.length} pts</Text>
          </View>
        </View>
      )}

      {locDrawMode && (
        <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
          <View style={styles.adminBarInner}>
            <Pressable style={styles.adminBarCancel} onPress={() => {
              setLocDrawMode(false);
              setLocDrawLocationId(null);
              setLocEditPoints([]);
            }}>
              <Feather name="x" size={18} color="#666" />
            </Pressable>
            {locEditPoints.length > 0 && (
              <Pressable style={styles.adminBarCancel} onPress={() => setLocEditPoints((p) => p.slice(0, -1))}>
                <Feather name="corner-up-left" size={18} color="#666" />
              </Pressable>
            )}
            <View style={{ flex: 1 }} />
            <Pressable
              style={[styles.adminBarConfirm, { backgroundColor: "#7C3AED" }, locEditPoints.length < 3 && { opacity: 0.3 }]}
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
              <Text style={styles.adminBarConfirmText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}

      {editingLocationId != null && (
        <>
          <View style={[styles.modeBanner, { top: insets.top + 8 }]}>
            <View style={[styles.modePill, { backgroundColor: "#7C3AED" }]}>
              <View style={styles.modePillDot} />
              <Text style={styles.modePillText}>EDIT BOUNDARY</Text>
            </View>
            <View style={styles.modePillCount}>
              <Text style={styles.modePillCountText}>{locEditPoints.length} vertices</Text>
            </View>
          </View>
          <View style={[styles.adminBar, { bottom: insets.bottom + 12 }]}>
            <View style={styles.adminBarInner}>
              <Pressable style={styles.adminBarCancel} onPress={handleCancelLocEdit}>
                <Feather name="x" size={18} color="#666" />
              </Pressable>
              <View style={{ flex: 1 }} />
              <Pressable style={[styles.adminBarConfirm, { backgroundColor: "#7C3AED" }]} onPress={handleSaveLocEdit}>
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.adminBarConfirmText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      {showBottomSheet && selectedZone && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsHandle} />
          <View style={styles.bsRow}>
            <View style={[styles.bsIconWrap, { backgroundColor: selectedZone.color + "20" }]}>
              <Feather name="hexagon" size={18} color={selectedZone.color} />
            </View>
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedZone.name}</Text>
              <Text style={styles.bsMeta}>
                {selectedZone.type} · {selectedZone.polygonPoints.length} pts · {selectedZone.isActive ? "Active" : "Off"}
                {selectedZone.locationId ? ` · ${locations.find((l) => l.id === selectedZone.locationId)?.name ?? "Location"}` : ""}
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedZoneId(null)} hitSlop={8}>
              <Feather name="x" size={16} color="#999" />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            <Pressable style={styles.bsActionBtn} onPress={handleFocusZone}>
              <Feather name="crosshair" size={15} color="#2563EB" />
              <Text style={[styles.bsActionText, { color: "#2563EB" }]}>Focus</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleEditZone}>
              <Feather name="edit-2" size={15} color="#333" />
              <Text style={styles.bsActionText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={() => handleToggleZone(selectedZone)}>
              <Feather name={selectedZone.isActive ? "eye-off" : "eye"} size={15} color="#333" />
              <Text style={styles.bsActionText}>{selectedZone.isActive ? "Disable" : "Enable"}</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleDeleteZone}>
              <Feather name="trash-2" size={15} color="#DC2626" />
              <Text style={[styles.bsActionText, { color: "#DC2626" }]}>Delete</Text>
            </Pressable>
          </View>
          {locationsForZone.length > 0 && (
            <>
              <View style={styles.bsDivider} />
              <Text style={styles.bsSectionTitle}>LOCATIONS ({locationsForZone.length})</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {locationsForZone.map((loc) => (
                  <Pressable
                    key={loc.id}
                    style={[styles.bsLocChip, loc.polygonPoints.length > 0 && styles.bsLocChipActive]}
                    onPress={() => { setSelectedLocationId(loc.id); setSelectedZoneId(null); }}
                  >
                    <Feather
                      name={loc.polygonPoints.length > 0 ? "check-circle" : "circle"}
                      size={12}
                      color={loc.polygonPoints.length > 0 ? "#7C3AED" : "#999"}
                    />
                    <Text style={styles.bsLocChipText} numberOfLines={1}>{loc.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          )}
        </View>
      )}

      {showBottomSheet && !addingShelter && selectedShelter && !selectedZone && !selectedLocation && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsHandle} />
          <View style={styles.bsRow}>
            <View style={[styles.bsIconWrap, { backgroundColor: "#FEF3C7" }]}>
              <Feather name="home" size={18} color="#D97706" />
            </View>
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedShelter.name}</Text>
              <Text style={styles.bsMeta}>
                Shelter · {selectedShelter.isActive ? "Active" : "Disabled"} · {(selectedShelter.linkedLocationIds || []).length} linked
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedShelterId(null)} hitSlop={8}>
              <Feather name="x" size={16} color="#999" />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            <Pressable style={styles.bsActionBtn} onPress={() => handleOpenLinking(selectedShelter.id)}>
              <Feather name="link" size={15} color="#7C3AED" />
              <Text style={[styles.bsActionText, { color: "#7C3AED" }]}>Link</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleEditShelterName}>
              <Feather name="edit-2" size={15} color="#333" />
              <Text style={styles.bsActionText}>Rename</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={() => handleToggleShelter(selectedShelter)}>
              <Feather name={selectedShelter.isActive ? "eye-off" : "eye"} size={15} color="#333" />
              <Text style={styles.bsActionText}>{selectedShelter.isActive ? "Disable" : "Enable"}</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleDeleteShelter}>
              <Feather name="trash-2" size={15} color="#DC2626" />
              <Text style={[styles.bsActionText, { color: "#DC2626" }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}

      {showBottomSheet && !addingShelter && !locDrawMode && !editingLocationId && selectedLocation && !selectedZone && !selectedShelter && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsHandle} />
          <View style={styles.bsRow}>
            <View style={[styles.bsIconWrap, { backgroundColor: "#EDE9FE" }]}>
              <Feather name="map-pin" size={18} color="#7C3AED" />
            </View>
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedLocation.name}</Text>
              <Text style={styles.bsMeta}>
                Location · {selectedLocation.polygonPoints.length > 0 ? `${selectedLocation.polygonPoints.length} pts` : "No boundary"}
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedLocationId(null)} hitSlop={8}>
              <Feather name="x" size={16} color="#999" />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            {selectedLocation.polygonPoints.length === 0 ? (
              <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocDraw(selectedLocation.id)}>
                <Feather name="edit-3" size={15} color="#7C3AED" />
                <Text style={[styles.bsActionText, { color: "#7C3AED" }]}>Draw Boundary</Text>
              </Pressable>
            ) : (
              <>
                <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocEdit(selectedLocation.id)}>
                  <Feather name="move" size={15} color="#7C3AED" />
                  <Text style={[styles.bsActionText, { color: "#7C3AED" }]}>Edit</Text>
                </Pressable>
                <Pressable style={styles.bsActionBtn} onPress={() => handleStartLocDraw(selectedLocation.id)}>
                  <Feather name="refresh-cw" size={15} color="#333" />
                  <Text style={styles.bsActionText}>Redraw</Text>
                </Pressable>
                <Pressable style={styles.bsActionBtn} onPress={() => handleClearLocBoundary(selectedLocation.id)}>
                  <Feather name="trash-2" size={15} color="#DC2626" />
                  <Text style={[styles.bsActionText, { color: "#DC2626" }]}>Clear</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      )}

      {showBottomSheet && !selectedZone && !selectedShelter && !selectedLocation && selectedHazardId == null && zones.length > 0 && (
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

      <Modal visible={showSaveSheet} transparent animationType="slide" onRequestClose={handleDiscardSave}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>Save Zone</Text>
              <Pressable onPress={handleDiscardSave} hitSlop={8}>
                <Feather name="x" size={20} color="#999" />
              </Pressable>
            </View>

            <TextInput
              style={styles.nameInput}
              value={formName}
              onChangeText={setFormName}
              placeholder="Zone name..."
              placeholderTextColor="#bbb"
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

            <Text style={styles.saveSheetSectionLabel}>LINK TO LOCATION (optional)</Text>
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

      <Modal visible={linkingModal} transparent animationType="slide" onRequestClose={() => setLinkingModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20, maxHeight: SCREEN_H * 0.6 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>Link Locations</Text>
              <Pressable onPress={() => setLinkingModal(false)} hitSlop={8}>
                <Feather name="x" size={20} color="#999" />
              </Pressable>
            </View>
            <Text style={{ fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: "#888", marginBottom: 4 }}>
              Select locations this shelter serves:
            </Text>
            <ScrollView style={{ maxHeight: SCREEN_H * 0.35 }}>
              {locations.filter((loc) => {
                const sh = shelters.find((s) => s.id === linkingShelterId);
                return sh ? loc.zoneId === sh.zoneId : true;
              }).map((loc) => {
                const isLinked = linkingSelectedIds.includes(loc.id);
                return (
                  <Pressable
                    key={loc.id}
                    style={[styles.linkLocRow, isLinked && styles.linkLocRowActive]}
                    onPress={() => handleToggleLinkLocation(loc.id)}
                  >
                    <View style={[styles.linkLocCheck, isLinked && styles.linkLocCheckActive]}>
                      {isLinked && <Feather name="check" size={14} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.linkLocName}>{loc.name}</Text>
                      <Text style={styles.linkLocMeta}>
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
                style={[styles.saveBtn, { backgroundColor: "#7C3AED" }]}
                onPress={handleSaveLinking}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>Save ({linkingSelectedIds.length})</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={shelterNameModal} transparent animationType="slide" onRequestClose={() => { setShelterNameModal(false); setEditingShelter(null); }}>
        <View style={styles.modalOverlay}>
          <View style={[styles.saveSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.saveSheetHandle} />
            <View style={styles.saveSheetHeader}>
              <Text style={styles.saveSheetTitle}>{editingShelter ? "Rename Shelter" : "New Shelter"}</Text>
              <Pressable onPress={() => { setShelterNameModal(false); setEditingShelter(null); }} hitSlop={8}>
                <Feather name="x" size={20} color="#999" />
              </Pressable>
            </View>

            <TextInput
              style={styles.nameInput}
              value={shelterFormName}
              onChangeText={setShelterFormName}
              placeholder="Shelter name..."
              placeholderTextColor="#bbb"
              autoFocus
            />

            <View style={styles.saveBtnRow}>
              <Pressable style={styles.discardBtn} onPress={() => { setShelterNameModal(false); setEditingShelter(null); }}>
                <Text style={styles.discardBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, { backgroundColor: "#D97706" }, !shelterFormName.trim() && { opacity: 0.3 }]}
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
  root: { flex: 1, backgroundColor: "#1a1a2e" },

  topBar: {
    position: "absolute", left: 12, right: 12, flexDirection: "row",
    alignItems: "center", gap: 8, zIndex: 20,
  },
  topBackBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6,
    elevation: 4,
  },
  topSearchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    height: 44, borderRadius: 22, backgroundColor: "#fff",
    paddingHorizontal: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6,
    elevation: 3,
  },
  topSearchText: {
    fontSize: 14, fontFamily: "Inter_500Medium", color: "#666",
  },

  modeBanner: {
    position: "absolute", left: 12, right: 12, flexDirection: "row",
    alignItems: "center", gap: 8, zIndex: 20,
  },
  modePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  modePillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  modePillText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 1 },
  modePillCount: {
    backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  modePillCountText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },

  toolColumn: {
    position: "absolute", right: 16, zIndex: 25,
    alignItems: "center", gap: 10,
  },
  toolBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
    elevation: 3,
  },

  levelPicker: {
    flex: 1, flexDirection: "row", gap: 4, justifyContent: "center",
  },
  levelBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  levelBtnHotActive: { backgroundColor: "#DC2626" },
  levelBtnWarmActive: { backgroundColor: "#F59E0B" },
  levelBtnGreenActive: { backgroundColor: "#16A34A" },
  levelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  levelBtnTextActive: { color: "#fff" },

  adminBar: {
    position: "absolute", left: 12, right: 12, zIndex: 20,
  },
  adminBarInner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 16, padding: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 10,
    elevation: 5,
  },
  adminBarInfo: { flex: 1, gap: 1, paddingLeft: 4 },
  adminBarLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#333" },
  adminBarMeta: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#888" },
  adminBarCancel: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center",
  },
  adminBarConfirm: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#2563EB", borderRadius: 12,
    paddingHorizontal: 20, height: 40,
  },
  adminBarConfirmText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  shapeRow: { flexDirection: "row", gap: 10 },
  shapeBtn: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 16,
    backgroundColor: "#fff", borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6,
    elevation: 3,
  },
  shapeBtnIcon: {
    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
  },
  shapeBtnLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#333" },
  shapeBtnHint: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#999" },

  chipBar: { position: "absolute", left: 0, right: 0, zIndex: 15 },
  chipBarContent: { paddingHorizontal: 12, gap: 6 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: "#fff", borderRadius: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4,
    elevation: 2,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#333", maxWidth: 100 },

  hazardChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 7,
    backgroundColor: "rgba(220,38,38,0.1)", borderRadius: 20,
    borderWidth: 1, borderColor: "rgba(220,38,38,0.2)",
  },
  hazardChipSelected: {
    backgroundColor: "rgba(220,38,38,0.2)",
    borderColor: "rgba(220,38,38,0.4)",
  },
  hazardChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#333", maxWidth: 120 },

  bottomSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 12, zIndex: 20,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12,
    elevation: 8,
  },
  bsHandle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center",
    marginBottom: 4,
  },
  bsRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bsIconWrap: {
    width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center",
  },
  bsInfo: { flex: 1, gap: 2 },
  bsName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1F2937" },
  bsMeta: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#6B7280" },
  bsClose: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#F3F4F6",
    alignItems: "center", justifyContent: "center",
  },
  bsActions: { flexDirection: "row", gap: 6 },
  bsActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5,
    backgroundColor: "#F9FAFB", borderRadius: 10,
    paddingVertical: 10, minHeight: 42,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  bsActionText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#374151" },

  bsRadiusRow: { flexDirection: "row", gap: 6 },
  bsRadiusCard: {
    flex: 1, borderRadius: 10, padding: 10, alignItems: "center", gap: 2,
  },
  bsRadiusLabel: { fontSize: 10, fontFamily: "Inter_700Bold" },
  bsRadiusValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#1F2937" },

  bsDivider: { height: 1, backgroundColor: "#F3F4F6", marginTop: 2 },
  bsSectionTitle: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#9CA3AF", letterSpacing: 0.5, marginTop: 2 },
  bsLocChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 6,
    backgroundColor: "#F9FAFB", borderRadius: 8,
    borderWidth: 1, borderColor: "#F3F4F6",
  },
  bsLocChipActive: { borderColor: "#7C3AED" },
  bsLocChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#374151" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  saveSheet: {
    backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 14,
  },
  saveSheetHandle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: "#E5E7EB", alignSelf: "center",
  },
  saveSheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saveSheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#1F2937" },
  saveSheetSectionLabel: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: "#9CA3AF",
    letterSpacing: 0.5, marginTop: 4, marginBottom: 2,
  },
  nameInput: {
    backgroundColor: "#F9FAFB", borderRadius: 12, borderWidth: 1,
    borderColor: "#E5E7EB", paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#1F2937",
  },
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  typeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB",
    minHeight: 36,
  },
  typeBtnActive: { backgroundColor: "#2563EB", borderColor: "#2563EB" },
  typeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  inlineDivider: { width: 1, height: 24, backgroundColor: "#E5E7EB", marginHorizontal: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { borderWidth: 2.5, borderColor: "#1F2937" },
  saveBtnRow: { flexDirection: "row", gap: 8 },
  discardBtn: {
    flex: 1, alignItems: "center", justifyContent: "center", minHeight: 48,
    borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#F9FAFB",
  },
  discardBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#6B7280" },
  saveBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    minHeight: 48, borderRadius: 12, backgroundColor: "#2563EB",
  },
  saveBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  linkLocRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 10, marginBottom: 2,
  },
  linkLocRowActive: { backgroundColor: "rgba(124,58,237,0.06)" },
  linkLocCheck: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: "#E5E7EB",
    alignItems: "center", justifyContent: "center",
  },
  linkLocCheckActive: { borderColor: "#7C3AED", backgroundColor: "#7C3AED" },
  linkLocName: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#1F2937" },
  linkLocMeta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#6B7280" },
});
