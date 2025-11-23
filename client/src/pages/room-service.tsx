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
import { UtensilsCrossed, Clock, CheckCircle2, MessageCircle, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

interface GuestOrder {
  id: string;
  reservationId: string;
  propertyId: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "completed";
  totalAmount: number;
  specialRequests: string;
  createdAt: string;
  updatedAt: string;
}

interface GuestMessage {
  id: string;
  reservationId: string;
  senderType: "guest" | "staff";
  senderName: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function RoomService() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedOrder, setSelectedOrder] = useState<GuestOrder | null>(null);
  const [messageInput, setMessageInput] = useState("");

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

  // Fetch all guest orders
  const { data: orders = [], isLoading, refetch: refetchOrders } = useQuery<GuestOrder[]>({
    queryKey: ["/api/guest-orders"],
    enabled: isAuthenticated,
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/guest-orders");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch messages for selected order
  const { data: messages = [], refetch: refetchMessages } = useQuery<GuestMessage[]>({
    queryKey: [`/api/guest-messages?reservationId=${selectedOrder?.reservationId}`],
    enabled: !!selectedOrder?.reservationId,
    queryFn: async () => {
      if (!selectedOrder?.reservationId) return [];
      const res = await apiRequest("GET", `/api/guest-messages/${selectedOrder.reservationId}`);
      return Array.isArray(res) ? res : [];
    },
    refetchInterval: 1500, // Auto-refresh every 1.5 seconds
  });

  // Update order status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      await apiRequest("PUT", `/api/guest-orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guest-orders"] });
      toast({
        title: "Success",
        description: "Order status updated",
      });
      refetchOrders();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedOrder) return;
      await apiRequest("POST", "/api/guest-messages", {
        reservationId: selectedOrder.reservationId,
        senderType: "staff",
        senderName: "Staff",
        message,
      });
    },
    onSuccess: () => {
      setMessageInput("");
      refetchMessages();
      toast({
        title: "Success",
        description: "Message sent",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pendingOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedOrders = orders.filter((o) => o.status === "completed");

  if (authLoading || isLoading) {
    return <RoomServiceSkeleton />;
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const renderOrderCard = (order: GuestOrder) => (
    <Card
      key={order.id}
      className="hover-elevate cursor-pointer"
      onClick={() => setSelectedOrder(order)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base">
              Reservation: {order.reservationId}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {format(new Date(order.createdAt), "MMM dd, yyyy hh:mm a")}
            </p>
          </div>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Total Amount:</span>
          <span className="text-lg font-bold">${order.totalAmount.toFixed(2)}</span>
        </div>

        {order.specialRequests && (
          <div>
            <p className="text-sm font-medium mb-1">Special Requests:</p>
            <p className="text-sm text-muted-foreground">{order.specialRequests}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {order.status === "pending" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({
                  orderId: order.id,
                  status: "confirmed",
                });
              }}
              className="flex-1"
              disabled={updateStatusMutation.isPending}
            >
              Confirm
            </Button>
          )}

          {order.status === "confirmed" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({
                  orderId: order.id,
                  status: "preparing",
                });
              }}
              className="flex-1"
              disabled={updateStatusMutation.isPending}
            >
              Start Preparing
            </Button>
          )}

          {order.status === "preparing" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({
                  orderId: order.id,
                  status: "ready",
                });
              }}
              className="flex-1"
              disabled={updateStatusMutation.isPending}
            >
              Mark Ready
            </Button>
          )}

          {order.status === "ready" && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                updateStatusMutation.mutate({
                  orderId: order.id,
                  status: "completed",
                });
              }}
              className="flex-1"
              disabled={updateStatusMutation.isPending}
            >
              Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Room Service Orders</h1>
        <p className="text-muted-foreground mt-1">
          Manage guest orders and communicate with guests in real-time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="pending">
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="preparing">
                Preparing ({preparingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="ready">
                Ready ({readyOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6 space-y-4">
              {pendingOrders.length > 0 ? (
                pendingOrders.map(renderOrderCard)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No pending orders
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preparing" className="mt-6 space-y-4">
              {preparingOrders.length > 0 ? (
                preparingOrders.map(renderOrderCard)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No orders being prepared
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="ready" className="mt-6 space-y-4">
              {readyOrders.length > 0 ? (
                readyOrders.map(renderOrderCard)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No ready orders
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6 space-y-4">
              {completedOrders.length > 0 ? (
                completedOrders.map(renderOrderCard)
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No completed orders
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Messages Panel */}
        <div>
          {selectedOrder ? (
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Messages
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedOrder.reservationId}
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Messages */}
                <ScrollArea className="flex-1 border rounded p-4">
                  <div className="space-y-3">
                    {messages.length > 0 ? (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${
                            msg.senderType === "staff"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs rounded-lg p-3 ${
                              msg.senderType === "staff"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-xs font-medium mb-1">
                              {msg.senderName}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {format(
                                new Date(msg.createdAt),
                                "hh:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-muted-foreground text-sm">
                        No messages yet
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Send message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && messageInput.trim()) {
                        sendMessageMutation.mutate(messageInput);
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (messageInput.trim()) {
                        sendMessageMutation.mutate(messageInput);
                      }
                    }}
                    disabled={
                      !messageInput.trim() ||
                      sendMessageMutation.isPending
                    }
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center text-muted-foreground">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select an order to view and send messages</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-20" />
          </div>
          {[...Array(3)].map((_, i) => (
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
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
