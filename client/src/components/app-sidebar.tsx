// Following design_guidelines.md - Sidebar Navigation
import {
  LayoutDashboard,
  Calendar,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  UtensilsCrossed,
  Settings,
  Key,
  LogOut,
  Pizza,
  FileText,
  QrCode,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    title: "Reservations",
    url: "/reservations",
    icon: Calendar,
    testId: "nav-reservations",
  },
  {
    title: "Guests",
    url: "/guests",
    icon: Users,
    testId: "nav-guests",
  },
  {
    title: "Properties & Rooms",
    url: "/properties",
    icon: Building2,
    testId: "nav-properties",
  },
  {
    title: "Room Service",
    url: "/room-service",
    icon: UtensilsCrossed,
    testId: "nav-room-service",
  },
  {
    title: "Shop Menu",
    url: "/shop-menu",
    icon: Pizza,
    testId: "nav-shop-menu",
  },
  {
    title: "QR Codes",
    url: "/qr-codes",
    icon: QrCode,
    testId: "nav-qr-codes",
  },
  {
    title: "Guest Billing",
    url: "/guest-billing",
    icon: FileText,
    testId: "nav-guest-billing",
  },
  {
    title: "Rate Management",
    url: "/rates",
    icon: DollarSign,
    testId: "nav-rates",
  },
  {
    title: "Revenue Analytics",
    url: "/analytics",
    icon: TrendingUp,
    testId: "nav-analytics",
  },
];

const settingsItems = [
  {
    title: "License & Subscription",
    url: "/subscription",
    icon: Key,
    testId: "nav-subscription",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    testId: "nav-settings",
  },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Hotel PMS</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.profileImageUrl} />
            <AvatarFallback>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full hover-elevate active-elevate-2"
          onClick={() => (window.location.href = "/api/logout")}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
