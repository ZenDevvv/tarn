import { apiClient } from "@/lib/api-client";
import {
  SystemStatusDTO,
  AdminUserListItemDTO,
  AdminUserDetailDTO,
  ApiListResponse,
  Role,
} from "@tracker/types";
import { AdminUsersQueryInput } from "@tracker/validation";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api/v1";

export const adminApi = {
  async getSystemStatus(): Promise<SystemStatusDTO> {
    return apiClient.get<SystemStatusDTO>("/admin/system/status");
  },

  async getUsers(params: Partial<AdminUsersQueryInput> = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append("page", String(params.page));
    if (params.limit) searchParams.append("limit", String(params.limit));
    if (params.search) searchParams.append("search", params.search);
    if (params.role) searchParams.append("role", params.role);
    if (params.isActive !== undefined)
      searchParams.append("isActive", String(params.isActive));
    if (params.sortBy) searchParams.append("sortBy", params.sortBy);
    if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : "";
    const res = await fetch(`${BASE_URL}/admin/users${query}`, {
      credentials: "include",
    });

    if (!res.ok) {
      let message = `Failed to fetch users (${res.status})`;
      try {
        const errorJson = await res.json();
        if (errorJson?.error?.message) message = errorJson.error.message;
      } catch {
        // ignore json parse error
      }
      throw new Error(message);
    }

    const json: ApiListResponse<AdminUserListItemDTO> = await res.json();
    return json;
  },

  async getUserById(id: string): Promise<AdminUserDetailDTO> {
    return apiClient.get<AdminUserDetailDTO>(`/admin/users/${id}`);
  },

  async updateUserRole(id: string, role: Role): Promise<AdminUserListItemDTO> {
    return apiClient.patch<AdminUserListItemDTO>(`/admin/users/${id}/role`, {
      role,
    });
  },

  async updateUserStatus(
    id: string,
    isActive: boolean,
  ): Promise<AdminUserListItemDTO> {
    return apiClient.patch<AdminUserListItemDTO>(`/admin/users/${id}/status`, {
      isActive,
    });
  },
};
