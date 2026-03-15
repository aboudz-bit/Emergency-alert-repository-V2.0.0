import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { cpfLocations, campLocations } from '@/lib/mock-data';
import { MapPin, Plus, Edit2 } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

export default function Locations() {
  const [activeTab, setActiveTab] = useState<'CPF' | 'Camp'>('CPF');
  const locations = activeTab === 'CPF' ? cpfLocations : campLocations;

  return (
    <AdminLayout title="Location Management">
      <div className="flex justify-between items-end mb-6">
        <div className="flex bg-card p-1 rounded-lg border border-border">
          {(['CPF', 'Camp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2 rounded-md text-sm font-bold transition-all",
                activeTab === tab 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab} Locations
            </button>
          ))}
        </div>
        <button className="bg-background border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {locations.map((loc, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute right-0 top-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 bg-background rounded-lg border border-border text-primary group-hover:scale-110 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
              <button className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded border border-transparent hover:border-border opacity-0 group-hover:opacity-100 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-bold text-lg text-foreground mb-1">{loc}</h3>
            <div className="flex items-center gap-2 mt-4">
              <span className={cn("w-2 h-2 rounded-full", activeTab === 'CPF' ? 'bg-primary' : 'bg-blue-500')} />
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{activeTab} Zone</span>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
