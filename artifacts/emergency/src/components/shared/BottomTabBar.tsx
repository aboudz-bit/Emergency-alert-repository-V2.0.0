import React from 'react';
import { useLocation } from 'wouter';
import { Home, Map, AlertTriangle, User, Clipboard, Users } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

type TabConfig = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const roleTabConfigs: Record<string, TabConfig[]> = {
  eco: [
    { path: '/eco', label: 'Dashboard', icon: Home },
    { path: '/eco/live-map', label: 'Map', icon: Map },
  ],
  supervisor: [
    { path: '/supervisor', label: 'Dashboard', icon: Clipboard },
    { path: '/supervisor/map', label: 'Map', icon: Map },
  ],
  mobile: [
    { path: '/mobile/home', label: 'Home', icon: Home },
    { path: '/mobile/map', label: 'Map', icon: Map },
    { path: '/mobile/history', label: 'Alerts', icon: AlertTriangle },
    { path: '/mobile/profile', label: 'Profile', icon: User },
  ],
};

export function BottomTabBar({ role }: { role: 'eco' | 'supervisor' | 'mobile' }) {
  const [location, setLocation] = useLocation();
  const tabs = roleTabConfigs[role];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] z-50 px-2 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-14">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => setLocation(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <div className={cn(
                'w-9 h-7 rounded-[14px] flex items-center justify-center',
                isActive && 'bg-primary/8',
              )}>
                <tab.icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
