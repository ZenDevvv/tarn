import { apiClient } from '@/lib/api-client';
import {
  ApplicationStatusDTO,
  CreateStatusInput,
  UpdateStatusInput,
  ReorderStatusesInput,
} from '@tracker/types';

export const statusApi = {
  async getStatuses(): Promise<ApplicationStatusDTO[]> {
    return apiClient.get<ApplicationStatusDTO[]>('/statuses');
  },

  async createStatus(input: CreateStatusInput): Promise<ApplicationStatusDTO> {
    return apiClient.post<ApplicationStatusDTO>('/statuses', input);
  },

  async updateStatus(id: string, input: UpdateStatusInput): Promise<ApplicationStatusDTO> {
    return apiClient.patch<ApplicationStatusDTO>(`/statuses/${id}`, input);
  },

  async reorderStatuses(input: ReorderStatusesInput): Promise<ApplicationStatusDTO[]> {
    return apiClient.put<ApplicationStatusDTO[]>('/statuses/reorder', input);
  },

  async deleteStatus(id: string): Promise<{ id: string; deleted: boolean }> {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/statuses/${id}`);
  },
};
