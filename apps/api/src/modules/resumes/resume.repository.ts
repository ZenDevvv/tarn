import { prisma, Prisma } from '@tracker/database';
import { CreateResumeInput, UpdateResumeInput, ResumeFiltersInput } from '@tracker/validation';
import { ResumeWithDetailsDTO } from '@tracker/types';

/**
 * Sentinel returned by setCanonical when the resume is a manual upload. Canonical means "the attempt
 * the user chose to keep within an application"; a manual upload belongs to no application and so
 * has no siblings to be canonical against.
 */
export const CANONICAL_REQUIRES_APPLICATION = Symbol('CANONICAL_REQUIRES_APPLICATION');

type ResumeRow = Prisma.ResumeGetPayload<{
  include: {
    applications: {
      select: {
        id: true;
        status: true;
        priority: true;
        appliedAt: true;
        company: { select: { id: true; name: true } };
        job: { select: { id: true; title: true } };
      };
    };
  };
}>;

function mapResume(r: ResumeRow): ResumeWithDetailsDTO {
  return {
    id: r.id,
    userId: r.userId,
    name: r.name,
    applicationId: r.applicationId,
    revision: r.revision,
    parentResumeId: r.parentResumeId,
    isCanonical: r.isCanonical,
    targetRole: r.targetRole,
    fileUrl: r.fileUrl,
    filename: r.filename,
    fileSize: r.fileSize,
    mimeType: r.mimeType,
    isDefault: r.isDefault,
    isTailored: r.isTailored,
    matchScore: r.matchScore,
    skills: r.skills,
    notes: r.notes,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    applicationsCount: r.applications.length,
    applications: r.applications.map((app) => ({
      id: app.id,
      status: app.status?.name || 'Saved',
      priority: app.priority,
      appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
      company: app.company ? { id: app.company.id, name: app.company.name } : null,
      job: app.job ? { id: app.job.id, title: app.job.title } : null,
    })),
  };
}

export const resumeRepository = {
  async findMany(userId: string, filters: Partial<ResumeFiltersInput> = {}): Promise<ResumeWithDetailsDTO[]> {
    const where: Prisma.ResumeWhereInput = {
      userId,
    };

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { targetRole: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { skills: { has: search } },
      ];
    }

    if (filters.targetRole) {
      where.targetRole = { equals: filters.targetRole, mode: 'insensitive' };
    }

    if (filters.isDefault === 'true') {
      where.isDefault = true;
    } else if (filters.isDefault === 'false') {
      where.isDefault = false;
    }

    if (filters.applicationId) {
      where.applicationId = filters.applicationId;
    }

    const sortOrder: Prisma.SortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
    let orderBy: Prisma.ResumeOrderByWithRelationInput | Prisma.ResumeOrderByWithRelationInput[] = {
      createdAt: 'desc',
    };

    if (filters.groupByApplication) {
      // Lineage is inherently sequential, so revision always reads ascending within an
      // application regardless of the general sortOrder. Manual uploads (null applicationId)
      // sort first under Postgres default nulls ordering and stay visible as their own group.
      orderBy = [{ applicationId: 'asc' }, { revision: 'asc' }];
    } else if (filters.sortBy === 'name') {
      orderBy = { name: sortOrder };
    } else if (filters.sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder };
    } else if (filters.sortBy === 'revision') {
      orderBy = [{ applicationId: 'asc' }, { revision: sortOrder }];
    } else {
      orderBy = { createdAt: sortOrder };
    }

    const resumes = await prisma.resume.findMany({
      where,
      orderBy,
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            priority: true,
            appliedAt: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return resumes.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.name,
      applicationId: r.applicationId,
      revision: r.revision,
      parentResumeId: r.parentResumeId,
      isCanonical: r.isCanonical,
      targetRole: r.targetRole,
      fileUrl: r.fileUrl,
      filename: r.filename,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      isDefault: r.isDefault,
      isTailored: (r as any).isTailored ?? false,
      matchScore: (r as any).matchScore ?? null,
      skills: r.skills,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      applicationsCount: r.applications.length,
      applications: r.applications.map((app) => ({
        id: app.id,
        status: app.status?.name || 'Saved',
        priority: app.priority,
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        company: app.company ? { id: app.company.id, name: app.company.name } : null,
        job: app.job ? { id: app.job.id, title: app.job.title } : null,
      })),
    }));
  },

  async findById(userId: string, id: string): Promise<ResumeWithDetailsDTO | null> {
    const r = await prisma.resume.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            priority: true,
            appliedAt: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            job: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      userId: r.userId,
      name: r.name,
      applicationId: r.applicationId,
      revision: r.revision,
      parentResumeId: r.parentResumeId,
      isCanonical: r.isCanonical,
      targetRole: r.targetRole,
      fileUrl: r.fileUrl,
      filename: r.filename,
      fileSize: r.fileSize,
      mimeType: r.mimeType,
      isDefault: r.isDefault,
      isTailored: (r as any).isTailored ?? false,
      matchScore: (r as any).matchScore ?? null,
      skills: r.skills,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      applicationsCount: r.applications.length,
      applications: r.applications.map((app) => ({
        id: app.id,
        status: app.status?.name || 'Saved',
        priority: app.priority,
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        company: app.company ? { id: app.company.id, name: app.company.name } : null,
        job: app.job ? { id: app.job.id, title: app.job.title } : null,
      })),
    };
  },

  async create(userId: string, data: CreateResumeInput): Promise<ResumeWithDetailsDTO> {
    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.resume.updateMany({
          where: { userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const r = await tx.resume.create({
        data: {
          userId,
          name: data.name,
          targetRole: data.targetRole,
          fileUrl: data.fileUrl,
          filename: data.filename,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          isDefault: data.isDefault ?? false,
          skills: data.skills || [],
          notes: data.notes,
        },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              priority: true,
              appliedAt: true,
              company: { select: { id: true, name: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      });

      return mapResume(r);
    });
  },

  async update(userId: string, id: string, data: UpdateResumeInput): Promise<ResumeWithDetailsDTO | null> {
    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.resume.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      const r = await tx.resume.update({
        where: { id },
        data: {
          name: data.name,
          targetRole: data.targetRole,
          fileUrl: data.fileUrl,
          filename: data.filename,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          isDefault: data.isDefault,
          skills: data.skills !== undefined ? data.skills : undefined,
          notes: data.notes,
        },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              priority: true,
              appliedAt: true,
              company: { select: { id: true, name: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      });

      return mapResume(r);
    });
  },

  async setCanonical(
    userId: string,
    id: string
  ): Promise<ResumeWithDetailsDTO | typeof CANONICAL_REQUIRES_APPLICATION | null> {
    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    // Canonical means "the attempt the user chose to keep" and is scoped to one application.
    // It is deliberately not isDefault, which is a user-level primary-resume concept used
    // elsewhere in the app.
    if (!existing.applicationId) return CANONICAL_REQUIRES_APPLICATION;

    return prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { userId, applicationId: existing.applicationId, isCanonical: true },
        data: { isCanonical: false },
      });

      const r = await tx.resume.update({
        where: { id },
        data: { isCanonical: true },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              priority: true,
              appliedAt: true,
              company: { select: { id: true, name: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      });

      return mapResume(r);
    });
  },

  async setDefault(userId: string, id: string): Promise<ResumeWithDetailsDTO | null> {
    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    return prisma.$transaction(async (tx) => {
      await tx.resume.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      const r = await tx.resume.update({
        where: { id },
        data: { isDefault: true },
        include: {
          applications: {
            select: {
              id: true,
              status: true,
              priority: true,
              appliedAt: true,
              company: { select: { id: true, name: true } },
              job: { select: { id: true, title: true } },
            },
          },
        },
      });

      return mapResume(r);
    });
  },

  async delete(userId: string, id: string): Promise<boolean> {
    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!existing) return false;

    await prisma.resume.delete({
      where: { id },
    });

    return true;
  },
};
