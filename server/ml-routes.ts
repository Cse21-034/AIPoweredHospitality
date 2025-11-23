// ML Data Collection & Analytics API Endpoints
// All endpoints for collecting data required by AI/ML modules

import type { Express } from "express";
import { isAuthenticated } from "./auth";
import { storage } from "./storage";
import {
  insertDemandForecastingDataSchema,
  insertDynamicPricingDataSchema,
  insertGuestStayDataSchema,
  insertGuestFeedbackDataSchema,
  insertHousekeepingTurnoversSchema,
  insertEquipmentDataSchema,
  insertTransactionDataSchema,
  insertPosSalesDataSchema,
  insertDataCollectionLogsSchema,
  insertImageUploadSchema,
  insertPrivacyConsentSchema,
  insertAuditLogSchema,
} from "@shared/ml-schema";

export async function registerMLRoutes(app: Express): Promise<void> {
  // ========== DEMAND FORECASTING DATA COLLECTION ==========

  // Log daily property metrics for demand forecasting
  app.post("/api/ml/demand-data", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, roomTypeId, forecastDate, bookingsCount, checkinsCount, nightsSold, availableRooms, avgRate, occupancyRate, eventsLocal, weatherAvgTempC, holidayFlag, marketIndex } = req.body;

      const validatedData = insertDemandForecastingDataSchema.parse({
        propertyId,
        roomTypeId,
        forecastDate,
        bookingsCount: bookingsCount || 0,
        checkinsCount: checkinsCount || 0,
        nightsSold: nightsSold || 0,
        availableRooms,
        avgRate: avgRate || null,
        occupancyRate: occupancyRate || null,
        eventsLocal: eventsLocal || null,
        weatherAvgTempC: weatherAvgTempC || null,
        holidayFlag: holidayFlag || false,
        marketIndex: marketIndex || null,
        dayOfWeek: new Date(forecastDate).getDay(),
        month: new Date(forecastDate).getMonth() + 1,
      });

      const data = await storage.insertDemandForecastingData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Demand data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect demand data" });
    }
  });

  // Get demand forecasting data for model training
  app.get("/api/ml/demand-data", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, roomTypeId, startDate, endDate } = req.query;
      const data = await storage.getDemandForecastingData(
        propertyId as string,
        roomTypeId as string | undefined,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching demand data:", error);
      res.status(500).json({ message: "Failed to fetch demand data" });
    }
  });

  // ========== DYNAMIC PRICING DATA COLLECTION ==========

  app.post("/api/ml/pricing-data", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertDynamicPricingDataSchema.parse(req.body);
      const data = await storage.insertDynamicPricingData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Pricing data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect pricing data" });
    }
  });

  // ========== GUEST STAY DATA COLLECTION ==========

  app.post("/api/ml/guest-stay-data", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGuestStayDataSchema.parse(req.body);
      const data = await storage.insertGuestStayData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Guest stay data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect guest stay data" });
    }
  });

  // ========== GUEST FEEDBACK & SENTIMENT DATA ==========

  app.post("/api/ml/guest-feedback", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertGuestFeedbackDataSchema.parse(req.body);
      const data = await storage.insertGuestFeedbackData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Guest feedback collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect guest feedback" });
    }
  });

  // ========== HOUSEKEEPING DATA COLLECTION ==========

  // Log housekeeping turnovers and cleaning times
  app.post("/api/ml/housekeeping-turnover", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertHousekeepingTurnoversSchema.parse(req.body);
      const data = await storage.insertHousekeepingTurnover(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Housekeeping data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect housekeeping data" });
    }
  });

  // Get housekeeping data for analysis
  app.get("/api/ml/housekeeping-turnover", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, startDate, endDate } = req.query;
      const data = await storage.getHousekeepingTurnovers(
        propertyId as string,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching housekeeping data:", error);
      res.status(500).json({ message: "Failed to fetch housekeeping data" });
    }
  });

  // ========== MAINTENANCE & EQUIPMENT DATA ==========

  app.post("/api/ml/equipment-data", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEquipmentDataSchema.parse(req.body);
      const data = await storage.insertEquipmentData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Equipment data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect equipment data" });
    }
  });

  // Get equipment data for maintenance prediction model
  app.get("/api/ml/equipment-data", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, equipmentId } = req.query;
      const data = await storage.getEquipmentData(
        propertyId as string,
        equipmentId as string | undefined
      );
      res.json(data);
    } catch (error) {
      console.error("Error fetching equipment data:", error);
      res.status(500).json({ message: "Failed to fetch equipment data" });
    }
  });

  // ========== FRAUD & TRANSACTION DATA ==========

  app.post("/api/ml/transaction-data", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertTransactionDataSchema.parse(req.body);
      const data = await storage.insertTransactionData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Transaction data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect transaction data" });
    }
  });

  // ========== POS SALES DATA ==========

  app.post("/api/ml/pos-sales", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertPosSalesDataSchema.parse(req.body);
      const data = await storage.insertPosSalesData(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("POS sales data collection error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to collect POS sales data" });
    }
  });

  // ========== IMAGE UPLOADS & DAMAGE DETECTION ==========

  app.post("/api/ml/image-upload", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertImageUploadSchema.parse(req.body);
      const data = await storage.insertImageUpload(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Image upload error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // ========== DATA COLLECTION LOGGING & VALIDATION ==========

  app.post("/api/ml/data-collection-log", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, dataType, sourceId, recordType, dataJson } = req.body;

      const validatedData = insertDataCollectionLogsSchema.parse({
        propertyId,
        dataType,
        sourceId: sourceId || null,
        recordType,
        dataJson,
        validationStatus: "valid",
        appVersion: req.headers["x-app-version"] as string || "unknown",
        timezone: req.headers["x-timezone"] as string || "UTC",
      });

      const data = await storage.insertDataCollectionLog(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Data collection log error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to log data collection" });
    }
  });

  // ========== PRIVACY & CONSENT MANAGEMENT ==========

  app.post("/api/ml/privacy-consent", async (req, res) => {
    try {
      const validatedData = insertPrivacyConsentSchema.parse(req.body);
      const data = await storage.insertPrivacyConsent(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Privacy consent error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to record consent" });
    }
  });

  // Get consent status
  app.get("/api/ml/privacy-consent", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, userType, dataCategory } = req.query;
      const consents = await storage.getPrivacyConsents(
        propertyId as string,
        userType as string | undefined,
        dataCategory as string | undefined
      );
      res.json(consents);
    } catch (error) {
      console.error("Error fetching consents:", error);
      res.status(500).json({ message: "Failed to fetch consents" });
    }
  });

  // ========== AUDIT LOGGING ==========

  app.post("/api/ml/audit-log", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, action, resourceType, resourceId, changedFields } = req.body;
      const userId = (req as any).session?.userId;

      const validatedData = insertAuditLogSchema.parse({
        propertyId,
        userId: userId || null,
        action,
        resourceType,
        resourceId: resourceId || null,
        changedFields: changedFields || null,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });

      const data = await storage.insertAuditLog(validatedData);
      res.status(201).json(data);
    } catch (error: any) {
      console.error("Audit log error:", error);
      if (error.errors) {
        return res.status(400).json({ message: error.errors[0]?.message || "Invalid input" });
      }
      res.status(500).json({ message: "Failed to log action" });
    }
  });

  // Get audit logs
  app.get("/api/ml/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, userId, startDate, endDate, limit = 100 } = req.query;
      const logs = await storage.getAuditLogs(
        propertyId as string,
        userId as string | undefined,
        startDate as string | undefined,
        endDate as string | undefined,
        parseInt(limit as string) || 100
      );
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // ========== MODEL MONITORING & ANALYTICS ==========

  // Log prediction for monitoring
  app.post("/api/ml/prediction-log", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, modelName, modelVersion, inputJson, outputJson } = req.body;
      const data = await storage.insertModelPredictionLog({
        propertyId,
        modelName,
        modelVersion: modelVersion || null,
        inputJson,
        outputJson,
        inferenceTimeMs: req.body.inferenceTimeMs || null,
      });
      res.status(201).json(data);
    } catch (error) {
      console.error("Prediction log error:", error);
      res.status(500).json({ message: "Failed to log prediction" });
    }
  });

  // Get model performance metrics
  app.get("/api/ml/model-performance", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, modelName, days = 30 } = req.query;
      const metrics = await storage.getModelPerformanceMetrics(
        propertyId as string,
        modelName as string,
        parseInt(days as string) || 30
      );
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching model performance:", error);
      res.status(500).json({ message: "Failed to fetch model performance" });
    }
  });

  // ========== DRIFT DETECTION ==========

  app.get("/api/ml/drift-detection", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, modelName } = req.query;
      const drifts = await storage.getDriftDetections(
        propertyId as string,
        modelName as string | undefined
      );
      res.json(drifts);
    } catch (error) {
      console.error("Error fetching drift detections:", error);
      res.status(500).json({ message: "Failed to fetch drift detections" });
    }
  });

  // ========== ACTIVE LEARNING ==========

  app.post("/api/ml/active-learning", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, modelName, caseType, dataJson } = req.body;
      const userId = (req as any).session?.userId;

      const data = await storage.insertActiveLearningCase({
        propertyId,
        modelName,
        caseType,
        dataJson,
        labeledByUserId: userId || null,
        labeledAt: new Date().toISOString(),
      });
      res.status(201).json(data);
    } catch (error) {
      console.error("Active learning error:", error);
      res.status(500).json({ message: "Failed to record active learning case" });
    }
  });

  // Get cases needing labels
  app.get("/api/ml/active-learning/pending", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, modelName } = req.query;
      const cases = await storage.getPendingActiveLearningCases(
        propertyId as string,
        modelName as string | undefined
      );
      res.json(cases);
    } catch (error) {
      console.error("Error fetching pending cases:", error);
      res.status(500).json({ message: "Failed to fetch pending cases" });
    }
  });

  // ========== CHURN & SENTIMENT PREDICTIONS ==========

  app.get("/api/ml/churn-predictions", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, guestId, riskLevel } = req.query;
      const predictions = await storage.getChurnPredictions(
        propertyId as string,
        guestId as string | undefined,
        riskLevel as string | undefined
      );
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching churn predictions:", error);
      res.status(500).json({ message: "Failed to fetch churn predictions" });
    }
  });

  app.get("/api/ml/sentiment-analysis", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, sentiment, startDate, endDate } = req.query;
      const analyses = await storage.getSentimentAnalysis(
        propertyId as string,
        sentiment as string | undefined,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(analyses);
    } catch (error) {
      console.error("Error fetching sentiment analysis:", error);
      res.status(500).json({ message: "Failed to fetch sentiment analysis" });
    }
  });

  // ========== MAINTENANCE PREDICTIONS ==========

  app.get("/api/ml/maintenance-predictions", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, riskLevel } = req.query;
      const predictions = await storage.getMaintenancePredictions(
        propertyId as string,
        riskLevel as string | undefined
      );
      res.json(predictions);
    } catch (error) {
      console.error("Error fetching maintenance predictions:", error);
      res.status(500).json({ message: "Failed to fetch maintenance predictions" });
    }
  });

  // ========== FRAUD DETECTION ==========

  app.get("/api/ml/fraud-detections", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, fraudFlag, startDate, endDate } = req.query;
      const detections = await storage.getFraudDetections(
        propertyId as string,
        fraudFlag === "true" ? true : false,
        startDate as string | undefined,
        endDate as string | undefined
      );
      res.json(detections);
    } catch (error) {
      console.error("Error fetching fraud detections:", error);
      res.status(500).json({ message: "Failed to fetch fraud detections" });
    }
  });

  // ========== UPSELL OPPORTUNITIES ==========

  app.get("/api/ml/upsell-opportunities", isAuthenticated, async (req, res) => {
    try {
      const { propertyId, guestId } = req.query;
      const opportunities = await storage.getUpsellOpportunities(
        propertyId as string,
        guestId as string | undefined
      );
      res.json(opportunities);
    } catch (error) {
      console.error("Error fetching upsell opportunities:", error);
      res.status(500).json({ message: "Failed to fetch upsell opportunities" });
    }
  });
}
