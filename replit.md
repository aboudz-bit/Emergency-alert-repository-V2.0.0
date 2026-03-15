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
│   ├── mobile/                 # Expo React Native scaffold (not yet built out)
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
- **Store version**: `keas-store-v3` — bump version when changing Zone/User type shapes to force fresh seed data
- **Leaflet**: `react-leaflet` with CartoDB dark tiles (`https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`), no API key needed
- **Zone coordinates**: Real Khurais lat/lng (~25.08°N, 48.18°E)
- **Responsive**: Desktop table → mobile card layout at `lg` (1024px) breakpoint. Sidebar auto-collapses on mobile with drawer overlay.
- **Routing**: Wouter with `base={import.meta.env.BASE_URL}` (base is `/emergency/`)
- **Demo login**: Badge 102934 (Super Admin), 110001 (IT), 123456 (User); password `demo1234`

## Workflow

| Workflow | Command |
|---|---|
| `artifacts/emergency: web` | `pnpm --filter @workspace/emergency run dev` |
