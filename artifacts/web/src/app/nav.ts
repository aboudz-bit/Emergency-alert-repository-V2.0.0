import {
  LayoutDashboard,
  Map,
  Bell,
  CheckSquare,
  Spline,
  Route,
  Users,
  Clock,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  phase: string;
}

// Order = ops priority. `phase` marks which build phase delivers the real page.
export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, phase: "3.1" },
  { to: "/map", label: "Live map", icon: Map, phase: "3.3" },
  { to: "/alerts", label: "Alert center", icon: Bell, phase: "3.4" },
  { to: "/accountability", label: "Accountability", icon: CheckSquare, phase: "3.5" },
  { to: "/streets", label: "Streets", icon: Spline, phase: "3.3" },
  { to: "/routes", label: "Route builder", icon: Route, phase: "3.3" },
  { to: "/personnel", label: "Personnel", icon: Users, phase: "3.3" },
  { to: "/timeline", label: "Incident timeline", icon: Clock, phase: "3.6" },
  { to: "/reports", label: "Reports", icon: BarChart3, phase: "3.7" },
  { to: "/settings", label: "Settings", icon: Settings, phase: "3.8" },
];
