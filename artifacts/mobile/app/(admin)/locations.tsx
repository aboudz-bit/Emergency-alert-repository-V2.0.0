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

  const activeZones = useMemo(
    () => zones.filter((z) => z.isActive),
    [zones]
  );

  const allZones = useMemo(() => zones, [zones]);

  const [selectedTab, setSelectedTab] = useState(() =>
    activeZones.length > 0 ? activeZones[0].name : ""
  );

  useEffect(() => {
    if (activeZones.length > 0 && !activeZones.find((z) => z.name === selectedTab)) {
      setSelectedTab(activeZones[0].name);
    }
  }, [activeZones, selectedTab]);

  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationZone, setLocationZone] = useState("");

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

      {activeZones.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
          style={styles.tabBarContainer}
        >
          {activeZones.map((zone) => {
            const isActive = selectedTab === zone.name;
            const count = locations.filter((l) => l.zone === zone.name).length;
            return (
              <Pressable
                key={zone.id}
                style={[styles.tab, isActive && { borderBottomColor: zone.color }]}
                onPress={() => setSelectedTab(zone.name)}
              >
                <View style={[styles.tabDot, { backgroundColor: zone.color }]} />
                <Text style={[styles.tabText, isActive && { color: Colors.text }]}>
                  {zone.name}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    { backgroundColor: isActive ? zone.color + "20" : Colors.surfaceElevated },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      { color: isActive ? zone.color : Colors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.noZonesBar}>
          <Text style={styles.noZonesText}>No active zones. Create zones first.</Text>
        </View>
      )}

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
              <Feather name="map-pin" size={16} color={Colors.textSecondary} />
            </View>
            <View style={styles.locationInfo}>
              <Text style={[styles.locationName, !item.isActive && { color: Colors.textTertiary }]}>
                {item.name}
              </Text>
              <Text style={styles.locationZoneLabel}>{item.zone}</Text>
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
              <Feather name="map-pin" size={40} color={Colors.textSecondary} />
            </View>
            <Text style={styles.emptyTitle}>No Locations</Text>
            <Text style={styles.emptyText}>
              {selectedTab
                ? `No locations in ${selectedTab} zone yet`
                : "Select a zone to view locations"}
            </Text>
            {selectedTab && (
              <Button
                title="Add Location"
                onPress={handleOpenAdd}
                variant="primary"
                icon="plus"
                size="md"
                style={{ marginTop: Spacing.md }}
              />
            )}
          </View>
        }
      />

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLocation ? "Edit Location" : "Add Location"}
            </Text>

            <Input
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Enter location name"
              autoFocus
            />

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Parent Zone</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.zonePickerRow}
              >
                {allZones.map((z) => {
                  const isSelected = locationZone === z.name;
                  return (
                    <Pressable
                      key={z.id}
                      style={[
                        styles.zonePickerChip,
                        isSelected && { borderColor: z.color, backgroundColor: z.color + "20" },
                        !z.isActive && styles.zonePickerChipInactive,
                      ]}
                      onPress={() => setLocationZone(z.name)}
                    >
                      <View style={[styles.zonePickerDot, { backgroundColor: z.color }]} />
                      <Text
                        style={[
                          styles.zonePickerText,
                          isSelected && { color: z.color },
                        ]}
                      >
                        {z.name}
                      </Text>
                      {!z.isActive && (
                        <Text style={styles.inactiveLabel}>(off)</Text>
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              {editingLocation && (
                <Button
                  title="Delete"
                  onPress={handleDelete}
                  variant="destructive"
                  icon="trash-2"
                  size="lg"
                  style={{ flex: 1 }}
                />
              )}
              <Button
                title="Cancel"
                onPress={handleCloseModal}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title={editingLocation ? "Save" : "Add"}
                onPress={handleSave}
                variant="primary"
                disabled={!locationName.trim() || !locationZone}
                size="lg"
                style={{ flex: 1 }}
              />
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
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBarContainer: {
    maxHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabBarScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: Spacing.sm,
  },
  tabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  tabBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tabBadgeText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  noZonesBar: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  noZonesText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
  },
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
    padding: Spacing.lg,
    gap: Spacing.md,
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
    gap: 2,
  },
  locationName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  locationZoneLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
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
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
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
  formSection: {
    gap: Spacing.sm,
  },
  formLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  zonePickerRow: {
    gap: Spacing.sm,
  },
  zonePickerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  zonePickerChipInactive: {
    opacity: 0.6,
  },
  zonePickerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zonePickerText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  inactiveLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
