import { Router, json } from "express";
import { db } from "@workspace/db";
import { accountabilitySessions, personnelStatus } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();
router.use(json());

router.post("/start", async (req, res) => {
  try {
    const { zoneId, locationId, zoneName, locationName, startedBy, startedByName, personnel } = req.body;
    if (!zoneId || !locationId || !startedBy || !Array.isArray(personnel)) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(accountabilitySessions)
        .where(
          and(
            eq(accountabilitySessions.locationId, locationId),
            eq(accountabilitySessions.status, "active")
          )
        );
      if (existing.length > 0) {
        return { conflict: true, sessionId: existing[0].id };
      }

      const [session] = await tx
        .insert(accountabilitySessions)
        .values({
          zoneId,
          locationId,
          zoneName: zoneName || "",
          locationName: locationName || "",
          startedBy,
          startedByName: startedByName || "",
          totalPersonnel: personnel.length,
        })
        .returning();

      if (personnel.length > 0) {
        await tx.insert(personnelStatus).values(
          personnel.map((p: { userId: number; userName?: string; badge?: string; userType?: string }) => ({
            sessionId: session.id,
            userId: p.userId,
            userName: p.userName || "",
            badge: p.badge || null,
            userType: p.userType || null,
            status: "pending" as const,
            escalationLevel: 0,
          }))
        );
      }

      return { conflict: false, session };
    });

    if (result.conflict) {
      return res.status(409).json({ error: "Active session already exists for this location", sessionId: result.sessionId });
    }

    res.json({ session: result.session });
  } catch (err: any) {
    console.error("accountability/start error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/respond", async (req, res) => {
  try {
    const { sessionId, userId, status } = req.body;
    if (!sessionId || !userId || !["safe", "need_help"].includes(status)) {
      return res.status(400).json({ error: "Invalid request" });
    }

    const session = await db
      .select()
      .from(accountabilitySessions)
      .where(
        and(
          eq(accountabilitySessions.id, sessionId),
          eq(accountabilitySessions.status, "active")
        )
      );
    if (session.length === 0) {
      return res.status(404).json({ error: "No active session found" });
    }

    const [updated] = await db
      .update(personnelStatus)
      .set({
        status,
        respondedAt: new Date(),
        lastUpdatedAt: new Date(),
        escalationLevel: status === "need_help" ? 3 : 0,
      })
      .where(
        and(
          eq(personnelStatus.sessionId, sessionId),
          eq(personnelStatus.userId, userId),
          eq(personnelStatus.status, "pending")
        )
      )
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "Personnel not found or already responded" });
    }

    const counts = await db
      .select({
        safe: sql<number>`count(*) filter (where ${personnelStatus.status} = 'safe')`,
        help: sql<number>`count(*) filter (where ${personnelStatus.status} = 'need_help')`,
        noResponse: sql<number>`count(*) filter (where ${personnelStatus.status} = 'no_response')`,
      })
      .from(personnelStatus)
      .where(eq(personnelStatus.sessionId, sessionId));

    await db
      .update(accountabilitySessions)
      .set({
        safeCount: Number(counts[0].safe),
        helpCount: Number(counts[0].help),
        noResponseCount: Number(counts[0].noResponse),
      })
      .where(eq(accountabilitySessions.id, sessionId));

    res.json({ personnel: updated });
  } catch (err: any) {
    console.error("accountability/respond error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/end", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const [activeSession] = await db
      .select()
      .from(accountabilitySessions)
      .where(
        and(
          eq(accountabilitySessions.id, sessionId),
          eq(accountabilitySessions.status, "active")
        )
      );
    if (!activeSession) {
      return res.status(404).json({ error: "No active session found" });
    }

    await db
      .update(personnelStatus)
      .set({ status: "no_response", lastUpdatedAt: new Date() })
      .where(
        and(
          eq(personnelStatus.sessionId, sessionId),
          eq(personnelStatus.status, "pending")
        )
      );

    const counts = await db
      .select({
        total: sql<number>`count(*)`,
        safe: sql<number>`count(*) filter (where ${personnelStatus.status} = 'safe')`,
        help: sql<number>`count(*) filter (where ${personnelStatus.status} = 'need_help')`,
        noResponse: sql<number>`count(*) filter (where ${personnelStatus.status} = 'no_response')`,
      })
      .from(personnelStatus)
      .where(eq(personnelStatus.sessionId, sessionId));

    const report = {
      totalPersonnel: Number(counts[0].total),
      safe: Number(counts[0].safe),
      needHelp: Number(counts[0].help),
      noResponse: Number(counts[0].noResponse),
      safePercent: counts[0].total > 0 ? Math.round((Number(counts[0].safe) / Number(counts[0].total)) * 100) : 0,
    };

    const [session] = await db
      .update(accountabilitySessions)
      .set({
        status: "completed",
        endedAt: new Date(),
        safeCount: report.safe,
        helpCount: report.needHelp,
        noResponseCount: report.noResponse,
        report,
      })
      .where(eq(accountabilitySessions.id, sessionId))
      .returning();

    res.json({ session, report });
  } catch (err: any) {
    console.error("accountability/end error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/session/:id", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id, 10);
    if (isNaN(sessionId)) {
      return res.status(400).json({ error: "Invalid session ID" });
    }

    const [session] = await db
      .select()
      .from(accountabilitySessions)
      .where(eq(accountabilitySessions.id, sessionId));
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const personnel = await db
      .select()
      .from(personnelStatus)
      .where(eq(personnelStatus.sessionId, sessionId));

    const elapsed = Date.now() - new Date(session.startedAt).getTime();

    res.json({ session, personnel, elapsedMs: elapsed });
  } catch (err: any) {
    console.error("accountability/session error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/active", async (req, res) => {
  try {
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string, 10) : undefined;
    const where = locationId
      ? and(eq(accountabilitySessions.status, "active"), eq(accountabilitySessions.locationId, locationId))
      : eq(accountabilitySessions.status, "active");

    const sessions = await db.select().from(accountabilitySessions).where(where);
    res.json({ sessions });
  } catch (err: any) {
    console.error("accountability/active error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/escalate", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const now = new Date();
    const [session] = await db
      .select()
      .from(accountabilitySessions)
      .where(
        and(
          eq(accountabilitySessions.id, sessionId),
          eq(accountabilitySessions.status, "active")
        )
      );
    if (!session) {
      return res.status(404).json({ error: "No active session" });
    }

    const pending = await db
      .select()
      .from(personnelStatus)
      .where(
        and(
          eq(personnelStatus.sessionId, sessionId),
          eq(personnelStatus.status, "pending")
        )
      );

    const elapsedMs = now.getTime() - new Date(session.startedAt).getTime();
    const FIVE_MIN = 5 * 60 * 1000;
    const TEN_MIN = 10 * 60 * 1000;
    const updates: Array<{ id: number; level: number }> = [];

    for (const p of pending) {
      let newLevel = 0;
      if (elapsedMs >= TEN_MIN) newLevel = 2;
      else if (elapsedMs >= FIVE_MIN) newLevel = 1;

      if (newLevel > p.escalationLevel) {
        updates.push({ id: p.id, level: newLevel });
      }
    }

    for (const u of updates) {
      await db
        .update(personnelStatus)
        .set({ escalationLevel: u.level, lastUpdatedAt: now })
        .where(eq(personnelStatus.id, u.id));
    }

    res.json({ escalated: updates.length, pending: pending.length });
  } catch (err: any) {
    console.error("accountability/escalate error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/history", async (req, res) => {
  try {
    const locationId = req.query.locationId ? parseInt(req.query.locationId as string, 10) : undefined;
    const where = locationId
      ? eq(accountabilitySessions.locationId, locationId)
      : undefined;

    const sessions = await db
      .select()
      .from(accountabilitySessions)
      .where(where)
      .orderBy(sql`${accountabilitySessions.startedAt} DESC`)
      .limit(20);

    res.json({ sessions });
  } catch (err: any) {
    console.error("accountability/history error:", err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
