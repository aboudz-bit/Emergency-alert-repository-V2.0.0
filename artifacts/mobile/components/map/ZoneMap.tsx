/**
 * ──────────────────────────────────────────────────────────────────────────────
 * ZoneMap — Unified map component for zone rendering
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * MAP PROVIDER STRATEGY:
 *
 *   Platform     │ Provider              │ Status
 *   ─────────────┼───────────────────────┼──────────────────
 *   iOS native   │ Google Maps (native)  │ FINAL — needs EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *   Android      │ Google Maps (native)  │ FINAL — needs EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *   All (no key) │ Leaflet (iframe/WV)   │ FALLBACK — iframe on web, WebView on native
 *
 * The Leaflet fallback works everywhere so the app is functional during
 * development and testing before Google Maps is configured.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { Colors, FontSize, Spacing } from "@/constants/theme";
import type { ZoneMapProps } from "./types";

const IS_WEB = Platform.OS === "web";

let MapComponent: React.ComponentType<ZoneMapProps> | null = null;

if (IS_WEB) {
  MapComponent = require("./LeafletPreviewFallback").LeafletPreviewFallback;
}

function MapPlaceholder({ height }: { height: number }) {
  return (
    <View style={[styles.placeholder, { height }]}>
      <Feather name="map" size={48} color={Colors.textTertiary} />
      <Text style={styles.placeholderTitle}>Map Unavailable</Text>
      <Text style={styles.placeholderDesc}>
        Open in Expo web preview or configure Google Maps API key for native.
      </Text>
    </View>
  );
}

export function ZoneMap(props: ZoneMapProps) {
  if (MapComponent) {
    return <MapComponent {...props} />;
  }
  return <MapPlaceholder height={props.height} />;
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
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: Colors.textSecondary,
  },
  placeholderDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    textAlign: "center",
    maxWidth: 280,
  },
});

export type { ZoneMapProps, DrawMode } from "./types";
