// Shared KEAS API contract — zod DTO schemas + inferred types.
// One source of truth consumed by the server (request/response validation) and by
// the web + mobile-sync clients (typed payloads). Wire DTOs intentionally exclude
// secrets (User.password is never on the wire).
import { z } from "zod";

export const LatLngSchema = z.object({ lat: z.number(), lng: z.number() });

export const UserResponseStatusSchema = z.enum(["confirmed", "pending", "need_help"]);

export const UserDtoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    badge: z.string(),
    role: z.string(),
    zone: z.string().default(""),
    zoneId: z.number().default(0),
    location: z.string().default(""),
    locationId: z.number().default(0),
    status: UserResponseStatusSchema.default("pending"),
    accountStatus: z.string().default("active"),
    isActive: z.boolean().default(true),
    userType: z.string().optional(),
    companyName: z.string().optional(),
    mobileNumber: z.string().optional(),
    language: z.string().optional(),
    approvalStatus: z.string().optional(),
    escalationLevel: z.number().default(0),
    isECOAssigned: z.boolean().optional(),
    ecoSlot: z.string().optional(),
    ecoZoneName: z.string().optional(),
    ecoAssignmentActive: z.boolean().optional(),
    isSupervisorAssigned: z.boolean().optional(),
    isBackupSupervisorAssigned: z.boolean().optional(),
    supervisorAssignmentActive: z.boolean().optional(),
    permissions: z.array(z.string()).optional(),
    lastActivity: z.string().optional(),
  })
  .passthrough();
export type UserDto = z.infer<typeof UserDtoSchema>;

export const ZoneDtoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    type: z.string().default("CPF"),
    parentZoneId: z.number().nullable().optional(),
    locationId: z.number().nullable().optional(),
    boundaryType: z.string().default("Polygon"),
    polygonPoints: z.array(LatLngSchema).default([]),
    center: LatLngSchema.nullable().optional(),
    radius: z.number().optional(),
    isActive: z.boolean().default(true),
    isArchived: z.boolean().default(false),
    sortOrder: z.number().default(0),
    color: z.string().default("#5B3A8E"),
    alertActive: z.boolean().default(false),
    alertType: z.string().nullable().optional(),
    alertPriority: z.string().nullable().optional(),
    alertMessage: z.string().default(""),
    alertUpdatedAt: z.string().nullable().optional(),
    alertHistory: z.array(z.unknown()).default([]),
    alertTargetScope: z.enum(["zone", "locations"]).default("zone"),
    alertTargetLocationIds: z.array(z.number()).default([]),
  })
  .passthrough();
export type ZoneDto = z.infer<typeof ZoneDtoSchema>;

export const LocationDtoSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    zone: z.string().default(""),
    zoneId: z.number().default(0),
    expectedManpower: z.number().default(0),
    isActive: z.boolean().default(true),
    sortOrder: z.number().default(0),
    polygonPoints: z.array(LatLngSchema).default([]),
    alertActive: z.boolean().default(false),
    alertType: z.string().nullable().optional(),
    alertPriority: z.string().nullable().optional(),
    alertMessage: z.string().default(""),
    alertUpdatedAt: z.string().nullable().optional(),
    alertHistory: z.array(z.unknown()).default([]),
  })
  .passthrough();
export type LocationDto = z.infer<typeof LocationDtoSchema>;

export const StreetDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  path: z.array(LatLngSchema).default([]),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
export type StreetDto = z.infer<typeof StreetDtoSchema>;

export const EcoRouteDtoSchema = z.object({
  id: z.string(),
  streetIds: z.array(z.string()).default([]),
  createdBy: z.number().default(0),
  status: z.enum(["active", "edited"]).default("active"),
  createdAt: z.number(),
  updatedAt: z.number().optional(),
});
export type EcoRouteDto = z.infer<typeof EcoRouteDtoSchema>;

export const AlertDtoSchema = z
  .object({
    id: z.number(),
    type: z.string(),
    zone: z.string().default(""),
    title: z.string().default(""),
    message: z.string().default(""),
    timestamp: z.string(),
    closedAt: z.string().optional(),
    sentBy: z.string().default(""),
    priority: z.string().default("High"),
    status: z.string().default("active"),
    isActive: z.boolean().default(true),
    stats: z
      .object({
        confirmed: z.number(),
        pending: z.number(),
        needHelp: z.number(),
        total: z.number(),
      })
      .optional(),
  })
  .passthrough();
export type AlertDto = z.infer<typeof AlertDtoSchema>;

export const ShelterDtoSchema = z.object({
  id: z.number(),
  name: z.string(),
  lat: z.number(),
  lng: z.number(),
  zoneId: z.number().default(0),
  isActive: z.boolean().default(true),
  linkedLocationIds: z.array(z.number()).default([]),
});
export type ShelterDto = z.infer<typeof ShelterDtoSchema>;

export const PersonnelLocationDtoSchema = z.object({
  userId: z.number(),
  lat: z.number(),
  lng: z.number(),
  accuracy: z.number().default(0),
  timestamp: z.number(),
  detectedLocationId: z.number().nullable().optional(),
  zoneId: z.number().nullable().optional(),
});
export type PersonnelLocationDto = z.infer<typeof PersonnelLocationDtoSchema>;

export const IncidentEventDtoSchema = z
  .object({
    id: z.string(),
    timestamp: z.number(),
    type: z.string(),
    userId: z.number().optional(),
    userName: z.string().optional(),
    zoneId: z.number().optional(),
    zoneName: z.string().optional(),
    locationId: z.number().optional(),
    locationName: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();
export type IncidentEventDto = z.infer<typeof IncidentEventDtoSchema>;

export const AppSettingsDtoSchema = z.record(z.string(), z.unknown());
export type AppSettingsDto = z.infer<typeof AppSettingsDtoSchema>;

// ─── Sync envelope (additive mobile -> backend write-through) ───────────────────
export const SYNC_ENTITIES = [
  "users",
  "zones",
  "locations",
  "streets",
  "routes",
  "alerts",
  "shelters",
  "personnel",
  "incidentEvents",
  "settings",
] as const;
export type SyncEntity = (typeof SYNC_ENTITIES)[number];

export const SyncPushSchema = z.object({
  entity: z.enum(SYNC_ENTITIES),
  records: z.array(z.record(z.string(), z.unknown())),
});
export type SyncPush = z.infer<typeof SyncPushSchema>;

/** Zod schema per sync entity, for server-side per-record validation. */
export const ENTITY_SCHEMAS = {
  users: UserDtoSchema,
  zones: ZoneDtoSchema,
  locations: LocationDtoSchema,
  streets: StreetDtoSchema,
  routes: EcoRouteDtoSchema,
  alerts: AlertDtoSchema,
  shelters: ShelterDtoSchema,
  personnel: PersonnelLocationDtoSchema,
  incidentEvents: IncidentEventDtoSchema,
  settings: AppSettingsDtoSchema,
} as const;
