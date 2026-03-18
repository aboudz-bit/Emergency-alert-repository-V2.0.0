import React, { useState, useMemo, useCallback, useRef } from "react";
import {
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

import { ZoneMap } from "@/components/map";
import type { DrawMode } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone, ZoneType, LatLng } from "@/types";

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);

  const [mode, setMode] = useState<Mode>("view");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [flyToZoneId, setFlyToZoneId] = useState<number | null>(null);
  const [tapPoints, setTapPoints] = useState<LatLng[]>([]);
  const [editingPoints, setEditingPoints] = useState<LatLng[]>([]);

  // Save modal
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);

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
  }, [mode]);

  const handleMapTap = useCallback((pt: LatLng) => {
    if (mode !== "draw") return;
    setTapPoints((p) => [...p, pt]);
  }, [mode]);

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
      alertActive: false, alertType: null, alertPriority: null,
      alertMessage: "", alertUpdatedAt: null, alertHistory: [],
    });
    setShowSaveSheet(false);
    setTapPoints([]);
    pendingPointsRef.current = [];
  }, [formName, formType, formColor, addZone]);

  const handleDiscardSave = useCallback(() => {
    setShowSaveSheet(false);
    pendingPointsRef.current = [];
    setTapPoints([]);
  }, []);

  // ─── EDIT flow — direct to boundary ───
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

  // ─── Derived ───
  const drawMode: DrawMode = mode === "draw" ? "tap" : "none";
  const showCrosshair = mode === "pick_shape";

  return (
    <View style={styles.root}>
      {/* ═══ FULL-SCREEN MAP ═══ */}
      <ZoneMap
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
      />

      {/* ═══ FLOATING HEADER — VIEW ═══ */}
      {mode === "view" && (
        <View style={[styles.floatingHeader, { top: insets.top + 8 }]}>
          <Pressable style={styles.fhBtn} onPress={() => router.back()} hitSlop={8}>
            <Feather name="chevron-left" size={20} color="#fff" />
          </Pressable>
          <View style={styles.fhTitle}>
            <Text style={styles.fhTitleText}>Zones</Text>
            <Text style={styles.fhSubtext}>{zones.length} zone{zones.length !== 1 ? "s" : ""}</Text>
          </View>
          <Pressable style={styles.fhBtnAccent} onPress={handlePressAdd} hitSlop={8}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

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
            <Text style={styles.modePillText}>DRAW MODE</Text>
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

      {/* ═══ SELECTED ZONE — compact bottom sheet ═══ */}
      {mode === "view" && selectedZone && (
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.bsRow}>
            <View style={[styles.bsDot, { backgroundColor: selectedZone.color }]} />
            <View style={styles.bsInfo}>
              <Text style={styles.bsName} numberOfLines={1}>{selectedZone.name}</Text>
              <Text style={styles.bsMeta}>
                {selectedZone.type} · {selectedZone.polygonPoints.length} pts · {selectedZone.isActive ? "Active" : "Off"}
              </Text>
            </View>
            <Pressable style={styles.bsClose} onPress={() => setSelectedZoneId(null)} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>
          <View style={styles.bsActions}>
            <Pressable style={styles.bsActionBtn} onPress={handleFocusZone}>
              <Feather name="crosshair" size={16} color={Colors.info} />
              <Text style={[styles.bsActionText, { color: Colors.info }]}>Focus</Text>
            </Pressable>
            <Pressable style={styles.bsActionBtn} onPress={handleEditZone}>
              <Feather name="edit-2" size={16} color={Colors.text} />
              <Text style={styles.bsActionText}>Edit</Text>
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
        </View>
      )}

      {/* ═══ ZONE LIST — small floating chips when nothing selected ═══ */}
      {mode === "view" && !selectedZone && zones.length > 0 && (
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
});
