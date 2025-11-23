import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TrendingUp, Users, DollarSign, Home, CheckCircle, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [metrics, setMetrics] = useState({ totalRevenue: 0, avgNightlyRate: 0, bookingCount: 0 });

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

  const { data: properties } = useQuery<any[]>({
    queryKey: ["/api/properties"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (properties && properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0].id);
    }
  }, [properties, selectedProperty]);

  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard-stats", selectedProperty],
    enabled: isAuthenticated && !!selectedProperty,
    queryFn: async () => {
      return await apiRequest("GET", `/api/dashboard-stats?propertyId=${selectedProperty}`);
    },
  });

  const { data: reservations } = useQuery<any[]>({
    queryKey: ["/api/reservations", selectedProperty],
    enabled: isAuthenticated && !!selectedProperty,
    queryFn: async () => {
      return await apiRequest("GET", `/api/reservations?propertyId=${selectedProperty}`);
    },
  });

  useEffect(() => {
    if (Array.isArray(reservations) && reservations.length > 0) {
      const totalRevenue = reservations.reduce((sum, r) => sum + parseFloat(r.totalAmount || 0), 0);
      const bookingCount = reservations.length;
      const avgNightlyRate = bookingCount > 0 
        ? reservations.reduce((sum, r) => sum + parseFloat(r.ratePerNight || 0), 0) / bookingCount 
        : 0;

      setMetrics({ totalRevenue, avgNightlyRate, bookingCount });
    } else {
      setMetrics({ totalRevenue: 0, avgNightlyRate: 0, bookingCount: 0 });
    }
  }, [reservations]);

  if (authLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-semibold">Revenue Analytics</h1>
        </div>
        <p className="text-muted-foreground">Track occupancy, revenue, and booking metrics</p>
      </div>

      <div className="w-full max-w-xs">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger>
            <SelectValue placeholder="Select property" />
          </SelectTrigger>
          <SelectContent>
            {properties?.map((prop) => (
              <SelectItem key={prop.id} value={prop.id}>
                {prop.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                <p className="text-xs text-muted-foreground">From {metrics.bookingCount} bookings</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Nightly Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">${metrics.avgNightlyRate.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per night average</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{metrics.bookingCount}</div>
                <p className="text-xs text-muted-foreground">All reservations</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.currentOccupancy || 0}%</div>
                <p className="text-xs text-muted-foreground">Current occupancy</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reservation Status Breakdown</CardTitle>
          <CardDescription>View status distribution of all reservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Confirmed</span>
                  </div>
                  <Badge variant="default">
                    {reservations?.filter(r => r.status === "confirmed").length || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Home className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Checked In</span>
                  </div>
                  <Badge variant="outline" className="bg-blue-50">
                    {reservations?.filter(r => r.status === "checked_in").length || 0}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="font-medium">Pending/No-show</span>
                  </div>
                  <Badge variant="outline" className="bg-orange-50">
                    {reservations?.filter(r => r.status === "pending" || r.status === "no_show").length || 0}
                  </Badge>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Today's Activity</CardTitle>
          <CardDescription>Check-ins and check-outs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <>
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Expected Arrivals</span>
                  <span className="text-lg font-bold">{stats?.todayArrivals || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span className="font-medium">Expected Departures</span>
                  <span className="text-lg font-bold">{stats?.todayDepartures || 0}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
