import { z } from 'zod';

export const generateTailoringSchema = z.object({
  mode: z.enum(['ai', 'deterministic']).optional().default('deterministic'),
  role: z.string().trim().optional(),
  company: z.string().trim().optional(),
  additionalInstructions: z.string().trim().optional(),
});

export const updateMasterProfileSchema = z.object({
  basics: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    location: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().optional().nullable(),
    links: z.array(z.object({
      label: z.string().trim().min(1),
      url: z.string().trim().min(1),
    })).default([]),
  }),
  positioningRules: z.array(z.string().trim()).default([]),
  factBank: z.record(z.any()).default({}),
  summaryCandidates: z.array(z.any()).optional().default([]),
  workExperience: z.array(z.object({
    company: z.string().trim().min(1),
    location: z.string().trim().optional().nullable(),
    role: z.string().trim().min(1),
    date_range: z.string().trim().min(1),
    bullets: z.array(z.string().trim()).default([]),
  })).default([]),
  projectExperience: z.array(z.object({
    name: z.string().trim().min(1),
    subtitle: z.string().trim().optional().nullable(),
    stack: z.array(z.string().trim()).optional().default([]),
    bullets: z.array(z.string().trim()).default([]),
  })).default([]),
  technicalSkills: z.record(z.array(z.string().trim())).default({}),
  education: z.array(z.object({
    school: z.string().trim().min(1),
    location: z.string().trim().optional().nullable(),
    degree: z.string().trim().optional().nullable(),
    honors: z.string().trim().optional().nullable(),
    graduation: z.string().trim().optional().nullable(),
    details: z.string().trim().optional().nullable(),
    bullets: z.array(z.string().trim()).optional().default([]),
  })).default([]),
});

export const uploadProfileResumeSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required'),
  mimeType: z.string().trim().min(1, 'Mime type is required'),
  fileData: z.string().min(1, 'File content is required'),
});

export const createCoverLetterSchema = z.object({
  applicationId: z.string().optional().nullable(),
  name: z.string().trim().min(1, 'Name is required'),
  role: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
});

export const updateCoverLetterSchema = z.object({
  name: z.string().trim().optional(),
  role: z.string().trim().optional().nullable(),
  company: z.string().trim().optional().nullable(),
  content: z.string().min(1, 'Content is required'),
});

export const confirmImportMasterProfileSchema = updateMasterProfileSchema;

export type GenerateTailoringInput = z.infer<typeof generateTailoringSchema>;
export type UpdateMasterProfileInput = z.infer<typeof updateMasterProfileSchema>;
export type ConfirmImportMasterProfileInput = UpdateMasterProfileInput;
export type UploadProfileResumeInput = z.infer<typeof uploadProfileResumeSchema>;
export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>;
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;

