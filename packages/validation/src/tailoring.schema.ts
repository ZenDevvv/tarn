import { z } from 'zod';

export const generateTailoringSchema = z.object({
  targetArtifact: z.enum(['package', 'resume', 'cover_letter']).optional().default('package'),
  documentType: z.enum(['resume', 'cv', 'federal']).optional().default('resume'),
  mode: z.string().optional(), // Wire compatibility; AI is the only engine
  role: z.string().trim().optional(),
  company: z.string().trim().optional(),
  additionalInstructions: z.string().trim().optional(),
  overrideWarnings: z.boolean().optional().default(false),
  sectionOrder: z.array(z.string()).optional(),
  preset: z.enum(['experienced', 'early_career', 'custom']).optional(),
});


export const sectionTypeSchema = z.enum([
  'timeline',
  'credentials',
  'publications',
  'skills_matrix',
  'freeform',
]);

export const timelineItemSchema = z.object({
  id: z.string().optional(),
  role: z.string().trim().min(1),
  organization: z.string().trim().min(1),
  location: z.string().trim().optional().nullable(),
  date_range: z.string().trim().optional().nullable(),
  bullets: z.array(z.string().trim()).default([]),
  attributes: z.record(z.string()).optional(),
});

export const credentialItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  issuer: z.string().trim().optional().nullable(),
  licenseNumber: z.string().trim().optional().nullable(),
  jurisdiction: z.string().trim().optional().nullable(),
  date: z.string().trim().optional().nullable(),
  expirationDate: z.string().trim().optional().nullable(),
  status: z.string().trim().optional().nullable(),
});

export const publicationItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(1),
  authors: z.array(z.string().trim()).optional().default([]),
  venue: z.string().trim().optional().nullable(),
  date: z.string().trim().optional().nullable(),
  doiOrUrl: z.string().trim().optional().nullable(),
});

export const skillGroupItemSchema = z.object({
  category: z.string().trim().min(1),
  skills: z.array(z.string().trim()).default([]),
});

export const freeformItemSchema = z.object({
  heading: z.string().trim().optional().nullable(),
  content: z.string().trim().min(1),
});

export const polymorphicSectionSchema = z.object({
  id: z.string().trim().min(1),
  title: z.string().trim().min(1),
  type: sectionTypeSchema,
  items: z.array(z.any()).default([]),
});

export const updateMasterProfileSchema = z.object({
  basics: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    location: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().optional().nullable(),
    links: z.array(z.object({
      label: z.string().trim().min(1),
      url: z.string().trim(),
    })).default([]),
  }),
  positioningRules: z.array(z.string().trim()).default([]),
  factBank: z.record(z.any()).default({}),
  summaryCandidates: z.array(z.any()).optional().default([]),
  workExperience: z.array(z.object({
    // Defence-in-depth for parsed (not authored) profiles: a resume header can carry
    // neither an employer nor a title signal, and min(1) here turned that one ambiguous
    // segment into a 400 that discarded the entire profile. Parse-time coalescing in
    // ProfileExtractorService.pushJob remains the primary fix; accepting "" here means a
    // future regression degrades one editable field instead of the whole import, which the
    // review-before-commit draft already surfaces. Type is still enforced — only emptiness
    // is allowed. aiResumePayloadSchema deliberately keeps min(1): AI output must name a
    // company, but a real resume is not obliged to.
    company: z.string().trim(),
    location: z.string().trim().optional().nullable(),
    role: z.string().trim(),
    date_range: z.string().trim().min(1),
    bullets: z.array(z.string().trim()).default([]),
  })).default([]),
  projectExperience: z.array(z.object({
    name: z.string().trim().min(1),
    subtitle: z.string().trim().optional().nullable(),
    stack: z.array(z.string().trim()).optional().default([]),
    bullets: z.array(z.string().trim()).default([]),
  })).default([]),
  skills: z.record(z.array(z.string().trim())).default({}),
  education: z.array(z.object({
    school: z.string().trim().min(1),
    location: z.string().trim().optional().nullable(),
    degree: z.string().trim().optional().nullable(),
    honors: z.string().trim().optional().nullable(),
    graduation: z.string().trim().optional().nullable(),
    details: z.string().trim().optional().nullable(),
    bullets: z.array(z.string().trim()).optional().default([]),
  })).default([]),
  customSections: z.array(polymorphicSectionSchema).optional(),
});

export const uploadProfileResumeSchema = z.object({
  filename: z.string().trim().min(1, 'Filename is required'),
  mimeType: z.string().trim().min(1, 'Mime type is required'),
  fileData: z.string().min(1, 'File content is required'),
  mode: z.enum(['ai', 'standard']).default('standard'),
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

export const aiResumePayloadSchema = z.object({
  basics: z.object({
    name: z.string().trim().min(1, 'Candidate name is required'),
    location: z.string().trim().optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    email: z.string().trim().optional().nullable(),
    links: z.array(z.object({
      label: z.string().trim().min(1),
      url: z.string().trim().min(1),
    })).optional().default([]),
  }),
  education: z.array(z.object({
    school: z.string().trim().min(1),
    location: z.string().trim().optional().nullable(),
    degree: z.string().trim().optional().nullable(),
    honors: z.string().trim().optional().nullable(),
    date_range: z.string().trim().optional().nullable(),
    graduation: z.string().trim().optional().nullable(),
    details: z.string().trim().optional().nullable(),
    bullets: z.array(z.string().trim()).optional().default([]),
  })).optional().default([]),
  experience: z.array(z.object({
    company: z.string().trim().min(1),
    location: z.string().trim().optional().nullable(),
    role: z.string().trim().min(1),
    date_range: z.string().trim().optional(),
    bullets: z.array(z.string().trim()).default([]),
  })).default([]),
  projects: z.array(z.object({
    name: z.string().trim().min(1),
    subtitle: z.string().trim().optional().nullable(),
    stack: z.array(z.string().trim()).optional().default([]),
    bullets: z.array(z.string().trim()).default([]),
  })).optional().default([]),
  skills: z.record(z.array(z.string().trim())).default({}),
  summary: z.string().trim().optional().nullable(),
  certifications: z.array(z.any()).optional().default([]),
  customSections: z.array(polymorphicSectionSchema).optional(),
  sectionOrder: z.array(z.string()).optional(),
  sectionTitles: z.record(z.string().trim().min(1)).optional(),
});

export const aiTailoringOutputSchema = z.object({
  resume: aiResumePayloadSchema,
  coverLetterMarkdown: z.string().trim().min(1, 'Cover letter content is required'),
});

export type GenerateTailoringInput = z.input<typeof generateTailoringSchema>;
export type GenerateTailoringOutput = z.output<typeof generateTailoringSchema>;
export type UpdateMasterProfileInput = z.infer<typeof updateMasterProfileSchema>;
export type ConfirmImportMasterProfileInput = UpdateMasterProfileInput;
export type UploadProfileResumeInput = z.infer<typeof uploadProfileResumeSchema>;
export type CreateCoverLetterInput = z.infer<typeof createCoverLetterSchema>;
export type UpdateCoverLetterInput = z.infer<typeof updateCoverLetterSchema>;
export type AiResumePayload = z.infer<typeof aiResumePayloadSchema>;
export type AiTailoringOutput = z.infer<typeof aiTailoringOutputSchema>;

