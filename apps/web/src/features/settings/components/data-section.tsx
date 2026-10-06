import React, { useState } from 'react';
import { UserSettingsDTO } from '@tracker/types';
import { Download, Loader2, Database, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface DataSectionProps {
  settings: UserSettingsDTO;
  onExport: () => Promise<void>;
}

export function DataSection({ settings, onExport }: DataSectionProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(false);

    try {
      await onExport();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err: any) {
      setExportError(err?.message || 'Could not export data. Try again later.');
    } finally {
      setIsExporting(false);
    }
  };

  const memberSince = settings.createdAt
    ? new Date(settings.createdAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Recently';

  return (
    <div className="flex flex-col gap-8 w-full">
      <div>
        <h2 className="text-heading font-display font-semibold text-foreground tracking-tight">
          Data management & portability
        </h2>
        <p className="text-small text-muted-foreground mt-1">
          Review your account footprint and export your entire job search archive for complete data ownership.
        </p>
      </div>

      {exportSuccess && (
        <div
          role="status"
          className="flex items-center gap-2.5 p-3 rounded-lg text-small bg-success-tint text-success border border-success/20"
        >
          <CheckCircle2 size={16} />
          <span>Your job tracker archive has been downloaded successfully.</span>
        </div>
      )}

      {exportError && (
        <div
          role="alert"
          className="flex items-center gap-2.5 p-3 rounded-lg text-small bg-destructive-tint text-destructive border border-destructive/20"
        >
          <span>{exportError}</span>
        </div>
      )}

      {/* Account Footprint Strip */}
      <div className="flex flex-col gap-3">
        <h3 className="text-subheading font-sans font-semibold text-foreground">
          Account footprint
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Applications</div>
            <div className="text-title font-display font-semibold text-foreground mt-1">
              {settings.stats.totalApplications}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">
              {settings.stats.activeApplications} active
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Interviews</div>
            <div className="text-title font-display font-semibold text-foreground mt-1">
              {settings.stats.totalInterviews}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">Rounds logged</div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Companies</div>
            <div className="text-title font-display font-semibold text-foreground mt-1">
              {settings.stats.totalCompanies}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">In your registry</div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Contacts</div>
            <div className="text-title font-display font-semibold text-foreground mt-1">
              {settings.stats.totalContacts}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">Recruiters & leads</div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Resumes</div>
            <div className="text-title font-display font-semibold text-foreground mt-1">
              {settings.stats.totalResumes}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">Tailored versions</div>
          </div>

          <div className="p-3.5 rounded-lg border border-border bg-card">
            <div className="text-caption text-muted-foreground">Member since</div>
            <div className="text-body font-sans font-medium text-foreground mt-2 truncate">
              {memberSince}
            </div>
            <div className="text-caption text-muted-foreground mt-0.5">Verified candidate</div>
          </div>
        </div>
      </div>

      {/* Export Archive Section */}
      <div className="border-t border-border pt-6 flex flex-col gap-4">
        <div>
          <h3 className="text-subheading font-sans font-semibold text-foreground">
            Export personal archive
          </h3>
          <p className="text-small text-muted-foreground mt-0.5">
            Download a single, complete JSON archive containing all your applications, interview notes, company records, recruiter contacts, follow-up timelines, and resume metadata.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium text-body hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Exporting archive...</span>
              </>
            ) : (
              <>
                <Download size={16} strokeWidth={1.5} />
                <span>Download JSON archive</span>
              </>
            )}
          </button>
        </div>
        <span className="text-caption text-muted-foreground">
          Exports are generated securely and downloaded directly to your local file system.
        </span>
      </div>

      {/* Privacy & Ownership Guarantee */}
      <div className="border-t border-border pt-6 flex flex-col gap-4">
        <div className="p-4 rounded-lg border border-border bg-secondary/20 flex items-start gap-3">
          <Database size={20} className="text-muted-foreground mt-0.5 shrink-0" />
          <div className="flex flex-col gap-1 text-small">
            <span className="font-medium text-foreground">Your data, completely sovereign</span>
            <span className="text-muted-foreground">
              This application has zero third-party advertising tracking or analytics trackers. All job applications, company contacts, and interview notes remain strictly tenant-isolated to your personal account.
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t border-border pt-6 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-destructive">
          <ShieldAlert size={18} />
          <h3 className="text-subheading font-sans font-semibold">Danger zone</h3>
        </div>
        <p className="text-small text-muted-foreground">
          Need to delete or reset your account? Contact your database administrator or run hard delete in your local environment. All cascaded applications, timeline events, and uploaded documents are permanently erased on account deletion.
        </p>
      </div>
    </div>
  );
}
