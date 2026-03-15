import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Header } from "@/components/ui/Header";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const logout = useStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        rightAction={
          <Feather name="log-out" size={20} color={Colors.textSecondary} onPress={handleLogout} />
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle title="General" />
        <Card style={styles.sectionCard}>
          <InfoRow label="System Name" value={settings.systemName} />
          <View style={styles.divider} />
          <InfoRow label="Version" value={settings.systemVersion} />
          <View style={styles.divider} />
          <InfoRow label="Language" value={settings.language === "en" ? "English" : settings.language} />
          <View style={styles.divider} />
          <ToggleRow
            label="RTL Support"
            value={settings.rtlSupport}
            onToggle={(v) => updateSettings({ rtlSupport: v })}
          />
        </Card>

        <SectionTitle title="Zone & Location" />
        <Card style={styles.sectionCard}>
          <ToggleRow
            label="Auto-Detect Zone"
            value={settings.autoDetectZone}
            onToggle={(v) => updateSettings({ autoDetectZone: v })}
          />
          <View style={styles.divider} />
          <InfoRow label="GPS Accuracy" value={`${settings.gpsAccuracyMeters}m`} />
          <View style={styles.divider} />
          <InfoRow label="Location Update" value={`${settings.locationUpdateIntervalSeconds}s`} />
          <View style={styles.divider} />
          <ToggleRow
            label="Require Location"
            value={settings.requireLocationPermission}
            onToggle={(v) => updateSettings({ requireLocationPermission: v })}
          />
        </Card>

        <SectionTitle title="Notifications" />
        <Card style={styles.sectionCard}>
          <ToggleRow
            label="Alert Sound"
            value={settings.notifications.alertSound}
            onToggle={(v) =>
              updateSettings({ notifications: { ...settings.notifications, alertSound: v } })
            }
          />
          <View style={styles.divider} />
          <ToggleRow
            label="Push Notifications"
            value={settings.notifications.pushNotifications}
            onToggle={(v) =>
              updateSettings({ notifications: { ...settings.notifications, pushNotifications: v } })
            }
          />
          <View style={styles.divider} />
          <InfoRow
            label="Escalation Timeout"
            value={`${settings.notifications.escalationTimeoutMinutes} min`}
          />
        </Card>

        <SectionTitle title="Security" />
        <Card style={styles.sectionCard}>
          <InfoRow label="Session Timeout" value={`${settings.sessionTimeoutMinutes} min`} />
          <View style={styles.divider} />
          <ToggleRow
            label="Badge as Username"
            value={settings.badgeAsUsername}
            onToggle={(v) => updateSettings({ badgeAsUsername: v })}
          />
          <View style={styles.divider} />
          <ToggleRow
            label="WiFi & Mobile Data"
            value={settings.wifiAndMobileData}
            onToggle={(v) => updateSettings({ wifiAndMobileData: v })}
          />
        </Card>

        <SectionTitle title="About" />
        <Card style={styles.sectionCard}>
          <InfoRow label="System" value="Khurais Emergency Alert System" />
          <View style={styles.divider} />
          <InfoRow label="Platform" value="iOS (Expo)" />
          <View style={styles.divider} />
          <InfoRow label="Support" value="IT Department" />
        </Card>

        <Button
          title="Logout"
          variant="destructive"
          onPress={handleLogout}
          fullWidth
          style={{ marginTop: Spacing.md }}
        />

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.border, true: Colors.primaryDim }}
        thumbColor={value ? Colors.primary : Colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: Spacing.md,
  },
  sectionCard: { gap: 0, padding: 0 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowLabel: { fontSize: FontSize.md, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  rowValue: { fontSize: FontSize.md, fontFamily: "Inter_600SemiBold", color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.lg },
});
