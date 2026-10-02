import { applicationRepository } from './application.repository';
import { CreateApplicationInput, UpdateApplicationInput, ApplicationFiltersInput } from '@tracker/validation';
import { NotFoundError } from '../../middleware/error-handler';

export const applicationService = {
  async createApplication(userId: string, input: CreateApplicationInput) {
    return applicationRepository.createWithRelations(userId, input);
  },

  async getApplications(userId: string, filters: ApplicationFiltersInput) {
    return applicationRepository.findMany(userId, filters);
  },

  async getApplicationById(userId: string, id: string) {
    const app = await applicationRepository.findById(userId, id);
    if (!app) {
      throw new NotFoundError('Application not found');
    }
    return app;
  },

  async updateApplication(userId: string, id: string, input: UpdateApplicationInput) {
    const updated = await applicationRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Application not found');
    }
    return updated;
  },

  async updateStatus(userId: string, id: string, status: any) {
    const updated = await applicationRepository.updateStatus(userId, id, status);
    if (!updated) {
      throw new NotFoundError('Application not found');
    }
    return updated;
  },

  async archiveApplication(userId: string, id: string) {
    const archived = await applicationRepository.archive(userId, id);
    if (!archived) {
      throw new NotFoundError('Application not found');
    }
    return { id, archived: true };
  },
};
