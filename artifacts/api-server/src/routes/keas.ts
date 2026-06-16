import { Router, json } from "express";
import { db } from "@workspace/db";
import {
  users,
  zones,
  locations,
  streets,
  ecoRoutes,
  alerts,
  shelters,
  personnelLocations,
  incidentEvents,
  appSettings,
} from "@workspace/db";
import {
  SyncPushSchema,
  UserDtoSchema,
  ZoneDtoSchema,
  LocationDtoSchema,
  StreetDtoSchema,
  EcoRouteDtoSchema,
  AlertDtoSchema,
  ShelterDtoSchema,
  PersonnelLocationDtoSchema,
  IncidentEventDtoSchema,
  AppSettingsDtoSchema,
} from "@workspace/keas-core/api";

const router = Router();
router.use(json({ limit: "5mb" }));

// ─── Reads (for the web command center) ────────────────────────────────────────
const LIST_TABLES: Record<string, unknown> = {
  users,
  zones,
  locations,
  streets,
  routes: ecoRoutes,
  alerts,
  shelters,
  personnel: personnelLocations,
  incidentEvents,
  settings: appSettings,
};

router.get("/list/:entity", async (req, res) => {
  const table = LIST_TABLES[req.params.entity];
  if (!table) return res.status(404).json({ error: "Unknown entity" });
  try {
    const rows = await db.select().from(table as never);
    return res.json({ records: rows });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ─── Write-through sync (additive, from mobile) ───────────────────────────────
async function upsertRecord(entity: string, raw: unknown): Promise<void> {
  const now = new Date();
  switch (entity) {
    case "users": {
      const u = UserDtoSchema.parse(raw);
      const v = {
        id: u.id, name: u.name, badge: u.badge, role: u.role, zone: u.zone,
        zoneId: u.zoneId, location: u.location, locationId: u.locationId,
        status: u.status, accountStatus: u.accountStatus, isActive: u.isActive,
        userType: u.userType ?? null, companyName: u.companyName ?? null,
        mobileNumber: u.mobileNumber ?? null, language: u.language ?? null,
        approvalStatus: u.approvalStatus ?? null, escalationLevel: u.escalationLevel,
        isEcoAssigned: u.isECOAssigned ?? false, ecoSlot: u.ecoSlot ?? null,
        ecoZoneName: u.ecoZoneName ?? null, ecoAssignmentActive: u.ecoAssignmentActive ?? false,
        isSupervisorAssigned: u.isSupervisorAssigned ?? false,
        isBackupSupervisorAssigned: u.isBackupSupervisorAssigned ?? false,
        supervisorAssignmentActive: u.supervisorAssignmentActive ?? false,
        permissions: u.permissions ?? [], lastActivity: u.lastActivity ?? null,
        updatedAt: now,
      };
      await db.insert(users).values(v).onConflictDoUpdate({ target: users.id, set: v });
      return;
    }
    case "zones": {
      const z = ZoneDtoSchema.parse(raw);
      const v = {
        id: z.id, name: z.name, type: z.type, parentZoneId: z.parentZoneId ?? null,
        locationId: z.locationId ?? null, boundaryType: z.boundaryType,
        polygonPoints: z.polygonPoints, center: z.center ?? null, radius: z.radius ?? null,
        isActive: z.isActive, isArchived: z.isArchived, sortOrder: z.sortOrder, color: z.color,
        alertActive: z.alertActive, alertType: z.alertType ?? null,
        alertPriority: z.alertPriority ?? null, alertMessage: z.alertMessage,
        alertUpdatedAt: z.alertUpdatedAt ?? null, alertHistory: z.alertHistory,
        alertTargetScope: z.alertTargetScope, alertTargetLocationIds: z.alertTargetLocationIds,
        updatedAt: now,
      };
      await db.insert(zones).values(v).onConflictDoUpdate({ target: zones.id, set: v });
      return;
    }
    case "locations": {
      const l = LocationDtoSchema.parse(raw);
      const v = {
        id: l.id, name: l.name, zone: l.zone, zoneId: l.zoneId,
        expectedManpower: l.expectedManpower, isActive: l.isActive, sortOrder: l.sortOrder,
        polygonPoints: l.polygonPoints, alertActive: l.alertActive,
        alertType: l.alertType ?? null, alertPriority: l.alertPriority ?? null,
        alertMessage: l.alertMessage, alertUpdatedAt: l.alertUpdatedAt ?? null,
        alertHistory: l.alertHistory, updatedAt: now,
      };
      await db.insert(locations).values(v).onConflictDoUpdate({ target: locations.id, set: v });
      return;
    }
    case "streets": {
      const s = StreetDtoSchema.parse(raw);
      const v = { id: s.id, name: s.name, path: s.path, createdAt: s.createdAt, updatedAt: now };
      await db.insert(streets).values(v).onConflictDoUpdate({ target: streets.id, set: v });
      return;
    }
    case "routes": {
      const r = EcoRouteDtoSchema.parse(raw);
      const v = {
        id: r.id, streetIds: r.streetIds, createdBy: r.createdBy, status: r.status,
        createdAt: r.createdAt, updatedAt: now,
      };
      await db.insert(ecoRoutes).values(v).onConflictDoUpdate({ target: ecoRoutes.id, set: v });
      return;
    }
    case "alerts": {
      const a = AlertDtoSchema.parse(raw);
      const v = {
        id: a.id, type: a.type, zone: a.zone, title: a.title, message: a.message,
        timestamp: a.timestamp, closedAt: a.closedAt ?? null, sentBy: a.sentBy,
        priority: a.priority, status: a.status, isActive: a.isActive,
        stats: a.stats ?? null, updatedAt: now,
      };
      await db.insert(alerts).values(v).onConflictDoUpdate({ target: alerts.id, set: v });
      return;
    }
    case "shelters": {
      const s = ShelterDtoSchema.parse(raw);
      const v = {
        id: s.id, name: s.name, lat: s.lat, lng: s.lng, zoneId: s.zoneId,
        isActive: s.isActive, linkedLocationIds: s.linkedLocationIds, updatedAt: now,
      };
      await db.insert(shelters).values(v).onConflictDoUpdate({ target: shelters.id, set: v });
      return;
    }
    case "personnel": {
      const p = PersonnelLocationDtoSchema.parse(raw);
      const v = {
        userId: p.userId, lat: p.lat, lng: p.lng, accuracy: p.accuracy,
        capturedAt: p.timestamp, detectedLocationId: p.detectedLocationId ?? null,
        zoneId: p.zoneId ?? null, updatedAt: now,
      };
      await db
        .insert(personnelLocations)
        .values(v)
        .onConflictDoUpdate({ target: personnelLocations.userId, set: v });
      return;
    }
    case "incidentEvents": {
      const e = IncidentEventDtoSchema.parse(raw);
      const v = {
        id: e.id, eventTimestamp: e.timestamp, type: e.type, userId: e.userId ?? null,
        userName: e.userName ?? null, zoneId: e.zoneId ?? null, zoneName: e.zoneName ?? null,
        locationId: e.locationId ?? null, locationName: e.locationName ?? null,
        metadata: e.metadata ?? null, createdAt: now,
      };
      await db.insert(incidentEvents).values(v).onConflictDoUpdate({ target: incidentEvents.id, set: v });
      return;
    }
    case "settings": {
      const data = AppSettingsDtoSchema.parse(raw);
      const v = { id: 1, data, updatedAt: now };
      await db
        .insert(appSettings)
        .values(v)
        .onConflictDoUpdate({ target: appSettings.id, set: { data, updatedAt: now } });
      return;
    }
    default:
      throw new Error(`Unknown sync entity: ${entity}`);
  }
}

router.post("/sync", async (req, res) => {
  const parsed = SyncPushSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid sync payload", detail: parsed.error.flatten() });
  }
  const { entity, records } = parsed.data;
  try {
    let upserted = 0;
    for (const raw of records) {
      await upsertRecord(entity, raw);
      upserted++;
    }
    return res.json({ entity, upserted });
  } catch (err) {
    console.error("keas/sync error:", err);
    return res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
