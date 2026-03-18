import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import {
  LayoutDashboard, Bell, RadioTower, Map, MapPin,
  Users, History, Settings, LogOut, ShieldAlert, ChevronLeft, Menu, X,
  ClipboardList, Volume2, Radio,
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
  { path: '/admin/eco-management', icon: ShieldAlert, label: 'ECO Mgmt' },
  { path: '/admin/history', icon: History, label: 'History' },
  { path: '/admin/audit-log', icon: ClipboardList, label: 'Audit Log' },
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const currentUser = useStore(s => s.currentUser);
  const logout = useStore(s => s.logout);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
        setMobileOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : 'SA';

  const handleLogout = () => {
    logout();
  };

  const activeAlert = useStore(s => s.alerts.find(a => a.isActive));
  const activeBroadcast = useStore(s => s.activeBroadcast);

  const sidebarContent = (
    <>
      <div className="h-14 lg:h-16 flex items-center px-4 border-b border-border shrink-0">
        <ShieldAlert className="w-7 h-7 lg:w-8 lg:h-8 text-primary shrink-0" />
        {(!collapsed || mobileOpen) && (
          <div className="ml-3 font-display font-bold leading-tight">
            <span className="text-foreground block text-sm lg:text-base">Khurais</span>
            <span className="text-primary text-xs lg:text-sm">Emergency System</span>
          </div>
        )}
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1 text-muted-foreground hover:text-foreground lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-4 lg:py-6 px-2 lg:px-3 space-y-0.5 lg:space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = location === item.path || (item.path !== '/admin' && location.startsWith(item.path));
          const showBadge = item.path === '/admin/alert-monitor' && !!activeAlert;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex items-center px-3 py-2.5 lg:py-3 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
              title={collapsed && !mobileOpen ? item.label : undefined}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 lg:h-6 bg-primary rounded-r-full" />
              )}
              <div className="relative">
                <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary' : 'group-hover:text-foreground')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />
                )}
              </div>
              {(!collapsed || mobileOpen) && (
                <span className="ml-3 font-medium flex-1 text-sm">{item.label}</span>
              )}
              {(!collapsed || mobileOpen) && showBadge && (
                <span className="text-[10px] font-bold text-destructive bg-destructive/10 border border-destructive/20 px-1.5 py-0.5 rounded-full">LIVE</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 lg:p-4 border-t border-border shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center px-3 py-2.5 lg:py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(!collapsed || mobileOpen) && <span className="ml-3 font-medium text-sm">Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay — z-[2000] ensures it covers Leaflet controls */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[2000] lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside
        className={cn(
          'h-full bg-card border-r border-border transition-all duration-300 flex-col z-[2001] relative hidden lg:flex',
          collapsed ? 'w-[60px]' : 'w-56 xl:w-64',
        )}
      >
        {sidebarContent}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 bg-border text-foreground rounded-full p-1 border border-card hover:bg-muted transition-colors z-[2002]"
        >
          {collapsed ? <Menu className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-card border-r border-border w-64 z-[2001] flex flex-col transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {sidebarContent}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 lg:h-16 bg-card/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 lg:px-8 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted lg:hidden shrink-0">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-base lg:text-xl font-bold text-foreground font-display tracking-tight truncate">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {currentUser && (
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-foreground">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground">{currentUser.role}</p>
              </div>
            )}
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs lg:text-sm shrink-0">
              {initials}
            </div>
          </div>
        </header>
        {/* Broadcast Emergency Banner */}
        {activeBroadcast && (
          <div className={cn(
            'px-4 py-2.5 flex items-center gap-3 text-white font-bold text-sm shrink-0 animate-pulse',
            activeBroadcast.priority === 'High' ? 'bg-red-600' :
            activeBroadcast.priority === 'Medium' ? 'bg-amber-600' : 'bg-blue-600',
          )}>
            <Radio className="w-4 h-4 shrink-0" />
            <span className="uppercase tracking-wider text-xs font-black">
              {activeBroadcast.priority} PRIORITY
            </span>
            <span className="mx-1">•</span>
            <span>{activeBroadcast.alertType.toUpperCase()}</span>
            <span className="mx-1">•</span>
            <span>ZONE {activeBroadcast.zone.toUpperCase()}</span>
            <span className="hidden sm:inline mx-1">—</span>
            <span className="hidden sm:inline font-medium truncate flex-1">{activeBroadcast.message}</span>
            <span className="ml-auto text-xs font-mono opacity-80 shrink-0">
              {new Date(activeBroadcast.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        )}

        {/* Sound Active Indicator */}
        {activeAlert?.soundActive && (
          <div className="px-4 py-1.5 bg-orange-500/10 border-b border-orange-500/20 flex items-center gap-2 text-orange-500 text-xs font-bold shrink-0">
            <Volume2 className="w-3.5 h-3.5 animate-pulse" />
            ALARM SOUND ACTIVE — {activeAlert.type} — Zone {activeAlert.zone}
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-3 md:p-5 lg:p-8 bg-background relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
