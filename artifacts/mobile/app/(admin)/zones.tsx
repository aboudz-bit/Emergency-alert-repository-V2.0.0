import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ZoneMap } from "@/components/map";
import type { DrawMode } from "@/components/map";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone, ZoneType, LatLng } from "@/types";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MAP_HEIGHT = SCREEN_HEIGHT * 0.42;

const ZONE_COLORS = [
  "#EF4444", "#3B82F6", "#22C55E", "#F59E0B", "#8B5CF6",
  "#EC4899", "#06B6D4", "#F97316", "#14B8A6", "#6366F1",
];

const ZONE_TYPES: { key: ZoneType; label: string }[] = [
  { key: "CPF", label: "CPF" },
  { key: "Camp", label: "Camp" },
  { key: "Custom", label: "Custom" },
];

// ─── Mode system ───
type AppMode = "view" | "pick_shape" | "draw_tap" | "draw_rect" | "edit_shape";

export default function ZonesScreen() {
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);

  // ─── Core state ───
  const [mode, setMode] = useState<AppMode>("view");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [flyToZoneId, setFlyToZoneId] = useState<number | null>(null);

  // ─── Drawing state ───
  const [tapPoints, setTapPoints] = useState<LatLng[]>([]);
  const [editingPoints, setEditingPoints] = useState<LatLng[]>([]);

  // ─── Form state (used after drawing is complete) ───
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);

  // ─── Pending points waiting for name/save ───
  const pendingPointsRef = useRef<LatLng[]>([]);
  const mapCenterRef = useRef<LatLng>({ lat: 25.082, lng: 48.175 });

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const isDrawing = mode === "draw_tap" || mode === "draw_rect" || mode === "pick_shape";
  const isEditing = mode === "edit_shape";
  const isMapMode = isDrawing || isEditing;

  // ─── Map event handlers ───
  const handleMapCenterChange = useCallback((center: LatLng) => {
    mapCenterRef.current = center;
  }, []);

  const handleZonePress = useCallback((zoneId: number) => {
    if (isMapMode) return;
    setSelectedZoneId((prev) => {
      const newId = prev === zoneId ? null : zoneId;
      if (newId != null) setFlyToZoneId(newId);
      return newId;
    });
  }, [isMapMode]);

  const handleMapTap = useCallback((point: LatLng) => {
    if (mode !== "draw_tap") return;
    setTapPoints((prev) => [...prev, point]);
  }, [mode]);

  // ─── Zone CRUD ───
  const handleToggleZone = useCallback(
    (zone: Zone) => updateZone(zone.id, { isActive: !zone.isActive }),
    [updateZone]
  );

  // ─── New zone: map-first flow ───
  const handlePressAdd = useCallback(() => {
    const usedColors = zones.map((z) => z.color);
    const nextColor = ZONE_COLORS.find((c) => !usedColors.includes(c)) || ZONE_COLORS[0];
    setFormColor(nextColor);
    setFormName("");
    setFormType("Custom");
    setSelectedZoneId(null);
    setMode("pick_shape");
  }, [zones]);

  const handlePickShape = useCallback((shape: "rectangle" | "tap") => {
    if (shape === "tap") {
      setTapPoints([]);
      setMode("draw_tap");
    } else {
      // Rectangle: create at current map center immediately, then ask for name
      const center = mapCenterRef.current;
      const offset = 0.004;
      const points: LatLng[] = [
        { lat: center.lat + offset, lng: center.lng - offset },
        { lat: center.lat + offset, lng: center.lng + offset },
        { lat: center.lat - offset, lng: center.lng + offset },
        { lat: center.lat - offset, lng: center.lng - offset },
      ];
      pendingPointsRef.current = points;
      setMode("view");
      setShowSaveModal(true);
    }
  }, []);

  const handleUndoTap = useCallback(() => {
    setTapPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleFinishTapDraw = useCallback(() => {
    if (tapPoints.length < 3) return;
    pendingPointsRef.current = [...tapPoints];
    setMode("view");
    setShowSaveModal(true);
  }, [tapPoints]);

  const handleCancelDraw = useCallback(() => {
    setMode("view");
    setTapPoints([]);
  }, []);

  // ─── Save new zone (after drawing) ───
  const handleSaveNewZone = useCallback(() => {
    if (!formName.trim()) return;
    const points = pendingPointsRef.current;
    if (points.length < 3) return;

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    addZone({
      name: formName.trim(),
      type: formType,
      boundaryType: "Polygon",
      polygonPoints: points,
      center: { lat: centerLat, lng: centerLng },
      isActive: true,
      color: formColor,
    });
    setShowSaveModal(false);
    setTapPoints([]);
    pendingPointsRef.current = [];
    setFormName("");
  }, [formName, formType, formColor, addZone]);

  const handleCancelSave = useCallback(() => {
    setShowSaveModal(false);
    pendingPointsRef.current = [];
    setTapPoints([]);
    setFormName("");
  }, []);

  // ─── Edit zone ───
  const handleOpenEdit = useCallback(() => {
    if (!selectedZone) return;
    setFormName(selectedZone.name);
    setFormType(selectedZone.type);
    setFormColor(selectedZone.color);
    setShowEditModal(true);
  }, [selectedZone]);

  const handleSaveEdit = useCallback(() => {
    if (!selectedZone || !formName.trim()) return;
    updateZone(selectedZone.id, {
      name: formName.trim(),
      type: formType,
      color: formColor,
    });
    setShowEditModal(false);
  }, [selectedZone, formName, formType, formColor, updateZone]);

  const handleDeleteZone = useCallback(() => {
    if (!selectedZone) return;
    deleteZone(selectedZone.id);
    setSelectedZoneId(null);
    setShowEditModal(false);
  }, [selectedZone, deleteZone]);

  // ─── Edit boundary shape ───
  const handleEnterShapeEdit = useCallback(() => {
    if (!selectedZone) return;
    setEditingPoints([...selectedZone.polygonPoints]);
    setShowEditModal(false);
    setMode("edit_shape");
  }, [selectedZone]);

  const handleSaveShape = useCallback(() => {
    if (!selectedZone || editingPoints.length < 3) return;
    const lats = editingPoints.map((p) => p.lat);
    const lngs = editingPoints.map((p) => p.lng);
    updateZone(selectedZone.id, {
      polygonPoints: editingPoints,
      center: {
        lat: lats.reduce((a, b) => a + b, 0) / lats.length,
        lng: lngs.reduce((a, b) => a + b, 0) / lngs.length,
      },
    });
    setMode("view");
    setEditingPoints([]);
  }, [selectedZone, editingPoints, updateZone]);

  const handleCancelShapeEdit = useCallback(() => {
    setMode("view");
    setEditingPoints([]);
  }, []);

  const handleEditingPointsChange = useCallback((points: LatLng[]) => {
    setEditingPoints(points);
  }, []);

  // ─── Derived ───
  const drawMode: DrawMode = mode === "draw_tap" ? "tap" : "none";
  const mapHeight = isMapMode ? SCREEN_HEIGHT * 0.7 : MAP_HEIGHT;

  // ─── Mode label ───
  const modeLabel = (() => {
    switch (mode) {
      case "pick_shape": return "NEW ZONE";
      case "draw_tap": return "DRAW MODE";
      case "draw_rect": return "DRAW MODE";
      case "edit_shape": return "EDIT MODE";
      default: return null;
    }
  })();

  const modeColor = mode === "edit_shape" ? "#F59E0B" : "#3B82F6";

  return (
    <View style={styles.container}>
      {/* ─── Header ─── */}
      {mode === "view" && (
        <Header
          title="Zone Map"
          showBack
          rightAction={
            <Pressable style={styles.addBtn} onPress={handlePressAdd} hitSlop={8}>
              <Feather name="plus" size={20} color={Colors.text} />
            </Pressable>
          }
        />
      )}

      {/* ─── Mode indicator bar ─── */}
      {modeLabel && (
        <View style={[styles.modeBar, { backgroundColor: modeColor }]}>
          <View style={styles.modeBarLeft}>
            <View style={styles.modeDot} />
            <Text style={styles.modeBarText}>{modeLabel}</Text>
          </View>
          {mode === "pick_shape" && (
            <Pressable onPress={handleCancelDraw} hitSlop={8} style={styles.modeBarClose}>
              <Feather name="x" size={18} color="#fff" />
            </Pressable>
          )}
        </View>
      )}

      {/* ─── Map ─── */}
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <ZoneMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZonePress={handleZonePress}
          height={mapHeight}
          editingZoneId={isEditing ? selectedZoneId : null}
          editingPoints={isEditing ? editingPoints : undefined}
          onEditingPointsChange={handleEditingPointsChange}
          drawMode={drawMode}
          onMapTap={handleMapTap}
          onMapCenterChange={handleMapCenterChange}
          showLocationButton={mode === "view"}
          tapPointCount={tapPoints.length}
          flyToZoneId={flyToZoneId}
          showCenterCrosshair={mode === "pick_shape" || mode === "draw_rect"}
        />

        {/* ─── Shape picker overlay (step 1 of new zone) ─── */}
        {mode === "pick_shape" && (
          <View style={styles.shapePickerOverlay}>
            <Text style={styles.shapePickerTitle}>How do you want to draw?</Text>
            <View style={styles.shapePickerRow}>
              <Pressable
                style={styles.shapePickerBtn}
                onPress={() => handlePickShape("rectangle")}
              >
                <View style={styles.shapePickerIcon}>
                  <Feather name="square" size={24} color={Colors.info} />
                </View>
                <Text style={styles.shapePickerLabel}>Rectangle</Text>
                <Text style={styles.shapePickerDesc}>At map center</Text>
              </Pressable>
              <Pressable
                style={styles.shapePickerBtn}
                onPress={() => handlePickShape("tap")}
              >
                <View style={styles.shapePickerIcon}>
                  <Feather name="edit-3" size={24} color={Colors.info} />
                </View>
                <Text style={styles.shapePickerLabel}>Free Draw</Text>
                <Text style={styles.shapePickerDesc}>Tap vertices</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Tap draw controls ─── */}
        {mode === "draw_tap" && (
          <View style={styles.drawControlsBottom}>
            <View style={styles.drawControlsRow}>
              <Pressable style={styles.controlBtn} onPress={handleCancelDraw}>
                <Feather name="x" size={18} color="#6B7280" />
                <Text style={styles.controlBtnText}>Cancel</Text>
              </Pressable>
              {tapPoints.length > 0 && (
                <Pressable style={styles.controlBtn} onPress={handleUndoTap}>
                  <Feather name="corner-up-left" size={18} color="#6B7280" />
                  <Text style={styles.controlBtnText}>Undo</Text>
                </Pressable>
              )}
              <View style={styles.controlSpacer} />
              <View style={styles.pointCounter}>
                <Text style={styles.pointCounterText}>
                  {tapPoints.length} point{tapPoints.length !== 1 ? "s" : ""}
                </Text>
              </View>
              <Pressable
                style={[styles.controlBtnPrimary, tapPoints.length < 3 && styles.controlBtnDisabled]}
                onPress={handleFinishTapDraw}
                disabled={tapPoints.length < 3}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.controlBtnPrimaryText}>
                  Done
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Edit shape controls ─── */}
        {isEditing && (
          <View style={styles.drawControlsBottom}>
            <View style={styles.drawControlsRow}>
              <Pressable style={styles.controlBtn} onPress={handleCancelShapeEdit}>
                <Feather name="x" size={18} color="#6B7280" />
                <Text style={styles.controlBtnText}>Cancel</Text>
              </Pressable>
              <View style={styles.controlSpacer} />
              <View style={styles.pointCounter}>
                <Text style={styles.pointCounterText}>
                  {editingPoints.length} vertices
                </Text>
              </View>
              <Pressable style={styles.controlBtnPrimary} onPress={handleSaveShape}>
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.controlBtnPrimaryText}>Save</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ─── Zone chips (view mode only) ─── */}
        {mode === "view" && zones.length > 0 && (
          <View style={styles.zoneChipBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.zoneChipBarContent}
            >
              {zones.map((zone) => {
                const isSelected = zone.id === selectedZoneId;
                return (
                  <Pressable
                    key={zone.id}
                    style={[
                      styles.zoneChip,
                      isSelected && { borderColor: zone.color, backgroundColor: zone.color + "22" },
                      !zone.isActive && styles.zoneChipInactive,
                    ]}
                    onPress={() => handleZonePress(zone.id)}
                  >
                    <View style={[styles.zoneChipDot, { backgroundColor: zone.isActive ? zone.color : Colors.textTertiary }]} />
                    <Text
                      style={[
                        styles.zoneChipText,
                        isSelected && { color: zone.color, fontFamily: "Inter_700Bold" },
                        !zone.isActive && { color: Colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {zone.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ─── Detail panel (view mode) ─── */}
      {mode === "view" && selectedZone ? (
        <ScrollView style={styles.detailPanel} contentContainerStyle={styles.detailPanelContent}>
          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <View style={styles.detailHeaderLeft}>
                <View style={[styles.colorBar, { backgroundColor: selectedZone.color }]} />
                <View style={styles.detailNameWrap}>
                  <Text style={styles.detailName}>{selectedZone.name}</Text>
                  <Text style={styles.detailType}>{selectedZone.type} Zone</Text>
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
                title="Edit"
                onPress={handleOpenEdit}
                variant="secondary"
                icon="edit-2"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </ScrollView>
      ) : mode === "view" ? (
        <View style={styles.detailPanel}>
          <View style={styles.hintRow}>
            <Feather name="info" size={14} color={Colors.textTertiary} />
            <Text style={styles.hintText}>Tap a zone to view details</Text>
          </View>
          <FlatList
            data={zones}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.zoneListItem, pressed && styles.pressed]}
                onPress={() => handleZonePress(item.id)}
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
      ) : null}

      {/* ─── Save New Zone Modal (after drawing) ─── */}
      <Modal visible={showSaveModal} transparent animationType="slide" onRequestClose={handleCancelSave}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Save New Zone</Text>
            <Text style={styles.modalSubtitle}>
              {pendingPointsRef.current.length} boundary points drawn
            </Text>

            <Input
              label="Zone Name"
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Storage Yard, Helipad..."
              autoFocus
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeRow}>
                {ZONE_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.typeChip, formType === t.key && styles.typeChipActive]}
                    onPress={() => setFormType(t.key)}
                  >
                    <Text style={[styles.typeChipText, formType === t.key && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorRow}>
                {ZONE_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, formColor === c && styles.colorSwatchActive]}
                    onPress={() => setFormColor(c)}
                  >
                    {formColor === c && <Feather name="check" size={14} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable style={styles.modalBtnSecondary} onPress={handleCancelSave}>
                <Text style={styles.modalBtnSecondaryText}>Discard</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnPrimary, !formName.trim() && styles.modalBtnDisabled]}
                onPress={handleSaveNewZone}
                disabled={!formName.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Save Zone</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Edit Zone Modal ─── */}
      <Modal visible={showEditModal} transparent animationType="slide" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.editModalHeader}>
              <Text style={styles.modalTitle}>Edit Zone</Text>
              <Pressable
                style={styles.editModalClose}
                onPress={() => setShowEditModal(false)}
                hitSlop={8}
              >
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Input
              label="Zone Name"
              value={formName}
              onChangeText={setFormName}
              placeholder="Zone name"
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Type</Text>
              <View style={styles.typeRow}>
                {ZONE_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.typeChip, formType === t.key && styles.typeChipActive]}
                    onPress={() => setFormType(t.key)}
                  >
                    <Text style={[styles.typeChipText, formType === t.key && styles.typeChipTextActive]}>
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorRow}>
                {ZONE_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.colorSwatch, { backgroundColor: c }, formColor === c && styles.colorSwatchActive]}
                    onPress={() => setFormColor(c)}
                  >
                    {formColor === c && <Feather name="check" size={14} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.editModalDivider} />

            <Pressable style={styles.editShapeBtn} onPress={handleEnterShapeEdit}>
              <View style={styles.editShapeBtnIcon}>
                <Feather name="maximize" size={18} color={Colors.info} />
              </View>
              <View style={styles.editShapeBtnTextWrap}>
                <Text style={styles.editShapeBtnTitle}>Edit Boundary</Text>
                <Text style={styles.editShapeBtnDesc}>Drag vertices to reshape area</Text>
              </View>
              <Feather name="chevron-right" size={18} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.editModalDivider} />

            <View style={styles.editModalActions}>
              <Pressable
                style={[styles.modalBtnPrimary, { flex: undefined }, !formName.trim() && styles.modalBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={!formName.trim()}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Save</Text>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={handleDeleteZone}>
                <Feather name="trash-2" size={14} color={Colors.primary} />
                <Text style={styles.deleteBtnText}>Delete Zone</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Mode bar ───
  modeBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
  },
  modeBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  modeBarText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  modeBarClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Map ───
  mapContainer: {
    position: "relative",
  },

  // ─── Shape picker ───
  shapePickerOverlay: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: "rgba(15,17,23,0.92)",
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  shapePickerTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    textAlign: "center",
  },
  shapePickerRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  shapePickerBtn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  shapePickerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.infoDim,
    alignItems: "center",
    justifyContent: "center",
  },
  shapePickerLabel: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  shapePickerDesc: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.5)",
  },

  // ─── Draw controls ───
  drawControlsBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    zIndex: 10,
  },
  drawControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  controlBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  controlBtnText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#6B7280",
  },
  controlSpacer: {
    flex: 1,
  },
  pointCounter: {
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  pointCounterText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  controlBtnPrimary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 44,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  controlBtnPrimaryText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  controlBtnDisabled: {
    opacity: 0.35,
  },

  // ─── Zone chips ───
  zoneChipBar: {
    position: "absolute",
    bottom: Spacing.sm,
    left: 0,
    right: 0,
  },
  zoneChipBarContent: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  zoneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    maxWidth: 140,
  },
  zoneChipInactive: {
    opacity: 0.5,
  },
  zoneChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#1F2937",
  },

  // ─── Detail panel ───
  detailPanel: {
    flex: 1,
  },
  detailPanelContent: {
    paddingBottom: Spacing.xxl,
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
    minHeight: 60,
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
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Modals ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    maxHeight: "85%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.xs,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    marginTop: -Spacing.xs,
  },
  formSection: {
    gap: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  typeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  typeChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 44,
    justifyContent: "center",
  },
  typeChipActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  typeChipText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  modalBtnSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalBtnSecondaryText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.info,
  },
  modalBtnPrimaryText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  modalBtnDisabled: {
    opacity: 0.35,
  },

  // ─── Edit modal ───
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  editModalDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  editShapeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 56,
  },
  editShapeBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoDim,
    alignItems: "center",
    justifyContent: "center",
  },
  editShapeBtnTextWrap: {
    flex: 1,
    gap: 2,
  },
  editShapeBtnTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  editShapeBtnDesc: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  editModalActions: {
    gap: Spacing.sm,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 44,
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
