import React from 'react';
import { useLocation } from 'wouter';
import {
  LogOut, Users, MapPin, AlertTriangle, CheckCircle2, Clock,
  Activity, Radio, Volume2, Bell, Eye, Shield,
} from 'lucide-react';
import { cn, AlertTypeBadge } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';

export default function SupervisorDashboard() {
  const [, setLocation] = useLocation();
  const {
    currentUser, users, locations, alerts, auditLog, supervisorAssignments,
    logout, activeBroadcast,
  } = useStore(useShallow(s => ({
    currentUser: s.currentUser,
    users: s.users,
    locations: s.locations,
    alerts: s.alerts,
    auditLog: s.auditLog,
    supervisorAssignments: s.supervisorAssignments,
    logout: s.logout,
    activeBroadcast: s.activeBroadcast,
  })));

  // Determine role: Supervisor or Backup Supervisor
  const isSupervisor = currentUser?.isSupervisorAssigned ?? false;
  const isBackup = currentUser?.isBackupSupervisorAssigned ?? false;
  const roleLabel = isSupervisor ? 'Supervisor' : 'Backup Supervisor';
  const statusLabel = isSupervisor ? 'Active' : 'Standby';

  // Find assignment for this user
  const assignment = supervisorAssignments.find(a =>
    (isSupervisor && a.supervisorUserId === currentUser?.id && a.supervisorActive) ||
    (isBackup && a.backupSupervisorUserId === currentUser?.id && a.backupActive),
  );

  if (!currentUser || !assignment) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <Eye className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No Active Supervisor Assignment</h2>
          <p className="text-muted-foreground mb-4">Your supervisor assignment is not active or has been removed.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => setLocation('/mobile/home')} className="px-6 py-2 bg-primary text-white rounded-lg font-medium">Go to Home</button>
            <button onClick={() => { logout(); setLocation('/login'); }} className="px-6 py-2 bg-card border border-border text-foreground rounded-lg font-medium hover:bg-muted transition-colors">Logout</button>
          </div>
        </div>
      </div>
    );
  }

  const locName = assignment.locationName;
  const zoneName = assignment.zoneName;
  const loc = locations.find(l => l.id === assignment.locationId);
  const totalManpower = assignment.totalManpower || loc?.totalManpower || 0;

  // Users in this location only
  const locationUsers = users.filter(u => u.location === locName && u.zone === zoneName && u.accountStatus === 'active');
  const safeCount = locationUsers.filter(u => u.status === 'confirmed').length;
  const pendingCount = locationUsers.length - safeCount;
  const needHelpCount = locationUsers.filter(u => u.status === 'need_help').length;
  const registeredCount = locationUsers.length;

  // Alerts affecting this location (zone match or All Zones)
  const locationAlerts = alerts.filter(a =>
    a.isActive && (a.zone === zoneName || a.zone === 'All Zones'),
  );

  // Recent audit for this location
  const locationAudit = auditLog
    .filter(e => e.locationName === locName || e.targetName === locName || e.zoneName === zoneName)
    .slice(0, 8);

  const handleLogout = () => { logout(); setLocation('/login'); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 lg:px-8 shrink-0">
        <div className="h-14 lg:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-7 h-7 text-primary" />
            <div>
              <h1 className="font-display font-bold text-foreground text-sm lg:text-base">
                {roleLabel} — {locName}
              </h1>
              <p className="text-[10px] lg:text-xs text-muted-foreground">
                {currentUser.name} • {zoneName} • {locName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={cn(
              'px-2.5 py-1 rounded-full text-xs font-bold border',
              isSupervisor ? 'bg-safe/10 text-safe border-safe/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            )}>
              {statusLabel.toUpperCase()}
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
          activeBroadcast.priority === 'High' ? 'bg-red-600' : activeBroadcast.priority === 'Medium' ? 'bg-amber-600' : 'bg-blue-600',
        )}>
          <Radio className="w-4 h-4 shrink-0" />
          <span className="uppercase tracking-wider text-xs font-black">{activeBroadcast.priority} PRIORITY</span>
          <span className="mx-1">•</span>
          <span>{activeBroadcast.alertType.toUpperCase()}</span>
          <span className="mx-1">•</span>
          <span className="truncate flex-1">{activeBroadcast.message}</span>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-3 md:p-5 lg:p-8">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Assignment Identity Card */}
          <div className="bg-card border border-border rounded-xl p-4 lg:p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Role</p>
                <p className="font-bold text-foreground text-lg">{roleLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Location</p>
                <p className="font-bold text-foreground text-lg">{locName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Zone</p>
                <p className="font-medium text-foreground">{zoneName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Status</p>
                <p className={cn('font-bold', isSupervisor ? 'text-safe' : 'text-amber-500')}>{statusLabel}</p>
              </div>
            </div>
          </div>

          {/* Backup indicator for read-only mode */}
          {isBackup && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <Eye className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm text-amber-600 font-medium">
                You are viewing this location as Backup Supervisor (read-only standby mode).
              </p>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-semibold uppercase">Total Manpower</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{totalManpower}</p>
              {registeredCount !== totalManpower && (
                <p className="text-[10px] text-amber-500 font-medium mt-1">Registered: {registeredCount}</p>
              )}
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
            {needHelpCount > 0 && (
              <div className="bg-card border-2 border-destructive rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-xs text-destructive font-semibold uppercase">Need Help</span>
                </div>
                <p className="text-2xl font-bold text-destructive">{needHelpCount}</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary font-semibold uppercase">Active Alerts</span>
              </div>
              <p className="text-2xl font-bold text-primary">{locationAlerts.length}</p>
            </div>
          </div>

          {/* Active Alert Card */}
          {locationAlerts.map(alert => (
            <div key={alert.id} className="bg-destructive/10 border-2 border-destructive rounded-xl p-4 lg:p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <AlertTypeBadge type={alert.type} />
                <span className="text-xs font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">{alert.priority.toUpperCase()}</span>
                <span className="text-xs text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleTimeString()}</span>
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
            </div>
          ))}

          {/* User Accountability List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="px-4 lg:px-6 py-4 border-b border-border bg-background/30">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Personnel Accountability — {locName}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Expected: {totalManpower} • Registered: {registeredCount} • Safe: {safeCount} • Pending: {pendingCount}
                  </p>
                </div>
                <div className="divide-y divide-border">
                  {locationUsers.length > 0 ? locationUsers.map(user => {
                    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                      confirmed: { label: 'SAFE', color: 'text-safe', bg: 'bg-safe/10 border-safe/20' },
                      need_help: { label: 'NEED HELP', color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
                      missing: { label: 'MISSING', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
                      no_reply: { label: 'PENDING', color: 'text-noreply', bg: 'bg-muted border-border' },
                    };
                    const s = statusConfig[user.status] || statusConfig.no_reply;
                    return (
                      <div key={user.id} className="px-4 lg:px-6 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm">{user.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Badge: {user.badge}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold border', s.bg, s.color)}>
                            {s.label}
                          </span>
                          {user.status === 'confirmed' && user.lastActivity && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(user.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="px-6 py-8 text-center text-muted-foreground">
                      No registered users in this location.
                    </div>
                  )}
                </div>
                {/* Manpower discrepancy notice */}
                {registeredCount !== totalManpower && (
                  <div className="px-4 lg:px-6 py-3 border-t border-border bg-amber-500/5">
                    <p className="text-xs text-amber-600 font-medium">
                      Discrepancy: Expected manpower ({totalManpower}) does not match registered users ({registeredCount}).
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Location Activity */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl overflow-hidden h-full flex flex-col">
                <div className="px-4 lg:px-6 py-4 border-b border-border bg-background/30">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Recent Activity
                  </h3>
                </div>
                <div className="flex-1 overflow-auto divide-y divide-border">
                  {locationAudit.length > 0 ? locationAudit.map(entry => {
                    const t = new Date(entry.timestamp);
                    return (
                      <div key={entry.id} className="px-4 py-2.5 text-xs">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-muted-foreground">
                            {t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase border',
                            entry.actionType.includes('supervisor') ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                            entry.actionType === 'activated' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20',
                          )}>
                            {entry.actionType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-foreground truncate">{entry.message}</p>
                      </div>
                    );
                  }) : (
                    <div className="px-4 py-8 text-center text-muted-foreground text-xs">
                      No recent activity for this location.
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
