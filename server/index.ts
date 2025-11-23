import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Parse environment variables
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const isDevelopment = process.env.NODE_ENV !== "production";

// Normalize frontend URL
const frontendOrigin = FRONTEND_URL.startsWith("http") 
  ? FRONTEND_URL 
  : `https://${FRONTEND_URL}`;

const allowedOrigins = isDevelopment
  ? ["http://localhost:5173", "http://localhost:5000", frontendOrigin]
  : [frontendOrigin];

log(`🌐 Allowed origins: ${allowedOrigins.join(", ")}`);
log(`🔒 Environment: ${isDevelopment ? "development" : "production"}`);

// CRITICAL: CORS must be FIRST and configured properly for credentials
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      log(`✓ No-origin request allowed`);
      return callback(null, true);
    }
    
    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      log(`✓ CORS allowed: ${origin}`);
      callback(null, true);
    } else {
      log(`⚠️  CORS blocked: ${origin}`);
      // In production, allow anyway for debugging - change to false later
      callback(null, true);
    }
  },
  credentials: true, // ⚠️ CRITICAL: Enable credentials (cookies)
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  exposedHeaders: ["Set-Cookie"],
  maxAge: 86400, // Cache preflight for 24 hours
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
}));

// CRITICAL: Handle preflight requests
app.options("*", cors());

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Body parsing
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

// Enhanced request logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  
  // Log request details for API calls
  if (path.startsWith("/api")) {
    log(`→ ${req.method} ${path} from ${req.headers.origin || 'no-origin'}`);
    if (req.headers.cookie) {
      log(`  Cookie: ${req.headers.cookie.substring(0, 50)}...`);
    } else {
      log(`  ⚠️  No cookie header`);
    }
  }

  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `← ${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse).substring(0, 100)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Health check (before auth)
  app.get("/api/health", (_req, res) => {
    res.status(200).json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      frontendUrl: frontendOrigin,
    });
  });

  // Register all routes
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    if (res.headersSent) {
      console.error("❌ Error after headers sent:", err);
      return;
    }
    
    log(`❌ Error on ${req.method} ${req.path}: ${message}`);
    console.error("Stack:", err.stack);
    
    res.status(status).json({ message });
  });

  // Setup Vite or static serving
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "127.0.0.1", () => {
    log(`🚀 Server listening on http://127.0.0.1:${port}`);
    log(`📍 Environment: ${isDevelopment ? "development" : "production"}`);
    log(`🌐 CORS origins: ${allowedOrigins.join(", ")}`);
    log(`🔐 Frontend: ${frontendOrigin}`);
    log(`🍪 Credentials: enabled`);
    log(`🔒 Trust proxy: ${!isDevelopment}`);
  });
})();
