import React, { useState, useEffect, useRef } from 'react';
import { X, Building2, Globe, MapPin, Tag, FileText, Loader2 } from 'lucide-react';
import { CompanyWithDetailsDTO } from '@tracker/types';
import { CreateCompanyInput } from '@tracker/validation';

export interface CompanyFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyInput) => Promise<any>;
  company?: CompanyWithDetailsDTO | null; // If provided, edit mode
}

export function CompanyFormModal({
  isOpen,
  onClose,
  onSubmit,
  company,
}: CompanyFormModalProps) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFocusRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(company);

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setName(company.name || '');
        setWebsite(company.website || '');
        setIndustry(company.industry || '');
        setLocation(company.location || '');
        setDescription(company.description || '');
      } else {
        setName('');
        setWebsite('');
        setIndustry('');
        setLocation('');
        setDescription('');
      }
      setError(null);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, company]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required');
      return;
    }

    // Format website URL if missing protocol
    let formattedWebsite = website.trim();
    if (formattedWebsite && !/^https?:\/\//i.test(formattedWebsite)) {
      formattedWebsite = `https://${formattedWebsite}`;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        website: formattedWebsite || undefined,
        industry: industry.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save company details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Building2 size={18} className="text-primary" />
            <h2 id="company-form-title" className="font-display font-semibold text-subheading text-foreground">
              {isEdit ? 'Edit Company' : 'Add New Company'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-small">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-name" className="text-small font-medium text-foreground">
              Company Name <span className="text-destructive">*</span>
            </label>
            <input
              id="company-name"
              ref={initialFocusRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp, Figma, Linear"
              className="h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Website */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-website" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <Globe size={14} className="text-muted-foreground" />
              Website
            </label>
            <input
              id="company-website"
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="e.g. https://acme.com or acme.com"
              className="h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Industry & Location Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="company-industry" className="text-small font-medium text-foreground flex items-center gap-1.5">
                <Tag size={14} className="text-muted-foreground" />
                Industry
              </label>
              <input
                id="company-industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Fintech, SaaS, AI"
                className="h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="company-location" className="text-small font-medium text-foreground flex items-center gap-1.5">
                <MapPin size={14} className="text-muted-foreground" />
                Location
              </label>
              <input
                id="company-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Remote, Manila, SF"
                className="h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
          </div>

          {/* Notes / Description */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="company-description" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <FileText size={14} className="text-muted-foreground" />
              Notes & Description
            </label>
            <textarea
              id="company-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key insights, culture notes, referral contacts, or why you want to work here..."
              className="p-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 rounded-md border border-border text-foreground hover:bg-secondary text-small font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-small font-medium transition-colors cursor-pointer"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Company'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
