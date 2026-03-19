import React from 'react';
import { useLocation } from 'wouter';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { MapPin, Navigation, CheckCircle2, Crosshair, Bell, Smartphone, LogOut, CreditCard, User as UserIcon } from 'lucide-react';
import { useStore, useShallow } from '@/store';

export default function MobileProfile() {
  const [, navigate] = useLocation();
  const { currentUser, logout } = useStore(useShallow(s => ({ currentUser: s.currentUser, logout: s.logout })));

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const initials = currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <MobileLayout>
      {/* Header — matches mobile Header component */}
      <div className="bg-[#5B3A8E] px-[18px] pt-[14px] pb-[18px]">
        <h1 className="text-[20px] font-bold text-white">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-[18px] space-y-[18px]">
        {/* Profile Card — centered avatar + name + chips */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl py-8 px-[18px]">
          <div className="flex flex-col items-center gap-[14px]">
            <div className="w-[72px] h-[72px] rounded-full bg-[rgba(91,58,142,0.08)] border-2 border-[rgba(91,58,142,0.16)] flex items-center justify-center mb-2">
              <span className="text-[24px] font-bold text-[#5B3A8E]">{initials}</span>
            </div>
            <p className="text-[24px] font-bold text-[#111111]">{currentUser.name}</p>
            <div className="flex gap-2">
              <div className="flex items-center gap-1 bg-[#F0F1F4] px-2 py-1 rounded-md border border-[#E5E7EB]">
                <CreditCard className="w-3 h-3 text-[#6B7280]" />
                <span className="text-[13px] font-medium text-[#6B7280]">{currentUser.badge}</span>
              </div>
              <div className="flex items-center gap-1 bg-[rgba(91,58,142,0.08)] px-2 py-1 rounded-md border border-[rgba(91,58,142,0.16)]">
                <UserIcon className="w-3 h-3 text-[#5B3A8E]" />
                <span className="text-[13px] font-medium text-[#5B3A8E]">{currentUser.role}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-[18px] space-y-[18px]">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.8px]">Information</p>

          {/* Zone */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">Zone</p>
              <p className="text-[15px] font-semibold text-[#111111] mt-0.5">{currentUser.zone || 'Unknown'}</p>
            </div>
          </div>
          <div className="h-px bg-[#E5E7EB] ml-[52px]" />

          {/* Location */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">Location</p>
              <p className="text-[15px] font-semibold text-[#111111] mt-0.5">{currentUser.location || 'Unknown'}</p>
            </div>
          </div>
          <div className="h-px bg-[#E5E7EB] ml-[52px]" />

          {/* Account Status */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">Account Status</p>
              <div className="mt-1">
                <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-[rgba(22,163,74,0.08)] text-[#16A34A] border border-[rgba(22,163,74,0.16)]">
                  {currentUser.accountStatus === 'active' ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-[18px] space-y-[18px]">
          <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-[0.8px]">System</p>

          {/* GPS Status */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <Crosshair className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">GPS Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="text-[15px] font-semibold text-[#16A34A]">Active</span>
              </div>
            </div>
          </div>
          <div className="h-px bg-[#E5E7EB] ml-[52px]" />

          {/* Notification Status */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">Notification Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                <span className="text-[15px] font-semibold text-[#16A34A]">Enabled</span>
              </div>
            </div>
          </div>
          <div className="h-px bg-[#E5E7EB] ml-[52px]" />

          {/* App Version */}
          <div className="flex items-center gap-[14px] py-[14px]">
            <div className="w-9 h-9 rounded-full bg-[#F0F1F4] flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-[#6B7280]" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] text-[#6B7280]">App Version</p>
              <p className="text-[15px] font-semibold text-[#111111] mt-0.5">2.0.0-web</p>
            </div>
          </div>
        </div>

        {/* Logout Button — destructive style matching mobile */}
        <button
          onClick={handleLogout}
          className="w-full py-4 bg-[#DC2626] rounded-xl text-white font-bold text-[15px] flex items-center justify-center gap-2 active:opacity-85 transition-opacity mt-[14px]"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>

        <div className="h-10" />
      </div>
    </MobileLayout>
  );
}
