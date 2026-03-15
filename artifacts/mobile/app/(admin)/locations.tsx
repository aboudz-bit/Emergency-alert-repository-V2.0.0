import React, { useState, useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
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

  const activeZones = useMemo(
    () => zones.filter((z) => z.isActive),
    [zones]
  );

  const [selectedTab, setSelectedTab] = useState(() =>
    activeZones.length > 0 ? activeZones[0].name : "CPF"
  );
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");

  const filteredLocations = useMemo(
    () => locations.filter((l) => l.zone === selectedTab),
    [locations, selectedTab]
  );

  const handleToggleActive = (location: Location) => {
    updateLocation(location.id, { isActive: !location.isActive });
  };

  const handleOpenAdd = () => {
    setEditingLocation(null);
    setLocationName("");
    setShowModal(true);
  };

  const handleOpenEdit = (location: Location) => {
    setEditingLocation(location);
    setLocationName(location.name);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!locationName.trim()) return;
    if (editingLocation) {
      updateLocation(editingLocation.id, { name: locationName.trim() });
    } else {
      addLocation({
        name: locationName.trim(),
        zone: selectedTab,
        isActive: true,
      });
    }
    setShowModal(false);
    setLocationName("");
    setEditingLocation(null);
  };

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

      <View style={styles.tabBar}>
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
      </View>

      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.locationRow, pressed && styles.pressed]}
            onPress={() => handleOpenEdit(item)}
          >
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
            <Feather name="map-pin" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No locations in {selectedTab}</Text>
          </View>
        }
      />

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingLocation ? "Edit Location" : "Add Location"}
            </Text>
            <Text style={styles.modalSubtitle}>Zone: {selectedTab}</Text>
            <Input
              label="Location Name"
              value={locationName}
              onChangeText={setLocationName}
              placeholder="Enter location name"
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => {
                  setShowModal(false);
                  setLocationName("");
                  setEditingLocation(null);
                }}
                variant="secondary"
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title={editingLocation ? "Update" : "Add"}
                onPress={handleSave}
                variant="primary"
                disabled={!locationName.trim()}
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
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
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
  },
  pressed: {
    backgroundColor: Colors.surfaceElevated,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
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
    maxWidth: 400,
    gap: Spacing.md,
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
  },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
});
