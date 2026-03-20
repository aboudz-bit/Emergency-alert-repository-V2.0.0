import { Stack } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="alert-monitor" />
      <Stack.Screen name="zones" />
      <Stack.Screen name="locations" />
      <Stack.Screen name="eco-management" />
      <Stack.Screen name="supervisor-management" />
      <Stack.Screen name="permissions" />
    </Stack>
  );
}
