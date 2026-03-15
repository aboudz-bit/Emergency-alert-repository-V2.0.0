import React, { useState } from 'react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { useUsers } from '@/hooks/use-api';
import { StatusBadge } from '@/components/shared/Badges';
import { Search, Filter, SlidersHorizontal } from 'lucide-react';

export default function UsersPage() {
  const { data: users } = useUsers();
  const [search, setSearch] = useState('');

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.badge.includes(search)
  ) || [];

  return (
    <AdminLayout title="Personnel Directory">
      <div className="bg-card border border-border rounded-xl flex flex-col h-[calc(100vh-140px)]">
        
        {/* Toolbar */}
        <div className="p-5 border-b border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-background/30 rounded-t-xl">
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
          
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button className="px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 hover:bg-muted">
              <Filter className="w-4 h-4" /> Zone: All
            </button>
            <button className="px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 hover:bg-muted">
              <Filter className="w-4 h-4" /> Location: All
            </button>
            <button className="px-3 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-medium flex items-center gap-2 shrink-0 hover:bg-muted">
              <SlidersHorizontal className="w-4 h-4" /> Status
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background/80 border-b border-border text-xs uppercase tracking-wider text-muted-foreground sticky top-0 z-10 backdrop-blur-md">
                <th className="p-4 font-semibold pl-6">Personnel Info</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Assigned Zone</th>
                <th className="p-4 font-semibold">Location</th>
                <th className="p-4 font-semibold">Current Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-bold text-muted-foreground text-sm group-hover:border-primary group-hover:text-primary transition-colors">
                      {user.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{user.badge}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm font-medium text-foreground bg-background px-2 py-1 rounded border border-border">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-bold ${user.zone === 'CPF' ? 'text-primary' : 'text-blue-500'}`}>
                      {user.zone}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">{user.location}</td>
                  <td className="p-4"><StatusBadge status={user.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-border bg-background/50 flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {filteredUsers.length} of {users?.length || 0} personnel</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 border border-border rounded hover:bg-muted disabled:opacity-50" disabled>Next</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
