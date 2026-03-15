import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { MapPanel } from '@/components/shared/MapPanel';
import { Plus, Settings2, Trash2, X } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore, useShallow } from '@/store';
import type { ZoneBoundaryType } from '@/types';

function AddZoneModal({ onClose }: { onClose: () => void }) {
  const addZone = useStore(s => s.addZone);
  const [name, setName] = useState('');
  const [boundaryType, setBoundaryType] = useState<ZoneBoundaryType>('Polygon');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addZone({
      name,
      type: 'CPF',
      boundaryType,
      points: [],
      isActive: true,
      color: 'border-green-500',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Add New Zone</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Zone Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Substation A"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Boundary Type</label>
            <div className="flex gap-3">
              {(['Polygon', 'Circle'] as ZoneBoundaryType[]).map(bt => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setBoundaryType(bt)}
                  className={cn('flex-1 py-2 rounded-lg border text-sm font-semibold transition-colors',
                    boundaryType === bt ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'
                  )}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Add Zone</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Zones() {
  const { zones, disableZone, users } = useStore(useShallow(s => ({
    zones: s.zones,
    disableZone: s.disableZone,
    users: s.users,
  })));
  const [showModal, setShowModal] = useState(false);

  const getUserCount = (zoneName: string) =>
    users.filter(u => u.zone === zoneName && u.accountStatus === 'active').length;

  return (
    <AdminLayout title="Zone Configuration">
      {showModal && <AddZoneModal onClose={() => setShowModal(false)} />}

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        {/* Left Panel - Zone List */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">Defined Zones</h3>
            <button
              onClick={() => setShowModal(true)}
              className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {zones.map(z => (
              <div key={z.id} className={cn('bg-card border rounded-xl p-4 shadow-sm group', z.color, !z.isActive && 'opacity-50')}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                      {z.name}
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{z.boundaryType}</span>
                    </h4>
                    <span className={cn('text-xs flex items-center gap-1 mt-1', z.isActive ? 'text-safe' : 'text-muted-foreground')}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', z.isActive ? 'bg-safe' : 'bg-muted-foreground')} />
                      {z.isActive ? 'Active Tracking' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded">
                      <Settings2 className="w-4 h-4" />
                    </button>
                    {z.isActive && (
                      <button
                        onClick={() => {
                          if (confirm(`Disable zone "${z.name}"?`)) disableZone(z.id);
                        }}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Geofence Points</p>
                    <p className="font-mono text-foreground font-medium">{z.points.length} Nodes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Active Users</p>
                    <p className="font-mono text-foreground font-medium">{getUserCount(z.name)} Personnel</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <div className="absolute top-4 left-4 z-20 flex gap-2">
            <button className="bg-card/90 backdrop-blur border border-border px-3 py-1.5 rounded text-sm font-medium hover:bg-muted">Draw Polygon</button>
            <button className="bg-card/90 backdrop-blur border border-border px-3 py-1.5 rounded text-sm font-medium hover:bg-muted text-destructive">Clear All</button>
          </div>
          <div className="absolute bottom-4 right-4 z-20 bg-card/90 backdrop-blur border border-border rounded-lg p-3 space-y-1.5">
            {zones.filter(z => z.isActive).map(z => (
              <div key={z.id} className="flex items-center gap-2 text-xs">
                <span className={cn('w-3 h-1.5 rounded-full', z.name === 'CPF' ? 'bg-primary' : 'bg-blue-500')} />
                <span className="text-foreground font-medium">{z.name}</span>
              </div>
            ))}
          </div>
          <MapPanel />
        </div>
      </div>
    </AdminLayout>
  );
}
