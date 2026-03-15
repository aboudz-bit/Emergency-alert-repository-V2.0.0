import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useAlerts } from '@/hooks/use-api';
import { AlertTypeBadge } from '@/components/shared/Badges';
import { FileText, RotateCcw } from 'lucide-react';

export default function HistoryPage() {
  const { data: alerts } = useAlerts();

  return (
    <AdminLayout title="Alert Audit History">
      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        
        <div className="p-6 border-b border-border bg-background/30 flex flex-wrap gap-2">
          {['All', 'Blackout', 'Security', 'Shelter-in', 'Drill', 'Restricted', 'All Clear'].map(filter => (
            <button key={filter} className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-colors ${filter === 'All' ? 'bg-foreground text-background border-foreground' : 'bg-background border-border text-muted-foreground hover:border-foreground/50'}`}>
              {filter}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {alerts?.map(alert => (
              <div key={alert.id} className="bg-background border border-border rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:border-primary/30 transition-colors group">
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <AlertTypeBadge type={alert.type} />
                    <span className="text-sm font-bold text-foreground bg-card px-2 py-0.5 rounded border border-border">ZONE: {alert.zone}</span>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-1">{alert.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{alert.message}</p>
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
                    <button className="px-4 py-2 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                      <FileText className="w-4 h-4" /> Report
                    </button>
                    <button className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors">
                      <RotateCcw className="w-4 h-4" /> Replay
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
