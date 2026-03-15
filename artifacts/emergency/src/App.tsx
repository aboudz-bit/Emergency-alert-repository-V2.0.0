import React from 'react';
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useStore, useShallow } from '@/store';
import type { UserRole } from '@/types';

import NotFound from '@/pages/not-found';
import LoginPage from '@/pages/login';
import ITPage from '@/pages/it/index';
import AdminDashboard from '@/pages/admin/dashboard';
import SendAlert from '@/pages/admin/send-alert';
import AlertMonitor from '@/pages/admin/alert-monitor';
import ZonesPage from '@/pages/admin/zones';
import LocationsPage from '@/pages/admin/locations';
import UsersPage from '@/pages/admin/users';
import HistoryPage from '@/pages/admin/history';
import SettingsPage from '@/pages/admin/settings';
import MobileHome from '@/pages/mobile/home';
import MobileRegister from '@/pages/mobile/register';
import MobileLocationPermission from '@/pages/mobile/location-permission';
import MobileAlert from '@/pages/mobile/alert';
import MobileHistory from '@/pages/mobile/history';
import MobileProfile from '@/pages/mobile/profile';

const queryClient = new QueryClient();

// ─── Route Guard ─────────────────────────────────────────────────────────────

function Guard({
  children,
  allowedRoles,
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
}) {
  const { isAuthenticated, currentUser } = useStore(useShallow(s => ({
    isAuthenticated: s.isAuthenticated,
    currentUser: s.currentUser,
  })));

  if (!isAuthenticated || !currentUser) return <Redirect to="/login" />;
  if (!allowedRoles.includes(currentUser.role)) return <Redirect to={redirectTo} />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={LoginPage} />

      {/* IT-only routes */}
      <Route path="/it">
        <Guard allowedRoles={['IT']} redirectTo="/login">
          <ITPage />
        </Guard>
      </Route>

      {/* Super Admin routes */}
      <Route path="/admin">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <AdminDashboard />
        </Guard>
      </Route>
      <Route path="/admin/send-alert">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <SendAlert />
        </Guard>
      </Route>
      <Route path="/admin/alert-monitor">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <AlertMonitor />
        </Guard>
      </Route>
      <Route path="/admin/zones">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <ZonesPage />
        </Guard>
      </Route>
      <Route path="/admin/locations">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <LocationsPage />
        </Guard>
      </Route>
      <Route path="/admin/users">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <UsersPage />
        </Guard>
      </Route>
      <Route path="/admin/history">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <HistoryPage />
        </Guard>
      </Route>
      <Route path="/admin/settings">
        <Guard allowedRoles={['Super Admin']} redirectTo="/login">
          <SettingsPage />
        </Guard>
      </Route>

      {/* Mobile / User routes — open registration, guarded home/alert */}
      <Route path="/mobile/register" component={MobileRegister} />
      <Route path="/mobile/location-permission" component={MobileLocationPermission} />
      <Route path="/mobile/home">
        <Guard allowedRoles={['User', 'Super Admin', 'IT']} redirectTo="/login">
          <MobileHome />
        </Guard>
      </Route>
      <Route path="/mobile/alert/:id">
        <Guard allowedRoles={['User', 'Super Admin', 'IT']} redirectTo="/login">
          <MobileAlert />
        </Guard>
      </Route>
      <Route path="/mobile/history">
        <Guard allowedRoles={['User', 'Super Admin', 'IT']} redirectTo="/login">
          <MobileHistory />
        </Guard>
      </Route>
      <Route path="/mobile/profile">
        <Guard allowedRoles={['User', 'Super Admin', 'IT']} redirectTo="/login">
          <MobileProfile />
        </Guard>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
