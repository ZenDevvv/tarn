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

export interface ContactListViewProps {
  contacts: ContactWithDetailsDTO[];
  onSelect: (contact: ContactWithDetailsDTO) => void;
  onEdit: (contact: ContactWithDetailsDTO) => void;
  onDelete: (contact: ContactWithDetailsDTO) => void;
}

export function ContactListView({
  contacts,
  onSelect,
  onEdit,
  onDelete,
}: ContactListViewProps) {
  return (
    <div className="border border-border rounded-lg overflow-x-auto bg-card animate-fade-in shadow-xs">
      <table className="w-full text-left text-small border-collapse min-w-[700px]">
        <thead>
          <tr className="border-b border-border bg-secondary/30 text-caption font-medium text-muted-foreground">
            <th className="py-2.5 px-4 font-medium">Contact</th>
            <th className="py-2.5 px-4 font-medium">Company</th>
            <th className="py-2.5 px-4 font-medium">Direct Reach</th>
            <th className="py-2.5 px-4 font-medium">Opportunity</th>
            <th className="py-2.5 px-4 text-right font-medium pr-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contacts.map((contact) => {
            const profileUrl = contact.linkedinUrl
              ? contact.linkedinUrl.startsWith('http')
                ? contact.linkedinUrl
                : `https://${contact.linkedinUrl}`
              : null;

            return (
              <tr
                key={contact.id}
                tabIndex={0}
                role="button"
                onClick={() => onSelect(contact)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(contact);
                  }
                }}
                className="hover:bg-secondary/40 transition-colors group cursor-pointer focus:outline-none focus:bg-secondary/40"
              >
                {/* 1. Contact (Name & Role) */}
                <td className="py-3 px-4">
                  <div className="font-display font-semibold text-small text-foreground tracking-tight group-hover:text-primary transition-colors truncate max-w-[200px]">
                    {contact.name}
                  </div>
                  {contact.role ? (
                    <div className="text-caption text-muted-foreground truncate max-w-[200px] mt-0.5">
                      {contact.role}
                    </div>
                  ) : null}
                </td>

                {/* 2. Company */}
                <td className="py-3 px-4 text-small">
                  {contact.company ? (
                    <div className="inline-flex items-center gap-1.5 text-foreground truncate max-w-[170px]">
                      <Building2 size={13} className="text-muted-foreground shrink-0" />
                      <span className="truncate">{contact.company.name}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground/60 text-caption">—</span>
                  )}
                </td>

                {/* 3. Direct Reach (Email, Phone, Profile Link) */}
                <td className="py-3 px-4">
                  <div
                    className="flex flex-wrap items-center gap-1.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors border border-border/50 no-underline"
                        title={`Email ${contact.email}`}
                        aria-label={`Send email to ${contact.email}`}
                      >
                        <Mail size={12} className="text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[130px]">{contact.email}</span>
                      </a>
                    )}

                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors border border-border/50 no-underline"
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
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-caption font-medium bg-secondary text-foreground hover:bg-accent hover:text-primary transition-colors border border-border/50 no-underline"
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

                    {!contact.email && !contact.phone && !profileUrl && (
                      <span className="text-muted-foreground/60 text-caption">—</span>
                    )}
                  </div>
                </td>

                {/* 4. Opportunity (StageRing + Job title + Status) */}
                <td className="py-3 px-4">
                  {contact.application ? (
                    <div
                      className="flex items-center gap-2 min-w-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <StageRing status={contact.application.status} size={14} />
                      <div className="min-w-0">
                        <Link
                          to={`/applications/${contact.application.id}`}
                          className="text-small font-medium text-foreground hover:text-primary transition-colors truncate block no-underline"
                          title="View application"
                        >
                          {contact.application.job?.title || 'Job application'}
                        </Link>
                        <span className="text-caption text-muted-foreground block truncate">
                          {getStatusConfig(contact.application.status).label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-caption text-muted-foreground/60">
                      General contact
                    </span>
                  )}
                </td>

                {/* 5. Row Actions (Edit, Delete) */}
                <td className="py-3 px-4 text-right pr-4">
                  <div
                    className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity"
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
