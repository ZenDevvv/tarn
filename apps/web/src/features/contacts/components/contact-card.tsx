import React from 'react';
import { Link } from 'react-router-dom';
import { ContactWithDetailsDTO } from '@tracker/types';
import { StageRing, STATUS_CONFIG } from '@/features/applications/components/application-status-badge';
import {
  Mail,
  Phone,
  Linkedin,
  Building2,
  Briefcase,
  Pencil,
  Trash2,
  ExternalLink,
  ChevronRight,
  FileText,
} from 'lucide-react';

export interface ContactCardProps {
  contact: ContactWithDetailsDTO;
  onSelect: (contact: ContactWithDetailsDTO) => void;
  onEdit: (contact: ContactWithDetailsDTO) => void;
  onDelete: (contact: ContactWithDetailsDTO) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ContactCard({ contact, onSelect, onEdit, onDelete }: ContactCardProps) {
  const initials = getInitials(contact.name);

  return (
    <div
      role="article"
      tabIndex={0}
      onClick={() => onSelect(contact)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(contact);
        }
      }}
      className="group bg-card border border-border rounded-xl p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-foreground/30 hover:shadow-sm cursor-pointer relative focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {/* Card Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-display font-semibold text-small flex items-center justify-center shrink-0 border border-primary/20">
              {initials}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-display font-semibold text-subheading text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                {contact.name}
              </h3>

              {contact.role && (
                <div className="text-small text-muted-foreground font-medium truncate mt-0.5">
                  {contact.role}
                </div>
              )}

              {contact.company && (
                <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded bg-secondary text-secondary-foreground text-micro font-medium max-w-full">
                  <Building2 size={12} className="text-muted-foreground shrink-0" />
                  <span className="truncate">{contact.company.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons (Edit, Delete) */}
          <div
            className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => onEdit(contact)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
              title="Edit contact"
              aria-label={`Edit ${contact.name}`}
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(contact)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors cursor-pointer"
              title="Delete contact"
              aria-label={`Delete ${contact.name}`}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Contact Notes Snippet */}
        {contact.notes && (
          <p className="text-small text-muted-foreground line-clamp-2 leading-relaxed bg-secondary/40 p-2 rounded-md border border-border/50">
            {contact.notes}
          </p>
        )}
      </div>

      {/* Card Footer: Quick action buttons & Application relation */}
      <div className="flex flex-col gap-3 pt-3 border-t border-border/60">
        {/* Quick communication links */}
        <div
          className="flex flex-wrap items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-micro font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
              title={`Email ${contact.email}`}
              aria-label={`Send email to ${contact.email}`}
            >
              <Mail size={12} className="text-muted-foreground" />
              <span className="truncate max-w-[150px]">{contact.email}</span>
            </a>
          )}

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-micro font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
              title={`Call ${contact.phone}`}
              aria-label={`Call ${contact.phone}`}
            >
              <Phone size={12} className="text-muted-foreground" />
              <span>{contact.phone}</span>
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
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-micro font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
              title="View LinkedIn Profile"
              aria-label={`View ${contact.name}'s LinkedIn Profile`}
            >
              <Linkedin size={12} className="text-[#0a66c2]" />
              <span>LinkedIn</span>
              <ExternalLink size={10} className="text-muted-foreground ml-0.5" />
            </a>
          )}
        </div>

        {/* Linked Application stage chip */}
        {contact.application ? (
          <div
            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/50 border border-border/60 hover:bg-secondary transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 min-w-0">
              <StageRing status={contact.application.status} size={15} />
              <div className="min-w-0">
                <span className="text-micro font-semibold text-foreground truncate block">
                  {contact.application.job?.title || 'Job Application'}
                </span>
                <span className="text-[11px] text-muted-foreground block truncate">
                  {STATUS_CONFIG[contact.application.status]?.label || contact.application.status}
                </span>
              </div>
            </div>

            <Link
              to={`/applications/${contact.application.id}`}
              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="View application"
              aria-label="View application"
            >
              <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between text-micro text-muted-foreground px-1">
            <span>No linked application</span>
            <span className="text-micro text-primary hover:underline">Click for details</span>
          </div>
        )}
      </div>
    </div>
  );
}
