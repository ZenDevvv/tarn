import { prisma, Prisma, WorkSetup } from '@tracker/database';
import { CreateApplicationInput, UpdateApplicationInput, ApplicationFiltersInput } from '@tracker/validation';
import { statusRepository } from '../statuses/status.repository';

export const applicationRepository = {
  async createWithRelations(userId: string, input: CreateApplicationInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Resolve ApplicationStatus
      let status: any = null;
      if (input.statusId) {
        status = await tx.applicationStatus.findFirst({
          where: { id: input.statusId, userId },
        });
      }

      if (!status && input.status) {
        status = await tx.applicationStatus.findFirst({
          where: {
            userId,
            name: { equals: input.status, mode: 'insensitive' },
          },
        });
      }

      if (!status) {
        status =
          (await tx.applicationStatus.findFirst({
            where: { userId, isDefault: true },
          })) ||
          (await tx.applicationStatus.findFirst({
            where: { userId },
            orderBy: { order: 'asc' },
          }));
      }

      // If user still has no statuses seeded, seed now
      if (!status) {
        await statusRepository.seedDefaultStatuses(userId);
        status = await tx.applicationStatus.findFirst({
          where: { userId, isDefault: true },
        });
      }

      // 2. Find or create company for this user
      let company = await tx.company.findFirst({
        where: {
          userId,
          name: { equals: input.companyName, mode: 'insensitive' },
        },
      });

      if (!company) {
        company = await tx.company.create({
          data: {
            userId,
            name: input.companyName,
            location: input.location,
          },
        });
      }

      // 3. Create Job
      const job = await tx.job.create({
        data: {
          userId,
          companyId: company.id,
          title: input.position,
          description: input.description,
          source: input.source,
          sourceUrl: input.sourceUrl || null,
          location: input.location,
          workSetup: input.workSetup as WorkSetup | undefined,
          employmentType: input.employmentType as any,
          salaryMin: input.salaryMin,
          salaryMax: input.salaryMax,
          currency: input.currency || 'PHP',
        },
      });

      const appliedDate = input.appliedAt ? new Date(input.appliedAt) : new Date();
      const nextActionDueDate = input.nextActionDueAt ? new Date(input.nextActionDueAt) : null;

      // 4. Create Application
      const application = await tx.application.create({
        data: {
          userId,
          companyId: company.id,
          jobId: job.id,
          statusId: status.id,
          priority: (input.priority as any) || 'MEDIUM',
          appliedAt: appliedDate,
          nextAction: input.nextAction,
          nextActionDueAt: nextActionDueDate,
          notes: input.notes,
          resumeId: input.resumeId || null,
        },
        include: {
          company: true,
          job: true,
          status: true,
          resume: true,
        },
      });

      // 5. Record initial TimelineEvent
      await tx.timelineEvent.create({
        data: {
          applicationId: application.id,
          type: 'APPLICATION_CREATED',
          title: 'Application submitted',
          description: input.source ? `Applied via ${input.source}` : 'Application created in tracker',
          occurredAt: appliedDate,
        },
      });

      // 6. If initial nextAction specified, record follow-up
      if (input.nextAction && nextActionDueDate) {
        await tx.followUp.create({
          data: {
            userId,
            applicationId: application.id,
            action: input.nextAction,
            dueAt: nextActionDueDate,
            priority: (input.priority as any) || 'MEDIUM',
            status: 'PENDING',
          },
        });
      }

      return application;
    });
  },

  async findMany(userId: string, filters: ApplicationFiltersInput) {
    const where: Prisma.ApplicationWhereInput = {
      userId,
      archivedAt: null,
    };

    if (filters.statusId) {
      where.statusId = filters.statusId;
    } else if (filters.status) {
      where.status = {
        name: { equals: filters.status, mode: 'insensitive' },
      };
    }

    if (filters.source || filters.workSetup) {
      where.job = {
        is: {
          ...(filters.source ? { source: filters.source } : {}),
          ...(filters.workSetup ? { workSetup: filters.workSetup as WorkSetup } : {}),
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { company: { name: { contains: filters.search, mode: 'insensitive' } } },
        { job: { title: { contains: filters.search, mode: 'insensitive' } } },
        { nextAction: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [total, items] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          company: true,
          job: true,
          status: true,
          resume: true,
          interviews: {
            orderBy: { scheduledAt: 'desc' },
          },
        },
        orderBy: {
          [filters.sortBy || 'appliedAt']: filters.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async findById(userId: string, id: string) {
    return prisma.application.findFirst({
      where: { id, userId, archivedAt: null },
      include: {
        company: true,
        job: true,
        status: true,
        resume: true,
        timelineEvents: {
          orderBy: { occurredAt: 'desc' },
        },
        followUps: {
          orderBy: { dueAt: 'asc' },
        },
      },
    });
  },

  async update(userId: string, id: string, input: UpdateApplicationInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: { id, userId, archivedAt: null },
        include: { job: true, company: true, status: true },
      });

      if (!existing) return null;

      // Update Company if changed
      if (input.companyName && input.companyName !== existing.company.name) {
        await tx.company.update({
          where: { id: existing.companyId },
          data: { name: input.companyName },
        });
      }

      // Update Job fields
      await tx.job.update({
        where: { id: existing.jobId },
        data: {
          title: input.position ?? undefined,
          description: input.description,
          source: input.source,
          sourceUrl: input.sourceUrl || null,
          location: input.location,
          workSetup: input.workSetup as WorkSetup | undefined,
          employmentType: input.employmentType as any,
          salaryMin: input.salaryMin,
          salaryMax: input.salaryMax,
          currency: input.currency,
        },
      });

      // Resolve statusId if provided
      let statusId = input.statusId;
      if (!statusId && input.status) {
        const found = await tx.applicationStatus.findFirst({
          where: {
            userId,
            name: { equals: input.status, mode: 'insensitive' },
          },
        });
        if (found) statusId = found.id;
      }

      // Update Application
      return tx.application.update({
        where: { id },
        data: {
          statusId: statusId ?? undefined,
          priority: input.priority as any,
          appliedAt: input.appliedAt ? new Date(input.appliedAt) : undefined,
          nextAction: input.nextAction,
          nextActionDueAt: input.nextActionDueAt ? new Date(input.nextActionDueAt) : undefined,
          notes: input.notes,
          resumeId: input.resumeId !== undefined ? input.resumeId : undefined,
        },
        include: {
          company: true,
          job: true,
          status: true,
          resume: true,
        },
      });
    });
  },

  async updateStatus(userId: string, id: string, newStatusIdOrName: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: { id, userId, archivedAt: null },
        include: { status: true },
      });

      if (!existing) return null;

      // Find target status
      let newStatus = await tx.applicationStatus.findFirst({
        where: { id: newStatusIdOrName, userId },
      });

      if (!newStatus) {
        newStatus = await tx.applicationStatus.findFirst({
          where: {
            userId,
            name: { equals: newStatusIdOrName, mode: 'insensitive' },
          },
        });
      }

      if (!newStatus) return null;

      const oldStatus = existing.status;
      const updated = await tx.application.update({
        where: { id },
        data: { statusId: newStatus.id },
        include: {
          company: true,
          job: true,
          status: true,
        },
      });

      if (oldStatus.id !== newStatus.id) {
        await tx.timelineEvent.create({
          data: {
            applicationId: id,
            type: 'STATUS_CHANGED',
            title: `Stage updated to ${newStatus.name.toLowerCase()}`,
            description: `Stage moved from ${oldStatus.name} to ${newStatus.name}`,
            occurredAt: new Date(),
          },
        });
      }

      return updated;
    });
  },

  async archive(userId: string, id: string) {
    const existing = await prisma.application.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    return prisma.application.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
  },
};
