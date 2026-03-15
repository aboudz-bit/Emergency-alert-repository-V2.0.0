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
import { CPF_LOCATIONS, CAMP_LOCATIONS } from "@/constants/theme";
import { useStore } from "@/store";

type ZoneOption = "CPF" | "Camp";

export default function RegisterScreen() {
  const router = useRouter();
  const registerUser = useStore((s) => s.registerUser);

  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [zone, setZone] = useState<ZoneOption | null>(null);
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const locations = zone === "CPF" ? CPF_LOCATIONS : zone === "Camp" ? CAMP_LOCATIONS : [];

  const validate = (): string | null => {
    if (!name.trim()) return "Full name is required.";
    if (!badge.trim()) return "Badge number is required.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 4) return "Password must be at least 4 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!zone) return "Please select a zone.";
    if (!location) return "Please select a location.";
    return null;
  };

  const handleRegister = () => {
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    const result = registerUser({
      name: name.trim(),
      badge: badge.trim(),
      password: password.trim(),
      zone: zone!,
      location,
    });
    setLoading(false);
    if (result.success) {
      router.replace("/(auth)/login");
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Create Account</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Form Fields */}
          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
            <Input
              label="Badge Number"
              placeholder="Enter your badge number"
              keyboardType="number-pad"
              value={badge}
              onChangeText={setBadge}
            />
            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
            <Input
              label="Confirm Password"
              placeholder="Confirm your password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />

            {/* Zone Selector */}
            <View style={styles.sectionGap}>
              <Text style={styles.sectionLabel}>Zone</Text>
              <View style={styles.zoneRow}>
                {(["CPF", "Camp"] as ZoneOption[]).map((z) => (
                  <Pressable
                    key={z}
                    style={[
                      styles.zoneCard,
                      zone === z && styles.zoneCardSelected,
                    ]}
                    onPress={() => {
                      setZone(z);
                      setLocation("");
                    }}
                  >
                    <Feather
                      name={z === "CPF" ? "cpu" : "home"}
                      size={20}
                      color={zone === z ? Colors.primary : Colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.zoneCardText,
                        zone === z && styles.zoneCardTextSelected,
                      ]}
                    >
                      {z}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Location Selector */}
            {zone && (
              <View style={styles.sectionGap}>
                <Text style={styles.sectionLabel}>Location</Text>
                <View style={styles.locationList}>
                  {locations.map((loc) => (
                    <Pressable
                      key={loc}
                      style={[
                        styles.locationItem,
                        location === loc && styles.locationItemSelected,
                      ]}
                      onPress={() => setLocation(loc)}
                    >
                      <Text
                        style={[
                          styles.locationItemText,
                          location === loc && styles.locationItemTextSelected,
                        ]}
                      >
                        {loc}
                      </Text>
                      {location === loc && (
                        <Feather
                          name="check"
                          size={16}
                          color={Colors.primary}
                        />
                      )}
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button
              title="Register"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              style={styles.registerButton}
            />
          </View>

          {/* Login Link */}
          <Pressable
            style={styles.linkRow}
            onPress={() => router.replace("/(auth)/login")}
          >
            <Text style={styles.linkText}>
              Already have an account?{" "}
              <Text style={styles.linkHighlight}>Login</Text>
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

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSize.xl,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  headerSpacer: {
    width: 40,
  },

  /* Content */
  scrollContent: {
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    paddingBottom: 48,
  },
  form: {
    gap: Spacing.lg,
  },
  sectionGap: {
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },

  /* Zone Cards */
  zoneRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  zoneCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  zoneCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  zoneCardText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  zoneCardTextSelected: {
    color: Colors.primary,
  },

  /* Location List */
  locationList: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: "hidden",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationItemSelected: {
    backgroundColor: Colors.primaryDim,
  },
  locationItemText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  locationItemTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },

  /* Error */
  errorText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.destructive,
    textAlign: "center",
  },

  registerButton: {
    marginTop: Spacing.sm,
  },

  /* Link */
  linkRow: {
    marginTop: Spacing.xxl,
    alignItems: "center",
    paddingBottom: Spacing.lg,
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
