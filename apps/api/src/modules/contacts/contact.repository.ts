import { prisma, Prisma } from '@tracker/database';
import { CreateContactInput, UpdateContactInput, ContactFiltersInput } from '@tracker/validation';

export const contactRepository = {
  async findMany(userId: string, filters: Partial<ContactFiltersInput> = {}) {
    const where: Prisma.ContactWhereInput = {
      userId,
    };

    if (filters.search) {
      const search = filters.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { role: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters.companyId) {
      where.companyId = filters.companyId;
    }

    if (filters.hasApplication === 'true') {
      where.applicationId = { not: null };
    } else if (filters.hasApplication === 'false') {
      where.applicationId = null;
    }

    let orderBy: Prisma.ContactOrderByWithRelationInput = { name: 'asc' };
    const sortOrder: Prisma.SortOrder = filters.sortOrder === 'desc' ? 'desc' : 'asc';

    if (filters.sortBy === 'createdAt') {
      orderBy = { createdAt: sortOrder };
    } else if (filters.sortBy === 'updatedAt') {
      orderBy = { updatedAt: sortOrder };
    } else if (filters.sortBy === 'role') {
      orderBy = { role: sortOrder };
    } else {
      orderBy = { name: sortOrder };
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            priority: true,
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
      orderBy,
    });

    return contacts.map((c) => ({
      id: c.id,
      userId: c.userId,
      name: c.name,
      role: c.role,
      email: c.email,
      phone: c.phone,
      linkedinUrl: c.linkedinUrl,
      companyId: c.companyId,
      applicationId: c.applicationId,
      notes: c.notes,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      company: c.company,
      application: c.application,
    }));
  },

  async findById(userId: string, id: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            priority: true,
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

    if (!contact) return null;

    return {
      id: contact.id,
      userId: contact.userId,
      name: contact.name,
      role: contact.role,
      email: contact.email,
      phone: contact.phone,
      linkedinUrl: contact.linkedinUrl,
      companyId: contact.companyId,
      applicationId: contact.applicationId,
      notes: contact.notes,
      createdAt: contact.createdAt.toISOString(),
      updatedAt: contact.updatedAt.toISOString(),
      company: contact.company,
      application: contact.application,
    };
  },

  async create(userId: string, input: CreateContactInput) {
    const created = await prisma.contact.create({
      data: {
        userId,
        name: input.name,
        role: input.role || null,
        email: input.email || null,
        phone: input.phone || null,
        linkedinUrl: input.linkedinUrl || null,
        companyId: input.companyId || null,
        applicationId: input.applicationId || null,
        notes: input.notes || null,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            priority: true,
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

    return {
      id: created.id,
      userId: created.userId,
      name: created.name,
      role: created.role,
      email: created.email,
      phone: created.phone,
      linkedinUrl: created.linkedinUrl,
      companyId: created.companyId,
      applicationId: created.applicationId,
      notes: created.notes,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
      company: created.company,
      application: created.application,
    };
  },

  async update(userId: string, id: string, input: UpdateContactInput) {
    const existing = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    const data: Prisma.ContactUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role || null;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.phone !== undefined) data.phone = input.phone || null;
    if (input.linkedinUrl !== undefined) data.linkedinUrl = input.linkedinUrl || null;
    if (input.notes !== undefined) data.notes = input.notes || null;

    if (input.companyId !== undefined) {
      if (input.companyId) {
        data.company = { connect: { id: input.companyId } };
      } else {
        data.company = { disconnect: true };
      }
    }

    if (input.applicationId !== undefined) {
      if (input.applicationId) {
        data.application = { connect: { id: input.applicationId } };
      } else {
        data.application = { disconnect: true };
      }
    }

    const updated = await prisma.contact.update({
      where: { id },
      data,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            website: true,
          },
        },
        application: {
          select: {
            id: true,
            status: true,
            priority: true,
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

    return {
      id: updated.id,
      userId: updated.userId,
      name: updated.name,
      role: updated.role,
      email: updated.email,
      phone: updated.phone,
      linkedinUrl: updated.linkedinUrl,
      companyId: updated.companyId,
      applicationId: updated.applicationId,
      notes: updated.notes,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      company: updated.company,
      application: updated.application,
    };
  },

  async delete(userId: string, id: string) {
    const existing = await prisma.contact.findFirst({
      where: { id, userId },
    });

    if (!existing) return null;

    await prisma.contact.delete({
      where: { id },
    });

    return { success: true };
  },
};
