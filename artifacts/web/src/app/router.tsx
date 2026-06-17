import { createBrowserRouter, Navigate } from "react-router-dom";
import { Shell } from "@/app/Shell";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { LiveMapPage } from "@/pages/LiveMap";
import { Placeholder } from "@/pages/Placeholder";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "map", element: <LiveMapPage /> },
      { path: "alerts", element: <Placeholder title="Alert center" phase="3.4" /> },
      { path: "accountability", element: <Placeholder title="Accountability" phase="3.5" /> },
      { path: "streets", element: <Placeholder title="Streets" phase="3.3" /> },
      { path: "routes", element: <Placeholder title="Route builder" phase="3.3" /> },
      { path: "personnel", element: <Placeholder title="Personnel tracking" phase="3.3" /> },
      { path: "timeline", element: <Placeholder title="Incident timeline" phase="3.6" /> },
      { path: "reports", element: <Placeholder title="Reports" phase="3.7" /> },
      { path: "settings", element: <Placeholder title="Settings" phase="3.8" /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
