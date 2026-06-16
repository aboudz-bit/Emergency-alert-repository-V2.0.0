import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type { ChecklistItem } from "@/types";

/** ECO incident checklist. Local state lives on the active alert. */
export function EcoChecklistCard({
  items,
  onToggle,
  readOnly = false,
}: {
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  readOnly?: boolean;
}) {
  const done = items.filter(i => i.done).length;
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Incident Checklist</Text>
        <Text style={styles.progress}>{done}/{items.length}</Text>
      </View>
      {items.map(item => (
        <Pressable
          key={item.id}
          onPress={() => !readOnly && onToggle(item.id)}
          disabled={readOnly}
          style={({ pressed }) => [styles.row, pressed && !readOnly && styles.rowPressed]}
        >
          <View style={[styles.box, item.done && styles.boxDone]}>
            {item.done && <Feather name="check" size={14} color={Colors.white} />}
          </View>
          <Text style={[styles.label, item.done && styles.labelDone]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: Spacing.sm },
  title: { fontSize: FontSize.md, fontFamily: "Inter_700Bold", color: Colors.textTitle },
  progress: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  row: { flexDirection: "row", alignItems: "center", gap: Spacing.md, paddingVertical: Spacing.sm },
  rowPressed: { opacity: 0.6 },
  box: {
    width: 22, height: 22, borderRadius: BorderRadius.sm, borderWidth: 1.5,
    borderColor: Colors.borderLight, alignItems: "center", justifyContent: "center",
  },
  boxDone: { backgroundColor: Colors.safe, borderColor: Colors.safe },
  label: { flex: 1, fontSize: FontSize.sm, fontFamily: "Inter_500Medium", color: Colors.text },
  labelDone: { color: Colors.textTertiary, textDecorationLine: "line-through" },
});
