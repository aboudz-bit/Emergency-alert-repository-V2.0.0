import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/ui/Header";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function CreateAdminScreen() {
  const router = useRouter();
  const createSuperAdmin = useStore((s) => s.createSuperAdmin);

  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!name.trim()) {
      setError("Full name is required.");
      return false;
    }
    if (!badge.trim()) {
      setError("Badge number is required.");
      return false;
    }
    if (!password.trim()) {
      setError("Password is required.");
      return false;
    }
    if (password.trim().length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleCreate = () => {
    setError("");
    if (!validate()) return;

    setLoading(true);
    const result = createSuperAdmin({
      name: name.trim(),
      badge: badge.trim(),
      password: password.trim(),
    });
    setLoading(false);

    if (result.success) {
      Alert.alert(
        "Account Created",
        `Super Admin account for ${name.trim()} has been created successfully.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } else {
      setError(result.error || "Failed to create account.");
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Create Super Admin" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Super Admin</Text>
              <Text style={styles.formSubtitle}>
                Create a new Super Admin account with full system access.
              </Text>
            </View>

            <View style={styles.fields}>
              <Input
                label="Full Name"
                placeholder="Enter full name"
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  setError("");
                }}
                autoCapitalize="words"
              />

              <Input
                label="Badge Number"
                placeholder="Enter badge number"
                keyboardType="number-pad"
                value={badge}
                onChangeText={(text) => {
                  setBadge(text);
                  setError("");
                }}
              />

              <Input
                label="Password"
                placeholder="Minimum 6 characters"
                secureTextEntry
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError("");
                }}
                autoCapitalize="none"
              />

              <Input
                label="Confirm Password"
                placeholder="Re-enter password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  setError("");
                }}
                autoCapitalize="none"
              />
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Button
              title="Create Account"
              onPress={handleCreate}
              loading={loading}
              fullWidth
              style={styles.submitBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  /* Form Card */
  formCard: {
    gap: Spacing.xl,
  },
  formHeader: {
    gap: Spacing.xs,
  },
  formTitle: {
    fontSize: FontSize.xl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  formSubtitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  fields: {
    gap: Spacing.lg,
  },

  /* Error */
  errorContainer: {
    backgroundColor: Colors.primaryDim,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
    padding: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    textAlign: "center",
  },

  /* Submit */
  submitBtn: {
    marginTop: Spacing.sm,
  },
});
