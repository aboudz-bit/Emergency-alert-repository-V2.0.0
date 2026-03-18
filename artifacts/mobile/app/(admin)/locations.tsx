import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Location } from "@/types";

export default function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
    const matchedZone = zones.find((z) => z.name === locationZone);
    if (!locationName.trim() || !matchedZone) return;
    const zoneId = matchedZone.id;
    if (editingLocation) {
      updateLocation(editingLocation.id, {
        name: locationName.trim(),
        zone: locationZone,
        zoneId,
      });
    } else {
      addLocation({
        name: locationName.trim(),
        zone: locationZone,
        zoneId,
        expectedManpower: 0,
        isActive: true,
        polygonPoints: [],
        alertActive: false,
        alertType: null,
        alertPriority: null,
        alertMessage: "",
        alertUpdatedAt: null,
        alertHistory: [],
      });
    }
    setShowModal(false);
    setLocationName("");
    setEditingLocation(null);
    if (locationZone !== selectedTab) {
      setSelectedTab(locationZone);
    }
  }, [locationName, locationZone, editingLocation, updateLocation, addLocation, selectedTab, zones]);

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
    <View style={styles.root}>
      {/* ─── Header ─── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Locations</Text>
          <Text style={styles.headerSub}>
            {locations.length} total · {zones.length} zone{zones.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <Pressable style={styles.headerBtnAccent} onPress={handleOpenAdd} hitSlop={8}>
          <Feather name="plus" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* ─── Zone tabs ─── */}
      {zones.length > 0 ? (
        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {zones.map((zone) => {
              const isActive = selectedTab === zone.name;
              const count = locations.filter((l) => l.zoneId === zone.id).length;
              return (
                <Pressable
                  key={zone.id}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setSelectedTab(zone.name)}
                >
                  <View style={[styles.tabDot, { backgroundColor: isActive ? zone.color : Colors.textTertiary }]} />
                  <Text
                    style={[styles.tabText, isActive && styles.tabTextActive]}
                    numberOfLines={1}
                  >
                    {zone.name}
                  </Text>
                  <Text style={[styles.tabCount, isActive && { color: zone.color }]}>
                    {count}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noZonesBar}>
          <Feather name="alert-circle" size={14} color={Colors.textTertiary} />
          <Text style={styles.noZonesText}>Create zones first</Text>
        </View>
      )}

      {/* ─── Zone info strip ─── */}
      {selectedZone && (
        <View style={styles.infoStrip}>
          <View style={[styles.infoDot, { backgroundColor: selectedZone.color }]} />
          <Text style={styles.infoLabel}>{selectedZone.name}</Text>
          <Text style={styles.infoCount}>
            {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
          </Text>
          {!selectedZone.isActive && (
            <View style={styles.offBadge}>
              <Text style={styles.offText}>OFF</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Location list ─── */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Feather
              name="map-pin"
              size={14}
              color={item.isActive ? (selectedZone?.color || Colors.textSecondary) : Colors.textTertiary}
            />
            <Text
              style={[styles.rowName, !item.isActive && { color: Colors.textTertiary }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Switch
              value={item.isActive}
              onValueChange={() => handleToggleActive(item)}
              trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
              thumbColor={item.isActive ? Colors.safe : Colors.textSecondary}
              style={styles.rowSwitch}
            />
            <Pressable
              style={({ pressed }) => [styles.rowEditBtn, pressed && { opacity: 0.6 }]}
              onPress={() => handleOpenEdit(item)}
              hitSlop={6}
            >
              <Feather name="edit-2" size={14} color={Colors.textSecondary} />
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>
              {selectedTab ? `Tap + to add locations to ${selectedTab}` : "Select a zone first"}
            </Text>
          </View>
        }
      />

      {/* ─── Add / Edit modal ─── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={handleCloseModal}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLocation ? "Edit Location" : "New Location"}
              </Text>
              <Pressable style={styles.modalClose} onPress={handleCloseModal} hitSlop={8}>
                <Feather name="x" size={18} color={Colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={styles.nameInput}
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Location name..."
              placeholderTextColor={Colors.textTertiary}
            />

            <View style={styles.zonePickerSection}>
              <Text style={styles.zonePickerLabel}>Zone</Text>
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
                        styles.zoneChip,
                        isSelected && { borderColor: z.color, backgroundColor: z.color + "18" },
                      ]}
                      onPress={() => setLocationZone(z.name)}
                    >
                      <View style={[styles.zoneChipDot, { backgroundColor: z.color }]} />
                      <Text
                        style={[styles.zoneChipText, isSelected && { color: z.color }]}
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
                <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                  <Feather name="trash-2" size={16} color={Colors.primary} />
                </Pressable>
              )}
              <View style={{ flex: 1 }} />
              <Pressable style={styles.cancelBtn} onPress={handleCloseModal}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (!locationName.trim() || !locationZone) && { opacity: 0.3 }]}
                onPress={handleSave}
                disabled={!locationName.trim() || !locationZone}
              >
                <Feather name="check" size={16} color="#fff" />
                <Text style={styles.saveBtnText}>
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
  root: { flex: 1, backgroundColor: Colors.background },

  // ─── Header ───
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  headerCenter: { flex: 1, gap: 1 },
  headerTitle: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  headerSub: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
  },
  headerBtnAccent: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.info, alignItems: "center", justifyContent: "center",
  },

  // ─── Tabs ───
  tabBar: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  tabBarContent: { paddingHorizontal: 12, gap: 2 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 2, borderBottomColor: "transparent",
    minHeight: 44,
  },
  tabActive: { borderBottomColor: Colors.text },
  tabDot: { width: 7, height: 7, borderRadius: 3.5 },
  tabText: {
    fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },
  tabTextActive: { color: Colors.text },
  tabCount: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.textTertiary,
  },

  // ─── No zones ───
  noZonesBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  noZonesText: {
    fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },

  // ─── Info strip ───
  infoStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoDot: { width: 8, height: 8, borderRadius: 4 },
  infoLabel: {
    fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  infoCount: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary, flex: 1,
  },
  offBadge: {
    backgroundColor: Colors.primaryDim, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  offText: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.primary, letterSpacing: 0.5,
  },

  // ─── List ───
  listContent: { padding: 14, gap: 6 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: Colors.surface, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    minHeight: 48,
  },
  rowEditBtn: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },
  rowName: {
    flex: 1, fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  rowSwitch: { transform: [{ scale: 0.85 }] },

  // ─── Empty ───
  emptyState: {
    alignItems: "center", paddingVertical: 60, gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: 4,
  },
  emptyText: {
    fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center",
  },

  // ─── Modal ───
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 14,
  },
  modalHandle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  modalTitle: { fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text },
  modalClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surfaceElevated, alignItems: "center", justifyContent: "center",
  },
  nameInput: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  zonePickerSection: { gap: 8 },
  zonePickerLabel: {
    fontSize: FontSize.xs, fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5,
  },
  zonePickerRow: { gap: 8 },
  zoneChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated, minHeight: 44,
  },
  zoneChipDot: { width: 8, height: 8, borderRadius: 4 },
  zoneChipText: {
    fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },

  // ─── Modal actions ───
  modalActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  deleteBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: Colors.primaryDim, alignItems: "center", justifyContent: "center",
  },
  cancelBtn: {
    paddingHorizontal: 18, minHeight: 44,
    justifyContent: "center", alignItems: "center",
    borderRadius: 10, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
  },
  cancelBtnText: {
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },
  saveBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 20, minHeight: 44,
    borderRadius: 10, backgroundColor: Colors.info,
  },
  saveBtnText: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: "#fff" },
});
