import { statusRepository } from './status.repository';
import { CreateStatusInput, UpdateStatusInput, ReorderStatusesInput } from '@tracker/validation';
import { NotFoundError, ConflictError, BadRequestError } from '../../middleware/error-handler';
import { prisma } from '@tracker/database';

export const statusService = {
  async seedDefaultStatuses(userId: string) {
    return statusRepository.seedDefaultStatuses(userId);
  },

  async getStatuses(userId: string) {
    await statusRepository.seedDefaultStatuses(userId);
    return statusRepository.findMany(userId);
  },

  async getStatusById(userId: string, id: string) {
    const status = await statusRepository.findById(userId, id);
    if (!status) {
      throw new NotFoundError('Application status not found');
    }
    return status;
  },

  async createStatus(userId: string, input: CreateStatusInput) {
    const existing = await prisma.applicationStatus.findFirst({
      where: {
        userId,
        name: { equals: input.name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictError(`A status with the name "${input.name}" already exists`);
    }

    return statusRepository.create(userId, input);
  },

  async updateStatus(userId: string, id: string, input: UpdateStatusInput) {
    const status = await statusRepository.findById(userId, id);
    if (!status) {
      throw new NotFoundError('Application status not found');
    }

    if (input.name && input.name.toLowerCase() !== status.name.toLowerCase()) {
      const existing = await prisma.applicationStatus.findFirst({
        where: {
          userId,
          name: { equals: input.name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictError(`A status with the name "${input.name}" already exists`);
      }
    }

    return statusRepository.update(userId, id, input);
  },

  async reorderStatuses(userId: string, input: ReorderStatusesInput) {
    return statusRepository.reorder(userId, input.statusIds);
  },

  async deleteStatus(userId: string, id: string) {
    const status = await statusRepository.findById(userId, id);
    if (!status) {
      throw new NotFoundError('Application status not found');
    }

    if (status.isDefault) {
      throw new BadRequestError(`Cannot delete the default status "${status.name}".`);
    }

    const usageCount = await statusRepository.countApplicationsUsingStatus(userId, id);
    if (usageCount > 0) {
      throw new ConflictError(
        `Cannot delete "${status.name}" because ${usageCount} application${
          usageCount === 1 ? ' is' : 's are'
        } currently in this stage. Please reassign them to another stage first.`
      );
    }

    const totalCount = await prisma.applicationStatus.count({
      where: { userId },
    });
    if (totalCount <= 1) {
      throw new BadRequestError('You cannot delete your only remaining application status');
    }

    await statusRepository.delete(userId, id);
    return { success: true, message: `Status "${status.name}" deleted successfully` };
  },
};
