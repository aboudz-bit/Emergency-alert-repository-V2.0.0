import React, { useState, useMemo, useCallback } from "react";
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
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone, ZoneType } from "@/types";

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

export default function ZonesScreen() {
  const zones = useStore((s) => s.zones);
  const addZone = useStore((s) => s.addZone);
  const updateZone = useStore((s) => s.updateZone);
  const deleteZone = useStore((s) => s.deleteZone);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<ZoneType>("Custom");
  const [formColor, setFormColor] = useState(ZONE_COLORS[0]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) || null,
    [zones, selectedZoneId]
  );

  const handleZonePress = useCallback((zoneId: number) => {
    setSelectedZoneId((prev) => (prev === zoneId ? null : zoneId));
  }, []);

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
    setShowAddModal(true);
  }, [zones]);

  const handleSaveAdd = useCallback(() => {
    if (!formName.trim()) return;
    const baseLat = 25.078 + (Math.random() - 0.5) * 0.01;
    const baseLng = 48.175 + (Math.random() - 0.5) * 0.02;
    const offset = 0.004;
    addZone({
      name: formName.trim(),
      type: formType,
      boundaryType: "Polygon",
      polygonPoints: [
        { lat: baseLat + offset, lng: baseLng - offset },
        { lat: baseLat + offset, lng: baseLng + offset },
        { lat: baseLat - offset, lng: baseLng + offset },
        { lat: baseLat - offset, lng: baseLng - offset },
      ],
      center: { lat: baseLat, lng: baseLng },
      isActive: true,
      color: formColor,
    });
    setShowAddModal(false);
    setFormName("");
  }, [formName, formType, formColor, addZone]);

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

  return (
    <View style={styles.container}>
      <Header
        title="Zone Map"
        showBack
        rightAction={
          <Pressable style={styles.addBtn} onPress={handleOpenAdd} hitSlop={8}>
            <Feather name="plus" size={20} color={Colors.text} />
          </Pressable>
        }
      />

      <View style={styles.mapContainer}>
        <ZoneMap
          zones={zones}
          selectedZoneId={selectedZoneId}
          onZonePress={handleZonePress}
          height={MAP_HEIGHT}
        />

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
      </View>

      {selectedZone ? (
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
      ) : (
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
      )}

      <Modal visible={showAddModal} transparent animationType="fade" onRequestClose={() => setShowAddModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Zone</Text>
            <Text style={styles.modalSubtitle}>Create a new zone with a default boundary near Khurais</Text>

            <Input
              label="Zone Name"
              value={formName}
              onChangeText={setFormName}
              placeholder="e.g. Storage Yard, Helipad..."
              autoFocus
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Zone Type</Text>
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
              <Text style={styles.formLabel}>Zone Color</Text>
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

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => { setShowAddModal(false); setFormName(""); }}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title="Add Zone"
                onPress={handleSaveAdd}
                variant="primary"
                icon="plus"
                disabled={!formName.trim()}
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Zone</Text>

            <Input
              label="Zone Name"
              value={formName}
              onChangeText={setFormName}
              placeholder="Zone name"
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Zone Type</Text>
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
              <Text style={styles.formLabel}>Zone Color</Text>
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

            <View style={styles.modalActions}>
              <Button
                title="Delete"
                onPress={handleDeleteZone}
                variant="destructive"
                icon="trash-2"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title="Save"
                onPress={handleSaveEdit}
                variant="primary"
                icon="check"
                disabled={!formName.trim()}
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
            <Button
              title="Cancel"
              onPress={() => setShowEditModal(false)}
              variant="ghost"
              fullWidth
              size="md"
            />
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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 420,
    gap: Spacing.lg,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: -Spacing.sm,
  },
  formSection: {
    gap: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
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
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: FontSize.sm,
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
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: Colors.white,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
