import {
  pgTable,
  integer,
  bigint,
  varchar,
  text,
  boolean,
  doublePrecision,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// KEAS backend-of-record schema. Mirrors the shared @workspace/keas-core data
// model. Queryable scalars are columns; nested arrays/objects are jsonb.
// Every table carries updated_at for additive write-through sync from mobile.
// (accountability_sessions / personnel_status live in ./accountability.)

type LatLng = { lat: number; lng: number };
const emptyJsonArray = sql`'[]'::jsonb`;

// ─── Users (operational roster of record; NO password — auth stays mobile-local) ──
export const users = pgTable("users", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  badge: varchar("badge", { length: 64 }).notNull(),
  role: varchar("role", { length: 32 }).notNull().default("User"),
  zone: varchar("zone", { length: 255 }).notNull().default(""),
  zoneId: integer("zone_id").notNull().default(0),
  location: varchar("location", { length: 255 }).notNull().default(""),
  locationId: integer("location_id").notNull().default(0),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  accountStatus: varchar("account_status", { length: 20 }).notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  userType: varchar("user_type", { length: 32 }),
  companyName: varchar("company_name", { length: 255 }),
  mobileNumber: varchar("mobile_number", { length: 32 }),
  language: varchar("language", { length: 8 }),
  approvalStatus: varchar("approval_status", { length: 16 }),
  escalationLevel: integer("escalation_level").notNull().default(0),
  isEcoAssigned: boolean("is_eco_assigned").notNull().default(false),
  ecoSlot: varchar("eco_slot", { length: 4 }),
  ecoZoneName: varchar("eco_zone_name", { length: 255 }),
  ecoAssignmentActive: boolean("eco_assignment_active").notNull().default(false),
  isSupervisorAssigned: boolean("is_supervisor_assigned").notNull().default(false),
  isBackupSupervisorAssigned: boolean("is_backup_supervisor_assigned").notNull().default(false),
  supervisorAssignmentActive: boolean("supervisor_assignment_active").notNull().default(false),
  permissions: jsonb("permissions").$type<string[]>().notNull().default(emptyJsonArray),
  lastActivity: varchar("last_activity", { length: 40 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Personnel live locations (one current position per user) ──────────────────
export const personnelLocations = pgTable("personnel_locations", {
  userId: integer("user_id").primaryKey(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  accuracy: doublePrecision("accuracy").notNull().default(0),
  capturedAt: bigint("captured_at", { mode: "number" }).notNull(),
  detectedLocationId: integer("detected_location_id"),
  zoneId: integer("zone_id"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Zones ─────────────────────────────────────────────────────────────────────
export const zones = pgTable("zones", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 32 }).notNull().default("CPF"),
  parentZoneId: integer("parent_zone_id"),
  locationId: integer("location_id"),
  boundaryType: varchar("boundary_type", { length: 16 }).notNull().default("Polygon"),
  polygonPoints: jsonb("polygon_points").$type<LatLng[]>().notNull().default(emptyJsonArray),
  center: jsonb("center").$type<LatLng | null>(),
  radius: doublePrecision("radius"),
  isActive: boolean("is_active").notNull().default(true),
  isArchived: boolean("is_archived").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  color: varchar("color", { length: 32 }).notNull().default("#5B3A8E"),
  alertActive: boolean("alert_active").notNull().default(false),
  alertType: varchar("alert_type", { length: 64 }),
  alertPriority: varchar("alert_priority", { length: 16 }),
  alertMessage: text("alert_message").notNull().default(""),
  alertUpdatedAt: varchar("alert_updated_at", { length: 40 }),
  alertHistory: jsonb("alert_history").$type<unknown[]>().notNull().default(emptyJsonArray),
  alertTargetScope: varchar("alert_target_scope", { length: 16 }).notNull().default("zone"),
  alertTargetLocationIds: jsonb("alert_target_location_ids").$type<number[]>().notNull().default(emptyJsonArray),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Locations ─────────────────────────────────────────────────────────────────
export const locations = pgTable("locations", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  zone: varchar("zone", { length: 255 }).notNull().default(""),
  zoneId: integer("zone_id").notNull().default(0),
  expectedManpower: integer("expected_manpower").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  polygonPoints: jsonb("polygon_points").$type<LatLng[]>().notNull().default(emptyJsonArray),
  alertActive: boolean("alert_active").notNull().default(false),
  alertType: varchar("alert_type", { length: 64 }),
  alertPriority: varchar("alert_priority", { length: 16 }),
  alertMessage: text("alert_message").notNull().default(""),
  alertUpdatedAt: varchar("alert_updated_at", { length: 40 }),
  alertHistory: jsonb("alert_history").$type<unknown[]>().notNull().default(emptyJsonArray),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Streets (string id) ──────────────────────────────────────────────────────
export const streets = pgTable("streets", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  path: jsonb("path").$type<LatLng[]>().notNull().default(emptyJsonArray),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── ECO routes (string id) ───────────────────────────────────────────────────
export const ecoRoutes = pgTable("eco_routes", {
  id: varchar("id", { length: 64 }).primaryKey(),
  streetIds: jsonb("street_ids").$type<string[]>().notNull().default(emptyJsonArray),
  createdBy: integer("created_by").notNull().default(0),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Alerts ────────────────────────────────────────────────────────────────────
export const alerts = pgTable("alerts", {
  id: integer("id").primaryKey(),
  type: varchar("type", { length: 64 }).notNull(),
  zone: varchar("zone", { length: 512 }).notNull().default(""),
  title: varchar("title", { length: 255 }).notNull().default(""),
  message: text("message").notNull().default(""),
  timestamp: varchar("timestamp", { length: 40 }).notNull(),
  closedAt: varchar("closed_at", { length: 40 }),
  sentBy: varchar("sent_by", { length: 255 }).notNull().default(""),
  priority: varchar("priority", { length: 16 }).notNull().default("High"),
  status: varchar("status", { length: 16 }).notNull().default("active"),
  isActive: boolean("is_active").notNull().default(true),
  stats: jsonb("stats").$type<{ confirmed: number; pending: number; needHelp: number; total: number }>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Incident timeline events (string id) ─────────────────────────────────────
export const incidentEvents = pgTable("incident_events", {
  id: varchar("id", { length: 80 }).primaryKey(),
  eventTimestamp: bigint("event_timestamp", { mode: "number" }).notNull(),
  type: varchar("type", { length: 48 }).notNull(),
  userId: integer("user_id"),
  userName: varchar("user_name", { length: 255 }),
  zoneId: integer("zone_id"),
  zoneName: varchar("zone_name", { length: 255 }),
  locationId: integer("location_id"),
  locationName: varchar("location_name", { length: 255 }),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Shelters ──────────────────────────────────────────────────────────────────
export const shelters = pgTable("shelters", {
  id: integer("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  zoneId: integer("zone_id").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  linkedLocationIds: jsonb("linked_location_ids").$type<number[]>().notNull().default(emptyJsonArray),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Hazard zones (warning rings + optional downwind plume) ───────────────────
// Mirrors artifacts/mobile/types/index.ts HazardZone. hot/warm/cold radii are
// metres; plume needs windDirectionDeg. Standalone warnings have alertId = null.
export const hazardZones = pgTable("hazard_zones", {
  id: integer("id").primaryKey(),
  zoneId: integer("zone_id"),
  locationId: integer("location_id"),
  centerLat: doublePrecision("center_lat").notNull(),
  centerLng: doublePrecision("center_lng").notNull(),
  hotRadius: doublePrecision("hot_radius").notNull(),
  warmRadius: doublePrecision("warm_radius").notNull(),
  coldRadius: doublePrecision("cold_radius").notNull(),
  alertId: integer("alert_id"),
  warningLevel: varchar("warning_level", { length: 8 }).notNull().default("warm"),
  isActive: boolean("is_active").notNull().default(true),
  isLocked: boolean("is_locked").notNull().default(false),
  createdBy: varchar("created_by", { length: 255 }).notNull().default(""),
  createdAt: varchar("created_at", { length: 40 }),
  windDirectionDeg: doublePrecision("wind_direction_deg"),
  windMode: varchar("wind_mode", { length: 8 }),
  hazardShape: varchar("hazard_shape", { length: 8 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── App settings (singleton row, id = 1) ─────────────────────────────────────
export const appSettings = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
