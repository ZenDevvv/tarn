import { ApiResponse, ApiErrorResponse } from '@tracker/types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';

export class ApiError extends Error {
  code: string;
  details?: Array<{ field?: string; message: string }>;

  constructor(message: string, code = 'API_ERROR', details?: Array<{ field?: string; message: string }>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Build a user-facing message from any thrown value.
 *
 * The API returns field-level validation failures in `error.details`, but the
 * generic top-level message ("Invalid request data") hides which field failed.
 * Surface the detail lines so the user can act on them.
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  const details = err instanceof ApiError ? err.details : undefined;
  // A detail with no message carries no information; a bare field name is noise.
  const lines = (details || [])
    .map((d) => (d?.message ? [d?.field, d.message].filter(Boolean).join(': ') : ''))
    .filter(Boolean);

  const headline = (err instanceof Error ? err.message : '').trim() || fallback;

  return [headline, ...lines].filter(Boolean).join('\n');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always send httpOnly cookie
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorData: ApiErrorResponse | null = null;
    try {
      errorData = await response.json();
    } catch {
      // not JSON
    }

    const message = errorData?.error?.message || `Request failed with status ${response.status}`;
    const code = errorData?.error?.code || 'HTTP_ERROR';
    const details = errorData?.error?.details;

    throw new ApiError(message, code, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const json: ApiResponse<T> = await response.json();
  return json.data;
}

export const apiClient = {
  get<T>(endpoint: string, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: 'GET' });
  },

  post<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  put<T>(endpoint: string, body?: unknown, options?: RequestInit) {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit) {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },
};
