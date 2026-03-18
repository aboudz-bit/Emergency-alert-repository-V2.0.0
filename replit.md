# Masah Boutique — بوتيك ماسـة

## Overview

Full-stack boutique e-commerce app with an Express.js backend (from the GitHub branch `claude/instagram-boutique-integration-MLd62`) and a Flutter mobile frontend.

## Architecture

```
workspace/
├── artifacts/
│   ├── boutique-server/        # ← Main backend (from GitHub branch, exact code)
│   │   ├── server/             # Express.js + TypeScript server
│   │   │   ├── index.ts        # Entry point (reads PORT from env)
│   │   │   ├── routes.ts       # All API routes
│   │   │   ├── storage.ts      # DB access layer (DatabaseStorage)
│   │   │   ├── seed.ts         # Seeds products, stores, discount codes
│   │   │   ├── db.ts           # Drizzle + pg connection
│   │   │   ├── payments.ts     # Payment abstraction (Moyasar-ready)
│   │   │   └── shipping.ts     # Shipping abstraction (Aramex-ready)
│   │   ├── shared/
│   │   │   └── schema.ts       # Drizzle schema (products, cart, orders, stores, etc.)
│   │   ├── package.json        # npm-based (express, drizzle-orm, tsx, zod...)
│   │   ├── tsconfig.json       # paths: @shared/* → ./shared/*
│   │   └── drizzle.config.ts   # Points to ./shared/schema.ts
│   ├── api-server/             # Thin proxy → forwards all traffic to boutique-server:5000
│   ├── mobile/                 # Expo React Native app (Admin, User, ECO, Supervisor, IT)
│   └── mockup-sandbox/         # UI prototyping sandbox
├── masah_boutique/             # Flutter app (from GitHub branch)
└── lib/                        # Shared TS libs (api-spec, api-client-react, api-zod, db)
```

## Running Services

| Workflow | What it runs | Port |
|---|---|---|
| `Boutique Server` | `cd artifacts/boutique-server && ./node_modules/.bin/tsx server/index.ts` | 5000 |
| `artifacts/api-server: API Server` | Thin proxy → forwards all `/api/*` traffic to port 5000 | system-assigned |
| `artifacts/mobile: expo` | Expo dev server | system-assigned |

## API Endpoints (all via `/api/*`)

- `GET /api/products` — list products (filter by `?category=`, `?search=`, `?featured=true`)
- `GET /api/products/:id` — single product
- `GET /api/cart` — cart items (session-based)
- `POST /api/cart` — add to cart
- `PATCH /api/cart/:id` — update quantity
- `DELETE /api/cart/:id` — remove item
- `DELETE /api/cart` — clear cart
- `POST /api/orders` — place order
- `GET /api/orders` — session order history
- `GET /api/stores` — active store locations
- `POST /api/discounts/validate` — validate discount code

## Database

- PostgreSQL via Replit's built-in database (`DATABASE_URL` env var)
- Drizzle ORM — schema in `artifacts/boutique-server/shared/schema.ts`
- Push schema: `cd artifacts/boutique-server && npx drizzle-kit push`
- Auto-seeds 10 products, 3 stores, 3 discount codes on first start

## Theme

- Dark luxury: `#1A1A2E` background, `#C8A96E` gold, `#222240` card
- Bilingual: Arabic (RTL) + English

## Categories

abayas, jalabiyas, dresses, bridal, kids, gifts

---

# Khurais Emergency Alert System (KEAS)

## Overview

Emergency alert and personnel tracking system for Khurais industrial facility. React + Vite SPA with Zustand state management, dark theme, responsive layout. Demo/prototype — all data in Zustand store with localStorage persistence.

## Architecture

```
artifacts/emergency/
├── src/
│   ├── pages/
│   │   ├── login.tsx              # Badge + password login
│   │   ├── admin/
│   │   │   ├── dashboard.tsx      # Command center with KPIs, quick actions
│   │   │   ├── users.tsx          # Personnel directory (table + mobile cards)
│   │   │   ├── alert-monitor.tsx  # Live alert tracking
│   │   │   ├── send-alert.tsx     # Broadcast alert form + mobile preview
│   │   │   ├── history.tsx        # Alert audit history
│   │   │   ├── zones.tsx          # Leaflet map with zone polygons
│   │   │   ├── locations.tsx      # Location management cards
│   │   │   └── settings.tsx       # System settings
│   │   ├── it/index.tsx           # IT admin panel
│   │   └── mobile/                # Mobile user pages
│   ├── store/index.ts             # Zustand v5 store (persisted to keas-store-v3)
│   ├── types/index.ts             # All TypeScript types
│   ├── lib/mock-data.ts           # Seed data with real Khurais coordinates
│   ├── components/
│   │   ├── layout/AdminLayout.tsx # Responsive sidebar (mobile drawer + desktop collapse)
│   │   ├── shared/                # Badges, KPICard, etc.
│   │   └── ui/                    # shadcn/ui components
│   └── index.css                  # Global CSS + Leaflet dark theme overrides
```

## Key Technical Details

- **Zustand v5**: Always use `useShallow` from `@/store` when selecting multiple values or using selectors that return new arrays/objects (`.filter()`, `.map()`). Single-value/function selectors are safe without `useShallow`.
- **Store version**: `keas-store-v5` — bump version when changing Zone/User type shapes to force fresh seed data. Store merge function ensures ecoAssignments/supervisorAssignments never rehydrate as empty.
- **Leaflet**: `react-leaflet` with CartoDB Voyager light tiles (`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`), no API key needed. Zones page uses a light professional theme (white/slate panels, blue accents) separate from the app's dark theme.
- **Zone coordinates**: Real Khurais lat/lng (~25.08°N, 48.18°E)
- **Responsive**: Desktop table → mobile card layout at `lg` (1024px) breakpoint. Sidebar auto-collapses on mobile with drawer overlay.
- **Routing**: Wouter with `base={import.meta.env.BASE_URL}` (base is `/emergency/`)
- **Demo login**: Badge 102934 (Super Admin), 104822 (IT), 103618 (ECO→/eco), 108291 (Supervisor→/supervisor), 105477 (Backup→/supervisor), 107543 (Normal User→/mobile/home); password `demo1234`. Login page has one-tap quick demo buttons. "Reset Demo Data" button clears stale localStorage.

## Mobile App (KEAS)

```
artifacts/mobile/
├── app/
│   ├── (auth)/login.tsx           # Badge + password login (approval status checks)
│   ├── (auth)/register.tsx       # Registration with User Type (Aramco/Contract), dynamic fields, approval workflow
│   ├── (admin)/
│   │   ├── _layout.tsx            # Admin tab bar (Dashboard, Alert, Users, History, More)
│   │   ├── index.tsx              # Dashboard: KPIs, alert banner + per-zone breakdown, quick actions, activity feed
│   │   ├── send-alert.tsx         # Alert form with type/zone/priority/preview
│   │   ├── users.tsx              # Personnel list with search + zone filter
│   │   ├── alert-monitor.tsx      # Live alert tracking with total + per-zone breakdown + personnel list
│   │   ├── history.tsx            # Alert history with type filter chips
│   │   ├── zones.tsx              # Map-first zones (WebView + Leaflet + CartoDB dark tiles)
│   │   ├── locations.tsx          # Location management with zone tabs
│   │   └── settings.tsx           # System settings with steppers and toggles
│   ├── (eco)/
│   │   ├── _layout.tsx            # ECO tab bar (Dashboard, Alerts, Profile)
│   │   ├── index.tsx              # ECO dashboard: zone-wide KPIs, location breakdown, alerts
│   │   ├── alerts.tsx             # Zone alerts list (active + history)
│   │   └── profile.tsx            # ECO profile with assignment info
│   ├── (supervisor)/
│   │   ├── _layout.tsx            # Supervisor tab bar (Dashboard, Personnel, Profile)
│   │   ├── index.tsx              # Supervisor dashboard: location KPIs, personnel list, backup indicator
│   │   ├── personnel.tsx          # Personnel list with status filter tabs
│   │   └── profile.tsx            # Supervisor profile
│   ├── (it)/
│   │   ├── _layout.tsx            # IT stack layout
│   │   ├── index.tsx              # IT dashboard: account management, password resets, enable/disable
│   │   ├── create-admin.tsx       # Create Super Admin account
│   │   └── approvals.tsx          # Registration approval panel (pending/approved/rejected, role override)
│   └── (user)/
│       ├── _layout.tsx            # User tab bar (Home, Alerts, Profile)
│       ├── index.tsx              # User home: alert banner, response buttons, status
│       ├── alert.tsx              # Active alert detail
│       ├── history.tsx            # User alert history
│       └── profile.tsx            # User profile
├── components/ui/
│   ├── Header.tsx                 # Chevron back, pill back button
│   ├── Card.tsx                   # Base card with border + optional elevated style
│   ├── KPICard.tsx                # Icon+value top row, label below
│   ├── Button.tsx                 # Variant/size/icon props
│   ├── StatusBadge.tsx            # Dot+label pill badge
│   ├── Input.tsx                  # Input with bold label + focus border
│   └── ZoneBreakdown.tsx          # Per-zone response stats cards (Safe/Missing/NoReply/Help per zone)
├── constants/theme.ts             # Colors, Spacing, FontSize, BorderRadius
├── hooks/useZoneBreakdown.ts       # Computes per-zone response counts from users+zones+activeAlert
├── store/index.ts                 # Zustand store (keas-mobile-store-v1)
└── types/index.ts                 # TypeScript types
```

### Mobile Key Details

- **UI Theme**: Light enterprise palette — light gray background (`#F5F6F8`), white cards (`#FFFFFF`), gray borders (`#E5E7EB`), dark text (`#111111`/`#1F2937`). Purple header (`#5B3A8E`) with white text. Purple accent (`#5B3A8E`) used for primary, info, active tab, links. Red for alerts/destructive (`#DC2626`), green for safe (`#16A34A`), amber for warnings (`#D97706`). Flat cards (no shadows), tightened border radii (sm:6, md:10, lg:12).
- **Tab bar**: White background, gray top border, purple active icons/text (`Colors.primary`), gray inactive (`Colors.textSecondary`). Active pill uses `Colors.primaryDim`. Platform-aware height (iOS 88 / Android 68).
- **Zone Map Architecture (Google Maps target)**:
  - `components/map/` — unified map abstraction layer
    - `types.ts` — shared types (MapRegion, ZonePolygon, ZoneMapProps), converter functions
    - `ZoneMap.tsx` — provider router: Leaflet iframe on web (active fallback), placeholder on native until Google Maps API key configured
    - `GoogleMapsView.tsx` — FINAL native implementation via react-native-maps with PROVIDER_GOOGLE, light styled map, zone polygons, labels, selection + vertex drag editing
    - `LeafletPreviewFallback.tsx` — TEMPORARY web preview fallback (Leaflet iframe + CartoDB Voyager light tiles + vertex drag editing). Will be removed when shipping native.
    - `index.ts` — barrel export
  - **To activate Google Maps**: Set `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` env var, keys configured in app.json for both iOS and Android
  - Zone CRUD: Add Zone bottom-sheet modal (name/type/color), Edit Zone bottom-sheet modal (settings + "Edit Boundary Shape" action). New zones auto-appear in Location Management tabs.
  - **Shape editing**: "Edit Boundary Shape" enters full-screen map mode with draggable vertex markers on the polygon. Save/Cancel controls overlay the map. Works in both Google Maps native and Leaflet web preview.
- **Dependencies**: `react-native-maps` (Google Maps native), `react-native-webview` (Leaflet fallback)
- **Shelter System**: Admin can CRUD shelters (tap map to place, name modal, bottom sheet with rename/enable-disable/delete). User/ECO/Supervisor screens show shelter markers on map with GPS location + nearest shelter calculation (haversine). Shelter data synced to Leaflet iframe via postMessage (`sync_shelters`, `select_shelter`, `set_nearest_shelter`, `set_user_location`). `prevSheltersRef` resets on `mapHtml` change to ensure re-sync after iframe reload. Shelters have `linkedLocationIds` for shelter-to-location linking (which locations a shelter serves).
- **Location Boundaries**: Locations have `polygonPoints: LatLng[]` for polygon boundaries rendered on the map (indigo dashed polygons, distinct from zone polygons). Admin can draw/edit/clear location boundaries from the zone bottom sheet → location chips. Location polygons synced to Leaflet via postMessage (`sync_locations`, `select_location`, `highlight_locations`, `start_loc_edit`, `clear_loc_edit`). When a shelter is selected, its linked locations are highlighted (amber). Shelter-to-location linking modal allows multi-select with checkboxes.
- **Location-Aware Logic**: `utils/geo.ts` has `pointInPolygon` (ray-casting), `haversineDistance`, `formatDistance`, and `findBestShelter` (generic, prioritizes linked shelters > zone shelters > all). `hooks/useDetectedLocation.ts` detects user's current location from GPS via pip. User home uses detected location to prefer linked shelters and highlights the user's location boundary on the map. Supervisor dashboard shows linked shelter count KPI. ECO dashboard shows shelter count per location in breakdown cards.
- **Live Personnel Tracking**: `PersonnelLocation` type with `userId, lat, lng, accuracy, timestamp, detectedLocationId, zoneId`. Store has `personnelLocations: Record<number, PersonnelLocation>` + `updatePersonnelLocation`/`clearPersonnelLocations` actions. `usePersonnelTracking` hook polls GPS every 8s (settings-configurable, clamped 5-30s), permission requested once. `usePersonnelSimulation` simulates other users' locations for demo. `useVisiblePersonnel` scopes visible personnel (all/location/zone) with fail-closed guards + 120s stale filter. Leaflet renders personnel as small color-coded dots (green=safe, amber=pending, red=need-help with pulse). All updates via postMessage `sync_personnel` — no map reload/camera reset. Super Admin sees all personnel; Supervisor sees only their assigned location's personnel.
- **Registration & Approval**: User Type (Aramco/Contract) determines which fields are shown. Aramco users must select Role + Location. Contract users get Role=null, Location=null. All new registrations get `approvalStatus='pending'`. IT panel (`/(it)/approvals`) allows approve/reject with optional role override and rejection reason. Login blocks pending/rejected users with specific messages.
- **Store**: `keas-mobile-store-v11` — bump when type shapes change. User interface extended with `userType`, `mobileNumber`, `approvalStatus`, `approvedBy`, `approvedAt`, `rejectionReason`. UserRole extended with `'Supervisor' | 'Back Superior'`. Store includes `approveUser/rejectUser` actions, `ecoAssignments/supervisorAssignments` with merge protection, shelters slice with `addShelter/updateShelter/deleteShelter` actions.
- **Demo login**: Badge 102934 (Super Admin→admin), 104822 (IT→it), 103618 (ECO→eco), 108291 (Supervisor→supervisor), 105477 (Backup Supervisor→supervisor), 107543 (User→user), 200001 (Contractor→user, view-only); password `demo1234`
- **Mobile routing**: ECO/Supervisor flags checked before role switch — ECO users go to `/(eco)`, Supervisor/Backup go to `/(supervisor)`, then role-based (Super Admin→admin, IT→it, default→user)

## Workflow

| Workflow | Command |
|---|---|
| `artifacts/emergency: web` | `pnpm --filter @workspace/emergency run dev` |
| `artifacts/mobile: expo` | `pnpm --filter @workspace/mobile run dev` |
