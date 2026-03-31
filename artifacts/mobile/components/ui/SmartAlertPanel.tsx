import React, { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import type {
  EmergencyIntelligence,
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
  onFocusZone,
  onFocusLocation,
}: SmartAlertPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    isActive,
    totalMissing,
    totalNeedHelp,
    suggestedActions,
    criticalZones,
    hasCriticalSituation,
  } = intelligence;

  if (!isActive || !hasCriticalSituation) return null;

  const topActions = suggestedActions.slice(0, 2);
  const remainingCount = suggestedActions.length - topActions.length;
  const remainingLocationCount = new Set(
    suggestedActions.slice(2).map((a) => a.locationId ?? a.zoneId)
  ).size;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.bar} onPress={toggleExpand}>
        <View style={styles.pulseDot} />
        <Text style={styles.barLabel}>INTEL</Text>
        <View style={styles.barSep} />
        {totalNeedHelp > 0 && (
          <View style={styles.badgeRed}>
            <Text style={styles.badgeText}>{totalNeedHelp} HELP</Text>
          </View>
        )}
        {totalMissing > 0 && (
          <View style={styles.badgeAmber}>
            <Text style={styles.badgeText}>{totalMissing} MISSING</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={14}
          color="rgba(255,255,255,0.7)"
        />
      </Pressable>

      {expanded && (
        <View style={styles.details}>
          {topActions.map((action) => (
            <Pressable
              key={action.id}
              style={styles.actionRow}
              onPress={() => {
                if (action.locationId && onFocusLocation) {
                  onFocusLocation(action.locationId);
                } else if (action.zoneId && onFocusZone) {
                  onFocusZone(action.zoneId);
                }
              }}
            >
              <Feather
                name={action.icon as any}
                size={12}
                color={
                  action.priority === "critical"
                    ? Colors.destructive
                    : Colors.missing
                }
              />
              <Text style={styles.actionDesc} numberOfLines={1}>
                {action.description}
              </Text>
              <Feather
                name="chevron-right"
                size={12}
                color="rgba(255,255,255,0.4)"
              />
            </Pressable>
          ))}
          {remainingCount > 0 && (
            <Text style={styles.moreText}>
              and {remainingLocationCount} more affected location
              {remainingLocationCount !== 1 ? "s" : ""}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }
      : { elevation: 6 }),
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30,20,50,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.destructive,
  },
  barLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  barSep: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  badgeRed: {
    backgroundColor: "rgba(220,38,38,0.25)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeAmber: {
    backgroundColor: "rgba(217,119,6,0.25)",
    borderRadius: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  details: {
    backgroundColor: "rgba(25,18,42,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  actionDesc: {
    flex: 1,
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
  },
  moreText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    fontStyle: "italic",
    paddingLeft: 18,
    paddingTop: 2,
  },
});
