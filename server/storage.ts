// Complete database storage implementation for Hotel PMS
// Following javascript_database and javascript_log_in_with_replit blueprints

import {
  users,
  licenses,
  properties,
  roomTypes,
  rooms,
  guests,
  reservations,
  roomServiceCategories,
  roomServiceItems,
  roomServiceRequests,
  ratePlans,
  aiForecasts,
  pricingRecommendations,
  otaConnections,
  type User,
  type UpsertUser,
  type License,
  type InsertLicense,
  type Property,
  type InsertProperty,
  type RoomType,
  type InsertRoomType,
  type Room,
  type InsertRoom,
  type Guest,
  type InsertGuest,
  type Reservation,
  type InsertReservation,
  type RoomServiceCategory,
  type InsertRoomServiceCategory,
  type RoomServiceItem,
  type InsertRoomServiceItem,
  type RoomServiceRequest,
  type InsertRoomServiceRequest,
  type RatePlan,
  type InsertRatePlan,
  type OtaConnection,
  type InsertOtaConnection,
  type AiForecast,
  type PricingRecommendation,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, data: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
  deleteProperty(id: string): Promise<boolean>;
  deleteRoomType(id: string): Promise<boolean>;
  deleteRoom(id: string): Promise<boolean>;
  deleteGuest(id: string): Promise<boolean>;
  deleteReservation(id: string): Promise<boolean>;
  deleteRoomServiceRequest(id: string): Promise<boolean>;
  
  // License operations
  getLicense(id: string): Promise<License | undefined>;
  getLicenseByKey(key: string): Promise<License | undefined>;
  getActiveLicense(): Promise<License | undefined>;
  createLicense(license: InsertLicense): Promise<License>;
  updateLicense(id: string, data: Partial<InsertLicense>): Promise<License>;
  
  // Property operations
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, data: Partial<InsertProperty>): Promise<Property>;
  
  // Room Type operations
  getRoomTypes(propertyId?: string): Promise<RoomType[]>;
  getRoomType(id: string): Promise<RoomType | undefined>;
  createRoomType(roomType: InsertRoomType): Promise<RoomType>;
  updateRoomType(id: string, data: Partial<InsertRoomType>): Promise<RoomType>;
  
  // Room operations
  getRooms(propertyId?: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, data: Partial<InsertRoom>): Promise<Room>;
  
  // Guest operations
  getGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest>;
  
  // Reservation operations
  getReservations(propertyId?: string): Promise<any[]>;
  getReservation(id: string): Promise<Reservation | undefined>;
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  updateReservation(id: string, data: Partial<InsertReservation>): Promise<Reservation>;
  
  // Room Service operations
  getRoomServiceCategories(propertyId: string): Promise<RoomServiceCategory[]>;
  createRoomServiceCategory(category: InsertRoomServiceCategory): Promise<RoomServiceCategory>;
  getRoomServiceItems(propertyId: string): Promise<RoomServiceItem[]>;
  createRoomServiceItem(item: InsertRoomServiceItem): Promise<RoomServiceItem>;
  getRoomServiceRequests(propertyId?: string): Promise<any[]>;
  getRoomServiceRequest(id: string): Promise<RoomServiceRequest | undefined>;
  createRoomServiceRequest(request: InsertRoomServiceRequest): Promise<RoomServiceRequest>;
  updateRoomServiceRequest(id: string, data: Partial<InsertRoomServiceRequest>): Promise<RoomServiceRequest>;
  
  // Rate Plan operations
  getRatePlans(propertyId: string): Promise<RatePlan[]>;
  createRatePlan(plan: InsertRatePlan): Promise<RatePlan>;
  
  // AI Forecasts operations
  getAiForecasts(propertyId: string, startDate?: Date, endDate?: Date): Promise<AiForecast[]>;
  createAiForecast(forecast: any): Promise<AiForecast>;
  
  // Pricing Recommendations operations
  getPricingRecommendations(propertyId: string, startDate?: Date): Promise<PricingRecommendation[]>;
  createPricingRecommendation(rec: any): Promise<PricingRecommendation>;
  
  // OTA Connection operations
  getOtaConnections(propertyId: string): Promise<OtaConnection[]>;
  createOtaConnection(connection: InsertOtaConnection): Promise<OtaConnection>;
  
  // Dashboard Stats
  getDashboardStats(propertyId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // ========== HELPER FUNCTIONS ==========
  
  /**
   * Calculate number of nights between check-in and check-out dates
   */
  private calculateNights(checkInDate: string | Date, checkOutDate: string | Date): number {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    
    // Set time to midnight for accurate calculation
    checkIn.setHours(0, 0, 0, 0);
    checkOut.setHours(0, 0, 0, 0);
    
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return Math.max(1, nights); // Minimum 1 night
  }

  /**
   * Calculate total cost based on rate per night and number of nights
   */
  private calculateTotalCost(ratePerNight: string | number, nights: number): string {
    const rate = typeof ratePerNight === 'string' ? parseFloat(ratePerNight) : ratePerNight;
    const total = rate * nights;
    return total.toFixed(2);
  }

  /**
   * Check if rooms are available for given dates and room type
   */
  async checkRoomAvailability(
    propertyId: string,
    roomTypeId: string,
    checkInDate: string | Date,
    checkOutDate: string | Date,
    excludeReservationId?: string
  ): Promise<Room[]> {
    const checkIn = new Date(checkInDate).toISOString().split('T')[0];
    const checkOut = new Date(checkOutDate).toISOString().split('T')[0];

    // Get all rooms of this type
    const roomsOfType = await db
      .select()
      .from(rooms)
      .where(and(
        eq(rooms.propertyId, propertyId),
        eq(rooms.roomTypeId, roomTypeId)
      ));

    // Get conflicting reservations
    let conflictQuery = db
      .select()
      .from(reservations)
      .where(and(
        eq(reservations.propertyId, propertyId),
        eq(reservations.roomTypeId, roomTypeId),
        sql`${reservations.checkInDate} < ${checkOut}`,
        sql`${reservations.checkOutDate} > ${checkIn}`,
        sql`${reservations.status} IN ('confirmed', 'checked_in')`
      ));

    if (excludeReservationId) {
      conflictQuery = conflictQuery.where(sql`${reservations.id} != ${excludeReservationId}`);
    }

    const conflicts = await conflictQuery;
    const bookedRoomIds = new Set(conflicts.map(r => r.roomId).filter(Boolean));

    // Return available rooms (not in conflicts and available status)
    return roomsOfType.filter(r => 
      !bookedRoomIds.has(r.id) && r.status === 'available'
    );
  }

  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

async updateUser(id: string, data: Partial<UpsertUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

async deleteUser(id: string): Promise<boolean> {
  const result = await db.delete(users).where(eq(users.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteProperty(id: string): Promise<boolean> {
  const result = await db.delete(properties).where(eq(properties.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteRoomType(id: string): Promise<boolean> {
  const result = await db.delete(roomTypes).where(eq(roomTypes.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteRoom(id: string): Promise<boolean> {
  const result = await db.delete(rooms).where(eq(rooms.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteGuest(id: string): Promise<boolean> {
  const result = await db.delete(guests).where(eq(guests.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteReservation(id: string): Promise<boolean> {
  const result = await db.delete(reservations).where(eq(reservations.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}

async deleteRoomServiceRequest(id: string): Promise<boolean> {
  const result = await db.delete(roomServiceRequests).where(eq(roomServiceRequests.id, id));
  return result.rowCount !== null && result.rowCount > 0;
}






  
  // License operations
  async getLicense(id: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async getLicenseByKey(key: string): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.licenseKey, key));
    return license;
  }

  async getActiveLicense(): Promise<License | undefined> {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        sql`${licenses.subscriptionStatus} IN ('trial', 'active') AND ${licenses.expiresAt} > NOW()`
      )
      .limit(1);
    return license;
  }

  async createLicense(licenseData: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(licenseData).returning();
    return license;
  }

  async updateLicense(id: string, data: Partial<InsertLicense>): Promise<License> {
    const [license] = await db
      .update(licenses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(licenses.id, id))
      .returning();
    return license;
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties).orderBy(desc(properties.createdAt));
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(propertyData: InsertProperty): Promise<Property> {
    const [property] = await db.insert(properties).values(propertyData).returning();
    return property;
  }

  async updateProperty(id: string, data: Partial<InsertProperty>): Promise<Property> {
    const [property] = await db
      .update(properties)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(properties.id, id))
      .returning();
    return property;
  }

  // Room Type operations
  async getRoomTypes(propertyId?: string): Promise<RoomType[]> {
    if (propertyId) {
      return await db.select().from(roomTypes).where(eq(roomTypes.propertyId, propertyId));
    }
    return await db.select().from(roomTypes);
  }

  async getRoomType(id: string): Promise<RoomType | undefined> {
    const [roomType] = await db.select().from(roomTypes).where(eq(roomTypes.id, id));
    return roomType;
  }

  async createRoomType(roomTypeData: InsertRoomType): Promise<RoomType> {
    const [roomType] = await db.insert(roomTypes).values(roomTypeData).returning();
    return roomType;
  }

  async updateRoomType(id: string, data: Partial<InsertRoomType>): Promise<RoomType> {
    const [roomType] = await db
      .update(roomTypes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roomTypes.id, id))
      .returning();
    return roomType;
  }

  // Room operations
  async getRooms(propertyId?: string): Promise<Room[]> {
    if (propertyId) {
      return await db.select().from(rooms).where(eq(rooms.propertyId, propertyId));
    }
    return await db.select().from(rooms);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async createRoom(roomData: InsertRoom): Promise<Room> {
    const [room] = await db.insert(rooms).values(roomData).returning();
    return room;
  }

  async updateRoom(id: string, data: Partial<InsertRoom>): Promise<Room> {
    const [room] = await db
      .update(rooms)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(rooms.id, id))
      .returning();
    return room;
  }

  // Guest operations
  async getGuests(): Promise<Guest[]> {
    return await db.select().from(guests).orderBy(desc(guests.createdAt));
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const [guest] = await db.select().from(guests).where(eq(guests.id, id));
    return guest;
  }

  async createGuest(guestData: InsertGuest): Promise<Guest> {
    const [guest] = await db.insert(guests).values(guestData).returning();
    return guest;
  }

  async updateGuest(id: string, data: Partial<InsertGuest>): Promise<Guest> {
    const [guest] = await db
      .update(guests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(guests.id, id))
      .returning();
    return guest;
  }

  // Reservation operations
  async getReservations(propertyId?: string): Promise<any[]> {
    const query = propertyId
      ? db
          .select()
          .from(reservations)
          .leftJoin(guests, eq(reservations.guestId, guests.id))
          .leftJoin(roomTypes, eq(reservations.roomTypeId, roomTypes.id))
          .leftJoin(rooms, eq(reservations.roomId, rooms.id))
          .where(eq(reservations.propertyId, propertyId))
          .orderBy(desc(reservations.createdAt))
      : db
          .select()
          .from(reservations)
          .leftJoin(guests, eq(reservations.guestId, guests.id))
          .leftJoin(roomTypes, eq(reservations.roomTypeId, roomTypes.id))
          .leftJoin(rooms, eq(reservations.roomId, rooms.id))
          .orderBy(desc(reservations.createdAt));

    const results = await query;
    return results.map((r) => ({
      ...r.reservations,
      guest: r.guests,
      roomType: r.room_types,
      room: r.rooms,
    }));
  }

  async getReservation(id: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation;
  }

  async createReservation(reservationData: InsertReservation): Promise<Reservation> {
    // Auto-calculate nights and total amount
    const nights = this.calculateNights(reservationData.checkInDate, reservationData.checkOutDate);
    const totalAmount = this.calculateTotalCost(reservationData.ratePerNight, nights);

    // Prepare reservation data with auto-calculated values
    const reservationToInsert = {
      ...reservationData,
      totalAmount: totalAmount,
    };

    const [reservation] = await db.insert(reservations).values(reservationToInsert).returning();

    // Auto-update room status to 'blocked' if a specific room was assigned
    if (reservation.roomId) {
      await this.updateRoom(reservation.roomId, { status: 'blocked' });
    }

    return reservation;
  }

  async updateReservation(id: string, data: Partial<InsertReservation>): Promise<Reservation> {
    // Get current reservation to manage room status
    const currentReservation = await this.getReservation(id);
    if (!currentReservation) {
      throw new Error("Reservation not found");
    }

    // If check-in/out dates changed, recalculate total amount
    let updateData = { ...data };
    if (data.checkInDate || data.checkOutDate) {
      const checkInDate = data.checkInDate || currentReservation.checkInDate;
      const checkOutDate = data.checkOutDate || currentReservation.checkOutDate;
      const nights = this.calculateNights(checkInDate, checkOutDate);
      const ratePerNight = data.ratePerNight || currentReservation.ratePerNight;
      updateData.totalAmount = this.calculateTotalCost(ratePerNight, nights) as any;
    }

    // If status changes to checked_out or cancelled, mark room as available
    if (data.status && (data.status === 'checked_out' || data.status === 'cancelled') && currentReservation.roomId) {
      await this.updateRoom(currentReservation.roomId, { status: 'available' });
    }

    // If status changes to checked_in, mark room as occupied
    if (data.status === 'checked_in' && currentReservation.roomId) {
      await this.updateRoom(currentReservation.roomId, { status: 'occupied' });
    }

    const [reservation] = await db
      .update(reservations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(reservations.id, id))
      .returning();
    return reservation;
  }

  // Room Service operations
  async getRoomServiceCategories(propertyId: string): Promise<RoomServiceCategory[]> {
    return await db
      .select()
      .from(roomServiceCategories)
      .where(eq(roomServiceCategories.propertyId, propertyId))
      .orderBy(roomServiceCategories.displayOrder);
  }

  async createRoomServiceCategory(categoryData: InsertRoomServiceCategory): Promise<RoomServiceCategory> {
    const [category] = await db.insert(roomServiceCategories).values(categoryData).returning();
    return category;
  }

  async getRoomServiceItems(propertyId: string): Promise<RoomServiceItem[]> {
    return await db
      .select()
      .from(roomServiceItems)
      .where(eq(roomServiceItems.propertyId, propertyId));
  }

  async createRoomServiceItem(itemData: InsertRoomServiceItem): Promise<RoomServiceItem> {
    const [item] = await db.insert(roomServiceItems).values(itemData).returning();
    return item;
  }

  async getRoomServiceRequests(propertyId?: string): Promise<any[]> {
    const query = propertyId
      ? db
          .select()
          .from(roomServiceRequests)
          .leftJoin(rooms, eq(roomServiceRequests.roomId, rooms.id))
          .leftJoin(guests, eq(roomServiceRequests.guestId, guests.id))
          .where(eq(roomServiceRequests.propertyId, propertyId))
          .orderBy(desc(roomServiceRequests.createdAt))
      : db
          .select()
          .from(roomServiceRequests)
          .leftJoin(rooms, eq(roomServiceRequests.roomId, rooms.id))
          .leftJoin(guests, eq(roomServiceRequests.guestId, guests.id))
          .orderBy(desc(roomServiceRequests.createdAt));

    const results = await query;
    return results.map((r) => ({
      ...r.room_service_requests,
      room: r.rooms,
      guest: r.guests,
    }));
  }

  async getRoomServiceRequest(id: string): Promise<RoomServiceRequest | undefined> {
    const [request] = await db
      .select()
      .from(roomServiceRequests)
      .where(eq(roomServiceRequests.id, id));
    return request;
  }

  async createRoomServiceRequest(requestData: InsertRoomServiceRequest): Promise<RoomServiceRequest> {
    const [request] = await db.insert(roomServiceRequests).values(requestData).returning();
    return request;
  }

  async updateRoomServiceRequest(
    id: string,
    data: Partial<InsertRoomServiceRequest>
  ): Promise<RoomServiceRequest> {
    const [request] = await db
      .update(roomServiceRequests)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(roomServiceRequests.id, id))
      .returning();
    return request;
  }

  // Rate Plan operations
  async getRatePlans(propertyId: string): Promise<RatePlan[]> {
    return await db.select().from(ratePlans).where(eq(ratePlans.propertyId, propertyId));
  }

  async createRatePlan(planData: InsertRatePlan): Promise<RatePlan> {
    const [plan] = await db.insert(ratePlans).values(planData).returning();
    return plan;
  }

  // AI Forecasts operations
  async getAiForecasts(
    propertyId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AiForecast[]> {
    let query = db.select().from(aiForecasts).where(eq(aiForecasts.propertyId, propertyId));

    if (startDate && endDate) {
      query = query.where(
        and(gte(aiForecasts.forecastDate, startDate.toISOString().split("T")[0]), lte(aiForecasts.forecastDate, endDate.toISOString().split("T")[0]))
      );
    }

    return await query.orderBy(aiForecasts.forecastDate);
  }

  async createAiForecast(forecastData: any): Promise<AiForecast> {
    const [forecast] = await db.insert(aiForecasts).values(forecastData).returning();
    return forecast;
  }

  // Pricing Recommendations operations
  async getPricingRecommendations(
    propertyId: string,
    startDate?: Date
  ): Promise<PricingRecommendation[]> {
    let query = db
      .select()
      .from(pricingRecommendations)
      .where(eq(pricingRecommendations.propertyId, propertyId));

    if (startDate) {
      query = query.where(gte(pricingRecommendations.recommendedDate, startDate.toISOString().split("T")[0]));
    }

    return await query.orderBy(pricingRecommendations.recommendedDate);
  }

  async createPricingRecommendation(recData: any): Promise<PricingRecommendation> {
    const [rec] = await db.insert(pricingRecommendations).values(recData).returning();
    return rec;
  }

  // OTA Connection operations
  async getOtaConnections(propertyId: string): Promise<OtaConnection[]> {
    return await db
      .select()
      .from(otaConnections)
      .where(eq(otaConnections.propertyId, propertyId));
  }

  async createOtaConnection(connectionData: InsertOtaConnection): Promise<OtaConnection> {
    const [connection] = await db.insert(otaConnections).values(connectionData).returning();
    return connection;
  }

  // Dashboard Stats
  async getDashboardStats(propertyId: string): Promise<any> {
    const today = new Date().toISOString().split("T")[0];

    // Get today's arrivals and departures
    const todayReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          sql`${reservations.checkInDate} = ${today} OR ${reservations.checkOutDate} = ${today}`
        )
      );

    const todayArrivals = todayReservations.filter((r) => r.checkInDate === today).length;
    const todayDepartures = todayReservations.filter((r) => r.checkOutDate === today).length;

    // Get current occupancy
    const totalRooms = await db
      .select({ count: sql<number>`count(*)` })
      .from(rooms)
      .where(eq(rooms.propertyId, propertyId));

    const occupiedRooms = await db
      .select({ count: sql<number>`count(*)` })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          eq(reservations.status, "checked_in" as any)
        )
      );

    const totalRoomsCount = Number(totalRooms[0]?.count || 0);
    const occupiedCount = Number(occupiedRooms[0]?.count || 0);
    const currentOccupancy = totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0;

    // Get today's revenue
    const todayRevenue = await db
      .select({ total: sql<number>`SUM(${reservations.totalAmount})` })
      .from(reservations)
      .where(
        and(
          eq(reservations.propertyId, propertyId),
          sql`DATE(${reservations.createdAt}) = ${today}`
        )
      );

    // Get pending room service
    const pendingRoomService = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomServiceRequests)
      .where(
        and(
          eq(roomServiceRequests.propertyId, propertyId),
          sql`${roomServiceRequests.status} IN ('pending', 'confirmed')`
        )
      );

    return {
      todayArrivals,
      todayDepartures,
      currentOccupancy,
      totalRevenue: Number(todayRevenue[0]?.total || 0),
      pendingRoomService: Number(pendingRoomService[0]?.count || 0),
      availableRooms: totalRoomsCount - occupiedCount,
    };
  }
}

export const storage = new DatabaseStorage();
