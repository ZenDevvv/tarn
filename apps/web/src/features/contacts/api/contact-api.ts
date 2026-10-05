import { apiClient } from '@/lib/api-client';
import { ContactDTO, ContactWithDetailsDTO } from '@tracker/types';
import { CreateContactInput, UpdateContactInput, ContactFiltersInput } from '@tracker/validation';

export const contactApi = {
  async getContacts(filters: Partial<ContactFiltersInput> = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.companyId) params.append('companyId', filters.companyId);
    if (filters.hasApplication) params.append('hasApplication', filters.hasApplication);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ContactWithDetailsDTO[]>(`/contacts${query}`);
  },

  async getContact(id: string) {
    return apiClient.get<ContactWithDetailsDTO>(`/contacts/${id}`);
  },

  async createContact(input: CreateContactInput) {
    return apiClient.post<ContactDTO>('/contacts', input);
  },

  async updateContact(id: string, input: UpdateContactInput) {
    return apiClient.patch<ContactDTO>(`/contacts/${id}`, input);
  },

  async deleteContact(id: string) {
    return apiClient.delete<{ success: boolean }>(`/contacts/${id}`);
  },
};
