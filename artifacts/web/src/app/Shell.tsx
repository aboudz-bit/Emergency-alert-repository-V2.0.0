import { NavLink, Outlet } from "react-router-dom";
import { ShieldAlert, AlertTriangle, Clock } from "lucide-react";
import { NAV_ITEMS } from "@/app/nav";
import { cn } from "@/lib/cn";

// App shell: left nav rail + top incident status bar + routed content.
// (Active-alert data + role come from the API in Phase 3.2; static placeholder now.)
export function Shell() {
  return (
    <div className="flex h-full">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--keas-border)] bg-[var(--keas-surface)]">
        <div className="flex items-center gap-2 px-4 py-4 border-b border-[var(--keas-border)]">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-md"
            style={{ background: "var(--keas-primary)" }}
          >
            <ShieldAlert size={18} color="#fff" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-medium">KEAS</div>
            <div className="text-xs text-[var(--keas-text-secondary)]">Command center</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "mx-2 mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                  isActive
                    ? "bg-[var(--keas-primary-dim)] text-[var(--keas-primary)] font-medium"
                    : "text-[var(--keas-text-secondary)] hover:bg-[var(--keas-surface-2)]",
                )
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--keas-border)] px-4 py-3 text-xs text-[var(--keas-text-tertiary)]">
          KEAS web · v0.1 (Phase 3.1)
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className="flex items-center gap-3 px-4 py-2.5"
          style={{ background: "rgba(220,38,38,0.08)" }}
        >
          <AlertTriangle size={18} color="var(--keas-danger)" />
          <span className="text-sm font-medium" style={{ color: "var(--keas-danger)" }}>
            Zone alert — CPF · Zone A
          </span>
          <span className="text-xs" style={{ color: "var(--keas-danger)", opacity: 0.85 }}>
            high · 3 min ago
          </span>
          <span className="ml-auto flex items-center gap-1 text-xs text-[var(--keas-text-secondary)]">
            <Clock size={14} /> live · Super Admin
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
