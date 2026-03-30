import type { SetState, GetState } from "../types";
import { api } from "@/lib/api";

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
  status: "active" | "completed";
  totalPersonnel: number;
  safeCount: number;
  helpCount: number;
  noResponseCount: number;
  report: any | null;
}

export interface AccountabilityPersonnel {
  id: number;
  sessionId: number;
  userId: number;
  userName: string;
  badge: string | null;
  userType: string | null;
  status: "pending" | "safe" | "need_help" | "no_response";
  escalationLevel: number;
  respondedAt: string | null;
  lastUpdatedAt: string;
}

export interface AccountabilityState {
  accountabilitySession: AccountabilitySession | null;
  accountabilityPersonnel: AccountabilityPersonnel[];
  accountabilityLoading: boolean;
  accountabilityError: string | null;
}

export interface AccountabilityActions {
  startAccountabilitySession: (locationId: number) => Promise<void>;
  respondToAccountability: (response: "safe" | "need_help") => Promise<void>;
  endAccountabilitySession: () => Promise<void>;
  refreshAccountabilitySession: () => Promise<void>;
  resumeAccountabilitySession: (locationId: number) => Promise<void>;
  clearAccountabilityState: () => void;
}

export const accountabilityInitialState: AccountabilityState = {
  accountabilitySession: null,
  accountabilityPersonnel: [],
  accountabilityLoading: false,
  accountabilityError: null,
};

export function createAccountabilitySlice(set: SetState, get: GetState): AccountabilityActions {
  return {
    startAccountabilitySession: async (locationId: number) => {
      const state = get();
      const currentUser = state.currentUser;
      if (!currentUser) return;

      const location = state.locations.find((l) => l.id === locationId);
      if (!location) return;

      const zone = state.zones.find((z) => z.id === location.zoneId);
      const personnel = state.users
        .filter((u) => u.locationId === locationId && u.isActive)
        .map((u) => ({
          userId: u.id,
          userName: u.name,
          badge: u.badge,
          userType: u.userType,
        }));

      set({ accountabilityLoading: true, accountabilityError: null });
      console.log("[AccountabilitySlice] Starting session for location", locationId, "with", personnel.length, "personnel");

      try {
        const result = await api.post<{ session: AccountabilitySession }>("/accountability/start", {
          zoneId: location.zoneId,
          locationId,
          zoneName: zone?.name || "",
          locationName: location.name,
          startedBy: currentUser.id,
          startedByName: currentUser.name,
          personnel,
        });

        const sessionResult = await api.get<{
          session: AccountabilitySession;
          personnel: AccountabilityPersonnel[];
        }>(`/accountability/session/${result.session.id}`);

        set({
          accountabilitySession: sessionResult.session,
          accountabilityPersonnel: sessionResult.personnel,
          accountabilityLoading: false,
        });

        set((s) => ({
          users: s.users.map((u) =>
            u.locationId === locationId && u.isActive
              ? { ...u, status: "pending" as const }
              : u
          ),
        }));

        get().addActivityLog({
          type: "action",
          message: `Accountability session started for ${location.name} by ${currentUser.name}.`,
          timestamp: new Date().toISOString(),
          actorName: currentUser.name,
        });
      } catch (err: any) {
        console.error("[AccountabilitySlice] Start session error:", err);
        set({
          accountabilityLoading: false,
          accountabilityError: err.message || "Failed to start session",
        });
        throw err;
      }
    },

    respondToAccountability: async (response: "safe" | "need_help") => {
      const state = get();
      const session = state.accountabilitySession;
      const currentUser = state.currentUser;
      if (!session || !currentUser) return;

      try {
        await api.post("/accountability/respond", {
          sessionId: session.id,
          userId: currentUser.id,
          status: response,
        });

        set((s) => ({
          accountabilityPersonnel: s.accountabilityPersonnel.map((p) =>
            p.userId === currentUser.id
              ? { ...p, status: response, respondedAt: new Date().toISOString(), escalationLevel: response === "need_help" ? 3 : 0 }
              : p
          ),
        }));

        const personnel = get().accountabilityPersonnel;
        const safeCount = personnel.filter((p) => p.status === "safe").length;
        const helpCount = personnel.filter((p) => p.status === "need_help").length;
        set((s) => ({
          accountabilitySession: s.accountabilitySession
            ? { ...s.accountabilitySession, safeCount, helpCount }
            : null,
        }));
      } catch (err: any) {
        set({ accountabilityError: err.message || "Failed to respond" });
      }
    },

    endAccountabilitySession: async () => {
      const state = get();
      const session = state.accountabilitySession;
      if (!session) return;

      set({ accountabilityLoading: true });

      try {
        const result = await api.post<{
          session: AccountabilitySession;
          report: any;
        }>("/accountability/end", { sessionId: session.id });

        set({
          accountabilitySession: result.session,
          accountabilityLoading: false,
        });

        get().addActivityLog({
          type: "action",
          message: `Accountability session ended for ${session.locationName}. Safe: ${result.report.safe}, Need Help: ${result.report.needHelp}, No Response: ${result.report.noResponse}.`,
          timestamp: new Date().toISOString(),
          actorName: state.currentUser?.name,
        });

        setTimeout(() => {
          set({
            accountabilitySession: null,
            accountabilityPersonnel: [],
          });
        }, 5000);
      } catch (err: any) {
        set({
          accountabilityLoading: false,
          accountabilityError: err.message || "Failed to end session",
        });
      }
    },

    refreshAccountabilitySession: async () => {
      const state = get();
      const session = state.accountabilitySession;
      if (!session || session.status !== "active") return;

      try {
        const result = await api.get<{
          session: AccountabilitySession;
          personnel: AccountabilityPersonnel[];
        }>(`/accountability/session/${session.id}`);

        set({
          accountabilitySession: result.session,
          accountabilityPersonnel: result.personnel,
        });
      } catch {}
    },

    resumeAccountabilitySession: async (locationId: number) => {
      const state = get();
      if (state.accountabilitySession?.status === "active") return;

      try {
        const result = await api.get<{ sessions: AccountabilitySession[] }>(
          `/accountability/active?locationId=${locationId}`
        );
        if (result.sessions.length > 0) {
          const session = result.sessions[0];
          const detail = await api.get<{
            session: AccountabilitySession;
            personnel: AccountabilityPersonnel[];
          }>(`/accountability/session/${session.id}`);

          set({
            accountabilitySession: detail.session,
            accountabilityPersonnel: detail.personnel,
          });
        }
      } catch {}
    },

    clearAccountabilityState: () => {
      set({
        accountabilitySession: null,
        accountabilityPersonnel: [],
        accountabilityLoading: false,
        accountabilityError: null,
      });
    },
  };
}
