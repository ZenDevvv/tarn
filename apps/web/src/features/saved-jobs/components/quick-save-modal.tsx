import React, { useState, useEffect, useRef } from 'react';
import { CreateApplicationInput } from '@tracker/validation';
import { applicationApi } from '@/features/applications/api/application-api';
import { X, Bookmark, Link2, Sparkles, Loader2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface QuickSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateApplicationInput) => Promise<void>;
}

export function QuickSaveModal({ isOpen, onClose, onSubmit }: QuickSaveModalProps) {
  const [sourceUrl, setSourceUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [location, setLocation] = useState('');
  const [workSetup, setWorkSetup] = useState<'REMOTE' | 'HYBRID' | 'ONSITE'>('REMOTE');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Auto-focus the URL input as the primary first action
      setTimeout(() => {
        urlInputRef.current?.focus();
      }, 50);
    } else {
      // Reset form states on close
      setSourceUrl('');
      setCompanyName('');
      setPosition('');
      setSource('LinkedIn');
      setLocation('');
      setWorkSetup('REMOTE');
      setSalaryMin('');
      setSalaryMax('');
      setPriority('MEDIUM');
      setNotes('');
      setDescription('');
      setExtractNotice(null);
      setError(null);
      setIsExtracting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleExtractFromUrl = async (urlOverride?: string) => {
    const targetUrl = (urlOverride || sourceUrl).trim();
    if (!targetUrl) {
      setExtractNotice({ type: 'info', message: 'Paste a link into the URL input first.' });
      return;
    }

    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      setExtractNotice({ type: 'error', message: 'Please provide a valid web URL starting with https://' });
      return;
    }

    setIsExtracting(true);
    setExtractNotice(null);
    setError(null);

    try {
      const meta = await applicationApi.parseJobUrl(targetUrl);

      if (meta) {
        if (meta.companyName) setCompanyName(meta.companyName);
        if (meta.position) setPosition(meta.position);
        if (meta.source) setSource(meta.source);
        if (meta.location) setLocation(meta.location);
        if (meta.workSetup) setWorkSetup(meta.workSetup);
        if (meta.salaryMin) setSalaryMin(String(meta.salaryMin));
        if (meta.salaryMax) setSalaryMax(String(meta.salaryMax));
        if (meta.description) setDescription(meta.description);

        const method = meta.extractedVia;
        if (method === 'json-ld' || method === 'opengraph') {
          setExtractNotice({
            type: 'success',
            message: `✨ Auto-filled from ${meta.source || 'posting'}! Review the details below.`,
          });
        } else if (meta.companyName || meta.source) {
          setExtractNotice({
            type: 'info',
            message: `Identified platform as ${meta.source || 'source'}. Review and confirm details below.`,
          });
        } else {
          setExtractNotice({
            type: 'info',
            message: 'Posting fetched. You can review and adjust any field below.',
          });
        }
      }
    } catch (err: any) {
      setExtractNotice({
        type: 'info',
        message: 'Could not auto-scrape this page directly. You can fill or edit the fields manually.',
      });
    } finally {
      setIsExtracting(false);
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

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExtractFromUrl();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        companyName: companyName.trim(),
        position: position.trim(),
        status: 'SAVED',
        source: source.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
        location: location.trim() || undefined,
        workSetup,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        currency: 'USD',
        priority,
        notes: notes.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save job opportunity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-primary" />
            <div>
              <h2 id="modal-title" className="font-display font-semibold text-subheading text-foreground">
                Save Job Opportunity
              </h2>
              <p className="text-caption text-muted-foreground">
                Paste a link to auto-fill details, or enter manually
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-small">
              {error}
            </div>
          )}

          {/* FIRST ACTION: Job Posting URL Hero Input */}
          <div className="p-3.5 rounded-lg bg-secondary/50 border border-primary/20 space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="job-url" className="text-small font-semibold text-foreground flex items-center gap-1.5">
                <Link2 size={15} className="text-primary" />
                <span>Job Posting URL</span>
              </label>
              <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">
                First Action • Auto-Fill
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  ref={urlInputRef}
                  id="job-url"
                  type="url"
                  placeholder="Paste link (LinkedIn, Greenhouse, Lever, Ashby, Indeed...)"
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  onPaste={handleUrlPaste}
                  onKeyDown={handleUrlKeyDown}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-small"
                />
              </div>
              <button
                type="button"
                onClick={() => handleExtractFromUrl()}
                disabled={isExtracting || !sourceUrl.trim()}
                title="Fetch and auto-fill role details"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md text-small font-medium transition-colors disabled:opacity-50"
              >
                {isExtracting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Auto-Fill</span>
                  </>
                )}
              </button>
            </div>

            {/* Parsing State & Feedback */}
            {isExtracting && (
              <div className="flex items-center gap-2 text-small text-primary animate-pulse pt-1">
                <Loader2 size={13} className="animate-spin" />
                <span>Extracting company, title, salary & location from posting...</span>
              </div>
            )}

            {!isExtracting && extractNotice && (
              <div
                className={`flex items-start gap-2 text-small p-2 rounded border text-left ${
                  extractNotice.type === 'success'
                    ? 'bg-primary/10 border-primary/20 text-primary'
                    : extractNotice.type === 'error'
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-secondary border-border text-foreground'
                }`}
              >
                {extractNotice.type === 'success' ? (
                  <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                )}
                <span>{extractNotice.message}</span>
              </div>
            )}
          </div>

          <div className="text-caption uppercase tracking-wider text-muted-foreground font-mono font-medium pt-1">
            Role & Compensation Details
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="company-name" className="block text-small font-medium text-foreground mb-1">
                Company Name *
              </label>
              <input
                id="company-name"
                type="text"
                required
                placeholder="e.g. Linear, Stripe"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label htmlFor="position-title" className="block text-small font-medium text-foreground mb-1">
                Position Title *
              </label>
              <input
                id="position-title"
                type="text"
                required
                placeholder="e.g. Staff Frontend Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Source & Work Setup */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="job-source" className="block text-small font-medium text-foreground mb-1">
                Platform / Source
              </label>
              <input
                id="job-source"
                type="text"
                placeholder="Greenhouse, LinkedIn, Lever"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="work-setup" className="block text-small font-medium text-foreground mb-1">
                Work Setup
              </label>
              <select
                id="work-setup"
                value={workSetup}
                onChange={(e) => setWorkSetup(e.target.value as any)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
                <option value="ONSITE">Onsite</option>
              </select>
            </div>
          </div>

          {/* Location & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="job-location" className="block text-small font-medium text-foreground mb-1">
                Location
              </label>
              <input
                id="job-location"
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="job-priority" className="block text-small font-medium text-foreground mb-1">
                Interest / Priority
              </label>
              <select
                id="job-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="HIGH">High interest (3 bars)</option>
                <option value="MEDIUM">Medium interest (2 bars)</option>
                <option value="LOW">Low interest (1 bar)</option>
              </select>
            </div>
          </div>

          {/* Salary Min / Max */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="salary-min" className="block text-small font-medium text-foreground mb-1">
                Salary Min ($)
              </label>
              <input
                id="salary-min"
                type="number"
                placeholder="140000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="salary-max" className="block text-small font-medium text-foreground mb-1">
                Salary Max ($)
              </label>
              <input
                id="salary-max"
                type="number"
                placeholder="185000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="save-notes" className="block text-small font-medium text-foreground mb-1">
              Personal Notes & Thoughts
            </label>
            <input
              id="save-notes"
              type="text"
              placeholder="e.g. Excellent fit for TypeScript skills, mutual connection at company"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Paste Job Description */}
          <div>
            <label htmlFor="save-description" className="block text-small font-medium text-foreground mb-1">
              Job Description / Role Snippet <span className="text-muted-foreground font-normal">(auto-filled or paste raw)</span>
            </label>
            <textarea
              id="save-description"
              rows={3}
              placeholder="Full role description extracted from link..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y font-sans text-small"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-border text-small font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
