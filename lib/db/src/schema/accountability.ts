import {
  pgTable,
  serial,
  integer,
  varchar,
  timestamp,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const accountabilitySessions = pgTable("accountability_sessions", {
  id: serial("id").primaryKey(),
  zoneId: integer("zone_id").notNull(),
  locationId: integer("location_id").notNull(),
  zoneName: varchar("zone_name", { length: 255 }).notNull(),
  locationName: varchar("location_name", { length: 255 }).notNull(),
  startedBy: integer("started_by").notNull(),
  startedByName: varchar("started_by_name", { length: 255 }).notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  totalPersonnel: integer("total_personnel").notNull().default(0),
  safeCount: integer("safe_count").notNull().default(0),
  helpCount: integer("help_count").notNull().default(0),
  noResponseCount: integer("no_response_count").notNull().default(0),
  report: jsonb("report"),
});

export const personnelStatus = pgTable("personnel_status", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  userId: integer("user_id").notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  badge: varchar("badge", { length: 50 }),
  userType: varchar("user_type", { length: 50 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  escalationLevel: integer("escalation_level").notNull().default(0),
  respondedAt: timestamp("responded_at"),
  lastUpdatedAt: timestamp("last_updated_at").defaultNow().notNull(),
});
