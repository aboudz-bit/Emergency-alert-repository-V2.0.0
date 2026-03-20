import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { StatusBadge, cn } from '@/components/shared/Badges';
import { Search, Lock, Shield, X, Check, ChevronRight } from 'lucide-react';
import { ALL_PERMISSIONS } from '@/types';
import type { PermissionKey, User } from '@/types';

export default function PermissionsPage() {
  const users = useStore(s => s.users);
  const setUserPermissions = useStore(s => s.setUserPermissions);
  const getUserPermissions = useStore(s => s.getUserPermissions);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [localPerms, setLocalPerms] = useState<PermissionKey[]>([]);

  const eligibleUsers = useMemo(
    () => users.filter(u => u.accountStatus === 'active' && u.isActive && u.role !== 'Super Admin' && u.role !== 'IT'),
    [users],
  );

  const filteredUsers = useMemo(
    () => eligibleUsers.filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) || u.badge.includes(search)
    ),
    [eligibleUsers, search],
  );

  const usersWithPerms = useMemo(
    () => eligibleUsers.filter(u => (u.permissions || []).length > 0),
    [eligibleUsers],
  );

  const openEditor = (user: User) => {
    setSelectedUser(user);
    setLocalPerms(getUserPermissions(user.id));
  };

  const togglePerm = (perm: PermissionKey) => {
    setLocalPerms(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const saveAndClose = () => {
    if (selectedUser) {
      const isECO = selectedUser.isECOAssigned && selectedUser.ecoAssignmentActive;
      const defaults: PermissionKey[] = isECO ? ['canViewGlobalLiveMap', 'canReviewAlertMonitor'] : [];
      const explicit = localPerms.filter(p => !defaults.includes(p));
      setUserPermissions(selectedUser.id, explicit);
    }
    setSelectedUser(null);
    setLocalPerms([]);
  };

  return (
    <AdminLayout title="Permissions">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm text-muted-foreground">
              Assign granular permissions to users beyond their base role access.
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Users with custom permissions */}
        {usersWithPerms.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              Users with Custom Permissions ({usersWithPerms.length})
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {usersWithPerms.map(u => (
                <button
                  key={u.id}
                  onClick={() => openEditor(u)}
                  className="bg-card border border-primary/20 rounded-xl p-4 text-left hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.badge} · {u.role}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(u.permissions || []).slice(0, 3).map(p => (
                      <span key={p} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                        {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                      </span>
                    ))}
                    {(u.permissions || []).length > 3 && (
                      <span className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                        +{(u.permissions || []).length - 3}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* All users table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground text-sm">All Eligible Users ({filteredUsers.length})</h3>
          </div>
          <div className="overflow-auto max-h-[calc(100vh-400px)]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur">
                  <th className="p-3 font-semibold">User</th>
                  <th className="p-3 font-semibold">Badge</th>
                  <th className="p-3 font-semibold">Role</th>
                  <th className="p-3 font-semibold">Permissions</th>
                  <th className="p-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => {
                  const perms = u.permissions || [];
                  const isECO = u.isECOAssigned && u.ecoAssignmentActive;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors"
                      onClick={() => openEditor(u)}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {u.name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground text-sm">{u.name}</span>
                        </div>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-sm">{u.badge}</td>
                      <td className="p-3">
                        <span className="text-sm text-foreground">{u.role}</span>
                        {isECO && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-full font-medium">ECO</span>}
                        {u.isSupervisorAssigned && <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-600 rounded-full font-medium">Supervisor</span>}
                      </td>
                      <td className="p-3">
                        {perms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {perms.slice(0, 2).map(p => (
                              <span key={p} className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                                {ALL_PERMISSIONS.find(ap => ap.key === p)?.label || p}
                              </span>
                            ))}
                            {perms.length > 2 && (
                              <span className="text-[10px] px-2 py-0.5 bg-secondary text-muted-foreground rounded-full">
                                +{perms.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Permission Editor Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedUser(null); setLocalPerms([]); }} />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedUser.name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedUser.badge} · {selectedUser.role}</p>
                </div>
              </div>
              <button
                onClick={() => { setSelectedUser(null); setLocalPerms([]); }}
                className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-5 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">Permissions</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Toggle permissions for this user. Role-based defaults are shown but cannot be removed.
                </p>
              </div>

              <div className="space-y-2">
                {ALL_PERMISSIONS.map(perm => {
                  const isActive = localPerms.includes(perm.key);
                  const isECO = selectedUser.isECOAssigned && selectedUser.ecoAssignmentActive;
                  const isDefault = isECO && (perm.key === 'canViewGlobalLiveMap' || perm.key === 'canReviewAlertMonitor');

                  return (
                    <button
                      key={perm.key}
                      onClick={() => { if (!isDefault) togglePerm(perm.key); }}
                      className={cn(
                        'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                        isActive
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background border-border hover:border-muted-foreground/30',
                        isDefault && 'opacity-80 cursor-not-allowed',
                      )}
                    >
                      <div className={cn(
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                        isActive ? 'bg-primary border-primary' : 'border-border',
                      )}>
                        {isActive && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{perm.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{perm.description}</p>
                        {isDefault && (
                          <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-safe/10 text-safe rounded-full font-medium">
                            Role Default
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border flex gap-3">
              <button
                onClick={() => { setSelectedUser(null); setLocalPerms([]); }}
                className="flex-1 px-4 py-2.5 bg-secondary text-foreground rounded-xl font-medium text-sm hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveAndClose}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Save Permissions
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
