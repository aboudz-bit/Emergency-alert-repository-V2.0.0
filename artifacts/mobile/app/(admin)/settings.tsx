import React from "react";
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

  const handleLogout = () => {
    logout();
    router.replace("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Header
        title="Settings"
        rightAction={
          <Pressable onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={20} color={Colors.textSecondary} />
          </Pressable>
        }
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>System Name</Text>
                <Text style={styles.settingValue}>{settings.systemName}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingValue}>{settings.systemVersion}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>{settings.language}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Timezone</Text>
                <Text style={styles.settingValue}>{settings.timezone}</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Zone Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zone Settings</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Detect Zone</Text>
                <Text style={styles.settingDescription}>
                  Automatically detect user zone based on GPS
                </Text>
              </View>
              <Switch
                value={settings.autoDetectZone}
                onValueChange={(value) =>
                  updateSettings({ autoDetectZone: value })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={settings.autoDetectZone ? Colors.safe : Colors.textSecondary}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>GPS Accuracy</Text>
                <Text style={styles.settingDescription}>
                  Current: {settings.gpsAccuracyMeters}m
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateSettings({
                      gpsAccuracyMeters: Math.max(5, settings.gpsAccuracyMeters - 5),
                    })
                  }
                >
                  <Feather name="minus" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {settings.gpsAccuracyMeters}m
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateSettings({
                      gpsAccuracyMeters: settings.gpsAccuracyMeters + 5,
                    })
                  }
                >
                  <Feather name="plus" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Alert Sound</Text>
                <Text style={styles.settingDescription}>
                  Play sound when alert is received
                </Text>
              </View>
              <Switch
                value={settings.notifications.alertSound}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      alertSound: value,
                    },
                  })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={
                  settings.notifications.alertSound
                    ? Colors.safe
                    : Colors.textSecondary
                }
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive push notifications for alerts
                </Text>
              </View>
              <Switch
                value={settings.notifications.pushNotifications}
                onValueChange={(value) =>
                  updateSettings({
                    notifications: {
                      ...settings.notifications,
                      pushNotifications: value,
                    },
                  })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={
                  settings.notifications.pushNotifications
                    ? Colors.safe
                    : Colors.textSecondary
                }
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Escalation Timeout</Text>
                <Text style={styles.settingDescription}>
                  Minutes before escalating unresponsive users
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
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
                >
                  <Feather name="minus" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {settings.notifications.escalationTimeoutMinutes}m
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateSettings({
                      notifications: {
                        ...settings.notifications,
                        escalationTimeoutMinutes:
                          settings.notifications.escalationTimeoutMinutes + 1,
                      },
                    })
                  }
                >
                  <Feather name="plus" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
          </Card>
        </View>

        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Session Timeout</Text>
                <Text style={styles.settingDescription}>
                  Auto logout after inactivity (minutes)
                </Text>
              </View>
              <View style={styles.stepper}>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateSettings({
                      sessionTimeoutMinutes: Math.max(
                        5,
                        settings.sessionTimeoutMinutes - 5
                      ),
                    })
                  }
                >
                  <Feather name="minus" size={16} color={Colors.text} />
                </Pressable>
                <Text style={styles.stepperValue}>
                  {settings.sessionTimeoutMinutes}m
                </Text>
                <Pressable
                  style={styles.stepperBtn}
                  onPress={() =>
                    updateSettings({
                      sessionTimeoutMinutes: settings.sessionTimeoutMinutes + 5,
                    })
                  }
                >
                  <Feather name="plus" size={16} color={Colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Badge as Username</Text>
                <Text style={styles.settingDescription}>
                  Use badge number as login identifier
                </Text>
              </View>
              <Switch
                value={settings.badgeAsUsername}
                onValueChange={(value) =>
                  updateSettings({ badgeAsUsername: value })
                }
                trackColor={{ false: Colors.border, true: Colors.safe + "60" }}
                thumbColor={
                  settings.badgeAsUsername ? Colors.safe : Colors.textSecondary
                }
              />
            </View>
          </Card>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Card>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Application</Text>
                <Text style={styles.settingValue}>
                  Khurais Emergency Alert System
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingValue}>{settings.systemVersion}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Support</Text>
                <Text style={styles.settingValue}>
                  IT Department - Emergency Systems
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Contact</Text>
                <Text style={styles.settingValue}>it-support@khurais.sa</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={handleLogout}
          variant="destructive"
          fullWidth
          style={{ marginTop: Spacing.md }}
        />

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  logoutBtn: {
    padding: Spacing.sm,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
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
  },
  settingDescription: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
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
    width: 32,
    height: 32,
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
