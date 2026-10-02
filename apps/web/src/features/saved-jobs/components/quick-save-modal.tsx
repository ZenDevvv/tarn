import React, { useState, useEffect } from 'react';
import { CreateApplicationInput } from '@tracker/validation';
import { X, Bookmark } from 'lucide-react';

interface QuickSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateApplicationInput) => Promise<void>;
}

export function QuickSaveModal({ isOpen, onClose, onSubmit }: QuickSaveModalProps) {
  const [companyName, setCompanyName] = useState('');
  const [position, setPosition] = useState('');
  const [source, setSource] = useState('LinkedIn');
  const [sourceUrl, setSourceUrl] = useState('');
  const [location, setLocation] = useState('');
  const [workSetup, setWorkSetup] = useState<'REMOTE' | 'HYBRID' | 'ONSITE'>('REMOTE');
  const [salaryMin, setSalaryMin] = useState<string>('');
  const [salaryMax, setSalaryMax] = useState<string>('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <Bookmark size={18} className="text-primary" />
            <h2 id="modal-title" className="font-display font-semibold text-subheading text-foreground">
              Save Job Opportunity
            </h2>
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
                placeholder="e.g. Linear, Vercel"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
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
                placeholder="e.g. Senior Frontend Engineer"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Source & Job URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="job-source" className="block text-small font-medium text-foreground mb-1">
                Platform / Source
              </label>
              <input
                id="job-source"
                type="text"
                placeholder="LinkedIn, Indeed, Referral"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="job-url" className="block text-small font-medium text-foreground mb-1">
                Posting URL
              </label>
              <input
                id="job-url"
                type="url"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Work Setup, Location & Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                placeholder="70000"
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
              placeholder="e.g. Good match for design system skills, need to brush up on Zustand"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-body text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Paste Job Description */}
          <div>
            <label htmlFor="save-description" className="block text-small font-medium text-foreground mb-1">
              Pasted Job Description <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              id="save-description"
              rows={3}
              placeholder="Paste raw JD here to preserve it even if the posting expires..."
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
