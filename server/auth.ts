import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import { db } from "./db";

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

  // CRITICAL FIX: Proper session configuration for production
  app.use(
    session({
      store: new PgSession({
        pool: db,
        tableName: "sessions",
        createTableIfMissing: false,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      name: "hospitality.sid", // Custom cookie name
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: isProduction, // CRITICAL: true in production (HTTPS)
        sameSite: isProduction ? "none" : "lax", // CRITICAL: "none" for cross-origin in production
        domain: isProduction ? undefined : undefined, // Let browser decide
      },
      proxy: isProduction, // CRITICAL: Trust proxy in production (Render uses proxies)
    })
  );

  // CRITICAL: Trust proxy headers (Render/Vercel use proxies)
  if (isProduction) {
    app.set("trust proxy", 1);
  }
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
