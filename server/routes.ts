import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import OpenAI from "openai";
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

  // ========== DASHBOARD STATS ==========
  
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
