import { prisma, Prisma, FollowUpStatus } from '@tracker/database';
import { CreateFollowUpInput, UpdateFollowUpInput, FollowUpFilterInput } from '@tracker/validation';

export const followUpRepository = {
  async create(userId: string, input: CreateFollowUpInput) {
    return prisma.$transaction(async (tx) => {
      // Verify application ownership
      const app = await tx.application.findFirst({
        where: { id: input.applicationId, userId, archivedAt: null },
      });

      if (!app) return null;

      const followUp = await tx.followUp.create({
        data: {
          userId,
          applicationId: input.applicationId,
          action: input.action,
          dueAt: new Date(input.dueAt),
          priority: (input.priority as any) || 'MEDIUM',
          notes: input.notes,
          status: 'PENDING',
        },
        include: {
          application: {
            include: {
              company: { select: { name: true } },
              job: { select: { title: true } },
            },
          },
        },
      });

      // Update nextAction on application if it's the most urgent pending follow-up
      await tx.application.update({
        where: { id: input.applicationId },
        data: {
          nextAction: input.action,
          nextActionDueAt: new Date(input.dueAt),
        },
      });

      await tx.timelineEvent.create({
        data: {
          applicationId: input.applicationId,
          type: 'FOLLOW_UP_CREATED',
          title: 'Follow-up scheduled',
          description: input.action,
          occurredAt: new Date(),
        },
      });

      return followUp;
    });
  },

  async findMany(userId: string, filter: FollowUpFilterInput) {
    const where: Prisma.FollowUpWhereInput = {
      userId,
      application: {
        archivedAt: null,
      },
    };

    if (filter.applicationId) {
      where.applicationId = filter.applicationId;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter.due === 'today') {
      where.status = 'PENDING';
      where.dueAt = { lte: endOfToday };
    } else if (filter.due === 'overdue') {
      where.status = 'PENDING';
      where.dueAt = { lt: startOfToday };
    }

    return prisma.followUp.findMany({
      where,
      include: {
        application: {
          include: {
            company: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { dueAt: 'asc' },
    });
  },

  async findById(userId: string, id: string) {
    return prisma.followUp.findFirst({
      where: { id, userId },
      include: {
        application: {
          include: {
            company: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
    });
  },

  async complete(userId: string, id: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.followUp.findFirst({
        where: { id, userId },
      });

      if (!existing) return null;

      const completed = await tx.followUp.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
        include: {
          application: {
            include: {
              company: { select: { name: true } },
              job: { select: { title: true } },
            },
          },
        },
      });

      // Record timeline event
      await tx.timelineEvent.create({
        data: {
          applicationId: existing.applicationId,
          type: 'FOLLOW_UP_COMPLETED',
          title: 'Action completed',
          description: existing.action,
          occurredAt: new Date(),
        },
      });

      // Clear or update nextAction on application to next pending follow-up
      const nextPending = await tx.followUp.findFirst({
        where: {
          applicationId: existing.applicationId,
          userId,
          status: 'PENDING',
        },
        orderBy: { dueAt: 'asc' },
      });

      await tx.application.update({
        where: { id: existing.applicationId },
        data: {
          nextAction: nextPending ? nextPending.action : null,
          nextActionDueAt: nextPending ? nextPending.dueAt : null,
        },
      });

      return completed;
    });
  },

  async update(userId: string, id: string, input: UpdateFollowUpInput) {
    const existing = await prisma.followUp.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    return prisma.followUp.update({
      where: { id },
      data: {
        action: input.action,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        priority: input.priority as any,
        status: input.status as FollowUpStatus | undefined,
        notes: input.notes,
      },
      include: {
        application: {
          include: {
            company: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
    });
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.followUp.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    await prisma.followUp.delete({ where: { id } });
    return { id, deleted: true };
  },
};
