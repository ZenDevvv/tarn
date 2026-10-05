import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Mail, Phone, Linkedin, Building2, Briefcase, FileText, Loader2 } from 'lucide-react';
import { ContactWithDetailsDTO } from '@tracker/types';
import { CreateContactInput } from '@tracker/validation';
import { Select } from '@/components/ui/select';

export interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContactInput) => Promise<any>;
  contact?: ContactWithDetailsDTO | null; // If provided, edit mode
  companies: Array<{ id: string; name: string }>;
  applications: Array<{ id: string; position: string; companyName: string }>;
}

export function ContactFormModal({
  isOpen,
  onClose,
  onSubmit,
  contact,
  companies,
  applications,
}: ContactFormModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialFocusRef = useRef<HTMLInputElement>(null);
  const isEdit = Boolean(contact);

  useEffect(() => {
    if (isOpen) {
      if (contact) {
        setName(contact.name || '');
        setRole(contact.role || '');
        setEmail(contact.email || '');
        setPhone(contact.phone || '');
        setLinkedinUrl(contact.linkedinUrl || '');
        setCompanyId(contact.companyId || '');
        setApplicationId(contact.applicationId || '');
        setNotes(contact.notes || '');
      } else {
        setName('');
        setRole('');
        setEmail('');
        setPhone('');
        setLinkedinUrl('');
        setCompanyId('');
        setApplicationId('');
        setNotes('');
      }
      setError(null);
      setIsSubmitting(false);

      const timer = setTimeout(() => {
        initialFocusRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, contact]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Contact name is required');
      return;
    }

    // Format LinkedIn URL if missing protocol
    let formattedLinkedin = linkedinUrl.trim();
    if (formattedLinkedin && !/^https?:\/\//i.test(formattedLinkedin)) {
      formattedLinkedin = `https://${formattedLinkedin}`;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        name: name.trim(),
        role: role.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        linkedinUrl: formattedLinkedin || undefined,
        companyId: companyId || undefined,
        applicationId: applicationId || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save contact details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const companyOptions = [
    { value: '', label: 'None (Independent Contact)' },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const applicationOptions = [
    { value: '', label: 'None (General Contact)' },
    ...applications.map((app) => ({
      value: app.id,
      label: `${app.companyName} — ${app.position}`,
    })),
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden animate-scale-up text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-primary" />
            <h2 id="contact-form-title" className="font-display font-semibold text-heading text-foreground">
              {isEdit ? 'Edit Contact' : 'Add New Contact'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-small">
              {error}
            </div>
          )}

          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-name" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <span>Full Name</span>
              <span className="text-destructive">*</span>
            </label>
            <input
              id="contact-name"
              ref={initialFocusRef}
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah Connor"
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Role / Title */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-role" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <span>Role / Title</span>
            </label>
            <input
              id="contact-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Technical Recruiter or Engineering Manager"
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Associated Company */}
          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-foreground flex items-center gap-1.5">
              <Building2 size={14} className="text-muted-foreground" />
              <span>Company</span>
            </label>
            <Select
              options={companyOptions}
              value={companyId}
              onChange={setCompanyId}
              placeholder="Select company..."
              aria-label="Select company"
            />
          </div>

          {/* Associated Application */}
          <div className="flex flex-col gap-1.5">
            <label className="text-small font-medium text-foreground flex items-center gap-1.5">
              <Briefcase size={14} className="text-muted-foreground" />
              <span>Linked Application</span>
            </label>
            <Select
              options={applicationOptions}
              value={applicationId}
              onChange={setApplicationId}
              placeholder="Select application..."
              aria-label="Select application"
            />
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-small font-medium text-foreground flex items-center gap-1.5">
                <Mail size={13} className="text-muted-foreground" />
                <span>Email Address</span>
              </label>
              <input
                id="contact-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sarah@example.com"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-phone" className="text-small font-medium text-foreground flex items-center gap-1.5">
                <Phone size={13} className="text-muted-foreground" />
                <span>Phone Number</span>
              </label>
              <input
                id="contact-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2834"
                className="w-full h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
              />
            </div>
          </div>

          {/* LinkedIn Profile URL */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-linkedin" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <Linkedin size={13} className="text-muted-foreground" />
              <span>LinkedIn Profile URL</span>
            </label>
            <input
              id="contact-linkedin"
              type="text"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full h-9 px-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
          </div>

          {/* Private Notes */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="contact-notes" className="text-small font-medium text-foreground flex items-center gap-1.5">
              <FileText size={13} className="text-muted-foreground" />
              <span>Private Notes</span>
            </label>
            <textarea
              id="contact-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes on communication, referrals, conversation highlights, or follow-ups..."
              className="w-full p-3 rounded-md bg-background border border-input text-foreground text-small placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors resize-y min-h-[72px]"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-md border border-input bg-background hover:bg-secondary text-foreground text-small font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-small font-medium transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Create Contact'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
