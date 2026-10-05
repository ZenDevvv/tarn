import { z } from 'zod';

export const applicationStatusEnum = z.enum([
  'SAVED',
  'APPLIED',
  'APPLICATION_VIEWED',
  'RECRUITER_CONTACTED',
  'HR_INTERVIEW',
  'TECHNICAL_INTERVIEW',
  'FINAL_INTERVIEW',
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
  status: applicationStatusEnum.default('SAVED'),
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
  currency: z.string().trim().optional().default('USD'),
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

export const updateStatusSchema = z.object({
  status: applicationStatusEnum,
});

export const applicationFiltersSchema = z.object({
  status: applicationStatusEnum.optional(),
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
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
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


