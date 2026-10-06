import React from 'react';
import { Link } from 'react-router-dom';
import { ContactWithDetailsDTO } from '@tracker/types';
import { StageRing, getStatusConfig } from '@/features/applications/components/application-status-badge';
import {
  X,
  Users,
  Building2,
  Mail,
  Phone,
  Linkedin,
  Briefcase,
  ExternalLink,
  Calendar,
  Pencil,
  Trash2,
  FileText,
  ChevronRight,
} from 'lucide-react';

export interface ContactDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact: ContactWithDetailsDTO | null;
  onEdit: (contact: ContactWithDetailsDTO) => void;
  onDelete: (contact: ContactWithDetailsDTO) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ContactDetailModal({
  isOpen,
  onClose,
  contact,
  onEdit,
  onDelete,
}: ContactDetailModalProps) {
  // Escape key handler
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !contact) return null;

  const initials = getInitials(contact.name);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-up text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-display font-semibold text-heading flex items-center justify-center shrink-0 border border-primary/20">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <h2
                id="contact-detail-title"
                className="font-display font-semibold text-title text-foreground tracking-tight truncate"
              >
                {contact.name}
              </h2>
              {contact.role && (
                <div className="text-body text-muted-foreground font-medium mt-0.5">
                  {contact.role}
                </div>
              )}
              {contact.company && (
                <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded bg-secondary text-secondary-foreground text-small font-medium">
                  <Building2 size={13} className="text-muted-foreground" />
                  <span>{contact.company.name}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(contact)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Edit contact"
              aria-label="Edit contact"
            >
              <Pencil size={15} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(contact)}
              className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors cursor-pointer"
              title="Delete contact"
              aria-label="Delete contact"
            >
              <Trash2 size={15} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer ml-1"
              aria-label="Close dialog"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex flex-col flex-1 overflow-y-auto custom-scrollbar p-6 gap-6">
          {/* Quick Contact Actions Strip */}
          <div className="flex flex-wrap items-center gap-2">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-small font-medium bg-primary text-primary-foreground hover:bg-primary-hover transition-colors no-underline shadow-sm"
              >
                <Mail size={14} />
                <span>Email {contact.email}</span>
              </a>
            )}

            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-small font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border"
              >
                <Phone size={14} className="text-muted-foreground" />
                <span>Call {contact.phone}</span>
              </a>
            )}

            {contact.linkedinUrl && (
              <a
                href={
                  contact.linkedinUrl.startsWith('http')
                    ? contact.linkedinUrl
                    : `https://${contact.linkedinUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-small font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border"
              >
                <Linkedin size={14} className="text-[#0a66c2]" />
                <span>LinkedIn Profile</span>
                <ExternalLink size={12} className="text-muted-foreground" />
              </a>
            )}
          </div>

          {/* Linked Application Section */}
          {contact.application ? (
            <div className="flex flex-col gap-2">
              <h4 className="text-small font-semibold text-foreground uppercase tracking-wider text-micro">
                Linked Job Opportunity
              </h4>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border hover:border-foreground/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <StageRing status={contact.application.status} size={18} />
                  <div className="min-w-0">
                    <span className="font-semibold text-small text-foreground truncate block">
                      {contact.application.job?.title || 'Job Application'}
                    </span>
                    <span className="text-micro text-muted-foreground block truncate mt-0.5">
                      {getStatusConfig(contact.application.status).label} •{' '}
                      {contact.company?.name || 'Company'}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/applications/${contact.application.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-micro font-medium bg-background text-foreground hover:bg-secondary border border-border no-underline transition-colors shrink-0"
                >
                  <span>View application</span>
                  <ChevronRight size={13} />
                </Link>
              </div>
            </div>
          ) : (
            contact.company && (
              <div className="flex flex-col gap-2">
                <h4 className="text-small font-semibold text-foreground uppercase tracking-wider text-micro">
                  Target Company
                </h4>
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-secondary/50 border border-border hover:border-foreground/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Building2 size={18} className="text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="font-semibold text-small text-foreground truncate block">
                        {contact.company.name}
                      </span>
                      {contact.company.website && (
                        <span className="text-micro text-muted-foreground block truncate mt-0.5">
                          {contact.company.website}
                        </span>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/companies/${contact.company.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-micro font-medium bg-background text-foreground hover:bg-secondary border border-border no-underline transition-colors shrink-0"
                  >
                    <span>View company</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            )
          )}

          {/* Private Notes Section */}
          <div className="flex flex-col gap-2">
            <h4 className="text-small font-semibold text-foreground uppercase tracking-wider text-micro flex items-center gap-1.5">
              <FileText size={13} className="text-muted-foreground" />
              <span>Notes & Background</span>
            </h4>
            <div className="p-4 rounded-xl bg-background border border-border text-small text-foreground leading-relaxed whitespace-pre-wrap min-h-[80px]">
              {contact.notes || (
                <span className="text-muted-foreground italic">
                  No notes recorded for this contact yet. Click edit to add notes.
                </span>
              )}
            </div>
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border text-micro text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} />
              <span>Added {new Date(contact.createdAt).toLocaleDateString()}</span>
            </div>
            {contact.updatedAt !== contact.createdAt && (
              <span>Updated {new Date(contact.updatedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
