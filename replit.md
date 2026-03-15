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
