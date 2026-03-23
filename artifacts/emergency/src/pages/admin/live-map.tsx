import React from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, selectActiveAlert } from '@/store';
import { MapPanel } from '@/components/shared/MapPanel';
import { AlertTypeBadge, cn } from '@/components/shared/Badges';
import { Map, ShieldAlert } from 'lucide-react';

export default function AdminLiveMap() {
  const alert = useStore(selectActiveAlert);
  const zones = useStore(s => s.zones ?? []);
  const users = useStore(s => s.users ?? []);

  const activeZones = zones.filter(z => z.alertActive);
  const totalPersonnel = users.filter(u => u.isActive).length;

  return (
    <AdminLayout title="Live Map">
      {/* Alert context banner — only when an alert is active */}
      {alert && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse shrink-0 mt-1 sm:mt-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-foreground">{alert.title ?? 'Active Alert'}</h2>
              <AlertTypeBadge type={alert.type} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Zone: {alert.zone ?? '—'} · Triggered {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <div className="flex gap-4 text-center shrink-0">
            <div>
              <div className="text-lg font-bold text-missing">{alert.stats?.missing ?? 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Missing</div>
            </div>
            <div>
              <div className="text-lg font-bold text-destructive">{alert.stats?.needHelp ?? 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Need Help</div>
            </div>
            <div>
              <div className="text-lg font-bold text-safe">{alert.stats?.confirmed ?? 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase">Safe</div>
            </div>
          </div>
        </div>
      )}

      {/* Zone summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{totalPersonnel}</span> Active Personnel
        </div>
        <div className="px-3 py-1.5 bg-card border border-border rounded-lg text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{zones.length}</span> Zones
        </div>
        {activeZones.length > 0 && (
          <div className="px-3 py-1.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive font-semibold">
            {activeZones.length} Zone{activeZones.length > 1 ? 's' : ''} Under Alert
          </div>
        )}
      </div>

      {/* Reused MapPanel — same SVG zone + personnel dot map used globally */}
      <div className="h-[calc(100vh-340px)] min-h-[500px]">
        <MapPanel />
      </div>
    </AdminLayout>
  );
}
