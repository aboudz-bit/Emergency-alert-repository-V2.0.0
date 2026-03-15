import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { MapPin, Plus, Pencil, Trash2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import type { Location } from '@/types';

function Toast({ message, onDone, variant = 'success' }: { message: string; onDone: () => void; variant?: 'success' | 'error' }) {
  React.useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, []);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] toast-animate">
      <div className={cn(
        'flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl font-semibold text-sm text-white',
        variant === 'success' ? 'bg-emerald-600' : 'bg-red-600',
      )}>
        {variant === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
        {message}
      </div>
    </div>
  );
}

function AddLocationModal({ zone, zoneNames, onClose, onAdded }: { zone: string; zoneNames: string[]; onClose: () => void; onAdded: (name: string) => void }) {
  const addLocation = useStore(s => s.addLocation);
  const [name, setName] = useState('');
  const [selectedZone, setSelectedZone] = useState(zone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLocation({ name, zone: selectedZone, isActive: true });
    onAdded(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Location
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Location Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Control Room, Gate House"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Parent Zone</label>
            <select value={selectedZone} onChange={e => setSelectedZone(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer">
              {zoneNames.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={!name.trim()}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditLocationModal({ location, zoneNames, onClose, onSaved }: { location: Location; zoneNames: string[]; onClose: () => void; onSaved: (name: string) => void }) {
  const updateLocation = useStore(s => s.updateLocation);
  const [name, setName] = useState(location.name);
  const [zone, setZone] = useState(location.zone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLocation(location.id, { name, zone });
    onSaved(name);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border flex justify-between items-center">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" /> Edit Location
          </h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Location Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required autoFocus
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">Parent Zone</label>
            <select value={zone} onChange={e => setZone(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer">
              {zoneNames.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-border text-foreground rounded-lg text-sm font-semibold hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={!name.trim()}
              className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Locations() {
  const { locations, zones, deleteLocation, users } = useStore(useShallow(s => ({
    locations: s.locations,
    zones: s.zones,
    deleteLocation: s.deleteLocation,
    users: s.users,
  })));

  const activeZones = zones.filter(z => z.isActive);
  const zoneNames = activeZones.map(z => z.name);

  const [activeTab, setActiveTab] = useState(zoneNames[0] ?? 'CPF');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (zoneNames.length > 0 && !zoneNames.includes(activeTab)) {
      setActiveTab(zoneNames[0]);
    }
  }, [zoneNames.join(','), activeTab]);

  const tabLocations = locations.filter(l => l.zone === activeTab && l.isActive);

  const getUserCount = (locationName: string) =>
    users.filter(u => u.location === locationName && u.accountStatus === 'active').length;

  const handleDelete = (loc: Location) => {
    if (confirm(`Are you sure you want to delete location "${loc.name}"? This action cannot be undone.`)) {
      deleteLocation(loc.id);
      setToast({ message: `Location "${loc.name}" deleted`, variant: 'success' });
    }
  };

  return (
    <AdminLayout title="Location Management">
      {showAddModal && <AddLocationModal zone={activeTab} zoneNames={zoneNames} onClose={() => setShowAddModal(false)} onAdded={(n) => setToast({ message: `Location "${n}" added`, variant: 'success' })} />}
      {editingLocation && <EditLocationModal location={editingLocation} zoneNames={zoneNames} onClose={() => setEditingLocation(null)} onSaved={(n) => setToast({ message: `Location "${n}" updated`, variant: 'success' })} />}
      {toast && <Toast message={toast.message} variant={toast.variant} onDone={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 mb-4 lg:mb-6">
        <div className="flex bg-card p-1 rounded-lg border border-border w-full sm:w-auto overflow-x-auto">
          {zoneNames.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-shrink-0 px-4 lg:px-6 py-2 rounded-md text-sm font-bold transition-all whitespace-nowrap',
                activeTab === tab ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground',
              )}>
              {tab}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddModal(true)} disabled={zoneNames.length === 0}
          className="bg-background border border-border text-foreground hover:bg-muted px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center disabled:opacity-40 disabled:cursor-not-allowed">
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
                <div className="flex gap-1">
                  <button onClick={() => setEditingLocation(loc)}
                    className="p-1.5 text-muted-foreground hover:text-foreground bg-background rounded border border-border hover:border-primary/50 transition-colors" title="Edit location">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(loc)}
                    className="p-1.5 text-muted-foreground hover:text-destructive bg-background rounded border border-border hover:border-destructive/50 transition-colors" title="Delete location">
                    <Trash2 className="w-3.5 h-3.5" />
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
          <p className="text-sm mt-1 opacity-60">Click "Add Location" to create one.</p>
        </div>
      )}
    </AdminLayout>
  );
}
