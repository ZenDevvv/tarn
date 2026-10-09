import { apiClient } from '@/lib/api-client';
import { ResumeDTO, ResumeWithDetailsDTO } from '@tracker/types';
import { CreateResumeInput, UpdateResumeInput, ResumeFiltersInput, UploadResumeFileInput } from '@tracker/validation';

export const resumeApi = {
  async getResumes(filters: Partial<ResumeFiltersInput> = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.targetRole) params.append('targetRole', filters.targetRole);
    if (filters.isDefault) params.append('isDefault', filters.isDefault);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const query = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get<ResumeWithDetailsDTO[]>(`/resumes${query}`);
  },

  async getResume(id: string) {
    return apiClient.get<ResumeWithDetailsDTO>(`/resumes/${id}`);
  },

  async createResume(input: CreateResumeInput) {
    return apiClient.post<ResumeWithDetailsDTO>('/resumes', input);
  },

  async updateResume(id: string, input: UpdateResumeInput) {
    return apiClient.patch<ResumeWithDetailsDTO>(`/resumes/${id}`, input);
  },

  async setDefaultResume(id: string) {
    return apiClient.post<ResumeWithDetailsDTO>(`/resumes/${id}/default`);
  },

  async deleteResume(id: string) {
    return apiClient.delete<boolean>(`/resumes/${id}`);
  },

  async uploadFile(input: UploadResumeFileInput) {
    return apiClient.post<{
      fileUrl: string;
      filename: string;
      fileSize: number;
      mimeType: string;
    }>('/resumes/upload', input);
  },
};

export function resolveDocumentUrl(fileUrl?: string | null): string {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
    return fileUrl;
  }
  // In browser, keep relative /uploads paths to leverage local reverse proxy and same-origin framing
  if (typeof window !== 'undefined' && fileUrl.startsWith('/uploads')) {
    return fileUrl;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
  const origin = apiBase.replace(/\/api\/v1\/?$/, '');
  return `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

