import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, BellRing, User } from 'lucide-react';
import { cn } from '@/components/shared/Badges';

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: '/mobile/home', icon: Home, label: 'Home' },
    { path: '/mobile/history', icon: BellRing, label: 'Alerts' },
    { path: '/mobile/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="min-h-screen bg-black/90 flex justify-center">
      <div className="w-full max-w-[428px] bg-background min-h-screen shadow-2xl relative pb-20 flex flex-col overflow-hidden border-x border-white/5">
        {children}
        
        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 left-0 w-full h-20 bg-card border-t border-border flex items-center justify-around px-2 pb-safe z-50">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-6 h-6", isActive && "fill-primary/20")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
