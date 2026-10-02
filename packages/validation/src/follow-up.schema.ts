import { z } from 'zod';
import { priorityEnum } from './application.schema';

export const followUpStatusEnum = z.enum(['PENDING', 'COMPLETED', 'CANCELLED']);

export const createFollowUpSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  action: z.string().trim().min(1, 'Action description is required'),
  dueAt: z.string().datetime('Due date must be a valid ISO string'),
  priority: priorityEnum.default('MEDIUM'),
  notes: z.string().optional().nullable(),
});

export const updateFollowUpSchema = z.object({
  action: z.string().trim().min(1).optional(),
  dueAt: z.string().datetime().optional(),
  priority: priorityEnum.optional(),
  status: followUpStatusEnum.optional(),
  notes: z.string().optional().nullable(),
});

export const followUpFilterSchema = z.object({
  due: z.enum(['today', 'overdue', 'all']).optional(),
  applicationId: z.string().optional(),
});

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
export type FollowUpFilterInput = z.infer<typeof followUpFilterSchema>;
