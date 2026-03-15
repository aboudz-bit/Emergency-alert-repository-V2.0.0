import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export function KPICard({ title, value, icon: Icon, trend, trendUp, colorClass = "text-primary" }: KPICardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
        <Icon className="w-32 h-32" />
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="text-muted-foreground font-medium text-sm">{title}</h3>
        <div className={`p-2 rounded-lg bg-background ${colorClass} bg-opacity-10`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-display font-bold text-foreground">{value}</p>
        {trend && (
          <p className={`text-xs mt-2 font-medium ${trendUp ? 'text-safe' : 'text-missing'}`}>
            {trendUp ? '↑' : '↓'} {trend}
          </p>
        )}
      </div>
    </div>
  );
}
