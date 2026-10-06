import { prisma, Prisma, ApplicationStatus, WorkSetup } from '@tracker/database';
import { CreateApplicationInput, UpdateApplicationInput, ApplicationFiltersInput } from '@tracker/validation';

export const applicationRepository = {
  async createWithRelations(userId: string, input: CreateApplicationInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Find or create company for this user
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

      // 2. Create Job
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

      // 3. Create Application
      const application = await tx.application.create({
        data: {
          userId,
          companyId: company.id,
          jobId: job.id,
          status: (input.status as ApplicationStatus) || ApplicationStatus.SAVED,
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
          resume: true,
        },
      });

      // 4. Record initial TimelineEvent
      await tx.timelineEvent.create({
        data: {
          applicationId: application.id,
          type: 'APPLICATION_CREATED',
          title: 'Application submitted',
          description: input.source ? `Applied via ${input.source}` : 'Application created in tracker',
          occurredAt: appliedDate,
        },
      });

      // 5. If initial nextAction specified, record follow-up
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

    if (filters.status) {
      where.status = filters.status as ApplicationStatus;
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
          resume: true,
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
        include: { job: true, company: true },
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

      // Update Application
      return tx.application.update({
        where: { id },
        data: {
          status: input.status as ApplicationStatus | undefined,
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
          resume: true,
        },
      });
    });
  },

  async updateStatus(userId: string, id: string, newStatus: ApplicationStatus) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: { id, userId, archivedAt: null },
      });

      if (!existing) return null;

      const oldStatus = existing.status;
      const updated = await tx.application.update({
        where: { id },
        data: { status: newStatus },
        include: {
          company: true,
          job: true,
        },
      });

      if (oldStatus !== newStatus) {
        await tx.timelineEvent.create({
          data: {
            applicationId: id,
            type: 'STATUS_CHANGED',
            title: `Stage updated to ${newStatus.replace(/_/g, ' ').toLowerCase()}`,
            description: `Stage moved from ${oldStatus} to ${newStatus}`,
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
