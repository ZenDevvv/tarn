import { useState } from 'react';
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Trash2,
  Plus,
  Loader2,
} from 'lucide-react';
import { applicationApi } from '../api/application-api';
import { ApplicationStatusBadge, STATUS_CONFIG } from '../components/application-status-badge';
import { PriorityGlyph } from '../components/priority-glyph';
import { ApplicationTimeline } from '../components/application-timeline';
import { ApplicationInterviewsTab } from '../components/application-interviews-tab';
import { FollowUpItem } from '@/features/follow-ups/components/follow-up-item';
import { apiClient } from '@/lib/api-client';
import { ApplicationStatus } from '@tracker/types';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [followUpAction, setFollowUpAction] = useState('');
  const [followUpDueAt, setFollowUpDueAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });

  const { data: application, isLoading, isError, error } = useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationApi.getApplication(id!),
    enabled: Boolean(id),
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: ApplicationStatus) => applicationApi.updateStatus(id!, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: () => applicationApi.deleteApplication(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigate('/applications');
    },
  });

  const createFollowUpMutation = useMutation({
    mutationFn: (data: { action: string; dueAt: string }) =>
      apiClient.post('/follow-ups', {
        applicationId: id,
        action: data.action,
        dueAt: new Date(data.dueAt).toISOString(),
      }),
    onSuccess: () => {
      setFollowUpAction('');
      setIsAddingFollowUp(false);
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
    },
  });

  const handleCompleteFollowUp = async (followUpId: string) => {
    await apiClient.patch(`/follow-ups/${followUpId}/complete`);
    queryClient.invalidateQueries({ queryKey: ['application', id] });
    queryClient.invalidateQueries({ queryKey: ['follow-ups'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center">
        <p className="text-body font-medium text-destructive">Application not found</p>
        <p className="text-small text-muted-foreground mt-1">
          {error instanceof Error ? error.message : 'This application may have been archived.'}
        </p>
        <Link
          to="/applications"
          className="inline-block mt-4 text-small text-primary hover:underline font-medium"
        >
          Return to applications
        </Link>
      </div>
    );
  }

  const company = application.company;
  const job = application.job;
  const timelineEvents = (application as any).timelineEvents || [];
  const followUps = (application as any).followUps || [];

  return (
    <div className="flex flex-col gap-8 w-full max-w-[960px] mx-auto">
      {/* Top Bar */}
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground no-underline transition-colors mb-4"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to applications</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-caption uppercase tracking-wider text-muted-foreground font-medium">
                {company?.name}
              </span>
              <span className="text-border">•</span>
              <PriorityGlyph priority={application.priority} />
            </div>
            <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
              {job?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Stage Selector Dropdown */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-md px-3 py-1.5">
              <ApplicationStatusBadge status={application.status} />
              <select
                value={application.status}
                onChange={(e) => statusMutation.mutate(e.target.value as ApplicationStatus)}
                disabled={statusMutation.isPending}
                className="bg-transparent text-small font-medium text-foreground focus:outline-none cursor-pointer border-l border-border pl-2"
                aria-label="Change stage"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    Move to: {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Archive / Delete Button */}
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={archiveMutation.isPending}
              className="p-2 rounded-md border border-border bg-card text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              title="Archive application"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Facts, Notes & Follow-ups */}
        <div className="md:col-span-7 flex flex-col gap-6">
          {/* Details Card */}
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-display font-semibold text-subheading text-foreground mb-3 pb-2 border-b border-border">
              Opportunity Details
            </h3>

            <div className="grid grid-cols-2 gap-4 text-small">
              <div>
                <span className="block text-caption text-muted-foreground">Work Setup</span>
                <span className="font-medium text-foreground">{job?.workSetup || 'Not specified'}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Employment Type</span>
                <span className="font-medium text-foreground">{job?.employmentType || 'Full-time'}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Location</span>
                <span className="font-medium text-foreground">{job?.location || 'Not specified'}</span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Salary / Compensation</span>
                <span className="font-medium text-foreground">
                  {job?.salaryMin || job?.salaryMax
                    ? `${job.currency || '$'}${job?.salaryMin?.toLocaleString() || 0} - ${job?.salaryMax?.toLocaleString() || 'N/A'}`
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Applied Date</span>
                <span className="font-medium text-foreground">
                  {application.appliedAt
                    ? new Date(application.appliedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Not applied yet'}
                </span>
              </div>
              <div>
                <span className="block text-caption text-muted-foreground">Platform / Source</span>
                <span className="font-medium text-foreground">{job?.source || 'Direct'}</span>
              </div>
            </div>

            {job?.sourceUrl && (
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-caption text-muted-foreground">Original Posting</span>
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-small text-primary hover:underline font-medium"
                >
                  <span>View job link</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            )}
          </div>

          {/* Interview Rounds Tracker */}
          <ApplicationInterviewsTab
            applicationId={application.id}
            companyName={company?.name || ''}
            jobTitle={job?.title || ''}
          />

          {/* Follow-up Tasks */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <h3 className="font-display font-semibold text-subheading text-foreground">
                Action Items & Follow-ups
              </h3>
              {!isAddingFollowUp && (
                <button
                  type="button"
                  onClick={() => setIsAddingFollowUp(true)}
                  className="inline-flex items-center gap-1 text-small text-primary hover:text-primary-hover font-medium cursor-pointer"
                >
                  <Plus size={14} strokeWidth={2} />
                  <span>Add action</span>
                </button>
              )}
            </div>

            {isAddingFollowUp && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!followUpAction.trim()) return;
                  createFollowUpMutation.mutate({
                    action: followUpAction.trim(),
                    dueAt: followUpDueAt,
                  });
                }}
                className="flex flex-col gap-2.5 p-3 mb-3 bg-secondary/50 rounded-lg border border-border"
              >
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on technical review feedback"
                  value={followUpAction}
                  onChange={(e) => setFollowUpAction(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-md bg-background border border-input text-small text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary"
                  autoFocus
                />
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <Calendar size={13} />
                    <input
                      type="date"
                      value={followUpDueAt}
                      onChange={(e) => setFollowUpDueAt(e.target.value)}
                      className="h-7 px-2 rounded-md bg-background border border-input text-caption text-foreground focus-visible:outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingFollowUp(false)}
                      className="px-2 py-1 text-small text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!followUpAction.trim() || createFollowUpMutation.isPending}
                      className="px-3 py-1 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium disabled:opacity-50 cursor-pointer"
                    >
                      Save action
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {followUps.length === 0 ? (
                <p className="text-small text-muted-foreground py-2">
                  No pending follow-ups. Keep momentum going by scheduling one!
                </p>
              ) : (
                followUps.map((fu: any) => (
                  <FollowUpItem
                    key={fu.id}
                    followUp={fu}
                    onComplete={handleCompleteFollowUp}
                    showApplication={false}
                  />
                ))
              )}
            </div>
          </div>

          {/* Notes Card */}
          {application.notes && (
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="font-display font-semibold text-subheading text-foreground mb-2 pb-2 border-b border-border">
                Notes
              </h3>
              <p className="text-small text-foreground whitespace-pre-wrap leading-relaxed">
                {application.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="md:col-span-5">
          <div className="bg-card border border-border rounded-lg p-5">
            <ApplicationTimeline
              applicationId={application.id}
              events={timelineEvents}
            />
          </div>
        </div>
      </div>

      {/* Archive / Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isArchiveModalOpen}
        onClose={() => setIsArchiveModalOpen(false)}
        onConfirm={async () => {
          await archiveMutation.mutateAsync();
          setIsArchiveModalOpen(false);
        }}
        title="Archive application?"
        description="You can restore or review it anytime from the status filters."
        itemName={`${job?.title || 'Position'} at ${company?.name || 'Company'}`}
        variant="archive"
        confirmLabel="Archive"
        isPending={archiveMutation.isPending}
      />
    </div>
  );
}
