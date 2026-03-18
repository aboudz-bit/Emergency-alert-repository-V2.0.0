import React from 'react';
import { useLocation } from 'wouter';
import {
  ShieldAlert, LogOut, Users, MapPin, AlertTriangle,
  CheckCircle2, Clock, Activity, Radio, Volume2, Bell,
} from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { AlertTypeBadge } from '@/components/shared/Badges';
import { useStore, useShallow, selectActiveAlert } from '@/store';

export default function ECODashboard() {
  const [, setLocation] = useLocation();
  const {
    currentUser, users, locations, alerts, auditLog, ecoAssignments,
    logout, activeBroadcast,
  } = useStore(useShallow(s => ({
    currentUser: s.currentUser,
    users: s.users,
    locations: s.locations,
    alerts: s.alerts,
    auditLog: s.auditLog,
    ecoAssignments: s.ecoAssignments,
    logout: s.logout,
    activeBroadcast: s.activeBroadcast,
  })));
  const activeAlert = useStore(selectActiveAlert);

  // Find this user's ECO assignment
  const ecoAssignment = ecoAssignments.find(
    a => a.assignedUserId === currentUser?.id && a.active,
  );

  if (!currentUser || !ecoAssignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Active ECO Assignment</h2>
          <p className="text-muted-foreground mb-4">Your ECO assignment is not active or has been removed.</p>
          <button onClick={() => { logout(); setLocation('/login'); }} className="px-6 py-2 bg-primary text-white rounded-lg font-medium">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const zoneName = ecoAssignment.assignedZoneName || '';
  const zoneLocations = locations.filter(l => l.zone === zoneName && l.isActive);
  const zoneUsers = users.filter(u => u.zone === zoneName && u.accountStatus === 'active');

  // Zone-level stats
  const totalManpower = zoneUsers.length;
  const safeCount = zoneUsers.filter(u => u.status === 'confirmed').length;
  const pendingCount = totalManpower - safeCount;
  const needHelpCount = zoneUsers.filter(u => u.status === 'need_help').length;

  // Per-location stats
  const locationStats = zoneLocations.map(loc => {
    const locUsers = zoneUsers.filter(u => u.location === loc.name);
    return {
      ...loc,
      total: locUsers.length,
      safe: locUsers.filter(u => u.status === 'confirmed').length,
      pending: locUsers.filter(u => u.status !== 'confirmed').length,
      needHelp: locUsers.filter(u => u.status === 'need_help').length,
    };
  });

  // Active alerts relevant to this zone
  const zoneAlerts = alerts.filter(a =>
    a.isActive && (a.zone === zoneName || a.zone === 'All Zones'),
  );

  // Recent audit entries relevant to this zone
  const zoneAudit = auditLog
    .filter(e => e.zoneName === zoneName || e.targetName.includes(zoneName))
    .slice(0, 8);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 lg:px-8 shrink-0">
        <div className="h-14 lg:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-display font-bold text-foreground text-sm lg:text-base">
                ECO {ecoAssignment.ecoSlot} — {zoneName}
              </h1>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                {currentUser.name} • CCR • Emergency Coordinator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-full bg-safe/10 text-safe text-xs font-bold border border-safe/20">
              ACTIVE
            </div>
            <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Broadcast banner */}
      {activeBroadcast && (activeBroadcast.zone === zoneName || activeBroadcast.zone === 'All Zones') && (
        <div className={cn(
          'px-4 py-2.5 flex items-center gap-3 text-white font-bold text-sm shrink-0 animate-pulse',
          activeBroadcast.priority === 'High' ? 'bg-red-600' :
          activeBroadcast.priority === 'Medium' ? 'bg-amber-600' : 'bg-blue-600',
        )}>
          <Radio className="w-4 h-4 shrink-0" />
          <span className="uppercase tracking-wider text-xs font-black">
            {activeBroadcast.priority} PRIORITY
          </span>
          <span className="mx-1">•</span>
          <span>{activeBroadcast.alertType.toUpperCase()}</span>
          <span className="mx-1">•</span>
          <span className="truncate flex-1">{activeBroadcast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-3 md:p-5 lg:p-8">
        <div className="max-w-[1400px] mx-auto space-y-6">

          {/* ECO Identity Card */}
          <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">ECO Position</p>
                <p className="font-bold text-foreground text-lg">ECO {ecoAssignment.ecoSlot}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Assigned Zone</p>
                <p className="font-bold text-foreground text-lg">{zoneName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Original Location</p>
                <p className="font-medium text-foreground">{currentUser.originalLocation || currentUser.location}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Operational Location</p>
                <p className="font-bold text-primary">CCR</p>
              </div>
            </div>
          </div>

          {/* Zone Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold uppercase">Locations</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{zoneLocations.length}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold uppercase">Total Manpower</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalManpower}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-safe" />
                <span className="text-xs text-safe font-semibold uppercase">Safe</span>
              </div>
              <p className="text-2xl font-bold text-safe">{safeCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-noreply" />
                <span className="text-xs text-noreply font-semibold uppercase">Pending</span>
              </div>
              <p className="text-2xl font-bold text-noreply">{pendingCount}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-semibold uppercase">Active Alerts</span>
              </div>
              <p className="text-2xl font-bold text-primary">{zoneAlerts.length}</p>
            </div>
          </div>

          {/* Active Alert Card */}
          {zoneAlerts.map(alert => (
            <div key={alert.id} className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 lg:p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <AlertTypeBadge type={alert.type} />
                <span className="text-xs font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">
                  {alert.priority.toUpperCase()}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
                {alert.deliveryChannels && (
                  <div className="flex items-center gap-1 ml-auto">
                    {alert.deliveryChannels.includes('app') && <Bell className="w-3.5 h-3.5 text-blue-500" />}
                    {alert.soundActive && <Volume2 className="w-3.5 h-3.5 text-orange-500 animate-pulse" />}
                    {alert.broadcastActive && <Radio className="w-3.5 h-3.5 text-amber-500" />}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-foreground text-lg">{alert.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
              {alert.triggeredByName && (
                <p className="text-xs text-muted-foreground mt-2">Triggered by {alert.triggeredByName}</p>
              )}
            </div>
          ))}

          {/* Manpower Verification — Location Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 lg:px-6 py-4 border-b border-border bg-background/30">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Location Accountability — {zoneName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Total: {totalManpower} • Safe: {safeCount} • Pending: {pendingCount}
                    {needHelpCount > 0 && <span className="text-destructive font-bold"> • Need Help: {needHelpCount}</span>}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {locationStats.map(loc => (
                    <div key={loc.id} className="px-4 lg:px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground text-sm">{loc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Manpower: {loc.total}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-center">
                          <p className="text-lg font-bold text-safe">{loc.safe}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Safe</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-noreply">{loc.pending}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">Pending</p>
                        </div>
                        {loc.needHelp > 0 && (
                          <div className="text-center">
                            <p className="text-lg font-bold text-destructive">{loc.needHelp}</p>
                            <p className="text-[10px] text-destructive uppercase font-bold">Help</p>
                          </div>
                        )}
                        {/* Alert indicator for this location */}
                        {zoneAlerts.length > 0 ? (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-destructive/10 text-destructive border border-destructive/20">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                            CLEAR
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {locationStats.length === 0 && (
                    <div className="px-6 py-8 text-center text-muted-foreground">
                      No locations found for this zone.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Audit Events */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
                <div className="px-4 lg:px-6 py-4 border-b border-border bg-background/30">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Recent Zone Activity
                  </h3>
                </div>
                <div className="flex-1 overflow-auto divide-y divide-border">
                  {zoneAudit.length > 0 ? zoneAudit.map(entry => {
                    const t = new Date(entry.timestamp);
                    return (
                      <div key={entry.id} className="px-4 py-2.5 text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-muted-foreground">
                            {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border',
                            entry.actionType.startsWith('eco_') ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            entry.actionType === 'activated' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            entry.actionType === 'deactivated' ? 'bg-gray-500/10 text-gray-400 border-gray-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20',
                          )}>
                            {entry.actionType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-foreground truncate">{entry.message}</p>
                        <p className="text-muted-foreground">by {entry.triggeredByName}</p>
                      </div>
                    );
                  }) : (
                    <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                      No recent activity for this zone.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
