import { Router } from "express";
import {
  adminUsersQuerySchema,
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "@tracker/validation";
import { authenticate } from "../../middleware/authenticate";
import { requireAdmin } from "../../middleware/authorize";
import { validateBody, validateQuery } from "../../middleware/validate";
import { adminController } from "./admin.controller";

export const adminRouter = Router();

// Secure all admin routes with authentication and requireAdmin middleware
adminRouter.use(authenticate, requireAdmin);

adminRouter.get("/system/status", adminController.getSystemStatus);
adminRouter.get(
  "/users",
  validateQuery(adminUsersQuerySchema),
  adminController.listUsers,
);
adminRouter.get("/users/:id", adminController.getUserById);
adminRouter.patch(
  "/users/:id/role",
  validateBody(updateUserRoleSchema),
  adminController.updateUserRole,
);
adminRouter.patch(
  "/users/:id/status",
  validateBody(updateUserStatusSchema),
  adminController.updateUserStatus,
);
adminRouter.get("/audit-logs", adminController.getAuditLogs);
