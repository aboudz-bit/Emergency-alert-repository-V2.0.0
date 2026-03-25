import React from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore, useShallow } from '@/store';
import { Map, MapPin, Home, Navigation } from 'lucide-react';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import { EmergencyModeBanner } from '@/components/shared/EmergencyModeBanner';

function selectActiveAlert(s: any) {
  const fromAlerts = s.alerts?.find((a: any) => a.isActive);
  if (fromAlerts) return fromAlerts;
  const emptyStats = { confirmed: 0, missing: 0, noReply: 0, needHelp: 0, total: 0 };
  if (s.emergencyModes?.blackout) {
    return { id: -1, type: 'Blackout', isActive: true, stats: emptyStats };
  }
  if (s.emergencyModes?.shelterIn) {
    return { id: -1, type: 'Shelter-in', isActive: true, stats: emptyStats };
  }
  return s.getActiveAlert?.() ?? null;
}

export default function MobileMap() {
  const { currentUser } = useStore(useShallow(s => ({
    currentUser: s.currentUser,
  })));
  const alert = useStore(selectActiveAlert);

  return (
    <div className="min-h-screen bg-background flex flex-col pb-14">
      <EmergencyModeBanner />

      {/* Full-screen map area */}
      <div className="flex-1 relative bg-[#E8F0E8]">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Map className="w-16 h-16 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              {currentUser?.location || 'Unknown'} — {currentUser?.zone || 'Unknown'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">Shelters & hazard zones</p>
          </div>
        </div>

        {/* Floating info bar */}
        <div className="absolute top-3 left-3 right-3 bg-white/95 rounded-lg px-4 py-3 shadow-md space-y-1.5">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              {currentUser?.location || 'Unknown'} · {currentUser?.zone || 'Unknown'}
            </span>
          </div>
          {alert && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-medium text-primary">{alert.type} active</span>
            </div>
          )}
        </div>

        {/* Floating shelter info */}
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 rounded-lg px-4 py-2.5 shadow-md flex items-center gap-3">
          <Home className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-muted-foreground font-medium">Shelters available nearby</span>
          {alert && (
            <>
              <span className="w-px h-4 bg-border ml-auto" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span className="text-xs font-semibold text-primary">{alert.type}</span>
            </>
          )}
        </div>
      </div>

      <BottomTabBar role="mobile" />
    </div>
  );
}
