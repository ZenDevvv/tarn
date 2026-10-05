import { prisma, Prisma } from '@tracker/database';
import { CreateCompanyInput, UpdateCompanyInput, CompanyFiltersInput } from '@tracker/validation';

export const companyRepository = {
  async findMany(userId: string, filters: Partial<CompanyFiltersInput> = {}) {
    const where: Prisma.CompanyWhereInput = {
      userId,
    };

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { industry: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.industry) {
      where.industry = { equals: filters.industry, mode: 'insensitive' };
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        applications: {
          where: { archivedAt: null },
          include: {
            job: true,
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format and calculate application statistics
    const mapped = companies.map((c) => {
      const activeApplications = c.applications.filter(
        (app) => !['REJECTED', 'WITHDRAWN'].includes(app.status)
      );

      return {
        id: c.id,
        name: c.name,
        website: c.website,
        industry: c.industry,
        location: c.location,
        description: c.description,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        applicationsCount: c.applications.length,
        activeApplicationsCount: activeApplications.length,
        applications: c.applications.map((app) => ({
          id: app.id,
          status: app.status,
          priority: app.priority,
          appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
          job: app.job
            ? {
                id: app.job.id,
                title: app.job.title,
                location: app.job.location,
                workSetup: app.job.workSetup,
                salaryMin: app.job.salaryMin,
                salaryMax: app.job.salaryMax,
                currency: app.job.currency,
              }
            : null,
        })),
      };
    });

    let results = mapped;

    // Filter by hasActive if specified
    if (filters.hasActive === 'true') {
      results = results.filter((c) => c.activeApplicationsCount > 0);
    } else if (filters.hasActive === 'false') {
      results = results.filter((c) => c.activeApplicationsCount === 0);
    }

    // Sort order
    if (filters.sortBy) {
      const order = filters.sortOrder === 'desc' ? -1 : 1;
      results.sort((a, b) => {
        if (filters.sortBy === 'applicationsCount') {
          return (a.applicationsCount - b.applicationsCount) * order;
        }
        if (filters.sortBy === 'updatedAt') {
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * order;
        }
        if (filters.sortBy === 'createdAt') {
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * order;
        }
        return a.name.localeCompare(b.name) * order;
      });
    }

    return results;
  },

  async findById(userId: string, id: string) {
    const company = await prisma.company.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        applications: {
          where: { archivedAt: null },
          include: {
            job: true,
          },
          orderBy: { appliedAt: 'desc' },
        },
      },
    });

    if (!company) return null;

    const activeApplications = company.applications.filter(
      (app) => !['REJECTED', 'WITHDRAWN'].includes(app.status)
    );

    return {
      id: company.id,
      name: company.name,
      website: company.website,
      industry: company.industry,
      location: company.location,
      description: company.description,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
      applicationsCount: company.applications.length,
      activeApplicationsCount: activeApplications.length,
      applications: company.applications.map((app) => ({
        id: app.id,
        status: app.status,
        priority: app.priority,
        appliedAt: app.appliedAt ? app.appliedAt.toISOString() : null,
        job: app.job
          ? {
              id: app.job.id,
              title: app.job.title,
              location: app.job.location,
              workSetup: app.job.workSetup,
              salaryMin: app.job.salaryMin,
              salaryMax: app.job.salaryMax,
              currency: app.job.currency,
            }
          : null,
      })),
    };
  },

  async create(userId: string, input: CreateCompanyInput) {
    const company = await prisma.company.create({
      data: {
        userId,
        name: input.name,
        website: input.website || null,
        industry: input.industry || null,
        location: input.location || null,
        description: input.description || null,
      },
    });

    return {
      ...company,
      createdAt: company.createdAt.toISOString(),
      updatedAt: company.updatedAt.toISOString(),
    };
  },

  async update(userId: string, id: string, input: UpdateCompanyInput) {
    const existing = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    const updated = await prisma.company.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        website: input.website !== undefined ? (input.website || null) : undefined,
        industry: input.industry !== undefined ? (input.industry || null) : undefined,
        location: input.location !== undefined ? (input.location || null) : undefined,
        description: input.description !== undefined ? (input.description || null) : undefined,
      },
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.company.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    await prisma.company.delete({
      where: { id },
    });

    return { id, deleted: true };
  },
};
