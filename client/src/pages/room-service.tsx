import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UtensilsCrossed, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { RoomServiceRequest, Room, Guest } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function RoomService() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");

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

  const { data: requests, isLoading } = useQuery<(RoomServiceRequest & { room: Room; guest: Guest })[]>({
    queryKey: ["/api/room-service"],
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await apiRequest("PATCH", `/api/room-service/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-service"] });
      toast({
        title: "Success",
        description: "Request status updated",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingRequests = requests?.filter((r) => r.status === "pending" || r.status === "confirmed") || [];
  const inProgressRequests = requests?.filter((r) => r.status === "in_progress") || [];
  const completedRequests = requests?.filter((r) => r.status === "completed") || [];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: "bg-red-500",
      high: "bg-orange-500",
      normal: "bg-blue-500",
      low: "bg-gray-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  if (authLoading || isLoading) {
    return <RoomServiceSkeleton />;
  }

  const renderRequest = (request: RoomServiceRequest & { room: Room; guest: Guest }) => (
    <Card key={request.id} className="hover-elevate" data-testid={`card-request-${request.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <UtensilsCrossed className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <CardTitle className="text-base">
                Room {request.room.roomNumber}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {request.guest.firstName} {request.guest.lastName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(request.priority)} data-testid={`badge-priority-${request.priority}`}>
              {request.priority}
            </Badge>
            <Badge variant="outline" data-testid={`badge-status-${request.status}`}>
              {request.status.replace("_", " ")}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-sm font-medium mb-2">Items:</p>
          <div className="space-y-1">
            {Array.isArray(request.items) && request.items.length > 0 ? (
              (request.items as any[]).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span>
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-muted-foreground">${Number(item.price).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No items</p>
            )}
          </div>
        </div>

        {request.specialInstructions && (
          <div>
            <p className="text-sm font-medium mb-1">Special Instructions:</p>
            <p className="text-sm text-muted-foreground">{request.specialInstructions}</p>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          {format(new Date(request.requestedAt), "MMM dd, yyyy 'at' h:mm a")}
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm font-medium">Total:</span>
          <span className="text-lg font-bold">${Number(request.totalAmount).toFixed(2)}</span>
        </div>

        {request.status === "pending" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: request.id, status: "in_progress" })}
              disabled={updateStatusMutation.isPending}
              className="flex-1 hover-elevate active-elevate-2"
              data-testid="button-start"
            >
              Start Processing
            </Button>
          </div>
        )}

        {request.status === "confirmed" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: request.id, status: "in_progress" })}
              disabled={updateStatusMutation.isPending}
              className="flex-1 hover-elevate active-elevate-2"
              data-testid="button-start"
            >
              Start Processing
            </Button>
          </div>
        )}

        {request.status === "in_progress" && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              onClick={() => updateStatusMutation.mutate({ id: request.id, status: "completed" })}
              disabled={updateStatusMutation.isPending}
              className="flex-1 hover-elevate active-elevate-2"
              data-testid="button-complete"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-page-title">
          Room Service
        </h1>
        <p className="text-muted-foreground mt-1">Manage guest requests and orders</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="in-progress" data-testid="tab-in-progress">
            In Progress
            {inProgressRequests.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {inProgressRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRequests.length > 0 ? (
              pendingRequests.map(renderRequest)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgressRequests.length > 0 ? (
              inProgressRequests.map(renderRequest)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No requests in progress</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedRequests.length > 0 ? (
              completedRequests.map(renderRequest)
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <XCircle className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No completed requests</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RoomServiceSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
