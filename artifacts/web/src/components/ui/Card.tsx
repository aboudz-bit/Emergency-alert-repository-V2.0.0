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
        "rounded-xl border border-[var(--keas-border)] bg-[var(--keas-surface)] p-4",
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
