import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { Colors, FontSize } from "@/constants/theme";

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send-alert"
        options={{
          title: "Alert",
          tabBarIcon: ({ color }) => <Feather name="alert-triangle" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <Feather name="clock" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "More",
          tabBarIcon: ({ color }) => <Feather name="menu" size={22} color={color} />,
        }}
      />
      <Tabs.Screen name="alert-monitor" options={{ href: null }} />
      <Tabs.Screen name="zones" options={{ href: null }} />
      <Tabs.Screen name="locations" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 88,
    paddingBottom: 28,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: FontSize.xs,
    fontFamily: "Inter_500Medium",
  },
});
