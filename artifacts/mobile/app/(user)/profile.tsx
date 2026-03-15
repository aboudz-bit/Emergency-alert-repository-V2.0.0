import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Feather name={icon} size={16} color={Colors.textSecondary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileContent}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.profileName}>
              {currentUser?.name || "Unknown User"}
            </Text>
            <View style={styles.profileBadgeRow}>
              <View style={styles.profileChip}>
                <Feather
                  name="credit-card"
                  size={12}
                  color={Colors.textSecondary}
                />
                <Text style={styles.profileChipText}>
                  {currentUser?.badge || "N/A"}
                </Text>
              </View>
              <View style={styles.profileRoleChip}>
                <Feather name="user" size={12} color={Colors.info} />
                <Text style={styles.profileRoleText}>
                  {currentUser?.role || "User"}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* User Information */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Information</Text>
          <View style={styles.infoList}>
            <InfoRow
              icon="map-pin"
              label="Zone"
              value={currentUser?.zone || "Unknown"}
            />
            <View style={styles.infoSeparator} />
            <InfoRow
              icon="navigation"
              label="Location"
              value={currentUser?.location || "Unknown"}
            />
            <View style={styles.infoSeparator} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Feather
                  name="check-circle"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Account Status</Text>
                <View style={styles.infoStatusRow}>
                  <StatusBadge
                    status={
                      currentUser?.accountStatus === "active"
                        ? "enabled"
                        : "disabled"
                    }
                  />
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* System Info */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>System</Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Feather
                  name="crosshair"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>GPS Status</Text>
                <View style={styles.gpsStatusRow}>
                  <View style={styles.gpsActiveDot} />
                  <Text style={styles.gpsActiveText}>Active</Text>
                </View>
              </View>
            </View>
            <View style={styles.infoSeparator} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Feather
                  name="bell"
                  size={16}
                  color={Colors.textSecondary}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Notification Status</Text>
                <View style={styles.gpsStatusRow}>
                  <View style={styles.gpsActiveDot} />
                  <Text style={styles.gpsActiveText}>Enabled</Text>
                </View>
              </View>
            </View>
            <View style={styles.infoSeparator} />
            <InfoRow
              icon="smartphone"
              label="App Version"
              value="2.0.0-ios"
            />
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
          style={styles.logoutBtn}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxxl * 2,
  },
  profileCard: {
    paddingVertical: Spacing.xxl,
  },
  profileContent: {
    alignItems: "center",
    gap: Spacing.md,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryDim,
    borderWidth: 2,
    borderColor: Colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  avatarText: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  profileName: {
    fontSize: FontSize.xxl,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  profileBadgeRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileChipText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  profileRoleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.infoDim,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.infoBorder,
  },
  profileRoleText: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_500Medium",
    color: Colors.info,
  },
  sectionCard: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  infoList: {
    gap: 0,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginTop: 2,
  },
  infoSeparator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52,
  },
  infoStatusRow: {
    marginTop: Spacing.xs,
  },
  gpsStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: 2,
  },
  gpsActiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.safe,
  },
  gpsActiveText: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.safe,
  },
  logoutBtn: {
    marginTop: Spacing.md,
  },
});
