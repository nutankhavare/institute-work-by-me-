import { Router } from "express";
import rolePermissionRoutes from "./rolePermissionRoutes";
import authRoutes from "./authRoutes";
import masterDataRoutes from "./masterDataRoutes";

const router = Router();

// API Routes (routes already include endpoint paths like /roles, /permissions)
router.use(authRoutes);
router.use(rolePermissionRoutes);
router.use(masterDataRoutes);

export default router;
