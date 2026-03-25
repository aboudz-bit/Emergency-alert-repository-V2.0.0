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
import { useTranslation } from "@/i18n/useTranslation";
import { Colors } from "@/constants/theme";

let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> =
  React.Fragment;
if (Platform.OS !== "web") {
  try {
    KeyboardProvider =
      require("react-native-keyboard-controller").KeyboardProvider;
  } catch (e) {
    console.error('[_layout] react-native-keyboard-controller failed to load:', e);
  }
}

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  let rtl = false;
  try {
    const translation = useTranslation();
    rtl = translation.rtl;
  } catch (e) {
    console.error('[RootLayout] useTranslation failed:', e);
  }

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

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

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary screenName="RootLayout">
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
