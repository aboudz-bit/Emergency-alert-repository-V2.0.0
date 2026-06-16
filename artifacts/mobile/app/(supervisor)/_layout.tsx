import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing } from "@/constants/theme";
import { useStore } from "@/store";

function TabIcon({ name, color, focused }: { name: keyof typeof Feather.glyphMap; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

export default function SupervisorLayout() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const currentUser = useStore((s) => s.currentUser);
  const insets = useSafeAreaInsets();

  if (!isAuthenticated || !currentUser) {
    return <Redirect href="/(auth)/login" />;
  }
  const isSupervisor = (currentUser.isSupervisorAssigned || currentUser.isBackupSupervisorAssigned) && currentUser.supervisorAssignmentActive;
  const isAdmin = currentUser.role === "Super Admin" || currentUser.role === "IT";
  if (!isSupervisor && !isAdmin) {
    return <Redirect href="/(user)" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: [styles.tabBar, { height: 60 + insets.bottom, paddingBottom: Math.max(insets.bottom, 8) }],
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => <TabIcon name="clipboard" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, focused }) => <TabIcon name="map" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="personnel"
        options={{
          title: "Personnel",
          tabBarIcon: ({ color, focused }) => <TabIcon name="users" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "All Users",
          tabBarIcon: ({ color, focused }) => <TabIcon name="shield" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => <TabIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    paddingTop: 6,
    paddingHorizontal: Spacing.sm,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
  },
  tabItem: {
    gap: 2,
  },
  iconWrap: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: Colors.primaryDim,
  },
});
