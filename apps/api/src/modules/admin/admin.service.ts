import { env } from "../../config/env";
import { BadRequestError, NotFoundError } from "../../middleware/error-handler";
import { Role, SystemStatusDTO } from "@tracker/types";
import { AdminUsersQueryInput } from "@tracker/validation";
import { adminRepository } from "./admin.repository";
import { auditService } from "./audit.service";

interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}

export const adminService = {
  async getSystemStatus(): Promise<SystemStatusDTO> {
    const mem = process.memoryUsage();
    const memory = {
      rssMb: Number((mem.rss / 1024 / 1024).toFixed(1)),
      heapTotalMb: Number((mem.heapTotal / 1024 / 1024).toFixed(1)),
      heapUsedMb: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
      externalMb: Number((mem.external / 1024 / 1024).toFixed(1)),
    };

    let dbLatencyMs = 0;
    let counts = {
      users: 0,
      activeUsers: 0,
      applications: 0,
      companies: 0,
      jobs: 0,
      interviews: 0,
      resumes: 0,
      contacts: 0,
    };
    let isDbHealthy = true;

    try {
      dbLatencyMs = await adminRepository.getDbLatencyMs();
      counts = await adminRepository.getPlatformCounts();
    } catch {
      isDbHealthy = false;
    }

    return {
      status: isDbHealthy ? "healthy" : "degraded",
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      platform: `${process.platform} (${process.arch})`,
      memory,
      database: {
        status: isDbHealthy ? "connected" : "disconnected",
        latencyMs: dbLatencyMs,
        counts,
      },
    };
  },

  async listUsers(query: AdminUsersQueryInput) {
    return adminRepository.listUsers(query);
  },

  async getUserById(id: string) {
    const user = await adminRepository.findUserById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  },

  async updateUserRole(
    actorId: string,
    targetUserId: string,
    newRole: Role,
    meta?: AuditContext,
  ) {
    const targetUser = await adminRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    if (actorId === targetUserId && newRole !== "ADMIN") {
      throw new BadRequestError(
        "Admins cannot revoke their own admin privileges",
      );
    }

    if (targetUser.role === "ADMIN" && newRole === "USER") {
      const activeAdminCount = await adminRepository.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new BadRequestError(
          "Cannot revoke role: the system must retain at least one active administrator",
        );
      }
    }

    const updatedUser = await adminRepository.updateUserRole(targetUserId, newRole);

    await auditService.log({
      actorId,
      action: "USER_ROLE_UPDATED",
      targetId: targetUserId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      details: {
        previousRole: targetUser.role,
        newRole,
        targetUserEmail: targetUser.email,
      },
    });

    return updatedUser;
  },

  async updateUserStatus(
    actorId: string,
    targetUserId: string,
    isActive: boolean,
    meta?: AuditContext,
  ) {
    const targetUser = await adminRepository.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    if (actorId === targetUserId && !isActive) {
      throw new BadRequestError("Admins cannot suspend their own account");
    }

    if (targetUser.role === "ADMIN" && !isActive) {
      const activeAdminCount = await adminRepository.countActiveAdmins();
      if (activeAdminCount <= 1) {
        throw new BadRequestError(
          "Cannot suspend the only remaining active administrator",
        );
      }
    }

    const updatedUser = await adminRepository.updateUserStatus(targetUserId, isActive);

    await auditService.log({
      actorId,
      action: "USER_STATUS_UPDATED",
      targetId: targetUserId,
      ipAddress: meta?.ipAddress,
      userAgent: meta?.userAgent,
      details: {
        previousStatus: targetUser.isActive,
        newStatus: isActive,
        targetUserEmail: targetUser.email,
      },
    });

    return updatedUser;
  },
};
