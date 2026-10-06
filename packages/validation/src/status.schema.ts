import { z } from 'zod';

export const closeTypeEnum = z.enum(['REJECTED', 'WITHDRAWN', 'NO_RESPONSE', 'CANCELLED', 'OTHER']);

export const createStatusSchema = z.object({
  name: z.string().trim().min(1, 'Status name is required').max(50, 'Status name cannot exceed 50 characters'),
  order: z.coerce.number().int().nonnegative().optional(),
  closeType: closeTypeEnum.nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const updateStatusSchema = z.object({
  name: z.string().trim().min(1, 'Status name cannot be empty').max(50, 'Status name cannot exceed 50 characters').optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  closeType: closeTypeEnum.nullable().optional(),
  isDefault: z.boolean().optional(),
});

export const reorderStatusesSchema = z.object({
  statusIds: z.array(z.string().trim().min(1)).min(1, 'At least one status ID is required'),
});

export type CreateStatusInput = z.infer<typeof createStatusSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type ReorderStatusesInput = z.infer<typeof reorderStatusesSchema>;
