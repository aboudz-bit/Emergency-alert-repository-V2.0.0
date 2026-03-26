# Masah Boutique — بوتيك ماسـة

## Overview
Masah Boutique is a full-stack e-commerce application featuring a boutique with a Flutter mobile frontend and an Express.js backend. The project aims to provide a luxurious online shopping experience with a focus on high-quality fashion items. It supports a wide range of features including product browsing, cart management, order placement, and discount validation.

The Khurais Emergency Alert System (KEAS) is an emergency alert and personnel tracking system designed for the Khurais industrial facility. It provides a robust platform for managing emergency situations, tracking personnel, and ensuring timely communication. The system is currently a demo/prototype, with all data managed in a Zustand store with localStorage persistence.

## User Preferences
Not specified.

## System Architecture

### Masah Boutique
- **Backend**: Express.js with TypeScript, Drizzle ORM for PostgreSQL. Handles API routes for products, cart, orders, stores, and discounts.
- **Frontend**: Flutter mobile application.
- **Database**: PostgreSQL via Drizzle ORM, schema defined in `artifacts/boutique-server/shared/schema.ts`. Auto-seeds initial data.
- **UI/UX (Theme)**: Dark luxury theme (`#1A1A2E` background, `#C8A96E` gold, `#222240` card).
- **Localization**: Bilingual support for Arabic (RTL) and English.

### Khurais Emergency Alert System (KEAS)
- **Frontend**: React with Vite, utilizing Zustand for state management.
- **UI/UX**: Dark theme, responsive layout (desktop table to mobile card at `lg` breakpoint). Mobile app uses a light enterprise palette (`#F5F6F8` background, white cards, purple header/accents) with platform-aware tab bars.
- **State Management**: Zustand v5 with persistence to `localStorage`. Selectors that return objects/arrays MUST cache results (module-level memoization with input key) to satisfy React 18's `useSyncExternalStore` requirement for stable `getSnapshot` returns. See `selectAlertSystemState` pattern in `store/selectors.ts`. The `useAlertSystemState` hook is the single source of truth for all alert/emergency state across screens.
- **Mapping**: Leaflet iframe fallback for web preview uses Esri World Imagery satellite tiles with hybrid road/label overlays by default. Supports 4 map types (satellite, hybrid, standard, dark) via floating layer switcher. Google Maps-style floating controls (zoom, locate, layers) on right side. Shelter clustering at zoom < 14, zoom-dependent labels (show at zoom >= 15 for shelters, >= 13 for zones). Zone polygons use subtle fills (0.1 opacity) with selected-zone highlighting. Native targets Google Maps with `react-native-maps`.
- **Location Awareness**: `utils/geo.ts` for `pointInPolygon`, `haversineDistance`, `findBestShelter`. `useDetectedLocation.ts` for GPS-based location detection.
- **Personnel Tracking**: Live personnel tracking activated during active alerts. Polls GPS (configurable interval), simulates other users for demo. Displays personnel on maps with color-coded status.
- **Authentication & Authorization**: Badge and password login. Role-based access (Super Admin, IT, ECO, Supervisor, User). Registration with approval workflow, including role override and rejection reasons. Route guards enforce authentication and authorization across all layouts.
- **Store**: `keas-mobile-store-v20` (persist key), version 24 with slice architecture. Includes domain-specific slices, user management (approval status, user types), and emergency-related state.
- **Alert System**: Comprehensive alert lifecycle (activate, clear, reactivate). Includes zone-specific alerts, shelter-in-place, and blackout modes.

## External Dependencies

### Masah Boutique
- **Payment Gateway**: Moyasar (ready for integration).
- **Shipping Carrier**: Aramex (ready for integration).
- **Database**: PostgreSQL.

### Khurais Emergency Alert System (KEAS)
- **Mapping**: CartoDB (for Leaflet tiles), Google Maps (for native mobile).
- **Libraries**: `react-leaflet`, `react-native-maps`, `react-native-webview`, Zustand, Wouter, shadcn/ui.