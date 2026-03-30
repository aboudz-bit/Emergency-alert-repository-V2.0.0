import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { FontSize } from "@/constants/theme";
import type { PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";

export type LegendFilter = "safe" | "pending" | "help" | "aramco" | "contractor" | null;

interface Props {
  personnel: PersonnelMapEntry[];
  trackedCount?: number;
  activeLegend?: LegendFilter;
  onLegendPress?: (filter: LegendFilter) => void;
}

export const MapLegendCounts = React.memo(function MapLegendCounts({
  personnel,
  trackedCount,
  activeLegend,
  onLegendPress,
}: Props) {
  const counts = useMemo(() => {
    let safe = 0;
    let pending = 0;
    let needHelp = 0;
    let aramco = 0;
    let contractor = 0;
    for (const p of personnel) {
      if (p.status === "confirmed") safe++;
      else if (p.status === "need_help") needHelp++;
      else pending++;

      if (p.userType === "Contract") contractor++;
      else aramco++;
    }
    return { safe, pending, needHelp, aramco, contractor };
  }, [personnel]);

  const handlePress = (filter: LegendFilter) => {
    if (!onLegendPress) return;
    onLegendPress(activeLegend === filter ? null : filter);
  };

  const isActive = (filter: LegendFilter) => activeLegend === filter;
  const isDimmed = (filter: LegendFilter) => activeLegend != null && activeLegend !== filter;

  return (
    <View style={s.bar}>
      <View style={s.row}>
        <Pressable
          style={[s.badge, isActive("safe") && s.badgeActive, isDimmed("safe") && s.badgeDimmed]}
          onPress={() => handlePress("safe")}
        >
          <View style={[s.dot, { backgroundColor: "#34D399" }]} />
          <Text style={[s.label, isDimmed("safe") && s.labelDimmed]}>Safe</Text>
          <Text style={[s.num, { color: "#34D399" }, isDimmed("safe") && s.numDimmed]}>{counts.safe}</Text>
        </Pressable>
        <Pressable
          style={[s.badge, isActive("pending") && s.badgeActive, isDimmed("pending") && s.badgeDimmed]}
          onPress={() => handlePress("pending")}
        >
          <View style={[s.dot, { backgroundColor: "#FBBF24" }]} />
          <Text style={[s.label, isDimmed("pending") && s.labelDimmed]}>Pending</Text>
          <Text style={[s.num, { color: "#FBBF24" }, isDimmed("pending") && s.numDimmed]}>{counts.pending}</Text>
        </Pressable>
        <Pressable
          style={[s.badge, isActive("help") && s.badgeActive, isDimmed("help") && s.badgeDimmed]}
          onPress={() => handlePress("help")}
        >
          <View style={[s.dot, { backgroundColor: "#EF4444" }]} />
          <Text style={[s.label, isDimmed("help") && s.labelDimmed]}>Help</Text>
          <Text style={[s.num, { color: "#EF4444" }, isDimmed("help") && s.numDimmed]}>{counts.needHelp}</Text>
        </Pressable>
      </View>
      <View style={s.sep} />
      <View style={s.row}>
        <Pressable
          style={[s.badge, isActive("aramco") && s.badgeActive, isDimmed("aramco") && s.badgeDimmed]}
          onPress={() => handlePress("aramco")}
        >
          <View style={[s.dot, { backgroundColor: "#60A5FA" }]} />
          <Text style={[s.label, isDimmed("aramco") && s.labelDimmed]}>Aramco</Text>
          <Text style={[s.num, { color: "#60A5FA" }, isDimmed("aramco") && s.numDimmed]}>{counts.aramco}</Text>
        </Pressable>
        <Pressable
          style={[s.badge, isActive("contractor") && s.badgeActive, isDimmed("contractor") && s.badgeDimmed]}
          onPress={() => handlePress("contractor")}
        >
          <View style={[s.dot, { backgroundColor: "#9CA3AF", borderRadius: 2 }]} />
          <Text style={[s.label, isDimmed("contractor") && s.labelDimmed]}>Contractor</Text>
          <Text style={[s.num, { color: "#9CA3AF" }, isDimmed("contractor") && s.numDimmed]}>{counts.contractor}</Text>
        </Pressable>
      </View>
      {(trackedCount ?? 0) > 0 && (
        <>
          <View style={s.sep} />
          <View style={s.row}>
            <View style={[s.badge, isDimmed("safe") && !isActive(null) ? {} : {}]}>
              <View style={[s.dot, s.trackedDot]} />
              <Text style={s.label}>Tracked</Text>
              <Text style={[s.num, { color: "#60A5FA" }]}>{trackedCount}</Text>
            </View>
          </View>
        </>
      )}
    </View>
  );
});

const s = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.88)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeActive: {
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  badgeDimmed: {
    opacity: 0.4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackedDot: {
    backgroundColor: "#60A5FA",
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.7)",
  },
  labelDimmed: {
    color: "rgba(255,255,255,0.35)",
  },
  num: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  numDimmed: {
    opacity: 0.5,
  },
  sep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 1,
  },
});
