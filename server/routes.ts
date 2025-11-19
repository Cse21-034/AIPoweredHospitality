// Complete API routes for Hotel PMS
// Following javascript_log_in_with_replit, javascript_stripe, and javascript_openai blueprints

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
  insertRoomServiceRequestSchema,
  insertRatePlanSchema,
} from "@shared/schema";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-29.clover" })
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Helper function to generate license key
function generateLicenseKey(): string {
  const randomPart = randomBytes(8).toString("hex").toUpperCase();
  const checksum = randomBytes(2).toString("hex").toUpperCase();
  return `HPMS-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}-${randomPart.slice(8, 12)}-${checksum}`;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // ========== AUTH ROUTES ==========
  
  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: "staff",
      });
      
      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } catch (error) {
      console.error("Error during signup:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      req.session.userId = user.id;
      res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
  
  // Get current user
  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== LICENSE & SUBSCRIPTION ROUTES ==========
  
  // Get current license
  app.get("/api/license/current", isAuthenticated, async (req, res) => {
    try {
      const license = await storage.getActiveLicense();
      if (!license) {
        // Create trial license on first access
        const newLicense = await storage.createLicense({
          licenseKey: generateLicenseKey(),
          subscriptionStatus: "trial",
          activatedAt: new Date(),
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
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

  // Create subscription (Stripe)
  app.post("/api/subscription/create", isAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to environment variables." });
      }

      const { plan } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let customerId = user.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          name: `${user.firstName} ${user.lastName}`,
        });
        customerId = customer.id;
        await storage.upsertUser({ ...user, stripeCustomerId: customerId });
      }

      // Create subscription
      const priceId = plan === "yearly" ? process.env.STRIPE_PRICE_ID_YEARLY : process.env.STRIPE_PRICE_ID_MONTHLY;
      
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId || "price_placeholder" }],
        payment_behavior: "default_incomplete",
        expand: ["latest_invoice.payment_intent"],
      });

      // Update license
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
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/properties", isAuthenticated, async (req, res) => {
    try {
      const data = insertPropertySchema.parse(req.body);
      const property = await storage.createProperty(data);
      res.json(property);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== ROOM TYPE ROUTES ==========
  
  app.get("/api/room-types", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const roomTypes = await storage.getRoomTypes(propertyId);
      res.json(roomTypes);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/room-types", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomTypeSchema.parse(req.body);
      const roomType = await storage.createRoomType(data);
      res.json(roomType);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== ROOM ROUTES ==========
  
  app.get("/api/rooms", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const rooms = await storage.getRooms(propertyId);
      res.json(rooms);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/rooms", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomSchema.parse(req.body);
      const room = await storage.createRoom(data);
      res.json(room);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== GUEST ROUTES ==========
  
  app.get("/api/guests", isAuthenticated, async (req, res) => {
    try {
      const guests = await storage.getGuests();
      res.json(guests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/guests", isAuthenticated, async (req, res) => {
    try {
      const data = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(data);
      res.json(guest);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== RESERVATION ROUTES ==========
  
  app.get("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const reservations = await storage.getReservations(propertyId);
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/reservations", isAuthenticated, async (req, res) => {
    try {
      const data = insertReservationSchema.parse(req.body);
      const reservation = await storage.createReservation(data);
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== ROOM SERVICE ROUTES ==========
  
  app.get("/api/room-service", isAuthenticated, async (req, res) => {
    try {
      const propertyId = req.query.propertyId as string;
      const requests = await storage.getRoomServiceRequests(propertyId);
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/room-service", isAuthenticated, async (req, res) => {
    try {
      const data = insertRoomServiceRequestSchema.parse(req.body);
      const request = await storage.createRoomServiceRequest(data);
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/room-service/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const request = await storage.updateRoomServiceRequest(id, { status });
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // ========== DASHBOARD STATS ==========
  
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      // Get first property for demo
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
        });
      }

      const stats = await storage.getDashboardStats(propertyId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ========== AI ROUTES (License-gated) ==========
  
  // AI Demand Forecasting
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

      // Get historical data for forecasting
      const reservations = await storage.getReservations(propertyId);
      
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const prompt = `Based on hotel reservation data, forecast demand for the next ${days} days. Return JSON with daily predictions including occupancy percentage and confidence level.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are an AI assistant specialized in hotel revenue management and demand forecasting." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const forecast = JSON.parse(response.choices[0].message.content || "{}");
      res.json(forecast);
    } catch (error: any) {
      console.error("Error generating forecast:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Dynamic Pricing
  app.post("/api/ai/pricing", isAuthenticated, async (req, res) => {
    try {
      if (!openai) {
        return res.status(503).json({ message: "OpenAI is not configured. Please add OPENAI_API_KEY to environment variables." });
      }

      const license = await storage.getActiveLicense();
      if (!license || (license.subscriptionStatus !== "active" && license.subscriptionStatus !== "trial")) {
        return res.status(403).json({ message: "Active subscription required for AI features" });
      }

      const { propertyId, roomTypeId, currentPrice, occupancy, date } = req.body;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const prompt = `As a revenue manager, recommend an optimal room price. Current price: $${currentPrice}, Current occupancy: ${occupancy}%, Date: ${date}. Return JSON with recommendedPrice, reasoning, and confidence.`;
      
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          { role: "system", content: "You are an AI revenue management expert for hotels." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const pricing = JSON.parse(response.choices[0].message.content || "{}");
      res.json(pricing);
    } catch (error: any) {
      console.error("Error generating pricing:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
