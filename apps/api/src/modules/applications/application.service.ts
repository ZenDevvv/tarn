import { applicationRepository } from './application.repository';
import { CreateApplicationInput, UpdateApplicationInput, ApplicationFiltersInput } from '@tracker/validation';
import { NotFoundError, BadRequestError } from '../../middleware/error-handler';

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

  async submitPackage(userId: string, id: string, resumeId?: string, coverLetterId?: string) {
    const result = await applicationRepository.submitPackage(userId, id, resumeId, coverLetterId);
    if ('error' in result) {
      if (result.error === 'NOT_FOUND') throw new NotFoundError('Application not found');
      if (result.error === 'NO_DOCUMENT') {
        throw new BadRequestError('Provide a resume or a cover letter to mark as submitted.');
      }
      throw new BadRequestError(
        'That document was not generated for this application and cannot be marked as submitted.'
      );
    }
    return result;
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
