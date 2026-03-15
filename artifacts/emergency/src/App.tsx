import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LoginPage from "@/pages/login";
import ITPage from "@/pages/it/index";
import AdminDashboard from "@/pages/admin/dashboard";
import SendAlert from "@/pages/admin/send-alert";
import AlertMonitor from "@/pages/admin/alert-monitor";
import ZonesPage from "@/pages/admin/zones";
import LocationsPage from "@/pages/admin/locations";
import UsersPage from "@/pages/admin/users";
import HistoryPage from "@/pages/admin/history";
import SettingsPage from "@/pages/admin/settings";
import MobileHome from "@/pages/mobile/home";
import MobileRegister from "@/pages/mobile/register";
import MobileLocationPermission from "@/pages/mobile/location-permission";
import MobileAlert from "@/pages/mobile/alert";
import MobileHistory from "@/pages/mobile/history";
import MobileProfile from "@/pages/mobile/profile";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/login" />} />
      <Route path="/login" component={LoginPage} />
      <Route path="/it" component={ITPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/send-alert" component={SendAlert} />
      <Route path="/admin/alert-monitor" component={AlertMonitor} />
      <Route path="/admin/zones" component={ZonesPage} />
      <Route path="/admin/locations" component={LocationsPage} />
      <Route path="/admin/users" component={UsersPage} />
      <Route path="/admin/history" component={HistoryPage} />
      <Route path="/admin/settings" component={SettingsPage} />
      <Route path="/mobile/register" component={MobileRegister} />
      <Route path="/mobile/location-permission" component={MobileLocationPermission} />
      <Route path="/mobile/home" component={MobileHome} />
      <Route path="/mobile/alert/:id" component={MobileAlert} />
      <Route path="/mobile/history" component={MobileHistory} />
      <Route path="/mobile/profile" component={MobileProfile} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
