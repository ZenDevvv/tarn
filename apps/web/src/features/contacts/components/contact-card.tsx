import React from 'react';
import { Link } from 'react-router-dom';
import { ContactWithDetailsDTO } from '@tracker/types';
import { StageRing, getStatusConfig } from '@/features/applications/components/application-status-badge';
import {
  Mail,
  Phone,
  Linkedin,
  Building2,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ContactCardProps {
  contact: ContactWithDetailsDTO;
  onSelect: (contact: ContactWithDetailsDTO) => void;
  onEdit: (contact: ContactWithDetailsDTO) => void;
  onDelete: (contact: ContactWithDetailsDTO) => void;
  className?: string;
}

export function ContactCard({
  contact,
  onSelect,
  onEdit,
  onDelete,
  className,
}: ContactCardProps) {
  const profileUrl = contact.linkedinUrl
    ? contact.linkedinUrl.startsWith('http')
      ? contact.linkedinUrl
      : `https://${contact.linkedinUrl}`
    : null;

  const hasCommunication = Boolean(contact.email || contact.phone || profileUrl);

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
      className={cn(
        'group bg-card border border-border rounded-lg p-4 flex flex-col justify-between h-full min-h-[160px] gap-3 transition-colors duration-150 hover:border-input cursor-pointer relative text-left focus-visible:outline-2 focus-visible:outline-primary',
        className
      )}
    >
      {/* Top Section: Identity & Action buttons */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-subheading text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
              {contact.name}
            </h3>

            {contact.role && (
              <p className="text-small text-muted-foreground font-medium truncate mt-0.5">
                {contact.role}
              </p>
            )}

            {contact.company && (
              <div className="inline-flex items-center gap-1.5 mt-1.5 px-2 py-0.5 rounded-xs bg-secondary text-secondary-foreground text-caption font-medium max-w-full">
                <Building2 size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate">{contact.company.name}</span>
              </div>
            )}
          </div>

          {/* Action buttons (Edit, Delete) */}
          <div
            className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
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

        {/* Communication links (Email, Phone, Profile link) */}
        {hasCommunication && (
          <div
            className="flex flex-wrap items-center gap-1.5 pt-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
                title={`Email ${contact.email}`}
                aria-label={`Send email to ${contact.email}`}
              >
                <Mail size={12} className="text-muted-foreground shrink-0" />
                <span className="truncate max-w-[140px]">{contact.email}</span>
              </a>
            )}

            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
                title={`Call ${contact.phone}`}
                aria-label={`Call ${contact.phone}`}
              >
                <Phone size={12} className="text-muted-foreground shrink-0" />
                <span>{contact.phone}</span>
              </a>
            )}

            {profileUrl && (
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors no-underline border border-border/50"
                title="View profile"
                aria-label={`View ${contact.name}'s profile`}
              >
                {contact.linkedinUrl?.toLowerCase().includes('linkedin') ? (
                  <Linkedin size={12} className="text-muted-foreground shrink-0" />
                ) : (
                  <ExternalLink size={12} className="text-muted-foreground shrink-0" />
                )}
                <span>Profile link</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Card Footer: Hairline divider with linked opportunity or general status */}
      <div className="pt-2.5 border-t border-border flex items-center justify-between gap-2 text-small text-muted-foreground">
        {contact.application ? (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <StageRing status={contact.application.status} size={14} />
              <span className="text-small font-medium text-foreground truncate">
                {contact.application.job?.title || 'Job application'}
              </span>
              <span className="text-caption text-muted-foreground shrink-0">
                {getStatusConfig(contact.application.status).label}
              </span>
            </div>

            <Link
              to={`/applications/${contact.application.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-caption text-muted-foreground hover:text-primary transition-colors shrink-0"
              title="View application"
              aria-label={`View application for ${contact.name}`}
            >
              View
            </Link>
          </>
        ) : (
          <span className="text-caption text-muted-foreground/70">
            General contact
          </span>
        )}
      </div>
    </div>
  );
}
