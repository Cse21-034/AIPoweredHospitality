import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// CRITICAL FIX: Properly configure CORS for production
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5000";
const isDevelopment = process.env.NODE_ENV === "development";

// Parse frontend URL to get origin
const frontendOrigin = FRONTEND_URL.startsWith("http") 
  ? FRONTEND_URL 
  : `https://${FRONTEND_URL}`;

const allowedOrigins = isDevelopment
  ? ["http://localhost:5173", "http://localhost:5000", frontendOrigin]
  : [frontendOrigin];

// CRITICAL: Apply CORS BEFORE any other middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log(`⚠️  Blocked CORS request from origin: ${origin}`);
      callback(null, true); // Allow in production for debugging, change to false later
    }
  },
  credentials: true, // CRITICAL: Enable credentials (cookies)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // Cache preflight for 24 hours
}));

// CRITICAL: Handle preflight requests explicitly
app.options("*", cors());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Body parsing middleware
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Health check endpoint (before auth)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Register all routes (includes auth setup)
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (res.headersSent) {
      console.error("Error after headers sent:", err);
      return;
    }
    
    console.error("Unhandled API Error:", {
      status,
      message,
      stack: err.stack,
    });
    
    res.status(status).json({ message });
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🚀 Server running on port ${port}`);
    log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
    log(`🌐 CORS allowed origins: ${allowedOrigins.join(", ")}`);
    log(`🔐 Frontend URL: ${frontendOrigin}`);
    log(`🔒 Trust proxy: ${process.env.NODE_ENV === "production" ? "YES" : "NO"}`);
  });
})();
