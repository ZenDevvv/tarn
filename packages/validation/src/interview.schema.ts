import { z } from 'zod';

export const interviewTypeEnum = z.enum([
  'HR',
  'RECRUITER',
  'TECHNICAL',
  'CODING_ASSESSMENT',
  'SYSTEM_DESIGN',
  'HIRING_MANAGER',
  'FINAL',
  'CLIENT',
  'OTHER',
]);

export const interviewStatusEnum = z.enum([
  'SCHEDULED',
  'COMPLETED',
  'RESCHEDULED',
  'CANCELLED',
  'NO_SHOW',
]);

export const interviewResultEnum = z.enum([
  'PENDING',
  'PASSED',
  'FAILED',
  'DID_NOT_HEAR_BACK',
]);

export const createInterviewSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  round: z.coerce.number().int().min(1).default(1),
  type: interviewTypeEnum.default('TECHNICAL'),
  title: z.string().trim().max(100).optional().nullable(),
  scheduledAt: z.string().datetime('Scheduled date must be a valid ISO string'),
  durationMinutes: z.coerce.number().int().min(5).max(480).default(45),
  timezone: z.string().max(50).optional().nullable(),
  interviewerName: z.string().trim().max(100).optional().nullable(),
  interviewerRole: z.string().trim().max(100).optional().nullable(),
  meetingUrl: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z.string().trim().max(150).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  prepNotes: z.string().max(5000).optional().nullable(),
});

export const updateInterviewSchema = z.object({
  round: z.coerce.number().int().min(1).optional(),
  type: interviewTypeEnum.optional(),
  title: z.string().trim().max(100).optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  timezone: z.string().max(50).optional().nullable(),
  interviewerName: z.string().trim().max(100).optional().nullable(),
  interviewerRole: z.string().trim().max(100).optional().nullable(),
  meetingUrl: z
    .string()
    .trim()
    .url('Must be a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  location: z.string().trim().max(150).optional().nullable(),
  status: interviewStatusEnum.optional(),
  result: interviewResultEnum.optional(),
  notes: z.string().max(5000).optional().nullable(),
  prepNotes: z.string().max(5000).optional().nullable(),
});

export const updateInterviewStatusSchema = z.object({
  status: interviewStatusEnum,
  result: interviewResultEnum.optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export const interviewFilterSchema = z.object({
  upcoming: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  status: interviewStatusEnum.optional(),
  applicationId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UpdateInterviewInput = z.infer<typeof updateInterviewSchema>;
export type UpdateInterviewStatusInput = z.infer<typeof updateInterviewStatusSchema>;
export type InterviewFilterInput = z.infer<typeof interviewFilterSchema>;
