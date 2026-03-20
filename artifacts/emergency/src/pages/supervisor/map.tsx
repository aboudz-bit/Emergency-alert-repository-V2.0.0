import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Map, MapPin, Shield, AlertTriangle, Clock, Phone, Navigation, Activity, LogOut } from 'lucide-react';
import { cn, AlertTypeBadge } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { EmergencyModeBanner } from '@/components/shared/EmergencyModeBanner';
import type { User } from '@/types';

function selectActiveAlert(s: any) {
  const fromAlerts = s.alerts?.find((a: any) => a.isActive);
  if (fromAlerts) return fromAlerts;
  return s.getActiveAlert?.() ?? null;
}

export default function SupervisorMap() {
  const [, setLocation] = useLocation();
  const {
    currentUser, users, locations, alerts, supervisorAssignments, logout,
  } = useStore(useShallow(s => ({
    currentUser: s.currentUser,
    users: s.users,
    locations: s.locations,
    alerts: s.alerts,
    supervisorAssignments: s.supervisorAssignments,
    logout: s.logout,
  })));

  const alert = useStore(selectActiveAlert);

  const isSupervisor = currentUser?.isSupervisorAssigned ?? false;
  const assignment = supervisorAssignments.find(a =>
    (isSupervisor && a.supervisorUserId === currentUser?.id && a.supervisorActive) ||
    (!isSupervisor && a.backupSupervisorUserId === currentUser?.id && a.backupActive),
  );

  const locName = assignment?.locationName ?? '';
  const zoneName = assignment?.zoneName ?? '';
  const loc = locations.find(l => l.id === assignment?.locationId);
  const locationUsers = users.filter(u => u.location === locName && u.zone === zoneName && u.accountStatus === 'active');

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const safeCount = locationUsers.filter(u => u.status === 'confirmed').length;
  const pendingCount = locationUsers.length - safeCount;
  const needHelpCount = locationUsers.filter(u => u.status === 'need_help').length;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14">
      <EmergencyModeBanner />
      {/* Header */}
      <header className="bg-card border-b border-border px-4 shrink-0">
        <div className="h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Map className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-bold text-foreground text-sm">Map — {locName}</h1>
              <p className="text-[10px] text-muted-foreground">{zoneName} · {currentUser?.name}</p>
            </div>
          </div>
          <button onClick={() => { logout(); setLocation('/login'); }} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Map placeholder with location info */}
      <div className="flex-1 relative bg-[#E8F0E8]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Map className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">{locName} — {zoneName}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Location boundary, shelters & hazard zones</p>
          </div>
        </div>

        {/* Floating info bar */}
        <div className="absolute top-3 left-3 right-3 bg-white/95 rounded-lg px-4 py-3 shadow-md space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm text-foreground">{locName}</span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{zoneName}</span>
          </div>
          {alert && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">{alert.type} · {locationUsers.length} personnel</span>
            </div>
          )}
        </div>

        {/* Floating stats */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-lg px-4 py-2.5 shadow-md flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-safe" />
            <span className="text-xs text-muted-foreground">Safe: {safeCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-muted-foreground">Pending: {pendingCount}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Help: {needHelpCount}</span>
          </div>
          <span className="text-xs text-muted-foreground/60 ml-auto">{locationUsers.length} total</span>
        </div>
      </div>

      <BottomTabBar role="supervisor" />
    </div>
  );
}
