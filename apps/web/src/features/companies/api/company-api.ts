import { apiClient } from '@/lib/api-client';
import { CompanyDTO, CompanyWithDetailsDTO } from '@tracker/types';
import { CreateCompanyInput, UpdateCompanyInput, CompanyFiltersInput } from '@tracker/validation';

export const companyApi = {
  async getCompanies(filters: Partial<CompanyFiltersInput> = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.industry) params.append('industry', filters.industry);
    if (filters.hasActive) params.append('hasActive', filters.hasActive);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<CompanyWithDetailsDTO[]>(`/companies${query}`);
  },

  async getCompany(id: string) {
    return apiClient.get<CompanyWithDetailsDTO>(`/companies/${id}`);
  },

  async createCompany(input: CreateCompanyInput) {
    return apiClient.post<CompanyDTO>('/companies', input);
  },

  async updateCompany(id: string, input: UpdateCompanyInput) {
    return apiClient.patch<CompanyDTO>(`/companies/${id}`, input);
  },

  async deleteCompany(id: string) {
    return apiClient.delete<{ id: string; deleted: boolean }>(`/companies/${id}`);
  },
};
