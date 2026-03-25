import React from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { KPICard } from '@/components/shared/KPICard';
import { Users, Activity, Bell, Shield, ChevronRight, UserCheck, AlertCircle, RadioTower, History, Map, Volume2, Radio } from 'lucide-react';
import { useStore, useShallow, selectActiveAlert } from '@/store';
import { AlertTypeBadge } from '@/components/shared/Badges';
import { EmergencyModeBanner } from '@/components/shared/EmergencyModeBanner';

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { users, activityLogs, sendAllClear } = useStore(useShallow(s => ({
    users: s.users,
    activityLogs: s.activityLogs,
    sendAllClear: s.sendAllClear,
  })));
  const activeAlert = useStore(selectActiveAlert);

  const kpis = [
    { title: 'Total Personnel', value: users.length, icon: Users, trend: 'Stable', trendUp: true },
    { title: 'Inside CPF', value: users.filter(u => u.zone === 'CPF').length, icon: Shield, colorClass: 'text-red-500' },
    { title: 'Inside Camp', value: users.filter(u => u.zone === 'Camp').length, icon: Activity, colorClass: 'text-blue-500' },
    { title: 'Active Alerts', value: activeAlert ? 1 : 0, icon: Bell, colorClass: activeAlert ? 'text-primary' : 'text-muted-foreground' },
  ];

  const handleSendAllClear = () => {
    if (confirm('Send ALL CLEAR to all zones? This will close the current alert and mark all personnel as safe.')) {
      sendAllClear();
    }
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <AdminLayout title="Command Center Dashboard">
      <EmergencyModeBanner />
      {activeAlert && (
        <div className="mb-6 lg:mb-8 bg-primary/8 border-2 border-primary/30 shadow-lg shadow-primary/5 rounded-2xl p-4 lg:p-6 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-3 h-3 rounded-full bg-primary animate-pulse" />
                <AlertTypeBadge type={activeAlert.type} />
                <span className="px-2.5 py-1 rounded-md text-xs font-bold border border-border bg-card text-foreground">ZONE: {activeAlert.zone ?? 'Unknown'}</span>
                <span className="text-sm text-muted-foreground font-mono">{activeAlert.timestamp ? new Date(activeAlert.timestamp).toLocaleTimeString() : 'N/A'}</span>
                {activeAlert.deliveryChannels && (
                  <div className="flex items-center gap-1.5 ml-2">
                    {activeAlert.deliveryChannels.includes('app') && (
                      <span className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center" title="App Notification">
                        <Bell className="w-3.5 h-3.5 text-blue-500" />
                      </span>
                    )}
                    {activeAlert.soundActive && (
                      <span className="w-6 h-6 rounded bg-orange-500/10 flex items-center justify-center animate-pulse" title="Sound Active">
                        <Volume2 className="w-3.5 h-3.5 text-orange-500" />
                      </span>
                    )}
                    {activeAlert.broadcastActive && (
                      <span className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center" title="Broadcast Active">
                        <Radio className="w-3.5 h-3.5 text-amber-500" />
                      </span>
                    )}
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">{activeAlert.title}</h2>
              <p className="text-muted-foreground max-w-3xl leading-relaxed">{activeAlert.message}</p>
              {activeAlert.triggeredByName && (
                <p className="text-xs text-muted-foreground mt-1">Triggered by <span className="font-semibold text-foreground">{activeAlert.triggeredByName}</span></p>
              )}
            </div>

            <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
              <button
                onClick={() => setLocation('/admin/alert-monitor')}
                className="w-full px-6 py-3 bg-card border border-border hover:bg-secondary text-foreground font-semibold rounded-lg transition-colors flex items-center justify-between group"
              >
                View Live Monitor
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={handleSendAllClear}
                className="w-full px-6 py-3 bg-safe hover:bg-safe/90 text-white font-bold rounded-lg shadow-lg shadow-safe/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <UserCheck className="w-5 h-5" />
                Send All Clear
              </button>
            </div>
          </div>

          <div className="mt-4 lg:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 relative z-10">
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase mb-1">Confirmed Safe</span>
              <span className="text-3xl font-bold text-safe">{activeAlert.stats?.confirmed ?? 0}</span>
            </div>
            <div className="bg-missing/10 border border-missing/20 rounded-xl p-4 flex flex-col">
              <span className="text-xs text-missing font-semibold uppercase mb-1">Missing / Unresponsive</span>
              <span className="text-3xl font-bold text-missing">{activeAlert.stats?.missing ?? 0}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <span className="text-xs text-muted-foreground font-semibold uppercase mb-1">No Reply Yet</span>
              <span className="text-3xl font-bold text-noreply">{activeAlert.stats?.noReply ?? 0}</span>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-center">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-foreground font-medium">Response Rate</span>
                <span className="text-primary font-bold">
                  {(activeAlert.stats?.total ?? 0) > 0 ? Math.round(((activeAlert.stats?.confirmed ?? 0) / activeAlert.stats!.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-secondary rounded-full overflow-hidden border border-border">
                <div
                  className="h-full bg-primary transition-all duration-1000"
                  style={{ width: `${(activeAlert.stats?.total ?? 0) > 0 ? ((activeAlert.stats?.confirmed ?? 0) / activeAlert.stats!.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
        {kpis.map((kpi, i) => (
          <KPICard key={i} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Quick Actions</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
            <button onClick={() => setLocation('/admin/send-alert')} className="p-6 bg-card border border-border rounded-xl hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all text-left group">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground mb-1">Trigger New Alert</h4>
              <p className="text-sm text-muted-foreground">Broadcast emergency messages to zones.</p>
            </button>
            <button onClick={() => setLocation('/admin/alert-monitor')} className="p-6 bg-card border border-border rounded-xl hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all text-left group">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                <RadioTower className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground mb-1">Live Monitor</h4>
              <p className="text-sm text-muted-foreground">Track responses and missing personnel.</p>
            </button>
            <button onClick={() => setLocation('/admin/history')} className="p-6 bg-card border border-border rounded-xl hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all text-left group">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:scale-110 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground mb-1">Audit & History</h4>
              <p className="text-sm text-muted-foreground">View past alerts and compliance reports.</p>
            </button>
            <button onClick={() => setLocation('/admin/zones')} className="p-6 bg-card border border-border rounded-xl hover:border-green-500/50 hover:shadow-lg hover:shadow-green-500/5 transition-all text-left group">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500 mb-4 group-hover:scale-110 transition-transform">
                <Map className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-foreground mb-1">Zone Configuration</h4>
              <p className="text-sm text-muted-foreground">Manage geofences and location tracking.</p>
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Activity
            </h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {activityLogs.filter(a => a.type === 'alert' || a.type === 'action').slice(0, 6).map((act, i, arr) => (
                <div key={act.id} className="flex gap-4 relative">
                  {i !== arr.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-[-24px] w-px bg-border" />
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 bg-card z-10 ${
                    act.type === 'alert' ? 'border-primary' : act.type === 'action' ? 'border-blue-500' : 'border-muted-foreground'
                  }`} />
                  <div>
                    <p className="text-sm text-foreground">{act.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{timeAgo(act.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
