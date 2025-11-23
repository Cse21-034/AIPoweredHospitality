import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { QrCode, Download, Share2, Copy, Loader2, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Room {
  id: string;
  roomNumber: string;
  roomTypeId: string;
  propertyId: string;
  status: string;
}

interface QRCodeData {
  reservationId: string;
  roomNumber: string;
  qrCode: string;
  accessUrl: string;
}

export default function QRCodesPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQR, setSelectedQR] = useState<QRCodeData | null>(null);
  const [activeTab, setActiveTab] = useState("generate");

  // Fetch all rooms
  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["/api/properties/rooms"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/properties/rooms");
      return Array.isArray(res) ? res : [];
    },
  });

  // Fetch current reservations with QR codes
  const { data: activeReservations = [], isLoading: reservationsLoading } = useQuery({
    queryKey: ["/api/reservations/active"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reservations?status=checked_in");
      return Array.isArray(res) ? res : [];
    },
  });

  // Generate QR code for reservation
  const generateQRMutation = useMutation({
    mutationFn: async (reservationId: string) => {
      const res = await apiRequest("GET", `/api/room-service-qr/${reservationId}`);
      if (typeof res === "object" && res !== null && "qrCode" in res) {
        return res as { qrCode: string; accessUrl: string };
      }
      // Handle Response object
      const data = await (res as Response).json?.();
      return data as { qrCode: string; accessUrl: string };
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "QR code generated successfully",
      });
      setSelectedQR({
        ...selectedQR,
        qrCode: data.qrCode,
        accessUrl: data.accessUrl,
      } as QRCodeData);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRooms = rooms.filter((room: Room) =>
    room.roomNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const downloadQRCode = (qrCode: string, roomNumber: string) => {
    const link = document.createElement("a");
    link.href = qrCode;
    link.download = `room-${roomNumber}-qr.png`;
    link.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "URL copied to clipboard",
    });
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <QrCode className="h-8 w-8" />
          QR Code Management
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate and manage QR codes for guest room service access
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate QR Codes</TabsTrigger>
          <TabsTrigger value="active">Active Room Access</TabsTrigger>
        </TabsList>

        {/* Generate QR Codes Tab */}
        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Rooms</CardTitle>
              <CardDescription>
                Select a room to generate a QR code for guest room service access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-xs"
              />

              {roomsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredRooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRooms.map((room: Room) => (
                    <Dialog key={room.id}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-lg transition cursor-pointer">
                          <CardContent className="pt-6 space-y-4">
                            <div>
                              <h3 className="text-lg font-bold">Room {room.roomNumber}</h3>
                              <p className="text-sm text-muted-foreground">
                                Status: {room.status}
                              </p>
                            </div>
                            <Button className="w-full" variant="outline">
                              <QrCode className="h-4 w-4 mr-2" />
                              Generate QR Code
                            </Button>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Generate QR Code for Room {room.roomNumber}</DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded border border-blue-200">
                            <p className="text-sm text-blue-800">
                              <strong>Note:</strong> QR codes are linked to active reservations. 
                              Make sure there's a current guest checked in to Room {room.roomNumber}.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium">Reservation ID (Optional)</label>
                            <Input
                              placeholder="Auto-detect from active reservation or enter manually"
                              defaultValue=""
                              id="reservationId"
                            />
                            <p className="text-xs text-muted-foreground">
                              Leave blank to auto-detect current guest's reservation
                            </p>
                          </div>

                          <Button
                            onClick={() => {
                              const reservationInput = document.getElementById(
                                "reservationId"
                              ) as HTMLInputElement;
                              const reservationId = reservationInput?.value || `room-${room.id}`;

                              generateQRMutation.mutate(reservationId);
                            }}
                            className="w-full"
                            disabled={generateQRMutation.isPending}
                          >
                            {generateQRMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <QrCode className="h-4 w-4 mr-2" />
                                Generate QR Code
                              </>
                            )}
                          </Button>

                          {selectedQR?.qrCode && (
                            <div className="space-y-4 pt-4 border-t">
                              <div className="flex justify-center bg-white p-6 rounded border">
                                <img
                                  src={selectedQR.qrCode}
                                  alt="QR Code"
                                  className="max-w-xs"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Access URL</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={selectedQR.accessUrl}
                                    readOnly
                                    className="bg-muted"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedQR.accessUrl)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    downloadQRCode(selectedQR.qrCode, room.roomNumber)
                                  }
                                  className="flex-1"
                                  variant="outline"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download QR
                                </Button>
                                <Button
                                  onClick={() =>
                                    copyToClipboard(selectedQR.accessUrl)
                                  }
                                  className="flex-1"
                                  variant="outline"
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share Link
                                </Button>
                              </div>

                              <div className="bg-green-50 p-4 rounded border border-green-200">
                                <p className="text-sm text-green-800">
                                  ✓ QR code ready! You can now print it or send the access URL to the guest.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "No rooms found matching your search" : "No rooms available"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Room Access Tab */}
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Checked-in Guests</CardTitle>
              <CardDescription>
                Generate QR codes for currently checked-in guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservationsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : activeReservations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeReservations.map((reservation: any) => (
                    <Dialog key={reservation.id}>
                      <DialogTrigger asChild>
                        <Card className="hover:shadow-lg transition cursor-pointer">
                          <CardContent className="pt-6 space-y-3">
                            <div>
                              <h3 className="font-semibold">
                                {reservation.guestName || "Guest"}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                Room: {reservation.roomNumber || "TBD"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                ID: {reservation.id}
                              </p>
                            </div>
                            <Badge variant="outline">Checked In</Badge>
                            <Button className="w-full" size="sm">
                              <QrCode className="h-4 w-4 mr-2" />
                              Generate QR
                            </Button>
                          </CardContent>
                        </Card>
                      </DialogTrigger>

                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            QR Code for {reservation.guestName || "Guest"}
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded border">
                            <p className="text-sm font-medium">Reservation Details</p>
                            <p className="text-sm text-muted-foreground">
                              ID: {reservation.id}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Room: {reservation.roomNumber || "TBD"}
                            </p>
                          </div>

                          <Button
                            onClick={() => generateQRMutation.mutate(reservation.id)}
                            className="w-full"
                            disabled={generateQRMutation.isPending}
                          >
                            {generateQRMutation.isPending ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <QrCode className="h-4 w-4 mr-2" />
                                Generate QR Code
                              </>
                            )}
                          </Button>

                          {selectedQR?.qrCode && (
                            <div className="space-y-4 pt-4 border-t">
                              <div className="flex justify-center bg-white p-6 rounded border">
                                <img
                                  src={selectedQR.qrCode}
                                  alt="QR Code"
                                  className="max-w-xs"
                                />
                              </div>

                              <div className="space-y-2">
                                <label className="text-sm font-medium">Access URL</label>
                                <div className="flex gap-2">
                                  <Input
                                    value={selectedQR.accessUrl}
                                    readOnly
                                    className="bg-muted"
                                  />
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    onClick={() => copyToClipboard(selectedQR.accessUrl)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    downloadQRCode(selectedQR.qrCode, `guest-${reservation.id}`)
                                  }
                                  className="flex-1"
                                  variant="outline"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button
                                  onClick={() => {
                                    navigator.share({
                                      title: "Room Service Access",
                                      text: "Access room service via this link",
                                      url: selectedQR.accessUrl,
                                    }).catch(() => {
                                      copyToClipboard(selectedQR.accessUrl);
                                    });
                                  }}
                                  className="flex-1"
                                  variant="outline"
                                >
                                  <Share2 className="h-4 w-4 mr-2" />
                                  Share
                                </Button>
                              </div>

                              <div className="bg-green-50 p-4 rounded border border-green-200">
                                <p className="text-sm text-green-800">
                                  ✓ QR code ready! Print it and place it in the room or send the link via email/SMS.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No guests currently checked in
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use QR Codes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-semibold text-sm">Step 1: Generate QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Go to the "Generate QR Codes" or "Active Room Access" tab and select a room or guest
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Step 2: Download or Share</h4>
              <p className="text-sm text-muted-foreground">
                Download the QR code to print it and place in the room, or copy the access link to send to guests
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Step 3: Guest Scans</h4>
              <p className="text-sm text-muted-foreground">
                Guest scans the QR code with their phone camera or clicks the access link
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm">Step 4: Access Room Service</h4>
              <p className="text-sm text-muted-foreground">
                Guest is taken directly to the room service portal where they can order food, chat with staff, and view billing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
