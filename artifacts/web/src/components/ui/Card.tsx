import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({
  children,
  className,
  title,
  icon,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className={cn(
        // radius/padding mirror mobile Card (BorderRadius.lg=12, Spacing.lg=18)
        "rounded-[var(--keas-radius-lg)] border border-[var(--keas-border)] bg-[var(--keas-surface)] p-[var(--keas-space-lg)]",
        className,
      )}
    >
      {title && (
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--keas-text)]">
          {icon}
          <span>{title}</span>
        </div>
      )}
      {children}
    </div>
  );
}
