import React, { useState } from "react";
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
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Location } from "@/types";

type ZoneTab = "CPF" | "Camp";

export default function LocationsScreen() {
  const locations = useStore((s) => s.locations);
  const addLocation = useStore((s) => s.addLocation);
  const updateLocation = useStore((s) => s.updateLocation);

  const [selectedTab, setSelectedTab] = useState<ZoneTab>("CPF");
  const [showModal, setShowModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [locationName, setLocationName] = useState("");

  const filteredLocations = locations.filter((l) => l.zone === selectedTab);

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

  const renderLocationRow = ({ item }: { item: Location }) => (
    <Pressable style={styles.locationRow} onPress={() => handleOpenEdit(item)}>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationZone}>{item.zone}</Text>
      </View>
      <Switch
        value={item.isActive}
        onValueChange={() => handleToggleActive(item)}
        trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
        thumbColor={item.isActive ? Colors.safe : Colors.textSecondary}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Header title="Location Management" showBack />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(["CPF", "Camp"] as ZoneTab[]).map((tab) => (
          <Pressable
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Feather
              name={tab === "CPF" ? "hard-drive" : "home"}
              size={16}
              color={selectedTab === tab ? Colors.primary : Colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
            <View
              style={[
                styles.tabBadge,
                {
                  backgroundColor:
                    selectedTab === tab ? Colors.primaryDim : Colors.surfaceElevated,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabBadgeText,
                  {
                    color:
                      selectedTab === tab ? Colors.primary : Colors.textSecondary,
                  },
                ]}
              >
                {locations.filter((l) => l.zone === tab).length}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Location List */}
      <FlatList
        data={filteredLocations}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderLocationRow}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map-pin" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No locations in {selectedTab}</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable style={styles.fab} onPress={handleOpenAdd}>
        <Feather name="plus" size={24} color={Colors.white} />
      </Pressable>

      {/* Add/Edit Modal */}
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
            <Text style={styles.modalSubtitle}>
              Zone: {selectedTab}
            </Text>
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
                style={{ flex: 1 }}
              />
              <Button
                title={editingLocation ? "Update" : "Add"}
                onPress={handleSave}
                variant="primary"
                disabled={!locationName.trim()}
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
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
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
  locationInfo: {
    flex: 1,
    gap: 2,
  },
  locationName: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  locationZone: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
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
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
