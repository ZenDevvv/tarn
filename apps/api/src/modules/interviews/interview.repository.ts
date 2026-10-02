import { prisma, Prisma, InterviewStatus, InterviewType, InterviewResult } from '@tracker/database';
import { CreateInterviewInput, UpdateInterviewInput, UpdateInterviewStatusInput, InterviewFilterInput } from '@tracker/validation';

export const interviewRepository = {
  async create(userId: string, input: CreateInterviewInput) {
    return prisma.$transaction(async (tx) => {
      // Verify application ownership and active state
      const app = await tx.application.findFirst({
        where: { id: input.applicationId, userId, archivedAt: null },
        include: {
          company: { select: { name: true } },
          job: { select: { title: true } },
        },
      });

      if (!app) return null;

      const interview = await tx.interview.create({
        data: {
          userId,
          applicationId: input.applicationId,
          round: input.round,
          type: input.type as InterviewType,
          title: input.title,
          scheduledAt: new Date(input.scheduledAt),
          durationMinutes: input.durationMinutes,
          timezone: input.timezone || 'UTC',
          interviewerName: input.interviewerName,
          interviewerRole: input.interviewerRole,
          meetingUrl: input.meetingUrl || null,
          location: input.location,
          status: 'SCHEDULED',
          result: 'PENDING',
          notes: input.notes,
          prepNotes: input.prepNotes,
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

      // Automatically create a chronological TimelineEvent
      const typeLabel = input.type.replace(/_/g, ' ').toLowerCase();
      const title = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} interview scheduled`;
      const description = input.interviewerName
        ? `Round ${input.round} with ${input.interviewerName}${input.location ? ` (${input.location})` : ''}`
        : `Round ${input.round}${input.location ? ` (${input.location})` : ''}`;

      await tx.timelineEvent.create({
        data: {
          applicationId: input.applicationId,
          type: 'INTERVIEW_SCHEDULED',
          title,
          description,
          occurredAt: new Date(),
        },
      });

      return interview;
    });
  },

  async findMany(userId: string, filter: InterviewFilterInput) {
    const where: Prisma.InterviewWhereInput = {
      userId,
      application: {
        archivedAt: null,
      },
    };

    if (filter.applicationId) {
      where.applicationId = filter.applicationId;
    }

    if (filter.status) {
      where.status = filter.status as InterviewStatus;
    }

    if (filter.upcoming) {
      where.scheduledAt = { gte: new Date() };
      where.status = 'SCHEDULED';
    }

    return prisma.interview.findMany({
      where,
      orderBy: filter.upcoming ? { scheduledAt: 'asc' } : { scheduledAt: 'desc' },
      take: filter.limit,
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

  async findById(userId: string, id: string) {
    return prisma.interview.findFirst({
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

  async update(userId: string, id: string, input: UpdateInterviewInput) {
    const existing = await prisma.interview.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    const data: Prisma.InterviewUpdateInput = {};
    if (input.round !== undefined) data.round = input.round;
    if (input.type !== undefined) data.type = input.type as InterviewType;
    if (input.title !== undefined) data.title = input.title;
    if (input.scheduledAt !== undefined) data.scheduledAt = new Date(input.scheduledAt);
    if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
    if (input.timezone !== undefined) data.timezone = input.timezone;
    if (input.interviewerName !== undefined) data.interviewerName = input.interviewerName;
    if (input.interviewerRole !== undefined) data.interviewerRole = input.interviewerRole;
    if (input.meetingUrl !== undefined) data.meetingUrl = input.meetingUrl || null;
    if (input.location !== undefined) data.location = input.location;
    if (input.status !== undefined) data.status = input.status as InterviewStatus;
    if (input.result !== undefined) data.result = input.result as InterviewResult;
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.prepNotes !== undefined) data.prepNotes = input.prepNotes;

    return prisma.interview.update({
      where: { id },
      data,
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

  async updateStatus(userId: string, id: string, input: UpdateInterviewStatusInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.interview.findFirst({
        where: { id, userId },
      });

      if (!existing) return null;

      const updated = await tx.interview.update({
        where: { id },
        data: {
          status: input.status as InterviewStatus,
          result: input.result ? (input.result as InterviewResult) : existing.result,
          notes: input.notes !== undefined ? input.notes : existing.notes,
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

      if (input.status === 'COMPLETED') {
        const typeLabel = existing.type.replace(/_/g, ' ').toLowerCase();
        const title = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} interview completed`;
        const description = input.result ? `Outcome: ${input.result.replace(/_/g, ' ').toLowerCase()}` : undefined;

        await tx.timelineEvent.create({
          data: {
            applicationId: existing.applicationId,
            type: 'INTERVIEW_COMPLETED',
            title,
            description,
            occurredAt: new Date(),
          },
        });
      }

      return updated;
    });
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.interview.findFirst({
      where: { id, userId },
    });

    if (!existing) return false;

    await prisma.interview.delete({
      where: { id },
    });

    return true;
  },

  async findByApplication(userId: string, applicationId: string) {
    return prisma.interview.findMany({
      where: {
        userId,
        applicationId,
      },
      orderBy: {
        round: 'asc',
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
};
