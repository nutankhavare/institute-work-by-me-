import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JWTPayload, AuthUser } from "../types/index";

const JWT_SECRET = process.env.JWT_SECRET || "dummy-secret-for-now";

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      orgId?: string;
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and extracts user info
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, error: "Missing or invalid authorization header" });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ success: false, error: "Missing token" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.email.split("@")[0],
      role: decoded.role,
      org_id: decoded.org_id,
      tenant_id: decoded.org_id,
    };
    req.orgId = decoded.org_id;

    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid token" });
  }
};

/**
 * Optional auth middleware
 * Doesn't fail if token is missing, but extracts user if present
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        req.user = {
          id: decoded.id,
          email: decoded.email,
          name: decoded.email.split("@")[0],
          role: decoded.role,
          org_id: decoded.org_id,
          tenant_id: decoded.org_id,
        };
        req.orgId = decoded.org_id;
      }
    }

    next();
  } catch (error) {
    next(); // Continue even if token is invalid
  }
};

/**
 * Role-based access control middleware
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: "Forbidden: Insufficient permissions" });
      return;
    }

    next();
  };
};
