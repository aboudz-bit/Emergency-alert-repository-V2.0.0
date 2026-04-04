/**
 * ZoneMap — Unified map component for zone rendering
 *
 * MAP PROVIDER STRATEGY:
 *
 *   Platform     │ Provider              │ Status
 *   ─────────────┼───────────────────────┼──────────────────
 *   iOS native   │ Apple Maps (native)   │ FINAL — no API key needed
 *   Android      │ Google Maps (native)  │ FINAL — needs EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *   Web          │ Leaflet (iframe)      │ FALLBACK
 *
 * Metro resolves NativeMap.tsx on native and NativeMap.web.tsx on web,
 * preventing react-native-maps from being bundled for web.
 */

import React from "react";

import type { ZoneMapProps } from "./types";
import { NativeMap } from "./NativeMap";

export function ZoneMap(props: ZoneMapProps) {
  return <NativeMap {...props} />;
}

export type { ZoneMapProps, DrawMode } from "./types";
