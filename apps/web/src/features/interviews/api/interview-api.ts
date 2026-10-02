import { apiClient } from '@/lib/api-client';
import { InterviewDTO } from '@tracker/types';
import { CreateInterviewInput, UpdateInterviewInput, UpdateInterviewStatusInput, InterviewFilterInput } from '@tracker/validation';

export const interviewApi = {
  async getInterviews(filter: Partial<InterviewFilterInput> = {}) {
    const params = new URLSearchParams();
    if (filter.upcoming !== undefined) params.append('upcoming', String(filter.upcoming));
    if (filter.status) params.append('status', filter.status);
    if (filter.applicationId) params.append('applicationId', filter.applicationId);
    if (filter.limit) params.append('limit', String(filter.limit));

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<InterviewDTO[]>(`/interviews${query}`);
  },

  async getInterview(id: string) {
    return apiClient.get<InterviewDTO>(`/interviews/${id}`);
  },

  async createInterview(input: CreateInterviewInput) {
    return apiClient.post<InterviewDTO>('/interviews', input);
  },

  async updateInterview(id: string, input: UpdateInterviewInput) {
    return apiClient.patch<InterviewDTO>(`/interviews/${id}`, input);
  },

  async updateStatus(id: string, input: UpdateInterviewStatusInput) {
    return apiClient.patch<InterviewDTO>(`/interviews/${id}/status`, input);
  },

  async deleteInterview(id: string) {
    return apiClient.delete<{ success: boolean }>(`/interviews/${id}`);
  },

  async getByApplication(applicationId: string) {
    return apiClient.get<InterviewDTO[]>(`/applications/${applicationId}/interviews`);
  },
};
