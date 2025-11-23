// Following javascript_log_in_with_replit blueprint and design_guidelines.md
import { Switch, Route, useLocation } from "wouter";
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
import GuestBilling from "@/pages/guest-billing";
import QRCodes from "@/pages/qr-codes";
import RoomServicePortal from "@/pages/room-service-portal";
import GuestRoomService from "@/pages/qr-room-service";
import NotFound from "@/pages/not-found";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/guests" component={Guests} />
      <Route path="/properties" component={Properties} />
      <Route path="/room-service" component={RoomService} />
      <Route path="/shop-menu" component={ShopMenu} />
      <Route path="/guest-billing" component={GuestBilling} />
      <Route path="/qr-codes" component={QRCodes} />
      <Route path="/room-service-portal/:reservationId" component={RoomServicePortal} />
      <Route path="/rates" component={Rates} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route component={NotFound} />
    </Switch>
  );
}

function GuestPortalRouter() {
  return (
    <Switch>
      <Route path="/room-service/:reservationId" component={GuestRoomService} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  // Following design_guidelines.md - sidebar width configuration
  const style = {
    "--sidebar-width": "15rem", // 240px for better navigation
    "--sidebar-width-icon": "4rem", // default icon width
  };

  // Check if on guest portal (no sidebar needed)
  const isGuestPortal = location.startsWith("/room-service/") && location.split("/").length === 3;

  if (isLoading) {
    return (
      <>
        <Toaster />
        <div className="flex items-center justify-center h-screen">Loading...</div>
      </>
    );
  }

  // Guest portal - no sidebar, no auth required
  if (isGuestPortal) {
    return (
      <>
        <GuestPortalRouter />
        <Toaster />
      </>
    );
  }

  // Not authenticated - show public pages
  if (!isAuthenticated) {
    return (
      <>
        <Toaster />
        <PublicRouter />
      </>
    );
  }

  // Authenticated - show sidebar + protected pages
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
            <AuthenticatedRouter />
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
