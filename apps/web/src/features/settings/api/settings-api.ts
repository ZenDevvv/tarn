import { apiClient } from '@/lib/api-client';
import {
  UserSettingsDTO,
  UpdateProfileInput,
  UpdatePreferencesInput,
  ChangePasswordInput,
} from '@tracker/types';

export const settingsApi = {
  async getSettings(): Promise<UserSettingsDTO> {
    const res = await apiClient.get<UserSettingsDTO>('/settings');
    return res;
  },

  async updateProfile(input: UpdateProfileInput): Promise<UserSettingsDTO> {
    const res = await apiClient.patch<UserSettingsDTO>('/settings/profile', input);
    return res;
  },

  async updatePreferences(input: UpdatePreferencesInput): Promise<UserSettingsDTO> {
    const res = await apiClient.patch<UserSettingsDTO>('/settings/preferences', input);
    return res;
  },

  async changePassword(input: ChangePasswordInput): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/settings/password', input);
    return res;
  },

  async downloadExport(): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
    const response = await fetch(`${baseUrl}/settings/export`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to export user data');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `job-tracker-export-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
