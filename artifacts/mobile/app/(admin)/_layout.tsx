import { Redirect, Stack } from "expo-router";
import React from "react";

import { Colors } from "@/constants/theme";
import { useStore } from "@/store";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function AdminLayoutInner() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const currentUser = useStore((s) => s.currentUser);

  if (!isAuthenticated || !currentUser) {
    return <Redirect href="/(auth)/login" />;
  }
  if (currentUser.role !== "Super Admin" && currentUser.role !== "IT") {
    return <Redirect href="/(user)" />;
  }

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

export default function AdminLayout() {
  return (
    <ErrorBoundary label="AdminLayout">
      <AdminLayoutInner />
    </ErrorBoundary>
  );
}
