import { apiClient } from '@/lib/api-client';
import { ApplicationDTO, ApiListResponse } from '@tracker/types';
import { CreateApplicationInput, UpdateApplicationInput, ApplicationFiltersInput } from '@tracker/validation';

export const applicationApi = {
  async getApplications(filters: Partial<ApplicationFiltersInput> = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.source) params.append('source', filters.source);
    if (filters.workSetup) params.append('workSetup', filters.workSetup);
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    // Custom get returning data + meta
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1'}/applications${query}`, {
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch applications: ${res.statusText}`);
    }
    const json: ApiListResponse<ApplicationDTO> = await res.json();
    return json;
  },

  async getApplication(id: string) {
    return apiClient.get<ApplicationDTO>(`/applications/${id}`);
  },

  async createApplication(input: CreateApplicationInput) {
    return apiClient.post<ApplicationDTO>('/applications', input);
  },

  async updateApplication(id: string, input: UpdateApplicationInput) {
    return apiClient.patch<ApplicationDTO>(`/applications/${id}`, input);
  },

  async updateStatus(id: string, status: string) {
    return apiClient.patch<ApplicationDTO>(`/applications/${id}/status`, { status });
  },

  async deleteApplication(id: string) {
    return apiClient.delete<{ id: string; archived: boolean }>(`/applications/${id}`);
  },
};
