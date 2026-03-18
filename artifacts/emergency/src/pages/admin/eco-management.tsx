import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { cn } from '@/components/shared/Badges';
import {
  ShieldAlert, UserPlus, X, Search, Power, PowerOff,
  Trash2, RefreshCw, MapPin, User as UserIcon, Clock,
} from 'lucide-react';
import type { EcoSlot, User } from '@/types';

const slotColors: Record<EcoSlot, string> = {
  A: 'border-red-500/30 bg-red-500/5',
  B: 'border-blue-500/30 bg-blue-500/5',
  C: 'border-amber-500/30 bg-amber-500/5',
};
const slotAccent: Record<EcoSlot, string> = {
  A: 'text-red-500',
  B: 'text-blue-500',
  C: 'text-amber-500',
};

export default function ECOManagementPage() {
  const { ecoAssignments, users, zones, assignECO, removeECO, toggleECOActive } = useStore(useShallow(s => ({
    ecoAssignments: s.ecoAssignments,
    users: s.users,
    zones: s.zones,
    assignECO: s.assignECO,
    removeECO: s.removeECO,
    toggleECOActive: s.toggleECOActive,
  })));

  const [assignModal, setAssignModal] = useState<EcoSlot | null>(null);

  return (
    <AdminLayout title="ECO Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Emergency Coordinator Assignments</h2>
            <p className="text-sm text-muted-foreground">Manage ECO A, B, and C positions</p>
          </div>
        </div>

        {/* ECO Slot Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {(['A', 'B', 'C'] as EcoSlot[]).map(slot => {
            const assignment = ecoAssignments.find(a => a.ecoSlot === slot);
            const isAssigned = assignment?.assignedUserId != null;
            const isActive = assignment?.active ?? false;

            return (
              <div key={slot} className={cn(
                'bg-card border-2 rounded-xl overflow-hidden transition-colors',
                isAssigned ? slotColors[slot] : 'border-border',
              )}>
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className={cn('w-6 h-6', isAssigned ? slotAccent[slot] : 'text-muted-foreground')} />
                    <div>
                      <h3 className="font-display font-bold text-foreground text-lg">ECO {slot}</h3>
                      {isAssigned ? (
                        <span className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full border',
                          isActive
                            ? 'bg-safe/10 text-safe border-safe/20'
                            : 'bg-muted text-muted-foreground border-border',
                        )}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Unassigned</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  {isAssigned && assignment ? (
                    <>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Assigned User</p>
                            <p className="font-semibold text-foreground">{assignment.assignedUserName}</p>
                            {assignment.assignedUserBadge && (
                              <p className="text-xs text-muted-foreground font-mono">Badge: {assignment.assignedUserBadge}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Zone</p>
                            <p className="font-semibold text-foreground">{assignment.assignedZoneName || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Assigned By</p>
                            <p className="font-medium text-foreground">{assignment.assignedByName || '—'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Assigned At</p>
                            <p className="font-medium text-foreground text-sm">
                              {assignment.assignedAt ? new Date(assignment.assignedAt).toLocaleString() : '—'}
                            </p>
                          </div>
                        </div>

                        {assignment.notes && (
                          <div className="bg-background/50 border border-border rounded-lg p-2.5">
                            <p className="text-xs text-muted-foreground">{assignment.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          onClick={() => setAssignModal(slot)}
                          className="px-3 py-2 bg-background border border-border rounded-lg text-xs font-medium text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Change User
                        </button>
                        <button
                          onClick={() => toggleECOActive(slot)}
                          className={cn(
                            'px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors border',
                            isActive
                              ? 'bg-muted border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                              : 'bg-safe/10 border-safe/20 text-safe hover:bg-safe/20',
                          )}
                        >
                          {isActive ? <><PowerOff className="w-3.5 h-3.5" /> Deactivate</> : <><Power className="w-3.5 h-3.5" /> Activate</>}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${assignment.assignedUserName} from ECO ${slot}?`)) {
                              removeECO(slot);
                            }
                          }}
                          className="col-span-2 px-3 py-2 bg-destructive/5 border border-destructive/20 rounded-lg text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove Assignment
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <UserIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-4">No user assigned to this position</p>
                      <button
                        onClick={() => setAssignModal(slot)}
                        className="px-4 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 mx-auto"
                      >
                        <UserPlus className="w-4 h-4" /> Assign User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Assign ECO Modal */}
      {assignModal && (
        <AssignECOModal
          slot={assignModal}
          users={users}
          zones={zones}
          onAssign={(userId, zoneId, zoneName, notes) => {
            assignECO(assignModal, userId, zoneId, zoneName, notes);
            setAssignModal(null);
          }}
          onClose={() => setAssignModal(null)}
        />
      )}
    </AdminLayout>
  );
}

// ─── Assign ECO Modal ────────────────────────────────────────────────────────

function AssignECOModal({
  slot,
  users,
  zones,
  onAssign,
  onClose,
}: {
  slot: EcoSlot;
  users: User[];
  zones: { id: number; name: string; isActive: boolean }[];
  onAssign: (userId: number, zoneId: number, zoneName: string, notes?: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const eligibleUsers = useMemo(() => {
    let filtered = users.filter(u => u.role === 'User' && u.accountStatus === 'active');
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name.toLowerCase().includes(q) || u.badge.includes(q),
      );
    }
    return filtered;
  }, [users, search]);

  const activeZones = zones.filter(z => z.isActive);
  const selectedZone = activeZones.find(z => z.id === selectedZoneId);

  const handleSubmit = () => {
    if (!selectedUserId || !selectedZoneId || !selectedZone) return;
    onAssign(selectedUserId, selectedZoneId, selectedZone.name, notes || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-border flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-foreground">Assign ECO {slot}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Zone */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              1. Select Zone
            </label>
            <div className="flex flex-wrap gap-2">
              {activeZones.map(z => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setSelectedZoneId(z.id)}
                  className={cn(
                    'px-4 py-2 rounded-lg border font-medium text-sm transition-colors',
                    selectedZoneId === z.id
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-background border-border text-foreground hover:border-muted-foreground',
                  )}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Search User */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              2. Select User
            </label>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or badge..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="max-h-40 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {eligibleUsers.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">No users found</p>
              ) : (
                eligibleUsers.map(u => (
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
                        {u.isECOAssigned && <span className="text-amber-500 font-bold ml-1">• ECO {u.ecoSlot}</span>}
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
                ))
              )}
            </div>
          </div>

          {/* Step 3: Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              3. Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Assignment notes..."
              className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-4 py-2.5 bg-card border border-border text-foreground hover:bg-muted rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedUserId || !selectedZoneId}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign ECO {slot}
          </button>
        </div>
      </div>
    </div>
  );
}
