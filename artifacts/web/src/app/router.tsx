import { createBrowserRouter, Navigate } from "react-router-dom";
import { Shell } from "@/app/Shell";
import { LoginPage } from "@/pages/Login";
import { DashboardPage } from "@/pages/Dashboard";
import { LiveMapPage } from "@/pages/LiveMap";
import { AlertCenterPage } from "@/pages/AlertCenter";
import { AccountabilityCenterPage } from "@/pages/AccountabilityCenter";
import { PersonnelCenterPage } from "@/pages/PersonnelCenter";
import { StreetsRoutesPage } from "@/pages/StreetsRoutes";
import { ReportsCenterPage } from "@/pages/ReportsCenter";
import { SettingsCenterPage } from "@/pages/SettingsCenter";
import { TimelinePage } from "@/pages/Timeline";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "map", element: <LiveMapPage /> },
      { path: "alerts", element: <AlertCenterPage /> },
      { path: "accountability", element: <AccountabilityCenterPage /> },
      { path: "streets", element: <StreetsRoutesPage initialTab="streets" /> },
      { path: "routes", element: <StreetsRoutesPage initialTab="routes" /> },
      { path: "personnel", element: <PersonnelCenterPage /> },
      { path: "timeline", element: <TimelinePage /> },
      { path: "reports", element: <ReportsCenterPage /> },
      { path: "settings", element: <SettingsCenterPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);
