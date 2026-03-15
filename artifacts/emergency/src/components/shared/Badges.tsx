import React from 'react';
import { UserStatus, AlertType } from '@/lib/mock-data';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StatusBadge({ status, className }: { status: UserStatus, className?: string }) {
  const config = {
    confirmed: { label: 'Confirmed', classes: 'bg-safe/10 text-safe border-safe/20' },
    missing: { label: 'Missing', classes: 'bg-missing/10 text-missing border-missing/20' },
    no_reply: { label: 'No Reply', classes: 'bg-noreply/10 text-noreply border-noreply/20' },
    need_help: { label: 'Need Help', classes: 'bg-destructive/10 text-destructive border-destructive/20' },
  };

  const { label, classes } = config[status] || config.no_reply;

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit", classes, className)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}

export function AlertTypeBadge({ type, className }: { type: AlertType, className?: string }) {
  let classes = 'bg-muted text-muted-foreground border-border';
  
  if (type === 'Blackout' || type === 'Shelter-in' || type === 'Custom') {
    classes = 'bg-destructive/10 text-destructive border-destructive/20';
  } else if (type === 'Security Alert' || type === 'Restricted Movement') {
    classes = 'bg-missing/10 text-missing border-missing/20';
  } else if (type === 'Drill') {
    classes = 'bg-info/10 text-info border-info/20';
  } else if (type === 'All Clear') {
    classes = 'bg-safe/10 text-safe border-safe/20';
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-md text-xs font-semibold border uppercase tracking-wider", classes, className)}>
      {type}
    </span>
  );
}
