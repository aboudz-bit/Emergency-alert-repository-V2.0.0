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

type ShapeMode = "rectangle" | "polygon" | "tap";

const SHAPE_MODES: { key: ShapeMode; label: string; icon: string; desc: string }[] = [
  { key: "rectangle", label: "Rectangle", icon: "square", desc: "Auto-create around map center" },
  { key: "polygon", label: "Polygon", icon: "hexagon", desc: "Default 4-point polygon" },
  { key: "tap", label: "Tap Points", icon: "crosshair", desc: "Tap map to place vertices" },
];

export default function ZonesScreen() {
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);

  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isEditingShape, setIsEditingShape] = useState(false);
  const [editingPoints, setEditingPoints] = useState<LatLng[]>([]);
  const [isTapDrawing, setIsTapDrawing] = useState(false);
  const [tapPoints, setTapPoints] = useState<LatLng[]>([]);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);
  const [formShape, setFormShape] = useState<ShapeMode>("rectangle");

  const mapCenterRef = useRef<LatLng>({ lat: 25.082, lng: 48.175 });

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const handleMapCenterChange = useCallback((center: LatLng) => {
    mapCenterRef.current = center;
  }, []);

  const handleZonePress = useCallback((zoneId: number) => {
    if (isEditingShape || isTapDrawing) return;
    setSelectedZoneId((prev) => (prev === zoneId ? null : zoneId));
  }, [isEditingShape, isTapDrawing]);

  const handleToggleZone = useCallback(
    (zone: Zone) => {
      updateZone(zone.id, { isActive: !zone.isActive });
    },
    [updateZone]
  );

  const handleOpenAdd = useCallback(() => {
    const usedColors = zones.map((z) => z.color);
    const nextColor = ZONE_COLORS.find((c) => !usedColors.includes(c)) || ZONE_COLORS[0];
    setFormName("");
    setFormType("Custom");
    setFormColor(nextColor);
    setFormShape("rectangle");
    setShowAddModal(true);
  }, [zones]);

  const handleSaveAdd = useCallback(() => {
    if (!formName.trim()) return;
    const center = mapCenterRef.current;

    if (formShape === "tap") {
      // Enter tap drawing mode — close modal and let user tap on map
      setShowAddModal(false);
      setTapPoints([]);
      setIsTapDrawing(true);
      return;
    }

    let points: LatLng[];
    if (formShape === "rectangle") {
      const offset = 0.003;
      points = [
        { lat: center.lat + offset, lng: center.lng - offset },
        { lat: center.lat + offset, lng: center.lng + offset },
        { lat: center.lat - offset, lng: center.lng + offset },
        { lat: center.lat - offset, lng: center.lng - offset },
      ];
    } else {
      // polygon — default 4-point shape at map center
      const offset = 0.004;
      points = [
        { lat: center.lat + offset, lng: center.lng - offset * 0.5 },
        { lat: center.lat + offset * 0.3, lng: center.lng + offset },
        { lat: center.lat - offset, lng: center.lng + offset * 0.5 },
        { lat: center.lat - offset * 0.3, lng: center.lng - offset },
      ];
    }

    addZone({
      name: formName.trim(),
      type: formType,
      boundaryType: "Polygon",
      polygonPoints: points,
      center: { lat: center.lat, lng: center.lng },
      isActive: true,
      color: formColor,
    });
    setShowAddModal(false);
    setFormName("");
  }, [formName, formType, formColor, formShape, addZone]);

  const handleMapTap = useCallback((point: LatLng) => {
    if (!isTapDrawing) return;
    setTapPoints((prev) => [...prev, point]);
  }, [isTapDrawing]);

  const handleFinishTapDraw = useCallback(() => {
    if (tapPoints.length < 3) return;
    const lats = tapPoints.map((p) => p.lat);
    const lngs = tapPoints.map((p) => p.lng);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;

    addZone({
      name: formName.trim(),
      type: formType,
      boundaryType: "Polygon",
      polygonPoints: tapPoints,
      center: { lat: centerLat, lng: centerLng },
      isActive: true,
      color: formColor,
    });
    setIsTapDrawing(false);
    setTapPoints([]);
    setFormName("");
  }, [tapPoints, formName, formType, formColor, addZone]);

  const handleCancelTapDraw = useCallback(() => {
    setIsTapDrawing(false);
    setTapPoints([]);
  }, []);

  const handleUndoTapPoint = useCallback(() => {
    setTapPoints((prev) => prev.slice(0, -1));
  }, []);

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

  const handleEnterShapeEdit = useCallback(() => {
    if (!selectedZone) return;
    setEditingPoints([...selectedZone.polygonPoints]);
    setShowEditModal(false);
    setIsEditingShape(true);
  }, [selectedZone]);

  const handleSaveShape = useCallback(() => {
    if (!selectedZone || editingPoints.length < 3) return;
    const lats = editingPoints.map((p) => p.lat);
    const lngs = editingPoints.map((p) => p.lng);
    const centerLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const centerLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    updateZone(selectedZone.id, {
      polygonPoints: editingPoints,
      center: { lat: centerLat, lng: centerLng },
    });
    setIsEditingShape(false);
    setEditingPoints([]);
  }, [selectedZone, editingPoints, updateZone]);

  const handleCancelShapeEdit = useCallback(() => {
    setIsEditingShape(false);
    setEditingPoints([]);
  }, []);

  const handleEditingPointsChange = useCallback((points: LatLng[]) => {
    setEditingPoints(points);
  }, []);

  const drawMode: DrawMode = isTapDrawing ? "tap" : "none";

  return (
    <View style={styles.container}>
      {!isEditingShape && !isTapDrawing && (
        <Header
          title="Zone Map"
          showBack
          rightAction={
            <Pressable style={styles.addBtn} onPress={handleOpenAdd} hitSlop={8}>
              <Feather name="plus" size={20} color={Colors.text} />
            </Pressable>
          }
        />
      )}

      <View style={[styles.mapContainer, (isEditingShape || isTapDrawing) && styles.mapContainerEditing]}>
        <ZoneMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZonePress={handleZonePress}
          height={isEditingShape || isTapDrawing ? SCREEN_HEIGHT * 0.65 : MAP_HEIGHT}
          editingZoneId={isEditingShape ? selectedZoneId : null}
          editingPoints={isEditingShape ? editingPoints : undefined}
          onEditingPointsChange={handleEditingPointsChange}
          drawMode={drawMode}
          onMapTap={handleMapTap}
          onMapCenterChange={handleMapCenterChange}
          showLocationButton={!isEditingShape && !isTapDrawing}
          tapPointCount={tapPoints.length}
        />

        {isTapDrawing && (
          <View style={styles.editOverlay}>
            <View style={styles.editBanner}>
              <View style={styles.editBannerLeft}>
                <Feather name="crosshair" size={16} color={Colors.info} />
                <Text style={styles.editBannerText}>
                  Tap map to place vertices
                </Text>
              </View>
              <Text style={styles.editBannerCount}>
                {tapPoints.length} pts
              </Text>
            </View>
            <View style={styles.editActions}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={handleCancelTapDraw}
              >
                <Feather name="x" size={16} color={Colors.textSecondary} />
                <Text style={styles.editCancelText}>Cancel</Text>
              </Pressable>
              {tapPoints.length > 0 && (
                <Pressable
                  style={styles.editCancelBtn}
                  onPress={handleUndoTapPoint}
                >
                  <Feather name="corner-up-left" size={16} color={Colors.textSecondary} />
                  <Text style={styles.editCancelText}>Undo</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.editSaveBtn, tapPoints.length < 3 && { opacity: 0.4 }]}
                onPress={handleFinishTapDraw}
                disabled={tapPoints.length < 3}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.editSaveText}>
                  Done ({tapPoints.length}/3+)
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {isEditingShape && (
          <View style={styles.editOverlay}>
            <View style={styles.editBanner}>
              <View style={styles.editBannerLeft}>
                <Feather name="edit-3" size={16} color={Colors.info} />
                <Text style={styles.editBannerText}>
                  Drag vertices to reshape
                </Text>
              </View>
              <Text style={styles.editBannerCount}>
                {editingPoints.length} pts
              </Text>
            </View>
            <View style={styles.editActions}>
              <Pressable
                style={styles.editCancelBtn}
                onPress={handleCancelShapeEdit}
              >
                <Feather name="x" size={16} color={Colors.textSecondary} />
                <Text style={styles.editCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.editSaveBtn}
                onPress={handleSaveShape}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.editSaveText}>Save Shape</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!isEditingShape && !isTapDrawing && (
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
                      isSelected && { borderColor: zone.color, backgroundColor: zone.color + "20" },
                      !zone.isActive && styles.zoneChipInactive,
                    ]}
                    onPress={() => handleZonePress(zone.id)}
                  >
                    <View style={[styles.zoneChipDot, { backgroundColor: zone.isActive ? zone.color : Colors.textTertiary }]} />
                    <Text
                      style={[
                        styles.zoneChipText,
                        isSelected && { color: zone.color },
                        !zone.isActive && { color: Colors.textTertiary },
                      ]}
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

      {!isEditingShape && !isTapDrawing && selectedZone ? (
        <ScrollView style={styles.detailPanel} contentContainerStyle={styles.detailPanelContent}>
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
                title="Edit Zone"
                onPress={handleOpenEdit}
                variant="secondary"
                icon="edit-2"
                size="md"
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </ScrollView>
      ) : !isEditingShape && !isTapDrawing ? (
        <View style={styles.detailPanel}>
          <View style={styles.hintRow}>
            <Feather name="info" size={14} color={Colors.textTertiary} />
            <Text style={styles.hintText}>Tap a zone on the map or chips to view details</Text>
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
      ) : null}

      {/* ─── Add Zone Modal ─── */}
      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>New Zone</Text>
            <Text style={styles.modalSubtitle}>
              Zone will be placed at current map position
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
              <Text style={styles.formLabel}>Shape</Text>
              <View style={styles.shapeRow}>
                {SHAPE_MODES.map((s) => (
                  <Pressable
                    key={s.key}
                    style={[styles.shapeCard, formShape === s.key && styles.shapeCardActive]}
                    onPress={() => setFormShape(s.key)}
                  >
                    <Feather
                      name={s.icon as any}
                      size={18}
                      color={formShape === s.key ? Colors.info : Colors.textSecondary}
                    />
                    <Text style={[styles.shapeCardLabel, formShape === s.key && styles.shapeCardLabelActive]}>
                      {s.label}
                    </Text>
                    <Text style={styles.shapeCardDesc}>{s.desc}</Text>
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
                    {formColor === c && <Feather name="check" size={12} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalBtnRow}>
              <Pressable
                style={styles.modalBtnSecondary}
                onPress={() => { setShowAddModal(false); setFormName(""); }}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtnPrimary, !formName.trim() && styles.modalBtnDisabled]}
                onPress={handleSaveAdd}
                disabled={!formName.trim()}
              >
                <Feather name={formShape === "tap" ? "crosshair" : "plus"} size={15} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>
                  {formShape === "tap" ? "Start Drawing" : "Create Zone"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Edit Zone Modal ─── */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.editModalHeader}>
              <Text style={styles.modalTitle}>Zone Settings</Text>
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

            <View style={styles.editSettingsRow}>
              <View style={[styles.formSection, { flex: 1 }]}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeRow}>
                  {ZONE_TYPES.map((t) => (
                    <Pressable
                      key={t.key}
                      style={[styles.typeChipSmall, formType === t.key && styles.typeChipSmallActive]}
                      onPress={() => setFormType(t.key)}
                    >
                      <Text style={[styles.typeChipSmallText, formType === t.key && styles.typeChipSmallTextActive]}>
                        {t.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Color</Text>
              <View style={styles.colorRow}>
                {ZONE_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    style={[styles.colorSwatchSmall, { backgroundColor: c }, formColor === c && styles.colorSwatchSmallActive]}
                    onPress={() => setFormColor(c)}
                  >
                    {formColor === c && <Feather name="check" size={10} color="#fff" />}
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.editModalDivider} />

            <Pressable
              style={styles.editShapeBtn}
              onPress={handleEnterShapeEdit}
            >
              <View style={styles.editShapeBtnIcon}>
                <Feather name="maximize" size={16} color={Colors.info} />
              </View>
              <View style={styles.editShapeBtnText}>
                <Text style={styles.editShapeBtnTitle}>Edit Boundary Shape</Text>
                <Text style={styles.editShapeBtnDesc}>
                  Drag vertices to adjust the zone area
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={Colors.textTertiary} />
            </Pressable>

            <View style={styles.editModalDivider} />

            <View style={styles.editModalActions}>
              <Pressable
                style={[styles.modalBtnPrimary, styles.editSaveSettingsBtn, !formName.trim() && styles.modalBtnDisabled]}
                onPress={handleSaveEdit}
                disabled={!formName.trim()}
              >
                <Feather name="check" size={15} color="#fff" />
                <Text style={styles.modalBtnPrimaryText}>Save Settings</Text>
              </Pressable>
              <Pressable
                style={styles.deleteBtn}
                onPress={handleDeleteZone}
              >
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: "relative",
  },
  mapContainerEditing: {
    height: SCREEN_HEIGHT * 0.65,
  },
  editOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  editBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  editBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  editBannerText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#1F2937",
  },
  editBannerCount: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "flex-end",
  },
  editCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  editCancelText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#6B7280",
  },
  editSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.info,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    shadowColor: Colors.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  editSaveText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
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
    backgroundColor: "rgba(255,255,255,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
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
    color: "#1F2937",
  },
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
    maxHeight: "90%",
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
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  typeChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  typeChipTextActive: {
    color: Colors.white,
  },
  typeChipSmall: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  typeChipSmallActive: {
    backgroundColor: Colors.info,
    borderColor: Colors.info,
  },
  typeChipSmallText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  typeChipSmallTextActive: {
    color: Colors.white,
  },
  shapeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  shapeCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  shapeCardActive: {
    borderColor: Colors.info,
    backgroundColor: Colors.infoDim,
  },
  shapeCardLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  shapeCardLabelActive: {
    color: Colors.info,
  },
  shapeCardDesc: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  colorSwatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  colorSwatchSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchSmallActive: {
    borderWidth: 2.5,
    borderColor: Colors.white,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  modalBtnSecondary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalBtnSecondaryText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.info,
  },
  modalBtnPrimaryText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  modalBtnDisabled: {
    opacity: 0.4,
  },

  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  editSettingsRow: {
    flexDirection: "row",
    gap: Spacing.md,
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
  },
  editShapeBtnIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoDim,
    alignItems: "center",
    justifyContent: "center",
  },
  editShapeBtnText: {
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
  editSaveSettingsBtn: {
    flex: undefined,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
  },
  deleteBtnText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
});
