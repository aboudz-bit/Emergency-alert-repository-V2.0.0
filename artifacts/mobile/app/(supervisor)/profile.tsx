import React, { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function SupervisorProfileScreen() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const logout = useStore((s) => s.logout);

  const isBackup = currentUser?.isBackupSupervisorAssigned === true && !currentUser?.isSupervisorAssigned;
  const roleLabel = isBackup ? "Backup Supervisor" : "Supervisor";

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  const infoRows = [
    { label: "Name", value: currentUser?.name ?? "—", icon: "user" as const },
    { label: "Badge", value: currentUser?.badge ?? "—", icon: "hash" as const },
    { label: "Role", value: roleLabel, icon: "clipboard" as const },
    { label: "Status", value: isBackup ? "Standby" : "Active", icon: "activity" as const },
    { label: "Location", value: currentUser?.supervisorLocationName ?? "—", icon: "map-pin" as const },
    { label: "Zone", value: currentUser?.supervisorZoneName ?? currentUser?.zone ?? "—", icon: "map" as const },
  ];

  return (
    <View style={styles.container}>
      <Header title="Profile" subtitle={currentUser?.name} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.avatar}>
          <Feather name="clipboard" size={36} color={Colors.amber} />
        </View>
        <Text style={styles.userName}>{currentUser?.name}</Text>
        <Text style={styles.userRole}>{roleLabel} — {currentUser?.supervisorLocationName}</Text>

        <Card style={styles.infoCard}>
          {infoRows.map((row, i) => (
            <View key={row.label} style={[styles.infoRow, i < infoRows.length - 1 && styles.infoRowBorder]}>
              <View style={styles.infoLeft}>
                <Feather name={row.icon} size={16} color={Colors.textSecondary} />
                <Text style={styles.infoLabel}>{row.label}</Text>
              </View>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </Card>

        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={Colors.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, alignItems: "center", gap: Spacing.md },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.amberDim, borderWidth: 2, borderColor: Colors.missingBorder,
    alignItems: "center", justifyContent: "center", marginTop: Spacing.md,
  },
  userName: { fontSize: FontSize.xl, fontFamily: "Inter_700Bold", color: Colors.text },
  userRole: { fontSize: FontSize.md, color: Colors.amber, fontFamily: "Inter_500Medium" },
  infoCard: { width: "100%", gap: 0, marginTop: Spacing.sm },
  infoRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: Spacing.md,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontFamily: "Inter_600SemiBold", color: Colors.text },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: Spacing.sm,
    width: "100%", paddingVertical: Spacing.md,
    backgroundColor: Colors.primaryDim, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primaryBorder,
    marginTop: Spacing.md,
  },
  logoutText: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.primary },
});
