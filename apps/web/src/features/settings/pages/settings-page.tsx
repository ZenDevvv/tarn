import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { settingsApi } from '../api/settings-api';
import { SettingsNav, SettingsTab } from '../components/settings-nav';
import { ProfileSection } from '../components/profile-section';
import { PreferencesSection } from '../components/preferences-section';
import { SecuritySection } from '../components/security-section';
import { DataSection } from '../components/data-section';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  UpdateProfileInput,
  UpdatePreferencesInput,
  ChangePasswordInput,
} from '@tracker/types';
import { AlertCircle, RefreshCw } from 'lucide-react';

const VALID_TABS: readonly SettingsTab[] = ['profile', 'preferences', 'security', 'data'];

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const activeTab: SettingsTab = rawTab && (VALID_TABS as readonly string[]).includes(rawTab)
    ? (rawTab as SettingsTab)
    : 'profile';

  const handleTabChange = (tab: SettingsTab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  };

  const queryClient = useQueryClient();
  const { updateCurrentUser } = useAuth();

  const {
    data: settings,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const profileMutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => settingsApi.updateProfile(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
      updateCurrentUser({
        id: updated.id,
        email: updated.email,
        name: updated.name,
        createdAt: updated.createdAt,
      });
    },
  });

  const preferencesMutation = useMutation({
    mutationFn: (data: UpdatePreferencesInput) =>
      settingsApi.updatePreferences(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['settings'], updated);
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: ChangePasswordInput) =>
      settingsApi.changePassword(data),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-[800px] animate-pulse">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-44 bg-muted rounded-md" />
          <div className="h-4 w-72 bg-muted rounded-md" />
        </div>
        <div className="h-10 w-full bg-muted rounded-md" />
        <div className="h-96 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-border rounded-xl bg-card gap-4">
        <AlertCircle size={32} className="text-destructive" />
        <div>
          <h2 className="text-heading font-display font-semibold text-foreground">
            Could not load settings
          </h2>
          <p className="text-small text-muted-foreground mt-1">
            There was an error communicating with the server. Please try again.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary text-foreground hover:bg-accent text-small font-medium transition-colors"
        >
          <RefreshCw size={15} />
          <span>Retry loading</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-[800px]">
      {/* Page Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-small text-muted-foreground mt-1">
          Manage your account profile, application defaults, security, and personal data.
        </p>
      </div>

      {/* Tabs Navigation */}
      <SettingsNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Tab Panel */}
      <div className="p-6 md:p-8 rounded-xl border border-border bg-card">
        {activeTab === 'profile' && (
          <ProfileSection
            settings={settings}
            onSave={async (data) => {
              await profileMutation.mutateAsync(data);
            }}
            isSaving={profileMutation.isPending}
          />
        )}

        {activeTab === 'preferences' && (
          <PreferencesSection
            settings={settings}
            onSave={async (data) => {
              await preferencesMutation.mutateAsync(data);
            }}
            isSaving={preferencesMutation.isPending}
          />
        )}

        {activeTab === 'security' && (
          <SecuritySection
            onSavePassword={async (data) => {
              await passwordMutation.mutateAsync(data);
            }}
            isSaving={passwordMutation.isPending}
          />
        )}

        {activeTab === 'data' && (
          <DataSection
            settings={settings}
            onExport={() => settingsApi.downloadExport()}
          />
        )}
      </div>
    </div>
  );
}
