import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTranslation } from "@/i18n";
import { Colors } from "@/constants/theme";

// KeyboardProvider uses native modules (react-native-is-edge-to-edge) that
// are not available on web, so we only load it on native platforms.
let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> =
  React.Fragment;
if (Platform.OS !== "web") {
  KeyboardProvider =
    require("react-native-keyboard-controller").KeyboardProvider;
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { rtl } = useTranslation();

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Sync I18nManager with the current language on every mount (no reload here,
  // just ensures flags stay consistent after a cold start).
  useEffect(() => {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  }, [rtl]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <GestureHandlerRootView
          style={{ flex: 1, direction: rtl ? "rtl" : "ltr" }}
        >
          <KeyboardProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: Colors.background },
                animation: "fade",
                headerTitleAlign: "center",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(admin)" />
              <Stack.Screen name="(user)" />
              <Stack.Screen name="(it)" />
              <Stack.Screen name="(eco)" />
              <Stack.Screen name="(supervisor)" />
            </Stack>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
