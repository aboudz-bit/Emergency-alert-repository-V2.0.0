import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import { useAlertSystemState } from "@/hooks/useAlertSystemState";

export function SelfStatusBar() {
  const { emergencyMode } = useAlertSystemState();
  const mobileUserResponse = useStore((s) => s.mobileUserResponse);
  const respondToAlert = useStore((s) => s.respondToAlert);

  if (!emergencyMode) return null;

  const isSafe = mobileUserResponse === "confirmed";
  const isHelp = mobileUserResponse === "need_help";
  const hasResponded = isSafe || isHelp;

  return (
    <View style={styles.container}>
      {hasResponded ? (
        <View style={styles.respondedRow}>
          <Feather
            name={isSafe ? "check-circle" : "alert-triangle"}
            size={16}
            color={isSafe ? "#34D399" : "#EF4444"}
          />
          <Text style={[styles.respondedText, { color: isSafe ? "#34D399" : "#EF4444" }]}>
            {isSafe ? "You confirmed safe" : "Help requested"}
          </Text>
          <View style={styles.changeRow}>
            {!isSafe && (
              <Pressable
                style={[styles.smallBtn, styles.safeSmall]}
                onPress={() => respondToAlert("confirmed")}
                accessibilityRole="button"
                accessibilityLabel="I'm Safe"
              >
                <Feather name="check" size={12} color="#34D399" />
                <Text style={[styles.smallBtnText, { color: "#34D399" }]}>I'm Safe</Text>
              </Pressable>
            )}
            {!isHelp && (
              <Pressable
                style={[styles.smallBtn, styles.helpSmall]}
                onPress={() => respondToAlert("need_help")}
                accessibilityRole="button"
                accessibilityLabel="Need Help"
              >
                <Feather name="alert-triangle" size={12} color="#EF4444" />
                <Text style={[styles.smallBtnText, { color: "#EF4444" }]}>Need Help</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.btnRow}>
          <Pressable
            style={[styles.btn, styles.safeBtn]}
            onPress={() => respondToAlert("confirmed")}
            accessibilityRole="button"
            accessibilityLabel="I am Safe"
          >
            <Feather name="check-circle" size={18} color="#fff" />
            <Text style={styles.btnText}>I am Safe</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.helpBtn]}
            onPress={() => respondToAlert("need_help")}
            accessibilityRole="button"
            accessibilityLabel="Need Help"
          >
            <Feather name="alert-triangle" size={18} color="#fff" />
            <Text style={styles.btnText}>Need Help</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: "rgba(15,23,42,0.06)",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
    overflow: "hidden",
  },
  btnRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.md,
  },
  safeBtn: {
    backgroundColor: "#059669",
  },
  helpBtn: {
    backgroundColor: "#DC2626",
  },
  btnText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  respondedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  respondedText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  changeRow: {
    flexDirection: "row",
    gap: 6,
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  safeSmall: {
    borderColor: "rgba(52,211,153,0.3)",
    backgroundColor: "rgba(52,211,153,0.08)",
  },
  helpSmall: {
    borderColor: "rgba(239,68,68,0.3)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  smallBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
});
