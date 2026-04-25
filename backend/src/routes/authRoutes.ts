import { Router } from "express";
import * as authController from "../controllers/authController";
import { authMiddleware, optionalAuthMiddleware } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validation";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string(),
  password: z.string().optional(),
});

/**
 * Authentication Routes
 */

// POST /tenant-login - Login (NO auth required)
router.post("/tenant-login", validateBody(loginSchema), authController.login);

// GET /refreshMe - Validate and refresh token (auth required)
router.get("/refreshMe", authMiddleware, authController.refreshMe);

export default router;
