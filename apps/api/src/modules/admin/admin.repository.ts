import { prisma } from "@tracker/database";
import { Role } from "@tracker/types";
import { AdminUsersQueryInput } from "@tracker/validation";

export const adminRepository = {
  async getDbLatencyMs(): Promise<number> {
    const start = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    return Math.round(performance.now() - start);
  },

  async getPlatformCounts() {
    const [
      users,
      activeUsers,
      applications,
      companies,
      jobs,
      interviews,
      resumes,
      contacts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.application.count(),
      prisma.company.count(),
      prisma.job.count(),
      prisma.interview.count(),
      prisma.resume.count(),
      prisma.contact.count(),
    ]);

    return {
      users,
      activeUsers,
      applications,
      companies,
      jobs,
      interviews,
      resumes,
      contacts,
    };
  },

  async listUsers(query: AdminUsersQueryInput) {
    const { page, limit, search, role, isActive, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }
    if (role) {
      where.role = role;
    }
    if (typeof isActive === "boolean") {
      where.isActive = isActive;
    }

    const orderBy: any = {};
    if (sortBy === "name" || sortBy === "email" || sortBy === "createdAt") {
      orderBy[sortBy] = sortOrder;
    } else {
      orderBy.createdAt = "desc";
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          headline: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              applications: true,
              companies: true,
              interviews: true,
              resumes: true,
            },
          },
        },
      }),
    ]);

    return {
      total,
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as Role,
        isActive: u.isActive,
        headline: u.headline,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
        counts: {
          applications: u._count.applications,
          companies: u._count.companies,
          interviews: u._count.interviews,
          resumes: u._count.resumes,
        },
      })),
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async findUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        headline: true,
        location: true,
        timezone: true,
        defaultCurrency: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
            companies: true,
            interviews: true,
            resumes: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      isActive: user.isActive,
      headline: user.headline,
      location: user.location,
      timezone: user.timezone,
      defaultCurrency: user.defaultCurrency,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      counts: {
        applications: user._count.applications,
        companies: user._count.companies,
        interviews: user._count.interviews,
        resumes: user._count.resumes,
      },
    };
  },

  async countActiveAdmins(): Promise<number> {
    return prisma.user.count({
      where: {
        role: "ADMIN",
        isActive: true,
      },
    });
  },

  async updateUserRole(id: string, role: Role) {
    const u = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        headline: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
            companies: true,
            interviews: true,
            resumes: true,
          },
        },
      },
    });

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as Role,
      isActive: u.isActive,
      headline: u.headline,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      counts: {
        applications: u._count.applications,
        companies: u._count.companies,
        interviews: u._count.interviews,
        resumes: u._count.resumes,
      },
    };
  },

  async updateUserStatus(id: string, isActive: boolean) {
    const u = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        headline: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
            companies: true,
            interviews: true,
            resumes: true,
          },
        },
      },
    });

    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as Role,
      isActive: u.isActive,
      headline: u.headline,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt.toISOString(),
      counts: {
        applications: u._count.applications,
        companies: u._count.companies,
        interviews: u._count.interviews,
        resumes: u._count.resumes,
      },
    };
  },
};
