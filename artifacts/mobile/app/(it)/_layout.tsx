import { Redirect, Stack } from "expo-router";

import { Colors } from "@/constants/theme";
import { useStore } from "@/store";

export default function ITLayout() {
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const currentUser = useStore((s) => s.currentUser);

  if (!isAuthenticated || !currentUser) {
    return <Redirect href="/(auth)/login" />;
  }
  if (currentUser.role !== "IT" && currentUser.role !== "Super Admin") {
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
      <Stack.Screen name="index" />
      <Stack.Screen name="create-admin" />
      <Stack.Screen name="approvals" />
    </Stack>
  );
}
