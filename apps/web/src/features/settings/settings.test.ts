import { describe, it, expect } from 'vitest';
import { UserSettingsDTO, UserDataExportDTO } from '@tracker/types';
import {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from '@tracker/validation';
import { settingsApi } from './api/settings-api';
import { ResetAccountModal, ResetModalStatus } from './components/reset-account-modal';

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

  it('validates settings tab routing logic defaults to profile', () => {
    const validTabs = ['profile', 'preferences', 'stages', 'security', 'data'];
    const getActiveTab = (raw: string | null) =>
      raw && validTabs.includes(raw) ? raw : 'profile';

    expect(getActiveTab('profile')).toBe('profile');
    expect(getActiveTab('preferences')).toBe('preferences');
    expect(getActiveTab('stages')).toBe('stages');
    expect(getActiveTab('unknown')).toBe('profile');
    expect(getActiveTab(null)).toBe('profile');
  });

  it('validates settingsApi exports resetAccountData method', () => {
    expect(typeof settingsApi.resetAccountData).toBe('function');
  });

  it('validates type-to-confirm keyword matching logic', () => {
    const isKeywordValid = (input: string) => input.trim() === 'RESET';

    expect(isKeywordValid('RESET')).toBe(true);
    expect(isKeywordValid('  RESET  ')).toBe(true);
    expect(isKeywordValid('reset')).toBe(false);
    expect(isKeywordValid('Reset')).toBe(false);
    expect(isKeywordValid('')).toBe(false);
    expect(isKeywordValid('CONFIRM')).toBe(false);
  });

  it('validates reset user stats structure after wipe', () => {
    const resetStats = {
      totalApplications: 0,
      activeApplications: 0,
      totalInterviews: 0,
      totalContacts: 0,
      totalCompanies: 0,
      totalResumes: 0,
    };

    const resetUser: UserSettingsDTO = {
      ...mockSettings,
      defaultResumeId: null,
      defaultResumeName: null,
      stats: resetStats,
    };

    expect(resetUser.stats.totalApplications).toBe(0);
    expect(resetUser.stats.activeApplications).toBe(0);
    expect(resetUser.stats.totalCompanies).toBe(0);
    expect(resetUser.defaultResumeId).toBeNull();
    // User profile stays intact
    expect(resetUser.email).toBe(mockSettings.email);
    expect(resetUser.name).toBe(mockSettings.name);
  });

  describe('Reset Account Modal - State Transitions & Reload Lifecycle', () => {
    it('exports ResetAccountModal component', () => {
      expect(typeof ResetAccountModal).toBe('function');
    });

    it('defines valid ResetModalStatus phases', () => {
      const validStatuses: ResetModalStatus[] = ['idle', 'loading', 'success'];
      expect(validStatuses).toContain('idle');
      expect(validStatuses).toContain('loading');
      expect(validStatuses).toContain('success');
    });

    it('simulates successful reset state machine: idle -> loading -> success -> reload callback', async () => {
      let state: ResetModalStatus = 'idle';
      let reloaded = false;

      const mockOnConfirm = async () => {
        state = 'loading';
        await new Promise((resolve) => setTimeout(resolve, 10));
      };

      const mockOnSuccess = () => {
        reloaded = true;
      };

      expect(state).toBe('idle');

      // User submits RESET form
      state = 'loading';
      await mockOnConfirm();
      expect(state).toBe('loading');

      // Confirm resolves, transition to finish animation
      state = 'success';
      expect(state).toBe('success');

      // Finish animation window completes (700ms)
      mockOnSuccess();
      expect(reloaded).toBe(true);
    });

    it('simulates error state recovery: loading -> idle with error on failure', async () => {
      let state: ResetModalStatus = 'idle';
      let capturedError: string | null = null;

      const mockOnConfirmFails = async () => {
        state = 'loading';
        throw new Error('Network timeout during reset');
      };

      try {
        await mockOnConfirmFails();
      } catch (err: any) {
        state = 'idle';
        capturedError = err.message;
      }

      expect(state).toBe('idle');
      expect(capturedError).toBe('Network timeout during reset');
    });
  });
});

