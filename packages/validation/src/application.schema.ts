import { z } from 'zod';

export const applicationStatusEnum = z.enum([
  'SAVED',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'ACCEPTED',
  'REJECTED',
  'WITHDRAWN',
  'NO_RESPONSE',
]);

export const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const workSetupEnum = z.enum(['REMOTE', 'HYBRID', 'ONSITE']);
export const employmentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
  'FREELANCE',
]);

export const createApplicationSchema = z.object({
  companyName: z.string().trim().min(1, 'Company name is required'),
  position: z.string().trim().min(1, 'Position title is required'),
  statusId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  priority: priorityEnum.default('MEDIUM'),
  source: z.string().trim().optional().nullable(),
  sourceUrl: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  description: z.string().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  workSetup: workSetupEnum.optional().nullable(),
  employmentType: employmentTypeEnum.optional().nullable(),
  salaryMin: z.coerce.number().int().nonnegative().optional().nullable(),
  salaryMax: z.coerce.number().int().nonnegative().optional().nullable(),
  currency: z.string().trim().optional().default('PHP'),
  appliedAt: z.string().datetime().optional().nullable(),
  nextAction: z.string().trim().optional().nullable(),
  nextActionDueAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  resumeId: z.string().trim().optional().nullable(),
});

export const updateApplicationSchema = createApplicationSchema.partial().omit({
  companyName: true,
  position: true,
}).extend({
  companyName: z.string().trim().min(1).optional(),
  position: z.string().trim().min(1).optional(),
});

export const updateApplicationStatusSchema = z.object({
  statusId: z.string().trim().min(1, 'Status ID is required').optional(),
  status: z.string().trim().min(1).optional(),
}).refine((data) => data.statusId || data.status, {
  message: 'Status ID is required',
});

export const submitResumeSchema = z.object({
  // Optional: falls back to the application's current resume when omitted.
  resumeId: z.string().trim().min(1).optional(),
});

export const applicationFiltersSchema = z.object({
  statusId: z.string().trim().optional(),
  status: z.string().trim().optional(),
  search: z.string().trim().optional(),
  source: z.string().trim().optional(),
  workSetup: workSetupEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['appliedAt', 'createdAt', 'updatedAt', 'nextActionDueAt']).default('appliedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type SubmitResumeInput = z.infer<typeof submitResumeSchema>;
export type ApplicationFiltersInput = z.infer<typeof applicationFiltersSchema>;

export const parseJobUrlSchema = z.object({
  url: z.string().trim().url('Please provide a valid web URL (e.g. https://...)'),
});

export type ParseJobUrlInput = z.infer<typeof parseJobUrlSchema>;

export const parseJobTextSchema = z.object({
  text: z.string().trim().min(3, 'Please paste at least a snippet of the job post'),
  sourceUrl: z.string().trim().optional(),
});

export type ParseJobTextInput = z.infer<typeof parseJobTextSchema>;


