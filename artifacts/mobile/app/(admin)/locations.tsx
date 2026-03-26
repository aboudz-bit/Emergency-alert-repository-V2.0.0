import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Alert,
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
import type { Location, Zone } from "@/types";

type TabFilter = "active" | "archived";

export default function LocationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const locations = useStore((s) => s.locations);
  const zones = useStore((s) => s.zones);
  const addLocation = useStore((s) => s.addLocation);
  const updateLocation = useStore((s) => s.updateLocation);
  const deleteLocation = useStore((s) => s.deleteLocation);
  const archiveZone = useStore((s) => s.archiveZone);
  const restoreZone = useStore((s) => s.restoreZone);
  const safeDeleteZone = useStore((s) => s.safeDeleteZone);
  const reorderZones = useStore((s) => s.reorderZones);
  const reorderLocations = useStore((s) => s.reorderLocations);
  const updateZone = useStore((s) => s.updateZone);

  const [tabFilter, setTabFilter] = useState<TabFilter>("active");
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  const sortedZones = useMemo(
    () => [...zones].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [zones]
  );

  const activeZones = useMemo(
    () => sortedZones.filter((z) => !z.isArchived),
    [sortedZones]
  );

  const archivedZones = useMemo(
    () => sortedZones.filter((z) => z.isArchived),
    [sortedZones]
  );

  const displayZones = tabFilter === "active" ? activeZones : archivedZones;

  useEffect(() => {
    if (selectedZoneId !== null && !zones.find((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(displayZones.length > 0 ? displayZones[0].id : null);
    }
  }, [zones, selectedZoneId, displayZones]);

  useEffect(() => {
    if (selectedZoneId === null && displayZones.length > 0) {
      setSelectedZoneId(displayZones[0].id);
    }
  }, [tabFilter, displayZones, selectedZoneId]);

  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedZoneId) ?? null,
    [zones, selectedZoneId]
  );

  const filteredLocations = useMemo(() => {
    if (!selectedZoneId) return [];
    return [...locations.filter((l) => l.zoneId === selectedZoneId)]
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [locations, selectedZoneId]);

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationZone, setLocationZone] = useState("");
  const [showZoneActions, setShowZoneActions] = useState(false);

  const handleToggleActive = useCallback(
    (location: Location) => {
      updateLocation(location.id, { isActive: !location.isActive });
    },
    [updateLocation]
  );

  const handleOpenAdd = useCallback(() => {
    setEditingLocation(null);
    setLocationName("");
    setLocationZone(selectedZone?.name ?? "");
    setShowModal(true);
  }, [selectedZone]);

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
      const existingInZone = locations.filter((l) => l.zoneId === zoneId);
      addLocation({
        name: locationName.trim(),
        zone: locationZone,
        zoneId,
        expectedManpower: 0,
        isActive: true,
        sortOrder: existingInZone.length,
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
    if (matchedZone.id !== selectedZoneId) {
      setSelectedZoneId(matchedZone.id);
    }
  }, [locationName, locationZone, editingLocation, updateLocation, addLocation, selectedZoneId, zones, locations]);

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

  const handleArchiveZone = useCallback(() => {
    if (!selectedZone) return;
    const zoneId = selectedZone.id;
    const zoneName = selectedZone.name;
    setShowZoneActions(false);
    setTimeout(() => {
      Alert.alert(
        "Archive Zone",
        `Archive "${zoneName}"? It will be hidden from active lists but all data is preserved.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Archive",
            style: "destructive",
            onPress: () => {
              archiveZone(zoneId);
              setSelectedZoneId(null);
            },
          },
        ]
      );
    }, 300);
  }, [selectedZone, archiveZone]);

  const handleRestoreZone = useCallback(() => {
    if (!selectedZone) return;
    const zoneId = selectedZone.id;
    restoreZone(zoneId);
    setShowZoneActions(false);
    setTabFilter("active");
    setSelectedZoneId(zoneId);
  }, [selectedZone, restoreZone]);

  const handleSafeDeleteZone = useCallback(() => {
    if (!selectedZone) return;
    const zoneId = selectedZone.id;
    const zoneName = selectedZone.name;
    setShowZoneActions(false);
    setTimeout(() => {
      Alert.alert(
        "Delete Zone",
        `Permanently delete "${zoneName}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              const result = safeDeleteZone(zoneId);
              if (!result.success) {
                Alert.alert("Cannot Delete", result.error ?? "Unknown error");
              } else {
                setSelectedZoneId(null);
              }
            },
          },
        ]
      );
    }, 300);
  }, [selectedZone, safeDeleteZone]);

  const handleMoveZone = useCallback(
    (zoneId: number, direction: "up" | "down") => {
      const list = tabFilter === "active" ? activeZones : archivedZones;
      const idx = list.findIndex((z) => z.id === zoneId);
      if (idx < 0) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= list.length) return;
      const reordered = [...list];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
      reorderZones(reordered.map((z) => z.id));
    },
    [tabFilter, activeZones, archivedZones, reorderZones]
  );

  const handleMoveLocation = useCallback(
    (locId: number, direction: "up" | "down") => {
      const idx = filteredLocations.findIndex((l) => l.id === locId);
      if (idx < 0 || !selectedZoneId) return;
      const newIdx = direction === "up" ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= filteredLocations.length) return;
      const reordered = [...filteredLocations];
      [reordered[idx], reordered[newIdx]] = [reordered[newIdx], reordered[idx]];
      reorderLocations(selectedZoneId, reordered.map((l) => l.id));
    },
    [filteredLocations, selectedZoneId, reorderLocations]
  );

  const totalLocations = useMemo(
    () => locations.filter((l) => {
      const z = zones.find((zn) => zn.id === l.zoneId);
      return z && !z.isArchived;
    }).length,
    [locations, zones]
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={Colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Locations</Text>
          <Text style={styles.headerSub}>
            {totalLocations} location{totalLocations !== 1 ? "s" : ""} · {activeZones.length} active zone{activeZones.length !== 1 ? "s" : ""}
            {archivedZones.length > 0 ? ` · ${archivedZones.length} archived` : ""}
          </Text>
        </View>
        {tabFilter === "active" && selectedZone && !selectedZone.isArchived && (
          <Pressable style={styles.headerBtnAccent} onPress={handleOpenAdd} hitSlop={8}>
            <Feather name="plus" size={20} color="#fff" />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        <Pressable
          style={[styles.filterChip, tabFilter === "active" && styles.filterChipActive]}
          onPress={() => { setTabFilter("active"); setSelectedZoneId(null); }}
        >
          <Feather name="layers" size={14} color={tabFilter === "active" ? Colors.info : Colors.textSecondary} />
          <Text style={[styles.filterChipText, tabFilter === "active" && styles.filterChipTextActive]}>
            Active ({activeZones.length})
          </Text>
        </Pressable>
        {archivedZones.length > 0 && (
          <Pressable
            style={[styles.filterChip, tabFilter === "archived" && styles.filterChipActive]}
            onPress={() => { setTabFilter("archived"); setSelectedZoneId(null); }}
          >
            <Feather name="archive" size={14} color={tabFilter === "archived" ? Colors.amber : Colors.textSecondary} />
            <Text style={[styles.filterChipText, tabFilter === "archived" && styles.filterChipTextActive]}>
              Archived ({archivedZones.length})
            </Text>
          </Pressable>
        )}
      </View>

      {displayZones.length > 0 ? (
        <View style={styles.tabBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabBarContent}
          >
            {displayZones.map((zone, zIdx) => {
              const isSelected = selectedZoneId === zone.id;
              const count = locations.filter((l) => l.zoneId === zone.id).length;
              return (
                <Pressable
                  key={zone.id}
                  style={[styles.tab, isSelected && styles.tabSelected]}
                  onPress={() => setSelectedZoneId(zone.id)}
                  onLongPress={() => {
                    setSelectedZoneId(zone.id);
                    setShowZoneActions(true);
                  }}
                >
                  <View style={[styles.tabIndicator, { backgroundColor: isSelected ? zone.color : "transparent" }]} />
                  <View style={styles.tabContent}>
                    <Text
                      style={[styles.tabName, isSelected && styles.tabNameSelected]}
                      numberOfLines={1}
                    >
                      {zone.name}
                    </Text>
                    <Text style={[styles.tabCount, isSelected && { color: zone.color }]}>
                      {count} loc{count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.tabActions}>
                      {zIdx > 0 && (
                        <Pressable
                          style={styles.orderBtn}
                          onPress={() => handleMoveZone(zone.id, "up")}
                          hitSlop={4}
                        >
                          <Feather name="chevron-left" size={14} color={Colors.textTertiary} />
                        </Pressable>
                      )}
                      {zIdx < displayZones.length - 1 && (
                        <Pressable
                          style={styles.orderBtn}
                          onPress={() => handleMoveZone(zone.id, "down")}
                          hitSlop={4}
                        >
                          <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
                        </Pressable>
                      )}
                      <Pressable
                        style={styles.orderBtn}
                        onPress={() => setShowZoneActions(true)}
                        hitSlop={4}
                      >
                        <Feather name="more-horizontal" size={14} color={Colors.textSecondary} />
                      </Pressable>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        <View style={styles.noZonesBar}>
          <Feather
            name={tabFilter === "archived" ? "archive" : "alert-circle"}
            size={14}
            color={Colors.textTertiary}
          />
          <Text style={styles.noZonesText}>
            {tabFilter === "archived" ? "No archived zones" : "Create zones first"}
          </Text>
        </View>
      )}

      {selectedZone && (
        <View style={styles.zoneInfoStrip}>
          <View style={[styles.zoneColorBar, { backgroundColor: selectedZone.color }]} />
          <View style={styles.zoneInfoContent}>
            <Text style={styles.zoneInfoName}>{selectedZone.name}</Text>
            <Text style={styles.zoneInfoMeta}>
              {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""}
              {selectedZone.isArchived ? " · Archived" : ""}
            </Text>
          </View>
          {!selectedZone.isActive && !selectedZone.isArchived && (
            <View style={styles.offBadge}>
              <Text style={styles.offText}>OFF</Text>
            </View>
          )}
          {selectedZone.isArchived && (
            <View style={styles.archivedBadge}>
              <Text style={styles.archivedBadgeText}>ARCHIVED</Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        renderItem={({ item, index }) => (
          <View style={styles.locationCard}>
            <View style={styles.locationCardLeft}>
              <View style={[styles.locationDot, {
                backgroundColor: item.isActive
                  ? (selectedZone?.color || Colors.safe)
                  : Colors.textTertiary
              }]} />
              <View style={styles.locationCardInfo}>
                <Text
                  style={[styles.locationName, !item.isActive && { color: Colors.textTertiary }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                {item.expectedManpower > 0 && (
                  <Text style={styles.locationMeta}>
                    {item.expectedManpower} expected
                  </Text>
                )}
              </View>
            </View>
            <View style={styles.locationCardRight}>
              <View style={styles.locationOrderBtns}>
                {index > 0 && (
                  <Pressable
                    style={styles.locationOrderBtn}
                    onPress={() => handleMoveLocation(item.id, "up")}
                    hitSlop={4}
                  >
                    <Feather name="chevron-up" size={14} color={Colors.textTertiary} />
                  </Pressable>
                )}
                {index < filteredLocations.length - 1 && (
                  <Pressable
                    style={styles.locationOrderBtn}
                    onPress={() => handleMoveLocation(item.id, "down")}
                    hitSlop={4}
                  >
                    <Feather name="chevron-down" size={14} color={Colors.textTertiary} />
                  </Pressable>
                )}
              </View>
              <Switch
                value={item.isActive}
                onValueChange={() => handleToggleActive(item)}
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={item.isActive ? Colors.safe : Colors.textSecondary}
                style={styles.locationSwitch}
              />
              <Pressable
                style={({ pressed }) => [styles.locationEditBtn, pressed && { opacity: 0.6 }]}
                onPress={() => handleOpenEdit(item)}
                hitSlop={6}
              >
                <Feather name="edit-2" size={14} color={Colors.textSecondary} />
              </Pressable>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="map-pin" size={32} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>
              {selectedZone
                ? selectedZone.isArchived
                  ? `"${selectedZone.name}" is archived`
                  : `Tap + to add locations to ${selectedZone.name}`
                : "Select a zone first"}
            </Text>
          </View>
        }
      />

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
                {zones.filter((z) => !z.isArchived).map((z) => {
                  const isChipSelected = locationZone === z.name;
                  return (
                    <Pressable
                      key={z.id}
                      style={[
                        styles.zoneChip,
                        isChipSelected && { borderColor: z.color, backgroundColor: z.color + "18" },
                      ]}
                      onPress={() => setLocationZone(z.name)}
                    >
                      <View style={[styles.zoneChipDot, { backgroundColor: z.color }]} />
                      <Text
                        style={[styles.zoneChipText, isChipSelected && { color: z.color }]}
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

      <Modal
        visible={showZoneActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowZoneActions(false)}
      >
        <View style={styles.actionOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowZoneActions(false)} />
          <View style={[styles.actionSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.actionSheetTitle}>
              {selectedZone?.name ?? "Zone"} Options
            </Text>

            {selectedZone && !selectedZone.isArchived && (
              <Pressable
                style={styles.actionRow}
                onPress={handleArchiveZone}
              >
                <Feather name="archive" size={18} color={Colors.amber} />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Archive Zone</Text>
                  <Text style={styles.actionRowSub}>
                    Hide from active lists. All data preserved.
                  </Text>
                </View>
              </Pressable>
            )}

            {selectedZone?.isArchived && (
              <Pressable
                style={styles.actionRow}
                onPress={handleRestoreZone}
              >
                <Feather name="rotate-ccw" size={18} color={Colors.safe} />
                <View style={styles.actionRowContent}>
                  <Text style={styles.actionRowTitle}>Restore Zone</Text>
                  <Text style={styles.actionRowSub}>
                    Move back to active zones.
                  </Text>
                </View>
              </Pressable>
            )}

            <Pressable
              style={styles.actionRow}
              onPress={handleSafeDeleteZone}
            >
              <Feather name="trash-2" size={18} color={Colors.destructive} />
              <View style={styles.actionRowContent}>
                <Text style={[styles.actionRowTitle, { color: Colors.destructive }]}>
                  Delete Zone
                </Text>
                <Text style={styles.actionRowSub}>
                  Only works if zone has no linked data.
                </Text>
              </View>
            </Pressable>

            <Pressable
              style={[styles.actionRow, { borderBottomWidth: 0 }]}
              onPress={() => setShowZoneActions(false)}
            >
              <Feather name="x" size={18} color={Colors.textSecondary} />
              <Text style={styles.actionRowTitle}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingBottom: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
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

  filterRow: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.surfaceElevated,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: {
    borderColor: Colors.infoBorder, backgroundColor: Colors.infoDim,
  },
  filterChipText: {
    fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },
  filterChipTextActive: { color: Colors.info },

  tabBar: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tabBarContent: { paddingHorizontal: 10, gap: 4 },
  tab: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, minHeight: 48,
  },
  tabSelected: {
    backgroundColor: Colors.surfaceElevated,
  },
  tabIndicator: {
    width: 4, height: 28, borderRadius: 2,
  },
  tabContent: { gap: 1 },
  tabName: {
    fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary,
  },
  tabNameSelected: { color: Colors.text },
  tabCount: {
    fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textTertiary,
  },
  tabActions: {
    flexDirection: "row", alignItems: "center", gap: 2, marginLeft: 4,
  },
  orderBtn: {
    width: 24, height: 24, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.background,
  },

  noZonesBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  noZonesText: {
    fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },

  zoneInfoStrip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    overflow: "hidden",
  },
  zoneColorBar: {
    width: 4, alignSelf: "stretch",
  },
  zoneInfoContent: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 1,
  },
  zoneInfoName: {
    fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.text,
  },
  zoneInfoMeta: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },
  offBadge: {
    backgroundColor: Colors.primaryDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 12,
  },
  offText: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.primary, letterSpacing: 0.5,
  },
  archivedBadge: {
    backgroundColor: Colors.amberDim, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 12,
  },
  archivedBadgeText: {
    fontSize: 10, fontFamily: "Inter_700Bold", color: Colors.amber, letterSpacing: 0.5,
  },

  listContent: { padding: 12, gap: 6 },
  locationCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingLeft: 14, paddingRight: 8, paddingVertical: 10,
    minHeight: 56,
  },
  locationCardLeft: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 12,
  },
  locationDot: {
    width: 8, height: 8, borderRadius: 4,
  },
  locationCardInfo: { flex: 1, gap: 1 },
  locationName: {
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  locationMeta: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },
  locationCardRight: {
    flexDirection: "row", alignItems: "center", gap: 6,
  },
  locationOrderBtns: {
    gap: 2,
  },
  locationOrderBtn: {
    width: 24, height: 20, borderRadius: 4,
    alignItems: "center", justifyContent: "center",
    backgroundColor: Colors.surfaceElevated,
  },
  locationSwitch: { transform: [{ scale: 0.8 }] },
  locationEditBtn: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center", justifyContent: "center",
  },

  emptyState: {
    alignItems: "center", paddingVertical: 60, gap: 8,
  },
  emptyTitle: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text, marginTop: 4,
  },
  emptyText: {
    fontSize: FontSize.sm, fontFamily: "Inter_400Regular", color: Colors.textSecondary, textAlign: "center",
  },

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

  actionOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 16, gap: 4,
  },
  actionSheetTitle: {
    fontSize: FontSize.lg, fontFamily: "Inter_700Bold", color: Colors.text,
    marginBottom: 8, marginTop: 4,
  },
  actionRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  actionRowContent: { flex: 1, gap: 2 },
  actionRowTitle: {
    fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text,
  },
  actionRowSub: {
    fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },
});
