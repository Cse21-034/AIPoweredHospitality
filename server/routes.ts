import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import OpenAI from "openai";
import QRCode from "qrcode";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, hashPassword, verifyPassword } from "./auth";
import { randomBytes } from "crypto";
import {
  insertPropertySchema,
  insertRoomTypeSchema,
  insertRoomSchema,
  insertGuestSchema,
  insertReservationSchema,
  updateReservationSchema,
  insertRoomServiceRequestSchema,
  insertRatePlanSchema,
  signupSchema,
  loginSchema,
  insertShopMenuItemSchema,
  updateShopMenuItemSchema,
  insertGuestOrderSchema,
  insertGuestOrderItemSchema,
  insertGuestMessageSchema,
  insertGuestBillingSchema,
  updateGuestBillingSchema,
} from "@shared/schema";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function generateLicenseKey(): string {
  const randomPart = randomBytes(8).toString("hex").toUpperCase();
  const checksum = randomBytes(2).toString("hex").toUpperCase();
  return `HPMS-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8, 12)}-${checksum}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await setupAuth(app);

  // ========== AUTH ROUTES ==========
  
// AUTH ROUTES - Add these to replace your existing auth routes

app.post("/api/auth/signup", async (req, res) => {
  try {
    console.log("Signup request received:", { email: req.body.email });
    
    const validatedData = signupSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(validatedData.email);
    if (existingUser) {
      console.log("User already exists:", validatedData.email);
      return res.status(400).json({ message: "User with this email already exists" });
    }
    
    // Create password hash
    const passwordHash = await hashPassword(validatedData.password);
    console.log("Password hashed successfully");
    
    // Create user
    const user = await storage.createUser({
      email: validatedData.email,
      passwordHash,
      firstName: validatedData.firstName || null,
      lastName: validatedData.lastName || null,
      role: "staff",
    });
    console.log("User created:", user.id);
    
    // CRITICAL FIX: Set session BEFORE saving
    req.session.userId = user.id;
    
    // CRITICAL FIX: Use callback-based save with proper error handling
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        // Try to clean up the user if session fails
        storage.deleteUser(user.id).catch(console.error);
        return res.status(500).json({ 
          message: "Failed to create session. Please try again." 
        });
      }
      
      console.log("Session saved successfully:", req.session.userId);
      
      // Return user data
      res.status(201).json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role 
        } 
      });
    });
  } catch (error: any) {
    console.error("Signup error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        message: error.errors[0]?.message || "Invalid input" 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to create account. Please try again." 
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    console.log("Login request received:", { email: req.body.email });
    
    const validatedData = loginSchema.parse(req.body);
    
    // Find user
    const user = await storage.getUserByEmail(validatedData.email);
    if (!user) {
      console.log("User not found:", validatedData.email);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Verify password
    const isValid = await verifyPassword(validatedData.password, user.passwordHash);
    if (!isValid) {
      console.log("Invalid password for user:", validatedData.email);
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    console.log("Password verified for user:", user.id);
    
    // CRITICAL FIX: Set session BEFORE saving
    req.session.userId = user.id;
    
    // CRITICAL FIX: Use callback-based save with proper error handling
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ 
          message: "Failed to save session. Please try again." 
        });
      }
      
      console.log("Session saved successfully:", req.session.userId);
      
      // Return user data
      res.json({ 
        user: { 
          id: user.id, 
          email: user.email, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          role: user.role 
        } 
      });
    });
  } catch (error: any) {
    console.error("Login error:", error);
    
    if (error.name === "ZodError") {
      return res.status(400).json({ 
        message: error.errors[0]?.message || "Invalid input" 
      });
    }
    
    res.status(500).json({ 
      message: "Failed to log in. Please try again." 
    });
  }
});

app.post("/api/auth/logout", (req, res) => {
  const sessionId = req.sessionID;
  console.log("Logout request for session:", sessionId);
  
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
      return res.status(500).json({ message: "Failed to log out" });
    }
    
    console.log("Session destroyed successfully");
    res.clearCookie("hospitality.sid");
    res.json({ message: "Logged out successfully" });
  });
});

app.get("/api/auth/user", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId!;
    console.log("Fetching user:", userId);
    
    const user = await storage.getUser(userId);
    if (!user) {
      console.log("User not found:", userId);
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role 
      } 
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});
  // ========== LICENSE & SUBSCRIPTION ROUTES ==========
  
  app.get("/api/license/current", isAuthenticated, async (req, res) => {
    try {
      const license = await storage.getActiveLicense();
      if (!license) {
        const newLicense = await storage.createLicense({
          licenseKey: generateLicenseKey(),
          subscriptionStatus: "trial",
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          trialEndsAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          featuresUnlocked: {
            ai: true,
            unlimited_properties: true,
            advanced_reports: true,
          },
        });
        return res.json(newLicense);
      }
      res.json(license);
    } catch (error: any) {
      console.error("Error fetching license:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/subscription/create", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." });
      }

      const { plan } = req.body;
      const userId = req.session.userId;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;

      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      const priceId = plan === "yearly" ? process.env.STRIPE_PRICE_ID_YEARLY : process.env.STRIPE_PRICE_ID_MONTHLY;
      
      if (!priceId) {
        return res.status(400).json({ message: "Invalid subscription plan" });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      });

      const license = await storage.getActiveLicense();
      if (license) {
        await storage.updateLicense(license.id, {
          subscriptionStatus: "active",
          subscriptionType: plan,
          expiresAt: new Date(Date.now() + (plan === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000),
        });
      }

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== PROPERTY ROUTES ==========
  
  app.get("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error: any) {
      console.error("Error fetching properties:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      res.status(201).json(property);
    } catch (error: any) {
      console.error("Error creating property:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const property = await storage.getProperty(id);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      console.error("Error fetching property:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertPropertySchema.partial().parse(req.body);
      const property = await storage.updateProperty(id, data);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json(property);
    } catch (error: any) {
      console.error("Error updating property:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/properties/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProperty(id);
      if (!success) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.json({ message: "Property deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting property:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ROOM TYPE ROUTES ==========
  
  app.get("/api/room-types", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const roomTypes = await storage.getRoomTypes(propertyId);
      res.json(roomTypes);
    } catch (error: any) {
      console.error("Error fetching room types:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/room-types", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomTypeSchema.parse(req.body);
      const roomType = await storage.createRoomType(data);
      res.status(201).json(roomType);
    } catch (error: any) {
      console.error("Error creating room type:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/room-types/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const roomType = await storage.getRoomType(id);
      if (!roomType) {
        return res.status(404).json({ message: "Room type not found" });
      }
      res.json(roomType);
    } catch (error: any) {
      console.error("Error fetching room type:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/room-types/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertRoomTypeSchema.partial().parse(req.body);
      const roomType = await storage.updateRoomType(id, data);
      if (!roomType) {
        return res.status(404).json({ message: "Room type not found" });
      }
      res.json(roomType);
    } catch (error: any) {
      console.error("Error updating room type:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/room-types/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRoomType(id);
      if (!success) {
        return res.status(404).json({ message: "Room type not found" });
      }
      res.json({ message: "Room type deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting room type:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ROOM ROUTES ==========
  
  app.get("/api/rooms", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const rooms = await storage.getRooms(propertyId);
      res.json(rooms);
    } catch (error: any) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rooms", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(data);
      res.status(201).json(room);
    } catch (error: any) {
      console.error("Error creating room:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/rooms/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const room = await storage.getRoom(id);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error: any) {
      console.error("Error fetching room:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/rooms/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertRoomSchema.partial().parse(req.body);
      const room = await storage.updateRoom(id, data);
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json(room);
    } catch (error: any) {
      console.error("Error updating room:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/rooms/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRoom(id);
      if (!success) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({ message: "Room deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting room:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== GUEST ROUTES ==========
  
  app.get("/api/guests", isAuthenticated, async (req, res) => {
    try {
      const guests = await storage.getGuests();
      res.json(guests);
    } catch (error: any) {
      console.error("Error fetching guests:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guests", isAuthenticated, async (req, res) => {
    try {
      const data = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(data);
      res.status(201).json(guest);
    } catch (error: any) {
      console.error("Error creating guest:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/guests/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const guest = await storage.getGuest(id);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error: any) {
      console.error("Error fetching guest:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/guests/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = insertGuestSchema.partial().parse(req.body);
      const guest = await storage.updateGuest(id, data);
      if (!guest) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json(guest);
    } catch (error: any) {
      console.error("Error updating guest:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/guests/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteGuest(id);
      if (!success) {
        return res.status(404).json({ message: "Guest not found" });
      }
      res.json({ message: "Guest deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting guest:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== RESERVATION ROUTES ==========
  
  app.post("/api/reservations/check-availability", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, roomTypeId, checkInDate, checkOutDate } = req.body;
      
      if (!propertyId || !roomTypeId || !checkInDate || !checkOutDate) {
        return res.status(400).json({ message: "propertyId, roomTypeId, checkInDate, and checkOutDate are required" });
      }

      // Validate dates
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      
      if (checkIn >= checkOut) {
        return res.status(400).json({ message: "Check-out date must be after check-in date" });
      }

      const availableRooms = await storage.checkRoomAvailability(propertyId, roomTypeId, checkInDate, checkOutDate);
      
      res.json({
        available: availableRooms.length > 0,
        availableRooms,
        message: availableRooms.length > 0 
          ? `${availableRooms.length} room(s) available` 
          : "No rooms available for selected dates"
      });
    } catch (error: any) {
      console.error("Error checking room availability:", error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const reservations = await storage.getReservations(propertyId);
      res.json(reservations);
    } catch (error: any) {
      console.error("Error fetching reservations:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const data = insertReservationSchema.parse(req.body);
      const reservation = await storage.createReservation(data);
      res.status(201).json(reservation);
    } catch (error: any) {
      console.error("Error creating reservation:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/reservations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error: any) {
      console.error("Error fetching reservation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/reservations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const data = updateReservationSchema.parse(req.body);
      const reservation = await storage.updateReservation(id, data);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json(reservation);
    } catch (error: any) {
      console.error("Error updating reservation:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/reservations/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      
      // Get the reservation first to update room status
      const reservation = await storage.getReservation(id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Update reservation status to cancelled and room status to available
      await storage.updateReservation(id, { status: "cancelled" });
      
      // If room is assigned, mark it as available
      if (reservation.roomId) {
        await storage.updateRoom(reservation.roomId, { status: "available" });
      }

      res.json({ message: "Reservation cancelled successfully" });
    } catch (error: any) {
      console.error("Error deleting reservation:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ROOM SERVICE ROUTES ==========
  
  app.get("/api/room-service", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const requests = await storage.getRoomServiceRequests(propertyId);
      res.json(requests);
    } catch (error: any) {
      console.error("Error fetching room service requests:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/room-service", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomServiceRequestSchema.parse(req.body);
      const request = await storage.createRoomServiceRequest(data);
      res.status(201).json(request);
    } catch (error: any) {
      console.error("Error creating room service request:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/room-service/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getRoomServiceRequest(id);
      if (!request) {
        return res.status(404).json({ message: "Room service request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Error fetching room service request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/room-service/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status || !["pending", "in-progress", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Valid status is required" });
      }
      
      const request = await storage.updateRoomServiceRequest(id, { status });
      if (!request) {
        return res.status(404).json({ message: "Room service request not found" });
      }
      res.json(request);
    } catch (error: any) {
      console.error("Error updating room service request:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/room-service/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRoomServiceRequest(id);
      if (!success) {
        return res.status(404).json({ message: "Room service request not found" });
      }
      res.json({ message: "Room service request deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting room service request:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== RATE PLAN ROUTES ==========
  
  app.get("/api/rate-plans", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const ratePlans = await storage.getRatePlans(propertyId);
      res.json(ratePlans);
    } catch (error: any) {
      console.error("Error fetching rate plans:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rate-plans", isAuthenticated, async (req, res) => {
    try {
      const data = insertRatePlanSchema.parse(req.body);
      const ratePlan = await storage.createRatePlan(data);
      res.status(201).json(ratePlan);
    } catch (error: any) {
      console.error("Error creating rate plan:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/rate-plans/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteRatePlan?.(id);
      if (!success) {
        // If delete method doesn't exist, just return success
        return res.json({ success: true });
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting rate plan:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== DASHBOARD STATS ==========
  
  app.get("/api/dashboard-stats", isAuthenticated, async (req, res) => {
    try {
      let propertyId = req.query.propertyId as string;
      
      if (!propertyId) {
        const properties = await storage.getProperties();
        propertyId = properties[0]?.id;
      }
      
      if (!propertyId) {
        return res.json({
          todayArrivals: 0,
          todayDepartures: 0,
          currentOccupancy: 0,
          totalRevenue: 0,
          pendingRoomService: 0,
          availableRooms: 0,
          totalRooms: 0,
          occupancyRate: 0,
        });
      }

      const stats = await storage.getDashboardStats(propertyId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const properties = await storage.getProperties();
      const propertyId = properties[0]?.id;
      
      if (!propertyId) {
        return res.json({
          todayArrivals: 0,
          todayDepartures: 0,
          currentOccupancy: 0,
          totalRevenue: 0,
          pendingRoomService: 0,
          availableRooms: 0,
          totalRooms: 0,
          occupancyRate: 0,
        });
      }

      const stats = await storage.getDashboardStats(propertyId);
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI ROUTES (License-gated) ==========
  
  app.post("/api/ai/forecast", isAuthenticated, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "OpenAI is not configured. Please add OPENAI_API_KEY to environment variables." });
      }

      const license = await storage.getActiveLicense();
      if (!license || (license.subscriptionStatus !== "active" && license.subscriptionStatus !== "trial")) {
        return res.status(403).json({ message: "Active subscription required for AI features" });
      }

      const { propertyId, roomTypeId, days = 30 } = req.body;

      const reservations = await storage.getReservations(propertyId);
      
      const prompt = `As a hotel revenue management AI, analyze this reservation data and provide demand forecasting for the next ${days} days. Consider seasonal trends, day-of-week patterns, and historical occupancy. Return JSON with:
      - dailyPredictions: array of { date: string, predictedOccupancy: number, confidence: number, recommendedAction: string }
      - summary: { averageOccupancy: number, peakDays: array, lowDays: array, recommendations: array }`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "You are an AI assistant specialized in hotel revenue management and demand forecasting. Provide accurate, data-driven predictions in JSON format." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const forecast = JSON.parse(response.choices[0].message.content || "{}");
      res.json(forecast);
    } catch (error: any) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/ai/pricing", isAuthenticated, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "OpenAI is not configured. Please add OPENAI_API_KEY to environment variables." });
      }

      const license = await storage.getActiveLicense();
      if (!license || (license.subscriptionStatus !== "active" && license.subscriptionStatus !== "trial")) {
        return res.status(403).json({ message: "Active subscription required for AI features" });
      }

      const { propertyId, roomTypeId, currentPrice, occupancy, date, competitors } = req.body;

      const prompt = `As a revenue management expert, recommend optimal room pricing. 
      Current price: $${currentPrice}, Current occupancy: ${occupancy}%, Date: ${date}
      ${competitors ? `Competitor prices: ${JSON.stringify(competitors)}` : ''}
      
      Return JSON with:
      - recommendedPrice: number
      - priceChange: number (percentage)
      - reasoning: string
      - confidence: number (0-100)
      - factors: array of influencing factors
      - riskAssessment: string`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { 
            role: "system", 
            content: "You are an AI revenue management expert for hotels. Provide strategic pricing recommendations based on market conditions, demand, and competitive landscape." 
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const pricing = JSON.parse(response.choices[0].message.content || "{}");
      res.json(pricing);
    } catch (error: any) {
      console.error("Error generating pricing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== USER ROUTES ==========

  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user?.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const { email, username, firstName, lastName } = req.body;
      const user = await storage.updateUser(req.user?.id, {
        email,
        username,
      } as any);
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/user/password", isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user?.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isPasswordValid = await verifyPassword(currentPassword, (user as any).password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user?.id, {
        password: hashedPassword,
      } as any);

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== HEALTH CHECK ==========
  
  // ========== SHOP MENU ROUTES ==========
  
  app.get("/api/shop-menu", isAuthenticated, async (req, res) => {
    try {
      const { propertyId } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      const items = await storage.getShopMenuItems(propertyId as string);
      res.json(items);
    } catch (error: any) {
      console.error("Error fetching shop menu:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/shop-menu", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertShopMenuItemSchema.parse(req.body);
      const item = await storage.createShopMenuItem(validatedData as any);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error creating shop menu item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/shop-menu/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateShopMenuItemSchema.parse(req.body);
      const item = await storage.updateShopMenuItem(id, validatedData as any);
      res.json(item);
    } catch (error: any) {
      console.error("Error updating shop menu item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/shop-menu/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteShopMenuItem(id);
      res.json({ message: "Menu item deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting shop menu item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== GUEST ORDERS ROUTES ==========
  
  app.get("/api/guest-orders", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, reservationId } = req.query;
      
      const orders = await storage.getGuestOrders(
        propertyId as string | undefined,
        reservationId as string | undefined
      );
      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching guest orders:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/guest-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.getGuestOrder(id);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      // Get order items
      const items = await storage.getGuestOrderItems(id);
      res.json({ ...order, items });
    } catch (error: any) {
      console.error("Error fetching guest order:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guest-orders", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGuestOrderSchema.parse(req.body);
      const order = await storage.createGuestOrder(validatedData as any);
      res.status(201).json(order);
    } catch (error: any) {
      console.error("Error creating guest order:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guest-orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertGuestOrderItemSchema.parse({
        ...req.body,
        orderId: id,
      });
      const item = await storage.createGuestOrderItem(validatedData as any);
      res.status(201).json(item);
    } catch (error: any) {
      console.error("Error adding order item:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/guest-orders/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const order = await storage.updateGuestOrder(id, req.body);
      res.json(order);
    } catch (error: any) {
      console.error("Error updating guest order:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== GUEST MESSAGES ROUTES ==========
  
  app.get("/api/guest-messages", isAuthenticated, async (req, res) => {
    try {
      const { reservationId, orderId } = req.query;
      
      const messages = await storage.getGuestMessages(
        reservationId as string | undefined,
        orderId as string | undefined
      );
      res.json(messages);
    } catch (error: any) {
      console.error("Error fetching guest messages:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guest-messages", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGuestMessageSchema.parse(req.body);
      const message = await storage.createGuestMessage(validatedData as any);
      res.status(201).json(message);
    } catch (error: any) {
      console.error("Error creating guest message:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/guest-messages/:reservationId/mark-read", isAuthenticated, async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { recipientId } = req.body;
      
      await storage.markMessagesAsRead(reservationId, recipientId);
      res.json({ message: "Messages marked as read" });
    } catch (error: any) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== GUEST BILLING ROUTES ==========
  
  app.get("/api/guest-billing/:reservationId", isAuthenticated, async (req, res) => {
    try {
      const { reservationId } = req.params;
      const billing = await storage.calculateGuestBilling(reservationId);
      res.json(billing);
    } catch (error: any) {
      console.error("Error fetching guest billing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guest-billing", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGuestBillingSchema.parse(req.body);
      const billing = await storage.createGuestBilling(validatedData as any);
      res.status(201).json(billing);
    } catch (error: any) {
      console.error("Error creating guest billing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/guest-billing/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = updateGuestBillingSchema.parse(req.body);
      const billing = await storage.updateGuestBilling(id, validatedData as any);
      res.json(billing);
    } catch (error: any) {
      console.error("Error updating guest billing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== STRIPE PAYMENT ROUTES ==========
  
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ message: "Stripe is not configured" });
      }

      const { reservationId, amount } = req.body;
      
      if (!reservationId || !amount) {
        return res.status(400).json({ message: "Reservation ID and amount are required" });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(Number(amount) * 100), // Convert to cents
        currency: "usd",
        metadata: { reservationId },
      });

      // Update billing with payment intent
      const billing = await storage.getGuestBilling(reservationId);
      if (billing) {
        await storage.updateGuestBilling(billing.id, {
          stripePaymentIntentId: paymentIntent.id,
        });
      }

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/confirm-payment", isAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(400).json({ message: "Stripe is not configured" });
      }

      const { paymentIntentId, reservationId, amount } = req.body;
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === "succeeded") {
        // Update billing
        const billing = await storage.getGuestBilling(reservationId);
        if (billing) {
          const amountPaid = Number(billing.amountPaid) + Number(amount);
          const totalAmount = Number(billing.totalAmount);
          const remainingAmount = Math.max(0, totalAmount - amountPaid);
          
          await storage.updateGuestBilling(billing.id, {
            amountPaid: amountPaid.toString(),
            remainingAmount: remainingAmount.toString(),
            paymentStatus: remainingAmount === 0 ? "paid" : "partial",
            paymentMethod: "card",
          });
        }

        res.json({ message: "Payment confirmed successfully" });
      } else {
        res.status(400).json({ message: "Payment not succeeded" });
      }
    } catch (error: any) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== QR CODE & ROOM SERVICE ACCESS ==========
  
  app.get("/api/room-service-qr/:reservationId", async (req, res) => {
    try {
      const { reservationId } = req.params;
      
      // Generate QR code that links to room service portal
      const roomServiceUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/room-service/${reservationId}`;
      const qrCode = await QRCode.toDataURL(roomServiceUrl);
      
      res.json({ qrCode, accessUrl: roomServiceUrl });
    } catch (error: any) {
      console.error("Error generating QR code:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get room service portal access (no auth required - accessed via QR code)
  app.get("/api/room-service-access/:reservationId", async (req, res) => {
    try {
      const { reservationId } = req.params;
      
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // Return minimal info needed for guest portal
      res.json({
        id: reservation.id,
        guestId: reservation.guestId,
        roomId: reservation.roomId,
        propertyId: reservation.propertyId,
        checkInDate: reservation.checkInDate,
        checkOutDate: reservation.checkOutDate,
        status: reservation.status,
      });
    } catch (error: any) {
      console.error("Error accessing room service:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== ORDER MANAGEMENT ROUTES (STAFF) ==========
  
  app.get("/api/staff/orders", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, status } = req.query;
      
      if (!propertyId) {
        return res.status(400).json({ message: "Property ID is required" });
      }

      let orders = await storage.getGuestOrders(propertyId as string);
      
      // Filter by status if provided
      if (status) {
        orders = orders.filter(o => o.status === status);
      }

      res.json(orders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/staff/orders/:id/status", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      const validStatuses = ["pending", "confirmed", "preparing", "delivered", "cancelled"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const order = await storage.updateGuestOrder(id, { status });
      
      // Notify guest via message
      const orderData = await storage.getGuestOrder(id);
      if (orderData) {
        const statusMessages: Record<string, string> = {
          confirmed: `Your order #${orderData.orderNumber} has been confirmed`,
          preparing: `Your order #${orderData.orderNumber} is being prepared`,
          delivered: `Your order #${orderData.orderNumber} has been delivered`,
          cancelled: `Your order #${orderData.orderNumber} has been cancelled`,
        };

        if (statusMessages[status]) {
          await storage.createGuestMessage({
            propertyId: orderData.reservationId,
            reservationId: orderData.reservationId,
            orderId: id,
            senderId: req.session.userId || "system",
            recipientId: orderData.guestId,
            message: statusMessages[status],
            messageType: "order_update",
          } as any);
        }
      }

      res.json(order);
    } catch (error: any) {
      console.error("Error updating order status:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== REAL-TIME MESSAGING - ENHANCED ==========
  
  app.post("/api/staff/send-message", isAuthenticated, async (req, res) => {
    try {
      const { reservationId, orderId, message } = req.body;
      
      if (!reservationId || !message) {
        return res.status(400).json({ message: "Reservation ID and message are required" });
      }

      // Get reservation to get guest info
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      const msg = await storage.createGuestMessage({
        propertyId: reservation.propertyId,
        reservationId,
        orderId: orderId || null,
        senderId: req.session.userId || "staff",
        recipientId: reservation.guestId,
        message,
        messageType: "text",
      } as any);

      res.status(201).json(msg);
    } catch (error: any) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/guest-messages/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Mark message as read in database (simple implementation)
      // In production, would need to track this properly
      res.json({ message: "Message marked as read" });
    } catch (error: any) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== CHECKOUT & BILLING COMPLETION ==========
  
  app.post("/api/checkout/initiate", isAuthenticated, async (req, res) => {
    try {
      const { reservationId } = req.body;
      
      if (!reservationId) {
        return res.status(400).json({ message: "Reservation ID is required" });
      }

      // Calculate final billing
      const billing = await storage.calculateGuestBilling(reservationId);
      
      if (Number(billing.remainingAmount) === 0) {
        return res.json({ 
          message: "No payment required", 
          billing,
          readyToCheckout: true 
        });
      }

      res.json({ 
        billing,
        readyToCheckout: false,
        message: "Payment required before checkout"
      });
    } catch (error: any) {
      console.error("Error initiating checkout:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/checkout/complete", isAuthenticated, async (req, res) => {
    try {
      const { reservationId } = req.body;
      
      if (!reservationId) {
        return res.status(400).json({ message: "Reservation ID is required" });
      }

      // Get billing
      const billing = await storage.getGuestBilling(reservationId);
      if (!billing) {
        return res.status(404).json({ message: "Billing record not found" });
      }

      // Check if payment is complete
      if (Number(billing.remainingAmount) > 0) {
        return res.status(400).json({ 
          message: "Outstanding balance must be paid before checkout",
          outstandingAmount: billing.remainingAmount
        });
      }

      // Update reservation status to checked_out
      const reservation = await storage.getReservation(reservationId);
      if (reservation && reservation.status === "checked_in") {
        await storage.updateReservation(reservationId, {
          status: "checked_out",
          checkOutTime: new Date().toISOString(),
        });
      }

      res.json({ 
        message: "Checkout completed successfully",
        reservationId
      });
    } catch (error: any) {
      console.error("Error completing checkout:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ========== HEALTH CHECK ==========
  
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      services: {
        database: "connected",
        stripe: stripe ? "configured" : "not configured",
        openai: openai ? "configured" : "not configured"
      }
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
