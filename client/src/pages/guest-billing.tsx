import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, CreditCard, DollarSign, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface BillingRecord {
  id: string;
  reservationId: string;
  propertyId: string;
  subtotal: number;
  tax: number;
  serviceFee: number;
  totalDue: number;
  amountPaid: number;
  status: "pending" | "partial" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
}

interface GuestBillingDetail extends BillingRecord {
  guestName?: string;
  roomNumber?: string;
  orderCount?: number;
}

export default function GuestBillingPage() {
  const { toast } = useToast();
  const [selectedBilling, setSelectedBilling] = useState<GuestBillingDetail | null>(null);

  // Fetch all guest billings
  const { data: billings, isLoading, error } = useQuery<GuestBillingDetail[]>({
    queryKey: ["/api/guest-billing"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/guest-billing");
      if (!Array.isArray(res)) return [];
      return res;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">Error loading billing records</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingBillings = billings?.filter(b => b.status === "pending" || b.status === "partial") || [];
  const paidBillings = billings?.filter(b => b.status === "paid") || [];
  const overdueBillings = billings?.filter(b => b.status === "overdue") || [];

  const totalOutstanding = billings?.reduce((sum, b) => {
    if (b.status !== "paid") {
      return sum + Math.max(0, b.totalDue - b.amountPaid);
    }
    return sum;
  }, 0) || 0;

  const totalCollected = billings?.reduce((sum, b) => sum + b.amountPaid, 0) || 0;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      partial: "bg-blue-100 text-blue-800",
      paid: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "pending":
      case "partial":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Guest Billing Management</h1>
        <p className="text-muted-foreground mt-2">Track and manage guest billing records</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-2xl font-bold">${totalCollected.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <div className="text-2xl font-bold">{billings?.length || 0}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All ({billings?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingBillings.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({paidBillings.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdueBillings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {billings && billings.length > 0 ? (
            <div className="grid gap-4">
              {billings.map((billing) => (
                <Card key={billing.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedBilling(billing)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">
                            Reservation: {billing.reservationId}
                          </CardTitle>
                          <Badge className={getStatusColor(billing.status)}>
                            {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(billing.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      {getStatusIcon(billing.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Subtotal</p>
                        <p className="text-lg font-semibold">${billing.subtotal.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tax</p>
                        <p className="text-lg font-semibold">${billing.tax.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Due</p>
                        <p className="text-lg font-semibold">${billing.totalDue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Paid</p>
                        <p className="text-lg font-semibold text-green-600">${billing.amountPaid.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No billing records found
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {pendingBillings.length > 0 ? (
            <div className="grid gap-4">
              {pendingBillings.map((billing) => (
                <Card key={billing.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedBilling(billing)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Reservation: {billing.reservationId}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(billing.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Due</p>
                        <p className="text-lg font-semibold">${billing.totalDue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Amount Paid</p>
                        <p className="text-lg font-semibold">${billing.amountPaid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Outstanding</p>
                        <p className="text-lg font-semibold text-red-600">${Math.max(0, billing.totalDue - billing.amountPaid).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No pending billing records
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="paid" className="space-y-4">
          {paidBillings.length > 0 ? (
            <div className="grid gap-4">
              {paidBillings.map((billing) => (
                <Card key={billing.id} className="hover-elevate cursor-pointer" onClick={() => setSelectedBilling(billing)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">Reservation: {billing.reservationId}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(billing.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">${billing.totalDue.toFixed(2)}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No paid billing records
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          {overdueBillings.length > 0 ? (
            <div className="grid gap-4">
              {overdueBillings.map((billing) => (
                <Card key={billing.id} className="hover-elevate cursor-pointer border-red-200 bg-red-50" onClick={() => setSelectedBilling(billing)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base text-red-900">Reservation: {billing.reservationId}</CardTitle>
                        <p className="text-sm text-red-700 mt-1">
                          {format(new Date(billing.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-red-700">Total Due</p>
                        <p className="text-lg font-semibold text-red-900">${billing.totalDue.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-700">Amount Paid</p>
                        <p className="text-lg font-semibold">${billing.amountPaid.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-red-700">Overdue Amount</p>
                        <p className="text-lg font-semibold text-red-600">${Math.max(0, billing.totalDue - billing.amountPaid).toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No overdue billing records
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Detail Modal */}
      {selectedBilling && (
        <Card className="mt-8 border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle>Billing Details</CardTitle>
            <CardDescription>
              Reservation: {selectedBilling.reservationId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-2xl font-bold">${selectedBilling.subtotal.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tax</p>
                <p className="text-2xl font-bold">${selectedBilling.tax.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Service Fee</p>
                <p className="text-2xl font-bold">${selectedBilling.serviceFee.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold text-primary">${selectedBilling.totalDue.toFixed(2)}</p>
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold">Amount Paid</p>
                <p className="text-2xl font-bold text-green-600">${selectedBilling.amountPaid.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center bg-muted p-3 rounded">
                <p className="text-lg font-semibold">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">
                  ${Math.max(0, selectedBilling.totalDue - selectedBilling.amountPaid).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Badge className={getStatusColor(selectedBilling.status)}>
                {selectedBilling.status.charAt(0).toUpperCase() + selectedBilling.status.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Created: {format(new Date(selectedBilling.createdAt), "MMM dd, yyyy hh:mm a")}
              </p>
            </div>

            <Button variant="outline" onClick={() => setSelectedBilling(null)} className="w-full">
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
