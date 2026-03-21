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
import type { UserRole, UserType, CompanyType } from "@/types";

const USER_TYPES: UserType[] = ["Aramco", "Contract"];

const ARAMCO_ROLES: { label: string; value: UserRole }[] = [
  { label: "User", value: "User" },
  { label: "Supervisor", value: "Supervisor" },
  { label: "Back Superior", value: "Back Superior" },
];

export default function RegisterScreen() {
  const router = useRouter();
  const registerUser = useStore((s) => s.registerUser);
  const storeZones = useStore((s) => s.zones);
  const storeLocations = useStore((s) => s.locations);

  const [name, setName] = useState("");
  const [badge, setBadge] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [userType, setUserType] = useState<UserType | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [zone, setZone] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const activeZones = storeZones.filter((z) => z.isActive);
  const locations = zone
    ? storeLocations
        .filter((l) => l.zone === zone && l.isActive)
        .map((l) => l.name)
    : [];

  const isAramco = userType === "Aramco";
  const isContract = userType === "Contract";

  const validate = (): string | null => {
    if (!name.trim()) return "Full name is required.";
    if (!badge.trim()) return "Badge number is required.";
    if (!mobileNumber.trim()) return "Mobile number is required.";
    if (!userType) return "Please select a user type.";
    if (isContract && !companyName.trim()) return "Company name is required for contractors.";
    if (isAramco && !role) return "Please select a role.";
    if (!password.trim()) return "Password is required.";
    if (password.length < 4) return "Password must be at least 4 characters.";
    if (password !== confirmPassword) return "Passwords do not match.";
    if (!zone) return "Please select a zone.";
    if (isAramco && !location) return "Please select a location.";
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
      location: isAramco ? location : "",
      mobileNumber: mobileNumber.trim(),
      userType: userType!,
      role: isAramco ? role : null,
      companyType: isAramco ? "Aramco" : "Contractor",
      companyName: isAramco ? "Saudi Aramco" : companyName.trim(),
    });
    setLoading(false);
    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Registration failed. Please try again.");
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successContainer}>
          <View style={styles.successIconWrap}>
            <Feather name="check-circle" size={64} color={Colors.safe} />
          </View>
          <Text style={styles.successTitle}>Registration Submitted</Text>
          <Text style={styles.successDesc}>
            Your account is awaiting IT approval. You will be able to log in
            once your registration has been reviewed and approved.
          </Text>
          <Button
            title="Back to Login"
            onPress={() => router.replace("/(auth)/login")}
            fullWidth
            style={styles.successBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
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
              label="Mobile Number"
              placeholder="Enter your mobile number"
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <View style={styles.sectionGap}>
              <Text style={styles.sectionLabel}>User Type</Text>
              <View style={styles.chipRow}>
                {USER_TYPES.map((ut) => (
                  <Pressable
                    key={ut}
                    style={[
                      styles.chip,
                      userType === ut && styles.chipSelected,
                    ]}
                    onPress={() => {
                      setUserType(ut);
                      if (ut === "Contract") {
                        setRole(null);
                        setLocation("");
                      }
                      if (ut === "Aramco") {
                        setCompanyName("");
                      }
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        userType === ut && styles.chipTextSelected,
                      ]}
                    >
                      {ut}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {isContract && (
              <Input
                label="Company Name"
                placeholder="Enter your company name"
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
              />
            )}

            {isAramco && (
              <View style={styles.sectionGap}>
                <Text style={styles.sectionLabel}>Role</Text>
                <View style={styles.chipRow}>
                  {ARAMCO_ROLES.map((r) => (
                    <Pressable
                      key={r.value}
                      style={[
                        styles.chip,
                        role === r.value && styles.chipSelected,
                      ]}
                      onPress={() => setRole(r.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          role === r.value && styles.chipTextSelected,
                        ]}
                      >
                        {r.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

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

            <View style={styles.sectionGap}>
              <Text style={styles.sectionLabel}>Zone</Text>
              <View style={styles.zoneRow}>
                {activeZones.map((zoneItem) => (
                  <Pressable
                    key={zoneItem.id}
                    style={[
                      styles.zoneCard,
                      zone === zoneItem.name && styles.zoneCardSelected,
                    ]}
                    onPress={() => {
                      setZone(zoneItem.name);
                      setLocation("");
                    }}
                  >
                    <View
                      style={[
                        styles.zoneDot,
                        { backgroundColor: zoneItem.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.zoneCardText,
                        zone === zoneItem.name && styles.zoneCardTextSelected,
                      ]}
                    >
                      {zoneItem.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {isAramco && zone && (
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

  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  chipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  chipTextSelected: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },

  zoneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
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
  zoneDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  zoneCardText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  zoneCardTextSelected: {
    color: Colors.primary,
  },

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

  errorText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.destructive,
    textAlign: "center",
  },

  registerButton: {
    marginTop: Spacing.sm,
  },

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

  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xxxl,
    gap: Spacing.lg,
  },
  successIconWrap: {
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    textAlign: "center",
  },
  successDesc: {
    fontSize: FontSize.md,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  successBtn: {
    marginTop: Spacing.lg,
  },
});
