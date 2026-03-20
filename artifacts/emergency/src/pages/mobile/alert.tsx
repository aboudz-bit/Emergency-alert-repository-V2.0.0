import React from 'react';
import { useLocation, Link } from 'wouter';
import { AlertTriangle, CheckCircle2, AlertCircle, Phone, Clock, ArrowLeft, Siren, Shield, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useStore, useShallow } from '@/store';

export default function MobileAlert() {
  const [, navigate] = useLocation();
  const { alerts, mobileUserResponse, respondToAlert, hazardZones } = useStore(useShallow(s => ({
    alerts: s.alerts,
    mobileUserResponse: s.mobileUserResponse,
    respondToAlert: s.respondToAlert,
    hazardZones: s.hazardZones,
  })));

  const alert = alerts.find(a => a.isActive);

  if (!alert) {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex justify-center">
        <div className="w-full max-w-[428px] bg-[#F5F6F8] flex items-center justify-center">
          <p className="text-[#6B7280]">No active alert.</p>
        </div>
      </div>
    );
  }

  if (mobileUserResponse === 'confirmed') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex justify-center">
        <div className="w-full max-w-[428px] bg-[#F5F6F8] border-x border-[#E5E7EB] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-[rgba(22,163,74,0.08)] border-2 border-[rgba(22,163,74,0.16)] flex items-center justify-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-[#16A34A]" />
          </div>
          <h2 className="text-2xl font-bold text-[#16A34A] mb-2">Response Recorded</h2>
          <p className="text-[#6B7280] text-sm mb-2">You have confirmed your safety.</p>
          <p className="text-xs text-[#9CA3AF] mb-10">
            Recorded at {format(new Date(), 'HH:mm, dd MMM yyyy')}
          </p>
          <div className="w-full space-y-3">
            <div className="bg-white rounded-xl p-4 border border-[#E5E7EB] text-left space-y-1">
              <p className="text-xs text-[#6B7280]">Active Alert</p>
              <p className="font-semibold text-[#111111]">{alert.title}</p>
              <p className="text-xs text-[#6B7280]">{alert.zone} Zone</p>
            </div>
            <Button variant="outline" className="w-full border-[#E5E7EB] text-[#111111]" onClick={() => navigate('/mobile/home')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (mobileUserResponse === 'need_help') {
    return (
      <div className="min-h-screen bg-[#F5F6F8] flex justify-center">
        <div className="w-full max-w-[428px] bg-[#F5F6F8] border-x border-[#E5E7EB] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-28 h-28 rounded-full bg-[rgba(91,58,142,0.08)] border-2 border-[rgba(91,58,142,0.16)] flex items-center justify-center mb-6">
            <AlertCircle className="w-14 h-14 text-[#5B3A8E]" />
          </div>
          <h2 className="text-2xl font-bold text-[#5B3A8E] mb-2">Help Request Sent</h2>
          <p className="text-[#6B7280] text-sm mb-2">Emergency coordinator has been notified.</p>
          <p className="text-xs text-[#9CA3AF] mb-10">Stay where you are and wait for assistance.</p>
          <Button variant="outline" className="w-full border-[#E5E7EB] text-[#111111]" onClick={() => navigate('/mobile/home')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F6F8] flex justify-center">
      <div className="w-full max-w-[428px] bg-[#F5F6F8] border-x border-[#E5E7EB] flex flex-col overflow-hidden">
        {/* Top bar — purple header matching mobile app */}
        <div className="bg-[#5B3A8E] px-5 pt-12 pb-4 flex items-center gap-3">
          <Link href="/mobile/home" className="text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80">Active Emergency</span>
          </div>
          <div className="relative w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-white animate-pulsing-dot" />
            <span className="relative w-2 h-2 rounded-full bg-white block mx-auto mt-0.5" />
          </div>
        </div>

        {/* Hero Section — large icon + title */}
        <div className="flex flex-col items-center text-center py-8 px-6 bg-white border-b border-[#E5E7EB]">
          <div className="w-[72px] h-[72px] rounded-full bg-[#5B3A8E] flex items-center justify-center mb-4">
            <AlertTriangle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-[30px] font-bold text-[#111111] leading-tight mb-1">{alert.title}</h1>
          <p className="text-[13px] font-medium text-[#5B3A8E] uppercase tracking-wider">{alert.type}</p>
        </div>

        {/* Body */}
        <div className="flex-1 p-5 space-y-4 overflow-y-auto">
          {/* Message Card */}
          <div className="bg-white rounded-xl p-[18px] border border-[#E5E7EB]">
            <p className="text-[15px] text-[#111111] leading-[22px]">{alert.message}</p>
          </div>

          {/* Info Card — 3 columns */}
          <div className="bg-white rounded-xl p-[18px] border border-[#E5E7EB] grid grid-cols-3 gap-3">
            <div className="text-center">
              <Clock className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
              <p className="text-[11px] text-[#9CA3AF]">Issued</p>
              <p className="text-[13px] font-semibold text-[#111111]">{format(new Date(alert.timestamp), 'HH:mm')}</p>
            </div>
            <div className="text-center border-x border-[#E5E7EB]">
              <User className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
              <p className="text-[11px] text-[#9CA3AF]">Sent by</p>
              <p className="text-[13px] font-semibold text-[#111111] truncate">{alert.sentBy}</p>
            </div>
            <div className="text-center">
              <MapPin className="w-4 h-4 text-[#6B7280] mx-auto mb-1" />
              <p className="text-[11px] text-[#9CA3AF]">Zone</p>
              <p className="text-[13px] font-semibold text-[#111111]">{alert.zone}</p>
            </div>
          </div>

          {/* Stats — 3 columns with dots */}
          <div className="bg-white rounded-xl p-[18px] border border-[#E5E7EB] flex justify-around">
            <div className="flex flex-col items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mb-0.5" />
              <p className="text-[17px] font-bold text-[#111111]">{alert.stats.confirmed}</p>
              <p className="text-[11px] text-[#6B7280]">Safe</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6B7280] mb-0.5" />
              <p className="text-[17px] font-bold text-[#111111]">{alert.stats.missing}</p>
              <p className="text-[11px] text-[#6B7280]">Pending</p>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3A8E] mb-0.5" />
              <p className="text-[17px] font-bold text-[#111111]">{alert.stats.needHelp}</p>
              <p className="text-[11px] text-[#6B7280]">Need Help</p>
            </div>
          </div>

          {/* Hazard Zones */}
          {(() => {
            const activeHz = hazardZones.filter(hz => hz.isActive && hz.alertId === alert.id);
            if (activeHz.length === 0) return null;
            return (
              <div className="bg-white rounded-xl p-[18px] border border-[#E5E7EB]">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                  <span className="text-[13px] font-bold text-[#111111]">Hazard Zones ({activeHz.length})</span>
                </div>
                <div className="space-y-2">
                  {activeHz.map(hz => (
                    <div key={hz.id} className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                        <span className="text-[11px] font-semibold text-[#111111]">Hot {hz.hotRadius}m</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                        <span className="text-[11px] font-semibold text-[#111111]">Warm {hz.warmRadius}m</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#4CAF50]" />
                        <span className="text-[11px] font-semibold text-[#111111]">Cold {hz.coldRadius}m</span>
                      </span>
                      <span className="text-[10px] text-[#9CA3AF] ml-auto">{hz.isLocked ? '🔒' : '🔓'}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Response Buttons — matching mobile app (2-column) */}
          <div className="pt-2 space-y-3">
            <p className="text-[11px] text-[#9CA3AF] text-center font-semibold uppercase tracking-wider">Confirm Your Status</p>
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
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
