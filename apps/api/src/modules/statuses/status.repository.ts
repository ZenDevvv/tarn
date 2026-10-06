import { prisma, CloseType } from '@tracker/database';
import { CreateStatusInput, UpdateStatusInput } from '@tracker/validation';

export const DEFAULT_STATUSES = [
  { name: 'Saved', order: 0, closeType: null, isDefault: true },
  { name: 'Applied', order: 1, closeType: null, isDefault: false },
  { name: 'Interviewing', order: 2, closeType: null, isDefault: false },
  { name: 'Offer', order: 3, closeType: null, isDefault: false },
  { name: 'Accepted', order: 4, closeType: null, isDefault: false },
  { name: 'Rejected', order: null, closeType: 'REJECTED' as CloseType, isDefault: true },
  { name: 'Withdrawn', order: null, closeType: 'WITHDRAWN' as CloseType, isDefault: true },
  { name: 'No response', order: null, closeType: 'NO_RESPONSE' as CloseType, isDefault: true },
];

export const statusRepository = {
  async seedDefaultStatuses(userId: string) {
    const existingCount = await prisma.applicationStatus.count({
      where: { userId },
    });

    if (existingCount > 0) return;

    await prisma.$transaction(
      DEFAULT_STATUSES.map((status) =>
        prisma.applicationStatus.create({
          data: {
            userId,
            name: status.name,
            order: status.order,
            closeType: status.closeType,
            isDefault: status.isDefault,
          },
        })
      )
    );
  },

  async findMany(userId: string) {
    return prisma.applicationStatus.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  },

  async findById(userId: string, id: string) {
    return prisma.applicationStatus.findFirst({
      where: { id, userId },
    });
  },

  async create(userId: string, input: CreateStatusInput) {
    let order: number | null = input.order ?? null;
    if (input.closeType) {
      order = null;
    } else if (order === undefined || order === null) {
      const highestOrder = await prisma.applicationStatus.findFirst({
        where: { userId, closeType: null },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = highestOrder && highestOrder.order !== null ? highestOrder.order + 1 : 0;
    }

    if (input.isDefault) {
      await prisma.applicationStatus.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.applicationStatus.create({
      data: {
        userId,
        name: input.name,
        order,
        closeType: (input.closeType as CloseType) || null,
        isDefault: input.isDefault || false,
      },
    });
  },

  async update(userId: string, id: string, input: UpdateStatusInput) {
    if (input.isDefault) {
      await prisma.applicationStatus.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.applicationStatus.update({
      where: { id },
      data: {
        name: input.name ?? undefined,
        order: input.order ?? undefined,
        closeType: input.closeType !== undefined ? (input.closeType as CloseType | null) : undefined,
        isDefault: input.isDefault ?? undefined,
      },
    });
  },

  async reorder(userId: string, statusIds: string[]) {
    return prisma.$transaction(async (tx) => {
      for (let i = 0; i < statusIds.length; i++) {
        await tx.applicationStatus.updateMany({
          where: { id: statusIds[i], userId },
          data: { order: i },
        });
      }

      return tx.applicationStatus.findMany({
        where: { userId },
        orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      });
    });
  },

  async countApplicationsUsingStatus(userId: string, id: string) {
    return prisma.application.count({
      where: { userId, statusId: id },
    });
  },

  async delete(userId: string, id: string) {
    return prisma.applicationStatus.deleteMany({
      where: { id, userId },
    });
  },
};
