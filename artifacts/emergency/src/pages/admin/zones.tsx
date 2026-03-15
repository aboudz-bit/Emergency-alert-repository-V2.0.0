import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { MapPanel } from '@/components/shared/MapPanel';
import { Plus, Settings2, Trash2 } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

export default function Zones() {
  const [zones] = useState([
    { id: 1, name: 'CPF', type: 'Main', users: 30, points: 8, active: true, color: 'border-primary' },
    { id: 2, name: 'Camp', type: 'Main', users: 20, points: 6, active: true, color: 'border-blue-500' },
  ]);

  return (
    <AdminLayout title="Zone Configuration">
      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
        
        {/* Left Panel - Zone List */}
        <div className="w-full lg:w-[380px] flex flex-col gap-4 shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-foreground">Defined Zones</h3>
            <button className="bg-primary/10 text-primary hover:bg-primary hover:text-white px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Zone
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2">
            {zones.map(z => (
              <div key={z.id} className={cn("bg-card border rounded-xl p-4 shadow-sm group", z.color)}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-foreground text-lg flex items-center gap-2">
                      {z.name}
                      <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{z.type}</span>
                    </h4>
                    <span className="text-xs text-safe flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-safe" /> Active Tracking
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded"><Settings2 className="w-4 h-4" /></button>
                    <button className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Geofence Points</p>
                    <p className="font-mono text-foreground font-medium">{z.points} Nodes</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Active Users</p>
                    <p className="font-mono text-foreground font-medium">{z.users} Personnel</p>
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
          <MapPanel />
        </div>

      </div>
    </AdminLayout>
  );
}
