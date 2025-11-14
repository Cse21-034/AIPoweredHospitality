import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Bed,
  AlertCircle,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { License } from "@shared/schema";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect if not authenticated - following blueprint pattern
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: stats, isLoading: statsLoading } = useQuery<{
    todayArrivals: number;
    todayDepartures: number;
    currentOccupancy: number;
    totalRevenue: number;
    pendingRoomService: number;
    availableRooms: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: license } = useQuery<License>({
    queryKey: ["/api/license/current"],
    enabled: isAuthenticated,
  });

  if (authLoading) {
    return <DashboardSkeleton />;
  }

  const isTrialExpiringSoon = license?.subscriptionStatus === "trial" && 
    license?.trialEndsAt && 
    new Date(license.trialEndsAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

  const isExpired = license?.subscriptionStatus === "expired";

  return (
    <div className="p-6 space-y-6">
      {/* License Status Banner */}
      {isTrialExpiringSoon && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20" data-testid="banner-trial-expiring">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-base text-amber-900 dark:text-amber-100">
                  Trial Ending Soon
                </CardTitle>
                <CardDescription className="text-amber-800 dark:text-amber-200">
                  Your 3-month trial expires on{" "}
                  {new Date(license?.trialEndsAt!).toLocaleDateString()}. Subscribe to continue using all features.
                </CardDescription>
              </div>
              <a
                href="/subscription"
                className="text-sm font-medium text-amber-900 dark:text-amber-100 underline hover:no-underline"
                data-testid="link-subscribe"
              >
                Subscribe Now
              </a>
            </div>
          </CardHeader>
        </Card>
      )}

      {isExpired && (
        <Card className="border-destructive bg-destructive/10" data-testid="banner-subscription-expired">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <CardTitle className="text-base text-destructive">
                  Subscription Expired
                </CardTitle>
                <CardDescription className="text-destructive/90">
                  Your subscription has expired. AI features and advanced reports are disabled. Renew to restore full access.
                </CardDescription>
              </div>
              <a
                href="/subscription"
                className="text-sm font-medium text-destructive underline hover:no-underline"
                data-testid="link-renew"
              >
                Renew Now
              </a>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your property overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover-elevate" data-testid="card-stat-arrivals">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Arrivals</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-arrivals">{stats?.todayArrivals || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Check-ins expected</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-stat-departures">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Departures</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-departures">{stats?.todayDepartures || 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Check-outs today</p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-stat-occupancy">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Occupancy</CardTitle>
            <Bed className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-occupancy">{stats?.currentOccupancy || 0}%</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.availableRooms || 0} rooms available
            </p>
          </CardContent>
        </Card>

        <Card className="hover-elevate" data-testid="card-stat-revenue">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold" data-testid="text-revenue">
                ${(stats?.totalRevenue || 0).toLocaleString()}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">All bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Room Service Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="card-room-service">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Room Service</CardTitle>
                <CardDescription>Requests awaiting attention</CardDescription>
              </div>
              {stats && stats.pendingRoomService > 0 && (
                <Badge variant="destructive" data-testid="badge-pending-count">
                  {stats.pendingRoomService}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : stats?.pendingRoomService === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">All requests handled!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <a
                  href="/room-service"
                  className="block p-3 rounded-lg border hover-elevate active-elevate-2"
                  data-testid="link-view-room-service"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">View All Requests</span>
                    <Badge>{stats?.pendingRoomService}</Badge>
                  </div>
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="card-quick-actions">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href="/reservations?action=new"
              className="flex items-center gap-3 p-3 rounded-lg border hover-elevate active-elevate-2"
              data-testid="link-new-reservation"
            >
              <Calendar className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">New Reservation</span>
            </a>
            <a
              href="/guests?action=new"
              className="flex items-center gap-3 p-3 rounded-lg border hover-elevate active-elevate-2"
              data-testid="link-new-guest"
            >
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Add Guest</span>
            </a>
            <a
              href="/analytics"
              className="flex items-center gap-3 p-3 rounded-lg border hover-elevate active-elevate-2"
              data-testid="link-view-analytics"
            >
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">View Analytics</span>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32 mt-1" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
