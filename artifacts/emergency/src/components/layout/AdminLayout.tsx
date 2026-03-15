import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Bell, RadioTower, Map, MapPin,
  Users, History, Settings, LogOut, ShieldAlert, ChevronLeft, Menu,
} from 'lucide-react';
import { cn } from '@/components/shared/Badges';
import { useStore } from '@/store';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/admin/send-alert', icon: Bell, label: 'Send Alert' },
  { path: '/admin/alert-monitor', icon: RadioTower, label: 'Alert Monitor' },
  { path: '/admin/zones', icon: Map, label: 'Zones' },
  { path: '/admin/locations', icon: MapPin, label: 'Locations' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/history', icon: History, label: 'History' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout({
  children,
  title,
  breadcrumbs,
}: {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: { label: string }[];
}) {
  const pageTitle = title || breadcrumbs?.map(b => b.label).join(' / ') || 'Admin';
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'SA';

  const handleLogout = () => {
    logout();
  };

  const activeAlert = useStore(s => s.alerts.find(a => a.isActive));

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-full bg-card border-r border-border transition-all duration-300 flex flex-col z-20 relative',
          collapsed ? 'w-[72px]' : 'w-64',
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-border shrink-0">
          <ShieldAlert className="w-8 h-8 text-primary shrink-0" />
          {!collapsed && (
            <div className="ml-3 font-display font-bold leading-tight">
              <span className="text-foreground block">Khurais</span>
              <span className="text-primary text-sm">Emergency System</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-border text-foreground rounded-full p-1 border border-card hover:bg-muted transition-colors"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
            const showBadge = item.path === '/admin/alert-monitor' && !!activeAlert;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  'flex items-center px-3 py-3 rounded-lg transition-all duration-200 group relative',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
                title={collapsed ? item.label : undefined}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
                <div className="relative">
                  <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary' : 'group-hover:text-foreground')} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                  )}
                </div>
                {!collapsed && (
                  <span className="ml-3 font-medium flex-1">{item.label}</span>
                )}
                {!collapsed && showBadge && (
                  <span className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-full">LIVE</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="ml-3 font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-8 shrink-0">
          <h1 className="text-xl font-bold text-foreground font-display tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.role}</p>
              </div>
            )}
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-background relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
