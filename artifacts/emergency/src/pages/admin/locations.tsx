import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { MapPin, Plus, Edit2, X, Power } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

function AddLocationModal({ zone, onClose }: { zone: 'CPF' | 'Camp'; onClose: () => void }) {
  const addLocation = useStore(s => s.addLocation);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({ name, zone, isActive: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground">Add {zone} Location</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Location Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. Gate House"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Locations() {
  const { locations, disableLocation, users } = useStore(useShallow(s => ({
    locations: s.locations,
    disableLocation: s.disableLocation,
    users: s.users,
  })));
  const [activeTab, setActiveTab] = useState<'CPF' | 'Camp'>('CPF');
  const [showModal, setShowModal] = useState(false);

  const tabLocations = locations.filter(l => l.zone === activeTab && l.isActive);

  const getUserCount = (locationName: string) =>
    users.filter(u => u.location === locationName && u.accountStatus === 'active').length;

  return (
    <AdminLayout title="Location Management">
      {showModal && <AddLocationModal zone={activeTab} onClose={() => setShowModal(false)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-4 lg:mb-6">
        <div className="flex bg-card p-1 rounded-lg border border-border w-full sm:w-auto">
          {(['CPF', 'Camp'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 sm:flex-none px-4 lg:px-6 py-2 rounded-md text-sm font-bold transition-all',
                activeTab === tab ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab} Locations
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-background border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" /> Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
        {tabLocations.map(loc => {
          const count = getUserCount(loc.name);
          return (
            <div key={loc.id} className="bg-card border border-border rounded-xl p-4 lg:p-5 hover:border-primary/50 transition-colors group relative overflow-hidden">
              <div className="absolute right-0 top-0 w-20 h-20 lg:w-24 lg:h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none" />
              <div className="flex justify-between items-start mb-3 lg:mb-4">
                <div className="p-2 lg:p-2.5 bg-background rounded-lg border border-border text-primary group-hover:scale-110 transition-transform">
                  <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded border border-transparent hover:border-border">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Disable location "${loc.name}"?`)) disableLocation(loc.id);
                    }}
                    className="p-1.5 text-muted-foreground hover:text-destructive bg-background rounded border border-transparent hover:border-border"
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-base lg:text-lg text-foreground mb-1 truncate">{loc.name}</h3>
              <p className="text-xs text-muted-foreground">{count} {count === 1 ? 'person' : 'personnel'} assigned</p>
              <div className="flex items-center gap-2 mt-3 lg:mt-4">
                <span className={cn('w-2 h-2 rounded-full', activeTab === 'CPF' ? 'bg-primary' : 'bg-blue-500')} />
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{activeTab} Zone</span>
              </div>
            </div>
          );
        })}
      </div>

      {tabLocations.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No active locations in {activeTab}.</p>
        </div>
      )}
    </AdminLayout>
  );
}
