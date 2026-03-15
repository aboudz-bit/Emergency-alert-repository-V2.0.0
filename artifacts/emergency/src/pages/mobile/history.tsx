import React from 'react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { useStore, useShallow } from '@/store';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, Clock, ShieldOff } from 'lucide-react';

const typeColors: Record<string, string> = {
  'Blackout': 'bg-red-500/15 text-red-400 border-red-500/20',
  'Security Alert': 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  'Shelter-in': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Drill': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Restricted Movement': 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  'All Clear': 'bg-green-500/15 text-green-400 border-green-500/20',
  'Custom': 'bg-muted/50 text-muted-foreground border-border',
};

export default function MobileHistory() {
  const { alerts, currentUser, mobileUserResponse } = useStore(useShallow(s => ({
    alerts: s.alerts,
    currentUser: s.currentUser,
    mobileUserResponse: s.mobileUserResponse,
  })));

  // Show all alerts in history; if there's a response recorded show it on the most recent active one
  const historyAlerts = alerts.filter(a => !a.isActive);
  const activeAlert = alerts.find(a => a.isActive);

  return (
    <MobileLayout>
      {/* Header */}
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-xl font-bold text-foreground">Alert History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your past emergency responses</p>
      </div>

      {/* Active alert response (if any) */}
      {activeAlert && mobileUserResponse && (
        <div className="mx-4 mb-3 bg-card rounded-xl border border-border/60 overflow-hidden">
          <div className="px-4 py-2 bg-primary/10 border-b border-border/60">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Currently Active</span>
          </div>
          <div className="px-4 py-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[activeAlert.type] || 'bg-muted text-muted-foreground border-border'}`}>
                  {activeAlert.type.toUpperCase()}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium">{activeAlert.zone}</span>
              </div>
              <p className="font-semibold text-sm text-foreground truncate">{activeAlert.title}</p>
            </div>
            <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              mobileUserResponse === 'confirmed'
                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {mobileUserResponse === 'confirmed' ? 'Confirmed' : 'Need Help'}
            </span>
          </div>
          <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{format(new Date(activeAlert.timestamp), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="px-4 pb-4 space-y-3">
        {historyAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <ShieldOff className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">No historical alerts yet.</p>
          </div>
        ) : (
          historyAlerts.map((alert, i) => {
            const userResponse = i === 0 ? 'Confirmed' : i < 4 ? 'Confirmed' : 'No Reply';
            const isConfirmed = userResponse === 'Confirmed';
            return (
              <div key={alert.id} className="bg-card rounded-xl border border-border/60 overflow-hidden">
                <div className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeColors[alert.type] || 'bg-muted text-muted-foreground border-border'}`}>
                        {alert.type.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">{alert.zone}</span>
                    </div>
                    <p className="font-semibold text-sm text-foreground truncate">{alert.title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isConfirmed ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-muted/50 text-muted-foreground border-border'
                  }`}>
                    {userResponse}
                  </span>
                </div>

                <div className="px-4 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{format(new Date(alert.timestamp), 'dd MMM yyyy, HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      {alert.stats.confirmed}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      {alert.stats.missing}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </MobileLayout>
  );
}
