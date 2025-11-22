import { Building2, Plus, Edit, Trash2, Home, Bed, DoorOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Property, RoomType, Room } from "@shared/schema";

const propertyFormSchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("UTC"),
  currency: z.string().default("USD"),
  phoneNumber: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
});

const roomTypeFormSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Room type name is required"),
  description: z.string().optional(),
  maxOccupancy: z.coerce.number().min(1, "Max occupancy must be at least 1").default(2),
  baseRate: z.coerce.number().min(0, "Base rate must be positive"),
});

const roomFormSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  roomTypeId: z.string().min(1, "Room type is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  floor: z.coerce.number().optional(),
  status: z.enum(["available", "occupied", "cleaning", "maintenance", "blocked"]).default("available"),
  notes: z.string().optional(),
});

const toPropertyFormValues = (property: Property) => ({
  name: property.name,
  address: property.address || undefined,
  city: property.city || undefined,
  country: property.country || undefined,
  timezone: property.timezone || "UTC",
  currency: property.currency || "USD",
  phoneNumber: property.phoneNumber || undefined,
  email: property.email || undefined,
  website: property.website || undefined,
});

const toRoomTypeFormValues = (roomType: RoomType) => ({
  propertyId: roomType.propertyId,
  name: roomType.name,
  description: roomType.description || undefined,
  maxOccupancy: roomType.maxOccupancy,
  baseRate: parseFloat(roomType.baseRate as any),
});

const toRoomFormValues = (room: Room) => ({
  propertyId: room.propertyId,
  roomTypeId: room.roomTypeId,
  roomNumber: room.roomNumber,
  floor: room.floor || undefined,
  status: room.status as "available" | "occupied" | "cleaning" | "maintenance" | "blocked",
  notes: room.notes || undefined,
});

export default function Properties() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false);
  const [isRoomTypeDialogOpen, setIsRoomTypeDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deletePropertyId, setDeletePropertyId] = useState<string | null>(null);
  const [deleteRoomTypeId, setDeleteRoomTypeId] = useState<string | null>(null);
  const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

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

  const { data: properties, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: isAuthenticated,
  });

  const { data: roomTypes } = useQuery<RoomType[]>({
    queryKey: ["/api/room-types"],
    enabled: isAuthenticated,
  });

  const { data: rooms } = useQuery<Room[]>({
    queryKey: ["/api/rooms"],
    enabled: isAuthenticated,
  });

  const propertyForm = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      timezone: "UTC",
      currency: "USD",
    },
  });

  const roomTypeForm = useForm<z.infer<typeof roomTypeFormSchema>>({
    resolver: zodResolver(roomTypeFormSchema),
    defaultValues: {
      maxOccupancy: 2,
    },
  });

  const roomForm = useForm<z.infer<typeof roomFormSchema>>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      status: "available",
    },
  });

  const propertyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof propertyFormSchema>) => {
      if (selectedProperty) {
        await apiRequest("PUT", `/api/properties/${selectedProperty.id}`, data);
      } else {
        await apiRequest("POST", "/api/properties", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsPropertyDialogOpen(false);
      setSelectedProperty(null);
      propertyForm.reset();
      toast({
        title: "Success",
        description: selectedProperty ? "Property updated successfully" : "Property created successfully",
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

  const deletePropertyMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setDeletePropertyId(null);
      toast({
        title: "Success",
        description: "Property deleted successfully",
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

  const roomTypeMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roomTypeFormSchema>) => {
      if (selectedRoomType) {
        await apiRequest("PUT", `/api/room-types/${selectedRoomType.id}`, data);
      } else {
        await apiRequest("POST", "/api/room-types", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-types"] });
      setIsRoomTypeDialogOpen(false);
      setSelectedRoomType(null);
      roomTypeForm.reset();
      toast({
        title: "Success",
        description: selectedRoomType ? "Room type updated successfully" : "Room type created successfully",
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

  const deleteRoomTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/room-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/room-types"] });
      setDeleteRoomTypeId(null);
      toast({
        title: "Success",
        description: "Room type deleted successfully",
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

  const roomMutation = useMutation({
    mutationFn: async (data: z.infer<typeof roomFormSchema>) => {
      if (selectedRoom) {
        await apiRequest("PUT", `/api/rooms/${selectedRoom.id}`, data);
      } else {
        await apiRequest("POST", "/api/rooms", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setIsRoomDialogOpen(false);
      setSelectedRoom(null);
      roomForm.reset();
      toast({
        title: "Success",
        description: selectedRoom ? "Room updated successfully" : "Room created successfully",
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

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rooms"] });
      setDeleteRoomId(null);
      toast({
        title: "Success",
        description: "Room deleted successfully",
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

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      available: "default",
      occupied: "secondary",
      cleaning: "outline",
      maintenance: "destructive",
      blocked: "destructive",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-semibold">Properties & Rooms</h1>
            <p className="text-muted-foreground mt-1">Manage your properties, room types, and individual rooms</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="properties" className="space-y-4">
        <TabsList>
          <TabsTrigger value="properties">
            <Home className="h-4 w-4 mr-2" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="room-types">
            <Bed className="h-4 w-4 mr-2" />
            Room Types
          </TabsTrigger>
          <TabsTrigger value="rooms">
            <DoorOpen className="h-4 w-4 mr-2" />
            Rooms
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedProperty(null); propertyForm.reset(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Property
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{selectedProperty ? "Edit Property" : "Add New Property"}</DialogTitle>
                  <DialogDescription>
                    {selectedProperty ? "Update property information" : "Create a new property"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...propertyForm}>
                  <form onSubmit={propertyForm.handleSubmit((data) => propertyMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={propertyForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Property Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Grand Hotel & Spa" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="123 Main Street" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="USA" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="+1 234 567 8900" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="info@hotel.com" type="email" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input placeholder="https://hotel.com" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                              <Input placeholder="UTC" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={propertyForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <FormControl>
                              <Input placeholder="USD" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsPropertyDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={propertyMutation.isPending}>
                        {propertyMutation.isPending ? "Saving..." : selectedProperty ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {propertiesLoading ? (
              <p className="text-muted-foreground">Loading properties...</p>
            ) : properties && properties.length > 0 ? (
              properties.map((property) => (
                <Card key={property.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{property.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {property.city && property.country ? `${property.city}, ${property.country}` : property.city || property.country || "No location set"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {property.address && (
                      <p className="text-sm text-muted-foreground">{property.address}</p>
                    )}
                    {property.phoneNumber && (
                      <p className="text-sm">📞 {property.phoneNumber}</p>
                    )}
                    {property.email && (
                      <p className="text-sm">✉️ {property.email}</p>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Badge variant="outline">{property.currency}</Badge>
                      <Badge variant="outline">{property.timezone}</Badge>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProperty(property);
                          propertyForm.reset(toPropertyFormValues(property));
                          setIsPropertyDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setDeletePropertyId(property.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card className="col-span-full">
                <CardContent className="py-8 text-center">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No properties yet. Add your first property to get started.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="room-types" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isRoomTypeDialogOpen} onOpenChange={setIsRoomTypeDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedRoomType(null); roomTypeForm.reset(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room Type
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedRoomType ? "Edit Room Type" : "Add New Room Type"}</DialogTitle>
                  <DialogDescription>
                    {selectedRoomType ? "Update room type information" : "Create a new room type"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...roomTypeForm}>
                  <form onSubmit={roomTypeForm.handleSubmit((data) => roomTypeMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={roomTypeForm.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                      control={roomTypeForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Deluxe Suite" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomTypeForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Spacious suite with ocean view..." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={roomTypeForm.control}
                        name="maxOccupancy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Occupancy *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roomTypeForm.control}
                        name="baseRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Base Rate *</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsRoomTypeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={roomTypeMutation.isPending}>
                        {roomTypeMutation.isPending ? "Saving..." : selectedRoomType ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Max Occupancy</TableHead>
                    <TableHead>Base Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomTypes && roomTypes.length > 0 ? (
                    roomTypes.map((roomType) => {
                      const property = properties?.find((p) => p.id === roomType.propertyId);
                      return (
                        <TableRow key={roomType.id}>
                          <TableCell>{property?.name || "Unknown"}</TableCell>
                          <TableCell className="font-medium">{roomType.name}</TableCell>
                          <TableCell>{roomType.maxOccupancy} guests</TableCell>
                          <TableCell>${roomType.baseRate}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRoomType(roomType);
                                  roomTypeForm.reset(toRoomTypeFormValues(roomType));
                                  setIsRoomTypeDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteRoomTypeId(roomType.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No room types yet. Add a room type to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setSelectedRoom(null); roomForm.reset(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{selectedRoom ? "Edit Room" : "Add New Room"}</DialogTitle>
                  <DialogDescription>
                    {selectedRoom ? "Update room information" : "Create a new room"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...roomForm}>
                  <form onSubmit={roomForm.handleSubmit((data) => roomMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={roomForm.control}
                      name="propertyId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
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
                      control={roomForm.control}
                      name="roomTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a room type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roomTypes?.map((roomType) => (
                                <SelectItem key={roomType.id} value={roomType.id}>
                                  {roomType.name}
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
                        control={roomForm.control}
                        name="roomNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Room Number *</FormLabel>
                            <FormControl>
                              <Input placeholder="101" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={roomForm.control}
                        name="floor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Floor</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} value={field.value || ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={roomForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="available">Available</SelectItem>
                              <SelectItem value="occupied">Occupied</SelectItem>
                              <SelectItem value="cleaning">Cleaning</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="blocked">Blocked</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={roomForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Additional notes..." {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-3">
                      <Button type="button" variant="outline" onClick={() => setIsRoomDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={roomMutation.isPending}>
                        {roomMutation.isPending ? "Saving..." : selectedRoom ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Number</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Room Type</TableHead>
                    <TableHead>Floor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms && rooms.length > 0 ? (
                    rooms.map((room) => {
                      const property = properties?.find((p) => p.id === room.propertyId);
                      const roomType = roomTypes?.find((rt) => rt.id === room.roomTypeId);
                      return (
                        <TableRow key={room.id}>
                          <TableCell className="font-medium">{room.roomNumber}</TableCell>
                          <TableCell>{property?.name || "Unknown"}</TableCell>
                          <TableCell>{roomType?.name || "Unknown"}</TableCell>
                          <TableCell>{room.floor || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusBadgeVariant(room.status)}>
                              {room.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRoom(room);
                                  roomForm.reset(toRoomFormValues(room));
                                  setIsRoomDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteRoomId(room.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No rooms yet. Add a room to get started.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!deletePropertyId} onOpenChange={() => setDeletePropertyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this property and all its associated room types and rooms. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePropertyId && deletePropertyMutation.mutate(deletePropertyId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRoomTypeId} onOpenChange={() => setDeleteRoomTypeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this room type. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRoomTypeId && deleteRoomTypeMutation.mutate(deleteRoomTypeId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRoomId} onOpenChange={() => setDeleteRoomId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this room. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRoomId && deleteRoomMutation.mutate(deleteRoomId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
