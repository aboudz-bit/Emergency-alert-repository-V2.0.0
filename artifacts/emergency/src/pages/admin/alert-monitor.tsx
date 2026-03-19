import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow, selectActiveAlert } from '@/store';
import { StatusBadge, AlertTypeBadge, cn } from '@/components/shared/Badges';
import { Search, Download, UserCheck, X, ShieldAlert, Clock, MapPin } from 'lucide-react';
import type { User, UserResponseStatus } from '@/types';

export default function AlertMonitor() {
  const alert = useStore(selectActiveAlert);
  const users = useStore(s => s.users);
  const { updateUserResponse, sendAllClear } = useStore(useShallow(s => ({
    updateUserResponse: s.updateUserResponse,
    sendAllClear: s.sendAllClear,
  })));

  const [activeTab, setActiveTab] = useState<UserResponseStatus>('missing');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  if (!alert) {
    return (
      <AdminLayout title="Live Alert Monitor">
        <div className="h-[60vh] flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
            <ShieldAlert className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">No Active Alerts</h2>
          <p className="text-muted-foreground max-w-md">The system is operating normally. All personnel are safe. If an emergency occurs, trigger an alert from the Send Alert page.</p>
        </div>
      </AdminLayout>
    );
  }

  const filteredUsers = users.filter(u =>
    u.status === activeTab &&
    (u.name.toLowerCase().includes(search.toLowerCase()) || u.badge.includes(search)),
  );

  const handleMarkConfirmed = (userId: number) => {
    updateUserResponse(userId, 'confirmed');
    if (selectedUser?.id === userId) {
      setSelectedUser(prev => prev ? { ...prev, status: 'confirmed' } : null);
    }
  };

  const handleSendAllClear = () => {
    if (confirm('Send ALL CLEAR? This closes the alert and marks everyone as safe.')) {
      sendAllClear();
      setSelectedUser(null);
    }
  };

  return (
    <AdminLayout title="Live Alert Monitor">
      {/* Alert Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <h2 className="text-xl font-bold text-foreground">{alert.title}</h2>
            <AlertTypeBadge type={alert.type} />
            <span className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">ID: #{alert.id}</span>
          </div>
          <p className="text-sm text-muted-foreground">Initiated by {alert.sentBy} at {new Date(alert.timestamp).toLocaleTimeString()}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-4 py-2 bg-card border border-border hover:bg-secondary text-foreground rounded-lg font-medium transition-colors">
            Send Update
          </button>
          <button
            onClick={handleSendAllClear}
            className="flex-1 md:flex-none px-4 py-2 bg-safe/10 border border-safe/20 text-safe hover:bg-safe hover:text-white rounded-lg font-medium transition-colors"
          >
            Resolve Alert
          </button>
        </div>
      </div>

      {/* Stats Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-none">
        {[
          { id: 'missing' as UserResponseStatus, label: 'Missing / Unresponsive', count: alert.stats.missing, color: 'text-missing', bg: 'bg-missing' },
          { id: 'need_help' as UserResponseStatus, label: 'Need Help', count: alert.stats.needHelp, color: 'text-destructive', bg: 'bg-destructive' },
          { id: 'no_reply' as UserResponseStatus, label: 'No Reply', count: alert.stats.noReply, color: 'text-noreply', bg: 'bg-noreply' },
          { id: 'confirmed' as UserResponseStatus, label: 'Confirmed Safe', count: alert.stats.confirmed, color: 'text-safe', bg: 'bg-safe' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-1 min-w-[160px] p-4 rounded-xl border text-left transition-all relative overflow-hidden',
              activeTab === tab.id
                ? 'bg-card border-foreground/30 shadow-md'
                : 'bg-card border-border hover:border-muted-foreground/50 opacity-70',
            )}
          >
            {activeTab === tab.id && <div className={`absolute top-0 left-0 w-full h-1 ${tab.bg}`} />}
            <div className="text-sm font-semibold text-muted-foreground mb-1">{tab.label}</div>
            <div className={cn('text-3xl font-bold font-display', tab.color)}>{tab.count}</div>
          </button>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-420px)] lg:h-[600px] relative overflow-hidden">
        <div className="p-3 lg:p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-card">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or badge..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm bg-card border border-border hover:bg-secondary text-foreground rounded-lg transition-colors shrink-0">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>

        {/* Desktop Table */}
        <div className="flex-1 overflow-auto hidden lg:block">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-background/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur">
                <th className="p-4 font-semibold">Personnel</th>
                <th className="p-4 font-semibold">Badge ID</th>
                <th className="p-4 font-semibold">Zone & Location</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No personnel found in this category.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-medium text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        {u.name}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">{u.badge}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('w-2 h-2 rounded-full', u.zone === 'CPF' ? 'bg-primary' : 'bg-blue-500')} />
                        <span className="text-foreground">{u.zone}</span>
                        <span className="text-muted-foreground">/ {u.location}</span>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={u.status} /></td>
                    <td className="p-4 text-right text-muted-foreground text-sm">
                      {new Date(u.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List */}
        <div className="flex-1 overflow-auto p-3 space-y-2 lg:hidden">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No personnel found in this category.</div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="w-full text-left bg-background border border-border rounded-xl p-3 hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {u.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-foreground text-sm truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{u.badge}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className={cn('w-2 h-2 rounded-full', u.zone === 'CPF' ? 'bg-primary' : 'bg-blue-500')} />
                    {u.zone} / {u.location}
                  </span>
                  <span>{new Date(u.lastActivity).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* User Details Drawer */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end lg:absolute lg:inset-auto lg:top-0 lg:right-0 lg:w-[400px] lg:h-full lg:z-20">
            <div className="absolute inset-0 bg-black/40 lg:hidden" onClick={() => setSelectedUser(null)} />
            <div className="relative w-full max-w-[420px] lg:max-w-none h-full bg-card border-l border-border shadow-2xl flex flex-col">
              <div className="p-4 border-b border-border flex justify-between items-center bg-background">
                <h3 className="font-bold text-foreground">Personnel Details</h3>
                <button onClick={() => setSelectedUser(null)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 lg:p-6 flex-1 overflow-y-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg lg:text-xl border border-primary/20 shrink-0">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg lg:text-xl font-bold text-foreground leading-tight truncate">{selectedUser.name}</h2>
                    <p className="text-muted-foreground font-mono mt-1 text-sm">Badge: {selectedUser.badge}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{selectedUser.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:gap-4 mb-6 lg:mb-8">
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground uppercase block mb-1">Current Status</span>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                  <div className="bg-background p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground uppercase block mb-1">Last Seen</span>
                    <span className="text-sm text-foreground font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(selectedUser.lastActivity).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="col-span-2 bg-background p-3 rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground uppercase block mb-1">Location Data</span>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <MapPin className="w-4 h-4 text-primary" />
                      {selectedUser.zone} — {selectedUser.location}
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-foreground mb-4 uppercase text-xs tracking-wider">Activity Timeline</h4>
                <div className="space-y-3">
                  <div className="flex gap-3 items-start">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="bg-background border border-border rounded-lg p-3 flex-1">
                      <p className="text-sm font-medium text-foreground">Alert Delivered</p>
                      <p className="text-xs text-muted-foreground">Device acknowledged receipt</p>
                    </div>
                  </div>
                  {selectedUser.status !== 'no_reply' && (
                    <div className="flex gap-3 items-start">
                      <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', selectedUser.status === 'confirmed' ? 'bg-safe' : selectedUser.status === 'need_help' ? 'bg-amber-500' : 'bg-missing')} />
                      <div className="bg-background border border-border rounded-lg p-3 flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {selectedUser.status === 'confirmed' ? 'Marked Safe' : selectedUser.status === 'need_help' ? 'Help Requested' : 'Unresponsive'}
                        </p>
                        <p className="text-xs text-muted-foreground">{new Date(selectedUser.lastActivity).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-border bg-background flex gap-3">
                <button
                  onClick={() => handleMarkConfirmed(selectedUser.id)}
                  disabled={selectedUser.status === 'confirmed'}
                  className="flex-1 py-2.5 bg-safe/10 border border-safe/20 text-safe hover:bg-safe hover:text-white rounded-lg font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Confirmed
                </button>
                <button className="flex-1 py-2.5 bg-card border border-border hover:bg-secondary text-foreground rounded-lg font-bold transition-colors">
                  Ping Device
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
