import React, { useState, useMemo } from "react";
import {
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type {
  EmergencyIntelligence,
  ZoneIntelligence,
  SuggestedAction,
} from "@/hooks/useEmergencyIntelligence";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SmartAlertPanelProps {
  intelligence: EmergencyIntelligence;
  maxHeight?: number;
  onFocusZone?: (zoneId: number) => void;
  onFocusLocation?: (locationId: number) => void;
}

export function SmartAlertPanel({
  intelligence,
  maxHeight = 320,
  onFocusZone,
  onFocusLocation,
}: SmartAlertPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const {
    isActive,
    criticalZones,
    totalMissing,
    totalNeedHelp,
    suggestedActions,
    hasCriticalSituation,
  } = intelligence;

  if (!isActive || !hasCriticalSituation) return null;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={toggleExpand}>
        <View style={styles.headerLeft}>
          <View style={styles.pulseOuter}>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.headerTitle}>SITUATION AWARENESS</Text>
        </View>
        <View style={styles.headerRight}>
          {totalNeedHelp > 0 && (
            <View style={styles.headerBadgeRed}>
              <Text style={styles.headerBadgeText}>{totalNeedHelp} HELP</Text>
            </View>
          )}
          {totalMissing > 0 && (
            <View style={styles.headerBadgeAmber}>
              <Text style={styles.headerBadgeText}>
                {totalMissing} MISSING
              </Text>
            </View>
          )}
          <Feather
            name={expanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={Colors.white}
          />
        </View>
      </Pressable>

      {expanded && (
        <ScrollView
          style={[styles.body, { maxHeight }]}
          contentContainerStyle={styles.bodyContent}
          nestedScrollEnabled
        >
          {suggestedActions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SUGGESTED ACTIONS</Text>
              {suggestedActions.slice(0, 4).map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onPress={() => {
                    if (action.locationId && onFocusLocation) {
                      onFocusLocation(action.locationId);
                    } else if (action.zoneId && onFocusZone) {
                      onFocusZone(action.zoneId);
                    }
                  }}
                />
              ))}
            </View>
          )}

          {criticalZones.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>AFFECTED AREAS</Text>
              {criticalZones.map((zone) => (
                <ZoneCard
                  key={zone.zoneId}
                  zone={zone}
                  onPress={() => onFocusZone?.(zone.zoneId)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ActionCard({
  action,
  onPress,
}: {
  action: SuggestedAction;
  onPress: () => void;
}) {
  const isCritical = action.priority === "critical";
  return (
    <Pressable
      style={[
        styles.actionCard,
        isCritical && styles.actionCardCritical,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIcon,
          { backgroundColor: isCritical ? "rgba(220,38,38,0.15)" : "rgba(217,119,6,0.15)" },
        ]}
      >
        <Feather
          name={action.icon as any}
          size={14}
          color={isCritical ? Colors.destructive : Colors.missing}
        />
      </View>
      <View style={styles.actionText}>
        <Text
          style={[
            styles.actionTitle,
            isCritical && { color: Colors.destructive },
          ]}
        >
          {action.title}
        </Text>
        <Text style={styles.actionDesc} numberOfLines={2}>
          {action.description}
        </Text>
      </View>
      <Feather name="chevron-right" size={14} color={Colors.textTertiary} />
    </Pressable>
  );
}

function ZoneCard({
  zone,
  onPress,
}: {
  zone: ZoneIntelligence;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.zoneCard} onPress={onPress}>
      <View style={styles.zoneHeader}>
        <View
          style={[styles.zoneDot, { backgroundColor: zone.zoneColor }]}
        />
        <Text style={styles.zoneName} numberOfLines={1}>
          {zone.zoneName}
        </Text>
      </View>
      <View style={styles.zoneStats}>
        {zone.needHelpCount > 0 && (
          <View style={styles.zoneStat}>
            <Text style={[styles.zoneStatValue, { color: Colors.destructive }]}>
              {zone.needHelpCount}
            </Text>
            <Text style={styles.zoneStatLabel}>Help</Text>
          </View>
        )}
        {zone.missingCount > 0 && (
          <View style={styles.zoneStat}>
            <Text style={[styles.zoneStatValue, { color: Colors.missing }]}>
              {zone.missingCount}
            </Text>
            <Text style={styles.zoneStatLabel}>Missing</Text>
          </View>
        )}
        {zone.pendingCount > 0 && (
          <View style={styles.zoneStat}>
            <Text style={[styles.zoneStatValue, { color: Colors.noreply }]}>
              {zone.pendingCount}
            </Text>
            <Text style={styles.zoneStatLabel}>Pending</Text>
          </View>
        )}
        <View style={styles.zoneStat}>
          <Text style={[styles.zoneStatValue, { color: Colors.safe }]}>
            {zone.safeCount}
          </Text>
          <Text style={styles.zoneStatLabel}>Safe</Text>
        </View>
      </View>
      {zone.locations
        .filter((l) => l.missingCount > 0 || l.needHelpCount > 0)
        .slice(0, 3)
        .map((loc) => (
          <View key={loc.locationId} style={styles.locRow}>
            <Feather name="map-pin" size={10} color={Colors.textTertiary} />
            <Text style={styles.locName} numberOfLines={1}>
              {loc.locationName}
            </Text>
            {loc.needHelpCount > 0 && (
              <Text style={styles.locBadgeRed}>
                {loc.needHelpCount} help
              </Text>
            )}
            {loc.missingCount > 0 && (
              <Text style={styles.locBadgeAmber}>
                {loc.missingCount} missing
              </Text>
            )}
          </View>
        ))}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 52 : 100,
    left: 10,
    right: 60,
    zIndex: 900,
    borderRadius: 12,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }
      : { elevation: 8 }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30,20,50,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pulseOuter: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(220,38,38,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.destructive,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  headerBadgeRed: {
    backgroundColor: "rgba(220,38,38,0.25)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeAmber: {
    backgroundColor: "rgba(217,119,6,0.25)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  body: {
    backgroundColor: "rgba(25,18,42,0.92)",
  },
  bodyContent: {
    padding: 10,
    gap: 10,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: 10,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.missing,
  },
  actionCardCritical: {
    borderLeftColor: Colors.destructive,
    backgroundColor: "rgba(220,38,38,0.08)",
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  actionDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    marginTop: 1,
  },
  zoneCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  zoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  zoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  zoneName: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  zoneStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  zoneStat: {
    alignItems: "center",
  },
  zoneStatValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  zoneStatLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 9,
    fontWeight: "500",
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 14,
  },
  locName: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    flex: 1,
  },
  locBadgeRed: {
    color: Colors.destructive,
    fontSize: 10,
    fontWeight: "600",
  },
  locBadgeAmber: {
    color: Colors.missing,
    fontSize: 10,
    fontWeight: "600",
  },
});
