import React, { useState, useEffect, useRef } from 'react';
import { CreateApplicationInput } from '@tracker/validation';
import { applicationApi } from '@/features/applications/api/application-api';
import {
  X,
  Bookmark,
  Link2,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

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
  const [currency, setCurrency] = useState('USD');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');

  // Auto-fill state
  const [isExtractingUrl, setIsExtractingUrl] = useState(false);
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [showSnippetBox, setShowSnippetBox] = useState(false);
  const [snippetText, setSnippetText] = useState('');
  const [extractNotice, setExtractNotice] = useState<{
    type: 'success' | 'warning' | 'info' | 'error';
    message: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlInputRef = useRef<HTMLInputElement>(null);
  const snippetInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
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
      setCurrency('USD');
      setPriority('MEDIUM');
      setNotes('');
      setDescription('');
      setShowSnippetBox(false);
      setSnippetText('');
      setExtractNotice(null);
      setError(null);
      setIsExtractingUrl(false);
      setIsExtractingText(false);
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

    setIsExtractingUrl(true);
    setExtractNotice(null);
    setError(null);

    try {
      const meta = await applicationApi.parseJobUrl(targetUrl);

      if (meta) {
        if (meta.source) setSource(meta.source);
        if (meta.companyName) setCompanyName(meta.companyName);
        if (meta.position) setPosition(meta.position);
        if (meta.location) setLocation(meta.location);
        if (meta.workSetup) setWorkSetup(meta.workSetup);
        if (meta.salaryMin) setSalaryMin(String(meta.salaryMin));
        if (meta.salaryMax) setSalaryMax(String(meta.salaryMax));
        if (meta.currency) setCurrency(meta.currency);
        if (meta.description) setDescription(meta.description);

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
          // If no fields could be scraped, suggest pasting text snippet
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

    setIsExtractingText(true);
    setExtractNotice(null);
    setError(null);

    try {
      const meta = await applicationApi.parseJobText(targetText, sourceUrl);
      if (meta) {
        if (meta.position) setPosition(meta.position);
        if (meta.companyName) setCompanyName(meta.companyName);
        if (meta.location) setLocation(meta.location);
        if (meta.workSetup) setWorkSetup(meta.workSetup);
        if (meta.salaryMin) setSalaryMin(String(meta.salaryMin));
        if (meta.salaryMax) setSalaryMax(String(meta.salaryMax));
        if (meta.currency) setCurrency(meta.currency);
        if (meta.description && !description) setDescription(meta.description);
        if (meta.source && meta.source !== 'Other') setSource(meta.source);

        const filledCount = [
          meta.position,
          meta.companyName,
          meta.location,
          meta.salaryMin,
          meta.workSetup,
        ].filter(Boolean).length;

        setExtractNotice({
          type: 'success',
          message: `✨ Auto-filled ${filledCount} fields from snippet! Review details below.`,
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
        currency: currency || 'USD',
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
                Paste link or job text snippet to auto-fill details
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
          <div className="p-3.5 rounded-lg bg-secondary/50 border border-primary/20 space-y-2.5">
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
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-mono text-small"
                />
              </div>
              <button
                type="button"
                onClick={() => handleExtractFromUrl()}
                disabled={isExtractingUrl || !sourceUrl.trim()}
                title="Fetch and auto-fill role details"
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-md text-small font-medium transition-colors disabled:opacity-50"
              >
                {isExtractingUrl ? (
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
            {isExtractingUrl && (
              <div className="flex items-center gap-2 text-small text-primary animate-pulse pt-0.5">
                <Loader2 size={13} className="animate-spin" />
                <span>Extracting company, title, salary & location from link...</span>
              </div>
            )}

            {/* Smart Notice Banner */}
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

            {/* Toggle / Quick Snippet Box for Cloudflare/Protected Sites */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowSnippetBox(!showSnippetBox)}
                className="text-caption font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
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
                    <span>Auto-extracts role, company, salary & location</span>
                  </div>
                  <textarea
                    ref={snippetInputRef}
                    rows={3}
                    placeholder="Copy and paste text from the job page here (e.g. title, company name, salary range, location)..."
                    value={snippetText}
                    onChange={(e) => setSnippetText(e.target.value)}
                    onPaste={handleSnippetPaste}
                    className="w-full bg-secondary/40 border border-border rounded px-2.5 py-1.5 text-small text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary font-sans resize-y"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleExtractFromSnippet()}
                      disabled={isExtractingText || !snippetText.trim()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border rounded text-caption font-medium transition-colors disabled:opacity-50"
                    >
                      {isExtractingText ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          <span>Parsing text...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={12} className="text-primary" />
                          <span>Auto-fill from snippet</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
                placeholder="e.g. Linear, Globe Telecom, Accenture"
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
                placeholder="e.g. Senior Software Engineer"
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
                placeholder="JobStreet, LinkedIn, Indeed, Referral"
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
                placeholder="e.g. Taguig, BGC, Makati, Manila, Remote"
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

          {/* Salary Min / Max & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="salary-currency" className="block text-small font-medium text-foreground mb-1">
                Currency
              </label>
              <select
                id="salary-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="PHP">PHP (₱)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="SGD">SGD (S$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>
            <div>
              <label htmlFor="salary-min" className="block text-small font-medium text-foreground mb-1">
                Salary Min
              </label>
              <input
                id="salary-min"
                type="number"
                placeholder="50000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="salary-max" className="block text-small font-medium text-foreground mb-1">
                Salary Max
              </label>
              <input
                id="salary-max"
                type="number"
                placeholder="80000"
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
              placeholder="e.g. Good stack alignment, flexible hybrid policy"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Paste Job Description */}
          <div>
            <label htmlFor="save-description" className="block text-small font-medium text-foreground mb-1">
              Job Description / Role Snippet <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="save-description"
              rows={3}
              placeholder="Paste raw JD or summary here to preserve it..."
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
