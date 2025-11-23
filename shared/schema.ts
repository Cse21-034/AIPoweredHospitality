// Complete database schema for AI-Powered Hotel PMS
// Following javascript_log_in_with_replit and javascript_database blueprints

import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  decimal,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== SESSION & AUTH TABLES (Required for Replit Auth) ==========

export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("staff"), // guest, staff, manager, admin, super_admin
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== LICENSE & SUBSCRIPTION TABLES ==========

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "trial",
  "active",
  "expired",
  "cancelled",
  "grace_period",
]);

export const licenses = pgTable("licenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  licenseKey: varchar("license_key").notNull().unique(),
  propertyId: varchar("property_id"), // nullable for initial activation
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .notNull()
    .default("trial"),
  subscriptionType: varchar("subscription_type"), // monthly, yearly
  activatedAt: timestamp("activated_at"),
  expiresAt: timestamp("expires_at").notNull(),
  trialEndsAt: timestamp("trial_ends_at"),
  gracePeriodEndsAt: timestamp("grace_period_ends_at"),
  featuresUnlocked: jsonb("features_unlocked").notNull().default('{"ai": false, "unlimited_properties": false, "advanced_reports": false}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== PROPERTY & ROOM TABLES ==========

export const properties = pgTable("properties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  address: text("address"),
  city: varchar("city"),
  country: varchar("country"),
  timezone: varchar("timezone").default("UTC"),
  currency: varchar("currency").default("USD"),
  phoneNumber: varchar("phone_number"),
  email: varchar("email"),
  website: varchar("website"),
  licenseId: varchar("license_id").references(() => licenses.id),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roomTypes = pgTable("room_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  maxOccupancy: integer("max_occupancy").notNull().default(2),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  amenities: jsonb("amenities").default('[]'),
  images: jsonb("images").default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  roomTypeId: varchar("room_type_id")
    .notNull()
    .references(() => roomTypes.id),
  roomNumber: varchar("room_number").notNull(),
  floor: integer("floor"),
  status: varchar("status").notNull().default("available"), // available, occupied, cleaning, maintenance, blocked
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== GUEST & RESERVATION TABLES ==========

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phoneNumber: varchar("phone_number"),
  nationality: varchar("nationality"),
  dateOfBirth: date("date_of_birth"),
  passportNumber: varchar("passport_number"),
  address: text("address"),
  preferences: jsonb("preferences").default('{}'),
  loyaltyStatus: varchar("loyalty_status").default("standard"), // standard, silver, gold, platinum
  totalBookings: integer("total_bookings").default(0),
  totalSpend: decimal("total_spend", { precision: 10, scale: 2 }).default("0"),
  lastStayDate: date("last_stay_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
]);

export const reservations = pgTable("reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  guestId: varchar("guest_id")
    .notNull()
    .references(() => guests.id),
  roomId: varchar("room_id").references(() => rooms.id),
  roomTypeId: varchar("room_type_id")
    .notNull()
    .references(() => roomTypes.id),
  bookingSource: varchar("booking_source").notNull().default("direct"), // direct, booking_com, expedia, airbnb, etc.
  externalBookingId: varchar("external_booking_id"), // For OTA integration
  status: reservationStatusEnum("status").notNull().default("confirmed"),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date").notNull(),
  numberOfGuests: integer("number_of_guests").notNull().default(1),
  ratePerNight: decimal("rate_per_night", { precision: 10, scale: 2 }).notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  depositAmount: decimal("deposit_amount", { precision: 10, scale: 2 }).default("0"),
  specialRequests: text("special_requests"),
  checkInTime: timestamp("check_in_time"),
  checkOutTime: timestamp("check_out_time"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== ROOM SERVICE TABLES ==========

export const roomServiceCategories = pgTable("room_service_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const roomServiceItems = pgTable("room_service_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  categoryId: varchar("category_id")
    .notNull()
    .references(() => roomServiceCategories.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  isAvailable: boolean("is_available").default(true),
  preparationTime: integer("preparation_time").default(30), // in minutes
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roomServiceRequestStatusEnum = pgEnum("room_service_request_status", [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
]);

export const roomServiceRequests = pgTable("room_service_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  reservationId: varchar("reservation_id")
    .notNull()
    .references(() => reservations.id),
  roomId: varchar("room_id")
    .notNull()
    .references(() => rooms.id),
  guestId: varchar("guest_id")
    .notNull()
    .references(() => guests.id),
  items: jsonb("items").notNull(), // [{itemId, name, quantity, price}]
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: roomServiceRequestStatusEnum("status").notNull().default("pending"),
  priority: varchar("priority").notNull().default("normal"), // low, normal, high, urgent
  specialInstructions: text("special_instructions"),
  assignedToUserId: varchar("assigned_to_user_id").references(() => users.id),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== RATE MANAGEMENT TABLES ==========

export const ratePlans = pgTable("rate_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  roomTypeId: varchar("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "cascade" }),
  name: varchar("name").notNull(),
  description: text("description"),
  baseRate: decimal("base_rate", { precision: 10, scale: 2 }).notNull(),
  seasonalRates: jsonb("seasonal_rates").default('[]'), // [{startDate, endDate, rate}]
  minimumStay: integer("minimum_stay").default(1),
  maximumStay: integer("maximum_stay"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== AI & ANALYTICS TABLES ==========

export const aiForecasts = pgTable("ai_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  roomTypeId: varchar("room_type_id").references(() => roomTypes.id),
  forecastType: varchar("forecast_type").notNull(), // demand, occupancy, revenue
  forecastDate: date("forecast_date").notNull(),
  predictedValue: decimal("predicted_value", { precision: 10, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  insights: jsonb("insights").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricingRecommendations = pgTable("pricing_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  roomTypeId: varchar("room_type_id")
    .notNull()
    .references(() => roomTypes.id, { onDelete: "cascade" }),
  recommendedDate: date("recommended_date").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  recommendedPrice: decimal("recommended_price", { precision: 10, scale: 2 }).notNull(),
  reasoning: text("reasoning"),
  projectedRevenue: decimal("projected_revenue", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  isApplied: boolean("is_applied").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== OTA INTEGRATION TABLES ==========

export const otaConnections = pgTable("ota_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  platform: varchar("platform").notNull(), // booking_com, expedia, airbnb, etc.
  credentials: jsonb("credentials").notNull(), // encrypted API keys/tokens
  isActive: boolean("is_active").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  settings: jsonb("settings").default('{}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== RELATIONS ==========

export const usersRelations = relations(users, ({ many }) => ({
  roomServiceRequests: many(roomServiceRequests),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  license: one(licenses, {
    fields: [properties.licenseId],
    references: [licenses.id],
  }),
  roomTypes: many(roomTypes),
  rooms: many(rooms),
  reservations: many(reservations),
  roomServiceCategories: many(roomServiceCategories),
  roomServiceItems: many(roomServiceItems),
  roomServiceRequests: many(roomServiceRequests),
  ratePlans: many(ratePlans),
  aiForecasts: many(aiForecasts),
  pricingRecommendations: many(pricingRecommendations),
  otaConnections: many(otaConnections),
}));

export const roomTypesRelations = relations(roomTypes, ({ one, many }) => ({
  property: one(properties, {
    fields: [roomTypes.propertyId],
    references: [properties.id],
  }),
  rooms: many(rooms),
  reservations: many(reservations),
  ratePlans: many(ratePlans),
  aiForecasts: many(aiForecasts),
  pricingRecommendations: many(pricingRecommendations),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  roomType: one(roomTypes, {
    fields: [rooms.roomTypeId],
    references: [roomTypes.id],
  }),
  reservations: many(reservations),
  roomServiceRequests: many(roomServiceRequests),
}));

export const guestsRelations = relations(guests, ({ many }) => ({
  reservations: many(reservations),
  roomServiceRequests: many(roomServiceRequests),
}));

export const reservationsRelations = relations(reservations, ({ one, many }) => ({
  property: one(properties, {
    fields: [reservations.propertyId],
    references: [properties.id],
  }),
  guest: one(guests, {
    fields: [reservations.guestId],
    references: [guests.id],
  }),
  room: one(rooms, {
    fields: [reservations.roomId],
    references: [rooms.id],
  }),
  roomType: one(roomTypes, {
    fields: [reservations.roomTypeId],
    references: [roomTypes.id],
  }),
  roomServiceRequests: many(roomServiceRequests),
}));

export const roomServiceCategoriesRelations = relations(
  roomServiceCategories,
  ({ one, many }) => ({
    property: one(properties, {
      fields: [roomServiceCategories.propertyId],
      references: [properties.id],
    }),
    items: many(roomServiceItems),
  }),
);

export const roomServiceItemsRelations = relations(roomServiceItems, ({ one }) => ({
  property: one(properties, {
    fields: [roomServiceItems.propertyId],
    references: [properties.id],
  }),
  category: one(roomServiceCategories, {
    fields: [roomServiceItems.categoryId],
    references: [roomServiceCategories.id],
  }),
}));

export const roomServiceRequestsRelations = relations(roomServiceRequests, ({ one }) => ({
  property: one(properties, {
    fields: [roomServiceRequests.propertyId],
    references: [properties.id],
  }),
  reservation: one(reservations, {
    fields: [roomServiceRequests.reservationId],
    references: [reservations.id],
  }),
  room: one(rooms, {
    fields: [roomServiceRequests.roomId],
    references: [rooms.id],
  }),
  guest: one(guests, {
    fields: [roomServiceRequests.guestId],
    references: [guests.id],
  }),
  assignedTo: one(users, {
    fields: [roomServiceRequests.assignedToUserId],
    references: [users.id],
  }),
}));

// ========== ZODS SCHEMAS & TYPES ==========

export const insertLicenseSchema = createInsertSchema(licenses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPropertySchema = createInsertSchema(properties).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomTypeSchema = createInsertSchema(roomTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReservationSchema = createInsertSchema(reservations)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    checkInDate: z.string().or(z.date()),
    checkOutDate: z.string().or(z.date()),
    ratePerNight: z.string().or(z.number()),
    totalAmount: z.string().or(z.number()),
  })
  .refine(
    (data) => new Date(data.checkInDate) < new Date(data.checkOutDate),
    {
      message: "Check-out date must be after check-in date",
      path: ["checkOutDate"],
    }
  );

// Schema for partial updates (check-in, check-out, status changes, etc.)
export const updateReservationSchema = z.object({
  status: z.enum(["confirmed", "checked_in", "checked_out", "cancelled", "no_show", "pending"]).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  numberOfGuests: z.number().optional(),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
}).strict();

export const insertRoomServiceCategorySchema = createInsertSchema(roomServiceCategories).omit({
  id: true,
  createdAt: true,
});

export const insertRoomServiceItemSchema = createInsertSchema(roomServiceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRoomServiceRequestSchema = createInsertSchema(roomServiceRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRatePlanSchema = createInsertSchema(ratePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOtaConnectionSchema = createInsertSchema(otaConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Export types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertLicense = z.infer<typeof insertLicenseSchema>;
export type License = typeof licenses.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;
export type InsertRoomType = z.infer<typeof insertRoomTypeSchema>;
export type RoomType = typeof roomTypes.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertRoomServiceCategory = z.infer<typeof insertRoomServiceCategorySchema>;
export type RoomServiceCategory = typeof roomServiceCategories.$inferSelect;
export type InsertRoomServiceItem = z.infer<typeof insertRoomServiceItemSchema>;
export type RoomServiceItem = typeof roomServiceItems.$inferSelect;
export type InsertRoomServiceRequest = z.infer<typeof insertRoomServiceRequestSchema>;
export type RoomServiceRequest = typeof roomServiceRequests.$inferSelect;
export type InsertRatePlan = z.infer<typeof insertRatePlanSchema>;
export type RatePlan = typeof ratePlans.$inferSelect;
export type InsertOtaConnection = z.infer<typeof insertOtaConnectionSchema>;
export type OtaConnection = typeof otaConnections.$inferSelect;
export type AiForecast = typeof aiForecasts.$inferSelect;
export type PricingRecommendation = typeof pricingRecommendations.$inferSelect;
