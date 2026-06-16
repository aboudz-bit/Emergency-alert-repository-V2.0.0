import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { COMMS_TREE } from "@/constants/incident";
import type { CommsContactCategory } from "@/types";

const CAT_ICON: Record<CommsContactCategory, keyof typeof Feather.glyphMap> = {
  ECO: "radio",
  Supervisor: "users",
  "Area Owner": "briefcase",
  Security: "shield",
  Medical: "plus-square",
  "Fire Team": "alert-triangle",
  Management: "user",
};

/**
 * Communication tree placeholder — structured escalation contact board.
 * TODO(backend/integration): wire real contacts + call/SMS actions later.
 */
export function CommsTreeCard() {
  return (
    <View>
      <Text style={styles.title}>Communication Tree</Text>
      <Text style={styles.subtitle}>Notify in order of escalation (contacts wired with backend later)</Text>
      {COMMS_TREE.map(c => (
        <View key={c.id} style={styles.row}>
          <View style={styles.iconWrap}>
            <Feather name={CAT_ICON[c.category]} size={16} color={Colors.primary} />
          </View>
          <View style={styles.body}>
            <Text style={styles.label}>{c.label}</Text>
            {c.detail ? <Text style={styles.detail}>{c.detail}</Text> : null}
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Notify (soon)</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.textTitle },
  subtitle: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: Spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  iconWrap: {
    width: 34, height: 34, borderRadius: BorderRadius.md, backgroundColor: Colors.primaryDim,
    alignItems: "center", justifyContent: "center",
  },
  body: { flex: 1 },
  label: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.textTitle },
  detail: { fontSize: FontSize.xs, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  tag: { backgroundColor: Colors.surfaceElevated, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  tagText: { fontSize: FontSize.xs, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
});
