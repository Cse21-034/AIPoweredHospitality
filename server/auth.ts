import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export async function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const sessionSecret = process.env.SESSION_SECRET || "default-secret-change-in-production";
  
  if (!isProduction && sessionSecret === "default-secret-change-in-production") {
    console.warn("⚠️  WARNING: Using default session secret in development");
  }

  // CRITICAL: Trust proxy BEFORE session middleware
  if (isProduction) {
    app.set("trust proxy", 1);
    console.log("✓ Proxy trust enabled");
  }

  // Create sessions table if it doesn't exist
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL COLLATE "default" PRIMARY KEY,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `);
    console.log("✓ Sessions table ready");
  } catch (error) {
    console.error("Error creating sessions table:", error);
  }

  // Initialize session store
  const sessionStore = new PgSession({
    pool: pool,
    tableName: "sessions",
    createTableIfMissing: false,
    pruneSessionInterval: 60 * 15,
    errorLog: (error) => {
      console.error("❌ Session store error:", error);
    },
  });

  // Test session store connection
  sessionStore.on('connect', () => {
    console.log('✓ Session store connected');
  });

  sessionStore.on('disconnect', () => {
    console.log('⚠️  Session store disconnected');
  });

  // CRITICAL: Session configuration for cross-origin
  const sessionConfig: session.SessionOptions = {
    store: sessionStore,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    name: "hospitality.sid",
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: isProduction, // ⚠️ CRITICAL: Must be true in production (HTTPS)
      sameSite: isProduction ? "none" : "lax", // ⚠️ CRITICAL: "none" for cross-origin
      domain: undefined, // Let browser decide
      path: "/", // Ensure cookie is sent for all paths
    },
    proxy: isProduction,
  };

  app.use(session(sessionConfig));

  // Debug middleware to log session info
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/auth')) {
      console.log('📍 Auth Request:', {
        path: req.path,
        method: req.method,
        sessionID: req.sessionID,
        userId: req.session?.userId,
        cookie: req.headers.cookie ? '✓ Present' : '✗ Missing',
      });
    }
    next();
  });

  console.log("✓ Auth middleware configured");
  console.log(`  - Environment: ${isProduction ? "production" : "development"}`);
  console.log(`  - Cookie secure: ${isProduction}`);
  console.log(`  - Cookie sameSite: ${isProduction ? "none" : "lax"}`);
  console.log(`  - Trust proxy: ${isProduction}`);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 Auth check:', {
    path: req.path,
    sessionID: req.sessionID,
    userId: req.session?.userId,
    hasSession: !!req.session,
  });

  if (req.session && req.session.userId) {
    return next();
  }
  
  console.log('❌ Unauthorized - No valid session');
  res.status(401).json({ message: "Unauthorized" });
}
