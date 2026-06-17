import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";

// Read-only web client for the existing /api/accountability GET endpoints
// (api-server/src/routes/accountability.ts). Mirrors the mobile supervisor
// accountability data. The web NEVER calls the POST endpoints (start/respond/
// end/escalate) — mobile is the author. Shapes mirror the accountability tables.
export interface SessionReport {
  totalPersonnel: number;
  safe: number;
  needHelp: number;
  noResponse: number;
  safePercent: number;
}

export interface AccountabilitySession {
  id: number;
  zoneId: number;
  locationId: number;
  zoneName: string;
  locationName: string;
  startedBy: number;
  startedByName: string;
  startedAt: string;
  endedAt: string | null;
  status: string; // "active" | "completed"
  totalPersonnel: number;
  safeCount: number;
  helpCount: number;
  noResponseCount: number;
  report: SessionReport | null;
}

export interface PersonnelStatusRow {
  id: number;
  sessionId: number;
  userId: number;
  userName: string;
  badge: string | null;
  userType: string | null;
  status: string; // "pending" | "safe" | "need_help" | "no_response"
  escalationLevel: number;
  respondedAt: string | null;
  lastUpdatedAt: string;
}

export interface SessionDetail {
  session: AccountabilitySession;
  personnel: PersonnelStatusRow[];
  elapsedMs: number;
}

const LIVE_POLL = 5_000; // matches mobile pollRef (~5s)

export function useActiveSessions() {
  return useQuery({
    queryKey: ["acct", "active"],
    queryFn: () => apiGet<{ sessions: AccountabilitySession[] }>("/accountability/active").then((d) => d.sessions ?? []),
    refetchInterval: LIVE_POLL,
    retry: 1,
  });
}

export function useAccountabilityHistory() {
  return useQuery({
    queryKey: ["acct", "history"],
    queryFn: () => apiGet<{ sessions: AccountabilitySession[] }>("/accountability/history").then((d) => d.sessions ?? []),
    refetchInterval: 8_000,
    retry: 1,
  });
}

export function useSessionDetail(id: number | null) {
  return useQuery({
    queryKey: ["acct", "session", id],
    queryFn: () => apiGet<SessionDetail>(`/accountability/session/${id}`),
    enabled: id != null && id > 0,
    refetchInterval: LIVE_POLL,
    retry: 1,
  });
}

// Demo fallback — used ONLY when the backend returns no session data, so the
// Accountability Center is demonstrable offline (same silent-fallback pattern as
// the Live Map / Dashboard). Real session data always takes precedence.
const MIN = 60_000;
export function demoAccountability(now: number): {
  active: AccountabilitySession[];
  detail: SessionDetail;
  history: AccountabilitySession[];
} {
  const startedAt = new Date(now - 7 * MIN).toISOString();
  const active: AccountabilitySession = {
    id: -1, zoneId: 1, locationId: 2, zoneName: "CPF", locationName: "Gas Train-1",
    startedBy: 8, startedByName: "Supervisor", startedAt, endedAt: null, status: "active",
    totalPersonnel: 4, safeCount: 1, helpCount: 1, noResponseCount: 0, report: null,
  };
  const personnel: PersonnelStatusRow[] = [
    { id: -1, sessionId: -1, userId: 4, userName: "R. Omar", badge: "B1004", userType: "Contract", status: "need_help", escalationLevel: 3, respondedAt: new Date(now - 5 * MIN).toISOString(), lastUpdatedAt: startedAt },
    { id: -2, sessionId: -1, userId: 7, userName: "T. Noor", badge: "B1007", userType: "Aramco", status: "safe", escalationLevel: 0, respondedAt: new Date(now - 6 * MIN).toISOString(), lastUpdatedAt: startedAt },
    { id: -3, sessionId: -1, userId: 5, userName: "K. Idris", badge: "B1005", userType: "Aramco", status: "pending", escalationLevel: 1, respondedAt: null, lastUpdatedAt: startedAt },
    { id: -4, sessionId: -1, userId: 6, userName: "F. Hadi", badge: "B1006", userType: "Contract", status: "pending", escalationLevel: 0, respondedAt: null, lastUpdatedAt: startedAt },
  ];
  const history: AccountabilitySession[] = [
    {
      id: -2, zoneId: 1, locationId: 1, zoneName: "CPF", locationName: "OT-1",
      startedBy: 8, startedByName: "Supervisor", startedAt: new Date(now - 120 * MIN).toISOString(),
      endedAt: new Date(now - 110 * MIN).toISOString(), status: "completed",
      totalPersonnel: 3, safeCount: 3, helpCount: 0, noResponseCount: 0,
      report: { totalPersonnel: 3, safe: 3, needHelp: 0, noResponse: 0, safePercent: 100 },
    },
    {
      id: -3, zoneId: 2, locationId: 3, zoneName: "Camp", locationName: "Camp",
      startedBy: 8, startedByName: "Supervisor", startedAt: new Date(now - 240 * MIN).toISOString(),
      endedAt: new Date(now - 232 * MIN).toISOString(), status: "completed",
      totalPersonnel: 5, safeCount: 4, helpCount: 0, noResponseCount: 1,
      report: { totalPersonnel: 5, safe: 4, needHelp: 0, noResponse: 1, safePercent: 80 },
    },
  ];
  return { active: [active], detail: { session: active, personnel, elapsedMs: now - new Date(startedAt).getTime() }, history };
}
