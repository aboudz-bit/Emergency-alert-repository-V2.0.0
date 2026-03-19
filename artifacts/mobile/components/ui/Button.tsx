import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";

import { Colors, BorderRadius, FontSize, Spacing } from "@/constants/theme";

type Variant = "primary" | "secondary" | "destructive" | "ghost" | "safe";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary: { bg: Colors.primary, text: Colors.white },
  secondary: { bg: Colors.surface, text: Colors.text, border: Colors.border },
  destructive: { bg: Colors.destructive, text: Colors.white },
  ghost: { bg: "transparent", text: Colors.textSecondary },
  safe: { bg: Colors.safe, text: Colors.white },
};

const sizeStyles = {
  sm: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md, minHeight: 36, fontSize: FontSize.sm, iconSize: 14 },
  md: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl, minHeight: 48, fontSize: FontSize.md, iconSize: 16 },
  lg: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xxl, minHeight: 56, fontSize: FontSize.lg, iconSize: 18 },
};

export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  icon,
  size = "md",
}: ButtonProps) {
  const v = variantStyles[variant];
  const s = sizeStyles[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: v.bg,
          borderColor: v.border || "transparent",
          borderWidth: v.border ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          paddingVertical: s.paddingVertical,
          paddingHorizontal: s.paddingHorizontal,
          minHeight: s.minHeight,
        },
        fullWidth && { width: "100%" as any },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && <Feather name={icon} size={s.iconSize} color={v.text} />}
          <Text style={[styles.text, { color: v.text, fontSize: s.fontSize }, textStyle]}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  text: {
    fontFamily: "Inter_600SemiBold",
  },
});
