/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ZoneMap — Unified map component for zone rendering
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * MAP PROVIDER STRATEGY:
 *
 *   Platform     │ Provider              │ Status
 *   ─────────────┼───────────────────────┼──────────────────
 *   iOS native   │ Google Maps (native)  │ FINAL — via react-native-maps
 *   Android      │ Google Maps (native)  │ FINAL — via react-native-maps
 *   Web preview  │ Leaflet (iframe)      │ TEMPORARY — dev preview only
 *
 * To activate Google Maps on native:
 *   1. Get a Google Maps API key from Google Cloud Console
 *   2. Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in environment
 *   3. For iOS: add the key to app.json under expo.ios.config.googleMapsApiKey
 *   4. For Android: add the key to app.json under expo.android.config.googleMaps.apiKey
 *   5. Build with EAS (expo build / eas build)
 *
 * The Google Maps native component (GoogleMapsView) is already built and ready.
 * It will automatically be used on native platforms once the API key is configured.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Colors, FontSize, Spacing, BorderRadius } from "@/constants/theme";
import type { ZoneMapProps } from "./types";

const IS_WEB = Platform.OS === "web";

let GoogleMapsViewComponent: React.ComponentType<ZoneMapProps> | null = null;
let LeafletFallbackComponent: React.ComponentType<ZoneMapProps> | null = null;

if (IS_WEB) {
  try {
    LeafletFallbackComponent =
      require("./LeafletPreviewFallback").LeafletPreviewFallback;
  } catch {}
} else {
  try {
    GoogleMapsViewComponent = require("./GoogleMapsView").GoogleMapsView;
  } catch {}
}

function NativeMapPlaceholder({ height }: { height: number }) {
  return (
    <View style={[styles.placeholder, { height }]}>
      <Feather name="map" size={48} color={Colors.textTertiary} />
      <Text style={styles.placeholderTitle}>Google Maps Required</Text>
      <Text style={styles.placeholderDesc}>
        Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and rebuild with EAS to enable the native Google Maps view.
      </Text>
    </View>
  );
}

export function ZoneMap(props: ZoneMapProps) {
  if (!IS_WEB && GoogleMapsViewComponent) {
    return <GoogleMapsViewComponent {...props} />;
  }

  if (IS_WEB && LeafletFallbackComponent) {
    return <LeafletFallbackComponent {...props} />;
  }

  return <NativeMapPlaceholder height={props.height} />;
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  placeholderTitle: {
    fontSize: FontSize.lg,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  placeholderDesc: {
    fontSize: FontSize.sm,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    maxWidth: 280,
  },
});

export { ZoneMapProps, type DrawMode } from "./types";
