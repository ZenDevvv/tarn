import { prisma, AuditAction } from '@tracker/database';
import { logger } from '../../lib/logger';

export interface CreateAuditLogInput {
  actorId: string;
  action: AuditAction;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: Record<string, any> | null;
}

export const auditService = {
  async log(data: CreateAuditLogInput) {
    try {
      return await prisma.auditLog.create({
        data: {
          actorId: data.actorId,
          action: data.action,
          targetId: data.targetId || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
          details: data.details || undefined,
        },
      });
    } catch (error) {
      // Do not allow audit logging failure to crash administrative actions, but log error structured
      logger.error({ error, data }, 'Failed to persist audit log');
      return null;
    }
  },

  async list(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        actorEmail: log.actor?.email,
        action: log.action,
        targetId: log.targetId,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        details: log.details as Record<string, any> | null,
        createdAt: log.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
