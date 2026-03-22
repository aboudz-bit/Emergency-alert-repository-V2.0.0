import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useTranslation } from "@/i18n/useTranslation";
import { WIND_DIRECTIONS, type WindDirection } from "@/types";

interface WindDirectionPickerProps {
  visible: boolean;
  current: WindDirection | null;
  onSelect: (direction: WindDirection | null) => void;
  onClose: () => void;
}

export function WindDirectionPicker({ visible, current, onSelect, onClose }: WindDirectionPickerProps) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.title}>{t.windDirection}</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Feather name="x" size={16} color={Colors.textTertiary} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {WIND_DIRECTIONS.map((wd) => {
              const isActive = current === wd.key;
              return (
                <Pressable
                  key={wd.key}
                  style={[styles.option, isActive && styles.optionActive]}
                  onPress={() => {
                    onSelect(wd.key);
                    onClose();
                  }}
                >
                  <View style={{ transform: [{ rotate: `${wd.degrees}deg` }] }}>
                    <Feather
                      name="arrow-down"
                      size={20}
                      color={isActive ? Colors.white : Colors.primary}
                    />
                  </View>
                  <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                    {wd.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {current && (
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                onSelect(null);
                onClose();
              }}
            >
              <Feather name="x-circle" size={14} color={Colors.destructive} />
              <Text style={styles.clearText}>{t.clearWind}</Text>
            </Pressable>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  sheet: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  option: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  optionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optionLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.white,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  clearText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.destructive,
  },
});
