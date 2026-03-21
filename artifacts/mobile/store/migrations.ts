import {
  seedZones, seedLocations, seedUsers,
  seedEcoAssignments, seedSupervisorAssignments, seedShelters,
} from '@/mock-data';
import type { AppState } from './types';

export const STORE_NAME = 'keas-mobile-store-v20';
export const STORE_VERSION = 21;

export function migrate(persisted: any, version: number): AppState {
  const state = persisted as any;

  if (version < 1) {
    // Backfill zone alert fields
    if (Array.isArray(state?.zones)) {
      state.zones = state.zones.map((z: any) => ({
        ...z,
        alertActive: z.alertActive ?? false,
        alertType: z.alertType ?? null,
        alertPriority: z.alertPriority ?? null,
        alertMessage: z.alertMessage ?? '',
        alertUpdatedAt: z.alertUpdatedAt ?? null,
        alertHistory: z.alertHistory ?? [],
      }));
    }
    if (Array.isArray(state?.locations)) {
      state.locations = state.locations.map((loc: any) => ({
        ...loc,
        alertHistory: loc.alertHistory ?? [],
      }));
    }
  }

  if (version < 2) {
    // Fix zoneId mapping: resolve from zone name → zone.id
    const zoneNameToId = new Map<string, number>();
    if (Array.isArray(state?.zones)) {
      for (const z of state.zones) {
        zoneNameToId.set(z.name, z.id);
      }
    }
    if (Array.isArray(state?.locations)) {
      state.locations = state.locations.map((loc: any) => ({
        ...loc,
        zoneId: (loc.zoneId && loc.zoneId !== 0)
          ? loc.zoneId
          : (zoneNameToId.get(loc.zone) ?? 0),
      }));
    }
  }

  if (version < 3) {
    // Backfill zoneId / locationId on users
    const zoneNameToId = new Map<string, number>();
    if (Array.isArray(state?.zones)) {
      for (const z of state.zones) zoneNameToId.set(z.name, z.id);
    }
    const locKey = (name: string, zoneId: number) => `${zoneId}:${name}`;
    const locNameToId = new Map<string, number>();
    if (Array.isArray(state?.locations)) {
      for (const l of state.locations) locNameToId.set(locKey(l.name, l.zoneId), l.id);
    }
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => {
        const zid = u.zoneId ?? zoneNameToId.get(u.zone) ?? 0;
        const lid = u.locationId ?? locNameToId.get(locKey(u.location, zid)) ?? 0;
        return { ...u, zoneId: zid, locationId: lid };
      });
    }
  }

  if (version < 4) {
    if (!state.ecoAssignments || !Array.isArray(state.ecoAssignments) || state.ecoAssignments.length === 0) {
      state.ecoAssignments = seedEcoAssignments;
    }
    if (!state.supervisorAssignments || !Array.isArray(state.supervisorAssignments) || state.supervisorAssignments.length === 0) {
      state.supervisorAssignments = seedSupervisorAssignments;
    }
  }

  if (version < 5) {
    // Flatten location hierarchy: single CPF zone with 7 locations
    state.zones = seedZones;
    state.locations = seedLocations;
    state.users = seedUsers;
    state.supervisorAssignments = seedSupervisorAssignments;
  }

  if (version < 6) {
    // Backfill expectedManpower on locations
    if (Array.isArray(state?.locations)) {
      state.locations = state.locations.map((loc: any) => ({
        ...loc,
        expectedManpower: loc.expectedManpower ?? 0,
      }));
    }
  }

  if (version < 7) {
    // Simplify status model: remove missing + no_reply, replace with pending
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => ({
        ...u,
        status: u.status === 'missing' || u.status === 'no_reply' ? 'pending' : u.status,
      }));
    }
    if (Array.isArray(state?.alerts)) {
      state.alerts = state.alerts.map((a: any) => ({
        ...a,
        stats: a.stats ? {
          confirmed: a.stats.confirmed ?? 0,
          pending: (a.stats.pending ?? 0) + (a.stats.missing ?? 0) + (a.stats.noReply ?? 0),
          needHelp: a.stats.needHelp ?? 0,
          total: a.stats.total ?? 0,
        } : a.stats,
      }));
    }
  }

  if (version < 8) {
    if (!state.shelters || !Array.isArray(state.shelters)) {
      state.shelters = seedShelters;
    }
  }

  if (version < 9) {
    if (Array.isArray(state?.users) && !state.users.find((u: any) => u.badge === '200001')) {
      state.users.push({
        id: 51, name: 'Contractor Demo', badge: '200001', password: 'demo1234',
        role: 'User', zone: 'CPF', zoneId: 1, location: 'OT-1', locationId: 1,
        status: 'confirmed', accountStatus: 'active',
        lastActivity: new Date().toISOString(), isActive: true,
        userType: 'Contract',
      });
    }
  }

  if (version < 10) {
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => ({
        ...u,
        userType: u.userType ?? (u.badge === '200001' ? 'Contract' : 'Aramco'),
        mobileNumber: u.mobileNumber ?? '',
        approvalStatus: u.approvalStatus ?? 'approved',
        approvedBy: u.approvedBy ?? null,
        approvedAt: u.approvedAt ?? null,
        rejectionReason: u.rejectionReason ?? null,
      }));
    }
  }

  if (version < 11) {
    if (Array.isArray(state?.locations)) {
      state.locations = state.locations.map((l: any) => ({
        ...l,
        polygonPoints: l.polygonPoints ?? [],
      }));
    }
    if (Array.isArray(state?.shelters)) {
      state.shelters = state.shelters.map((s: any) => ({
        ...s,
        linkedLocationIds: s.linkedLocationIds ?? [],
      }));
    }
  }

  if (version < 12) {
    if (!Array.isArray(state?.zoneNotifications)) {
      state.zoneNotifications = [];
    }
  }

  if (version < 13) {
    if (!Array.isArray(state?.hazardZones)) {
      state.hazardZones = [];
    }
    if (state?.settings) {
      if (typeof state.settings.hazardRedRadius !== 'number' || isNaN(state.settings.hazardRedRadius)) {
        state.settings.hazardRedRadius = 200;
      }
      if (typeof state.settings.hazardYellowRadius !== 'number' || isNaN(state.settings.hazardYellowRadius)) {
        state.settings.hazardYellowRadius = 500;
      }
      if (typeof state.settings.hazardGreenRadius !== 'number' || isNaN(state.settings.hazardGreenRadius)) {
        state.settings.hazardGreenRadius = 1000;
      }
    }
  }

  if (version < 14) {
    // Rename radius fields: red→hot, yellow→warm, green→cold; add isLocked + wind fields
    if (state?.settings) {
      state.settings.hazardHotRadius = state.settings.hazardRedRadius ?? state.settings.hazardHotRadius ?? 200;
      state.settings.hazardWarmRadius = state.settings.hazardYellowRadius ?? state.settings.hazardWarmRadius ?? 500;
      state.settings.hazardColdRadius = state.settings.hazardGreenRadius ?? state.settings.hazardColdRadius ?? 1000;
      delete state.settings.hazardRedRadius;
      delete state.settings.hazardYellowRadius;
      delete state.settings.hazardGreenRadius;
    }
    if (Array.isArray(state?.hazardZones)) {
      state.hazardZones = state.hazardZones.map((hz: any) => ({
        ...hz,
        hotRadius: hz.redRadius ?? hz.hotRadius ?? 200,
        warmRadius: hz.yellowRadius ?? hz.warmRadius ?? 500,
        coldRadius: hz.greenRadius ?? hz.coldRadius ?? 1000,
        isLocked: hz.isLocked ?? true,
        windDirectionDeg: hz.windDirectionDeg ?? null,
        windMode: hz.windMode ?? null,
        hazardShape: hz.hazardShape ?? 'circle',
      }));
    }
  }

  if (version < 15) {
    // Backfill locationId on existing zones
    if (Array.isArray(state?.zones)) {
      state.zones = state.zones.map((z: any) => ({
        ...z,
        locationId: z.locationId ?? null,
      }));
    }
  }

  if (version < 16) {
    // canChangeWindDirection added — no data migration needed
  }

  if (version < 17) {
    // emergencyModes was not persisted before — seed a safe default
    if (!state.emergencyModes) {
      state.emergencyModes = {
        shelterIn: false,
        blackout: false,
        shelterInActivatedAt: null,
        shelterInActivatedBy: null,
        blackoutActivatedAt: null,
        blackoutActivatedBy: null,
      };
    }
  }

  if (version < 18) {
    // permissionAssignments was not persisted before — seed empty array
    if (!Array.isArray(state.permissionAssignments)) {
      state.permissionAssignments = [];
    }
  }

  if (version < 19) {
    // Force-fix contractor userType on persisted data:
    // Badge 200001 must have userType 'Contract' in both users array and currentUser
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => ({
        ...u,
        userType: u.userType ?? (u.badge === '200001' ? 'Contract' : 'Aramco'),
      }));
    }
    if (state?.currentUser && state.currentUser.badge === '200001') {
      state.currentUser = {
        ...state.currentUser,
        userType: 'Contract',
      };
    }
  }

  if (version < 20) {
    if (Array.isArray(state?.zones)) {
      state.zones = state.zones.map((z: any) => ({
        ...z,
        alertActive: false,
        alertType: null,
        alertPriority: null,
        alertMessage: '',
        alertUpdatedAt: null,
      }));
    }
    if (Array.isArray(state?.locations)) {
      state.locations = state.locations.map((l: any) => ({
        ...l,
        alertActive: false,
      }));
    }
    if (Array.isArray(state?.alerts)) {
      state.alerts = state.alerts.map((a: any) => ({
        ...a,
        isActive: false,
        status: a.isActive ? 'closed' : (a.status ?? 'closed'),
      }));
    }
    state.emergencyModes = {
      shelterIn: false,
      blackout: false,
      shelterInActivatedAt: null,
      shelterInActivatedBy: null,
      blackoutActivatedAt: null,
      blackoutActivatedBy: null,
    };
    state.hazardZones = [];
    state.personnelLocations = {};
    state.mobileUserResponse = null;
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => ({
        ...u,
        status: 'confirmed',
      }));
    }
  }

  if (version < 21) {
    if (Array.isArray(state?.users)) {
      state.users = state.users.map((u: any) => ({
        ...u,
        companyType: u.companyType ?? (u.userType === 'Contract' ? 'Contractor' : 'Aramco'),
        companyName: u.companyName ?? (u.userType === 'Contract' ? 'Not provided' : 'Saudi Aramco'),
      }));
    }
    if (state?.currentUser) {
      state.currentUser = {
        ...state.currentUser,
        companyType: state.currentUser.companyType ?? (state.currentUser.userType === 'Contract' ? 'Contractor' : 'Aramco'),
        companyName: state.currentUser.companyName ?? (state.currentUser.userType === 'Contract' ? 'Not provided' : 'Saudi Aramco'),
      };
    }
  }

  return persisted as AppState;
}

export function partialize(state: AppState) {
  return {
    isAuthenticated: state.isAuthenticated,
    currentUser: state.currentUser,
    mobileUserResponse: state.mobileUserResponse,
    users: state.users,
    alerts: state.alerts,
    zones: state.zones,
    locations: state.locations,
    settings: state.settings,
    activityLogs: state.activityLogs,
    ecoAssignments: state.ecoAssignments,
    supervisorAssignments: state.supervisorAssignments,
    shelters: state.shelters,
    hazardZones: state.hazardZones,
    zoneNotifications: state.zoneNotifications,
    windDirection: state.windDirection,
    windSetBy: state.windSetBy,
    windSetAt: state.windSetAt,
    emergencyModes: state.emergencyModes,
    permissionAssignments: state.permissionAssignments,
  };
}
