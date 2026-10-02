import { apiClient } from '@/lib/api-client';
import { UserDTO } from '@tracker/types';
import { LoginInput, RegisterInput } from '@tracker/validation';

export const authApi = {
  async register(input: RegisterInput) {
    return apiClient.post<{ user: UserDTO; message: string }>('/auth/register', input);
  },

  async login(input: LoginInput) {
    return apiClient.post<{ user: UserDTO; message: string }>('/auth/login', input);
  },

  async logout() {
    return apiClient.post<{ message: string }>('/auth/logout');
  },

  async fetchMe() {
    return apiClient.get<{ user: UserDTO }>('/auth/me');
  },
};
