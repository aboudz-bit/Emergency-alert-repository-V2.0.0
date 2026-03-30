import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, FontSize } from "@/constants/theme";
import type { PersonnelMapEntry } from "@/hooks/useVisiblePersonnel";

interface Props {
  personnel: PersonnelMapEntry[];
  trackedCount?: number;
}

export const MapLegendCounts = React.memo(function MapLegendCounts({ personnel, trackedCount }: Props) {
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

  return (
    <View style={s.bar}>
      <View style={s.badge}>
        <View style={[s.dot, { backgroundColor: "#34D399" }]} />
        <Text style={[s.num, { color: "#34D399" }]}>{counts.safe}</Text>
      </View>
      <View style={s.badge}>
        <View style={[s.dot, { backgroundColor: "#FBBF24" }]} />
        <Text style={[s.num, { color: "#FBBF24" }]}>{counts.pending}</Text>
      </View>
      <View style={s.badge}>
        <View style={[s.dot, { backgroundColor: "#EF4444" }]} />
        <Text style={[s.num, { color: "#EF4444" }]}>{counts.needHelp}</Text>
      </View>
      <View style={s.sep} />
      <View style={s.badge}>
        <View style={[s.dot, { backgroundColor: "#60A5FA" }]} />
        <Text style={[s.num, { color: "#60A5FA" }]}>{counts.aramco}</Text>
      </View>
      <View style={s.badge}>
        <View style={[s.dot, { backgroundColor: "#9CA3AF", borderRadius: 2 }]} />
        <Text style={[s.num, { color: "#9CA3AF" }]}>{counts.contractor}</Text>
      </View>
      {(trackedCount ?? 0) > 0 && (
        <>
          <View style={s.sep} />
          <View style={s.badge}>
            <View style={[s.dot, { backgroundColor: "#60A5FA", borderWidth: 1.5, borderColor: "#fff" }]} />
            <Text style={[s.num, { color: "#60A5FA" }]}>{trackedCount}</Text>
            <Text style={s.trackLabel}>tracked</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(15,23,42,0.85)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  num: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_700Bold",
  },
  sep: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  trackLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.5)",
  },
});
