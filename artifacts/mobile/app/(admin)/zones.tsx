import React from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { Zone } from "@/types";

export default function ZonesScreen() {
  const zones = useStore((s) => s.zones);
  const updateZone = useStore((s) => s.updateZone);

  const handleToggleZone = (zone: Zone) => {
    updateZone(zone.id, { isActive: !zone.isActive });
  };

  const handleAddZone = () => {
    Alert.alert(
      "Desktop Only",
      "Zone creation with boundary drawing is available in the desktop version. Please use the web admin panel to add new zones.",
      [{ text: "OK" }]
    );
  };

  const handleEditZone = (zone: Zone) => {
    Alert.alert(
      "Desktop Only",
      "Zone boundary editing is available in the desktop version. You can toggle the active status from here.",
      [{ text: "OK" }]
    );
  };

  const renderZoneCard = ({ item }: { item: Zone }) => (
    <Card style={styles.zoneCard}>
      <View style={styles.zoneHeader}>
        <View style={styles.zoneHeaderLeft}>
          <View
            style={[styles.colorIndicator, { backgroundColor: item.color }]}
          />
          <View style={styles.zoneNameWrap}>
            <Text style={styles.zoneName}>{item.name}</Text>
            <Text style={styles.zoneType}>{item.type} Zone</Text>
          </View>
        </View>
        <StatusBadge
          status={item.isActive ? "enabled" : "disabled"}
        />
      </View>

      <View style={styles.zoneDetails}>
        <View style={styles.detailRow}>
          <Feather name="map" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            Boundary: {item.boundaryType}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Feather name="map-pin" size={14} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            Points: {item.polygonPoints.length}
          </Text>
        </View>
        {item.center && (
          <View style={styles.detailRow}>
            <Feather name="crosshair" size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>
              Center: {item.center.lat.toFixed(4)}, {item.center.lng.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {/* Coordinates Preview */}
      {item.polygonPoints.length > 0 && (
        <View style={styles.coordsSection}>
          <Text style={styles.coordsTitle}>Coordinates</Text>
          <View style={styles.coordsList}>
            {item.polygonPoints.slice(0, 3).map((point, idx) => (
              <Text key={idx} style={styles.coordText}>
                ({point.lat.toFixed(4)}, {point.lng.toFixed(4)})
              </Text>
            ))}
            {item.polygonPoints.length > 3 && (
              <Text style={styles.coordText}>
                +{item.polygonPoints.length - 3} more points
              </Text>
            )}
          </View>
        </View>
      )}

      <View style={styles.zoneActions}>
        <Button
          title="Edit"
          onPress={() => handleEditZone(item)}
          variant="secondary"
          style={{ flex: 1 }}
        />
        <Button
          title={item.isActive ? "Disable" : "Enable"}
          onPress={() => handleToggleZone(item)}
          variant={item.isActive ? "ghost" : "safe"}
          style={{ flex: 1 }}
        />
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header title="Zone Management" showBack />

      <FlatList
        data={zones}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        renderItem={renderZoneCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="map" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No zones configured</Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Add Zone"
            onPress={handleAddZone}
            variant="secondary"
            fullWidth
            style={{ marginTop: Spacing.md }}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  zoneCard: {
    gap: Spacing.md,
  },
  zoneHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  zoneHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  colorIndicator: {
    width: 12,
    height: 40,
    borderRadius: 6,
  },
  zoneNameWrap: {
    gap: 2,
  },
  zoneName: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  zoneType: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  zoneDetails: {
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  detailText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  coordsSection: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  coordsTitle: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: Spacing.xs,
  },
  coordsList: {
    gap: 2,
  },
  coordText: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  zoneActions: {
    flexDirection: "row",
    gap: Spacing.md,
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
});
