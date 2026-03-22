# Masah Boutique & Khurais Emergency Alert System (KEAS)

## Overview

This project comprises two distinct applications:

**Masah Boutique**: A full-stack e-commerce platform featuring an Express.js backend and a Flutter mobile frontend. It aims to provide a luxurious online shopping experience with a focus on traditional and contemporary fashion items.

**Khurais Emergency Alert System (KEAS)**: A critical emergency alert and personnel tracking system designed for the Khurais industrial facility. It includes a React + Vite web application for administration and monitoring, and an Expo React Native mobile application for various user roles (Admin, IT, ECO, Supervisor, User). The system focuses on real-time alerts, personnel tracking, and location-aware safety features.

## User Preferences

- I want iterative development.
- I prefer detailed explanations.
- Do not make changes to the folder `artifacts/boutique-server`.
- Do not make changes to the folder `artifacts/api-server`.
- Do not make changes to the folder `artifacts/mobile`.
- Do not make changes to the folder `artifacts/mockup-sandbox`.
- Do not make changes to the folder `masah_boutique`.

## System Architecture

The project is structured into two main applications:

### Masah Boutique

- **Backend**: Express.js with TypeScript, Drizzle ORM for PostgreSQL. Handles product catalog, cart management, orders, stores, and discount validation. Payment and shipping abstractions are in place (Moyasar-ready, Aramex-ready).
- **Frontend**: Flutter mobile application.
- **API**: Exposed via `/api/*` endpoint, with a thin proxy (`api-server`) forwarding requests to the `boutique-server`.
- **Database**: PostgreSQL, managed by Replit's built-in database, using Drizzle ORM with schema defined in `artifacts/boutique-server/shared/schema.ts`. Auto-seeds data on first start.
- **UI/UX**: Dark luxury theme (`#1A1A2E`, `#C8A96E`, `#222240`). Bilingual support for Arabic (RTL) and English.

### Khurais Emergency Alert System (KEAS)

- **Web Application (Admin/Monitoring)**: React + Vite SPA, Zustand for state management (persisted to localStorage), Wouter for routing. Responsive design for desktop and mobile.
- **Mobile Application (Personnel)**: Expo React Native app, also using Zustand for state management. Features various role-based interfaces (Admin, IT, ECO, Supervisor, User).
- **UI/UX**:
    - **Web**: Dark theme for the main application, with a light professional theme for map-intensive pages (Zones).
    - **Mobile**: Light enterprise palette (`#F5F6F8` background, white cards, purple accents `#5B3A8E`). Flat card design, tightened border radii. Platform-aware tab bars.
- **Key Features**:
    - **Authentication**: Badge + password login, registration with approval workflow.
    - **Alert Management**: Send/monitor alerts, audit history, zone-based alerting.
    - **Personnel Tracking**: Live GPS tracking of personnel locations during active alerts, with status (Safe/Missing/NoReply/Help).
    - **Location & Zone Management**: Define zones and locations using Leaflet (web) and `react-native-maps` (native) with real Khurais coordinates. CRUD operations for zones, locations, and shelters.
    - **Shelter System**: Manage shelters, calculate nearest shelters, link shelters to locations.
    - **Role-based Access Control**: Specific dashboards and functionalities for Super Admin, IT, ECO, Supervisor, and normal Users.
    - **Emergency Modes**: Shelter In and Blackout modes with zone-scoped activation, `canActivateEmergencyMode` permission gating, and receipt acknowledgment system. Affected users see a full-screen overlay with "Confirm Receipt" button (30s alarm reminders). ECO/Admin dashboards show real-time receipt tracking (confirmed vs pending, with progress bar).
    - **Data Management**: Zustand store with versioning (v23) and migration support for persistence. Strict selector rules to prevent excessive re-renders.

## External Dependencies

### Masah Boutique

- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Payment Gateway**: Moyasar (abstraction ready)
- **Shipping Provider**: Aramex (abstraction ready)

### Khurais Emergency Alert System (KEAS)

- **Mapping Libraries**:
    - `react-leaflet` (for web preview/fallback)
    - `react-native-maps` (for native Google Maps integration)
    - `react-native-webview` (for Leaflet fallback in mobile)
- **Map Tiles**: CartoDB Voyager light tiles (no API key required)
- **State Management**: Zustand
- **UI Components**: shadcn/ui (web), custom components (mobile)
- **Location Services**: GPS (for personnel tracking and location detection)