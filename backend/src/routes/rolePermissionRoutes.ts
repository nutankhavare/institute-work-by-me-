import { Router } from "express";
import * as rolePermissionController from "../controllers/rolePermissionController";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateBody, validateParams } from "../middleware/validation";
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdSchema,
  createPermissionSchema,
  permissionIdSchema,
} from "../schemas/rolePermissionSchemas";

const router = Router();

/**
 * Role Routes
 */

// GET /roles - Get all roles (auth required)
router.get("/roles", authMiddleware, rolePermissionController.getRoles);

// GET /roles/:id - Get role by ID (auth required)
router.get(
  "/roles/:id",
  authMiddleware,
  validateParams(roleIdSchema),
  rolePermissionController.getRoleById
);

// POST /roles - Create new role (auth required)
router.post(
  "/roles",
  authMiddleware,
  validateBody(createRoleSchema),
  rolePermissionController.createRole
);

// PUT /roles/:id - Update role (auth required)
router.put(
  "/roles/:id",
  authMiddleware,
  validateParams(roleIdSchema),
  validateBody(updateRoleSchema),
  rolePermissionController.updateRole
);

// DELETE /roles/:id - Delete role (auth required)
router.delete(
  "/roles/:id",
  authMiddleware,
  validateParams(roleIdSchema),
  rolePermissionController.deleteRole
);

/**
 * Permission Routes
 */

// GET /permissions - Get all permissions (auth required)
router.get("/permissions", authMiddleware, rolePermissionController.getPermissions);

// POST /permissions - Create new permission (auth required)
router.post(
  "/permissions",
  authMiddleware,
  validateBody(createPermissionSchema),
  rolePermissionController.createPermission
);

// DELETE /permissions/:id - Delete permission (auth required)
router.delete(
  "/permissions/:id",
  authMiddleware,
  validateParams(permissionIdSchema),
  rolePermissionController.deletePermission
);

export default router;
