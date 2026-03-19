import React, { useCallback } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { Header } from "@/components/ui/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import { useStore } from "@/store";

export default function SettingsScreen() {
  const router = useRouter();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const logout = useStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    logout();
    router.replace("/(auth)/login");
  }, [logout, router]);

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        rightAction={
          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
            <Feather name="log-out" size={20} color={Colors.textSecondary} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <Card>
            <SettingRow label="System Name" value={settings.systemName} />
            <Divider />
            <SettingRow label="Version" value={settings.systemVersion} />
            <Divider />
            <SettingRow label="Language" value={settings.language.toUpperCase()} />
            <Divider />
            <SettingRow label="Timezone" value={settings.timezone.toUpperCase()} />
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone Settings</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Detect Zone</Text>
                <Text style={styles.settingDescription}>
                  Detect user zone based on GPS
                </Text>
              </View>
              <Switch
                value={settings.autoDetectZone}
                onValueChange={(value) => updateSettings({ autoDetectZone: value })}
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={settings.autoDetectZone ? Colors.safe : Colors.textSecondary}
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>GPS Accuracy</Text>
                <Text style={styles.settingDescription}>
                  Current: {settings.gpsAccuracyMeters}m
                </Text>
              </View>
              <Stepper
                value={settings.gpsAccuracyMeters}
                suffix="m"
                onDecrement={() =>
                  updateSettings({ gpsAccuracyMeters: Math.max(5, settings.gpsAccuracyMeters - 5) })
                }
                onIncrement={() =>
                  updateSettings({ gpsAccuracyMeters: settings.gpsAccuracyMeters + 5 })
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hazard Zone Defaults</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: "#EF4444" }]}>Hot Zone Radius (Red)</Text>
                <Text style={styles.settingDescription}>
                  Immediate danger area
                </Text>
              </View>
              <Stepper
                value={settings.hazardHotRadius || 200}
                suffix="m"
                onDecrement={() =>
                  updateSettings({ hazardHotRadius: Math.max(50, (settings.hazardHotRadius || 200) - 50) })
                }
                onIncrement={() =>
                  updateSettings({ hazardHotRadius: (settings.hazardHotRadius || 200) + 50 })
                }
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: "#EAB308" }]}>Warm Zone Radius (Yellow)</Text>
                <Text style={styles.settingDescription}>
                  Buffer / decontamination area
                </Text>
              </View>
              <Stepper
                value={settings.hazardWarmRadius || 500}
                suffix="m"
                onDecrement={() =>
                  updateSettings({ hazardWarmRadius: Math.max(100, (settings.hazardWarmRadius || 500) - 50) })
                }
                onIncrement={() =>
                  updateSettings({ hazardWarmRadius: (settings.hazardWarmRadius || 500) + 50 })
                }
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: "#22C55E" }]}>Cold Zone Radius (Green)</Text>
                <Text style={styles.settingDescription}>
                  Safe perimeter / staging area
                </Text>
              </View>
              <Stepper
                value={settings.hazardColdRadius || 1000}
                suffix="m"
                onDecrement={() =>
                  updateSettings({ hazardColdRadius: Math.max(200, (settings.hazardColdRadius || 1000) - 100) })
                }
                onIncrement={() =>
                  updateSettings({ hazardColdRadius: (settings.hazardColdRadius || 1000) + 100 })
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Alert Sound</Text>
                <Text style={styles.settingDescription}>Play sound for alerts</Text>
              </View>
              <Switch
                value={settings.notifications.alertSound}
                onValueChange={(value) =>
                  updateSettings({ notifications: { ...settings.notifications, alertSound: value } })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={settings.notifications.alertSound ? Colors.safe : Colors.textSecondary}
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>Receive push for alerts</Text>
              </View>
              <Switch
                value={settings.notifications.pushNotifications}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: { ...settings.notifications, pushNotifications: value },
                  })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={
                  settings.notifications.pushNotifications ? Colors.safe : Colors.textSecondary
                }
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Escalation Timeout</Text>
                <Text style={styles.settingDescription}>Minutes before escalation</Text>
              </View>
              <Stepper
                value={settings.notifications.escalationTimeoutMinutes}
                suffix="m"
                onDecrement={() =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      escalationTimeoutMinutes: Math.max(
                        1,
                        settings.notifications.escalationTimeoutMinutes - 1
                      ),
                    },
                  })
                }
                onIncrement={() =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      escalationTimeoutMinutes: settings.notifications.escalationTimeoutMinutes + 1,
                    },
                  })
                }
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Session Timeout</Text>
                <Text style={styles.settingDescription}>Auto logout after inactivity</Text>
              </View>
              <Stepper
                value={settings.sessionTimeoutMinutes}
                suffix="m"
                onDecrement={() =>
                  updateSettings({
                    sessionTimeoutMinutes: Math.max(5, settings.sessionTimeoutMinutes - 5),
                  })
                }
                onIncrement={() =>
                  updateSettings({ sessionTimeoutMinutes: settings.sessionTimeoutMinutes + 5 })
                }
              />
            </View>
            <Divider />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Badge as Username</Text>
                <Text style={styles.settingDescription}>Use badge number to login</Text>
              </View>
              <Switch
                value={settings.badgeAsUsername}
                onValueChange={(value) => updateSettings({ badgeAsUsername: value })}
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={settings.badgeAsUsername ? Colors.safe : Colors.textSecondary}
              />
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <SettingRow label="Application" value="KEAS" />
            <Divider />
            <SettingRow label="Version" value={settings.systemVersion} />
            <Divider />
            <SettingRow label="Support" value="IT - Emergency Systems" />
            <Divider />
            <SettingRow label="Contact" value="it-support@khurais.sa" />
          </Card>
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
          icon="log-out"
          size="lg"
          style={{ marginTop: Spacing.sm }}
        />

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function Stepper({
  value,
  suffix,
  onDecrement,
  onIncrement,
}: {
  value: number;
  suffix: string;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepperBtn} onPress={onDecrement} hitSlop={4}>
        <Feather name="minus" size={16} color={Colors.text} />
      </Pressable>
      <Text style={styles.stepperValue}>
        {value}{suffix}
      </Text>
      <Pressable style={styles.stepperBtn} onPress={onIncrement} hitSlop={4}>
        <Feather name="plus" size={16} color={Colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  settingInfo: {
    flex: 1,
    gap: 2,
    marginRight: Spacing.md,
  },
  settingLabel: {
    fontSize: FontSize.md,
    fontFamily: "Inter_500Medium",
    color: Colors.text,
  },
  settingValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  settingDescription: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
  },
  stepperValue: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    minWidth: 36,
    textAlign: "center",
  },
});
