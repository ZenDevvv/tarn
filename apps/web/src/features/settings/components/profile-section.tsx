import React, { useState } from 'react';
import { UserSettingsDTO, UpdateProfileInput } from '@tracker/types';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Select } from '@/components/ui/select';

interface ProfileSectionProps {
  settings: UserSettingsDTO;
  onSave: (data: UpdateProfileInput) => Promise<void>;
  isSaving: boolean;
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Manila',
  'Australia/Sydney',
];

const TIMEZONE_OPTIONS = COMMON_TIMEZONES.map((tz) => ({
  value: tz,
  label: tz,
}));

export function ProfileSection({ settings, onSave, isSaving }: ProfileSectionProps) {
  const [formData, setFormData] = useState<UpdateProfileInput>({
    name: settings.name || '',
    headline: settings.headline || '',
    location: settings.location || '',
    timezone: settings.timezone || 'UTC',
    phone: settings.phone || '',
    website: settings.website || '',
    linkedinUrl: settings.linkedinUrl || '',
    bio: settings.bio || '',
  });

  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        headline: formData.headline?.trim() || null,
        location: formData.location?.trim() || null,
        phone: formData.phone?.trim() || null,
        website: formData.website?.trim() || null,
        linkedinUrl: formData.linkedinUrl?.trim() || null,
        bio: formData.bio?.trim() || null,
      });
      setStatusMessage({ type: 'success', text: 'Profile updated successfully.' });
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not update profile. Try again.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8 max-w-[680px]">
      <div>
        <h2 className="text-heading font-display font-semibold text-foreground tracking-tight">
          Personal profile
        </h2>
        <p className="text-small text-muted-foreground mt-1">
          Manage your personal details, contact information, and public links.
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

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-small font-medium text-foreground">
            Full name (required)
          </label>
          <input
            id="name"
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Mikaela Torres"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Headline */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="headline" className="text-small font-medium text-foreground">
            Target role or headline
          </label>
          <input
            id="headline"
            type="text"
            value={formData.headline || ''}
            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
            placeholder="e.g. Staff Frontend Engineer"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Email Address (Readonly) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="email" className="text-small font-medium text-foreground">
              Email address
            </label>
            <span className="text-caption text-muted-foreground bg-secondary px-2 py-0.5 rounded-xs">
              Primary account
            </span>
          </div>
          <input
            id="email"
            type="email"
            disabled
            value={settings.email}
            className="h-9 px-3 rounded-md border border-border bg-secondary/50 text-body text-muted-foreground cursor-not-allowed select-none"
          />
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="location" className="text-small font-medium text-foreground">
            Primary location
          </label>
          <input
            id="location"
            type="text"
            value={formData.location || ''}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g. San Francisco, CA"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Timezone */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="text-small font-medium text-foreground">
            Time zone
          </label>
          <Select
            id="timezone"
            value={formData.timezone || 'UTC'}
            onChange={(val) => setFormData({ ...formData, timezone: val })}
            options={TIMEZONE_OPTIONS}
            aria-label="Time zone"
          />
          <span className="text-caption text-muted-foreground">
            Used for interview schedule calculations and follow-up deadlines.
          </span>
        </div>

        {/* Phone Number */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-small font-medium text-foreground">
            Phone number
          </label>
          <input
            id="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="e.g. +1 (555) 234-5678"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Website / Portfolio */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="website" className="text-small font-medium text-foreground">
            Portfolio / personal site
          </label>
          <input
            id="website"
            type="url"
            value={formData.website || ''}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://yourportfolio.dev"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* LinkedIn Profile */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="linkedinUrl" className="text-small font-medium text-foreground">
            LinkedIn URL
          </label>
          <input
            id="linkedinUrl"
            type="url"
            value={formData.linkedinUrl || ''}
            onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
            placeholder="https://linkedin.com/in/username"
            className="h-9 px-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Bio / Summary */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="bio" className="text-small font-medium text-foreground">
            Professional bio & summary
          </label>
          <span className="text-caption text-muted-foreground">
            {(formData.bio || '').length}/1000 characters
          </span>
        </div>
        <textarea
          id="bio"
          rows={4}
          maxLength={1000}
          value={formData.bio || ''}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          placeholder="Brief summary of your background, core strengths, and what you look for in your next role..."
          className="p-3 rounded-md border border-input bg-card text-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
        />
        <span className="text-caption text-muted-foreground">
          Quick reference when submitting cold applications or recruiter questionnaires.
        </span>
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
            <span>Save profile</span>
          )}
        </button>
      </div>
    </form>
  );
}
