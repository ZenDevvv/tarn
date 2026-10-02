import { followUpRepository } from './follow-up.repository';
import { CreateFollowUpInput, UpdateFollowUpInput, FollowUpFilterInput } from '@tracker/validation';
import { NotFoundError } from '../../middleware/error-handler';

export const followUpService = {
  async createFollowUp(userId: string, input: CreateFollowUpInput) {
    const followUp = await followUpRepository.create(userId, input);
    if (!followUp) {
      throw new NotFoundError('Application not found');
    }
    return followUp;
  },

  async getFollowUps(userId: string, filter: FollowUpFilterInput) {
    return followUpRepository.findMany(userId, filter);
  },

  async getFollowUpById(userId: string, id: string) {
    const followUp = await followUpRepository.findById(userId, id);
    if (!followUp) {
      throw new NotFoundError('Follow-up not found');
    }
    return followUp;
  },

  async completeFollowUp(userId: string, id: string) {
    const completed = await followUpRepository.complete(userId, id);
    if (!completed) {
      throw new NotFoundError('Follow-up not found');
    }
    return completed;
  },

  async updateFollowUp(userId: string, id: string, input: UpdateFollowUpInput) {
    const updated = await followUpRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Follow-up not found');
    }
    return updated;
  },

  async deleteFollowUp(userId: string, id: string) {
    const result = await followUpRepository.delete(userId, id);
    if (!result) {
      throw new NotFoundError('Follow-up not found');
    }
    return result;
  },
};
