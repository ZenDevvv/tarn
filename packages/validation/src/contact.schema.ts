import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().trim().min(1, 'Contact name is required'),
  role: z.string().trim().optional().nullable(),
  email: z.string().trim().email('Email must be a valid email address').or(z.literal('')).optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  linkedinUrl: z.string().trim().url('LinkedIn URL must be a valid URL').or(z.literal('')).optional().nullable(),
  companyId: z.string().trim().optional().nullable(),
  applicationId: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const updateContactSchema = createContactSchema.partial();

export const contactFiltersSchema = z.object({
  search: z.string().optional(),
  companyId: z.string().optional(),
  hasApplication: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'role']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFiltersInput = z.infer<typeof contactFiltersSchema>;
