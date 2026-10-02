import { interviewRepository } from './interview.repository';
import {
  CreateInterviewInput,
  UpdateInterviewInput,
  UpdateInterviewStatusInput,
  InterviewFilterInput,
} from '@tracker/validation';
import { NotFoundError } from '../../middleware/error-handler';

export const interviewService = {
  async createInterview(userId: string, input: CreateInterviewInput) {
    const interview = await interviewRepository.create(userId, input);
    if (!interview) {
      throw new NotFoundError('Application not found');
    }
    return interview;
  },

  async getInterviews(userId: string, filter: InterviewFilterInput) {
    return interviewRepository.findMany(userId, filter);
  },

  async getInterviewById(userId: string, id: string) {
    const interview = await interviewRepository.findById(userId, id);
    if (!interview) {
      throw new NotFoundError('Interview not found');
    }
    return interview;
  },

  async updateInterview(userId: string, id: string, input: UpdateInterviewInput) {
    const updated = await interviewRepository.update(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Interview not found');
    }
    return updated;
  },

  async updateInterviewStatus(userId: string, id: string, input: UpdateInterviewStatusInput) {
    const updated = await interviewRepository.updateStatus(userId, id, input);
    if (!updated) {
      throw new NotFoundError('Interview not found');
    }
    return updated;
  },

  async deleteInterview(userId: string, id: string) {
    const result = await interviewRepository.delete(userId, id);
    if (!result) {
      throw new NotFoundError('Interview not found');
    }
    return result;
  },

  async getInterviewsByApplication(userId: string, applicationId: string) {
    return interviewRepository.findByApplication(userId, applicationId);
  },
};
