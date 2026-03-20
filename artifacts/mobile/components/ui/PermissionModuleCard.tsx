import React, { useState, useCallback } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type { PermissionKey } from "@/types";

export interface PermissionSubItem {
  key: PermissionKey;
  label: string;
}

export interface PermissionModuleProps {
  icon: keyof typeof Feather.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  permissions: PermissionSubItem[];
  activePerms: PermissionKey[];
  defaultPerms: PermissionKey[];
  onToggle: (key: PermissionKey) => void;
}

export function PermissionModuleCard({
  icon,
  iconColor,
  iconBg,
  title,
  permissions,
  activePerms,
  defaultPerms,
  onToggle,
}: PermissionModuleProps) {
  const [expanded, setExpanded] = useState(false);

  const enabledCount = permissions.filter((p) => activePerms.includes(p.key)).length;
  const allEnabled = enabledCount === permissions.length;
  const someEnabled = enabledCount > 0 && !allEnabled;

  const handleMasterToggle = useCallback(() => {
    if (allEnabled) {
      // Turn off all non-default permissions in this module
      permissions.forEach((p) => {
        if (activePerms.includes(p.key) && !defaultPerms.includes(p.key)) {
          onToggle(p.key);
        }
      });
    } else {
      // Turn on all permissions in this module
      permissions.forEach((p) => {
        if (!activePerms.includes(p.key)) {
          onToggle(p.key);
        }
      });
    }
  }, [allEnabled, permissions, activePerms, defaultPerms, onToggle]);

  // Check if the entire module is only defaults (master toggle should be disabled)
  const allAreDefaults = permissions.every((p) => defaultPerms.includes(p.key));

  return (
    <View style={styles.card}>
      {/* Header row */}
      <Pressable style={styles.header} onPress={() => setExpanded((e) => !e)}>
        <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {enabledCount}/{permissions.length} enabled
          </Text>
        </View>
        <Switch
          value={allEnabled || someEnabled}
          onValueChange={handleMasterToggle}
          disabled={allAreDefaults}
          trackColor={{
            false: Colors.border,
            true: someEnabled ? Colors.primary + "40" : Colors.primary + "60",
          }}
          thumbColor={allEnabled || someEnabled ? Colors.primary : Colors.surfaceElevated}
          style={styles.masterToggle}
        />
        <Feather
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textTertiary}
        />
      </Pressable>

      {/* Expanded sub-permissions */}
      {expanded && (
        <View style={styles.subList}>
          {permissions.map((perm, idx) => {
            const isActive = activePerms.includes(perm.key);
            const isDefault = defaultPerms.includes(perm.key);

            return (
              <Pressable
                key={perm.key}
                style={[styles.subRow, idx < permissions.length - 1 && styles.subRowBorder]}
                onPress={() => {
                  if (!isDefault) onToggle(perm.key);
                }}
              >
                <Text style={[styles.subLabel, isDefault && styles.subLabelDefault]}>
                  {perm.label}
                </Text>
                <View style={styles.subRight}>
                  {isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.checkbox,
                      isActive && styles.checkboxActive,
                      isDefault && isActive && styles.checkboxDefault,
                    ]}
                  >
                    {isActive && <Feather name="check" size={13} color="#fff" />}
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md + 2,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  masterToggle: {
    marginRight: 4,
  },
  subList: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingLeft: 52,
  },
  subRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  subLabel: {
    fontSize: FontSize.sm + 1,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
    flex: 1,
  },
  subLabelDefault: {
    color: Colors.textSecondary,
  },
  subRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  defaultBadge: {
    backgroundColor: Colors.safe + "18",
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  defaultBadgeText: {
    fontSize: FontSize.xs - 1,
    fontFamily: "Inter_600SemiBold",
    color: Colors.safe,
    letterSpacing: 0.3,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxDefault: {
    backgroundColor: Colors.safe,
    borderColor: Colors.safe,
    opacity: 0.8,
  },
});
