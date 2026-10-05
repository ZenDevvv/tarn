import { apiClient } from '@/lib/api-client';
import { AnalyticsOverviewDTO } from '@tracker/types';

export const analyticsApi = {
  getOverview: (range: 'all' | '30d' | '90d' | 'ytd' = 'all') => {
    return apiClient.get<AnalyticsOverviewDTO>(`/analytics/overview?range=${range}`);
  },
};
