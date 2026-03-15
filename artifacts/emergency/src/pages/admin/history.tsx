import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { AlertTypeBadge, cn } from '@/components/shared/Badges';
import { FileText, RotateCcw, X, CheckCircle2, AlertTriangle, Clock, Users } from 'lucide-react';
import type { Alert, AlertType } from '@/types';

function AlertReportModal({ alert, onClose }: { alert: Alert; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Alert Report</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <AlertTypeBadge type={alert.type} />
            <span className="text-sm font-semibold text-foreground bg-muted px-2 py-1 rounded">ZONE: {alert.zone}</span>
          </div>
          <div>
            <h3 className="font-bold text-foreground text-lg mb-1">{alert.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{alert.message}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Sent By</p>
              <p className="font-semibold text-foreground">{alert.sentBy}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Priority</p>
              <p className="font-semibold text-foreground">{alert.priority}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Issued At</p>
              <p className="font-medium text-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Duration</p>
              <p className="font-medium text-foreground">
                {alert.closedAt
                  ? `${Math.round((new Date(alert.closedAt).getTime() - new Date(alert.timestamp).getTime()) / 60000)} min`
                  : 'Ongoing'}
              </p>
            </div>
          </div>
          <div className="bg-background border border-border rounded-xl p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Response Summary</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-xl font-bold text-safe">{alert.stats.confirmed}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Confirmed</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-missing">{alert.stats.missing}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Missing</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-noreply">{alert.stats.noReply}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">No Reply</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{alert.stats.total}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-safe transition-all"
                style={{ width: `${alert.stats.total > 0 ? (alert.stats.confirmed / alert.stats.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-right">
              {alert.stats.total > 0 ? Math.round((alert.stats.confirmed / alert.stats.total) * 100) : 0}% response rate
            </p>
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

const filterOptions: (AlertType | 'All')[] = ['All', 'Blackout', 'Security Alert', 'Shelter-in', 'Drill', 'Restricted Movement', 'All Clear'];

export default function HistoryPage() {
  const { alerts, createAlert, currentUser } = useStore(useShallow(s => ({
    alerts: s.alerts,
    createAlert: s.createAlert,
    currentUser: s.currentUser,
  })));
  const historyAlerts = alerts.filter(a => !a.isActive);
  const [filter, setFilter] = useState<AlertType | 'All'>('All');
  const [reportAlert, setReportAlert] = useState<Alert | null>(null);

  const filtered = filter === 'All' ? historyAlerts : historyAlerts.filter(a => a.type === filter);

  const handleReplay = (alert: Alert) => {
    if (confirm(`Replay "${alert.title}" as a new draft? This will close any active alert.`)) {
      createAlert({
        type: alert.type,
        zone: alert.zone,
        title: alert.title,
        message: alert.message,
        timestamp: new Date().toISOString(),
        sentBy: currentUser?.name || 'Admin',
        priority: alert.priority,
      });
    }
  };

  return (
    <AdminLayout title="Alert Audit History">
      {reportAlert && <AlertReportModal alert={reportAlert} onClose={() => setReportAlert(null)} />}

      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] overflow-hidden">
        <div className="p-3 lg:p-6 border-b border-border bg-background/30 flex flex-wrap gap-2 shrink-0">
          {filterOptions.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors',
                filter === f
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background border-border text-muted-foreground hover:border-foreground/50',
              )}
            >
              {f}
            </button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground self-center">{filtered.length} records</span>
        </div>

        <div className="flex-1 overflow-auto p-3 lg:p-6">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <Clock className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No history records found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(alert => (
                <div key={alert.id} className="bg-background border border-border rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-primary/30 transition-colors group">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTypeBadge type={alert.type} />
                      <span className="text-sm font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">ZONE: {alert.zone}</span>
                      <span className="text-xs text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-1">{alert.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">Sent by {alert.sentBy}</p>
                  </div>

                  <div className="flex items-center gap-8 shrink-0">
                    <div className="flex gap-4">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Confirmed</p>
                        <p className="font-display font-bold text-safe text-xl">{alert.stats.confirmed}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Missing</p>
                        <p className="font-display font-bold text-missing text-xl">{alert.stats.missing}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Total</p>
                        <p className="font-display font-bold text-foreground text-xl">{alert.stats.total}</p>
                      </div>
                    </div>

                    <div className="w-px h-12 bg-border hidden lg:block" />

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => setReportAlert(alert)}
                        className="px-4 py-2 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <FileText className="w-4 h-4" /> Report
                      </button>
                      <button
                        onClick={() => handleReplay(alert)}
                        className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" /> Replay
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
