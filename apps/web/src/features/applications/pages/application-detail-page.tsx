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
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  FileText,
} from 'lucide-react';
import { applicationApi } from '../api/application-api';
import { StageRing, STATUS_CONFIG } from '../components/application-status-badge';
import { useApplicationStatuses } from '@/features/settings/hooks/use-application-statuses';
import { PriorityGlyph } from '../components/priority-glyph';
import { Select } from '@/components/ui/select';
import { ApplicationTimeline } from '../components/application-timeline';
import { ApplicationInterviewsTab } from '../components/application-interviews-tab';
import { FollowUpItem } from '@/features/follow-ups/components/follow-up-item';
import { apiClient } from '@/lib/api-client';
import { ApplicationStatus, formatEmploymentType, formatWorkSetup, CoverLetterDTO } from '@tracker/types';

import {
  tailoringApi,
  TailoringScorecard,
  ApplicationDeliverables,
  TailoringStudioModal,
  DocumentPreviewModal,
} from '@/features/tailoring';
import { coverLetterApi } from '@/features/cover-letters/api/cover-letter-api';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  // Job Description Expand/Edit State
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescriptionText, setEditDescriptionText] = useState('');

  // Tailoring Studio & Preview Modals State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewModalTitle, setPreviewModalTitle] = useState('');
  const [previewHtmlUrl, setPreviewHtmlUrl] = useState<string | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewCoverLetter, setPreviewCoverLetter] = useState<CoverLetterDTO | null>(null);

  // Follow-up task state
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

  const { data: userStatuses } = useApplicationStatuses();

  // Fetch Tailoring Analysis
  const { data: analysis, isLoading: isAnalysisLoading } = useQuery({
    queryKey: ['tailoring-analysis', id],
    queryFn: () => tailoringApi.getAnalysis(id!),
    enabled: Boolean(id && application?.job?.description),
  });

  // Fetch Cover Letters for this Application
  const { data: coverLetters = [] } = useQuery({
    queryKey: ['cover-letters', id],
    queryFn: () => coverLetterApi.getForApplication(id!),
    enabled: Boolean(id),
  });

  const currentCoverLetter = coverLetters[0] || null;

  const statusMutation = useMutation({
    mutationFn: (newStatus: ApplicationStatus) => {
      const matched = userStatuses?.find(
        (s) => s.name === newStatus || s.id === newStatus || s.name.toUpperCase() === newStatus.toUpperCase()
      );
      return applicationApi.updateStatus(id!, matched ? matched.id : newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: (newDescription: string) =>
      applicationApi.updateApplication(id!, { description: newDescription }),
    onSuccess: () => {
      setIsEditingDescription(false);
      queryClient.invalidateQueries({ queryKey: ['application', id] });
      queryClient.invalidateQueries({ queryKey: ['tailoring-analysis', id] });
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

  const handleOpenResumePreview = () => {
    if (!application?.resume) return;
    setPreviewModalTitle(`Resume Preview: ${application.resume.name}`);
    setPreviewHtmlUrl(application.resume.isTailored ? tailoringApi.getResumeHtmlUrl(application.resume.id) : null);
    setPreviewFileUrl(application.resume.fileUrl ?? null);
    setPreviewCoverLetter(null);
    setPreviewModalOpen(true);
  };

  const handleOpenCoverLetterPreview = () => {
    if (!currentCoverLetter) return;
    setPreviewModalTitle(`Cover Letter: ${currentCoverLetter.name}`);
    setPreviewHtmlUrl(tailoringApi.getCoverLetterHtmlUrl(currentCoverLetter.id));
    setPreviewFileUrl(currentCoverLetter.fileUrl ?? null);
    setPreviewCoverLetter(currentCoverLetter);
    setPreviewModalOpen(true);
  };

  const handleStudioGenerated = () => {
    queryClient.invalidateQueries({ queryKey: ['application', id] });
    queryClient.invalidateQueries({ queryKey: ['tailoring-analysis', id] });
    queryClient.invalidateQueries({ queryKey: ['cover-letters', id] });
    queryClient.invalidateQueries({ queryKey: ['resumes-list-all'] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className="p-8 border border-destructive/20 bg-destructive/5 rounded-lg text-center max-w-xl mx-auto my-12">
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
  const jobDesc = job?.description || '';

  return (
    <div className="w-full max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-8">
      {/* Top Header */}
      <div>
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground no-underline transition-colors mb-3"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to applications</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/80">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap text-caption text-muted-foreground">
              <span className="uppercase tracking-wider font-semibold text-foreground">
                {company?.name}
              </span>
              <span className="text-border">•</span>
              <PriorityGlyph priority={application.priority} />
              {application.appliedAt && (
                <>
                  <span className="text-border">•</span>
                  <span>
                    Applied {new Date(application.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </>
              )}
            </div>

            <h1 className="font-display font-bold text-3xl sm:text-4xl text-foreground tracking-tight">
              {job?.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Stage Selector Dropdown */}
            <div className="w-[190px]">
              <Select<ApplicationStatus>
                value={application.status}
                onChange={(val) => statusMutation.mutate(val)}
                disabled={statusMutation.isPending}
                aria-label="Change stage"
                options={
                  userStatuses && userStatuses.length > 0
                    ? userStatuses.map((s) => ({
                        value: s.name as ApplicationStatus,
                        label: s.name,
                        icon: (
                          <StageRing
                            status={s}
                            size={15}
                            totalStages={userStatuses.filter((x) => x.closeType === null).length}
                          />
                        ),
                      }))
                    : Object.entries(STATUS_CONFIG).map(([key, config]) => ({
                        value: key as ApplicationStatus,
                        label: config.label,
                        icon: <StageRing status={key as ApplicationStatus} size={15} />,
                      }))
                }
              />
            </div>

            {/* Archive / Delete Button */}
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              disabled={archiveMutation.isPending}
              className="p-2 rounded-lg border border-border bg-background hover:bg-secondary text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
              title="Archive application"
            >
              <Trash2 size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (Content) + Right Column (Scorecard & Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Details, Job Description, Deliverables, Interviews, Tasks, Notes */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          {/* Opportunity Details (Spec Matrix) */}
          <div className="space-y-4 pb-8 border-b border-border/70">
            <h3 className="font-display font-semibold text-subheading text-foreground">
              Opportunity Details
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-small">
              <div>
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Work Setup
                </span>
                <span className="font-medium text-foreground">{formatWorkSetup(job?.workSetup)}</span>
              </div>
              <div>
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Employment Type
                </span>
                <span className="font-medium text-foreground">{formatEmploymentType(job?.employmentType)}</span>
              </div>
              <div>
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Location
                </span>
                <span className="font-medium text-foreground">{job?.location || 'Not specified'}</span>
              </div>
              <div>
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Salary / Compensation
                </span>
                <span className="font-medium text-foreground">
                  {job?.salaryMin || job?.salaryMax
                    ? `${job.currency || '$'}${job?.salaryMin?.toLocaleString() || 0} - ${job?.salaryMax?.toLocaleString() || 'N/A'}`
                    : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Applied Date
                </span>
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
                <span className="block text-micro font-mono uppercase tracking-wider text-muted-foreground mb-1">
                  Platform / Source
                </span>
                <span className="font-medium text-foreground">{job?.source || 'Direct'}</span>
              </div>
            </div>

            {job?.sourceUrl && (
              <div className="pt-2 flex items-center justify-between text-caption text-muted-foreground">
                <span>Original Posting</span>
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

          {/* Job Description (Editorial block with inline expand & editor) */}
          <div className="space-y-3 pb-8 border-b border-border/70">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-primary" />
                <h3 className="font-display font-semibold text-subheading text-foreground">
                  Job Description
                </h3>
                {jobDesc && (
                  <span className="text-micro font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded border border-border">
                    {jobDesc.split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>

              {jobDesc && !isEditingDescription && (
                <button
                  type="button"
                  onClick={() => {
                    setEditDescriptionText(jobDesc);
                    setIsEditingDescription(true);
                  }}
                  className="inline-flex items-center gap-1 text-caption font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {isEditingDescription ? (
              <div className="space-y-3 pt-1">
                <textarea
                  rows={9}
                  value={editDescriptionText}
                  onChange={(e) => setEditDescriptionText(e.target.value)}
                  placeholder="Paste or edit the full job description here..."
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-small focus:outline-none focus:ring-1 focus:ring-primary font-sans leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingDescription(false)}
                    className="px-3 py-1.5 text-small text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={updateDescriptionMutation.isPending}
                    onClick={() => updateDescriptionMutation.mutate(editDescriptionText)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updateDescriptionMutation.isPending ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Save size={13} />
                    )}
                    <span>Save Description</span>
                  </button>
                </div>
              </div>
            ) : jobDesc ? (
              <div>
                <div
                  className={`text-small text-foreground/90 leading-relaxed whitespace-pre-wrap transition-all overflow-hidden ${
                    isDescriptionExpanded ? 'max-h-none' : 'max-h-36 mask-linear-fade'
                  }`}
                >
                  {jobDesc}
                </div>
                {jobDesc.length > 250 && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2.5 inline-flex items-center gap-1 text-caption text-primary hover:underline font-medium cursor-pointer"
                  >
                    <span>{isDescriptionExpanded ? 'Show less' : 'Read full description'}</span>
                    {isDescriptionExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                )}
              </div>
            ) : (
              <div className="py-6 text-center border border-dashed border-border/80 rounded-lg space-y-2 bg-secondary/10">
                <p className="text-small text-muted-foreground">
                  No job description added yet. Adding the job description unlocks automated keyword matching and bullet tailoring.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditDescriptionText('');
                    setIsEditingDescription(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 border border-border text-foreground text-small font-medium transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Paste Job Description</span>
                </button>
              </div>
            )}
          </div>

          {/* Application Deliverables */}
          <ApplicationDeliverables
            resume={application.resume}
            coverLetter={currentCoverLetter}
            onPreviewResume={handleOpenResumePreview}
            onPreviewCoverLetter={handleOpenCoverLetterPreview}
            onOpenStudio={() => setIsStudioOpen(true)}
            className="pb-8 border-b border-border/70"
          />

          {/* Interview Rounds Tracker */}
          <ApplicationInterviewsTab
            applicationId={application.id}
            companyName={company?.name || ''}
            jobTitle={job?.title || ''}
            className="pb-8 border-b border-border/70"
          />

          {/* Follow-up Tasks */}
          <div className="space-y-4 pb-8 border-b border-border/70">
            <div className="flex items-center justify-between pb-2 border-b border-border/70">
              <div>
                <h3 className="font-display font-semibold text-subheading text-foreground">
                  Action Items & Follow-ups
                </h3>
                <p className="text-caption text-muted-foreground mt-0.5">
                  Pending tasks and recruiter follow-ups for this application.
                </p>
              </div>
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
                className="flex flex-col gap-2.5 p-3.5 bg-secondary/40 rounded-lg border border-border"
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
                      className="px-2.5 py-1 text-small text-muted-foreground hover:text-foreground cursor-pointer"
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
                <p className="text-small text-muted-foreground py-2 italic">
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

          {/* Notes */}
          {application.notes && (
            <div className="space-y-2 pb-8">
              <h3 className="font-display font-semibold text-subheading text-foreground">
                Notes
              </h3>
              <p className="text-small text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {application.notes}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Role Alignment Scorecard (Top) + Activity Timeline (Below) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 self-start space-y-8">
          {/* Role Alignment Scorecard */}
          <TailoringScorecard
            analysis={analysis}
            isLoading={isAnalysisLoading}
            hasJobDescription={Boolean(jobDesc.trim())}
            isTailored={Boolean(application.resume?.isTailored || currentCoverLetter)}
            onOpenStudio={() => setIsStudioOpen(true)}
          />

          {/* Activity Timeline */}
          <ApplicationTimeline
            applicationId={application.id}
            events={timelineEvents}
          />
        </div>
      </div>

      {/* Tailoring Studio Modal */}
      <TailoringStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        applicationId={application.id}
        analysis={analysis}
        jobDescription={jobDesc}
        roleTitle={job?.title}
        companyName={company?.name}
        onGenerated={handleStudioGenerated}
      />

      {/* Document Preview & Edit Modal */}
      <DocumentPreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        title={previewModalTitle}
        previewHtmlUrl={previewHtmlUrl}
        fileUrl={previewFileUrl}
        coverLetter={previewCoverLetter}
        onCoverLetterUpdated={(updated) => {
          setPreviewCoverLetter(updated);
          queryClient.invalidateQueries({ queryKey: ['cover-letters', id] });
        }}
      />

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
