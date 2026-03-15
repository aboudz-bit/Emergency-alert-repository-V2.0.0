import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";
import type { UserRole } from "@/types";

const DEMO_ROLES: { label: string; role: UserRole }[] = [
  { label: "Super Admin", role: "Super Admin" },
  { label: "IT", role: "IT" },
  { label: "User", role: "User" },
];

export default function LoginScreen() {
  const router = useRouter();
  const login = useStore((s) => s.login);

  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!badge.trim() || !password.trim()) {
      setError("Please enter your badge number and password.");
      return;
    }
    setLoading(true);
    const result = login(badge.trim(), password.trim());
    setLoading(false);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.error || "Invalid credentials. Please try again.");
    }
  };

  const handleDemoLogin = (role: UserRole) => {
    setError("");
    const result = login("demo", "demo", role);
    if (result.success) {
      router.replace("/");
    } else {
      setError(result.error || "Demo login failed.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.iconCircle}>
              <Feather name="shield" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.title}>KEAS</Text>
            <Text style={styles.subtitle}>
              Khurais Emergency Alert System
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Badge Number"
              placeholder="Enter your badge number"
              keyboardType="number-pad"
              value={badge}
              onChangeText={setBadge}
              autoCapitalize="none"
            />
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Login"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              style={styles.loginButton}
            />
          </View>

          {/* Demo Role Selector */}
          <View style={styles.demoSection}>
            <Text style={styles.demoLabel}>Quick Demo Access</Text>
            <View style={styles.chipRow}>
              {DEMO_ROLES.map((item) => (
                <Pressable
                  key={item.role}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => handleDemoLogin(item.role)}
                >
                  <Text style={styles.chipText}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Register Link */}
          <Pressable
            style={styles.linkRow}
            onPress={() => router.push("/(auth)/register")}
          >
            <Text style={styles.linkText}>
              Don't have an account?{" "}
              <Text style={styles.linkHighlight}>Register</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxxl,
  },

  /* Logo */
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSize.display,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    textAlign: "center",
  },

  /* Form */
  form: {
    gap: Spacing.lg,
  },
  loginButton: {
    marginTop: Spacing.sm,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.destructive,
    textAlign: "center",
  },

  /* Demo */
  demoSection: {
    marginTop: Spacing.xxxl,
    alignItems: "center",
    gap: Spacing.md,
  },
  demoLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  chipRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipPressed: {
    backgroundColor: Colors.surfaceElevated,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },

  /* Link */
  linkRow: {
    marginTop: Spacing.xxl,
    alignItems: "center",
  },
  linkText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  linkHighlight: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
