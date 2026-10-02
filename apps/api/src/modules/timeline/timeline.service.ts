import { prisma } from '@tracker/database';
import { NotFoundError } from '../../middleware/error-handler';

export const timelineService = {
  async getTimelineForApplication(userId: string, applicationId: string) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId, archivedAt: null },
    });

    if (!app) {
      throw new NotFoundError('Application not found');
    }

    return prisma.timelineEvent.findMany({
      where: { applicationId },
      orderBy: { occurredAt: 'desc' },
    });
  },

  async addNote(userId: string, applicationId: string, note: string) {
    const app = await prisma.application.findFirst({
      where: { id: applicationId, userId, archivedAt: null },
    });

    if (!app) {
      throw new NotFoundError('Application not found');
    }

    return prisma.timelineEvent.create({
      data: {
        applicationId,
        type: 'NOTE_ADDED',
        title: 'Note added',
        description: note,
        occurredAt: new Date(),
      },
    });
  },
};
