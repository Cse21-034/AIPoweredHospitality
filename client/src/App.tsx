// Following javascript_log_in_with_replit blueprint and design_guidelines.md
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";

// Pages
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import Reservations from "@/pages/reservations";
import Guests from "@/pages/guests";
import Properties from "@/pages/properties";
import RoomService from "@/pages/room-service";
import Rates from "@/pages/rates";
import Analytics from "@/pages/analytics";
import Subscription from "@/pages/subscription";
import Settings from "@/pages/settings";
import ShopMenu from "@/pages/shop-menu";
import RoomServicePortal from "@/pages/room-service-portal";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/signup" component={Signup} />
        </>
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/reservations" component={Reservations} />
          <Route path="/guests" component={Guests} />
          <Route path="/properties" component={Properties} />
          <Route path="/room-service" component={RoomService} />
          <Route path="/shop-menu" component={ShopMenu} />
          <Route path="/room-service-portal/:reservationId" component={RoomServicePortal} />
          <Route path="/rates" component={Rates} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/settings" component={Settings} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Following design_guidelines.md - sidebar width configuration
  const style = {
    "--sidebar-width": "15rem", // 240px for better navigation
    "--sidebar-width-icon": "4rem", // default icon width
  };

  if (isLoading || !isAuthenticated) {
    return (
      <>
        <Toaster />
        <Router />
      </>
    );
  }

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
