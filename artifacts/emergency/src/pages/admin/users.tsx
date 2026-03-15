import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { StatusBadge, cn } from '@/components/shared/Badges';
import { Search, X, MapPin, Clock, Shield, ChevronDown } from 'lucide-react';
import type { User } from '@/types';

function UserDrawer({ user, onClose }: { user: User; onClose: () => void }) {
  const { updateUserResponse } = useStore(useShallow(s => ({ updateUserResponse: s.updateUserResponse })));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-[420px] h-full bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b border-border flex justify-between items-center bg-background/50">
          <h3 className="font-bold text-foreground">Personnel Details</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 lg:p-6 flex-1 overflow-y-auto space-y-5 lg:space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg lg:text-xl border border-primary/20 shrink-0">
              {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg lg:text-xl font-bold text-foreground truncate">{user.name}</h2>
              <p className="text-muted-foreground font-mono text-sm mt-0.5">Badge: {user.badge}</p>
              <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full border mt-1.5 inline-block',
                user.accountStatus === 'active' ? 'bg-safe/10 text-safe border-safe/20' : 'bg-muted text-muted-foreground border-border'
              )}>
                {user.accountStatus === 'active' ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Shield className="w-3 h-3" /> Role</p>
              <p className="font-semibold text-foreground text-sm">{user.role}</p>
            </div>
            <div className="bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Current Status</p>
              <StatusBadge status={user.status} />
            </div>
            <div className="col-span-2 bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3 text-primary" /> Location</p>
              <p className="font-medium text-foreground">{user.zone} — {user.location}</p>
            </div>
            <div className="col-span-2 bg-background border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Last Activity</p>
              <p className="font-medium text-foreground text-sm">{new Date(user.lastActivity).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Override Response Status</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { status: 'confirmed' as const, label: 'Mark Confirmed', cls: 'bg-safe/10 border-safe/20 text-safe hover:bg-safe hover:text-white' },
                { status: 'missing' as const, label: 'Mark Missing', cls: 'bg-missing/10 border-missing/20 text-missing hover:bg-missing hover:text-white' },
                { status: 'no_reply' as const, label: 'No Reply', cls: 'bg-noreply/10 border-noreply/20 text-noreply hover:bg-noreply hover:text-white' },
                { status: 'need_help' as const, label: 'Need Help', cls: 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white' },
              ].map(opt => (
                <button
                  key={opt.status}
                  onClick={() => updateUserResponse(user.id, opt.status)}
                  disabled={user.status === opt.status}
                  className={cn('py-2 rounded-lg border text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed', opt.cls)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-background border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-bold text-muted-foreground text-sm shrink-0">
          {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground font-mono">{user.badge}</p>
        </div>
        <StatusBadge status={user.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
        <span className={cn('font-bold', user.zone === 'CPF' ? 'text-primary' : 'text-blue-500')}>{user.zone}</span>
        <span className="truncate">{user.location}</span>
        <span className="ml-auto">
          <span className={cn('font-semibold px-1.5 py-0.5 rounded-full border text-[10px]',
            user.accountStatus === 'active' ? 'bg-safe/10 text-safe border-safe/20' : 'bg-muted text-muted-foreground border-border'
          )}>
            {user.accountStatus === 'active' ? 'Active' : 'Disabled'}
          </span>
        </span>
      </div>
    </button>
  );
}

export default function UsersPage() {
  const users = useStore(s => s.users);
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'All' | 'CPF' | 'Camp'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const filtered = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.badge.includes(search);
    const matchZone = zoneFilter === 'All' || u.zone === zoneFilter;
    const matchStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchSearch && matchZone && matchStatus;
  });

  return (
    <AdminLayout title="Personnel Directory">
      {selectedUser && <UserDrawer user={selectedUser} onClose={() => setSelectedUser(null)} />}

      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)]">
        {/* Toolbar */}
        <div className="p-3 lg:p-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-3 lg:gap-4 bg-background/30 rounded-t-xl shrink-0">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or badge..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-2 lg:gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="relative shrink-0">
              <select
                value={zoneFilter}
                onChange={e => setZoneFilter(e.target.value as any)}
                className="appearance-none pl-3 pr-7 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="All">Zone: All</option>
                <option value="CPF">CPF</option>
                <option value="Camp">Camp</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>

            <div className="relative shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="All">Status: All</option>
                <option value="confirmed">Confirmed</option>
                <option value="missing">Missing</option>
                <option value="no_reply">No Reply</option>
                <option value="need_help">Need Help</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="flex-1 overflow-auto hidden lg:block">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
                <th className="p-4 font-semibold pl-6">Personnel Info</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Zone</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Account</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(user => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                >
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-bold text-muted-foreground text-sm group-hover:border-primary group-hover:text-primary transition-colors shrink-0">
                        {user.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{user.badge}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground bg-background px-2 py-1 rounded border border-border">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={cn('text-sm font-bold', user.zone === 'CPF' ? 'text-primary' : 'text-blue-500')}>
                      {user.zone}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{user.location}</td>
                  <td className="p-4"><StatusBadge status={user.status} /></td>
                  <td className="p-4">
                    <span className={cn('text-xs font-semibold px-2 py-1 rounded-full border',
                      user.accountStatus === 'active' ? 'bg-safe/10 text-safe border-safe/20' : 'bg-muted text-muted-foreground border-border'
                    )}>
                      {user.accountStatus === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="flex-1 overflow-auto p-3 space-y-2 lg:hidden">
          {filtered.map(user => (
            <UserCard key={user.id} user={user} onClick={() => setSelectedUser(user)} />
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 lg:p-4 border-t border-border bg-background/50 flex flex-wrap justify-between items-center text-sm text-muted-foreground gap-2 shrink-0">
          <span>Showing {filtered.length} of {users.length} personnel</span>
          <div className="flex gap-3 lg:gap-4 text-xs">
            <span><span className="text-safe font-bold">{users.filter(u => u.status === 'confirmed').length}</span> Confirmed</span>
            <span><span className="text-missing font-bold">{users.filter(u => u.status === 'missing').length}</span> Missing</span>
            <span><span className="text-noreply font-bold">{users.filter(u => u.status === 'no_reply').length}</span> No Reply</span>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
