import React from 'react';
import { Shield, ZapOff } from 'lucide-react';
import { useStore } from '@/store';

export function EmergencyModeBanner() {
  const emergencyModes = useStore(s => s.emergencyModes);

  // Defensive: emergencyModes may be undefined during store hydration
  if (!emergencyModes) return null;
  if (!emergencyModes.shelterIn && !emergencyModes.blackout) return null;

  return (
    <div className="space-y-0">
      {emergencyModes.shelterIn && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-amber-500 text-white">
          <Shield className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">
            Shelter In Activated – Please go to shelter
          </span>
          <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
        </div>
      )}
      {emergencyModes.blackout && (
        <div className="flex items-center justify-center gap-3 py-3 px-4 bg-primary text-white">
          <ZapOff className="w-5 h-5" />
          <span className="font-bold text-sm tracking-wide">
            Blackout Activated
          </span>
          <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
        </div>
      )}
    </div>
  );
}
