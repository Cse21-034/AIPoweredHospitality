import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Plus, Search, Filter } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReservationSchema, type Reservation, type Guest, type RoomType } from "../../../shared/schema";
import { z } from "zod";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const reservationFormSchema = insertReservationSchema.extend({
  guestName: z.string().optional(),
});

// Helper function to calculate nights
function calculateNights(checkIn: string | undefined, checkOut: string | undefined): number {
  if (!checkIn || !checkOut) return 0;
  
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  checkInDate.setHours(0, 0, 0, 0);
  checkOutDate.setHours(0, 0, 0, 0);
  
  const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
  const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
  
  return Math.max(0, nights);
}

export default function Reservations() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [calculatedNights, setCalculatedNights] = useState(0);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [availableRooms, setAvailableRooms] = useState<number>(0);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

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

  const { data: reservations, isLoading } = useQuery<(Reservation & { guest: Guest; roomType: RoomType })[]>({
    queryKey: ["/api/reservations"],
    enabled: isAuthenticated,
  });

  const { data: properties } = useQuery<any[]>({
    queryKey: ["/api/properties"],
    enabled: isAuthenticated,
  });

  const { data: guests } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
    enabled: isAuthenticated,
  });

  const { data: roomTypes } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
    enabled: isAuthenticated,
  });

  const form = useForm<z.infer<typeof reservationFormSchema>>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      status: "confirmed",
      numberOfGuests: 1,
      bookingSource: "direct",
    },
  });

  // Watch for date and rate changes to auto-calculate
  const watchCheckIn = form.watch("checkInDate");
  const watchCheckOut = form.watch("checkOutDate");
  const watchRatePerNight = form.watch("ratePerNight");
  const watchPropertyId = form.watch("propertyId");
  const watchRoomTypeId = form.watch("roomTypeId");

  useEffect(() => {
    const nights = calculateNights(watchCheckIn, watchCheckOut);
    setCalculatedNights(nights);

    if (watchRatePerNight && nights > 0) {
      const rate = parseFloat(watchRatePerNight.toString());
      const total = rate * nights;
      setCalculatedTotal(total);
      form.setValue("totalAmount", total as any);
    } else {
      setCalculatedTotal(0);
    }
  }, [watchCheckIn, watchCheckOut, watchRatePerNight, form]);

  // Check room availability when dates are selected
  useEffect(() => {
    const checkAvailability = async () => {
      if (!watchPropertyId || !watchRoomTypeId || !watchCheckIn || !watchCheckOut) {
        setAvailableRooms(0);
        return;
      }

      setIsCheckingAvailability(true);
      try {
        const response = await apiRequest("POST", "/api/reservations/check-availability", {
          propertyId: watchPropertyId,
          roomTypeId: watchRoomTypeId,
          checkInDate: watchCheckIn,
          checkOutDate: watchCheckOut,
        });

        if (response.availableRooms) {
          setAvailableRooms(response.availableRooms.length);
        }
      } catch (error) {
        console.error("Error checking availability:", error);
        setAvailableRooms(0);
      } finally {
        setIsCheckingAvailability(false);
      }
    };

    checkAvailability();
  }, [watchPropertyId, watchRoomTypeId, watchCheckIn, watchCheckOut]);

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reservationFormSchema>) => {
      await apiRequest("POST", "/api/reservations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setIsNewDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Reservation created successfully",
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

  const filteredReservations = reservations?.filter((reservation) =>
    `${reservation.guest.firstName} ${reservation.guest.lastName} ${reservation.id}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      confirmed: "bg-blue-500",
      checked_in: "bg-green-500",
      checked_out: "bg-gray-500",
      cancelled: "bg-red-500",
      no_show: "bg-orange-500",
      pending: "bg-yellow-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (authLoading || isLoading) {
    return <ReservationsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">Reservations</h1>
          <p className="text-muted-foreground mt-1">Manage all your bookings</p>
        </div>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-reservation" className="hover-elevate active-elevate-2">
              <Plus className="h-4 w-4 mr-2" />
              New Reservation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Reservation</DialogTitle>
              <DialogDescription>Add a new booking to the system</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                <FormField
                  control={form.control}
                  name="propertyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Property *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-property">
                            <SelectValue placeholder="Select a property" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {properties?.map((property) => (
                            <SelectItem key={property.id} value={property.id}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="guestId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-guest">
                            <SelectValue placeholder="Select a guest" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {guests?.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.firstName} {guest.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="roomTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Room Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-room-type">
                            <SelectValue placeholder="Select room type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roomTypes?.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name} - ${type.baseRate}/night
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkInDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-check-in" value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkOutDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-check-out" value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {calculatedNights > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="font-semibold text-blue-900">
                      {calculatedNights} night{calculatedNights !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {availableRooms > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                    <p className="font-semibold text-green-900">
                      ✓ {availableRooms} room{availableRooms !== 1 ? 's' : ''} available for selected dates
                    </p>
                  </div>
                )}

                {isCheckingAvailability && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                    <p className="text-yellow-900">Checking availability...</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="numberOfGuests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number of Guests *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-guests"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ratePerNight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rate per Night *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            data-testid="input-rate"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Amount * (Auto-calculated)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            {...field}
                            disabled
                            data-testid="input-total"
                            className="bg-gray-50"
                          />
                          {calculatedTotal > 0 && (
                            <span className="font-semibold text-green-600 whitespace-nowrap">
                              = ${calculatedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialRequests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requests</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value || ''}
                          placeholder="Any special requests or notes..."
                          data-testid="input-special-requests"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewDialogOpen(false)}
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-submit"
                    className="hover-elevate active-elevate-2"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Reservation"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by guest name or reservation ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
            <Button variant="outline" data-testid="button-filter" className="hover-elevate active-elevate-2">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reservation ID</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Room Type</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReservations && filteredReservations.length > 0 ? (
                filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id} className="hover-elevate" data-testid={`row-reservation-${reservation.id}`}>
                    <TableCell className="font-mono text-sm">{reservation.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {reservation.guest.firstName} {reservation.guest.lastName}
                    </TableCell>
                    <TableCell>{reservation.roomType.name}</TableCell>
                    <TableCell>{format(new Date(reservation.checkInDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(reservation.checkOutDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(reservation.status)} data-testid={`badge-status-${reservation.status}`}>
                        {reservation.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Number(reservation.totalAmount).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No reservations found matching your search" : "No reservations yet. Create your first one!"}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function ReservationsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
