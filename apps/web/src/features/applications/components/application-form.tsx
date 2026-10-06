import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Link2,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { applicationApi } from '../api/application-api';
import { STATUS_CONFIG, StageRing } from './application-status-badge';
import { useApplicationStatuses } from '@/features/settings/hooks/use-application-statuses';
import { Select } from '@/components/ui/select';
import {
  ApplicationStatus,
  Priority,
  WorkSetup,
  EmploymentType,
  ApplicationDTO,
  WORK_SETUP_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
} from '@tracker/types';
import { CreateApplicationInput } from '@tracker/validation';

export interface ApplicationFormProps {
  initialStatus?: ApplicationStatus;
  initialCompanyName?: string;
  isModal?: boolean;
  onSubmit?: (data: CreateApplicationInput) => Promise<any>;
  onSuccess?: (app: ApplicationDTO) => void;
  onCancel?: () => void;
  submitButtonText?: string;
  onStatusChange?: (status: ApplicationStatus) => void;
  className?: string;
}

export function ApplicationForm({
  initialStatus = 'APPLIED',
  initialCompanyName = '',
  isModal = false,
  onSubmit,
  onSuccess,
  onCancel,
  submitButtonText,
  onStatusChange,
  className = '',
}: ApplicationFormProps) {
  const queryClient = useQueryClient();

  // Extraction State
  const [sourceUrl, setSourceUrl] = useState('');
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [showSnippetBox, setShowSnippetBox] = useState(false);
  const [snippetText, setSnippetText] = useState('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractNotice, setExtractNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Form Fields
  const { data: userStatuses } = useApplicationStatuses();
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>(initialStatus);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [workSetup, setWorkSetup] = useState<WorkSetup | ''>('REMOTE');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('FULL_TIME');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [currency, setCurrency] = useState('PHP');
  const [description, setDescription] = useState('');
  const [appliedAt, setAppliedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDueAt, setNextActionDueAt] = useState('');
  const [notes, setNotes] = useState('');

  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const snippetInputRef = useRef<HTMLTextAreaElement>(null);
  const lastExtractedSnippetRef = useRef<string>('');
  const lastExtractedUrlRef = useRef<string>('');

  // Initialize statusId once userStatuses load if not set
  useEffect(() => {
    if (userStatuses && userStatuses.length > 0 && !statusId) {
      const match = userStatuses.find(
        (s) => s.name === status || s.name.toUpperCase() === (status || '').toUpperCase()
      );
      if (match) {
        setStatusId(match.id);
      }
    }
  }, [userStatuses, status, statusId]);

  // Notify parent of status changes if requested
  const handleStatusChange = (newStatus: ApplicationStatus) => {
    setStatus(newStatus);
    const match = userStatuses?.find(
      (s) => s.name === newStatus || s.name.toUpperCase() === newStatus.toUpperCase()
    );
    if (match) setStatusId(match.id);
    onStatusChange?.(newStatus);
  };

  // Debounce URL auto-extraction if pasted/typed
  useEffect(() => {
    const trimmed = sourceUrl.trim();
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return;
    if (trimmed === lastExtractedUrlRef.current) return;

    const timer = setTimeout(() => {
      handleExtractFromUrl(trimmed);
    }, 500);

    return () => clearTimeout(timer);
  }, [sourceUrl]);

  // Debounce snippet text auto-extraction
  useEffect(() => {
    const trimmed = snippetText.trim();
    if (!trimmed || trimmed.length < 20) return;
    if (trimmed === lastExtractedSnippetRef.current) return;

    const timer = setTimeout(() => {
      handleExtractFromSnippet(trimmed);
    }, 400);

    return () => clearTimeout(timer);
  }, [snippetText]);

  const handleExtractFromUrl = async (urlToTest?: string) => {
    const targetUrl = (urlToTest || sourceUrl).trim();
    if (!targetUrl) {
      setExtractNotice({ type: 'info', message: 'Enter or paste a valid job link first.' });
      return;
    }
    if (targetUrl === lastExtractedUrlRef.current && !urlToTest) {
      return;
    }
    lastExtractedUrlRef.current = targetUrl;

    setIsExtractingUrl(true);
    setExtractNotice(null);
    setFormError(null);

    try {
      const meta = await applicationApi.parseJobUrl(targetUrl);
      if (meta) {
        if (meta.position) setPosition(meta.position);
        if (meta.companyName) setCompanyName(meta.companyName);
        if (meta.location) setLocation(meta.location);
        if (meta.workSetup) setWorkSetup(meta.workSetup);
        if (meta.employmentType) setEmploymentType(meta.employmentType);
        if (meta.salaryMin) setSalaryMin(String(meta.salaryMin));
        if (meta.salaryMax) setSalaryMax(String(meta.salaryMax));
        if (meta.currency) setCurrency(meta.currency);
        if (meta.description) setDescription(meta.description);
        if (meta.source && meta.source !== 'Other') setSource(meta.source);

        if (meta.isBotProtected) {
          setShowSnippetBox(true);
          setExtractNotice({
            type: 'warning',
            message: `🛡️ ${meta.botPlatform || 'This site'} protects postings with Cloudflare bot verification. Simply paste any text or snippet from the job page into the text box below to auto-fill immediately!`,
          });
          setTimeout(() => {
            snippetInputRef.current?.focus();
          }, 100);
        } else if (meta.extractedVia === 'json-ld' || meta.extractedVia === 'opengraph') {
          setExtractNotice({
            type: 'success',
            message: `✨ Auto-filled from ${meta.source || 'posting'}! Review the details below.`,
          });
        } else if (meta.companyName || meta.position) {
          setExtractNotice({
            type: 'success',
            message: `✨ Extracted role info from link! Review and customize below.`,
          });
        } else {
          setShowSnippetBox(true);
          setExtractNotice({
            type: 'warning',
            message: `Identified platform as ${meta.source || 'source'}, but the page content could not be read directly. Paste any text from the job page into the snippet box below to auto-fill instantly!`,
          });
        }
      }
    } catch (err: any) {
      setShowSnippetBox(true);
      setExtractNotice({
        type: 'warning',
        message: 'Could not auto-scrape this page directly. Paste any text snippet from the job page below to auto-fill!',
      });
    } finally {
      setIsExtractingUrl(false);
    }
  };

  const handleExtractFromSnippet = async (textOverride?: string) => {
    const targetText = (textOverride || snippetText).trim();
    if (!targetText) {
      setExtractNotice({ type: 'info', message: 'Paste some text from the job posting first.' });
      return;
    }
    if (targetText === lastExtractedSnippetRef.current && !textOverride) {
      return;
    }
    lastExtractedSnippetRef.current = targetText;

    setIsExtractingText(true);
    setExtractNotice(null);
    setFormError(null);

    try {
      const meta = await applicationApi.parseJobText(targetText, sourceUrl);
      if (meta) {
        if (meta.position) setPosition(meta.position);
        if (meta.companyName) setCompanyName(meta.companyName);
        if (meta.location) setLocation(meta.location);
        if (meta.workSetup) setWorkSetup(meta.workSetup);
        if (meta.employmentType) setEmploymentType(meta.employmentType);
        if (meta.salaryMin) setSalaryMin(String(meta.salaryMin));
        if (meta.salaryMax) setSalaryMax(String(meta.salaryMax));
        if (meta.currency) setCurrency(meta.currency);
        if (meta.description) setDescription(meta.description);
        if (meta.source && meta.source !== 'Other') setSource(meta.source);

        const filledCount = [
          meta.position,
          meta.companyName,
          meta.location,
          meta.salaryMin,
          meta.workSetup,
          meta.description,
        ].filter(Boolean).length;

        setExtractNotice({
          type: 'success',
          message: `✨ Auto-filled ${filledCount} fields from snippet! Cleaned job description extracted.`,
        });
      }
    } catch (err: any) {
      setExtractNotice({
        type: 'error',
        message: 'Could not parse text snippet. You can fill the fields manually below.',
      });
    } finally {
      setIsExtractingText(false);
    }
  };

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.startsWith('http://') || pasted.startsWith('https://')) {
      setSourceUrl(pasted);
      setTimeout(() => {
        handleExtractFromUrl(pasted);
      }, 30);
    }
  };

  const handleSnippetPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.length > 5) {
      setSnippetText(pasted);
      setTimeout(() => {
        handleExtractFromSnippet(pasted);
      }, 30);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim() || !position.trim()) {
      setFormError('Company name and position title are required.');
      return;
    }

    setIsSubmitting(true);

    const matchedStatus = userStatuses?.find(
      (s) => s.id === statusId || s.name === status || s.name.toUpperCase() === (status || '').toUpperCase()
    );
    const resolvedStatusId = matchedStatus?.id || statusId || undefined;
    const isSaved = (matchedStatus?.name || status).toUpperCase() === 'SAVED';

    const payload: CreateApplicationInput = {
      companyName: companyName.trim(),
      position: position.trim(),
      status,
      statusId: resolvedStatusId,
      priority,
      workSetup: workSetup || null,
      employmentType: employmentType || null,
      location: location.trim() || null,
      source: source.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
      salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
      currency: currency || 'PHP',
      description: description.trim() || null,
      appliedAt: !isSaved && appliedAt ? new Date(appliedAt).toISOString() : null,
      nextAction: !isSaved && nextAction.trim() ? nextAction.trim() : null,
      nextActionDueAt: !isSaved && nextActionDueAt ? new Date(nextActionDueAt).toISOString() : null,
      notes: notes.trim() || null,
    };

    try {
      let result: ApplicationDTO;
      if (onSubmit) {
        result = await onSubmit(payload);
      } else {
        result = await applicationApi.createApplication(payload);
        queryClient.invalidateQueries({ queryKey: ['applications'] });
        queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
      }

      onSuccess?.(result);
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSaved = status === 'SAVED';
  const defaultButtonLabel = isSaved ? 'Save opportunity' : 'Save application';

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-6 text-foreground ${className}`}>
      {formError && (
        <div className="p-3.5 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-small font-medium">
          {formError}
        </div>
      )}

      {/* Smart Auto-Fill Hero Box */}
      <div className="p-4 rounded-lg bg-secondary/50 border border-primary/20 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="job-url" className="text-small font-semibold text-foreground flex items-center gap-1.5">
            <Link2 size={15} className="text-primary" />
            <span>Job Posting URL</span>
          </label>
          {isExtractingUrl && (
            <span className="inline-flex items-center gap-1.5 text-primary animate-pulse text-caption font-medium">
              <Loader2 size={12} className="animate-spin" />
              <span>Auto-filling from link...</span>
            </span>
          )}
        </div>

        <div className="relative">
          <input
            ref={urlInputRef}
            id="job-url"
            type="url"
            placeholder="Paste link (LinkedIn, JobStreet, Greenhouse, Lever, Indeed...)"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            onPaste={handleUrlPaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleExtractFromUrl();
              }
            }}
            className="w-full bg-background border border-border rounded-md px-3 py-2 text-small text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
          />
        </div>

        {/* Notice Banner */}
        {!isExtractingUrl && extractNotice && (
          <div
            className={`flex items-start gap-2 text-small p-2.5 rounded border text-left leading-relaxed ${
              extractNotice.type === 'success'
                ? 'bg-primary/10 border-primary/20 text-primary'
                : extractNotice.type === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                  : extractNotice.type === 'error'
                    ? 'bg-destructive/10 border-destructive/20 text-destructive'
                    : 'bg-secondary border-border text-foreground'
            }`}
          >
            {extractNotice.type === 'success' ? (
              <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            ) : extractNotice.type === 'warning' ? (
              <ShieldAlert size={15} className="shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
            )}
            <div className="flex-1">{extractNotice.message}</div>
          </div>
        )}

        {/* Toggle / Quick Snippet Box */}
        <div className="pt-0.5">
          <button
            type="button"
            onClick={() => setShowSnippetBox(!showSnippetBox)}
            className="text-caption font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText size={12} />
            <span>
              {showSnippetBox ? 'Hide job text snippet parser' : 'Paste job text / description instead'}
            </span>
            {showSnippetBox ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {showSnippetBox && (
            <div className="mt-2 p-2.5 rounded bg-background border border-border space-y-2 animate-fade-in">
              <div className="flex items-center justify-between text-caption text-muted-foreground">
                <span className="font-medium text-foreground">Paste Job Snippet or Description:</span>
                {isExtractingText && (
                  <span className="inline-flex items-center gap-1 text-primary animate-pulse font-medium">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Auto-filling...</span>
                  </span>
                )}
              </div>
              <textarea
                ref={snippetInputRef}
                rows={3}
                placeholder="Paste full text or snippet from the job page here (auto-fills immediately)..."
                value={snippetText}
                onChange={(e) => setSnippetText(e.target.value)}
                onPaste={handleSnippetPaste}
                className="w-full bg-secondary/40 border border-border rounded px-2.5 py-1.5 text-small text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
              />
            </div>
          )}
        </div>
      </div>

      {/* Section 1: Role & Current Stage */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
          Role & Current Stage
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="form-company-name" className="block text-small font-medium text-foreground mb-1.5">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              id="form-company-name"
              type="text"
              required
              placeholder="e.g. Linear, Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
            />
          </div>

          <div>
            <label htmlFor="form-position-title" className="block text-small font-medium text-foreground mb-1.5">
              Position Title <span className="text-destructive">*</span>
            </label>
            <input
              id="form-position-title"
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label htmlFor="form-stage-status" className="block text-small font-medium text-foreground mb-1.5">
              Current Stage
            </label>
            <Select<ApplicationStatus>
              id="form-stage-status"
              value={status}
              onChange={handleStatusChange}
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

          <div>
            <label htmlFor="form-job-priority" className="block text-small font-medium text-foreground mb-1.5">
              Interest / Priority
            </label>
            <Select<Priority>
              id="form-job-priority"
              value={priority}
              onChange={setPriority}
              options={[
                { value: 'HIGH', label: 'High interest (3 bars)' },
                { value: 'MEDIUM', label: 'Medium interest (2 bars)' },
                { value: 'LOW', label: 'Low interest (1 bar)' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Section 2: Application Details (Shown only when status !== 'SAVED') */}
      {!isSaved && (
        <div className="space-y-4 animate-fade-in">
          <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
            Application Progress & Follow-up
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="form-applied-at" className="block text-small font-medium text-foreground mb-1.5">
                Date Applied
              </label>
              <input
                id="form-applied-at"
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="form-next-action" className="block text-small font-medium text-foreground mb-1.5">
                Next Action / Task
              </label>
              <input
                id="form-next-action"
                type="text"
                placeholder="e.g. Follow up with recruiter"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="form-action-due-date" className="block text-small font-medium text-foreground mb-1.5">
                Action Due Date
              </label>
              <input
                id="form-action-due-date"
                type="date"
                value={nextActionDueAt}
                onChange={(e) => setNextActionDueAt(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Workplace & Compensation */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
          Workplace & Compensation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="form-platform-source" className="block text-small font-medium text-foreground mb-1.5">
              Found On / Platform
            </label>
            <input
              id="form-platform-source"
              type="text"
              placeholder="e.g. LinkedIn, JobStreet, Indeed"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div>
            <label htmlFor="form-work-setup" className="block text-small font-medium text-foreground mb-1.5">
              Work Setup
            </label>
            <Select<WorkSetup | ''>
              id="form-work-setup"
              value={workSetup}
              onChange={setWorkSetup}
              placeholder="Not specified"
              options={WORK_SETUP_OPTIONS}
            />
          </div>

          <div>
            <label htmlFor="form-employment-type" className="block text-small font-medium text-foreground mb-1.5">
              Employment Type
            </label>
            <Select<EmploymentType | ''>
              id="form-employment-type"
              value={employmentType}
              onChange={setEmploymentType}
              placeholder="Not specified"
              options={EMPLOYMENT_TYPE_OPTIONS}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="form-location" className="block text-small font-medium text-foreground mb-1.5">
              Location
            </label>
            <input
              id="form-location"
              type="text"
              placeholder="e.g. Taguig, BGC, Makati, Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div>
            <label htmlFor="form-salary-currency" className="block text-small font-medium text-foreground mb-1.5">
              Currency
            </label>
            <Select<string>
              id="form-salary-currency"
              value={currency}
              onChange={setCurrency}
              options={[
                { value: 'PHP', label: 'PHP (₱)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'SGD', label: 'SGD (S$)' },
                { value: 'CAD', label: 'CAD ($)' },
                { value: 'AUD', label: 'AUD (A$)' },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="form-salary-min" className="block text-small font-medium text-foreground mb-1.5">
                Min
              </label>
              <input
                id="form-salary-min"
                type="number"
                min="0"
                step="1000"
                placeholder="50000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full h-9 px-2 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary font-mono"
              />
            </div>
            <div>
              <label htmlFor="form-salary-max" className="block text-small font-medium text-foreground mb-1.5">
                Max
              </label>
              <input
                id="form-salary-max"
                type="number"
                min="0"
                step="1000"
                placeholder="80000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full h-9 px-2 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Description & Notes */}
      <div className="space-y-4">
        <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
          Description & Notes
        </h2>

        <div>
          <label htmlFor="form-description" className="block text-small font-medium text-foreground mb-1.5">
            Job Description / Role Snippet <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="form-description"
            rows={3}
            placeholder="Clean JD auto-extracted from snippet or URL..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 rounded-md bg-background border border-input text-small text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-primary font-sans resize-y"
          />
        </div>

        <div>
          <label htmlFor="form-notes" className="block text-small font-medium text-foreground mb-1.5">
            Personal Notes & Context <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            id="form-notes"
            rows={2}
            placeholder="Add key highlights, referral names, interview impressions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 rounded-md bg-background border border-input text-small text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-primary font-sans resize-y"
          />
        </div>
      </div>

      {/* Section 5: Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-small font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Check size={16} strokeWidth={2} />
              <span>{submitButtonText || defaultButtonLabel}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
