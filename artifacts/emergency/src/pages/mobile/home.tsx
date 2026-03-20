import React from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore, useShallow, selectActiveAlert } from '@/store';
import {
  ShieldAlert, MapPin, CheckCircle2, AlertTriangle,
  CreditCard, ChevronRight, Shield, AlertCircle,
  Home as HomeIcon, Navigation, Loader, Crosshair,
} from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { EmergencyModeBanner } from '@/components/shared/EmergencyModeBanner';

function PulsingDot() {
  return (
    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
      <span className="absolute inset-0 rounded-full bg-[#5B3A8E] animate-pulsing-dot" />
      <span className="w-2 h-2 rounded-full bg-[#5B3A8E] relative z-10" />
    </div>
  );
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'Blackout': return 'zap-off';
    case 'Shelter-in': return HomeIcon;
    case 'Security Alert': return Shield;
    case 'Restricted Movement': return 'lock';
    case 'Drill': return 'activity';
    case 'All Clear': return CheckCircle2;
    default: return AlertTriangle;
  }
}

function formatTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function MobileHome() {
  const { currentUser, respondToAlert, mobileUserResponse, zones, locations, hazardZones } = useStore(useShallow(s => ({
    currentUser: s.currentUser,
    respondToAlert: s.respondToAlert,
    mobileUserResponse: s.mobileUserResponse,
    zones: s.zones,
    locations: s.locations,
    hazardZones: s.hazardZones,
  })));
  const activeAlert = useStore(selectActiveAlert);

  if (!currentUser) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-[#5B3A8E] rounded-full border-t-transparent" />
        </div>
      </MobileLayout>
    );
  }

  const hasResponded = mobileUserResponse === 'confirmed' || mobileUserResponse === 'need_help';
  const isSafe = mobileUserResponse === 'confirmed' || currentUser.status === 'confirmed';
  const firstName = currentUser.name?.split(' ')[0] || 'User';
  const activeShelters: { id: number; name: string; isActive: boolean }[] = [];

  return (
    <MobileLayout>
      <EmergencyModeBanner />
      {/* Header Area — white surface with greeting + chips */}
      <div className="bg-white border-b border-[#E5E7EB] px-[18px] pt-[14px] pb-[18px]">
        <div className="flex flex-row items-baseline gap-2">
          <span className="text-[20px] text-[#6B7280]">Hello,</span>
          <span className="text-[24px] font-bold text-[#111111]">{firstName}</span>
        </div>
        <div className="flex flex-row gap-2 mt-2">
          <div className="flex items-center gap-1 bg-[#F0F1F4] px-2.5 py-1.5 rounded-md border border-[#E5E7EB]">
            <CreditCard className="w-3 h-3 text-[#6B7280]" />
            <span className="text-[13px] font-medium text-[#6B7280]">{currentUser.badge}</span>
          </div>
          <div className="flex items-center gap-1 bg-[rgba(91,58,142,0.08)] px-2.5 py-1.5 rounded-md border border-[rgba(91,58,142,0.16)]">
            <MapPin className="w-3 h-3 text-[#5B3A8E]" />
            <span className="text-[13px] font-medium text-[#5B3A8E]">{currentUser.zone}</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-[18px] space-y-[14px]">
        {activeAlert ? (
          <>
            {/* Alert Card — purple dim bg matching mobile */}
            <div className="bg-[rgba(91,58,142,0.08)] border border-[rgba(91,58,142,0.16)] rounded-xl p-[18px] space-y-[14px]">
              <div className="flex items-center gap-2">
                <PulsingDot />
                <span className="text-[11px] font-bold text-[#5B3A8E] tracking-[1.2px]">ACTIVE EMERGENCY</span>
              </div>
              <div className="flex items-center gap-[14px]">
                <div className="w-12 h-12 rounded-[10px] bg-[#5B3A8E] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-[22px] h-[22px] text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[17px] font-bold text-[#111111] truncate">{activeAlert.title}</p>
                  <p className="text-[13px] font-medium text-[#5B3A8E]">{activeAlert.type}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#6B7280] shrink-0" />
              </div>
              <p className="text-[15px] text-[#6B7280] leading-[22px] line-clamp-2">{activeAlert.message}</p>
              <p className="text-[11px] text-[#9CA3AF]">{formatTimeAgo(activeAlert.timestamp)}</p>
            </div>

            {/* Response buttons or confirmation */}
            {hasResponded ? (
              <div className={cn(
                'rounded-xl p-[18px] border',
                isSafe ? 'border-[rgba(22,163,74,0.16)]' : 'border-[rgba(91,58,142,0.16)]'
              )}>
                <div className="flex items-center gap-[14px]">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                    isSafe ? 'bg-[rgba(22,163,74,0.08)]' : 'bg-[rgba(91,58,142,0.08)]'
                  )}>
                    {isSafe
                      ? <CheckCircle2 className="w-7 h-7 text-[#16A34A]" />
                      : <AlertCircle className="w-7 h-7 text-[#5B3A8E]" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[17px] font-semibold text-[#111111]">
                      {isSafe ? 'Response Confirmed' : 'Help Requested'}
                    </p>
                    <p className="text-[13px] text-[#6B7280]">
                      {isSafe ? 'You have been marked as safe' : 'Help is on the way'}
                    </p>
                  </div>
                  <span className={cn(
                    'text-[11px] font-bold px-2 py-1 rounded-full border',
                    isSafe
                      ? 'bg-[rgba(22,163,74,0.08)] text-[#16A34A] border-[rgba(22,163,74,0.16)]'
                      : 'bg-[rgba(91,58,142,0.08)] text-[#5B3A8E] border-[rgba(91,58,142,0.16)]'
                  )}>
                    {isSafe ? 'Confirmed' : 'Need Help'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex gap-[14px]">
                <button
                  onClick={() => respondToAlert('confirmed')}
                  className="flex-1 flex flex-col items-center justify-center py-6 bg-[#16A34A] rounded-xl gap-2 min-h-[96px] active:opacity-85 transition-opacity"
                >
                  <Shield className="w-7 h-7 text-white" />
                  <span className="text-[15px] font-bold text-white tracking-[0.5px]">I AM SAFE</span>
                </button>
                <button
                  onClick={() => respondToAlert('need_help')}
                  className="flex-1 flex flex-col items-center justify-center py-6 bg-[#5B3A8E] rounded-xl gap-2 min-h-[96px] active:opacity-85 transition-opacity"
                >
                  <AlertCircle className="w-7 h-7 text-white" />
                  <span className="text-[15px] font-bold text-white tracking-[0.5px]">NEED HELP</span>
                </button>
              </div>
            )}
          </>
        ) : (
          /* No Active Alerts — green check with centered content */
          <div className="bg-white border border-[rgba(22,163,74,0.16)] rounded-xl py-8 flex flex-col items-center text-center space-y-[14px]">
            <div className="w-20 h-20 rounded-full bg-[rgba(22,163,74,0.08)] flex items-center justify-center mb-2">
              <CheckCircle2 className="w-11 h-11 text-[#16A34A]" />
            </div>
            <p className="text-[24px] font-bold text-[#111111]">No Active Alerts</p>
            <p className="text-[15px] text-[#6B7280] leading-[22px] px-[18px]">
              All systems operational. You will be notified immediately if an emergency alert is issued.
            </p>
          </div>
        )}

        {/* GPS Status Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-[18px] py-[14px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              <span className="text-[15px] font-medium text-[#111111]">GPS Active</span>
            </div>
            <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[rgba(22,163,74,0.08)] text-[#16A34A] border border-[rgba(22,163,74,0.16)]">Online</span>
          </div>
        </div>

        {/* Location Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl px-[18px] py-[14px]">
          <div className="flex items-center gap-[14px]">
            <MapPin className="w-4 h-4 text-[#6B7280]" />
            <div>
              <p className="text-[11px] text-[#9CA3AF]">Current Location</p>
              <p className="text-[15px] font-medium text-[#111111]">{currentUser.location || 'Unknown'} &middot; {currentUser.zone || 'Unknown'}</p>
            </div>
          </div>
        </div>

        {/* Active Hazard Zones */}
        {(() => {
          const activeHz = activeAlert
            ? hazardZones.filter(hz => hz.isActive && hz.alertId === activeAlert.id)
            : [];
          if (activeHz.length === 0) return null;
          return (
            <div className="space-y-2">
              <div className="flex items-center gap-2 py-1">
                <AlertTriangle className="w-[18px] h-[18px] text-[#EF4444]" />
                <span className="text-[17px] font-semibold text-[#111111]">Hazard Zones</span>
                <span className="ml-auto text-[13px] font-medium text-[#EF4444]">{activeHz.length} active</span>
              </div>
              {activeHz.map(hz => (
                <div key={hz.id} className="bg-white border border-[#E5E7EB] rounded-xl px-[14px] py-[12px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                      <span className="text-[12px] font-semibold text-[#111111]">Hot {hz.hotRadius}m</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                      <span className="text-[12px] font-semibold text-[#111111]">Warm {hz.warmRadius}m</span>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                      <span className="text-[12px] font-semibold text-[#111111]">Cold {hz.coldRadius}m</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">
                    By {hz.createdBy} · {hz.isLocked ? 'Locked' : 'Unlocked'}
                  </p>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Shelter Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-[18px] h-[18px] text-[#F59E0B]" />
              <span className="text-[17px] font-semibold text-[#111111]">Nearby Shelters</span>
            </div>
            <span className="text-[13px] font-medium text-[#6B7280]">{activeShelters.length} available</span>
          </div>

          {/* Zone Map placeholder — web uses Leaflet directly from zones page */}
          <div className="rounded-xl overflow-hidden border border-[#E5E7EB] h-[260px] bg-[#f1f5f9] flex items-center justify-center">
            <div className="text-center text-[#9CA3AF]">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-[13px] font-medium">Zone Map</p>
              <p className="text-[11px]">View shelters on the admin map</p>
            </div>
          </div>
        </div>

        <div className="h-8" />
      </div>
    </MobileLayout>
  );
}
