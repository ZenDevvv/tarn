import { apiClient } from '@/lib/api-client';
import { MasterProfileDTO, MasterProfileDraftDTO } from '@tracker/types';
import { UpdateMasterProfileInput, UploadProfileResumeInput, ConfirmImportMasterProfileInput } from '@tracker/validation';

export const masterProfileApi = {
  async getProfile(): Promise<MasterProfileDTO> {
    return apiClient.get<MasterProfileDTO>('/master-profile');
  },

  async updateProfile(input: UpdateMasterProfileInput): Promise<MasterProfileDTO> {
    return apiClient.put<MasterProfileDTO>('/master-profile', input);
  },

  async uploadResume(input: UploadProfileResumeInput): Promise<MasterProfileDraftDTO> {
    return apiClient.post<MasterProfileDraftDTO>('/master-profile/upload-resume', input);
  },

  async importJson(jsonPayload: any): Promise<MasterProfileDraftDTO> {
    return apiClient.post<MasterProfileDraftDTO>('/master-profile/import-json', jsonPayload);
  },

  async confirmImport(input: ConfirmImportMasterProfileInput): Promise<MasterProfileDTO> {
    return apiClient.post<MasterProfileDTO>('/master-profile/confirm-import', input);
  },

  async exportJson(): Promise<Record<string, any>> {
    return apiClient.get<Record<string, any>>('/master-profile/export-json');
  },
};

