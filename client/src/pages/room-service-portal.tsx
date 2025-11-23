import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Send, Clock, Check, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface ShopMenuItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string | number;
  image?: string;
  isAvailable: boolean;
  preparationTime?: number;
}

interface GuestOrder {
  id: string;
  orderNumber: string;
  totalAmount: string;
  status: string;
  items: any[];
}

interface Message {
  id: string;
  message: string;
  senderId: string;
  createdAt: string;
  messageType?: string;
}

interface RoomServicePortalProps {
  params: { reservationId: string };
}

export default function RoomServicePortal({ params }: RoomServicePortalProps) {
  const { reservationId } = params;
  const { toast } = useToast();

  const [cart, setCart] = useState<{ menuItemId: string; quantity: number; item?: ShopMenuItem }[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [messageText, setMessageText] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");

  if (!reservationId) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Invalid room access. Please scan the QR code again.</p>
      </div>
    );
  }

  // Get reservation details
  const { data: reservation } = useQuery({
    queryKey: [`/api/reservations/${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/reservations/${reservationId}`);
      return res.json();
    },
  });

  // Get property ID from reservation
  const propertyId = reservation?.propertyId;

  // Get shop menu items
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

  // Get messages
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: [`/api/guest-messages?reservationId=${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/guest-messages?reservationId=${reservationId}`);
      return res.json();
    },
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  // Get billing
  const { data: billing } = useQuery({
    queryKey: [`/api/guest-billing/${reservationId}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/guest-billing/${reservationId}`);
      return res.json();
    },
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (cart.length === 0) {
        throw new Error("Cart is empty");
      }

      const totalAmount = cart.reduce((sum, item) => sum + (Number(item.item?.price) * item.quantity), 0);
      const orderNumber = `ORD-${Date.now()}`;

      const res = await apiRequest("POST", "/api/guest-orders", {
        propertyId,
        reservationId,
        guestId: reservation?.guestId,
        roomId: reservation?.roomId,
        orderNumber,
        totalAmount: totalAmount.toString(),
        specialInstructions,
        status: "pending",
      });

      const order = await res.json();

      // Add order items
      for (const cartItem of cart) {
        const itemTotal = Number(cartItem.item?.price) * cartItem.quantity;
        await apiRequest("POST", `/api/guest-orders/${order.id}/items`, {
          menuItemId: cartItem.menuItemId,
          quantity: cartItem.quantity,
          unitPrice: cartItem.item?.price,
          totalPrice: itemTotal,
        });
      }

      return order;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Order placed successfully!",
      });
      setCart([]);
      setSpecialInstructions("");
      setCartOpen(false);
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/guest-messages", {
        propertyId,
        reservationId,
        orderId: selectedOrderId || null,
        senderId: reservation?.guestId,
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

  const addToCart = (item: ShopMenuItem) => {
    const existingItem = cart.find((c) => c.menuItemId === item.id);
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart([...cart, { menuItemId: item.id, quantity: 1, item }]);
    }
  };

  const removeFromCart = (menuItemId: string) => {
    setCart(cart.filter((c) => c.menuItemId !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.item?.price) * item.quantity), 0);
  const groupedItems = menuItems.reduce((acc: any, item: ShopMenuItem) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Room Service</h1>
          <p className="text-sm text-gray-600">Room {reservation?.roomNumber}</p>
        </div>
        <div className="relative">
          <Button
            size="lg"
            variant="outline"
            onClick={() => setCartOpen(!cartOpen)}
            className="relative"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs defaultValue="menu" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          {/* Menu Tab */}
          <TabsContent value="menu" className="mt-4 space-y-4">
            {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold capitalize mb-3 text-gray-700">
                  {category === "food" && "🍽️"}
                  {category === "beverage" && "🥤"}
                  {category === "snacks" && "🍿"}
                  {category === "other" && "📦"} {category}
                </h2>
                <div className="space-y-3">
                  {items.map((item: ShopMenuItem) => (
                    <Card
                      key={item.id}
                      className={`p-4 cursor-pointer transition ${
                        !item.isAvailable ? "opacity-50" : "hover:shadow-md"
                      }`}
                      onClick={() => item.isAvailable && addToCart(item)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600">{item.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ${Number(item.price).toFixed(2)}
                          </p>
                          {item.preparationTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 justify-end mt-1">
                              <Clock className="w-3 h-3" /> {item.preparationTime} min
                            </p>
                          )}
                        </div>
                      </div>
                      {!item.isAvailable && (
                        <Badge variant="destructive">Unavailable</Badge>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-4 space-y-4">
            {orders.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                <p>No orders yet. Browse the menu and place your first order!</p>
              </Card>
            ) : (
              orders.map((order: GuestOrder) => (
                <Card
                  key={order.id}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedOrderId(order.id);
                    const tab = document.querySelector(
                      'button[value="chat"]'
                    ) as HTMLButtonElement;
                    tab?.click();
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                        {order.status}
                      </Badge>
                      <p className="text-lg font-bold mt-1">
                        ${Number(order.totalAmount).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t text-sm text-gray-600">
                      {order.items.map((item: any) => (
                        <p key={item.id}>
                          {item.quantity}x {item.menuItemName}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-4 space-y-4">
            {/* Billing Summary */}
            {billing && (
              <Card className="p-4 bg-blue-50">
                <h3 className="font-semibold mb-2">Current Charges</h3>
                <div className="space-y-1 text-sm">
                  <p>Room: ${Number(billing.totalRoomCharges).toFixed(2)}</p>
                  <p>Room Service: ${Number(billing.totalRoomServiceCharges).toFixed(2)}</p>
                  <p className="font-bold border-t pt-1 mt-1">
                    Total Due: ${Number(billing.remainingAmount).toFixed(2)}
                  </p>
                  <Badge className="mt-2">
                    Status: {billing.paymentStatus}
                  </Badge>
                </div>
              </Card>
            )}

            {/* Messages */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Chat with Staff</h3>
              <ScrollArea className="h-64 border rounded-lg p-3 mb-3">
                <div className="space-y-3">
                  {messages.map((msg: Message) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.senderId === reservation?.guestId ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-xs px-3 py-2 rounded-lg ${
                          msg.senderId === reservation?.guestId
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      sendMessageMutation.mutate();
                    }
                  }}
                />
                <Button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={!messageText || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <Dialog open={cartOpen} onOpenChange={setCartOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Shopping Cart</DialogTitle>
              <DialogDescription>Review your order</DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-64 border rounded-lg p-4 mb-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500">Cart is empty</p>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="flex justify-between items-start pb-2 border-b">
                      <div className="flex-1">
                        <p className="font-semibold">{item.item?.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity}x ${Number(item.item?.price).toFixed(2)} each
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          ${(Number(item.item?.price) * item.quantity).toFixed(2)}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFromCart(item.menuItemId)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Special Instructions */}
            <div>
              <label className="text-sm font-semibold">Special Instructions (optional)</label>
              <Input
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., No onions, extra sauce..."
                className="mt-1"
              />
            </div>

            {/* Total */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Subtotal</p>
              <p className="text-2xl font-bold">${cartTotal.toFixed(2)}</p>
            </div>

            <Button
              onClick={() => createOrderMutation.mutate()}
              disabled={cart.length === 0 || createOrderMutation.isPending}
              className="w-full"
              size="lg"
            >
              {createOrderMutation.isPending ? "Placing Order..." : "Place Order"}
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
