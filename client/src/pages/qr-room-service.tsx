import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, QrCode, MessageCircle, ShoppingCart, CreditCard, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Textarea } from "@/components/ui/textarea";

export default function GuestRoomServicePage() {
  const { toast } = useToast();
  const [reservationId, setReservationId] = useState<string>("");
  const [showPortal, setShowPortal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto">
        {!showPortal ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-6 h-6" />
                Room Service Portal Access
              </CardTitle>
              <CardDescription>
                Enter your reservation ID or scan a QR code to access room service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Reservation ID</label>
                <Input
                  placeholder="Enter reservation ID from your check-in"
                  value={reservationId}
                  onChange={(e) => setReservationId(e.target.value)}
                />
              </div>

              <Button
                onClick={() => {
                  if (reservationId.trim()) {
                    setShowPortal(true);
                  } else {
                    toast({
                      title: "Error",
                      description: "Please enter a valid reservation ID",
                      variant: "destructive",
                    });
                  }
                }}
                size="lg"
                className="w-full gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Access Room Service
              </Button>

              <div className="text-center text-sm text-slate-600 pt-4 border-t">
                <p>Don't have your ID? Ask the front desk for the QR code sticker in your room</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <RoomServicePortalComplete
            reservationId={reservationId}
            onExit={() => {
              setShowPortal(false);
              setReservationId("");
            }}
          />
        )}
      </div>
    </div>
  );
}

function RoomServicePortalComplete({
  reservationId,
  onExit,
}: {
  reservationId: string;
  onExit: () => void;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("qr");

  // Get reservation details
  const { data: reservation } = useQuery({
    queryKey: [`/api/room-service-access/${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/room-service-access/${reservationId}`);
      return res.json();
    },
  });

  const propertyId = reservation?.propertyId;

  // Generate QR code
  const { data: qrData } = useQuery({
    queryKey: [`/api/room-service-qr/${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/room-service-qr/${reservationId}`);
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Room Service Center</h1>
        <Button variant="outline" onClick={onExit}>
          Back
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="qr">
            <QrCode className="w-4 h-4 mr-2" />
            QR Code
          </TabsTrigger>
          <TabsTrigger value="menu">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Menu
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="billing">
            <CreditCard className="w-4 h-4 mr-2" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your QR Code</CardTitle>
              <CardDescription>
                Share this code to give others access to your room service
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
              {qrData?.qrCode ? (
                <>
                  <img
                    src={qrData.qrCode}
                    alt="Room Service QR Code"
                    className="w-64 h-64 border-4 border-slate-200 rounded-lg shadow-lg"
                  />
                  <p className="text-sm text-slate-600 max-w-md text-center">
                    Others can scan this code to access your room service portal directly
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open(qrData.accessUrl, "_blank");
                    }}
                    className="gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Visit Portal Link
                  </Button>
                </>
              ) : (
                <Loader2 className="w-8 h-8 animate-spin" />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="menu">
          <MenuOrderingTab reservationId={reservationId} propertyId={propertyId} />
        </TabsContent>

        <TabsContent value="messages">
          <MessagingTab reservationId={reservationId} />
        </TabsContent>

        <TabsContent value="billing">
          <BillingCheckoutTab reservationId={reservationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MenuOrderingTab({
  reservationId,
  propertyId,
}: {
  reservationId: string;
  propertyId?: string;
}) {
  const { toast } = useToast();
  const [cart, setCart] = useState<any[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Get menu items
  const { data: menuItems = [] } = useQuery({
    queryKey: [`/api/shop-menu?propertyId=${propertyId}`],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = await apiRequest("GET", `/api/shop-menu?propertyId=${propertyId}`);
      return res.json();
    },
    enabled: !!propertyId,
  });

  // Get guest orders
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: [`/api/guest-orders?reservationId=${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/guest-orders?reservationId=${reservationId}`);
      return res.json();
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) throw new Error("Cart is empty");

      const totalAmount = cart.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
      );

      const res = await apiRequest("POST", "/api/guest-orders", {
        propertyId: orders[0]?.propertyId || propertyId,
        reservationId,
        guestId: orders[0]?.guestId,
        roomId: orders[0]?.roomId,
        orderNumber: `ORD-${Date.now().toString().slice(-8)}`,
        totalAmount: totalAmount.toFixed(2),
        specialInstructions,
        status: "pending",
      });

      const order = await res.json();

      // Add items to order
      for (const item of cart) {
        const itemTotal = Number(item.price) * item.quantity;
        await apiRequest("POST", `/api/guest-orders/${order.id}/items`, {
          menuItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: itemTotal.toFixed(2),
        });
      }

      return order;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order placed! Check your messages for updates.",
      });
      setCart([]);
      setSpecialInstructions("");
      refetchOrders();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredItems =
    selectedCategory === "all"
      ? menuItems
      : menuItems.filter((item: any) => item.category === selectedCategory);

  const categories = ["all", ...new Set(menuItems.map((item: any) => item.category))];

  return (
    <div className="space-y-4 py-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat: any) => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(cat as string)}
            className="capitalize whitespace-nowrap"
          >
            {cat}
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item: any) => (
          <Card key={item.id} className="hover:shadow-lg transition cursor-pointer">
            <CardContent className="p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">{item.name}</h3>
                <p className="text-xs text-slate-600 mt-1">{item.description}</p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  <Badge variant="secondary" className="text-xs capitalize">
                    {item.category}
                  </Badge>
                  {item.preparationTime && (
                    <Badge variant="outline" className="text-xs">
                      {item.preparationTime} min
                    </Badge>
                  )}
                </div>
                <span className="font-bold text-primary">
                  ${Number(item.price).toFixed(2)}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const existing = cart.find((c) => c.id === item.id);
                  if (existing) {
                    setCart(
                      cart.map((c) =>
                        c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
                      )
                    );
                  } else {
                    setCart([...cart, { ...item, quantity: 1 }]);
                  }
                  toast({
                    title: "Added to cart",
                    description: `${item.name} added`,
                  });
                }}
              >
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {cart.length > 0 && (
        <Card className="border-2 border-primary sticky bottom-0 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex justify-between">
              <span>Your Order</span>
              <span className="text-sm text-slate-600">
                {cart.length} {cart.length === 1 ? "item" : "items"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-32 border rounded-md p-3 bg-slate-50">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between mb-2 pr-4">
                  <span className="text-sm">
                    {item.name} x{item.quantity}
                  </span>
                  <span className="text-sm font-medium">
                    ${(Number(item.price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </ScrollArea>

            <div>
              <label className="text-xs font-medium">Special Requests (Optional)</label>
              <Textarea
                placeholder="E.g., No onions, extra sauce..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="mt-1 text-xs h-20"
              />
            </div>

            <div className="flex justify-between items-center text-lg font-bold bg-slate-100 p-3 rounded">
              <span>Total:</span>
              <span>
                ${cart
                  .reduce((sum, item) => sum + Number(item.price) * item.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCart([])}
                size="sm"
              >
                Clear
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => createOrderMutation.mutate()}
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    Place Order
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {orders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {orders.map((order: any) => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-slate-50 rounded">
                <div>
                  <p className="font-medium text-sm">{order.orderNumber}</p>
                  <p className="text-xs text-slate-600">
                    {new Date(order.orderedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-sm">
                    ${Number(order.totalAmount).toFixed(2)}
                  </p>
                  <Badge
                    variant={
                      order.status === "delivered"
                        ? "default"
                        : order.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs capitalize mt-1"
                  >
                    {order.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MessagingTab({ reservationId }: { reservationId: string }) {
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/guest-messages?reservationId=${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/guest-messages?reservationId=${reservationId}`);
      return res.json();
    },
    refetchInterval: 1500,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/guest-messages", {
        propertyId: "",
        reservationId,
        senderId: "guest",
        message: messageText,
        messageType: "text",
      });
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      refetchMessages();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chat with Staff</CardTitle>
          <CardDescription>
            Get real-time updates about your orders and ask questions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-72 border rounded-md p-4 bg-slate-50">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-slate-500 py-8">
                No messages yet. Send one to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === "guest" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === "guest"
                          ? "bg-primary text-white rounded-br-none"
                          : "bg-white border border-slate-200 rounded-bl-none"
                      }`}
                    >
                      <p className="text-xs opacity-75 mb-1">
                        {msg.senderId === "guest" ? "You" : "Staff"}
                      </p>
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-50 mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && messageText.trim()) {
                  sendMessageMutation.mutate();
                }
              }}
              className="text-sm"
            />
            <Button
              size="icon"
              onClick={() => sendMessageMutation.mutate()}
              disabled={!messageText.trim() || sendMessageMutation.isPending}
              className="gap-2"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function BillingCheckoutTab({ reservationId }: { reservationId: string }) {
  const { toast } = useToast();

  const { data: billing, refetch: refetchBilling } = useQuery({
    queryKey: [`/api/guest-billing/${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/guest-billing/${reservationId}`);
      return res.json();
    },
    refetchInterval: 2000,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/checkout/complete", {
        reservationId,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checkout completed! Have a great stay!",
      });
      refetchBilling();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!billing) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const roomCharges = Number(billing.totalRoomCharges || 0);
  const roomServiceCharges = Number(billing.totalRoomServiceCharges || 0);
  const otherCharges = Number(billing.totalOtherCharges || 0);
  const totalAmount = Number(billing.totalAmount || 0);
  const amountPaid = Number(billing.amountPaid || 0);
  const remainingAmount = Number(billing.remainingAmount || 0);

  return (
    <div className="space-y-4 py-4">
      <Card>
        <CardHeader>
          <CardTitle>Billing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Room Charges:</span>
              <span className="font-medium">${roomCharges.toFixed(2)}</span>
            </div>
            {roomServiceCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Room Service:</span>
                <span className="font-medium">${roomServiceCharges.toFixed(2)}</span>
              </div>
            )}
            {otherCharges > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Other Charges:</span>
                <span className="font-medium">${otherCharges.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between font-bold text-lg">
              <span>Total Amount:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between font-semibold text-primary">
              <span>Amount Paid:</span>
              <span>${amountPaid.toFixed(2)}</span>
            </div>

            {remainingAmount > 0 && (
              <div className="flex justify-between font-bold text-lg text-red-600 bg-red-50 p-3 rounded">
                <span>Outstanding:</span>
                <span>${remainingAmount.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {remainingAmount === 0 ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <Badge className="bg-green-600 text-white mb-2">PAID IN FULL</Badge>
              <p className="text-green-700 font-semibold">All charges have been settled!</p>
            </div>
            <Button
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending}
              size="lg"
            >
              {checkoutMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Checkout...
                </>
              ) : (
                <>
                  <LogOut className="w-5 h-5" />
                  Complete Checkout
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6 space-y-4">
            <div className="text-center">
              <p className="text-orange-700 font-semibold mb-3">
                Payment Required Before Checkout
              </p>
              <div className="text-3xl font-bold text-orange-600 mb-4">
                ${remainingAmount.toFixed(2)}
              </div>
            </div>
            <Button
              className="w-full gap-2"
              variant="default"
              size="lg"
            >
              <CreditCard className="w-5 h-5" />
              Pay Now
            </Button>
            <p className="text-xs text-center text-slate-600">
              Contact the front desk or use a registered payment method
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
