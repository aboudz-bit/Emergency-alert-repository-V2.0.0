import React, { useState } from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore, useShallow } from '@/store';
import { StatusBadge, AlertTypeBadge, cn } from '@/components/shared/Badges';
import { ShieldAlert, Clock, MapPin, Search, ChevronRight, Map, AlertTriangle } from 'lucide-react';
import { BottomTabBar } from '@/components/shared/BottomTabBar';
import type { User, UserResponseStatus } from '@/types';

function selectActiveAlert(s: any) {
  const fromAlerts = s.alerts?.find((a: any) => a.isActive);
  if (fromAlerts) return fromAlerts;
  // Check for zone-level alerts
  const activeZones = s.zones?.filter((z: any) => z.alertActive) ?? [];
  if (activeZones.length > 0) {
    const first = activeZones[0];
    return {
      id: -1,
      type: first.alertType || 'Zone Alert',
      zone: activeZones.map((z: any) => z.name).join(', '),
      title: `${activeZones.length} Zone Alert${activeZones.length > 1 ? 's' : ''}`,
      message: first.alertMessage || '',
      timestamp: first.alertUpdatedAt || new Date().toISOString(),
      sentBy: 'System',
      priority: first.alertPriority || 'High',
      status: 'active',
      isActive: true,
      stats: { confirmed: 0, missing: 0, noReply: 0, needHelp: 0, total: 0 },
    };
  }
  // Check for emergency modes
  if (s.emergencyModes?.blackout) {
    return {
      id: -1, type: 'Blackout', zone: 'All Zones', title: 'Blackout Active',
      message: 'Blackout mode is active.', timestamp: s.emergencyModes.blackoutActivatedAt || new Date().toISOString(),
      sentBy: 'System', priority: 'High', status: 'active', isActive: true,
      stats: { confirmed: 0, missing: 0, noReply: 0, needHelp: 0, total: 0 },
    };
  }
  if (s.emergencyModes?.shelterIn) {
    return {
      id: -1, type: 'Shelter-in', zone: 'All Zones', title: 'Shelter In Place Active',
      message: 'Shelter-in-place mode is active.', timestamp: s.emergencyModes.shelterInActivatedAt || new Date().toISOString(),
      sentBy: 'System', priority: 'High', status: 'active', isActive: true,
      stats: { confirmed: 0, missing: 0, noReply: 0, needHelp: 0, total: 0 },
    };
  }
  return null;
}

export default function ECOLiveMap() {
  const alert = useStore(selectActiveAlert);
  const users = useStore(s => s.users);
  const zones = useStore(s => s.zones);
  const locations = useStore(s => s.locations);

  const [activeTab, setActiveTab] = useState<UserResponseStatus>('missing');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!alert) {
    return (
      <MobileLayout>
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-[#5B3A8E] px-5 pt-3 pb-4">
            <div className="flex items-center gap-3">
              <Map className="w-5 h-5 text-white/80" />
              <h1 className="text-[20px] font-bold text-white">Live Map</h1>
            </div>
            <p className="text-[13px] text-white/60 mt-1">Global alert monitoring view</p>
          </div>

          <div className="flex-1 bg-[#F0F1F4]" />
          <BottomTabBar role="eco" />
        </div>
      </MobileLayout>
    );
  }

  const stats = alert.stats || { confirmed: 0, missing: 0, noReply: 0, needHelp: 0, total: 0 };

  const tabs = [
    { id: 'missing' as UserResponseStatus, label: 'Missing', count: stats.missing, color: '#EF4444', bg: 'bg-[#EF4444]' },
    { id: 'need_help' as UserResponseStatus, label: 'Help', count: stats.needHelp, color: '#5B3A8E', bg: 'bg-[#5B3A8E]' },
    { id: 'confirmed' as UserResponseStatus, label: 'Safe', count: stats.confirmed, color: '#4CAF50', bg: 'bg-[#4CAF50]' },
  ];

  const filteredUsers = users.filter(u =>
    u.status === activeTab &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.badge.includes(search)),
  );

  return (
    <MobileLayout>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Purple header */}
        <div className="bg-[#5B3A8E] px-5 pt-3 pb-4">
          <div className="flex items-center gap-3">
            <Map className="w-5 h-5 text-white/80" />
            <h1 className="text-[20px] font-bold text-white">Live Map</h1>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
              <span className="text-[11px] text-white/60">LIVE</span>
            </div>
          </div>
        </div>

        {/* Alert info card */}
        <div className="mx-4 mt-4 bg-[#5B3A8E]/8 border border-[#5B3A8E]/15 rounded-[12px] p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#5B3A8E]/15 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#5B3A8E]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-[#5B3A8E]">{alert.type}</p>
              <p className="text-[11px] text-[#6B7280]">
                {alert.zone} · {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <span className="px-2 py-1 rounded-full bg-[#4CAF50]/10 text-[#4CAF50] text-[11px] font-medium">Active</span>
          </div>
        </div>

        {/* Stats tabs */}
        <div className="flex gap-2 mx-4 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 py-3 rounded-[10px] text-center transition-all border-b-[3px]',
                activeTab === tab.id
                  ? 'bg-white shadow-sm'
                  : 'bg-[#F0F1F4] opacity-70',
              )}
              style={{
                borderBottomColor: activeTab === tab.id ? tab.color : 'transparent',
              }}
            >
              <div className="text-[24px] font-bold" style={{ color: activeTab === tab.id ? tab.color : '#9CA3AF' }}>
                {tab.count}
              </div>
              <div className="text-[11px] font-medium" style={{ color: activeTab === tab.id ? tab.color : '#9CA3AF' }}>
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mx-4 mt-4 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="text"
            placeholder="Search by name or badge..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E5E7EB] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-[#1A1A2E] focus:outline-none focus:border-[#5B3A8E]/30"
          />
        </div>

        {/* Personnel list */}
        <div className="flex-1 overflow-auto mt-3 px-4 pb-4">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-[13px] text-[#9CA3AF]">
              No personnel found in this category.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className="w-full text-left bg-white border border-[#E5E7EB] rounded-[10px] p-3 hover:border-[#5B3A8E]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#5B3A8E]/10 text-[#5B3A8E] flex items-center justify-center font-bold text-[11px] shrink-0">
                      {u.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-[13px] text-[#1A1A2E] truncate">{u.name}</p>
                      <p className="text-[11px] text-[#6B7280] font-mono">{u.badge}</p>
                    </div>
                    <StatusBadge status={u.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] mt-2">
                    <span className="flex items-center gap-1">
                      <span className={cn('w-1.5 h-1.5 rounded-full', u.zone === 'CPF' ? 'bg-[#5B3A8E]' : 'bg-blue-500')} />
                      {u.zone} / {u.location}
                    </span>
                    <span>{new Date(u.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Personnel Detail Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedUser(null)} />
            <div className="relative w-full bg-white rounded-t-[16px] shadow-2xl p-5 pb-8 max-h-[70vh] overflow-auto">
              <div className="flex items-center gap-3 mb-4">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-[15px]',
                  selectedUser.status === 'confirmed' ? 'bg-[#E8F5E9] text-[#4CAF50]'
                    : selectedUser.status === 'need_help' ? 'bg-[#5B3A8E]/10 text-[#5B3A8E]'
                    : 'bg-[#F0F1F4] text-[#6B7280]'
                )}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[17px] font-bold text-[#1A1A2E] truncate">{selectedUser.name}</h3>
                  <p className="text-[13px] text-[#6B7280] font-mono">{selectedUser.badge}</p>
                </div>
                <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-full bg-[#F0F1F4] flex items-center justify-center">
                  <span className="text-[#6B7280] text-sm">✕</span>
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { icon: '🛡️', label: 'Role', value: selectedUser.role },
                  { icon: '🆔', label: 'Badge', value: selectedUser.badge },
                  { icon: '📍', label: 'Zone', value: selectedUser.zone },
                  { icon: '🏢', label: 'Location', value: selectedUser.location },
                  { icon: '🏷️', label: 'Employment', value: selectedUser.employmentType === 'Aramco' ? 'Aramco' : selectedUser.employmentType === 'Contract' ? 'Contract' : '—' },
                  { icon: '⏰', label: 'Last Activity', value: new Date(selectedUser.lastActivity).toLocaleTimeString() },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 py-2 border-b border-[#F0F1F4] last:border-0">
                    <span className="text-[15px]">{row.icon}</span>
                    <span className="text-[13px] text-[#6B7280] w-20">{row.label}</span>
                    <span className="text-[13px] text-[#1A1A2E] font-medium flex-1">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center gap-3 py-2 border-b border-[#F0F1F4]">
                  <span className="text-[15px]">📊</span>
                  <span className="text-[13px] text-[#6B7280] w-20">Status</span>
                  <StatusBadge status={selectedUser.status} />
                </div>
                {selectedUser.alertResponseStatus && (
                  <div className="flex items-center gap-3 py-2">
                    <span className="text-[15px]">🚨</span>
                    <span className="text-[13px] text-[#6B7280] w-20">Alert</span>
                    <span className={cn(
                      'text-[12px] font-semibold px-2 py-0.5 rounded-full',
                      selectedUser.alertResponseStatus === 'safe'
                        ? 'bg-[#E8F5E9] text-[#4CAF50]'
                        : 'bg-red-100 text-red-600'
                    )}>
                      {selectedUser.alertResponseStatus === 'safe' ? 'Safe' : 'Need Help'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <BottomTabBar role="eco" />
      </div>
    </MobileLayout>
  );
}
