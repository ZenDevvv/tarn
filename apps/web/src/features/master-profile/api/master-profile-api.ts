import { apiClient } from '@/lib/api-client';
import { MasterProfileDTO } from '@tracker/types';
import { UpdateMasterProfileInput, UploadProfileResumeInput } from '@tracker/validation';

export const masterProfileApi = {
  async getProfile(): Promise<MasterProfileDTO> {
    return apiClient.get<MasterProfileDTO>('/master-profile');
  },

  async updateProfile(input: UpdateMasterProfileInput): Promise<MasterProfileDTO> {
    return apiClient.put<MasterProfileDTO>('/master-profile', input);
  },

  async uploadResume(input: UploadProfileResumeInput): Promise<MasterProfileDTO> {
    return apiClient.post<MasterProfileDTO>('/master-profile/upload-resume', input);
  },

  async importJson(jsonPayload: any): Promise<MasterProfileDTO> {
    return apiClient.post<MasterProfileDTO>('/master-profile/import-json', jsonPayload);
  },

  async exportJson(): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>('/master-profile/export-json');
  },
};
