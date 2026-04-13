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
import React, { useEffect, useState } from "react";
import { ActivityIndicator, I18nManager, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SystemServices } from "@/components/SystemServices";
import { useTranslation } from "@/i18n/useTranslation";
import { Colors } from "@/constants/theme";

const IS_WEB = Platform.OS === "web";

let KeyboardProvider: React.ComponentType<{ children: React.ReactNode }> =
  React.Fragment;
if (!IS_WEB) {
  try {
    KeyboardProvider =
      require("react-native-keyboard-controller").KeyboardProvider;
  } catch (e) {
    // keyboard controller not available on this platform
  }
}

if (!IS_WEB) {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

export default function RootLayout() {
  let rtl = false;
  try {
    const translation = useTranslation();
    rtl = translation.rtl;
  } catch (e) {
    // translation hook not available yet
  }

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    feather: require("@/assets/fonts/Feather.ttf"),
    ionicons: require("@/assets/fonts/Ionicons.ttf"),
  });

  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (I18nManager.isRTL !== rtl) {
      I18nManager.allowRTL(rtl);
      I18nManager.forceRTL(rtl);
    }
  }, [rtl]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setReady(true);
      if (!IS_WEB) {
        SplashScreen.hideAsync().catch(() => {});
      }
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (!IS_WEB) {
      const timeout = setTimeout(() => {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundary screenName="RootLayout">
        <GestureHandlerRootView
          style={{ flex: 1, direction: rtl ? "rtl" : "ltr" }}
        >
          <KeyboardProvider>
            <SystemServices />
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
