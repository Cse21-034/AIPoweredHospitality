import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
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
import { Users, Plus, Search, Mail, Phone, Flag, User, Calendar, MapPin, FileText, CreditCard } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertGuestSchema, type Guest } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Enhanced guest form schema with better validation
const guestFormSchema = insertGuestSchema.extend({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type GuestFormData = z.infer<typeof guestFormSchema>;

const loyaltyStatuses = [
  { value: "standard", label: "Standard", color: "bg-gray-500" },
  { value: "silver", label: "Silver", color: "bg-gray-400" },
  { value: "gold", label: "Gold", color: "bg-yellow-500" },
  { value: "platinum", label: "Platinum", color: "bg-purple-500" },
];

export default function Guests() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);

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

  const { data: guests, isLoading } = useQuery<Guest[]>({
    queryKey: ["/api/guests"],
    enabled: isAuthenticated,
  });

  const form = useForm<GuestFormData>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      nationality: "",
      dateOfBirth: "",
      passportNumber: "",
      address: "",
      loyaltyStatus: "standard",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GuestFormData) => {
      await apiRequest("POST", "/api/guests", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/guests"] });
      setIsNewDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Guest added successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredGuests = guests?.filter((guest) =>
    `${guest.firstName} ${guest.lastName} ${guest.email || ""} ${guest.phoneNumber || ""}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const getLoyaltyBadgeColor = (status: string) => {
    const statusConfig = loyaltyStatuses.find(s => s.value === status);
    return statusConfig?.color || "bg-gray-500";
  };

  if (authLoading || isLoading) {
    return <GuestsSkeleton />;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold" data-testid="text-page-title">Guests</h1>
            <p className="text-muted-foreground mt-1">Manage your guest database</p>
          </div>
        </div>
        
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-guest" className="hover-elevate active-elevate-2">
              <Plus className="h-4 w-4 mr-2" />
              Add New Guest
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Add New Guest
              </DialogTitle>
              <DialogDescription>
                Enter the guest's information. Fields marked with * are required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">First Name *</label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.watch("firstName")}
                        onChange={(e) => form.setValue("firstName", e.target.value)}
                        placeholder="John"
                        className="pl-10"
                        data-testid="input-first-name"
                      />
                    </div>
                    {form.formState.errors.firstName && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Last Name *</label>
                    <div className="relative mt-2">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.watch("lastName")}
                        onChange={(e) => form.setValue("lastName", e.target.value)}
                        placeholder="Doe"
                        className="pl-10"
                        data-testid="input-last-name"
                      />
                    </div>
                    {form.formState.errors.lastName && (
                      <p className="text-sm text-destructive mt-1">{form.formState.errors.lastName.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        value={form.watch("email") || ""}
                        onChange={(e) => form.setValue("email", e.target.value)}
                        placeholder="john.doe@example.com"
                        className="pl-10"
                        data-testid="input-email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone Number</label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.watch("phoneNumber") || ""}
                        onChange={(e) => form.setValue("phoneNumber", e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="pl-10"
                        data-testid="input-phone"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Personal Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Date of Birth</label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={form.watch("dateOfBirth") || ""}
                        onChange={(e) => form.setValue("dateOfBirth", e.target.value)}
                        className="pl-10"
                        data-testid="input-dob"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Used for special birthday offers</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Nationality</label>
                    <div className="relative mt-2">
                      <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.watch("nationality") || ""}
                        onChange={(e) => form.setValue("nationality", e.target.value)}
                        placeholder="United States"
                        className="pl-10"
                        data-testid="input-nationality"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Passport Number</label>
                    <div className="relative mt-2">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={form.watch("passportNumber") || ""}
                        onChange={(e) => form.setValue("passportNumber", e.target.value)}
                        placeholder="A12345678"
                        className="pl-10"
                        data-testid="input-passport"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Required for international guests</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Loyalty Status</label>
                    <Select
                      value={form.watch("loyaltyStatus") || "standard"}
                      onValueChange={(value) => form.setValue("loyaltyStatus", value as any)}
                    >
                      <SelectTrigger className="mt-2" data-testid="select-loyalty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {loyaltyStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${status.color}`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">Determines benefits and rewards</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Address</h3>
                
                <div>
                  <label className="text-sm font-medium">Full Address</label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      value={form.watch("address") || ""}
                      onChange={(e) => form.setValue("address", e.target.value)}
                      placeholder="123 Main Street, Apartment 4B, New York, NY 10001"
                      className="pl-10 min-h-[80px]"
                      data-testid="input-address"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Complete mailing address</p>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold border-b pb-2">Additional Information</h3>
                
                <div>
                  <label className="text-sm font-medium">Notes</label>
                  <div className="relative mt-2">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea
                      value={form.watch("notes") || ""}
                      onChange={(e) => form.setValue("notes", e.target.value)}
                      placeholder="Special preferences, dietary restrictions, room preferences, etc."
                      className="pl-10 min-h-[100px]"
                      data-testid="input-notes"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Any special requests or preferences</p>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsNewDialogOpen(false);
                  form.reset();
                }}
                disabled={createMutation.isPending}
                data-testid="button-cancel"
                className="hover-elevate"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => createMutation.mutate(data))}
                disabled={createMutation.isPending}
                data-testid="button-submit"
                className="hover-elevate active-elevate-2"
              >
                {createMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Guest
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Loyalty Status</TableHead>
                <TableHead>Total Bookings</TableHead>
                <TableHead>Total Spend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests && filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="hover-elevate" data-testid={`row-guest-${guest.id}`}>
                    <TableCell className="font-medium">
                      {guest.firstName} {guest.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {guest.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {guest.email}
                          </div>
                        )}
                        {guest.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {guest.phoneNumber}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{guest.nationality || "-"}</TableCell>
                    <TableCell>
                      <Badge className={getLoyaltyBadgeColor(guest.loyaltyStatus || "standard")}>
                        {guest.loyaltyStatus || "standard"}
                      </Badge>
                    </TableCell>
                    <TableCell>{guest.totalBookings || 0}</TableCell>
                    <TableCell>${Number(guest.totalSpend || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No guests found matching your search" : "No guests yet. Add your first guest!"}
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

function GuestsSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48" />
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
