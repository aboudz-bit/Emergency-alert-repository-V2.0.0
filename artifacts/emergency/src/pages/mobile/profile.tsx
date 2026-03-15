import React from 'react';
import { useLocation } from 'wouter';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { MapPin, Bell, Wifi, Info, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { store } from '@/lib/mock-data';

export default function MobileProfile() {
  const [, navigate] = useLocation();
  const user = store.users[0];

  const initials = user.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <MobileLayout>
      <div className="flex flex-col min-h-full pb-4">
        {/* Header */}
        <div className="px-5 pt-8 pb-4">
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
        </div>

        {/* Avatar Card */}
        <div className="mx-4 mb-4 bg-card rounded-2xl border border-border/60 p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="text-2xl font-black text-primary">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-lg truncate">{user.name}</p>
            <p className="text-sm text-muted-foreground font-mono">Badge: {user.badge}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                user.zone === 'CPF' ? 'bg-red-500/15 text-red-400 border border-red-500/20' : 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
              }`}>
                {user.zone}
              </span>
              <span className="text-xs text-muted-foreground">{user.location}</span>
            </div>
          </div>
        </div>

        {/* Status Rows */}
        <div className="mx-4 mb-4 bg-card rounded-2xl border border-border/60 divide-y divide-border/60 overflow-hidden">
          {[
            {
              icon: MapPin,
              label: 'GPS Status',
              value: 'Active',
              valueClass: 'text-green-400',
              dot: 'bg-green-400',
            },
            {
              icon: Bell,
              label: 'Notifications',
              value: 'Enabled',
              valueClass: 'text-green-400',
              dot: null,
            },
            {
              icon: Wifi,
              label: 'Network',
              value: 'WiFi Connected',
              valueClass: 'text-foreground',
              dot: null,
            },
            {
              icon: ShieldCheck,
              label: 'Zone',
              value: user.zone,
              valueClass: user.zone === 'CPF' ? 'text-red-400' : 'text-blue-400',
              dot: null,
            },
            {
              icon: Info,
              label: 'App Version',
              value: 'v1.0.0',
              valueClass: 'text-muted-foreground font-mono',
              dot: null,
            },
          ].map(({ icon: Icon, label, value, valueClass, dot }) => (
            <div key={label} className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                {dot && <span className={`w-2 h-2 rounded-full ${dot} animate-pulse`} />}
                <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="mx-4 mt-auto pt-4">
          <Button
            variant="outline"
            className="w-full h-12 border-primary/30 text-primary hover:bg-primary/10 font-semibold gap-2 rounded-xl"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
