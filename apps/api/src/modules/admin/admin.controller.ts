import { Request, Response, NextFunction } from "express";
import { adminService } from "./admin.service";
import { auditService } from "./audit.service";

export const adminController = {
  async getSystemStatus(_req: Request, res: Response, next: NextFunction) {
    try {
      const status = await adminService.getSystemStatus();
      return res.status(200).json({ data: status });
    } catch (error) {
      return next(error);
    }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as any);
      return res.status(200).json({
        data: result.users,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      return next(error);
    }
  },

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await adminService.getUserById(req.params.id);
      return res.status(200).json({ data: user });
    } catch (error) {
      return next(error);
    }
  },

  async updateUserRole(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user!.id;
      const targetUserId = req.params.id;
      const { role } = req.body;
      const meta = {
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      };
      const updatedUser = await adminService.updateUserRole(
        actorId,
        targetUserId,
        role,
        meta,
      );
      return res.status(200).json({
        data: updatedUser,
        message: `User role successfully updated to ${role}`,
      });
    } catch (error) {
      return next(error);
    }
  },

  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const actorId = req.user!.id;
      const targetUserId = req.params.id;
      const { isActive } = req.body;
      const meta = {
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip,
        userAgent: req.headers["user-agent"],
      };
      const updatedUser = await adminService.updateUserStatus(
        actorId,
        targetUserId,
        isActive,
        meta,
      );
      return res.status(200).json({
        data: updatedUser,
        message: `User account successfully ${isActive ? "activated" : "suspended"}`,
      });
    } catch (error) {
      return next(error);
    }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const result = await auditService.list(page, limit);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  },
};
