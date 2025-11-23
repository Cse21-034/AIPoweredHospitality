// Comprehensive ML & Analytics Schema Extension
// Tables for demand forecasting, dynamic pricing, guest personalization, maintenance prediction, fraud detection, sentiment analysis

import { sql } from "drizzle-orm";
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
  real,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ========== DEMAND FORECASTING TABLES ==========

export const demandForecastingData = pgTable("demand_forecasting_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomTypeId: varchar("room_type_id"),
  forecastDate: date("forecast_date").notNull(),
  bookingsCount: integer("bookings_count").notNull().default(0),
  checkinsCount: integer("checkins_count").notNull().default(0),
  nightsSold: integer("nights_sold").notNull().default(0),
  availableRooms: integer("available_rooms").notNull(),
  avgRate: decimal("avg_rate", { precision: 10, scale: 2 }),
  occupancyRate: decimal("occupancy_rate", { precision: 5, scale: 2 }),
  eventsLocal: jsonb("events_local"), // {"event":"conference","attendees":200}
  weatherAvgTempC: real("weather_avg_temp_c"),
  holidayFlag: boolean("holiday_flag").default(false),
  marketIndex: real("market_index"),
  dayOfWeek: integer("day_of_week"), // 0-6
  month: integer("month"), // 1-12
  promotionActive: boolean("promotion_active").default(false),
  channelMix: jsonb("channel_mix"), // {direct: 0.4, ota: 0.6}
  leadTime: integer("lead_time"), // days between booking and arrival
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomTypeId: varchar("room_type_id"),
  forecastDate: date("forecast_date").notNull(),
  modelVersion: varchar("model_version").notNull(),
  predictedNightsSold: integer("predicted_nights_sold"),
  predictedOccupancy: decimal("predicted_occupancy", { precision: 5, scale: 2 }),
  predictedRevenue: decimal("predicted_revenue", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }), // 0-100
  predictionError: decimal("prediction_error", { precision: 5, scale: 2 }), // actual - predicted
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== DYNAMIC PRICING TABLES ==========

export const dynamicPricingData = pgTable("dynamic_pricing_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomTypeId: varchar("room_type_id").notNull(),
  decisionDate: date("decision_date").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  competitorPricesAvg: decimal("competitor_prices_avg", { precision: 10, scale: 2 }),
  occupancyRate: decimal("occupancy_rate", { precision: 5, scale: 2 }),
  leadTimeDays: integer("lead_time_days"),
  bookingWindow: integer("booking_window"), // 7, 30, etc.
  weekdayFlag: boolean("weekday_flag"),
  specialOfferFlag: boolean("special_offer_flag"),
  dayOfWeekBooking: integer("day_of_week_booking"),
  monthBooking: integer("month_booking"),
  realizedPrice: decimal("realized_price", { precision: 10, scale: 2 }), // actual price charged
  realizedRevenue: decimal("realized_revenue", { precision: 10, scale: 2 }), // revenue for this decision
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pricingOptimizations = pgTable("pricing_optimizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomTypeId: varchar("room_type_id").notNull(),
  decisionDate: date("decision_date").notNull(),
  currentPrice: decimal("current_price", { precision: 10, scale: 2 }).notNull(),
  recommendedPrice: decimal("recommended_price", { precision: 10, scale: 2 }).notNull(),
  modelVersion: varchar("model_version"),
  reasoning: text("reasoning"),
  projectedRevenueIncrease: decimal("projected_revenue_increase", { precision: 10, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  isApplied: boolean("is_applied").default(false),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== GUEST PERSONALIZATION & CHURN PREDICTION ==========

export const guestStayData = pgTable("guest_stay_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  reservationId: varchar("reservation_id").notNull(),
  arrivalDate: date("arrival_date").notNull(),
  lengthOfStayDays: integer("length_of_stay_days").notNull(),
  roomTypeBooked: varchar("room_type_booked"),
  spendTotal: decimal("spend_total", { precision: 10, scale: 2 }),
  purchasesJson: jsonb("purchases_json"), // [{type: "spa", amount: 50}, {type: "dining", amount: 120}]
  ageRange: varchar("age_range"), // "18-25", "26-35", etc.
  nationality: varchar("nationality"),
  feedbackScore: integer("feedback_score"), // 1-10
  preferences: jsonb("preferences"), // {pillow_type: "memory", breakfast: true}
  channel: varchar("channel"), // OTA, direct, etc.
  isRepeatGuest: boolean("is_repeat_guest"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guestChurnPredictions = pgTable("guest_churn_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  reservationId: varchar("reservation_id").notNull(),
  modelVersion: varchar("model_version"),
  churnProbability: decimal("churn_probability", { precision: 5, scale: 2 }), // 0-100
  predictedReturnLikelihood: decimal("predicted_return_likelihood", { precision: 5, scale: 2 }),
  riskSegment: varchar("risk_segment"), // high, medium, low
  recommendedActions: jsonb("recommended_actions"), // [{action: "loyalty_offer", details: "..."}]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const guestUpsellOpportunities = pgTable("guest_upsell_opportunities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  reservationId: varchar("reservation_id").notNull(),
  modelVersion: varchar("model_version"),
  recommendedItems: jsonb("recommended_items"), // [{id, name, score, reason}]
  recommendedServices: jsonb("recommended_services"), // [{service, score, reason}]
  estimatedAdditionalRevenue: decimal("estimated_additional_revenue", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== GUEST SENTIMENT & FEEDBACK ANALYSIS ==========

export const guestFeedbackData = pgTable("guest_feedback_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id").notNull(),
  reservationId: varchar("reservation_id").notNull(),
  feedbackDate: timestamp("feedback_date").notNull(),
  reviewText: text("review_text"),
  reviewScore: integer("review_score"), // 1-10
  npsScore: integer("nps_score"), // 0-10
  serviceIncidents: integer("service_incidents").default(0),
  complaintFlag: boolean("complaint_flag").default(false),
  complaintDetails: text("complaint_details"),
  feedbackChannel: varchar("feedback_channel"), // survey, review, conversation, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sentimentAnalysis = pgTable("sentiment_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id"),
  feedbackId: varchar("feedback_id"),
  reviewText: text("review_text"),
  modelVersion: varchar("model_version"),
  sentimentScore: decimal("sentiment_score", { precision: 5, scale: 2 }), // -1 to 1 (negative to positive)
  sentimentLabel: varchar("sentiment_label"), // positive, neutral, negative
  topicsTags: jsonb("topics_tags"), // ["cleanliness", "service", "value"]
  keyPhrases: jsonb("key_phrases"),
  emotionalTone: varchar("emotional_tone"), // satisfied, neutral, dissatisfied, angry
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== HOUSEKEEPING & MAINTENANCE PREDICTION ==========

export const housekeepingTurnovers = pgTable("housekeeping_turnovers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomId: varchar("room_id").notNull(),
  occupancyStatus: varchar("occupancy_status"), // occupied, checked_out, available
  checkOutTime: timestamp("check_out_time"),
  expectedCleanDuration: integer("expected_clean_duration"), // minutes
  actualCleanDuration: integer("actual_clean_duration"),
  cleaningStaffId: varchar("cleaning_staff_id"),
  housekeepingPriority: varchar("housekeeping_priority"), // low, normal, high, urgent
  specialRequests: jsonb("special_requests"), // [{request: "extra_clean", type: "bathroom"}]
  issuesFound: jsonb("issues_found"), // [{issue: "stain", location: "carpet", severity: "high"}]
  daysBeforeTurnover: integer("days_before_turnover"), // occupancy length
  dateRecorded: date("date_recorded").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const housekeepingForecasts = pgTable("housekeeping_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomId: varchar("room_id").notNull(),
  forecastDate: date("forecast_date").notNull(),
  modelVersion: varchar("model_version"),
  predictedCleanDuration: integer("predicted_clean_duration"), // minutes
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const equipmentData = pgTable("equipment_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  equipmentId: varchar("equipment_id").notNull(),
  equipmentType: varchar("equipment_type"), // HVAC, pump, generator, etc.
  installationDate: date("installation_date"),
  usageHours: integer("usage_hours"),
  lastServiceDate: date("last_service_date"),
  faultEventsCount: integer("fault_events_count").default(0),
  sensorReadings: jsonb("sensor_readings"), // {temp: 67.2, vibration: 0.45, pressure: 120}
  maintenanceCosts: decimal("maintenance_costs", { precision: 10, scale: 2 }),
  maintenanceNotes: text("maintenance_notes"),
  recordedDate: date("recorded_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const maintenancePredictions = pgTable("maintenance_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  equipmentId: varchar("equipment_id").notNull(),
  modelVersion: varchar("model_version"),
  timeToFailureDays: integer("time_to_failure_days"),
  failureProbability30Days: decimal("failure_probability_30_days", { precision: 5, scale: 2 }), // 0-100
  failureProbability90Days: decimal("failure_probability_90_days", { precision: 5, scale: 2 }),
  recommendedMaintenanceDate: date("recommended_maintenance_date"),
  riskLevel: varchar("risk_level"), // low, medium, high, critical
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== FRAUD & ANOMALY DETECTION ==========

export const transactionData = pgTable("transaction_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  guestId: varchar("guest_id"),
  reservationId: varchar("reservation_id"),
  transactionId: varchar("transaction_id").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("USD"),
  paymentMethod: varchar("payment_method"), // card, cash, etc.
  cardBin: varchar("card_bin"), // first 6 digits of card
  ipAddress: varchar("ip_address"),
  ipCountry: varchar("ip_country"),
  bookingIpCountry: varchar("booking_ip_country"),
  bookingChannel: varchar("booking_channel"),
  deviceId: varchar("device_id"),
  deviceType: varchar("device_type"),
  flaggedDiscrepancies: jsonb("flagged_discrepancies"), // {type: "high_amount", details: "..."}
  transactionDate: timestamp("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const fraudDetections = pgTable("fraud_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  transactionId: varchar("transaction_id").notNull(),
  modelVersion: varchar("model_version"),
  fraudProbability: decimal("fraud_probability", { precision: 5, scale: 2 }), // 0-100
  fraudFlag: boolean("fraud_flag"),
  anomalyScore: decimal("anomaly_score", { precision: 5, scale: 2 }),
  detectionReasons: jsonb("detection_reasons"), // [{reason: "unusual_amount", score: 0.7}]
  recommendedAction: varchar("recommended_action"), // accept, review, block
  actualFraud: boolean("actual_fraud"), // filled in after investigation
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== POS SALES FORECASTING & INVENTORY ==========

export const posSalesData = pgTable("pos_sales_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  outletId: varchar("outlet_id").notNull(), // restaurant, mini-bar, etc.
  salesDate: date("sales_date").notNull(),
  itemId: varchar("item_id").notNull(),
  itemName: varchar("item_name"),
  category: varchar("category"), // food, beverage, etc.
  salesQty: integer("sales_qty"),
  stockLevel: integer("stock_level"),
  price: decimal("price", { precision: 10, scale: 2 }),
  promotionFlag: boolean("promotion_flag").default(false),
  eventFlag: boolean("event_flag").default(false),
  dayOfWeek: integer("day_of_week"),
  month: integer("month"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posForecastsData = pgTable("pos_forecasts_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  outletId: varchar("outlet_id").notNull(),
  forecastDate: date("forecast_date").notNull(),
  itemId: varchar("item_id").notNull(),
  modelVersion: varchar("model_version"),
  predictedSalesQty: integer("predicted_sales_qty"),
  confidence: decimal("confidence", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== DATA COLLECTION & INSTRUMENTATION ==========

export const dataCollectionLogs = pgTable("data_collection_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  dataType: varchar("data_type").notNull(), // housekeeping, maintenance, transaction, feedback, etc.
  sourceId: varchar("source_id"), // device_id, user_id, sensor_id, etc.
  recordType: varchar("record_type"), // manual, auto, sensor, api, etc.
  dataJson: jsonb("data_json").notNull(),
  validationStatus: varchar("validation_status"), // valid, warning, error
  validationErrors: jsonb("validation_errors"),
  appVersion: varchar("app_version"),
  timezone: varchar("timezone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const imageMerchants = pgTable("image_uploads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomId: varchar("room_id"),
  uploadedByUserId: varchar("uploaded_by_user_id"),
  imageType: varchar("image_type"), // damage, cleanliness, etc.
  imageUrl: text("image_url"),
  imageHash: varchar("image_hash"), // for deduplication
  uploadedAt: timestamp("uploaded_at").notNull(),
  labelsJson: jsonb("labels_json"), // [{damage_type: "stain", location: "carpet", severity: "high"}]
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== IMAGE DAMAGE DETECTION ==========

export const roomDamageDetections = pgTable("room_damage_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  roomId: varchar("room_id").notNull(),
  imageUploadId: varchar("image_upload_id"),
  modelVersion: varchar("model_version"),
  damageDetected: boolean("damage_detected"),
  damageTypes: jsonb("damage_types"), // [{type: "stain", confidence: 0.92, location: "carpet"}]
  severityScore: decimal("severity_score", { precision: 5, scale: 2 }), // 0-100
  autoWorkOrderCreated: boolean("auto_work_order_created").default(false),
  workOrderId: varchar("work_order_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== MODEL MONITORING & DRIFT DETECTION ==========

export const modelPredictionLogs = pgTable("model_prediction_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  modelName: varchar("model_name").notNull(), // demand, pricing, churn, etc.
  modelVersion: varchar("model_version"),
  inputJson: jsonb("input_json").notNull(),
  outputJson: jsonb("output_json").notNull(),
  actualOutcome: jsonb("actual_outcome"), // filled in later
  predictionError: decimal("prediction_error", { precision: 10, scale: 2 }), // actual - predicted
  inferenceTimeMs: integer("inference_time_ms"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const modelDriftDetections = pgTable("model_drift_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  modelName: varchar("model_name").notNull(),
  modelVersion: varchar("model_version"),
  driftMetric: varchar("drift_metric"), // kl_divergence, population_stability_index, mape, etc.
  driftValue: decimal("drift_value", { precision: 10, scale: 2 }),
  driftThreshold: decimal("drift_threshold", { precision: 10, scale: 2 }),
  isDriftDetected: boolean("is_drift_detected"),
  retrainingRequired: boolean("retraining_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== ACTIVE LEARNING & FEEDBACK ==========

export const activeLearningCases = pgTable("active_learning_cases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  modelName: varchar("model_name").notNull(),
  modelVersion: varchar("model_version"),
  caseType: varchar("case_type"), // low_confidence, edge_case, misclassification
  confidenceScore: decimal("confidence_score", { precision: 5, scale: 2 }),
  dataJson: jsonb("data_json"),
  humanLabel: varchar("human_label"), // label provided by staff
  labeledByUserId: varchar("labeled_by_user_id"),
  labeledAt: timestamp("labeled_at"),
  feedbackUseful: boolean("feedback_useful"), // was this label useful for retraining?
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== MODEL VERSIONING & UPDATES ==========

export const modelVersions = pgTable("model_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: varchar("model_name").notNull(),
  version: varchar("version").notNull(), // semantic versioning
  trainingDate: date("training_date"),
  trainingSampleSize: integer("training_sample_size"),
  evaluationMetrics: jsonb("evaluation_metrics"), // {mape: 0.12, mae: 5.3, rmse: 8.2}
  isActive: boolean("is_active").default(false),
  isEncrypted: boolean("is_encrypted").default(true),
  modelPath: varchar("model_path"), // path to model file
  modelHash: varchar("model_hash"), // SHA256 for integrity verification
  featureSchema: jsonb("feature_schema"), // expected input features
  scalerParams: jsonb("scaler_params"), // normalization parameters
  requiredLicenseFeature: varchar("required_license_feature"), // which license feature to check
  releaseNotes: text("release_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ========== PRIVACY & CONSENT ==========

export const privacyConsents = pgTable("privacy_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  userType: varchar("user_type"), // guest, staff
  dataCategory: varchar("data_category"), // behavioral, feedback, transaction, etc.
  consentGiven: boolean("consent_given").notNull(),
  consentDate: timestamp("consent_date").notNull(),
  consentVersion: varchar("consent_version"),
  ipAddress: varchar("ip_address"),
  deviceId: varchar("device_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dataExportRequests = pgTable("data_export_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  requestedByUserId: varchar("requested_by_user_id"),
  requestType: varchar("request_type"), // export, delete
  dataScope: varchar("data_scope"), // guest_id, property_id, all
  scopeId: varchar("scope_id"),
  status: varchar("status").default("pending"), // pending, in_progress, completed, failed
  exportFormat: varchar("export_format"), // json, csv
  fileUrl: varchar("file_url"), // path to exported file
  expiresAt: timestamp("expires_at"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: varchar("property_id").notNull(),
  userId: varchar("user_id"),
  action: varchar("action").notNull(), // create, read, update, delete, export
  resourceType: varchar("resource_type"), // reservation, guest, billing, etc.
  resourceId: varchar("resource_id"),
  changedFields: jsonb("changed_fields"), // {field: {old: value, new: value}}
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ========== INSERT SCHEMAS ==========

export const insertDemandForecastingDataSchema = createInsertSchema(demandForecastingData).omit({
  id: true,
  createdAt: true,
});

export const insertDynamicPricingDataSchema = createInsertSchema(dynamicPricingData).omit({
  id: true,
  createdAt: true,
});

export const insertGuestStayDataSchema = createInsertSchema(guestStayData).omit({
  id: true,
  createdAt: true,
});

export const insertGuestFeedbackDataSchema = createInsertSchema(guestFeedbackData).omit({
  id: true,
  createdAt: true,
});

export const insertHousekeepingTurnoversSchema = createInsertSchema(housekeepingTurnovers).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentDataSchema = createInsertSchema(equipmentData).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionDataSchema = createInsertSchema(transactionData).omit({
  id: true,
  createdAt: true,
});

export const insertPosSalesDataSchema = createInsertSchema(posSalesData).omit({
  id: true,
  createdAt: true,
});

export const insertDataCollectionLogsSchema = createInsertSchema(dataCollectionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertImageUploadSchema = createInsertSchema(imageMerchants).omit({
  id: true,
  createdAt: true,
});

export const insertPrivacyConsentSchema = createInsertSchema(privacyConsents).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

// ========== EXPORT TYPES ==========

export type DemandForecastingData = typeof demandForecastingData.$inferSelect;
export type InsertDemandForecastingData = z.infer<typeof insertDemandForecastingDataSchema>;

export type DemandForecast = typeof demandForecasts.$inferSelect;

export type DynamicPricingData = typeof dynamicPricingData.$inferSelect;
export type InsertDynamicPricingData = z.infer<typeof insertDynamicPricingDataSchema>;

export type PricingOptimization = typeof pricingOptimizations.$inferSelect;

export type GuestStayData = typeof guestStayData.$inferSelect;
export type InsertGuestStayData = z.infer<typeof insertGuestStayDataSchema>;

export type GuestChurnPrediction = typeof guestChurnPredictions.$inferSelect;

export type GuestUpsellOpportunity = typeof guestUpsellOpportunities.$inferSelect;

export type GuestFeedbackData = typeof guestFeedbackData.$inferSelect;
export type InsertGuestFeedbackData = z.infer<typeof insertGuestFeedbackDataSchema>;

export type SentimentAnalysis = typeof sentimentAnalysis.$inferSelect;

export type HousekeepingTurnover = typeof housekeepingTurnovers.$inferSelect;
export type InsertHousekeepingTurnover = z.infer<typeof insertHousekeepingTurnoversSchema>;

export type HousekeepingForecast = typeof housekeepingForecasts.$inferSelect;

export type EquipmentData = typeof equipmentData.$inferSelect;
export type InsertEquipmentData = z.infer<typeof insertEquipmentDataSchema>;

export type MaintenancePrediction = typeof maintenancePredictions.$inferSelect;

export type TransactionData = typeof transactionData.$inferSelect;
export type InsertTransactionData = z.infer<typeof insertTransactionDataSchema>;

export type FraudDetection = typeof fraudDetections.$inferSelect;

export type PosSalesData = typeof posSalesData.$inferSelect;
export type InsertPosSalesData = z.infer<typeof insertPosSalesDataSchema>;

export type PosForecastData = typeof posForecastsData.$inferSelect;

export type DataCollectionLog = typeof dataCollectionLogs.$inferSelect;
export type InsertDataCollectionLog = z.infer<typeof insertDataCollectionLogsSchema>;

export type ImageUpload = typeof imageMerchants.$inferSelect;

export type RoomDamageDetection = typeof roomDamageDetections.$inferSelect;

export type ModelPredictionLog = typeof modelPredictionLogs.$inferSelect;

export type ModelDriftDetection = typeof modelDriftDetections.$inferSelect;

export type ActiveLearningCase = typeof activeLearningCases.$inferSelect;

export type ModelVersion = typeof modelVersions.$inferSelect;

export type PrivacyConsent = typeof privacyConsents.$inferSelect;
export type InsertPrivacyConsent = z.infer<typeof insertPrivacyConsentSchema>;

export type DataExportRequest = typeof dataExportRequests.$inferSelect;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
