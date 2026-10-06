import { describe, it, expect } from 'vitest';
import { UserSettingsDTO, UserDataExportDTO } from '@tracker/types';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from '@tracker/validation';

describe('Settings Feature - Unit Tests', () => {
  const mockSettings: UserSettingsDTO = {
    id: 'user_settings_1',
    email: 'candidate@example.com',
    name: 'Mikaela Torres',
    headline: 'Senior Full Stack Engineer',
    location: 'San Francisco, CA',
    timezone: 'America/Los_Angeles',
    phone: '+1 (555) 234-5678',
    website: 'https://mikaela.dev',
    linkedinUrl: 'https://linkedin.com/in/mikaelatorres',
    bio: '10 years building high-performance web applications and design systems.',
    defaultCurrency: 'PHP',
    defaultWorkSetup: 'REMOTE',
    defaultResumeId: 'resume_123',
    defaultResumeName: 'FullStack 2026 (v2.1)',
    emailNotifications: true,
    interviewReminders: true,
    followUpAlerts: true,
    weeklyDigest: false,
    themePreference: 'dark',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalApplications: 24,
      activeApplications: 8,
      totalInterviews: 5,
      totalContacts: 12,
      totalCompanies: 18,
      totalResumes: 3,
    },
  };

  it('validates mock UserSettingsDTO structure and stats', () => {
    expect(mockSettings.email).toBe('candidate@example.com');
    expect(mockSettings.name).toBe('Mikaela Torres');
    expect(mockSettings.headline).toBe('Senior Full Stack Engineer');
    expect(mockSettings.defaultWorkSetup).toBe('REMOTE');
    expect(mockSettings.defaultCurrency).toBe('PHP');
    expect(mockSettings.themePreference).toBe('dark');
    expect(mockSettings.stats.totalApplications).toBe(24);
    expect(mockSettings.stats.activeApplications).toBe(8);
  });

  it('validates updateProfileSchema parses valid inputs and rejects invalid ones', () => {
    const valid = updateProfileSchema.safeParse({
      name: 'Elena Rostova',
      headline: 'Principal Engineer',
      location: 'Berlin, Germany',
      website: 'https://elena.codes',
      linkedinUrl: 'https://linkedin.com/in/elena',
    });
    expect(valid.success).toBe(true);

    const invalidName = updateProfileSchema.safeParse({
      name: 'A', // too short (< 2)
    });
    expect(invalidName.success).toBe(false);

    const invalidUrl = updateProfileSchema.safeParse({
      name: 'Valid Name',
      website: 'not-a-valid-url',
    });
    expect(invalidUrl.success).toBe(false);
  });

  it('validates updatePreferencesSchema accepts standard enums and currency codes', () => {
    const valid = updatePreferencesSchema.safeParse({
      defaultCurrency: 'eur',
      defaultWorkSetup: 'HYBRID',
      emailNotifications: true,
      interviewReminders: false,
      themePreference: 'light',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.defaultCurrency).toBe('EUR');
    }

    const invalidCurrency = updatePreferencesSchema.safeParse({
      defaultCurrency: 'USDOLLARS', // length must be 3
    });
    expect(invalidCurrency.success).toBe(false);
  });

  it('validates changePasswordSchema requires at least 8 characters', () => {
    const valid = changePasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: 'newSecurePassword456',
    });
    expect(valid.success).toBe(true);

    const shortPassword = changePasswordSchema.safeParse({
      currentPassword: 'currentPassword123',
      newPassword: 'short',
    });
    expect(shortPassword.success).toBe(false);
  });

  it('validates UserDataExportDTO export format', () => {
    const exportData: UserDataExportDTO = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      user: {
        id: mockSettings.id,
        email: mockSettings.email,
        name: mockSettings.name,
        headline: mockSettings.headline,
        location: mockSettings.location,
        timezone: mockSettings.timezone,
        phone: mockSettings.phone,
        website: mockSettings.website,
        linkedinUrl: mockSettings.linkedinUrl,
        bio: mockSettings.bio,
        createdAt: mockSettings.createdAt,
      },
      applications: [],
      companies: [],
      contacts: [],
      interviews: [],
      followUps: [],
      resumes: [],
    };

    expect(exportData.version).toBe('1.0.0');
    expect(exportData.user.email).toBe('candidate@example.com');
    expect(Array.isArray(exportData.applications)).toBe(true);
  });
});
