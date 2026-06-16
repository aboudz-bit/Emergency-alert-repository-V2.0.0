import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";

function TabIcon({ name, color, focused }: { name: keyof typeof Feather.glyphMap; color: string; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Feather name={name} size={20} color={color} />
    </View>
  );
}

export default function AdminTabsLayout() {
  const insets = useSafeAreaInsets();
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
          tabBarIcon: ({ color, focused }) => <TabIcon name="grid" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="send-alert"
        options={{
          title: "Alert",
          tabBarIcon: ({ color, focused }) => <TabIcon name="alert-triangle" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, focused }) => <TabIcon name="users" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="zone-map"
        options={{
          title: "Zone Map",
          tabBarIcon: ({ color, focused }) => <TabIcon name="map" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarIcon: ({ color, focused }) => <TabIcon name="menu" color={color} focused={focused} />,
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
