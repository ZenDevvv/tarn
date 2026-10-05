import { z } from 'zod';

export const analyticsQuerySchema = z.object({
  range: z.enum(['all', '30d', '90d', 'ytd']).default('all'),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
