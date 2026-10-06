import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserSettingsDTO, UpdatePreferencesInput, WorkSetup, ResumeDTO, WORK_SETUP_LABELS } from '@tracker/types';
import { apiClient } from '@/lib/api-client';
import { useTheme } from '@/app/providers';
import { Select } from '@/components/ui/select';
import { CheckCircle2, AlertCircle, Loader2, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PreferencesSectionProps {
  settings: UserSettingsDTO;
  onSave: (data: UpdatePreferencesInput) => Promise<void>;
  isSaving: boolean;
}

const CURRENCIES = [
  { code: 'PHP', label: 'PHP (₱) - Philippine Peso' },
  { code: 'USD', label: 'USD ($) - US Dollar' },
  { code: 'EUR', label: 'EUR (€) - Euro' },
  { code: 'GBP', label: 'GBP (£) - British Pound' },
  { code: 'CAD', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { code: 'SGD', label: 'SGD ($) - Singapore Dollar' },
  { code: 'JPY', label: 'JPY (¥) - Japanese Yen' },
];

const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({
  value: c.code,
  label: c.label,
}));

const WORK_SETUPS: Array<{ value: WorkSetup | ''; label: string }> = [
  { value: '', label: 'No default (choose per job)' },
  { value: 'REMOTE', label: WORK_SETUP_LABELS.REMOTE },
  { value: 'HYBRID', label: WORK_SETUP_LABELS.HYBRID },
  { value: 'ONSITE', label: WORK_SETUP_LABELS.ONSITE },
];

const WORK_SETUP_OPTIONS = WORK_SETUPS.map((setup) => ({
  value: setup.value,
  label: setup.label,
}));

export function PreferencesSection({ settings, onSave, isSaving }: PreferencesSectionProps) {
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState<UpdatePreferencesInput>({
    defaultCurrency: settings.defaultCurrency || 'PHP',
    defaultWorkSetup: settings.defaultWorkSetup || null,
    defaultResumeId: settings.defaultResumeId || null,
    emailNotifications: settings.emailNotifications ?? true,
    interviewReminders: settings.interviewReminders ?? true,
    followUpAlerts: settings.followUpAlerts ?? true,
    weeklyDigest: settings.weeklyDigest ?? false,
    themePreference: (settings.themePreference as any) || 'system',
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Fetch available resumes for default selection
  const { data: resumes } = useQuery<ResumeDTO[]>({
    queryKey: ['resumes-list-for-settings'],
    queryFn: () => apiClient.get<ResumeDTO[]>('/resumes'),
  });

  const resumeOptions = React.useMemo(() => [
    { value: '', label: 'None (choose manually per application)' },
    ...(resumes || []).map((resume) => ({
      value: resume.id,
      label: `${resume.name} ${resume.version ? `(${resume.version})` : ''} — ${resume.targetRole || 'General'}`,
    })),
  ], [resumes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    try {
      await onSave({
        ...formData,
        defaultWorkSetup: formData.defaultWorkSetup || null,
        defaultResumeId: formData.defaultResumeId || null,
      });
      setStatusMessage({ type: 'success', text: 'Preferences updated successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not update preferences. Try again.',
      });
    }
  };

  const handleThemeChange = (selectedTheme: 'light' | 'dark') => {
    setTheme(selectedTheme);
    setFormData((prev) => ({ ...prev, themePreference: selectedTheme }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 w-full">
      <div>
        <h2 className="text-heading font-display font-semibold text-foreground tracking-tight">
          Application defaults & preferences
        </h2>
        <p className="text-small text-muted-foreground mt-1">
          Configure default values pre-filled when saving jobs and adjust notification behavior.
        </p>
      </div>

      {statusMessage && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 p-3 rounded-lg text-small ${
            statusMessage.type === 'success'
              ? 'bg-success-tint text-success border border-success/20'
              : 'bg-destructive-tint text-destructive border border-destructive/20'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Theme Selection */}
      <div className="flex flex-col gap-3">
        <label className="text-small font-medium text-foreground">
          Interface appearance
        </label>
        <div className="grid grid-cols-2 gap-4 max-w-[420px]">
          <button
            type="button"
            onClick={() => handleThemeChange('light')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all',
              theme === 'light'
                ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                : 'border-border bg-card text-muted-foreground hover:border-input'
            )}
          >
            <Sun size={22} className={cn(theme === 'light' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <div className="text-small font-medium">Paper (Light)</div>
              <div className="text-caption text-muted-foreground">High contrast daytime mode</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange('dark')}
            className={cn(
              'flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all',
              theme === 'dark'
                ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                : 'border-border bg-card text-muted-foreground hover:border-input'
            )}
          >
            <Moon size={22} className={cn(theme === 'dark' ? 'text-primary' : 'text-muted-foreground')} />
            <div>
              <div className="text-small font-medium">Night Pine (Dark)</div>
              <div className="text-caption text-muted-foreground">Subtle deep pine tones</div>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Default Currency */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="defaultCurrency" className="text-small font-medium text-foreground">
            Default salary currency
          </label>
          <Select<string>
            id="defaultCurrency"
            value={formData.defaultCurrency || 'PHP'}
            onChange={(val) => setFormData({ ...formData, defaultCurrency: val })}
            options={CURRENCY_OPTIONS}
            aria-label="Default salary currency"
          />
          <span className="text-caption text-muted-foreground">
            Automatically selected when creating a job or saving an application.
          </span>
        </div>

        {/* Default Work Setup */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="defaultWorkSetup" className="text-small font-medium text-foreground">
            Default work setup preference
          </label>
          <Select<string>
            id="defaultWorkSetup"
            value={formData.defaultWorkSetup || ''}
            onChange={(val) =>
              setFormData({
                ...formData,
                defaultWorkSetup: (val as WorkSetup) || null,
              })
            }
            options={WORK_SETUP_OPTIONS}
            aria-label="Default work setup preference"
          />
          <span className="text-caption text-muted-foreground">
            Pre-fills work setup in quick saves and manual applications.
          </span>
        </div>

        {/* Default Resume */}
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <label htmlFor="defaultResumeId" className="text-small font-medium text-foreground">
            Default resume version
          </label>
          <Select<string>
            id="defaultResumeId"
            value={formData.defaultResumeId || ''}
            onChange={(val) =>
              setFormData({
                ...formData,
                defaultResumeId: val || null,
              })
            }
            options={resumeOptions}
            placeholder="None (choose manually per application)"
            aria-label="Default resume version"
          />
          <span className="text-caption text-muted-foreground">
            Linked automatically to newly created job applications.
          </span>
        </div>
      </div>

      {/* Notifications Band */}
      <div className="border-t border-border pt-6 flex flex-col gap-4">
        <div>
          <h3 className="text-subheading font-sans font-semibold text-foreground">
            Reminders and alerts
          </h3>
          <p className="text-small text-muted-foreground mt-0.5">
            Decide which notifications and timeline highlights are active.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Follow-up Alerts */}
          <label className="flex items-start gap-3 p-3 rounded-md border border-border bg-card cursor-pointer hover:border-input transition-colors">
            <input
              type="checkbox"
              checked={formData.followUpAlerts}
              onChange={(e) =>
                setFormData({ ...formData, followUpAlerts: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-input cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-body font-medium text-foreground">
                Follow-up due date alerts
              </span>
              <span className="text-caption text-muted-foreground">
                Show highlighter markers on the dashboard when a recruiter follow-up is due today or overdue.
              </span>
            </div>
          </label>

          {/* Interview Reminders */}
          <label className="flex items-start gap-3 p-3 rounded-md border border-border bg-card cursor-pointer hover:border-input transition-colors">
            <input
              type="checkbox"
              checked={formData.interviewReminders}
              onChange={(e) =>
                setFormData({ ...formData, interviewReminders: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-input cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-body font-medium text-foreground">
                Interview schedule reminders
              </span>
              <span className="text-caption text-muted-foreground">
                Prominently surface scheduled interviews in the &ldquo;Needs you today&rdquo; dashboard widget.
              </span>
            </div>
          </label>

          {/* Weekly Digest */}
          <label className="flex items-start gap-3 p-3 rounded-md border border-border bg-card cursor-pointer hover:border-input transition-colors">
            <input
              type="checkbox"
              checked={formData.weeklyDigest}
              onChange={(e) =>
                setFormData({ ...formData, weeklyDigest: e.target.checked })
              }
              className="mt-0.5 w-4 h-4 rounded text-primary focus:ring-primary border-input cursor-pointer"
            />
            <div className="flex flex-col">
              <span className="text-body font-medium text-foreground">
                Weekly velocity digest
              </span>
              <span className="text-caption text-muted-foreground">
                Include 8-week application velocity and funnel health summaries.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2 flex items-center justify-start">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium text-body hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>Save preferences</span>
          )}
        </button>
      </div>
    </form>
  );
}
