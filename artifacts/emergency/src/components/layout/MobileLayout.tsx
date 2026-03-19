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
    <div className="min-h-screen bg-[#F5F6F8] flex justify-center">
      <div className="w-full max-w-[428px] bg-[#F5F6F8] min-h-screen shadow-2xl relative pb-[68px] flex flex-col overflow-hidden border-x border-[#E5E7EB]">
        {children}

        {/* Bottom Navigation — matches mobile app tab bar */}
        <nav className="absolute bottom-0 left-0 w-full h-[68px] bg-white border-t border-[#E5E7EB] flex items-center justify-around px-2 z-50">
          {navItems.map(item => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-20 h-full gap-1 transition-colors",
                  isActive ? "text-[#5B3A8E]" : "text-[#9CA3AF] hover:text-[#6B7280]"
                )}
              >
                <div className={cn(
                  "w-9 h-7 flex items-center justify-center rounded-full transition-colors",
                  isActive && "bg-[#5B3A8E]/10"
                )}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-medium">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
