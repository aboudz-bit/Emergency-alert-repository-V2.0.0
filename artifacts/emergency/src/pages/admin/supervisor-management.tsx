import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { cn } from '@/components/shared/Badges';
import {
  Shield, UserPlus, X, Search, Power, PowerOff, Trash2, RefreshCw,
  MapPin, User as UserIcon, Users, Hash, ChevronDown, ChevronRight, Edit3,
} from 'lucide-react';
import type { User } from '@/types';

export default function SupervisorManagementPage() {
  const {
    supervisorAssignments, users, locations, zones,
    assignSupervisor, assignBackupSupervisor,
    removeSupervisor, removeBackupSupervisor,
    toggleSupervisorActive, toggleBackupSupervisorActive,
    updateLocationManpower,
  } = useStore(useShallow(s => ({
    supervisorAssignments: s.supervisorAssignments,
    users: s.users,
    locations: s.locations,
    zones: s.zones,
    assignSupervisor: s.assignSupervisor,
    assignBackupSupervisor: s.assignBackupSupervisor,
    removeSupervisor: s.removeSupervisor,
    removeBackupSupervisor: s.removeBackupSupervisor,
    toggleSupervisorActive: s.toggleSupervisorActive,
    toggleBackupSupervisorActive: s.toggleBackupSupervisorActive,
    updateLocationManpower: s.updateLocationManpower,
  })));

  const [assignModal, setAssignModal] = useState<{ locationId: number; type: 'supervisor' | 'backup' } | null>(null);
  const [manpowerModal, setManpowerModal] = useState<{ locationId: number; current: number } | null>(null);
  const [expandedZones, setExpandedZones] = useState<Record<string, boolean>>({ CPF: true, Camp: true });

  const activeLocations = locations.filter(l => l.isActive);
  const zoneGroups = useMemo(() => {
    const groups: Record<string, typeof activeLocations> = {};
    for (const loc of activeLocations) {
      if (!groups[loc.zone]) groups[loc.zone] = [];
      groups[loc.zone].push(loc);
    }
    return groups;
  }, [activeLocations]);

  const getAssignment = (locId: number) => supervisorAssignments.find(a => a.locationId === locId);

  const toggleZone = (zone: string) => {
    setExpandedZones(prev => ({ ...prev, [zone]: !prev[zone] }));
  };

  return (
    <AdminLayout title="Supervisor Management">
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Location Supervisor Assignments</h2>
          <p className="text-sm text-muted-foreground">Assign supervisors and backup supervisors per location. Set total manpower.</p>
        </div>

        {/* Zone groups */}
        {Object.entries(zoneGroups).map(([zone, locs]) => {
          const isExpanded = expandedZones[zone] !== false;
          return (
            <div key={zone} className="bg-card border border-border rounded-xl overflow-hidden">
              {/* Zone header */}
              <button
                onClick={() => toggleZone(zone)}
                className="w-full px-4 lg:px-5 py-3 lg:py-4 flex items-center justify-between bg-background/30 border-b border-border hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-bold text-foreground">{zone}</h3>
                  <span className="text-xs text-muted-foreground">{locs.length} locations</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="divide-y divide-border">
                  {locs.map(loc => {
                    const a = getAssignment(loc.id);
                    const locUsers = users.filter(u => u.location === loc.name && u.zone === zone && u.accountStatus === 'active');
                    const mp = a?.totalManpower ?? loc.totalManpower ?? 0;

                    return (
                      <div key={loc.id} className="px-4 lg:px-5 py-3 lg:py-4">
                        {/* Location header row */}
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                              <MapPin className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-bold text-foreground text-sm">{loc.name}</h4>
                              <p className="text-[10px] lg:text-xs text-muted-foreground">Reg: {locUsers.length}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setManpowerModal({ locationId: loc.id, current: mp })}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-background border border-border rounded-lg text-[10px] lg:text-xs font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            <Hash className="w-3 h-3" /> {mp}
                            <Edit3 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>

                        {/* Supervisor + Backup row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-3">
                          {/* Supervisor */}
                          <PersonSlot
                            label="Supervisor"
                            userName={a?.supervisorUserName}
                            userBadge={a?.supervisorUserBadge}
                            isActive={a?.supervisorActive ?? false}
                            onAssign={() => setAssignModal({ locationId: loc.id, type: 'supervisor' })}
                            onToggle={() => toggleSupervisorActive(loc.id)}
                            onRemove={() => { if (confirm(`Remove supervisor from ${loc.name}?`)) removeSupervisor(loc.id); }}
                          />
                          {/* Backup */}
                          <PersonSlot
                            label="Backup Supervisor"
                            userName={a?.backupSupervisorUserName}
                            userBadge={a?.backupSupervisorUserBadge}
                            isActive={a?.backupActive ?? false}
                            onAssign={() => setAssignModal({ locationId: loc.id, type: 'backup' })}
                            onToggle={() => toggleBackupSupervisorActive(loc.id)}
                            onRemove={() => { if (confirm(`Remove backup supervisor from ${loc.name}?`)) removeBackupSupervisor(loc.id); }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <AssignModal
          locationId={assignModal.locationId}
          assignType={assignModal.type}
          locations={locations}
          users={users}
          onAssign={(userId, notes) => {
            if (assignModal.type === 'supervisor') {
              assignSupervisor(assignModal.locationId, userId, notes);
            } else {
              assignBackupSupervisor(assignModal.locationId, userId, notes);
            }
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}

      {/* Manpower Modal */}
      {manpowerModal && (
        <ManpowerModal
          locationId={manpowerModal.locationId}
          currentManpower={manpowerModal.current}
          locations={locations}
          onSave={(val) => { updateLocationManpower(manpowerModal.locationId, val); setManpowerModal(null); }}
          onClose={() => setManpowerModal(null)}
        />
      )}
    </AdminLayout>
  );
}

// ─── Person Slot Component ──────────────────────────────────────────────────

function PersonSlot({ label, userName, userBadge, isActive, onAssign, onToggle, onRemove }: {
  label: string;
  userName: string | null | undefined;
  userBadge: string | null | undefined;
  isActive: boolean;
  onAssign: () => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const isAssigned = !!userName;
  return (
    <div className={cn(
      'border rounded-lg p-2.5 lg:p-3 transition-colors',
      isAssigned ? (isActive ? 'border-safe/30 bg-safe/5' : 'border-border bg-muted/30') : 'border-dashed border-border bg-background/50',
    )}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
        {isAssigned && (
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded border',
            isActive ? 'bg-safe/10 text-safe border-safe/20' : 'bg-muted text-muted-foreground border-border',
          )}>
            {isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        )}
      </div>

      {isAssigned ? (
        <>
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">{userName}</p>
              {userBadge && <p className="text-[10px] text-muted-foreground font-mono">Badge: {userBadge}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onAssign} className="flex-1 px-2 py-1.5 bg-background border border-border rounded text-[10px] font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1">
              <RefreshCw className="w-3 h-3" /> Change
            </button>
            <button onClick={onToggle} className={cn(
              'flex-1 px-2 py-1.5 rounded text-[10px] font-medium flex items-center justify-center gap-1 transition-colors border',
              isActive ? 'bg-muted border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive' : 'bg-safe/10 border-safe/20 text-safe',
            )}>
              {isActive ? <><PowerOff className="w-3 h-3" /> Off</> : <><Power className="w-3 h-3" /> On</>}
            </button>
            <button onClick={onRemove} className="px-2 py-1.5 bg-destructive/5 border border-destructive/20 rounded text-[10px] font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      ) : (
        <button onClick={onAssign} className="w-full px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs font-medium text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5">
          <UserPlus className="w-3.5 h-3.5" /> Assign {label}
        </button>
      )}
    </div>
  );
}

// ─── Assign Modal ──────────────────────────────────────────────────────────

function AssignModal({ locationId, assignType, locations, users, onAssign, onClose }: {
  locationId: number;
  assignType: 'supervisor' | 'backup';
  locations: { id: number; name: string; zone: string }[];
  users: User[];
  onAssign: (userId: number, notes?: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const loc = locations.find(l => l.id === locationId);

  const eligible = useMemo(() => {
    let filtered = users.filter(u => u.role === 'User' && u.accountStatus === 'active');
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.badge.includes(q));
    }
    return filtered;
  }, [users, search]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Assign {assignType === 'supervisor' ? 'Supervisor' : 'Backup Supervisor'}
            </h2>
            <p className="text-xs text-muted-foreground">{loc?.name} — {loc?.zone}</p>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or badge..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
            {eligible.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
            ) : eligible.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedUserId(u.id)}
                className={cn(
                  'w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors',
                  selectedUserId === u.id ? 'bg-primary/10' : 'hover:bg-muted',
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Badge: {u.badge} • {u.zone} / {u.location}
                    {u.isSupervisorAssigned && <span className="text-blue-500 font-bold ml-1">• Supervisor ({u.supervisorLocationName})</span>}
                    {u.isBackupSupervisorAssigned && <span className="text-amber-500 font-bold ml-1">• Backup ({u.supervisorLocationName})</span>}
                    {u.isECOAssigned && <span className="text-purple-500 font-bold ml-1">• ECO {u.ecoSlot}</span>}
                  </p>
                </div>
                {selectedUserId === u.id && (
                  <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="Notes (optional)..."
            className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div className="p-5 border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button
            onClick={() => selectedUserId && onAssign(selectedUserId, notes || undefined)}
            disabled={!selectedUserId}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Manpower Modal ────────────────────────────────────────────────────────

function ManpowerModal({ locationId, currentManpower, locations, onSave, onClose }: {
  locationId: number;
  currentManpower: number;
  locations: { id: number; name: string; zone: string }[];
  onSave: (val: number) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentManpower);
  const loc = locations.find(l => l.id === locationId);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="p-5 border-b border-border">
          <h2 className="text-lg font-bold text-foreground">Edit Total Manpower</h2>
          <p className="text-xs text-muted-foreground">{loc?.name} — {loc?.zone}</p>
        </div>
        <div className="p-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Total Manpower</label>
          <input
            type="number"
            min={0}
            value={value}
            onChange={e => setValue(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-background border border-border rounded-lg px-4 py-3 text-foreground text-lg font-bold text-center focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2.5 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">Cancel</button>
          <button onClick={() => onSave(value)} className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}
