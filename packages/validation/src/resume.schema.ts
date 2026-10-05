import { z } from 'zod';

export const createResumeSchema = z.object({
  name: z.string().trim().min(1, 'Resume name is required').max(120, 'Name cannot exceed 120 characters'),
  version: z.string().trim().optional().nullable(),
  targetRole: z.string().trim().optional().nullable(),
  fileUrl: z.string().trim().optional().nullable(),
  filename: z.string().trim().optional().nullable(),
  fileSize: z.number().int().nonnegative().optional().nullable(),
  mimeType: z.string().trim().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  skills: z.union([
    z.array(z.string().trim()),
    z.string().transform((val) => val.split(',').map((s) => s.trim()).filter(Boolean)),
  ]).optional().default([]),
  notes: z.string().trim().optional().nullable(),
});

export const updateResumeSchema = createResumeSchema.partial();

export const resumeFiltersSchema = z.object({
  search: z.string().optional(),
  targetRole: z.string().optional(),
  isDefault: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'version']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const uploadResumeFileSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required'),
  mimeType: z.string().trim().min(1, 'Mime type is required'),
  fileData: z.string().min(1, 'File content is required'),
});

export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type ResumeFiltersInput = z.infer<typeof resumeFiltersSchema>;
export type UploadResumeFileInput = z.infer<typeof uploadResumeFileSchema>;
