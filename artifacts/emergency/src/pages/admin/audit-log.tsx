import React, { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useStore, useShallow } from '@/store';
import { cn } from '@/components/shared/Badges';
import { Search, Clock, Filter } from 'lucide-react';
import type { AuditActionType } from '@/types';

type FilterType = 'all' | 'activated' | 'deactivated' | 'edited' | 'broadcast' | 'sound' | 'notification';

const filterOptions: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'activated', label: 'Activations' },
  { key: 'deactivated', label: 'Deactivations' },
  { key: 'edited', label: 'Edits' },
  { key: 'broadcast', label: 'Broadcasts' },
  { key: 'sound', label: 'Sound' },
  { key: 'notification', label: 'Notifications' },
];

const actionFilterMap: Record<FilterType, AuditActionType[]> = {
  all: [],
  activated: ['activated'],
  deactivated: ['deactivated'],
  edited: ['edited'],
  broadcast: ['broadcast_sent'],
  sound: ['sound_triggered', 'sound_stopped'],
  notification: ['notification_sent'],
};

const actionColors: Record<string, string> = {
  activated: 'bg-red-500/10 text-red-500 border-red-500/20',
  deactivated: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  edited: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  broadcast_sent: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  notification_sent: 'bg-green-500/10 text-green-500 border-green-500/20',
  sound_triggered: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  sound_stopped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  acknowledgment_received: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
};

const actionLabels: Record<string, string> = {
  activated: 'ACTIVATED',
  deactivated: 'DEACTIVATED',
  edited: 'EDITED',
  broadcast_sent: 'BROADCAST',
  notification_sent: 'NOTIFIED',
  sound_triggered: 'SOUND ON',
  sound_stopped: 'SOUND OFF',
  acknowledgment_received: 'ACK',
};

const priorityColors: Record<string, string> = {
  High: 'text-red-500',
  Medium: 'text-amber-500',
  Low: 'text-green-500',
};

export default function AuditLogPage() {
  const auditLog = useStore(s => s.auditLog);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    let entries = auditLog;

    if (filter !== 'all') {
      const types = actionFilterMap[filter];
      entries = entries.filter(e => types.includes(e.actionType));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.zoneName.toLowerCase().includes(q) ||
        (e.locationName?.toLowerCase().includes(q)) ||
        e.alertType.toLowerCase().includes(q) ||
        e.triggeredByName.toLowerCase().includes(q) ||
        e.message.toLowerCase().includes(q) ||
        e.targetName.toLowerCase().includes(q) ||
        (e.notes?.toLowerCase().includes(q))
      );
    }

    return entries;
  }, [auditLog, filter, search]);

  return (
    <AdminLayout title="Audit Log">
      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-120px)] lg:h-[calc(100vh-140px)] overflow-hidden">
        {/* Toolbar */}
        <div className="p-3 lg:p-4 border-b border-border bg-background/30 space-y-3 shrink-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            {filterOptions.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors',
                  filter === f.key
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background border-border text-muted-foreground hover:border-foreground/50',
                )}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-xs text-muted-foreground">{filtered.length} entries</span>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search audit log..."
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
              <Clock className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No audit records found.</p>
              <p className="text-sm mt-1">Audit entries are created when alerts are activated, deactivated, or modified.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(entry => {
                const time = new Date(entry.timestamp);
                const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = time.toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div key={entry.id} className="px-3 lg:px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Time */}
                      <div className="w-16 shrink-0 text-right">
                        <p className="text-xs font-mono font-bold text-foreground">{timeStr}</p>
                        <p className="text-[10px] text-muted-foreground">{dateStr}</p>
                      </div>

                      {/* Action Badge */}
                      <div className="shrink-0">
                        <span className={cn(
                          'inline-block px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border',
                          actionColors[entry.actionType] || 'bg-muted text-foreground border-border',
                        )}>
                          {actionLabels[entry.actionType] || entry.actionType}
                        </span>
                      </div>

                      {/* Priority */}
                      <span className={cn('text-xs font-bold shrink-0 mt-0.5', priorityColors[entry.priority] || 'text-foreground')}>
                        {entry.priority.toUpperCase()}
                      </span>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-foreground">{entry.alertType}</span>
                          <span className="text-xs text-muted-foreground">{entry.targetName}</span>
                          {entry.locationName && (
                            <span className="text-xs text-muted-foreground">/ {entry.locationName}</span>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.notes}</p>
                        )}
                      </div>

                      {/* Operator */}
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-foreground">by {entry.triggeredByName}</p>
                        {entry.channelUsed && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {Array.isArray(entry.channelUsed) ? entry.channelUsed.join(', ') : entry.channelUsed}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
