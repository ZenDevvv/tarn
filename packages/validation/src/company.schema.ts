import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().trim().min(1, 'Company name is required'),
  website: z.string().trim().url('Website must be a valid URL').or(z.literal('')).optional().nullable(),
  industry: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const companyFiltersSchema = z.object({
  search: z.string().optional(),
  industry: z.string().optional(),
  hasActive: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['name', 'createdAt', 'applicationsCount', 'updatedAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyFiltersInput = z.infer<typeof companyFiltersSchema>;

