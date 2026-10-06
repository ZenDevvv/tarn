import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long').max(100, 'Name cannot exceed 100 characters'),
  headline: z.string().trim().max(120, 'Headline cannot exceed 120 characters').nullable().optional(),
  location: z.string().trim().max(100, 'Location cannot exceed 100 characters').nullable().optional(),
  timezone: z.string().trim().max(50, 'Timezone cannot exceed 50 characters').nullable().optional(),
  phone: z.string().trim().max(30, 'Phone cannot exceed 30 characters').nullable().optional(),
  website: z
    .string()
    .trim()
    .url('Website must be a valid URL')
    .or(z.literal(''))
    .nullable()
    .optional(),
  linkedinUrl: z
    .string()
    .trim()
    .url('LinkedIn profile must be a valid URL')
    .or(z.literal(''))
    .nullable()
    .optional(),
  bio: z.string().trim().max(1000, 'Bio cannot exceed 1000 characters').nullable().optional(),
});

export const updatePreferencesSchema = z.object({
  defaultCurrency: z
    .string()
    .trim()
    .length(3, 'Currency code must be exactly 3 uppercase letters (e.g. USD, EUR, GBP)')
    .toUpperCase()
    .optional(),
  defaultWorkSetup: z.enum(['REMOTE', 'HYBRID', 'ONSITE']).nullable().optional(),
  defaultResumeId: z.string().nullable().optional(),
  emailNotifications: z.boolean().optional(),
  interviewReminders: z.boolean().optional(),
  followUpAlerts: z.boolean().optional(),
  weeklyDigest: z.boolean().optional(),
  themePreference: z.enum(['light', 'dark', 'system']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export type UpdateProfileSchemaInput = z.infer<typeof updateProfileSchema>;
export type UpdatePreferencesSchemaInput = z.infer<typeof updatePreferencesSchema>;
export type ChangePasswordSchemaInput = z.infer<typeof changePasswordSchema>;
