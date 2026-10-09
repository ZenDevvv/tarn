import { apiClient } from '@/lib/api-client';
import { CoverLetterDTO, CoverLetterWithDetailsDTO } from '@tracker/types';
import { UpdateCoverLetterInput } from '@tracker/validation';

export const coverLetterApi = {
  async getAll(): Promise<CoverLetterWithDetailsDTO[]> {
    return apiClient.get<CoverLetterWithDetailsDTO[]>('/cover-letters');
  },

  async getCoverLetter(id: string): Promise<CoverLetterDTO> {
    return apiClient.get<CoverLetterDTO>(`/cover-letters/${id}`);
  },

  async updateCoverLetter(id: string, input: UpdateCoverLetterInput): Promise<CoverLetterDTO> {
    return apiClient.patch<CoverLetterDTO>(`/cover-letters/${id}`, input);
  },

  async deleteCoverLetter(id: string): Promise<boolean> {
    return apiClient.delete<boolean>(`/cover-letters/${id}`);
  },

  async getForApplication(applicationId: string): Promise<CoverLetterDTO[]> {
    return apiClient.get<CoverLetterDTO[]>(`/cover-letters/application/${applicationId}`);
  },
};
