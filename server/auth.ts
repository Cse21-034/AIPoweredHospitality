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
    createTableIfMissing: false, // We already created it above
    pruneSessionInterval: 60 * 15, // Prune expired sessions every 15 minutes
    errorLog: (error) => {
      console.error("Session store error:", error);
    },
  });

  // CRITICAL: Configure session middleware properly
  app.use(
    session({
      store: sessionStore,
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      rolling: true, // Reset expiration on each request
      name: "hospitality.sid",
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? "none" : "lax",
        domain: undefined, // Let browser decide
      },
      proxy: isProduction, // Trust proxy in production
    })
  );

  // CRITICAL: Trust proxy headers in production
  if (isProduction) {
    app.set("trust proxy", 1);
  }

  console.log("✓ Auth middleware configured");
  console.log(`  - Environment: ${isProduction ? "production" : "development"}`);
  console.log(`  - Cookie secure: ${isProduction}`);
  console.log(`  - Cookie sameSite: ${isProduction ? "none" : "lax"}`);
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
