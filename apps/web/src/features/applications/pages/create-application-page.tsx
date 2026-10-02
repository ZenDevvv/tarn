import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Check } from 'lucide-react';
import { applicationApi } from '../api/application-api';
import { STATUS_CONFIG } from '../components/application-status-badge';
import { ApplicationStatus, Priority, WorkSetup, EmploymentType } from '@tracker/types';

export function CreateApplicationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<ApplicationStatus>('APPLIED');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [workSetup, setWorkSetup] = useState<WorkSetup | ''>('REMOTE');
  const [employmentType, setEmploymentType] = useState<EmploymentType | ''>('FULL_TIME');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [sourceUrl, setSourceUrl] = useState('');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [currency, setCurrency] = useState('USD');
  const [appliedAt, setAppliedAt] = useState(() => new Date().toISOString().split('T')[0]);
  const [nextAction, setNextAction] = useState('');
  const [nextActionDueAt, setNextActionDueAt] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: applicationApi.createApplication,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      if (res?.id) {
        navigate(`/applications/${res.id}`);
      } else {
        navigate('/applications');
      }
    },
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || err.message || 'Failed to create application');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!companyName.trim() || !position.trim()) {
      setFormError('Company name and position title are required.');
      return;
    }

    mutation.mutate({
      companyName: companyName.trim(),
      position: position.trim(),
      status,
      priority,
      workSetup: workSetup || null,
      employmentType: employmentType || null,
      location: location.trim() || null,
      source: source.trim() || null,
      sourceUrl: sourceUrl.trim() || null,
      salaryMin: salaryMin ? parseInt(salaryMin, 10) : null,
      salaryMax: salaryMax ? parseInt(salaryMax, 10) : null,
      currency,
      appliedAt: appliedAt ? new Date(appliedAt).toISOString() : null,
      nextAction: nextAction.trim() || null,
      nextActionDueAt: nextActionDueAt ? new Date(nextActionDueAt).toISOString() : null,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="max-w-[760px] mx-auto w-full">
      {/* Header with back link */}
      <div className="mb-6">
        <Link
          to="/applications"
          className="inline-flex items-center gap-1.5 text-small text-muted-foreground hover:text-foreground no-underline transition-colors mb-3"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          <span>Back to applications</span>
        </Link>
        <h1 className="font-display font-semibold text-display text-foreground tracking-tight">
          Add application
        </h1>
        <p className="text-small text-muted-foreground mt-1">
          Track a new job opportunity, interview stage, or prospective lead.
        </p>
      </div>

      {formError && (
        <div className="p-3.5 mb-6 rounded-md border border-destructive/30 bg-destructive/5 text-destructive text-small font-medium">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-8 bg-card border border-border rounded-lg p-6 sm:p-8">
        {/* Section 1: Core Details */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
            1. Role & Company
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-small font-medium text-foreground mb-1.5">
                Company Name <span className="text-destructive">*</span>
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Corp"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="position" className="block text-small font-medium text-foreground mb-1.5">
                Position Title <span className="text-destructive">*</span>
              </label>
              <input
                id="position"
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label htmlFor="status" className="block text-small font-medium text-foreground mb-1.5">
                Current Stage
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-small font-medium text-foreground mb-1.5">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <option value="HIGH">High (Top target)</option>
                <option value="MEDIUM">Medium (Good match)</option>
                <option value="LOW">Low (Casual pipeline)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Compensation & Setup */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
            2. Compensation & Workplace
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="workSetup" className="block text-small font-medium text-foreground mb-1.5">
                Work Setup
              </label>
              <select
                id="workSetup"
                value={workSetup}
                onChange={(e) => setWorkSetup(e.target.value as WorkSetup | '')}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <option value="">Not specified</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>

            <div>
              <label htmlFor="employmentType" className="block text-small font-medium text-foreground mb-1.5">
                Type
              </label>
              <select
                id="employmentType"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType | '')}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <option value="">Not specified</option>
                <option value="FULL_TIME">Full-time</option>
                <option value="PART_TIME">Part-time</option>
                <option value="CONTRACT">Contract</option>
                <option value="FREELANCE">Freelance</option>
                <option value="INTERNSHIP">Internship</option>
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-small font-medium text-foreground mb-1.5">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="salaryMin" className="block text-small font-medium text-foreground mb-1.5">
                Min Compensation
              </label>
              <input
                id="salaryMin"
                type="number"
                min="0"
                step="1000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="e.g. 120000"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="salaryMax" className="block text-small font-medium text-foreground mb-1.5">
                Max Compensation
              </label>
              <input
                id="salaryMax"
                type="number"
                min="0"
                step="1000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="currency" className="block text-small font-medium text-foreground mb-1.5">
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="PHP">PHP (₱)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Source & Next Action */}
        <div className="space-y-4">
          <h2 className="font-display font-semibold text-subheading text-foreground pb-2 border-b border-border">
            3. Source & Follow-up Action
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="source" className="block text-small font-medium text-foreground mb-1.5">
                Found On / Platform
              </label>
              <input
                id="source"
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. LinkedIn, Referral, Company site"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="appliedAt" className="block text-small font-medium text-foreground mb-1.5">
                Date Applied
              </label>
              <input
                id="appliedAt"
                type="date"
                value={appliedAt}
                onChange={(e) => setAppliedAt(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="sourceUrl" className="block text-small font-medium text-foreground mb-1.5">
              Posting or Job URL
            </label>
            <input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label htmlFor="nextAction" className="block text-small font-medium text-foreground mb-1.5">
                Next Action / Immediate Task
              </label>
              <input
                id="nextAction"
                type="text"
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="e.g. Follow up with hiring manager"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>

            <div>
              <label htmlFor="nextActionDueAt" className="block text-small font-medium text-foreground mb-1.5">
                Action Due Date
              </label>
              <input
                id="nextActionDueAt"
                type="date"
                value={nextActionDueAt}
                onChange={(e) => setNextActionDueAt(e.target.value)}
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-small text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-small font-medium text-foreground mb-1.5">
              Initial Notes & Context
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key highlights, referral names, interview impressions..."
              className="w-full p-3 rounded-md bg-background border border-input text-body text-foreground focus-visible:outline-2 focus-visible:outline-primary transition-colors resize-y"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            to="/applications"
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-border bg-card text-foreground hover:bg-secondary text-small font-medium no-underline transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="inline-flex items-center justify-center gap-2 h-9 px-5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2} />
                <span>Save application</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
