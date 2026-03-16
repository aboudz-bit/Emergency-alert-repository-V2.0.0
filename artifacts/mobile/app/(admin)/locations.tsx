import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Location } from "@/types";

export default function LocationsScreen() {
  const locations = useStore((s) => s.locations);
  const zones = useStore((s) => s.zones);
  const addLocation = useStore((s) => s.addLocation);
  const updateLocation = useStore((s) => s.updateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);

  const [selectedTab, setSelectedTab] = useState(() =>
    zones.length > 0 ? zones[0].name : ""
  );

  useEffect(() => {
    if (zones.length > 0 && !zones.find((z) => z.name === selectedTab)) {
      setSelectedTab(zones[0].name);
    }
  }, [zones, selectedTab]);

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationZone, setLocationZone] = useState("");

  const selectedZone = useMemo(
    () => zones.find((z) => z.name === selectedTab),
    [zones, selectedTab]
  );

  const filteredLocations = useMemo(
    () => locations.filter((l) => l.zone === selectedTab),
    [locations, selectedTab]
  );

  const handleToggleActive = useCallback(
    (location: Location) => {
      updateLocation(location.id, { isActive: !location.isActive });
    },
    [updateLocation]
  );

  const handleOpenAdd = useCallback(() => {
    setEditingLocation(null);
    setLocationName("");
    setLocationZone(selectedTab);
    setShowModal(true);
  }, [selectedTab]);

  const handleOpenEdit = useCallback((location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setLocationZone(location.zone);
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!locationName.trim() || !locationZone) return;
    if (editingLocation) {
      updateLocation(editingLocation.id, {
        name: locationName.trim(),
        zone: locationZone,
      });
    } else {
      addLocation({
        name: locationName.trim(),
        zone: locationZone,
        isActive: true,
      });
    }
    setShowModal(false);
    setLocationName("");
    setEditingLocation(null);
    if (locationZone !== selectedTab) {
      setSelectedTab(locationZone);
    }
  }, [locationName, locationZone, editingLocation, updateLocation, addLocation, selectedTab]);

  const handleDelete = useCallback(() => {
    if (!editingLocation) return;
    deleteLocation(editingLocation.id);
    setShowModal(false);
    setEditingLocation(null);
    setLocationName("");
  }, [editingLocation, deleteLocation]);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setLocationName("");
    setEditingLocation(null);
  }, []);

  return (
    <View style={styles.container}>
      <Header
        title="Locations"
        showBack
        rightAction={
          <Pressable style={styles.addBtn} onPress={handleOpenAdd} hitSlop={8}>
            <Feather name="plus" size={20} color={Colors.text} />
          </Pressable>
        }
      />

      {/* ─── Zone tabs ─── */}
      {zones.length > 0 ? (
        <View style={styles.tabBarOuter}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarScroll}
          >
            {zones.map((zone) => {
              const isActive = selectedTab === zone.name;
              const count = locations.filter((l) => l.zone === zone.name).length;
              const color = zone.isActive ? zone.color : Colors.textTertiary;
              return (
                <Pressable
                  key={zone.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setSelectedTab(zone.name)}
                >
                  <View style={[styles.tabIndicator, { backgroundColor: isActive ? color : "transparent" }]} />
                  <View style={styles.tabContent}>
                    <Text
                      style={[
                        styles.tabText,
                        isActive && { color: Colors.text },
                        !zone.isActive && { color: Colors.textTertiary },
                      ]}
                      numberOfLines={1}
                    >
                      {zone.name}
                    </Text>
                    <View style={[styles.tabBadge, isActive && { backgroundColor: color + "25" }]}>
                      <Text style={[styles.tabBadgeText, isActive && { color }]}>
                        {count}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noZonesBar}>
          <Feather name="alert-circle" size={16} color={Colors.textTertiary} />
          <Text style={styles.noZonesText}>Create zones first to manage locations</Text>
        </View>
      )}

      {/* ─── Zone info bar ─── */}
      {selectedZone && (
        <View style={styles.zoneInfoBar}>
          <View style={[styles.zoneInfoDot, { backgroundColor: selectedZone.color }]} />
          <Text style={styles.zoneInfoText}>
            {selectedZone.name}
          </Text>
          <Text style={styles.zoneInfoCount}>
            {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
          </Text>
          {!selectedZone.isActive && (
            <View style={styles.zoneOffBadge}>
              <Text style={styles.zoneOffText}>Zone Off</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Location list ─── */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}
            onPress={() => handleOpenEdit(item)}
          >
            <View style={styles.locationIconWrap}>
              <Feather name="map-pin" size={16} color={selectedZone?.color || Colors.textSecondary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationName, !item.isActive && { color: Colors.textTertiary }]}>
                {item.name}
              </Text>
            </View>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleActive(item)}
              trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
              thumbColor={item.isActive ? Colors.safe : Colors.textSecondary}
            />
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="map-pin" size={36} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>
              {selectedTab
                ? `Add locations to ${selectedTab}`
                : "Select a zone to manage locations"}
            </Text>
            {selectedTab && (
              <Pressable style={styles.emptyAddBtn} onPress={handleOpenAdd}>
                <Feather name="plus" size={16} color={Colors.info} />
                <Text style={styles.emptyAddText}>Add Location</Text>
              </Pressable>
            )}
          </View>
        }
      />

      {/* ─── Add / Edit modal ─── */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLocation ? "Edit Location" : "New Location"}
              </Text>
              <Pressable style={styles.modalClose} onPress={handleCloseModal} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <Input
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Control Room, Helipad..."
              autoFocus
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Assign to Zone</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zonePickerRow}
              >
                {zones.map((z) => {
                  const isSelected = locationZone === z.name;
                  return (
                    <Pressable
                      key={z.id}
                      style={[
                        styles.zonePickerChip,
                        isSelected && { borderColor: z.color, backgroundColor: z.color + "18" },
                      ]}
                      onPress={() => setLocationZone(z.name)}
                    >
                      <View style={[styles.zonePickerDot, { backgroundColor: z.color }]} />
                      <Text
                        style={[
                          styles.zonePickerText,
                          isSelected && { color: z.color, fontFamily: "Inter_700Bold" },
                        ]}
                        numberOfLines={1}
                      >
                        {z.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              {editingLocation && (
                <Pressable style={styles.deleteLocationBtn} onPress={handleDelete}>
                  <Feather name="trash-2" size={16} color={Colors.primary} />
                </Pressable>
              )}
              <View style={styles.modalActionsSpacer} />
              <Pressable style={styles.modalCancelBtn} onPress={handleCloseModal}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalSaveBtn, (!locationName.trim() || !locationZone) && styles.modalSaveBtnDisabled]}
                onPress={handleSave}
                disabled={!locationName.trim() || !locationZone}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.modalSaveText}>
                  {editingLocation ? "Save" : "Add"}
                </Text>
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },

  // ─── Tabs ───
  tabBarOuter: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBarScroll: {
    paddingHorizontal: Spacing.md,
    gap: 2,
  },
  tab: {
    paddingBottom: 2,
  },
  tabActive: {},
  tabIndicator: {
    height: 3,
    borderRadius: 1.5,
    marginBottom: Spacing.xs,
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 40,
  },
  tabText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  tabBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },

  // ─── No zones ───
  noZonesBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noZonesText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },

  // ─── Zone info ───
  zoneInfoBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  zoneInfoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneInfoText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  zoneInfoCount: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    flex: 1,
  },
  zoneOffBadge: {
    backgroundColor: Colors.primaryDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  zoneOffText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },

  // ─── List ───
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: 100,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
    minHeight: 56,
  },
  pressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },

  // ─── Empty ───
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl * 1.5,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  emptyText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  emptyAddBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.infoDim,
    minHeight: 44,
  },
  emptyAddText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.info,
  },

  // ─── Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    paddingTop: Spacing.md,
    gap: Spacing.lg,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: "center",
    marginBottom: Spacing.xs,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
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
  zonePickerRow: {
    gap: Spacing.sm,
  },
  zonePickerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: 44,
  },
  zonePickerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zonePickerText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },

  // ─── Modal actions ───
  modalActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  deleteLocationBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActionsSpacer: {
    flex: 1,
  },
  modalCancelBtn: {
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  modalCancelText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.xl,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.info,
  },
  modalSaveBtnDisabled: {
    opacity: 0.35,
  },
  modalSaveText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
